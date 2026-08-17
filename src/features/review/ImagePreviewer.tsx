import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Cpu,
  FileImage,
  Sparkles,
  Users,
} from 'lucide-react';
import { SourceImage, Panel } from '../../types';
import { getImageBlob, getProxyBlob } from '../../services/storage/indexeddb';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatBytes } from '../import/image-import.service';
import { getOrCreateProxy } from '../analysis/image-preprocessing.service';
import { useProjectStore } from '../../stores/project.store';

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
  const [viewMode, setViewMode] = useState<'original' | 'proxy'>('original');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<'missing' | 'corrupted' | 'no_proxy' | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 100%
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'actual'>('fit');
  const [isGeneratingProxy, setIsGeneratingProxy] = useState(false);
  const [showRegionsOverlay, setShowRegionsOverlay] = useState(false);
  const [showSubjectsOverlay, setShowSubjectsOverlay] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const updatePanelPreprocessing = useProjectStore((state) => state.updatePanelPreprocessing);

  const visualAnalysis = (panel.visual_analysis && 'analysis_version' in panel.visual_analysis)
    ? panel.visual_analysis
    : null;
  const preprocessing = visualAnalysis?.preprocessing;
  const composition = visualAnalysis?.composition;
  const subjects = visualAnalysis?.subjects;
  const characters = visualAnalysis?.characters;

  // Load binary blob on-demand from IndexedDB whenever panel/image/viewMode changes
  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    setIsLoading(true);
    setLoadError(null);
    setZoomLevel(1);
    setFitMode('fit');

    async function loadImage() {
      if (!sourceImage) {
        if (isMounted) {
          setLoadError('missing');
          setIsLoading(false);
        }
        return;
      }

      try {
        if (viewMode === 'proxy') {
          // Load from proxy store
          const proxyRecord = await getProxyBlob(sourceImage.image_id);
          if (!proxyRecord || !proxyRecord.blob || proxyRecord.blob.size === 0) {
            if (isMounted) {
              setLoadError('no_proxy');
              setIsLoading(false);
            }
            return;
          }
          createdUrl = URL.createObjectURL(proxyRecord.blob);
          if (isMounted) {
            setProxyUrl(createdUrl);
            setImageUrl(createdUrl);
            setIsLoading(false);
          }
        } else {
          // Load original source blob
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
        }
      } catch (err) {
        console.error('Error fetching image blob from storage:', err);
        if (isMounted) {
          setLoadError('corrupted');
          setIsLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [sourceImage?.image_id, panel.id, viewMode]);

  const handleGenerateProxy = async () => {
    if (!panel.image_id) return;
    setIsGeneratingProxy(true);
    try {
      const result = await getOrCreateProxy(panel.image_id);
      await updatePanelPreprocessing(panel.id, result.info);
      setViewMode('proxy');
    } catch (err) {
      console.error('Failed to generate proxy on preview:', err);
    } finally {
      setIsGeneratingProxy(false);
    }
  };

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
            className="text-xs font-semibold text-zinc-200 truncate max-w-[160px] sm:max-w-[240px]"
            title={sourceImage?.original_filename || 'Unknown image'}
          >
            {sourceImage?.original_filename || 'Unknown image'}
          </span>
          {sourceImage && (
            <span className="text-[11px] font-mono text-zinc-400 hidden lg:inline">
              ({sourceImage.width} × {sourceImage.height} px • {formatBytes(sourceImage.file_size)})
            </span>
          )}
        </div>

        {/* View Mode Toggle & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Original vs Proxy Segment Control */}
          <div className="flex items-center rounded-lg bg-zinc-800 p-0.5 border border-zinc-700 text-xs">
            <button
              onClick={() => setViewMode('original')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === 'original'
                  ? 'bg-zinc-700 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('proxy')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'proxy'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3 h-3" />
              Analysis Proxy
            </button>
          </div>

          {/* Composition Regions Overlay Toggle */}
          {composition?.dominant_regions && composition.dominant_regions.length > 0 && (
            <button
              onClick={() => setShowRegionsOverlay(!showRegionsOverlay)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                showRegionsOverlay
                  ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-xs'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Dominant Visual Regions Overlay"
            >
              <span className={`w-2 h-2 rounded-full ${showRegionsOverlay ? 'bg-sky-400' : 'bg-zinc-500'}`} />
              <span>Regions ({composition.dominant_regions.length})</span>
            </button>
          )}

          {/* Subjects & Character Detection Overlay Toggle */}
          {((characters && characters.length > 0) || (subjects && subjects.length > 0)) && (
            <button
              onClick={() => setShowSubjectsOverlay(!showSubjectsOverlay)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                showSubjectsOverlay
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-xs'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Subjects & Character Bounding Boxes Overlay"
            >
              <Users className={`w-3 h-3 ${showSubjectsOverlay ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>Subjects ({(characters?.length || 0) + (subjects?.filter(s => s.type !== 'character').length || 0)})</span>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={isLoading || Boolean(loadError) || (fitMode === 'actual' && zoomLevel <= 0.25)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Zoom Out (-25%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono text-zinc-300 w-10 text-center select-none font-bold">
              {fitMode === 'fit' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
            </span>

            <button
              onClick={handleZoomIn}
              disabled={isLoading || Boolean(loadError) || (fitMode === 'actual' && zoomLevel >= 4)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Zoom In (+25%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleReset100}
              disabled={isLoading || Boolean(loadError)}
              className={`p-1.5 rounded-lg text-xs font-mono font-semibold transition-colors min-h-[32px] px-2 flex items-center justify-center ${
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
              className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
                fitMode === 'fit'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
              title="Fit to Viewport"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
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
            <span className="text-xs font-medium">
              {viewMode === 'proxy' ? 'Loading analysis proxy...' : 'Loading full-resolution panel preview...'}
            </span>
          </div>
        ) : loadError === 'no_proxy' ? (
          <div className="p-6 max-w-md bg-zinc-900 border border-indigo-500/30 rounded-2xl text-center space-y-3 text-white">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-indigo-200">Analysis Proxy Not Yet Generated</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An optimized downstream proxy for this panel has not been derived yet. The source asset is completely safe in storage.
            </p>
            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                onClick={handleGenerateProxy}
                disabled={isGeneratingProxy}
              >
                {isGeneratingProxy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Generating Proxy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Generate Proxy Now
                  </>
                )}
              </Button>
            </div>
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
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt={sourceImage?.original_filename || 'Selected panel'}
                onError={handleImageError}
                className={`rounded-lg shadow-2xl transition-all block ${
                  fitMode === 'fit'
                    ? 'max-h-[580px] max-w-full object-contain'
                    : 'max-none'
                }`}
              />
              {/* Visual Dominant Regions Overlay */}
              {showRegionsOverlay && composition?.dominant_regions && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                  {composition.dominant_regions.map((r, i) => (
                    <div
                      key={r.region_id || i}
                      className="absolute border-2 border-sky-400 bg-sky-400/20 rounded-xs flex items-start p-1"
                      style={{
                        left: `${Math.max(0, Math.min(100, r.box.x * 100))}%`,
                        top: `${Math.max(0, Math.min(100, r.box.y * 100))}%`,
                        width: `${Math.max(0, Math.min(100, r.box.width * 100))}%`,
                        height: `${Math.max(0, Math.min(100, r.box.height * 100))}%`,
                      }}
                    >
                      <span className="bg-sky-500 text-zinc-950 text-[9px] font-bold px-1 py-0.5 rounded-xs leading-none uppercase tracking-wider shadow-sm">
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subjects & Character Detection Overlay */}
              {showSubjectsOverlay && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                  {/* Non-Character Subjects (Weapons, Effects, Objects) */}
                  {subjects
                    ?.filter((s) => s.type !== 'character')
                    .map((s, i) => (
                      <div
                        key={s.subject_id || i}
                        className={`absolute border-2 rounded-xs flex items-start p-0.5 ${
                          s.type === 'weapon'
                            ? 'border-amber-400 bg-amber-400/15'
                            : s.type === 'effect'
                            ? 'border-purple-400 bg-purple-400/15'
                            : s.type === 'creature'
                            ? 'border-rose-400 bg-rose-400/15'
                            : 'border-indigo-400 bg-indigo-400/15'
                        }`}
                        style={{
                          left: `${Math.max(0, Math.min(100, s.bounding_box.x * 100))}%`,
                          top: `${Math.max(0, Math.min(100, s.bounding_box.y * 100))}%`,
                          width: `${Math.max(0, Math.min(100, s.bounding_box.width * 100))}%`,
                          height: `${Math.max(0, Math.min(100, s.bounding_box.height * 100))}%`,
                        }}
                      >
                        <span
                          className={`text-[8px] font-bold px-1 py-0.5 rounded-xs leading-none uppercase tracking-wider shadow-sm ${
                            s.type === 'weapon'
                              ? 'bg-amber-400 text-zinc-950'
                              : s.type === 'effect'
                              ? 'bg-purple-500 text-white'
                              : s.type === 'creature'
                              ? 'bg-rose-500 text-white'
                              : 'bg-indigo-500 text-white'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    ))}

                  {/* Character Figures */}
                  {characters?.map((c, i) => (
                    <div
                      key={c.detection_id || i}
                      className="absolute border-2 border-cyan-400 bg-cyan-400/15 rounded-xs flex flex-col justify-between p-1 shadow-md"
                      style={{
                        left: `${Math.max(0, Math.min(100, c.bounding_box.x * 100))}%`,
                        top: `${Math.max(0, Math.min(100, c.bounding_box.y * 100))}%`,
                        width: `${Math.max(0, Math.min(100, c.bounding_box.width * 100))}%`,
                        height: `${Math.max(0, Math.min(100, c.bounding_box.height * 100))}%`,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="bg-cyan-400 text-zinc-950 text-[9px] font-bold px-1 py-0.5 rounded-xs leading-none uppercase tracking-wider shadow-sm">
                          {c.label || `Char ${i + 1}`}
                        </span>
                        {c.expression && (
                          <span className="bg-cyan-950 text-cyan-200 border border-cyan-700 text-[8px] font-medium px-1 py-0.2 rounded-xs leading-none capitalize">
                            {c.expression}
                          </span>
                        )}
                      </div>

                      {/* Render Face Region Box if detected within panel coordinates */}
                      {c.face_region && (
                        <div
                          className="absolute border-2 border-emerald-400 bg-emerald-400/25 border-dashed rounded-xs flex items-start p-0.5"
                          style={{
                            // face_region is in panel-relative normalized space
                            left: `${Math.max(0, Math.min(100, ((c.face_region.x - c.bounding_box.x) / c.bounding_box.width) * 100))}%`,
                            top: `${Math.max(0, Math.min(100, ((c.face_region.y - c.bounding_box.y) / c.bounding_box.height) * 100))}%`,
                            width: `${Math.max(0, Math.min(100, (c.face_region.width / c.bounding_box.width) * 100))}%`,
                            height: `${Math.max(0, Math.min(100, (c.face_region.height / c.bounding_box.height) * 100))}%`,
                          }}
                        >
                          <span className="bg-emerald-500 text-zinc-950 text-[7px] font-bold px-0.5 py-0.2 rounded-xs leading-none">
                            Face
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Status bar */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-zinc-500" />
          <span>Panel #{panel.order + 1} Preview</span>
          <Badge
            variant={viewMode === 'proxy' ? 'purple' : 'neutral'}
            size="sm"
            className="text-[10px] uppercase font-bold"
          >
            {viewMode === 'proxy' ? 'Analysis Proxy' : 'Source Asset'}
          </Badge>
        </div>
        <div>
          {viewMode === 'proxy' && preprocessing ? (
            <span className="text-indigo-300">
              Proxy: {preprocessing.analysis_width} × {preprocessing.analysis_height} px ({preprocessing.format.split('/')[1] || 'jpeg'})
            </span>
          ) : sourceImage ? (
            <span>MIME: {sourceImage.mime_type}</span>
          ) : (
            <span className="text-amber-400">Unlinked image</span>
          )}
        </div>
      </div>
    </div>
  );
};
