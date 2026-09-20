import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface VerdictBadgeProps {
  status: string;
  score?: number;
  size?: 'sm' | 'md';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ status, score, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const configMap: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    ACCEPTED: {
      label: 'Accepted',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: CheckCircle2
    },
    WRONG_ANSWER: {
      label: 'Wrong Answer',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: XCircle
    },
    TIME_LIMIT_EXCEEDED: {
      label: 'Time Limit Exceeded',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: Clock
    },
    COMPILATION_ERROR: {
      label: 'Compilation Error',
      bg: 'bg-orange-500/15',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      icon: AlertTriangle
    },
    RUNTIME_ERROR: {
      label: 'Runtime Error',
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: AlertOctagon
    },
    MEMORY_LIMIT_EXCEEDED: {
      label: 'Memory Limit Exceeded',
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: AlertTriangle
    },
    QUEUED: {
      label: 'Queued',
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: Clock
    },
    RUNNING: {
      label: 'Running Tests',
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      icon: Clock
    }
  };

  const current = configMap[normalized] || {
    label: normalized,
    bg: 'bg-gray-500/15',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    icon: HelpCircle
  };

  const Icon = current.icon;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-lg font-medium border ${current.bg} ${current.text} ${current.border} ${sizeClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded text-[11px] font-mono font-bold">
          {score} pts
        </span>
      )}
    </span>
  );
};
