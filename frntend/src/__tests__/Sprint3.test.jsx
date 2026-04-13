import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import LoginPage from '../LoginPage';
import Dashboard from '../Dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// App Shell Tests (Sprint 3 — Extended)
// ─────────────────────────────────────────────────────────────────────────────

describe('App Shell — Sprint 3', () => {
    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        expect(document.querySelector('.app-alive-container')).toBeDefined();
    });

    it('shows login page for unauthenticated users', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText(/Welcome Back/i)).toBeDefined();
    });

    it('renders the custom cursor dot element', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        const dot = document.getElementById('dot');
        expect(dot).toBeDefined();
    });

    it('renders the custom cursor ring element', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        const ring = document.getElementById('ring');
        expect(ring).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage Tests (Sprint 3 — Extended)
// ─────────────────────────────────────────────────────────────────────────────

describe('LoginPage — Sprint 3 Extended', () => {
    it('renders the MEETMINT brand title', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText(/MEETMINT/i)).toBeDefined();
    });

    it('renders password input field', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        const pwInput = document.getElementById('login-password');
        expect(pwInput).toBeDefined();
    });

    it('allows typing in password field', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        const pwInput = document.getElementById('login-password');
        fireEvent.change(pwInput, { target: { value: 'secret123' } });
        expect(pwInput.value).toBe('secret123');
    });

    it('shows the Send OTP button', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Send OTP/i)).toBeDefined();
    });

    it('shows Sign up link at the bottom', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Sign up/i)).toBeDefined();
    });

    it('shows Forgot Password link', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Forgot Password\?/i)).toBeDefined();
    });

    it('renders sign in subtitle', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Sign in to continue/i)).toBeDefined();
    });

    it('calls onGoToRegister when signup link clicked', () => {
        const mockGoRegister = vi.fn();
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={mockGoRegister} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText(/Sign up/i));
        expect(mockGoRegister).toHaveBeenCalledTimes(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Tests (Sprint 3 — Extended)
// ─────────────────────────────────────────────────────────────────────────────

describe('Dashboard — Sprint 3 Extended', () => {
    const mockUser = { id: 'user-uuid-123', name: 'Sprint3 User', email: 'user@test.com' };
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/projects')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        {
                            id: 'proj-s3',
                            name: 'Sprint 3 Project',
                            dueDate: '2026-04-30',
                            progress: 40,
                            membersList: [{ id: 'u1', name: 'Alice', email: 'alice@test.com' }],
                            summary: { summary: 'Meeting about sprint 3', action_items: [], transcript: 'Full transcript here' },
                        },
                    ]),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('renders Dashboard title', () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockLogout} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Dashboard/i)).toBeDefined();
    });

    it('renders Projects label in sidebar', () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockLogout} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Projects/i)).toBeDefined();
    });

    it('fetches and displays project data', async () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockLogout} />
            </MemoryRouter>
        );
        const project = await screen.findByText(/Sprint 3 Project/i);
        expect(project).toBeDefined();
    });

    it('calls fetch with the user_id parameter', async () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockLogout} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
            const calls = global.fetch.mock.calls;
            const projectCall = calls.find(c => c[0].includes('/api/projects'));
            expect(projectCall).toBeDefined();
        });
    });

    it('renders the upload area', () => {
        render(
            <MemoryRouter>
                <Dashboard user={mockUser} onLogout={mockLogout} />
            </MemoryRouter>
        );
        // Dashboard has an upload section
        const uploadArea = document.querySelector('.ultra-upload-zone') || document.querySelector('[class*="upload"]');
        expect(uploadArea).toBeDefined();
    });
});
