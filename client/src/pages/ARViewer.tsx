import { useEffect, useState } from 'react';
import { ArrowLeft, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelViewer } from '@/components/ModelViewer';
import { useToast } from '@/hooks/use-toast';

interface ARViewerProps {
  modelUrl?: string;
  modelName?: string;
  linkId?: string;
  source?: string;
  onBack?: () => void;
  onResolveLink?: (linkId: string) => Promise<{ modelUrl: string; modelName: string } | null>;
}

export default function ARViewer({
  modelUrl: initialModelUrl,
  modelName: initialModelName,
  linkId,
  source,
  onBack,
  onResolveLink,
}: ARViewerProps) {
  const [modelUrl, setModelUrl] = useState(initialModelUrl);
  const [modelName, setModelName] = useState(initialModelName);
  const [loading, setLoading] = useState(!initialModelUrl && !!linkId);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (source === 'qr') {
      toast({
        title: 'Opened via QR scan',
        description: 'Loading your 3D model...',
      });
    }
  }, [source, toast]);

  useEffect(() => {
    const resolveModel = async () => {
      if (!linkId || modelUrl) return;

      setLoading(true);
      setError(null);

      try {
        if (onResolveLink) {
          const result = await onResolveLink(linkId);
          if (result) {
            setModelUrl(result.modelUrl);
            setModelName(result.modelName);
          } else {
            setError('Link not found or expired');
          }
        }
      } catch (err) {
        setError('Failed to load model');
      } finally {
        setLoading(false);
      }
    };

    resolveModel();
  }, [linkId, modelUrl, onResolveLink]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading 3D model...</p>
        </div>
      </div>
    );
  }

  if (error || !modelUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <p className="text-destructive text-lg font-medium mb-4">
            {error || 'Model not found'}
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="absolute top-0 left-0 right-0 z-10 p-4 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {onBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back-ar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div />
          )}
          
          <h1 className="text-lg font-semibold truncate px-4">
            {modelName || 'AR Viewer'}
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            data-testid="button-fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 pt-16">
        <ModelViewer
          modelUrl={modelUrl}
          alt={modelName}
          className="w-full h-full"
          ar
          autoRotate
          cameraControls
        />
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full border shadow-lg">
          <p className="text-sm font-medium">Tap to view in AR</p>
        </div>
      </div>
    </div>
  );
}
