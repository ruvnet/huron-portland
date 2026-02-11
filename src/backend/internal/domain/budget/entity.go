// Package budget defines the Budget aggregate and related entities.
package budget

import (
	"time"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
	"github.com/shopspring/decimal"
)

// Budget represents a proposal budget with multiple periods.
type Budget struct {
	common.BaseEntity

	ProposalID   uuid.UUID      `json:"proposal_id"`
	Periods      []BudgetPeriod `json:"periods"`
	FARate       FARate         `json:"fa_rate"`
	Currency     string         `json:"currency"` // ISO 4217
	Status       BudgetStatus   `json:"status"`
	SubmittedAt  *time.Time     `json:"submitted_at,omitempty"`
	ApprovedAt   *time.Time     `json:"approved_at,omitempty"`
	ApprovedBy   *uuid.UUID     `json:"approved_by,omitempty"`
	Notes        string         `json:"notes,omitempty"`
}

// BudgetStatus represents the budget review status.
type BudgetStatus string

const (
	BudgetStatusDraft     BudgetStatus = "DRAFT"
	BudgetStatusSubmitted BudgetStatus = "SUBMITTED"
	BudgetStatusInReview  BudgetStatus = "IN_REVIEW"
	BudgetStatusApproved  BudgetStatus = "APPROVED"
	BudgetStatusRejected  BudgetStatus = "REJECTED"
	BudgetStatusRevision  BudgetStatus = "REVISION_REQUESTED"
)

// BudgetPeriod represents a budget period (typically a year).
type BudgetPeriod struct {
	ID          uuid.UUID       `json:"id"`
	PeriodNumber int            `json:"period_number"` // 1, 2, 3, etc.
	StartDate   time.Time       `json:"start_date"`
	EndDate     time.Time       `json:"end_date"`
	Personnel   []PersonnelCost `json:"personnel"`
	Equipment   []EquipmentCost `json:"equipment"`
	Travel      []TravelCost    `json:"travel"`
	Supplies    []SupplyCost    `json:"supplies"`
	Contractual []ContractualCost `json:"contractual"`
	Other       []OtherCost     `json:"other"`
	Subawards   []SubawardCost  `json:"subawards"`
}

// PersonnelCost represents personnel/salary costs.
type PersonnelCost struct {
	ID              uuid.UUID       `json:"id"`
	PersonID        *uuid.UUID      `json:"person_id,omitempty"`
	Name            string          `json:"name"`
	Role            string          `json:"role"`
	BaseSalary      decimal.Decimal `json:"base_salary"`
	FringeRate      decimal.Decimal `json:"fringe_rate"`
	CalendarMonths  decimal.Decimal `json:"calendar_months"`
	AcademicMonths  decimal.Decimal `json:"academic_months"`
	SummerMonths    decimal.Decimal `json:"summer_months"`
	EffortPercent   decimal.Decimal `json:"effort_percent"`
	RequestedSalary decimal.Decimal `json:"requested_salary"`
	FringeBenefits  decimal.Decimal `json:"fringe_benefits"`
	TotalCost       decimal.Decimal `json:"total_cost"`
	IsPIOrCoPI      bool            `json:"is_pi_or_copi"`
}

// EquipmentCost represents equipment purchases.
type EquipmentCost struct {
	ID           uuid.UUID       `json:"id"`
	Description  string          `json:"description"`
	Quantity     int             `json:"quantity"`
	UnitCost     decimal.Decimal `json:"unit_cost"`
	TotalCost    decimal.Decimal `json:"total_cost"`
	Justification string         `json:"justification"`
}

// TravelCost represents travel expenses.
type TravelCost struct {
	ID          uuid.UUID       `json:"id"`
	Purpose     string          `json:"purpose"`
	Destination string          `json:"destination"`
	TripType    string          `json:"trip_type"` // domestic, international
	Travelers   int             `json:"travelers"`
	TripCount   int             `json:"trip_count"`
	CostPerTrip decimal.Decimal `json:"cost_per_trip"`
	TotalCost   decimal.Decimal `json:"total_cost"`
}

// SupplyCost represents supplies and materials.
type SupplyCost struct {
	ID          uuid.UUID       `json:"id"`
	Category    string          `json:"category"`
	Description string          `json:"description"`
	TotalCost   decimal.Decimal `json:"total_cost"`
}

// ContractualCost represents contractual services.
type ContractualCost struct {
	ID          uuid.UUID       `json:"id"`
	Vendor      string          `json:"vendor"`
	Description string          `json:"description"`
	TotalCost   decimal.Decimal `json:"total_cost"`
}

// OtherCost represents miscellaneous direct costs.
type OtherCost struct {
	ID          uuid.UUID       `json:"id"`
	Category    string          `json:"category"`
	Description string          `json:"description"`
	TotalCost   decimal.Decimal `json:"total_cost"`
}

// SubawardCost represents subaward costs.
type SubawardCost struct {
	ID               uuid.UUID       `json:"id"`
	Organization     string          `json:"organization"`
	PIName           string          `json:"pi_name"`
	DirectCosts      decimal.Decimal `json:"direct_costs"`
	IndirectCosts    decimal.Decimal `json:"indirect_costs"`
	TotalCost        decimal.Decimal `json:"total_cost"`
	FirstYearDirect  decimal.Decimal `json:"first_year_direct"` // First $25k subject to F&A
}

// FARate represents F&A (Facilities & Administrative) rate structure.
type FARate struct {
	RateType        string          `json:"rate_type"` // MTDC, TDC, S&W
	OnCampusRate    decimal.Decimal `json:"on_campus_rate"`
	OffCampusRate   decimal.Decimal `json:"off_campus_rate"`
	IsOnCampus      bool            `json:"is_on_campus"`
	EquipmentCap    decimal.Decimal `json:"equipment_cap"`
	SubawardCap     decimal.Decimal `json:"subaward_cap"` // Typically $25,000
	ExcludedItems   []string        `json:"excluded_items"`
}

// NewBudget creates a new budget for a proposal.
func NewBudget(tenantID common.TenantID, userID, proposalID uuid.UUID, currency string) *Budget {
	return &Budget{
		BaseEntity: common.NewBaseEntity(tenantID, userID),
		ProposalID: proposalID,
		Periods:    make([]BudgetPeriod, 0),
		Currency:   currency,
		Status:     BudgetStatusDraft,
		FARate:     DefaultFARate(),
	}
}

// DefaultFARate returns a default F&A rate structure.
func DefaultFARate() FARate {
	return FARate{
		RateType:      "MTDC",
		OnCampusRate:  decimal.NewFromFloat(0.55), // 55%
		OffCampusRate: decimal.NewFromFloat(0.26), // 26%
		IsOnCampus:    true,
		EquipmentCap:  decimal.NewFromInt(0), // Equipment excluded from MTDC
		SubawardCap:   decimal.NewFromInt(25000),
		ExcludedItems: []string{"equipment", "tuition", "patient_care", "subaward_excess"},
	}
}

// AddPeriod adds a budget period.
func (b *Budget) AddPeriod(period BudgetPeriod) {
	period.ID = uuid.New()
	period.PeriodNumber = len(b.Periods) + 1
	b.Periods = append(b.Periods, period)
}

// TotalDirectCosts calculates total direct costs across all periods.
func (b *Budget) TotalDirectCosts() decimal.Decimal {
	total := decimal.Zero
	for _, period := range b.Periods {
		total = total.Add(period.TotalDirectCosts())
	}
	return total
}

// TotalIndirectCosts calculates total indirect (F&A) costs across all periods.
func (b *Budget) TotalIndirectCosts() decimal.Decimal {
	total := decimal.Zero
	for _, period := range b.Periods {
		total = total.Add(period.IndirectCosts(b.FARate))
	}
	return total
}

// GrandTotal calculates the grand total (direct + indirect).
func (b *Budget) GrandTotal() decimal.Decimal {
	return b.TotalDirectCosts().Add(b.TotalIndirectCosts())
}

// TotalDirectCosts calculates direct costs for a period.
func (bp *BudgetPeriod) TotalDirectCosts() decimal.Decimal {
	total := decimal.Zero

	// Personnel
	for _, p := range bp.Personnel {
		total = total.Add(p.TotalCost)
	}

	// Equipment
	for _, e := range bp.Equipment {
		total = total.Add(e.TotalCost)
	}

	// Travel
	for _, t := range bp.Travel {
		total = total.Add(t.TotalCost)
	}

	// Supplies
	for _, s := range bp.Supplies {
		total = total.Add(s.TotalCost)
	}

	// Contractual
	for _, c := range bp.Contractual {
		total = total.Add(c.TotalCost)
	}

	// Other
	for _, o := range bp.Other {
		total = total.Add(o.TotalCost)
	}

	// Subawards
	for _, s := range bp.Subawards {
		total = total.Add(s.TotalCost)
	}

	return total
}

// MTDCBase calculates the Modified Total Direct Cost base for F&A.
func (bp *BudgetPeriod) MTDCBase(faRate FARate) decimal.Decimal {
	total := bp.TotalDirectCosts()

	// Exclude equipment (typically over $5000)
	for _, e := range bp.Equipment {
		total = total.Sub(e.TotalCost)
	}

	// Exclude subaward amounts over cap (typically $25,000)
	for _, s := range bp.Subawards {
		if s.DirectCosts.GreaterThan(faRate.SubawardCap) {
			excess := s.DirectCosts.Sub(faRate.SubawardCap)
			total = total.Sub(excess)
		}
	}

	return total
}

// IndirectCosts calculates indirect costs for a period.
func (bp *BudgetPeriod) IndirectCosts(faRate FARate) decimal.Decimal {
	base := bp.MTDCBase(faRate)

	var rate decimal.Decimal
	if faRate.IsOnCampus {
		rate = faRate.OnCampusRate
	} else {
		rate = faRate.OffCampusRate
	}

	return base.Mul(rate).Round(2)
}

// BudgetSummary provides a summary view of the budget.
type BudgetSummary struct {
	TotalPersonnel    decimal.Decimal `json:"total_personnel"`
	TotalEquipment    decimal.Decimal `json:"total_equipment"`
	TotalTravel       decimal.Decimal `json:"total_travel"`
	TotalSupplies     decimal.Decimal `json:"total_supplies"`
	TotalContractual  decimal.Decimal `json:"total_contractual"`
	TotalOther        decimal.Decimal `json:"total_other"`
	TotalSubawards    decimal.Decimal `json:"total_subawards"`
	TotalDirectCosts  decimal.Decimal `json:"total_direct_costs"`
	TotalIndirectCosts decimal.Decimal `json:"total_indirect_costs"`
	GrandTotal        decimal.Decimal `json:"grand_total"`
	PeriodCount       int             `json:"period_count"`
}

// Summary returns a budget summary.
func (b *Budget) Summary() BudgetSummary {
	summary := BudgetSummary{
		PeriodCount: len(b.Periods),
	}

	for _, period := range b.Periods {
		for _, p := range period.Personnel {
			summary.TotalPersonnel = summary.TotalPersonnel.Add(p.TotalCost)
		}
		for _, e := range period.Equipment {
			summary.TotalEquipment = summary.TotalEquipment.Add(e.TotalCost)
		}
		for _, t := range period.Travel {
			summary.TotalTravel = summary.TotalTravel.Add(t.TotalCost)
		}
		for _, s := range period.Supplies {
			summary.TotalSupplies = summary.TotalSupplies.Add(s.TotalCost)
		}
		for _, c := range period.Contractual {
			summary.TotalContractual = summary.TotalContractual.Add(c.TotalCost)
		}
		for _, o := range period.Other {
			summary.TotalOther = summary.TotalOther.Add(o.TotalCost)
		}
		for _, s := range period.Subawards {
			summary.TotalSubawards = summary.TotalSubawards.Add(s.TotalCost)
		}
	}

	summary.TotalDirectCosts = b.TotalDirectCosts()
	summary.TotalIndirectCosts = b.TotalIndirectCosts()
	summary.GrandTotal = b.GrandTotal()

	return summary
}
