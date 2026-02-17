import { useState } from 'react'

const initialTasks = [
    {
        id: 1,
        title: 'Design meeting UI components',
        assignee: 'Alice',
        due: '2026-02-18',
        priority: 'high',
        status: 'todo',
    },
    {
        id: 2,
        title: 'Implement summary API endpoint',
        assignee: 'Bob',
        due: '2026-02-20',
        priority: 'high',
        status: 'todo',
    },
    {
        id: 3,
        title: 'Set up video upload pipeline',
        assignee: 'Charlie',
        due: '2026-02-17',
        priority: 'medium',
        status: 'in-progress',
    },
    {
        id: 4,
        title: 'Write unit tests for RAG module',
        assignee: 'Alice',
        due: '2026-02-22',
        priority: 'medium',
        status: 'in-progress',
    },
    {
        id: 5,
        title: 'Create project README',
        assignee: 'Bob',
        due: '2026-02-15',
        priority: 'low',
        status: 'done',
    },
    {
        id: 6,
        title: 'Configure CI/CD pipeline',
        assignee: 'Charlie',
        due: '2026-02-14',
        priority: 'medium',
        status: 'done',
    },
]

const columns = [
    { id: 'todo', label: 'To Do', icon: '📋' },
    { id: 'in-progress', label: 'In Progress', icon: '🚧' },
    { id: 'done', label: 'Done', icon: '✅' },
]

const priorityColors = {
    high: 'rgba(255, 59, 48, 0.35)',
    medium: 'rgba(255, 204, 0, 0.35)',
    low: 'rgba(52, 199, 89, 0.35)',
}

const priorityBorders = {
    high: 'rgba(255, 59, 48, 0.6)',
    medium: 'rgba(255, 204, 0, 0.6)',
    low: 'rgba(52, 199, 89, 0.6)',
}

function KanbanBoard({ onBack }) {
    const [tasks, setTasks] = useState(initialTasks)
    const [draggedTask, setDraggedTask] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newTask, setNewTask] = useState({
        title: '',
        assignee: '',
        due: '',
        priority: 'medium',
        status: 'todo',
    })

    const getColumnTasks = (columnId) =>
        tasks.filter((t) => t.status === columnId)

    const getDaysUntilDue = (dueDate) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const due = new Date(dueDate)
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
        return diff
    }

    const getDueLabel = (dueDate) => {
        const days = getDaysUntilDue(dueDate)
        if (days < 0) return 'Overdue'
        if (days === 0) return 'Due today'
        if (days === 1) return 'Due tomorrow'
        return `${days} days left`
    }

    const getDueClass = (dueDate) => {
        const days = getDaysUntilDue(dueDate)
        if (days < 0) return 'due-overdue'
        if (days <= 2) return 'due-soon'
        return 'due-ok'
    }

    // Drag and drop handlers
    const handleDragStart = (task) => {
        setDraggedTask(task)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (columnId) => {
        if (draggedTask && draggedTask.status !== columnId) {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === draggedTask.id ? { ...t, status: columnId } : t
                )
            )
        }
        setDraggedTask(null)
    }

    const handleAddTask = (e) => {
        e.preventDefault()
        if (!newTask.title || !newTask.assignee || !newTask.due) return

        setTasks((prev) => [
            ...prev,
            {
                ...newTask,
                id: Math.max(...prev.map((t) => t.id)) + 1,
            },
        ])
        setNewTask({
            title: '',
            assignee: '',
            due: '',
            priority: 'medium',
            status: 'todo',
        })
        setShowAddModal(false)
    }

    const handleDeleteTask = (taskId) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }

    return (
        <>
            <div className="kanban-wrapper">
                {/* Header */}
                <header className="kanban-header">
                    <div className="kanban-header-left">
                        <button className="glass-back-btn" onClick={onBack}>
                            ← Back
                        </button>
                        <div>
                            <h1 className="dash-logo">Task Board</h1>
                            <p className="dash-subtitle">Track and manage meeting action items</p>
                        </div>
                    </div>
                    <button className="glass-btn-action" onClick={() => setShowAddModal(true)}>
                        + New Task
                    </button>
                </header>

                {/* Kanban Columns */}
                <div className="kanban-columns">
                    {columns.map((col) => (
                        <div
                            key={col.id}
                            className="kanban-column"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(col.id)}
                        >
                            <div className="kanban-col-header">
                                <span className="kanban-col-icon">{col.icon}</span>
                                <h3>{col.label}</h3>
                                <span className="kanban-count">{getColumnTasks(col.id).length}</span>
                            </div>

                            <div className="kanban-cards">
                                {getColumnTasks(col.id).map((task) => (
                                    <div
                                        key={task.id}
                                        className={`kanban-card ${draggedTask?.id === task.id ? 'dragging' : ''
                                            }`}
                                        draggable
                                        onDragStart={() => handleDragStart(task)}
                                    >
                                        <div className="kanban-card-top">
                                            <span
                                                className="kanban-priority"
                                                style={{
                                                    background: priorityColors[task.priority],
                                                    borderColor: priorityBorders[task.priority],
                                                }}
                                            >
                                                {task.priority}
                                            </span>
                                            <button
                                                className="kanban-delete"
                                                onClick={() => handleDeleteTask(task.id)}
                                                title="Delete task"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <p className="kanban-card-title">{task.title}</p>
                                        <div className="kanban-card-meta">
                                            <span className="kanban-assignee">👤 {task.assignee}</span>
                                            <span className={`kanban-due ${getDueClass(task.due)}`}>
                                                {getDueLabel(task.due)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {getColumnTasks(col.id).length === 0 && (
                                    <div className="kanban-empty">
                                        Drop tasks here
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Task Modal */}
                {showAddModal && (
                    <div className="kanban-modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="glass-card kanban-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="glass-title" style={{ fontSize: '22px', marginBottom: '20px' }}>
                                New Task
                            </h2>
                            <form onSubmit={handleAddTask}>
                                <div className="glass-input-group">
                                    <label>Task Title</label>
                                    <input
                                        type="text"
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="glass-input-group">
                                    <label>Assignee</label>
                                    <input
                                        type="text"
                                        placeholder="Who is responsible?"
                                        value={newTask.assignee}
                                        onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                                    />
                                </div>
                                <div className="glass-input-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={newTask.due}
                                        onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                                    />
                                </div>
                                <div className="glass-input-group">
                                    <label>Priority</label>
                                    <select
                                        className="kanban-select"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button type="submit" className="glass-btn" style={{ flex: 1 }}>
                                        Add Task
                                    </button>
                                    <button
                                        type="button"
                                        className="glass-btn-secondary"
                                        style={{ flex: 1 }}
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default KanbanBoard
