import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive?: boolean };
  description?: string;
  iconBg?: string;
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconBg = 'bg-brand-50',
  iconColor = 'text-brand-600',
}: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className="mt-1 text-xs font-medium">
              <span
                className={cn(
                  trend.positive !== false
                    ? 'text-emerald-600'
                    : 'text-red-600',
                )}
              >
                {trend.positive !== false ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="ml-1 text-slate-500">vs last week</span>
            </p>
          )}
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
