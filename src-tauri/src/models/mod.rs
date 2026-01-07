use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub project_id: String,
    pub title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub screenshot_path: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memory {
    pub id: String,
    pub project_id: String,
    pub content: String,
    pub source_type: String,
    pub source_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub chat_api_base_url: String,
    pub chat_api_key: String,
    pub default_model: String,
    pub embedding_api_base_url: String,
    pub embedding_api_key: String,
    pub embedding_model: String,
    pub hotkey: String,
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            chat_api_base_url: "https://api.openai.com/v1".to_string(),
            chat_api_key: String::new(),
            default_model: "gpt-4o".to_string(),
            embedding_api_base_url: "http://localhost:1234/v1".to_string(),
            embedding_api_key: String::new(),
            embedding_model: "nomic-embed-text".to_string(),
            hotkey: "CommandOrControl+Shift+S".to_string(),
            theme: "system".to_string(),
        }
    }
}
