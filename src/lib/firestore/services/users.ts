import {
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { usersCol, userDoc } from "../collections"
import type { AccountStatus, AcademicYear, StudentViewModel, UserDocument } from "../types"
import { userDocToViewModel } from "../types"

/** Fetch all users and return admin-panel view models. */
export async function getAllStudents(): Promise<StudentViewModel[]> {
  const snap = await getDocs(usersCol)
  return snap.docs.map((d) => userDocToViewModel(d.data()))
}

/** Fetch a single user by UID. */
export async function getStudent(uid: string): Promise<StudentViewModel | null> {
  const snap = await getDoc(userDoc(uid))
  if (!snap.exists()) return null
  return userDocToViewModel(snap.data())
}

/** Fetch users filtered by account status. */
export async function getStudentsByStatus(
  status: AccountStatus
): Promise<StudentViewModel[]> {
  const q = query(usersCol, where("account-status", "==", status))
  const snap = await getDocs(q)
  return snap.docs.map((d) => userDocToViewModel(d.data()))
}

/** Fetch top N students by total points (leaderboard). */
export async function getLeaderboard(n = 5): Promise<StudentViewModel[]> {
  const q = query(usersCol, orderBy("total-points", "desc"), limit(n))
  const snap = await getDocs(q)
  return snap.docs.map((d) => userDocToViewModel(d.data()))
}

/** Update the account status of a user (admin action). */
export async function setAccountStatus(
  uid: string,
  status: AccountStatus
): Promise<void> {
  await updateDoc(userDoc(uid), { "account-status": status })
}

/** Update admin-only profile fields for a student.
 *  Only pass the fields you want to change. */
export async function updateStudentAdminFields(
  uid: string,
  fields: Partial<
    Pick<
      UserDocument,
      | "email"
      | "student-id"
      | "major"
      | "year"
      | "verified-driver"
      | "rides-as-driver"
      | "rides-as-passenger"
      | "total-points"
      | "co2-saved"
      | "rating"
      | "joined-date"
    >
  >
): Promise<void> {
  await updateDoc(userDoc(uid), fields as Record<string, unknown>)
}

/** Set the verified-driver flag (admin driver verification). */
export async function setVerifiedDriver(
  uid: string,
  verified: boolean
): Promise<void> {
  await updateDoc(userDoc(uid), { "verified-driver": verified })
}

/** Increment ride counters after a completed trip history entry.
 *  Call this from a Cloud Function or admin action, not from the Flutter app. */
export async function incrementRideCounters(
  driverUid: string,
  passengerUids: string[]
): Promise<void> {
  const { increment } = await import("firebase/firestore")
  const updates: Promise<void>[] = [
    updateDoc(userDoc(driverUid), { "rides-as-driver": increment(1) }),
    ...passengerUids.map((uid) =>
      updateDoc(userDoc(uid), { "rides-as-passenger": increment(1) })
    ),
  ]
  await Promise.all(updates)
}

/** Add admin-only fields to a user document that was created by the Flutter app.
 *  Safe to call even if the doc already has these fields (will not overwrite). */
export async function initAdminFields(
  uid: string,
  fields: {
    email?: string
    studentId?: string
    major?: string
    year?: AcademicYear
  }
): Promise<void> {
  const snap = await getDoc(userDoc(uid))
  if (!snap.exists()) return

  const data = snap.data()
  const updates: Partial<UserDocument> = {}

  if (fields.email && !data.email) updates.email = fields.email
  if (fields.studentId && !data["student-id"]) updates["student-id"] = fields.studentId
  if (fields.major && !data.major) updates.major = fields.major
  if (fields.year && !data.year) updates.year = fields.year
  if (!data["joined-date"]) updates["joined-date"] = serverTimestamp() as ReturnType<typeof serverTimestamp> as unknown as import("firebase/firestore").Timestamp

  if (Object.keys(updates).length > 0) {
    await updateDoc(userDoc(uid), updates as Record<string, unknown>)
  }
}
