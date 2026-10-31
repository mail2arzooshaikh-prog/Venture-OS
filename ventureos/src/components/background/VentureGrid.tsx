import React, { useEffect, useRef } from 'react';

type VentureGridVariant = 'default' | 'login' | 'dashboard' | 'vision' | 'ai';

interface VentureGridProps {
  variant?: VentureGridVariant;
}

const VentureGrid: React.FC<VentureGridProps> = ({ variant = 'default' }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Grid lines config
  const gridOpacity = variant === 'dashboard' ? 0.03 : 0.055;
  const accentColor = variant === 'vision' ? '#00E5FF' : variant === 'ai' ? '#8B5CF6' : '#4F8CFF';
  const secondaryAccent = variant === 'ai' ? '#4F8CFF' : '#8B5CF6';

  // Node sets per variant
  const smallNodes =
    variant === 'login'
      ? [
          { cx: 120, cy: 80, r: 2.5, op: 0.45 },
          { cx: 280, cy: 160, r: 2, op: 0.35 },
          { cx: 420, cy: 60, r: 3, op: 0.4 },
          { cx: 60, cy: 250, r: 2, op: 0.3 },
          { cx: 340, cy: 310, r: 2.5, op: 0.4 },
          { cx: 500, cy: 200, r: 2, op: 0.35 },
          { cx: 180, cy: 380, r: 3, op: 0.45 },
          { cx: 460, cy: 350, r: 2, op: 0.3 },
          { cx: 80, cy: 440, r: 2.5, op: 0.4 },
          { cx: 390, cy: 450, r: 2, op: 0.35 },
          { cx: 540, cy: 420, r: 3, op: 0.45 },
          { cx: 220, cy: 490, r: 2, op: 0.3 },
        ]
      : variant === 'dashboard'
      ? [
          { cx: 200, cy: 120, r: 2, op: 0.25 },
          { cx: 600, cy: 80, r: 2, op: 0.2 },
          { cx: 900, cy: 200, r: 2.5, op: 0.25 },
          { cx: 400, cy: 350, r: 2, op: 0.2 },
          { cx: 1100, cy: 400, r: 2, op: 0.25 },
        ]
      : variant === 'ai'
      ? [
          { cx: 150, cy: 100, r: 2.5, op: 0.45 },
          { cx: 320, cy: 80, r: 2, op: 0.4 },
          { cx: 500, cy: 150, r: 3, op: 0.45 },
          { cx: 680, cy: 90, r: 2, op: 0.35 },
          { cx: 850, cy: 160, r: 2.5, op: 0.4 },
          { cx: 240, cy: 240, r: 2, op: 0.35 },
          { cx: 420, cy: 300, r: 3, op: 0.45 },
          { cx: 600, cy: 260, r: 2, op: 0.3 },
          { cx: 770, cy: 340, r: 2.5, op: 0.4 },
          { cx: 950, cy: 220, r: 2, op: 0.35 },
        ]
      : [
          // default / vision
          { cx: 120, cy: 80, r: 2.5, op: 0.4 },
          { cx: 380, cy: 140, r: 2, op: 0.35 },
          { cx: 640, cy: 60, r: 3, op: 0.4 },
          { cx: 880, cy: 120, r: 2, op: 0.3 },
          { cx: 200, cy: 300, r: 2.5, op: 0.4 },
          { cx: 460, cy: 260, r: 2, op: 0.35 },
          { cx: 720, cy: 320, r: 3, op: 0.4 },
          { cx: 960, cy: 280, r: 2, op: 0.3 },
        ];

  const glowNodes =
    variant === 'ai'
      ? [
          { cx: 320, cy: 80, r: 8, id: 'gn1' },
          { cx: 680, cy: 90, r: 7, id: 'gn2' },
          { cx: 420, cy: 300, r: 8, id: 'gn3' },
          { cx: 770, cy: 340, r: 7, id: 'gn4' },
          { cx: 150, cy: 100, r: 6, id: 'gn5' },
          { cx: 950, cy: 220, r: 7, id: 'gn6' },
        ]
      : variant === 'login'
      ? [
          { cx: 120, cy: 80, r: 7, id: 'gn1' },
          { cx: 340, cy: 310, r: 8, id: 'gn2' },
          { cx: 180, cy: 380, r: 6, id: 'gn3' },
          { cx: 460, cy: 350, r: 7, id: 'gn4' },
          { cx: 80, cy: 440, r: 8, id: 'gn5' },
          { cx: 540, cy: 420, r: 6, id: 'gn6' },
        ]
      : [
          { cx: 200, cy: 150, r: 8, id: 'gn1' },
          { cx: 560, cy: 100, r: 7, id: 'gn2' },
          { cx: 840, cy: 200, r: 8, id: 'gn3' },
          { cx: 400, cy: 320, r: 6, id: 'gn4' },
          { cx: 700, cy: 360, r: 7, id: 'gn5' },
          { cx: 1000, cy: 280, r: 8, id: 'gn6' },
        ];

  const connectionLines =
    variant === 'login'
      ? [
          'M120,80 L280,160',
          'M280,160 L420,60',
          'M280,160 L340,310',
          'M60,250 L180,380',
          'M340,310 L460,350',
          'M180,380 L390,450',
          'M460,350 L540,420',
          'M390,450 L220,490',
          'M500,200 L540,420',
          'M420,60 L500,200',
        ]
      : variant === 'ai'
      ? [
          'M150,100 L320,80',
          'M320,80 L500,150',
          'M500,150 L680,90',
          'M680,90 L850,160',
          'M150,100 L240,240',
          'M320,80 L420,300',
          'M500,150 L600,260',
          'M680,90 L770,340',
          'M850,160 L950,220',
          'M240,240 L420,300',
          'M420,300 L600,260',
          'M600,260 L770,340',
          'M770,340 L950,220',
        ]
      : variant === 'dashboard'
      ? []
      : [
          'M120,80 L380,140',
          'M380,140 L640,60',
          'M640,60 L880,120',
          'M200,300 L460,260',
          'M460,260 L720,320',
          'M720,320 L960,280',
          'M380,140 L460,260',
          'M640,60 L720,320',
        ];

  // Vision variant corner frame elements
  const showCorners = variant === 'vision';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background:
          'linear-gradient(135deg, #080D18 0%, #0D1424 50%, #080D18 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Animated CSS */}
      <style>{`
        @keyframes vg-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.4); }
        }
        @keyframes vg-pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.2); }
        }
        @keyframes vg-shimmer {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        @keyframes vg-drift {
          0% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-6px) translateX(4px); }
          66% { transform: translateY(4px) translateX(-4px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes vg-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes vg-scan {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .vg-node-pulse { animation: vg-pulse 3s ease-in-out infinite; }
        .vg-node-pulse-slow { animation: vg-pulse-slow 4s ease-in-out infinite; }
        .vg-glow-pulse { animation: vg-pulse-slow 5s ease-in-out infinite; }
        .vg-grid-shimmer { animation: vg-shimmer 8s ease-in-out infinite; }
        .vg-drift { animation: vg-drift 20s ease-in-out infinite; }
        .vg-scan-corner { animation: vg-scan 3s ease-in-out infinite; }
      `}</style>

      {/* Main SVG grid */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className="vg-drift"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          {/* Glow gradient for large nodes */}
          {glowNodes.map((n) => (
            <radialGradient key={n.id + '_grad'} id={n.id + '_grad'} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </radialGradient>
          ))}
          {/* Connection line gradient */}
          <linearGradient id="line_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={secondaryAccent} stopOpacity="0.05" />
          </linearGradient>
          {/* Arc gradient */}
          <linearGradient id="arc_grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
            <stop offset="50%" stopColor={accentColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
          {/* Chart gradient */}
          <linearGradient id="chart_grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
            <stop offset="30%" stopColor={accentColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {variant !== 'dashboard' &&
          Array.from({ length: 23 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 40}
              x2="1440"
              y2={i * 40}
              stroke={accentColor}
              strokeOpacity={gridOpacity}
              strokeWidth="0.5"
              className="vg-grid-shimmer"
            />
          ))}
        {variant === 'dashboard' &&
          Array.from({ length: 23 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 40}
              x2="1440"
              y2={i * 40}
              stroke={accentColor}
              strokeOpacity={0.025}
              strokeWidth="0.5"
            />
          ))}

        {/* Vertical grid lines */}
        {Array.from({ length: 37 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 40}
            y1="0"
            x2={i * 40}
            y2="900"
            stroke={accentColor}
            strokeOpacity={gridOpacity * 0.8}
            strokeWidth="0.5"
            className="vg-grid-shimmer"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}

        {/* Connection lines */}
        {connectionLines.map((d, i) => (
          <path
            key={`cl${i}`}
            d={d}
            stroke="url(#line_grad)"
            strokeWidth="1"
            fill="none"
            strokeOpacity={variant === 'login' ? 0.18 : 0.12}
          />
        ))}

        {/* Arc / orbital curves */}
        {(variant === 'default' || variant === 'vision') && (
          <>
            <path
              d="M 0 600 Q 400 200 900 500 T 1440 300"
              stroke="url(#arc_grad)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 200 900 Q 700 400 1200 700"
              stroke="url(#arc_grad)"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 1440 100 Q 1000 400 700 200 T 0 500"
              stroke="url(#arc_grad)"
              strokeWidth="1"
              fill="none"
              opacity="0.35"
            />
          </>
        )}
        {variant === 'ai' && (
          <>
            <path
              d="M 0 400 Q 300 100 600 350 T 1200 200 T 1440 450"
              stroke="url(#arc_grad)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M 0 600 Q 500 300 900 550 T 1440 350"
              stroke="url(#arc_grad)"
              strokeWidth="1"
              fill="none"
              opacity="0.35"
            />
          </>
        )}

        {/* Glowing large nodes */}
        {glowNodes.map((n, i) => (
          <circle
            key={n.id}
            cx={n.cx}
            cy={n.cy}
            r={n.r * 3}
            fill={`url(#${n.id}_grad)`}
            className="vg-glow-pulse"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}
        {glowNodes.map((n, i) => (
          <circle
            key={n.id + '_core'}
            cx={n.cx}
            cy={n.cy}
            r={n.r * 0.5}
            fill={accentColor}
            opacity="0.45"
            className="vg-node-pulse-slow"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}

        {/* Small sharp nodes */}
        {smallNodes.map((n, i) => (
          <circle
            key={`sn${i}`}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={accentColor}
            opacity={n.op}
            className="vg-node-pulse"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}

        {/* Financial chart silhouette (default / vision only) */}
        {(variant === 'default' || variant === 'vision') && (
          <polyline
            points="80,700 200,640 320,660 440,580 560,600 680,520 800,490 920,430 1040,460 1160,380 1280,340 1400,290"
            stroke="url(#chart_grad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
        )}

        {/* Vision variant: scan-frame corner elements */}
        {showCorners && (
          <>
            {/* Top-left corner frame */}
            <g className="vg-scan-corner" style={{ color: '#00E5FF' }}>
              <line x1="40" y1="40" x2="90" y2="40" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <line x1="40" y1="40" x2="40" y2="90" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <circle cx="40" cy="40" r="3" fill="#00E5FF" fillOpacity="0.6" />
            </g>
            {/* Top-right corner frame */}
            <g className="vg-scan-corner" style={{ animationDelay: '0.75s' }}>
              <line x1="1400" y1="40" x2="1350" y2="40" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <line x1="1400" y1="40" x2="1400" y2="90" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <circle cx="1400" cy="40" r="3" fill="#00E5FF" fillOpacity="0.6" />
            </g>
            {/* Bottom-left corner frame */}
            <g className="vg-scan-corner" style={{ animationDelay: '1.5s' }}>
              <line x1="40" y1="860" x2="90" y2="860" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <line x1="40" y1="860" x2="40" y2="810" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <circle cx="40" cy="860" r="3" fill="#00E5FF" fillOpacity="0.6" />
            </g>
            {/* Bottom-right corner frame */}
            <g className="vg-scan-corner" style={{ animationDelay: '2.25s' }}>
              <line x1="1400" y1="860" x2="1350" y2="860" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <line x1="1400" y1="860" x2="1400" y2="810" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
              <circle cx="1400" cy="860" r="3" fill="#00E5FF" fillOpacity="0.6" />
            </g>
            {/* Scan line */}
            <line
              x1="40" y1="450" x2="1400" y2="450"
              stroke="#00E5FF"
              strokeWidth="0.5"
              strokeOpacity="0.12"
              strokeDasharray="8 4"
            />
          </>
        )}
      </svg>

      {/* Layered gradient overlays */}

      {/* Center depth: radial dark vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, #0D1424 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top-left: violet glow spot */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom-right: blue glow spot */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '55%',
          height: '55%',
          background:
            'radial-gradient(circle, rgba(79,140,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Vision: cyan top accent */}
      {variant === 'vision' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '30%',
            width: '40%',
            height: '30%',
            background:
              'radial-gradient(ellipse, rgba(0,229,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* AI: violet center accent */}
      {variant === 'ai' && (
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '60%',
            height: '60%',
            background:
              'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default VentureGrid;
