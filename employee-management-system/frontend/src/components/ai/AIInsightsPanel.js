/**
 * AIInsightsPanel — Compact AI-generated insights block
 * Used in dashboards and analytics pages.
 *
 * Props:
 *  - insights   : string[]  — array of insight lines
 *  - loading    : bool
 *  - error      : string | null
 *  - onRefresh  : fn  — callback to re-generate insights
 *  - title      : string
 *  - compact    : bool  — smaller/collapsed display
 */

import React from 'react';
import { RefreshCw, Bot, AlertCircle } from 'lucide-react';

const AIInsightsPanel = ({
  insights = [],
  loading = false,
  error = null,
  onRefresh,
  title = '🤖 AI Insights',
  compact = false,
}) => {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Bot size={15} color="var(--primary)" />
          </div>
          <h3 className="card-title">{title}</h3>
          {loading && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>
              Generating...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 20 }}>
            AI-generated
          </span>
          {onRefresh && (
            <button
              className="btn-icon"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh AI insights"
              aria-label="Refresh AI insights"
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          )}
        </div>
      </div>

      <div className="card-body" style={{ padding: compact ? '12px 20px' : '16px 24px' }}>
        {loading && insights.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4, width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        ) : error ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--text-muted)', fontSize: '0.85rem',
            background: 'var(--bg)', borderRadius: 8, padding: '10px 14px',
          }}>
            <AlertCircle size={16} color="var(--text-muted)" />
            <span>{error.includes('not configured')
              ? 'AI insights require the OpenAI API key to be configured in the backend.'
              : 'AI insights are temporarily unavailable.'
            }</span>
            {onRefresh && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={onRefresh}
                style={{ marginLeft: 'auto' }}
              >
                Retry
              </button>
            )}
          </div>
        ) : insights.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 0' }}>
            Click refresh to generate AI insights from your current data.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>
            {insights.map((line, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: compact ? '0.82rem' : '0.875rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                padding: compact ? '2px 0' : '4px 0',
                borderBottom: i < insights.length - 1 ? '1px solid var(--border)' : 'none',
                paddingBottom: compact ? 6 : 8,
              }}>
                <span>{line.startsWith('•') || line.startsWith('-') ? line : line}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
