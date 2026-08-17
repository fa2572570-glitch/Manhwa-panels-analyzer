import React, { useState } from 'react';
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
  RefreshCw,
  FileImage,
  Gauge,
  Cpu,
  Compass,
  Layout,
  Sun,
  Eye,
  Users,
  User,
  Smile,
  Shield,
  Zap,
} from 'lucide-react';
import { Panel, SourceImage } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatBytes } from '../import/image-import.service';
import { PanelAssetInspection } from './asset-inspection.service';
import { getOrCreateProxy, invalidateProxy } from '../analysis/image-preprocessing.service';
import { analyzePanelComposition } from '../analysis/composition-analysis.service';
import { analyzePanelSubjects } from '../analysis/subject-analysis.service';
import { useProjectStore } from '../../stores/project.store';

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingProxy, setIsGeneratingProxy] = useState(false);
  const [isAnalyzingComposition, setIsAnalyzingComposition] = useState(false);
  const [isAnalyzingSubjects, setIsAnalyzingSubjects] = useState(false);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [compositionError, setCompositionError] = useState<string | null>(null);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  const updatePanelPreprocessing = useProjectStore((state) => state.updatePanelPreprocessing);

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

  const visualAnalysis = (panel.visual_analysis && 'analysis_version' in panel.visual_analysis)
    ? panel.visual_analysis
    : null;
  const preprocessing = visualAnalysis?.preprocessing;

  const handleGenerateProxy = async (force: boolean = false) => {
    if (!panel.image_id) return;
    setIsGeneratingProxy(true);
    setProxyError(null);

    try {
      if (force) {
        await invalidateProxy(panel.image_id);
      }
      const result = await getOrCreateProxy(panel.image_id, { forceRegenerate: force });
      await updatePanelPreprocessing(panel.id, result.info);
    } catch (err) {
      console.error('Failed to generate analysis proxy:', err);
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as any).message)
        : 'Failed to generate proxy';
      setProxyError(msg);
    } finally {
      setIsGeneratingProxy(false);
    }
  };

  const composition = visualAnalysis?.composition;
  const compositionStageStatus = visualAnalysis?.stages?.composition || (composition ? 'COMPLETED' : 'NOT_ANALYZED');
  const subjects = visualAnalysis?.subjects;
  const characters = visualAnalysis?.characters;
  const subjectsStageStatus = visualAnalysis?.stages?.subjects || (subjects && subjects.length > 0 ? 'COMPLETED' : 'NOT_ANALYZED');
  const stageError = visualAnalysis?.error;

  const handleAnalyzeComposition = async (force: boolean = false) => {
    setIsAnalyzingComposition(true);
    setCompositionError(null);

    try {
      const result = await analyzePanelComposition(panel.id || panel.panel_id, {
        forceReanalysis: force,
      });

      if (!result.success && result.error) {
        setCompositionError(result.error.message || 'Composition analysis failed');
      }
    } catch (err: any) {
      console.error('Failed to run composition analysis:', err);
      setCompositionError(err.message || 'Composition analysis failed');
    } finally {
      setIsAnalyzingComposition(false);
    }
  };

  const handleAnalyzeSubjects = async (force: boolean = false) => {
    setIsAnalyzingSubjects(true);
    setSubjectsError(null);

    try {
      const result = await analyzePanelSubjects(panel.id || panel.panel_id, {
        forceReanalysis: force,
      });

      if (!result.success && result.error) {
        setSubjectsError(result.error.message || 'Subject detection failed');
      }
    } catch (err: any) {
      console.error('Failed to run subject detection:', err);
      setSubjectsError(err.message || 'Subject detection failed');
    } finally {
      setIsAnalyzingSubjects(false);
    }
  };

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

      {/* Analysis Proxy & Preprocessing (Part 2.2) */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-zinc-100 text-sm">Analysis Proxy</h3>
          </div>
          {preprocessing ? (
            <Badge variant="success" size="sm" className="font-mono">
              Ready ({preprocessing.format.split('/')[1] || 'jpeg'})
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" className="font-mono">
              Not Generated
            </Badge>
          )}
        </div>

        {preprocessing ? (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <span className="text-zinc-400 block text-[10px]">Proxy Dimensions</span>
              <span className="font-bold text-indigo-300 font-mono text-xs">
                {preprocessing.analysis_width} × {preprocessing.analysis_height} px
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <span className="text-zinc-400 block text-[10px]">Scale Factor</span>
              <span className="font-bold text-zinc-100 font-mono text-xs">
                {(preprocessing.scale * 100).toFixed(1)}% ({preprocessing.scale.toFixed(3)})
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <span className="text-zinc-400 block text-[10px]">Proxy Byte Size</span>
              <span className="font-bold text-zinc-100 font-mono text-xs">
                {preprocessing.proxy_byte_size ? formatBytes(preprocessing.proxy_byte_size) : '—'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <span className="text-zinc-400 block text-[10px]">Pipeline Version</span>
              <span className="font-bold text-zinc-300 font-mono text-xs">
                v{preprocessing.preprocessing_version || '1.0.0'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-800/40 border border-dashed border-zinc-700 text-center space-y-1">
            <p className="text-[11px] text-zinc-400">
              Analysis proxy not yet generated. The original binary remains untouched.
            </p>
          </div>
        )}

        {proxyError && (
          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{proxyError}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => handleGenerateProxy(false)}
            disabled={isGeneratingProxy || !sourceImage}
          >
            {isGeneratingProxy ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Processing...
              </>
            ) : preprocessing ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Proxy Ready
              </>
            ) : (
              <>
                <FileImage className="w-3.5 h-3.5 mr-1.5" />
                Generate Analysis Proxy
              </>
            )}
          </Button>

          {preprocessing && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleGenerateProxy(true)}
              disabled={isGeneratingProxy || !sourceImage}
              title="Force regenerate proxy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingProxy ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </Card>

      {/* Part 2.3 — Panel Composition & Visual Structure */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-zinc-100 text-sm">Composition & Visual Structure</h3>
          </div>
          {(() => {
            switch (compositionStageStatus) {
              case 'COMPLETED':
                return (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Analyzed
                  </Badge>
                );
              case 'ANALYZING':
                return (
                  <Badge variant="info" size="sm" className="animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Analyzing
                  </Badge>
                );
              case 'FAILED':
                return (
                  <Badge variant="error" size="sm">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                );
              default:
                return (
                  <Badge variant="neutral" size="sm">
                    Not Analyzed
                  </Badge>
                );
            }
          })()}
        </div>

        {composition ? (
          <div className="flex flex-col gap-3">
            {/* Primary Framing & Density Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/80 flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-400 font-medium">Shot Scale</span>
                <span className="font-bold text-zinc-100 capitalize">
                  {composition.shot_scale?.replace(/-/g, ' ') || 'Unknown'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/80 flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-400 font-medium">Framing</span>
                <span className="font-bold text-zinc-100 capitalize">
                  {composition.framing?.replace(/_/g, ' ') || 'Unknown'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/80 flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-400 font-medium">Visual Density</span>
                <span className="font-bold text-zinc-100 capitalize">
                  {composition.visual_density?.replace(/_/g, ' ') || 'Balanced'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/80 flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-400 font-medium">Orientation</span>
                <span className="font-bold text-zinc-100 capitalize">
                  {composition.dominant_orientation || 'Mixed'}
                </span>
              </div>
            </div>

            {/* Depth & Visual Layering */}
            {(composition.foreground_importance !== undefined ||
              composition.middleground_importance !== undefined ||
              composition.background_importance !== undefined) && (
              <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-300">Depth & Visual Layering</span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Foreground</span>
                    <span className="font-mono text-zinc-200">
                      {Math.round((composition.foreground_importance ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full"
                      style={{ width: `${(composition.foreground_importance ?? 0) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Middleground</span>
                    <span className="font-mono text-zinc-200">
                      {Math.round((composition.middleground_importance ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(composition.middleground_importance ?? 0) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Background</span>
                    <span className="font-mono text-zinc-200">
                      {Math.round((composition.background_importance ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{ width: `${(composition.background_importance ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Visual Hierarchy & Dominant Regions */}
            {composition.dominant_regions && composition.dominant_regions.length > 0 && (
              <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-zinc-300">
                  Dominant Visual Regions ({composition.dominant_regions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {composition.dominant_regions.map((r, i) => (
                    <div
                      key={r.region_id || i}
                      className="px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center gap-1.5 text-[10px]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span className="font-medium text-zinc-200">{r.label}</span>
                      <span className="font-mono text-zinc-400">
                        [{Math.round(r.box.x * 100)},{Math.round(r.box.y * 100)} {Math.round(r.box.width * 100)}×{Math.round(r.box.height * 100)}%]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Atmosphere & Lighting */}
            {(composition.lighting_mood || composition.tonal_range || composition.negative_space) && (
              <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">Negative Space</span>
                  <span className="font-semibold text-zinc-200 capitalize">
                    {composition.negative_space || 'Low'}
                  </span>
                </div>
                {composition.tonal_range && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Tonal Range</span>
                    <span className="font-semibold text-zinc-200 capitalize">
                      {composition.tonal_range.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {composition.lighting_mood && (
                  <div className="text-[11px] text-zinc-300 bg-zinc-800/80 p-2 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium block text-[10px] mb-0.5">Lighting Mood</span>
                    {composition.lighting_mood}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {composition.summary && (
              <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/60 text-[11px] text-zinc-300">
                <span className="text-zinc-400 font-semibold block text-[10px] mb-1">Composition Summary</span>
                <p className="leading-relaxed">{composition.summary}</p>
              </div>
            )}

            {/* Confidence & Provenance */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px] text-zinc-400 font-mono">
              <span>Confidence: {Math.round((composition.confidence ?? 0.8) * 100)}%</span>
              {composition.source && (
                <span>
                  {composition.source.provider}/{composition.source.model || 'model'} (v{composition.source.prompt_version || '1.0'})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-800/30 border border-zinc-800 text-center gap-2">
            <Compass className="w-6 h-6 text-zinc-500" />
            <div className="flex flex-col">
              <span className="text-zinc-300 font-medium text-xs">No Composition Analysis</span>
              <span className="text-zinc-500 text-[11px]">
                Run Part 2.3 analysis to extract shot framing, visual layers, spatial density, and lighting.
              </span>
            </div>
          </div>
        )}

        {/* Error notification if failed */}
        {(compositionError || (stageError && stageError.stage === 'composition')) && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Composition Analysis Error</span>
            </div>
            <p className="leading-tight text-rose-200/90">
              {compositionError || stageError?.message}
            </p>
            {stageError?.code && (
              <span className="font-mono text-[10px] text-rose-400/80">Code: {stageError.code}</span>
            )}
          </div>
        )}

        {/* Analysis Action Controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => handleAnalyzeComposition(Boolean(composition))}
            disabled={isAnalyzingComposition || !sourceImage}
          >
            {isAnalyzingComposition ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Analyzing Composition...
              </>
            ) : composition ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Re-Analyze Composition
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Analyze Composition
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Part 2.4 — Subjects & Character Detection */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-zinc-100 text-sm">Subjects & Characters</h3>
          </div>
          {(() => {
            switch (subjectsStageStatus) {
              case 'COMPLETED':
                return (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    Detected
                  </Badge>
                );
              case 'ANALYZING':
                return (
                  <Badge variant="info" size="sm" className="animate-pulse">
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    Detecting
                  </Badge>
                );
              case 'FAILED':
                return (
                  <Badge variant="error" size="sm">
                    <AlertCircle className="w-3 h-3 mr-0.5" />
                    Failed
                  </Badge>
                );
              case 'NOT_ANALYZED':
              default:
                return (
                  <Badge variant="neutral" size="sm">
                    Not analyzed
                  </Badge>
                );
            }
          })()}
        </div>

        {/* Content if detected */}
        {((characters && characters.length > 0) || (subjects && subjects.length > 0)) ? (
          <div className="flex flex-col gap-3">
            {/* Quick Metrics Header */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Human Characters</span>
                <span className="text-sm font-bold text-cyan-300">
                  {characters?.length || 0} {characters?.length === 1 ? 'figure' : 'figures'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Subjects</span>
                <span className="text-sm font-bold text-zinc-200">
                  {subjects?.length || 0} {subjects?.length === 1 ? 'subject' : 'subjects'}
                </span>
              </div>
            </div>

            {/* Detected Characters List */}
            {characters && characters.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Visible Characters ({characters.length})
                </span>
                <div className="flex flex-col gap-2">
                  {characters.map((char, i) => (
                    <div
                      key={char.detection_id || i}
                      className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/70 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100 text-[11px]">
                          {char.label || `Character ${i + 1}`}
                        </span>
                        <Badge variant="purple" size="sm" className="font-mono text-[9px]">
                          {Math.round((char.confidence ?? 0.9) * 100)}% conf
                        </Badge>
                      </div>

                      {/* Character Attributes Pills */}
                      <div className="flex flex-wrap items-center gap-1">
                        {char.visibility && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-700/60 text-zinc-300 font-medium text-[9px] capitalize">
                            {char.visibility.replace(/_/g, ' ')}
                          </span>
                        )}
                        {char.screen_position && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[9px] capitalize font-medium">
                            {char.screen_position}
                          </span>
                        )}
                        {char.expression && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 text-[9px] flex items-center gap-1 font-medium capitalize">
                            <Smile className="w-2.5 h-2.5" />
                            {char.expression}
                          </span>
                        )}
                        {char.pose && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] capitalize">
                            {char.pose}
                          </span>
                        )}
                        {char.face_region && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 text-[9px] font-medium">
                            Face Region
                          </span>
                        )}
                      </div>

                      {/* Action details if present */}
                      {char.action && (
                        <div className="text-[10px] text-zinc-400 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800">
                          <span className="text-zinc-500 font-medium mr-1">Action:</span>
                          {char.action}
                        </div>
                      )}

                      {/* Spatial Bounding Coordinates */}
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-0.5">
                        <span>Box: [{Math.round(char.bounding_box.x * 100)}%, {Math.round(char.bounding_box.y * 100)}% {Math.round(char.bounding_box.width * 100)}×{Math.round(char.bounding_box.height * 100)}%]</span>
                        {char.face_region && (
                          <span>Face: [{Math.round(char.face_region.x * 100)}%, {Math.round(char.face_region.y * 100)}%]</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Human / Supporting Subjects List */}
            {subjects && subjects.filter((s) => s.type !== 'character').length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Objects, Effects & Environment ({subjects.filter((s) => s.type !== 'character').length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {subjects
                    .filter((s) => s.type !== 'character')
                    .map((subj, i) => (
                      <div
                        key={subj.subject_id || i}
                        className="px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 flex flex-col gap-1 text-[10px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              subj.type === 'weapon'
                                ? 'warning'
                                : subj.type === 'effect'
                                ? 'purple'
                                : subj.type === 'creature'
                                ? 'error'
                                : 'neutral'
                            }
                            size="sm"
                            className="capitalize text-[9px] px-1 py-0"
                          >
                            {subj.type}
                          </Badge>
                          <span className="font-semibold text-zinc-200">{subj.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono">
                          <span className="capitalize">{subj.importance || 'secondary'}</span>
                          <span>{Math.round(subj.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-800/30 border border-zinc-800 text-center gap-2">
            <Users className="w-6 h-6 text-zinc-500" />
            <div className="flex flex-col">
              <span className="text-zinc-300 font-medium text-xs">No Subjects Detected</span>
              <span className="text-zinc-500 text-[11px]">
                Run Part 2.4 analysis to identify visible characters, faces, postures, weapons, effects, and spatial bounds.
              </span>
            </div>
          </div>
        )}

        {/* Error notification if failed */}
        {(subjectsError || (stageError && stageError.stage === 'subjects')) && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Subject Detection Error</span>
            </div>
            <p className="leading-tight text-rose-200/90">
              {subjectsError || stageError?.message}
            </p>
            {stageError?.code && (
              <span className="font-mono text-[10px] text-rose-400/80">Code: {stageError.code}</span>
            )}
          </div>
        )}

        {/* Analysis Action Controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => handleAnalyzeSubjects(Boolean(subjects && subjects.length > 0))}
            disabled={isAnalyzingSubjects || !sourceImage}
          >
            {isAnalyzingSubjects ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Detecting Subjects & Characters...
              </>
            ) : (subjects && subjects.length > 0) || (characters && characters.length > 0) ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Re-Detect Subjects & Characters
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Detect Subjects & Characters
              </>
            )}
          </Button>
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

          {/* Visual Analysis Status (Part 2.1) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <div className="flex flex-col">
              <span className="text-zinc-300 font-medium">Visual Analysis</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {('analysis_version' in (panel.visual_analysis || {}))
                  ? `v${(panel.visual_analysis as any).analysis_version || '1.0.0'}`
                  : 'Engine Contract v1.0.0'}
              </span>
            </div>
            {(() => {
              const va = panel.visual_analysis as any;
              const status = va?.status || 'NOT_ANALYZED';
              switch (status) {
                case 'COMPLETED':
                  return (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                      Completed
                    </Badge>
                  );
                case 'ANALYZING':
                  return (
                    <Badge variant="info" size="sm" className="animate-pulse">
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      Analyzing
                    </Badge>
                  );
                case 'QUEUED':
                  return (
                    <Badge variant="purple" size="sm">
                      Queued
                    </Badge>
                  );
                case 'FAILED':
                  return (
                    <Badge variant="error" size="sm">
                      <AlertCircle className="w-3 h-3 mr-0.5" />
                      Failed
                    </Badge>
                  );
                case 'STALE':
                  return (
                    <Badge variant="warning" size="sm">
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                      Stale
                    </Badge>
                  );
                case 'NOT_ANALYZED':
                default:
                  return (
                    <Badge variant="neutral" size="sm" className="font-medium">
                      Not analyzed
                    </Badge>
                  );
              }
            })()}
          </div>

          {/* Subjects & Character Detection Status (Part 2.4) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <span className="text-zinc-300 font-medium">Subjects & Characters</span>
            {(() => {
              switch (subjectsStageStatus) {
                case 'COMPLETED':
                  return (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                      Detected ({subjects?.length || 0})
                    </Badge>
                  );
                case 'ANALYZING':
                  return (
                    <Badge variant="info" size="sm" className="animate-pulse">
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      Detecting
                    </Badge>
                  );
                case 'FAILED':
                  return (
                    <Badge variant="error" size="sm">
                      <AlertCircle className="w-3 h-3 mr-0.5" />
                      Failed
                    </Badge>
                  );
                case 'NOT_ANALYZED':
                default:
                  return (
                    <Badge variant="neutral" size="sm" className="font-medium">
                      Not analyzed
                    </Badge>
                  );
              }
            })()}
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
