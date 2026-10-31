import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Receipt,
  ShoppingCart,
  CheckSquare,
  Camera,
  Archive,
  Sparkles,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Workspace',
    items: [
      { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { path: '/clients', label: 'Clients', icon: Users },
      { path: '/invoices', label: 'Invoices', icon: FileText },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/expenses', label: 'Expenses', icon: Receipt },
      { path: '/orders', label: 'Orders', icon: ShoppingCart },
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Intelligence & Vision',
    items: [
      { path: '/vision', label: 'Venture Vision', icon: Camera, badge: 'OCR', badgeColor: '#36D6E7' },
      { path: '/documents', label: 'Document Vault', icon: Archive },
      { path: '/ai', label: 'Venture AI', icon: Sparkles, badge: 'AI', badgeColor: '#8B5CF6' },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/activity', label: 'Activity Log', icon: Clock },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose = () => {},
}) => {
  const location = useLocation();
  const { user, business, isDemoMode, signOut } = useAuth();

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onMobileClose]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AL';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Alex Mercer';

  const renderSidebar = (isCollapsed: boolean, isMobileView: boolean = false) => (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}
      style={isMobileView ? { position: 'relative', width: '100%', height: '100%', borderRight: 'none' } : undefined}
      aria-label="Main navigation"
    >
      {/* ── Header: Logo & Collapse Toggle ── */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo" onClick={isMobileView ? onMobileClose : undefined}>
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4F8CFF] to-[#8B5CF6] shadow-[0_0_12px_rgba(79,140,255,0.4)]">
            <Zap size={16} className="text-white fill-white/20" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="sidebar-logo-wordmark flex items-center gap-1">
                Venture<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#36D6E7]">OS</span>
              </span>
            </div>
          )}
        </Link>
        {!isMobileView && (
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* ── Active Workspace Badge (Expanded Only) ── */}
      {!isCollapsed && (
        <div style={{ padding: '0.65rem 0.75rem 0.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.65rem',
            background: 'rgba(17, 27, 46, 0.65)',
            borderRadius: 8,
            border: '1px solid rgba(79, 140, 255, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <span style={{ position: 'relative', display: 'flex', height: 8, width: 8, flexShrink: 0 }}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F4F7FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {business?.name || 'Apex Dynamics Corp'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#9AA9C2', textTransform: 'capitalize' }}>
                  {business?.category || 'SaaS & Enterprise'}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.6rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: 4,
              background: isDemoMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(79, 140, 255, 0.15)',
              color: isDemoMode ? '#F59E0B' : '#4F8CFF',
              border: isDemoMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(79, 140, 255, 0.3)',
            }}>
              {isDemoMode ? 'DEMO' : 'LIVE'}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Navigation List ── */}
      <nav className="sidebar-nav" role="navigation">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: '0.5rem' }}>
            {!isCollapsed && (
              <div className="sidebar-section-header">
                <span>{section.title}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-nav-item ${active ? 'sidebar-nav-item--active' : ''} ${isCollapsed ? 'sidebar-nav-item--collapsed' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    onClick={isMobileView ? onMobileClose : undefined}
                  >
                    <span className="sidebar-nav-icon">
                      <Icon size={17} />
                    </span>
                    {!isCollapsed && (
                      <span className="sidebar-nav-label">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className="sidebar-nav-badge"
                        style={{
                          background: `${item.badgeColor || '#4F8CFF'}22`,
                          color: item.badgeColor || '#4F8CFF',
                          border: `1px solid ${item.badgeColor || '#4F8CFF'}44`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom Telemetry Micro-Widget ── */}
      {!isCollapsed && (
        <div style={{
          margin: '0.5rem 0.75rem',
          padding: '0.75rem',
          background: 'linear-gradient(180deg, rgba(17, 27, 46, 0.85) 0%, rgba(13, 20, 36, 0.95) 100%)',
          borderRadius: 10,
          border: '1px solid rgba(22, 34, 56, 0.9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              CASH RUNWAY
            </span>
            <span style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 700, fontFamily: 'monospace' }}>
              14.2 mo
            </span>
          </div>
          <div style={{ height: 4, width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '74%', background: 'linear-gradient(90deg, #4F8CFF, #36D6E7)', borderRadius: 2 }} />
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9AA9C2' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={11} className="text-[#36D6E7]" />
              <span>RLS Protected</span>
            </span>
            <span style={{ color: '#F4F7FF', fontWeight: 600 }}>98% Health</span>
          </div>
        </div>
      )}

      {/* ── Footer / User Profile & Sign Out ── */}
      <div className={`sidebar-footer ${isCollapsed ? 'sidebar-footer--collapsed' : ''}`}>
        <div className="sidebar-user">
          <div className="sidebar-avatar" aria-hidden="true">
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{userName}</span>
              <span className="sidebar-user-email">{user?.email || 'alex@apexdynamics.io'}</span>
            </div>
          )}
        </div>
        <button
          className="sidebar-signout"
          onClick={signOut}
          title="Sign out of VentureOS"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop">{renderSidebar(collapsed, false)}</div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <div className={`sidebar-mobile ${mobileOpen ? 'sidebar-mobile--open' : ''}`}>
        <button
          className="sidebar-mobile-close"
          onClick={onMobileClose}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        {renderSidebar(false, true)}
      </div>
    </>
  );
};

export default Sidebar;
