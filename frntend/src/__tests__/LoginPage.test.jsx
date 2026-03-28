import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

describe('LoginPage Component', () => {
    it('renders the sign in header', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Sign In/i)).toBeDefined();
    });

    it('validates email input', () => {
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
            </MemoryRouter>
        );
        const emailInput = screen.getByPlaceholderText(/Email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(emailInput.value).toBe('test@example.com');
    });

    it('triggers registration navigaton on click', () => {
        const onGoToRegister = vi.fn();
        render(
            <MemoryRouter>
                <LoginPage onLogin={() => {}} onGoToRegister={onGoToRegister} />
            </MemoryRouter>
        );
        const signUpLink = screen.getByText(/Sign up/i);
        fireEvent.click(signUpLink);
        expect(onGoToRegister).toHaveBeenCalledTimes(1);
    });
});
