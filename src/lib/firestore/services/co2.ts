/**
 * co2.ts  —  lib/firestore/services/co2.ts
 *
 * Calculates CO2 savings from completed carpool rides.
 *
 * Formula
 * -------
 * Each completed trip history entry represents one carpool run. For every
 * passenger that was actually picked up we avoided one solo car journey of
 * the same distance. The saving per avoided journey is:
 *
 *   saved_kg = distance_km × passengers_picked × CO2_PER_KM_KG
 *
 * CO2_PER_KM_KG = 0.21 kg/km  (DEFRA 2023 average petrol car: ~210 g CO2/km)
 *
 * Distance is computed with the Haversine formula from the GeoPoint values
 * stored in the parent trip-details document.
 *
 * Query strategy
 * --------------
 * We do NOT use collectionGroup() — it requires a separate Firestore security
 * rule (`match /{path=**}/trip-history/{id}`) that is typically absent and
 * causes "insufficient permissions" errors in the admin panel.
 *
 * Instead we follow the same pattern as users.ts / getAllStudents():
 *   1. getDocs(tripsCol)          — fetch all trip-details (permitted)
 *   2. getDocs(tripHistoryCol(id)) — fetch each trip's subcollection directly
 * Both reads use paths the admin rules already cover.
 */

import {
  getDocs,
  query,
  where,
  type GeoPoint,
} from "firebase/firestore"
import { tripsCol, tripHistoryCol } from "../collections"
import type { TripDocument, TripHistoryDocument } from "../types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Average CO2 emitted per km by a single petrol/gasoline car (DEFRA 2023). */
export const CO2_PER_KM_KG = 0.21

/**
 * kg of CO2 a single tree absorbs per year (US Forest Service estimate).
 * Used only for the "trees equivalent" display metric.
 */
const KG_PER_TREE_PER_YEAR = 20

// ---------------------------------------------------------------------------
// Haversine distance helper
// ---------------------------------------------------------------------------

/**
 * Returns the great-circle distance in kilometres between two GeoPoints.
 * Uses the Haversine formula — accurate enough for campus-scale distances.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371 // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const chord =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon

  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}

/**
 * Extracts the first GeoPoint value from a Firestore location map.
 * Trip documents store locations as `{ "Location Name": GeoPoint }`.
 */
function firstGeoPoint(
  locationMap: Record<string, GeoPoint> | undefined
): GeoPoint | null {
  if (!locationMap) return null
  const values = Object.values(locationMap)
  return values.length > 0 ? values[0] : null
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MonthlyCo2 {
  /** Three-letter month abbreviation, e.g. "Jan" */
  month: string
  /** Total CO2 saved this month in kg */
  co2Saved: number
  /** Approximate trees-equivalent for this month's saving */
  treesEquivalent: number
}

export interface Co2Stats {
  /** Cumulative CO2 saved across all time, in kg */
  totalKg: number
  /** Total number of individual solo car trips that were avoided */
  soloTripsAvoided: number
  /**
   * Approximate number of trees needed for one year to absorb the same CO2.
   * soloTripsAvoided × kg_per_trip / KG_PER_TREE_PER_YEAR
   */
  treesEquivalent: number
  /** Per-month breakdown, sorted chronologically */
  byMonth: MonthlyCo2[]
}

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

/**
 * Fetches all completed trip-history entries, calculates the CO2 saved for
 * each one, and returns aggregate stats plus a per-month breakdown.
 *
 * Query strategy: mirrors getAllStudents() in users.ts.
 *   Step 1 — getDocs(tripsCol): reads the top-level "trip-details" collection.
 *   Step 2 — getDocs(tripHistoryCol(id)): reads each trip's subcollection
 *            directly by its known path, filtered to completed runs only.
 * Neither call requires collectionGroup rules, so no extra security rule is
 * needed beyond the existing admin read access to "trip-details".
 */
export async function getCo2Stats(): Promise<Co2Stats> {
  // ── 1. Fetch all parent trip documents ────────────────────────────────────
  const tripsSnap = await getDocs(tripsCol)

  // ── 2. For each trip, fetch its completed history entries ─────────────────
  // Key: "YYYY-MM"  →  { co2Kg, soloTrips }
  const monthlyMap = new Map<string, { co2Kg: number; soloTrips: number }>()

  let totalKg = 0
  let soloTripsAvoided = 0

  for (const tripDoc of tripsSnap.docs) {
    const tripData = { ...tripDoc.data(), id: tripDoc.id } as TripDocument

    // ── 2a. Extract GeoPoints from the parent trip ───────────────────────────
    const startGeo = firstGeoPoint(
      tripData["start-location"] as Record<string, GeoPoint> | undefined
    )
    const endGeo = firstGeoPoint(
      tripData["end-location"] as Record<string, GeoPoint> | undefined
    )

    // Skip trips with no location data — can't compute distance
    if (!startGeo || !endGeo) continue

    const distanceKm = haversineKm(startGeo, endGeo)

    // ── 2b. Fetch this trip's completed history entries directly ─────────────
    // Uses tripHistoryCol(id) — a normal subcollection ref, not collectionGroup
    const historyQuery = query(
      tripHistoryCol(tripData.id),
      where("status", "==", "completed")
    )
    const historySnap = await getDocs(historyQuery)

    for (const histDoc of historySnap.docs) {
      const hist = { ...histDoc.data(), id: histDoc.id } as TripHistoryDocument

      // ── 2c. Count passengers actually picked up in this run ────────────────
      const passengersPickedUp = hist["passengers-picked"]?.length ?? 0
      if (passengersPickedUp === 0) continue

      // ── 2d. CO2 calculation ────────────────────────────────────────────────
      // Each passenger avoided one solo car journey of `distanceKm`
      const runCo2Kg = distanceKm * passengersPickedUp * CO2_PER_KM_KG

      totalKg += runCo2Kg
      soloTripsAvoided += passengersPickedUp

      // ── 2e. Bucket into calendar month ────────────────────────────────────
      const startDate = hist["start-time"].toDate()
      const monthKey = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}`

      const existing = monthlyMap.get(monthKey) ?? { co2Kg: 0, soloTrips: 0 }
      monthlyMap.set(monthKey, {
        co2Kg: existing.co2Kg + runCo2Kg,
        soloTrips: existing.soloTrips + passengersPickedUp,
      })
    }
  }

  // ── 3. Sort months chronologically and shape output ───────────────────────
  const MONTH_ABBR = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const byMonth: MonthlyCo2[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { co2Kg }]) => {
      const monthIndex = parseInt(key.split("-")[1], 10) - 1
      return {
        month: MONTH_ABBR[monthIndex],
        co2Saved: Math.round(co2Kg),
        treesEquivalent: Math.round(co2Kg / KG_PER_TREE_PER_YEAR),
      }
    })

  return {
    totalKg: Math.round(totalKg),
    soloTripsAvoided,
    treesEquivalent: Math.round(totalKg / KG_PER_TREE_PER_YEAR),
    byMonth,
  }
}
