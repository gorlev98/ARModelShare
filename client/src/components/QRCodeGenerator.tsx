import { useRef } from 'react';
import { QRCodeSVG } from 'react-qr-code';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QROptions } from '@/types';

interface QRCodeGeneratorProps {
  value: string;
  options: QROptions;
  onOptionsChange: (options: QROptions) => void;
  onDownload: () => void;
}

export function QRCodeGenerator({
  value,
  options,
  onOptionsChange,
  onDownload,
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-center p-8 bg-card rounded-lg border border-card-border">
        <div ref={qrRef} className="bg-white p-4 rounded-lg" data-testid="qr-code">
          <QRCodeSVG
            value={value}
            size={256}
            bgColor={options.bgColor}
            fgColor={options.fgColor}
            level={options.level}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fg-color">Foreground Color</Label>
          <div className="flex gap-2">
            <Input
              id="fg-color"
              type="color"
              value={options.fgColor}
              onChange={(e) =>
                onOptionsChange({ ...options, fgColor: e.target.value })
              }
              className="h-10 w-16 p-1 cursor-pointer"
              data-testid="input-fg-color"
            />
            <Input
              type="text"
              value={options.fgColor}
              onChange={(e) =>
                onOptionsChange({ ...options, fgColor: e.target.value })
              }
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bg-color">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="bg-color"
              type="color"
              value={options.bgColor}
              onChange={(e) =>
                onOptionsChange({ ...options, bgColor: e.target.value })
              }
              className="h-10 w-16 p-1 cursor-pointer"
              data-testid="input-bg-color"
            />
            <Input
              type="text"
              value={options.bgColor}
              onChange={(e) =>
                onOptionsChange({ ...options, bgColor: e.target.value })
              }
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="error-correction">Error Correction Level</Label>
        <Select
          value={options.level}
          onValueChange={(value: 'L' | 'M' | 'Q' | 'H') =>
            onOptionsChange({ ...options, level: value })
          }
        >
          <SelectTrigger id="error-correction" data-testid="select-error-correction">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="L">Low (7%)</SelectItem>
            <SelectItem value="M">Medium (15%)</SelectItem>
            <SelectItem value="Q">Quartile (25%)</SelectItem>
            <SelectItem value="H">High (30%)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Higher levels provide better error recovery but create larger QR codes
        </p>
      </div>

      <Button
        onClick={onDownload}
        className="w-full"
        data-testid="button-download-qr"
      >
        <Download className="h-4 w-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
}
