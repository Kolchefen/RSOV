import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  studentId: string
  major: string
  year: string
  avatar: string
  status: "active" | "pending" | "suspended"
  verifiedDriver: boolean
  ridesAsDriver: number
  ridesAsPassenger: number
  totalPoints: number
  co2Saved: number
  rating: number
  joinedDate: string
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "user-data"), orderBy("name"))
    const unsub = onSnapshot(q, (snap) => {
      setStudents(
        snap.docs.map((doc) => {
          const data = doc.data()

          // Helper for date fields that might be stored as either a string or a Firestore Timestamp
          const rawDate = data.joinedDate ?? data["date-joined"]

          return {
            id: doc.id,
            name: data.name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? data["phone-number"] ?? "",
            studentId: data.studentId ?? data["student-id"] ?? "", 
            major: data.major ?? "",
            year: data.year ?? "",
            avatar: data.avatar ?? data["profile-img"] ?? "",
            status: data.status ?? data["account-status"] ?? "active",
            verifiedDriver: data.verifiedDriver ?? data["verified-driver"] ?? false,
            ridesAsDriver: data.ridesAsDriver ?? data["rides-as-driver"] ?? 0,
            ridesAsPassenger: data.ridesAsPassenger ?? data["rides-as-passenger"] ?? 0,
            totalPoints: data.totalPoints ?? data["total-points"] ?? 0,
            co2Saved: data.co2Saved ?? data["co2-saved"] ?? 0,
            rating: data.rating ?? 0,
            joinedDate: rawDate
              ? (typeof rawDate === "string"
                  ? rawDate
                  : rawDate.toDate().toISOString())
              : "",
          }
        })
      )
      setLoading(false)
    })
    return unsub
  }, [])

  return { students, loading }
}