# MeetMint Sprint 3 — Frontend Video Script (NEW Features Only)

> Features already covered in Sprint 1/2 (Login/Register pages, Forgot Password, Processing Screen, Registration validation, Dashboard layout, project cards, sidebar, Kanban board, glassmorphism design, background particles, basic unit tests) are **not repeated** here.

---

## SECTION 1: What's New in Sprint 3 Frontend

**SAY:**
> "In Sprint 3, we made several key improvements to the frontend:"
> 1. "Theme-aware branding — the UI dynamically changes color with the theme, and the theme switcher is now restricted to logged-in users only"
> 2. "Ask AI feature powered by the live RAG pipeline"
> 3. "Full task management — create, edit, and delete tasks from the dashboard"
> 4. "Project member invite and remove functionality"
> 5. "36 new frontend tests across 3 new test files — bringing the total to 44"

---

## SECTION 2: Theme-Aware UI Components (New in Sprint 3)

**SAY:**
> "In Sprint 2, the MEETMINT title and the Send OTP button were always blue regardless of the theme. In Sprint 3, we made them fully theme-aware."

**SHOW:** Open `frntend/src/index.css` — show the theme variable blocks

```css
[data-theme="blue"] {
    --accent: #3b82f6;
    --accent-rim: rgba(59,130,246,0.5);
    --accent-glow: rgba(59,130,246,0.15);
}
[data-theme="green"] {
    --accent: #10b981;
    --accent-rim: rgba(16,185,129,0.5);
    --accent-glow: rgba(16,185,129,0.15);
}
[data-theme="red"] {
    --accent: #ef4444;
    --accent-rim: rgba(239,68,68,0.5);
    --accent-glow: rgba(239,68,68,0.15);
}
```

**SAY:**
> "Each theme defines accent colors as CSS variables. All UI components now reference these variables instead of hardcoded blue values."

**SHOW:** The `.ultra-clear-logo-text` class using `var(--accent)`

**SAY:**
> "The MEETMINT title now uses `color: var(--accent)` — so it's blue in the blue theme, green in the green theme, and red in the red theme."

**SHOW:** The `.glass-btn` class using theme variables

**SAY:**
> "Same for the Send OTP button — its background, border, and hover glow all use theme variables."

**DEMO:** Switch between Blue, Green, and Red themes — show the title and button colors change

**SAY:**
> "Watch the UI colors change as I switch themes. We also added a security/UX improvement: the interactive theme-selection wheel is now hidden on the Login and Register screens. It's exclusively available to authenticated users on the dashboard to keep the login flow distraction-free."

---


## SECTION 3: Task & Member Management (New in Sprint 3)

**SAY:**
> "Sprint 2 had tasks extracted by AI but you couldn't manually create, edit, or delete them. Sprint 3 adds full CRUD."

**SHOW:** The task creation UI in Dashboard

**SAY:**
> "Users can now manually create tasks from the dashboard. They enter a title, description, and optionally assign an owner."

**SHOW:** The task edit and delete handlers

**SAY:**
> "Each task card now has edit and delete buttons. Edit lets you change the title and reassign the owner. Delete removes the task from both the UI and the database."

**SHOW:** The member invite section

**SAY:**
> "We also added member management. You can search for users by name or email using the `/api/users/search` endpoint, then invite them to a project. You can also remove members."

**DEMO:** 
1. Create a new task manually
2. Edit a task's title
3. Show the member search and invite flow

---

## SECTION 4: Ask AI with Live RAG (New in Sprint 3)

**SAY:**
> "The Ask AI feature existed in Sprint 2 as a basic text input. In Sprint 3, it's now powered by the live RAG pipeline."

**SHOW:** Open `frntend/src/Dashboard.jsx` — show the Ask AI section

**SAY:**
> "When a user types a question and hits send, the frontend posts to `/api/ask` with the project ID and question. The backend fetches the transcript, chunks it, runs similarity search, and returns a grounded answer."

**SHOW:** The fetch call to `/api/ask`

```jsx
const res = await fetch('http://localhost:5000/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: askInput, project_id: selectedProject.id })
});
const data = await res.json();
```

**DEMO:** Open a project with transcript data → type a question → show the AI response with answer, explanation, and citation

**SAY:**
> "Notice the response includes an answer, an explanation, action items if relevant, and a citation confirming the answer came from the meeting transcript. This is powered by the RAG pipeline we showed in the backend section."

---

## SECTION 5: New Frontend Unit Tests (Sprint 3)

**SAY:**
> "Sprint 2 had 8 frontend tests across 3 files. Sprint 3 adds 36 new tests across 3 new files, bringing the total to 44."

**SHOW:** Run in terminal:

```bash
cd frntend
npx vitest run
```

**SAY:**
> "Here are the 3 new test files we created:"

| New File | Tests | What's Tested |
|----------|-------|---------------|
| `Sprint3.test.jsx` | 17 | Custom cursor elements, MEETMINT brand rendering, password input, Forgot Password link, Send OTP button, Dashboard API fetch with user_id |
| `ProcessingScreen.test.jsx` | 10 | All 6 steps render, progress bar at 0%, file name display, default filename fallback, Cancel button, ETA label, MeetMint header |
| `RegisterPage.test.jsx` | 8 | All input fields, Sign Up button, Sign In navigation, empty field error, short password error, mismatch error, name input, brand logo |

**SHOW:** Open `frntend/src/__tests__/Sprint3.test.jsx`

```jsx
it('renders the MEETMINT brand title', () => {
    render(
        <MemoryRouter>
            <LoginPage onLogin={() => {}} onGoToRegister={() => {}} />
        </MemoryRouter>
    );
    expect(screen.getByText(/MEETMINT/i)).toBeDefined();
});
```

**SAY:**
> "Sprint3.test.jsx has 17 tests that verify the new theme-aware components. For example, this test confirms the MEETMINT brand title renders correctly on the login page."

**SHOW:** Open `frntend/src/__tests__/ProcessingScreen.test.jsx`

```jsx
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
    expect(names).toContain('Transcription');
    expect(names).toContain('AI Analysis');
});
```

**SAY:**
> "ProcessingScreen.test.jsx has 10 tests covering the new processing pipeline UI — verifying all 6 steps render, the progress bar initializes at 0%, and the cancel button works."

**SHOW:** Open `frntend/src/__tests__/RegisterPage.test.jsx`

```jsx
it('shows error for password mismatch', () => {
    render(<RegisterPage ... />);
    fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), 
        { target: { value: 'password1' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm your password/i), 
        { target: { value: 'password2' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Passwords do not match/i)).toBeDefined();
});
```

**SAY:**
> "RegisterPage.test.jsx tests the validation logic with 8 tests covering empty fields, short passwords, and mismatched passwords."

**SHOW:** Terminal output — all 44 tests PASS

```
 ✓ src/__tests__/Sprint3.test.jsx (17 tests)
 ✓ src/__tests__/ProcessingScreen.test.jsx (10 tests)
 ✓ src/__tests__/RegisterPage.test.jsx (8 tests)
 ✓ src/__tests__/LoginPage.test.jsx (3 tests)
 ✓ src/__tests__/Dashboard.test.jsx (3 tests)
 ✓ src/__tests__/App.test.jsx (2 tests)

 Test Files  6 passed (6)
      Tests  44 passed (44)
```

**SAY:**
> "All 44 frontend tests pass in under 4 seconds. The 36 new tests give us coverage over the ProcessingScreen, RegisterPage validation, and extended Dashboard and LoginPage functionality."

---
