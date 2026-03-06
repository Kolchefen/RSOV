import {
  collection,
  CollectionReference,
  DocumentReference,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type {
  UserDocument,
  TripDocument,
  TripPassengerDocument,
  TripHistoryDocument,
  PostDocument,
  RewardDocument,
  PointsTransactionDocument,
} from "./types"

// ---------------------------------------------------------------------------
// Collection name constants — single source of truth to avoid typos
// ---------------------------------------------------------------------------

export const COLLECTIONS = {
  USERS: "user-data",
  TRIPS: "trip-details",
  POSTS: "post-details",
  REWARDS: "rewards",
  TRANSACTIONS: "points-transactions",
  MESSAGES: "messages",
  VERIFICATION_LIMIT: "verification-usage-limit",
} as const

export const SUBCOLLECTIONS = {
  TRIP_PASSENGERS: "passengers",
  TRIP_HISTORY: "trip-history",
  FAVORITE_TRIPS: "favorite-trips",
  FAVORITE_POSTS: "favorite-posts",
} as const

// ---------------------------------------------------------------------------
// Typed collection references
// ---------------------------------------------------------------------------

function typedCollection<T>(path: string) {
  return collection(db, path) as CollectionReference<T>
}

export const usersCol = typedCollection<UserDocument>(COLLECTIONS.USERS)

export const tripsCol = typedCollection<TripDocument>(COLLECTIONS.TRIPS)

export const postsCol = typedCollection<PostDocument>(COLLECTIONS.POSTS)

export const rewardsCol = typedCollection<RewardDocument>(COLLECTIONS.REWARDS)

export const transactionsCol = typedCollection<PointsTransactionDocument>(
  COLLECTIONS.TRANSACTIONS
)

// ---------------------------------------------------------------------------
// Subcollection helpers
// ---------------------------------------------------------------------------

export function tripPassengersCol(tripId: string) {
  return collection(
    db,
    COLLECTIONS.TRIPS,
    tripId,
    SUBCOLLECTIONS.TRIP_PASSENGERS
  ) as CollectionReference<TripPassengerDocument>
}

export function tripHistoryCol(tripId: string) {
  return collection(
    db,
    COLLECTIONS.TRIPS,
    tripId,
    SUBCOLLECTIONS.TRIP_HISTORY
  ) as CollectionReference<TripHistoryDocument>
}

// ---------------------------------------------------------------------------
// Document reference helpers
// ---------------------------------------------------------------------------

export function userDoc(uid: string): DocumentReference<UserDocument> {
  return doc(usersCol, uid)
}

export function tripDoc(tripId: string): DocumentReference<TripDocument> {
  return doc(tripsCol, tripId)
}

export function rewardDoc(rewardId: string): DocumentReference<RewardDocument> {
  return doc(rewardsCol, rewardId)
}

export function transactionDoc(
  txnId: string
): DocumentReference<PointsTransactionDocument> {
  return doc(transactionsCol, txnId)
}
