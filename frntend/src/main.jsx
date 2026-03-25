import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { this.setState({ info }); console.error("ErrorBoundary caught an error", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '20px', backgroundColor: 'black', height: '100vh', zIndex: 99999, position: 'relative' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{ fontSize: '10px' }}>{this.state.info && this.state.info.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
