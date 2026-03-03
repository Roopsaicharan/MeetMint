import React from 'react'

const MMLogo = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 80 80"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      {/* animated gradient */}
      <linearGradient id="mintGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8">
          <animate
            attributeName="stop-color"
            values="#38bdf8;#2563eb;#a855f7;#38bdf8"
            dur="8s"
            repeatCount="indefinite"
          />
        </stop>
        <stop offset="100%" stopColor="#a855f7">
          <animate
            attributeName="stop-color"
            values="#a855f7;#38bdf8;#2563eb;#a855f7"
            dur="8s"
            repeatCount="indefinite"
          />
        </stop>
      </linearGradient>

      {/* soft glow around circle */}
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Outer circle base */}
    <circle
      cx="40"
      cy="40"
      r="34"
      fill="rgba(255,255,255,0.06)"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="1.5"
    />

    {/* Glow ring (behind) */}
    <circle
      cx="40"
      cy="40"
      r="34"
      fill="none"
      stroke="url(#mintGradient)"
      strokeWidth="3"
      opacity="0.35"
      filter="url(#softGlow)"
    />

    {/* crisp gradient ring (front, subtle) */}
    <circle
      cx="40"
      cy="40"
      r="34"
      fill="none"
      stroke="url(#mintGradient)"
      strokeWidth="1.6"
      opacity="0.22"
    />

    {/* animated wave */}
    <path
      d="M10 42 Q 25 32 40 42 T 70 42"
      stroke="url(#mintGradient)"
      strokeWidth="2.2"
      fill="none"
      opacity="0.65"
    >
      <animate
        attributeName="d"
        dur="6s"
        repeatCount="indefinite"
        values="
          M10 42 Q 25 32 40 42 T 70 42;
          M10 42 Q 25 52 40 42 T 70 42;
          M10 42 Q 25 32 40 42 T 70 42
        "
      />
    </path>

    {/* M letter with soft entrance animation */}
    <path
      d="M26 52 V28 L40 44 L54 28 V52"
      fill="none"
      stroke="url(#mintGradient)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="120"
      strokeDashoffset="120"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="120"
        to="0"
        dur="1.4s"
        fill="freeze"
      />
    </path>
  </svg>
)

export default MMLogo