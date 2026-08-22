import React from 'react';

const COLORS = [
  ['#4f46e5', '#eef2ff'], ['#10b981', '#d1fae5'], ['#f59e0b', '#fef3c7'],
  ['#ef4444', '#fee2e2'], ['#3b82f6', '#dbeafe'], ['#8b5cf6', '#ede9fe'],
  ['#ec4899', '#fce7f3'], ['#14b8a6', '#ccfbf1'], ['#f97316', '#ffedd5'],
];

const getColor = (name = '') => {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const sizeMap = {
  xs: 'avatar-xs', sm: 'avatar-sm', md: 'avatar-md',
  lg: 'avatar-lg', xl: 'avatar-xl', '2xl': 'avatar-2xl',
};

const Avatar = ({ src, name = '', size = 'md', className = '', style = {} }) => {
  const [imgErr, setImgErr] = React.useState(false);
  const sizeClass = sizeMap[size] || sizeMap.md;
  const [fg, bg] = getColor(name);

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar ${sizeClass} ${className}`}
        style={style}
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <div
      className={`avatar-placeholder ${sizeClass} ${className}`}
      style={{ background: bg, color: fg, ...style }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
