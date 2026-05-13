import React, { useState, useEffect, useRef, useCallback } from 'react';

/** Mic stays open this long each turn; then your message is sent and the AI speaks. */
const LISTEN_WINDOW_MS = 4000;
/** Pause after TTS ends before opening the mic (reduces echo / cut-off). */
const MS_AFTER_SPEAK_BEFORE_LISTEN = 1600;

/** Local: Vite proxy adds the key. Vercel: `api/messages.js` adds the key. Never put the secret in the React bundle. */
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

/** Prefer male-presenting English voices (browser-dependent; Edge has the best Microsoft set). */
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

export default function KandarpResume() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listenSecondsLeft, setListenSecondsLeft] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [userName, setUserName] = useState('');
  const [chatStage, setChatStage] = useState('greeting');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const selectedVoiceRef = useRef(null);
  /** Once we pick a male voice, keep it for the whole session (no switching on every line). */
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

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  useEffect(() => {
    chatStageRef.current = chatStage;
  }, [chatStage]);

  // Pick one male English voice on load and lock it; only change if that voice disappears.
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

  // Scroll reveal animations
  useEffect(() => {
    const sections = document.querySelectorAll('.resume-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const startListeningWindow = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !voiceActiveRef.current) return;
    if (isSpeakingRef.current) return;
    if (listenSessionActiveRef.current) return;
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

  // Continuous mic for LISTEN_WINDOW_MS, then one reply (avoids clipped / overlapping turns).
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return undefined;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    const armWindowEnd = () => {
      clearListenWindowTimer();
      listenWindowTimerRef.current = setTimeout(() => {
        listenWindowTimerRef.current = null;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
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
        if (r.isFinal) {
          accumulatedRef.current += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      interimRef.current = interim;
      const live = (accumulatedRef.current + interim).trim();
      setTranscript(live);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
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
      if (event.error === 'no-speech') {
        setError('No speech detected—another listen turn will open shortly.');
        return;
      }
      setError('Could not hear you clearly. Another listen turn will open shortly.');
    };

    rec.onend = () => {
      clearListenWindowTimer();
      clearListenProgressInterval();
      setIsListening(false);
      listenSessionActiveRef.current = false;

      const recErr = lastRecognitionErrorRef.current;
      lastRecognitionErrorRef.current = null;

      if (abortListenRef.current) {
        abortListenRef.current = false;
        return;
      }
      if (!voiceActiveRef.current) return;
      if (recErr === 'not-allowed') return;

      const text = (accumulatedRef.current + interimRef.current).trim();
      if (text) {
        handleUserSpeechRef.current?.(text);
      } else {
        scheduleAfterSpeakRef.current();
      }
    };

    recognitionRef.current = rec;
    synthRef.current = window.speechSynthesis;

    return () => {
      clearListenWindowTimer();
      clearListenProgressInterval();
      clearAfterSpeakTimer();
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [clearAfterSpeakTimer, clearListenProgressInterval, clearListenWindowTimer]);

  const speak = (text) => {
    return new Promise((resolve) => {
      if (synthRef.current) {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const v = selectedVoiceRef.current;
        utterance.lang = v?.lang || 'en-US';
        utterance.voice = v || null;
        utterance.rate = 0.93;
        utterance.pitch = 0.88;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          resolve();
        };

        synthRef.current.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const handleUserSpeech = async (userText) => {
    const trimmed = userText.trim();
    if (!trimmed) {
      scheduleAfterSpeak();
      return;
    }

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
    if (
      lowerText.includes('call') ||
      lowerText.includes('phone') ||
      lowerText.includes('number') ||
      lowerText.includes('reach') ||
      lowerText.includes('contact') ||
      lowerText.includes('real kandarp')
    ) {
      const response =
        "Sure—here's how to reach me directly. Phone +91 8109901136, email mathurkandarp@gmail.com, LinkedIn linkedin.com/in/kandarpmathur14. If you tell me you found me through this voice resume, I'll remember the context.";
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
          system: `You ARE Kandarp Mathur on a live voice call about your own career. Speak ONLY in the first person: always "I", "me", "my", "I've"—never describe yourself as "Kandarp" in third person, never "he" or "him" for yourself. You are not an assistant talking about someone else; you are Kandarp talking to a visitor.

Keep answers short for voice: about two or three sentences. Sound warm and human.

Facts (phrase as your own experience):
- You are a Product Owner in Ahmedabad, India.
- You own OMAP™ at AltaDX—an AI micro-agents platform for fitness and wellness enterprises.
- You work with product management, AI agents, Agile and Scrum, Power BI, SQL, and APIs.
- Projects you lead or built include OMAP™ (100+ fitness operators), Round1 (AI interview screening), and Analystbychance (1000+ mentees).
- Skills include Product Management, Agile, Scrum, SAFe, Power BI, SQL, APIs, AI and ML, JIRA, Confluence.
- Certifications: CSM®, SAFe® 6 POPM, Salesforce AI Associate.
- Education: B.E. Mechanical Engineering, 2009–2013.

Work history (as "I was / I am"):
- AltaDX from 2025: Product Owner for AI agents.
- KTek Resourcing 2019–2025: Business Analyst.
- Wealth It Global 2014–2018: Reporting Analyst.`,
          messages: [{ role: 'user', content: trimmed }],
        }),
      });

      if (!response.ok) {
        let detail = `${response.status}`;
        try {
          const errBody = await response.json();
          detail = errBody?.error?.message || errBody?.message || JSON.stringify(errBody);
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;

      setChatHistory((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      await speak(aiResponse);
      scheduleAfterSpeak();
    } catch (error) {
      console.error('Error calling Claude API:', error);
      setError(
        import.meta.env.DEV
          ? 'Could not reach Claude. Put ANTHROPIC_API_KEY in a `.env` file here (see .env.example), then restart npm run dev.'
          : 'Could not reach Claude. In Vercel → your project → Settings → Environment Variables, add ANTHROPIC_API_KEY, then redeploy.'
      );
      const fallbackResponse =
        "I'm having a little trouble reaching my AI backend right now. I'm still a Product Owner at AltaDX, building AI agents for fitness and wellness—want me to describe what I do there in plain words?";
      setChatHistory((prev) => [...prev, { role: 'assistant', content: fallbackResponse }]);
      await speak(fallbackResponse);
      scheduleAfterSpeak();
    }
  };

  handleUserSpeechRef.current = handleUserSpeech;
  scheduleAfterSpeakRef.current = scheduleAfterSpeak;

  const toggleVoice = async () => {
    if (!voiceActive) {
      setError('');
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (e) {
          console.error(e);
          setError(
            'Microphone was blocked. In Chrome: click the lock icon next to the URL → Site settings → Microphone → Allow (not “Ask every time”), then try again.'
          );
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
      abortListenRef.current = true;
      clearListenWindowTimer();
      clearListenProgressInterval();
      clearAfterSpeakTimer();
      setVoiceActive(false);
      setIsListening(false);
      setIsSpeaking(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setChatHistory([]);
      setUserName('');
      setChatStage('greeting');
    }
  };

  const stopVoice = () => {
    abortListenRef.current = true;
    clearListenWindowTimer();
    clearListenProgressInterval();
    clearAfterSpeakTimer();
    setVoiceActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setChatHistory([]);
    setUserName('');
    setChatStage('greeting');
  };

  const particleArray = Array.from({ length: 24 });
  const waveBars = Array.from({ length: 16 });
  const talkWaveBars = Array.from({ length: 14 });

  return (
    <div className="app-root">
      {/* Animated gradient background */}
      <div className="bg-gradient" />

      {/* Floating particles */}
      <div className="particle-layer">
        {particleArray.map((_, i) => (
          <span key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      {/* Main content */}
      <div className="app-shell">
        <header className="hero">
          <div className="hero-content">
            <div className="hero-badge">PRODUCT OWNER · AI AGENTS · INDIA</div>
            <h1 className="hero-title">
              Kandarp <span>Mathur</span>
            </h1>
            <p className="hero-subtitle">
              Product Owner for OMAP™ at AltaDX, orchestrating AI micro‑agents that move real business metrics
              for fitness, wellness, and beauty enterprises.
            </p>
            <div className="hero-meta">
              <span>📍 Ahmedabad, India</span>
              <span>·</span>
              <span>AI‑Native Product · Data‑Obsessed · Execution‑First</span>
            </div>

            <div className="hero-links">
              <a
                href="https://linkedin.com/in/kandarpmathur14"
                target="_blank"
                rel="noopener noreferrer"
                className="pill-link neon-border"
              >
                <span className="pill-glow" />
                <span>💼 LinkedIn</span>
              </a>
              <a href="mailto:mathurkandarp@gmail.com" className="pill-link subtle">
                ✉️ Email
              </a>
            </div>
          </div>
        </header>

        <main className="content-grid">
          <section className="resume-section glass-card depth-tilt" id="about">
            <div className="section-header">
              <h2>About Me</h2>
              <span className="section-tag">OUTCOMES · NOT OUTPUT</span>
            </div>
            <p>
              I’m a Product Owner for OMAP™ (Outcomes Micro Agents Platform) at AltaDX—an AI platform transforming
              how fitness, wellness, and beauty enterprises drive revenue, retention, and member experience.
              I lead cross‑functional squads to ship AI‑enabled micro‑agents that automate workflows, augment human
              decisions, and consistently tie features back to measurable outcomes.
            </p>
          </section>

          <section className="resume-section glass-card depth-tilt" id="experience">
            <div className="section-header">
              <h2>Experience</h2>
              <span className="section-tag">TRACK RECORD</span>
            </div>

            <div className="timeline-item">
              <div className="timeline-headline">
                <h3>Product Owner · OMAP™</h3>
                <span>Jun 2025 – Present · AltaDX</span>
              </div>
              <p>
                Owning roadmap and delivery for an AI micro‑agents platform serving 100+ fitness operators.
                Orchestrate discovery, prioritization, and delivery for agents focused on acquisition, retention,
                and ops efficiency—anchored on KPIs, not vanity metrics.
              </p>
            </div>

            <div className="timeline-item">
              <div className="timeline-headline">
                <h3>Business Analyst</h3>
                <span>Jan 2019 – Mar 2025 · KTek Resourcing</span>
              </div>
              <p>
                Led requirements and solution design for recruitment systems, API integrations, and reporting.
                Improved onboarding efficiency by 30% through workflow redesign, automation, and tighter feedback
                loops with stakeholders.
              </p>
            </div>

            <div className="timeline-item">
              <div className="timeline-headline">
                <h3>Reporting Analyst</h3>
                <span>Jan 2014 – Dec 2018 · Wealth It Global</span>
              </div>
              <p>
                Built data pipelines and reporting frameworks across Excel, Power BI, and SQL.
                Reduced manual reporting by 40% via automation and helped leaders instrument the right KPIs.
              </p>
            </div>

            <div className="timeline-item">
              <div className="timeline-headline">
                <h3>Trainer</h3>
                <span>Jun 2013 – Dec 2013 · Qpid Outsourcing</span>
              </div>
              <p>
                Designed and delivered learning programs, SOPs, and cross‑functional workshops to level up teams and
                tighten collaboration across functions.
              </p>
            </div>
          </section>

          <section className="resume-section glass-card depth-tilt" id="projects">
            <div className="section-header">
              <h2>Flagship Work</h2>
              <span className="section-tag">AI PRODUCTS</span>
            </div>

            <div className="project-grid">
              <div className="project-card">
                <h3>OMAP™ · Outcomes Micro Agents Platform</h3>
                <p>
                  AI‑powered platform of micro‑agents for acquisition, retention, and operations—embedded into
                  existing fitness and wellness stacks. Serving 100+ operators with deep integrations into leading
                  management systems.
                </p>
              </div>

              <div className="project-card">
                <h3>Round1 · AI Interview Screening</h3>
                <p>
                  Conversational AI that runs structured interviews with candidates and delivers instant signal‑rich
                  summaries. Designed to collapse recruiter load while improving quality of hire.
                </p>
              </div>

              <div className="project-card">
                <h3>Analystbychance · Mentorship</h3>
                <p>
                  Community and mentorship platform that has helped 1000+ aspiring Business Analysts, Data Analysts,
                  and MIS professionals break into tech with practical roadmaps and feedback.
                </p>
              </div>
            </div>
          </section>

          <section className="resume-section glass-card depth-tilt" id="skills">
            <div className="section-header">
              <h2>Skills & Certifications</h2>
              <span className="section-tag">STACK</span>
            </div>

            <div className="skills-layout">
              <div>
                <h3 className="subheading">Core Skills</h3>
                <div className="chip-row">
                  {[
                    'Product Management',
                    'AI Agents',
                    'Agile / Scrum / SAFe',
                    'Discovery & Research',
                    'Power BI',
                    'SQL',
                    'API Integrations',
                    'JIRA & Confluence',
                    'Snowflake',
                    'Databricks',
                    'Stakeholder Management',
                  ].map((skill) => (
                    <span key={skill} className="skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="divider-vertical" />

              <div>
                <h3 className="subheading">Certifications</h3>
                <ul className="cert-list">
                  <li>Certified ScrumMaster (CSM®)</li>
                  <li>SAFe® 6 Product Owner / Product Manager</li>
                  <li>Salesforce Certified AI Associate</li>
                  <li>Registered Scrum Basics™</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="resume-section glass-card depth-tilt" id="education">
            <div className="section-header">
              <h2>Education</h2>
              <span className="section-tag">FOUNDATION</span>
            </div>

            <div className="education-block">
              <h3>Bachelor of Engineering · Mechanical Engineering</h3>
              <p className="edu-meta">Rajiv Gandhi Prodyogiki Vishwavidyalaya · 2009 – 2013</p>
              <p>
                Engineering foundation with a strong analytical lens that later translated into data‑driven product
                thinking, structured problem‑solving, and systems‑level reasoning.
              </p>
            </div>
          </section>
        </main>
      </div>

      <div className="talk-wave-float">
        <button
          type="button"
          className={`talk-wave-btn ${voiceActive ? 'talk-wave-btn--on' : ''} ${isListening ? 'talk-wave-btn--listen' : ''} ${isSpeaking ? 'talk-wave-btn--speak' : ''}`}
          onClick={toggleVoice}
          aria-label="Talk to me — voice resume"
        >
          {talkWaveBars.map((_, i) => (
            <span key={i} className="talk-bar" style={{ animationDelay: `${-i * 0.07}s` }} aria-hidden />
          ))}
        </button>
        <p className="talk-wave-label">Talk to me</p>
        {voiceActive && <span className="talk-wave-hint">Tap again to stop</span>}
      </div>

      {voiceActive && (
        <div className="voice-panel glass-card">
          <div className="voice-panel-header">
            <div>
              <div className="voice-panel-title">Voice chat</div>
              <div className="voice-panel-subtitle">
                {isSpeaking
                  ? "I'm speaking…"
                  : isListening
                    ? `Your turn — speak freely (${listenSecondsLeft ?? 4}s window, then I reply).`
                    : 'After I speak, the mic opens after a short pause.'}
              </div>
            </div>

            {/* Sound wave visualization when AI is speaking */}
            <div className={`voice-wave ${isSpeaking ? 'voice-wave--active' : ''}`}>
              {waveBars.map((_, i) => (
                <span key={i} className={`wave-bar wave-bar-${i + 1}`} />
              ))}
            </div>

            <button onClick={stopVoice} className="icon-button" aria-label="Close voice chat">
              ✕
            </button>
          </div>

          <div className="voice-panel-body">
            {chatHistory.length === 0 && (
              <p className="voice-placeholder">Starting voice mode… you'll hear me in a second.</p>
            )}

            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble chat-bubble--${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="chat-label">{msg.role === 'user' ? (userName || 'You') : 'Kandarp'}</div>
                <div className="chat-text">{msg.content}</div>
              </div>
            ))}

            {isListening && (
              <div className="status-pill status-pill--listening">
                <span className="dot" />
                Listening…
              </div>
            )}

            {isSpeaking && (
              <div className="status-pill status-pill--speaking">
                <span className="dot" />
                I&apos;m speaking…
              </div>
            )}

            {error && <div className="error-banner">{error}</div>}
          </div>

          <div className="voice-panel-footer">
            {isSpeaking
              ? "I'm speaking…"
              : isListening
                ? '4-second turn: say everything in this window as one message.'
                : 'I talk → short pause → you get 4 seconds → I reply. Microsoft Edge usually has the clearest male voices.'}
          </div>
        </div>
      )}

      {/* Page‑scoped styles */}
      <style>{`
        :root {
          color-scheme: dark;
        }

        .app-root {
          position: relative;
          min-height: 100vh;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
          color: #fafafa;
          overflow-x: hidden;
          background-color: #0f0220;
        }

        .bg-gradient {
          position: fixed;
          inset: -20%;
          background:
            radial-gradient(circle at 15% 20%, rgba(255, 0, 128, 0.45), transparent 45%),
            radial-gradient(circle at 85% 15%, rgba(0, 245, 255, 0.38), transparent 48%),
            radial-gradient(circle at 50% 90%, rgba(168, 85, 247, 0.55), transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(250, 204, 21, 0.2), transparent 42%);
          background-color: #12031e;
          animation: gradientShift 16s ease-in-out infinite alternate;
          z-index: -3;
        }

        .particle-layer {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -2;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, #fff7ed, #f472b6);
          box-shadow: 0 0 18px rgba(244, 114, 182, 0.95), 0 0 28px rgba(34, 211, 238, 0.5);
          opacity: 0.55;
          animation: floatParticle 26s linear infinite;
        }

        /* Distribute particles with different positions/speeds */
        ${Array.from({ length: 24 })
          .map((_, i) => {
            const idx = i + 1;
            const left = (idx * 37) % 100;
            const delay = (idx * 1.7) % 20;
            const duration = 18 + (idx % 7);
            const size = 4 + (idx % 4);
            return `
              .particle-${idx} {
                left: ${left}%;
                top: ${idx % 2 === 0 ? '110%' : '-10%'};
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${duration}s;
                animation-delay: -${delay}s;
              }
            `;
          })
          .join('\n')}

        .app-shell {
          position: relative;
          max-width: 1120px;
          margin: 0 auto;
          padding: 64px 16px 160px;
          z-index: 1;
        }

        .hero {
          padding: 32px 0 40px;
        }

        .hero-content {
          max-width: 720px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          background: linear-gradient(90deg, rgba(255, 0, 128, 0.35), rgba(0, 245, 255, 0.28), rgba(168, 85, 247, 0.35));
          border: 1px solid rgba(250, 250, 250, 0.35);
          backdrop-filter: blur(18px);
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.5), 0 18px 50px rgba(255, 0, 128, 0.25);
        }

        .hero-title {
          font-size: clamp(40px, 4vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.06em;
          margin: 18px 0 10px;
        }

        .hero-title span {
          background: linear-gradient(120deg, #22d3ee, #f472b6, #a855f7, #facc15, #22d3ee);
          background-size: 200% auto;
          -webkit-background-clip: text;
          color: transparent;
          animation: titleShine 8s linear infinite;
          text-shadow: 0 0 32px rgba(244, 114, 182, 0.45);
        }

        .hero-subtitle {
          max-width: 640px;
          color: #fce7f3;
          font-size: 15px;
        }

        .hero-meta {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 13px;
          color: #e9d5ff;
        }

        .hero-links {
          margin-top: 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .pill-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          color: #0f172a;
          background: linear-gradient(135deg, #22d3ee, #f472b6, #a855f7);
          background-size: 160% auto;
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 14px 40px rgba(244, 114, 182, 0.45), 0 0 24px rgba(34, 211, 238, 0.35);
          overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }

        .pill-link.subtle {
          background: linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(88, 28, 135, 0.9));
          color: #fae8ff;
          border-color: rgba(250, 204, 21, 0.45);
          box-shadow: 0 10px 30px rgba(88, 28, 135, 0.75);
        }

        .pill-link:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 20px 60px rgba(250, 204, 21, 0.35), 0 0 40px rgba(34, 211, 238, 0.5);
        }

        .pill-glow {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle at 0 0, rgba(255, 255, 255, 0.25), transparent 50%);
          opacity: 0;
          transition: opacity 220ms ease;
        }

        .pill-link:hover .pill-glow {
          opacity: 1;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
          gap: 24px;
        }

        @media (max-width: 960px) {
          .content-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        .resume-section {
          opacity: 0;
          transform: translateY(32px) translateZ(0);
          transition: opacity 680ms cubic-bezier(0.22, 0.61, 0.36, 1), transform 680ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }

        .resume-section.section-visible {
          opacity: 1;
          transform: translateY(0) translateZ(0);
        }

        .glass-card {
          position: relative;
          border-radius: 22px;
          padding: 24px 22px 22px;
          background: radial-gradient(circle at top left, rgba(255, 0, 128, 0.12), transparent 55%),
            radial-gradient(circle at bottom right, rgba(0, 245, 255, 0.1), transparent 50%),
            rgba(30, 10, 50, 0.72);
          backdrop-filter: blur(26px);
          border: 1px solid rgba(250, 204, 21, 0.25);
          box-shadow:
            0 24px 80px rgba(88, 28, 135, 0.55),
            0 0 0 1px rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          inset: -120%;
          background: conic-gradient(
            from 200deg,
            rgba(255, 0, 128, 0.35),
            rgba(0, 245, 255, 0.3),
            rgba(250, 204, 21, 0.22),
            transparent,
            transparent
          );
          opacity: 0;
          transform: translate3d(0, 0, 0);
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .glass-card:hover::before {
          opacity: 1;
          animation: borderSweep 8s linear infinite;
        }

        .depth-tilt {
          transform-style: preserve-3d;
          transition: transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease;
        }

        .depth-tilt:hover {
          transform: translateY(-8px) rotateX(4deg) rotateY(-3deg);
          box-shadow:
            0 30px 80px rgba(88, 28, 135, 0.65),
            0 0 40px rgba(255, 0, 128, 0.35);
          border-color: rgba(0, 245, 255, 0.55);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        .section-header h2 {
          font-size: 18px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #fef3c7;
        }

        .section-tag {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fef08a;
          background: rgba(234, 179, 8, 0.2);
          border: 1px solid rgba(250, 204, 21, 0.75);
        }

        .resume-section p {
          font-size: 14px;
          line-height: 1.7;
          color: #ede9fe;
        }

        .timeline-item {
          position: relative;
          padding: 14px 0 8px;
        }

        .timeline-item + .timeline-item {
          border-top: 1px solid rgba(15, 23, 42, 0.9);
          margin-top: 8px;
        }

        .timeline-headline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
          margin-bottom: 4px;
        }

        .timeline-headline h3 {
          font-size: 15px;
          font-weight: 600;
          color: #e5e7eb;
        }

        .timeline-headline span {
          font-size: 12px;
          color: #9ca3af;
        }

        .project-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
          margin-top: 8px;
        }

        .project-card {
          padding: 12px 12px 10px;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            rgba(88, 28, 135, 0.95),
            rgba(190, 24, 93, 0.85),
            rgba(8, 145, 178, 0.88)
          );
          border: 1px solid rgba(250, 204, 21, 0.45);
          box-shadow: 0 16px 45px rgba(88, 28, 135, 0.85), 0 0 28px rgba(0, 245, 255, 0.2);
        }

        .project-card h3 {
          font-size: 14px;
          margin-bottom: 4px;
          color: #fef9c3;
        }

        .project-card p {
          font-size: 13px;
          line-height: 1.6;
          color: #fce7f3;
        }

        .skills-layout {
          display: flex;
          flex-direction: row;
          gap: 18px;
          margin-top: 6px;
        }

        @media (max-width: 768px) {
          .skills-layout {
            flex-direction: column;
          }

          .divider-vertical {
            display: none;
          }
        }

        .subheading {
          font-size: 13px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a5f3fc;
          margin-bottom: 8px;
        }

        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-chip {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          color: #0f172a;
          font-weight: 600;
          background: linear-gradient(120deg, #22d3ee, #f472b6, #facc15);
          background-size: 140% auto;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 24px rgba(244, 114, 182, 0.45);
        }

        .divider-vertical {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.7), transparent);
        }

        .cert-list {
          margin: 0;
          padding-left: 18px;
          font-size: 13px;
          color: #d1d5db;
          line-height: 1.7;
        }

        .education-block h3 {
          font-size: 14px;
          color: #e5e7eb;
          margin-bottom: 4px;
        }

        .edu-meta {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 6px;
        }

        /* Floating waveform — stays visible while scrolling */
        .talk-wave-float {
          position: fixed;
          left: 50%;
          bottom: max(14px, env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          padding: 0 12px;
        }

        .talk-wave-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 36px;
          min-width: 108px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(14px);
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .talk-wave-btn:hover {
          border-color: rgba(129, 140, 248, 0.55);
          transform: translateY(-1px);
        }

        .talk-wave-btn:focus-visible {
          outline: 2px solid #a5b4fc;
          outline-offset: 3px;
        }

        .talk-wave-btn--on {
          border-color: rgba(34, 211, 238, 0.45);
          box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.12), 0 8px 28px rgba(0, 0, 0, 0.35);
        }

        .talk-bar {
          width: 3px;
          height: 10px;
          border-radius: 999px;
          align-self: center;
          background: linear-gradient(to top, rgba(99, 102, 241, 0.35), rgba(34, 211, 238, 0.95));
          opacity: 0.85;
          animation: talkBarIdle 1.25s ease-in-out infinite;
        }

        .talk-wave-btn--listen .talk-bar,
        .talk-wave-btn--speak .talk-bar {
          animation: talkBarActive 0.42s ease-in-out infinite alternate;
          background: linear-gradient(to top, rgba(168, 85, 247, 0.4), rgba(52, 211, 153, 0.95));
        }

        .talk-wave-btn--speak .talk-bar {
          background: linear-gradient(to top, rgba(244, 114, 182, 0.45), rgba(250, 204, 21, 0.95));
        }

        .talk-wave-label {
          margin: 8px 0 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #e2e8f0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 14px rgba(0, 0, 0, 0.65);
        }

        .talk-wave-hint {
          margin-top: 4px;
          font-size: 10px;
          color: rgba(226, 232, 240, 0.95);
          text-align: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
        }

        .voice-panel {
          position: fixed;
          left: 50%;
          bottom: 118px;
          transform: translateX(-50%);
          width: min(380px, calc(100vw - 24px));
          max-height: min(430px, 42vh);
          display: flex;
          flex-direction: column;
          gap: 0;
          z-index: 40;
        }

        @media (max-width: 640px) {
          .voice-panel {
            bottom: 112px;
            max-height: min(380px, 48vh);
          }
        }

        .voice-panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .voice-panel-title {
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #e5e7eb;
        }

        .voice-panel-subtitle {
          font-size: 11px;
          color: #9ca3af;
        }

        .voice-panel-body {
          margin-top: 4px;
          padding-top: 6px;
          max-height: 270px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
        }

        .voice-panel-body::-webkit-scrollbar {
          width: 6px;
        }

        .voice-panel-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .voice-panel-body::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.7);
          border-radius: 999px;
        }

        .voice-panel-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(30, 64, 175, 0.8);
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }

        .icon-button {
          margin-left: auto;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.85);
          color: #e5e7eb;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .icon-button:hover {
          background: rgba(30, 64, 175, 0.95);
          transform: translateY(-1px);
        }

        .voice-placeholder {
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          padding: 10px 0 6px;
        }

        .chat-bubble {
          margin-bottom: 10px;
          padding: 9px 10px 8px;
          border-radius: 14px;
          font-size: 12px;
        }

        .chat-bubble--user {
          background: radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.45), rgba(15, 23, 42, 0.96));
          border: 1px solid rgba(59, 130, 246, 0.7);
          margin-left: 40px;
        }

        .chat-bubble--assistant {
          background: radial-gradient(circle at 0 0, rgba(16, 185, 129, 0.4), rgba(15, 23, 42, 0.96));
          border: 1px solid rgba(45, 212, 191, 0.7);
          margin-right: 40px;
        }

        .chat-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 2px;
          color: #e5e7eb;
        }

        .chat-text {
          color: #e5e7eb;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          margin-top: 4px;
        }

        .status-pill--listening {
          background: rgba(59, 130, 246, 0.24);
          border: 1px solid rgba(59, 130, 246, 0.6);
          color: #bfdbfe;
        }

        .status-pill--speaking {
          background: rgba(16, 185, 129, 0.28);
          border: 1px solid rgba(16, 185, 129, 0.7);
          color: #a7f3d0;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
          animation: dotPulse 1.1s ease-in-out infinite;
        }

        .error-banner {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(127, 29, 29, 0.85);
          border: 1px solid rgba(248, 113, 113, 0.85);
          color: #fee2e2;
          font-size: 11px;
        }

        /* Sound wave bars for speaking state */
        .voice-wave {
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          width: 80px;
          height: 24px;
          opacity: 0.25;
          transition: opacity 180ms ease;
        }

        .voice-wave--active {
          opacity: 1;
        }

        .wave-bar {
          flex: 1;
          border-radius: 999px;
          background: linear-gradient(to top, #22d3ee, #a855f7);
          transform-origin: bottom;
          transform: scaleY(0.25);
          animation: waveDance 1.2s ease-in-out infinite;
          animation-play-state: paused;
        }

        .voice-wave--active .wave-bar {
          animation-play-state: running;
        }

        ${Array.from({ length: 16 })
          .map((_, i) => {
            const idx = i + 1;
            const delay = (idx * 0.08).toFixed(2);
            const base = (idx % 4) + 1;
            return `
              .wave-bar-${idx} {
                animation-delay: -${delay}s;
                max-height: ${10 + base * 4}px;
              }
            `;
          })
          .join('\n')}

        /* Animations */
        @keyframes gradientShift {
          0% {
            transform: translate3d(0, 0, 0) scale(1.02);
          }
          50% {
            transform: translate3d(-20px, 10px, 0) scale(1.06);
          }
          100% {
            transform: translate3d(10px, -16px, 0) scale(1.04);
          }
        }

        @keyframes titleShine {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes floatParticle {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(10px, -40vh, 0);
          }
          100% {
            transform: translate3d(-10px, -80vh, 0);
          }
        }

        @keyframes borderSweep {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes talkBarIdle {
          0%,
          100% {
            height: 6px;
            opacity: 0.55;
          }
          50% {
            height: 14px;
            opacity: 1;
          }
        }

        @keyframes talkBarActive {
          0% {
            height: 5px;
            opacity: 0.65;
          }
          100% {
            height: 20px;
            opacity: 1;
          }
        }

        @keyframes dotPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.4);
            opacity: 1;
          }
        }

        @keyframes waveDance {
          0%,
          100% {
            transform: scaleY(0.35);
          }
          25% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.5);
          }
          75% {
            transform: scaleY(0.85);
          }
        }
      `}</style>
    </div>
  );
}
