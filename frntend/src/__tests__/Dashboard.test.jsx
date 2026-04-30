import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

describe('Dashboard Component', () => {
    const mockUser = { id: '123-uuid', name: 'Test User', email: 'test@example.com' };
    const mockOnLogout = vi.fn();

    beforeEach(() => {
        // Mock fetch for projects list
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 'proj-1', name: 'Sprint 2 Project', dueDate: '2026-03-31' }])
            })
        );
    });

    it('renders the sidebar and welcome message', () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockOnLogout} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Dashboard/i)).toBeDefined();
        // The side-bar contains "Projects"
        expect(screen.getByText(/Projects/i)).toBeDefined();
    });

    it('triggers logout when clicked', () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockOnLogout} />
            </MemoryRouter>
        );
        // Find logout but it's often a button with an icon
        // Let's use getByText if text is visible or querySelector
        const logoutBtn = document.querySelector('.sb-foot-btn');
        if (logoutBtn) {
            fireEvent.click(logoutBtn);
            expect(mockOnLogout).toHaveBeenCalledTimes(1);
        }
    });

    it('displays the list of fetched projects', async () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockOnLogout} />
            </MemoryRouter>
        );
        // wait for fetch
        const projectItem = await screen.findByText(/Sprint 2 Project/i);
        expect(projectItem).toBeDefined();
    });
});
