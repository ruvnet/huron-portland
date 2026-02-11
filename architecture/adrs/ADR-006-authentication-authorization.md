# ADR-006: JWT Authentication with RBAC Authorization

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module requires:
- Secure authentication for 500 concurrent users per tenant
- Role-based access control (RBAC) for 6+ distinct personas
- Department-level permission scoping
- Compliance with FedRamp, HIPAA, and SOC2
- Integration with institutional identity providers (SSO)

## Decision

We will implement **JWT-based authentication** with **Hierarchical RBAC authorization**.

### Authentication Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Client    │         │  Auth Service │         │   Identity   │
│  (Frontend)  │         │    (Backend)  │         │   Provider   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  1. Login Request      │                        │
       │───────────────────────▶│                        │
       │                        │  2. Validate (SAML/OIDC)
       │                        │───────────────────────▶│
       │                        │                        │
       │                        │  3. Identity Response  │
       │                        │◀───────────────────────│
       │                        │                        │
       │  4. JWT + Refresh      │                        │
       │◀───────────────────────│                        │
       │                        │                        │
       │  5. API Request + JWT  │                        │
       │───────────────────────▶│                        │
       │                        │                        │
       │  6. Protected Resource │                        │
       │◀───────────────────────│                        │
       │                        │                        │
```

### JWT Structure

```go
// domain/identity/jwt.go

package identity

import (
    "time"
)

// JWTClaims defines the token payload
type JWTClaims struct {
    // Standard claims
    Subject   string    `json:"sub"`   // User ID
    IssuedAt  time.Time `json:"iat"`
    ExpiresAt time.Time `json:"exp"`
    Issuer    string    `json:"iss"`

    // Custom claims
    TenantID     string   `json:"tenant_id"`
    Email        string   `json:"email"`
    DisplayName  string   `json:"display_name"`
    Roles        []RoleAssignment `json:"roles"`
    Permissions  []string `json:"permissions"`
    DepartmentIDs []string `json:"department_ids"`

    // Security metadata
    SessionID    string `json:"session_id"`
    DeviceID     string `json:"device_id"`
    IPAddress    string `json:"ip_address"`
}

// RoleAssignment represents a role scoped to a department
type RoleAssignment struct {
    Role         Role   `json:"role"`
    DepartmentID string `json:"department_id,omitempty"`
    Scope        Scope  `json:"scope"`
}

type Scope string

const (
    ScopeTenant     Scope = "TENANT"      // Entire institution
    ScopeDepartment Scope = "DEPARTMENT"  // Single department
    ScopeProject    Scope = "PROJECT"     // Single proposal/award
)
```

### Role Definitions

```go
// domain/identity/roles.go

package identity

type Role string

const (
    // Core Roles (from Requirements)
    RolePrincipalInvestigator Role = "PRINCIPAL_INVESTIGATOR"
    RoleProposalCreator       Role = "PROPOSAL_CREATOR"
    RoleGrantsAdministrator   Role = "GRANTS_ADMINISTRATOR"
    RoleGrantsSpecialist      Role = "GRANTS_SPECIALIST"
    RoleDataManager           Role = "DATA_MANAGER"
    RoleAwardApprover         Role = "AWARD_APPROVER"
    RoleBudgetInvestigator    Role = "BUDGET_INVESTIGATOR"

    // Administrative Roles
    RoleTenantAdmin           Role = "TENANT_ADMIN"
    RoleDepartmentAdmin       Role = "DEPARTMENT_ADMIN"
    RoleSystemAdmin           Role = "SYSTEM_ADMIN"

    // Specialized Roles
    RoleComplianceOfficer     Role = "COMPLIANCE_OFFICER"
    RoleFinanceOfficer        Role = "FINANCE_OFFICER"
    RoleAuditor               Role = "AUDITOR"
)

// RolePermissions maps roles to their allowed actions
var RolePermissions = map[Role][]Permission{
    RolePrincipalInvestigator: {
        PermissionProposalCreate,
        PermissionProposalEdit,
        PermissionProposalSubmit,
        PermissionBudgetEdit,
        PermissionTeamManage,
    },
    RoleProposalCreator: {
        PermissionProposalCreate,
        PermissionProposalEdit,
        PermissionBudgetView,
    },
    RoleGrantsAdministrator: {
        PermissionProposalViewAll,
        PermissionProposalApprove,
        PermissionProposalReject,
        PermissionAwardManage,
        PermissionReportGenerate,
    },
    RoleGrantsSpecialist: {
        PermissionProposalView,
        PermissionProposalEdit,
        PermissionBudgetEdit,
        PermissionComplianceManage,
    },
    // ... more role mappings
}
```

### Permission Model

```go
// domain/identity/permissions.go

package identity

type Permission string

const (
    // Proposal Permissions
    PermissionProposalCreate    Permission = "proposal:create"
    PermissionProposalView      Permission = "proposal:view"
    PermissionProposalViewAll   Permission = "proposal:view_all"
    PermissionProposalEdit      Permission = "proposal:edit"
    PermissionProposalDelete    Permission = "proposal:delete"
    PermissionProposalSubmit    Permission = "proposal:submit"
    PermissionProposalApprove   Permission = "proposal:approve"
    PermissionProposalReject    Permission = "proposal:reject"

    // Budget Permissions
    PermissionBudgetView        Permission = "budget:view"
    PermissionBudgetEdit        Permission = "budget:edit"
    PermissionBudgetApprove     Permission = "budget:approve"

    // Award Permissions
    PermissionAwardView         Permission = "award:view"
    PermissionAwardManage       Permission = "award:manage"
    PermissionAwardClose        Permission = "award:close"

    // Compliance Permissions
    PermissionComplianceView    Permission = "compliance:view"
    PermissionComplianceManage  Permission = "compliance:manage"
    PermissionComplianceApprove Permission = "compliance:approve"

    // Team Permissions
    PermissionTeamView          Permission = "team:view"
    PermissionTeamManage        Permission = "team:manage"

    // Admin Permissions
    PermissionUserManage        Permission = "user:manage"
    PermissionRoleManage        Permission = "role:manage"
    PermissionAuditView         Permission = "audit:view"
    PermissionReportGenerate    Permission = "report:generate"
)
```

### Authorization Middleware

```go
// interfaces/http/middleware/auth.go

package middleware

import (
    "context"
    "net/http"
    "strings"
)

type AuthMiddleware struct {
    jwtValidator  JWTValidator
    permissions   PermissionChecker
}

// Authenticate validates JWT and sets user context
func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract token
        authHeader := r.Header.Get("Authorization")
        if !strings.HasPrefix(authHeader, "Bearer ") {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        token := strings.TrimPrefix(authHeader, "Bearer ")

        // Validate and parse
        claims, err := m.jwtValidator.Validate(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // Check token expiration
        if claims.ExpiresAt.Before(time.Now()) {
            http.Error(w, "Token expired", http.StatusUnauthorized)
            return
        }

        // Set context
        ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
        ctx = context.WithValue(ctx, TenantIDKey, claims.TenantID)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// RequirePermission checks if user has required permission
func (m *AuthMiddleware) RequirePermission(permission Permission) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := r.Context().Value(UserClaimsKey).(*JWTClaims)

            if !m.permissions.HasPermission(claims, permission) {
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

// RequireRole checks if user has required role
func (m *AuthMiddleware) RequireRole(roles ...Role) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := r.Context().Value(UserClaimsKey).(*JWTClaims)

            hasRole := false
            for _, required := range roles {
                for _, assignment := range claims.Roles {
                    if assignment.Role == required {
                        hasRole = true
                        break
                    }
                }
            }

            if !hasRole {
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

### Resource-Level Authorization

```go
// domain/shared/authorization.go

package shared

// ResourceAuthorizer checks access to specific resources
type ResourceAuthorizer struct {
    userRepo UserRepository
    roleRepo RoleRepository
}

// CanAccessProposal checks if user can access a specific proposal
func (a *ResourceAuthorizer) CanAccessProposal(
    ctx context.Context,
    userID string,
    proposalID string,
    action Permission,
) (bool, error) {
    proposal, err := a.proposalRepo.GetByID(ctx, proposalID)
    if err != nil {
        return false, err
    }

    user, err := a.userRepo.GetByID(ctx, userID)
    if err != nil {
        return false, err
    }

    // Check if user is on the proposal team
    if proposal.HasTeamMember(userID) {
        teamRole := proposal.GetTeamRole(userID)
        if hasPermissionForRole(teamRole, action) {
            return true, nil
        }
    }

    // Check department-level access
    for _, role := range user.Roles {
        if role.Scope == ScopeDepartment &&
           role.DepartmentID == proposal.DepartmentID {
            if hasPermissionForRole(role.Role, action) {
                return true, nil
            }
        }

        // Tenant-wide roles
        if role.Scope == ScopeTenant {
            if hasPermissionForRole(role.Role, action) {
                return true, nil
            }
        }
    }

    return false, nil
}
```

### Token Refresh Flow

```go
// application/services/auth_service.go

package services

type AuthService struct {
    tokenStore    TokenStore
    jwtSigner     JWTSigner
    refreshExpiry time.Duration
    accessExpiry  time.Duration
}

type TokenPair struct {
    AccessToken  string    `json:"access_token"`
    RefreshToken string    `json:"refresh_token"`
    ExpiresAt    time.Time `json:"expires_at"`
}

// Refresh generates new token pair from valid refresh token
func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*TokenPair, error) {
    // Validate refresh token
    stored, err := s.tokenStore.Get(ctx, refreshToken)
    if err != nil {
        return nil, ErrInvalidRefreshToken
    }

    if stored.ExpiresAt.Before(time.Now()) {
        return nil, ErrRefreshTokenExpired
    }

    // Revoke old refresh token
    if err := s.tokenStore.Delete(ctx, refreshToken); err != nil {
        return nil, err
    }

    // Generate new tokens
    return s.generateTokenPair(ctx, stored.UserID, stored.TenantID)
}

func (s *AuthService) generateTokenPair(
    ctx context.Context,
    userID string,
    tenantID string,
) (*TokenPair, error) {
    // Load fresh user data
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }

    // Build claims
    claims := &JWTClaims{
        Subject:      userID,
        TenantID:     tenantID,
        Email:        user.Email,
        DisplayName:  user.DisplayName,
        Roles:        user.Roles,
        Permissions:  computePermissions(user.Roles),
        IssuedAt:     time.Now(),
        ExpiresAt:    time.Now().Add(s.accessExpiry),
    }

    accessToken, err := s.jwtSigner.Sign(claims)
    if err != nil {
        return nil, err
    }

    // Generate refresh token
    refreshToken := generateSecureToken()
    if err := s.tokenStore.Store(ctx, &RefreshTokenData{
        Token:     refreshToken,
        UserID:    userID,
        TenantID:  tenantID,
        ExpiresAt: time.Now().Add(s.refreshExpiry),
    }); err != nil {
        return nil, err
    }

    return &TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresAt:    claims.ExpiresAt,
    }, nil
}
```

## Security Considerations

### Token Security
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry with rotation
- Tokens stored with encryption at rest
- Secure token generation using crypto/rand

### Compliance Mapping

| Requirement | Implementation |
|-------------|----------------|
| FedRamp AC-2 | Role-based access control |
| FedRamp AC-3 | Permission enforcement at API layer |
| HIPAA Access Control | Department-level scoping |
| SOC2 CC6.1 | Authentication logging |
| OWASP Session | Secure token handling |

## Rationale

1. **Stateless**: JWT enables horizontal scaling
2. **Performance**: No database lookup for every request
3. **Security**: Short-lived tokens reduce attack window
4. **Flexibility**: RBAC supports complex permission requirements
5. **Compliance**: Meets FedRamp and HIPAA requirements

## Consequences

### Positive
- Scalable authentication without session state
- Fine-grained permission control
- SSO integration support
- Complete audit trail

### Negative
- Token revocation requires token blacklist
- JWT size increases with roles/permissions
- Clock synchronization important for expiry

## References
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- FR-002: JWT Authentication
- FR-003: RBAC Authorization
