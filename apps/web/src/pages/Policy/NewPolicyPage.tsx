import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Home, Heart, Shield, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { api } from '../../config/api';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const TYPES = [
  { value: 'auto',   label: 'Automóvel', icon: <Car size={22} />,    color: '#2563EB', desc: 'Veículo ligeiro ou pesado' },
  { value: 'home',   label: 'Habitação', icon: <Home size={22} />,   color: '#059669', desc: 'Casa ou apartamento' },
  { value: 'health', label: 'Saúde',     icon: <Heart size={22} />,  color: '#DC2626', desc: 'Seguro de saúde individual ou familiar' },
  { value: 'life',   label: 'Vida',      icon: <Shield size={22} />, color: '#7C3AED', desc: 'Capital em caso de morte ou invalidez' },
];

const INSURERS = [
  'Fidelidade', 'Allianz', 'Tranquilidade', 'Médis', 'AdvanceCare',
  'AXA', 'Zurich', 'Generali', 'Ageas', 'Lusitânia', 'GNB Seguros', 'Outro',
];

export function NewPolicyPage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [step, setStep]     = useState<'type' | 'details' | 'done'>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const [form, setForm] = useState({
    type: '',
    insurer: '',
    policy_number: '',
    start_date: '',
    end_date: '',
    premium_monthly: '',
    plate: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    address: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedType = TYPES.find(t => t.value === form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/policies', {
        ...form,
        premium_monthly: form.premium_monthly ? parseFloat(form.premium_monthly) : undefined,
        vehicle_year: form.vehicle_year ? parseInt(form.vehicle_year) : undefined,
      });
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erro ao registar apólice.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 0.875rem',
    border: '1.5px solid var(--cf-border)',
    borderRadius: 'var(--cf-radius)',
    background: 'var(--cf-bg)',
    color: 'var(--cf-text)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--cf-text-sec)',
    marginBottom: '0.375rem',
  };

  if (step === 'done') return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: isMobile ? '2rem 1rem' : '4rem 1.25rem', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={36} color="#059669" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>Apólice submetida</h2>
        <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          A tua apólice foi registada e está <strong>pendente de validação</strong> pela seguradora.
          Receberás confirmação em breve. Enquanto isso, não é possível submeter sinistros associados.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setStep('type'); setForm({ type:'',insurer:'',policy_number:'',start_date:'',end_date:'',premium_monthly:'',plate:'',vehicle_make:'',vehicle_model:'',vehicle_year:'',address:'' }); }}
            style={{ padding: '0.7rem 1.25rem', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius)', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
          >
            Adicionar outra
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: 'var(--cf-radius)', background: 'var(--cf-accent)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}
          >
            Ir para o dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 5rem' : '2rem 1.25rem 4rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <button onClick={() => step === 'details' ? setStep('type') : navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cf-text-sec)', fontSize: '0.85rem', marginBottom: '1.25rem', padding: 0 }}>
          <ChevronLeft size={16} /> {step === 'details' ? 'Escolher tipo' : 'Dashboard'}
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Registar apólice</h1>
        <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {step === 'type' ? 'Qual o tipo de seguro?' : `Dados da apólice de ${selectedType?.label.toLowerCase()}`}
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          {(['type', 'details'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                background: step === s ? 'var(--cf-accent)' : (i < ['type','details'].indexOf(step) ? '#059669' : 'var(--cf-border)'),
                color: step === s || i < ['type','details'].indexOf(step) ? 'white' : 'var(--cf-text-muted)',
              }}>{i + 1}</div>
              {i < 1 && <div style={{ flex: 1, height: 2, background: i < ['type','details'].indexOf(step) ? '#059669' : 'var(--cf-border)', borderRadius: 2 }} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Step 1: Type */}
      {step === 'type' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {TYPES.map(t => (
              <motion.button
                key={t.value}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { set('type', t.value); setStep('details'); }}
                style={{
                  padding: '1.5rem 1rem',
                  background: 'var(--cf-surface)',
                  border: `2px solid ${form.type === t.value ? t.color : 'var(--cf-border)'}`,
                  borderRadius: 'var(--cf-radius)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(12,25,41,0.05)',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: `${t.color}15`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                  {t.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{t.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit}>
          <div style={{ background: 'var(--cf-surface)', borderRadius: 'var(--cf-radius-lg)', padding: isMobile ? '1.25rem' : '1.75rem', border: '1.5px solid var(--cf-border)', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Insurer */}
            <div>
              <label style={labelStyle}>Seguradora *</label>
              <select value={form.insurer} onChange={e => set('insurer', e.target.value)} required style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Selecionar seguradora</option>
                {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Policy number */}
            <div>
              <label style={labelStyle}>Número de apólice *</label>
              <input value={form.policy_number} onChange={e => set('policy_number', e.target.value)} required placeholder="Ex: FID-AUTO-2024-12345" style={inputStyle} />
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.875rem' }}>
              <div>
                <label style={labelStyle}>Data de início *</label>
                <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Data de fim *</label>
                <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} required style={inputStyle} />
              </div>
            </div>

            {/* Premium */}
            <div>
              <label style={labelStyle}>Prémio mensal (€)</label>
              <input type="number" min="0" step="0.01" value={form.premium_monthly} onChange={e => set('premium_monthly', e.target.value)} placeholder="Ex: 42.50" style={inputStyle} />
            </div>

            {/* Auto-specific */}
            {form.type === 'auto' && (
              <>
                <div>
                  <label style={labelStyle}>Matrícula</label>
                  <input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())} placeholder="Ex: 45-AA-23" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={labelStyle}>Marca</label>
                    <input value={form.vehicle_make} onChange={e => set('vehicle_make', e.target.value)} placeholder="Ex: Toyota" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Modelo</label>
                    <input value={form.vehicle_model} onChange={e => set('vehicle_model', e.target.value)} placeholder="Ex: Yaris" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ano</label>
                    <input type="number" min="1990" max={new Date().getFullYear()} value={form.vehicle_year} onChange={e => set('vehicle_year', e.target.value)} placeholder="Ex: 2020" style={inputStyle} />
                  </div>
                </div>
              </>
            )}

            {/* Home-specific */}
            {form.type === 'home' && (
              <div>
                <label style={labelStyle}>Morada do imóvel</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex: Rua das Flores 12, Lisboa" style={inputStyle} />
              </div>
            )}

            {/* Pending notice */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--cf-radius)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#92400E', lineHeight: 1.5 }}>
              ⏳ Após submissão, a apólice ficará <strong>pendente de validação</strong> pela seguradora. Não é possível submeter sinistros até à validação.
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--cf-radius)', padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#DC2626' }}>
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '1.25rem',
              padding: '0.9rem',
              background: loading ? 'var(--cf-border)' : 'var(--cf-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--cf-radius)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? 'A submeter…' : <>Submeter apólice <ChevronRight size={18} /></>}
          </button>
        </motion.form>
      )}
    </div>
  );
}
