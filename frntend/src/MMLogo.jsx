import React from 'react'

const MMLogo = ({ className }) => (
    <svg
        width="40"
        height="40"
        viewBox="0 0 512 512"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="mm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
        </defs>
        <path
            d="M64 448V128L256 320L448 128V448"
            stroke="url(#mm-grad)"
            strokeWidth="60"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M256 320V448"
            stroke="url(#mm-grad)"
            strokeWidth="60"
            strokeLinecap="round"
        />
    </svg>
);

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