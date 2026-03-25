import React from "react";

export default function WavesBackground({ className = "" }) {
  return (
    <div className={`waves-bg ${className}`} aria-hidden="true">
      {/* put base first so it stays behind the strands */}
      <div className="waves-base" />

      <svg
        className="waves-svg"
        viewBox="0 0 1200 700"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="strandA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="strandB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#1d4ed8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="strandC" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#2563eb" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0.65" />
          </linearGradient>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* main strand sets */}
        <g className="strand driftA" filter="url(#softGlow)">
          <path
            d="M-50,160 C140,80 320,240 520,160 C720,80 900,240 1250,140"
            fill="none"
            stroke="url(#strandA)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M-50,210 C180,120 300,300 560,210 C820,120 960,320 1250,190"
            fill="none"
            stroke="url(#strandB)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M-50,260 C220,160 360,340 600,260 C840,180 980,340 1250,240"
            fill="none"
            stroke="url(#strandC)"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>

        <g className="strand driftB" filter="url(#softGlow)">
          <path
            d="M-80,420 C180,320 360,520 620,420 C880,320 1020,520 1280,400"
            fill="none"
            stroke="url(#strandB)"
            strokeWidth="2.0"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M-80,470 C220,360 400,560 660,470 C920,380 1060,560 1280,450"
            fill="none"
            stroke="url(#strandA)"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M-80,520 C260,400 440,600 700,520 C960,440 1100,600 1280,500"
            fill="none"
            stroke="url(#strandC)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* thin "strand texture" lines */}
        <g className="strand-texture driftC" filter="url(#softGlow)">
          <path
            d="M-60,330 C160,250 320,410 560,330 C800,250 980,420 1260,310"
            fill="none"
            stroke="url(#strandA)"
            strokeWidth="1.05"
            strokeLinecap="round"
          />
          <path
            d="M-70,585 C220,510 380,650 650,585 C920,520 1060,650 1260,565"
            fill="none"
            stroke="url(#strandB)"
            strokeWidth="1.0"
            strokeLinecap="round"
          />
          <path
            d="M-40,120 C180,60 330,190 560,120 C790,60 980,210 1260,100"
            fill="none"
            stroke="url(#strandC)"
            strokeWidth="0.95"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}