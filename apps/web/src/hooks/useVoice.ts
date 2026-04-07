import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceOptions {
  lang?: string;
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoice({
  lang = 'pt-PT',
  onFinalResult,
  onInterimResult,
  onError,
}: UseVoiceOptions = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const recRef           = useRef<any>(null);
  const shouldListenRef  = useRef(false);

  // Keep callback refs up-to-date to avoid stale closures inside recognition handlers
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
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (e: any) => {
      let interim = '';
      let final   = '';

      // Only process results that are new since the last event (e.resultIndex)
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (final.trim())   onFinalRef.current?.(final.trim());
      if (interim !== '') onInterimRef.current?.(interim);
    };

    rec.onerror = (e: any) => {
      // 'aborted' just means we called stop() manually — not a real error
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      setListening(false);
      shouldListenRef.current = false;
      onErrorRef.current?.(e.error);
    };

    rec.onend = () => {
      // Chrome auto-stops after silence with continuous=true — restart if we should still be listening
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
          shouldListenRef.current = false;
        }
      } else {
        setListening(false);
        // Clear any lingering interim when session ends
        onInterimRef.current?.('');
      }
    };

    return rec;
  }, [lang]);

  const startListening = useCallback(() => {
    if (!supported) {
      onErrorRef.current?.('Voz não suportada neste browser');
      return;
    }
    shouldListenRef.current = true;
    const rec = buildRecognition();
    recRef.current = rec;
    rec.start();
  }, [supported, buildRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    onInterimRef.current?.('');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    shouldListenRef.current = false;
    recRef.current?.stop();
  }, []);

  return { listening, supported, startListening, stopListening };
}
