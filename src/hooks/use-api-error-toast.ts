import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

type Options = {
  /** From useQuery: `isError`. */
  isError: boolean;
  /** From useQuery: `error`. */
  error: unknown;
  /**
   * For screens that run several queries: pass them all and the first failure
   * is reported. A screen whose dashboard and its list are separate queries
   * otherwise only reports whichever one the hook happened to be wired to.
   */
  extraErrors?: unknown[];
  /** Heading for the toast. Defaults to a generic failure notice. */
  title?: string;
  /** Set false to stay silent, for a screen that renders the error inline. */
  enabled?: boolean;
};

const messageOf = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "We couldn't load this. Check your connection and try again.";
};

/**
 * Report a failed query once.
 *
 * A screen that fetches on mount renders an empty state when the fetch fails,
 * so a permission error looks identical to an empty account: the user pressed
 * something, nothing happened, and no message explained why. This puts the
 * reason in front of them.
 *
 * Fires once per distinct message — refetch on focus should not re-toast the
 * same failure, but a *different* failure should.
 */
export function useApiErrorToast({
  isError,
  error,
  extraErrors,
  title,
  enabled = true,
}: Options) {
  const toast = useToast();
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const first = [error, ...(extraErrors ?? [])].find(Boolean);
    if (!isError && !first) return;
    if (!first) return;

    const message = messageOf(first);
    if (lastShown.current === message) return;

    lastShown.current = message;
    toast.error(title ?? "Couldn't load", message);
  }, [isError, error, extraErrors, title, enabled, toast]);
}