import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { modelService } from './model.service';
import { shareService } from './share.service';
import type { AnalyticsStats, ActivityEvent } from '@/types';

const ACTIVITY_COLLECTION = 'activity';

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
      userId,
      type,
      description,
      timestamp: Date.now(),
      metadata: metadata || {},
    };

    await addDoc(collection(db, ACTIVITY_COLLECTION), event);
  },

  // Get recent activity for a user
  async getRecentActivity(userId: string, limitCount: number = 10): Promise<ActivityEvent[]> {
    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityEvent));
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
