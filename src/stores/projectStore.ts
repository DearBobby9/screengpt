import { create } from 'zustand';
import type { Project } from '../types';
import * as api from '../lib/tauri';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addProject: (name: string, description?: string) => Promise<Project>;
  removeProject: (id: string) => Promise<void>;
  editProject: (id: string, name: string, description?: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await api.getProjects();
      set({ projects, loading: false });

      // Auto-select first project if none selected
      if (!get().currentProject && projects.length > 0) {
        set({ currentProject: projects[0] });
      }
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  addProject: async (name, description) => {
    const project = await api.createProject(name, description);
    set((state) => ({
      projects: [project, ...state.projects],
      currentProject: project,
    }));
    return project;
  },

  removeProject: async (id) => {
    await api.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  editProject: async (id, name, description) => {
    const updated = await api.updateProject(id, name, description);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },
}));
