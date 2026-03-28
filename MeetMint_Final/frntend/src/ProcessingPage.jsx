import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProcessingScreen from './ProcessingScreen';

const ProcessingPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get state passed from Dashboard (optional)
    const { projectName, fileName, fileSize, dueDate } = location.state || {};

    return (
        <div style={{ backgroundColor: 'transparent', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
            <ProcessingScreen 
                projectId={projectId}
                projectName={projectName || 'New Project'}
                fileName={fileName || 'video.mp4'}
                fileSize={fileSize || '---'}
                dueDate={dueDate || '---'}
                onComplete={() => {
                    // Redirect back to dashboard passing the new project ID automatically
                    navigate('/', { state: { openProjectId: projectId, projectName: projectName } });
                }}
                onCancel={async () => {
                    if (window.confirm("Are you sure you want to cancel processing? This project will be safely erased.")) {
                        try {
                            await fetch('http://localhost:5000/api/projects/delete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ project_id: projectId }),
                            });
                        } catch (err) {
                            console.error("Cancellation error:", err);
                        }
                        navigate('/');
                    }
                }}
            />
        </div>
    );
};

export default ProcessingPage;
