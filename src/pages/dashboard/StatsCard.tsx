import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  color: string;
  description?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, color, description }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description ? (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        ) : null}
        {trend ? (
          <div className="flex items-center mt-2">
            <span className={cn(
              "text-xs font-medium",
              trend.positive ? "text-green-600" : "text-red-600"
            )}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs. período anterior</span>
          </div>
        ) : null}
      </CardContent>
      <div className={cn("absolute top-0 right-0 w-1 h-full", color)} />
    </Card>
  );
}