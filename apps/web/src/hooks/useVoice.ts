import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceOptions {
  lang?: string;
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void;
  onError?: (err: string) => void;
}

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// Request mic permission explicitly via getUserMedia before starting recognition.
// This ensures the browser shows the permission prompt on iOS/Android and that
// SpeechRecognition starts with a mic stream already authorised.
async function requestMicPermission(): Promise<true | string> {
  if (!navigator.mediaDevices?.getUserMedia) return true; // API not available, try anyway
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately — we only needed the permission grant
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Acesso ao microfone negado. Vai às definições do browser e permite o microfone para este site.';
    }
    if (err.name === 'NotFoundError') {
      return 'Microfone não encontrado neste dispositivo.';
    }
    return true; // Other errors — let SpeechRecognition handle them
  }
}

export function useVoice({
  lang = 'pt-PT',
  onFinalResult,
  onInterimResult,
  onError,
}: UseVoiceOptions = {}) {
  const [listening, setListening]   = useState(false);
  const [requesting, setRequesting] = useState(false); // true while asking for mic permission
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });

  const recRef          = useRef<any>(null);
  const shouldListenRef = useRef(false);

  const onFinalRef   = useRef(onFinalResult);
  const onInterimRef = useRef(onInterimResult);
  const onErrorRef   = useRef(onError);
  useEffect(() => { onFinalRef.current   = onFinalResult;   }, [onFinalResult]);
  useEffect(() => { onInterimRef.current = onInterimResult; }, [onInterimResult]);
  useEffect(() => { onErrorRef.current   = onError;         }, [onError]);

  const buildRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang            = lang;
    rec.continuous      = !isIOS(); // iOS doesn't support continuous well
    rec.interimResults  = true;
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
      setListening(false);
      shouldListenRef.current = false;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        onErrorRef.current?.(
          'Acesso ao microfone negado. Vai às definições do browser e permite o microfone para este site.'
        );
        return;
      }
      if (e.error === 'network') {
        onErrorRef.current?.('Erro de rede. Verifica a ligação à internet.');
        return;
      }
      onErrorRef.current?.(`Erro ao iniciar o microfone (${e.error}). Tenta usar o modo texto.`);
    };

    rec.onend = () => {
      if (shouldListenRef.current) {
        // Always build a new instance on restart (required on iOS)
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

  const startListening = useCallback(async () => {
    if (!supported) {
      onErrorRef.current?.('Reconhecimento de voz não suportado. Usa Chrome ou Safari.');
      return;
    }

    // Step 1: request mic permission explicitly so the browser shows the prompt
    setRequesting(true);
    const permResult = await requestMicPermission();
    setRequesting(false);

    if (typeof permResult === 'string') {
      onErrorRef.current?.(permResult);
      return;
    }

    // Step 2: start recognition
    shouldListenRef.current = true;
    const rec = buildRecognition();
    recRef.current = rec;
    try {
      rec.start();
    } catch {
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

  return { listening, requesting, supported, startListening, stopListening };
}
