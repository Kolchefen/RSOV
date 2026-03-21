# Students Page — Component Tests

## What is being tested

The `StudentsPage` component in `src/pages/Students.tsx`. These tests verify the page's rendering logic, state management, and filtering behavior with the Firestore service layer fully mocked out.

## Why these tests matter

The Students page is where data from Firestore becomes visible to admin users. Component tests catch bugs in:
- Conditional rendering (loading, empty, populated states)
- Stats card computations (counts, averages)
- Client-side search filtering across multiple fields
- Status badge display logic

Without these tests, a broken filter condition or wrong stats calculation would only be caught manually in the browser.

## How to run

```bash
# Run only this test file
npx vitest run src/pages/__tests__/Students.test.tsx

# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Test infrastructure

| Dependency | Purpose |
|---|---|
| `vitest` | Test runner, integrated with Vite config |
| `jsdom` | Browser DOM simulation (configured in `vite.config.ts`) |
| `@testing-library/react` | `render`, `screen`, `waitFor` for rendering React components |
| `@testing-library/user-event` | Simulates real user interactions (typing, clicking) |
| `@testing-library/jest-dom` | DOM matchers like `toBeInTheDocument()`, `toHaveTextContent()` |

Configuration lives in `vite.config.ts` under the `test` key. The setup file at `src/test/setup.ts` loads the jest-dom matchers globally.

## How mocking works

The test file sets up three mocks to isolate the component from its dependencies:

### 1. Firestore service mock
`getAllStudents` from `@/lib/firestore/services/users` is replaced with a `vi.fn()`. Each test controls what it resolves to (student array, empty array, or rejection). This means no Firebase SDK is ever loaded.

```ts
vi.mock("@/lib/firestore/services/users", () => ({
  getAllStudents: (...args) => mockGetAllStudents(...args),
}))
```

### 2. AdminLayout mock
The real `AdminLayout` imports `Sidebar`, which uses `useLocation()` from react-router-dom. To avoid needing a `<MemoryRouter>` wrapper and the full sidebar dependency chain, AdminLayout is mocked as a simple wrapper that renders the title and children:

```ts
vi.mock("@/components/admin/admin-layout", () => ({
  AdminLayout: ({ children, title }) => (
    <div data-testid="admin-layout"><h1>{title}</h1>{children}</div>
  ),
}))
```

### 3. StatsCard mock
The real StatsCard renders icons and styling. The mock renders just the title (as a `data-testid`) and the value, making stats assertions simple:

```ts
vi.mock("@/components/admin/stats-card", () => ({
  StatsCard: ({ title, value }) => (
    <div data-testid={`stats-${title}`}>{value}</div>
  ),
}))
```

### Test helper

- **`makeStudent(overrides)`** — Builds a complete `StudentViewModel` with sensible defaults. Pass an object to override specific fields per test. The `STUDENTS` array at the top provides a reusable dataset of 3 students with varied statuses, years, and driver verification states.

### `beforeEach`

All mocks are cleared before each test with `vi.clearAllMocks()` so no state leaks between tests.

## Test categories in detail

### Loading state
Verifies that "Loading students..." appears while `getAllStudents` is pending. Uses a never-resolving Promise to keep the component in loading state.

### Empty state
Verifies that "No students found." appears when the service returns an empty array.

### Error handling
Verifies the component doesn't crash when `getAllStudents` rejects. The page should gracefully fall through to the empty state.

### Data rendering
After `getAllStudents` resolves with test data, verifies:
- Student names, emails, and majors appear in the DOM
- "Driver" badges appear only for verified drivers (2 out of 3 test students)
- Status badges display capitalized text ("Active", "Pending", "Suspended")
- The `"{n} students found"` count is correct

### Stats cards
Tests the computed values passed to each StatsCard:
- **Total Students** — count of all students (3)
- **Verified Drivers** — count where `verifiedDriver === true` (2)
- **Avg Rating** — average of students with `rating > 0`, excluding zero-rated students (4.65)
- **Pending Verification** — count where `status === "pending"` (1)

### Search filtering
Uses `@testing-library/user-event` to type into the search input and verifies:
- **Filter by name** — typing "Bob" shows only Bob Smith
- **Filter by email** — typing "alice@uni" shows only Alice Lee
- **Filter by major** — typing "Physics" shows only Bob Smith
- **Case-insensitive** — typing "jane doe" (lowercase) still matches "Jane Doe"
- **No matches** — typing "nonexistent" shows the empty state and "0 students found"

## Adding new component tests

When modifying `Students.tsx`:

1. If adding new rendered data, add assertions in the "data rendering" group.
2. If adding new filter fields, add tests in the "search filtering" group using `userEvent.type()`.
3. If adding new stats cards, add a test that checks the `data-testid` pattern `stats-{Card Title}`.
4. If adding new interactive features (modals, dropdowns), use `userEvent.click()` and assert on the resulting DOM changes.
5. Always use `waitFor` to handle the async `getAllStudents` call before making assertions.
