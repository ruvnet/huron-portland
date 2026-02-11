# ADR-003: State Machine Implementation for Workflow Management

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module requires complex workflow management with:
- 21 Proposal states with 26 actions
- 26 Award states with complex transitions
- Configurable workflows per institution
- Full audit trail of all state changes
- Guard conditions for transitions
- Side effects on state changes (notifications, integrations)

## Decision

We will implement a **Domain-Driven State Machine** pattern with:
1. State machines as first-class domain objects
2. Configurable transition rules per tenant
3. Event-driven side effects
4. Immutable state history

### State Machine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     STATE MACHINE                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   STATES                             │   │
│  │  Draft → InReview → Approved → Submitted → ...      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 TRANSITIONS                          │   │
│  │  Action + Guards → New State + Side Effects         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   GUARDS                             │   │
│  │  Permission checks, Business rule validation        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                SIDE EFFECTS                          │   │
│  │  Domain Events, Notifications, Integrations         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Proposal States (21 States)

```go
type ProposalState string

const (
    // Creation Phase
    StateDraft              ProposalState = "DRAFT"
    StateInProgress         ProposalState = "IN_PROGRESS"

    // Review Phase
    StateReadyForReview     ProposalState = "READY_FOR_REVIEW"
    StateUnderDeptReview    ProposalState = "UNDER_DEPT_REVIEW"
    StateDeptApproved       ProposalState = "DEPT_APPROVED"
    StateDeptRejected       ProposalState = "DEPT_REJECTED"
    StateUnderSponsorReview ProposalState = "UNDER_SPONSOR_REVIEW"
    StateSponsorApproved    ProposalState = "SPONSOR_APPROVED"
    StateSponsorRejected    ProposalState = "SPONSOR_REJECTED"

    // Submission Phase
    StateReadyForSubmission ProposalState = "READY_FOR_SUBMISSION"
    StateSubmitting         ProposalState = "SUBMITTING"
    StateSubmitted          ProposalState = "SUBMITTED"
    StateSubmissionFailed   ProposalState = "SUBMISSION_FAILED"

    // Post-Submission Phase
    StateUnderAgencyReview  ProposalState = "UNDER_AGENCY_REVIEW"
    StateAwarded            ProposalState = "AWARDED"
    StateNotAwarded         ProposalState = "NOT_AWARDED"
    StateWithdrawn          ProposalState = "WITHDRAWN"

    // Revision Phase
    StateRevisionRequested  ProposalState = "REVISION_REQUESTED"
    StateRevisionInProgress ProposalState = "REVISION_IN_PROGRESS"
    StateRevisionSubmitted  ProposalState = "REVISION_SUBMITTED"

    // Terminal
    StateArchived           ProposalState = "ARCHIVED"
)
```

### Proposal Actions (26 Actions)

```go
type ProposalAction string

const (
    ActionCreate              ProposalAction = "CREATE"
    ActionSaveDraft           ProposalAction = "SAVE_DRAFT"
    ActionSubmitForReview     ProposalAction = "SUBMIT_FOR_REVIEW"
    ActionApproveByDept       ProposalAction = "APPROVE_BY_DEPT"
    ActionRejectByDept        ProposalAction = "REJECT_BY_DEPT"
    ActionReturnForRevision   ProposalAction = "RETURN_FOR_REVISION"
    ActionApplyCorrections    ProposalAction = "APPLY_CORRECTIONS"
    ActionResubmitForReview   ProposalAction = "RESUBMIT_FOR_REVIEW"
    ActionSubmitToSponsor     ProposalAction = "SUBMIT_TO_SPONSOR"
    ActionApproveBySponsor    ProposalAction = "APPROVE_BY_SPONSOR"
    ActionRejectBySponsor     ProposalAction = "REJECT_BY_SPONSOR"
    ActionSubmitToAgency      ProposalAction = "SUBMIT_TO_AGENCY"
    ActionMarkSubmitted       ProposalAction = "MARK_SUBMITTED"
    ActionMarkSubmissionFailed ProposalAction = "MARK_SUBMISSION_FAILED"
    ActionRetrySubmission     ProposalAction = "RETRY_SUBMISSION"
    ActionReceiveAgencyUpdate ProposalAction = "RECEIVE_AGENCY_UPDATE"
    ActionAward               ProposalAction = "AWARD"
    ActionDecline             ProposalAction = "DECLINE"
    ActionWithdraw            ProposalAction = "WITHDRAW"
    ActionRequestRevision     ProposalAction = "REQUEST_REVISION"
    ActionStartRevision       ProposalAction = "START_REVISION"
    ActionSubmitRevision      ProposalAction = "SUBMIT_REVISION"
    ActionClone               ProposalAction = "CLONE"
    ActionArchive             ProposalAction = "ARCHIVE"
    ActionUnarchive           ProposalAction = "UNARCHIVE"
    ActionAddCollaborator     ProposalAction = "ADD_COLLABORATOR"
)
```

### State Machine Domain Model

```go
// domain/proposal/state_machine.go

package proposal

import (
    "context"
    "errors"
    "time"
)

// Transition defines a valid state change
type Transition struct {
    FromState    ProposalState
    ToState      ProposalState
    Action       ProposalAction
    Guards       []Guard
    SideEffects  []SideEffect
}

// Guard is a predicate that must be true for transition to proceed
type Guard interface {
    Check(ctx context.Context, proposal *Proposal, actor Actor) error
}

// SideEffect is executed after successful transition
type SideEffect interface {
    Execute(ctx context.Context, proposal *Proposal, transition *TransitionRecord) error
}

// TransitionRecord captures the history of a state change
type TransitionRecord struct {
    ID            string
    ProposalID    string
    FromState     ProposalState
    ToState       ProposalState
    Action        ProposalAction
    ActorID       string
    ActorRole     string
    Timestamp     time.Time
    Reason        string
    Metadata      map[string]interface{}
}

// StateMachine manages proposal state transitions
type StateMachine struct {
    transitions map[stateActionKey]Transition
    tenantConfig *TenantWorkflowConfig
}

type stateActionKey struct {
    state  ProposalState
    action ProposalAction
}

// CanTransition checks if an action is valid from current state
func (sm *StateMachine) CanTransition(proposal *Proposal, action ProposalAction) bool {
    key := stateActionKey{state: proposal.State, action: action}
    _, exists := sm.transitions[key]
    return exists
}

// Transition attempts to move proposal to new state
func (sm *StateMachine) Transition(
    ctx context.Context,
    proposal *Proposal,
    action ProposalAction,
    actor Actor,
    reason string,
) (*TransitionRecord, error) {
    key := stateActionKey{state: proposal.State, action: action}
    transition, exists := sm.transitions[key]
    if !exists {
        return nil, ErrInvalidTransition
    }

    // Check all guards
    for _, guard := range transition.Guards {
        if err := guard.Check(ctx, proposal, actor); err != nil {
            return nil, err
        }
    }

    // Record the transition
    record := &TransitionRecord{
        ID:         generateID(),
        ProposalID: proposal.ID,
        FromState:  proposal.State,
        ToState:    transition.ToState,
        Action:     action,
        ActorID:    actor.ID,
        ActorRole:  actor.Role,
        Timestamp:  time.Now().UTC(),
        Reason:     reason,
    }

    // Update proposal state
    proposal.State = transition.ToState
    proposal.UpdatedAt = record.Timestamp
    proposal.UpdatedBy = actor.ID

    // Execute side effects (async via domain events)
    for _, effect := range transition.SideEffects {
        if err := effect.Execute(ctx, proposal, record); err != nil {
            // Log but don't fail the transition
            logSideEffectError(err)
        }
    }

    return record, nil
}
```

### Guard Examples

```go
// PermissionGuard checks if actor has required role
type PermissionGuard struct {
    RequiredRoles []string
}

func (g *PermissionGuard) Check(ctx context.Context, proposal *Proposal, actor Actor) error {
    for _, role := range g.RequiredRoles {
        if actor.HasRole(role, proposal.DepartmentID) {
            return nil
        }
    }
    return ErrInsufficientPermissions
}

// BudgetCompleteGuard ensures budget is finalized
type BudgetCompleteGuard struct{}

func (g *BudgetCompleteGuard) Check(ctx context.Context, proposal *Proposal, actor Actor) error {
    if !proposal.Budget.IsComplete() {
        return ErrBudgetIncomplete
    }
    return nil
}

// ComplianceApprovedGuard ensures all compliance items are approved
type ComplianceApprovedGuard struct{}

func (g *ComplianceApprovedGuard) Check(ctx context.Context, proposal *Proposal, actor Actor) error {
    for _, item := range proposal.ComplianceItems {
        if !item.IsApproved() {
            return ErrComplianceNotApproved
        }
    }
    return nil
}
```

### Configurable Workflow per Tenant

```go
// TenantWorkflowConfig allows institutions to customize workflows
type TenantWorkflowConfig struct {
    TenantID              string
    RequireDeptApproval   bool
    RequireSponsorApproval bool
    AutoSubmitOnApproval  bool
    CustomGuards          map[ProposalAction][]GuardConfig
    NotificationRules     []NotificationRule
}

// LoadTenantStateMachine creates a customized state machine
func LoadTenantStateMachine(config *TenantWorkflowConfig) *StateMachine {
    sm := NewDefaultStateMachine()

    if !config.RequireDeptApproval {
        sm.BypassState(StateDeptApproved)
    }

    if !config.RequireSponsorApproval {
        sm.BypassState(StateSponsorApproved)
    }

    // Apply custom guards
    for action, guards := range config.CustomGuards {
        sm.AddGuards(action, guards...)
    }

    return sm
}
```

## Rationale

1. **Domain Encapsulation**: State machine logic lives in domain layer
2. **Auditability**: Every transition is recorded with full context
3. **Configurability**: Institutions can customize workflows
4. **Testability**: Guards and transitions can be unit tested
5. **Compliance**: Clear audit trail for regulatory requirements

## Consequences

### Positive
- Predictable state transitions
- Complete audit history
- Tenant-specific customization
- Easy to add new states or transitions

### Negative
- Complexity in managing 21 states and 26 actions
- Configuration management overhead
- Need to handle transition conflicts

## State Diagram (Simplified)

```
[Draft] --submit_for_review--> [Ready for Review]
                                      |
                    +-----------------+-----------------+
                    |                                   |
            [Under Dept Review]               [Under Sponsor Review]
                    |                                   |
         +----+----+----+                    +----+----+----+
         |              |                    |              |
    [Approved]    [Rejected]            [Approved]    [Rejected]
         |                                   |
         +---------------+-------------------+
                         |
              [Ready for Submission]
                         |
                   [Submitting]
                         |
              +----------+----------+
              |                     |
         [Submitted]       [Submission Failed]
              |                     |
              +----------+----------+
                         |
              [Under Agency Review]
                         |
              +----------+----------+
              |                     |
          [Awarded]           [Not Awarded]
              |
          [Archive]
```

## References
- FR-018: State Machine for Proposal Workflow
- FR-019: Configurable Approval Workflows
- HRS Grants Module Requirements Specifications v1.1 (Section 3.2.2)
