import { useQuery } from '@tanstack/react-query';
import Analytics from './Analytics';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService } from '@/services/analytics.service';

export default function AnalyticsContainer() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['/api/analytics/stats', user?.uid],
    queryFn: () => analyticsService.getStats(user!.uid),
    enabled: !!user,
    initialData: {
      totalModels: 0,
      activeLinks: 0,
      totalScans: 0,
      totalViews: 0,
    },
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ['/api/analytics/chart', user?.uid],
    queryFn: () => analyticsService.getChartData(user!.uid, 30),
    enabled: !!user,
  });

  const { data: recentEvents = [] } = useQuery({
    queryKey: ['/api/activity/recent', user?.uid],
    queryFn: () => analyticsService.getRecentActivity(user!.uid, 20),
    enabled: !!user,
  });

  return (
    <Analytics
      stats={stats!}
      chartData={chartData}
      recentEvents={recentEvents}
    />
  );
}
