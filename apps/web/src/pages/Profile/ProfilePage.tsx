import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Phone, CreditCard, Hash, Save, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../config/api';
import { useAuthStore } from '../../store/auth.store';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loadProfile } = useAuthStore();
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState({ name: '', phone: '', nif: '', iban: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data;
      setForm({ name: u.name ?? '', phone: u.phone ?? '', nif: u.nif ?? '', iban: u.iban ?? '' });
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/auth/profile', form);
      await loadProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erro ao guardar');
    } finally { setSaving(false); }
  };

  const Field = ({ label, icon, fieldKey, placeholder, type = 'text' }: { label: string; icon: React.ReactNode; fieldKey: keyof typeof form; placeholder: string; type?: string }) => (
    <div>
      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cf-text-sec)', display: 'block', marginBottom: '0.4rem' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--cf-text-muted)', display: 'flex', pointerEvents: 'none' }}>{icon}</div>
        <input type={type} value={form[fieldKey]} onChange={e => set(fieldKey, e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.5rem', border: '1.5px solid var(--cf-border)', borderRadius: 'var(--cf-radius-sm)', fontSize: '0.875rem', background: 'var(--cf-surface2)', color: 'var(--cf-text)', outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = 'var(--cf-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,86,48,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--cf-border)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '1rem 0.875rem 5rem' : '2rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'white', border: '1.5px solid var(--cf-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cf-text-sec)', boxShadow: 'var(--cf-shadow)' }}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>O meu perfil</h1>
          <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.85rem', marginTop: '0.1rem' }}>Dados pessoais e informação bancária</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 'var(--cf-radius-lg)', padding: isMobile ? '1.25rem' : '1.75rem', boxShadow: '0 2px 8px rgba(12,25,41,0.06)', border: '1px solid var(--cf-border)', marginBottom: '1.25rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <Field label="Nome completo" icon={<User size={15} />} fieldKey="name" placeholder="Nome completo" />
          <Field label="Telemóvel" icon={<Phone size={15} />} fieldKey="phone" placeholder="+351 9XX XXX XXX" type="tel" />
          <Field label="NIF" icon={<Hash size={15} />} fieldKey="nif" placeholder="123456789" />
          <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--cf-border)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--cf-text-muted)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
              O IBAN é utilizado para receber indemnizações diretamente na sua conta bancária.
            </p>
            <Field label="IBAN (para receber pagamentos)" icon={<CreditCard size={15} />} fieldKey="iban" placeholder="PT50 0000 0000 0000 0000 0000 0" />
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--cf-radius)', padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#DC2626' }}>{error}</div>}
          {saved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: 'var(--cf-success-bg)', border: '1px solid #A7F3D0', borderRadius: 'var(--cf-radius)', padding: '0.75rem 1rem', fontSize: '0.83rem', color: 'var(--cf-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={15} /> Perfil guardado com sucesso.
            </motion.div>
          )}

          <button type="submit" disabled={saving}
            style={{ padding: '0.875rem', background: saving ? '#94A3B8' : 'linear-gradient(135deg, #FF5630, #FF7A54)', color: 'white', border: 'none', borderRadius: 'var(--cf-radius)', fontWeight: 700, fontSize: '0.925rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> A guardar…</> : <><Save size={16} /> Guardar alterações</>}
          </button>
        </form>
      </motion.div>

      <div style={{ background: 'white', borderRadius: 'var(--cf-radius-lg)', padding: '1.25rem', border: '1px solid var(--cf-border)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Conta</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--cf-text-sec)', marginBottom: '0.2rem', fontWeight: 500 }}>{user?.email}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)' }}>O email não pode ser alterado</div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
