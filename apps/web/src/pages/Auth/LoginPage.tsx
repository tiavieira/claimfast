import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const DEMOS = [
  { label: 'João Silva',    sub: '2 apólices · auto + habitação', email: 'joao@demo.pt',   initials: 'JS', color: '#2563EB' },
  { label: 'Maria Santos',  sub: '1 apólice saúde · 2 sinistros', email: 'maria@demo.pt',  initials: 'MS', color: '#059669' },
  { label: 'Pedro Costa',   sub: '2 apólices · 1 sinistro activo', email: 'pedro@demo.pt', initials: 'PC', color: '#7C3AED' },
  { label: 'Ana Ferreira',  sub: '⚠️ Perfil de alto risco',       email: 'ana@demo.pt',    initials: 'AF', color: '#DC2626' },
];

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate  = useNavigate();
  const { isMobile } = useBreakpoint();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [hoverDemo, setHoverDemo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou password incorretos.');
    } finally { setLoading(false); }
  };

  const quickLogin = async (demoEmail: string) => {
    setError(''); setLoading(true);
    try { await login(demoEmail, 'Demo1234!'); navigate('/'); }
    catch { setError('Erro ao autenticar.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: isMobile ? 'column' : 'row', background: 'var(--cf-bg)' }}>
      {/* Left panel */}
      <div
        style={{
          flex: '0 0 480px',
          background: 'linear-gradient(160deg, #1A2E52 0%, #0D1E3A 55%, #0A1629 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="login-panel"
      >
        {/* Animated orbs */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(255,86,48,0.18)',
          filter: 'blur(60px)',
          animation: 'float-slow 9s ease-in-out 0s infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'rgba(46,80,140,0.25)',
          filter: 'blur(60px)',
          animation: 'float-slow 12s ease-in-out 3s infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '45%',
          right: '8%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,170,100,0.12)',
          filter: 'blur(60px)',
          animation: 'float-slow 7s ease-in-out 1.5s infinite',
          pointerEvents: 'none',
        }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '3rem' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '0.875rem',
              background: 'linear-gradient(135deg, #FF5630, #FF8047)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,86,48,0.45), 0 2px 6px rgba(255,86,48,0.25)',
            }}>
              <Zap size={26} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>ClaimFast</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Sinistros em segundos</div>
            </div>
          </div>

          <h1 style={{ color: 'white', fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
            Participar um sinistro<br />
            <span style={{ color: '#FF5630' }}>nunca foi tão simples.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Voz, foto e IA. Em menos de 90 segundos a sua participação está submetida, validada e em curso.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.875rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {[['< 90s', 'para participar'], ['97%', 'satisfação'], ['5 dias', 'resolução média']].map(([val, label]) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '0.625rem 1rem',
                }}
              >
                <div style={{ color: '#FF5630', fontWeight: 800, fontSize: '1.2rem' }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: '0.1rem' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div style={{ marginTop: '2.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', letterSpacing: '0.02em' }}>
            🔐 Dados protegidos · ISO 27001 · RGPD compliant
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1.25rem' : '2rem' }}>
        <motion.div
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Form card */}
          <div style={{
            background: 'white',
            borderRadius: isMobile ? '1.25rem' : '1.5rem',
            padding: isMobile ? '1.75rem 1.25rem' : '2.5rem',
            boxShadow: '0 8px 40px rgba(12,25,41,0.10), 0 2px 12px rgba(12,25,41,0.06)',
            border: '1px solid rgba(221,230,240,0.8)',
            marginBottom: '1.25rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bem-vindo</h2>
            <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Aceda à sua área de seguros e sinistros.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field icon={<Mail size={16} />} type="email" placeholder="Email" value={email} onChange={setEmail} />
              <Field icon={<Lock size={16} />} type="password" placeholder="Password" value={password} onChange={setPassword} />

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cf-error)', fontSize: '0.85rem', background: 'var(--cf-error-bg)', padding: '0.625rem 0.875rem', borderRadius: '0.625rem' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{
                  padding: '0.9rem',
                  background: loading
                    ? 'var(--cf-border-strong)'
                    : 'linear-gradient(135deg, #FF5630, #FF7A54)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--cf-radius)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(255,86,48,0.38), 0 2px 6px rgba(255,86,48,0.18)',
                  transition: 'box-shadow 0.18s',
                }}
              >
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> A entrar...</> : 'Entrar'}
              </motion.button>
            </form>
          </div>

          {/* Demo accounts */}
          <div style={{
            background: 'white',
            borderRadius: isMobile ? '1.25rem' : '1.5rem',
            padding: isMobile ? '1.25rem' : '1.5rem',
            boxShadow: '0 4px 20px rgba(12,25,41,0.07), 0 1px 6px rgba(12,25,41,0.04)',
            border: '1px solid rgba(221,230,240,0.8)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--cf-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', whiteSpace: 'nowrap' }}>Clientes demo</span>
              <div style={{ flex: 1, height: 1, background: 'var(--cf-border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DEMOS.map(d => (
                <motion.button
                  key={d.email}
                  whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => quickLogin(d.email)}
                  disabled={loading}
                  onMouseEnter={() => setHoverDemo(d.email)}
                  onMouseLeave={() => setHoverDemo(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: hoverDemo === d.email ? 'var(--cf-surface2)' : 'var(--cf-surface)',
                    border: '1.5px solid var(--cf-border)',
                    borderLeft: hoverDemo === d.email ? `3px solid var(--cf-accent)` : '1.5px solid var(--cf-border)',
                    borderRadius: 'var(--cf-radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `${d.color}18`,
                    color: d.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    border: `1.5px solid ${d.color}30`,
                  }}>
                    {d.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--cf-text)' }}>{d.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)', marginTop: '0.1rem' }}>{d.sub}</div>
                  </div>
                  <Shield size={14} color="var(--cf-text-muted)" />
                </motion.button>
              ))}
            </div>

            {/* Insurer portal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 0.875rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--cf-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', whiteSpace: 'nowrap' }}>Portal seguradora</span>
              <div style={{ flex: 1, height: 1, background: 'var(--cf-border)' }} />
            </div>
            <motion.button
              whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/insurer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'linear-gradient(135deg, #1A2E52, #2E508C)',
                border: 'none',
                borderRadius: 'var(--cf-radius-sm)',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(26,46,82,0.25)',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Dashboard Operacional</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>Fidelidade S.A. · 22 sinistros · 4 alertas de fraude</div>
              </div>
              <Shield size={16} color="#FF5630" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 768px) { .login-panel { display: none !important; } }
      `}</style>
    </div>
  );
}

function Field({ icon, type, placeholder, value, onChange }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        left: '0.875rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: focused ? 'var(--cf-accent)' : 'var(--cf-text-muted)',
        transition: 'color 0.18s',
      }}>
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{
          width: '100%',
          padding: '0.875rem 0.875rem 0.875rem 2.5rem',
          border: `1.5px solid ${focused ? 'var(--cf-accent)' : 'var(--cf-border)'}`,
          borderRadius: 'var(--cf-radius-sm)',
          fontSize: '0.9rem',
          background: 'var(--cf-surface)',
          color: 'var(--cf-text)',
          outline: 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          boxShadow: focused ? '0 0 0 3px rgba(255,86,48,0.15)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}
