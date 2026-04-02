import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MMLogo from './MMLogo';
import './ProcessingScreen.css';

const ProcessingScreen = ({ fileName, projectName, dueDate, fileSize, duration, projectId, onComplete, onCancel }) => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);
    const [status, setStatus] = useState('uploading');
    const [eta, setEta] = useState('Calculating...');
    const [logLines, setLogLines] = useState([
        { time: '00:00', icon: '✓', message: `File uploaded successfully — ${fileName || 'project.mp4'}`, cls: 'ok' }
    ]);
    const canvasRef = useRef(null);
    const logEndRef = useRef(null);

    const steps = [
        { id: 1, icon: '📤', title: 'Upload Complete', sub: 'File received & validated' },
        { id: 2, icon: '🎵', title: 'Audio Extraction', sub: 'Audio track isolated' },
        { id: 3, icon: '🎙️', title: 'Transcription', sub: 'Converting speech to text' },
        { id: 4, icon: '👥', title: 'Speaker Detection', sub: 'Identifying participants' },
        { id: 5, icon: '🧠', title: 'AI Analysis', sub: 'Extracting insights & tasks' },
        { id: 6, icon: '📋', title: 'Report Generation', sub: 'Building your dashboard' }
    ];

    // Removing particles as they are now global

    // Polling Logic
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/projects/status?project_id=${projectId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProgress(data.progress || 0);
                    setCurrentStep(data.current_step || 1);
                    setStatus(data.status);
                    
                    if (data.eta_seconds > 0) {
                        const mins = Math.floor(data.eta_seconds / 60);
                        const secs = data.eta_seconds % 60;
                        setEta(`~${mins}m ${secs}s`);
                    } else if (data.status === 'done') {
                        setEta('Complete');
                    } else {
                        setEta('Calculating...');
                    }

                    if (data.status === 'done') {
                        setProgress(100);
                        // Auto-redirect instantly without waiting for user to click a button
                        setTimeout(() => onComplete(), 800); 
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [projectId]);

    // Simulated Logs
    useEffect(() => {
        const initialLogs = [
            { time: '00:02', icon: '✓', message: 'File integrity check passed', cls: 'ok' },
            { time: '00:04', icon: '✓', message: 'Audio track extracted (AAC, 256kbps)', cls: 'ok' },
            { time: '00:06', icon: '▶', message: 'Initializing Whisper transcription engine...', cls: 'proc' }
        ];

        if (currentStep > 1 && logLines.length === 1) {
            setLogLines(prev => [...prev, ...initialLogs]);
        }
        if (currentStep === 6 && !logLines.some(l => l.message.includes('Report generation'))) {
            setLogLines(prev => [...prev, { time: '01:14', icon: 'ℹ', message: '12 potential action items flagged', cls: 'info' }]);
        }
    }, [currentStep]);

    useEffect(() => {
        if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logLines]);

    return (
        <div className="processing-container-root">
            {/* Background */}
            <div className="processing-bg" style={{ display: 'none' }}></div>
            
            {/* removed local canvas */}

            {/* Nav */}
            <header className="dash-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="brand-header animate-nav">
                            <MMLogo className="header-logo" style={{ width: '32px', height: '32px' }} />
                            <h1 className="dash-logo" onClick={() => navigate('/')} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>MeetMint</h1>
                        </div>
                    </div>
                    <nav className="nav-links">
                        <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
                        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Meetings</a>
                        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Tasks</a>
                        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Team</a>
                        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Insights</a>
                    </nav>
                    <div className="dash-user">
                        <div className="search-box">
                            <input type="text" placeholder="Search..." />
                        </div>
                        <div className="user-avatar" style={{ border: 'none' }}>
                            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        </div>
                        <button className="dash-logout" onClick={onCancel}>Cancel</button>
                    </div>
                </div>
            </header>

            {/* Main Page */}
            <div className="processing-page">
                <div className="processing-panel">
                    
                    {/* File row */}
                    <div className="processing-file-row">
                        <div className="processing-file-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad)" strokeWidth="1.5">
                                <defs>
                                    <linearGradient id="iconGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6"/>
                                        <stop offset="100%" stopColor="#06b6d4"/>
                                    </linearGradient>
                                </defs>
                                <path d="M15 10l4.553-2.277A1 1 0 0121 8.677v6.646a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div className="processing-file-info">
                            <div className="processing-file-name">{fileName || 'project.mp4'}</div>
                            <div className="processing-file-meta">{projectName} &nbsp;·&nbsp; Due: {dueDate || 'TBD'} &nbsp;·&nbsp; {fileSize || '---'}</div>
                        </div>
                        <div className="processing-file-badge">⬤ &nbsp;Analyzing</div>
                    </div>

                    {/* Anim Area */}
                    <div className="processing-anim-area">
                        <div className="processing-rings">
                            <div className="processing-radar"><div className="processing-radar-sweep"></div></div>
                            <div className="processing-ring processing-ring-1"></div>
                            <div className="processing-ring processing-ring-2"></div>
                            <div className="processing-ring processing-ring-3"></div>
                            <div className="processing-ring processing-ring-4"></div>
                            <div className="processing-orb"><div className="processing-orb-inner"></div></div>
                        </div>
                        <div className="processing-status-title">
                            {steps[currentStep-1]?.title || 'Analyzing Meeting Content'}
                        </div>
                        <div className="processing-status-sub">
                            {steps[currentStep-1]?.sub || 'Our AI is transcribing speech, identifying speakers, and extracting key action items.'}
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="processing-steps">
                        {steps.map(step => {
                            const isDone = currentStep > step.id;
                            const isActive = currentStep === step.id;
                            const stateClass = isDone ? 'done' : (isActive ? 'active' : 'pending');
                            return (
                                <div key={step.id} className={`processing-step ${stateClass}`}>
                                    <div className="processing-step-icon">{step.icon}</div>
                                    <div className="processing-step-text">
                                        <div className="processing-step-name">{step.title}</div>
                                        <div className="processing-step-desc">{step.sub}</div>
                                    </div>
                                    <div className="processing-step-check">
                                        {isDone ? '✓' : (isActive ? '◌' : '')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress */}
                    <div className="processing-prog-wrap">
                        <div className="processing-prog-top">
                            <span className="processing-prog-label">Overall Progress</span>
                            <span className="processing-prog-pct">{progress}%</span>
                        </div>
                        <div className="processing-prog-track">
                            <div className="processing-prog-fill" style={{ width: `${progress}%` }}>
                                <div className="processing-prog-tip"></div>
                            </div>
                        </div>
                        <div className="processing-prog-eta">Estimated time remaining: {eta}</div>
                    </div>

                    {/* Logs */}
                    <div className="processing-log">
                        <div className="processing-log-content">
                            {logLines.map((log, idx) => (
                                <span key={idx} className="processing-log-line">
                                    <span className="ts">[{log.time}]</span> 
                                    <span className={log.cls}>{log.icon}</span> 
                                    {log.message}
                                </span>
                            ))}
                            <div ref={logEndRef} style={{height: 1}}></div>
                        </div>
                        <div className="processing-log-mask"></div>
                    </div>

                    <div className="processing-cancel-row">
                        <button className="processing-cancel-btn" onClick={onCancel}>Cancel Processing</button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProcessingScreen;
