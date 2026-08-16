import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  Eye,
} from 'lucide-react';
import { SourceImage, Panel } from '../../types';
import { getImageBlob } from '../../services/storage/indexeddb';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatBytes } from '../import/image-import.service';

interface ImagePreviewerProps {
  panel: Panel;
  sourceImage?: SourceImage;
  className?: string;
}

export const ImagePreviewer: React.FC<ImagePreviewerProps> = ({
  panel,
  sourceImage,
  className = '',
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<'missing' | 'corrupted' | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 100%
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'actual'>('fit');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load binary blob on-demand from IndexedDB whenever panel/image changes
  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    setIsLoading(true);
    setLoadError(null);
    setZoomLevel(1);
    setFitMode('fit');

    async function loadFullImage() {
      if (!sourceImage) {
        if (isMounted) {
          setLoadError('missing');
          setIsLoading(false);
        }
        return;
      }

      try {
        const blob = await getImageBlob(sourceImage.image_id);
        if (!blob || blob.size === 0) {
          if (isMounted) {
            setLoadError('missing');
            setIsLoading(false);
          }
          return;
        }

        createdUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setImageUrl(createdUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching image blob from storage:', err);
        if (isMounted) {
          setLoadError('corrupted');
          setIsLoading(false);
        }
      }
    }

    loadFullImage();

    // Clean up temporary object URL immediately when unmounting or switching panel
    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [sourceImage?.image_id, panel.id]);

  const handleZoomIn = () => {
    setFitMode('actual');
    setZoomLevel((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setFitMode('actual');
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleReset100 = () => {
    setFitMode('actual');
    setZoomLevel(1);
  };

  const handleFitToView = () => {
    setFitMode('fit');
    setZoomLevel(1);
  };

  const handleImageError = () => {
    setLoadError('corrupted');
  };

  return (
    <div
      className={`bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden relative shadow-lg ${className}`}
    >
      {/* Top Preview Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-xs z-10 gap-2 flex-wrap text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="neutral" size="sm" className="font-mono bg-zinc-800 text-zinc-200 border-zinc-700">
            #{panel.order + 1}
          </Badge>
          <span
            className="text-xs font-semibold text-zinc-200 truncate max-w-[200px] sm:max-w-[280px]"
            title={sourceImage?.original_filename || 'Unknown image'}
          >
            {sourceImage?.original_filename || 'Unknown image'}
          </span>
          {sourceImage && (
            <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
              ({sourceImage.width} × {sourceImage.height} px • {formatBytes(sourceImage.file_size)})
            </span>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={isLoading || Boolean(loadError) || (fitMode === 'actual' && zoomLevel <= 0.25)}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-zinc-300 w-12 text-center select-none font-bold">
            {fitMode === 'fit' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
          </span>

          <button
            onClick={handleZoomIn}
            disabled={isLoading || Boolean(loadError) || (fitMode === 'actual' && zoomLevel >= 4)}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset100}
            disabled={isLoading || Boolean(loadError)}
            className={`p-1.5 rounded-lg text-xs font-mono font-semibold transition-colors min-h-[36px] px-2 flex items-center justify-center ${
              fitMode === 'actual' && zoomLevel === 1
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="100% Actual Size"
          >
            1:1
          </button>

          <button
            onClick={handleFitToView}
            disabled={isLoading || Boolean(loadError)}
            className={`p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
              fitMode === 'fit'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Fit to Viewport"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Stage Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[320px] sm:min-h-[420px] max-h-[640px] bg-zinc-950 flex items-center justify-center overflow-auto p-4 select-none touch-pan-x touch-pan-y"
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2.5 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-medium">Loading full-resolution panel preview...</span>
          </div>
        ) : loadError === 'missing' ? (
          <div className="p-6 max-w-md bg-zinc-900 border border-amber-500/30 rounded-2xl text-center space-y-3 text-white">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-amber-200">Missing Image Binary</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This panel's image data is missing from local storage. Metadata and IDs remain safely preserved.
            </p>
          </div>
        ) : loadError === 'corrupted' ? (
          <div className="p-6 max-w-md bg-zinc-900 border border-rose-500/30 rounded-2xl text-center space-y-3 text-white">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-rose-200">Image Could Not Be Decoded</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The stored image binary is corrupted or unsupported by browser decoding.
            </p>
          </div>
        ) : imageUrl ? (
          <div
            className="flex items-center justify-center transition-transform duration-100"
            style={{
              transform: fitMode === 'actual' ? `scale(${zoomLevel})` : undefined,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={imageUrl}
              alt={sourceImage?.original_filename || 'Selected panel'}
              onError={handleImageError}
              className={`rounded-lg shadow-2xl transition-all ${
                fitMode === 'fit'
                  ? 'max-h-[580px] max-w-full object-contain'
                  : 'max-none'
              }`}
            />
          </div>
        ) : null}
      </div>

      {/* Bottom Status bar */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-zinc-500" />
          <span>Panel #{panel.order + 1} Preview</span>
        </div>
        <div>
          {sourceImage ? (
            <span>MIME: {sourceImage.mime_type}</span>
          ) : (
            <span className="text-amber-400">Unlinked image</span>
          )}
        </div>
      </div>
    </div>
  );
};
