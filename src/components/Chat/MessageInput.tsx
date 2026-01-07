import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Camera, Send, X, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface MessageInputProps {
  onSend: (message: string) => void;
  onCapture: () => void;
  screenshot: string | null;
  onClearScreenshot: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onCapture,
  screenshot,
  onClearScreenshot,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const canSend = message.trim() && !disabled;

  return (
    <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-primary)]">
      {/* Screenshot Preview */}
      {screenshot && (
        <div className="mb-4 animate-fade-in">
          <div className="relative inline-block group">
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Screenshot preview"
              className="max-h-32 rounded-xl border border-[var(--border)] shadow-lg"
            />
            <button
              onClick={onClearScreenshot}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--error)] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-md hover:scale-110"
              title="Remove screenshot"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1.5 text-white text-xs">
              <Camera className="w-3 h-3" />
              <span>Screenshot attached</span>
            </div>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div
        className={clsx(
          'relative flex items-end gap-2 p-2 rounded-2xl border transition-all duration-200',
          isFocused
            ? 'border-[var(--primary)] shadow-[0_0_0_3px_var(--primary-alpha)]'
            : 'border-[var(--border)] hover:border-[var(--border-hover)]',
          'bg-[var(--bg-secondary)]'
        )}
      >
        {/* Left Actions */}
        <div className="flex items-center gap-1 pb-1.5">
          {/* Capture Button */}
          <button
            onClick={onCapture}
            disabled={disabled}
            className={clsx(
              'btn btn-ghost btn-icon group',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title="Take screenshot (Cmd+Shift+S)"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask about your screenshot..."
            disabled={disabled}
            rows={1}
            className={clsx(
              'w-full px-3 py-2 bg-transparent',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none resize-none',
              'text-[0.9375rem] leading-relaxed',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 pb-1.5">
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200',
              canSend
                ? 'bg-[var(--primary)] text-white shadow-md hover:opacity-90 hover:scale-105 active:scale-95'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
            )}
            title="Send message (Enter)"
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-between mt-2 px-2 caption">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px] font-medium border border-[var(--border)]">
              Enter
            </kbd>
            <span>to send</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px] font-medium border border-[var(--border)]">
              Shift + Enter
            </kbd>
            <span>for new line</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[var(--primary)]" />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}
