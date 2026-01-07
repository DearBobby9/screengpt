use crate::models::Memory;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn search_memories(
    state: State<'_, AppState>,
    project_id: String,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<Memory>, String> {
    let db = state.db.lock().await;
    // For now, simple text search. Vector search will be added later.
    db.search_memories(&project_id, &query, limit.unwrap_or(5))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_memory(
    state: State<'_, AppState>,
    project_id: String,
    content: String,
    source_type: String,
    source_id: Option<String>,
) -> Result<Memory, String> {
    let db = state.db.lock().await;
    db.add_memory(&project_id, &content, &source_type, source_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_memories(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Memory>, String> {
    let db = state.db.lock().await;
    db.get_memories(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_memory(state: State<'_, AppState>, memory_id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.delete_memory(&memory_id).map_err(|e| e.to_string())
}
