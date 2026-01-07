use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EmbeddingError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
}

#[derive(Debug, Serialize)]
struct EmbeddingRequest {
    model: String,
    input: String,
}

#[derive(Debug, Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Debug, Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
}

pub struct EmbeddingClient {
    client: Client,
    base_url: String,
    api_key: String,
    model: String,
}

impl EmbeddingClient {
    pub fn new(base_url: &str, api_key: &str, model: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
            model: model.to_string(),
        }
    }

    pub async fn embed(&self, text: &str) -> Result<Vec<f32>, EmbeddingError> {
        let request = EmbeddingRequest {
            model: self.model.clone(),
            input: text.to_string(),
        };

        let mut req_builder = self
            .client
            .post(format!("{}/embeddings", self.base_url))
            .header("Content-Type", "application/json")
            .json(&request);

        // Only add auth header if API key is provided (LM Studio often doesn't need it)
        if !self.api_key.is_empty() {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", self.api_key));
        }

        let response = req_builder.send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(EmbeddingError::Api(error_text));
        }

        let embedding_response: EmbeddingResponse = response.json().await?;

        embedding_response
            .data
            .first()
            .map(|d| d.embedding.clone())
            .ok_or_else(|| EmbeddingError::Api("No embedding in response".to_string()))
    }
}
