import { useEffect, useState, useCallback, memo, useRef } from 'react';
import {
  Settings,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  FolderOpen,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Brain,
  Cpu,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SettingsPanel } from '../Settings';
import { useChatStore } from '../../stores/chatStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useScreenshot } from '../../hooks/useScreenshot';
import { THINKING_LEVELS } from '../../types';
import type { Conversation, ThinkingLevel } from '../../types';
import clsx from 'clsx';

// Sidebar item component
const SidebarItem = memo(({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={clsx('sidebar-item group', isActive && 'sidebar-item-active')}
      onClick={onClick}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{conversation.title || 'New Chat'}</span>
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon !w-6 !h-6"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
            <div className="dropdown">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(); setShowMenu(false); }}
                className="dropdown-item text-[var(--error)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

SidebarItem.displayName = 'SidebarItem';

// Sidebar component
const Sidebar = memo(({
  isOpen,
  conversations,
  currentConversation,
  currentProject,
  onSelectConversation,
  onNewConversation,
  onToggle,
}: {
  isOpen: boolean;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentProject: { id: string; name: string } | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onToggle: () => void;
}) => (
  <div className={clsx('sidebar relative', !isOpen && 'sidebar-collapsed')}>
    {isOpen && (
      <>
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <button
            onClick={onNewConversation}
            disabled={!currentProject}
            className="btn btn-primary w-full"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="empty-state py-12">
              <MessageSquare className="empty-state-icon" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <SidebarItem
                key={conv.id}
                conversation={conv}
                isActive={currentConversation?.id === conv.id}
                onClick={() => onSelectConversation(conv)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 caption">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{conversations.length} chats</span>
          </div>
        </div>
      </>
    )}

    {/* Toggle */}
    <button
      onClick={onToggle}
      className={clsx(
        'absolute top-4 z-10 btn btn-ghost btn-icon !w-8 !h-8',
        isOpen ? '-right-4' : 'right-0'
      )}
    >
      {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
    </button>
  </div>
));

Sidebar.displayName = 'Sidebar';

// Model selector dropdown with portal-like positioning
const ModelSelector = memo(({
  value,
  onChange,
  models,
}: {
  value: string;
  onChange: (model: string) => void;
  models: { id: string; supports_thinking?: boolean }[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
        <Cpu className="w-4 h-4" />
        <span>No models</span>
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="btn btn-ghost btn-sm gap-1"
      >
        <Cpu className="w-4 h-4" />
        <span className="max-w-[140px] truncate">{value || 'Select model'}</span>
        <ChevronDown className={clsx('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 min-w-[200px] max-w-[300px] max-h-[320px] overflow-y-auto bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-lg scrollbar-thin"
            style={{ top: position.top, left: position.left }}
          >
            <div className="p-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onChange(model.id); setIsOpen(false); }}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                    value === model.id
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  )}
                >
                  <span className="flex-1 truncate">{model.id}</span>
                  {model.supports_thinking && (
                    <Brain className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
});

ModelSelector.displayName = 'ModelSelector';

// Thinking level selector with portal-like positioning
const ThinkingSelector = memo(({
  value,
  onChange,
  disabled,
}: {
  value: ThinkingLevel;
  onChange: (level: ThinkingLevel) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = THINKING_LEVELS.find((l) => l.value === value);

  const handleOpen = () => {
    if (disabled) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        disabled={disabled}
        className={clsx('btn btn-ghost btn-sm gap-1', disabled && 'opacity-50')}
        title={disabled ? 'Model does not support extended thinking' : 'Thinking level'}
      >
        <Brain className="w-4 h-4" />
        <span>{current?.label || 'None'}</span>
        <ChevronDown className={clsx('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 min-w-[160px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-lg"
            style={{ top: position.top, left: position.left }}
          >
            <div className="p-1">
              {THINKING_LEVELS.map(({ value: level, label, budget }) => (
                <button
                  key={level}
                  onClick={() => { onChange(level); setIsOpen(false); }}
                  className={clsx(
                    'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    value === level
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  )}
                >
                  <span>{label}</span>
                  {budget !== undefined && budget > 0 && (
                    <span className="text-xs text-[var(--text-tertiary)]">{budget.toLocaleString()}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
});

ThinkingSelector.displayName = 'ThinkingSelector';

export function ChatWindow() {
  const [showSettings, setShowSettings] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat options (per-conversation)
  const [selectedModel, setSelectedModel] = useState('');
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('none');

  const {
    messages,
    currentConversation,
    conversations,
    sending,
    error,
    pendingScreenshot,
    fetchConversations,
    setCurrentConversation,
    createConversation,
    sendMessage,
    setPendingScreenshot,
  } = useChatStore();

  const { currentProject, projects, fetchProjects, setCurrentProject, addProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const { captureScreen } = useScreenshot();

  // Get enabled models
  const enabledModels = settings.availableModels.filter((m) =>
    settings.enabledModels.includes(m.id)
  );

  // Check if current model supports thinking
  const currentModelInfo = settings.availableModels.find((m) => m.id === selectedModel);
  const supportsThinking = currentModelInfo?.supports_thinking ?? false;

  // Initialize selected model
  useEffect(() => {
    if (!selectedModel && settings.defaultModel) {
      setSelectedModel(settings.defaultModel);
    }
    if (settings.defaultThinkingLevel) {
      setThinkingLevel(settings.defaultThinkingLevel);
    }
  }, [settings.defaultModel, settings.defaultThinkingLevel, selectedModel]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (currentProject) {
      fetchConversations(currentProject.id);
    }
  }, [currentProject, fetchConversations]);

  const handleCapture = useCallback(async () => {
    const result = await captureScreen();
    if (result) {
      setPendingScreenshot(result.base64);
    }
  }, [captureScreen, setPendingScreenshot]);

  const handleSend = useCallback(async (content: string) => {
    if (!currentProject) return;

    if (!currentConversation) {
      await createConversation(currentProject.id);
    }

    // Use selected model or fall back to settings default
    const model = selectedModel || settings.defaultModel;

    await sendMessage(
      content,
      settings.chatApiBaseUrl,
      settings.chatApiKey,
      model
    );
  }, [currentProject, currentConversation, createConversation, sendMessage, settings, selectedModel]);

  const handleNewConversation = useCallback(async () => {
    if (currentProject) {
      await createConversation(currentProject.id);
    }
  }, [currentProject, createConversation]);

  const handleCreateProject = useCallback(async () => {
    if (newProjectName.trim()) {
      const project = await addProject(newProjectName.trim());
      if (project) {
        setCurrentProject(project);
      }
      setNewProjectName('');
      setShowNewProject(false);
    }
  }, [newProjectName, addProject, setCurrentProject]);

  return (
    <div className="h-screen flex bg-[var(--bg-primary)]">
      {/* Atmospheric glow */}
      <div className="atmosphere" />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        currentConversation={currentConversation}
        currentProject={currentProject}
        onSelectConversation={setCurrentConversation}
        onNewConversation={handleNewConversation}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="glass px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[var(--text-tertiary)]" />
              <select
                value={currentProject?.id || ''}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewProject(true);
                  } else {
                    const project = projects.find((p) => p.id === e.target.value);
                    setCurrentProject(project || null);
                  }
                }}
                className="input input-sm !w-auto !py-1.5 select"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
                <option value="__new__">+ New Project</option>
              </select>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-[var(--border)]" />

            {/* Model Selector */}
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              models={enabledModels}
            />

            {/* Thinking Level */}
            <ThinkingSelector
              value={thinkingLevel}
              onChange={setThinkingLevel}
              disabled={!supportsThinking}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewConversation}
              disabled={!currentProject}
              className="btn btn-ghost btn-icon"
              title="New chat"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="btn btn-ghost btn-icon"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* No Project State */}
        {!currentProject && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm animate-fade-in-up">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h3 className="heading-2 mb-2">Select a Project</h3>
              <p className="body-text mb-6">
                Choose or create a project to start capturing and analyzing screenshots.
              </p>
              <button onClick={() => setShowNewProject(true)} className="btn btn-primary btn-lg">
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {currentProject && (
          <>
            {/* Error Banner */}
            {error && (
              <div className="mx-4 mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--error)]">Failed to send message</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 break-words">{error}</p>
                </div>
                <button
                  onClick={() => useChatStore.setState({ error: null })}
                  className="btn btn-ghost btn-icon !w-6 !h-6 text-[var(--text-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <MessageList messages={messages} loading={sending} />
            <MessageInput
              onSend={handleSend}
              onCapture={handleCapture}
              screenshot={pendingScreenshot}
              onClearScreenshot={() => setPendingScreenshot(null)}
              disabled={sending}
            />
          </>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
          <div className="modal animate-scale-in p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="heading-3 mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="input mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setShowNewProject(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowNewProject(false); setNewProjectName(''); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="btn btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
