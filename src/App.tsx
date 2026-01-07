import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { ChatWindow } from './components/Chat';
import { useScreenshot } from './hooks/useScreenshot';
import { useChatStore } from './stores/chatStore';
import { useSettingsStore } from './stores/settingsStore';

function App() {
  const { captureScreen } = useScreenshot();
  const { setPendingScreenshot } = useChatStore();
  const { settings } = useSettingsStore();

  // Apply theme on mount and when settings change
  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    };

    applyTheme();

    // Listen for system theme changes when using 'system' setting
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Register global screenshot shortcut
  useEffect(() => {
    const registerShortcut = async () => {
      try {
        await register(settings.hotkey, async () => {
          const result = await captureScreen();
          if (result) {
            setPendingScreenshot(result.base64);
          }
        });
      } catch (err) {
        console.error('Failed to register shortcut:', err);
      }
    };

    registerShortcut();

    return () => {
      unregister(settings.hotkey).catch(console.error);
    };
  }, [settings.hotkey, captureScreen, setPendingScreenshot]);

  return (
    <div className="h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <ChatWindow />
    </div>
  );
}

export default App;
