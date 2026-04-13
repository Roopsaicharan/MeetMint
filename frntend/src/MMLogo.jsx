import React, { useId } from 'react';

const MMLogo = ({ className }) => {
    const uniqueId = useId();
    const idSuffix = uniqueId.replace(/:/g, '');
    const gradId = `mm-grad-${idSuffix}`;

    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 512 512"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent, #3b82f6)" />
                    <stop offset="100%" stopColor="var(--accent-lt, #60a5fa)" />
                </linearGradient>
            </defs>
            <g strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path
                    d="M64 448V128L256 320L448 128V448"
                    stroke={`url(#${gradId})`}
                    style={{ stroke: `url(#${gradId})`, strokeLinecap: 'round' }}
                />
                <path
                    d="M256 320V448"
                    stroke={`url(#${gradId})`}
                    style={{ stroke: `url(#${gradId})`, strokeLinecap: 'round' }}
                />
            </g>
        </svg>
    );
};

export default MMLogo;
