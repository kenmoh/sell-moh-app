import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { StreamingEvent } from "@/types/ai-chat";

const BASE_URL = "https://salesos.fastapicloud.dev/api/v1";
const SESSION_KEY = "session";

async function getAccessToken(): Promise<string | null> {
  try {
    let raw: string | null;
    if (Platform.OS === "web") {
      raw = localStorage.getItem(SESSION_KEY);
    } else {
      raw = await SecureStore.getItemAsync(SESSION_KEY);
    }
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}

export interface StreamChatOptions {
  message: string;
  conversationId?: string;
  onToken?: (text: string) => void;
  onMetadata?: (data: StreamingEvent) => void;
  onDone?: (conversationId: string) => void;
  onError?: (error: Error) => void;
}

export async function streamChat({
  message,
  conversationId,
  onToken,
  onMetadata,
  onDone,
  onError,
}: StreamChatOptions): Promise<void> {
  const token = await getAccessToken();

  const body = JSON.stringify({
    message,
    conversation_id: conversationId,
    stream: true,
  });

  try {
    const response = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Chat request failed (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let eventType = "";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          eventData = line.slice(6);
        } else if (line === "" && eventType && eventData) {
          handleSSEEvent(eventType, eventData, {
            onToken,
            onMetadata,
            onDone,
            onError,
          });
          eventType = "";
          eventData = "";
        }
      }
    }

    if (buffer.trim()) {
      const lines = buffer.split("\n");
      let eventType = "";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          eventData = line.slice(6);
        }
      }

      if (eventType && eventData) {
        handleSSEEvent(eventType, eventData, {
          onToken,
          onMetadata,
          onDone,
          onError,
        });
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

function handleSSEEvent(
  eventType: string,
  data: string,
  callbacks: {
    onToken?: (text: string) => void;
    onMetadata?: (data: StreamingEvent) => void;
    onDone?: (conversationId: string) => void;
    onError?: (error: Error) => void;
  },
) {
  try {
    const parsed = JSON.parse(data);

    switch (eventType) {
      case "token":
        callbacks.onToken?.(typeof parsed.text === "string" ? parsed.text : JSON.stringify(parsed.text) ?? "");
        break;
      case "metadata":
        callbacks.onMetadata?.({
          type: "metadata",
          data: parsed.data ?? parsed,
        });
        break;
      case "done":
        callbacks.onDone?.(parsed.conversation_id ?? "");
        break;
    }
  } catch {
    if (eventType === "token") {
      callbacks.onToken?.(data);
    }
  }
}
