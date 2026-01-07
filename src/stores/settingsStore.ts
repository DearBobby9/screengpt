import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ModelInfo, OpenAIModelsResponse } from '../types';

interface SettingsState {
  settings: Settings;
  isLoadingModels: boolean;
  modelsError: string | null;
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
  fetchModels: (baseUrl?: string, apiKey?: string) => Promise<ModelInfo[]>;
  toggleModelEnabled: (modelId: string) => void;
  setDefaultModel: (modelId: string) => void;
}

const defaultSettings: Settings = {
  chatApiBaseUrl: 'https://api.openai.com/v1',
  chatApiKey: '',
  defaultModel: 'gpt-4o',
  availableModels: [],
  enabledModels: [],
  embeddingApiBaseUrl: 'http://localhost:1234/v1',
  embeddingApiKey: '',
  embeddingModel: 'nomic-embed-text',
  hotkey: 'CommandOrControl+Shift+S',
  theme: 'system',
  defaultThinkingLevel: 'none',
};

// Parse model info from OpenAI API response
function parseModelInfo(model: { id: string; owned_by?: string }): ModelInfo {
  const id = model.id;
  const name = id;

  // Detect vision support
  const supportsVision =
    id.includes('vision') ||
    id.includes('gpt-4o') ||
    id.includes('gpt-4-turbo') ||
    id.includes('claude-3') ||
    id.includes('gemini');

  // Detect thinking/reasoning support
  const supportsThinking =
    id.includes('o1') ||
    id.includes('o3') ||
    id.includes('thinking') ||
    id.includes('reasoning') ||
    id.includes('claude-3-5-sonnet') ||
    id.includes('claude-sonnet-4') ||
    id.includes('claude-opus');

  return {
    id,
    name,
    supports_vision: supportsVision,
    supports_thinking: supportsThinking,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoadingModels: false,
      modelsError: null,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () => set({ settings: defaultSettings }),

      fetchModels: async (baseUrl?: string, apiKey?: string) => {
        const { settings } = get();
        const url = baseUrl || settings.chatApiBaseUrl;
        const key = apiKey || settings.chatApiKey;

        if (!url) {
          set({ modelsError: 'API base URL is required' });
          return [];
        }

        set({ isLoadingModels: true, modelsError: null });

        try {
          // Normalize URL
          let modelsUrl = url.replace(/\/$/, '');
          if (!modelsUrl.endsWith('/models')) {
            modelsUrl += '/models';
          }

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          if (key) {
            headers['Authorization'] = `Bearer ${key}`;
          }

          const response = await fetch(modelsUrl, {
            method: 'GET',
            headers,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch models: ${response.status} ${errorText}`);
          }

          const data: OpenAIModelsResponse = await response.json();

          // Parse and sort models
          const models = data.data
            .map(parseModelInfo)
            .sort((a, b) => a.id.localeCompare(b.id));

          // Update settings with fetched models
          set((state) => ({
            settings: {
              ...state.settings,
              availableModels: models,
              // If no models are enabled, enable all by default
              enabledModels:
                state.settings.enabledModels.length === 0
                  ? models.map((m) => m.id)
                  : state.settings.enabledModels,
            },
            isLoadingModels: false,
            modelsError: null,
          }));

          return models;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({ isLoadingModels: false, modelsError: message });
          return [];
        }
      },

      toggleModelEnabled: (modelId: string) => {
        set((state) => {
          const enabledModels = state.settings.enabledModels.includes(modelId)
            ? state.settings.enabledModels.filter((id) => id !== modelId)
            : [...state.settings.enabledModels, modelId];

          return {
            settings: {
              ...state.settings,
              enabledModels,
            },
          };
        });
      },

      setDefaultModel: (modelId: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            defaultModel: modelId,
          },
        }));
      },
    }),
    {
      name: 'screengpt-settings',
      // Merge persisted state with defaults to handle new fields
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsState> | undefined;
        return {
          ...currentState,
          settings: {
            ...defaultSettings,
            ...(persisted?.settings || {}),
          },
        };
      },
    }
  )
);
