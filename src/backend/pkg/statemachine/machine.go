// Package statemachine provides a generic state machine implementation.
package statemachine

import (
	"errors"
	"sync"
)

// ErrInvalidTransition is returned when a transition is not allowed.
var ErrInvalidTransition = errors.New("invalid state transition")

// ErrNoTransitions is returned when no transitions are defined.
var ErrNoTransitions = errors.New("no transitions defined for state")

// State represents a state type constraint.
type State interface {
	~string
}

// Transition represents a transition type constraint.
type Transition interface {
	~string
}

// StateMachine is a generic state machine implementation.
type StateMachine[S State, T Transition] struct {
	mu           sync.RWMutex
	initialState S
	transitions  map[S]map[T]S
	onEnter      map[S][]func(from S)
	onExit       map[S][]func(to S)
	guards       map[T][]func(from, to S) bool
}

// New creates a new state machine with an initial state.
func New[S State, T Transition](initialState S) *StateMachine[S, T] {
	return &StateMachine[S, T]{
		initialState: initialState,
		transitions:  make(map[S]map[T]S),
		onEnter:      make(map[S][]func(from S)),
		onExit:       make(map[S][]func(to S)),
		guards:       make(map[T][]func(from, to S) bool),
	}
}

// AddTransition adds a valid transition from one state to another.
func (sm *StateMachine[S, T]) AddTransition(from S, transition T, to S) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.transitions[from] == nil {
		sm.transitions[from] = make(map[T]S)
	}
	sm.transitions[from][transition] = to
}

// AddTransitions adds multiple transitions at once.
func (sm *StateMachine[S, T]) AddTransitions(transitions []struct {
	From       S
	Transition T
	To         S
}) {
	for _, t := range transitions {
		sm.AddTransition(t.From, t.Transition, t.To)
	}
}

// CanTransition checks if a transition is valid from a given state.
func (sm *StateMachine[S, T]) CanTransition(from S, transition T) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if stateTransitions, ok := sm.transitions[from]; ok {
		if to, exists := stateTransitions[transition]; exists {
			// Check guards
			if guards, hasGuards := sm.guards[transition]; hasGuards {
				for _, guard := range guards {
					if !guard(from, to) {
						return false
					}
				}
			}
			return true
		}
	}
	return false
}

// GetNextState returns the next state for a valid transition.
func (sm *StateMachine[S, T]) GetNextState(from S, transition T) (S, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if stateTransitions, ok := sm.transitions[from]; ok {
		if to, exists := stateTransitions[transition]; exists {
			// Check guards
			if guards, hasGuards := sm.guards[transition]; hasGuards {
				for _, guard := range guards {
					if !guard(from, to) {
						var zero S
						return zero, ErrInvalidTransition
					}
				}
			}
			return to, nil
		}
	}
	var zero S
	return zero, ErrInvalidTransition
}

// GetAvailableTransitions returns all valid transitions from a state.
func (sm *StateMachine[S, T]) GetAvailableTransitions(from S) []T {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	var result []T
	if stateTransitions, ok := sm.transitions[from]; ok {
		for transition, to := range stateTransitions {
			// Check guards
			allowed := true
			if guards, hasGuards := sm.guards[transition]; hasGuards {
				for _, guard := range guards {
					if !guard(from, to) {
						allowed = false
						break
					}
				}
			}
			if allowed {
				result = append(result, transition)
			}
		}
	}
	return result
}

// OnEnter registers a callback for when a state is entered.
func (sm *StateMachine[S, T]) OnEnter(state S, callback func(from S)) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.onEnter[state] = append(sm.onEnter[state], callback)
}

// OnExit registers a callback for when a state is exited.
func (sm *StateMachine[S, T]) OnExit(state S, callback func(to S)) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.onExit[state] = append(sm.onExit[state], callback)
}

// AddGuard adds a guard condition for a transition.
func (sm *StateMachine[S, T]) AddGuard(transition T, guard func(from, to S) bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.guards[transition] = append(sm.guards[transition], guard)
}

// GetAllStates returns all states that have transitions defined.
func (sm *StateMachine[S, T]) GetAllStates() []S {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	stateSet := make(map[S]bool)
	for from, transitions := range sm.transitions {
		stateSet[from] = true
		for _, to := range transitions {
			stateSet[to] = true
		}
	}

	var states []S
	for state := range stateSet {
		states = append(states, state)
	}
	return states
}

// InitialState returns the initial state.
func (sm *StateMachine[S, T]) InitialState() S {
	return sm.initialState
}

// ExecuteTransition performs a transition and triggers callbacks.
func (sm *StateMachine[S, T]) ExecuteTransition(currentState S, transition T) (S, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	stateTransitions, ok := sm.transitions[currentState]
	if !ok {
		var zero S
		return zero, ErrNoTransitions
	}

	nextState, exists := stateTransitions[transition]
	if !exists {
		var zero S
		return zero, ErrInvalidTransition
	}

	// Check guards
	if guards, hasGuards := sm.guards[transition]; hasGuards {
		for _, guard := range guards {
			if !guard(currentState, nextState) {
				var zero S
				return zero, ErrInvalidTransition
			}
		}
	}

	// Execute exit callbacks
	if exitCallbacks, hasExit := sm.onExit[currentState]; hasExit {
		for _, callback := range exitCallbacks {
			callback(nextState)
		}
	}

	// Execute enter callbacks
	if enterCallbacks, hasEnter := sm.onEnter[nextState]; hasEnter {
		for _, callback := range enterCallbacks {
			callback(currentState)
		}
	}

	return nextState, nil
}

// Clone creates a copy of the state machine.
func (sm *StateMachine[S, T]) Clone() *StateMachine[S, T] {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	clone := New[S, T](sm.initialState)

	for from, transitions := range sm.transitions {
		for transition, to := range transitions {
			clone.AddTransition(from, transition, to)
		}
	}

	// Note: callbacks and guards are not cloned for safety

	return clone
}

// TransitionInfo provides information about a transition.
type TransitionInfo[S State, T Transition] struct {
	From       S `json:"from"`
	Transition T `json:"transition"`
	To         S `json:"to"`
}

// GetAllTransitions returns all defined transitions.
func (sm *StateMachine[S, T]) GetAllTransitions() []TransitionInfo[S, T] {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	var result []TransitionInfo[S, T]
	for from, transitions := range sm.transitions {
		for transition, to := range transitions {
			result = append(result, TransitionInfo[S, T]{
				From:       from,
				Transition: transition,
				To:         to,
			})
		}
	}
	return result
}
