import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { sendChatMessage } from '../services/api';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about this portfolio.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const { data } = await sendChatMessage(userMsg, sessionId);
      setMessages(m => [...m, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {open && (
        <div className="chatbot-window" role="dialog" aria-label="Chat assistant">
          <div className="chatbot-header">
            <h3>Portfolio Assistant</h3>
            <button onClick={() => setOpen(false)} aria-label="Close chat"><FiX /></button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="chat-msg chat-msg-assistant typing">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form className="chatbot-input" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              maxLength={500}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
              <FiSend />
            </button>
          </form>
        </div>
      )}
      <button className="chatbot-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle chat">
        {open ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}
