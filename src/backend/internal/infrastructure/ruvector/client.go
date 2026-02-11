// Package ruvector provides a client for the RuVector embedding service.
package ruvector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Config contains RuVector client configuration.
type Config struct {
	BaseURL    string        `json:"base_url"`
	APIKey     string        `json:"api_key"`
	Model      string        `json:"model"`
	Timeout    time.Duration `json:"timeout"`
	MaxRetries int           `json:"max_retries"`
}

// DefaultConfig returns default RuVector configuration.
func DefaultConfig() Config {
	return Config{
		BaseURL:    "http://localhost:8080",
		Model:      "text-embedding-3-small",
		Timeout:    30 * time.Second,
		MaxRetries: 3,
	}
}

// Client provides methods for interacting with the RuVector service.
type Client struct {
	config     Config
	httpClient *http.Client
}

// NewClient creates a new RuVector client.
func NewClient(cfg Config) *Client {
	return &Client{
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

// EmbeddingRequest represents an embedding request.
type EmbeddingRequest struct {
	Input []string `json:"input"`
	Model string   `json:"model"`
}

// EmbeddingResponse represents an embedding response.
type EmbeddingResponse struct {
	Object string `json:"object"`
	Data   []struct {
		Object    string    `json:"object"`
		Embedding []float32 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
	Model string `json:"model"`
	Usage struct {
		PromptTokens int `json:"prompt_tokens"`
		TotalTokens  int `json:"total_tokens"`
	} `json:"usage"`
}

// Generate generates an embedding for text.
func (c *Client) Generate(ctx context.Context, text string) ([]float32, error) {
	embeddings, err := c.GenerateBatch(ctx, []string{text})
	if err != nil {
		return nil, err
	}
	if len(embeddings) == 0 {
		return nil, fmt.Errorf("no embeddings returned")
	}
	return embeddings[0], nil
}

// GenerateBatch generates embeddings for multiple texts.
func (c *Client) GenerateBatch(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	req := EmbeddingRequest{
		Input: texts,
		Model: c.config.Model,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	var resp EmbeddingResponse
	if err := c.doRequest(ctx, "POST", "/v1/embeddings", body, &resp); err != nil {
		return nil, err
	}

	// Sort by index and extract embeddings
	embeddings := make([][]float32, len(resp.Data))
	for _, d := range resp.Data {
		embeddings[d.Index] = d.Embedding
	}

	return embeddings, nil
}

// doRequest performs an HTTP request with retries.
func (c *Client) doRequest(ctx context.Context, method, path string, body []byte, result interface{}) error {
	url := c.config.BaseURL + path

	var lastErr error
	for attempt := 0; attempt <= c.config.MaxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			time.Sleep(time.Duration(attempt*attempt) * 100 * time.Millisecond)
		}

		req, err := http.NewRequestWithContext(ctx, method, url, bytes.NewReader(body))
		if err != nil {
			return fmt.Errorf("failed to create request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
		if c.config.APIKey != "" {
			req.Header.Set("Authorization", "Bearer "+c.config.APIKey)
		}

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("request failed: %w", err)
			continue
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = fmt.Errorf("failed to read response: %w", err)
			continue
		}

		if resp.StatusCode >= 500 {
			lastErr = fmt.Errorf("server error: %d - %s", resp.StatusCode, string(respBody))
			continue
		}

		if resp.StatusCode >= 400 {
			return fmt.Errorf("client error: %d - %s", resp.StatusCode, string(respBody))
		}

		if err := json.Unmarshal(respBody, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}

		return nil
	}

	return lastErr
}

// HealthCheck checks the health of the RuVector service.
func (c *Client) HealthCheck(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", c.config.BaseURL+"/health", nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unhealthy: status %d", resp.StatusCode)
	}

	return nil
}

// GetModel returns the configured model name.
func (c *Client) GetModel() string {
	return c.config.Model
}

// GetDimensions returns the embedding dimensions for the configured model.
func (c *Client) GetDimensions() int {
	// Return dimensions based on model
	switch c.config.Model {
	case "text-embedding-3-small":
		return 1536
	case "text-embedding-3-large":
		return 3072
	case "text-embedding-ada-002":
		return 1536
	default:
		return 1536
	}
}
