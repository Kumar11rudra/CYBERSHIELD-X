import React, { useEffect, useRef } from 'react';



/**

 * 🌧️ BinaryMatrixRain — CyberShield X (Step 4C Architecture)

 * High-performance, purely binary Matrix Rain canvas decoration.

 *

 * Requirements & Constraints:

 * - Character set contains STRICTLY '0' and '1' (Zero A-F, symbols, punctuation, or hex).

 * - Driven by requestAnimationFrame (no uncontrolled setInterval loops).

 * - Drops array strictly bounded by canvas dimensions.

 * - Zero React state updates per frame (ref-driven direct canvas 2D rendering).

 * - Animation cleanly cancelled and event listeners detached on unmount.

 * - Respects prefers-reduced-motion (renders a subtle static snapshot without animation loop).

 * - Non-interactive background (pointer-events-none, aria-hidden="true", opacity-tuned for high text contrast).

 */

export default function BinaryMatrixRain({ className = '' }) {

  const canvasRef = useRef(null);



  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;



    // Accessibility check: respect reduced motion preferences

    const prefersReducedMotion = typeof window !== 'undefined' &&

      window.matchMedia &&

      window.matchMedia('(prefers-reduced-motion: reduce)').matches;



    let animationFrameId = null;

    let width = 0;

    let height = 0;

    let columns = 0;

    let drops = [];

    const fontSize = 14;

    const charSpacing = 18;

    const BINARY_CHARS = ['0', '1'];



    const updateDimensions = () => {

      const parent = canvas.parentElement;

      width = canvas.width = parent ? parent.clientWidth : window.innerWidth;

      height = canvas.height = parent ? parent.clientHeight : window.innerHeight;

      columns = Math.max(1, Math.floor(width / charSpacing));



      // Initialize drops at random y positions for natural distribution

      drops = new Array(columns);

      for (let i = 0; i < columns; i++) {

        drops[i] = Math.floor(Math.random() * (height / fontSize));

      }

    };



    updateDimensions();



    // If operator prefers reduced motion, render a subtle single static binary background snapshot

    if (prefersReducedMotion) {

      ctx.fillStyle = '#020814';

      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;



      for (let i = 0; i < columns; i++) {

        const char = BINARY_CHARS[(i + (drops[i] || 0)) % 2];

        ctx.fillStyle = (i % 5 === 0) ? 'rgba(0, 212, 255, 0.25)' : 'rgba(16, 185, 129, 0.15)';

        ctx.fillText(char, i * charSpacing, ((drops[i] || 0) * fontSize) % (height || 1));

      }

      return; // Do not schedule rAF loop

    }



    let lastFrameTime = performance.now();

    const targetFpsInterval = 1000 / 30; // 30 FPS cap for smooth, battery-efficient background rendering



    const renderFrame = (currentTime) => {

      animationFrameId = requestAnimationFrame(renderFrame);



      const elapsed = currentTime - lastFrameTime;

      if (elapsed < targetFpsInterval) return;

      lastFrameTime = currentTime - (elapsed % targetFpsInterval);



      // Semi-transparent fade background to produce trailing phosphor effect

      ctx.fillStyle = 'rgba(2, 8, 20, 0.12)';

      ctx.fillRect(0, 0, width, height);



      ctx.font = `${fontSize}px monospace`;



      for (let i = 0; i < columns; i++) {

        // Strictly binary characters only

        const char = BINARY_CHARS[Math.floor(Math.random() * 2)];



        // Random lead character brightening for realistic terminal rain

        const isBrightLead = Math.random() > 0.94;

        ctx.fillStyle = isBrightLead

          ? '#00ffcc'

          : 'rgba(0, 212, 255, 0.22)';



        ctx.fillText(char, i * charSpacing, drops[i] * fontSize);



        // Reset drop to top with randomized re-entry when falling off canvas bottom

        if (drops[i] * fontSize > height && Math.random() > 0.975) {

          drops[i] = 0;

        }



        drops[i]++;

      }

    };



    animationFrameId = requestAnimationFrame(renderFrame);



    const handleResize = () => {

      updateDimensions();

    };



    window.addEventListener('resize', handleResize);



    return () => {

      if (animationFrameId) {

        cancelAnimationFrame(animationFrameId);

      }

      window.removeEventListener('resize', handleResize);

    };

  }, []);



  return (

    <canvas

      ref={canvasRef}

      aria-hidden="true"

      data-testid="binary-matrix-rain"

      className={`absolute inset-0 w-full h-full pointer-events-none opacity-25 z-0 ${className}`}

    />

  );

}
