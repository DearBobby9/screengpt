import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import * as api from '../lib/tauri';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  pendingScreenshot: string | null;
  loading: boolean;
  sending: boolean;
  error: string | null;

  fetchConversations: (projectId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    content: string,
    apiBaseUrl: string,
    apiKey: string,
    model: string
  ) => Promise<void>;
  createConversation: (projectId: string, title?: string) => Promise<Conversation>;
  setPendingScreenshot: (screenshot: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  pendingScreenshot: null,
  loading: false,
  sending: false,
  error: null,

  fetchConversations: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const conversations = await api.getConversations(projectId);
      set({ conversations, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation, messages: [] });
    if (conversation) {
      get().fetchMessages(conversation.id);
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const messages = await api.getMessages(conversationId);
      set({ messages });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  sendMessage: async (content, apiBaseUrl, apiKey, model) => {
    const { currentConversation, pendingScreenshot } = get();
    if (!currentConversation) return;

    set({ sending: true, error: null });

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: 'user',
      content,
      screenshot_path: pendingScreenshot || undefined,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMessage],
      pendingScreenshot: null,
    }));

    try {
      const response = await api.sendMessage(
        currentConversation.id,
        content,
        pendingScreenshot,
        apiBaseUrl,
        apiKey,
        model
      );

      // Replace temp message and add response
      set((state) => ({
        messages: [
          ...state.messages.filter((m) => !m.id.startsWith('temp-')),
          { ...tempUserMessage, id: response.id },
          response,
        ],
        sending: false,
      }));
    } catch (err) {
      set((state) => ({
        error: String(err),
        sending: false,
        messages: state.messages.filter((m) => !m.id.startsWith('temp-')),
      }));
    }
  },

  createConversation: async (projectId, title) => {
    const conversation = await api.createConversation(projectId, title);
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentConversation: conversation,
      messages: [],
    }));
    return conversation;
  },

  setPendingScreenshot: (screenshot) => {
    set({ pendingScreenshot: screenshot });
  },

  clearChat: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      pendingScreenshot: null,
      error: null,
    });
  },
}));
