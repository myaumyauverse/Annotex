'use client';

import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface LabelHistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  value: string;
  confidence: number;
  createdAt: string;
  isAccurate?: boolean;
  feedback?: string;
}

interface LabelHistoryProps {
  labels: LabelHistoryItem[];
  loading?: boolean;
  onTaskClick?: (taskId: string) => void;
}

/**
 * LabelHistory - Displays user's label submission history with statistics
 */
export function LabelHistory({
  labels,
  loading = false,
  onTaskClick,
}: LabelHistoryProps) {
  const stats = useMemo(() => {
    if (!labels.length) {
      return {
        totalLabels: 0,
        averageConfidence: 0,
        accuracyRate: 0,
        recentCount: 0,
      };
    }

    const totalLabels = labels.length;
    const averageConfidence =
      labels.reduce((sum, label) => sum + label.confidence, 0) / totalLabels;
    
    const accurateLabels = labels.filter((l) => l.isAccurate !== false).length;
    const accuracyRate = (accurateLabels / totalLabels) * 100;
    
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentCount = labels.filter(
      (l) => new Date(l.createdAt) > recentDate
    ).length;

    return {
      totalLabels,
      averageConfidence,
      accuracyRate,
      recentCount,
    };
  }, [labels]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Labels */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Labels</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {stats.totalLabels}
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        {/* Average Confidence */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Avg Confidence</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {(stats.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        {/* Accuracy Rate */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Accuracy</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {stats.accuracyRate.toFixed(0)}%
              </p>
            </div>
            <Award className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">This Week</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {stats.recentCount}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Label History Timeline */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Submission History</h2>
        
        {labels.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No label submissions yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start by submitting labels to tasks you encounter
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {labels.map((label, idx) => (
              <div
                key={label.id}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
              >
                {/* Timeline marker */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  {idx !== labels.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <button
                        onClick={() => onTaskClick?.(label.taskId)}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 text-left"
                      >
                        {label.taskTitle}
                      </button>
                      <p className="text-base font-medium text-gray-700 mt-1">
                        Label: <span className="text-blue-600">{label.value}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(label.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Confidence and Feedback */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-600">Confidence:</div>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            label.confidence >= 0.8
                              ? 'bg-green-500'
                              : label.confidence >= 0.6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${label.confidence * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-gray-900">
                        {Math.round(label.confidence * 100)}%
                      </div>
                    </div>

                    {label.isAccurate !== undefined && (
                      <Badge
                        variant={
                          label.isAccurate ? 'default' : 'secondary'
                        }
                        className={
                          label.isAccurate
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {label.isAccurate ? 'Accurate' : 'Needs Review'}
                      </Badge>
                    )}
                  </div>

                  {/* Feedback */}
                  {label.feedback && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      {label.feedback}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PerformanceMetrics - Standalone component for displaying label performance
 */
export function PerformanceMetrics({
  totalLabels = 0,
  averageConfidence = 0,
  accuracyRate = 0,
  recentCount = 0,
}: {
  totalLabels?: number;
  averageConfidence?: number;
  accuracyRate?: number;
  recentCount?: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Total</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">{totalLabels}</p>
          </div>
          <Target className="w-8 h-8 text-blue-400" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Confidence</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {(averageConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <Zap className="w-8 h-8 text-purple-400" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Accuracy</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {accuracyRate.toFixed(0)}%
            </p>
          </div>
          <Award className="w-8 h-8 text-green-400" />
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">This Week</p>
            <p className="text-2xl font-bold text-orange-900 mt-2">{recentCount}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-orange-400" />
        </div>
      </Card>
    </div>
  );
}
