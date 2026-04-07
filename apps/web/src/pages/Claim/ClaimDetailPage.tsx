import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, Clock, Search, Shield, Banknote, AlertCircle, Send, Loader2, MessageCircle, Wrench, Star, MapPin, Phone, Navigation } from 'lucide-react';
import { api } from '../../config/api';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/format';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const STATUS_STEPS = [
  { key: 'submitted',       label: 'Submetido',        icon: CheckCircle },
  { key: 'under_review',    label: 'Em análise',        icon: Search },
  { key: 'expert_assigned', label: 'Perito atribuído',  icon: Shield },
  { key: 'approved',        label: 'Aprovado',          icon: CheckCircle },
  { key: 'paid',            label: 'Pago',              icon: Banknote },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: '#2563EB', under_review: '#D97706', expert_assigned: '#7C3AED',
  approved: '#059669', rejected: '#DC2626', paid: '#059669',
};

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const { isMobile } = useBreakpoint();

  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'chat' | 'repair'>('timeline');
  const [shops, setShops] = useState<any[]>([]);
  const [authorizing, setAuthorizing] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = () => api.get(`/claims/${id}`).then(r => {
    setClaim(r.data);
    // Load repair shops for auto claims that are approved or paid
    if (['auto'].includes(r.data.policy_type) && ['approved','paid','expert_assigned'].includes(r.data.status)) {
      api.get('/insurer/repair-shops', { headers: { Authorization: 'Bearer insurer-demo-2024' } })
        .then(s => setShops(s.data));
    }
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (activeTab === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [claim?.messages, activeTab]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const text = message;
    setMessage('');
    try {
      await api.post(`/claims/${id}/messages`, { text });
      setTimeout(load, 2000);
    } finally { setSending(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--cf-text-muted)' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!claim) return <div style={{ padding: '2rem', textAlign: 'center' }}>Sinistro não encontrado.</div>;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === claim.status);
  const accentColor = STATUS_COLORS[claim.status] ?? '#2563EB';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '1rem 0.875rem 4rem' : '1.5rem 1rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'var(--cf-surface)', border: '1.5px solid var(--cf-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cf-text-sec)', flexShrink: 0 }}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{claim.title}</h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', marginTop: '0.125rem' }}>
            {claim.insurer} · {claim.policy_number}
          </div>
        </div>
      </div>

      {/* New claim success banner */}
      <AnimatePresence>
        {isNew && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'var(--cf-success-bg)', border: '1.5px solid #A7F3D0', borderRadius: 'var(--cf-radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}
          >
            <CheckCircle size={20} color="var(--cf-success)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--cf-success)', marginBottom: '0.2rem' }}>Participação submetida com sucesso!</div>
              <div style={{ fontSize: '0.85rem', color: '#047857' }}>A sua participação foi recebida e está a ser processada. Acompanhe o estado abaixo.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status card */}
      <div style={{ background: 'var(--cf-surface)', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius)', padding: isMobile ? '1rem' : '1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--cf-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', marginBottom: '0.25rem' }}>Estado atual</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: accentColor }}>
              {STATUS_STEPS.find(s => s.key === claim.status)?.label ?? claim.status}
            </div>
          </div>
          {claim.estimated_amount && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', marginBottom: '0.25rem' }}>
                {claim.approved_amount ? 'Valor aprovado' : 'Estimativa'}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: claim.approved_amount ? 'var(--cf-success)' : 'var(--cf-text)' }}>
                {formatCurrency(claim.approved_amount ?? claim.estimated_amount)}
              </div>
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STATUS_STEPS.map((step, i) => {
            const done    = i <= currentStepIndex;
            const current = i === currentStepIndex;
            const Icon    = step.icon;
            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                  <motion.div
                    animate={{ scale: current ? [1, 1.1, 1] : 1 }}
                    transition={{ repeat: current ? Infinity : 0, duration: 1.5 }}
                    style={{
                      width: isMobile ? 24 : 28,
                      height: isMobile ? 24 : 28,
                      borderRadius: '50%',
                      background: done ? accentColor : 'var(--cf-border)',
                      color: done ? 'white' : 'var(--cf-text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: current ? `0 0 0 4px ${accentColor}25` : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    <Icon size={13} />
                  </motion.div>
                  <div style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', color: done ? accentColor : 'var(--cf-text-muted)', textAlign: 'center', lineHeight: 1.2, fontWeight: current ? 700 : 400 }}>
                    {step.label}
                  </div>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ height: 2, flex: 1, background: i < currentStepIndex ? accentColor : 'var(--cf-border)', marginBottom: '1.25rem', transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Expert */}
      {claim.expert_name && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'var(--cf-surface)', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius)', padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)' }}>Perito atribuído</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{claim.expert_name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-sec)' }}>{claim.expert_phone}</div>
          </div>
        </motion.div>
      )}

      {/* AI summary */}
      {claim.ai_analysis && (
        <div style={{ background: 'var(--cf-surface2)', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            Análise automática · IA
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Tipo', value: claim.ai_analysis.suggestedTitle },
              { label: 'Gravidade', value: { low: 'Baixa', medium: 'Média', high: 'Alta', total_loss: 'Perda total' }[claim.ai_analysis.severity as string] },
              { label: 'Confiança IA', value: `${Math.round(claim.ai_analysis.confidence * 100)}%` },
            ].map(item => (
              <div key={item.label} style={{ flex: '1 1 auto', minWidth: 80 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--cf-text-muted)', marginBottom: '0.2rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {claim.coverage_reason && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--cf-border)', fontSize: '0.82rem', color: claim.is_covered ? 'var(--cf-success)' : 'var(--cf-error)', display: 'flex', gap: '0.375rem' }}>
              {claim.is_covered ? <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
              {claim.coverage_reason}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--cf-surface)', border: '1.5px solid var(--cf-border)', borderRadius: '0.75rem', padding: '0.25rem', marginBottom: '1rem' }}>
        {([
          { key: 'timeline', label: 'Timeline',  icon: <Clock size={13} /> },
          { key: 'chat',     label: 'Mensagens', icon: <MessageCircle size={13} /> },
          ...(shops.length > 0 ? [{ key: 'repair', label: 'Oficinas', icon: <Wrench size={13} /> }] : []),
        ] as const).map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: isMobile ? '0.5rem' : '0.625rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
            background: activeTab === tab.key ? 'var(--cf-accent)' : 'transparent',
            color: activeTab === tab.key ? 'white' : 'var(--cf-text-muted)',
            fontWeight: 500, fontSize: isMobile ? '0.75rem' : '0.8rem', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Timeline tab */}
        {activeTab === 'timeline' && (
          <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {(claim.events ?? []).map((ev: any, i: number) => (
              <motion.div key={ev.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', gap: '0.875rem', marginBottom: '0' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: STATUS_COLORS[ev.status] ?? 'var(--cf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={13} color="white" />
                  </div>
                  {i < (claim.events?.length ?? 0) - 1 && <div style={{ width: 2, flex: 1, minHeight: 32, background: 'var(--cf-border)', margin: '4px 0' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--cf-text)', marginBottom: '0.2rem' }}>{ev.title}</div>
                  {ev.description && <div style={{ fontSize: '0.82rem', color: 'var(--cf-text-sec)', lineHeight: 1.5, marginBottom: '0.25rem' }}>{ev.description}</div>}
                  <div style={{ fontSize: '0.7rem', color: 'var(--cf-text-muted)' }}>{formatDateTime(ev.created_at)}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Chat tab */}
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', minHeight: 200 }}>
              {(claim.messages ?? []).map((msg: any) => {
                const isCustomer = msg.role === 'customer';
                const isSystem   = msg.role === 'system';
                if (isSystem) return (
                  <div key={msg.id} style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--cf-text-muted)', padding: '0.375rem 1rem', background: 'var(--cf-surface2)', borderRadius: '999px', margin: '0 auto', maxWidth: isMobile ? '90%' : '80%' }}>
                    {msg.text}
                  </div>
                );
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isCustomer ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: isMobile ? '90%' : '80%', padding: '0.75rem 1rem',
                      borderRadius: isCustomer ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      background: isCustomer ? 'var(--cf-accent)' : 'var(--cf-surface)',
                      color: isCustomer ? 'white' : 'var(--cf-text)',
                      border: isCustomer ? 'none' : '1.5px solid var(--cf-border)',
                      fontSize: '0.875rem', lineHeight: 1.5,
                      boxShadow: 'var(--cf-shadow)',
                    }}>
                      {!isCustomer && <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cf-text-muted)', marginBottom: '0.3rem' }}>Gestor de processo</div>}
                      {msg.text}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--cf-text-muted)', marginTop: '0.2rem', padding: '0 0.25rem' }}>{formatDateTime(msg.created_at)}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send message */}
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Escreva uma mensagem para o gestor do processo..."
                rows={2}
                style={{ flex: 1, padding: '0.75rem', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius)', fontSize: '0.875rem', lineHeight: 1.5, background: 'var(--cf-surface)', color: 'var(--cf-text)', outline: 'none', resize: 'none' }}
                onFocus={e => (e.target.style.borderColor = 'var(--cf-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--cf-border)')}
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={sendMessage}
                disabled={!message.trim() || sending}
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: message.trim() && !sending ? 'pointer' : 'default', background: message.trim() && !sending ? 'var(--cf-accent)' : 'var(--cf-border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              </motion.button>
            </div>
          </motion.div>
        )}
        {/* Repair shops tab */}
        {activeTab === 'repair' && (
          <motion.div key="repair" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {authorized ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'var(--cf-success-bg)', border: '1.5px solid #A7F3D0', borderRadius: 'var(--cf-radius)', padding: '1.25rem', marginBottom: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle size={22} color="var(--cf-success)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--cf-success)', marginBottom: '0.25rem' }}>Reparação pré-autorizada!</div>
                    <div style={{ fontSize: '0.85rem', color: '#047857', marginBottom: '0.5rem' }}>{authorized.message}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: 'var(--cf-success)', background: 'white', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                      {authorized.authorizationCode}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6EE7B7', marginTop: '0.375rem' }}>
                      Válido até {new Date(authorized.validUntil).toLocaleDateString('pt-PT')}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--cf-text-sec)', marginBottom: '1rem' }}>
                Escolha uma oficina parceira autorizada. A reparação fica pré-aprovada automaticamente.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {shops.map((shop, i) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: 'var(--cf-surface)', border: `1.5px solid ${authorized?.shop?.id === shop.id ? '#A7F3D0' : 'var(--cf-border)'}`, borderRadius: 'var(--cf-radius)', padding: '1rem', boxShadow: 'var(--cf-shadow)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{shop.name}</span>
                        {shop.authorized && (
                          <span style={{ fontSize: '0.62rem', background: '#EFF6FF', color: '#2563EB', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>Parceiro oficial</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--cf-text-muted)' }}>
                        <MapPin size={11} /> {shop.address}
                        <span>·</span>
                        <Navigation size={11} /> {shop.distance} km
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{shop.rating}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--cf-text-muted)' }}>({shop.reviews})</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: shop.waitDays === 0 ? 'var(--cf-success)' : shop.waitDays <= 1 ? '#D97706' : 'var(--cf-text-muted)', fontWeight: 500 }}>
                        {shop.availability}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {shop.specialties.map((s: string) => (
                      <span key={s} style={{ fontSize: '0.68rem', background: 'var(--cf-bg)', color: 'var(--cf-text-sec)', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid var(--cf-border)' }}>{s}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={`tel:${shop.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', border: '1.5px solid var(--cf-border)', borderRadius: '0.625rem', textDecoration: 'none', color: 'var(--cf-text-sec)', fontSize: '0.8rem', fontWeight: 500 }}>
                      <Phone size={13} /> {shop.phone}
                    </a>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      disabled={authorizing === shop.id || !!authorized}
                      onClick={async () => {
                        setAuthorizing(shop.id);
                        try {
                          const { data } = await api.post(
                            `/insurer/repair-shops/${shop.id}/authorize`,
                            { claimId: id, estimatedAmount: claim?.estimated_amount },
                            { headers: { Authorization: 'Bearer insurer-demo-2024' } }
                          );
                          setAuthorized(data);
                        } finally { setAuthorizing(null); }
                      }}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                        padding: '0.5rem 0.875rem', border: 'none', borderRadius: '0.625rem',
                        background: authorized ? 'var(--cf-border)' : 'var(--cf-accent)',
                        color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: authorized ? 'default' : 'pointer',
                      }}
                    >
                      {authorizing === shop.id
                        ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> A autorizar...</>
                        : authorized?.shop?.id === shop.id
                          ? <><CheckCircle size={13} /> Autorizado</>
                          : <><Wrench size={13} /> Pré-autorizar reparação</>
                      }
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
