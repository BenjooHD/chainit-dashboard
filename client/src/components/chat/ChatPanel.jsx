import { useEffect, useRef, useState } from 'react';
import { useChatUsers, useConversation } from '../../hooks/useChat';
import './Chat.css';

function ConversationView({ user }) {
  const { messages, loading, send } = useConversation(user.id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await send(draft.trim());
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-conversation">
      <div className="chat-conversation-header">
        {user.username}
        {user.title && <span className="chat-user-title"> · {user.title}</span>}
      </div>
      <div className="chat-messages" ref={scrollRef}>
        {loading && <div className="task-empty">Lädt…</div>}
        {!loading && messages.length === 0 && <div className="task-empty">Noch keine Nachrichten</div>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.mine ? 'chat-bubble-mine' : ''}`}>
            {m.body}
          </div>
        ))}
      </div>
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nachricht schreiben…"
        />
        <button type="submit" disabled={sending || !draft.trim()}>
          Senden
        </button>
      </form>
    </div>
  );
}

export default function ChatPanel() {
  const { users, loading } = useChatUsers();
  const [selected, setSelected] = useState(null);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Chat</h2>
      </div>
      <div className="chat-layout">
        <div className="chat-user-list">
          {loading && <div className="task-empty">Lädt…</div>}
          {!loading && users.length === 0 && <div className="task-empty">Keine anderen Nutzer</div>}
          {users.map((u) => (
            <button
              key={u.id}
              className={`chat-user-item ${selected?.id === u.id ? 'chat-user-item-active' : ''}`}
              onClick={() => setSelected(u)}
            >
              <span className="chat-user-avatar">{u.username[0]?.toUpperCase()}</span>
              <span>
                <div>{u.username}</div>
                {u.title && <div className="chat-user-title">{u.title}</div>}
              </span>
            </button>
          ))}
        </div>
        {selected ? (
          <ConversationView user={selected} />
        ) : (
          <div className="chat-conversation chat-conversation-empty">
            Wähle links einen Nutzer aus, um zu chatten.
          </div>
        )}
      </div>
    </section>
  );
}
