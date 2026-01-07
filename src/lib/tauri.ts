import { invoke } from '@tauri-apps/api/core';
import type { Project, Conversation, Message, Memory, ScreenshotResult, Region } from '../types';

// Screenshot commands
export async function captureFullScreen(): Promise<ScreenshotResult> {
  return invoke('capture_full_screen');
}

export async function captureRegion(region: Region): Promise<ScreenshotResult> {
  return invoke('capture_region', { region });
}

// Chat commands
export async function sendMessage(
  conversationId: string,
  content: string,
  screenshot: string | null,
  apiBaseUrl: string,
  apiKey: string,
  model: string
): Promise<Message> {
  return invoke('send_message', {
    conversationId,
    content,
    screenshot,
    apiBaseUrl,
    apiKey,
    model,
  });
}

export async function getConversations(projectId: string): Promise<Conversation[]> {
  return invoke('get_conversations', { projectId });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return invoke('get_messages', { conversationId });
}

export async function createConversation(projectId: string, title?: string): Promise<Conversation> {
  return invoke('create_conversation', { projectId, title });
}

// Project commands
export async function getProjects(): Promise<Project[]> {
  return invoke('get_projects');
}

export async function createProject(name: string, description?: string): Promise<Project> {
  return invoke('create_project', { name, description });
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke('delete_project', { projectId });
}

export async function updateProject(projectId: string, name: string, description?: string): Promise<Project> {
  return invoke('update_project', { projectId, name, description });
}

// Memory commands
export async function searchMemories(projectId: string, query: string, limit?: number): Promise<Memory[]> {
  return invoke('search_memories', { projectId, query, limit });
}

export async function addMemory(
  projectId: string,
  content: string,
  sourceType: string,
  sourceId?: string
): Promise<Memory> {
  return invoke('add_memory', { projectId, content, sourceType, sourceId });
}

export async function getMemories(projectId: string): Promise<Memory[]> {
  return invoke('get_memories', { projectId });
}

export async function deleteMemory(memoryId: string): Promise<void> {
  return invoke('delete_memory', { memoryId });
}
