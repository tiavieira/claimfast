import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Car, Home, Heart, Shield, CheckCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const POLICY_ICONS: Record<string, React.ReactNode> = {
  auto: <Car size={22} />, home: <Home size={22} />, health: <Heart size={22} />, life: <Shield size={22} />,
};
const POLICY_COLORS: Record<string, string> = { auto: '#2563EB', home: '#059669', health: '#DC2626', life: '#7C3AED' };
const TYPE_LABELS: Record<string, string> = { auto: 'Automóvel', home: 'Habitação', health: 'Saúde', life: 'Vida' };
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted:       { label: 'Submetido',  color: '#2563EB', bg: '#EFF6FF' },
  under_review:    { label: 'Em análise', color: '#D97706', bg: '#FFFBEB' },
  expert_assigned: { label: 'Perito',     color: '#7C3AED', bg: '#F5F3FF' },
  approved:        { label: 'Aprovado',   color: '#059669', bg: '#ECFDF5' },
  rejected:        { label: 'Rejeitado',  color: '#DC2626', bg: '#FEF2F2' },
  paid:            { label: 'Pago',       color: '#059669', bg: '#ECFDF5' },
};

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [policy, setPolicy] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/policies/${id}`), api.get('/claims')])
      .then(([p, c]) => {
        setPolicy(p.data);
        setClaims(c.data.filter((cl: any) => cl.policy_id === id));
      }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--cf-text-muted)' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!policy) return <div style={{ padding: '2rem', textAlign: 'center' }}>Apólice não encontrada.</div>;

  const color = POLICY_COLORS[policy.type] ?? '#64748B';

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: isMobile ? '1rem 0.875rem 5rem' : '2rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'white', border: '1.5px solid var(--cf-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cf-text-sec)', boxShadow: 'var(--cf-shadow)' }}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{TYPE_LABELS[policy.type] ?? policy.type}</h1>
          <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-muted)', marginTop: '0.1rem' }}>{policy.insurer} · {policy.policy_number}</div>
        </div>
      </div>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 'var(--cf-radius-lg)', padding: '1.5rem', border: '1.5px solid var(--cf-border)', borderTop: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(12,25,41,0.06)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '1rem', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {POLICY_ICONS[policy.type]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{TYPE_LABELS[policy.type] ?? policy.type}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-muted)' }}>{policy.insurer}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, color, fontSize: '1.25rem' }}>{formatCurrency(policy.premium_monthly)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)' }}>/ mês</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--cf-border)' }}>
          {([
            ['Titular', policy.holder_name],
            ['N.º apólice', policy.policy_number],
            ['Início', formatDate(policy.start_date)],
            ['Validade', formatDate(policy.end_date)],
            policy.plate   ? ['Matrícula', policy.plate]   : null,
            policy.address ? ['Morada', policy.address]    : null,
          ] as any[]).filter(Boolean).map(([label, value]: [string, string]) => (
            <div key={label}>
              <div style={{ fontSize: '0.7rem', color: 'var(--cf-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {policy.validation_status === 'pending' && (
          <div style={{ marginTop: '1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--cf-radius-sm)', padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={13} /> Apólice a aguardar validação pela seguradora
          </div>
        )}
      </motion.div>

      {/* Coverages */}
      {policy.coverages?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'white', borderRadius: 'var(--cf-radius-lg)', padding: '1.25rem 1.5rem', border: '1.5px solid var(--cf-border)', boxShadow: '0 2px 8px rgba(12,25,41,0.06)', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>Coberturas incluídas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {policy.coverages.map((cov: any) => (
              <div key={cov.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--cf-surface2)', borderRadius: 'var(--cf-radius-sm)', border: '1px solid var(--cf-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <CheckCircle size={14} color={color} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cov.label}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                  {cov.limit > 0   && <div style={{ fontWeight: 700 }}>Limite: {formatCurrency(cov.limit)}</div>}
                  {cov.deductible > 0 && <div style={{ color: 'var(--cf-text-muted)' }}>Franquia: {formatCurrency(cov.deductible)}</div>}
                  {cov.limit === 0 && cov.deductible === 0 && <div style={{ color: 'var(--cf-text-muted)' }}>Incluída</div>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Claims */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'white', borderRadius: 'var(--cf-radius-lg)', padding: '1.25rem 1.5rem', border: '1.5px solid var(--cf-border)', boxShadow: '0 2px 8px rgba(12,25,41,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Sinistros nesta apólice</div>
          <span style={{ fontSize: '0.72rem', background: 'rgba(255,86,48,0.10)', color: 'var(--cf-accent)', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>{claims.length}</span>
        </div>
        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--cf-text-muted)', fontSize: '0.85rem' }}>Nenhum sinistro registado nesta apólice.</div>
        ) : claims.map((c: any) => {
          const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.submitted;
          return (
            <button key={c.id} onClick={() => navigate(`/claim/${c.id}`)}
              style={{ width: '100%', textAlign: 'left', background: 'var(--cf-surface2)', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius-sm)', padding: '0.875rem 1rem', marginBottom: '0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)', marginTop: '0.2rem' }}>{formatDate(c.incident_date)} · {formatCurrency(c.estimated_amount)}</div>
              </div>
              <div style={{ background: st.bg, color: st.color, padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>{st.label}</div>
              <ChevronRight size={14} color="var(--cf-text-muted)" />
            </button>
          );
        })}
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
