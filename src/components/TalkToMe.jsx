import AvatarEffigy from './AvatarEffigy';
import { useMouthTimeline } from '../hooks/useMouthTimeline';

export default function TalkToMe({
  voiceActive,
  isListening,
  isSpeaking,
  listenSecondsLeft,
  chatHistory,
  userName,
  error,
  lastSpokenText,
  toggleVoice,
  stopVoice,
}) {
  const mouthShape = useMouthTimeline(isSpeaking, lastSpokenText);

  return (
    <>
      <button
        type="button"
        className={`talk-btn ${voiceActive ? 'talk-btn--on' : ''} ${isListening ? 'talk-btn--listen' : ''} ${isSpeaking ? 'talk-btn--speak' : ''}`}
        onClick={toggleVoice}
        aria-label="Talk to me — voice resume"
        aria-expanded={voiceActive}
      >
        <span className="talk-btn-ring" />
        <span className="talk-btn-label">Talk to me</span>
      </button>

      {voiceActive && (
        <div className="talk-panel" role="dialog" aria-label="Voice conversation">
          <header className="talk-panel-header">
            <div>
              <h2>Talk to me</h2>
              <p>
                {isSpeaking
                  ? 'Speaking…'
                  : isListening
                    ? `Your turn (${listenSecondsLeft ?? 4}s)`
                    : 'Ask anything about my work'}
              </p>
            </div>
            <button type="button" className="talk-close" onClick={stopVoice} aria-label="Close">
              ×
            </button>
          </header>

          <div className="talk-panel-body">
            <AvatarEffigy mouthShape={mouthShape} isListening={isListening} isSpeaking={isSpeaking} />

            <div className="talk-transcript">
              {chatHistory.length === 0 && (
                <p className="talk-placeholder">Starting voice mode…</p>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`talk-bubble talk-bubble--${msg.role}`}>
                  <span className="talk-bubble-label">
                    {msg.role === 'user' ? userName || 'You' : 'Kandarp'}
                  </span>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="talk-error">{error}</p>}
        </div>
      )}
    </>
  );
}
