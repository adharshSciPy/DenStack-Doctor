import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Toast configuration
export const toastConfig = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    background: '#363636',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
  },
  success: {
    duration: 3000,
    icon: '✅',
    style: {
      background: '#10b981',
    },
  },
  error: {
    duration: 4000,
    icon: '❌',
    style: {
      background: '#ef4444',
    },
  },
  loading: {
    duration: Infinity,
    style: {
      background: '#3b82f6',
    },
  },
};

// Custom toast functions for common actions
export const showSuccess = (message: string) => {
  toast.success(message, toastConfig.success);
};

export const showError = (message: string) => {
  toast.error(message, toastConfig.error);
};

export const showInfo = (message: string) => {
  toast(message, toastConfig);
};

export const showPromise = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};

// Component to show toast on route changes (optional)
export const RouteChangeToast = () => {
  const location = useLocation();

  useEffect(() => {
    // You can show a toast when route changes if needed
    // toast.dismiss(); // Dismiss all toasts on route change
  }, [location]);

  return null;
};

export default function ToastProvider() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <RouteChangeToast />
    </>
  );
}