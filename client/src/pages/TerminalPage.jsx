import React, { useState, useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import {

  Terminal, Shield, Cpu, Activity, Server,

  ExternalLink, CheckCircle2, AlertTriangle, HardDrive

} from 'lucide-react';

import NativeTerminalConsole from '../components/terminal/NativeTerminalConsole';

import { fetchHostCapabilities } from '../services/terminalExecutionService';



export default function TerminalPage() {

  const [searchParams] = useSearchParams();

  const initialToolParam = searchParams.get('tool');

  const initialTargetParam = searchParams.get('target');



  const [hostCaps, setHostCaps] = useState(null);

  const [loadingCaps, setLoadingCaps] = useState(true);



  useEffect(() => {

    let mounted = true;

    fetchHostCapabilities()

      .then((caps) => {

        if (mounted) {

          setHostCaps(caps);

          setLoadingCaps(false);

        }

      })

      .catch(() => {

        if (mounted) setLoadingCaps(false);

      });

    return () => { mounted = false; };

  }, []);



  return (

    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────── */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/15 pb-4">

        <div>

          <div className="flex items-center gap-2.5">

            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.2)]">

              <Terminal size={22} />

            </div>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="font-display text-xl sm:text-2xl font-black tracking-wider text-white uppercase">

                  NATIVE CYBERSOC TERMINAL

                </h1>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase">

                  HOST NATIVE

                </span>

              </div>

              <p className="font-mono text-slate-400 text-xs mt-0.5">

                Authoritative local security binary execution interface • Direct OS process runner

              </p>

            </div>

          </div>

        </div>



        {/* Host Quick Telemetry Badge */}

        <div className="flex items-center gap-3 font-mono text-xs">

          <div className="px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-500/20 flex items-center gap-2.5">

            <Server size={14} className="text-cyan-400" />

            <div>

              <span className="text-[10px] text-slate-500 block uppercase font-bold">Execution Host</span>

              <span className="text-white font-bold">

                {hostCaps?.os ? `${hostCaps.os.platform} (${hostCaps.os.arch})` : 'Connecting...'}

              </span>

            </div>

          </div>



          <div className="px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-500/20 flex items-center gap-2.5">

            <Shield size={14} className="text-emerald-400" />

            <div>

              <span className="text-[10px] text-slate-500 block uppercase font-bold">Security Boundary</span>

              <span className="text-emerald-300 font-bold">shell: false (Whitelisted)</span>

            </div>

          </div>

        </div>

      </div>



      {/* ── Main Terminal Workstation Console ───────────────────────── */}

      <div className="h-[calc(100vh-15rem)] min-h-[580px] w-full">

        <NativeTerminalConsole

          initialTool={initialToolParam ? { id: initialToolParam } : null}

          initialTarget={initialTargetParam || ''}

          className="h-full"

        />

      </div>

    </div>

  );

}
