import { useState } from 'react'
import MMLogo from './MMLogo'
import ProjectTabs from './ProjectTabs'
import './index.css'

function Dashboard({ user, onLogout }) {
  // View State: 'home' | 'create' | 'project'
  const [view, setView] = useState('home')
  const [activeProject, setActiveProject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Project Data State with Dummy Data
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'MeetMint Sprint 1',
      status: 'Active',
      dueDate: '2026-02-20',
      daysLeft: 5,
      members: 4,
      progress: 25,
      notes: '',
      summary: {
        summary:
          'The MeetMint team finalized the Sprint 1 requirements and successfully implemented the Glassmorphism theme.',
        decisions: [
          'Frontend will use Glassmorphism for all new modules',
          'Backend Go server to handle dynamic status updates'
        ],
        action_items: [
          {
            title: 'Implement Glass UI components',
            owner: 'Jayanth',
            due: 'Friday',
            status: 'done'
          },
          {
            title: 'Refactor Dashboard for horizontal layout',
            owner: 'Ashmitha',
            due: 'Saturday',
            status: 'inprogress'
          },
          {
            title: 'Setup Go API for task tracking',
            owner: 'ROOP',
            due: 'Thursday',
            status: 'todo'
          },
          {
            title: 'Integrate CORS and RAG logic',
            owner: 'NARASIMHA',
            due: 'Friday',
            status: 'todo'
          }
        ]
      }
    },
    {
      id: 2,
      name: 'Mobile Prototype',
      status: 'In Review',
      dueDate: '2026-02-18',
      daysLeft: 3,
      members: 3,
      progress: 92,
      notes: '',
      summary: null
    }
  ])

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('')
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

  // Chat / Right panel tabs
  const [rightTab, setRightTab] = useState('summary')
  const [chatInput, setChatInput] = useState('')
  const [projectChats, setProjectChats] = useState({
    1: [
      {
        id: 1,
        sender: 'Ashmitha',
        senderEmail: 'ashmitha@example.com',
        text: 'Let’s finalize the dashboard UI first.',
        time: '10:20 AM'
      }
    ],
    2: []
  })

  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState(new Set())

  // Helper to calculate days left
  const calculateDaysLeft = (dateString) => {
    const target = new Date(dateString)
    const today = new Date()
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      setSelectedProjects(new Set(filteredProjects.map((p) => p.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedProjects.size} project(s)?`)) {
      setProjects(projects.filter((p) => !selectedProjects.has(p.id)))
      setSelectionMode(false)
      setSelectedProjects(new Set())
    }
  }

  const handleCreateProject = async () => {
    if (!videoFile || !newProjectName || !newProjectDate) return

    setLoadingVideo(true)
    const formData = new FormData()
    formData.append('video', videoFile)

    try {
      // upload video
      const response = await fetch('http://localhost:5000/api/upload-video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Create project object
      const newProject = {
        id: Date.now(),
        name: newProjectName,
        status: 'Active',
        dueDate: newProjectDate,
        daysLeft: calculateDaysLeft(newProjectDate),
        members: 1,
        progress: 0,
        notes: data.notes,
        summary: null
      }

      setProjects([...projects, newProject])

      // Switch to project view
      setActiveProject(newProject)
      setNotes(data.notes)
      setSummary(null)
      setAnswer(null)
      setView('project')
      setRightTab('summary')
      setChatInput('')
      setProjectChats((prev) => ({
        ...prev,
        [newProject.id]: []
      }))

      // Reset form
      setNewProjectName('')
      setNewProjectDate('')
      setVideoFile(null)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project.\nIs the backend running?')
    } finally {
      setLoadingVideo(false)
    }
  }

  const openProject = (project) => {
    setActiveProject(project)
    setNotes(project.notes || '')
    setSummary(project.summary)
    setAnswer(null)
    setRightTab('summary')
    setChatInput('')
    setView('project')
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeProject) return

    const senderEmail = user?.email || 'you@meetmint.app'
    const senderName = senderEmail.split('@')[0]

    const newMessage = {
      id: Date.now(),
      sender: senderName,
      senderEmail,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    setProjectChats((prev) => ({
      ...prev,
      [activeProject.id]: [...(prev[activeProject.id] || []), newMessage]
    }))

    setChatInput('')
  }

  const calculateProjectProgress = (summaryData) => {
    if (!summaryData || !summaryData.action_items || summaryData.action_items.length === 0) {
      return 0
    }

    const total = summaryData.action_items.length
    const completed = summaryData.action_items.filter((item) => item.status === 'done').length
    return Math.round((completed / total) * 100)
  }

  const calculateProjectMembers = (summaryData) => {
    if (!summaryData || !summaryData.action_items || summaryData.action_items.length === 0) {
      return 1
    }

    const owners = new Set(summaryData.action_items.map((item) => item.owner))
    return owners.size
  }

  const getProjectStatusTerm = (project) => {
    if (!project.summary || !project.summary.action_items || project.summary.action_items.length === 0) {
      return 'TODO'
    }

    const items = project.summary.action_items

    if (items.some((i) => i.status === 'blocked')) return 'BLOCKED'
    if (project.progress === 100) return 'DONE'
    if (project.progress > 0) return 'IN PROGRESS'
    return 'TODO'
  }

  const updateTaskStatus = (taskId, newStatus) => {
    if (!activeProject || !summary) return

    const updatedActionItems = summary.action_items.map((item, index) =>
      index === taskId ? { ...item, status: newStatus } : item
    )

    const updatedSummary = {
      ...summary,
      action_items: updatedActionItems
    }

    const newProgress = calculateProjectProgress(updatedSummary)
    const newMembers = calculateProjectMembers(updatedSummary)

    setSummary(updatedSummary)

    setProjects(
      projects.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              summary: updatedSummary,
              progress: newProgress,
              members: newMembers
            }
          : p
      )
    )
  }

  const updateProjectNotes = (id, newNotes) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, notes: newNotes } : p)))
  }

  const generateSummary = async () => {
    if (!notes) return

    setLoadingSummary(true)

    try {
      const response = await fetch('http://localhost:5000/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      const data = await response.json()

      // Add default 'todo' status to all new action items
      const dataWithStatus = {
        ...data,
        action_items: data.action_items.map((item) => ({
          ...item,
          status: 'todo'
        }))
      }

      setSummary(dataWithStatus)

      const newProgress = calculateProjectProgress(dataWithStatus)
      const newMembers = calculateProjectMembers(dataWithStatus)

      setProjects(
        projects.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                summary: dataWithStatus,
                progress: newProgress,
                members: newMembers
              }
            : p
        )
      )
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Failed to generate summary.\nIs the backend running?')
    } finally {
      setLoadingSummary(false)
    }
  }

  const askQuestion = async () => {
    if (!question) return

    setLoadingAnswer(true)

    try {
      const response = await fetch('http://localhost:5000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await response.json()
      setAnswer(data)
    } catch (error) {
      console.error('Error asking question:', error)
      alert('Failed to get answer.\nIs the backend running?')
    } finally {
      setLoadingAnswer(false)
    }
  }

  // Render: create project view
  if (view === 'create') {
    return (
      <div className="dash-wrapper dashboard-shell">
        <div className="dash-container">
          <header className="dash-header dash-topbar">
            <div className="header-content">
              <div className="logo-section">
                <div className="brand-header">
                  <MMLogo className="header-logo" />
                  <h1 className="dash-logo" onClick={() => setView('home')}>
                    MeetMint
                  </h1>
                </div>
                <p className="dash-subtitle">Create a new Project</p>
              </div>

              <div className="dash-user">
                <span className="dash-email">{user?.email}</span>
                <button className="glass-btn-secondary" onClick={() => setView('home')}>
                  Cancel
                </button>
              </div>
            </div>
          </header>

          <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
            <section className="glass-section fade-in">
              <h3>Start New Project</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '1rem',
                  marginTop: '1.5rem'
                }}
              >
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="glass-text-input"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Due Date (for tracking)
                  </label>
                  <input
                    type="date"
                    value={newProjectDate}
                    onChange={(e) => setNewProjectDate(e.target.value)}
                    className="glass-text-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Upload Meeting Video
                  </label>
                  <input type="file" accept="video/*" onChange={handleVideoChange} />
                </div>

                <button
                  onClick={handleCreateProject}
                  disabled={loadingVideo}
                  className="glass-btn-action"
                  style={{ marginTop: '1rem' }}
                >
                  {loadingVideo ? 'Processing & Analyzing...' : 'Create Project'}
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  // Render: project details view
  if (view === 'project' && activeProject) {
    return (
      <div className="dash-wrapper dashboard-shell">
        <div className="dash-container">
          <header className="dash-header dash-topbar">
            <div className="header-content">
              <div className="logo-section">
                <div className="brand-header">
                  <button
                    onClick={() => setView('home')}
                    className="glass-btn-secondary"
                    style={{ padding: '5px 10px' }}
                  >
                    ← Back
                  </button>

                  <h1 className="dash-logo" onClick={() => setView('home')} style={{ margin: 0 }}>
                    MeetMint
                  </h1>
                </div>

                <p className="dash-subtitle">
                  Project: {activeProject.name} ({activeProject.daysLeft} days left)
                </p>
              </div>

              <div className="dash-user">
                <span className="dash-email">{user?.email}</span>
                <button className="dash-logout" onClick={onLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <div className="details-grid">
              {/* Left Side: Notes & rag */}
              <div className="details-left">
                <section className="glass-section fade-in">
                  <div className="section-header">
                    <h3>Meeting Notes</h3>
                    <span className="glass-badge">Review</span>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="12"
                    className="glass-textarea"
                    placeholder="Notes will appear here..."
                  />

                  <button
                    onClick={generateSummary}
                    disabled={loadingSummary || !notes}
                    className="glass-btn-secondary"
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {loadingSummary ? 'Generating Summary...' : 'Generate Summary'}
                  </button>
                </section>

                <section className="glass-section">
                  <h3>Ask Meeting Context (rag)</h3>

                  <div className="dash-input-row" style={{ marginTop: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Who owns the UI task?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="glass-text-input"
                      onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                    />
                    <button
                      onClick={askQuestion}
                      disabled={loadingAnswer}
                      className="glass-btn-secondary"
                    >
                      {loadingAnswer ? 'Asking...' : 'Ask'}
                    </button>
                  </div>

                  {answer && (
                    <div className="glass-answer fade-in" style={{ marginTop: '1.5rem' }}>
                      <p className="glass-answer-text">{answer.answer}</p>
                      <small className="glass-citation">Source: {answer.citation}</small>
                    </div>
                  )}
                </section>
              </div>

              {/* Right Side: Summary / Tasks / Chat */}
              <div className="details-right">
                <ProjectTabs
                  rightTab={rightTab}
                  setRightTab={setRightTab}
                  summaryData={summary || activeProject.summary}
                  activeProject={activeProject}
                  updateTaskStatus={updateTaskStatus}
                  projectMessages={projectChats[activeProject.id] || []}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  onSendMessage={handleSendMessage}
                  currentUserEmail={user?.email || ''}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Render: home (project list)
  return (
    <div className="dash-wrapper dashboard-shell">
      <div className="dash-container">
        <header className="dash-header dash-topbar">
          <div className="header-content">
            <div className="logo-section">
              <div className="brand-header">
                <MMLogo className="header-logo" />
                <h1 className="dash-logo" onClick={() => setView('home')}>
                  MeetMint
                </h1>
              </div>
              <p className="dash-subtitle">Your Projects</p>
            </div>

            <div className="dash-user">
              <div className="search-box dash-search">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <span className="dash-email">{user?.email}</span>

              <button className="dash-logout" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div className="section-header">
            <h2>Active Projects</h2>

            <div className="header-actions">
              {selectionMode ? (
                <>
                  <button className="glass-btn-secondary" onClick={handleSelectAll}>
                    {selectedProjects.size === filteredProjects.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>

                  <button
                    className="glass-btn-action"
                    style={{ backgroundColor: '#ff3b30', borderColor: '#ff3b30' }}
                    onClick={handleDeleteSelected}
                    disabled={selectedProjects.size === 0}
                  >
                    Delete ({selectedProjects.size})
                  </button>

                  <button className="glass-btn-secondary" onClick={toggleSelectionMode}>
                    Cancel
                  </button>
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

                  <button className="glass-btn-action" onClick={() => setView('create')}>
                    + New Project
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="projects-grid">
            {filteredProjects.map((project) => {
              const isSelected = selectionMode && selectedProjects.has(project.id)
              const isActive = project.status === 'Active'
              const progressNum = project.progress || 0
              const progressScale = Math.max(0, Math.min(1, progressNum / 100))

              return (
                <div
                  key={project.id}
                  className={`project-card ${isSelected ? 'selected' : ''}`}
                  onClick={() =>
                    selectionMode ? toggleProjectSelection(project.id) : openProject(project)
                  }
                  style={{
                    border: isSelected ? '2px solid #60a5fa' : '',
                    transform: isSelected ? 'translateY(-5px)' : ''
                  }}
                >
                  {selectionMode && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(project.id)}
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>
                  )}

                  <div className="project-header">
                    <span className={`time-badge ${project.daysLeft < 3 ? 'urgent' : 'normal'}`}>
                      {project.daysLeft} Days Left
                    </span>
                    <span className="project-menu">⋮</span>
                  </div>

                  <h3 className="project-title">{project.name}</h3>

                  <div className="project-meta">
                    <div className="meta-item">
                      <span className="meta-icon"></span>
                      <span>Due: {project.dueDate}</span>
                    </div>

                    <div className="meta-item">
                      <span className="meta-icon"></span>
                      <span>{project.members || 1} Members</span>
                    </div>
                  </div>

                  <span
                    className={`status-badge ${isActive ? 'active' : 'review'} status-pill ${
                      isActive ? 'is-active' : ''
                    }`}
                  >
                    {project.status}
                  </span>

                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Project Status</span>
                      <span
                        className={`task-status-badge ${getProjectStatusTerm(project)
                          .toLowerCase()
                          .replace(' ', '')}`}
                      >
                        {getProjectStatusTerm(project)}
                      </span>
                    </div>

                    <div className="progress-bar progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${progressNum}%`,
                          '--p': progressScale
                        }}
                      />
                    </div>
                  </div>

                  <div className="quick-notes-container" onClick={(e) => e.stopPropagation()}>
                    <label className="quick-notes-label">Quick Notes</label>
                    <textarea
                      className="quick-notes-box"
                      placeholder="Add project notes..."
                      value={project.notes || ''}
                      onChange={(e) => updateProjectNotes(project.id, e.target.value)}
                    />
                  </div>
                </div>
              )
            })}

            {!selectionMode && (
              <div
                className="project-card create-new create-project-tile"
                onClick={() => setView('create')}
              >
                <div className="create-project-plus">+</div>
                <div className="create-text">Create New Project</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard