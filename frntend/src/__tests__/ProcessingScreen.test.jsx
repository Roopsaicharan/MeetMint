import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProcessingScreen from '../ProcessingScreen';

// Mock scrollIntoView which jsdom doesn't support
Element.prototype.scrollIntoView = vi.fn();

describe('ProcessingScreen Component', () => {
    const defaultProps = {
        fileName: 'team_meeting.mp4',
        projectName: 'Sprint 3 Review',
        dueDate: '2026-04-30',
        fileSize: '45MB',
        duration: '32:15',
        projectId: '12345678-1234-1234-1234-123456789012',
        onComplete: vi.fn(),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ progress: 10, current_step: 1, status: 'processing', eta_seconds: 120 }),
            })
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the file name', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        const fileNameEl = document.querySelector('.processing-file-name');
        expect(fileNameEl).toBeDefined();
        expect(fileNameEl.textContent).toContain('team_meeting.mp4');
    });

    it('renders the project name in file meta', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        const meta = document.querySelector('.processing-file-meta');
        expect(meta).toBeDefined();
        expect(meta.textContent).toContain('Sprint 3 Review');
    });

    it('renders all 6 processing steps', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        const stepNames = document.querySelectorAll('.processing-step-name');
        expect(stepNames.length).toBe(6);
        const names = Array.from(stepNames).map(el => el.textContent);
        expect(names).toContain('Upload Complete');
        expect(names).toContain('Audio Extraction');
        expect(names).toContain('Transcription');
        expect(names).toContain('Speaker Detection');
        expect(names).toContain('AI Analysis');
        expect(names).toContain('Report Generation');
    });

    it('renders the progress bar at 0%', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText(/0%/)).toBeDefined();
    });

    it('renders the Cancel Processing button', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Cancel Processing/i)).toBeDefined();
    });

    it('renders the MeetMint logo/header', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText('MeetMint')).toBeDefined();
    });

    it('shows Overall Progress label', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Overall Progress/i)).toBeDefined();
    });

    it('shows Estimated time', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Estimated time remaining/i)).toBeDefined();
    });

    it('renders with default file name when none provided', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} fileName={undefined} />
            </MemoryRouter>
        );
        const fileNameEl = document.querySelector('.processing-file-name');
        expect(fileNameEl).toBeDefined();
        expect(fileNameEl.textContent).toContain('project.mp4');
    });

    it('shows the Analyzing badge', () => {
        render(
            <MemoryRouter>
                <ProcessingScreen {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Analyzing/i)).toBeDefined();
    });
});
