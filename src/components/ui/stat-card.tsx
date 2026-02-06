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
            variant === 'default' ? "text-muted-foreground" : "opacity-80"
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
                trend.isPositive 
                  ? "status-available" 
                  : "status-occupied"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className={cn(
              "text-sm",
              variant === 'default' ? "text-muted-foreground" : "opacity-70"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          variant === 'default' && "bg-primary/10 text-primary",
          variant === 'primary' && "bg-white/20 text-white",
          variant === 'accent' && "bg-white/20 text-white"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
