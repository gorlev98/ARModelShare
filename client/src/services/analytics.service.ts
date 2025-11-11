import { supabase } from '@/lib/supabase';
import { modelService } from './model.service';
import { shareService } from './share.service';
import type { AnalyticsStats, ActivityEvent } from '@/types';

export const analyticsService = {
  // Get analytics stats for a user
  async getStats(userId: string): Promise<AnalyticsStats> {
    const [totalModels, activeLinks, shareLinks] = await Promise.all([
      modelService.countUserModels(userId),
      shareService.countActiveLinks(userId),
      shareService.getUserShareLinks(userId),
    ]);

    const totalScans = shareLinks.reduce((sum, link) => sum + link.scans, 0);
    const totalViews = shareLinks.reduce((sum, link) => sum + link.views, 0);

    return {
      totalModels,
      activeLinks,
      totalScans,
      totalViews,
    };
  },

  // Log activity event
  async logActivity(
    userId: string,
    type: ActivityEvent['type'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event = {
      user_id: userId,
      type,
      description,
      timestamp: Date.now(),
      metadata: metadata || {},
    };

    const { error } = await supabase
      .from('activity')
      .insert([event]);

    if (error) throw new Error(`Failed to log activity: ${error.message}`);
  },

  // Get recent activity for a user
  async getRecentActivity(userId: string, limitCount: number = 10): Promise<ActivityEvent[]> {
    const { data, error } = await supabase
      .from('activity')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limitCount);

    if (error) throw new Error(`Failed to get recent activity: ${error.message}`);

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      description: item.description,
      timestamp: item.timestamp,
      metadata: item.metadata,
    }));
  },

  // Generate chart data for analytics
  async getChartData(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; uploads: number; shares: number; views: number }>> {
    const events = await this.getRecentActivity(userId, 1000);
    const now = Date.now();
    const startDate = now - (days * 24 * 60 * 60 * 1000);

    // Filter events within date range
    const filteredEvents = events.filter(e => e.timestamp >= startDate);

    // Group by date
    const dataMap = new Map<string, { uploads: number; shares: number; views: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap.set(dateKey, { uploads: 0, shares: 0, views: 0 });
    }

    filteredEvents.forEach(event => {
      const dateKey = new Date(event.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const data = dataMap.get(dateKey);
      if (data) {
        if (event.type === 'upload') data.uploads++;
        if (event.type === 'share') data.shares++;
        if (event.type === 'view') data.views++;
      }
    });

    return Array.from(dataMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .reverse();
  },

  // Calculate storage usage (simplified)
  async getStorageUsage(userId: string): Promise<string> {
    const models = await modelService.getUserModels(userId);
    const totalBytes = models.reduce((sum, model) => sum + model.fileSize, 0);
    
    const gb = totalBytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    }
    
    const mb = totalBytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  },
};
