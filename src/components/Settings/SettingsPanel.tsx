import { useState, useEffect, memo } from 'react';
import {
  X,
  Globe,
  Cpu,
  Keyboard,
  Palette,
  RotateCcw,
  Save,
  Moon,
  Sun,
  Monitor,
  Database,
  Settings2,
  RefreshCw,
  Check,
  Eye,
  Brain,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { THINKING_LEVELS } from '../../types';
import type { ThinkingLevel, ModelInfo } from '../../types';
import clsx from 'clsx';

interface SettingsPanelProps {
  onClose: () => void;
}

// Tab component
const Tab = memo(({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      'btn btn-ghost',
      isActive && 'bg-[var(--bg-tertiary)] text-[var(--primary)]'
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
));

Tab.displayName = 'Tab';

// Section component
const Section = memo(({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[var(--primary)]" />
      </div>
      <div>
        <h3 className="heading-3">{title}</h3>
        {description && <p className="caption mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="pl-12 space-y-4">{children}</div>
  </div>
));

Section.displayName = 'Section';

// Input field component
const InputField = memo(({
  label,
  description,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  type?: 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
    {description && <p className="caption">{description}</p>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input"
    />
  </div>
));

InputField.displayName = 'InputField';

// Model list item
const ModelItem = memo(({
  model,
  isEnabled,
  isDefault,
  onToggle,
  onSetDefault,
}: {
  model: ModelInfo;
  isEnabled: boolean;
  isDefault: boolean;
  onToggle: () => void;
  onSetDefault: () => void;
}) => (
  <div
    className={clsx(
      'flex items-center justify-between p-3 rounded-lg border transition-all',
      isEnabled
        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
        : 'border-[var(--border)] opacity-60'
    )}
  >
    <div className="flex items-center gap-3 min-w-0">
      <button
        onClick={onToggle}
        className={clsx(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
          isEnabled
            ? 'bg-[var(--primary)] border-[var(--primary)]'
            : 'border-[var(--border)]'
        )}
      >
        {isEnabled && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{model.id}</span>
          {isDefault && (
            <span className="badge badge-primary text-xs">Default</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {model.supports_vision && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Eye className="w-3 h-3" /> Vision
            </span>
          )}
          {model.supports_thinking && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Brain className="w-3 h-3" /> Thinking
            </span>
          )}
        </div>
      </div>
    </div>
    {isEnabled && !isDefault && (
      <button
        onClick={onSetDefault}
        className="btn btn-ghost btn-sm text-xs"
      >
        Set Default
      </button>
    )}
  </div>
));

ModelItem.displayName = 'ModelItem';

// Theme selector component
const ThemeSelector = memo(({
  value,
  onChange,
}: {
  value: 'system' | 'light' | 'dark';
  onChange: (value: 'system' | 'light' | 'dark') => void;
}) => {
  const themes = [
    { value: 'system' as const, label: 'System', icon: Monitor },
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  return (
    <div className="flex gap-2">
      {themes.map(({ value: themeValue, label, icon: Icon }) => (
        <button
          key={themeValue}
          onClick={() => onChange(themeValue)}
          className={clsx(
            'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
            value === themeValue
              ? 'border-[var(--primary)] bg-[var(--primary)]/5'
              : 'border-[var(--border)] hover:border-[var(--border-hover)]'
          )}
        >
          <div
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              value === themeValue
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span
            className={clsx(
              'text-sm font-medium',
              value === themeValue
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-secondary)]'
            )}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
});

ThemeSelector.displayName = 'ThemeSelector';

// Thinking level selector
const ThinkingLevelSelector = memo(({
  value,
  onChange,
}: {
  value: ThinkingLevel;
  onChange: (value: ThinkingLevel) => void;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-[var(--text-primary)]">
      Default Thinking Level
    </label>
    <p className="caption">
      Controls the reasoning depth for models that support extended thinking
    </p>
    <div className="flex gap-2">
      {THINKING_LEVELS.map(({ value: level, label }) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={clsx(
            'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all',
            value === level
              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
              : 'border-[var(--border)] hover:border-[var(--border-hover)]'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
));

ThinkingLevelSelector.displayName = 'ThinkingLevelSelector';

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    settings,
    isLoadingModels,
    modelsError,
    updateSettings,
    resetSettings,
    fetchModels,
    toggleModelEnabled,
    setDefaultModel,
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<'api' | 'models' | 'shortcuts' | 'appearance'>('api');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(localSettings));
  }, [settings, localSettings]);

  const handleSave = () => {
    updateSettings(localSettings);

    // Apply theme
    if (localSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (localSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    onClose();
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      resetSettings();
      setLocalSettings(useSettingsStore.getState().settings);
    }
  };

  const handleFetchModels = async () => {
    // Save current API settings first
    updateSettings({
      chatApiBaseUrl: localSettings.chatApiBaseUrl,
      chatApiKey: localSettings.chatApiKey,
    });
    await fetchModels(localSettings.chatApiBaseUrl, localSettings.chatApiKey);
    // Sync local settings with updated store (including fetched models)
    setLocalSettings(useSettingsStore.getState().settings);
  };

  const updateLocal = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="heading-3">Settings</h2>
              <p className="caption">Configure your ScreenGPT experience</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <Tab icon={Globe} label="API" isActive={activeTab === 'api'} onClick={() => setActiveTab('api')} />
          <Tab icon={Cpu} label="Models" isActive={activeTab === 'models'} onClick={() => setActiveTab('models')} />
          <Tab icon={Keyboard} label="Shortcuts" isActive={activeTab === 'shortcuts'} onClick={() => setActiveTab('shortcuts')} />
          <Tab icon={Palette} label="Appearance" isActive={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin space-y-8">
          {/* API Tab */}
          {activeTab === 'api' && (
            <>
              <Section
                icon={Globe}
                title="Chat / Vision API"
                description="Configure the AI model endpoint"
              >
                <InputField
                  label="API Base URL"
                  value={localSettings.chatApiBaseUrl}
                  onChange={(v) => updateLocal('chatApiBaseUrl', v)}
                  placeholder="https://api.openai.com/v1"
                />
                <InputField
                  label="API Key"
                  type="password"
                  value={localSettings.chatApiKey}
                  onChange={(v) => updateLocal('chatApiKey', v)}
                  placeholder="sk-..."
                />
                <button
                  onClick={handleFetchModels}
                  disabled={isLoadingModels || !localSettings.chatApiBaseUrl}
                  className="btn btn-secondary w-full"
                >
                  {isLoadingModels ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Fetch Available Models
                </button>
                {modelsError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{modelsError}</span>
                  </div>
                )}
              </Section>

              <div className="divider" />

              <Section
                icon={Database}
                title="Embedding API"
                description="For memory and semantic search features"
              >
                <InputField
                  label="API Base URL"
                  value={localSettings.embeddingApiBaseUrl}
                  onChange={(v) => updateLocal('embeddingApiBaseUrl', v)}
                  placeholder="http://localhost:1234/v1"
                />
                <InputField
                  label="API Key"
                  type="password"
                  description="Leave empty for local models"
                  value={localSettings.embeddingApiKey}
                  onChange={(v) => updateLocal('embeddingApiKey', v)}
                  placeholder="Optional"
                />
                <InputField
                  label="Embedding Model"
                  value={localSettings.embeddingModel}
                  onChange={(v) => updateLocal('embeddingModel', v)}
                  placeholder="nomic-embed-text"
                />
              </Section>
            </>
          )}

          {/* Models Tab */}
          {activeTab === 'models' && (
            <Section
              icon={Cpu}
              title="Available Models"
              description="Select which models to enable for chat"
            >
              {settings.availableModels.length === 0 ? (
                <div className="text-center py-8">
                  <Cpu className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
                  <p className="text-[var(--text-secondary)] mb-2">No models available</p>
                  <p className="caption mb-4">
                    Go to the API tab and fetch models from your endpoint
                  </p>
                  <button
                    onClick={() => setActiveTab('api')}
                    className="btn btn-primary"
                  >
                    Configure API
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {settings.availableModels.map((model) => (
                    <ModelItem
                      key={model.id}
                      model={model}
                      isEnabled={settings.enabledModels.includes(model.id)}
                      isDefault={settings.defaultModel === model.id}
                      onToggle={() => toggleModelEnabled(model.id)}
                      onSetDefault={() => setDefaultModel(model.id)}
                    />
                  ))}
                </div>
              )}

              <div className="divider" />

              <ThinkingLevelSelector
                value={localSettings.defaultThinkingLevel}
                onChange={(v) => updateLocal('defaultThinkingLevel', v)}
              />
            </Section>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <Section
              icon={Keyboard}
              title="Keyboard Shortcuts"
              description="Customize global hotkeys"
            >
              <InputField
                label="Screenshot Capture"
                description="Use CommandOrControl for cross-platform compatibility"
                value={localSettings.hotkey}
                onChange={(v) => updateLocal('hotkey', v)}
                placeholder="CommandOrControl+Shift+S"
              />
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <h4 className="text-sm font-medium mb-3">Modifier Keys Reference</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-mono">
                      CommandOrControl
                    </kbd>
                    <span className="text-[var(--text-tertiary)]">Cmd/Ctrl</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-mono">
                      Shift
                    </kbd>
                    <span className="text-[var(--text-tertiary)]">Shift key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-mono">
                      Alt
                    </kbd>
                    <span className="text-[var(--text-tertiary)]">Option/Alt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-mono">
                      Super
                    </kbd>
                    <span className="text-[var(--text-tertiary)]">Win/Super</span>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Section
              icon={Palette}
              title="Appearance"
              description="Customize the look and feel"
            >
              <ThemeSelector
                value={localSettings.theme}
                onChange={(v) => updateLocal('theme', v)}
              />
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <button
            onClick={handleReset}
            className="btn btn-ghost text-[var(--error)]"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
