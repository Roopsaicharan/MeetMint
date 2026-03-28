import { useState, useRef, useEffect, memo } from 'react'
import MMLogo from './MMLogo'
import './index.css'
import { useNavigate, useLocation } from 'react-router-dom';
import ProcessingScreen from './ProcessingScreen';

const TiltCard = memo(({ children, className, onClick, style, delay = 0 }) => {
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;

        const r = card.getBoundingClientRect();
        const cx = e.clientX - r.left;
        const cy = e.clientY - r.top;

        const rotateX = ((cy - r.height / 2) / (r.height / 2)) * -7;
        const rotateY = ((cx - r.width / 2) / (r.width / 2)) * 9;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.025)`;
        card.style.setProperty('--cx', (cx / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--cy', (cy / r.height * 100).toFixed(1) + '%');
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        setTimeout(() => { if (card) card.style.transition = ''; }, 550);
    };

    const handleMouseEnter = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transition = 'transform .15s ease';
    };

    return (
        <div
            ref={cardRef}
            className={`${className} pc ${isVisible ? 'on-stage' : 'off-stage'}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={style}
        >
            <div className="pc-line"></div>
            <div className="pc-corner"></div>
            {children}
        </div>
    );
});

const ALL_MEMBERS = [
    { id: 1, initials: 'AK', name: 'Alex Kim', role: 'Project Lead', color: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' },
    { id: 2, initials: 'ML', name: 'Maria Lopez', role: 'UI Designer', color: 'linear-gradient(135deg,#22c55e,#4ade80)' },
    { id: 3, initials: 'JR', name: 'James Reed', role: 'Frontend Dev', color: 'linear-gradient(135deg,#a855f7,#c084fc)' },
    { id: 4, initials: 'NP', name: 'Nina Patel', role: 'QA Engineer', color: 'linear-gradient(135deg,#f59e0b,#fcd34d)' },
    { id: 5, initials: 'SR', name: 'Sara Ruiz', role: 'iOS Developer', color: 'linear-gradient(135deg,#ec4899,#f9a8d4)' },
    { id: 6, initials: 'TC', name: 'Tom Chen', role: 'Android Dev', color: 'linear-gradient(135deg,#06b6d4,#67e8f9)' },
    { id: 7, initials: 'BW', name: 'Ben Walsh', role: 'Backend Dev', color: 'linear-gradient(135deg,#6366f1,#a5b4fc)' },
];

const STATUS_COLORS = {
    online: '#22c55e',
    away: '#f59e0b',
    offline: 'rgba(255,255,255,0.2)',
};

const AddMemberPanel = ({ project, onAdd, onClose, anchorRect, centered = false }) => {
    const [q, setQ] = useState('');
    const [filtered, setFiltered] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState('');

    useEffect(() => {
        if (q.length < 2) {
            setFiltered([]);
            return;
        }
        const delayDebounce = setTimeout(async () => {
            try {
                const resp = await fetch(`http://localhost:5000/api/users/search?q=${q}`);
                const data = await resp.json();
                // Filter out already added members if needed, but for now show all search results
                setFiltered(data.users || []);
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [q]);

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setLoading(true);
        try {
            const resp = await fetch('http://localhost:5000/api/projects/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id.toString(), email: inviteEmail })
            });
            const data = await resp.json();
            setInviteMessage(data.message);
            setInviteEmail('');
            setTimeout(() => setInviteMessage(''), 3000);
        } catch (err) {
            console.error("Invite error:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyJoinLink = () => {
        const link = `${window.location.origin}?join_project=${project.id}`;
        navigator.clipboard.writeText(link);
        setInviteMessage("Join link copied!");
        setTimeout(() => setInviteMessage(''), 3000);
    };

    const panelStyle = centered ? {} : {
        position: 'fixed',
        top: `${anchorRect?.bottom + 8}px`,
        left: `${anchorRect?.left - 180}px`,
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.add-member-panel')) onClose();
        };
        setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [onClose]);

    return (
        <div className={`add-member-panel open ${centered ? 'centered-pop' : ''}`} style={panelStyle} onClick={(e) => e.stopPropagation()}>
            <div className="amp-header">
                <span className="amp-title">Add Team Member</span>
                <button className="amp-close" onClick={onClose}>✕</button>
            </div>

            <div className="amp-section-label">Manual Search & Assign</div>
            <div className="amp-search-wrap">
                <input
                    className="amp-search"
                    placeholder="Search name or email…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="amp-list">
                {q.length > 0 && q.length < 2 && <div className="amp-empty">Type at least 2 characters…</div>}
                {q.length >= 2 && filtered.length === 0 && <div className="amp-empty">No users found</div>}
                {filtered.map(m => (
                    <div key={m.id} className="amp-item">
                        <div className="amp-av" style={{ background: 'var(--accent-dim)', color: 'var(--accent-lt)', border: '1px solid var(--accent-rim)' }}>
                            {(m.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="amp-info">
                            <span className="amp-name">{m.name}</span>
                            <span className="amp-role">{m.email}</span>
                        </div>
                        <button className="amp-add" onClick={() => onAdd(m)}>Add</button>
                    </div>
                ))}
            </div>

            <div className="amp-divider"></div>

            <div className="amp-section-label">Email Invite</div>
            <div className="amp-invite-wrap" style={{ display: 'flex', gap: '8px', padding: '0 12px 12px' }}>
                <input
                    className="glass-text-input amp-search"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button
                    className="dash-logout"
                    style={{ padding: '8px 15px', fontSize: '0.85rem' }}
                    onClick={handleInvite}
                    disabled={loading}
                >
                    {loading ? '...' : 'Invite'}
                </button>
            </div>

            <button
                className="amp-join-btn"
                style={{
                    width: 'calc(100% - 24px)',
                    margin: '0 12px 12px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'var(--accent-dim)',
                    color: 'var(--accent-lt)',
                    border: '1px solid var(--accent-rim)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}
                onClick={copyJoinLink}
            >
                🔗 Copy Shareable Join Link
            </button>

            {inviteMessage && (
                <div style={{ textAlign: 'center', color: 'var(--accent-lt)', fontSize: '0.75rem', paddingBottom: '12px' }}>
                    {inviteMessage}
                </div>
            )}
        </div>
    );
};

const MemberStack = ({ project, onAddMember, showAdd = true, centered = false }) => {
    const [panelAnchor, setPanelAnchor] = useState(null);
    const members = project.membersList || [];
    const MAX_VISIBLE = 4;
    const visible = members.slice(0, MAX_VISIBLE);
    const overflow = members.length - MAX_VISIBLE;

    return (
        <div className="member-stack">
            <div className="av-stack">
                {visible.map((m) => (
                    <div key={m.id} className="av-wrap">
                        <div className="av" style={{ background: m.color }}>
                            {m.initials}
                            <span className="av-presence" style={{ background: STATUS_COLORS[m.status] }}></span>
                        </div>
                        <div className="av-tooltip">
                            <div className="av-tooltip-avatar" style={{ background: m.color }}>{m.initials}</div>
                            <div className="av-tooltip-info">
                                <span className="av-tooltip-name">{m.name}</span>
                                <span className="av-tooltip-role">{m.role}</span>
                                <span className={`av-tooltip-status ${m.status}`}>● {m.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {overflow > 0 && <div className="av-extra">+{overflow}</div>}
            </div>
            {showAdd && (
                <button
                    className="av-add-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPanelAnchor(rect);
                    }}
                >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            )}
            {showAdd && panelAnchor && (
                <AddMemberPanel
                    project={project}
                    anchorRect={panelAnchor}
                    onClose={() => setPanelAnchor(null)}
                    onAdd={(m) => {
                        onAddMember(project.id, m);
                        setPanelAnchor(null);
                    }}
                    centered={centered}
                />
            )}
        </div>
    );
};

function Dashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    // View State: 'home' | 'create' | 'project'
    const [view, setView] = useState('home')
    const [currentTab, setCurrentTab] = useState('dashboard')
    const [activeProject, setActiveProject] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Processing Screen States
    // Removed showProcessing states as we now use a dedicated /processing route

    // Project Data State (initially empty, fetched from backend)
    const [projects, setProjects] = useState([]);

    // Helper: transform raw backend member data into display format for MemberStack
    const MEMBER_COLORS = [
        'linear-gradient(135deg,#1e3a8a,#3b82f6)',
        'linear-gradient(135deg,#22c55e,#4ade80)',
        'linear-gradient(135deg,#a855f7,#c084fc)',
        'linear-gradient(135deg,#f59e0b,#fcd34d)',
        'linear-gradient(135deg,#ec4899,#f9a8d4)',
        'linear-gradient(135deg,#06b6d4,#67e8f9)',
        'linear-gradient(135deg,#6366f1,#a5b4fc)',
    ];

    const formatMember = (m, index) => {
        const displayName = m.name || m.email || 'User';
        const nameParts = displayName.trim().split(/\s+/);
        const initials = nameParts.length >= 2 && nameParts[0] && nameParts[nameParts.length - 1]
            ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
            : displayName.substring(0, 2).toUpperCase() || '??';
        return {
            id: m.id,
            name: displayName,
            email: m.email,
            initials: initials,
            color: MEMBER_COLORS[index % MEMBER_COLORS.length],
            status: 'online',
            role: 'Member'
        };
    };

    const [allUsers, setAllUsers] = useState([]);

    // Fetch All Users for Team Directory
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const resp = await fetch('http://localhost:5000/api/users/search?q=');
                const data = await resp.json();
                setAllUsers((data.users || []).map((u, i) => formatMember(u, i)));
            } catch (err) {
                console.error("Fetch users error:", err);
            }
        };
        fetchUsers();
    }, []);

    // Fetch Projects on Load (filtered by current user's membership)
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const url = user && user.id
                    ? `http://localhost:5000/api/projects?user_id=${user.id}`
                    : 'http://localhost:5000/api/projects';
                const resp = await fetch(url);
                if (resp.ok) {
                    const data = await resp.json();
                    // Transform membersList for each project to include display props
                    const transformed = (data || []).map(p => ({
                        ...p,
                        membersList: (p.membersList || []).map((m, i) => formatMember(m, i)),
                        members: (p.membersList || []).length || 1
                    }));
                    setProjects(transformed);
                }
            } catch (err) {
                console.error("Fetch projects error:", err);
            }
        };
        fetchProjects();
    }, [user]);
    
    // Auto-open project if returned from ProcessingPage
    useEffect(() => {
        if (location.state?.openProjectId) {
            const pid = location.state.openProjectId;
            const pTitle = location.state.projectName || "Analyzed Project";
            
            // Clean up state so we don't auto-open it again if we navigate back and forth
            navigate(location.pathname, { replace: true, state: {} });
            
            // Open the new project directly with fallback status to prevent crashes
            openProject({ id: pid, name: pTitle, status: 'Active' });
        }
    }, [location.state, navigate, location.pathname]);

    // 3. User UUID Validation: Ensure session is valid for backend operations
    useEffect(() => {
        if (user && user.id && user.id.toString().length !== 36) {
            alert("Your account session is using an older format (Legacy ID). Please sign out and log back in to enable all features.");
        }
    }, [user]);

    const handleAddMember = async (projectId, member) => {
        // Validation: Ensure we are using a real UUID, not a timestamp
        if (projectId.toString().length !== 36) {
            alert("This project has an invalid ID (Legacy ID). Please create a new project to add team members.");
            return;
        }

        // Guard: Check if this member is already in the project (prevents duplicates)
        const project = projects.find(p => p.id === projectId);
        if (project && project.membersList && project.membersList.some(m => m.id === member.id)) {
            alert(`${member.name} is already a member of this project!`);
            return;
        }

        try {
            const resp = await fetch('http://localhost:5000/api/projects/members/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId.toString(),
                    user_id: member.id,
                    role: 'member'
                })
            });

            if (resp.ok) {
                setProjects(prev => prev.map(p => {
                    if (p.id === projectId) {
                        return {
                            ...p,
                            membersList: [...(p.membersList || []), {
                                id: member.id,
                                name: member.name,
                                initials: (member.name || 'U').charAt(0).toUpperCase(),
                                status: 'online',
                                color: 'var(--accent-dim)'
                            }]
                        };
                    }
                    return p;
                }));
            }
        } catch (err) {
            console.error("Add member error:", err);
        }
    };

    const [newProjectName, setNewProjectName] = useState('')

    const renderNav = () => {
        const tabs = [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'meetings', label: 'Meetings' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'team', label: 'Team' },
            { id: 'insights', label: 'Insights' }
        ];

        return (
            <nav className="nav-links">
                {tabs.map(tab => (
                    <a
                        key={tab.id}
                        href="#"
                        className={`nav-link ${currentTab === tab.id ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrentTab(tab.id);
                            setView('home');
                        }}
                    >
                        {tab.label}
                    </a>
                ))}
            </nav>
        );
    };
    const [newProjectDate, setNewProjectDate] = useState('')
    const [videoFile, setVideoFile] = useState(null)
    const [loadingVideo, setLoadingVideo] = useState(false)

    // Active Project Feature State
    const [notes, setNotes] = useState('')
    const [summary, setSummary] = useState(null)
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState(null)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [loadingAnswer, setLoadingAnswer] = useState(false)
    const [chatHistory, setChatHistory] = useState([]) // New state for chat bubbles

    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedProjects, setSelectedProjects] = useState(new Set())
    const chatEndRef = useRef(null) // Scroll anchor

    // Handle Join Project Link
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const joinId = params.get('join_project');
        if (joinId && user) {
            const handleJoin = async () => {
                try {
                    const resp = await fetch('http://localhost:5000/api/projects/members/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            project_id: joinId,
                            user_id: user.id || user.email, // Fallback if ID is not available
                            role: 'member'
                        })
                    });
                    if (resp.ok) {
                        alert("Successfully joined the project!");
                        // Remove param from URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                        // Refresh projects if needed
                    }
                } catch (err) {
                    console.error("Join error:", err);
                }
            };
            handleJoin();
        }
    }, [user]);

    // Auto-scroll chat history
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatHistory, loadingAnswer])

    // Helper to calculate days left
    const calculateDaysLeft = (dateString) => {
        const target = new Date(dateString);
        const today = new Date();
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    const filteredProjects = projects.filter(p =>
        (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    const handleVideoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0])
        }
    }

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode)
        setSelectedProjects(new Set())
    }

    const toggleProjectSelection = (id) => {
        const newSelection = new Set(selectedProjects)
        if (newSelection.has(id)) {
            newSelection.delete(id)
        } else {
            newSelection.add(id)
        }
        setSelectedProjects(newSelection)
    }

    const handleSelectAll = () => {
        if (selectedProjects.size === filteredProjects.length) {
            setSelectedProjects(new Set())
        } else {
            setSelectedProjects(new Set(filteredProjects.map(p => p.id)))
        }
    }

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Delete ${selectedProjects.size} project(s)? This cannot be undone.`)) return;

        const idsToDelete = [...selectedProjects];
        const failed = [];

        for (const id of idsToDelete) {
            try {
                const resp = await fetch(`http://localhost:5000/api/projects/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ project_id: id }),
                });
                if (!resp.ok) {
                    failed.push(id);
                    console.error(`Failed to delete project ${id}:`, resp.statusText);
                }
            } catch (err) {
                failed.push(id);
                console.error(`Error deleting project ${id}:`, err);
            }
        }

        // Only remove successfully deleted projects from local state
        const deletedIds = new Set(idsToDelete.filter(id => !failed.includes(id)));
        setProjects(prev => prev.filter(p => !deletedIds.has(p.id)));
        setSelectionMode(false);
        setSelectedProjects(new Set());
        if (activeProject && deletedIds.has(activeProject.id)) {
            setActiveProject(null);
            setView('dashboard');
        }
        if (failed.length > 0) {
            alert(`${failed.length} project(s) could not be deleted. Check the backend logs.`);
        }
    }

    const handleCreateProject = async () => {
        if (!videoFile || !newProjectName || !newProjectDate) return;

        setLoadingVideo(true);
        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("project_name", newProjectName);
        formData.append("due_date", newProjectDate);
        if (user && user.id) {
            formData.append("user_id", user.id);
        }

        try {
            // 1. Upload Video
            const response = await fetch("http://localhost:5000/api/upload-video", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                let errorMsg = `Upload failed: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) errorMsg = errorData.message;
                } catch (e) {
                    console.error("Could not parse error response", e);
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();

            // Navigate to separate Processing Page!
            navigate('/processing/' + data.id, {
                state: {
                    projectName: newProjectName,
                    dueDate: newProjectDate,
                    fileName: videoFile.name,
                    fileSize: (videoFile.size / (1024 * 1024)).toFixed(1) + " MB"
                }
            });

            // Reset Form modal
            setNewProjectName('');
            setNewProjectDate('');
            setVideoFile(null);
            if (view === 'create') setView('home');

        } catch (error) {
            console.error("Error creating project:", error);
            alert(error.message || "Failed to create project. Is the backend running?");
        } finally {
            setLoadingVideo(false);
        }
    };

    const openProject = async (project) => {
        setActiveProject(project);
        setNotes(project.notes || '');
        setSummary(project.summary || null);
        setAnswer(null);
        setChatHistory([]); // Reset chat history when switching projects
        setView('project');

        // Fetch full project details (transcript/notes, tasks, members) from backend
        if (project.id && project.id.length === 36) {
            try {
                const resp = await fetch(`http://localhost:5000/api/project-details?project_id=${project.id}`);
                if (resp.ok) {
                    const details = await resp.json();
                    
                    // The transcript is stored in the meetings list (latest first)
                    if (details.meetings && details.meetings.length > 0) {
                        const latestMeeting = details.meetings[0];
                        // Field from Go backend is Case-Sensitive (since no JSON tags in MeetingRow struct)
                        const transcript = latestMeeting.TranscriptText || latestMeeting.transcript_text || "";
                        setNotes(transcript);
                        
                        // If we have a summary from this meeting, load it too
                        if (latestMeeting.SummaryText || latestMeeting.summary_text) {
                            setSummary({
                                summary: latestMeeting.SummaryText || latestMeeting.summary_text,
                                decisions: [], // Future optimization
                                action_items: details.tasks || []
                            });
                        }
                    }
                    
                    // Update the project's membersList with fresh data
                    if (details.members && details.members.length > 0) {
                        const updatedProject = {
                            ...project,
                            membersList: details.members.map((m, i) => formatMember(m, i))
                        };
                        setActiveProject(updatedProject);
                    }
                }
            } catch (err) {
                console.error("Fetch project details error:", err);
            }
        }
    }

    const calculateProjectProgress = (summaryData) => {
        if (!summaryData || !summaryData.action_items || summaryData.action_items.length === 0) return 0;
        const total = summaryData.action_items.length;
        const completed = summaryData.action_items.filter(item => item.status === 'done').length;
        return Math.round((completed / total) * 100);
    }

    const calculateProjectMembers = (summaryData) => {
        if (!summaryData || !summaryData.action_items || summaryData.action_items.length === 0) return 1;
        const owners = new Set(summaryData.action_items.map(item => item.owner));
        return owners.size;
    }

    const getProjectStatusTerm = (project) => {
        if (!project.summary || !project.summary.action_items || project.summary.action_items.length === 0) return 'TODO';
        const items = project.summary.action_items;
        if (items.some(i => i.status === 'blocked')) return 'BLOCKED';
        if (project.progress === 100) return 'DONE';
        if (project.progress > 0) return 'IN PROGRESS';
        return 'TODO';
    }

    const updateTaskStatus = async (taskIndex, newStatus) => {
        if (!activeProject || !summary || !user) return;

        const task = summary.action_items[taskIndex];
        if (!task.id) {
            console.error("Internal Error: Task has no ID");
            return;
        }

        try {
            // 1. Call Backend to update status with security check
            const response = await fetch("http://localhost:5000/api/tasks/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task_id: task.id,
                    user_id: user.id,
                    status: newStatus
                })
            });

            if (response.status === 403) {
                alert("Forbidden: Only the task owner can change this status.");
                return;
            }

            if (!response.ok) {
                throw new Error(`Update failed: ${response.statusText}`);
            }

            // 2. Update Local State only if backend accepts
            const updatedActionItems = summary.action_items.map((item, index) =>
                index === taskIndex ? { ...item, status: newStatus } : item
            );

            const updatedSummary = { ...summary, action_items: updatedActionItems };
            const newProgress = calculateProjectProgress(updatedSummary);
            const newMembers = calculateProjectMembers(updatedSummary);

            setSummary(updatedSummary);
            setProjects(projects.map(p =>
                p.id === activeProject.id ? {
                    ...p,
                    summary: updatedSummary,
                    progress: newProgress,
                    members: newMembers
                } : p
            ));
        } catch (error) {
            console.error("Error updating task status:", error);
            alert("Failed to update task. Is the backend running?");
        }
    }

    const updateProjectNotes = (id, newNotes) => {
        setProjects(projects.map(p =>
            p.id === id ? { ...p, notes: newNotes } : p
        ));
    }

    const generateSummary = async () => {
        if (!notes) return;
        setLoadingSummary(true)
        try {
            const response = await fetch(`http://localhost:5000/api/summary?user_id=${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes })
            });
            const data = await response.json();

            // Add default 'todo' status to all new action items
            const dataWithStatus = {
                ...data,
                action_items: data.action_items.map(item => ({ ...item, status: 'todo' }))
            };

            setSummary(dataWithStatus);

            const newProgress = calculateProjectProgress(dataWithStatus);
            const newMembers = calculateProjectMembers(dataWithStatus);

            setProjects(projects.map(p =>
                p.id === activeProject.id ? {
                    ...p,
                    summary: dataWithStatus,
                    progress: newProgress,
                    members: newMembers
                } : p
            ));

        } catch (error) {
            console.error("Error generating summary:", error);
            alert("Failed to generate summary. Is the backend running?");
        } finally {
            setLoadingSummary(false)
        }
    }

    const askQuestion = async () => {
        if (!question) return;

        // Push user question to chat history
        const userMessage = { role: 'user', text: question };
        setChatHistory(prev => [...prev, userMessage]);
        const currentQuestion = question;
        setQuestion('');
        setLoadingAnswer(true);

        try {
            const response = await fetch("http://localhost:5000/api/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: currentQuestion })
            });
            const data = await response.json();

            // Push AI response to chat history
            setChatHistory(prev => [...prev, {
                role: 'ai',
                text: data.answer,
                citation: data.citation
            }]);
            setAnswer(data);
        } catch (error) {
            console.error("Error asking question:", error);
            setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't connect to the backend." }]);
        } finally {
            setLoadingAnswer(false);
        }
    }

    // --- RENDER: CREATE PROJECT VIEW ---
    if (view === 'create') {
        return (
            <div className="dash-wrapper">
                <div className="dash-container">
                    <header className="dash-header">
                        <div className="header-content">
                            <div className="logo-section">
                                <div className="brand-header animate-nav">
                                    <MMLogo className="header-logo" style={{ width: '32px', height: '32px' }} />
                                    <h1 className="dash-logo" onClick={() => setView('home')} style={{ fontSize: '1.5rem' }}>MeetMint</h1>
                                </div>
                            </div>
                            <nav className="nav-links">
                                <a href="#" className="nav-link active">Dashboard</a>
                                <a href="#" className="nav-link">Meetings</a>
                                <a href="#" className="nav-link">Tasks</a>
                                <a href="#" className="nav-link">Team</a>
                                <a href="#" className="nav-link">Insights</a>
                            </nav>
                            <div className="dash-user">
                                <div className="search-box">
                                    <input type="text" placeholder="Search..." />
                                </div>
                                <div className="user-avatar">R</div>
                                <button className="glass-btn-secondary" onClick={() => setView('home')}>Cancel</button>
                            </div>
                        </div>
                    </header>

                    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
                        <section className="glass-section">
                            <div className="section-header">
                                <h3>Start New Project</h3>
                            </div>
                            <div className="dash-input-group" style={{ marginBottom: '20px' }}>
                                <label className="glass-label">Project Name</label>
                                <input
                                    type="text"
                                    className="glass-text-input"
                                    placeholder="e.g. Sprint 2 Review"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                />
                            </div>

                            <div className="dash-input-group" style={{ marginBottom: '20px' }}>
                                <label className="glass-label">Due Date (for tracking)</label>
                                <input
                                    type="date"
                                    className="glass-text-input"
                                    value={newProjectDate}
                                    onChange={(e) => setNewProjectDate(e.target.value)}
                                />
                            </div>

                            <div className="dash-input-group" style={{ marginBottom: '20px' }}>
                                <label className="glass-label">Upload Meeting Video</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    className="dash-file-input"
                                />
                            </div>

                            <button
                                onClick={handleCreateProject}
                                disabled={loadingVideo || !videoFile || !newProjectName || !newProjectDate}
                                className="glass-btn-action"
                                style={{ width: '100%' }}
                            >
                                {loadingVideo ? 'Processing & Analyzing...' : 'Create Project'}
                            </button>
                        </section>
                    </main>
                </div>
            </div>
        )
    }

    // --- RENDER: PROJECT DETAILS VIEW ---
    if (view === 'project' && activeProject) {
        return (
            <div className="dash-wrapper">
                <div className="dash-container">
                    <header className="dash-header">
                        <div className="header-content">
                            <div className="logo-section">
                                <div className="brand-header animate-nav">
                                    <MMLogo className="header-logo" style={{ width: '32px', height: '32px' }} />
                                    <h1 className="dash-logo" onClick={() => { setView('home'); setCurrentTab('dashboard'); }} style={{ fontSize: '1.5rem' }}>MeetMint</h1>
                                </div>
                            </div>
                            {renderNav()}
                            <div className="dash-user">
                                <div className="search-box">
                                    <input type="text" placeholder="Search..." />
                                </div>
                                <div className="user-avatar" style={{ border: 'none' }}>
                                    <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                </div>
                                <button className="dash-logout" onClick={onLogout}>Sign Out</button>
                            </div>
                        </div>
                    </header>

                    <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 3rem' }}>
                        {/* Project Context Bar */}
                        <div className="project-context-bar" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: '2.5rem',
                            padding: '0 1rem'
                        }}>
                            <div>
                                <h2 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '2.4rem',
                                    fontWeight: 600,
                                    color: '#fff',
                                    marginBottom: '8px'
                                }}>
                                    {activeProject.name}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.6, fontSize: '0.95rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📅</span>
                                        <span>Due: {activeProject.dueDate || 'No date set'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>👥</span>
                                        <span>{(activeProject.membersList || []).length} Members</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`capsule-badge ${(activeProject.status || 'Active').toLowerCase()}`} style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
                                {activeProject.status || 'Active'}
                            </div>
                        </div>

                        <div className="details-side-layout">
                            {/* Left Column: Notes & Chat Area */}
                            <div className="details-left">
                                <section className="glass-section" style={{ minHeight: '520px' }}>
                                    <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                                        <h3 className="animate-head" style={{ fontSize: '1.3rem', fontWeight: 600 }}>Meeting Notes</h3>
                                        <div style={{ display: 'flex', gap: '12px', opacity: 0.5 }}>
                                            <span>B</span><span>I</span><span>U</span><span>≡</span><span>🔗</span>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="15"
                                            className="glass-textarea"
                                            placeholder="Meeting transcript will appear here..."
                                            style={{
                                                minHeight: '400px',
                                                backgroundColor: 'rgba(0,0,0,0.15)',
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                padding: '1.5rem',
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                        <button
                                            onClick={generateSummary}
                                            disabled={loadingSummary || !notes}
                                            className="glass-btn-action"
                                            style={{
                                                width: '100%',
                                                marginTop: '1.5rem',
                                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                                border: 'none',
                                                padding: '0.85rem'
                                            }}
                                        >
                                            {loadingSummary ? 'Magic working...' : 'Update Insights'}
                                        </button>
                                    </div>
                                </section>

                                <section className="glass-section" style={{ minHeight: '450px', background: 'rgba(30, 41, 59, 0.15)' }}>
                                    <div className="section-header">
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>AI Q&A</h3>
                                    </div>

                                    <div className="chat-container">
                                        <div className="chat-history" style={{ padding: '1rem' }}>
                                            {chatHistory.length === 0 ? (
                                                <div style={{ opacity: 0.4, textAlign: 'center', marginTop: '4rem', fontSize: '0.95rem' }}>
                                                    Ask about the roadmap, owners, or blockers...
                                                </div>
                                            ) : (
                                                chatHistory.map((msg, i) => (
                                                    <div key={i} className={`chat-bubble bubble-${msg.role}`} style={{
                                                        fontSize: '0.9rem',
                                                        background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                                                        borderRadius: '14px',
                                                        padding: '1rem',
                                                        marginBottom: '1rem'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                            <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem', border: 'none' }}>
                                                                {msg.role === 'user' ? 'U' : 'AI'}
                                                            </div>
                                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.7 }}>
                                                                {msg.role === 'user' ? 'You' : 'MeetMint Bot'}
                                                            </span>
                                                        </div>
                                                        {msg.text}
                                                        {msg.citation && (
                                                            <div className="bubble-citation" style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                                                Source: {msg.citation}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                            {loadingAnswer && (
                                                <div className="chat-bubble bubble-ai" style={{ opacity: 0.7, padding: '1rem' }}>
                                                    Thinking...
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>

                                        <div className="chat-input-area" style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ position: 'relative', width: '100%' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Ask a question..."
                                                    value={question}
                                                    onChange={(e) => setQuestion(e.target.value)}
                                                    className="glass-text-input"
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.9rem 1.25rem',
                                                        paddingRight: '3.5rem',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}
                                                    onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                                                    disabled={loadingAnswer}
                                                />
                                                <button
                                                    onClick={askQuestion}
                                                    className="send-icon"
                                                    disabled={loadingAnswer || !question}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'rgba(59, 130, 246, 0.3)',
                                                        border: 'none',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    ➤
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: AI Insights & Tasks */}
                            <div className="details-right">
                                {(summary || activeProject.summary) ? (
                                    <section className="glass-section" style={{ minHeight: '1000px' }}>
                                        <div className="section-header" style={{ marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.4rem' }}>✦</span>
                                                <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>AI Insight Summary</h3>
                                            </div>
                                        </div>

                                        <div className="summary-card" style={{
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            background: 'rgba(96, 165, 250, 0.03)',
                                            borderLeft: '4px solid #3b82f6',
                                            marginBottom: '2.5rem'
                                        }}>
                                            <p style={{ fontSize: '1rem', opacity: 0.9, lineHeight: '1.8' }}>
                                                {summary ? summary.summary : activeProject.summary.summary}
                                            </p>
                                        </div>

                                        <div className="tasks-container">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Action Items</h3>
                                                    <div className="vertical-divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                                                    <div style={{ position: 'relative' }}>
                                                        <MemberStack project={activeProject} onAddMember={handleAddMember} showAdd={true} centered={true} />
                                                    </div>
                                                </div>
                                                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>{(summary ? summary.action_items : activeProject.summary.action_items).length} total</div>
                                            </div>

                                            <div className="glass-task-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                {(summary ? summary.action_items : activeProject.summary.action_items).map((t, i) => (
                                                    <div key={i} className={`ultra-card ${t.owner_id !== user.id ? 'read-only' : ''}`} style={{
                                                        padding: '1.25rem 1.5rem',
                                                        background: 'rgba(255,255,255,0.02)'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{t.title}</span>
                                                                    {t.owner_id !== user.id && <span title="Read Only" style={{ fontSize: '0.85rem', opacity: 0.5 }}>🔒</span>}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <div className="user-avatar" style={{ width: '22px', height: '22px', fontSize: '0.7rem', border: 'none' }}>
                                                                            {(t.owner || 'U').charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{t.owner || 'Unassigned'}</span>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.85rem', opacity: 0.4 }}>•</span>
                                                                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Due: {t.due}</span>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                                                <span className={`capsule-badge ${t.status || 'todo'}`} style={{ padding: '0.25rem 0.8rem' }}>
                                                                    {t.status || 'todo'}
                                                                </span>
                                                                <select
                                                                    className="task-status-select"
                                                                    value={t.status || 'todo'}
                                                                    onChange={(e) => updateTaskStatus(i, e.target.value)}
                                                                    disabled={t.owner_id !== user.id}
                                                                    style={{
                                                                        background: 'rgba(255,255,255,0.08)',
                                                                        border: 'none',
                                                                        fontSize: '0.75rem',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '6px'
                                                                    }}
                                                                >
                                                                    <option value="todo">TODO</option>
                                                                    <option value="inprogress">DOING</option>
                                                                    <option value="done">DONE</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                ) : (
                                    <div className="glass-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', opacity: 0.5 }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.4))' }}>🔍</div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Upload a video or add notes to get AI insights</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    const handleDeleteProject = (id) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            setProjects(projects.filter(p => p.id !== id));
        }
    }

    // --- RENDER: HOME (PROJECT LIST) VIEW ---
    return (
        <div className="dash-wrapper">
            <div className="dash-container">
                <header className="dash-header">
                    <div className="header-content">
                        <div className="logo-section">
                            <div className="brand-header animate-nav">
                                <MMLogo className="header-logo" style={{ width: '32px', height: '32px' }} />
                                <h1 className="dash-logo" onClick={() => { setView('home'); setCurrentTab('dashboard'); }} style={{ fontSize: '1.5rem' }}>MeetMint</h1>
                            </div>
                        </div>
                        {renderNav()}
                        <div className="dash-user">
                            <div className="search-box">
                                <input type="text" placeholder="Search..." />
                            </div>
                            <div className="user-avatar" style={{ border: 'none' }}>
                                <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                            </div>
                            <button className="dash-logout" onClick={onLogout}>Sign Out</button>
                        </div>
                    </div>
                </header>

                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
                    {currentTab === 'dashboard' && (
                        <>
                            <div className="section-header animate-head">
                                <h2>Active Projects</h2>
                                <div className="header-actions">
                                    {selectionMode ? (
                                        <>
                                            <button className="glass-btn-secondary" onClick={handleSelectAll}>
                                                {selectedProjects.size === filteredProjects.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                            <button
                                                className="glass-btn-action"
                                                style={{ backgroundColor: '#ff3b30', borderColor: '#ff3b30' }}
                                                onClick={handleDeleteSelected}
                                                disabled={selectedProjects.size === 0}
                                            >
                                                Delete ({selectedProjects.size})
                                            </button>
                                            <button className="glass-btn-secondary" onClick={toggleSelectionMode}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="icon-btn"
                                                onClick={toggleSelectionMode}
                                                title="Batch Delete"
                                            >
                                                🗑️
                                            </button>
                                            <button className="glass-btn-action" onClick={() => setView('create')}>+ New Project</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="projects-grid" style={{ overflowX: 'visible', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                {filteredProjects.map((project, index) => {
                                    const isSelected = selectionMode && selectedProjects.has(project.id);
                                    return (
                                        <TiltCard
                                            key={project.id}
                                            className={`ultra-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => selectionMode ? toggleProjectSelection(project.id) : openProject(project)}
                                            delay={160 + index * 95}
                                            style={{
                                                flex: '0 0 320px',
                                                border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div className="project-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                                <div className="pc-icon" style={{ fontSize: '1.2rem', padding: '8px', background: 'var(--accent-dim)', borderRadius: '10px', border: '1px solid var(--accent-rim)' }}>🎨</div>
                                                <span className="badge b-active" style={{ background: 'var(--accent-dim)', color: 'var(--accent-lt)', border: '1px solid var(--accent-rim)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE</span>
                                            </div>

                                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>{project.name}</h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>📅</span>
                                                    <span>Due: {project.dueDate}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>👥</span>
                                                    <span>{(project.membersList || []).length || 1} Members</span>
                                                </div>
                                            </div>

                                            <div className="progress-section" style={{ marginTop: '1.5rem' }}>
                                                <div className="progress-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', opacity: 0.6 }}>
                                                    <span>Progress</span>
                                                    <span>{project.progress || 0}%</span>
                                                </div>
                                                <div className="progress-bar" style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div className="progress-fill" style={{ width: `${project.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-lt))', boxShadow: '0 0 8px var(--accent-glow)' }}></div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                                <MemberStack project={project} onAddMember={handleAddMember} showAdd={false} />
                                                <div className="task-count-badge" style={{
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'var(--accent-lt)',
                                                    border: '1px solid rgba(59, 130, 246, 0.15)'
                                                }}>
                                                    {project.summary?.action_items?.length || 0} Tasks
                                                </div>
                                            </div>
                                        </TiltCard>
                                    );
                                })}

                                {!selectionMode && (
                                    <TiltCard
                                        className="ultra-card create-new"
                                        onClick={() => setView('create')}
                                        delay={160 + filteredProjects.length * 95}
                                        style={{
                                            flex: '0 0 320px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '400px',
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            border: '2px dashed rgba(147, 197, 253, 0.4)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontSize: '2.5rem', color: 'var(--accent)', opacity: 0.6, marginBottom: '1rem' }}>+</div>
                                        <div style={{ fontWeight: 600, color: 'var(--accent-lt)', opacity: 0.8 }}>Create New Project</div>
                                    </TiltCard>
                                )}
                            </div>
                        </>
                    )}

                    {currentTab === 'meetings' && (
                        <div className="tab-view meetings-view">
                            <div className="section-header">
                                <h2>Recent Meetings</h2>
                            </div>
                            <div className="glass-section" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {projects.filter(p => p.summary).map((p, i) => (
                                        <div key={i} className="ultra-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => openProject(p)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ marginBottom: '0.5rem' }}>{p.name}</h3>
                                                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>{p.summary.summary ? p.summary.summary.substring(0, 120) + "..." : "No summary available."}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.dueDate}</div>
                                                    <span className="badge b-active" style={{ fontSize: '0.65rem' }}>VIEW NOTES</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.filter(p => p.summary).length === 0 && (
                                        <div style={{ textAlign: 'center', py: '4rem', opacity: 0.5 }}>No analyzed meetings yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'tasks' && (
                        <div className="tab-view tasks-view">
                            <div className="section-header">
                                <h2>All Tasks</h2>
                            </div>
                            <div className="glass-section" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {projects.flatMap(p => (p.summary?.action_items || []).map(t => ({ ...t, project: p.name }))).map((t, i) => (
                                        <div key={i} className="ultra-card" style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{t.owner ? t.owner[0].toUpperCase() : '?'}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Project: {t.project} • Owner: {t.owner || 'Unassigned'}</div>
                                                    </div>
                                                </div>
                                                <span className={`capsule-badge ${t.status || 'todo'}`}>{t.status || 'todo'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.every(p => !p.summary?.action_items) && (
                                        <div style={{ textAlign: 'center', py: '4rem', opacity: 0.5 }}>No tasks extracted yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'team' && (
                        <div className="tab-view team-view">
                            <div className="section-header">
                                <h2>Team Directory</h2>
                            </div>
                            <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {allUsers.map(m => (
                                    <div key={m.id} className="ultra-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="av" style={{ width: '50px', height: '50px', background: m.color, fontSize: '1.2rem' }}>
                                            {m.initials}
                                            <span className="av-presence" style={{ background: STATUS_COLORS['online'] }}></span>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{m.name}</div>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>{m.email}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '4px' }}>● active</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentTab === 'insights' && (
                        <div className="tab-view insights-view">
                            <div className="section-header">
                                <h2>Dashboard Insights</h2>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div className="ultra-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{projects.length}</div>
                                    <div style={{ opacity: 0.5 }}>Active Projects</div>
                                </div>
                                <div className="ultra-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                                        {projects.reduce((acc, p) => acc + (p.summary?.action_items?.filter(t => t.status === 'done').length || 0), 0)}
                                    </div>
                                    <div style={{ opacity: 0.5 }}>Tasks Completed</div>
                                </div>
                                <div className="ultra-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{allUsers.length}</div>
                                    <div style={{ opacity: 0.5 }}>Team Members</div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Dashboard
