import Journey from './components/Journey';
import TalkToMe from './components/TalkToMe';
import DownloadResume from './components/DownloadResume';
import { useVoiceChat } from './hooks/useVoiceChat';

export default function App() {
  const voice = useVoiceChat();

  return (
    <div className="app">
      <div className="film-grain" aria-hidden />
      <DownloadResume />
      <Journey />
      <TalkToMe {...voice} />
    </div>
  );
}
