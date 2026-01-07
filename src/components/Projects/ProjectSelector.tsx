import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import clsx from 'clsx';

interface ProjectSelectorProps {
  onClose?: () => void;
}

export function ProjectSelector({ onClose }: ProjectSelectorProps) {
  const {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    removeProject,
    editProject,
  } = useProjectStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleCreate = async () => {
    if (newName.trim()) {
      await addProject(newName.trim(), newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setShowNewForm(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (editName.trim()) {
      await editProject(id, editName.trim(), editDescription.trim() || undefined);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this project? All conversations and memories will be lost.')) {
      await removeProject(id);
    }
  };

  const startEdit = (project: typeof projects[0]) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          + New Project
        </button>
      </div>

      {/* New Project Form */}
      {showNewForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project List */}
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className={clsx(
              'p-3 rounded-lg border cursor-pointer transition-colors',
              currentProject?.id === project.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            {editingId === project.id ? (
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded mb-1 text-sm"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full px-2 py-1 border border-gray-200 rounded mb-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(project.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 bg-gray-200 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setCurrentProject(project);
                  onClose?.();
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{project.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(project);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && !showNewForm && (
          <div className="text-center text-gray-400 py-8">
            <p>No projects yet</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="text-blue-500 hover:underline text-sm mt-2"
            >
              Create your first project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
