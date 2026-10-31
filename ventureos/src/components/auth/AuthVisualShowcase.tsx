import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  Camera,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Activity,
  DollarSign,
  ArrowUpRight,
  FileText,
  Sparkles
} from 'lucide-react';

interface AuthVisualShowcaseProps {
  pageType?: 'login' | 'signup' | 'forgot-password';
}

export const AuthVisualShowcase: React.FC<AuthVisualShowcaseProps> = ({
  pageType = 'login'
}) => {
  const [pulseIndex, setPulseIndex] = useState(0);

  // Periodic cycle of simulated live events
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col justify-between h-full p-8 lg:p-12 z-10 overflow-hidden select-none">
      {/* ── Top Header: Brand Identity ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#8B5CF6] shadow-[0_0_24px_rgba(79,140,255,0.4)] border border-white/20">
            <Zap size={22} className="text-white fill-white/20 animate-pulse" />
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#8B5CF6] opacity-30 blur-sm -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-[#F4F7FF]">
                Venture<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#36D6E7]">OS</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 font-semibold tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-[#9AA9C2] font-medium">Autonomous Business Intelligence</p>
          </div>
        </div>

        {/* Live System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111B2E]/90 border border-[#162238] shadow-inner backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-[#9AA9C2]">NETWORK ONLINE</span>
        </div>
      </div>

      {/* ── Middle: Main Visual Showcase & Technical Diagram ── */}
      <div className="my-auto py-6">
        {/* Core Heading & Pitch */}
        <div className="max-w-md mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-semibold mb-3">
            <Sparkles size={12} />
            <span>Next-Gen Startup Architecture</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F4F7FF] leading-[1.18] mb-3">
            Your business.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] via-[#36D6E7] to-[#8B5CF6]">
              One intelligent
            </span>{' '}
            operating system.
          </h1>
          <p className="text-sm text-[#9AA9C2] leading-relaxed">
            Manage clients, track real-time cash flow, capture physical receipts with AI vision, and make data-driven decisions with zero friction.
          </p>
        </div>

        {/* ── Dynamic Technical HUD & Connected Nodes Graphic ── */}
        <div className="relative rounded-2xl bg-[#0D1424]/85 border border-[#162238] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden group">
          {/* Subtle Ambient Glow Behind Node Card */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#4F8CFF]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Grid lines background decoration inside the card */}
          <div 
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #4F8CFF 1px, transparent 1px), linear-gradient(to bottom, #4F8CFF 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Header of HUD */}
          <div className="relative flex items-center justify-between pb-3 mb-4 border-b border-[#162238]/80 text-xs font-mono text-[#9AA9C2]">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#36D6E7]" />
              <span>LIVE_TELEMETRY_ENGINE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                ACTIVE PIPELINE
              </span>
            </div>
          </div>

          {/* Interactive Connected Nodes Container */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3.5 z-10">
            {/* Node 1: Financial Telemetry */}
            <div className={`p-3.5 rounded-xl border transition-all duration-500 ${
              pulseIndex === 0 
                ? 'bg-[#111B2E] border-[#4F8CFF]/60 shadow-[0_0_15px_rgba(79,140,255,0.2)]' 
                : 'bg-[#111B2E]/60 border-[#162238] hover:border-[#4F8CFF]/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#9AA9C2] uppercase tracking-wider">Revenue Pulse</span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <ArrowUpRight size={12} className="mr-0.5" /> +28.4%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-[#F4F7FF] tracking-tight mb-1">
                $48,250<span className="text-xs text-[#9AA9C2] font-normal"> / mo</span>
              </div>
              {/* Mini SVG Sparkline */}
              <div className="h-8 w-full mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 28" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,22 Q 15,18 30,19 T 60,10 T 85,12 T 100,3 L 100,28 L 0,28 Z"
                    fill="url(#revenueGrad)"
                  />
                  <path
                    d="M 0,22 Q 15,18 30,19 T 60,10 T 85,12 T 100,3"
                    fill="none"
                    stroke="#4F8CFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="3" r="3" fill="#36D6E7" className="animate-ping" />
                  <circle cx="100" cy="3" r="2.5" fill="#36D6E7" />
                </svg>
              </div>
            </div>

            {/* Node 2: Venture Vision OCR Engine */}
            <div className={`p-3.5 rounded-xl border transition-all duration-500 relative overflow-hidden ${
              pulseIndex === 1 
                ? 'bg-[#111B2E] border-[#36D6E7]/60 shadow-[0_0_15px_rgba(54,214,231,0.2)]' 
                : 'bg-[#111B2E]/60 border-[#162238] hover:border-[#36D6E7]/30'
            }`}>
              {/* Animated Laser Scanner Bar */}
              <div 
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#36D6E7] to-transparent pointer-events-none opacity-75"
                style={{
                  top: pulseIndex === 1 ? '70%' : '20%',
                  transition: 'top 2s ease-in-out',
                  boxShadow: '0 0 8px #36D6E7'
                }}
              />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Camera size={14} className="text-[#36D6E7]" />
                  <span className="text-[11px] font-medium text-[#9AA9C2] uppercase tracking-wider">Vision OCR</span>
                </div>
                <span className="text-[10px] font-mono text-[#36D6E7] bg-[#36D6E7]/10 px-1.5 py-0.5 rounded border border-[#36D6E7]/20">
                  99.4% MATCH
                </span>
              </div>
              <div className="text-xs font-semibold text-[#F4F7FF] truncate">
                Invoice #INV-2026-09
              </div>
              <div className="text-[11px] text-[#9AA9C2] mt-0.5 flex justify-between items-center">
                <span>Acme Global Tech</span>
                <span className="font-mono text-emerald-400 font-semibold">$3,450.00</span>
              </div>
              <div className="mt-2 text-[10px] text-[#9AA9C2] font-mono flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span>Auto-extracted into Expenses (0.42s)</span>
              </div>
            </div>

            {/* Node 3: Venture AI Autonomous Decision */}
            <div className={`p-3.5 rounded-xl border transition-all duration-500 md:col-span-2 ${
              pulseIndex === 2 
                ? 'bg-[#111B2E] border-[#8B5CF6]/60 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                : 'bg-[#111B2E]/60 border-[#162238] hover:border-[#8B5CF6]/30'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                    <Brain size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#F4F7FF]">Venture AI Autonomous Copilot</span>
                </div>
                <span className="text-[10px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full border border-[#8B5CF6]/30">
                  GEMINI 1.5 PRO
                </span>
              </div>
              <p className="text-[12px] text-[#9AA9C2] leading-snug">
                &ldquo;<span className="text-[#F4F7FF] font-medium">Cash runway extended to 18.2 months.</span> Client retention up 14% with 0 pending overdue receivables.&rdquo;
              </p>
            </div>
          </div>

          {/* Micro Telemetry Footer */}
          <div className="mt-4 pt-3 border-t border-[#162238] flex items-center justify-between text-[11px] text-[#9AA9C2] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-pulse" />
              <span>ORBITAL_SYNC // 14ms LATENCY</span>
            </span>
            <span className="text-[#36D6E7]">AES-256 VAULT</span>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          {[
            { icon: DollarSign, label: 'Realtime P&L', value: 'Instant' },
            { icon: Camera, label: 'Webcam OCR', value: 'Multi-Format' },
            { icon: ShieldCheck, label: 'Data Privacy', value: 'RLS Isolated' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col p-2.5 rounded-xl bg-[#111B2E]/50 border border-[#162238] backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5 text-[#9AA9C2] mb-1">
                  <Icon size={13} className="text-[#4F8CFF]" />
                  <span className="text-[11px] font-medium truncate">{item.label}</span>
                </div>
                <span className="text-xs font-semibold font-mono text-[#F4F7FF]">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Footer: Version & Assurance ── */}
      <div className="pt-4 border-t border-[#162238]/60 flex items-center justify-between text-xs text-[#9AA9C2]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-[#162238] border border-[#162238] text-[10px] font-mono text-[#4F8CFF] font-semibold">
            VentureOS v1.0.4
          </span>
          <span className="hidden sm:inline">Engineered for High-Growth Startups</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>SOC2 Type II Ready</span>
        </div>
      </div>
    </div>
  );
};

export default AuthVisualShowcase;
