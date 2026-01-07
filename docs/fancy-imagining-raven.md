# ScreenGPT 实现计划

## 概述

一个轻量级 macOS 桌面 AI 助手，通过悬浮球/快捷键截图并发送给 Vision AI 模型，支持项目管理和记忆系统。

## 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 框架 | **Tauri v2** | 比 Electron 轻量 (10MB vs 150MB+)，原生 Rust 后端 |
| 前端 | React + TypeScript + Tailwind | 现代化、类型安全 |
| 截图 | `xcap` crate | Rust 原生，支持全屏/区域截图 |
| 数据库 | SQLite + `sqlite-vec` | 本地优先，支持向量语义搜索 |
| API | OpenAI 兼容格式 | 直接对接 Quotio 代理 |

## 参考的开源项目

- **screenpipe** (16.4k stars): Tauri + Rust 架构参考，24/7 屏幕录制
- **lencx/ChatGPT**: Tauri 桌面应用 UI 参考
- **mem0ai/mem0**: 记忆层设计参考

---

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     ScreenGPT 应用                          │
├─────────────────────────────────────────────────────────────┤
│  [悬浮球窗口]     [聊天窗口]         [区域选择覆盖层]        │
│       ↓               ↓                    ↓                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Tauri 命令层 (Rust)                      │  │
│  │  capture_screenshot | send_chat | search_memory      │  │
│  └──────────────────────────────────────────────────────┘  │
│       ↓               ↓                    ↓                │
│  [截图服务]      [AI 客户端]         [记忆服务]             │
│  (xcap)         (reqwest)          (SQLite+向量)           │
└─────────────────────────────────────────────────────────────┘
        ↓               ↓                    ↓
   本地文件系统    Quotio API          本地 SQLite DB
```

---

## 项目结构

```
ScreenGPT/
├── src/                           # React 前端
│   ├── components/
│   │   ├── FloatingBall/          # 悬浮球组件
│   │   ├── Chat/                  # 聊天界面
│   │   ├── Screenshot/            # 截图相关 (区域选择)
│   │   ├── Projects/              # 项目管理
│   │   └── Settings/              # 设置面板
│   ├── hooks/                     # React hooks
│   ├── stores/                    # Zustand 状态管理
│   ├── lib/                       # 工具函数
│   └── types/                     # TypeScript 类型
│
├── src-tauri/                     # Rust 后端
│   ├── src/
│   │   ├── commands/              # Tauri 命令
│   │   │   ├── screenshot.rs      # 截图命令
│   │   │   ├── chat.rs            # 聊天命令
│   │   │   ├── memory.rs          # 记忆命令
│   │   │   └── projects.rs        # 项目命令
│   │   ├── services/              # 核心服务
│   │   │   ├── screenshot.rs      # xcap 截图
│   │   │   ├── ai_client.rs       # OpenAI API
│   │   │   ├── memory.rs          # 向量搜索
│   │   │   └── embedding.rs       # 嵌入生成
│   │   ├── db/                    # 数据库
│   │   └── models/                # 数据模型
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── package.json
└── vite.config.ts
```

---

## 数据模型

### 数据库 Schema

```sql
-- 项目表
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME
);

-- 对话表
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    title TEXT,
    created_at DATETIME
);

-- 消息表
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    role TEXT NOT NULL,  -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    screenshot_path TEXT,
    created_at DATETIME
);

-- 记忆表 (支持向量搜索)
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    content TEXT NOT NULL,
    source_type TEXT,  -- 'conversation' | 'user_note' | 'auto_extracted'
    source_id TEXT,
    created_at DATETIME
);

-- 向量嵌入表 (sqlite-vec)
CREATE VIRTUAL TABLE memory_embeddings USING vec0(
    memory_id TEXT PRIMARY KEY,
    embedding FLOAT[1536]
);
```

---

## 核心功能实现

### 1. 悬浮球窗口配置

```json
{
  "label": "floating-ball",
  "width": 64,
  "height": 64,
  "alwaysOnTop": true,
  "decorations": false,
  "transparent": true,
  "resizable": false,
  "skipTaskbar": true
}
```

### 2. 快捷键注册

使用 `tauri-plugin-global-shortcut`:
- 默认快捷键: `Cmd+Shift+S`
- 可在设置中自定义

### 3. 截图流程

```
Cmd+Shift+S → 选择模式(全屏/区域) → 截图 → 打开聊天窗口 → 显示截图预览
```

### 4. AI 请求格式 (OpenAI Vision)

```json
{
  "model": "claude-opus-4-5-20251101",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "用户问题"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    ]
  }]
}
```

### 5. API 配置结构

设置面板支持两个独立的 API 端点：

```typescript
interface APISettings {
  // Chat/Vision API (Quotio 代理)
  chatApiBaseUrl: string;      // 例: https://api.quotio.com/v1
  chatApiKey: string;
  defaultModel: string;        // 例: claude-opus-4-5-20251101

  // Embedding API (LM Studio 本地)
  embeddingApiBaseUrl: string; // 例: http://localhost:1234/v1
  embeddingApiKey: string;     // LM Studio 通常不需要
  embeddingModel: string;      // 例: nomic-embed-text
}
```

Embedding 请求格式 (OpenAI 兼容):
```json
POST /v1/embeddings
{
  "model": "nomic-embed-text",
  "input": "要嵌入的文本"
}
```

### 6. 记忆系统流程

```
用户提问 → 向量搜索相关记忆 → 注入上下文 → AI 响应 → 自动提取新记忆
```

---

## 关键依赖

### Rust (Cargo.toml)

```toml
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-global-shortcut = "2"
xcap = "0.0.12"           # 截图
sqlx = "0.7"              # 数据库
reqwest = "0.11"          # HTTP 客户端
image = "0.24"            # 图像处理
base64 = "0.21"
```

### Node.js (package.json)

```json
{
  "@tauri-apps/api": "^2.0.0",
  "@tauri-apps/plugin-global-shortcut": "^2.0.0",
  "react": "^18.3.0",
  "zustand": "^4.5.0",
  "react-markdown": "^9.0.0",
  "react-draggable": "^4.4.6",
  "tailwindcss": "^3.4.0"
}
```

---

## 实现阶段

### Phase 1: 基础框架
- [ ] 初始化 Tauri v2 + React + TypeScript 项目
- [ ] 配置 Tailwind CSS
- [ ] 创建悬浮球窗口 + 聊天窗口
- [ ] 注册全局快捷键 (Cmd+Shift+S)
- [ ] 初始化 SQLite 数据库

### Phase 2: 截图系统
- [ ] 集成 xcap 实现全屏截图
- [ ] 构建区域选择覆盖层 UI
- [ ] 实现区域截图
- [ ] 截图预览组件

### Phase 3: 聊天 + AI
- [ ] 聊天界面 (消息列表、输入框)
- [ ] OpenAI 兼容 API 客户端
- [ ] Vision 请求 (图片 base64)
- [ ] Markdown 渲染 + 代码高亮

### Phase 4: 项目管理
- [ ] 项目 CRUD
- [ ] 项目切换 UI
- [ ] 对话历史持久化
- [ ] 对话搜索

### Phase 5: 记忆系统
- [ ] 集成 sqlite-vec
- [ ] 嵌入生成 (通过 API)
- [ ] 语义搜索
- [ ] 记忆自动提取
- [ ] 记忆浏览 UI

### Phase 6: 完善
- [ ] 设置面板
- [ ] 可拖拽悬浮球
- [ ] 主题切换
- [ ] 错误处理
- [ ] 应用图标 + 托盘

---

## 已知挑战及解决方案

| 挑战 | 解决方案 |
|------|----------|
| macOS 屏幕录制权限 | 检测权限状态，引导用户授权 |
| sqlite-vec 加载 | 打包 dylib，运行时加载扩展 |
| 悬浮球窗口焦点 | 设置 `focusable: false`，使用透明窗口 |
| 大尺寸截图 | 压缩到 2048px，使用 JPEG |
| 记忆上下文过长 | 限制 3-5 条最相关记忆 |

---

## 关键文件清单

1. `src-tauri/src/services/screenshot.rs` - 截图核心逻辑
2. `src-tauri/src/services/ai_client.rs` - API 客户端
3. `src-tauri/src/services/memory.rs` - 记忆服务
4. `src/components/FloatingBall/FloatingBall.tsx` - 悬浮球
5. `src/components/Chat/ChatWindow.tsx` - 聊天界面
