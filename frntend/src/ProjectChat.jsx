import React from 'react'

function ProjectChat({
  messages = [],
  chatInput,
  setChatInput,
  onSendMessage,
  currentUserEmail
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <section className="glass-section glass-result fade-in project-tab-panel">
      <div className="section-header">
        <h3>Project Chat</h3>
        <span className="glass-badge">Live</span>
      </div>

      <div className="project-chat-box">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isOwnMessage = msg.senderEmail === currentUserEmail

            return (
              <div
                key={msg.id}
                className={`project-chat-message ${isOwnMessage ? 'own' : 'other'}`}
              >
                <div className="project-chat-meta">
                  <strong>{msg.sender}</strong>
                  <span>{msg.time}</span>
                </div>
                <p>{msg.text}</p>
              </div>
            )
          })
        ) : (
          <div className="project-chat-empty">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💬</div>
            <p>No messages yet. Start the conversation.</p>
          </div>
        )}
      </div>

      <div className="dash-input-row" style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={chatInput}
          placeholder="Type a message..."
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="glass-text-input"
        />
        <button
          onClick={onSendMessage}
          className="glass-btn-secondary"
          disabled={!chatInput.trim()}
        >
          Send
        </button>
      </div>
    </section>
  )
}

export default ProjectChat