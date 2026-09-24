/**

 * 💻 CyberTerminalModal — CyberShield X (DECOMMISSIONED IN STEP 4C)

 *

 * NOTICE: This modal has been decommissioned as part of Centralized Tool / Terminal Separation (Step 4C).

 * All native CLI execution is centralized exclusively on the dedicated first-class workstation route: /terminal.

 * This file is retained as an inactive, safe redirecting stub for backwards compatibility and static audit scripts.

 *

 * - Zero native execution engine inside modal

 * - Zero AI Copilot / Gemini execution inside modal

 * - Zero WebSockets

 * - Zero mock trend curves

 */



import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';



export default function CyberTerminalModal({ isOpen, onClose, initialTool = null, initialTarget = '' }) {

  const navigate = useNavigate();



  useEffect(() => {

    if (isOpen) {

      const params = new URLSearchParams();

      if (initialTool?.id) params.set('tool', initialTool.id);

      if (initialTarget) params.set('target', initialTarget);

      const qs = params.toString();

      onClose?.();

      navigate(qs ? `/terminal?${qs}` : '/terminal');

    }

  }, [isOpen, initialTool, initialTarget, navigate, onClose]);



  return null;

}
