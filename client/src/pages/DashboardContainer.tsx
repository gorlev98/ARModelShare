import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Dashboard from './Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { modelService } from '@/services/model.service';
import { shareService } from '@/services/share.service';
import { analyticsService } from '@/services/analytics.service';
import { profileService } from '@/services/profile.service';
import { useShareLink } from '@/hooks/useShareLink';
import { ShareModal } from '@/components/ShareModal';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Model } from '@/types';

export default function DashboardContainer() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
        totalViews: analyticsStats.totalViews,
        totalModelsTrend: analyticsStats.totalModelsTrend,
        activeLinksTrend: analyticsStats.activeLinksTrend,
        totalScansTrend: analyticsStats.totalScansTrend,
        totalViewsTrend: analyticsStats.totalViewsTrend,
        storageUsed: storage,
      };
    },
    enabled: !!user,
  });

  // Fetch user details for profile logo
  const { data: userDetails } = useQuery({
    queryKey: ['/api/user-details', user?.uid],
    queryFn: () => profileService.getUserDetails(user!.uid),
    enabled: !!user,
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      // Inactivate all related share links first
      await shareService.inactivateModelLinks(modelId);
      // Then delete the model (which also deletes storage files)
      await modelService.deleteModel(modelId);
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/models/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shares/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/storage/usage'] });

      toast({
        title: 'Model deleted',
        description: 'Model and all related links have been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete model',
        variant: 'destructive',
      });
    },
  });

  const handleShareModel = async (model: Model) => {
    setSelectedModel(model);
    const link = await createShareLink(model);
    if (link) {
      setShowShareModal(true);
    }
  };

  const handleDeleteModel = (model: Model) => {
    setModelToDelete(model);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (modelToDelete) {
      await deleteModelMutation.mutateAsync(modelToDelete.id);
      setShowDeleteDialog(false);
      setModelToDelete(null);
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
        onDeleteModel={handleDeleteModel}
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
          userId={user?.uid}
          userLogoUrl={userDetails?.userLogo}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{modelToDelete?.filename}"?
              This will permanently remove the model and inactivate all related share links.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteModelMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteModelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteModelMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
