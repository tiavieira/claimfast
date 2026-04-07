import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Plus, LogOut, Zap, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { api } from '../../config/api';

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [ctaHover, setCtaHover] = useState(false);
  const { isMobile } = useBreakpoint();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = async (notif: any) => {
    await api.put(`/notifications/${notif.id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: 1 } : n));
    setShowNotifs(false);
    if (notif.claim_id) navigate(`/claim/${notif.claim_id}`);
  };

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };

  const typeColor = (type: string) =>
    type === 'error' ? '#DC2626' : type === 'success' ? '#059669' : type === 'warning' ? '#D97706' : '#2563EB';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <header style={{
        height: 60, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(221,230,240,0.6)',
        boxShadow: '0 1px 0 rgba(12,25,41,0.04), 0 4px 20px rgba(12,25,41,0.03)',
        display: 'flex', alignItems: 'center', padding: isMobile ? '0 1rem' : '0 1.5rem', gap: '0.875rem',
      }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: 'linear-gradient(135deg, #FF5630, #FF8047)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(255,86,48,0.35)' }}>
            <Zap size={17} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--cf-primary)', letterSpacing: '-0.3px', display: isMobile ? 'none' : 'block' }}>ClaimFast</span>
        </NavLink>

        <div style={{ flex: 1 }} />

        <NavLink to="/" end style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem',
          borderRadius: '0.625rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
          background: isActive ? 'rgba(255,86,48,0.08)' : 'transparent',
          color: isActive ? 'var(--cf-accent)' : 'var(--cf-text-muted)', transition: 'all 0.18s',
        })}>
          <Home size={15} /> {!isMobile && 'Início'}
        </NavLink>

        <button onClick={() => navigate('/claim/new')}
          onMouseEnter={() => setCtaHover(true)} onMouseLeave={() => setCtaHover(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? 0 : '0.375rem',
            padding: isMobile ? '0.5rem' : '0.5rem 1rem', borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, var(--cf-accent), #FF7A54)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            boxShadow: ctaHover ? '0 4px 18px rgba(255,86,48,0.50)' : '0 2px 12px rgba(255,86,48,0.35)',
            transition: 'box-shadow 0.18s',
          }}>
          <Plus size={15} /> {!isMobile && 'Participar sinistro'}
        </button>

        {/* Notification bell */}
        <div ref={notifsRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(s => !s)} style={{
            position: 'relative', background: showNotifs ? 'rgba(255,86,48,0.08)' : 'none',
            border: 'none', cursor: 'pointer', color: 'var(--cf-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: '0.5rem',
          } as React.CSSProperties}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                borderRadius: '50%', background: '#EF4444', color: 'white',
                fontSize: '0.6rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
            )}
          </button>
          {showNotifs && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320,
              background: 'white', borderRadius: '0.875rem', border: '1.5px solid var(--cf-border)',
              boxShadow: '0 8px 32px rgba(12,25,41,0.14)', zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--cf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notificações</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ fontSize: '0.72rem', color: 'var(--cf-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cf-text-muted)', fontSize: '0.85rem' }}>Sem notificações</div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => handleNotifClick(n)}
                    style={{
                      padding: '0.875rem 1rem', cursor: n.claim_id ? 'pointer' : 'default',
                      background: n.read ? 'white' : 'rgba(255,86,48,0.04)',
                      borderBottom: '1px solid var(--cf-border)',
                      borderLeft: n.read ? 'none' : `3px solid ${typeColor(n.type)}`,
                    }}>
                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.82rem', marginBottom: '0.2rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', lineHeight: 1.45 }}>{n.body}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--cf-text-muted)', marginTop: '0.25rem' }}>
                      {new Date(n.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--cf-border)' }}>
          <button onClick={() => navigate('/profile')} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cf-primary), #2E508C)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 0 0 2px rgba(255,86,48,0.25)',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}>
            {user?.name?.charAt(0)}
          </button>
          {!isMobile && (
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cf-text-sec)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0]}
            </span>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cf-text-muted)', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
