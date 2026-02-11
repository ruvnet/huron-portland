# Architecture Diagrams

## 1. System Architecture (Slide 02)

```mermaid
graph TB
    subgraph Developer
        D[Developer Intent]
    end

    subgraph "Claude Code"
        CC[AI-Powered CLI]
    end

    subgraph "Claude Flow V3"
        CF[Swarm Controller]
        R[Researcher]
        A[Architect]
        B[Backend Dev]
        F[Frontend Dev]
        T[Tester]
        RV[Reviewer]
    end

    subgraph "RuVector Ecosystem"
        RP[ruvector-postgres]
        RL[rvlite WASM]
        RA[ruvector-attention]
        RG[ruvector-gnn]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL + pgvector)]
        RD[(Redis Cache)]
    end

    D --> CC
    CC --> CF
    CF --> R & A & B & F & T & RV
    B --> RP & PG
    F --> RL
    RP --> PG
    RA --> RP
    RG --> RA
    B --> RD
```

## 2. Clean Architecture Rings (Slide 11)

```mermaid
graph TB
    subgraph "Interfaces Layer"
        H[HTTP Handlers]
        MW[Middleware]
    end

    subgraph "Application Layer"
        UC[Use Cases]
        CMD[Command Handlers]
        QRY[Query Handlers]
    end

    subgraph "Domain Layer"
        E[Entities]
        VO[Value Objects]
        DE[Domain Events]
        RI[Repository Interfaces]
    end

    subgraph "Infrastructure Layer"
        PG[PostgreSQL Repos]
        RV[RuVector Client]
        RC[Redis Cache]
    end

    H --> UC
    MW --> UC
    UC --> E & VO & DE & RI
    PG -.implements.-> RI
    RV -.implements.-> RI
    RC -.implements.-> RI
```

## 3. Request Flow (Slide 15)

```mermaid
sequenceDiagram
    participant C as Client
    participant CORS as CORS MW
    participant RL as Rate Limiter
    participant AUTH as Auth MW
    participant RLS as Tenant MW
    participant LOG as Logger
    participant SEC as AIDefence
    participant H as Handler
    participant DB as PostgreSQL

    C->>CORS: HTTP Request
    CORS->>RL: Validated origin
    RL->>AUTH: Within limits
    AUTH->>RLS: JWT verified
    RLS->>LOG: SET LOCAL tenant_id
    LOG->>SEC: Logged
    SEC->>H: Sanitized
    H->>DB: Query (RLS filtered)
    DB-->>H: Results (tenant only)
    H-->>C: JSON Response
```

## 4. Self-Learning Loop (Slide 16)

```mermaid
graph LR
    A[User Query] --> B[Embed]
    B --> C[Search]
    C --> D[Results]
    D --> E[User Interaction]
    E --> F[Learn]
    F --> G[Update Weights]
    G --> H[EWC++ Preserve]
    H --> C

    style F fill:#f9f,stroke:#333
    style H fill:#bbf,stroke:#333
```

## 5. Swarm Topology (Slide 17)

```mermaid
graph TB
    Q[Queen Agent] --> R[Researcher]
    Q --> A[Architect]
    Q --> RV[Reviewer]
    A --> B[Backend Dev]
    A --> F[Frontend Dev]
    B --> T[Tester]
    F --> T
    T --> RV

    style Q fill:#gold,stroke:#333
    style RV fill:#f66,stroke:#333
```
