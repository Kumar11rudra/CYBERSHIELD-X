import React from 'react';
import { useParams } from 'react-router-dom';
import { getToolConfig, TOOL_STATUS, TOOL_TYPES } from '../components/toolkit/toolConfig';
import ToolPageLayout from '../components/toolkit/ToolPageLayout';
import ScannerToolView from '../components/toolkit/ScannerToolView';
import AnalyzerToolView from '../components/toolkit/AnalyzerToolView';
import ComingSoonView from '../components/toolkit/ComingSoonView';
import UtilityToolView from '../components/toolkit/UtilityToolView';

/**
 * 🛠️ ToolDetailPage — CyberShield X
 * Dispatches the authenticated execution workstation for the requested toolId.
 */
export default function ToolDetailPage() {
  const { toolId } = useParams();
  const toolConfig = getToolConfig(toolId);

  if (!toolConfig) {
    return <ToolPageLayout toolId={toolId} />;
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
      <div className="p-8 text-center font-mono text-xs uppercase tracking-widest text-slate-500">
        Unknown tool type configuration structure
      </div>
    </ToolPageLayout>
  );
}
