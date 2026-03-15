# Firestore Unit Tests

This directory contains two test files:

| File | Layer | What it tests |
|---|---|---|
| `types.test.ts` | Pure function | `userDocToViewModel` mapper |
| `users.service.test.ts` | Service (mocked SDK) | All functions in `services/users.ts` |

---

## How to run

```bash
# Single run — all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Run a specific test file
npx vitest run src/lib/firestore/__tests__/types.test.ts
npx vitest run src/lib/firestore/__tests__/users.service.test.ts
```

---

# types.test.ts — Pure Function Tests

## What is being tested

The `userDocToViewModel` function in `src/lib/firestore/types.ts`. This is a pure mapper that converts raw Firestore `UserDocument` objects (kebab-case keys, optional fields, Firestore `Timestamp` types) into `StudentViewModel` objects used by the admin panel UI.

## Why these tests matter

This function is the boundary between the Firestore data layer and the React UI. Bugs here — like a missing default, a wrong field mapping, or a broken date format — propagate silently into the Students page. Because the function is pure (no side effects, no network calls), it can be tested quickly and without mocks.

## Test categories

### Core field mapping
Verifies that every field on `UserDocument` maps to the correct field on `StudentViewModel` when all data is present. This catches renamed fields, typos in kebab-case keys, and incorrect property assignments.

### Optional field defaults
The Flutter app does not write admin-only fields (`email`, `student-id`, `major`, `year`, ride counters, points, etc.). This group verifies that missing optional fields default to sensible values (`""` for strings, `0` for numbers) rather than `undefined` or `null`.

### Avatar initials
The `avatar` field is derived from the user's `name` by taking the first letter of each word, uppercasing, and truncating to two characters. Tests cover:
- Standard two-word names ("Jane Doe" -> "JD")
- Single-word names ("Madonna" -> "M")
- Three-or-more-word names ("Mary Jane Watson" -> "MJ")
- Lowercase input ("bob jones" -> "BJ")

### Verified driver fallback
The `verifiedDriver` field prefers the admin-set `verified-driver` boolean. When that field is absent (user hasn't been reviewed by an admin yet), it falls back to the Flutter app's `app-mode` field (`"driver"` = `true`, `"passenger"` = `false`). Tests verify:
- Explicit `true`/`false` values are respected regardless of `app-mode`
- The fallback logic activates only when `verified-driver` is `undefined`

### Account status mapping
Confirms all four valid statuses (`active`, `pending`, `suspended`, `blocked`) pass through unchanged.

### Date formatting
The `joined-date` Firestore `Timestamp` is converted to a `YYYY-MM-DD` string via `.toDate().toISOString()`. The test uses a fake `Timestamp` object to verify the output format without needing a real Firestore instance.

## How to run

```bash
# Single run
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

## Test utilities

The test file includes two helpers at the top:

- **`makeUserDoc(overrides)`** — Builds a minimal valid `UserDocument` with sensible defaults. Pass an object to override specific fields for each test case. This avoids repeating boilerplate across every test.
- **`fakeTimestamp(isoDate)`** — Creates a mock Firestore `Timestamp` with a working `toDate()` method. This lets us test date formatting without importing the real Firebase SDK.

## Adding new types tests

If new fields are added to `UserDocument` or `StudentViewModel`:

1. Add the field to the `makeUserDoc` helper if it is required.
2. Add an assertion in the "core field mapping" test for the fully-populated case.
3. If the field is optional, add an assertion in the "optional field defaults" test.
4. If the field has special transformation logic, add a dedicated `describe` block.

---

# users.service.test.ts — Service Layer Mock Tests

## What is being tested

All 9 exported functions in `src/lib/firestore/services/users.ts`:

| Function | Firestore ops | What the test verifies |
|---|---|---|
| `getAllStudents` | `getDocs` | Reads entire users collection, maps each doc through `userDocToViewModel` |
| `getStudent` | `getDoc` | Fetches single doc by UID, returns `null` for missing docs |
| `getStudentsByStatus` | `query` + `where` + `getDocs` | Builds a `where("account-status", "==", status)` query |
| `getLeaderboard` | `query` + `orderBy` + `limit` + `getDocs` | Orders by `total-points` desc, defaults limit to 5 |
| `setAccountStatus` | `updateDoc` | Writes `{ "account-status": status }` to correct doc ref |
| `updateStudentAdminFields` | `updateDoc` | Passes partial fields object through to Firestore |
| `setVerifiedDriver` | `updateDoc` | Writes `{ "verified-driver": bool }` to correct doc ref |
| `incrementRideCounters` | `updateDoc` + `increment` | Increments driver and all passenger counters in parallel |
| `initAdminFields` | `getDoc` + `updateDoc` | Only writes fields that are missing on the existing doc |

## Why these tests matter

The service layer is where kebab-case Firestore field names, query construction, and conditional write logic live. A typo in a field name like `"account-status"` or a broken `where` clause would silently return wrong data. These tests catch that by verifying the exact arguments passed to each Firestore SDK function.

## How mocking works

The test file sets up three layers of mocks before any service code is imported:

### 1. `firebase/firestore` SDK mock
Every Firestore function (`getDocs`, `getDoc`, `updateDoc`, `query`, `where`, `orderBy`, `limit`, `serverTimestamp`, `increment`) is replaced with a `vi.fn()`. This prevents Firebase from initialising and lets tests control what each call returns.

```ts
vi.mock("firebase/firestore", () => ({
  getDocs: (...args) => mockGetDocs(...args),
  // ...
}))
```

### 2. Collection references mock
`usersCol` and `userDoc` from `../collections` are replaced with simple string tokens (`"col-ref:user-data"`, `"doc-ref:{uid}"`). This avoids importing the real Firebase app and makes assertions readable.

```ts
vi.mock("../collections", () => ({
  usersCol: "col-ref:user-data",
  userDoc: (uid) => `doc-ref:${uid}`,
}))
```

### 3. `userDocToViewModel` mapper mock
The mapper is replaced with a stub that returns `{ _mapped: true, id: doc.id }`. This isolates the service tests from the mapper logic (which is already tested in `types.test.ts`). Service tests only verify that the mapper was called with the right input.

### Test helpers

- **`fakeDocSnap(id, data, exists?)`** — Creates a fake Firestore `DocumentSnapshot` with `id`, `data()`, and `exists()` methods.
- **`fakeQuerySnap(docs)`** — Wraps an array of `fakeDocSnap` objects into a fake `QuerySnapshot` with `size` and `docs`.

### `beforeEach`

All mocks are cleared before each test with `vi.clearAllMocks()` so no state leaks between tests.

## Test categories in detail

### Read operations (getAllStudents, getStudent, getStudentsByStatus, getLeaderboard)
Verify that:
- The correct Firestore collection/doc reference is passed
- Query constraints (`where`, `orderBy`, `limit`) use the right field names and values
- Results are mapped through `userDocToViewModel`
- Edge cases (empty results, non-existent docs) return `[]` or `null`

### Write operations (setAccountStatus, updateStudentAdminFields, setVerifiedDriver)
Verify that:
- `updateDoc` is called with the correct document reference (based on UID)
- The update payload uses the correct kebab-case field names
- The exact values passed by the caller are forwarded to Firestore

### incrementRideCounters
Verifies that:
- The driver's `rides-as-driver` is incremented
- Each passenger's `rides-as-passenger` is incremented
- All updates happen in parallel via `Promise.all`
- An empty passenger list only updates the driver

### initAdminFields
The most complex function — reads a doc, then conditionally writes only missing fields. Tests verify:
- No write when the document doesn't exist
- Only missing fields are included in the update
- Fields that already exist on the document are not overwritten
- `serverTimestamp()` is added for `joined-date` when absent
- No `updateDoc` call when all fields already exist

## Adding new service tests

When adding a new function to `services/users.ts`:

1. Mock any new Firestore SDK functions at the top of the test file if not already present.
2. Add a `describe` block for the new function.
3. Test the happy path: correct Firestore function called with correct arguments.
4. Test edge cases: missing docs, empty inputs, default parameter values.
5. For write operations, assert the exact update payload including kebab-case field names.
