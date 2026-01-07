use crate::models::Project;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let db = state.db.lock().await;
    db.get_projects().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
) -> Result<Project, String> {
    let db = state.db.lock().await;
    db.create_project(&name, description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(state: State<'_, AppState>, project_id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.delete_project(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_project(
    state: State<'_, AppState>,
    project_id: String,
    name: String,
    description: Option<String>,
) -> Result<Project, String> {
    let db = state.db.lock().await;
    db.update_project(&project_id, &name, description.as_deref())
        .map_err(|e| e.to_string())
}
