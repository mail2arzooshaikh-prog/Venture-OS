import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Camera,
  Cpu,
  TrendingUp,
  FileText,
  CheckSquare,
  ArrowRight,
  Zap,
  BarChart2,
  Star,
} from 'lucide-react';
import VentureGrid from '../components/background/VentureGrid';

// ─── Logo ─────────────────────────────────────────────────────────────────────
const VentureLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon
      points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
      fill="url(#logo_grad)"
      stroke="rgba(79,140,255,0.4)"
      strokeWidth="1"
    />
    <defs>
      <linearGradient id="logo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F8CFF" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <text
      x="16"
      y="21"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="700"
      fontFamily="system-ui"
    >
      V
    </text>
  </svg>
);

// ─── Mini Dashboard Preview ────────────────────────────────────────────────────
const DashboardPreview: React.FC = () => (
  <div
    style={{
      background: 'rgba(13,20,36,0.95)',
      border: '1px solid rgba(79,140,255,0.2)',
      borderRadius: '16px',
      padding: '20px',
      width: '100%',
      maxWidth: '680px',
      margin: '0 auto',
      boxShadow:
        '0 0 60px rgba(79,140,255,0.1), 0 40px 80px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Demo badge */}
    <span
      style={{
        position: 'absolute',
        top: '12px',
        right: '14px',
        background: 'rgba(79,140,255,0.12)',
        border: '1px solid rgba(79,140,255,0.25)',
        color: '#4F8CFF',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        padding: '2px 8px',
        borderRadius: '20px',
      }}
    >
      DEMO PREVIEW
    </span>

    {/* Window chrome */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', opacity: 0.8 }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', opacity: 0.8 }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', opacity: 0.8 }} />
      <div
        style={{
          flex: 1,
          marginLeft: '8px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '6px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>ventureos.app/dashboard</span>
      </div>
    </div>

    {/* Stat pills row */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
      {[
        { label: 'Clients Active', value: '24', color: '#4F8CFF' },
        { label: 'Revenue', value: '$18,420', color: '#10B981' },
        { label: 'Pending', value: '3', color: '#F59E0B' },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${s.color}30`,
            borderRadius: '10px',
            padding: '10px 14px',
            flex: '1',
            minWidth: '120px',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginBottom: '4px' }}>
            {s.label}
          </div>
          <div style={{ color: s.color, fontSize: '18px', fontWeight: 700 }}>{s.value}</div>
        </div>
      ))}
    </div>

    {/* Revenue chart */}
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>
          Revenue Overview
        </span>
        <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 600 }}>+12.4%</span>
      </div>
      <svg width="100%" height="70" viewBox="0 0 600 70" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chart_fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,60 L60,52 L120,55 L180,40 L240,44 L300,30 L360,28 L420,18 L480,20 L540,10 L600,8 L600,70 L0,70 Z"
          fill="url(#chart_fill)"
        />
        <polyline
          points="0,60 60,52 120,55 180,40 240,44 300,30 360,28 420,18 480,20 540,10 600,8"
          stroke="#4F8CFF"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {[60, 180, 300, 420, 540].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={[52, 40, 30, 18, 10][i]}
            r="3"
            fill="#4F8CFF"
          />
        ))}
      </svg>
    </div>

    {/* Bottom badges row */}
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(139,92,246,0.12)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '11px',
          color: '#A78BFA',
          fontWeight: 600,
        }}
      >
        <Cpu size={11} /> AI Insight Ready
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '11px',
          color: '#10B981',
          fontWeight: 600,
        }}
      >
        <FileText size={11} /> 3 Docs Scanned
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '11px',
          color: '#F59E0B',
          fontWeight: 600,
        }}
      >
        <Star size={11} /> 4 Tasks Due
      </span>
    </div>
  </div>
);

// ─── Features Data ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Users,
    title: 'Smart Client Management',
    desc: 'Unified client profiles, invoices, and communication history in one intelligent workspace.',
    accent: '#4F8CFF',
  },
  {
    icon: Camera,
    title: 'Venture Vision',
    desc: 'Scan business cards, receipts, and contracts. AI extracts and organizes data instantly.',
    accent: '#00E5FF',
  },
  {
    icon: Cpu,
    title: 'Venture AI',
    desc: 'Ask questions about your business. Get insights, summaries, and recommendations instantly.',
    accent: '#8B5CF6',
  },
  {
    icon: TrendingUp,
    title: 'Financial Clarity',
    desc: 'Real-time revenue tracking, expense management, and intelligent financial forecasts.',
    accent: '#10B981',
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    desc: 'Smart document storage with AI-powered tagging, search, and extraction.',
    accent: '#F59E0B',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    desc: 'AI-assisted task prioritization that keeps your business moving forward every day.',
    accent: '#EC4899',
  },
];

// ─── Animation Variants ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── LandingPage ───────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <VentureGrid variant="default" />

      {/* ── Navbar ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 40px',
          background: 'rgba(8,13,24,0.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(79,140,255,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <VentureLogo size={32} />
          <span
            style={{
              fontWeight: 800,
              fontSize: '18px',
              background: 'linear-gradient(135deg, #fff 40%, rgba(79,140,255,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            VentureOS
          </span>
        </div>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/login"
            style={{
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          >
            Log in
          </Link>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'linear-gradient(135deg, #4F8CFF 0%, #8B5CF6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(79,140,255,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(79,140,255,0.45)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(79,140,255,0.3)';
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '100px',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(79,140,255,0.1)',
            border: '1px solid rgba(79,140,255,0.25)',
            borderRadius: '100px',
            padding: '6px 16px',
            marginBottom: '28px',
          }}
        >
          <Zap size={13} color="#4F8CFF" />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: 'linear-gradient(90deg, #4F8CFF, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI-POWERED BUSINESS OS
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            maxWidth: '800px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #E2E8F0 40%, rgba(79,140,255,0.9) 80%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Run your business.{'\n'}
          <span style={{ display: 'block' }}>Think smarter.</span>
          <span style={{ display: 'block' }}>Move faster.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.35}
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '580px',
            margin: '0 auto 40px',
            lineHeight: 1.65,
          }}
        >
          One intelligent workspace for your clients, finances, documents and business decisions.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.45}
          style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '70px' }}
        >
          <button
            onClick={() => navigate('/signup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #4F8CFF 0%, #8B5CF6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(79,140,255,0.35)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 45px rgba(79,140,255,0.5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(79,140,255,0.35)';
            }}
          >
            Get Started <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(79,140,255,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <Camera size={16} /> Explore Venture Vision
          </button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%',
            maxWidth: '720px',
            animation: 'float 6s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
          <DashboardPreview />
        </motion.div>
      </section>

      {/* ── Features Section ── */}
      <section
        style={{
          padding: '80px 40px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Section heading */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '100px',
                padding: '5px 14px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#A78BFA',
                marginBottom: '16px',
              }}
            >
              <BarChart2 size={11} /> EVERYTHING YOU NEED
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: '0 0 12px',
              }}
            >
              Built for modern businesses
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
              From solo freelancers to growing teams — VentureOS adapts to how you work.
            </p>
          </motion.div>
        </div>

        {/* Features grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${f.accent}20`,
                  borderRadius: '16px',
                  padding: '28px',
                  cursor: 'default',
                  transition: 'border-color 0.3s, background 0.3s, transform 0.3s',
                }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.25 },
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${f.accent}45`;
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${f.accent}20`;
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${f.accent}15`,
                    border: `1px solid ${f.accent}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} color={f.accent} />
                </div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fff',
                    margin: '0 0 8px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <VentureLogo size={22} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            VentureOS © 2026. All rights reserved.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy', 'Terms', 'Contact'].map((t) => (
            <a
              key={t}
              href="#"
              style={{
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              {t}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
