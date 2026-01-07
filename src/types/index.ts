// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Conversation
export interface Conversation {
  id: string;
  project_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

// Message
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  screenshot_path?: string;
  created_at: string;
  // Extended thinking content (for models that support it)
  thinking?: string;
}

// Memory
export interface Memory {
  id: string;
  project_id: string;
  content: string;
  source_type: 'conversation' | 'user_note' | 'auto_extracted';
  source_id?: string;
  created_at: string;
}

// Screenshot
export interface ScreenshotResult {
  base64: string;
  width: number;
  height: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Model Types
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  supports_vision?: boolean;
  supports_thinking?: boolean;
}

// Thinking Level for extended thinking models
export type ThinkingLevel = 'none' | 'low' | 'medium' | 'high';

export const THINKING_LEVELS: { value: ThinkingLevel; label: string; budget?: number }[] = [
  { value: 'none', label: 'None', budget: 0 },
  { value: 'low', label: 'Low', budget: 1024 },
  { value: 'medium', label: 'Medium', budget: 8192 },
  { value: 'high', label: 'High', budget: 32768 },
];

// API Provider Configuration
export interface ApiProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: ModelInfo[];
  enabledModels: string[]; // Model IDs that are enabled
  isDefault?: boolean;
}

// Settings
export interface Settings {
  // Chat API
  chatApiBaseUrl: string;
  chatApiKey: string;
  defaultModel: string;

  // Available models (fetched from API)
  availableModels: ModelInfo[];
  enabledModels: string[];

  // Embedding API
  embeddingApiBaseUrl: string;
  embeddingApiKey: string;
  embeddingModel: string;

  // UI Settings
  hotkey: string;
  theme: 'light' | 'dark' | 'system';

  // Chat Settings
  defaultThinkingLevel: ThinkingLevel;
}

// Chat Options (per-message settings)
export interface ChatOptions {
  model: string;
  thinkingLevel: ThinkingLevel;
}

// App State
export type WindowType = 'main' | 'floating-ball';

// API Response Types
export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}
