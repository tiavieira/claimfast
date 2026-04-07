import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Mic, MicOff, Keyboard, Camera,
  CheckCircle, AlertCircle, Loader2, Car, Home, Heart, Shield,
  MapPin, Calendar, Zap,
} from 'lucide-react';
import { api } from '../../config/api';
import { useVoice } from '../../hooks/useVoice';
import { formatCurrency } from '../../utils/format';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Step = 'policy' | 'input' | 'analysis' | 'photos' | 'confirm';

const TYPE_ICON: Record<string, React.ReactNode> = {
  auto: <Car size={22} />, home: <Home size={22} />, health: <Heart size={22} />, life: <Shield size={22} />,
};
const TYPE_LABEL: Record<string, string> = { auto: 'Automóvel', home: 'Habitação', health: 'Saúde', life: 'Vida' };
const TYPE_COLOR: Record<string, string> = { auto: '#2563EB', home: '#059669', health: '#DC2626', life: '#7C3AED' };

const PHOTO_GUIDES: Record<string, string[]> = {
  auto:   ['Vista frontal do veículo', 'Vista traseira', 'Danos em detalhe', 'Auto de ocorrência (se existir)'],
  home:   ['Área afetada - visão geral', 'Danos em detalhe', 'Origem do problema (se visível)', 'Outros danos'],
  health: ['Fatura / Recibo', 'Prescrição médica', 'Relatório médico', 'Outros documentos'],
  default:['Vista geral', 'Detalhe dos danos', 'Documento relevante'],
};

const STEP_LABELS = ['Apólice', 'Descrição', 'Análise', 'Evidências', 'Confirmação'];

export function NewClaimPage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [step, setStep] = useState<Step>('policy');
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [incidentLocation, setIncidentLocation] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [voiceText, setVoiceText]     = useState('');   // confirmed final text from voice
  const [interimText, setInterimText] = useState('');   // live interim (what's being said right now)
  const [voiceDone, setVoiceDone]     = useState(false); // true after stop → show editable textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get('/policies').then(r => setPolicies(r.data));
  }, []);

  /* ── Voice ── */
  const { listening, supported: voiceSupported, startListening, stopListening } = useVoice({
    lang: 'pt-PT',
    onFinalResult: (text) => {
      setInterimText('');
      setVoiceText(prev => {
        const next = prev ? prev + ' ' + text : text;
        setDescription(next);
        return next;
      });
    },
    onInterimResult: (text) => setInterimText(text),
  });

  const handleStopVoice = useCallback(() => {
    stopListening();
    setInterimText('');
    setVoiceDone(true);
  }, [stopListening]);

  const handleClearVoice = useCallback(() => {
    stopListening();
    setVoiceText('');
    setInterimText('');
    setDescription('');
    setVoiceDone(false);
  }, [stopListening]);

  /* ── Analyze ── */
  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post('/claims/analyze', {
        text: description,
        policyId: selectedPolicy.id,
      });
      setAnalysis(data.analysis);
      setCoverage(data.coverage);
      setStep('analysis');
    } finally { setAnalyzing(false); }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/claims', {
        policyId: selectedPolicy.id,
        description,
        incidentDate,
        incidentLocation,
        photos,
      });
      navigate(`/claim/${data.id}?new=1`);
    } finally { setSubmitting(false); }
  };

  /* ── Simulate photo ── */
  const addPhoto = (label: string) => {
    setPhotos(p => [...p, label]);
  };

  const STEPS: Step[] = ['policy', 'input', 'analysis', 'photos', 'confirm'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: isMobile ? '1rem 0.875rem 5rem' : '2rem 1.25rem 5rem', minHeight: '100%' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginBottom: '2.25rem' }}>
        {/* Back button */}
        <button
          onClick={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1]) : navigate('/')}
          style={{
            background: 'white',
            border: '1.5px solid var(--cf-border)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--cf-text-sec)',
            flexShrink: 0,
            marginRight: '1rem',
            marginTop: '0.1rem',
            boxShadow: 'var(--cf-shadow)',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Numbered steps */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {STEPS.map((s, i) => {
            const isDone    = i < stepIndex;
            const isActive  = i === stepIndex;
            const isFuture  = i > stepIndex;
            return (
              <React.Fragment key={s}>
                {/* Step circle + label */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    background: isDone
                      ? 'var(--cf-primary)'
                      : isActive
                        ? 'var(--cf-accent)'
                        : 'var(--cf-border)',
                    color: isFuture ? 'var(--cf-text-muted)' : 'white',
                    boxShadow: isActive
                      ? '0 0 0 4px rgba(255,86,48,0.20)'
                      : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div style={{
                    fontSize: '0.62rem',
                    fontWeight: 500,
                    color: isActive
                      ? 'var(--cf-accent)'
                      : isDone
                        ? 'var(--cf-primary)'
                        : 'var(--cf-text-muted)',
                    marginTop: '0.3rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: 60,
                    textAlign: 'center',
                    display: isMobile ? 'none' : 'block',
                  }}>
                    {STEP_LABELS[i]}
                  </div>
                </div>

                {/* Connecting line between circles */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    height: 2,
                    flex: 1,
                    background: i < stepIndex ? 'var(--cf-primary)' : 'var(--cf-border)',
                    marginTop: 13,
                    transition: 'background 0.3s',
                    maxWidth: 40,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Select policy ── */}
        {step === 'policy' && (
          <motion.div key="policy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Step card wrapper */}
            <div style={{
              background: 'white',
              borderRadius: 'var(--cf-radius-lg)',
              padding: isMobile ? '1.25rem' : '1.75rem',
              boxShadow: '0 2px 8px rgba(12,25,41,0.06), 0 8px 24px rgba(12,25,41,0.05)',
              border: '1px solid var(--cf-border)',
            }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Selecione a apólice</h2>
              <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Qual a apólice afetada pelo sinistro?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {policies.map((p, i) => {
                  const color = TYPE_COLOR[p.type] ?? '#64748B';
                  const isSelected = selectedPolicy?.id === p.id;
                  return (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => { setSelectedPolicy(p); setStep('input'); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: isMobile ? '0.875rem 1rem' : '1.125rem 1.25rem',
                        textAlign: 'left',
                        background: isSelected ? `${color}08` : 'var(--cf-surface2)',
                        border: `2px solid ${isSelected ? color : 'var(--cf-border)'}`,
                        boxShadow: isSelected ? `0 0 0 2px ${color}` : 'none',
                        borderRadius: 'var(--cf-radius)',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {TYPE_ICON[p.type]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{TYPE_LABEL[p.type] ?? p.type} · {p.insurer}</div>
                        {p.plate && <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-muted)', marginTop: '0.1rem' }}>{p.vehicle_make} {p.vehicle_model} · {p.plate}</div>}
                        {p.address && <div style={{ fontSize: '0.78rem', color: 'var(--cf-text-muted)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</div>}
                      </div>
                      <ChevronRight size={16} color={color} />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Describe ── */}
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--cf-radius-lg)',
              padding: isMobile ? '1.25rem' : '1.75rem',
              boxShadow: '0 2px 8px rgba(12,25,41,0.06), 0 8px 24px rgba(12,25,41,0.05)',
              border: '1px solid var(--cf-border)',
            }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>O que aconteceu?</h2>
              <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Descreva o sinistro por voz ou texto. A IA analisa automaticamente.
              </p>

              {/* Mode toggle — pill segmented control */}
              <div style={{
                display: 'flex',
                background: 'var(--cf-surface2)',
                border: '1.5px solid var(--cf-border)',
                borderRadius: '999px',
                padding: '0.25rem',
                marginBottom: '1.5rem',
                width: 'fit-content',
                gap: '0.125rem',
              }}>
                {(['voice', 'text'] as const).map(m => (
                  <button key={m} onClick={() => setInputMode(m)} style={{
                    padding: '0.45rem 1.25rem',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: inputMode === m ? 'var(--cf-accent)' : 'transparent',
                    color: inputMode === m ? 'white' : 'var(--cf-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: inputMode === m ? '0 2px 8px rgba(255,86,48,0.3)' : 'none',
                  }}>
                    {m === 'voice' ? <Mic size={14} /> : <Keyboard size={14} />}
                    {m === 'voice' ? 'Voz' : 'Texto'}
                  </button>
                ))}
              </div>

              {/* Voice mode */}
              {inputMode === 'voice' && (
                <div>
                  {!voiceSupported ? (
                    /* ── Browser not supported ── */
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--cf-warning-bg)', borderRadius: 'var(--cf-radius)', border: '1px solid var(--cf-warning-border)' }}>
                      <p style={{ color: 'var(--cf-warning)', fontWeight: 600, marginBottom: '0.75rem' }}>Voz não suportada neste browser</p>
                      <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.85rem', marginBottom: '1rem' }}>Usa Chrome ou Edge para captar voz.</p>
                      <button onClick={() => setInputMode('text')} style={{ color: 'var(--cf-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                        Mudar para texto →
                      </button>
                    </div>

                  ) : voiceDone && voiceText ? (
                    /* ── Done: editable transcript ── */
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cf-success)' }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cf-success)' }}>Capturado — pode editar antes de analisar</span>
                        </div>
                        <button
                          onClick={handleClearVoice}
                          style={{ fontSize: '0.75rem', color: 'var(--cf-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Limpar e regravar
                        </button>
                      </div>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={5}
                        style={{
                          width: '100%', padding: '0.875rem 1rem',
                          border: '1.5px solid var(--cf-success-border)',
                          borderLeft: '3px solid var(--cf-success)',
                          borderRadius: 'var(--cf-radius)', fontSize: '0.9rem', lineHeight: 1.65,
                          background: 'var(--cf-success-bg)', color: 'var(--cf-text)',
                          outline: 'none', resize: 'vertical',
                          transition: 'border-color 0.18s, box-shadow 0.18s',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = 'var(--cf-accent)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(255,86,48,0.12)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = 'var(--cf-success-border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {/* Quick re-record button */}
                      <button
                        onClick={() => { setVoiceDone(false); startListening(); }}
                        style={{ marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--cf-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        <Mic size={14} /> Acrescentar mais por voz
                      </button>
                    </motion.div>

                  ) : (
                    /* ── Recording / idle ── */
                    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem 1rem' }}>

                      {/* Mic button */}
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
                        {listening && (
                          <>
                            <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.35)', animation: 'pulse-ring 1.4s ease-out infinite' }} />
                            <div style={{ position: 'absolute', inset: -38, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.18)', animation: 'pulse-ring 1.4s ease-out 0.5s infinite' }} />
                            <div style={{ position: 'absolute', inset: -26, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', filter: 'blur(12px)', pointerEvents: 'none' }} />
                          </>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                          onClick={() => listening ? handleStopVoice() : startListening()}
                          style={{
                            width: 88, height: 88, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: listening
                              ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                              : 'linear-gradient(135deg, #FF5630, #FF7A54)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: listening
                              ? '0 0 0 5px rgba(239,68,68,0.22), 0 6px 28px rgba(239,68,68,0.45)'
                              : '0 6px 28px rgba(255,86,48,0.42), 0 2px 8px rgba(255,86,48,0.22)',
                            transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                          }}
                        >
                          {listening ? <MicOff size={34} /> : <Mic size={34} />}
                        </motion.button>
                      </div>

                      {/* Waveform bars when listening */}
                      {listening && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: 36, marginBottom: '0.75rem' }}>
                          {(isMobile
                            ? [0.4, 0.8, 0.55, 1.0, 0.65]
                            : [0.4, 0.8, 0.55, 1.0, 0.65, 0.9, 0.45, 0.75, 0.5]
                          ).map((intensity, i) => (
                            <motion.div
                              key={i}
                              animate={{ scaleY: [0.25, intensity, 0.25] }}
                              transition={{ duration: 0.55 + i * 0.04, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                              style={{ width: 4, height: 28, borderRadius: 3, background: '#EF4444', transformOrigin: 'center' }}
                            />
                          ))}
                        </div>
                      )}

                      <p style={{
                        color: listening ? '#DC2626' : 'var(--cf-text-muted)',
                        fontWeight: listening ? 600 : 400,
                        fontSize: '0.9rem',
                        marginBottom: (listening || voiceText) ? '1.25rem' : 0,
                      }}>
                        {listening ? 'A ouvir… pode falar' : 'Toque no microfone e descreva o que aconteceu'}
                      </p>

                      {/* Live transcript — confirmed + interim */}
                      {(voiceText || interimText) && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          style={{
                            background: 'var(--cf-surface2)', border: '1.5px solid var(--cf-border)',
                            borderLeft: '3px solid var(--cf-accent)', borderRadius: 'var(--cf-radius)',
                            padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.9rem', lineHeight: 1.65,
                          }}
                        >
                          <span style={{ color: 'var(--cf-text)' }}>{voiceText}</span>
                          {interimText && (
                            <span style={{ color: 'var(--cf-text-muted)', fontStyle: 'italic' }}>
                              {voiceText ? ' ' : ''}{interimText}
                            </span>
                          )}
                        </motion.div>
                      )}

                      {/* Stop + confirm when has text */}
                      {listening && voiceText && (
                        <motion.button
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          onClick={handleStopVoice}
                          style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', background: 'transparent', border: '1.5px solid var(--cf-border)', borderRadius: '999px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--cf-text-sec)' }}
                        >
                          Parar e confirmar
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Text mode */}
              {inputMode === 'text' && (
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Estava parado no semáforo quando um carro me bateu pela retaguarda. Danos no para-choques traseiro e mala do carro..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1.5px solid var(--cf-border)',
                    borderRadius: 'var(--cf-radius)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    background: 'var(--cf-surface2)',
                    color: 'var(--cf-text)',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--cf-accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255,86,48,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--cf-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              )}

              {/* Date + location */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.875rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cf-text-sec)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.4rem' }}>
                    <Calendar size={13} /> Data do sinistro
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={e => setIncidentDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
                      border: '1.5px solid var(--cf-border)',
                      borderRadius: 'var(--cf-radius-sm)',
                      fontSize: '0.875rem',
                      background: 'var(--cf-surface2)',
                      color: 'var(--cf-text)',
                      outline: 'none',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--cf-accent)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255,86,48,0.12)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--cf-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cf-text-sec)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.4rem' }}>
                    <MapPin size={13} /> Local (opcional)
                  </label>
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={e => setIncidentLocation(e.target.value)}
                    placeholder="Ex: A2, km 34"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
                      border: '1.5px solid var(--cf-border)',
                      borderRadius: 'var(--cf-radius-sm)',
                      fontSize: '0.875rem',
                      background: 'var(--cf-surface2)',
                      color: 'var(--cf-text)',
                      outline: 'none',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--cf-accent)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255,86,48,0.12)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--cf-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <PrimaryButton
                onClick={handleAnalyze}
                disabled={!description.trim() || analyzing || listening}
                style={{ marginTop: '1.75rem' }}
              >
                {analyzing
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> A analisar com IA...</>
                  : <><Zap size={18} /> Analisar com IA</>}
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Analysis result ── */}
        {step === 'analysis' && analysis && (
          <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--cf-radius-lg)',
              padding: isMobile ? '1.25rem' : '1.75rem',
              boxShadow: '0 2px 8px rgba(12,25,41,0.06), 0 8px 24px rgba(12,25,41,0.05)',
              border: '1px solid var(--cf-border)',
            }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Análise da IA</h2>
              <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Verifique os dados extraídos automaticamente.</p>

              {/* Coverage banner */}
              <motion.div
                initial={{ scale: 0.96 }} animate={{ scale: 1 }}
                style={{
                  padding: '0 0 0 0',
                  borderRadius: 'var(--cf-radius)',
                  marginBottom: '1.25rem',
                  background: coverage?.covered ? 'var(--cf-success-bg)' : 'var(--cf-error-bg)',
                  border: `1.5px solid ${coverage?.covered ? '#A7F3D0' : '#FECACA'}`,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {/* Colored left strip */}
                <div style={{
                  width: 6,
                  background: coverage?.covered ? 'var(--cf-success)' : 'var(--cf-error)',
                  flexShrink: 0,
                  borderRadius: 'var(--cf-radius) 0 0 var(--cf-radius)',
                }} />
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', padding: '1.125rem 1.25rem' }}>
                  <div style={{ marginTop: '0.1rem' }}>
                    {coverage?.covered
                      ? <CheckCircle size={22} color="var(--cf-success)" />
                      : <AlertCircle size={22} color="var(--cf-error)" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: coverage?.covered ? 'var(--cf-success)' : 'var(--cf-error)', marginBottom: '0.25rem' }}>
                      {coverage?.covered ? 'Coberto pela sua apólice' : 'Não coberto'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--cf-text-sec)', lineHeight: 1.5 }}>{coverage?.reason}</div>
                  </div>
                </div>
              </motion.div>

              {/* AI extracted data */}
              <div style={{
                background: 'var(--cf-surface2)',
                border: '1.5px solid var(--cf-border)',
                borderLeft: '3px solid var(--cf-accent)',
                borderRadius: 'var(--cf-radius)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cf-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
                  Dados extraídos
                </div>
                <Row label="Tipo de sinistro" value={analysis.suggestedTitle} />
                <Row label="Gravidade" value={{ low: 'Baixa', medium: 'Média', high: 'Alta', total_loss: 'Perda total' }[analysis.severity as string] ?? analysis.severity} />
                {analysis.location && <Row label="Local detectado" value={analysis.location} />}
                {analysis.damageItems?.length > 0 && <Row label="Danos identificados" value={analysis.damageItems.join(', ')} />}
                {analysis.involvedParties?.length > 0 && <Row label="Partes envolvidas" value={analysis.involvedParties.join(', ')} />}
                <Row
                  label="Estimativa inicial"
                  value={formatCurrency(analysis.estimatedAmount)}
                  highlight
                />
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--cf-border)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--cf-border)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${analysis.confidence * 100}%`, background: 'var(--cf-accent)', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--cf-text-muted)', flexShrink: 0 }}>Confiança {Math.round(analysis.confidence * 100)}%</span>
                </div>
              </div>

              <PrimaryButton onClick={() => setStep('photos')}>
                Continuar <ChevronRight size={18} />
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Photos ── */}
        {step === 'photos' && (
          <motion.div key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--cf-radius-lg)',
              padding: isMobile ? '1.25rem' : '1.75rem',
              boxShadow: '0 2px 8px rgba(12,25,41,0.06), 0 8px 24px rgba(12,25,41,0.05)',
              border: '1px solid var(--cf-border)',
            }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Adicionar evidências</h2>
              <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Fotografias aceleram o processo. Pode adicionar depois se preferir.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
                {(PHOTO_GUIDES[selectedPolicy?.type] ?? PHOTO_GUIDES.default).map((guide, i) => {
                  const added = photos.includes(guide);
                  return (
                    <motion.button
                      key={guide}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => added ? setPhotos(p => p.filter(x => x !== guide)) : addPhoto(guide)}
                      style={{
                        padding: '1.125rem',
                        border: `2px solid ${added ? 'var(--cf-accent)' : 'var(--cf-border)'}`,
                        borderRadius: 'var(--cf-radius)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: added ? 'var(--cf-accent-soft)' : 'var(--cf-surface2)',
                        boxShadow: added ? '0 0 0 2px rgba(255,86,48,0.15)' : 'none',
                        transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        {added ? <CheckCircle size={24} color="var(--cf-accent)" /> : <Camera size={24} color="var(--cf-text-muted)" />}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: added ? 'var(--cf-accent)' : 'var(--cf-text-sec)' }}>{guide}</div>
                    </motion.button>
                  );
                })}
              </div>
              {photos.length > 0 && (
                <div style={{ background: 'var(--cf-success-bg)', border: '1px solid #A7F3D0', borderRadius: 'var(--cf-radius)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--cf-success)' }}>
                  ✅ {photos.length} evidência{photos.length > 1 ? 's' : ''} adicionada{photos.length > 1 ? 's' : ''}
                </div>
              )}
              <PrimaryButton onClick={() => setStep('confirm')}>
                Continuar <ChevronRight size={18} />
              </PrimaryButton>
              <button
                onClick={() => setStep('confirm')}
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: 'transparent', border: 'none', color: 'var(--cf-text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Ignorar por agora
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Confirm ── */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--cf-radius-lg)',
              padding: isMobile ? '1.25rem' : '1.75rem',
              boxShadow: '0 2px 8px rgba(12,25,41,0.06), 0 8px 24px rgba(12,25,41,0.05)',
              border: '1px solid var(--cf-border)',
            }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Confirmar participação</h2>
              <p style={{ color: 'var(--cf-text-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Reveja e submeta a sua participação.</p>

              <div style={{
                background: 'var(--cf-surface2)',
                border: '1.5px solid var(--cf-border)',
                borderRadius: 'var(--cf-radius)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <Row label="Apólice" value={`${TYPE_LABEL[selectedPolicy?.type] ?? ''} · ${selectedPolicy?.insurer}`} />
                <Row label="Tipo de sinistro" value={analysis?.suggestedTitle ?? 'Sinistro'} />
                <Row label="Data" value={incidentDate} />
                {incidentLocation && <Row label="Local" value={incidentLocation} />}
                {photos.length > 0 && <Row label="Evidências" value={`${photos.length} foto${photos.length > 1 ? 's' : ''}`} />}
                {/* Gradient total line */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, rgba(255,86,48,0.06), rgba(255,122,84,0.04))',
                  borderRadius: 'var(--cf-radius-sm)',
                  border: '1px solid rgba(255,86,48,0.15)',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cf-text-sec)' }}>Estimativa</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cf-accent)' }}>
                    {formatCurrency(analysis?.estimatedAmount ?? 0)}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'var(--cf-info-bg)',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--cf-radius)',
                padding: '0.875rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--cf-info)',
                lineHeight: 1.5,
              }}>
                🔒 A sua participação é tratada de forma segura e confidencial. Receberá atualizações por notificação e email.
              </div>

              <PrimaryButton
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> A submeter...</>
                  : <><Zap size={18} /> Submeter participação</>}
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function PrimaryButton({ onClick, disabled, children, style }: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.9rem',
        background: disabled
          ? 'var(--cf-border)'
          : 'linear-gradient(135deg, var(--cf-accent), #FF7A54)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--cf-radius)',
        fontWeight: 700,
        fontSize: '0.95rem',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: disabled
          ? 'none'
          : '0 4px 16px rgba(255,86,48,0.32), 0 2px 6px rgba(255,86,48,0.16)',
        transition: 'box-shadow 0.18s',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid var(--cf-border)', gap: '1rem' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--cf-text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--cf-accent)' : 'var(--cf-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
