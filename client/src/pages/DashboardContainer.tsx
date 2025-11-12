import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Dashboard from './Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { modelService } from '@/services/model.service';
import { shareService } from '@/services/share.service';
import { analyticsService } from '@/services/analytics.service';
import { useShareLink } from '@/hooks/useShareLink';
import { ShareModal } from '@/components/ShareModal';
import { useState } from 'react';
import type { Model } from '@/types';

export default function DashboardContainer() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { shareUrl, qrOptions, setQROptions, createShareLink, downloadQR } = useShareLink(user?.uid || '');

  // Fetch dashboard data
  const { data: recentModels = [] } = useQuery({
    queryKey: ['/api/models/recent', user?.uid],
    queryFn: () => modelService.getRecentModels(user!.uid),
    enabled: !!user,
  });

  const { data: recentLinks = [] } = useQuery({
    queryKey: ['/api/shares/recent', user?.uid],
    queryFn: () => shareService.getRecentShareLinks(user!.uid),
    enabled: !!user,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['/api/activity/recent', user?.uid],
    queryFn: () => analyticsService.getRecentActivity(user!.uid),
    enabled: !!user,
  });

  const { data: storageUsed = '0 MB' } = useQuery({
    queryKey: ['/api/storage/usage', user?.uid],
    queryFn: () => analyticsService.getStorageUsage(user!.uid),
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/analytics/stats', user?.uid],
    queryFn: async () => {
      const analyticsStats = await analyticsService.getStats(user!.uid);
      const storage = await analyticsService.getStorageUsage(user!.uid);
      return {
        totalModels: analyticsStats.totalModels,
        activeLinks: analyticsStats.activeLinks,
        totalScans: analyticsStats.totalScans,
        totalModelsTrend: analyticsStats.totalModelsTrend,
        activeLinksTrend: analyticsStats.activeLinksTrend,
        totalScansTrend: analyticsStats.totalScansTrend,
        storageUsed: storage,
      };
    },
    enabled: !!user,
  });

  const handleShareModel = async (model: Model) => {
    setSelectedModel(model);
    const link = await createShareLink(model);
    if (link) {
      setShowShareModal(true);
    }
  };

  const handleDownloadQR = async () => {
    if (selectedModel) {
      await downloadQR(selectedModel.id, selectedModel.filename);
    }
  };

  return (
    <>
      <Dashboard
        stats={stats || {
          totalModels: 0,
          activeLinks: 0,
          totalScans: 0,
          storageUsed: '0 MB',
          totalModelsTrend: undefined,
          activeLinksTrend: undefined,
          totalScansTrend: undefined,
        }}
        recentModels={recentModels}
        recentLinks={recentLinks}
        recentActivity={recentActivity}
        onShareModel={handleShareModel}
        onUploadClick={() => setLocation('/upload')}
      />
      
      {selectedModel && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          shareUrl={shareUrl}
          qrOptions={qrOptions}
          onQROptionsChange={setQROptions}
          onDownloadQR={handleDownloadQR}
        />
      )}
    </>
  );
}
