import React from 'react';

export const TestComponent: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid black',
      backgroundColor: 'white' 
    }}>
      <h1>Test Component</h1>
      <p>If you can see this, React is working!</p>
      <p>Current URL: {window.location.href}</p>
      <p>Base URL: {import.meta.env.BASE_URL}</p>
    </div>
  );
};