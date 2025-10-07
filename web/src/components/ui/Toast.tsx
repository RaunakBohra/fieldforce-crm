import { Toaster, toast } from 'sonner'

// Toast container component (add to App.tsx)
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      theme="light"
      toastOptions={{
        className: 'font-sans',
        style: {
          borderRadius: '0.5rem',
        },
      }}
    />
  )
}

// Utility functions for common toast patterns
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description })
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description })
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description })
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },

  confirm: (
    message: string,
    description: string,
    onConfirm: () => void | Promise<void>
  ) => {
    toast(message, {
      description,
      action: {
        label: 'Confirm',
        onClick: async () => {
          await onConfirm()
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    })
  },
}
