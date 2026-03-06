import type { Timestamp, GeoPoint } from "firebase/firestore"

// ---------------------------------------------------------------------------
// SCHEMA NOTES
// ---------------------------------------------------------------------------
// The admin panel defines the authoritative schema. The Flutter app (line-2)
// will be reconfigured to match it.
//
// Business model: university carpooling — NO pricing or payment.
//   Students earn reward points for participating in carpools.
//   Points are redeemed for rewards managed by the admin panel.
//
// Firestore key convention: kebab-case ("created-by", "app-mode") — matches
// the existing Flutter app convention and is used for all new fields too.
//
// Pricing fields (min-price, max-price, currency) exist in the current Flutter
// app but are DEPRECATED. They are kept as optional here only to avoid
// breaking reads of legacy documents. Do not write them in new code.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// users  →  collection: "user-data"  (doc ID = Firebase Auth UID)
// ---------------------------------------------------------------------------

export type AppMode = "driver" | "passenger"
export type AccountStatus = "active" | "pending" | "suspended" | "blocked"
export type AcademicYear = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate"

/** Raw Firestore document shape for the "user-data" collection.
 *  Flutter writes the core fields; admin panel writes the admin-only fields. */
export interface UserDocument {
  // --- Written by Flutter app ---
  id: string                                      // Firebase Auth UID
  "phone-number": string
  "app-mode": AppMode
  name: string
  location: string                                // Human-readable location name
  bio: string
  "profile-img": string                           // Storage URL
  "additional-features"?: string[]               // Driver only (e.g. ["wifi","ac"])
  "vehicle-details"?: {
    carName: string
    numberPlate: string
    numPassengers: string
  }
  "cur-selected-location": Record<string, GeoPoint>
  "receive-notification"?: boolean
  "blocked-users"?: string[]
  "blocked-by-users"?: string[]
  "hidden-posts"?: string[]

  // --- Written by admin panel ---
  "account-status": AccountStatus
  email?: string                                  // University email address
  "student-id"?: string                          // e.g. "2024001234"
  major?: string
  year?: AcademicYear
  "verified-driver"?: boolean                    // Admin-verified driver flag
  "rides-as-driver"?: number                     // Maintained via Cloud Function or admin
  "rides-as-passenger"?: number
  "total-points"?: number
  "co2-saved"?: number                           // kg CO2 saved
  rating?: number                                // Average driver/passenger rating
  "joined-date"?: Timestamp
}

/** Admin panel view model derived from UserDocument — matches the Students.tsx shape. */
export interface StudentViewModel {
  id: string
  name: string
  email: string
  phone: string
  studentId: string
  major: string
  year: string
  avatar: string                                 // Initials, derived from name
  status: AccountStatus
  ridesAsDriver: number
  ridesAsPassenger: number
  totalPoints: number
  co2Saved: number
  rating: number
  joinedDate: string                             // ISO date string
  verifiedDriver: boolean
}

export function userDocToViewModel(doc: UserDocument): StudentViewModel {
  const initials = doc.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return {
    id: doc.id,
    name: doc.name,
    email: doc.email ?? "",
    phone: doc["phone-number"] ?? "",
    studentId: doc["student-id"] ?? "",
    major: doc.major ?? "",
    year: doc.year ?? "",
    avatar: initials,
    status: doc["account-status"],
    ridesAsDriver: doc["rides-as-driver"] ?? 0,
    ridesAsPassenger: doc["rides-as-passenger"] ?? 0,
    totalPoints: doc["total-points"] ?? 0,
    co2Saved: doc["co2-saved"] ?? 0,
    rating: doc.rating ?? 0,
    joinedDate: doc["joined-date"]?.toDate().toISOString().split("T")[0] ?? "",
    verifiedDriver: doc["verified-driver"] ?? doc["app-mode"] === "driver",
  }
}

// ---------------------------------------------------------------------------
// trips  →  collection: "trip-details"  (doc ID = auto-generated)
//           subcollection: "trip-details/{tripId}/passengers"
//           subcollection: "trip-details/{tripId}/trip-history"
// ---------------------------------------------------------------------------

export type TripType = "daily" | "weekly" | "monthly"
export type TripStatus = "not-started" | "in-progress" | "completed" | "cancelled"

/** Raw Firestore document for the "trip-details" collection.
 *  The admin panel schema is authoritative; Flutter will be updated to match. */
export interface TripDocument {
  id: string
  name: string
  "created-by": string                          // UID of the driver
  passengers: number                            // Max passenger capacity
  "passenger-ids"?: string[]                   // UIDs of accepted passengers
  "start-location": Record<string, GeoPoint>   // { "Location Name": GeoPoint }
  "start-location-str"?: string
  "end-location": Record<string, GeoPoint>
  "end-location-str"?: string
  "stop-locations"?: Record<string, GeoPoint>
  "trip-type": TripType
  weeklyTimes?: Record<string, unknown>
  monthlyTimes?: Record<string, unknown>
  monthlyTimesNew?: Record<string, unknown>
  dailyTime?: string
  "seat-descriptions"?: Record<string, string>
  "date-created": Timestamp
  "trip-share-url"?: string
  "return-trip-id"?: string
  "pending-requests"?: number
  "posted-to-feed"?: boolean
  "is-return-trip": boolean
  status?: TripStatus
  description?: string
  keywords?: string[]

  // --- Written by admin panel ---
  "points-awarded"?: number                    // Points awarded to driver on completion
  "points-per-passenger"?: number              // Points awarded to each passenger on completion

  // DEPRECATED — legacy Flutter fields, do not write in new code
  /** @deprecated No pricing in the university model. */
  "min-price"?: number
  /** @deprecated No pricing in the university model. */
  "max-price"?: number
  /** @deprecated No pricing in the university model. */
  currency?: string
}

/** Subcollection document: trip-details/{tripId}/passengers */
export interface TripPassengerDocument {
  id: string
  "passenger-id": string                       // UID
  order: number                                // Pickup order index
}

/** Subcollection document: trip-details/{tripId}/trip-history
 *  Represents a single active/completed run of a recurring trip. */
export interface TripHistoryDocument {
  id: string
  "trip-name": string
  "start-point": string
  "end-point": string
  status: TripStatus
  "start-time": Timestamp
  "end-time"?: Timestamp
  "cur-location": GeoPoint
  "cur-heading": number
  "passengers-picked"?: Array<{ uid: string; timestamp: Timestamp }>
  "passengers-dropped"?: Array<{ uid: string; timestamp: Timestamp }>
  "passengers-skipped"?: Array<{ uid: string; reason?: string }>
}

/** Admin panel view model for a trip run — matches the Rides.tsx shape. */
export interface RideViewModel {
  id: string
  driver: { name: string; email: string; avatar: string }
  origin: string
  destination: string
  passengers: number
  maxPassengers: number
  status: TripStatus | string
  departureTime: string
  pointsAwarded: number
}

// ---------------------------------------------------------------------------
// posts  →  collection: "post-details"  (doc ID = auto-generated)
// ---------------------------------------------------------------------------

/** Raw Firestore document for the "post-details" feed collection.
 *  Written by the Flutter app when a driver posts a trip to the public feed.
 *  Flutter will be updated to drop pricing fields. */
export interface PostDocument {
  id: string
  "trip-id": string
  "posted-by": string                          // UID
  name: string
  description: string
  "post-date": Timestamp
  "start-location": Record<string, GeoPoint>
  "start-location-str"?: string
  "end-location": Record<string, GeoPoint>
  "end-location-str"?: string
  "stop-locations"?: Record<string, GeoPoint>
  "trip-type": TripType
  capacity: number
  "favorite-list": string[]
  "is-available": boolean
  weeklyTimes?: Record<string, unknown>
  monthlyTimes?: Record<string, unknown>
  monthlyTimesNew?: Record<string, unknown>
  dailyTime?: string
  "trip-share-url"?: string
  "return-trip-id"?: string
  "app-mode": AppMode
  location?: GeoPoint
  keywords?: string[]

  // DEPRECATED — legacy Flutter fields, do not write in new code
  /** @deprecated No pricing in the university model. */
  "min-price"?: number
  /** @deprecated No pricing in the university model. */
  "max-price"?: number
  /** @deprecated No pricing in the university model. */
  currency?: string
}

// ---------------------------------------------------------------------------
// rewards  →  collection: "rewards"  (doc ID = auto-generated)
// ---------------------------------------------------------------------------

export type RewardCategory = "food" | "store" | "events" | "parking"

/** Written exclusively by the admin panel. */
export interface RewardDocument {
  id: string
  name: string
  "points-required": number
  category: RewardCategory
  stock: number
  "total-redemptions": number
  "is-active": boolean
  "created-at": Timestamp
  "updated-at"?: Timestamp
}

// ---------------------------------------------------------------------------
// transactions  →  collection: "points-transactions"  (doc ID = auto-generated)
// ---------------------------------------------------------------------------

export type TransactionType = "earned" | "redeemed" | "bonus"

/** Created by the Flutter app (ride completions) and admin panel (redemptions, bonuses). */
export interface PointsTransactionDocument {
  id: string
  "user-id": string                            // UID
  type: TransactionType
  amount: number                               // Points (always positive)
  description: string
  category: string                             // "ride" | "store" | "food" | "bonus" | etc.
  "reward-id"?: string                         // Set when type === "redeemed"
  "ride-id"?: string                           // Set when type === "earned" from a ride
  "created-at": Timestamp
}

/** Admin panel view model for a transaction — matches the Rewards.tsx shape. */
export interface TransactionViewModel {
  id: string
  student: { name: string; avatar: string }
  type: TransactionType
  amount: number
  description: string
  timestamp: string
  category: string
}
