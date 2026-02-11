// Package ruvector provides embedding generation utilities.
package ruvector

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/huron-bangalore/grants-management/internal/application/ports"
)

// EmbeddingGenerator implements the ports.EmbeddingGenerator interface.
type EmbeddingGenerator struct {
	client    *Client
	cache     *EmbeddingCache
	batchSize int
}

// NewEmbeddingGenerator creates a new embedding generator.
func NewEmbeddingGenerator(client *Client, cacheSize int) *EmbeddingGenerator {
	return &EmbeddingGenerator{
		client:    client,
		cache:     NewEmbeddingCache(cacheSize),
		batchSize: 100, // Max batch size for API
	}
}

// Generate generates an embedding for text.
func (g *EmbeddingGenerator) Generate(ctx context.Context, text string) ([]float32, error) {
	// Normalize text
	text = normalizeText(text)
	if text == "" {
		return nil, fmt.Errorf("empty text")
	}

	// Check cache
	if embedding, ok := g.cache.Get(text); ok {
		return embedding, nil
	}

	// Generate embedding
	embedding, err := g.client.Generate(ctx, text)
	if err != nil {
		return nil, err
	}

	// Cache result
	g.cache.Set(text, embedding)

	return embedding, nil
}

// GenerateBatch generates embeddings for multiple texts.
func (g *EmbeddingGenerator) GenerateBatch(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	// Normalize texts and track cache hits
	normalized := make([]string, len(texts))
	results := make([][]float32, len(texts))
	uncachedIndices := make([]int, 0)
	uncachedTexts := make([]string, 0)

	for i, text := range texts {
		normalized[i] = normalizeText(text)
		if embedding, ok := g.cache.Get(normalized[i]); ok {
			results[i] = embedding
		} else {
			uncachedIndices = append(uncachedIndices, i)
			uncachedTexts = append(uncachedTexts, normalized[i])
		}
	}

	// Generate embeddings for uncached texts in batches
	for start := 0; start < len(uncachedTexts); start += g.batchSize {
		end := start + g.batchSize
		if end > len(uncachedTexts) {
			end = len(uncachedTexts)
		}

		batchTexts := uncachedTexts[start:end]
		batchEmbeddings, err := g.client.GenerateBatch(ctx, batchTexts)
		if err != nil {
			return nil, fmt.Errorf("batch generation failed: %w", err)
		}

		// Store results and cache
		for j, embedding := range batchEmbeddings {
			idx := uncachedIndices[start+j]
			results[idx] = embedding
			g.cache.Set(normalized[idx], embedding)
		}
	}

	return results, nil
}

// normalizeText normalizes text for consistent embedding generation.
func normalizeText(text string) string {
	// Trim whitespace
	text = strings.TrimSpace(text)

	// Replace multiple spaces with single space
	text = strings.Join(strings.Fields(text), " ")

	// Convert to lowercase for caching consistency
	text = strings.ToLower(text)

	// Limit length (most embedding models have token limits)
	const maxChars = 8000
	if len(text) > maxChars {
		text = text[:maxChars]
	}

	return text
}

// EmbeddingCache provides a thread-safe LRU cache for embeddings.
type EmbeddingCache struct {
	mu       sync.RWMutex
	cache    map[string]*cacheEntry
	order    []string
	maxSize  int
}

type cacheEntry struct {
	embedding []float32
}

// NewEmbeddingCache creates a new embedding cache.
func NewEmbeddingCache(maxSize int) *EmbeddingCache {
	if maxSize <= 0 {
		maxSize = 1000
	}
	return &EmbeddingCache{
		cache:   make(map[string]*cacheEntry),
		order:   make([]string, 0, maxSize),
		maxSize: maxSize,
	}
}

// Get retrieves an embedding from the cache.
func (c *EmbeddingCache) Get(key string) ([]float32, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if entry, ok := c.cache[key]; ok {
		return entry.embedding, true
	}
	return nil, false
}

// Set stores an embedding in the cache.
func (c *EmbeddingCache) Set(key string, embedding []float32) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Check if already exists
	if _, ok := c.cache[key]; ok {
		c.cache[key].embedding = embedding
		return
	}

	// Evict oldest if at capacity
	if len(c.order) >= c.maxSize {
		oldest := c.order[0]
		delete(c.cache, oldest)
		c.order = c.order[1:]
	}

	// Add new entry
	c.cache[key] = &cacheEntry{embedding: embedding}
	c.order = append(c.order, key)
}

// Size returns the current cache size.
func (c *EmbeddingCache) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return len(c.cache)
}

// Clear clears the cache.
func (c *EmbeddingCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache = make(map[string]*cacheEntry)
	c.order = make([]string, 0, c.maxSize)
}

// Ensure EmbeddingGenerator implements the interface
var _ ports.EmbeddingGenerator = (*EmbeddingGenerator)(nil)

// ProposalEmbeddingBuilder builds embeddings for proposals.
type ProposalEmbeddingBuilder struct {
	generator *EmbeddingGenerator
}

// NewProposalEmbeddingBuilder creates a new proposal embedding builder.
func NewProposalEmbeddingBuilder(generator *EmbeddingGenerator) *ProposalEmbeddingBuilder {
	return &ProposalEmbeddingBuilder{generator: generator}
}

// BuildProposalText builds the text to embed for a proposal.
func (b *ProposalEmbeddingBuilder) BuildProposalText(title, abstract string, keywords []string) string {
	var parts []string

	if title != "" {
		parts = append(parts, "Title: "+title)
	}

	if abstract != "" {
		parts = append(parts, "Abstract: "+abstract)
	}

	if len(keywords) > 0 {
		parts = append(parts, "Keywords: "+strings.Join(keywords, ", "))
	}

	return strings.Join(parts, "\n\n")
}

// GenerateProposalEmbedding generates an embedding for a proposal.
func (b *ProposalEmbeddingBuilder) GenerateProposalEmbedding(ctx context.Context, title, abstract string, keywords []string) ([]float32, error) {
	text := b.BuildProposalText(title, abstract, keywords)
	return b.generator.Generate(ctx, text)
}

// SimilarityCalculator provides similarity calculation utilities.
type SimilarityCalculator struct{}

// CosineSimilarity calculates the cosine similarity between two vectors.
func (sc *SimilarityCalculator) CosineSimilarity(a, b []float32) float64 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float64
	for i := range a {
		dotProduct += float64(a[i]) * float64(b[i])
		normA += float64(a[i]) * float64(a[i])
		normB += float64(b[i]) * float64(b[i])
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (sqrt(normA) * sqrt(normB))
}

// sqrt calculates the square root.
func sqrt(x float64) float64 {
	if x <= 0 {
		return 0
	}
	z := x / 2
	for i := 0; i < 10; i++ {
		z = z - (z*z-x)/(2*z)
	}
	return z
}

// EuclideanDistance calculates the Euclidean distance between two vectors.
func (sc *SimilarityCalculator) EuclideanDistance(a, b []float32) float64 {
	if len(a) != len(b) {
		return 0
	}

	var sum float64
	for i := range a {
		diff := float64(a[i]) - float64(b[i])
		sum += diff * diff
	}

	return sqrt(sum)
}
