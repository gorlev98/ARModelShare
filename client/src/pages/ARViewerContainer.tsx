import { useEffect, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';
import ARViewer from './ARViewer';
import { shareService } from '@/services/share.service';
import { useToast } from '@/hooks/use-toast';

export default function ARViewerContainer() {
  const searchParams = new URLSearchParams(useSearch());
  const linkId = searchParams.get('id');
  const modelUrl = searchParams.get('url');
  const source = searchParams.get('source');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Increment view/scan counts when AR viewer is opened
    const incrementCounts = async () => {
      if (linkId) {
        try {
          if (source === 'qr') {
            await shareService.incrementScans(linkId);
          } else {
            await shareService.incrementViews(linkId);
          }
        } catch (error) {
          console.error('Failed to increment counts:', error);
        }
      }
    };

    incrementCounts();
  }, [linkId, source]);

  const handleResolveLink = useCallback(async (id: string) => {
    try {
      const link = await shareService.getShareLink(id);

      if (!link) {
        return null;
      }

      const now = Date.now();
      if (!link.isActive || link.expiresAt < now) {
        toast({
          title: 'Link expired',
          description: 'This share link is no longer active',
          variant: 'destructive',
        });
        return null;
      }

      return {
        modelUrl: link.modelUrl,
        modelName: link.modelName,
      };
    } catch (error) {
      console.error('Failed to resolve link:', error);
      toast({
        title: 'Error loading model',
        description: 'Unable to load the 3D model. Please check your connection.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  return (
    <ARViewer
      modelUrl={modelUrl || undefined}
      linkId={linkId || undefined}
      source={source || undefined}
      onResolveLink={handleResolveLink}
      onBack={() => setLocation('/dashboard')}
    />
  );
}
