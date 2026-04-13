import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Ride {
  id: string
  tripName: string
  driver: { name: string; uid: string; avatar: string }
  origin: string
  destination: string
  passengerCount: number
  maxPassengers: number
  status: string
  tripType: string
  dateCreated: string
  pointsAwarded: number
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, "trip-details"),
      orderBy("date-created", "desc")
    )

    // Cache resolved driver names so we don't re-fetch the same user repeatedly
    const driverCache = new Map<string, { name: string; avatar: string }>()

    async function resolveDriver(uid: string): Promise<{ name: string; avatar: string }> {
      if (driverCache.has(uid)) return driverCache.get(uid)!

      try {
        const snap = await getDoc(doc(db, "user-data", uid))
        if (snap.exists()) {
          const data = snap.data()
          const name = data.name ?? uid
          const initials = name
            .split(" ")
            .filter(Boolean)
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?"
          const result = { name, avatar: initials }
          driverCache.set(uid, result)
          return result
        }
      } catch {
        // fall through
      }

      const fallback = { name: uid, avatar: "?" }
      driverCache.set(uid, fallback)
      return fallback
    }

    const unsub = onSnapshot(q, async (snap) => {
      const results: Ride[] = []

      for (const d of snap.docs) {
        const data = d.data()
        const driverUid: string = data["created-by"] ?? ""

        const driver = driverUid ? await resolveDriver(driverUid) : { name: "Unknown", avatar: "?" }

        // Extract human-readable location strings
        const origin =
          data["start-location-str"] ??
          extractLocationName(data["start-location"]) ??
          ""
        const destination =
          data["end-location-str"] ??
          extractLocationName(data["end-location"]) ??
          ""

        const rawDate = data["date-created"]
        const dateCreated = rawDate
          ? typeof rawDate === "string"
            ? rawDate
            : rawDate.toDate().toLocaleString()
          : ""

        results.push({
          id: d.id,
          tripName: data.name ?? "",
          driver: { name: driver.name, uid: driverUid, avatar: driver.avatar },
          origin,
          destination,
          passengerCount: data["passenger-ids"]?.length ?? 0,
          maxPassengers: data.passengers ?? 0,
          status: data.status ?? "not-started",
          tripType: data["trip-type"] ?? "daily",
          dateCreated,
          pointsAwarded: data["points-awarded"] ?? 0,
        })
      }

      setRides(results)
      setLoading(false)
    })

    return unsub
  }, [])

  return { rides, loading }
}

/** Pull the first key name from a Record<string, GeoPoint> map used by the Flutter app. */
function extractLocationName(loc: unknown): string | null {
  if (loc && typeof loc === "object" && !Array.isArray(loc)) {
    const keys = Object.keys(loc)
    return keys.length > 0 ? keys[0] : null
  }
  return null
}
