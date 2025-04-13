// This script checks if Buffer is available and logs the result
(function() {
  console.log('Buffer check script loaded');
  try {
    // Check if Buffer is globally available
    if (typeof Buffer !== 'undefined') {
      console.log('✅ Global Buffer is available');
      // Try to use Buffer
      const testBuffer = Buffer.from('test');
      console.log('✅ Buffer usage works:', testBuffer.toString());
    } else {
      console.error('❌ Global Buffer is NOT available');
    }

    // Check if process is globally available
    if (typeof process !== 'undefined') {
      console.log('✅ Global process is available');
    } else {
      console.warn('⚠️ Global process is NOT available');
    }
  } catch (err) {
    console.error('❌ Buffer check failed:', err);
  }
})();
