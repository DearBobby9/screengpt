pub mod commands;
pub mod db;
pub mod models;
pub mod services;

use commands::{chat, memory, projects, screenshot};
use db::Database;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Initialize database
            let app_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");

            let db_path = app_dir.join("screengpt.db");
            let db = Database::new(&db_path).expect("Failed to initialize database");

            app.manage(AppState {
                db: Arc::new(Mutex::new(db)),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            screenshot::capture_full_screen,
            screenshot::capture_region,
            chat::send_message,
            chat::get_conversations,
            chat::get_messages,
            chat::create_conversation,
            projects::get_projects,
            projects::create_project,
            projects::delete_project,
            projects::update_project,
            memory::search_memories,
            memory::add_memory,
            memory::get_memories,
            memory::delete_memory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
