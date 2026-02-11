/**
 * RuVector Configuration for Huron Grants Management
 *
 * Configures HNSW indexing, self-learning hooks, embedding models,
 * and PostgreSQL connection with pgvector extension.
 */

export interface HNSWIndexConfig {
  /** Maximum number of connections per node (higher = better recall, more memory) */
  m: number;
  /** Size of dynamic candidate list during construction */
  efConstruction: number;
  /** Size of dynamic candidate list during search */
  efSearch: number;
  /** Distance metric: 'cosine' | 'euclidean' | 'inner_product' */
  distanceMetric: 'cosine' | 'euclidean' | 'inner_product';
}

export interface EmbeddingModelConfig {
  /** Model provider: 'openai' | 'anthropic' | 'local' */
  provider: 'openai' | 'anthropic' | 'local';
  /** Model name/identifier */
  modelName: string;
  /** Embedding dimensions */
  dimensions: number;
  /** Maximum tokens per request */
  maxTokens: number;
  /** Batch size for bulk embedding generation */
  batchSize: number;
}

export interface SelfLearningConfig {
  /** Enable continuous learning from user interactions */
  enabled: boolean;
  /** Minimum confidence threshold for auto-learning */
  confidenceThreshold: number;
  /** Number of samples before triggering pattern consolidation */
  consolidationThreshold: number;
  /** Enable trajectory tracking for decision paths */
  trajectoryTracking: boolean;
  /** Learning rate for weight updates */
  learningRate: number;
}

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  /** Enable SSL for production */
  ssl: boolean;
  /** Connection pool size */
  poolSize: number;
  /** Enable Row Level Security for multi-tenancy */
  enableRLS: boolean;
}

export interface RuVectorConfig {
  /** HNSW index configuration */
  hnsw: HNSWIndexConfig;
  /** Embedding model settings */
  embedding: EmbeddingModelConfig;
  /** Self-learning hooks configuration */
  selfLearning: SelfLearningConfig;
  /** PostgreSQL connection settings */
  postgres: PostgresConfig;
  /** Cache settings */
  cache: {
    enabled: boolean;
    ttlSeconds: number;
    maxEntries: number;
  };
}

/**
 * Default RuVector configuration for Huron Grants
 * Optimized for grants document processing and semantic search
 */
export const defaultRuVectorConfig: RuVectorConfig = {
  hnsw: {
    // M=16 provides good balance of recall and performance
    m: 16,
    // Higher efConstruction for better index quality
    efConstruction: 200,
    // efSearch can be tuned at query time (start with 100)
    efSearch: 100,
    // Cosine similarity for normalized embeddings
    distanceMetric: 'cosine',
  },

  embedding: {
    provider: 'openai',
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
    maxTokens: 8191,
    batchSize: 100,
  },

  selfLearning: {
    enabled: true,
    // Only auto-learn from high-confidence predictions
    confidenceThreshold: 0.85,
    // Consolidate patterns after 50 successful interactions
    consolidationThreshold: 50,
    // Track decision paths for explainability
    trajectoryTracking: true,
    // Conservative learning rate for stability
    learningRate: 0.01,
  },

  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'huron_grants',
    user: process.env.POSTGRES_USER || 'huron_admin',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production',
    poolSize: 10,
    enableRLS: true,
  },

  cache: {
    enabled: true,
    ttlSeconds: 3600,
    maxEntries: 10000,
  },
};

/**
 * Self-learning hooks for RuVector integration
 * These hooks enable continuous improvement from user interactions
 */
export const selfLearningHooks = {
  /**
   * Pre-search hook: Enriches query with learned patterns
   */
  preSearch: async (query: string, context: Record<string, unknown>) => {
    // Load relevant patterns from memory
    const patterns = await loadPatterns(query);
    return {
      enrichedQuery: query,
      patterns,
      context,
    };
  },

  /**
   * Post-search hook: Records successful searches for learning
   */
  postSearch: async (
    query: string,
    results: unknown[],
    userFeedback?: { relevant: boolean; selectedIndex?: number }
  ) => {
    if (userFeedback?.relevant) {
      await recordSuccessfulSearch(query, results, userFeedback.selectedIndex);
    }
  },

  /**
   * Document categorization hook: Learns from user corrections
   */
  onCategorization: async (
    documentId: string,
    predictedCategory: string,
    confidence: number,
    userCorrection?: string
  ) => {
    if (userCorrection && userCorrection !== predictedCategory) {
      await recordCorrection(documentId, predictedCategory, userCorrection);
    }
  },

  /**
   * Form extraction hook: Improves field extraction accuracy
   */
  onExtraction: async (
    documentId: string,
    extractedFields: Record<string, unknown>,
    userEdits: Record<string, unknown>
  ) => {
    const corrections = findCorrections(extractedFields, userEdits);
    if (Object.keys(corrections).length > 0) {
      await recordExtractionCorrections(documentId, corrections);
    }
  },
};

/**
 * HNSW index creation SQL for pgvector
 */
export const createHNSWIndexSQL = (
  tableName: string,
  columnName: string,
  config: HNSWIndexConfig = defaultRuVectorConfig.hnsw
): string => {
  const distanceOp = {
    cosine: 'vector_cosine_ops',
    euclidean: 'vector_l2_ops',
    inner_product: 'vector_ip_ops',
  }[config.distanceMetric];

  return `
    CREATE INDEX IF NOT EXISTS idx_${tableName}_${columnName}_hnsw
    ON ${tableName}
    USING hnsw (${columnName} ${distanceOp})
    WITH (m = ${config.m}, ef_construction = ${config.efConstruction});
  `;
};

/**
 * Creates connection string from PostgreSQL config
 */
export const getConnectionString = (config: PostgresConfig = defaultRuVectorConfig.postgres): string => {
  const sslParam = config.ssl ? '?sslmode=require' : '';
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`;
};

// Helper functions (implementations would connect to actual services)
async function loadPatterns(query: string): Promise<unknown[]> {
  // Integration point with claude-flow memory
  // npx @claude-flow/cli@latest memory search --query "${query}" --namespace patterns
  return [];
}

async function recordSuccessfulSearch(
  query: string,
  results: unknown[],
  selectedIndex?: number
): Promise<void> {
  // Store successful pattern for future reference
  // npx @claude-flow/cli@latest memory store --namespace patterns --key "search-${Date.now()}" --value "${JSON.stringify({query, selectedIndex})}"
}

async function recordCorrection(
  documentId: string,
  predicted: string,
  actual: string
): Promise<void> {
  // Record categorization correction for model improvement
  // npx @claude-flow/cli@latest hooks post-task --task-id "categorize-${documentId}" --success false --store-results true
}

async function recordExtractionCorrections(
  documentId: string,
  corrections: Record<string, unknown>
): Promise<void> {
  // Record extraction corrections for field-level learning
  // npx @claude-flow/cli@latest neural train --pattern-type extraction --data "${JSON.stringify(corrections)}"
}

function findCorrections(
  extracted: Record<string, unknown>,
  edited: Record<string, unknown>
): Record<string, { extracted: unknown; corrected: unknown }> {
  const corrections: Record<string, { extracted: unknown; corrected: unknown }> = {};

  for (const [key, editedValue] of Object.entries(edited)) {
    const extractedValue = extracted[key];
    if (JSON.stringify(extractedValue) !== JSON.stringify(editedValue)) {
      corrections[key] = { extracted: extractedValue, corrected: editedValue };
    }
  }

  return corrections;
}

export default defaultRuVectorConfig;
