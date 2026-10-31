import React from 'react';

type BadgeVariant = 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'gray';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  blue: 'badge-blue',
  violet: 'badge-violet',
  green: 'badge-green',
  amber: 'badge-amber',
  red: 'badge-red',
  gray: 'badge-gray',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'badge-sm',
  md: 'badge-md',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const classes = [
    'badge',
    variantClass[variant],
    sizeClass[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
};

export default Badge;
