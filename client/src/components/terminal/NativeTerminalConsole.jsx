import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import {

  Terminal as TerminalIcon, Play, Square, RefreshCw, Copy, Check,

  Trash2, Shield, Activity, Clock, Server, AlertTriangle, CheckCircle2,

  XCircle, CornerDownLeft, ChevronRight, HelpCircle, HardDrive, Cpu,

  ArrowDown, RotateCcw, Crosshair, Zap

} from 'lucide-react';

import TerminalOutputFormatter from './TerminalOutputFormatter';

import {

  executeNativeTool,

  cancelTerminalExecution,

  fetchHostCapabilities

} from '../../services/terminalExecutionService';

import {

  TERMINAL_NATIVE_REGISTRY,

  resolveNativeTool,

  isNativeToolAuthorized,

  getAnnotatedNativeRegistry,

  getToolAvailability

} from './terminalNativeRegistry';



const STORAGE_KEY = 'cybershield_terminal_session_history';

const MAX_HISTORY = 30;



/**

 * Strips and redacts any query-string secrets, tokens, credentials, and sensitive headers

 * before commands enter the history buffer or session storage.

 */

export function sanitizeCommandForHistory(rawCmd) {

  if (!rawCmd || typeof rawCmd !== 'string') return '';

  let sanitized = rawCmd.trim();



  // Redact URL credentials: http://user:pass@host -> http://user:[REDACTED]@host

  sanitized = sanitized.replace(/(:\/\/[^:\s]+:)[^@\s]+(@)/g, '$1[REDACTED]$2');



  // Redact query parameter credentials & secrets (?token=, &key=, &password=, etc.)

  sanitized = sanitized.replace(/([?&](?:token|key|secret|password|api_key|apiKey|auth|access_token)=)[^&\s]+/gi, '$1[REDACTED]');



  // Redact Bearer tokens: Bearer eyJ...

  sanitized = sanitized.replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]');



  // Redact Authorization and Cookie headers in CLI args

  sanitized = sanitized.replace(/(-H\s+['"](?:Authorization|Cookie):\s*)[^'"]+(['"])/gi, '$1[REDACTED]$2');



  // Redact CLI password arguments: --password=xyz or --password xyz

  sanitized = sanitized.replace(/(--password(?:=|\s+))[^\s]+/gi, '$1[REDACTED]');



  return sanitized;

}



export default function NativeTerminalConsole({

  initialTool = null,

  initialTarget = '',

  className = ''

}) {

  // Host capabilities state

  const [hostCaps, setHostCaps] = useState(null);



  // Authoritative native registry annotated with real-time host capability availability

  const activeRegistry = useMemo(() => getAnnotatedNativeRegistry(hostCaps), [hostCaps]);



  // Input & selected tool state

  const [commandInput, setCommandInput] = useState(initialTarget || '');

  const [selectedTool, setSelectedTool] = useState(() => {

    if (initialTool) {

      const resolved = resolveNativeTool(initialTool.id || initialTool.cmd || initialTool);

      if (resolved) return resolved;

    }

    return TERMINAL_NATIVE_REGISTRY[0];

  });



  // Keep selectedTool synchronized with annotated activeRegistry state

  const currentTool = useMemo(() => {

    return activeRegistry.find(t => t.id === selectedTool.id) || selectedTool;

  }, [activeRegistry, selectedTool]);



  // Terminal log stream items: { id, timestamp, tool, target, command, executionId, state, durationMs, exitCode, output, error }

  const [historyItems, setHistoryItems] = useState([

    {

      id: 'init_welcome',

      timestamp: new Date().toLocaleTimeString(),

      tool: 'system',

      target: 'localhost',

      command: 'sys.welcome',

      state: 'COMPLETED',

      durationMs: 0,

      exitCode: 0,

      output: [

        '================================================================================',

        '⚡ CYBERSHIELD X — CENTRALIZED NATIVE SECURITY TERMINAL WORKSTATION',

        '================================================================================',

        '[*] Host Architecture: Secure Native Process Engine (shell: false, zero-trust sandbox)',

        '[*] Execution Target : Direct OS Binaries via POST /api/terminal/execute-native',

        '[*] Native Tools     : nmap, dig, curl, whois, openssl, ping, traceroute (Verified Only)',

        '[*] Product Catalog  : 111 Canonical Tools reside in Security Tools (/toolkit)',

        '[*] Shortcuts        : [Enter] Execute | [Esc] Abort | [Ctrl+L] Clear | [↑ / ↓] History',

        '[*] Type "help" or "tools" for tactical command reference.',

        '================================================================================',

        ''

      ].join('\n')

    }

  ]);



  // Execution Lifecycle State: 'IDLE' | 'RUNNING' | 'CANCELLING' | 'CANCELLED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT'

  const [isRunning, setIsRunning] = useState(false);

  const [executionState, setExecutionState] = useState('IDLE');

  const [activeExecId, setActiveExecId] = useState(null);

  const [startTime, setStartTime] = useState(null);

  const [elapsedMs, setElapsedMs] = useState(0);



  // Command History (Up/Down arrow key cycling) — Strictly sanitized & session-scoped

  const [commandHistory, setCommandHistory] = useState(() => {

    try {

      if (typeof window !== 'undefined' && window.sessionStorage) {

        const saved = sessionStorage.getItem(STORAGE_KEY);

        if (saved) {

          const parsed = JSON.parse(saved);

          if (Array.isArray(parsed)) {

            return parsed.map(sanitizeCommandForHistory).filter(Boolean).slice(0, MAX_HISTORY);

          }

        }

      }

    } catch {

      // Corrupted storage fallback

    }

    return [];

  });

  const [historyIndex, setHistoryIndex] = useState(-1);



  // UI state

  const [copiedId, setCopiedId] = useState(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);



  // DOM Refs

  const logContainerRef = useRef(null);

  const inputRef = useRef(null);

  const isAutoScrollPausedRef = useRef(false);



  // Detect reduced motion preference

  useEffect(() => {

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {

      try {

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (mediaQuery) {

          setPrefersReducedMotion(Boolean(mediaQuery.matches));

          const handler = (e) => setPrefersReducedMotion(Boolean(e.matches));

          if (typeof mediaQuery.addEventListener === 'function') {

            mediaQuery.addEventListener('change', handler);

            return () => mediaQuery.removeEventListener('change', handler);

          }

        }

      } catch {}

    }

  }, []);



  // Clean legacy persistent unredacted localStorage keys on mount

  useEffect(() => {

    try {

      if (typeof window !== 'undefined' && window.localStorage) {

        localStorage.removeItem('cybershield_terminal_cmd_history');

      }

    } catch {}

  }, []);



  // Fetch host capabilities on mount

  useEffect(() => {

    let mounted = true;

    fetchHostCapabilities().then((caps) => {

      if (mounted && caps) {

        setHostCaps(caps);

      }

    }).catch(() => {});

    return () => { mounted = false; };

  }, []);



  // Sync initial tool/target props if changed

  useEffect(() => {

    if (initialTool) {

      const found = resolveNativeTool(initialTool.id || initialTool.alias || initialTool.cmd || initialTool);

      if (found) setSelectedTool(found);

    }

    if (initialTarget) {

      setCommandInput(initialTarget);

    }

  }, [initialTool, initialTarget]);



  // Stopwatch interval while running

  useEffect(() => {

    let timer = null;

    if (isRunning && startTime) {

      timer = setInterval(() => {

        setElapsedMs(Date.now() - startTime);

      }, 50);

    }

    return () => {

      if (timer) clearInterval(timer);

    };

  }, [isRunning, startTime]);



  // Auto-scroll logic with operator manual-scroll detection

  const handleScroll = useCallback(() => {

    if (!logContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;

    // If user scrolled up more than 60px from bottom, pause auto-scroll

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;

    setIsAutoScrollPaused(!isAtBottom);

    isAutoScrollPausedRef.current = !isAtBottom;

  }, []);



  const scrollToLatest = () => {

    if (logContainerRef.current) {

      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;

      setIsAutoScrollPaused(false);

      isAutoScrollPausedRef.current = false;

    }

  };



  useEffect(() => {

    if (!isAutoScrollPausedRef.current && logContainerRef.current) {

      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;

    }

  }, [historyItems, isRunning, elapsedMs]);



  // Persist command history to session storage (strictly sanitized and bounded)

  const saveToHistory = (cmd) => {

    if (!cmd || !cmd.trim()) return;

    const sanitized = sanitizeCommandForHistory(cmd);

    if (!sanitized) return;



    setCommandHistory(prev => {

      const filtered = prev.filter(c => c !== sanitized);

      const next = [sanitized, ...filtered].slice(0, MAX_HISTORY);

      try {

        if (typeof window !== 'undefined' && window.sessionStorage) {

          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));

        }

      } catch {}

      return next;

    });

    setHistoryIndex(-1);

  };



  // Clear session history storage

  const clearHistoryStorage = () => {

    setCommandHistory([]);

    setHistoryIndex(-1);

    try {

      if (typeof window !== 'undefined' && window.sessionStorage) {

        sessionStorage.removeItem(STORAGE_KEY);

      }

    } catch {}

  };



  // Keyboard navigation on input

  const handleKeyDown = (e) => {

    if (e.key === 'Enter') {

      e.preventDefault();

      handleRun();

    } else if (e.key === 'ArrowUp') {

      e.preventDefault();

      if (commandHistory.length === 0) return;

      const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);

      setHistoryIndex(nextIdx);

      setCommandInput(commandHistory[nextIdx]);

    } else if (e.key === 'ArrowDown') {

      e.preventDefault();

      if (historyIndex > 0) {

        const nextIdx = historyIndex - 1;

        setHistoryIndex(nextIdx);

        setCommandInput(commandHistory[nextIdx]);

      } else if (historyIndex === 0) {

        setHistoryIndex(-1);

        setCommandInput('');

      }

    } else if (e.key === 'Escape' && isRunning) {

      e.preventDefault();

      handleAbort();

    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {

      e.preventDefault();

      handleClear();

    }

  };



  // Parse command input (handles `tool target` or just `target` using selected tool)

  const parseCommand = (input) => {

    const raw = (input || '').trim();

    if (!raw) return null;



    // Check special system commands

    const lower = raw.toLowerCase();

    if (lower === 'clear' || lower === 'cls') return { isSpecial: true, action: 'clear' };

    if (lower === 'help') return { isSpecial: true, action: 'help' };

    if (lower === 'tools' || lower === 'list') return { isSpecial: true, action: 'tools' };

    if (lower === 'history -c' || lower === 'clear history' || lower === 'history clear') {

      return { isSpecial: true, action: 'history_clear' };

    }

    if (lower === 'history') return { isSpecial: true, action: 'history' };

    if (lower === 'status') return { isSpecial: true, action: 'status' };



    const tokens = raw.split(/\s+/);

    const firstToken = tokens[0].toLowerCase();

    const matchedTool = resolveNativeTool(firstToken);



    if (matchedTool) {

      const target = tokens.slice(1).join(' ').trim();

      return {

        tool: matchedTool,

        target: target || matchedTool.defaultTarget,

        fullCommand: raw

      };

    }



    // Check if the operator explicitly typed a command name that is NOT an authorized native tool

    const isLikelyTargetOnly = /^https?:\/\//i.test(firstToken) ||

      /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(firstToken) ||

      /\.[a-zA-Z]{2,}/.test(firstToken) ||

      firstToken.includes(':');



    if (!isLikelyTargetOnly && tokens.length > 1) {

      return {

        isRestricted: true,

        requestedTool: tokens[0],

        fullCommand: raw

      };

    }



    // Default to currently selected tool with entire input as target

    return {

      tool: currentTool,

      target: raw,

      fullCommand: `${currentTool.executable || currentTool.cmd || currentTool.id} ${raw}`

    };

  };



  // Execute Command

  const handleRun = async (overrideCommand = null) => {

    if (isRunning) return;



    const commandToRun = overrideCommand !== null ? overrideCommand : commandInput;

    const parsed = parseCommand(commandToRun);



    if (!parsed) return;



    // Handle special commands

    if (parsed.isSpecial) {

      if (parsed.action === 'clear') {

        handleClear();

        return;

      }

      if (parsed.action === 'help') {

        const toolHelpRows = activeRegistry.map(t => {

          const avail = t.availability === 'AVAILABLE' ? '[AVAILABLE]' : `[${t.availability}]`;

          return `  ${(t.executable || t.id).padEnd(12)} <target> - ${t.description} ${avail}`;

        }).join('\n');

        setHistoryItems(prev => [

          ...prev,

          {

            id: 'help_' + Date.now(),

            timestamp: new Date().toLocaleTimeString(),

            tool: 'system',

            target: 'help',

            command: 'help',

            state: 'COMPLETED',

            durationMs: 0,

            exitCode: 0,

            output: [

              '── CYBERSHIELD X TACTICAL COMMAND REFERENCE ─────────────────────────',

              'Supported Native Host Tools (7 verified capabilities):',

              toolHelpRows,

              '',

              'Built-in Shortcuts & Controls:',

              '  clear (or Ctrl+L)    - Clear the terminal screen buffer',

              '  tools                - Display detected host binaries & availability matrix',

              '  history              - Display recent command invocation history',

              '  history -c           - Purge command history from session storage',

              '  Esc                  - Abort actively running process (transmits SIGTERM)',

              '  ↑ / ↓                - Cycle through previously executed commands',

              '───────────────────────────────────────────────────────────────────────'

            ].join('\n')

          }

        ]);

        saveToHistory(commandToRun);

        setCommandInput('');

        return;

      }

      if (parsed.action === 'tools') {

        const toolRows = activeRegistry.map(t => {

          const availBadge = t.availability === 'AVAILABLE' ? '[AVAILABLE]' : `[${t.availability}]`;

          return `  ${(t.executable || t.id).padEnd(12)} : ${availBadge.padEnd(17)} | ${t.category.padEnd(16)} | ${t.description}`;

        }).join('\n');

        setHistoryItems(prev => [

          ...prev,

          {

            id: 'tools_' + Date.now(),

            timestamp: new Date().toLocaleTimeString(),

            tool: 'system',

            target: 'host',

            command: 'tools',

            state: 'COMPLETED',

            durationMs: 0,

            exitCode: 0,

            output: [

              '── NATIVE TERMINAL TOOL REGISTRY (7 VERIFIED CAPABILITIES) ──────────',

              'Only approved local security binaries are executable in this workstation.',

              '--------------------------------------------------------------------------------',

              toolRows,

              '--------------------------------------------------------------------------------',

              '[*] Note: The 111 canonical CyberShield tools represent the broader product catalog.',

              '[*] To view external alternatives & cloud services, visit Security Tools (/toolkit).'

            ].join('\n')

          }

        ]);

        saveToHistory(commandToRun);

        setCommandInput('');

        return;

      }

      if (parsed.action === 'history') {

        const histText = commandHistory.length > 0

          ? commandHistory.map((c, i) => `  ${(i + 1).toString().padStart(2, ' ')}. ${c}`).join('\n')

          : '  (History buffer is currently empty)';

        setHistoryItems(prev => [

          ...prev,

          {

            id: 'hist_' + Date.now(),

            timestamp: new Date().toLocaleTimeString(),

            tool: 'system',

            target: 'history',

            command: 'history',

            state: 'COMPLETED',

            durationMs: 0,

            exitCode: 0,

            output: `── RECENT COMMAND INVOCATION HISTORY ────────────────────────────────\n${histText}\n─────────────────────────────────────────────────────────────────────`

          }

        ]);

        setCommandInput('');

        return;

      }

      if (parsed.action === 'history_clear') {

        clearHistoryStorage();

        setHistoryItems(prev => [

          ...prev,

          {

            id: 'hist_clear_' + Date.now(),

            timestamp: new Date().toLocaleTimeString(),

            tool: 'system',

            target: 'history',

            command: commandToRun,

            state: 'COMPLETED',

            durationMs: 0,

            exitCode: 0,

            output: '[✔] Session command invocation history purged successfully from session storage.'

          }

        ]);

        setCommandInput('');

        return;

      }

      if (parsed.action === 'status') {

        const osInfo = hostCaps?.system ? `${hostCaps.system.hostOs} ${hostCaps.system.release || ''} (${hostCaps.system.arch || ''}) - Uptime: ${Math.round((hostCaps.system.uptimeSeconds || 0) / 3600)}h` : (hostCaps?.os ? `${hostCaps.os.platform} (${hostCaps.os.arch})` : 'Connected');

        const memInfo = hostCaps?.system?.memory ? `Free: ${hostCaps.system.memory.freeMb}MB / Total: ${hostCaps.system.memory.totalMb}MB (${hostCaps.system.memory.usagePercent}% Used)` : 'Monitored';

        setHistoryItems(prev => [

          ...prev,

          {

            id: 'status_' + Date.now(),

            timestamp: new Date().toLocaleTimeString(),

            tool: 'system',

            target: 'status',

            command: 'status',

            state: 'COMPLETED',

            durationMs: 0,

            exitCode: 0,

            output: `── HOST EXECUTION ENGINE STATUS ──────────────────────────────────────\n  OS Platform : ${osInfo}\n  Memory      : ${memInfo}\n  Security    : shell: false, strict argument validation, 10s process timeout\n─────────────────────────────────────────────────────────────────────`

          }

        ]);

        setCommandInput('');

        return;

      }

    }



    // Handle restricted commands (e.g. sqlmap, nikto, burp, bash, python, rm)

    if (parsed.isRestricted) {

      setHistoryItems(prev => [

        ...prev,

        {

          id: 'restr_' + Date.now(),

          timestamp: new Date().toLocaleTimeString(),

          tool: parsed.requestedTool,

          target: '',

          command: parsed.fullCommand,

          state: 'FAILED',

          durationMs: 0,

          exitCode: 1,

          output: [

            `[!] RESTRICTED COMMAND: Tool '${parsed.requestedTool}' is not authorized for native terminal execution.`,

            `[-] RESTRICTED: This executable is outside the native terminal allowlist. Use /toolkit for canonical product tools.`,

            `[-] This workstation executes ONLY verified host security binaries (nmap, dig, curl, whois, openssl, ping, traceroute).`,

            `[-] The 111 canonical CyberShield tools represent the broader catalog available at Security Tools (/toolkit).`

          ].join('\n')

        }

      ]);

      saveToHistory(commandToRun);

      setCommandInput('');

      return;

    }



    const { tool, target, fullCommand } = parsed;



    // Check availability state on execution host

    const toolAvail = getToolAvailability(tool.id, hostCaps);

    if (toolAvail === 'NOT INSTALLED' || toolAvail === 'UNAVAILABLE') {

      setHistoryItems(prev => [

        ...prev,

        {

          id: 'unavail_' + Date.now(),

          timestamp: new Date().toLocaleTimeString(),

          tool: tool.id,

          target,

          command: fullCommand,

          state: 'FAILED',

          durationMs: 0,

          exitCode: 1,

          output: [

            `[!] UNAVAILABLE: Command '${tool.executable || tool.cmd || tool.id}' is not available on this host.`,

            `[-] HostEnvironmentService detected that this binary is missing from system PATH.`,

            `[-] To execute this tool natively, install '${tool.executable || tool.cmd || tool.id}' on the host machine or use an external service.`

          ].join('\n')

        }

      ]);

      saveToHistory(commandToRun);

      setCommandInput('');

      return;

    }



    // Strict client-side pre-validation

    if (!target || /[;&|`$\(\)<>\n\r\t\\!'"]/.test(target)) {

      setHistoryItems(prev => [

        ...prev,

        {

          id: 'err_' + Date.now(),

          timestamp: new Date().toLocaleTimeString(),

          tool: tool.id,

          target,

          command: fullCommand,

          state: 'FAILED',

          durationMs: 0,

          exitCode: 1,

          output: `[!] VALIDATION ERROR: The command or target was rejected by the security policy.\n[-] Target '${target}' contains illegal shell metacharacters or is empty. Injection protection strictly enforced.`

        }

      ]);

      return;

    }



    const execId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const startTimestamp = Date.now();

    setActiveExecId(execId);

    setStartTime(startTimestamp);

    setElapsedMs(0);

    setIsRunning(true);

    setExecutionState('RUNNING');

    saveToHistory(fullCommand);

    setCommandInput('');



    // Add entry in RUNNING state

    const entryId = 'run_' + execId;

    setHistoryItems(prev => [

      ...prev,

      {

        id: entryId,

        timestamp: new Date().toLocaleTimeString(),

        tool: tool.id,

        target,

        command: fullCommand,

        executionId: execId,

        state: 'RUNNING',

        durationMs: 0,

        exitCode: null,

        output: `[*] Initiating execution: ${tool.cmd} ${target}...\n[*] Connecting to host runner via POST /api/terminal/execute-native...`

      }

    ]);



    try {

      const response = await executeNativeTool(tool.id, target, [], execId);

      const finishDuration = Date.now() - startTimestamp;

      const resData = response?.data || response;

      const isSuccess = Boolean(response?.success || resData?.status === 'COMPLETED');

      const isTimeout = resData?.status === 'TIMEOUT' || response?.status === 'TIMEOUT';

      const finalState = isSuccess ? 'COMPLETED' : (isTimeout ? 'TIMEOUT' : 'FAILED');



      let finalOutput = resData?.output || resData?.stdout || response?.output || '';

      if (!finalOutput) {

        if (isSuccess) {

          finalOutput = '[✔] Process completed with zero standard output.';

        } else if (isTimeout) {

          finalOutput = '[!] TIMEOUT: Native execution exceeded the permitted execution window.\n[-] Host process was terminated after 10-second security ceiling.';

        } else {

          finalOutput = '[!] BACKEND FAILURE: Execution finished with non-zero exit code.\n[-] Output stream is empty.';

        }

      }



      setHistoryItems(prev => prev.map(item => {

        if (item.id === entryId) {

          return {

            ...item,

            state: finalState,

            durationMs: resData?.durationMs || finishDuration,

            exitCode: resData?.exitCode ?? (isSuccess ? 0 : 1),

            output: finalOutput

          };

        }

        return item;

      }));



      setExecutionState(finalState);

    } catch (err) {

      const finishDuration = Date.now() - startTimestamp;

      const errMsg = err.response?.data?.error || err.message || 'Execution failed';

      const isTimeout = errMsg.toLowerCase().includes('timeout') || err.response?.status === 504;

      const finalState = isTimeout ? 'TIMEOUT' : 'FAILED';

      const errorOutput = isTimeout

        ? '[!] TIMEOUT: Native execution exceeded the permitted execution window.\n[-] Host process was terminated after 10-second security ceiling.'

        : `[!] BACKEND FAILURE: ${errMsg}\n[-] Technical Endpoint: POST /api/terminal/execute-native`;



      setHistoryItems(prev => prev.map(item => {

        if (item.id === entryId) {

          return {

            ...item,

            state: finalState,

            durationMs: finishDuration,

            exitCode: 1,

            output: errorOutput

          };

        }

        return item;

      }));



      setExecutionState(finalState);

    } finally {

      setIsRunning(false);

      setActiveExecId(null);

    }

  };



  // Abort running command via SIGTERM

  const handleAbort = async () => {

    if (!activeExecId || !isRunning) return;

    setExecutionState('CANCELLING');



    try {

      const cancelRes = await cancelTerminalExecution(activeExecId);

      const wasCancelled = cancelRes?.cancelled || cancelRes?.success;

      setHistoryItems(prev => prev.map(item => {

        if (item.executionId === activeExecId) {

          return {

            ...item,

            state: 'CANCELLED',

            durationMs: elapsedMs,

            exitCode: 130,

            output: item.output + `\n\n[!] CANCELLED: Execution was stopped by the operator.\n[-] Transmitted SIGTERM to runner (Process terminated: ${wasCancelled ? 'SUCCESS' : 'COMPLETE'}).`

          };

        }

        return item;

      }));

      setExecutionState('CANCELLED');

    } catch (err) {

      setHistoryItems(prev => prev.map(item => {

        if (item.executionId === activeExecId) {

          return {

            ...item,

            state: 'CANCELLED',

            durationMs: elapsedMs,

            exitCode: 130,

            output: item.output + `\n\n[!] CANCELLED: Execution was stopped by the operator.`

          };

        }

        return item;

      }));

      setExecutionState('CANCELLED');

    } finally {

      setIsRunning(false);

      setActiveExecId(null);

    }

  };



  // Clear Screen

  const handleClear = () => {

    setHistoryItems([]);

    setExecutionState('IDLE');

    setElapsedMs(0);

    inputRef.current?.focus();

  };



  // Copy item output

  const handleCopy = (item) => {

    const text = `${item.command}\n\n${item.output}`;

    navigator.clipboard.writeText(text);

    setCopiedId(item.id);

    setTimeout(() => setCopiedId(null), 2000);

  };



  // Re-run an earlier command

  const handleRerun = (item) => {

    if (isRunning) return;

    handleRun(item.command);

  };



  return (

    <div className={`flex flex-col h-full bg-[#020817] border border-cyan-500/25 rounded-2xl shadow-2xl overflow-hidden font-mono select-text ${className}`}>

      {/* ── Top Tactical Header Bar ────────────────────────────────────────── */}

      <div className="bg-[#040e24] border-b border-cyan-500/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none flex-shrink-0">

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-1.5">

            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />

            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />

            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />

          </div>



          <div className="h-4 w-[1px] bg-white/10 mx-1" />



          <div className="flex items-center gap-2">

            <TerminalIcon size={16} className="text-cyan-400" />

            <span className="font-display font-black text-xs text-white tracking-widest uppercase">

              NATIVE CYBERSOC TERMINAL

            </span>

            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold">

              v62.2.0 • LOCAL WORKSTATION

            </span>

          </div>

        </div>



        {/* State Indicators & Actions */}

        <div className="flex items-center gap-2 text-xs">

          {/* Execution Stopwatch / State Badge */}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">

            {isRunning ? (

              <>

                <span className={`w-2 h-2 rounded-full bg-amber-400 ${prefersReducedMotion ? '' : 'animate-ping'}`} />

                <span className="text-amber-300 text-[10px] font-bold uppercase">RUNNING</span>

                <span className="text-white text-[11px] font-mono">

                  {(elapsedMs / 1000).toFixed(2)}s

                </span>

              </>

            ) : (

              <>

                <span className={`w-2 h-2 rounded-full ${

                  executionState === 'COMPLETED' ? 'bg-emerald-400' :

                  executionState === 'FAILED' ? 'bg-rose-500' :

                  executionState === 'TIMEOUT' ? 'bg-amber-400' :

                  executionState === 'CANCELLED' ? 'bg-amber-400' : 'bg-slate-500'

                }`} />

                <span className="text-slate-300 text-[10px] font-bold uppercase">{executionState}</span>

              </>

            )}

          </div>



          {/* Abort / Stop Button */}

          {isRunning && (

            <button

              onClick={handleAbort}

              aria-label="Abort Running Command (Esc)"

              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-all"

            >

              <Square size={11} className="fill-rose-400" />

              <span>ABORT [Esc]</span>

            </button>

          )}



          {/* Clear Button */}

          <button

            onClick={handleClear}

            aria-label="Clear Buffer (Ctrl+L)"

            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"

            title="Clear Terminal Buffer (Ctrl+L)"

          >

            <Trash2 size={13} />

          </button>

        </div>

      </div>



      {/* ── Native Host Tool Quick-Selector Bar ────────────────────────────── */}

      <div className="bg-[#030a1b] border-b border-white/5 px-3 py-2 flex items-center gap-2 overflow-x-auto select-none flex-shrink-0 text-xs custom-scrollbar">

        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0">

          <Server size={12} className="text-cyan-400" />

          <span>NATIVE TOOLS:</span>

        </div>

        {activeRegistry.map(t => {

          const isSelected = selectedTool.id === t.id;

          const isAvailable = t.availability === 'AVAILABLE';

          const isNotInstalled = t.availability === 'NOT INSTALLED' || t.availability === 'UNAVAILABLE';

          return (

            <button

              key={t.id}

              onClick={() => {

                setSelectedTool(t);

                setCommandInput(t.defaultTarget || '');

                inputRef.current?.focus();

              }}

              title={`${t.label} [${t.category}] (${t.availability})\n${t.description}\nSafe Example: ${t.executable || t.cmd || t.id} ${t.defaultTarget || ''}`}

              aria-label={`Select ${t.label} (${t.availability})`}

              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 whitespace-nowrap border ${

                isSelected

                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(0,212,255,0.2)]'

                  : isNotInstalled

                  ? 'bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/5 border-white/5 opacity-70'

                  : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/10 border-white/5'

              }`}

            >

              {/* Live status dot */}

              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${

                isAvailable ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' :

                isNotInstalled ? 'bg-amber-400/80' : 'bg-rose-500'

              }`} />

              <span className="font-semibold">{t.executable || t.cmd || t.id}</span>

              <span className="text-[9px] text-slate-500 hidden sm:inline">({t.category})</span>

              {isNotInstalled && (

                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase font-semibold">

                  OFFLINE

                </span>

              )}

            </button>

          );

        })}

      </div>



      {/* ── Terminal Output Viewport ────────────────────────────────────────── */}

      <div className="relative flex-1 flex flex-col min-h-0">

        <div

          ref={logContainerRef}

          onScroll={handleScroll}

          role="region"

          aria-label="Terminal Output Stream"

          aria-live="polite"

          className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-6 bg-gradient-to-b from-[#020817] via-[#02091c] to-[#010614]"

        >

          {historyItems.map((item) => {

            const isCurrentRunning = item.state === 'RUNNING';

            const isSuccess = item.state === 'COMPLETED';

            const isFailed = item.state === 'FAILED';

            const isTimeout = item.state === 'TIMEOUT';

            const isCancelled = item.state === 'CANCELLED';



            return (

              <div

                key={item.id}

                className="space-y-2 group/entry border-l-2 pl-3 transition-colors border-cyan-500/30 hover:border-cyan-400"

              >

                {/* Command Invocation Header */}

                <div className="flex items-center justify-between text-xs font-mono select-none">

                  <div className="flex items-center gap-2">

                    <span className="text-cyan-400 font-bold">nexus@cybershield:~$</span>

                    <span className="text-white font-semibold">{item.command}</span>

                  </div>



                  {/* Meta details & action buttons */}

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">

                    <span>{item.timestamp}</span>



                    {item.durationMs !== null && item.durationMs > 0 && (

                      <span className="text-slate-400">({item.durationMs}ms)</span>

                    )}



                    {/* Status badge */}

                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${

                      isCurrentRunning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :

                      isSuccess ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :

                      isTimeout ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :

                      isFailed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :

                      isCancelled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :

                      'bg-white/5 text-slate-400'

                    }`}>

                      {item.state}

                    </span>



                    {/* Rerun Button */}

                    {!isRunning && item.tool !== 'system' && (

                      <button

                        onClick={() => handleRerun(item)}

                        title="Re-run this command"

                        aria-label="Re-run this command"

                        className="opacity-0 group-hover/entry:opacity-100 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-opacity"

                      >

                        <RefreshCw size={11} />

                      </button>

                    )}



                    {/* Copy Button */}

                    <button

                      onClick={() => handleCopy(item)}

                      title="Copy output to clipboard"

                      aria-label="Copy output to clipboard"

                      className="opacity-0 group-hover/entry:opacity-100 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-opacity"

                    >

                      {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}

                    </button>

                  </div>

                </div>



                {/* Formatted Output or Running HUD */}

                <div className="pl-1">

                  {isCurrentRunning ? (

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">

                      <div className="flex items-center justify-between text-xs">

                        <div className="flex items-center gap-2">

                          <span className={`w-2.5 h-2.5 rounded-full bg-amber-400 ${prefersReducedMotion ? '' : 'animate-ping'}`} />

                          <span className="font-bold text-amber-300 uppercase tracking-wider">

                            LIVE HOST PROCESS RUNNING

                          </span>

                        </div>

                        <div className="flex items-center gap-3">

                          <span className="text-slate-400 text-[11px] font-mono">

                            Elapsed: <strong className="text-white">{(elapsedMs / 1000).toFixed(2)}s</strong>

                          </span>

                          <button

                            onClick={handleAbort}

                            aria-label="Abort Running Command"

                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-all"

                          >

                            <Square size={10} className="fill-rose-400" />

                            <span>ABORT [Esc]</span>

                          </button>

                        </div>

                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-4">

                        <span><strong>Tool:</strong> <span className="text-cyan-300">{item.tool}</span></span>

                        <span><strong>Target:</strong> <span className="text-white">{item.target}</span></span>

                        <span><strong>Engine:</strong> <span className="text-emerald-400">shell: false</span></span>

                      </div>

                      <div className="pt-2 border-t border-amber-500/20 text-xs text-amber-200/90 font-mono whitespace-pre-wrap leading-relaxed">

                        {item.output}

                      </div>

                    </div>

                  ) : (

                    <TerminalOutputFormatter

                      output={item.output}

                      toolName={item.tool}

                    />

                  )}

                </div>

              </div>

            );

          })}

        </div>



        {/* Floating Jump to Latest Button */}

        {isAutoScrollPaused && (

          <div className="absolute bottom-4 right-6 z-30">

            <button

              onClick={scrollToLatest}

              aria-label="Jump to latest terminal output"

              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold shadow-[0_0_15px_rgba(0,212,255,0.5)] transition-all"

            >

              <ArrowDown size={12} />

              <span>Jump to Latest ↓</span>

            </button>

          </div>

        )}

      </div>



      {/* ── Active Target & Command Telemetry Bar ──────────────────────────── */}

      <div className="bg-[#020713] border-t border-cyan-500/10 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono select-none flex-shrink-0">

        <div className="flex items-center gap-3 overflow-hidden text-ellipsis">

          {/* TOOL */}

          <div className="flex items-center gap-1 text-slate-400">

            <span className="text-slate-500 font-semibold">TOOL:</span>

            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold">

              {currentTool.executable || currentTool.cmd || currentTool.id}

            </span>

            <span className="text-slate-600 hidden md:inline">({currentTool.category})</span>

          </div>



          {/* TARGET */}

          <div className="flex items-center gap-1 text-slate-400">

            <span className="text-slate-500 font-semibold">TARGET:</span>

            <span className="text-white font-medium max-w-[180px] truncate">

              {commandInput.trim() || <span className="text-slate-600 italic">none (required)</span>}

            </span>

          </div>



          {/* COMMAND */}

          <div className="hidden lg:flex items-center gap-1 text-slate-400">

            <span className="text-slate-500 font-semibold">COMMAND:</span>

            <span className="text-emerald-400/90 font-mono truncate max-w-[280px]">

              {currentTool.executable || currentTool.cmd || currentTool.id} {commandInput.trim() || currentTool.defaultTarget || ''}

            </span>

          </div>

        </div>



        {/* Safe Template Hint / Quick Populate */}

        {currentTool.defaultTarget && (

          <button

            type="button"

            onClick={() => {

              setCommandInput(currentTool.defaultTarget);

              inputRef.current?.focus();

            }}

            title="Populate safe example target"

            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"

          >

            <span className="text-slate-500">Safe Example:</span>

            <span className="text-cyan-400 underline decoration-cyan-500/30">{currentTool.defaultTarget}</span>

          </button>

        )}

      </div>



      {/* ── Tactical Command Input Bar ──────────────────────────────────────── */}

      <div className="bg-[#030919] border-t border-cyan-500/20 p-3 select-none flex-shrink-0">

        <div className="flex items-center gap-2">

          {/* Active Tool Badge Prompt */}

          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${

            currentTool.availability === 'NOT INSTALLED' || currentTool.availability === 'UNAVAILABLE'

              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'

              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'

          }`}>

            <span>nexus@cybershield:~$</span>

            <span className="text-white font-mono">{currentTool.executable || currentTool.cmd || currentTool.id}</span>

            {(currentTool.availability === 'NOT INSTALLED' || currentTool.availability === 'UNAVAILABLE') && (

              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">

                OFFLINE

              </span>

            )}

          </div>



          {/* Target Input Field */}

          <div className="relative flex-1">

            <input

              ref={inputRef}

              type="text"

              value={commandInput}

              onChange={(e) => setCommandInput(e.target.value)}

              onKeyDown={handleKeyDown}

              disabled={isRunning}

              placeholder={

                currentTool.availability === 'NOT INSTALLED' || currentTool.availability === 'UNAVAILABLE'

                  ? `${currentTool.label} is NOT INSTALLED on execution host`

                  : (currentTool.placeholder || 'Enter target or command')

              }

              aria-label="Terminal Target or Command Input"

              autoFocus

              className="w-full bg-[#020612] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"

            />

          </div>



          {/* Action Button: Run or Abort */}

          {isRunning ? (

            <button

              onClick={handleAbort}

              aria-label="Abort Running Command"

              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"

            >

              <Square size={13} className="fill-white" />

              <span>Abort</span>

            </button>

          ) : (

            <button

              onClick={() => handleRun()}

              disabled={!commandInput.trim() || currentTool.availability === 'NOT INSTALLED' || currentTool.availability === 'UNAVAILABLE'}

              aria-label={currentTool.availability === 'NOT INSTALLED' ? 'Tool not installed on execution host' : 'Execute Command'}

              title={currentTool.availability === 'NOT INSTALLED' ? 'Binary not installed on execution host' : 'Execute Command'}

              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,212,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"

            >

              <Play size={13} className="fill-slate-950" />

              <span>{currentTool.availability === 'NOT INSTALLED' || currentTool.availability === 'UNAVAILABLE' ? 'Unavailable' : 'Execute'}</span>

            </button>

          )}

        </div>



        {/* Tactical Footer / Hotkey Hints */}

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1 font-mono">

          <div className="flex items-center gap-3">

            <span><strong className="text-slate-400">Enter:</strong> Run</span>

            <span><strong className="text-slate-400">↑ / ↓:</strong> History</span>

            <span><strong className="text-slate-400">Ctrl+L:</strong> Clear</span>

            <span><strong className="text-slate-400">Esc:</strong> Abort</span>

          </div>

          <div className="flex items-center gap-2">

            <Shield size={11} className="text-emerald-400" />

            <span className="text-emerald-400/80 font-bold">NATIVE ZERO-TRUST ENGINE ACTIVE</span>

          </div>

        </div>

      </div>

    </div>

  );

}
