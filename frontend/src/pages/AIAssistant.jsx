import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles, RefreshCw, Copy, ThumbsUp, ThumbsDown, Bot, User, Loader2, FileText } from 'lucide-react';
import { PageHeader } from '../components/ui/index.jsx';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const WELCOME = {
  role: 'assistant',
  content: "Hello! I'm your AI Case Assistant powered by Gemini. I can help you analyze cases, identify missing documents, generate summaries, and answer questions about any case. How can I help you today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTED = [
  'What documents are missing across all cases?',
  'Summarize all active cases',
  'Which cases have urgent priority?',
  'What are the upcoming deadlines?',
  'Generate a petition for case 1',
];

const formatMessage = (text) =>
  text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (line.startsWith('•') || line.startsWith('-'))
      return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: bold.replace(/^[•-]\s*/, '') }} />;
    if (/^\d+\./.test(line))
      return <li key={i} className="ml-4 text-sm list-decimal" dangerouslySetInnerHTML={{ __html: bold }} />;
    if (line === '') return <br key={i} />;
    return <p key={i} className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: bold }} />;
  });

export default function AIAssistant() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = {
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not generate a response.';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        caseId: data.case_id,
        petitionId: data.petition_id,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the AI service. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="fade-in h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <PageHeader
        title="AI Case Assistant"
        subtitle="Ask questions about cases, generate summaries, and get recommendations."
      >
        <button onClick={() => setMessages([WELCOME])} className="btn-secondary text-xs py-2">
          <RefreshCw size={13} /> New chat
        </button>
      </PageHeader>

      <div className="flex-1 flex flex-col card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-indigo-50">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AscendAI Copilot</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <p className="text-xs text-slate-400">Online · Powered by Gemini</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-brand-500 to-indigo-600 shadow-sm'
                  : 'bg-slate-200'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot size={15} className="text-white" />
                  : <User size={15} className="text-slate-600" />
                }
              </div>
              <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant'
                    ? <div className="space-y-0.5">{formatMessage(msg.content)}</div>
                    : <p className="text-sm">{msg.content}</p>
                  }
                  {msg.role === 'assistant' && msg.petitionId && msg.caseId && (
                    <Link
                      to={`/cases/${msg.caseId}/petition`}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-brand-600 bg-white px-2.5 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
                    >
                      <FileText size={12} /> View Petition
                    </Link>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <button className="text-slate-300 hover:text-slate-500 transition-colors"
                        onClick={() => navigator.clipboard.writeText(msg.content)}>
                        <Copy size={11} />
                      </button>
                      <button className="text-slate-300 hover:text-emerald-500 transition-colors"><ThumbsUp size={11} /></button>
                      <button className="text-slate-300 hover:text-red-400 transition-colors"><ThumbsDown size={11} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <p className="text-xs text-slate-400 mb-2.5">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-full hover:bg-brand-100 transition-colors font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-4 pt-3 border-t border-slate-100">
          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about a case, request a summary, or get document status..."
                rows={1}
                className="input resize-none py-3 leading-relaxed min-h-[46px] max-h-32"
                style={{ height: 'auto' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
            </div>
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-11 h-11 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            AI responses are suggestions only. Always verify critical case information.
          </p>
        </div>
      </div>
    </div>
  );
}