# ADR-008: RuVector Self-Learning Vector Intelligence Integration

## Status
Proposed

## Date
2026-01-25

## Authors
- System Architecture Team
- AI/ML Engineering Team

---

## Executive Summary

This ADR proposes a state-of-the-art (SOTA) architecture integrating **RuVector** self-learning vector intelligence, **Claude-Flow** multi-agent orchestration, **Agentic-Flow** specialized agents, **WASM components** for edge deployment, and **RuVector-Postgres** for enterprise-grade vector storage into the Huron Grants Management System.

---

## 1. Context and Problem Statement

### 1.1 Current State Challenges

The HRS Grants Module handles complex grant lifecycle management with:
- **5000+ SaaS tenants** with 500 concurrent users per tenant
- **21 proposal states** and **26 award states** in state machines
- **7 bounded contexts** with complex inter-context relationships
- Integration with external systems (Grants.gov, finance, HR)

**Critical Pain Points:**

| Challenge | Impact | Current Solution Gap |
|-----------|--------|---------------------|
| Proposal similarity detection | Duplicate work across institutions | None - manual review only |
| Budget pattern learning | Inconsistent budget estimations | Static templates |
| Compliance requirement matching | Missed compliance items | Manual checklist review |
| Sponsor requirement alignment | Proposal rejections | Ad-hoc knowledge sharing |
| Cross-tenant knowledge isolation | No shared learnings | Complete data isolation |
| Offline field researcher support | Connectivity-dependent workflows | No offline capability |
| Search latency | >500ms for complex queries | Basic PostgreSQL full-text |

### 1.2 Business Requirements

1. **Proposal Intelligence**: Find similar successful proposals to guide new submissions
2. **Budget Optimization**: Learn from successful budget patterns across sponsors
3. **Compliance Prediction**: Proactively suggest compliance requirements
4. **Submission Success Prediction**: Score proposals before submission
5. **Offline Capability**: Support field researchers with limited connectivity
6. **Performance**: Sub-500ms latency for all vector operations
7. **Privacy**: Multi-tenant data isolation with shared learning capabilities

### 1.3 Technical Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Vector Search Latency | <0.5ms (p99) | Real-time UX during proposal editing |
| Similarity Matching | >0.95 recall@10 | High-quality recommendations |
| Embedding Generation | <100ms per document | Batch processing efficiency |
| Offline Functionality | 100% feature parity | Field researcher support |
| Multi-tenant Isolation | Zero cross-tenant leakage | FedRamp/SOC2 compliance |
| Model Update Frequency | Continuous learning | Adapt to changing patterns |

---

## 2. Decision

We will implement a **Self-Learning Vector Intelligence Architecture** using:

1. **RuVector Intelligence System** - Core vector search with HNSW indexing and self-learning
2. **Claude-Flow Orchestration** - Multi-agent coordination for complex workflows
3. **Agentic-Flow Agents** - 66 specialized self-learning agents with SONA routing
4. **WASM Vector Engine** - Client-side search for offline/edge deployment
5. **RuVector-Postgres** - Enterprise pgvector with 77+ SQL functions

### 2.1 High-Level Architecture

```
+-----------------------------------------------------------------------------------+
|                           HURON GRANTS MANAGEMENT SYSTEM                           |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +------------------+    +------------------+    +------------------+             |
|  |   CLIENT LAYER   |    |   API GATEWAY    |    | ADMIN CONSOLE    |             |
|  |  (React/Next.js) |    |  (Kong/Envoy)    |    |  (Internal)      |             |
|  +--------+---------+    +--------+---------+    +--------+---------+             |
|           |                       |                       |                        |
|           |    +------------------+------------------+    |                        |
|           |    |                                     |    |                        |
|           v    v                                     v    v                        |
|  +--------+----+-------------------------------------+----+--------+              |
|  |                    INTELLIGENCE LAYER                           |              |
|  |  +----------------------------------------------------------+  |              |
|  |  |                 RUVECTOR INTELLIGENCE                     |  |              |
|  |  |  +----------------+  +----------------+  +-------------+  |  |              |
|  |  |  |  SONA Engine   |  |  MoE Router    |  | EWC++ Core  |  |  |              |
|  |  |  | (<0.05ms adapt)|  | (Expert Select)|  | (No Forget) |  |  |              |
|  |  |  +----------------+  +----------------+  +-------------+  |  |              |
|  |  |  +----------------+  +----------------+  +-------------+  |  |              |
|  |  |  | Flash Attention|  | HNSW Index     |  | LoRA Distill|  |  |              |
|  |  |  | (2.49-7.47x)   |  | (150x-12500x)  |  | (Learning)  |  |  |              |
|  |  |  +----------------+  +----------------+  +-------------+  |  |              |
|  |  +----------------------------------------------------------+  |              |
|  +----------------------------------------------------------------+              |
|           |                       |                       |                        |
|           v                       v                       v                        |
|  +------------------+    +------------------+    +------------------+             |
|  | CLAUDE-FLOW      |    | AGENTIC-FLOW    |    | EMBEDDING        |             |
|  | ORCHESTRATION    |    | AGENTS (66)      |    | SERVICE          |             |
|  | +-------------+  |    | +--------------+ |    | +-------------+  |             |
|  | |Hierarchical |  |    | |Proposal Agent| |    | |ONNX Runtime |  |             |
|  | |Swarm Coord  |  |    | |Budget Agent  | |    | |75x Faster   |  |             |
|  | +-------------+  |    | |Compliance Agt| |    | +-------------+  |             |
|  | |Memory-      |  |    | |Search Agent  | |    | |Multi-Modal  |  |             |
|  | |Enhanced Dev |  |    | |Learning Agent| |    | |Embeddings   |  |             |
|  | +-------------+  |    | +--------------+ |    | +-------------+  |             |
|  +------------------+    +------------------+    +------------------+             |
|           |                       |                       |                        |
+-----------|--------------------|-----------------------|--------------------------+
            |                    |                       |
            v                    v                       v
+-----------------------------------------------------------------------------------+
|                            DATA & STORAGE LAYER                                    |
|  +------------------------------------------------------------------+            |
|  |                    RUVECTOR-POSTGRES                              |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  |  | pgvector 0.8+    |  | 77+ SQL Funcs    |  | SIMD Optimized   | |            |
|  |  | HNSW + IVFFlat   |  | Similarity Ops   |  | AVX-512/NEON     | |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  |  | Multi-tenant RLS |  | Binary Quantize  |  | Hybrid Search    | |            |
|  |  | Zero Leakage     |  | 32x Compression  |  | Vector + FTS     | |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  +------------------------------------------------------------------+            |
|           |                       |                       |                        |
|  +--------+-----------------------+-----------------------+--------+             |
|  |                    POSTGRESQL CLUSTER                           |             |
|  |  +------------------+  +------------------+  +------------------+|             |
|  |  | proposals        |  | embeddings       |  | learning_state   ||             |
|  |  | budgets          |  | similarity_cache |  | agent_memory     ||             |
|  |  | awards           |  | pattern_store    |  | trajectory_log   ||             |
|  |  +------------------+  +------------------+  +------------------+|             |
|  +----------------------------------------------------------------+             |
+-----------------------------------------------------------------------------------+
            |
            v
+-----------------------------------------------------------------------------------+
|                           WASM EDGE DEPLOYMENT                                     |
|  +------------------------------------------------------------------+            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  |  | WASM Vector      |  | Offline-First    |  | IndexedDB        | |            |
|  |  | Search Engine    |  | Grant Editor     |  | Vector Cache     | |            |
|  |  | (sql.js + HNSW)  |  | (Service Worker) |  | (Persistent)     | |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  |  | Sync Protocol    |  | Conflict         |  | Delta            | |            |
|  |  | (CRDT-based)     |  | Resolution       |  | Compression      | |            |
|  |  +------------------+  +------------------+  +------------------+ |            |
|  +------------------------------------------------------------------+            |
+-----------------------------------------------------------------------------------+
```

### 2.2 Component Architecture

#### 2.2.1 RuVector Intelligence System

```
+-----------------------------------------------------------------------------------+
|                        RUVECTOR INTELLIGENCE SYSTEM                                |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------------- 4-STEP PIPELINE ----------------------------+      |
|  |                                                                          |      |
|  |  [1] RETRIEVE          [2] JUDGE           [3] DISTILL      [4] CONSOLIDATE|   |
|  |  +---------------+    +---------------+    +-------------+  +-------------+ |   |
|  |  | HNSW Search   |    | Verdict       |    | LoRA        |  | EWC++       | |   |
|  |  | 150x-12500x   |--->| Evaluation    |--->| Extraction  |->| Memory      | |   |
|  |  | Faster        |    | Success/Fail  |    | Key Learning|  | Protection  | |   |
|  |  +---------------+    +---------------+    +-------------+  +-------------+ |   |
|  |                                                                          |      |
|  +--------------------------------------------------------------------------+      |
|                                                                                    |
|  +---------------------------- CORE COMPONENTS -----------------------------+      |
|  |                                                                          |      |
|  |  SONA: Self-Optimizing Neural Architecture                               |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |  | - Adaptation latency: <0.05ms                                      |  |      |
|  |  | - Real-time query optimization                                     |  |      |
|  |  | - Dynamic index restructuring                                      |  |      |
|  |  | - Automatic hyperparameter tuning                                  |  |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |                                                                          |      |
|  |  MoE: Mixture of Experts                                                 |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |  | Expert 1: Proposal Similarity (semantic)                           |  |      |
|  |  | Expert 2: Budget Pattern (numerical + semantic)                    |  |      |
|  |  | Expert 3: Compliance Matching (rule-based + semantic)              |  |      |
|  |  | Expert 4: Sponsor Alignment (domain-specific)                      |  |      |
|  |  | Expert 5: Timeline Prediction (temporal)                           |  |      |
|  |  | Expert 6: Cross-tenant Learning (federated)                        |  |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |                                                                          |      |
|  |  HNSW Index Configuration                                                |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |  | M = 32 (connections per layer)                                     |  |      |
|  |  | ef_construction = 200 (build-time accuracy)                        |  |      |
|  |  | ef_search = 100 (query-time accuracy)                              |  |      |
|  |  | Distance: Cosine (normalized) / L2 (raw)                           |  |      |
|  |  | Quantization: Binary (32x compression) / Scalar (4x)               |  |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |                                                                          |      |
|  +--------------------------------------------------------------------------+      |
+-----------------------------------------------------------------------------------+
```

#### 2.2.2 Claude-Flow Orchestration Layer

```
+-----------------------------------------------------------------------------------+
|                      CLAUDE-FLOW ORCHESTRATION LAYER                               |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------------- SWARM TOPOLOGY ------------------------------+      |
|  |                                                                          |      |
|  |                        +-------------------+                             |      |
|  |                        |   QUEEN AGENT     |                             |      |
|  |                        | (Hierarchical     |                             |      |
|  |                        |  Coordinator)     |                             |      |
|  |                        +--------+----------+                             |      |
|  |                                 |                                        |      |
|  |            +--------------------+--------------------+                   |      |
|  |            |                    |                    |                   |      |
|  |   +--------v--------+  +--------v--------+  +--------v--------+         |      |
|  |   | PROPOSAL SWARM  |  |  BUDGET SWARM   |  | COMPLIANCE SWARM|         |      |
|  |   | +-----------+   |  | +-----------+   |  | +-----------+   |         |      |
|  |   | |Similarity |   |  | |Pattern    |   |  | |Requirement|   |         |      |
|  |   | |Agent      |   |  | |Learning   |   |  | |Matching   |   |         |      |
|  |   | +-----------+   |  | +-----------+   |  | +-----------+   |         |      |
|  |   | |Draft      |   |  | |Estimation |   |  | |IRB Agent  |   |         |      |
|  |   | |Assistant  |   |  | |Agent      |   |  | +-----------+   |         |      |
|  |   | +-----------+   |  | +-----------+   |  | |IACUC Agent|   |         |      |
|  |   | |Review     |   |  | |Optimization|  |  | +-----------+   |         |      |
|  |   | |Predictor  |   |  | |Agent      |   |  | |Export Ctrl|   |         |      |
|  |   | +-----------+   |  | +-----------+   |  | +-----------+   |         |      |
|  |   +-----------------+  +-----------------+  +-----------------+         |      |
|  |                                                                          |      |
|  +--------------------------------------------------------------------------+      |
|                                                                                    |
|  +---------------------------- MEMORY SYSTEM --------------------------------+     |
|  |                                                                          |      |
|  |  +----------------+  +----------------+  +----------------+              |      |
|  |  | Session Memory |  | Long-term      |  | Pattern        |              |      |
|  |  | (Per-request)  |  | Memory (HNSW)  |  | Memory (MoE)   |              |      |
|  |  +----------------+  +----------------+  +----------------+              |      |
|  |  | TTL: 30min     |  | TTL: Permanent |  | TTL: Adaptive  |              |      |
|  |  | Scope: User    |  | Scope: Tenant  |  | Scope: Global  |              |      |
|  |  +----------------+  +----------------+  +----------------+              |      |
|  |                                                                          |      |
|  +--------------------------------------------------------------------------+      |
|                                                                                    |
|  +---------------------------- HOOKS SYSTEM ---------------------------------+     |
|  |                                                                          |      |
|  |  Pre-Task Hooks:                                                         |      |
|  |  - proposal.before_create: Check similar proposals                       |      |
|  |  - budget.before_update: Validate against patterns                       |      |
|  |  - compliance.before_submit: Verify all requirements                     |      |
|  |                                                                          |      |
|  |  Post-Task Hooks:                                                        |      |
|  |  - proposal.after_submit: Update similarity index                        |      |
|  |  - award.after_receive: Train budget patterns                            |      |
|  |  - compliance.after_approve: Update compliance patterns                  |      |
|  |                                                                          |      |
|  |  Background Workers:                                                     |      |
|  |  - ultralearn: Deep pattern acquisition from successful grants           |      |
|  |  - optimize: HNSW index optimization                                     |      |
|  |  - consolidate: EWC++ memory consolidation                               |      |
|  |  - audit: Security pattern analysis                                      |      |
|  |                                                                          |      |
|  +--------------------------------------------------------------------------+      |
+-----------------------------------------------------------------------------------+
```

#### 2.2.3 Agentic-Flow Specialized Agents

```
+-----------------------------------------------------------------------------------+
|                      AGENTIC-FLOW SPECIALIZED AGENTS (66 TYPES)                    |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------------- GRANT-SPECIFIC AGENTS ------------------------+    |
|  |                                                                           |    |
|  |  PROPOSAL AGENTS                                                          |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | proposal-similarity-agent      | Semantic similarity search        |   |    |
|  |  | proposal-draft-assistant       | AI-assisted proposal writing      |   |    |
|  |  | proposal-review-predictor      | Submission success scoring        |   |    |
|  |  | proposal-gap-analyzer          | Missing section detection         |   |    |
|  |  | proposal-sponsor-matcher       | Best sponsor recommendations      |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  BUDGET AGENTS                                                            |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | budget-pattern-learner         | Learn from successful budgets     |   |    |
|  |  | budget-estimator               | Cost estimation from patterns     |   |    |
|  |  | budget-optimizer               | F&A optimization suggestions      |   |    |
|  |  | budget-anomaly-detector        | Unusual cost detection            |   |    |
|  |  | budget-compliance-checker      | Sponsor limit validation          |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  COMPLIANCE AGENTS                                                        |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | compliance-requirement-matcher | Auto-detect required compliance   |   |    |
|  |  | compliance-irb-advisor         | Human subjects guidance           |   |    |
|  |  | compliance-iacuc-advisor       | Animal subjects guidance          |   |    |
|  |  | compliance-export-advisor      | Export control detection          |   |    |
|  |  | compliance-coi-advisor         | Conflict of interest analysis     |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
|                                                                                    |
|  +---------------------------- SONA ROUTING --------------------------------+     |
|  |                                                                          |      |
|  |  Adaptive Routing via Self-Optimizing Neural Architecture                |      |
|  |                                                                          |      |
|  |  Query Analysis:                                                         |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |  | Input: User query + context                                        |  |      |
|  |  | Process: SONA neural classification (<0.05ms)                      |  |      |
|  |  | Output: Optimal agent selection + confidence score                 |  |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |                                                                          |      |
|  |  Routing Rules:                                                          |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |  | Confidence > 0.9: Direct route to primary agent                    |  |      |
|  |  | Confidence 0.7-0.9: Route to primary + secondary verification      |  |      |
|  |  | Confidence < 0.7: Ensemble routing (top-3 agents)                  |  |      |
|  |  +-------------------------------------------------------------------+  |      |
|  |                                                                          |      |
|  +--------------------------------------------------------------------------+      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Self-Learning Data Flows

### 3.1 Proposal Similarity Learning Flow

```
+-----------------------------------------------------------------------------------+
|                     PROPOSAL SIMILARITY LEARNING FLOW                              |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  [1] PROPOSAL CREATION                                                             |
|  +----------------+     +------------------+     +--------------------+            |
|  | User creates   |---->| Embedding Service|---->| Store in pgvector  |            |
|  | new proposal   |     | (ONNX, 75x fast) |     | with tenant_id RLS |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Extract:       |     | Generate:        |     | Index:             |            |
|  | - Title        |     | - 1536-dim embed |     | - HNSW M=32        |            |
|  | - Abstract     |     | - Chunk overlaps |     | - ef_construct=200 |            |
|  | - Aims         |     | - Multi-modal    |     | - Binary quantize  |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
|  [2] SIMILARITY SEARCH (Real-time, <0.5ms)                                         |
|  +----------------+     +------------------+     +--------------------+            |
|  | Query: "Find   |---->| HNSW ANN Search  |---->| Return top-K       |            |
|  | similar NIH    |     | with tenant RLS  |     | with distances     |            |
|  | proposals"     |     | ef_search=100    |     | + metadata         |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Filters:       |     | Ranking:         |     | Results:           |            |
|  | - Sponsor type |     | - Cosine dist    |     | - Proposal IDs     |            |
|  | - Status       |     | - Recency boost  |     | - Similarity %     |            |
|  | - Date range   |     | - Success weight |     | - Section matches  |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
|  [3] LEARNING FEEDBACK LOOP                                                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | User selects   |---->| Record verdict   |---->| LoRA fine-tune     |            |
|  | helpful match  |     | (positive/neg)   |     | embedding model    |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Implicit:      |     | Store in:        |     | Update:            |            |
|  | - Click-through|     | - trajectory_log |     | - MoE expert 1     |            |
|  | - Time on page |     | - verdict_table  |     | - HNSW weights     |            |
|  | - Copy actions |     | - pattern_store  |     | - EWC++ consolidate|            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

### 3.2 Budget Pattern Recognition Flow

```
+-----------------------------------------------------------------------------------+
|                      BUDGET PATTERN RECOGNITION FLOW                               |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  [1] BUDGET PATTERN EXTRACTION                                                     |
|  +----------------+     +------------------+     +--------------------+            |
|  | Award received |---->| Extract patterns |---->| Vectorize patterns |            |
|  | (Success event)|     | from budget      |     | for similarity     |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Context:       |     | Patterns:        |     | Embedding:         |            |
|  | - Sponsor      |     | - Personnel %    |     | - Budget structure |            |
|  | - Award type   |     | - Equipment %    |     | - Cost ratios      |            |
|  | - Institution  |     | - F&A calculation|     | - Sponsor norms    |            |
|  | - PI history   |     | - Cost sharing   |     | - Success markers  |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
|  [2] PATTERN MATCHING FOR NEW BUDGETS                                              |
|  +----------------+     +------------------+     +--------------------+            |
|  | New budget     |---->| Query MoE        |---->| Suggest optimal    |            |
|  | context        |     | Expert 2         |     | allocations        |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Input:         |     | Processing:      |     | Output:            |            |
|  | - Total budget |     | - k-NN patterns  |     | - Personnel: 45%   |            |
|  | - Sponsor      |     | - Weighted avg   |     | - Equipment: 15%   |            |
|  | - Duration     |     | - Constraint sat |     | - Travel: 5%       |            |
|  | - Team size    |     | - Anomaly detect |     | - Supplies: 10%    |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
|  [3] CONTINUOUS LEARNING                                                           |
|  +----------------+     +------------------+     +--------------------+            |
|  | Budget outcome |---->| Update patterns  |---->| Retrain MoE        |            |
|  | (awarded/not)  |     | with result      |     | Expert 2           |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Success:       |     | Pattern store:   |     | Learning:          |            |
|  | weight += 1.2  |     | Update vectors   |     | - LoRA adapt       |            |
|  | Failure:       |     | Recalculate      |     | - EWC++ protect    |            |
|  | weight *= 0.8  |     | cluster centers  |     | - SONA optimize    |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

### 3.3 Compliance Requirement Matching Flow

```
+-----------------------------------------------------------------------------------+
|                    COMPLIANCE REQUIREMENT MATCHING FLOW                            |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  [1] PROPOSAL ANALYSIS                                                             |
|  +----------------+     +------------------+     +--------------------+            |
|  | Proposal text  |---->| NER extraction   |---->| Compliance         |            |
|  | submitted      |     | for triggers     |     | classification     |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Text sections: |     | Triggers found:  |     | Classifications:   |            |
|  | - Abstract     |     | - "human subjects"|    | - IRB: 0.95 conf  |            |
|  | - Methods      |     | - "mice model"   |     | - IACUC: 0.87     |            |
|  | - Aims         |     | - "export control"|    | - IBC: 0.23       |            |
|  | - Budget just. |     | - "radioisotopes"|     | - Export: 0.78    |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
|  [2] REQUIREMENT RECOMMENDATIONS                                                   |
|  +----------------+     +------------------+     +--------------------+            |
|  | Classification |---->| Query historical |---->| Generate           |            |
|  | results        |     | similar proposals|     | recommendations    |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | High conf:     |     | Similar props:   |     | Recommendations:   |            |
|  | Auto-add to    |     | - Check their    |     | - Required items   |            |
|  | required list  |     |   compliance     |     | - Suggested items  |            |
|  | Medium conf:   |     | - Learn patterns |     | - Deadlines        |            |
|  | Flag for review|     | - Copy protocols |     | - Contact info     |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
|  [3] FEEDBACK AND LEARNING                                                         |
|  +----------------+     +------------------+     +--------------------+            |
|  | User accepts/  |---->| Store verdict    |---->| Update MoE         |            |
|  | rejects        |     | in trajectory    |     | Expert 3           |            |
|  +----------------+     +------------------+     +--------------------+            |
|         |                       |                         |                        |
|         v                       v                         v                        |
|  +----------------+     +------------------+     +--------------------+            |
|  | Feedback:      |     | Trajectory:      |     | Training:          |            |
|  | - Accepted: +1 |     | - Query vector   |     | - NER model        |            |
|  | - Rejected: -1 |     | - Result set     |     | - Classification   |            |
|  | - Modified: +0.5|    | - User action    |     | - Confidence cal.  |            |
|  +----------------+     +------------------+     +--------------------+            |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

---

## 4. WASM Deployment Strategy

### 4.1 Client-Side Architecture

```
+-----------------------------------------------------------------------------------+
|                        WASM CLIENT-SIDE ARCHITECTURE                               |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------------- BROWSER LAYER --------------------------------+    |
|  |                                                                           |    |
|  |  +---------------------------------------------------------------------+ |    |
|  |  |                     SERVICE WORKER                                   | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  | | Request Intercept |  | Cache Strategy    |  | Background Sync   |  | |    |
|  |  | | (Fetch API)       |  | (Stale-While-     |  | (Periodic)        |  | |    |
|  |  | |                   |  |  Revalidate)      |  |                   |  | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  +---------------------------------------------------------------------+ |    |
|  |                                                                           |    |
|  |  +---------------------------------------------------------------------+ |    |
|  |  |                     WASM VECTOR ENGINE                               | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  | | sql.js (SQLite)   |  | HNSW-WASM         |  | Embedding Cache   |  | |    |
|  |  | | In-memory DB      |  | ANN Search        |  | (Pre-computed)    |  | |    |
|  |  | | No native deps    |  | 150x faster       |  |                   |  | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  |                                                                       | |    |
|  |  | Configuration:                                                        | |    |
|  |  | - Max vectors: 10,000 per tenant (local cache)                       | |    |
|  |  | - Embedding dim: 384 (MiniLM compressed)                             | |    |
|  |  | - Index rebuild: On sync completion                                  | |    |
|  |  | - Memory budget: 50MB WASM heap                                      | |    |
|  |  +---------------------------------------------------------------------+ |    |
|  |                                                                           |    |
|  |  +---------------------------------------------------------------------+ |    |
|  |  |                     INDEXEDDB STORAGE                                | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  | | proposals_offline |  | vectors_cache     |  | sync_queue        |  | |    |
|  |  | | (Full objects)    |  | (Binary blobs)    |  | (Pending ops)     |  | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  | | drafts            |  | patterns_local    |  | conflict_log      |  | |    |
|  |  | | (User edits)      |  | (Learned)         |  | (Resolution)      |  | |    |
|  |  | +-------------------+  +-------------------+  +-------------------+  | |    |
|  |  +---------------------------------------------------------------------+ |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
|                                                                                    |
|  +---------------------------- SYNC PROTOCOL --------------------------------+    |
|  |                                                                           |    |
|  |  CRDT-Based Conflict Resolution                                           |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | 1. Last-Writer-Wins for simple fields (title, abstract)           |   |    |
|  |  | 2. G-Counter for version numbers                                   |   |    |
|  |  | 3. OR-Set for team members (add/remove operations)                |   |    |
|  |  | 4. LWW-Element-Set for budget items                               |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  Delta Synchronization                                                    |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | - Only sync changed fields (JSON diff)                             |   |    |
|  |  | - Compress with Brotli (avg 10:1 ratio)                            |   |    |
|  |  | - Batch operations (max 50 per request)                            |   |    |
|  |  | - Resume interrupted syncs                                         |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
+-----------------------------------------------------------------------------------+
```

### 4.2 Offline-First Grant Editor

```
+-----------------------------------------------------------------------------------+
|                      OFFLINE-FIRST GRANT EDITOR                                    |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------------- USER WORKFLOW --------------------------------+    |
|  |                                                                           |    |
|  |  [ONLINE MODE]                                                            |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | 1. Load proposal from server                                       |   |    |
|  |  | 2. Sync HNSW index subset (top 1000 similar)                      |   |    |
|  |  | 3. Download embedding model (384-dim MiniLM, 22MB)                |   |    |
|  |  | 4. Cache budget patterns for sponsor                              |   |    |
|  |  | 5. Pre-load compliance rules                                      |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  [OFFLINE MODE]                                                           |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | 1. Read/write proposals from IndexedDB                            |   |    |
|  |  | 2. Local vector search (WASM HNSW, <1ms)                          |   |    |
|  |  | 3. Budget suggestions from cached patterns                        |   |    |
|  |  | 4. Compliance hints from local rules                              |   |    |
|  |  | 5. Queue changes for sync                                         |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  [SYNC MODE]                                                              |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | 1. Detect connectivity restored                                    |   |    |
|  |  | 2. Push queued changes with CRDT merge                            |   |    |
|  |  | 3. Pull server updates                                            |   |    |
|  |  | 4. Rebuild local HNSW index                                       |   |    |
|  |  | 5. Notify user of conflicts (if any)                              |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
|                                                                                    |
|  +---------------------------- FEATURE PARITY -------------------------------+    |
|  |                                                                           |    |
|  |  Feature                    | Online | Offline | Notes                    |    |
|  |  ---------------------------|--------|---------|------------------------- |    |
|  |  Proposal editing           |   Y    |    Y    | Full support             |    |
|  |  Budget calculations        |   Y    |    Y    | Local F&A calc           |    |
|  |  Similar proposal search    |   Y    |    Y    | Cached 1000 vectors      |    |
|  |  Budget suggestions         |   Y    |    Y    | Cached patterns          |    |
|  |  Compliance hints           |   Y    |    Y    | Local rules engine       |    |
|  |  Team member lookup         |   Y    |    P    | Cached contacts only     |    |
|  |  Sponsor search             |   Y    |    P    | Cached sponsors only     |    |
|  |  Real-time collaboration    |   Y    |    N    | Requires connection      |    |
|  |  Submission to Grants.gov   |   Y    |    N    | Requires connection      |    |
|  |                                                                           |    |
|  |  Y = Yes, P = Partial, N = No                                             |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
+-----------------------------------------------------------------------------------+
```

### 4.3 Edge Deployment for Field Researchers

```
+-----------------------------------------------------------------------------------+
|                    EDGE DEPLOYMENT FOR FIELD RESEARCHERS                           |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------------- DEPLOYMENT TARGETS ---------------------------+    |
|  |                                                                           |    |
|  |  Target 1: Progressive Web App (PWA)                                      |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | Platform: All modern browsers                                      |   |    |
|  |  | Install: Add to home screen                                        |   |    |
|  |  | Storage: IndexedDB (up to 1GB)                                    |   |    |
|  |  | WASM: Full support                                                 |   |    |
|  |  | Use case: General field researchers                               |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  Target 2: Electron Desktop App                                           |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | Platform: Windows, macOS, Linux                                    |   |    |
|  |  | Install: Native installer                                          |   |    |
|  |  | Storage: SQLite (unlimited)                                        |   |    |
|  |  | WASM: Native performance                                           |   |    |
|  |  | Use case: Power users, large datasets                             |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  Target 3: Mobile Apps (Capacitor)                                        |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | Platform: iOS, Android                                             |   |    |
|  |  | Install: App stores                                                |   |    |
|  |  | Storage: SQLite (device limit)                                    |   |    |
|  |  | WASM: WebView support                                              |   |    |
|  |  | Use case: Mobile field data collection                            |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
|                                                                                    |
|  +---------------------------- SYNC STRATEGIES ------------------------------+    |
|  |                                                                           |    |
|  |  Metered Connection (Mobile Data)                                         |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | - Sync only critical data (proposal changes)                       |   |    |
|  |  | - Defer vector index updates                                       |   |    |
|  |  | - Aggressive compression (Brotli level 11)                        |   |    |
|  |  | - Request deduplication                                            |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  Unmetered Connection (WiFi)                                              |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | - Full sync including vectors                                      |   |    |
|  |  | - Preload related proposals                                        |   |    |
|  |  | - Update embedding models                                          |   |    |
|  |  | - Sync learning feedback                                           |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  |  No Connection                                                            |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |  | - Queue all operations                                             |   |    |
|  |  | - Use cached data only                                             |   |    |
|  |  | - Show clear offline indicator                                     |   |    |
|  |  | - Prevent data-dependent operations                                |   |    |
|  |  +-------------------------------------------------------------------+   |    |
|  |                                                                           |    |
|  +--------------------------------------------------------------------------+    |
+-----------------------------------------------------------------------------------+
```

---

## 5. RuVector-Postgres Integration

### 5.1 Database Schema Extensions

```sql
-- =============================================================================
-- RUVECTOR-POSTGRES SCHEMA EXTENSIONS
-- pgvector 0.8+ with 77+ SQL functions
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- EMBEDDING STORAGE TABLES
-- =============================================================================

-- Proposal embeddings with multi-tenant RLS
CREATE TABLE proposal_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

    -- Embedding vectors (multiple types for different use cases)
    title_embedding vector(1536),           -- Title semantic embedding
    abstract_embedding vector(1536),        -- Abstract embedding
    full_text_embedding vector(1536),       -- Full document embedding
    structural_embedding vector(384),       -- Document structure embedding

    -- Quantized versions for fast search
    title_binary bit(1536),                 -- Binary quantized (32x smaller)
    abstract_binary bit(1536),

    -- Metadata for filtering
    sponsor_type VARCHAR(50),
    proposal_type VARCHAR(50),
    submission_status VARCHAR(50),
    award_status VARCHAR(50),
    created_year INTEGER,

    -- Learning metadata
    success_weight DECIMAL(5,4) DEFAULT 1.0,  -- Higher for awarded proposals
    search_count INTEGER DEFAULT 0,            -- Popularity metric
    last_searched_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Budget pattern embeddings
CREATE TABLE budget_pattern_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID REFERENCES proposals(id),
    award_id UUID REFERENCES awards(id),

    -- Pattern embedding (numerical + categorical features)
    pattern_embedding vector(256),

    -- Structured pattern data (JSONB for flexibility)
    pattern_data JSONB NOT NULL,
    -- Example: {
    --   "sponsor_type": "NIH", "award_type": "R01", "total_budget": 1500000,
    --   "duration_months": 60, "personnel_pct": 0.45, "equipment_pct": 0.15,
    --   "travel_pct": 0.05, "supplies_pct": 0.10, "other_pct": 0.05,
    --   "fa_rate": 0.55, "cost_sharing_pct": 0.10
    -- }

    -- Success metrics
    was_awarded BOOLEAN DEFAULT FALSE,
    award_amount BIGINT,
    variance_from_request DECIMAL(5,4),  -- How much budget changed

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance pattern embeddings
CREATE TABLE compliance_pattern_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),

    -- Text that triggered compliance requirement
    trigger_text TEXT NOT NULL,
    trigger_embedding vector(768),

    -- Compliance type and confidence
    compliance_type VARCHAR(50) NOT NULL,  -- IRB, IACUC, IBC, COI, EXPORT
    confidence_score DECIMAL(5,4) NOT NULL,

    -- Outcome for learning
    was_correct BOOLEAN,  -- Did user confirm this was needed?
    user_action VARCHAR(20),  -- ACCEPTED, REJECTED, MODIFIED

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- HNSW INDEXES FOR FAST SIMILARITY SEARCH
-- =============================================================================

-- Primary proposal similarity index
CREATE INDEX idx_proposal_title_hnsw ON proposal_embeddings
USING hnsw (title_embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 200);

CREATE INDEX idx_proposal_abstract_hnsw ON proposal_embeddings
USING hnsw (abstract_embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 200);

-- Binary quantized index for ultra-fast initial filtering
CREATE INDEX idx_proposal_title_binary ON proposal_embeddings
USING hnsw (title_binary bit_hamming_ops)
WITH (m = 64, ef_construction = 400);

-- Budget pattern index
CREATE INDEX idx_budget_pattern_hnsw ON budget_pattern_embeddings
USING hnsw (pattern_embedding vector_l2_ops)
WITH (m = 16, ef_construction = 100);

-- Compliance trigger index
CREATE INDEX idx_compliance_trigger_hnsw ON compliance_pattern_embeddings
USING hnsw (trigger_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 100);

-- =============================================================================
-- ROW-LEVEL SECURITY FOR MULTI-TENANCY
-- =============================================================================

-- Enable RLS on all embedding tables
ALTER TABLE proposal_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_pattern_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_pattern_embeddings ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_proposal_embeddings ON proposal_embeddings
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_budget_patterns ON budget_pattern_embeddings
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_compliance_patterns ON compliance_pattern_embeddings
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- =============================================================================
-- LEARNING STATE TABLES
-- =============================================================================

-- Trajectory logging for self-learning
CREATE TABLE learning_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    session_id UUID NOT NULL,

    -- Query information
    query_type VARCHAR(50) NOT NULL,  -- SIMILARITY, BUDGET_PATTERN, COMPLIANCE
    query_embedding vector(1536),
    query_text TEXT,

    -- Results
    result_ids UUID[] NOT NULL,
    result_scores DECIMAL(5,4)[] NOT NULL,

    -- User feedback
    selected_result_idx INTEGER,  -- Which result user selected (0-indexed)
    user_rating INTEGER,          -- 1-5 star rating
    dwell_time_ms INTEGER,        -- Time spent on results

    -- Context
    user_id UUID,
    proposal_context_id UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verdict judgments for learning
CREATE TABLE learning_verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trajectory_id UUID REFERENCES learning_trajectories(id),

    verdict VARCHAR(20) NOT NULL,  -- SUCCESS, FAILURE, PARTIAL
    confidence DECIMAL(5,4),

    -- Extracted learning
    positive_patterns JSONB,  -- What worked
    negative_patterns JSONB,  -- What didn't work

    -- Model update tracking
    applied_to_model BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EWC++ memory protection
CREATE TABLE ewc_memory_protection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,

    -- Fisher information diagonal (importance weights)
    parameter_name VARCHAR(200) NOT NULL,
    fisher_diagonal REAL[] NOT NULL,
    optimal_params REAL[] NOT NULL,

    -- Task information
    task_id VARCHAR(100),
    task_sample_count INTEGER,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(model_name, parameter_name)
);

-- =============================================================================
-- VECTOR SEARCH FUNCTIONS
-- =============================================================================

-- Similar proposal search with tenant RLS and optional filters
CREATE OR REPLACE FUNCTION search_similar_proposals(
    query_embedding vector(1536),
    tenant_id_param UUID,
    top_k INTEGER DEFAULT 10,
    sponsor_type_filter VARCHAR DEFAULT NULL,
    min_similarity DECIMAL DEFAULT 0.5,
    include_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    proposal_id UUID,
    title TEXT,
    similarity DECIMAL,
    sponsor_type VARCHAR,
    was_awarded BOOLEAN,
    success_weight DECIMAL
) AS $$
BEGIN
    -- Set tenant context for RLS
    PERFORM set_config('app.current_tenant_id', tenant_id_param::text, true);

    RETURN QUERY
    SELECT
        pe.proposal_id,
        p.title,
        (1 - (pe.title_embedding <=> query_embedding))::DECIMAL as similarity,
        pe.sponsor_type,
        CASE WHEN p.state = 'AWARDED' THEN TRUE ELSE FALSE END as was_awarded,
        pe.success_weight
    FROM proposal_embeddings pe
    JOIN proposals p ON pe.proposal_id = p.id
    WHERE pe.tenant_id = tenant_id_param
      AND (sponsor_type_filter IS NULL OR pe.sponsor_type = sponsor_type_filter)
      AND (include_archived OR p.state != 'ARCHIVED')
      AND (1 - (pe.title_embedding <=> query_embedding)) >= min_similarity
    ORDER BY pe.title_embedding <=> query_embedding
    LIMIT top_k;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Budget pattern recommendation
CREATE OR REPLACE FUNCTION recommend_budget_allocation(
    sponsor_type_param VARCHAR,
    total_budget_param BIGINT,
    duration_months_param INTEGER,
    tenant_id_param UUID,
    top_k INTEGER DEFAULT 5
)
RETURNS TABLE (
    category VARCHAR,
    recommended_pct DECIMAL,
    confidence DECIMAL,
    based_on_count INTEGER
) AS $$
DECLARE
    avg_patterns RECORD;
BEGIN
    -- Set tenant context
    PERFORM set_config('app.current_tenant_id', tenant_id_param::text, true);

    -- Calculate average patterns from similar successful budgets
    FOR avg_patterns IN
        SELECT
            'personnel' as category,
            AVG((pattern_data->>'personnel_pct')::DECIMAL) as avg_pct,
            STDDEV((pattern_data->>'personnel_pct')::DECIMAL) as std_pct,
            COUNT(*) as sample_count
        FROM budget_pattern_embeddings
        WHERE tenant_id = tenant_id_param
          AND pattern_data->>'sponsor_type' = sponsor_type_param
          AND was_awarded = TRUE
        UNION ALL
        SELECT 'equipment', AVG((pattern_data->>'equipment_pct')::DECIMAL),
               STDDEV((pattern_data->>'equipment_pct')::DECIMAL), COUNT(*)
        FROM budget_pattern_embeddings
        WHERE tenant_id = tenant_id_param
          AND pattern_data->>'sponsor_type' = sponsor_type_param
          AND was_awarded = TRUE
        UNION ALL
        SELECT 'travel', AVG((pattern_data->>'travel_pct')::DECIMAL),
               STDDEV((pattern_data->>'travel_pct')::DECIMAL), COUNT(*)
        FROM budget_pattern_embeddings
        WHERE tenant_id = tenant_id_param
          AND pattern_data->>'sponsor_type' = sponsor_type_param
          AND was_awarded = TRUE
        UNION ALL
        SELECT 'supplies', AVG((pattern_data->>'supplies_pct')::DECIMAL),
               STDDEV((pattern_data->>'supplies_pct')::DECIMAL), COUNT(*)
        FROM budget_pattern_embeddings
        WHERE tenant_id = tenant_id_param
          AND pattern_data->>'sponsor_type' = sponsor_type_param
          AND was_awarded = TRUE
        UNION ALL
        SELECT 'other', AVG((pattern_data->>'other_pct')::DECIMAL),
               STDDEV((pattern_data->>'other_pct')::DECIMAL), COUNT(*)
        FROM budget_pattern_embeddings
        WHERE tenant_id = tenant_id_param
          AND pattern_data->>'sponsor_type' = sponsor_type_param
          AND was_awarded = TRUE
    LOOP
        category := avg_patterns.category;
        recommended_pct := COALESCE(avg_patterns.avg_pct, 0);
        -- Confidence based on sample size and variance
        confidence := CASE
            WHEN avg_patterns.sample_count < 3 THEN 0.3
            WHEN avg_patterns.std_pct > 0.15 THEN 0.5
            WHEN avg_patterns.sample_count > 10 AND avg_patterns.std_pct < 0.1 THEN 0.9
            ELSE 0.7
        END;
        based_on_count := avg_patterns.sample_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hybrid search (Vector + Full-Text)
CREATE OR REPLACE FUNCTION hybrid_proposal_search(
    query_text TEXT,
    query_embedding vector(1536),
    tenant_id_param UUID,
    top_k INTEGER DEFAULT 10,
    vector_weight DECIMAL DEFAULT 0.7,
    text_weight DECIMAL DEFAULT 0.3
)
RETURNS TABLE (
    proposal_id UUID,
    title TEXT,
    combined_score DECIMAL,
    vector_score DECIMAL,
    text_score DECIMAL
) AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id_param::text, true);

    RETURN QUERY
    WITH vector_results AS (
        SELECT
            pe.proposal_id,
            (1 - (pe.title_embedding <=> query_embedding)) as v_score
        FROM proposal_embeddings pe
        WHERE pe.tenant_id = tenant_id_param
        ORDER BY pe.title_embedding <=> query_embedding
        LIMIT top_k * 2
    ),
    text_results AS (
        SELECT
            p.id as proposal_id,
            ts_rank(
                to_tsvector('english', p.title || ' ' || COALESCE(p.abstract, '')),
                plainto_tsquery('english', query_text)
            ) as t_score
        FROM proposals p
        WHERE p.tenant_id = tenant_id_param
          AND to_tsvector('english', p.title || ' ' || COALESCE(p.abstract, ''))
              @@ plainto_tsquery('english', query_text)
        LIMIT top_k * 2
    )
    SELECT
        COALESCE(vr.proposal_id, tr.proposal_id) as proposal_id,
        p.title,
        (COALESCE(vr.v_score, 0) * vector_weight +
         COALESCE(tr.t_score, 0) * text_weight)::DECIMAL as combined_score,
        COALESCE(vr.v_score, 0)::DECIMAL as vector_score,
        COALESCE(tr.t_score, 0)::DECIMAL as text_score
    FROM vector_results vr
    FULL OUTER JOIN text_results tr ON vr.proposal_id = tr.proposal_id
    JOIN proposals p ON p.id = COALESCE(vr.proposal_id, tr.proposal_id)
    ORDER BY combined_score DESC
    LIMIT top_k;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 Docker Deployment Configuration

```yaml
# docker-compose.ruvector-postgres.yml
version: '3.9'

services:
  ruvector-postgres:
    image: pgvector/pgvector:pg16
    container_name: huron-ruvector-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-huron}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-huron_grants}
      POSTGRES_INITDB_ARGS: "--data-checksums"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=2GB"
      - "-c"
      - "effective_cache_size=6GB"
      - "-c"
      - "maintenance_work_mem=1GB"
      - "-c"
      - "work_mem=256MB"
      - "-c"
      - "max_parallel_workers_per_gather=4"
      - "-c"
      - "max_parallel_workers=8"
      - "-c"
      - "max_parallel_maintenance_workers=4"
      - "-c"
      - "jit=on"
      - "-c"
      - "jit_above_cost=100000"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-huron}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

  embedding-service:
    build:
      context: ./services/embedding
      dockerfile: Dockerfile
    container_name: huron-embedding-service
    environment:
      - ONNX_MODEL_PATH=/models/all-MiniLM-L6-v2
      - BATCH_SIZE=32
      - MAX_SEQUENCE_LENGTH=512
      - CACHE_SIZE=10000
    volumes:
      - embedding_models:/models
    ports:
      - "8081:8081"
    depends_on:
      ruvector-postgres:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  vector-cache:
    image: redis:7-alpine
    container_name: huron-vector-cache
    command: >
      redis-server
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  embedding_models:
  redis_data:
```

---

## 6. Performance Targets

### 6.1 Quantified Performance Requirements

| Metric | Target | Measurement Method | Rationale |
|--------|--------|-------------------|-----------|
| **Vector Search Latency** |  |  |  |
| - HNSW ANN Search (p50) | <0.3ms | Server-side timing | Real-time UX |
| - HNSW ANN Search (p99) | <0.5ms | Server-side timing | Consistent UX |
| - Binary quantized search | <0.1ms | Server-side timing | Pre-filtering |
| **Embedding Generation** |  |  |  |
| - Single document | <50ms | API response time | Interactive editing |
| - Batch (100 docs) | <2s | Background job time | Bulk import |
| **Learning Pipeline** |  |  |  |
| - SONA adaptation | <0.05ms | Neural update time | Real-time learning |
| - LoRA fine-tune batch | <5min | Training job time | Hourly updates |
| - EWC++ consolidation | <1min | Memory merge time | Daily consolidation |
| **WASM Performance** |  |  |  |
| - Local HNSW search | <1ms | Client-side timing | Offline search |
| - Index rebuild (1000 vectors) | <500ms | Client-side timing | Sync completion |
| - Embedding inference (MiniLM) | <100ms | Client-side timing | Real-time hints |
| **System Throughput** |  |  |  |
| - Concurrent searches | >10,000/s | Load test | Peak traffic |
| - Embedding generation | >1,000/s | Load test | Batch processing |
| - Learning updates | >100/s | Load test | User feedback |
| **Accuracy Metrics** |  |  |  |
| - Similarity recall@10 | >0.95 | Benchmark test | Quality results |
| - Budget pattern accuracy | >0.85 | A/B test | Useful suggestions |
| - Compliance prediction F1 | >0.90 | Validation set | Safety-critical |

### 6.2 Performance Optimization Strategies

| Strategy | Implementation | Expected Gain |
|----------|----------------|---------------|
| HNSW M tuning | M=32 for quality, M=16 fast | 2x search speed |
| ef_search tuning | Dynamic based on query type | 1.5x quality |
| Binary quantize | 1-bit per dimension | 32x smaller |
| Scalar quantize | 8-bit per dimension | 4x smaller |
| L1 Cache | In-process, 1 minute TTL | >80% hit rate |
| L2 Cache (Redis) | 30 minutes TTL | >95% hit rate |
| Pre-filtering | Known metadata constraints | 10x faster |
| Two-phase search | Large result sets | 5x faster |
| AVX-512/NEON | SIMD acceleration | 2-4x speedup |

---

## 7. Integration with Existing Bounded Contexts

### 7.1 Context Integration Map

| Context | Event | RuVector Action |
|---------|-------|-----------------|
| **Proposal** | proposal.created | Generate embeddings, add to HNSW index |
| **Proposal** | proposal.updated | Re-generate embeddings, update index |
| **Proposal** | proposal.state_changed | Update success_weight if awarded |
| **Proposal** | proposal.awarded | Increase success_weight, train patterns |
| **Budget** | budget.created | Generate pattern embedding |
| **Budget** | budget.finalized | Store pattern for learning |
| **Award** | award.activated | Mark budget pattern as successful |
| **Compliance** | proposal.created | Predict required compliance items |
| **Compliance** | compliance.approved | Update pattern confidence |
| **SF424** | sf424.generated | Store form patterns for validation |

### 7.2 New Domain Services

```go
// Proposal Context
type ProposalSimilarityService interface {
    FindSimilar(proposalID string) ([]SimilarProposal, error)
}

type ProposalDraftAssistant interface {
    SuggestContent(section string, context string) (string, error)
}

type ProposalReviewPredictor interface {
    PredictSuccess(proposalID string) (Score, error)
}

// Budget Context
type BudgetPatternService interface {
    RecommendAllocation(context BudgetContext) (*Recommendation, error)
}

type BudgetAnomalyService interface {
    DetectAnomalies(budget Budget) ([]Anomaly, error)
}

// Compliance Context
type CompliancePredictor interface {
    PredictRequirements(proposal Proposal) ([]Requirement, error)
}

type ComplianceAdvisor interface {
    GetGuidance(complianceType string, context string) (*Guidance, error)
}
```

---

## 8. Security Considerations

### 8.1 Multi-Tenant Data Isolation

| Layer | Mechanism |
|-------|-----------|
| Application | Tenant ID extracted from JWT, validated at API gateway |
| Database | RLS policies on all embedding tables |
| Vector Index | Per-tenant HNSW index partitions |
| WASM Client | Separate IndexedDB per tenant, encrypted |

### 8.2 Federated Learning (Cross-Tenant Without Data Sharing)

1. Local model training on tenant data
2. Extract gradient updates only (no raw data)
3. Differential privacy noise injection (epsilon = 1.0)
4. Secure aggregation of updates
5. Global model improvement

### 8.3 Compliance Alignment

| Requirement | How RuVector Addresses |
|-------------|----------------------|
| FedRamp AC-2 | RLS policies enforce tenant-scoped access |
| FedRamp AC-3 | Vector queries filtered by tenant context |
| SOC2 CC6.1 | Encrypted embeddings at rest (AES-256) |
| SOC2 CC6.3 | Audit logging of all vector operations |
| HIPAA | PHI excluded from embedding generation |
| GDPR | Right to deletion includes embeddings |

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Model drift | Medium | High | Continuous monitoring, A/B testing, automatic rollback |
| Embedding quality degradation | Low | High | Benchmark suite, quality gates, human evaluation |
| Cross-tenant data leakage | Low | Critical | RLS policies, security audit, penetration testing |
| WASM performance variance | Medium | Medium | Feature detection, graceful degradation, server fallback |
| Learning feedback bias | Medium | Medium | Balanced sampling, diversity metrics, bias detection |
| Catastrophic forgetting | Medium | High | EWC++ protection, replay buffers, checkpoint recovery |
| Index corruption | Low | High | Checksums, replication, point-in-time recovery |
| Offline sync conflicts | Medium | Medium | CRDT merge, conflict UI, automatic resolution |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- Deploy RuVector-Postgres with pgvector
- Implement embedding service with ONNX
- Create base schema with RLS policies
- Build HNSW indexes for proposals
- Integrate with Proposal bounded context

### Phase 2: Intelligence (Weeks 5-8)
- Implement RuVector 4-step pipeline
- Deploy Claude-Flow orchestration
- Create budget pattern learning
- Build compliance prediction
- Train initial MoE experts

### Phase 3: WASM Edge (Weeks 9-12)
- Build WASM vector engine
- Implement offline-first editor
- Create CRDT sync protocol
- Deploy PWA with service worker
- Test offline scenarios

### Phase 4: Self-Learning (Weeks 13-16)
- Implement SONA adaptation
- Build LoRA fine-tuning pipeline
- Deploy EWC++ consolidation
- Create feedback collection UI
- Establish learning metrics

### Phase 5: Production (Weeks 17-20)
- Performance optimization
- Security audit
- Load testing
- Documentation
- Gradual rollout

---

## 11. References

### Technical References
- [pgvector: Open-source vector similarity search for Postgres](https://github.com/pgvector/pgvector)
- [HNSW: Efficient and robust approximate nearest neighbor search](https://arxiv.org/abs/1603.09320)
- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [EWC: Overcoming catastrophic forgetting in neural networks](https://arxiv.org/abs/1612.00796)
- [CRDT: Conflict-free Replicated Data Types](https://crdt.tech/)

### Internal References
- ADR-001: Clean Architecture with DDD
- ADR-002: Multi-Tenancy with Row-Level Security
- ADR-004: Event-Driven Architecture
- HRS Grants Module Requirements Specifications v1.1

---

## 12. Decision Outcome

### Approved Components
1. **RuVector Intelligence System** with SONA, MoE, HNSW, EWC++
2. **Claude-Flow Orchestration** with hierarchical swarm coordination
3. **Agentic-Flow Agents** (15 grant-specific agents initially)
4. **WASM Vector Engine** with sql.js and offline support
5. **RuVector-Postgres** with pgvector 0.8+ and 77+ SQL functions

### Success Criteria
- Vector search latency <0.5ms (p99)
- Similarity recall@10 >0.95
- Budget pattern accuracy >0.85
- Compliance prediction F1 >0.90
- 100% offline feature parity
- Zero cross-tenant data leakage
- Continuous learning improvement >5% monthly

### Review Schedule
- Monthly performance review
- Quarterly security audit
- Bi-annual architecture assessment

---

**Document Version**: 2.0
**Last Updated**: 2026-01-25
**Status**: Proposed
**Next Review**: 2026-02-25
