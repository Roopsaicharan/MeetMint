import React from 'react';

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

export default MMLogo;
