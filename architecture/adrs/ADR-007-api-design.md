# ADR-007: RESTful API Design with OpenAPI Specification

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module requires:
- Well-documented APIs for frontend consumption
- Consistent response formats
- Versioned endpoints for backward compatibility
- Performance targets: API response <100ms
- Support for complex filtering and pagination

## Decision

We will implement **RESTful APIs** following:
1. OpenAPI 3.0 specification for documentation
2. JSON:API-inspired response format
3. URL-based versioning (/api/v1/)
4. HATEOAS for resource discovery

### API Structure

```
/api/v1/
├── /proposals
│   ├── GET    - List proposals (with filtering)
│   ├── POST   - Create proposal
│   └── /{id}
│       ├── GET    - Get proposal details
│       ├── PATCH  - Update proposal
│       ├── DELETE - Delete proposal (soft delete)
│       └── /actions
│           └── POST - Execute state transition
├── /budgets
│   ├── GET    - List budgets
│   └── /{id}
│       ├── GET   - Get budget details
│       ├── PATCH - Update budget
│       └── /periods
│           ├── GET  - List budget periods
│           └── POST - Add budget period
├── /awards
│   ├── GET    - List awards
│   └── /{id}
│       ├── GET   - Get award details
│       └── /modifications
│           ├── GET  - List modifications
│           └── POST - Create modification
├── /sf424
│   ├── /{proposalId}
│   │   ├── GET  - Get SF424 form
│   │   ├── POST - Generate SF424 form
│   │   └── /validate
│   │       └── POST - Validate form
│   └── /submit
│       └── POST - Submit to Grants.gov
├── /compliance
│   ├── GET    - List compliance items
│   └── /{id}
│       ├── GET   - Get compliance details
│       └── PATCH - Update compliance status
└── /reports
    ├── /financial
    ├── /progress
    └── /audit
```

### Response Format

```go
// interfaces/http/response.go

package http

// APIResponse is the standard response envelope
type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
    Links   *Links      `json:"links,omitempty"`
    Errors  []APIError  `json:"errors,omitempty"`
}

// Meta contains pagination and metadata
type Meta struct {
    Total      int    `json:"total,omitempty"`
    Page       int    `json:"page,omitempty"`
    PerPage    int    `json:"per_page,omitempty"`
    TotalPages int    `json:"total_pages,omitempty"`
    RequestID  string `json:"request_id"`
    Timestamp  string `json:"timestamp"`
}

// Links provides HATEOAS navigation
type Links struct {
    Self  string `json:"self"`
    First string `json:"first,omitempty"`
    Prev  string `json:"prev,omitempty"`
    Next  string `json:"next,omitempty"`
    Last  string `json:"last,omitempty"`
}

// APIError represents an error response
type APIError struct {
    Code    string                 `json:"code"`
    Message string                 `json:"message"`
    Field   string                 `json:"field,omitempty"`
    Details map[string]interface{} `json:"details,omitempty"`
}
```

### Request/Response Examples

#### Create Proposal
```http
POST /api/v1/proposals
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Novel Approaches to Cancer Research",
  "sponsor_id": "uuid-sponsor-1",
  "opportunity_id": "uuid-opportunity-1",
  "project_start_date": "2026-07-01",
  "project_end_date": "2029-06-30",
  "abstract": "This proposal aims to...",
  "department_id": "uuid-dept-1"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-proposal-123",
    "title": "Novel Approaches to Cancer Research",
    "status": "DRAFT",
    "sponsor": {
      "id": "uuid-sponsor-1",
      "name": "National Institutes of Health"
    },
    "principal_investigator": {
      "id": "uuid-pi-1",
      "name": "Dr. Jane Smith"
    },
    "project_start_date": "2026-07-01",
    "project_end_date": "2029-06-30",
    "created_at": "2026-01-25T10:30:00Z",
    "updated_at": "2026-01-25T10:30:00Z"
  },
  "meta": {
    "request_id": "req-abc123",
    "timestamp": "2026-01-25T10:30:00Z"
  },
  "links": {
    "self": "/api/v1/proposals/uuid-proposal-123",
    "budget": "/api/v1/proposals/uuid-proposal-123/budget",
    "team": "/api/v1/proposals/uuid-proposal-123/team",
    "actions": "/api/v1/proposals/uuid-proposal-123/actions"
  }
}
```

#### List Proposals with Filtering
```http
GET /api/v1/proposals?status=DRAFT,IN_REVIEW&department_id=uuid-dept-1&page=1&per_page=20&sort=-created_at
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-proposal-123",
      "title": "Novel Approaches to Cancer Research",
      "status": "DRAFT",
      "sponsor_name": "NIH",
      "pi_name": "Dr. Jane Smith",
      "created_at": "2026-01-25T10:30:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 20,
    "total_pages": 3,
    "request_id": "req-def456",
    "timestamp": "2026-01-25T10:35:00Z"
  },
  "links": {
    "self": "/api/v1/proposals?page=1&per_page=20",
    "first": "/api/v1/proposals?page=1&per_page=20",
    "next": "/api/v1/proposals?page=2&per_page=20",
    "last": "/api/v1/proposals?page=3&per_page=20"
  }
}
```

#### Execute State Transition
```http
POST /api/v1/proposals/uuid-proposal-123/actions
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "SUBMIT_FOR_REVIEW",
  "reason": "Ready for department review"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-proposal-123",
    "previous_status": "DRAFT",
    "current_status": "READY_FOR_REVIEW",
    "action": "SUBMIT_FOR_REVIEW",
    "actor": {
      "id": "uuid-user-1",
      "name": "Dr. Jane Smith"
    },
    "timestamp": "2026-01-25T11:00:00Z",
    "available_actions": [
      "APPROVE_BY_DEPT",
      "REJECT_BY_DEPT",
      "RETURN_FOR_REVISION"
    ]
  },
  "meta": {
    "request_id": "req-ghi789",
    "timestamp": "2026-01-25T11:00:00Z"
  }
}
```

### Error Responses

```json
{
  "success": false,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Project end date must be after start date",
      "field": "project_end_date",
      "details": {
        "start_date": "2026-07-01",
        "end_date": "2026-01-01"
      }
    }
  ],
  "meta": {
    "request_id": "req-xyz999",
    "timestamp": "2026-01-25T11:05:00Z"
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (created) |
| 204 | Successful DELETE |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict (state transition error) |
| 422 | Unprocessable entity |
| 500 | Internal server error |

### Query Parameters

```go
// interfaces/http/query_params.go

package http

// ListParams defines common query parameters
type ListParams struct {
    // Pagination
    Page    int `query:"page" default:"1"`
    PerPage int `query:"per_page" default:"20" max:"100"`

    // Sorting
    Sort    string `query:"sort"` // e.g., "-created_at,title"

    // Filtering
    Status       []string `query:"status"`
    DepartmentID string   `query:"department_id"`
    SponsorID    string   `query:"sponsor_id"`
    PIID         string   `query:"pi_id"`

    // Date range
    CreatedAfter  *time.Time `query:"created_after"`
    CreatedBefore *time.Time `query:"created_before"`

    // Search
    Search string `query:"q"`

    // Field selection
    Fields []string `query:"fields"`

    // Expansion
    Include []string `query:"include"` // e.g., "budget,team"
}
```

### OpenAPI Specification

```yaml
# api-contracts/openapi.yaml

openapi: 3.0.3
info:
  title: HRS Grants Module API
  version: 1.0.0
  description: |
    API for managing research grant proposals, awards, and compliance.

servers:
  - url: https://api.hrs-grants.example.com/api/v1
    description: Production
  - url: https://api-staging.hrs-grants.example.com/api/v1
    description: Staging

security:
  - bearerAuth: []

paths:
  /proposals:
    get:
      summary: List proposals
      operationId: listProposals
      tags:
        - Proposals
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PerPageParam'
        - $ref: '#/components/parameters/SortParam'
        - name: status
          in: query
          schema:
            type: array
            items:
              $ref: '#/components/schemas/ProposalStatus'
        - name: department_id
          in: query
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProposalListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

    post:
      summary: Create a new proposal
      operationId: createProposal
      tags:
        - Proposals
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProposalRequest'
      responses:
        '201':
          description: Proposal created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProposalResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    ProposalStatus:
      type: string
      enum:
        - DRAFT
        - IN_PROGRESS
        - READY_FOR_REVIEW
        - UNDER_DEPT_REVIEW
        - DEPT_APPROVED
        - DEPT_REJECTED
        - SUBMITTED
        - AWARDED
        - NOT_AWARDED
        - ARCHIVED

    Proposal:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
          maxLength: 200
        status:
          $ref: '#/components/schemas/ProposalStatus'
        sponsor:
          $ref: '#/components/schemas/SponsorRef'
        principal_investigator:
          $ref: '#/components/schemas/PersonRef'
        project_start_date:
          type: string
          format: date
        project_end_date:
          type: string
          format: date
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
    PerPageParam:
      name: per_page
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    SortParam:
      name: sort
      in: query
      description: Sort field(s), prefix with - for descending
      schema:
        type: string

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Forbidden:
      description: Permission denied
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

## Rationale

1. **Consistency**: Standard response format reduces client complexity
2. **Discoverability**: HATEOAS enables dynamic navigation
3. **Documentation**: OpenAPI enables auto-generated docs and clients
4. **Performance**: Pagination and field selection reduce payload size
5. **Versioning**: URL-based versioning is simple and explicit

## Consequences

### Positive
- Clear, consistent API design
- Auto-generated documentation
- Easy client SDK generation
- Good debugging with request IDs

### Negative
- Response envelope adds overhead
- HATEOAS links increase response size
- Versioning requires maintenance of multiple versions

## References
- [OpenAPI Specification](https://swagger.io/specification/)
- [JSON:API Specification](https://jsonapi.org/)
- [REST API Design Best Practices](https://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api)
