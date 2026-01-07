mod schema;

use crate::models::{Conversation, Memory, Message, Project};
use rusqlite::{params, Connection};
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("Not found: {0}")]
    NotFound(String),
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, DbError> {
        let conn = Connection::open(path)?;
        // Enable foreign key support (required for CASCADE to work)
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        let db = Self { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<(), DbError> {
        self.conn.execute_batch(schema::SCHEMA)?;
        Ok(())
    }

    // Projects
    pub fn get_projects(&self) -> Result<Vec<Project>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, created_at, updated_at FROM projects ORDER BY updated_at DESC",
        )?;

        let projects = stmt
            .query_map([], |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(projects)
    }

    pub fn create_project(&self, name: &str, description: Option<&str>) -> Result<Project, DbError> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, description, now, now],
        )?;

        Ok(Project {
            id,
            name: name.to_string(),
            description: description.map(String::from),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_project(&self, id: &str, name: &str, description: Option<&str>) -> Result<Project, DbError> {
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "UPDATE projects SET name = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
            params![name, description, now, id],
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?1",
        )?;

        let project = stmt.query_row([id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        Ok(project)
    }

    pub fn delete_project(&self, id: &str) -> Result<(), DbError> {
        self.conn.execute("DELETE FROM projects WHERE id = ?1", [id])?;
        Ok(())
    }

    // Conversations
    pub fn get_conversations(&self, project_id: &str) -> Result<Vec<Conversation>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, title, created_at, updated_at FROM conversations WHERE project_id = ?1 ORDER BY updated_at DESC",
        )?;

        let conversations = stmt
            .query_map([project_id], |row| {
                Ok(Conversation {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    title: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(conversations)
    }

    pub fn create_conversation(&self, project_id: &str, title: Option<&str>) -> Result<Conversation, DbError> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO conversations (id, project_id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, project_id, title, now, now],
        )?;

        Ok(Conversation {
            id,
            project_id: project_id.to_string(),
            title: title.map(String::from),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_conversation_title(&self, id: &str, title: &str) -> Result<(), DbError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
        Ok(())
    }

    // Messages
    pub fn get_messages(&self, conversation_id: &str) -> Result<Vec<Message>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, conversation_id, role, content, screenshot_path, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC",
        )?;

        let messages = stmt
            .query_map([conversation_id], |row| {
                Ok(Message {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    screenshot_path: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(messages)
    }

    pub fn add_message(
        &self,
        conversation_id: &str,
        role: &str,
        content: &str,
        screenshot_path: Option<&str>,
    ) -> Result<Message, DbError> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, screenshot_path, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, conversation_id, role, content, screenshot_path, now],
        )?;

        // Update conversation timestamp
        self.conn.execute(
            "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
            params![now, conversation_id],
        )?;

        Ok(Message {
            id,
            conversation_id: conversation_id.to_string(),
            role: role.to_string(),
            content: content.to_string(),
            screenshot_path: screenshot_path.map(String::from),
            created_at: now,
        })
    }

    // Memories
    pub fn get_memories(&self, project_id: &str) -> Result<Vec<Memory>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, content, source_type, source_id, created_at FROM memories WHERE project_id = ?1 ORDER BY created_at DESC",
        )?;

        let memories = stmt
            .query_map([project_id], |row| {
                Ok(Memory {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    content: row.get(2)?,
                    source_type: row.get(3)?,
                    source_id: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(memories)
    }

    pub fn add_memory(
        &self,
        project_id: &str,
        content: &str,
        source_type: &str,
        source_id: Option<&str>,
    ) -> Result<Memory, DbError> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO memories (id, project_id, content, source_type, source_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, project_id, content, source_type, source_id, now],
        )?;

        Ok(Memory {
            id,
            project_id: project_id.to_string(),
            content: content.to_string(),
            source_type: source_type.to_string(),
            source_id: source_id.map(String::from),
            created_at: now,
        })
    }

    pub fn search_memories(&self, project_id: &str, query: &str, limit: usize) -> Result<Vec<Memory>, DbError> {
        // Simple text search for now. Vector search will be added later.
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, content, source_type, source_id, created_at FROM memories WHERE project_id = ?1 AND content LIKE ?2 ORDER BY created_at DESC LIMIT ?3",
        )?;

        let memories = stmt
            .query_map(params![project_id, search_pattern, limit as i64], |row| {
                Ok(Memory {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    content: row.get(2)?,
                    source_type: row.get(3)?,
                    source_id: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(memories)
    }

    pub fn delete_memory(&self, id: &str) -> Result<(), DbError> {
        self.conn.execute("DELETE FROM memories WHERE id = ?1", [id])?;
        Ok(())
    }
}
