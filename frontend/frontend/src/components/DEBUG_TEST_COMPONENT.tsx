import React from 'react';

export const DebugTestComponent = () => {
  console.log('DEBUG_TEST_COMPONENT rendered');
  return (
    <div style={{padding: '20px', background: 'red', color: 'white'}}>
      DEBUG_TEST_COMPONENT
    </div>
  );
};