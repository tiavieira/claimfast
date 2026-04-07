import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Car, Home, Heart, Shield, ChevronRight, Clock, CheckCircle, AlertCircle, Banknote, Search, FilePlus } from 'lucide-react';
import { api } from '../../config/api';
import { useAuthStore } from '../../store/auth.store';
import { formatCurrency, formatDate } from '../../utils/format';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const POLICY_ICONS: Record<string, React.ReactNode> = {
  auto:   <Car size={20} />,
  home:   <Home size={20} />,
  health: <Heart size={20} />,
  life:   <Shield size={20} />,
};

const POLICY_COLORS: Record<string, string> = {
  auto:   '#2563EB', home: '#059669', health: '#DC2626', life: '#7C3AED',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  submitted:       { label: 'Submetido',       color: '#2563EB', bg: '#EFF6FF', icon: <Clock size={13} /> },
  under_review:    { label: 'Em análise',      color: '#D97706', bg: '#FFFBEB', icon: <Search size={13} /> },
  expert_assigned: { label: 'Perito atribuído', color: '#7C3AED', bg: '#F5F3FF', icon: <Shield size={13} /> },
  approved:        { label: 'Aprovado',        color: '#059669', bg: '#ECFDF5', icon: <CheckCircle size={13} /> },
  rejected:        { label: 'Rejeitado',       color: '#DC2626', bg: '#FEF2F2', icon: <AlertCircle size={13} /> },
  paid:            { label: 'Pago',            color: '#059669', bg: '#ECFDF5', icon: <Banknote size={13} /> },
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims,   setClaims]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([api.get('/policies'), api.get('/claims')])
      .then(([p, c]) => { setPolicies(p.data); setClaims(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const activeClaims = claims.filter(c => !['paid', 'rejected'].includes(c.status));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--cf-text-muted)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <Clock size={24} />
      </motion.div>
    </div>
  );

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: isMobile ? '1rem 0.875rem 5rem' : '1.5rem 1.25rem 4rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{
            background: 'rgba(255,86,48,0.08)',
            color: 'var(--cf-accent)',
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Olá, {user?.name.split(' ')[0]} 👋</h1>
        {activeClaims.length > 0 && (
          <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginTop: '0.375rem' }}>
            Tem {activeClaims.length} sinistro{activeClaims.length > 1 ? 's' : ''} em curso.
          </p>
        )}
      </motion.div>

      {/* New claim CTA */}
      <motion.button
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
        whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/claim/new')}
        style={{
          width: '100%',
          padding: '1.375rem 1.75rem',
          marginBottom: '2.25rem',
          background: 'linear-gradient(135deg, #FF5630 0%, #FF7A54 100%)',
          border: 'none',
          borderRadius: 'var(--cf-radius-lg)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: isMobile ? 'center' : 'center',
          flexDirection: isMobile ? 'row' : 'row',
          gap: '1rem',
          textAlign: 'left',
          boxShadow: '0 8px 28px rgba(255,86,48,0.38), 0 2px 8px rgba(255,86,48,0.18)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* IA badge */}
        <div style={{
          position: 'absolute',
          top: '0.625rem',
          right: '0.875rem',
          background: 'rgba(255,255,255,0.22)',
          color: 'white',
          fontSize: '0.65rem',
          fontWeight: 800,
          padding: '0.15rem 0.45rem',
          borderRadius: '999px',
          letterSpacing: '0.05em',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          IA
        </div>

        <div style={{
          width: isMobile ? 40 : 50,
          height: isMobile ? 40 : 50,
          borderRadius: '0.875rem',
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Plus size={isMobile ? 20 : 24} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Participar sinistro</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.1rem' }}>Por voz, foto ou texto · menos de 90 segundos</div>
        </div>
        <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.8 }} />
      </motion.button>

      {/* Active claims */}
      {activeClaims.length > 0 && (
        <Section title="Sinistros em curso" count={activeClaims.length} isMobile={isMobile}>
          {activeClaims.map((c, i) => (
            <ClaimCard key={c.id} claim={c} index={i} onClick={() => navigate(`/claim/${c.id}`)} isMobile={isMobile} />
          ))}
        </Section>
      )}

      {/* Policies */}
      <Section
        title="As minhas apólices"
        count={policies.length}
        isMobile={isMobile}
        action={{ label: isMobile ? undefined : 'Adicionar', icon: <FilePlus size={14} />, onClick: () => navigate('/policy/new') }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '240px' : '280px'}, 1fr))`, gap: '0.875rem' }}>
          {policies.map((p, i) => (
            <PolicyCard key={p.id} policy={p} index={i} />
          ))}
        </div>
      </Section>

      {/* Past claims */}
      {claims.filter(c => ['paid', 'rejected'].includes(c.status)).length > 0 && (
        <Section title="Histórico" count={claims.filter(c => ['paid','rejected'].includes(c.status)).length} isMobile={isMobile}>
          {claims.filter(c => ['paid', 'rejected'].includes(c.status)).map((c, i) => (
            <ClaimCard key={c.id} claim={c} index={i} onClick={() => navigate(`/claim/${c.id}`)} muted isMobile={isMobile} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, children, isMobile, action }: {
  title: string; count: number; children: React.ReactNode; isMobile: boolean;
  action?: { label?: string; icon: React.ReactNode; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: '2.25rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.625rem', marginBottom: isMobile ? '0.75rem' : '1rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cf-accent)', flexShrink: 0 }} />
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h2>
        <span style={{ fontSize: '0.72rem', background: 'rgba(255,86,48,0.10)', color: 'var(--cf-accent)', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
          {count}
        </span>
        {action && (
          <button onClick={action.onClick} style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
            background: 'rgba(255,86,48,0.08)', color: 'var(--cf-accent)',
            border: '1px solid rgba(255,86,48,0.2)', borderRadius: '999px',
            padding: '0.25rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
          }}>
            {action.icon}{action.label}
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function PolicyCard({ policy: p, index }: { policy: any; index: number }) {
  const color = POLICY_COLORS[p.type] ?? '#64748B';
  const typeLabels: Record<string, string> = { auto: 'Automóvel', home: 'Habitação', health: 'Saúde', life: 'Vida' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        background: 'var(--cf-surface)',
        borderRadius: 'var(--cf-radius)',
        padding: '1.25rem',
        border: '1.5px solid var(--cf-border)',
        borderTop: `3px solid ${color}`,
        boxShadow: '0 1px 3px rgba(12,25,41,0.05), 0 4px 16px rgba(12,25,41,0.04)',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.875rem' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '0.75rem',
          background: `${color}15`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5)`,
        }}>
          {POLICY_ICONS[p.type]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{typeLabels[p.type] ?? p.type}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)', marginTop: '0.1rem' }}>{p.insurer}</div>
        </div>
        {p.validation_status === 'pending'
          ? <div style={{ fontSize: '0.68rem', background: '#FFFBEB', color: '#D97706', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 600, flexShrink: 0 }}>⏳ Pendente</div>
          : <div style={{ fontSize: '0.68rem', background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 600, flexShrink: 0 }}>Ativa</div>
        }
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', fontFamily: 'monospace', marginBottom: '0.625rem' }}>{p.policy_number}</div>
      {p.plate && <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-sec)' }}>{p.vehicle_make} {p.vehicle_model} · <strong>{p.plate}</strong></div>}
      {p.address && <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</div>}
      <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--cf-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)' }}>Válida até {formatDate(p.end_date)}</div>
        <div style={{ fontWeight: 800, color, fontSize: '0.9rem' }}>{formatCurrency(p.premium_monthly)}/mês</div>
      </div>
    </motion.div>
  );
}

function ClaimCard({ claim: c, index, onClick, muted, isMobile }: { claim: any; index: number; onClick: () => void; muted?: boolean; isMobile: boolean }) {
  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.submitted;
  const typeLabels: Record<string, string> = {
    collision: 'Colisão', theft: 'Furto/Roubo', fire: 'Incêndio', flood: 'Inundação',
    glass: 'Vidros', consultation: 'Consulta', surgery: 'Cirurgia', other: 'Sinistro',
  };
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.008, y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--cf-surface)',
        border: '1.5px solid var(--cf-border)',
        borderLeft: `3px solid ${st.color}`,
        borderRadius: 'var(--cf-radius)',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        marginBottom: '0.75rem',
        cursor: 'pointer',
        opacity: muted ? 0.65 : 1,
        boxShadow: '0 1px 3px rgba(12,25,41,0.05), 0 4px 16px rgba(12,25,41,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)' }}>{typeLabels[c.type] ?? c.type}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--cf-border-strong)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)' }}>{formatDate(c.incident_date)}</span>
          {!isMobile && c.estimated_amount && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--cf-border-strong)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)' }}>Est. {formatCurrency(c.estimated_amount)}</span>
            </>
          )}
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        background: st.bg,
        color: st.color,
        padding: '0.35rem 0.8rem',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        flexShrink: 0,
      }}>
        {st.icon} {st.label}
      </div>
      <ChevronRight size={16} color="var(--cf-text-muted)" />
    </motion.button>
  );
}
