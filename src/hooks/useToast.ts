import { toast } from 'react-hot-toast';
import { useCallback } from 'react';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const useToast = () => {
  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    toast.success(message, options);
  }, []);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    toast.error(message, options);
  }, []);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    toast(message, options);
  }, []);

  const showLoading = useCallback((message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const showPromise = useCallback(
    async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      },
      options?: ToastOptions
    ) => {
      return toast.promise(promise, messages, options);
    },
    []
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    dismiss,
    showPromise,
  };
};