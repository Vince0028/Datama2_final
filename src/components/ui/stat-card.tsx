import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'accent';
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className,
  variant = 'default' 
}: StatCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover-lift",
        variant === 'default' && "bg-card shadow-card",
        variant === 'primary' && "gradient-primary text-primary-foreground",
        variant === 'accent' && "gradient-accent text-accent-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            variant === 'default' ? "text-muted-foreground" : "opacity-90"
          )}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-display tracking-tight">
              {value}
            </p>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                variant === 'default' 
                  ? (trend.isPositive ? "status-available" : "status-occupied")
                  : "bg-white/20 text-white"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className={cn(
              "text-sm",
              variant === 'default' ? "text-muted-foreground" : "opacity-80"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          variant === 'default' && "bg-accent/10 text-accent",
          variant === 'primary' && "bg-white/15 text-amber-300",
          variant === 'accent' && "bg-black/15 text-white"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
