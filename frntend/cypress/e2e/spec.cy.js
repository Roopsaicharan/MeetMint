describe('MeetMint E2E Tests', () => {
    beforeEach(() => {
        // Mock API responses for stability
        cy.intercept('POST', '/api/login', { 
            statusCode: 200, 
            body: { message: "OTP sent!", name: "Test User" } 
        }).as('loginReq')
    })

    it('loads the landing page correctly', () => {
        cy.visit('http://localhost:5173/login')
        cy.get('h1').should('contain', 'Welcome Back')
        cy.get('input[type="email"]').should('be.visible')
    })

    it('validates navigation to register', () => {
        cy.visit('http://localhost:5173/login')
        // Assume there's a link to register (onGoToRegister)
        cy.contains(/Sign Up/i).click()
        cy.url().should('include', '/register')
        cy.get('h1').should('contain', 'Create Account')
    })

    it('handles simulated login input', () => {
        cy.visit('http://localhost:5173/login')
        cy.get('input[type="email"]').type('test@example.com')
        cy.get('input[type="password"]').type('secret123')
        cy.get('button[type="submit"]').click()
        // Should trigger OTP verification screen (if implemented)
        // For simple test, we just check if it doesn't crash
        cy.wait('@loginReq')
    })
})
