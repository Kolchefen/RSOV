import {
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
} from "firebase/firestore"
import { tripsCol, tripDoc, tripHistoryCol } from "../collections"
import type { RideViewModel, TripStatus, TripHistoryDocument } from "../types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a TripHistoryDocument + parent trip info into a RideViewModel. */
function historyDocToViewModel(
  histDoc: TripHistoryDocument,
  tripId: string,
  driverName: string,
  driverEmail: string,
  maxPassengers: number,
  pointsAwarded: number
): RideViewModel {
  const initials = driverName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const passengerCount =
    (histDoc["passengers-picked"]?.length ?? 0) -
    (histDoc["passengers-dropped"]?.length ?? 0)

  return {
    id: `${tripId}/${histDoc.id}`,
    driver: { name: driverName, email: driverEmail, avatar: initials },
    origin: histDoc["start-point"],
    destination: histDoc["end-point"],
    passengers: Math.max(0, passengerCount),
    maxPassengers,
    status: histDoc.status,
    departureTime: histDoc["start-time"].toDate().toLocaleString(),
    pointsAwarded,
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch recent trip history entries across all trips (flat collectionGroup query).
 *  Requires a Firestore composite index on trip-history: status + start-time desc. */
export async function getRecentRides(n = 50): Promise<RideViewModel[]> {
  // collectionGroup queries all "trip-history" subcollections
  const q = query(
    collectionGroup(
      (await import("@/lib/firebase")).db,
      "trip-history"
    ),
    orderBy("start-time", "desc"),
    limit(n)
  )
  const snap = await getDocs(q)

  const viewModels: RideViewModel[] = []

  for (const d of snap.docs) {
    const histData = d.data() as TripHistoryDocument
    // Parent doc path: "trip-details/{tripId}/trip-history/{histId}"
    const tripId = d.ref.parent.parent?.id ?? ""

    if (!tripId) continue

    const tripSnap = await getDoc(tripDoc(tripId))
    if (!tripSnap.exists()) continue

    const tripData = tripSnap.data()
    const driverUid = tripData["created-by"]

    // Fetch driver display name from user-data
    const { userDoc } = await import("../collections")
    const userSnap = await getDoc(userDoc(driverUid))
    const driverName = userSnap.exists() ? userSnap.data().name : driverUid
    const driverEmail = userSnap.exists() ? (userSnap.data().email ?? "") : ""

    viewModels.push(
      historyDocToViewModel(
        histData,
        tripId,
        driverName,
        driverEmail,
        tripData.passengers,
        tripData["points-awarded"] ?? 0
      )
    )
  }

  return viewModels
}

/** Fetch trip history entries for a specific trip. */
export async function getRideHistoryForTrip(tripId: string): Promise<TripHistoryDocument[]> {
  const q = query(tripHistoryCol(tripId), orderBy("start-time", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

/** Fetch all active (in-progress) ride history entries. */
export async function getActiveRides(): Promise<RideViewModel[]> {
  const q = query(
    collectionGroup(
      (await import("@/lib/firebase")).db,
      "trip-history"
    ),
    where("status", "==", "in-progress" satisfies TripStatus)
  )
  const snap = await getDocs(q)

  const viewModels: RideViewModel[] = []

  for (const d of snap.docs) {
    const histData = d.data() as TripHistoryDocument
    const tripId = d.ref.parent.parent?.id ?? ""
    if (!tripId) continue

    const tripSnap = await getDoc(tripDoc(tripId))
    if (!tripSnap.exists()) continue

    const tripData = tripSnap.data()
    const { userDoc } = await import("../collections")
    const userSnap = await getDoc(userDoc(tripData["created-by"]))
    const driverName = userSnap.exists() ? userSnap.data().name : tripData["created-by"]
    const driverEmail = userSnap.exists() ? (userSnap.data().email ?? "") : ""

    viewModels.push(
      historyDocToViewModel(
        histData,
        tripId,
        driverName,
        driverEmail,
        tripData.passengers,
        0
      )
    )
  }

  return viewModels
}

/** Admin action: update the status of a trip history entry. */
export async function setRideStatus(
  tripId: string,
  historyId: string,
  status: TripStatus
): Promise<void> {
  const { doc } = await import("firebase/firestore")
  const { db } = await import("@/lib/firebase")
  const ref = doc(db, "trip-details", tripId, "trip-history", historyId)
  await updateDoc(ref, { status })
}
