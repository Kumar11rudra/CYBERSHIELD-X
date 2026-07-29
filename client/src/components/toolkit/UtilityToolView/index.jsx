import React, { useEffect } from 'react';
import { getToolConfig } from '../toolConfig';
import styles from './styles';

// Sub-components
import JwtParserView from './sub-components/JwtParserView';
import Base64DecoderView from './sub-components/Base64DecoderView';
import UrlSanitizerView from './sub-components/UrlSanitizerView';
import UtilitySidekick from './sub-components/UtilitySidekick';

/**
 * UtilityToolView Component
 * Coordinator for client-side security utility tools.
 */
export default function UtilityToolView({ toolId }) {
  const tool = getToolConfig(toolId);

  // Responsive Styles side-effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styleId = 'utility-tool-view-responsive';
      if (!document.getElementById(styleId)) {
        const styleTag = document.createElement('style');
        styleTag.id = styleId;
        styleTag.innerHTML = `
          @media (max-width: 991px) {
            .utility-grid {
              display: flex !important;
              flex-direction: column !important;
            }
            .utility-main-col, .utility-side-col {
              grid-column: span 12 !important;
              width: 100% !important;
            }
          }
        `;
        document.head.appendChild(styleTag);
      }
    }
  }, []);

  if (!tool) return null;

  return (
    <div style={styles.grid} className="utility-grid">
      <div style={styles.mainColumn} className="utility-main-col">
        {toolId === 'jwt-parser' && <JwtParserView />}
        {toolId === 'base64-decoder' && <Base64DecoderView />}
        {toolId === 'url-sanitizer' && <UrlSanitizerView />}
      </div>
      <div style={styles.sideColumn} className="utility-side-col">
        <UtilitySidekick toolId={toolId} />
      </div>
    </div>
  );
}
