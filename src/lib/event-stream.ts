import { BASE_URL } from "@/api/client";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";

export type StreamEvent = {
  event: string;
  data: Record<string, unknown>;
};

export type StreamStatus = "idle" | "connecting" | "open" | "error";

const STREAM_URL = `${BASE_URL}/events/stream`;

// Backoff between reconnects. The server sends `retry: 3000`, but a client that
// just lost its network should not stampede the endpoint on a fixed short
// timer, so the first retry is immediate-ish and then grows.
const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

type Listener = (event: StreamEvent) => void;
type StatusListener = (status: StreamStatus) => void;

/**
 * One shared server-sent-events connection for the whole app.
 *
 * Several screens care about the same stream, and opening a connection per
 * screen would multiply server-side subscriptions for identical traffic. The
 * manager owns the socket and fans out to whoever is listening.
 *
 * `expo/fetch` rather than `EventSource` because the stream is authenticated
 * with a bearer token and EventSource cannot send an Authorization header. It
 * also gives a readable stream on both native and web.
 */
class EventStream {
  private controller: AbortController | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private token: string | null = null;
  private backoff = MIN_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  status: StreamStatus = "idle";

  subscribe(listener: Listener, onStatus?: StatusListener): () => void {
    this.listeners.add(listener);
    if (onStatus) {
      this.statusListeners.add(onStatus);
      onStatus(this.status);
    }
    // Reference counted: the last listener leaving closes the connection.
    if (this.listeners.size === 1) this.connect();

    return () => {
      this.listeners.delete(listener);
      if (onStatus) this.statusListeners.delete(onStatus);
      if (this.listeners.size === 0) this.disconnect();
    };
  }

  /** Feed the bearer token in once a session exists. */
  setToken(token: string | null) {
    if (token === this.token) return;
    this.token = token;
    if (this.listeners.size > 0) {
      // Reconnect so the new credential is used rather than waiting for the
      // current stream to die on its own.
      this.disconnect();
      this.connect();
    }
  }

  private setStatus(status: StreamStatus) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.controller?.abort();
    this.controller = null;
    this.setStatus("idle");
  }

  private scheduleReconnect() {
    if (this.stopped || this.listeners.size === 0) return;
    const delay = this.backoff;
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private async connect() {
    if (this.controller || this.listeners.size === 0) return;
    if (!this.token) {
      // No session yet. A caller with a token will call setToken, which
      // connects; until then there is nothing to authenticate with.
      this.setStatus("idle");
      return;
    }

    this.stopped = false;
    this.setStatus("connecting");
    const controller = new AbortController();
    this.controller = controller;

    try {
      const response = await expoFetch(STREAM_URL, {
        headers: { Authorization: `Bearer ${this.token}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        // 401 means the session is gone; reconnecting with the same token
        // would just loop. Anything else is worth retrying.
        if (response.status === 401 || response.status === 403) {
          this.setStatus("error");
          this.controller = null;
          return;
        }
        throw new Error(`stream responded ${response.status}`);
      }

      this.backoff = MIN_BACKOFF_MS;
      this.setStatus("open");

      const body = response.body;
      if (!body) throw new Error("stream had no body");

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Frames are separated by a blank line. Keep the remainder buffered:
        // a chunk boundary can fall mid-frame.
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const raw = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          this.emit(raw);
          boundary = buffer.indexOf("\n\n");
        }
      }

      // Server closed. Reconnect unless we were the ones to stop it.
      if (!controller.signal.aborted) this.scheduleReconnect();
    } catch {
      if (controller.signal.aborted) return;
      this.setStatus("error");
      this.scheduleReconnect();
    } finally {
      if (this.controller === controller) {
        this.controller = null;
        if (this.status === "open") this.setStatus("idle");
      }
    }
  }

  private emit(rawFrame: string) {
    let event = "message";
    const dataLines: string[] = [];

    for (const line of rawFrame.split("\n")) {
      // Comments (`: ping`, `: connected`) keep the connection warm and carry
      // no event; the server sends them so idle proxies do not reap it.
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (!dataLines.length) return;

    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      // A malformed frame should not tear down a healthy stream.
      return;
    }

    this.listeners.forEach((listener) => listener({ event, data }));
  }
}

export const eventStream = new EventStream();

/** Web needs the polyfill for ReadableStream when the stream is consumed. */
export const streamRequiresFetchPolyfill = Platform.OS === "web";