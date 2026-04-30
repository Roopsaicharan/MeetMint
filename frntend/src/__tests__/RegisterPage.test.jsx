import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

describe('RegisterPage Component', () => {
    const mockOnRegister = vi.fn();
    const mockOnGoToLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Create Account header', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Create Account/i)).toBeDefined();
    });

    it('renders all registration input fields', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        expect(screen.getByPlaceholderText(/John Doe/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/your@email.com/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/Min. 6 characters/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeDefined();
    });

    it('shows the Sign Up button', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        const submitBtn = document.querySelector('.glass-btn');
        expect(submitBtn).toBeDefined();
        expect(submitBtn.textContent).toMatch(/Sign Up/i);
    });

    it('navigates to login when Sign In link is clicked', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        const signInLink = screen.getByText(/Sign In/i);
        fireEvent.click(signInLink);
        expect(mockOnGoToLogin).toHaveBeenCalledTimes(1);
    });

    it('shows error when fields are empty and form is submitted', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        const submitBtn = document.querySelector('.glass-btn');
        fireEvent.click(submitBtn);
        expect(screen.getByText(/Please fill in all fields/i)).toBeDefined();
    });

    it('shows error for short password', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), { target: { value: '12345' } });
        fireEvent.change(screen.getByPlaceholderText(/Confirm your password/i), { target: { value: '12345' } });
        const submitBtn = document.querySelector('.glass-btn');
        fireEvent.click(submitBtn);
        expect(screen.getByText(/Password must be at least 6 characters/i)).toBeDefined();
    });

    it('shows error for password mismatch', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), { target: { value: 'password1' } });
        fireEvent.change(screen.getByPlaceholderText(/Confirm your password/i), { target: { value: 'password2' } });
        const submitBtn = document.querySelector('.glass-btn');
        fireEvent.click(submitBtn);
        expect(screen.getByText(/Passwords do not match/i)).toBeDefined();
    });

    it('updates name input field value correctly', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        const nameInput = screen.getByPlaceholderText(/John Doe/i);
        fireEvent.change(nameInput, { target: { value: 'Sprint3 User' } });
        expect(nameInput.value).toBe('Sprint3 User');
    });

    it('renders the MeetMint brand logo', () => {
        render(
            <MemoryRouter>
                <RegisterPage onRegister={mockOnRegister} onGoToLogin={mockOnGoToLogin} />
            </MemoryRouter>
        );
        expect(screen.getByText(/MeetMint/i)).toBeDefined();
    });
});
