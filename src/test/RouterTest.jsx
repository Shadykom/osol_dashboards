import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function RouterTest() {
  const location = useLocation();
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>Router Test Component</h1>
      <p>Current path: {location.pathname}</p>
      <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
}