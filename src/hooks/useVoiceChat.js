import { useState, useEffect, useRef, useCallback } from 'react';
import { profile, voiceSystemPrompt } from '../content/resume';

const LISTEN_WINDOW_MS = 4000;
const MS_AFTER_SPEAK_BEFORE_LISTEN = 1600;

function anthropicMessagesUrl() {
  return '/api/messages';
}

function anthropicRequestHeaders() {
  return {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
}

const FEMALE_VOICE_HINT =
  /Aria|Jenny|Emma|Zira|Michelle|Karen|Samantha|Victoria|Fiona|Susan|Isabella|Lucy|Hazel|Allison|Ashley|Cora|Elizabeth|Sara|Joanna|Ava|Natasha|Serena|Olivia|Nancy/i;

function pickBestEnglishVoice(voices) {
  if (!voices?.length) return null;
  const tiers = [
    (v) =>
      /^en/i.test(v.lang) &&
      /Microsoft\s+(Guy|Davis|Andrew|Brian|Jason|Eric|Christopher|Tony|Roger|Steffan|Ryan)/i.test(v.name),
    (v) => /^en/i.test(v.lang) && /\bMale\b/i.test(v.name),
    (v) =>
      /^en/i.test(v.lang) &&
      !FEMALE_VOICE_HINT.test(v.name) &&
      /(Guy|Davis|Brian|Andrew|David|Daniel|George|James|Thomas|Mark|Fred|Ken|Roger|Aaron|Henry|Arthur)/i.test(v.name),
    (v) => /^en-US/i.test(v.lang) && /Google\s+en-US.*Male/i.test(v.name),
    (v) => /^en-US/i.test(v.lang) && !FEMALE_VOICE_HINT.test(v.name) && /(Neural|Natural|Premium|Enhanced)/i.test(v.name),
    (v) => /^en-US/i.test(v.lang) && !FEMALE_VOICE_HINT.test(v.name),
    (v) => /^en/i.test(v.lang) && !FEMALE_VOICE_HINT.test(v.name),
    (v) => /^en/i.test(v.lang),
  ];
  for (const pred of tiers) {
    const v = voices.find(pred);
    if (v) return v;
  }
  return voices[0];
}

export function useVoiceChat() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listenSecondsLeft, setListenSecondsLeft] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [userName, setUserName] = useState('');
  const [chatStage, setChatStage] = useState('greeting');
  const [error, setError] = useState('');
  const [lastSpokenText, setLastSpokenText] = useState('');

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const selectedVoiceRef = useRef(null);
  const lockedVoiceUriRef = useRef(null);
  const voiceActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const chatStageRef = useRef('greeting');
  const handleUserSpeechRef = useRef(null);
  const listenWindowTimerRef = useRef(null);
  const afterSpeakTimerRef = useRef(null);
  const listenProgressIntervalRef = useRef(null);
  const accumulatedRef = useRef('');
  const interimRef = useRef('');
  const abortListenRef = useRef(false);
  const listenSessionActiveRef = useRef(false);
  const scheduleAfterSpeakRef = useRef(() => {});
  const lastRecognitionErrorRef = useRef(null);

  useEffect(() => { voiceActiveRef.current = voiceActive; }, [voiceActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { chatStageRef.current = chatStage; }, [chatStage]);

  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      if (!voices.length) return;
      if (lockedVoiceUriRef.current) {
        const still = voices.find((v) => v.voiceURI === lockedVoiceUriRef.current);
        if (still) {
          selectedVoiceRef.current = still;
          return;
        }
        lockedVoiceUriRef.current = null;
      }
      const v = pickBestEnglishVoice(voices);
      if (v) {
        lockedVoiceUriRef.current = v.voiceURI;
        selectedVoiceRef.current = v;
      }
    };
    pickVoice();
    window.speechSynthesis?.addEventListener?.('voiceschanged', pickVoice);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', pickVoice);
  }, []);

  const clearListenWindowTimer = useCallback(() => {
    if (listenWindowTimerRef.current) {
      clearTimeout(listenWindowTimerRef.current);
      listenWindowTimerRef.current = null;
    }
  }, []);

  const clearAfterSpeakTimer = useCallback(() => {
    if (afterSpeakTimerRef.current) {
      clearTimeout(afterSpeakTimerRef.current);
      afterSpeakTimerRef.current = null;
    }
  }, []);

  const clearListenProgressInterval = useCallback(() => {
    if (listenProgressIntervalRef.current) {
      clearInterval(listenProgressIntervalRef.current);
      listenProgressIntervalRef.current = null;
    }
    setListenSecondsLeft(null);
  }, []);

  const startListeningWindow = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !voiceActiveRef.current || isSpeakingRef.current || listenSessionActiveRef.current) return;
    try {
      abortListenRef.current = false;
      accumulatedRef.current = '';
      interimRef.current = '';
      setError('');
      setTranscript('');
      rec.start();
    } catch (e) {
      console.warn('Speech recognition start', e);
    }
  }, []);

  const scheduleAfterSpeak = useCallback(() => {
    clearAfterSpeakTimer();
    afterSpeakTimerRef.current = setTimeout(() => {
      afterSpeakTimerRef.current = null;
      if (!voiceActiveRef.current || isSpeakingRef.current) return;
      startListeningWindow();
    }, MS_AFTER_SPEAK_BEFORE_LISTEN);
  }, [clearAfterSpeakTimer, startListeningWindow]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    const armWindowEnd = () => {
      clearListenWindowTimer();
      listenWindowTimerRef.current = setTimeout(() => {
        listenWindowTimerRef.current = null;
        try { rec.stop(); } catch { /* ignore */ }
      }, LISTEN_WINDOW_MS);
    };

    rec.onstart = () => {
      listenSessionActiveRef.current = true;
      setIsListening(true);
      accumulatedRef.current = '';
      interimRef.current = '';
      setListenSecondsLeft(Math.ceil(LISTEN_WINDOW_MS / 1000));
      clearListenProgressInterval();
      listenProgressIntervalRef.current = setInterval(() => {
        setListenSecondsLeft((s) => (s != null && s > 0 ? s - 1 : s));
      }, 1000);
      armWindowEnd();
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        if (r.isFinal) accumulatedRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      interimRef.current = interim;
      setTranscript((accumulatedRef.current + interim).trim());
    };

    rec.onerror = (event) => {
      lastRecognitionErrorRef.current = event.error;
      clearListenWindowTimer();
      clearListenProgressInterval();
      setIsListening(false);
      listenSessionActiveRef.current = false;
      if (!voiceActiveRef.current) return;
      if (event.error === 'not-allowed') {
        setError('Microphone permission is required for voice mode.');
        return;
      }
      if (event.error === 'aborted') return;
      setError(event.error === 'no-speech' ? 'No speech detected—another listen turn will open shortly.' : 'Could not hear you clearly. Another listen turn will open shortly.');
    };

    rec.onend = () => {
      clearListenWindowTimer();
      clearListenProgressInterval();
      setIsListening(false);
      listenSessionActiveRef.current = false;
      const recErr = lastRecognitionErrorRef.current;
      lastRecognitionErrorRef.current = null;
      if (abortListenRef.current) { abortListenRef.current = false; return; }
      if (!voiceActiveRef.current || recErr === 'not-allowed') return;
      const text = (accumulatedRef.current + interimRef.current).trim();
      if (text) handleUserSpeechRef.current?.(text);
      else scheduleAfterSpeakRef.current();
    };

    recognitionRef.current = rec;
    synthRef.current = window.speechSynthesis;
    return () => {
      clearListenWindowTimer();
      clearListenProgressInterval();
      clearAfterSpeakTimer();
      try { rec.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      synthRef.current?.cancel();
    };
  }, [clearAfterSpeakTimer, clearListenProgressInterval, clearListenWindowTimer]);

  const speak = (text) => {
    setLastSpokenText(text);
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const v = selectedVoiceRef.current;
      utterance.lang = v?.lang || 'en-US';
      utterance.voice = v || null;
      utterance.rate = 0.93;
      utterance.pitch = 0.88;
      utterance.volume = 1.0;
      utterance.onstart = () => { isSpeakingRef.current = true; setIsSpeaking(true); };
      utterance.onend = () => { isSpeakingRef.current = false; setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { isSpeakingRef.current = false; setIsSpeaking(false); resolve(); };
      synthRef.current.speak(utterance);
    });
  };

  const handleUserSpeech = async (userText) => {
    const trimmed = userText.trim();
    if (!trimmed) { scheduleAfterSpeak(); return; }
    setChatHistory((prev) => [...prev, { role: 'user', content: trimmed }]);

    if (chatStageRef.current === 'greeting') {
      const extractedName = trimmed.split(/\s+/)[0] || 'there';
      setUserName(extractedName);
      const response = `Nice to meet you, ${extractedName}! What would you like to know about me?`;
      setChatHistory((prev) => [...prev, { role: 'assistant', content: response }]);
      setChatStage('conversation');
      await speak(response);
      scheduleAfterSpeak();
      return;
    }

    const lowerText = trimmed.toLowerCase();
    if (['call', 'phone', 'number', 'reach', 'contact', 'real kandarp'].some((k) => lowerText.includes(k))) {
      const response = `Sure—here's how to reach me directly. Phone ${profile.phone}, email ${profile.email}, LinkedIn ${profile.linkedinHandle}. If you tell me you found me through this voice resume, I'll remember the context.`;
      setChatHistory((prev) => [...prev, { role: 'assistant', content: response }]);
      await speak(response);
      scheduleAfterSpeak();
      return;
    }

    try {
      setError('');
      const response = await fetch(anthropicMessagesUrl(), {
        method: 'POST',
        headers: anthropicRequestHeaders(),
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: voiceSystemPrompt,
          messages: [{ role: 'user', content: trimmed }],
        }),
      });
      if (!response.ok) {
        let detail = `${response.status}`;
        try {
          const errBody = await response.json();
          detail = errBody?.error?.message || errBody?.message || JSON.stringify(errBody);
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      const data = await response.json();
      const aiResponse = data.content[0].text;
      setChatHistory((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      await speak(aiResponse);
      scheduleAfterSpeak();
    } catch (err) {
      console.error('Error calling Claude API:', err);
      setError(
        import.meta.env.DEV
          ? 'Could not reach Claude. Put ANTHROPIC_API_KEY in `.env` (see .env.example), then restart npm run dev.'
          : 'Could not reach Claude. Add ANTHROPIC_API_KEY in Vercel environment variables, then redeploy.'
      );
      const fallbackResponse = "I'm having a little trouble reaching my AI backend right now. I'm a Product Owner at AltaDX building AI agents — want me to describe OMAP in plain words?";
      setChatHistory((prev) => [...prev, { role: 'assistant', content: fallbackResponse }]);
      await speak(fallbackResponse);
      scheduleAfterSpeak();
    }
  };

  handleUserSpeechRef.current = handleUserSpeech;
  scheduleAfterSpeakRef.current = scheduleAfterSpeak;

  const stopVoice = useCallback(() => {
    abortListenRef.current = true;
    clearListenWindowTimer();
    clearListenProgressInterval();
    clearAfterSpeakTimer();
    setVoiceActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    synthRef.current?.cancel();
    setChatHistory([]);
    setUserName('');
    setChatStage('greeting');
    setLastSpokenText('');
  }, [clearAfterSpeakTimer, clearListenProgressInterval, clearListenWindowTimer]);

  const toggleVoice = async () => {
    if (!voiceActive) {
      setError('');
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (e) {
          setError('Microphone was blocked. Allow microphone access in browser settings, then try again.');
          return;
        }
      }
      setVoiceActive(true);
      setChatHistory([]);
      setChatStage('greeting');
      const greeting = "Hey—I'm Kandarp. What's your name?";
      setChatHistory([{ role: 'assistant', content: greeting }]);
      await speak(greeting);
      scheduleAfterSpeak();
    } else {
      stopVoice();
    }
  };

  return {
    voiceActive,
    isListening,
    isSpeaking,
    listenSecondsLeft,
    transcript,
    chatHistory,
    userName,
    error,
    lastSpokenText,
    toggleVoice,
    stopVoice,
  };
}
