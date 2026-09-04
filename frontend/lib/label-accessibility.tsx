'use client';

import React from 'react';

/**
 * Accessibility utilities for label submission components
 */

/**
 * Hook for managing focus management in forms
 */
export function useFocusManager(elementIds: string[]) {
  const [currentFocus, setCurrentFocus] = React.useState(0);
  const elementRefs = React.useRef<(HTMLElement | null)[]>([]);

  const focusElement = React.useCallback((index: number) => {
    if (index >= 0 && index < elementRefs.current.length) {
      elementRefs.current[index]?.focus();
      setCurrentFocus(index);
    }
  }, []);

  const focusNext = React.useCallback(() => {
    focusElement(currentFocus + 1);
  }, [currentFocus, focusElement]);

  const focusPrevious = React.useCallback(() => {
    focusElement(currentFocus - 1);
  }, [currentFocus, focusElement]);

  const setRef = React.useCallback((index: number, element: HTMLElement | null) => {
    elementRefs.current[index] = element;
  }, []);

  return {
    focusElement,
    focusNext,
    focusPrevious,
    setRef,
    currentFocus,
  };
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Get the key combination
      const key = event.key.toLowerCase();
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      // Common shortcuts
      if (isCtrlOrCmd && key === 'enter') {
        shortcuts['ctrl+enter']?.();
      }
      if (isCtrlOrCmd && isShift && key === 's') {
        event.preventDefault();
        shortcuts['ctrl+shift+s']?.();
      }
      if (key === 'escape') {
        shortcuts['escape']?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Accessible toast notification component
 */
export function AccessibleToast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }[type];

  const textColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
  }[type];

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-lg border p-4 ${bgColor} animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className={`flex items-center gap-3 ${textColor}`}>
        <span className={`text-lg font-semibold ${iconColor}`}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <p className="text-sm">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-auto text-sm font-semibold hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Accessible error boundary component
 */
export class AccessibleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Announce error to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'alert');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.textContent = `An error occurred: ${error.message}`;
    announcement.style.position = 'absolute';
    announcement.style.left = '-9999px';
    document.body.appendChild(announcement);

    setTimeout(() => announcement.remove(), 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
        >
          <p className="text-lg font-semibold text-red-900">Something went wrong</p>
          <p className="text-sm text-red-700 mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for managing loading states with accessibility
 */
export function useAccessibleLoading(isLoading: boolean, message = 'Loading...') {
  React.useEffect(() => {
    if (isLoading) {
      // Set aria-busy on the appropriate element
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('aria-busy', 'true');
      }

      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = message;
      announcement.style.position = 'absolute';
      announcement.style.left = '-9999px';
      document.body.appendChild(announcement);

      return () => {
        const main = document.querySelector('main');
        if (main) {
          main.setAttribute('aria-busy', 'false');
        }
        announcement.remove();
      };
    }
  }, [isLoading, message]);
}

/**
 * Utility to generate accessible form error messages
 */
export function getAccessibleErrorMessage(
  fieldName: string,
  errorType: string
): string {
  const messages: Record<string, Record<string, string>> = {
    value: {
      required: 'Label value is required',
      minLength: 'Label must be at least 2 characters',
      maxLength: 'Label cannot exceed 100 characters',
      invalid: 'Invalid label format',
    },
    confidence: {
      required: 'Confidence level is required',
      invalid: 'Confidence must be between 0 and 100',
    },
    notes: {
      maxLength: 'Notes cannot exceed 500 characters',
    },
  };

  return messages[fieldName]?.[errorType] || `Invalid ${fieldName}`;
}

/**
 * Hook for form field accessibility
 */
export function useAccessibleFormField(
  name: string,
  error?: string
) {
  const htmlId = `form-field-${name}`;
  const errorId = `${htmlId}-error`;

  return {
    htmlId,
    errorId,
    ariaDescribedBy: error ? errorId : undefined,
    ariaInvalid: !!error,
    ariaErrorMessage: error ? errorId : undefined,
  };
}
