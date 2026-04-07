import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceOptions {
  lang?: string;
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void;
  onError?: (err: string) => void;
}

// iOS Safari stops continuous recognition aggressively and blocks non-gesture restarts
const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function useVoice({
  lang = 'pt-PT',
  onFinalResult,
  onInterimResult,
  onError,
}: UseVoiceOptions = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });

  const recRef          = useRef<any>(null);
  const shouldListenRef = useRef(false);

  // Keep callback refs up-to-date to avoid stale closures
  const onFinalRef   = useRef(onFinalResult);
  const onInterimRef = useRef(onInterimResult);
  const onErrorRef   = useRef(onError);
  useEffect(() => { onFinalRef.current   = onFinalResult;   }, [onFinalResult]);
  useEffect(() => { onInterimRef.current = onInterimResult; }, [onInterimResult]);
  useEffect(() => { onErrorRef.current   = onError;         }, [onError]);

  const buildRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang           = lang;
    // iOS doesn't support continuous well — use non-continuous with manual restart
    rec.continuous     = !isIOS();
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (e: any) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final  += t;
        else                       interim += t;
      }
      if (final.trim())   onFinalRef.current?.(final.trim());
      if (interim !== '') onInterimRef.current?.(interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setListening(false);
        shouldListenRef.current = false;
        onErrorRef.current?.('Acesso ao microfone negado. Verifica as permissões no browser.');
        return;
      }
      if (e.error === 'network') {
        setListening(false);
        shouldListenRef.current = false;
        onErrorRef.current?.('Erro de rede. Verifica a ligação à internet.');
        return;
      }
      setListening(false);
      shouldListenRef.current = false;
      onErrorRef.current?.(e.error);
    };

    rec.onend = () => {
      if (shouldListenRef.current) {
        // Always create a fresh instance on restart (required on iOS)
        try {
          const next = buildRecognition();
          recRef.current = next;
          next.start();
        } catch {
          setListening(false);
          shouldListenRef.current = false;
        }
      } else {
        setListening(false);
        onInterimRef.current?.('');
      }
    };

    return rec;
  }, [lang]);

  const startListening = useCallback(() => {
    if (!supported) {
      onErrorRef.current?.('Reconhecimento de voz não suportado neste browser. Usa Chrome ou Safari.');
      return;
    }
    shouldListenRef.current = true;
    const rec = buildRecognition();
    recRef.current = rec;
    try {
      rec.start();
    } catch (err: any) {
      shouldListenRef.current = false;
      onErrorRef.current?.('Não foi possível iniciar o microfone. Tenta novamente.');
    }
  }, [supported, buildRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    try { recRef.current?.stop(); } catch { /* ignore */ }
    recRef.current = null;
    setListening(false);
    onInterimRef.current?.('');
  }, []);

  useEffect(() => () => {
    shouldListenRef.current = false;
    try { recRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  return { listening, supported, startListening, stopListening };
}
