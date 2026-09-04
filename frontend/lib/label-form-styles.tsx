import React from 'react';

/**
 * Animation utilities for label components
 */
export const LabelAnimations = {
  // Fade in animation
  fadeIn: 'animate-in fade-in duration-300',

  // Slide up animation
  slideUp: 'animate-in slide-in-from-bottom-2 duration-300',

  // Scale animation
  scale: 'animate-in zoom-in-95 duration-300',

  // Confidence slider pulse
  confidencePulse: 'animate-pulse duration-1000',
};

/**
 * Enhanced form styles with Polish
 */
export const FormStyles = {
  container: 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
  section: 'space-y-4',
  label: 'block text-sm font-medium text-gray-700',
  input: 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200',
  error: 'mt-1 text-sm text-red-600 flex items-center gap-1',
  success: 'mt-1 text-sm text-green-600 flex items-center gap-1',
  button: 'px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
};

/**
 * Confidence color mapping with smooth transitions
 */
export const ConfidenceColorMap = {
  veryLow: '#ef4444', // red-500
  low: '#f97316', // orange-500
  medium: '#eab308', // yellow-500
  high: '#22c55e', // green-500
  veryHigh: '#16a34a', // green-700
} as const;

/**
 * Get confidence color based on value (0-1)
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return ConfidenceColorMap.veryHigh;
  if (confidence >= 0.7) return ConfidenceColorMap.high;
  if (confidence >= 0.5) return ConfidenceColorMap.medium;
  if (confidence >= 0.3) return ConfidenceColorMap.low;
  return ConfidenceColorMap.veryLow;
}

/**
 * Get confidence description
 */
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.5) return 'Medium';
  if (confidence >= 0.3) return 'Low';
  return 'Very Low';
}

/**
 * Smooth number transition animation
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 300,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startValue + (value - startValue) * progress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue.toFixed(decimals)}</span>;
}

/**
 * Smooth progress bar animation
 */
export function AnimatedProgressBar({
  value,
  color = 'bg-blue-600',
  duration = 300,
}: {
  value: number;
  color?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startValue + (value - startValue) * progress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-colors duration-300 rounded-full`}
        style={{ width: `${displayValue}%` }}
      />
    </div>
  );
}

/**
 * Loading skeleton for form elements
 */
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mt-4" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-2 pt-4">
        <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Smooth input with validation feedback
 */
export function ValidatedInput({
  value,
  onChange,
  error,
  success,
  placeholder,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : success
            ? 'border-green-500 focus:ring-green-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        } ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
      />
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 animate-in fade-in duration-200">
          <span>✕</span> {error}
        </p>
      )}
      {success && !error && (
        <p className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in duration-200">
          <span>✓</span> Looks good
        </p>
      )}
    </div>
  );
}

/**
 * Smooth slider with live feedback
 */
export function ConfidenceSlider({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const color = getConfidenceColor(value);
  const description = getConfidenceDescription(value);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">Confidence</label>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full transition-colors duration-200"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(value * 100)}% - {description}
          </span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-200 hover:opacity-90"
        style={{
          background: 'linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #16a34a 100%)',
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Not sure</span>
        <span>Very confident</span>
      </div>
    </div>
  );
}
