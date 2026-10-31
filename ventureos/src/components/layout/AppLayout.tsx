import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import VentureGrid from '../background/VentureGrid';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div
      className="app-layout"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#080D18',
        color: '#F4F7FF',
        overflowX: 'hidden',
      }}
    >
      {/* ── Ambient Background System: Clean, Modern, Professional ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Soft radial atmospheric glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '25%',
            right: '25%',
            height: '600px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(79, 140, 255, 0.08) 0%, rgba(139, 92, 246, 0.04) 45%, transparent 75%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Subtle bottom-right ambient glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(54, 214, 231, 0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <VentureGrid variant="dashboard" />
      </div>

      {/* ── Main App Shell ── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <TopBar onMenuToggle={handleMenuToggle} />

        <main
          className="page-content"
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
