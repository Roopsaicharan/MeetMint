import React from 'react'
import ProjectChat from './ProjectChat'

function ProjectTabs({
  rightTab,
  setRightTab,
  summaryData,
  activeProject,
  updateTaskStatus,
  projectMessages,
  chatInput,
  setChatInput,
  onSendMessage,
  currentUserEmail
}) {
  const hasSummary = Boolean(summaryData)

  return (
    <div className="project-tabs-wrapper">
      <div className="project-tab-switcher">
        <button
          className={`project-tab-btn ${rightTab === 'summary' ? 'active' : ''}`}
          onClick={() => setRightTab('summary')}
        >
          Summary
        </button>

        <button
          className={`project-tab-btn ${rightTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setRightTab('tasks')}
        >
          Tasks
        </button>

        <button
          className={`project-tab-btn ${rightTab === 'chat' ? 'active' : ''}`}
          onClick={() => setRightTab('chat')}
        >
          Chat
        </button>
      </div>

      {rightTab === 'summary' && (
        <>
          {hasSummary ? (
            <section className="glass-section glass-result fade-in project-tab-panel" style={{ height: '100%' }}>
              <div className="section-header">
                <h3>AI Insight Summary</h3>
                <span
                  className="glass-badge"
                  style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
                >
                  Complete
                </span>
              </div>

              <p className="glass-summary-text">{summaryData.summary || ''}</p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '1.5rem',
                  marginTop: '1.5rem'
                }}
              >
                <div>
                  <h4>Key Decisions</h4>
                  <ul className="glass-list">
                    {summaryData.decisions?.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : (
            <div
              className="glass-section project-tab-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                opacity: 0.6
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                <p>Generate a summary to see AI insights for {activeProject.name}</p>
              </div>
            </div>
          )}
        </>
      )}

      {rightTab === 'tasks' && (
        <>
          {hasSummary ? (
            <section className="glass-section glass-result fade-in project-tab-panel" style={{ height: '100%' }}>
              <div className="section-header">
                <h3>Action Items</h3>
                <span className="glass-badge">
                  {summaryData.action_items?.length || 0} Tasks
                </span>
              </div>

              <ul className="glass-task-list">
                {summaryData.action_items?.map((t, i) => (
                  <li key={i} className="glass-task-item">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start'
                      }}
                    >
                      <div>
                        <span className="glass-task-title">{t.title}</span>
                        <div className="glass-task-meta">
                          <span>👤 {t.owner}</span>
                          <span>📅 {t.due}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '8px'
                        }}
                      >
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
            </section>
          ) : (
            <div
              className="glass-section project-tab-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                opacity: 0.6
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p>Generate a summary to view action items</p>
              </div>
            </div>
          )}
        </>
      )}

      {rightTab === 'chat' && (
        <ProjectChat
          messages={projectMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSendMessage={onSendMessage}
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  )
}

export default ProjectTabs