/**
 * AIAssistant — Reusable floating chat widget
 *
 * Props:
 *  - user            : current user object (from AuthContext)
 *  - onSendMessage   : async (message) => string  — function to call AI and return answer
 *  - suggestedQuestions : string[]  — optional suggested questions
 *  - title           : string  — chat title
 *  - placeholder     : string  — input placeholder
 *  - isOpen          : bool    — controlled open state
 *  - onClose         : fn      — callback when closed
 *  - loading         : bool    — external loading flag
 *  - floatingButton  : bool    — show floating trigger button (default false)
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, RotateCcw, Trash2, Bot, ChevronDown } from 'lucide-react';

const AIAssistant = ({
  onSendMessage,
  suggestedQuestions = [],
  title = '🤖 AI Assistant',
  placeholder = 'Ask something...',
  isOpen = true,
  onClose,
  loading = false,
}) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! How can I help you today? You can ask me about your HR data, company policies, or anything related to your work.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastErrorIdx, setLastErrorIdx] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending || loading) return;

    setInput('');
    setLastErrorIdx(null);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setSending(true);

    // Add loading placeholder
    setMessages(prev => [...prev, { role: 'assistant', text: '', loading: true }]);

    try {
      const answer = await onSendMessage(msg);
      // Replace loading placeholder with real answer
      setMessages(prev => {
        const updated = [...prev];
        const loadingIdx = updated.findLastIndex(m => m.loading);
        if (loadingIdx >= 0) {
          if (answer && typeof answer === 'string' && answer.trim()) {
            updated[loadingIdx] = { role: 'assistant', text: answer };
          } else {
            updated[loadingIdx] = {
              role: 'assistant',
              text: 'I could not generate a response. Please try rephrasing your question.',
              error: true,
            };
            setLastErrorIdx(loadingIdx);
          }
        }
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const loadingIdx = updated.findLastIndex(m => m.loading);
        if (loadingIdx >= 0) {
          updated[loadingIdx] = {
            role: 'assistant',
            text: 'Something went wrong while processing your request. Please try again.',
            error: true,
          };
          setLastErrorIdx(loadingIdx);
        }
        return updated;
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleRetry = async () => {
    if (!lastErrorIdx) return;
    // Find the user message before the error
    const userMsg = messages.slice(0, lastErrorIdx).reverse().find(m => m.role === 'user');
    if (userMsg) {
      // Remove the error message
      setMessages(prev => prev.filter((_, i) => i !== lastErrorIdx));
      setLastErrorIdx(null);
      await handleSend(userMsg.text);
    }
  };

  const handleClear = () => {
    setMessages([
      { role: 'assistant', text: 'Conversation cleared. How can I help you?' },
    ]);
    setLastErrorIdx(null);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--primary)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={16} color="white" />
          </div>
          <span style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{title}</span>
          {(sending || loading) && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', marginLeft: 4 }}>thinking...</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleClear}
            title="Clear conversation"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: 'rgba(255,255,255,0.75)' }}
            aria-label="Clear conversation"
          >
            <Trash2 size={15} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: 'rgba(255,255,255,0.75)' }}
              aria-label="Close AI Assistant"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: 'var(--bg)',
        minHeight: 0,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 8,
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: msg.error ? 'var(--danger-light)' : 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
              }}>
                <Bot size={13} color={msg.error ? 'var(--danger)' : 'var(--primary)'} />
              </div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '10px 13px',
              borderRadius: msg.role === 'user'
                ? 'var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)'
                : 'var(--radius-xs) var(--radius-lg) var(--radius-lg) var(--radius-lg)',
              background: msg.role === 'user'
                ? 'var(--primary)'
                : msg.error
                  ? 'var(--danger-light)'
                  : 'var(--surface)',
              color: msg.role === 'user'
                ? 'white'
                : msg.error
                  ? 'var(--danger)'
                  : 'var(--text-primary)',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              border: msg.role === 'assistant' && !msg.error ? '1px solid var(--border)' : 'none',
              boxShadow: 'var(--shadow-xs)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.loading ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--primary)',
                      animation: 'pulse 1.2s infinite',
                      animationDelay: `${d * 0.2}s`,
                      opacity: 0.6,
                    }} />
                  ))}
                </div>
              ) : msg.text}
              {msg.error && lastErrorIdx === i && (
                <button
                  onClick={handleRetry}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 8, padding: '4px 8px', borderRadius: 6,
                    background: 'var(--danger)', color: 'white',
                    border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                  }}
                >
                  <RotateCcw size={11} /> Retry
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && messages.length <= 2 && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '100%', marginBottom: 4 }}>Suggested questions:</span>
          {suggestedQuestions.slice(0, 4).map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={sending}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid var(--primary-mid)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'white'; }}
              onMouseLeave={e => { e.target.style.background = 'var(--primary-light)'; e.target.style.color = 'var(--primary)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        background: 'var(--surface)',
        borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={sending || loading}
          style={{
            flex: 1,
            resize: 'none',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            outline: 'none',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            maxHeight: 80,
            overflowY: 'auto',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          aria-label="Ask AI"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending || loading}
          style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: input.trim() && !sending ? 'var(--primary)' : 'var(--border)',
            border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--transition)',
            flexShrink: 0,
          }}
          aria-label="Send message"
        >
          <Send size={15} color={input.trim() && !sending ? 'white' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
