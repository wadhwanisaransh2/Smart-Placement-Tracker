import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

// Suppress MetaMask errors
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('MetaMask') ||
            args[0].includes('chrome-extension://') ||
            args[0].includes('nkbihfbeogaeaoehlefnkodbefgpgknn'))
    ) {
        // Ignore MetaMask-related errors
        return;
    }
    originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
