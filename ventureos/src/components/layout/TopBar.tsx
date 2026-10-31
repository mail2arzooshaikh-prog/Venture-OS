import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  onMenuToggle: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Overview & Pulse',
  clients: 'Clients Directory',
  invoices: 'Invoice Management',
  payments: 'Payment Processing',
  expenses: 'Expense Ledger',
  orders: 'Client Orders',
  tasks: 'Operational Tasks',
  vision: 'Venture Vision Scanner',
  documents: 'Document Vault',
  ai: 'Venture AI Copilot',
  activity: 'Audit Activity Log',
  settings: 'Workspace Settings',
  profile: 'Account Profile',
};

const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Payment Received ($3,450.00)',
    desc: 'Acme Global Tech settled Invoice #INV-2026-09 via Stripe.',
    time: '12m ago',
    type: 'payment',
  },
  {
    id: 2,
    title: 'Receipt Extracted via OCR',
    desc: 'AWS Cloud Services receipt ($142.50) added to Expenses.',
    time: '1h ago',
    type: 'vision',
  },
  {
    id: 3,
    title: 'Venture AI Health Alert',
    desc: 'Runway expanded to 14.2 months. 0 overdue receivables.',
    time: '3h ago',
    type: 'ai',
  },
];

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDemoMode, signOut } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const segment = location.pathname.split('/').filter(Boolean)[0] ?? '';
  const pageTitle = PAGE_TITLES[segment] ?? (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Dashboard');

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AL';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Alex Mercer';

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('invoice')) navigate('/invoices');
    else if (q.includes('client')) navigate('/clients');
    else if (q.includes('expense')) navigate('/expenses');
    else if (q.includes('order')) navigate('/orders');
    else if (q.includes('scan') || q.includes('camera') || q.includes('vision')) navigate('/vision');
    else if (q.includes('ai') || q.includes('ask') || q.includes('chat')) navigate('/ai');
    else navigate('/dashboard');
    setSearchQuery('');
  };

  return (
    <header className="topbar" role="banner">
      {/* ── Left: Mobile Hamburger + Breadcrumb Title ── */}
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar navigation"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-page-title-group">
          <span className="topbar-breadcrumb">
            WORKSPACE // {segment ? segment.toUpperCase() : 'OVERVIEW'}
          </span>
          <h1 className="topbar-page-title">{pageTitle}</h1>
        </div>
      </div>

      {/* ── Center: Command Search Bar ── */}
      <div className="topbar-center">
        <form onSubmit={handleSearchSubmit} className="topbar-search">
          <Search size={15} className="topbar-search-icon" aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            className="topbar-search-input"
            placeholder="Search clients, invoices, orders or ask AI..."
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          <kbd className="topbar-search-kbd" aria-label="Keyboard shortcut: Control K">
            Ctrl K
          </kbd>

          {/* Quick Search Suggestions Dropdown */}
          {searchFocused && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#0D1424',
              border: '1px solid rgba(79, 140, 255, 0.25)',
              borderRadius: 12,
              padding: '0.5rem',
              boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
              zIndex: 100,
            }}>
              <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#9AA9C2', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Quick Jump
              </div>
              {[
                { label: 'Venture Vision (Scan Document)', path: '/vision' },
                { label: 'Venture AI (Business Copilot)', path: '/ai' },
                { label: 'Invoices & Receivables', path: '/invoices' },
                { label: 'Client Directory', path: '/clients' },
              ].map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { navigate(s.path); setSearchQuery(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0.6rem',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    color: '#F4F7FF',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(17,27,46,0.8)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{s.label}</span>
                  <ArrowRight size={13} className="text-[#4F8CFF]" />
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* ── Right: Live Status, Quick Action, Notifications, User Menu ── */}
      <div className="topbar-right">
        {/* Workspace Status Pill */}
        <div className="topbar-status-pill hidden md:flex">
          <span style={{ position: 'relative', display: 'flex', height: 6, width: 6 }}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>{isDemoMode ? 'OFFLINE DEMO' : 'CLOUD SYNC'}</span>
        </div>

        {/* Quick Action: Scan Document */}
        <Link to="/vision" className="topbar-action-btn hidden sm:inline-flex">
          <Camera size={14} />
          <span>Scan Doc</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            className="topbar-icon-btn"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="View notifications"
          >
            <Bell size={17} />
            <span className="topbar-notification-badge">3</span>
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 0.65rem)',
              width: 320,
              background: '#0D1424',
              border: '1px solid rgba(22, 34, 56, 0.95)',
              borderRadius: 12,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
              padding: '0.75rem',
              zIndex: 100,
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(22, 34, 56, 0.8)', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F4F7FF' }}>Notifications</span>
                <span style={{ fontSize: '0.65rem', color: '#4F8CFF', cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>Mark read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SAMPLE_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 8,
                      background: 'rgba(17, 27, 46, 0.6)',
                      border: '1px solid rgba(79, 140, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F4F7FF' }}>{n.title}</span>
                      <span style={{ fontSize: '0.65rem', color: '#9AA9C2' }}>{n.time}</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#9AA9C2', margin: 0, lineHeight: 1.4 }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="topbar-user-menu" ref={dropdownRef}>
          <button
            className="topbar-user-trigger"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <div className="topbar-avatar" aria-hidden="true">
              {userInitials}
            </div>
            <span className="topbar-user-name hidden sm:inline">{userName}</span>
            <ChevronDown
              size={13}
              className={`topbar-chevron ${dropdownOpen ? 'topbar-chevron--open' : ''}`}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <div className="topbar-dropdown" role="menu" aria-label="User options">
              <div className="topbar-dropdown-header">
                <p className="topbar-dropdown-name">{userName}</p>
                <p className="topbar-dropdown-email">{user?.email || 'alex@apexdynamics.io'}</p>
                <span style={{
                  display: 'inline-block',
                  marginTop: '0.35rem',
                  fontSize: '0.625rem',
                  fontFamily: 'monospace',
                  color: '#4F8CFF',
                  background: 'rgba(79, 140, 255, 0.12)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 4,
                  fontWeight: 600,
                }}>
                  ADMINISTRATOR
                </span>
              </div>
              <div className="topbar-dropdown-divider" />
              <button
                className="topbar-dropdown-item"
                role="menuitem"
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
              >
                <Settings size={14} />
                <span>Settings & Profile</span>
              </button>
              <button
                className="topbar-dropdown-item"
                role="menuitem"
                onClick={() => { setDropdownOpen(false); navigate('/ai'); }}
              >
                <Sparkles size={14} className="text-[#8B5CF6]" />
                <span>Venture AI Copilot</span>
              </button>
              <div className="topbar-dropdown-divider" />
              <button
                className="topbar-dropdown-item topbar-dropdown-item--danger"
                role="menuitem"
                onClick={handleSignOut}
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
