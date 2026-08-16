import React from 'react';
import {
  Key,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  HardDrive,
  Maximize,
  Sparkles,
} from 'lucide-react';
import { Panel, SourceImage } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatBytes } from '../import/image-import.service';
import { PanelAssetInspection } from './asset-inspection.service';

interface PanelInspectorProps {
  panel: Panel;
  sourceImage?: SourceImage;
  assetInspection?: PanelAssetInspection;
  totalPanelsCount: number;
}

export const PanelInspector: React.FC<PanelInspectorProps> = ({
  panel,
  sourceImage,
  assetInspection,
  totalPanelsCount,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isAssetValid = assetInspection ? assetInspection.status === 'valid' : Boolean(sourceImage);
  const importOrderDisplay =
    panel.initial_order !== undefined
      ? panel.initial_order + 1
      : sourceImage
      ? sourceImage.source_order + 1
      : '—';

  return (
    <div className="flex flex-col gap-4 text-xs text-zinc-100">
      {/* Identity & Source Information */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-300" />
            <h3 className="font-bold text-zinc-100 text-sm">Identity & Identifiers</h3>
          </div>
          <Badge variant="neutral" size="sm" className="font-mono">
            Read-Only Immutable
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Original Filename */}
          <div>
            <span className="text-zinc-400 font-medium block text-[11px] mb-0.5">
              Original Filename (Preserved Verbatim)
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <span className="font-mono font-bold text-zinc-100 text-xs break-all">
                {sourceImage?.original_filename || 'Unknown'}
              </span>
              {sourceImage?.original_filename && (
                <button
                  onClick={() => copyToClipboard(sourceImage.original_filename, 'filename')}
                  className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors ml-2 shrink-0"
                  title="Copy filename"
                >
                  {copiedKey === 'filename' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Panel ID */}
          <div>
            <span className="text-zinc-400 font-medium block text-[11px] mb-0.5">
              Internal Panel ID (`panel_id`)
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <code className="font-mono font-semibold text-purple-300 text-[11px] break-all">
                {panel.id}
              </code>
              <button
                onClick={() => copyToClipboard(panel.id, 'panel_id')}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors ml-2 shrink-0"
                title="Copy Panel ID"
              >
                {copiedKey === 'panel_id' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Source Image ID */}
          <div>
            <span className="text-zinc-400 font-medium block text-[11px] mb-0.5">
              Source Image ID (`image_id`)
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <code className="font-mono font-semibold text-indigo-300 text-[11px] break-all">
                {panel.image_id}
              </code>
              <button
                onClick={() => copyToClipboard(panel.image_id, 'image_id')}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors ml-2 shrink-0"
                title="Copy Image ID"
              >
                {copiedKey === 'image_id' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Asset Specifications */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-300" />
            <h3 className="font-bold text-zinc-100 text-sm">Asset Specifications</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-400 block text-[11px]">MIME Format</span>
            <span className="font-bold text-zinc-100 font-mono text-xs">
              {sourceImage?.mime_type || '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-400 block text-[11px]">Dimensions</span>
            <span className="font-bold text-zinc-100 font-mono text-xs">
              {sourceImage ? `${sourceImage.width} × ${sourceImage.height} px` : '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-400 block text-[11px]">Storage File Size</span>
            <span className="font-bold text-zinc-100 font-mono text-xs">
              {sourceImage ? formatBytes(sourceImage.file_size) : '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-400 block text-[11px]">Aspect Ratio</span>
            <span className="font-bold text-zinc-100 font-mono text-xs">
              {sourceImage && sourceImage.height > 0
                ? (sourceImage.width / sourceImage.height).toFixed(3)
                : '—'}
            </span>
          </div>
        </div>

        {sourceImage?.created_at && (
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Imported: {new Date(sourceImage.created_at).toLocaleString()}</span>
          </div>
        )}
      </Card>

      {/* Sequence & Ordering */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-300" />
            <h3 className="font-bold text-zinc-100 text-sm">Sequence & Ordering</h3>
          </div>
          <Badge variant="neutral" size="sm" className="font-mono font-bold">
            Pos #{panel.order + 1}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-400 block text-[11px]">Current Sequence</span>
            <span className="font-bold text-zinc-100 font-mono text-xs">
              #{panel.order + 1} of {totalPanelsCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-400 block text-[11px]">Original Import Order</span>
            <span className="font-bold text-zinc-300 font-mono text-xs">
              Initial #{importOrderDisplay}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
          <span className="text-zinc-400 block text-[11px] mb-1">
            Normalized Spatial Coordinates (0.0 – 1.0)
          </span>
          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-zinc-200 text-center">
            <div className="bg-zinc-900 p-1 rounded border border-zinc-750">
              x: {panel.boundary.x.toFixed(2)}
            </div>
            <div className="bg-zinc-900 p-1 rounded border border-zinc-750">
              y: {panel.boundary.y.toFixed(2)}
            </div>
            <div className="bg-zinc-900 p-1 rounded border border-zinc-750">
              w: {panel.boundary.width.toFixed(2)}
            </div>
            <div className="bg-zinc-900 p-1 rounded border border-zinc-750">
              h: {panel.boundary.height.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Health & Pipeline Status */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-300" />
            <h3 className="font-bold text-zinc-100 text-sm">Integrity & AI Status</h3>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Asset Verification */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-300 font-medium">Asset Verification</span>
            {isAssetValid ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Binary Verified
              </Badge>
            ) : assetInspection?.status === 'missing_binary' ? (
              <Badge variant="warning" size="sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Missing Binary
              </Badge>
            ) : (
              <Badge variant="error" size="sm">
                <AlertCircle className="w-3 h-3 mr-1" />
                Invalid Asset
              </Badge>
            )}
          </div>

          {/* AI Analysis Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-300 font-medium">AI Analysis Stage</span>
            <Badge variant="neutral" size="sm" className="font-medium">
              Not analyzed
            </Badge>
          </div>

          {/* OCR Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-300 font-medium">Speech / OCR Data</span>
            <Badge variant="neutral" size="sm" className="font-medium">
              Not analyzed
            </Badge>
          </div>

          {/* Camera Motion */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-300 font-medium">Camera Motion Vector</span>
            <Badge variant="neutral" size="sm" className="font-medium">
              Not analyzed
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
