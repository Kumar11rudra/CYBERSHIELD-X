import React from 'react';
import { useParams } from 'react-router-dom';
import { getToolConfig, TOOL_STATUS, TOOL_TYPES } from '../components/toolkit/toolConfig';
import ToolPageLayout from '../components/toolkit/ToolPageLayout';
import ScannerToolView from '../components/toolkit/ScannerToolView';
import AnalyzerToolView from '../components/toolkit/AnalyzerToolView';
import ComingSoonView from '../components/toolkit/ComingSoonView';
import UtilityToolView from '../components/toolkit/UtilityToolView';

export default function ToolDetailPage() {
  const { toolId } = useParams();
  const toolConfig = getToolConfig(toolId);

  if (!toolConfig) {
    return (
      <ToolPageLayout toolId={toolId}>
        <div className="flex flex-col items-center justify-center py-20 text-center font-mono">
          <span className="text-4xl mb-4">⚠️</span>
          <p className="text-xs uppercase tracking-[0.2em] text-[#ff2244] font-bold">Tool Dossier Not Found</p>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mt-2">
            The requested module identifier "{toolId}" is not registered in the Nexus catalogue.
          </p>
        </div>
      </ToolPageLayout>
    );
  }

  if (toolConfig.status === TOOL_STATUS.COMING_SOON) {
    return (
      <ToolPageLayout toolId={toolId}>
        <ComingSoonView toolId={toolId} />
      </ToolPageLayout>
    );
  }

  if (toolConfig.type === TOOL_TYPES.SCANNER) {
    return (
      <ToolPageLayout toolId={toolId}>
        <ScannerToolView toolId={toolId} />
      </ToolPageLayout>
    );
  }

  if (toolConfig.type === TOOL_TYPES.ANALYZER) {
    return (
      <ToolPageLayout toolId={toolId}>
        <AnalyzerToolView toolId={toolId} />
      </ToolPageLayout>
    );
  }

  if (toolConfig.type === TOOL_TYPES.UTILITY) {
    return (
      <ToolPageLayout toolId={toolId}>
        <UtilityToolView toolId={toolId} />
      </ToolPageLayout>
    );
  }

  return (
    <ToolPageLayout toolId={toolId}>
      <div className="text-center py-10 font-mono text-xs uppercase tracking-widest text-cyber-muted">
        Unknown tool type configuration structure
      </div>
    </ToolPageLayout>
  );
}
