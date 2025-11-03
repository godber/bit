// Debug utilities for controlling Leva panel visibility
const STORAGE_KEY = 'bit-debug-enabled';

// Check if debug should be enabled (defaults to false)
export function isDebugEnabled() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'true';
}

// Toggle debug panel visibility
export function toggleDebug() {
  const newState = !isDebugEnabled();
  localStorage.setItem(STORAGE_KEY, String(newState));

  // Reload to apply changes (Leva doesn't support dynamic hide/show easily)
  window.location.reload();
}

// Show debug panel
export function showDebug() {
  localStorage.setItem(STORAGE_KEY, 'true');
  window.location.reload();
}

// Hide debug panel
export function hideDebug() {
  localStorage.setItem(STORAGE_KEY, 'false');
  window.location.reload();
}

// Expose to console for easy access
if (typeof window !== 'undefined') {
  window.toggleDebug = toggleDebug;
  window.showDebug = showDebug;
  window.hideDebug = hideDebug;

  console.log('Debug: showDebug() | hideDebug() | toggleDebug()');
}
