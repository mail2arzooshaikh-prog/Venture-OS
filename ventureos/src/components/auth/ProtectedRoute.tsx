import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  /**
   * When true the onboarding-completion guard is skipped.
   * Used for the /onboarding route itself so users can reach it.
   */
  skipOnboardingGuard?: boolean
  /** Optional child elements (in lieu of <Outlet /> for non-layout routes). */
  children?: React.ReactNode
}

// ── Loading spinner ───────────────────────────────────────────────────────────

const FullScreenLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: '#0f172a',
      gap: '1.5rem',
    }}
  >
    {/* Logo wordmark */}
    <div
      style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
      }}
    >
      VentureOS
    </div>

    {/* Spinner ring */}
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(99,102,241,0.2)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />

    {/* Inline keyframes injected once */}
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// ── ProtectedRoute ────────────────────────────────────────────────────────────

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  skipOnboardingGuard = false,
  children,
}) => {
  const { user, business, loading } = useAuth()
  const location = useLocation()

  // 1. Still resolving session — show branded loader
  if (loading) {
    return <FullScreenLoader />
  }

  // 2. Not authenticated — redirect to /login, preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 3. Authenticated but onboarding incomplete — send to /onboarding
  //    (unless we're already rendering the onboarding route itself)
  if (!skipOnboardingGuard && !business?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  // 4. All checks passed — render children or the nested route via <Outlet />
  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
