import React from 'react';

// ─── Base Skeleton ────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
  style,
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

// ─── Skeleton Text ────────────────────────────────────────────────────────────

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  lastLineWidth = '60%',
}) => {
  return (
    <div className={`skeleton-text ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="skeleton-text-line"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          height={14}
          style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
        />
      ))}
    </div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = false,
}) => {
  return (
    <div className={`skeleton-card card ${className}`} aria-hidden="true">
      {showAvatar && (
        <div className="skeleton-card-header">
          <Skeleton width={40} height={40} borderRadius="50%" />
          <div className="skeleton-card-header-text">
            <Skeleton height={14} width="40%" style={{ marginBottom: 6 }} />
            <Skeleton height={12} width="25%" />
          </div>
        </div>
      )}
      <Skeleton height={16} width="70%" style={{ marginBottom: 12 }} />
      <SkeletonText lines={3} />
      <div className="skeleton-card-footer">
        <Skeleton height={32} width={80} borderRadius={6} />
        <Skeleton height={32} width={80} borderRadius={6} />
      </div>
    </div>
  );
};

// ─── Skeleton Table ───────────────────────────────────────────────────────────

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`skeleton-table ${className}`} aria-hidden="true">
      {/* Header row */}
      <div className="skeleton-table-row skeleton-table-header">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            className="skeleton-table-cell"
            height={14}
            width={colIndex === 0 ? '40%' : `${Math.floor(60 / (columns - 1))}%`}
          />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="skeleton-table-cell"
              height={14}
              width={`${Math.floor(Math.random() * 30 + 50)}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
