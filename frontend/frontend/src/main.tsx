import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Remove loading message when app mounts
const removeLoading = () => {
  const loadingElement = document.getElementById('initial-load');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
};

try {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  removeLoading();
} catch (error) {
  console.error('Failed to mount React app:', error);
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.innerHTML = 'Failed to initialize app: ' + (error as Error).message;
  }
}


