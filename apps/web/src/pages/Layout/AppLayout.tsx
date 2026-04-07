import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Plus, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [ctaHover, setCtaHover] = useState(false);
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Top bar */}
      <header style={{
        height: 60,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(221,230,240,0.6)',
        boxShadow: '0 1px 0 rgba(12,25,41,0.04), 0 4px 20px rgba(12,25,41,0.03)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 1rem' : '0 1.5rem',
        gap: '0.875rem',
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #FF5630, #FF8047)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(255,86,48,0.35)',
          }}>
            <Zap size={17} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--cf-primary)', letterSpacing: '-0.3px', display: isMobile ? 'none' : 'block' }}>
            ClaimFast
          </span>
        </NavLink>

        <div style={{ flex: 1 }} />

        {/* Nav */}
        <NavLink to="/" end style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.4rem 0.875rem',
          borderRadius: '0.625rem',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 500,
          background: isActive ? 'rgba(255,86,48,0.08)' : 'transparent',
          color: isActive ? 'var(--cf-accent)' : 'var(--cf-text-muted)',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        })}>
          <Home size={15} /> {!isMobile && 'Início'}
        </NavLink>

        {/* CTA */}
        <button
          onClick={() => navigate('/claim/new')}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 0 : '0.375rem',
            padding: isMobile ? '0.5rem' : '0.5rem 1rem',
            borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, var(--cf-accent), #FF7A54)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: ctaHover
              ? '0 4px 18px rgba(255,86,48,0.50), 0 2px 6px rgba(255,86,48,0.25)'
              : '0 2px 12px rgba(255,86,48,0.35)',
            transition: 'box-shadow 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <Plus size={15} /> {!isMobile && 'Participar sinistro'}
        </button>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--cf-border)' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cf-primary), #2E508C)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            boxShadow: '0 0 0 2px rgba(255,86,48,0.25)',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0)}
          </div>
          {!isMobile && (
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cf-text-sec)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0]}
            </span>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cf-text-muted)', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
