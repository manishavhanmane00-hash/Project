import React from 'react';

export const SkeletonText = ({ width = '100%', height = 16, style = {} }) => (
  <div className="skeleton" style={{ width, height, ...style }} />
);

export const SkeletonCard = () => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
      </div>
    </div>
    <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: '80%' }} />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}><div className="skeleton" style={{ height: 12, width: '80%' }} /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}><div className="skeleton" style={{ height: 14, width: c === 0 ? '60%' : '70%' }} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SkeletonLoader = () => (
  <div style={{ padding: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
      {[1,2,3,4].map(i => (
        <div key={i} className="card" style={{ padding: 20 }}>
          <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 10, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 24, width: '50%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '70%' }} />
        </div>
      ))}
    </div>
    <SkeletonTable />
  </div>
);

export default SkeletonLoader;
