import { useToast } from "@/hooks/use-toast";
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

type ApiMutationOptions<TData, TVars, TContext> = UseMutationOptions<
  TData,
  Error,
  TVars,
  TContext
> & {
  /** Heading for the toast shown when the call fails. */
  errorTitle?: string;
  /**
   * Opt out of the automatic error toast. Only for mutations that already
   * report the failure somewhere better, such as inline field errors.
   */
  toastOnError?: boolean;
};

const DEFAULT_ERROR_TITLE = "Something went wrong";

/**
 * useMutation, except a failure is always reported.
 *
 * Thirty-odd mutations across the app had no error handling at all, so a failed
 * create or delete looked exactly like a button that did nothing — and the ones
 * that did handle it logged to a console nobody holding a phone will ever see.
 * Making the toast the default means the next mutation added without an
 * onError still tells the user something went wrong.
 *
 * Success is deliberately *not* automatic. Plenty of mutations are invisible to
 * the user by design (marking notifications read), and a toast for each would
 * be noise; pass `onSuccess` when the change is worth announcing.
 */
export function useApiMutation<TData = unknown, TVars = void, TContext = unknown>(
  options: ApiMutationOptions<TData, TVars, TContext>,
): UseMutationResult<TData, Error, TVars, TContext> {
  const toast = useToast();
  const { errorTitle, toastOnError = true, onError, ...rest } = options;

  return useMutation<TData, Error, TVars, TContext>({
    ...rest,
    onError: (error, variables, onMutateResult, context) => {
      onError?.(error, variables, onMutateResult, context);
      if (toastOnError) {
        toast.error(errorTitle ?? DEFAULT_ERROR_TITLE, error.message);
      }
    },
  });
}