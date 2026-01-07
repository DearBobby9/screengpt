use crate::models::{Conversation, Message};
use crate::services::ai_client::{AIClient, ChatMessage, ContentPart};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn send_message(
    state: State<'_, AppState>,
    conversation_id: String,
    content: String,
    screenshot: Option<String>,
    api_base_url: String,
    api_key: String,
    model: String,
) -> Result<Message, String> {
    let db = state.db.lock().await;

    // Save user message
    let _user_message = db
        .add_message(&conversation_id, "user", &content, screenshot.as_deref())
        .map_err(|e| e.to_string())?;

    // Get conversation history
    let messages = db
        .get_messages(&conversation_id)
        .map_err(|e| e.to_string())?;

    // Build chat messages for API
    let mut chat_messages: Vec<ChatMessage> = Vec::new();

    for msg in &messages {
        let mut parts = vec![ContentPart::Text {
            text: msg.content.clone(),
        }];

        if let Some(ref screenshot_data) = msg.screenshot_path {
            parts.push(ContentPart::ImageUrl {
                image_url: crate::services::ai_client::ImageUrl {
                    url: format!("data:image/png;base64,{}", screenshot_data),
                },
            });
        }

        chat_messages.push(ChatMessage {
            role: msg.role.clone(),
            content: parts,
        });
    }

    drop(db); // Release lock before API call

    // Call AI API
    let client = AIClient::new(&api_base_url, &api_key);
    let response = client
        .chat(&model, chat_messages)
        .await
        .map_err(|e| e.to_string())?;

    // Save assistant message
    let db = state.db.lock().await;
    let assistant_message = db
        .add_message(&conversation_id, "assistant", &response, None)
        .map_err(|e| e.to_string())?;

    // Update conversation title if it's the first exchange
    if messages.len() <= 2 {
        let title = if content.len() > 50 {
            format!("{}...", &content[..50])
        } else {
            content.clone()
        };
        let _ = db.update_conversation_title(&conversation_id, &title);
    }

    Ok(assistant_message)
}

#[tauri::command]
pub async fn get_conversations(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Conversation>, String> {
    let db = state.db.lock().await;
    db.get_conversations(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_messages(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<Vec<Message>, String> {
    let db = state.db.lock().await;
    db.get_messages(&conversation_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_conversation(
    state: State<'_, AppState>,
    project_id: String,
    title: Option<String>,
) -> Result<Conversation, String> {
    let db = state.db.lock().await;
    db.create_conversation(&project_id, title.as_deref())
        .map_err(|e| e.to_string())
}
