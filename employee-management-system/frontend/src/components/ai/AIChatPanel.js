/**
 * AIChatPanel — Inline (non-floating) card-based AI chat panel
 * Used directly on pages as an embedded section.
 * Collapsible with a toggle button.
 *
 * Props:
 *  - title       : string
 *  - onSend      : async (message) => string
 *  - suggestions : string[]
 *  - loading     : bool
 *  - placeholder : string
 *  - defaultOpen : bool
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bot } from 'lucide-react';
import AIAssistant from './AIAssistant';

const AIChatPanel = ({
  title = '🤖 Ask AI',
  onSend,
  suggestions = [],
  loading = false,
  placeholder = 'Ask something...',
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
      {/* Toggle header */}
      <div
        className="card-header"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        aria-label={open ? 'Collapse AI Assistant' : 'Expand AI Assistant'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={15} color="var(--primary)" />
          </div>
          <h3 className="card-title">{title}</h3>
          <span style={{
            fontSize: '0.68rem', padding: '2px 8px',
            background: 'var(--primary-light)', color: 'var(--primary)',
            borderRadius: 20, fontWeight: 600, border: '1px solid var(--primary-mid)',
          }}>
            AI Powered
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>thinking...</span>}
          {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Chat body — animated expand/collapse */}
      <div style={{
        height: open ? 420 : 0,
        overflow: 'hidden',
        transition: 'height 0.25s ease',
      }}>
        <div style={{ height: 420 }}>
          <AIAssistant
            onSendMessage={onSend}
            suggestedQuestions={suggestions}
            title={title}
            placeholder={placeholder}
            isOpen={true}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
