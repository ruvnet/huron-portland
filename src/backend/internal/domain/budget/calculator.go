// Package budget provides F&A calculation utilities.
package budget

import (
	"github.com/shopspring/decimal"
)

// Calculator provides budget calculation methods.
type Calculator struct {
	FARate FARate
}

// NewCalculator creates a new budget calculator.
func NewCalculator(faRate FARate) *Calculator {
	return &Calculator{FARate: faRate}
}

// CalculatePersonnelCost calculates the total cost for a personnel line item.
func (c *Calculator) CalculatePersonnelCost(baseSalary, effort, fringeRate decimal.Decimal, months PersonnelMonths) PersonnelCostResult {
	// Calculate total months
	totalMonths := months.Calendar.Add(months.Academic).Add(months.Summer)

	// Calculate requested salary based on effort and months
	// Salary = (BaseSalary * TotalMonths / 12) * EffortPercent
	annualPortion := baseSalary.Mul(totalMonths).Div(decimal.NewFromInt(12))
	requestedSalary := annualPortion.Mul(effort.Div(decimal.NewFromInt(100))).Round(2)

	// Calculate fringe benefits
	fringeBenefits := requestedSalary.Mul(fringeRate).Round(2)

	// Total cost
	totalCost := requestedSalary.Add(fringeBenefits)

	return PersonnelCostResult{
		RequestedSalary: requestedSalary,
		FringeBenefits:  fringeBenefits,
		TotalCost:       totalCost,
	}
}

// PersonnelMonths represents the breakdown of personnel months.
type PersonnelMonths struct {
	Calendar decimal.Decimal
	Academic decimal.Decimal
	Summer   decimal.Decimal
}

// PersonnelCostResult contains calculated personnel costs.
type PersonnelCostResult struct {
	RequestedSalary decimal.Decimal
	FringeBenefits  decimal.Decimal
	TotalCost       decimal.Decimal
}

// CalculateMTDCBase calculates the Modified Total Direct Cost base.
func (c *Calculator) CalculateMTDCBase(period *BudgetPeriod) decimal.Decimal {
	return period.MTDCBase(c.FARate)
}

// CalculateIndirectCosts calculates indirect costs for a period.
func (c *Calculator) CalculateIndirectCosts(period *BudgetPeriod) decimal.Decimal {
	return period.IndirectCosts(c.FARate)
}

// CalculateTravelCost calculates travel costs.
func (c *Calculator) CalculateTravelCost(travelers, tripCount int, costPerTrip decimal.Decimal) decimal.Decimal {
	return costPerTrip.Mul(decimal.NewFromInt(int64(travelers))).Mul(decimal.NewFromInt(int64(tripCount)))
}

// CalculateEquipmentCost calculates equipment costs.
func (c *Calculator) CalculateEquipmentCost(quantity int, unitCost decimal.Decimal) decimal.Decimal {
	return unitCost.Mul(decimal.NewFromInt(int64(quantity)))
}

// CalculateSubawardFAExclusion calculates the amount excluded from F&A for subawards.
func (c *Calculator) CalculateSubawardFAExclusion(directCosts decimal.Decimal) decimal.Decimal {
	if directCosts.LessThanOrEqual(c.FARate.SubawardCap) {
		return decimal.Zero
	}
	return directCosts.Sub(c.FARate.SubawardCap)
}

// InflationAdjustment calculates inflation-adjusted costs for future periods.
func (c *Calculator) InflationAdjustment(baseCost decimal.Decimal, yearNumber int, inflationRate decimal.Decimal) decimal.Decimal {
	if yearNumber <= 1 {
		return baseCost
	}

	// Compound inflation: cost * (1 + rate)^(year-1)
	multiplier := decimal.NewFromInt(1).Add(inflationRate)
	for i := 1; i < yearNumber; i++ {
		baseCost = baseCost.Mul(multiplier)
	}
	return baseCost.Round(2)
}

// ValidateBudget validates a budget for common errors.
func (c *Calculator) ValidateBudget(budget *Budget) []BudgetValidationError {
	var errors []BudgetValidationError

	// Check for empty budget
	if len(budget.Periods) == 0 {
		errors = append(errors, BudgetValidationError{
			Code:    "NO_PERIODS",
			Message: "Budget must have at least one period",
		})
	}

	// Check each period
	for i, period := range budget.Periods {
		// Validate period dates
		if !period.EndDate.After(period.StartDate) {
			errors = append(errors, BudgetValidationError{
				Code:    "INVALID_PERIOD_DATES",
				Message: "Period end date must be after start date",
				Period:  i + 1,
			})
		}

		// Validate personnel effort
		for j, person := range period.Personnel {
			if person.EffortPercent.GreaterThan(decimal.NewFromInt(100)) {
				errors = append(errors, BudgetValidationError{
					Code:    "INVALID_EFFORT",
					Message: "Personnel effort cannot exceed 100%",
					Period:  i + 1,
					LineItem: j + 1,
				})
			}
		}

		// Check for negative values
		if period.TotalDirectCosts().LessThan(decimal.Zero) {
			errors = append(errors, BudgetValidationError{
				Code:    "NEGATIVE_COSTS",
				Message: "Period has negative total costs",
				Period:  i + 1,
			})
		}
	}

	// Check F&A rate is valid
	if c.FARate.OnCampusRate.LessThan(decimal.Zero) || c.FARate.OnCampusRate.GreaterThan(decimal.NewFromInt(1)) {
		errors = append(errors, BudgetValidationError{
			Code:    "INVALID_FA_RATE",
			Message: "F&A rate must be between 0 and 100%",
		})
	}

	return errors
}

// BudgetValidationError represents a budget validation error.
type BudgetValidationError struct {
	Code     string `json:"code"`
	Message  string `json:"message"`
	Period   int    `json:"period,omitempty"`
	LineItem int    `json:"line_item,omitempty"`
}

// ProjectBudget creates a multi-year budget from year 1 template.
func (c *Calculator) ProjectBudget(template BudgetPeriod, years int, inflationRate, salaryIncrease decimal.Decimal) []BudgetPeriod {
	periods := make([]BudgetPeriod, years)

	for year := 1; year <= years; year++ {
		period := BudgetPeriod{
			PeriodNumber: year,
			StartDate:    template.StartDate.AddDate(year-1, 0, 0),
			EndDate:      template.EndDate.AddDate(year-1, 0, 0),
		}

		// Clone and adjust personnel
		for _, p := range template.Personnel {
			adjusted := p
			adjusted.BaseSalary = c.InflationAdjustment(p.BaseSalary, year, salaryIncrease)
			result := c.CalculatePersonnelCost(adjusted.BaseSalary, adjusted.EffortPercent, adjusted.FringeRate, PersonnelMonths{
				Calendar: adjusted.CalendarMonths,
				Academic: adjusted.AcademicMonths,
				Summer:   adjusted.SummerMonths,
			})
			adjusted.RequestedSalary = result.RequestedSalary
			adjusted.FringeBenefits = result.FringeBenefits
			adjusted.TotalCost = result.TotalCost
			period.Personnel = append(period.Personnel, adjusted)
		}

		// Clone and adjust other costs with inflation
		for _, e := range template.Equipment {
			adjusted := e
			if year > 1 {
				// Equipment typically only in year 1
				adjusted.TotalCost = decimal.Zero
			}
			period.Equipment = append(period.Equipment, adjusted)
		}

		for _, t := range template.Travel {
			adjusted := t
			adjusted.CostPerTrip = c.InflationAdjustment(t.CostPerTrip, year, inflationRate)
			adjusted.TotalCost = c.CalculateTravelCost(adjusted.Travelers, adjusted.TripCount, adjusted.CostPerTrip)
			period.Travel = append(period.Travel, adjusted)
		}

		for _, s := range template.Supplies {
			adjusted := s
			adjusted.TotalCost = c.InflationAdjustment(s.TotalCost, year, inflationRate)
			period.Supplies = append(period.Supplies, adjusted)
		}

		for _, ct := range template.Contractual {
			adjusted := ct
			adjusted.TotalCost = c.InflationAdjustment(ct.TotalCost, year, inflationRate)
			period.Contractual = append(period.Contractual, adjusted)
		}

		for _, o := range template.Other {
			adjusted := o
			adjusted.TotalCost = c.InflationAdjustment(o.TotalCost, year, inflationRate)
			period.Other = append(period.Other, adjusted)
		}

		for _, sub := range template.Subawards {
			adjusted := sub
			adjusted.DirectCosts = c.InflationAdjustment(sub.DirectCosts, year, inflationRate)
			adjusted.IndirectCosts = c.InflationAdjustment(sub.IndirectCosts, year, inflationRate)
			adjusted.TotalCost = adjusted.DirectCosts.Add(adjusted.IndirectCosts)
			period.Subawards = append(period.Subawards, adjusted)
		}

		periods[year-1] = period
	}

	return periods
}

// CostSharingCalculator calculates cost sharing requirements.
type CostSharingCalculator struct{}

// CalculateCostSharing calculates cost sharing amounts.
func (csc *CostSharingCalculator) CalculateCostSharing(totalCosts, costSharePercent decimal.Decimal) CostSharingResult {
	costShareAmount := totalCosts.Mul(costSharePercent.Div(decimal.NewFromInt(100))).Round(2)
	sponsorShare := totalCosts.Sub(costShareAmount)

	return CostSharingResult{
		TotalProjectCosts: totalCosts,
		CostSharePercent:  costSharePercent,
		CostShareAmount:   costShareAmount,
		SponsorShare:      sponsorShare,
	}
}

// CostSharingResult contains cost sharing calculation results.
type CostSharingResult struct {
	TotalProjectCosts decimal.Decimal `json:"total_project_costs"`
	CostSharePercent  decimal.Decimal `json:"cost_share_percent"`
	CostShareAmount   decimal.Decimal `json:"cost_share_amount"`
	SponsorShare      decimal.Decimal `json:"sponsor_share"`
}
