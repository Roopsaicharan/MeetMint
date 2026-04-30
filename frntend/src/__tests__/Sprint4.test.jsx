import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

describe('Sprint 4 Feature Tests', () => {
    const mockUser = { id: '369e9e1b-6893-4e8c-851c-43f11d13f9c3', name: 'Roop Sai', email: 'roop@example.com' };
    const mockOnLogout = vi.fn();

    beforeEach(() => {
        // Mock scrollIntoView for JSDOM
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
        
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/projects')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        { 
                            id: '369e9e1b-6893-4e8c-851c-43f11d13f9c3', 
                            name: 'Sprint 4 AI Meeting', 
                            dueDate: '2026-05-20',
                            progress: 45,
                            membersList: [{ id: '1', name: 'Roop Sai', email: 'roop@example.com' }]
                        }
                    ])
                });
            }
            if (url.includes('/api/project-details')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        meetings: [{ TranscriptText: "Hello world", SummaryText: "Summary here" }],
                        tasks: [{ id: 'task-1', title: 'Action Item 1', status: 'todo', owner_name: 'Roop Sai', due_date: '2026-06-01' }],
                        members: [{ id: '1', name: 'Roop Sai', email: 'roop@example.com' }],
                        images: []
                    })
                });
            }
            if (url.includes('/api/users/search')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ users: [] })
                });
            }
            return Promise.reject(new Error('not found'));
        });
    });

    it('renders the Dynamic User Avatar using UI-Avatars API', async () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockOnLogout} />
            </MemoryRouter>
        );

        const avatarImg = screen.getByAltText('Avatar');
        expect(avatarImg.src).toContain('ui-avatars.com/api/');
        expect(avatarImg.src).toContain('Roop%20Sai');
    });

    it('shows the Task Due Date in the project view', async () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockOnLogout} />
            </MemoryRouter>
        );

        // Open the project
        const projectCard = await screen.findByText(/Sprint 4 AI Meeting/i);
        fireEvent.click(projectCard);

        // Wait for tasks to load in project view
        await waitFor(() => {
            expect(screen.getByText(/Action Item 1/i)).toBeDefined();
        });

        // Check if due date is displayed
        expect(screen.getByText(/Due: 2026-06-01/i)).toBeDefined();
    });

    it('opens the Task Edit modal with a date picker', async () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockOnLogout} />
            </MemoryRouter>
        );

        const projectCard = await screen.findByText(/Sprint 4 AI Meeting/i);
        fireEvent.click(projectCard);

        const editBtn = await screen.findByText(/Edit Task & Assignee/i);
        fireEvent.click(editBtn);

        // Check for date picker input
        const datePicker = document.querySelector('input[type="date"]');
        expect(datePicker).toBeDefined();
        expect(datePicker.value).toBe('2026-06-01');
    });
});
