import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClass: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'card-p-none',
  sm: 'card-p-sm',
  md: 'card-p-md',
  lg: 'card-p-lg',
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  hoverable = false,
  padding = 'md',
  onClick,
}) => {
  const classes = [
    'card',
    elevated ? 'card-elevated' : '',
    hoverable ? 'card-hover' : '',
    paddingClass[padding],
    onClick ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default Card;
