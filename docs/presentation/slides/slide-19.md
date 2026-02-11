# Slide 19: Testing & Validation
**Duration**: 3 minutes | **ADR**: PRES-019

---

## Testing Strategy

```
┌─────────────────────────────────────────────────────┐
│              TESTING PYRAMID                         │
│                                                     │
│                    /\                                │
│                   /  \        E2E Tests              │
│                  / PW \       (Playwright)           │
│                 /──────\                             │
│                /        \     Integration Tests      │
│               / API+DB   \    (Go + PostgreSQL)      │
│              /────────────\                          │
│             /              \   Unit Tests            │
│            /  Domain Logic   \  (Pure functions)     │
│           /──────────────────\                       │
│          /                    \  WASM Tests          │
│         /    rvlite Search     \ (Browser engine)    │
│        /────────────────────────\                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Playwright E2E Tests

```typescript
// e2e/proposals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Proposal Management', () => {
  test('create and submit a proposal', async ({ page }) => {
    // Navigate to proposals
    await page.goto('/proposals/new');

    // Fill form
    await page.fill('[name="title"]', 'NIH R01 Grant');
    await page.fill('[name="pi"]', 'Dr. Smith');
    await page.click('button[type="submit"]');

    // Verify creation
    await expect(page.locator('.status-badge'))
      .toHaveText('Draft');

    // Submit proposal
    await page.click('button:has-text("Submit")');
    await expect(page.locator('.status-badge'))
      .toHaveText('Submitted');
  });

  test('semantic search finds relevant proposals', async ({ page }) => {
    await page.goto('/search');

    // Type semantic query
    await page.fill('[name="search"]', 'cancer research NIH');

    // Verify results include relevant proposals
    const results = page.locator('.search-result');
    await expect(results).toHaveCount({ minimum: 1 });

    // Check similarity scores are displayed
    await expect(results.first().locator('.similarity'))
      .toBeVisible();
  });
});
```

---

## Running Tests

```bash
# All E2E tests
./scripts/test-e2e.sh

# With browser debugging (see the browser)
./scripts/test-e2e.sh --headed

# Docker mode (CI/CD)
./scripts/test-e2e.sh --docker

# Specific test file
npx playwright test e2e/proposals.spec.ts

# With trace viewer (debug failures)
npx playwright test --trace on
npx playwright show-trace trace.zip
```

---

## Validation Checklist

```
┌─────────────────────────────────────────────┐
│  VALIDATION CHECKLIST                       │
├─────────────────────────────────────────────┤
│                                             │
│  Architecture                               │
│  □ Clean Architecture layers respected      │
│  □ Domain has no external dependencies      │
│  □ Dependency rule: inward only             │
│                                             │
│  Security                                   │
│  □ RLS enabled on all tenant tables         │
│  □ JWT validation on all endpoints          │
│  □ No SQL injection vectors                 │
│  □ CORS properly configured                 │
│                                             │
│  Functionality                              │
│  □ Proposal CRUD works                      │
│  □ State transitions validated              │
│  □ Vector search returns results            │
│  □ WASM fallback works offline              │
│  □ Multi-tenant isolation verified          │
│                                             │
│  Performance                                │
│  □ Vector search < 50ms                     │
│  □ WASM search < 100ms                      │
│  □ API response < 200ms                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

### [ILLUSTRATION: Test results dashboard showing a grid of test cases with green checkmarks and timing data. Left panel: test file tree. Center: test execution output with pass/fail indicators. Right: coverage report with percentage bars. Bottom: Playwright trace viewer screenshot showing browser interaction timeline. Professional CI/CD dashboard aesthetic.]
