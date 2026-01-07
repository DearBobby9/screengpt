import { useRef, useEffect, useState, memo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, RefreshCw, Sparkles, MessageSquare, Image, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onRegenerate?: (messageId: string) => void;
}

// Code block component with copy functionality
const CodeBlock = memo(({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="code-block my-3 overflow-hidden rounded-xl">
      <div className="code-block-header flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.8125rem',
          lineHeight: '1.6',
        }}
        codeTagProps={{
          style: {
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

// Avatar component
const Avatar = memo(({ role }: { role: 'user' | 'assistant' | 'system' }) => {
  if (role === 'user') {
    return (
      <div className="avatar avatar-user">
        <User className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="avatar avatar-assistant">
      <Bot className="w-4 h-4" />
    </div>
  );
});

Avatar.displayName = 'Avatar';

// Message actions component
const MessageActions = memo(({
  messageId,
  content,
  onRegenerate
}: {
  messageId: string;
  content: string;
  onRegenerate?: (id: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="btn btn-ghost btn-icon !w-7 !h-7"
        title="Copy message"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[var(--success)]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
      {onRegenerate && (
        <button
          onClick={() => onRegenerate(messageId)}
          className="btn btn-ghost btn-icon !w-7 !h-7"
          title="Regenerate response"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

MessageActions.displayName = 'MessageActions';

// Thinking block component (for extended thinking)
const ThinkingBlock = memo(({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <Brain className="w-4 h-4 text-[var(--primary)]" />
        <span className="font-medium">Thinking</span>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>
      {isExpanded && (
        <div className="px-4 py-3 border-t border-[var(--border)] text-sm text-[var(--text-secondary)] whitespace-pre-wrap animate-fade-in">
          {content}
        </div>
      )}
    </div>
  );
});

ThinkingBlock.displayName = 'ThinkingBlock';

// Single message component
const MessageItem = memo(({
  message,
  onRegenerate
}: {
  message: Message;
  onRegenerate?: (id: string) => void;
}) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex gap-3 animate-fade-in group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar role={message.role} />

      <div className={clsx('flex flex-col max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        {/* Thinking block (if present) */}
        {message.thinking && !isUser && (
          <ThinkingBlock content={message.thinking} />
        )}

        <div
          className={clsx(
            'message-bubble',
            isUser ? 'message-bubble-user' : 'message-bubble-assistant'
          )}
        >
          {/* Screenshot */}
          {message.screenshot_path && (
            <div className="mb-3 relative group/image">
              <img
                src={`data:image/png;base64,${message.screenshot_path}`}
                alt="Screenshot"
                className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => {
                  // TODO: Open in lightbox modal
                }}
              />
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 text-white text-xs opacity-0 group-hover/image:opacity-100 transition-opacity">
                <Image className="w-3 h-3" />
                <span>Screenshot</span>
              </div>
            </div>
          )}

          {/* Message content */}
          <div className="prose-modern">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  // Check if it's a code block (has language) or inline code
                  if (match) {
                    return (
                      <CodeBlock language={match[1]}>
                        {codeString}
                      </CodeBlock>
                    );
                  }

                  // Inline code
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Timestamp and actions */}
        <div className={clsx(
          'flex items-center gap-2 mt-1.5 px-1',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="caption">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {!isUser && (
            <MessageActions
              messageId={message.id}
              content={message.content}
              onRegenerate={onRegenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// Typing indicator component
const TypingIndicator = memo(() => (
  <div className="flex gap-3 animate-fade-in">
    <div className="avatar avatar-assistant">
      <Bot className="w-4 h-4" />
    </div>
    <div className="message-bubble message-bubble-assistant">
      <div className="flex items-center gap-1.5 py-1">
        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

// Empty state component
const EmptyState = memo(() => (
  <div className="flex-1 flex items-center justify-center">
    <div className="empty-state animate-fade-in-up">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-[var(--primary)]" />
      </div>
      <h3 className="heading-2 mb-2">Start a Conversation</h3>
      <p className="body-text mb-6">
        Take a screenshot and ask me anything about it.
        I can help you analyze, debug, or explain what you see.
      </p>
      <div className="flex flex-col gap-3 text-sm text-[var(--text-tertiary)]">
        <div className="flex items-center gap-2 justify-center">
          <MessageSquare className="w-4 h-4" />
          <span>Ask questions about your screen</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Image className="w-4 h-4" />
          <span>Analyze screenshots and images</span>
        </div>
      </div>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

export function MessageList({ messages, loading, onRegenerate }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onRegenerate={message.role === 'assistant' ? onRegenerate : undefined}
        />
      ))}

      {loading && <TypingIndicator />}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
