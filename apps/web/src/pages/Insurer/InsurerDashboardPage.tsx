import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend,
  ComposedChart, Line,
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Clock, TrendingDown, Zap,
  Shield, FileText, ChevronDown, ChevronUp, Search, Filter,
  BarChart2, Percent,
} from 'lucide-react';
import { api } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const INSURER_TOKEN = 'insurer-demo-2024';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submetido', under_review: 'Em análise', expert_assigned: 'Perito',
  approved: 'Aprovado', rejected: 'Rejeitado', paid: 'Pago',
};
const STATUS_COLORS: Record<string, string> = {
  submitted: '#3B82F6', under_review: '#F59E0B', expert_assigned: '#8B5CF6',
  approved: '#10B981', rejected: '#EF4444', paid: '#059669',
};
const TYPE_LABELS: Record<string, string> = {
  collision: 'Colisão', theft: 'Furto', fire: 'Incêndio', flood: 'Inundação',
  glass: 'Vidros', consultation: 'Consulta', surgery: 'Cirurgia',
  liability: 'Resp. Civil', roadside: 'Assistência', exams: 'Exames', dental: 'Dentário',
};

/* ── Info tooltip ── */
function InfoTooltip({ text, light }: { text: string; light?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          width: 15, height: 15, borderRadius: '50%',
          background: light ? 'rgba(255,255,255,0.18)' : '#E2E8F0',
          border: 'none',
          color: light ? 'rgba(255,255,255,0.7)' : '#64748B',
          fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, lineHeight: 1, letterSpacing: 0,
        }}
      >
        i
      </button>
      {visible && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F172A', color: 'white',
          fontSize: '0.7rem', padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem', whiteSpace: 'normal',
          minWidth: 180, maxWidth: 240, lineHeight: 1.55,
          zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #0F172A',
          }} />
        </div>
      )}
    </div>
  );
}

/* ── Fraud badge ── */
function FraudBadge({ score }: { score: number }) {
  const cfg =
    score >= 70 ? { label: 'Crítico',  bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' } :
    score >= 45 ? { label: 'Alto',     bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' } :
    score >= 25 ? { label: 'Médio',    bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' } :
                  { label: 'Baixo',    bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, borderRadius: '0.5rem', padding: '0.2rem 0.625rem', width: 'fit-content' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: cfg.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, flexShrink: 0 }}>{score}</div>
      <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{cfg.label}</span>
    </div>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, sub, icon, color, delay, tooltip }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>{label}</div>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '0.625rem', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.375rem' }}>{sub}</div>}
    </motion.div>
  );
}

/* ── Chart card wrapper ── */
function ChartCard({ title, tooltip, delay, children }: { title: string; tooltip: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1.5px solid #E2E8F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>
        {title}
        <InfoTooltip text={tooltip} />
      </div>
      {children}
    </motion.div>
  );
}

export function InsurerDashboardPage() {
  const bp = useBreakpoint();
  const [stats, setStats]   = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [pendingPolicies, setPendingPolicies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [actionForm, setActionForm] = useState<{ claimId: string; action: string; value: string; value2: string } | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [notesForm, setNotesForm] = useState<{ claimId: string; text: string } | null>(null);
  const [submittingNote, setSubmittingNote] = useState(false);

  const headers = { Authorization: `Bearer ${INSURER_TOKEN}` };

  const loadPending = () =>
    api.get('/insurer/policies/pending', { headers }).then(r => setPendingPolicies(r.data));

  useEffect(() => {
    Promise.all([
      api.get('/insurer/stats',  { headers }),
      api.get('/insurer/charts', { headers }),
      api.get('/insurer/claims', { headers }),
      api.get('/insurer/policies/pending', { headers }),
    ]).then(([s, c, cl, pp]) => {
      setStats(s.data); setCharts(c.data); setClaims(cl.data); setPendingPolicies(pp.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleValidate = async (id: string, action: 'approve' | 'reject') => {
    setValidating(id);
    await api.put(`/insurer/policies/${id}/validate`, { action }, { headers });
    await loadPending();
    setValidating(null);
  };

  const handleClaimAction = async () => {
    if (!actionForm) return;
    setSubmittingAction(true);
    try {
      const body: any = { action: actionForm.action };
      if (actionForm.action === 'approve') body.amount = parseFloat(actionForm.value) || undefined;
      if (actionForm.action === 'reject') body.reason = actionForm.value;
      if (actionForm.action === 'request_docs') body.message = actionForm.value;
      if (actionForm.action === 'assign_expert') { body.expertName = actionForm.value; body.expertPhone = actionForm.value2; }
      await api.put(`/insurer/claims/${actionForm.claimId}/action`, body, { headers });
      setActionForm(null);
      setExpandedId(null);
      reload();
    } finally { setSubmittingAction(false); }
  };

  const handleAddNote = async () => {
    if (!notesForm?.text.trim()) return;
    setSubmittingNote(true);
    try {
      const r = await api.post(`/insurer/claims/${notesForm.claimId}/notes`, { text: notesForm.text }, { headers });
      setClaims(prev => prev.map(c => c.id === notesForm!.claimId ? { ...c, internal_notes: r.data.notes } : c));
      setNotesForm({ claimId: notesForm.claimId, text: '' });
    } finally { setSubmittingNote(false); }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${(api.defaults as any).baseURL}/insurer/claims/export`, { headers: { Authorization: `Bearer ${INSURER_TOKEN}` } });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `sinistros-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const reload = () => {
    const params: any = {};
    if (search) params.search = search;
    if (filter) params.minFraud = 45;
    api.get('/insurer/claims', { headers, params }).then(r => setClaims(r.data));
  };

  useEffect(() => { if (!loading) reload(); }, [search, filter]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: '#64748B' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <Zap size={22} />
      </motion.div>
      A carregar dashboard…
    </div>
  );

  const fraudAlertClaims = claims.filter(c => c.fraud_score >= 45);

  const headerStats = [
    {
      label: 'Poupança acumulada',
      value: formatCurrency(stats?.estimatedSavings ?? 0),
      tip: 'Total poupado face ao processamento manual (referência: €73 por sinistro de diferença operacional).',
    },
    {
      label: 'Projeção anual *',
      value: formatCurrency((stats?.estimatedSavings ?? 0) * 52),
      tip: 'Projeção extrapolada para 12 meses com base no volume atual de participações.',
    },
    {
      label: 'Taxa de automação',
      value: `${stats?.automationRate ?? 0}%`,
      tip: 'Percentagem de sinistros processados automaticamente pela IA sem necessitar de intervenção humana.',
    },
    {
      label: 'Tempo médio resolução',
      value: `${stats?.avgResolutionDays ?? 0} dias`,
      tip: 'Tempo médio em dias desde a submissão do sinistro até à aprovação ou pagamento.',
    },
  ];

  // On mobile show only 2 stats
  const visibleHeaderStats = bp.isMobile
    ? headerStats.filter(s => s.label === 'Poupança acumulada' || s.label === 'Taxa de automação')
    : headerStats;

  const monthlyData = (charts?.monthly ?? []).map((m: any) => ({
    month: m.month?.slice(5) ?? m.month,
    sinistros: m.count,
    pago: Math.round((m.paid_amount ?? 0) / 1000),
  }));

  const chartsRow1Cols = bp.isDesktop ? '1fr 1fr 1fr' : bp.isTablet ? '1fr 1fr' : '1fr';

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0D2247 100%)', padding: bp.isMobile ? '1.25rem 1rem' : '1.5rem 2rem', color: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: bp.isMobile ? 'flex-start' : 'center',
            flexDirection: bp.isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '0.375rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <Shield size={20} color="#FF6B35" />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Portal Seguradora · {stats?.insurer ?? 'Fidelidade'} S.A.</span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Dashboard Operacional</h1>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {visibleHeaderStats.map(({ label, value, tip }) => (
                <div key={label} style={{ textAlign: bp.isMobile ? 'left' : 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: bp.isMobile ? 'flex-start' : 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.2rem' }}>
                    {label}
                    <InfoTooltip text={tip} light />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FF6B35' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          {!bp.isMobile && (
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
              * baseado em 1.000 sinistros/mês · €73 poupança/sinistro vs. processo manual
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${bp.isMobile ? '150px' : '185px'}, 1fr))`, gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard
            label="Sinistros totais" value={stats?.total ?? 0}
            sub="desde o início"
            icon={<FileText size={16} />} color="#3B82F6" delay={0}
            tooltip="Número total de participações de sinistro recebidas desde o início do serviço."
          />
          <KpiCard
            label="Este mês" value={stats?.thisMonth ?? 0}
            sub="participações recebidas"
            icon={<TrendingDown size={16} />} color="#8B5CF6" delay={0.05}
            tooltip="Participações de sinistro recebidas no mês atual."
          />
          <KpiCard
            label="Em curso" value={stats?.pending ?? 0}
            sub="a aguardar resolução"
            icon={<Clock size={16} />} color="#F59E0B" delay={0.10}
            tooltip="Sinistros ainda por resolver: submetidos, em análise ou a aguardar perito."
          />
          <KpiCard
            label="Alertas de fraude" value={stats?.fraudAlerts ?? 0}
            sub="score ≥ 45 (revisão manual)"
            icon={<AlertTriangle size={16} />} color="#EF4444" delay={0.15}
            tooltip="Sinistros com score de risco de fraude igual ou superior a 45, que requerem revisão manual por um perito."
          />
          <KpiCard
            label="Pagos" value={stats?.paid ?? 0}
            sub="processos concluídos"
            icon={<CheckCircle size={16} />} color="#10B981" delay={0.20}
            tooltip="Processos totalmente concluídos com pagamento efetuado ao cliente."
          />
          <KpiCard
            label="Taxa de aprovação" value={`${stats?.approvalRate ?? 0}%`}
            sub="dos sinistros resolvidos"
            icon={<Percent size={16} />} color="#06B6D4" delay={0.25}
            tooltip="Percentagem de sinistros aprovados ou pagos sobre o total de processos já resolvidos (aprovados + rejeitados + pagos)."
          />
          <KpiCard
            label="Valor médio" value={stats?.avgClaimAmount ? formatCurrency(stats.avgClaimAmount) : '—'}
            sub="por participação"
            icon={<BarChart2 size={16} />} color="#FF6B35" delay={0.30}
            tooltip="Valor médio estimado por participação de sinistro, calculado sobre todas as participações com valor declarado."
          />
        </div>

        {/* Charts — row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: chartsRow1Cols, gap: '1rem', marginBottom: '1rem' }}>

          <ChartCard title="Sinistros por estado" tooltip="Distribuição atual dos sinistros por fase do processo: submetido, em análise, aprovado, pago ou rejeitado." delay={0.2}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={charts?.byStatus.map((s: any) => ({ name: STATUS_LABELS[s.status] ?? s.status, value: s.count }))}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}
                >
                  {charts?.byStatus.map((s: any, i: number) => <Cell key={i} fill={STATUS_COLORS[s.status] ?? '#94A3B8'} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {charts?.byStatus.map((s: any) => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: '#64748B' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.status] ?? '#94A3B8' }} />
                  {STATUS_LABELS[s.status] ?? s.status} ({s.count})
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Volume por tipo" tooltip="Número de participações agrupadas por categoria de sinistro (colisão, furto, saúde, etc.)." delay={0.25}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts?.byType.map((t: any) => ({ name: TYPE_LABELS[t.type] ?? t.type, count: t.count }))} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Sinistros" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribuição de risco de fraude" tooltip="Classificação automática dos sinistros em 4 níveis de risco calculados pela IA com base em 17 fatores comportamentais e documentais." delay={0.3}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {charts?.fraudDistribution.map((b: any) => {
                const total = charts.fraudDistribution.reduce((s: number, x: any) => s + x.count, 0);
                const pct   = total > 0 ? Math.round((b.count / total) * 100) : 0;
                return (
                  <div key={b.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.25rem' }}>
                      <span style={{ color: b.color, fontWeight: 600 }}>{b.label}</span>
                      <span>{b.count} sinistros ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{ height: '100%', background: b.color, borderRadius: '999px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Sinistros com score ≥ 45 são sinalizados para revisão manual pelo perito.
            </div>
          </ChartCard>
        </div>

        {/* Charts — row 2: monthly trend full width */}
        <ChartCard title="Evolução mensal" tooltip="Volume de participações recebidas e valor total pago (em milhares de €) por mês nos últimos 6 meses." delay={0.35}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={monthlyData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v}k`} />
              <RechartsTooltip formatter={(value: any, name: any) => name === 'pago' ? [`€${value}k`, 'Valor pago (k€)'] : [value, 'Sinistros']} />
              <Legend formatter={(v) => v === 'sinistros' ? 'Participações' : 'Valor pago (k€)'} />
              <Bar yAxisId="left" dataKey="sinistros" fill="#1B3A6B" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line yAxisId="right" type="monotone" dataKey="pago" stroke="#FF6B35" strokeWidth={2.5} dot={{ r: 4, fill: '#FF6B35' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pending policies */}
        {pendingPolicies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '1rem', border: '1.5px solid #FDE68A', marginBottom: '1rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color="#D97706" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400E' }}>
                  {pendingPolicies.length} apólice{pendingPolicies.length > 1 ? 's' : ''} aguarda{pendingPolicies.length === 1 ? '' : 'm'} validação
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B45309' }}>Registadas manualmente pelo cliente</div>
              </div>
            </div>
            {pendingPolicies.map((p: any) => {
              const typeLabels: Record<string, string> = { auto: 'Automóvel', home: 'Habitação', health: 'Saúde', life: 'Vida' };
              return (
                <div key={p.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #FEF9E7', display: 'flex', alignItems: bp.isMobile ? 'flex-start' : 'center', flexDirection: bp.isMobile ? 'column' : 'row', gap: '0.875rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.user_name} <span style={{ color: '#94A3B8', fontWeight: 400 }}>· {p.user_email}</span></div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {typeLabels[p.type] ?? p.type} · {p.insurer} · <span style={{ fontFamily: 'monospace' }}>{p.policy_number}</span>
                    </div>
                    {p.plate && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>{p.vehicle_make} {p.vehicle_model} · {p.plate}</div>}
                    {p.address && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>{p.address}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      disabled={validating === p.id}
                      onClick={() => handleValidate(p.id, 'reject')}
                      style={{ padding: '0.45rem 0.875rem', border: '1.5px solid #FECACA', borderRadius: '0.5rem', background: 'white', color: '#DC2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Rejeitar
                    </button>
                    <button
                      disabled={validating === p.id}
                      onClick={() => handleValidate(p.id, 'approve')}
                      style={{ padding: '0.45rem 0.875rem', border: 'none', borderRadius: '0.5rem', background: '#059669', color: 'white', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {validating === p.id ? '…' : 'Validar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Fraud alerts banner */}
        {fraudAlertClaims.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '1rem',
              padding: '1rem 1.25rem', marginTop: '1rem', marginBottom: '1.5rem',
              display: 'flex',
              alignItems: bp.isMobile ? 'flex-start' : 'center',
              flexDirection: bp.isMobile ? 'column' : 'row',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <AlertTriangle size={20} color="#DC2626" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.9rem' }}>{fraudAlertClaims.length} alerta{fraudAlertClaims.length > 1 ? 's' : ''} de fraude requer{fraudAlertClaims.length > 1 ? 'em' : ''} atenção</div>
              <div style={{ fontSize: '0.78rem', color: '#991B1B', marginTop: '0.1rem' }}>
                {fraudAlertClaims.slice(0, 3).map((c: any) => c.user_name).join(', ')}
                {fraudAlertClaims.length > 3 ? ` +${fraudAlertClaims.length - 3} outros` : ''}
              </div>
            </div>
            <button
              onClick={() => setFilter(f => f ? '' : 'fraud')}
              style={{ padding: '0.5rem 1rem', background: '#DC2626', color: 'white', border: 'none', borderRadius: '0.625rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              {filter ? 'Ver todos' : 'Ver alertas'}
            </button>
          </motion.div>
        )}

        {/* SLA alerts */}
        {(() => {
          const stale = claims.filter(c => !['paid','rejected'].includes(c.status) && (c.days_pending ?? 0) > 7);
          return stale.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '1rem', padding: '0.875rem 1.25rem', marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <Clock size={18} color="#D97706" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.875rem' }}>{stale.length} sinistro{stale.length > 1 ? 's' : ''} sem resposta há mais de 7 dias</div>
                <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.1rem' }}>{stale.slice(0,3).map((c: any) => c.user_name).join(', ')}{stale.length > 3 ? ` +${stale.length - 3}` : ''}</div>
              </div>
            </motion.div>
          ) : null;
        })()}

        {/* Claims table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ background: 'white', borderRadius: '1rem', border: '1.5px solid #E2E8F0', overflow: 'hidden', marginTop: fraudAlertClaims.length === 0 ? '1rem' : 0 }}>
          <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1 }}>Participações recebidas</h2>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por nome, título..."
                style={{ padding: '0.5rem 0.75rem 0.5rem 2rem', border: '1.5px solid #E2E8F0', borderRadius: '0.625rem', fontSize: '0.8rem', outline: 'none', width: 200 }}
              />
            </div>
            <button
              onClick={() => setFilter(f => f ? '' : 'fraud')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: `1.5px solid ${filter ? '#EF4444' : '#E2E8F0'}`, borderRadius: '0.625rem', background: filter ? '#FEF2F2' : 'transparent', color: filter ? '#DC2626' : '#64748B', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
              <Filter size={13} /> {filter ? 'Score alto' : 'Filtrar'}
            </button>
            <button onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: '1.5px solid #E2E8F0', borderRadius: '0.625rem', background: 'transparent', color: '#64748B', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
              ↓ CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Cliente</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', display: bp.isMobile ? 'none' : 'table-cell' }}>Tipo</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Valor estimado</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Score fraude</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Data</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}></th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => (
                  <React.Fragment key={c.id}>
                    <motion.tr
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      style={{
                        borderTop: '1px solid #F1F5F9', cursor: 'pointer',
                        background: expandedId === c.id ? '#FAFBFF' : c.fraud_score >= 70 ? '#FFF8F8' : c.fraud_score >= 45 ? '#FFFDF5' : 'white',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.user_name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.1rem' }}>{c.title}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', display: bp.isMobile ? 'none' : 'table-cell' }}>
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 500 }}>
                          {TYPE_LABELS[c.type] ?? c.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                        {c.estimated_amount ? formatCurrency(c.estimated_amount) : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ background: `${STATUS_COLORS[c.status] ?? '#94A3B8'}18`, color: STATUS_COLORS[c.status] ?? '#64748B', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <FraudBadge score={c.fraud_score ?? 0} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748B', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {formatDate(c.created_at)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#94A3B8' }}>
                        {expandedId === c.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </td>
                    </motion.tr>

                    {expandedId === c.id && (
                      <tr>
                        <td colSpan={7} style={{ background: '#FAFBFF', borderTop: '1px solid #E2E8F0', padding: 0 }}>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: bp.isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Análise de risco
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.875rem' }}>
                                <FraudScoreGauge score={c.fraud_score ?? 0} />
                                <div>
                                  <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: c.fraud_score >= 70 ? '#DC2626' : c.fraud_score >= 45 ? '#EA580C' : c.fraud_score >= 25 ? '#D97706' : '#059669' }}>
                                    {c.fraud_score}
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8' }}>/100</span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                                    {c.fraud_score >= 70 ? '🔴 Revisão manual obrigatória' : c.fraud_score >= 45 ? '🟠 Requer atenção' : c.fraud_score >= 25 ? '🟡 Monitorizar' : '🟢 Risco baixo'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {(c.fraud_factors ?? []).slice(0, 5).map((f: any, i: number) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                                    <span style={{ color: f.impact === 'negative' ? '#EF4444' : '#10B981', fontWeight: 700, width: 28, textAlign: 'right', flexShrink: 0 }}>
                                      {f.impact === 'negative' ? `+${f.points}` : `-${f.points}`}
                                    </span>
                                    <span style={{ color: '#475569' }}>{f.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Detalhe da participação
                              </div>
                              {[
                                ['Cliente', c.user_name],
                                ['Apólice', c.policy_number],
                                ['Seguradora', c.insurer],
                                ['Data sinistro', formatDate(c.incident_date)],
                                c.incident_location ? ['Local', c.incident_location] : null,
                                ['Coberto', c.is_covered ? 'Sim' : 'Não'],
                              ].filter(Boolean).map(([label, value]: any) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.78rem' }}>
                                  <span style={{ color: '#94A3B8' }}>{label}</span>
                                  <span style={{ fontWeight: 500, color: '#0F172A' }}>{value}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.625rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                                "{c.description}"
                              </div>
                            </div>

                            {/* Actions + Notes row */}
                            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', display: 'grid', gridTemplateColumns: bp.isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                              {/* Actions */}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ações</div>
                                {actionForm?.claimId === c.id ? (() => { const af = actionForm!; return (
                                  <div style={{ background: '#F8FAFC', borderRadius: '0.75rem', padding: '1rem', border: '1.5px solid #E2E8F0' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.75rem', color: '#0F172A' }}>
                                      {af.action === 'approve' && '✅ Aprovar sinistro'}
                                      {af.action === 'reject' && '❌ Rejeitar sinistro'}
                                      {af.action === 'request_docs' && '📄 Solicitar documentação'}
                                      {af.action === 'assign_expert' && '👷 Atribuir perito'}
                                      {af.action === 'mark_paid' && '💰 Marcar como pago'}
                                    </div>
                                    {af.action === 'approve' && (
                                      <input type="number" value={af.value} onChange={e => setActionForm(f => f ? { ...f, value: e.target.value } : f)}
                                        placeholder="Valor a aprovar (€)" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '0.625rem', boxSizing: 'border-box' as any }} />
                                    )}
                                    {(af.action === 'reject' || af.action === 'request_docs') && (
                                      <textarea value={af.value} onChange={e => setActionForm(f => f ? { ...f, value: e.target.value } : f)}
                                        placeholder={af.action === 'reject' ? 'Motivo de rejeição…' : 'Mensagem para o cliente…'}
                                        rows={3} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '0.625rem', resize: 'vertical', boxSizing: 'border-box' as any }} />
                                    )}
                                    {af.action === 'assign_expert' && (
                                      <>
                                        <input value={af.value} onChange={e => setActionForm(f => f ? { ...f, value: e.target.value } : f)}
                                          placeholder="Nome do perito" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '0.5rem', boxSizing: 'border-box' as any }} />
                                        <input value={af.value2} onChange={e => setActionForm(f => f ? { ...f, value2: e.target.value } : f)}
                                          placeholder="Telefone (opcional)" style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '0.625rem', boxSizing: 'border-box' as any }} />
                                      </>
                                    )}
                                    {af.action === 'mark_paid' && (
                                      <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.625rem' }}>
                                        Confirmar pagamento de {formatCurrency(c.approved_amount ?? c.estimated_amount)} ao cliente?
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button onClick={handleClaimAction} disabled={submittingAction}
                                        style={{ flex: 1, padding: '0.5rem', background: '#0F172A', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                                        {submittingAction ? 'A submeter…' : 'Confirmar'}
                                      </button>
                                      <button onClick={() => setActionForm(null)}
                                        style={{ padding: '0.5rem 0.875rem', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', color: '#64748B' }}>
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ); })() : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                    {!['approved','paid','rejected'].includes(c.status) && (
                                      <button onClick={() => setActionForm({ claimId: c.id, action: 'approve', value: String(c.estimated_amount ?? ''), value2: '' })}
                                        style={{ padding: '0.375rem 0.75rem', border: '1.5px solid #A7F3D0', borderRadius: '0.5rem', background: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>✅ Aprovar</button>
                                    )}
                                    {!['rejected','paid'].includes(c.status) && (
                                      <button onClick={() => setActionForm({ claimId: c.id, action: 'reject', value: '', value2: '' })}
                                        style={{ padding: '0.375rem 0.75rem', border: '1.5px solid #FECACA', borderRadius: '0.5rem', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>❌ Rejeitar</button>
                                    )}
                                    {!['paid','rejected'].includes(c.status) && (
                                      <button onClick={() => setActionForm({ claimId: c.id, action: 'request_docs', value: '', value2: '' })}
                                        style={{ padding: '0.375rem 0.75rem', border: '1.5px solid #BFDBFE', borderRadius: '0.5rem', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>📄 Pedir docs</button>
                                    )}
                                    {!['expert_assigned','approved','paid','rejected'].includes(c.status) && (
                                      <button onClick={() => setActionForm({ claimId: c.id, action: 'assign_expert', value: '', value2: '' })}
                                        style={{ padding: '0.375rem 0.75rem', border: '1.5px solid #DDD6FE', borderRadius: '0.5rem', background: '#F5F3FF', color: '#7C3AED', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>👷 Perito</button>
                                    )}
                                    {c.status === 'approved' && (
                                      <button onClick={() => setActionForm({ claimId: c.id, action: 'mark_paid', value: '', value2: '' })}
                                        style={{ padding: '0.375rem 0.75rem', border: '1.5px solid #A7F3D0', borderRadius: '0.5rem', background: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>💰 Marcar pago</button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Internal notes */}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notas internas</div>
                                {(c.internal_notes ?? []).length > 0 && (
                                  <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 140, overflowY: 'auto' }}>
                                    {(c.internal_notes ?? []).map((n: any, i: number) => (
                                      <div key={i} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                                        <div style={{ color: '#78350F' }}>{n.text}</div>
                                        <div style={{ color: '#B45309', fontSize: '0.68rem', marginTop: '0.2rem' }}>{new Date(n.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input
                                    value={notesForm?.claimId === c.id ? notesForm!.text : ''}
                                    onFocus={() => setNotesForm(f => f?.claimId === c.id ? f : { claimId: c.id, text: '' })}
                                    onChange={e => setNotesForm(f => f ? { ...f, text: e.target.value } : { claimId: c.id, text: e.target.value })}
                                    placeholder="Adicionar nota interna…"
                                    style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '0.5rem', fontSize: '0.78rem', outline: 'none' }}
                                  />
                                  <button onClick={handleAddNote} disabled={submittingNote || !notesForm?.text.trim()}
                                    style={{ padding: '0.5rem 0.875rem', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', opacity: !notesForm?.text.trim() ? 0.5 : 1 }}>
                                    {submittingNote ? '…' : 'Guardar'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {claims.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.875rem' }}>
              Nenhuma participação encontrada.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FraudScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#DC2626' : score >= 45 ? '#EA580C' : score >= 25 ? '#D97706' : '#059669';
  const pct   = Math.min(100, score);
  const r     = 28;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ * 0.75;
  const offset = circ * 0.125;

  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="#F1F5F9" strokeWidth={6} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={-offset} strokeLinecap="round" transform="rotate(135 36 36)" />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} strokeLinecap="round" transform="rotate(135 36 36)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}
