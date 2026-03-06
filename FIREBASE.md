# Firebase Integration Guide

## Overview

This project uses **Firebase Firestore** as its database, shared between two independent applications:

- **line-2** — Flutter mobile app (drivers & passengers)
- **admin-panel** — This React web app (admin oversight)

Both apps read and write to the **same Firestore project**. They do not communicate with each other directly — all data exchange happens through Firestore.

### Schema authority

> **The admin panel defines the schema. The Flutter app will be updated to conform to it.**

This means when there is a conflict between what the Flutter app currently does and what the admin panel types say, the admin panel wins. Update Flutter accordingly.

### Business model

This is a **university carpooling platform**. There is **no pricing or payment**. Students earn **reward points** for participating in carpools (as drivers or passengers), and redeem those points for rewards managed by the admin panel.

All pricing-related fields (`min-price`, `max-price`, `currency`) that exist in the current Flutter codebase are **deprecated**. They are kept as optional in the TypeScript types only to avoid breaking reads of legacy documents. Do not write them in any new code, and remove them from Flutter when reconfiguring it.

---

## Connecting to the Firebase Project

> **Do this before running the admin panel against a real database.**

1. Go to the [Firebase Console](https://console.firebase.google.com) and open your project.
2. Navigate to **Project Settings → Your apps → Web app**.
3. Copy the SDK config values.
4. In the `admin-panel/` directory, copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
5. Fill in `.env.local` with your project values:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123...
   VITE_FIREBASE_MEASUREMENT_ID=G-...
   ```
6. `.env.local` is gitignored — never commit it.

---

## Architecture

```
Firebase Firestore
       │
       ├── Flutter app (line-2)        Admin panel (this app)
       │   Reads & writes:             Reads & writes:
       │   - user-data (core fields)   - user-data (admin fields)
       │   - trip-details              - rewards  ← admin-only collection
       │   - post-details              - points-transactions (redeemed/bonus)
       │   - points-transactions
       │     (earned entries)
       └── messages, etc.
```

---

## File Structure

```
src/lib/
├── firebase.ts                  Firebase app init — exports db and auth
└── firestore/
    ├── types.ts                 All TypeScript interfaces + view model mappers
    ├── collections.ts           Typed collection/doc refs, collection name constants
    ├── index.ts                 Barrel export (import everything from "@/lib/firestore")
    └── services/
        ├── users.ts             Student queries and admin actions
        ├── rides.ts             Trip history queries
        └── rewards.ts           Rewards catalog + points transactions
```

### Importing

```ts
// Preferred — use the barrel export
import { getAllStudents, getActiveRewards, grantBonusPoints } from "@/lib/firestore"

// Or import db/auth directly
import { db, auth } from "@/lib/firebase"
```

---

## Firestore Collections

### Key conventions

- All Firestore field keys use **kebab-case** (e.g. `created-by`, `app-mode`, `total-points`). This matches the existing Flutter convention and must be followed for all new fields.
- TypeScript interfaces in `types.ts` use the same keys as strings (e.g. `"created-by"`) for an exact 1:1 mapping with Firestore.

---

### `user-data`
**Doc ID:** Firebase Auth UID

Each document represents one student. The Flutter app creates this document on first registration. The admin panel extends it with university-specific and stats fields.

**Flutter-written fields** (do not overwrite from admin panel):

| Field | Type | Description |
|---|---|---|
| `id` | string | Firebase Auth UID |
| `phone-number` | string | Used for phone auth in Flutter |
| `app-mode` | `"driver"` \| `"passenger"` | Mode the user selected in the app |
| `name` | string | Display name |
| `location` | string | User's general location |
| `bio` | string | Profile bio |
| `profile-img` | string | Firebase Storage URL |
| `additional-features` | string[] | Driver perks (e.g. `["wifi", "ac"]`) — drivers only |
| `vehicle-details` | object | `{ carName, numberPlate, numPassengers }` — drivers only |
| `cur-selected-location` | map | `{ "Location Name": GeoPoint }` |
| `receive-notification` | boolean | Push notification opt-in |
| `blocked-users` | string[] | UIDs this user has blocked |
| `blocked-by-users` | string[] | UIDs that blocked this user |
| `hidden-posts` | string[] | Post IDs hidden from their feed |

**Admin panel-written fields:**

| Field | Type | Description |
|---|---|---|
| `account-status` | string | `"active"` \| `"pending"` \| `"suspended"` \| `"blocked"` |
| `email` | string | University email address |
| `student-id` | string | e.g. `"2024001234"` |
| `major` | string | Academic major |
| `year` | string | `"Freshman"` \| `"Sophomore"` \| `"Junior"` \| `"Senior"` \| `"Graduate"` |
| `verified-driver` | boolean | Admin-verified driver status (distinct from `app-mode`) |
| `rides-as-driver` | number | Cumulative driver ride count |
| `rides-as-passenger` | number | Cumulative passenger ride count |
| `total-points` | number | Current points balance |
| `co2-saved` | number | Lifetime kg CO2 saved |
| `rating` | number | Average rating |
| `joined-date` | Timestamp | Date first seen by the admin panel |

> **`app-mode` vs `verified-driver`:** `app-mode` is what the user selected in the Flutter app. `verified-driver` is an explicit admin approval. A student may set themselves as a driver but the admin panel still needs to mark them `verified-driver: true` before they appear as a verified driver in the admin UI.

---

### `trip-details`
**Doc ID:** Auto-generated by Flutter

Represents a recurring trip route created by a driver. The Flutter app writes this; the admin panel reads it and may write the points fields.

| Field | Type | Description |
|---|---|---|
| `id` | string | Same as doc ID |
| `created-by` | string | Driver's UID |
| `name` | string | Trip name |
| `passengers` | number | Max passenger capacity |
| `passenger-ids` | string[] | UIDs of accepted passengers |
| `start-location` | map | `{ "Location Name": GeoPoint }` |
| `start-location-str` | string | Human-readable start name |
| `end-location` | map | `{ "Location Name": GeoPoint }` |
| `end-location-str` | string | Human-readable end name |
| `stop-locations` | map | Optional intermediate stops |
| `trip-type` | string | `"daily"` \| `"weekly"` \| `"monthly"` |
| `weeklyTimes` / `monthlyTimes` / `dailyTime` | varies | Scheduled times |
| `status` | string | `"not-started"` \| `"in-progress"` \| `"completed"` \| `"cancelled"` |
| `is-return-trip` | boolean | Whether this is a return leg |
| `return-trip-id` | string | ID of the paired return trip |
| `pending-requests` | number | Unresolved join request count |
| `posted-to-feed` | boolean | Visible in public feed |
| `date-created` | Timestamp | Creation time |
| `description` | string | Optional description |
| `points-awarded` | number | **Admin field** — points given to the driver on completion |
| `points-per-passenger` | number | **Admin field** — points given to each passenger on completion |
| ~~`min-price`~~ | number | **Deprecated.** Do not use. |
| ~~`max-price`~~ | number | **Deprecated.** Do not use. |
| ~~`currency`~~ | string | **Deprecated.** Do not use. |

**Subcollections:**

#### `trip-details/{tripId}/passengers`
One document per accepted passenger.

| Field | Type | Description |
|---|---|---|
| `id` | string | Doc ID |
| `passenger-id` | string | Passenger UID |
| `order` | number | Pickup order index |

#### `trip-details/{tripId}/trip-history`
One document per actual run of the trip (a recurring trip generates multiple entries over time).

| Field | Type | Description |
|---|---|---|
| `id` | string | Doc ID |
| `trip-name` | string | Snapshot of the trip name at run time |
| `start-point` | string | Start location name |
| `end-point` | string | End location name |
| `status` | string | `"not-started"` \| `"in-progress"` \| `"completed"` \| `"cancelled"` |
| `start-time` | Timestamp | When the ride started |
| `end-time` | Timestamp | When the ride ended |
| `cur-location` | GeoPoint | Driver's last known GPS position (live tracking) |
| `cur-heading` | number | Driver heading in degrees |
| `passengers-picked` | array | `[{ uid, timestamp }]` |
| `passengers-dropped` | array | `[{ uid, timestamp }]` |
| `passengers-skipped` | array | `[{ uid, reason? }]` |

> Admin panel ride queries use Firestore `collectionGroup("trip-history")` to query across all trips at once. This requires a **composite index** — the Firestore Console will prompt you to create it when you first run the query.

---

### `post-details`
**Doc ID:** Auto-generated by Flutter

Public feed posts written by the Flutter app when a driver shares a trip. Primarily read-only from the admin panel's perspective.

Key fields: `id`, `trip-id`, `posted-by` (UID), `name`, `description`, `post-date`, `start-location`, `end-location`, `trip-type`, `capacity`, `is-available`, `favorite-list`, `app-mode`.

Pricing fields (`min-price`, `max-price`, `currency`) are **deprecated** and will be removed from Flutter.

---

### `rewards` — Admin panel only
**Doc ID:** Auto-generated by admin panel

The rewards catalog. The Flutter app reads this to show students what they can redeem.

| Field | Type | Description |
|---|---|---|
| `id` | string | Same as doc ID |
| `name` | string | e.g. `"Campus Cafe $5 Gift Card"` |
| `points-required` | number | Cost in points to redeem |
| `category` | string | `"food"` \| `"store"` \| `"events"` \| `"parking"` |
| `stock` | number | Remaining quantity |
| `total-redemptions` | number | Cumulative redemption count |
| `is-active` | boolean | Whether the reward is visible and redeemable |
| `created-at` | Timestamp | |
| `updated-at` | Timestamp | Last admin update |

---

### `points-transactions`
**Doc ID:** Auto-generated

| Field | Type | Owner | Description |
|---|---|---|---|
| `id` | string | Both | Same as doc ID |
| `user-id` | string | Both | Student's UID |
| `type` | string | Both | `"earned"` \| `"redeemed"` \| `"bonus"` |
| `amount` | number | Both | Points (always a positive integer) |
| `description` | string | Both | Human-readable description |
| `category` | string | Both | `"ride"` \| `"food"` \| `"store"` \| `"events"` \| `"parking"` \| `"bonus"` |
| `ride-id` | string | Flutter | Set when `type === "earned"` from a completed ride |
| `reward-id` | string | Admin | Set when `type === "redeemed"` |
| `created-at` | Timestamp | Both | |

**Who writes what:**
- Flutter writes `earned` entries when rides complete (to be implemented via Cloud Function).
- Admin panel writes `redeemed` entries when a student redeems a reward.
- Admin panel writes `bonus` entries when manually granting points.
- Both sides update `total-points` on the user document after writing a transaction.

---

## Service Functions

### Users (`src/lib/firestore/services/users.ts`)

```ts
getAllStudents()                          // → StudentViewModel[]
getStudent(uid)                          // → StudentViewModel | null
getStudentsByStatus(status)              // → StudentViewModel[]
getLeaderboard(n?)                       // → StudentViewModel[] (top N by points)
setAccountStatus(uid, status)            // suspend, activate, or block a student
setVerifiedDriver(uid, verified)         // admin driver verification
updateStudentAdminFields(uid, fields)    // update any admin-owned fields
incrementRideCounters(driverUid, passengerUids[])  // bump ride count stats
initAdminFields(uid, { email, studentId, major, year })  // safe first-time setup
```

### Rides (`src/lib/firestore/services/rides.ts`)

```ts
getRecentRides(n?)                       // → RideViewModel[] — latest N runs
getActiveRides()                         // → RideViewModel[] — currently in-progress
getRideHistoryForTrip(tripId)            // → TripHistoryDocument[]
setRideStatus(tripId, historyId, status) // admin status override
```

### Rewards (`src/lib/firestore/services/rewards.ts`)

```ts
getActiveRewards()                       // → RewardDocument[]
getAllRewards()                           // → RewardDocument[] (incl. inactive)
createReward({ name, pointsRequired, category, stock })  // → rewardId
updateReward(rewardId, fields)           // update stock, name, active state, etc.
getRecentTransactions(n?, typeFilter?)   // → TransactionViewModel[]
getUserTransactions(uid)                 // → PointsTransactionDocument[]
grantBonusPoints(uid, amount, reason)    // creates transaction + updates total-points
redeemReward(uid, rewardId)             // validates stock & balance, writes transaction
recordEarnedPoints(uid, points, desc, rideId)  // for Cloud Function use
```

---

## View Model Mappers

Raw Firestore documents use kebab-case keys. The service layer maps them to camelCase view models that match the existing UI page shapes:

| Firestore type | View model | Where |
|---|---|---|
| `UserDocument` | `StudentViewModel` | `userDocToViewModel()` in `types.ts` |
| `TripHistoryDocument` + parent trip data | `RideViewModel` | internal to `rides.ts` |
| `PointsTransactionDocument` + user lookup | `TransactionViewModel` | internal to `rewards.ts` |

---

## Data Flows

### New student registers (Flutter → Firestore → Admin panel)

1. Student installs Flutter app, registers with phone number.
2. Flutter creates a `user-data` doc with core fields (`name`, `phone-number`, `app-mode`, etc.).
3. Admin panel detects the new document (manually or via a Cloud Function listener).
4. Admin calls `initAdminFields(uid, { email, studentId, major, year })` to add university-specific fields without overwriting Flutter data.
5. If the student is a driver, admin sets `verified-driver: true`.

> Step 3–5 currently requires manual admin action. A Cloud Function on `user-data` onCreate would automate the initial setup.

### Ride completes → Points awarded (Flutter → Cloud Function → Firestore)

1. Flutter driver ends a ride → `trip-history/{id}` status set to `"completed"`.
2. A **Cloud Function** (to be implemented) triggers on this status change:
   - Reads `points-awarded` and `points-per-passenger` from the parent `trip-details` doc.
   - Calls `recordEarnedPoints()` for the driver.
   - Calls `recordEarnedPoints()` for each passenger.
   - Calls `incrementRideCounters()` for all participants.
   - Updates `co2-saved` on the driver's user doc.
3. Admin panel `Rewards` page reads `points-transactions` to display history.

### Student redeems a reward (Admin panel)

1. Admin calls `redeemReward(uid, rewardId)`.
2. Service validates: reward is active, stock > 0, student has enough points.
3. Atomically: deducts points from user, decrements stock, increments `total-redemptions`, writes a `redeemed` transaction.

> In production this should be a Cloud Function to prevent race conditions on stock.

---

## Firestore Security Rules (starter)

Set these in Firebase Console → Firestore → Rules before going to production.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /user-data/{uid} {
      allow read: if request.auth != null;
      // Users can write their own core fields; admin writes via Admin SDK
      allow write: if request.auth.uid == uid;
    }

    match /trip-details/{tripId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /trip-details/{tripId}/trip-history/{histId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /trip-details/{tripId}/passengers/{passId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /post-details/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /rewards/{rewardId} {
      allow read: if request.auth != null;
      allow write: if false;  // admin SDK / Cloud Functions only
    }

    match /points-transactions/{txnId} {
      allow read: if request.auth != null
                  && resource.data["user-id"] == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if false;  // transactions are immutable
    }
  }
}
```

> **For production:** Admin panel writes to `rewards`, `account-status`, and `points-transactions` should go through **Firebase Admin SDK or Cloud Functions** (server-side), not directly from the browser. This prevents a student from modifying their own points or reward stock via browser dev tools.

---

## Known Gaps / TODOs

- [ ] **Admin authentication** — the admin panel has no login page yet. Needs Firebase Auth (email/password or Google SSO) with an admin role check (custom claims or an `admin-users` Firestore collection).
- [ ] **Cloud Functions** — ride completion → points award logic must be server-side to be tamper-proof.
- [ ] **Firestore indexes** — `collectionGroup("trip-history")` queries need composite indexes. The Firebase Console will show a link to create them when the query first runs.
- [ ] **Security rules** — the starter rules above should be tightened with custom claims for admin writes before production.
- [ ] **Real-time listeners** — current service functions use one-time `getDocs`. For a live dashboard, replace with `onSnapshot` listeners.
- [ ] **Page wiring** — `Students.tsx`, `Rides.tsx`, `Rewards.tsx` still use static mock data. Replace with service function calls once Firebase is connected.
- [ ] **Flutter reconfiguration** — remove pricing UI and fields (`min-price`, `max-price`, `currency`) from the Flutter app; add `points-transactions` writes on ride completion; read `rewards` collection to show students their redemption options.
- [ ] **CO2 calculation** — decide on the formula (e.g. kg per km, average car emission factor) and implement it in the ride completion Cloud Function.
