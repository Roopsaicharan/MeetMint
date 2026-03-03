import { useState } from 'react'
import MMLogo from './MMLogo'
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
          { title: 'Implement Glass UI components', owner: 'Jayanth', due: 'Friday', status: 'done' },
          { title: 'Refactor Dashboard for horizontal layout', owner: 'Ashmitha', due: 'Saturday', status: 'inprogress' },
          { title: 'Setup Go API for task tracking', owner: 'ROOP', due: 'Thursday', status: 'todo' },
          { title: 'Integrate CORS and RAG logic', owner: 'NARASIMHA', due: 'Friday', status: 'todo' }
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
      // Upload video
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

      // Reset form
      setNewProjectName('')
      setNewProjectDate('')
      setVideoFile(null)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Is the backend running?')
    } finally {
      setLoadingVideo(false)
    }
  }

  const openProject = (project) => {
    setActiveProject(project)
    setNotes(project.notes || '')
    setSummary(project.summary)
    setAnswer(null)
    setView('project')
  }

  const calculateProjectProgress = (summaryData) => {
    if (!summaryData || !summaryData.action_items || summaryData.action_items.length === 0) return 0
    const total = summaryData.action_items.length
    const completed = summaryData.action_items.filter((item) => item.status === 'done').length
    return Math.round((completed / total) * 100)
  }

  const calculateProjectMembers = (summaryData) => {
    if (!summaryData || !summaryData.action_items || summaryData.action_items.length === 0) return 1
    const owners = new Set(summaryData.action_items.map((item) => item.owner))
    return owners.size
  }

  const getProjectStatusTerm = (project) => {
    if (!project.summary || !project.summary.action_items || project.summary.action_items.length === 0) return 'TODO'
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

    const updatedSummary = { ...summary, action_items: updatedActionItems }
    const newProgress = calculateProjectProgress(updatedSummary)
    const newMembers = calculateProjectMembers(updatedSummary)

    setSummary(updatedSummary)
    setProjects(
      projects.map((p) =>
        p.id === activeProject.id
          ? { ...p, summary: updatedSummary, progress: newProgress, members: newMembers }
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
        action_items: data.action_items.map((item) => ({ ...item, status: 'todo' }))
      }

      setSummary(dataWithStatus)

      const newProgress = calculateProjectProgress(dataWithStatus)
      const newMembers = calculateProjectMembers(dataWithStatus)

      setProjects(
        projects.map((p) =>
          p.id === activeProject.id
            ? { ...p, summary: dataWithStatus, progress: newProgress, members: newMembers }
            : p
        )
      )
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Failed to generate summary. Is the backend running?')
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
      alert('Failed to get answer. Is the backend running?')
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

  // Render: project details view
  if (view === 'project' && activeProject) {
    return (
      <div className="dash-wrapper dashboard-shell">
        <div className="dash-container">
          <header className="dash-header dash-topbar">
            <div className="header-content">
              <div className="logo-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button
                    onClick={() => setView('home')}
                    className="glass-btn-secondary"
                    style={{ padding: '5px 10px' }}
                  >
                    ← Back
                  </button>
                  <div className="brand-header">
                    <MMLogo className="header-logo" />
                    <h1 className="dash-logo" onClick={() => setView('home')} style={{ margin: 0 }}>
                      MeetMint
                    </h1>
                  </div>
                </div>
                <p className="dash-subtitle">
                  Project: <strong>{activeProject.name}</strong> ({activeProject.daysLeft} days left)
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

          <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
            <div className="details-side-layout">
              {/* Left Side: Notes & rag */}
              <div className="details-left">
                <section className="glass-section">
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
                    style={{ width: '100%' }}
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
                      onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
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

              {/* Right Side: Summary Results */}
              <div className="details-right">
                {summary || activeProject.summary ? (
                  <section className="glass-section glass-result fade-in" style={{ height: '100%' }}>
                    <div className="section-header">
                      <h3>AI Insight Summary</h3>
                      <span
                        className="glass-badge"
                        style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
                      >
                        Complete
                      </span>
                    </div>
                    <p className="glass-summary-text">
                      {(summary ? summary.summary : activeProject.summary.summary) || ''}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                      <div>
                        <h4>Key Decisions</h4>
                        <ul className="glass-list">
                          {(summary ? summary.decisions : activeProject.summary.decisions).map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4>Action Items</h4>
                        <ul className="glass-task-list">
                          {(summary ? summary.action_items : activeProject.summary.action_items).map((t, i) => (
                            <li key={i} className="glass-task-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                  <span className="glass-task-title">{t.title}</span>
                                  <div className="glass-task-meta">
                                    <span>👤 {t.owner}</span>
                                    <span>📅 {t.due}</span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                  <span className={`task-status-badge ${t.status || 'todo'}`}>
                                    {(t.status || 'todo').toUpperCase()}
                                  </span>
                                  <select
                                    className="task-status-select"
                                    value={t.status || 'todo'}
                                    onChange={(e) => updateTaskStatus(i, e.target.value)}
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="inprogress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="done">Done</option>
                                  </select>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                ) : (
                  <div
                    className="glass-section"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      minHeight: '400px',
                      opacity: 0.6
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                      <p>Generate a summary to see AI insights</p>
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

                  <button className="glass-btn-secondary" onClick={toggleSelectionMode}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="icon-btn" onClick={toggleSelectionMode} title="Batch Delete">
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
                  onClick={() => (selectionMode ? toggleProjectSelection(project.id) : openProject(project))}
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
                      <span className="meta-icon">📅</span>
                      <span>Due: {project.dueDate}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{project.members || 1} Members</span>
                    </div>
                  </div>

                  {/* status pill upgrade hook */}
                  <span className={`status-badge ${isActive ? 'active' : 'review'} status-pill ${isActive ? 'is-active' : ''}`}>
                    {project.status}
                  </span>

                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Project Status</span>
                      <span className={`task-status-badge ${getProjectStatusTerm(project).toLowerCase().replace(' ', '')}`}>
                        {getProjectStatusTerm(project)}
                      </span>
                    </div>

                    {/* progress animation hook */}
                    <div className="progress-bar progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${progressNum}%`,       // keeps your existing look
                          '--p': progressScale            // enables smooth grow animation
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