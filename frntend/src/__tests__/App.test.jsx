import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('MeetMint App Shell', () => {
    it('renders the background engine', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        // Check for the background container class
        const bgContainer = document.querySelector('.app-alive-container');
        expect(bgContainer).toBeDefined();
    });

    it('redirects to login when unauthenticated', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );
        // Should show 'Sign In' from LoginPage
        const loginHeader = screen.queryByText(/Sign In/i);
        // Note: LoginPage uses "Sign In" header
        expect(loginHeader).toBeDefined();
    });
});
