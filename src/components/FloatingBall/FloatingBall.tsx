import { useState, useEffect, useRef } from 'react';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
import clsx from 'clsx';

interface FloatingBallProps {
  onCapture: () => void;
  onOpenChat: () => void;
  isCapturing?: boolean;
  isProcessing?: boolean;
}

export function FloatingBall({
  onCapture,
  onOpenChat,
  isCapturing = false,
  isProcessing = false,
}: FloatingBallProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const windowPos = useRef<{ x: number; y: number }>({ x: 100, y: 100 });

  useEffect(() => {
    // Add transparent class to html for this window
    document.documentElement.classList.add('transparent-window');

    // Get initial window position
    const initPos = async () => {
      const win = getCurrentWindow();
      const pos = await win.outerPosition();
      windowPos.current = { x: pos.x, y: pos.y };
    };
    initPos();

    return () => {
      document.documentElement.classList.remove('transparent-window');
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      dragStart.current = { x: e.screenX, y: e.screenY };
      setIsDragging(false);
    }
  };

  const handleMouseMove = async (e: React.MouseEvent) => {
    if (dragStart.current) {
      const deltaX = e.screenX - dragStart.current.x;
      const deltaY = e.screenY - dragStart.current.y;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setIsDragging(true);
        setShowMenu(false);

        const win = getCurrentWindow();
        const newX = windowPos.current.x + deltaX;
        const newY = windowPos.current.y + deltaY;
        await win.setPosition(new PhysicalPosition(Math.round(newX), Math.round(newY)));
      }
    }
  };

  const handleMouseUp = async () => {
    if (dragStart.current) {
      // Update stored position
      const win = getCurrentWindow();
      const pos = await win.outerPosition();
      windowPos.current = { x: pos.x, y: pos.y };
    }
    dragStart.current = null;
  };

  const handleClick = () => {
    if (!isDragging) {
      if (showMenu) {
        setShowMenu(false);
      } else {
        onCapture();
      }
    }
    setIsDragging(false);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDragging) {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Main Ball */}
      <button
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center cursor-move',
          'transition-all duration-200 shadow-lg',
          'bg-gradient-to-br from-blue-500 to-purple-600',
          'hover:scale-110 hover:shadow-xl',
          'active:scale-95',
          isCapturing && 'animate-pulse bg-green-500',
          isProcessing && 'animate-spin'
        )}
      >
        {isProcessing ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl py-2 min-w-[140px] z-50">
          <button
            onClick={() => {
              onCapture();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Screenshot
          </button>
          <button
            onClick={() => {
              onOpenChat();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Open Chat
          </button>
          <hr className="my-1" />
          <button
            onClick={async () => {
              await getCurrentWindow().close();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-500 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Quit
          </button>
        </div>
      )}

      {/* Tooltip on hover */}
      {isHovered && !showMenu && !isDragging && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
          Click to capture • Right-click for menu
        </div>
      )}
    </div>
  );
}
