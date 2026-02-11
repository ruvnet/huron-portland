// Package proposal defines the 21-state proposal state machine.
package proposal

import (
	"fmt"

	"github.com/huron-bangalore/grants-management/pkg/statemachine"
)

// ProposalState represents the current state of a proposal.
type ProposalState string

// All 21 proposal states in the grants management lifecycle.
const (
	// Initial States
	StateDraft           ProposalState = "DRAFT"
	StateInProgress      ProposalState = "IN_PROGRESS"

	// Internal Review States
	StateInternalReview  ProposalState = "INTERNAL_REVIEW"
	StateDeptReview      ProposalState = "DEPT_REVIEW"
	StateOSPReview       ProposalState = "OSP_REVIEW"
	StateCompliance      ProposalState = "COMPLIANCE_REVIEW"
	StateBudgetReview    ProposalState = "BUDGET_REVIEW"

	// Approval States
	StatePendingApproval ProposalState = "PENDING_APPROVAL"
	StateApproved        ProposalState = "APPROVED"
	StateRejected        ProposalState = "REJECTED"
	StateRevisions       ProposalState = "REVISIONS_REQUESTED"

	// Submission States
	StateReadyToSubmit   ProposalState = "READY_TO_SUBMIT"
	StateSubmitted       ProposalState = "SUBMITTED"
	StateUnderReview     ProposalState = "UNDER_SPONSOR_REVIEW"

	// Award States
	StateAwarded         ProposalState = "AWARDED"
	StateNegotiation     ProposalState = "NEGOTIATION"
	StateDeclined        ProposalState = "DECLINED"
	StateNotFunded       ProposalState = "NOT_FUNDED"

	// Active States
	StateActive          ProposalState = "ACTIVE"
	StateCloseout        ProposalState = "CLOSEOUT"
	StateClosed          ProposalState = "CLOSED"

	// Special States
	StateWithdrawn       ProposalState = "WITHDRAWN"
)

// String returns the string representation of the state.
func (s ProposalState) String() string {
	return string(s)
}

// IsTerminal returns true if this is a terminal state.
func (s ProposalState) IsTerminal() bool {
	switch s {
	case StateClosed, StateWithdrawn, StateDeclined, StateNotFunded:
		return true
	default:
		return false
	}
}

// IsActive returns true if the proposal is in an active/working state.
func (s ProposalState) IsActive() bool {
	switch s {
	case StateActive, StateCloseout:
		return true
	default:
		return false
	}
}

// CanEdit returns true if the proposal can be edited in this state.
func (s ProposalState) CanEdit() bool {
	switch s {
	case StateDraft, StateInProgress, StateRevisions:
		return true
	default:
		return false
	}
}

// ProposalTransition represents a valid state transition.
type ProposalTransition string

// All valid proposal transitions.
const (
	TransitionStart            ProposalTransition = "START"
	TransitionSubmitForReview  ProposalTransition = "SUBMIT_FOR_REVIEW"
	TransitionAdvanceReview    ProposalTransition = "ADVANCE_REVIEW"
	TransitionRequestRevisions ProposalTransition = "REQUEST_REVISIONS"
	TransitionApprove          ProposalTransition = "APPROVE"
	TransitionReject           ProposalTransition = "REJECT"
	TransitionSubmitToSponsor  ProposalTransition = "SUBMIT_TO_SPONSOR"
	TransitionAward            ProposalTransition = "AWARD"
	TransitionNegotiate        ProposalTransition = "NEGOTIATE"
	TransitionDecline          ProposalTransition = "DECLINE"
	TransitionNotFund          ProposalTransition = "NOT_FUND"
	TransitionActivate         ProposalTransition = "ACTIVATE"
	TransitionCloseout         ProposalTransition = "CLOSEOUT"
	TransitionClose            ProposalTransition = "CLOSE"
	TransitionWithdraw         ProposalTransition = "WITHDRAW"
	TransitionReopen           ProposalTransition = "REOPEN"
)

// ProposalStateMachine defines the state machine for proposals.
type ProposalStateMachine struct {
	*statemachine.StateMachine[ProposalState, ProposalTransition]
}

// NewProposalStateMachine creates a new proposal state machine.
func NewProposalStateMachine() *ProposalStateMachine {
	sm := statemachine.New[ProposalState, ProposalTransition](StateDraft)

	// Define all valid transitions
	transitions := []struct {
		from       ProposalState
		transition ProposalTransition
		to         ProposalState
	}{
		// Draft -> In Progress
		{StateDraft, TransitionStart, StateInProgress},

		// In Progress -> Internal Review
		{StateInProgress, TransitionSubmitForReview, StateInternalReview},

		// Internal Review Flow
		{StateInternalReview, TransitionAdvanceReview, StateDeptReview},
		{StateInternalReview, TransitionRequestRevisions, StateRevisions},

		// Department Review Flow
		{StateDeptReview, TransitionAdvanceReview, StateOSPReview},
		{StateDeptReview, TransitionRequestRevisions, StateRevisions},

		// OSP Review Flow
		{StateOSPReview, TransitionAdvanceReview, StateCompliance},
		{StateOSPReview, TransitionRequestRevisions, StateRevisions},

		// Compliance Review Flow
		{StateCompliance, TransitionAdvanceReview, StateBudgetReview},
		{StateCompliance, TransitionRequestRevisions, StateRevisions},

		// Budget Review Flow
		{StateBudgetReview, TransitionAdvanceReview, StatePendingApproval},
		{StateBudgetReview, TransitionRequestRevisions, StateRevisions},

		// Approval Flow
		{StatePendingApproval, TransitionApprove, StateApproved},
		{StatePendingApproval, TransitionReject, StateRejected},
		{StatePendingApproval, TransitionRequestRevisions, StateRevisions},

		// Revisions can go back to In Progress
		{StateRevisions, TransitionSubmitForReview, StateInternalReview},

		// Approved -> Ready to Submit
		{StateApproved, TransitionSubmitToSponsor, StateReadyToSubmit},

		// Ready to Submit -> Submitted
		{StateReadyToSubmit, TransitionSubmitToSponsor, StateSubmitted},

		// Submitted -> Under Review
		{StateSubmitted, TransitionAdvanceReview, StateUnderReview},

		// Under Review outcomes
		{StateUnderReview, TransitionAward, StateAwarded},
		{StateUnderReview, TransitionNegotiate, StateNegotiation},
		{StateUnderReview, TransitionDecline, StateDeclined},
		{StateUnderReview, TransitionNotFund, StateNotFunded},

		// Negotiation outcomes
		{StateNegotiation, TransitionAward, StateAwarded},
		{StateNegotiation, TransitionDecline, StateDeclined},

		// Awarded -> Active
		{StateAwarded, TransitionActivate, StateActive},

		// Active -> Closeout
		{StateActive, TransitionCloseout, StateCloseout},

		// Closeout -> Closed
		{StateCloseout, TransitionClose, StateClosed},

		// Withdrawal can happen from many states
		{StateDraft, TransitionWithdraw, StateWithdrawn},
		{StateInProgress, TransitionWithdraw, StateWithdrawn},
		{StateInternalReview, TransitionWithdraw, StateWithdrawn},
		{StateDeptReview, TransitionWithdraw, StateWithdrawn},
		{StateOSPReview, TransitionWithdraw, StateWithdrawn},
		{StateCompliance, TransitionWithdraw, StateWithdrawn},
		{StateBudgetReview, TransitionWithdraw, StateWithdrawn},
		{StatePendingApproval, TransitionWithdraw, StateWithdrawn},
		{StateApproved, TransitionWithdraw, StateWithdrawn},
		{StateRevisions, TransitionWithdraw, StateWithdrawn},
		{StateReadyToSubmit, TransitionWithdraw, StateWithdrawn},

		// Rejected can be reopened
		{StateRejected, TransitionReopen, StateDraft},
	}

	for _, t := range transitions {
		sm.AddTransition(t.from, t.transition, t.to)
	}

	return &ProposalStateMachine{StateMachine: sm}
}

// CanTransition checks if a transition is valid from the current state.
func (psm *ProposalStateMachine) CanTransition(from ProposalState, transition ProposalTransition) bool {
	return psm.StateMachine.CanTransition(from, transition)
}

// GetNextState returns the next state for a valid transition.
func (psm *ProposalStateMachine) GetNextState(from ProposalState, transition ProposalTransition) (ProposalState, error) {
	return psm.StateMachine.GetNextState(from, transition)
}

// GetAvailableTransitions returns all valid transitions from a state.
func (psm *ProposalStateMachine) GetAvailableTransitions(from ProposalState) []ProposalTransition {
	return psm.StateMachine.GetAvailableTransitions(from)
}

// ValidateStateTransition validates and returns error details.
func ValidateStateTransition(from, to ProposalState) error {
	sm := NewProposalStateMachine()
	transitions := sm.GetAvailableTransitions(from)

	for _, t := range transitions {
		nextState, err := sm.GetNextState(from, t)
		if err == nil && nextState == to {
			return nil
		}
	}

	return fmt.Errorf("invalid state transition from %s to %s", from, to)
}

// StateMetadata contains metadata about a proposal state.
type StateMetadata struct {
	State            ProposalState
	DisplayName      string
	Description      string
	RequiredRoles    []string
	NotificationList []string
	SLAHours         int
}

// GetStateMetadata returns metadata for a proposal state.
func GetStateMetadata(state ProposalState) StateMetadata {
	metadata := map[ProposalState]StateMetadata{
		StateDraft: {
			State:         StateDraft,
			DisplayName:   "Draft",
			Description:   "Proposal is being drafted",
			RequiredRoles: []string{"PI", "PROPOSAL_CREATOR"},
			SLAHours:      0,
		},
		StateInProgress: {
			State:            StateInProgress,
			DisplayName:      "In Progress",
			Description:      "Proposal is actively being developed",
			RequiredRoles:    []string{"PI", "PROPOSAL_CREATOR"},
			NotificationList: []string{"PI"},
			SLAHours:         0,
		},
		StateInternalReview: {
			State:            StateInternalReview,
			DisplayName:      "Internal Review",
			Description:      "Proposal is under initial internal review",
			RequiredRoles:    []string{"REVIEWER", "DEPT_ADMIN"},
			NotificationList: []string{"PI", "DEPT_ADMIN"},
			SLAHours:         48,
		},
		StateDeptReview: {
			State:            StateDeptReview,
			DisplayName:      "Department Review",
			Description:      "Proposal is under department review",
			RequiredRoles:    []string{"DEPT_HEAD", "DEPT_ADMIN"},
			NotificationList: []string{"PI", "DEPT_HEAD"},
			SLAHours:         72,
		},
		StateOSPReview: {
			State:            StateOSPReview,
			DisplayName:      "OSP Review",
			Description:      "Proposal is under Office of Sponsored Programs review",
			RequiredRoles:    []string{"OSP_OFFICER"},
			NotificationList: []string{"PI", "DEPT_HEAD", "OSP_OFFICER"},
			SLAHours:         96,
		},
		StateCompliance: {
			State:            StateCompliance,
			DisplayName:      "Compliance Review",
			Description:      "Proposal is under compliance review",
			RequiredRoles:    []string{"COMPLIANCE_OFFICER"},
			NotificationList: []string{"PI", "OSP_OFFICER"},
			SLAHours:         72,
		},
		StateBudgetReview: {
			State:            StateBudgetReview,
			DisplayName:      "Budget Review",
			Description:      "Proposal budget is under review",
			RequiredRoles:    []string{"BUDGET_OFFICER", "OSP_OFFICER"},
			NotificationList: []string{"PI", "OSP_OFFICER"},
			SLAHours:         48,
		},
		StatePendingApproval: {
			State:            StatePendingApproval,
			DisplayName:      "Pending Approval",
			Description:      "Proposal is pending final approval",
			RequiredRoles:    []string{"OSP_DIRECTOR", "AUTHORIZED_SIGNATORY"},
			NotificationList: []string{"PI", "OSP_DIRECTOR"},
			SLAHours:         24,
		},
		StateApproved: {
			State:            StateApproved,
			DisplayName:      "Approved",
			Description:      "Proposal has been approved for submission",
			RequiredRoles:    []string{"OSP_OFFICER"},
			NotificationList: []string{"PI", "OSP_OFFICER"},
			SLAHours:         0,
		},
		StateSubmitted: {
			State:            StateSubmitted,
			DisplayName:      "Submitted",
			Description:      "Proposal has been submitted to sponsor",
			RequiredRoles:    []string{"OSP_OFFICER"},
			NotificationList: []string{"PI", "OSP_OFFICER", "DEPT_HEAD"},
			SLAHours:         0,
		},
		StateAwarded: {
			State:            StateAwarded,
			DisplayName:      "Awarded",
			Description:      "Proposal has been awarded",
			RequiredRoles:    []string{"OSP_OFFICER", "GRANTS_ADMIN"},
			NotificationList: []string{"PI", "OSP_OFFICER", "DEPT_HEAD", "GRANTS_ADMIN"},
			SLAHours:         0,
		},
		StateActive: {
			State:            StateActive,
			DisplayName:      "Active",
			Description:      "Award is active and funds are being expended",
			RequiredRoles:    []string{"PI", "GRANTS_ADMIN"},
			NotificationList: []string{"PI", "GRANTS_ADMIN"},
			SLAHours:         0,
		},
		StateClosed: {
			State:         StateClosed,
			DisplayName:   "Closed",
			Description:   "Award has been closed out",
			RequiredRoles: []string{"GRANTS_ADMIN"},
			SLAHours:      0,
		},
	}

	if m, ok := metadata[state]; ok {
		return m
	}

	return StateMetadata{
		State:       state,
		DisplayName: string(state),
		Description: "Unknown state",
	}
}
