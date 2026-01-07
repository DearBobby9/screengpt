import { useState, useCallback } from 'react';
import { captureFullScreen, captureRegion } from '../lib/tauri';
import type { ScreenshotResult, Region } from '../types';

function isPermissionError(error: string): boolean {
  // Common macOS screen recording permission error patterns
  const permissionPatterns = [
    'screen recording',
    'permission',
    'not permitted',
    'access denied',
    'authorization',
    'CGWindowListCreateImage',
  ];
  const lowerError = error.toLowerCase();
  return permissionPatterns.some(pattern => lowerError.includes(pattern.toLowerCase()));
}

export function useScreenshot() {
  const [screenshot, setScreenshot] = useState<ScreenshotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureScreen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await captureFullScreen();
      setScreenshot(result);
      return result;
    } catch (err) {
      const errorMessage = String(err);
      if (isPermissionError(errorMessage)) {
        const permissionError = 'Screen recording permission required. Please grant permission in System Settings > Privacy & Security > Screen Recording, then restart the app.';
        setError(permissionError);
        // Show an alert for better visibility
        alert(permissionError);
      } else {
        setError(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const captureArea = useCallback(async (region: Region) => {
    setLoading(true);
    setError(null);
    try {
      const result = await captureRegion(region);
      setScreenshot(result);
      return result;
    } catch (err) {
      const errorMessage = String(err);
      if (isPermissionError(errorMessage)) {
        const permissionError = 'Screen recording permission required. Please grant permission in System Settings > Privacy & Security > Screen Recording, then restart the app.';
        setError(permissionError);
        alert(permissionError);
      } else {
        setError(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearScreenshot = useCallback(() => {
    setScreenshot(null);
  }, []);

  return {
    screenshot,
    loading,
    error,
    captureScreen,
    captureArea,
    clearScreenshot,
  };
}
