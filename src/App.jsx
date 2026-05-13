import React, { useState, useEffect, useRef } from 'react';

export default function KandarpResume() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [userName, setUserName] = useState('');
  const [chatStage, setChatStage] = useState('greeting');
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setIsListening(false);
        handleUserSpeech(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Could not hear you clearly. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError('');
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speak = (text) => {
    return new Promise((resolve) => {
      if (synthRef.current) {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
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
    setChatHistory(prev => [...prev, { role: 'user', content: userText }]);

    if (chatStage === 'greeting') {
      const extractedName = userText.trim().split(' ')[0];
      setUserName(extractedName);
      const response = `Nice to meet you, ${extractedName}! What would you like to know about me?`;
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      setChatStage('conversation');
      await speak(response);
      setTimeout(() => startListening(), 500);
      return;
    }

    const lowerText = userText.toLowerCase();
    if (lowerText.includes('call') || lowerText.includes('phone') || lowerText.includes('number') || 
        lowerText.includes('reach') || lowerText.includes('contact') || lowerText.includes('real kandarp')) {
      const response = `Sure! Here's how to reach the real Kandarp. Phone: +91 8109901136. Email: mathurkandarp@gmail.com. LinkedIn: linkedin.com/in/kandarpmathur14. Feel free to mention you chatted with my AI first!`;
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      await speak(response);
      setTimeout(() => startListening(), 500);
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are an AI voice assistant representing Kandarp Mathur, a Product Owner based in Ahmedabad, India. Keep responses conversational and concise for voice (2-3 sentences max).

CORE INFO:
- Current: Product Owner for OMAP™ at AltaDX (AI micro-agents platform for fitness/wellness)
- Expertise: Product management, AI agents, Agile/Scrum, Power BI, SQL, APIs
- Projects: OMAP™ (100+ fitness operators), Round1 (AI interview screening), Analystbychance (1000+ mentees)
- Skills: Product Management, Agile/Scrum/SAFe, Power BI, SQL, APIs, AI/ML, JIRA, Confluence
- Certifications: CSM®, SAFe® 6 POPM, Salesforce AI Associate
- Education: B.E. Mechanical Engineering (2009-2013)

WORK HISTORY:
- AltaDX (2025-now): Product Owner for AI agents
- KTek Resourcing (2019-2025): Business Analyst
- Wealth It Global (2014-2018): Reporting Analyst

Keep it conversational, friendly, professional. This is voice conversation, so be natural and brief.`,
          messages: [{ role: 'user', content: userText }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      await speak(aiResponse);
      setTimeout(() => startListening(), 500);

    } catch (error) {
      console.error('Error calling Claude API:', error);
      const fallbackResponse = "I'm having trouble connecting right now. But I can tell you that Kandarp is a Product Owner at AltaDX, building AI agents for fitness and wellness enterprises. Would you like to know more about his experience?";
      setChatHistory(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
      await speak(fallbackResponse);
      setTimeout(() => startListening(), 500);
    }
  };

  const toggleVoice = async () => {
    if (!voiceActive) {
      setVoiceActive(true);
      setChatHistory([]);
      setChatStage('greeting');
      const greeting = "Hey! This is Kandarp. What's your name?";
      setChatHistory([{ role: 'assistant', content: greeting }]);
      await speak(greeting);
      setTimeout(() => startListening(), 500);
    } else {
      setVoiceActive(false);
      setIsListening(false);
      setIsSpeaking(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
    setVoiceActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setChatHistory([]);
    setUserName('');
    setChatStage('greeting');
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#fff'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        <header style={{ 
          padding: '60px 0 40px',
          textAlign: 'center',
          animation: 'fadeIn 1s ease-in'
        }}>
          <h1 style={{ 
            fontSize: '48px',
            fontWeight: '700',
            margin: '0 0 10px',
            letterSpacing: '-1px'
          }}>
            Kandarp Mathur
          </h1>
          <p style={{ 
            fontSize: '20px',
            opacity: '0.95',
            fontWeight: '400',
            margin: '0 0 20px'
          }}>
            Product Owner | AI Agent Builder | Building the Future with AI
          </p>
          <p style={{ fontSize: '16px', opacity: '0.9', margin: '0' }}>
            📍 Ahmedabad, India
          </p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://linkedin.com/in/kandarpmathur14" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '16px' }}>
              💼 LinkedIn
            </a>
            <a href="mailto:mathurkandarp@gmail.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '16px' }}>
              ✉️ Email
            </a>
          </div>
        </header>

        <section style={{ 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '30px',
          color: '#1a202c',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px', color: '#667eea' }}>
            About Me
          </h2>
          <p style={{ fontSize: '17px', lineHeight: '1.7', margin: '0' }}>
            Product Owner for OMAP™ (Outcomes Micro Agents Platform) at AltaDX—an AI platform transforming how fitness, wellness, and beauty enterprises drive revenue, retention, and member experience. I lead cross-functional teams to deliver AI-enabled micro-agents that automate workflows, enhance decision-making, and create measurable business outcomes.
          </p>
        </section>

        <section style={{ 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '30px',
          color: '#1a202c',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px', color: '#667eea' }}>
            Experience
          </h2>
          
          <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
                Product Owner - OMAP™
              </h3>
              <span style={{ fontSize: '14px', color: '#718096' }}>June 2025 - Present</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#667eea', margin: '4px 0 12px' }}>
              AltaDX
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              Leading AI-powered platform serving 100+ fitness operators. Design and deliver micro-agents for customer acquisition, retention, and operations optimization. Manage product roadmap, sprint planning, and cross-functional collaboration.
            </p>
          </div>

          <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
                Business Analyst
              </h3>
              <span style={{ fontSize: '14px', color: '#718096' }}>January 2019 - March 2025</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#667eea', margin: '4px 0 12px' }}>
              KTek Resourcing
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              Drove digital transformation for recruitment systems. Led requirements gathering, designed API integrations, improved onboarding efficiency by 30%. Coordinated UAT and Agile development.
            </p>
          </div>

          <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
                Reporting Analyst
              </h3>
              <span style={{ fontSize: '14px', color: '#718096' }}>January 2014 - December 2018</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#667eea', margin: '4px 0 12px' }}>
              Wealth It Global
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              Built data-driven reporting frameworks. Created Excel dashboards, monitored KPIs, reduced manual reporting by 40% through automation.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
                Trainer
              </h3>
              <span style={{ fontSize: '14px', color: '#718096' }}>June 2013 - December 2013</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#667eea', margin: '4px 0 12px' }}>
              Qpid Outsourcing Pvt. Ltd.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              Designed customized learning programs. Conducted needs assessments, developed SOPs, facilitated cross-functional training to boost collaboration.
            </p>
          </div>
        </section>

        <section style={{ 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '30px',
          color: '#1a202c',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px', color: '#667eea' }}>
            Key Projects
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>
              OMAP™ (Outcomes Micro Agents Platform)
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              AI-powered platform with micro-agents for customer acquisition, retention, and operations. Serving 100+ fitness operators with integrations to major management systems.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>
              Round1
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              AI-powered interview screening platform conducting real conversations with candidates and delivering instant hiring insights. Solving the signal problem in modern hiring.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>
              Analystbychance
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0', color: '#4a5568' }}>
              Free mentorship platform helping 1000+ aspiring Business Analysts, Data Analysts, and MIS professionals break into tech.
            </p>
          </div>
        </section>

        <section style={{ 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '30px',
          color: '#1a202c',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px', color: '#667eea' }}>
            Skills & Certifications
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 12px' }}>
              Core Skills
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['Product Management', 'Agile/Scrum/SAFe', 'AI Agents', 'Power BI', 'SQL', 'API Integration', 'JIRA', 'Confluence', 'Snowflake', 'Databricks', 'Business Analysis'].map(skill => (
                <span key={skill} style={{ 
                  background: '#667eea', 
                  color: '#fff', 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 12px' }}>
              Certifications
            </h3>
            <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.8', fontSize: '15px', color: '#4a5568' }}>
              <li>Certified ScrumMaster (CSM®)</li>
              <li>SAFe® 6 Product Owner/Product Manager</li>
              <li>Salesforce Certified AI Associate</li>
              <li>Registered Scrum Basics™</li>
            </ul>
          </div>
        </section>

        <section style={{ 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '100px',
          color: '#1a202c',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px', color: '#667eea' }}>
            Education
          </h2>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>
              Bachelor of Engineering - Mechanical Engineering
            </h3>
            <p style={{ fontSize: '16px', color: '#667eea', margin: '0 0 4px' }}>
              Rajiv Gandhi Prodyogiki Vishwavidyalaya
            </p>
            <p style={{ fontSize: '15px', color: '#718096', margin: '0' }}>
              2009 - 2013
            </p>
          </div>
        </section>

        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000
        }}>
          <button
            onClick={toggleVoice}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: voiceActive ? '#48bb78' : '#667eea',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              transition: 'all 0.3s ease',
              animation: !voiceActive ? 'pulse 2s infinite' : 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {voiceActive ? '🔴' : '🎤'}
          </button>
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            background: '#fff',
            color: '#1a202c',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none'
          }}>
            {voiceActive ? 'Voice Active' : '🎤 Talk to AI Kandarp'}
          </div>
        </div>

        {voiceActive && (
          <div style={{
            position: 'fixed',
            bottom: '120px',
            right: '30px',
            width: '320px',
            maxHeight: '400px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 999
          }}>
            <div style={{
              background: '#667eea',
              color: '#fff',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', fontSize: '16px' }}>Voice Chat</span>
              <button
                onClick={stopVoice}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              padding: '16px',
              maxHeight: '300px',
              overflowY: 'auto',
              fontSize: '14px',
              color: '#1a202c'
            }}>
              {chatHistory.length === 0 && (
                <p style={{ textAlign: 'center', color: '#718096', margin: '20px 0' }}>
                  Initializing voice chat...
                </p>
              )}
              
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? '#e6f2ff' : '#f7fafc',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: msg.role === 'user' ? '#667eea' : '#48bb78',
                    marginBottom: '4px'
                  }}>
                    {msg.role === 'user' ? 'You' : 'Kandarp AI'}
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))}
              
              {isListening && (
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: '#667eea',
                  fontWeight: '600'
                }}>
                  🎤 Listening...
                </div>
              )}
              
              {isSpeaking && (
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: '#48bb78',
                  fontWeight: '600'
                }}>
                  🔊 Speaking...
                </div>
              )}

              {error && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fc8181',
                  color: '#c53030',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginTop: '10px'
                }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#718096',
              textAlign: 'center'
            }}>
              {isListening ? 'Listening for your voice...' : 
               isSpeaking ? 'AI is speaking...' : 
               'Speak when ready'}
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4); }
            50% { box-shadow: 0 8px 32px rgba(102, 126, 234, 0.8); }
          }
        `}</style>
      </div>
    </div>
  );
}
