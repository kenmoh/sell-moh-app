import { useToastContext } from "@/lib/toast-context";
import { ToastOptions, ToastAction } from "@/lib/toast-context";

export const useToast = () => {
  const { showToast, dismissToast } = useToastContext();

  const show = (options: ToastOptions) => {
    return showToast(options);
  };

  const dismiss = (id: string) => {
    dismissToast(id);
  };

  const success = (title: string, message?: string, timeout = 4000) => {
    return show({ title, message, type: "success", timeout });
  };

  const error = (title: string, message?: string, timeout = 6000) => {
    return show({ title, message, type: "error", timeout });
  };

  const info = (title: string, message?: string, timeout = 5000) => {
    return show({ title, message, type: "info", timeout });
  };

  const warning = (title: string, message?: string, timeout = 5000) => {
    return show({ title, message, type: "warning", timeout });
  };

  const action = (
    title: string,
    message: string,
    actions: ToastAction[],
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    return show({ title, message, type, actions, timeout: undefined });
  };

  return {
    show,
    dismiss,
    success,
    error,
    info,
    warning,
    action,
  };
};