'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmissionFeedbackProps {
  status: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  autoClose?: boolean;
}

/**
 * SubmissionFeedback - Displays feedback for label submissions
 */
export function SubmissionFeedback({
  status,
  title,
  message,
  action,
  onDismiss,
  autoClose = true,
}: SubmissionFeedbackProps) {
  React.useEffect(() => {
    if (autoClose && status === 'success') {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, autoClose, onDismiss]);

  const statusConfig = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-900',
      message: 'text-green-700',
      iconColor: 'text-green-600',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-900',
      message: 'text-red-700',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-900',
      message: 'text-yellow-700',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-900',
      message: 'text-blue-700',
      iconColor: 'text-blue-600',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${config.title}`}>{title}</p>
        <p className={`text-sm mt-1 ${config.message}`}>{message}</p>

        {action && (
          <button
            onClick={action.onClick}
            className={`mt-3 text-sm font-medium hover:underline ${config.message}`}
          >
            {action.label}
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Dismiss</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * SubmissionResult - Shows detailed result of label submission
 */
interface SubmissionResultProps {
  labelValue: string;
  confidence: number;
  submittedAt: string;
  onContinue?: () => void;
}

export function SubmissionResult({
  labelValue,
  confidence,
  submittedAt,
  onContinue,
}: SubmissionResultProps) {
  return (
    <div className="space-y-4">
      <SubmissionFeedback
        status="success"
        title="Label Submitted Successfully"
        message={`Your label "${labelValue}" has been recorded with ${Math.round(confidence * 100)}% confidence.`}
        onDismiss={() => onContinue?.()}
      />

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Label</p>
          <p className="text-lg font-bold text-gray-900 mt-2">{labelValue}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Confidence</p>
          <p className="text-lg font-bold text-gray-900 mt-2">{Math.round(confidence * 100)}%</p>
        </div>
      </div>

      <div className="text-xs text-gray-600">
        Submitted: {new Date(submittedAt).toLocaleString()}
      </div>

      {onContinue && (
        <Button onClick={onContinue} className="w-full">
          Continue Labeling
        </Button>
      )}
    </div>
  );
}

/**
 * SubmissionError - Shows detailed error information
 */
interface SubmissionErrorProps {
  error: Error | string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function SubmissionError({
  error,
  onRetry,
  onCancel,
}: SubmissionErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="space-y-4">
      <SubmissionFeedback
        status="error"
        title="Submission Failed"
        message={errorMessage}
      />

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} className="flex-1">
            Retry
          </Button>
        )}
        {onCancel && (
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ValidationError - Shows form validation errors
 */
interface ValidationErrorProps {
  fieldName: string;
  errorMessage: string;
}

export function ValidationError({ fieldName, errorMessage }: ValidationErrorProps) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm text-red-900">{fieldName}</p>
        <p className="text-sm text-red-700">{errorMessage}</p>
      </div>
    </div>
  );
}

/**
 * SuccessCheckmark - Animated success indicator
 */
interface SuccessCheckmarkProps {
  className?: string;
}

export function SuccessCheckmark({ className = 'w-16 h-16' }: SuccessCheckmarkProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-green-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="50" cy="50" r="45" />
        <path d="M30 50l15 15 25-25" className="animate-pulse" />
      </svg>
    </div>
  );
}

