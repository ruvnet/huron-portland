// Package common provides shared domain primitives for the grants management system.
package common

import (
	"time"

	"github.com/google/uuid"
)

// TenantID represents a unique tenant identifier for multi-tenancy.
type TenantID uuid.UUID

// String returns the string representation of a TenantID.
func (t TenantID) String() string {
	return uuid.UUID(t).String()
}

// ParseTenantID parses a string into a TenantID.
func ParseTenantID(s string) (TenantID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return TenantID{}, err
	}
	return TenantID(id), nil
}

// NewTenantID generates a new random TenantID.
func NewTenantID() TenantID {
	return TenantID(uuid.New())
}

// BaseEntity provides common fields for all domain entities.
type BaseEntity struct {
	ID        uuid.UUID `json:"id"`
	TenantID  TenantID  `json:"tenant_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedBy uuid.UUID `json:"created_by"`
	UpdatedBy uuid.UUID `json:"updated_by"`
	Version   int       `json:"version"` // Optimistic locking
}

// NewBaseEntity creates a new base entity with initialized fields.
func NewBaseEntity(tenantID TenantID, userID uuid.UUID) BaseEntity {
	now := time.Now().UTC()
	return BaseEntity{
		ID:        uuid.New(),
		TenantID:  tenantID,
		CreatedAt: now,
		UpdatedAt: now,
		CreatedBy: userID,
		UpdatedBy: userID,
		Version:   1,
	}
}

// Touch updates the modification timestamp and version.
func (e *BaseEntity) Touch(userID uuid.UUID) {
	e.UpdatedAt = time.Now().UTC()
	e.UpdatedBy = userID
	e.Version++
}

// AuditInfo contains audit trail information.
type AuditInfo struct {
	Action      string                 `json:"action"`
	PerformedBy uuid.UUID              `json:"performed_by"`
	PerformedAt time.Time              `json:"performed_at"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// NewAuditInfo creates a new audit info entry.
func NewAuditInfo(action string, userID uuid.UUID, metadata map[string]interface{}) AuditInfo {
	return AuditInfo{
		Action:      action,
		PerformedBy: userID,
		PerformedAt: time.Now().UTC(),
		Metadata:    metadata,
	}
}

// TenantContext provides tenant-aware context for operations.
type TenantContext struct {
	TenantID TenantID
	UserID   uuid.UUID
	Roles    []string
}

// HasRole checks if the context has a specific role.
func (tc *TenantContext) HasRole(role string) bool {
	for _, r := range tc.Roles {
		if r == role {
			return true
		}
	}
	return false
}

// Money represents a monetary value with currency.
type Money struct {
	Amount   int64  `json:"amount"`   // Amount in smallest currency unit (cents)
	Currency string `json:"currency"` // ISO 4217 currency code
}

// NewMoney creates a new Money value.
func NewMoney(amount int64, currency string) Money {
	return Money{
		Amount:   amount,
		Currency: currency,
	}
}

// Add adds two Money values (must be same currency).
func (m Money) Add(other Money) Money {
	if m.Currency != other.Currency {
		panic("cannot add money with different currencies")
	}
	return Money{
		Amount:   m.Amount + other.Amount,
		Currency: m.Currency,
	}
}

// Subtract subtracts two Money values (must be same currency).
func (m Money) Subtract(other Money) Money {
	if m.Currency != other.Currency {
		panic("cannot subtract money with different currencies")
	}
	return Money{
		Amount:   m.Amount - other.Amount,
		Currency: m.Currency,
	}
}

// DateRange represents a range of dates.
type DateRange struct {
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

// Duration returns the duration of the date range.
func (dr DateRange) Duration() time.Duration {
	return dr.EndDate.Sub(dr.StartDate)
}

// Contains checks if a date falls within the range.
func (dr DateRange) Contains(date time.Time) bool {
	return (date.Equal(dr.StartDate) || date.After(dr.StartDate)) &&
		(date.Equal(dr.EndDate) || date.Before(dr.EndDate))
}

// Overlaps checks if two date ranges overlap.
func (dr DateRange) Overlaps(other DateRange) bool {
	return dr.StartDate.Before(other.EndDate) && other.StartDate.Before(dr.EndDate)
}
