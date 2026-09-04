'use client';

import {
    formatConfidencePercent,
    getConfidenceLevel,
    hasFormErrors,
    LABEL_SUGGESTIONS,
    LabelFormData,
    LabelFormErrors,
    validateLabelForm,
} from '@/app/(app)/dashboard/labels/label-form.types';
import { Button } from '@/components/ui/button';
import { useSubmitLabel } from '@/hooks/use-labels';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';

interface LabelSubmitFormProps {
  taskId: string;
  taskTitle?: string;
  labelType?: string;
  labelOptions?: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/**
 * LabelSubmitForm - Component for submitting labels for a task
 */
export function LabelSubmitForm({
  taskId,
  taskTitle = 'Task',
  labelType,
  labelOptions,
  onSuccess,
  onCancel,
  autoFocus = true,
}: LabelSubmitFormProps) {
  const { submitLabel, isSubmitting, error, feedback } = useSubmitLabel();

  const [formData, setFormData] = useState<LabelFormData>({
    value: '',
    confidence: 0.5,
    notes: '',
  });

  const [errors, setErrors] = useState<LabelFormErrors>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const effectiveSuggestions =
    labelOptions && labelOptions.length > 0
      ? labelOptions
      : (LABEL_SUGGESTIONS.Classification ?? []);

  const valuePlaceholder =
    labelOptions && labelOptions.length > 0
      ? `Choose from: ${labelOptions.join(', ')}`
      : labelType === 'text'
        ? 'Enter your label text'
        : 'Enter label value';

  // Handle form changes
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, value }));
    if (errors.value) setErrors((prev) => ({ ...prev, value: undefined }));
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confidence = parseFloat(e.target.value);
    setFormData((prev) => ({ ...prev, confidence }));
    if (errors.confidence) setErrors((prev) => ({ ...prev, confidence: undefined }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value;
    setFormData((prev) => ({ ...prev, notes }));
    if (errors.notes) setErrors((prev) => ({ ...prev, notes: undefined }));
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, value: suggestion }));
    setShowSuggestions(false);
    setErrors((prev) => ({ ...prev, value: undefined }));
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate
      const validationErrors = validateLabelForm(formData);
      if (hasFormErrors(validationErrors)) {
        setErrors(validationErrors);
        return;
      }

      // Submit
      const result = await submitLabel(taskId, {
        value: formData.value.trim(),
        confidence: formData.confidence,
      });

      if (result) {
        // Clear form
        setFormData({ value: '', confidence: 0.5, notes: '' });
        setErrors({});

        // Call success callback
        onSuccess?.();

        // Auto-dismiss feedback after 3 seconds
        setTimeout(() => {
          setFormData({ value: '', confidence: 0.5, notes: '' });
        }, 3000);
      }
    },
    [formData, submitLabel, taskId, onSuccess]
  );

  const confidenceLevel = getConfidenceLevel(formData.confidence);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success feedback */}
      {feedback && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">{feedback}</p>
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Submission Failed</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {/* Label Value Input */}
      <div className="space-y-2">
        <label htmlFor="label-value" className="block text-sm font-medium text-gray-900">
          Label Value *
        </label>
        <input
          id="label-value"
          type="text"
          value={formData.value}
          onChange={handleValueChange}
          placeholder={valuePlaceholder}
          list={effectiveSuggestions.length > 0 ? 'label-suggestions' : undefined}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg font-medium focus:outline-none focus:ring-2 transition ${
            errors.value
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {errors.value && (
          <p className="text-sm text-red-600">{errors.value}</p>
        )}

        {effectiveSuggestions.length > 0 && (
          <datalist id="label-suggestions">
            {effectiveSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        )}

        {/* Suggestions */}
        {!formData.value && (
          <div>
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
            >
              {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
            </button>

            {showSuggestions && (
              <div className="mt-2 flex flex-wrap gap-2">
                {effectiveSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confidence Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="confidence" className="block text-sm font-medium text-gray-900">
            Confidence Level *
          </label>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${confidenceLevel.color}`}>
            {confidenceLevel.label} ({formatConfidencePercent(formData.confidence)})
          </span>
        </div>

        <input
          id="confidence"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={formData.confidence}
          onChange={handleConfidenceChange}
          disabled={isSubmitting}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {errors.confidence && (
          <p className="text-sm text-red-600">{errors.confidence}</p>
        )}
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes ?? ''}
          onChange={handleNotesChange}
          placeholder="Add any notes about your label submission..."
          disabled={isSubmitting}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition resize-none ${
            errors.notes
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes}</p>
        )}
        <p className="text-xs text-gray-500">
          {(formData.notes ?? '').length} / 1000 characters
        </p>
      </div>

      {/* Submit Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Label'
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
