import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mock firebase/firestore SDK — must be before importing the service
// ---------------------------------------------------------------------------
const mockGetDocs = vi.fn()
const mockGetDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockQuery = vi.fn((...args: unknown[]) => args)
const mockWhere = vi.fn((...args: unknown[]) => ["where", ...args])
const mockOrderBy = vi.fn((...args: unknown[]) => ["orderBy", ...args])
const mockLimit = vi.fn((n: number) => ["limit", n])
const mockServerTimestamp = vi.fn(() => "SERVER_TIMESTAMP")
const mockIncrement = vi.fn((n: number) => ({ __increment: n }))

vi.mock("firebase/firestore", () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (n: number) => mockLimit(n),
  serverTimestamp: () => mockServerTimestamp(),
  increment: (n: number) => mockIncrement(n),
}))

// ---------------------------------------------------------------------------
// Mock collection refs so Firebase is never initialised
// ---------------------------------------------------------------------------
const mockUserDoc = vi.fn((uid: string) => `doc-ref:${uid}`)

vi.mock("../collections", () => ({
  usersCol: "col-ref:user-data",
  userDoc: (uid: string) => mockUserDoc(uid),
}))

// ---------------------------------------------------------------------------
// Mock the view-model mapper — service tests should not re-test it
// ---------------------------------------------------------------------------
vi.mock("../types", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../types")>()
  return {
    ...orig,
    userDocToViewModel: vi.fn((doc) => ({ _mapped: true, id: doc.id })),
  }
})

import {
  getAllStudents,
  getStudent,
  getStudentsByStatus,
  getLeaderboard,
  setAccountStatus,
  updateStudentAdminFields,
  setVerifiedDriver,
  incrementRideCounters,
  initAdminFields,
} from "../services/users"
import { userDocToViewModel } from "../types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a fake Firestore document snapshot. */
function fakeDocSnap(id: string, data: Record<string, unknown>, exists = true) {
  return {
    id,
    exists: () => exists,
    data: () => data,
  }
}

/** Creates a fake Firestore query snapshot with multiple docs. */
function fakeQuerySnap(docs: ReturnType<typeof fakeDocSnap>[]) {
  return {
    size: docs.length,
    docs,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getAllStudents", () => {
  it("calls getDocs on the users collection and maps results", async () => {
    const docs = [fakeDocSnap("u1", { name: "A" }), fakeDocSnap("u2", { name: "B" })]
    mockGetDocs.mockResolvedValue(fakeQuerySnap(docs))

    const result = await getAllStudents()

    expect(mockGetDocs).toHaveBeenCalledWith("col-ref:user-data")
    expect(userDocToViewModel).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ _mapped: true, id: "u1" })
    expect(result[1]).toEqual({ _mapped: true, id: "u2" })
  })

  it("returns an empty array when no documents exist", async () => {
    mockGetDocs.mockResolvedValue(fakeQuerySnap([]))

    const result = await getAllStudents()

    expect(result).toEqual([])
    expect(userDocToViewModel).not.toHaveBeenCalled()
  })
})

describe("getStudent", () => {
  it("returns a mapped view model when the document exists", async () => {
    mockGetDoc.mockResolvedValue(fakeDocSnap("u1", { name: "A" }))

    const result = await getStudent("u1")

    expect(mockUserDoc).toHaveBeenCalledWith("u1")
    expect(mockGetDoc).toHaveBeenCalledWith("doc-ref:u1")
    expect(result).toEqual({ _mapped: true, id: "u1" })
  })

  it("returns null when the document does not exist", async () => {
    mockGetDoc.mockResolvedValue(fakeDocSnap("u1", {}, false))

    const result = await getStudent("u1")

    expect(result).toBeNull()
    expect(userDocToViewModel).not.toHaveBeenCalled()
  })
})

describe("getStudentsByStatus", () => {
  it("builds a where query on account-status and maps results", async () => {
    const docs = [fakeDocSnap("u1", { name: "A" })]
    mockGetDocs.mockResolvedValue(fakeQuerySnap(docs))

    const result = await getStudentsByStatus("pending")

    expect(mockWhere).toHaveBeenCalledWith("account-status", "==", "pending")
    expect(mockQuery).toHaveBeenCalledWith(
      "col-ref:user-data",
      ["where", "account-status", "==", "pending"]
    )
    expect(result).toHaveLength(1)
  })
})

describe("getLeaderboard", () => {
  it("queries with orderBy total-points desc and limit", async () => {
    const docs = [fakeDocSnap("u1", {}), fakeDocSnap("u2", {})]
    mockGetDocs.mockResolvedValue(fakeQuerySnap(docs))

    const result = await getLeaderboard(3)

    expect(mockOrderBy).toHaveBeenCalledWith("total-points", "desc")
    expect(mockLimit).toHaveBeenCalledWith(3)
    expect(result).toHaveLength(2)
  })

  it("defaults to 5 when no argument is passed", async () => {
    mockGetDocs.mockResolvedValue(fakeQuerySnap([]))

    await getLeaderboard()

    expect(mockLimit).toHaveBeenCalledWith(5)
  })
})

describe("setAccountStatus", () => {
  it("calls updateDoc with the correct kebab-case field", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await setAccountStatus("u1", "suspended")

    expect(mockUserDoc).toHaveBeenCalledWith("u1")
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:u1", {
      "account-status": "suspended",
    })
  })
})

describe("updateStudentAdminFields", () => {
  it("passes the fields object through to updateDoc", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)
    const fields = { email: "new@uni.edu", major: "Physics" }

    await updateStudentAdminFields("u1", fields)

    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:u1", fields)
  })
})

describe("setVerifiedDriver", () => {
  it("sets verified-driver to true", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await setVerifiedDriver("u1", true)

    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:u1", {
      "verified-driver": true,
    })
  })

  it("sets verified-driver to false", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await setVerifiedDriver("u1", false)

    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:u1", {
      "verified-driver": false,
    })
  })
})

describe("incrementRideCounters", () => {
  it("increments driver and all passenger counters in parallel", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await incrementRideCounters("driver-1", ["pass-1", "pass-2"])

    expect(mockUpdateDoc).toHaveBeenCalledTimes(3)

    // Driver gets rides-as-driver incremented
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:driver-1", {
      "rides-as-driver": { __increment: 1 },
    })

    // Each passenger gets rides-as-passenger incremented
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:pass-1", {
      "rides-as-passenger": { __increment: 1 },
    })
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:pass-2", {
      "rides-as-passenger": { __increment: 1 },
    })
  })

  it("handles empty passenger list (driver only)", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await incrementRideCounters("driver-1", [])

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:driver-1", {
      "rides-as-driver": { __increment: 1 },
    })
  })
})

describe("initAdminFields", () => {
  it("does nothing when the user document does not exist", async () => {
    mockGetDoc.mockResolvedValue(fakeDocSnap("u1", {}, false))

    await initAdminFields("u1", { email: "test@uni.edu" })

    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it("writes fields that are missing on the document", async () => {
    mockGetDoc.mockResolvedValue(fakeDocSnap("u1", { name: "A" }))
    mockUpdateDoc.mockResolvedValue(undefined)

    await initAdminFields("u1", {
      email: "test@uni.edu",
      studentId: "2024001",
      major: "CS",
      year: "Junior",
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:u1", {
      email: "test@uni.edu",
      "student-id": "2024001",
      major: "CS",
      year: "Junior",
      "joined-date": "SERVER_TIMESTAMP",
    })
  })

  it("does not overwrite fields that already exist on the document", async () => {
    mockGetDoc.mockResolvedValue(
      fakeDocSnap("u1", {
        name: "A",
        email: "existing@uni.edu",
        major: "Biology",
        "joined-date": "already-set",
      })
    )
    mockUpdateDoc.mockResolvedValue(undefined)

    await initAdminFields("u1", {
      email: "new@uni.edu",
      studentId: "2024999",
      major: "Physics",
      year: "Senior",
    })

    // Only student-id and year should be written (email, major, joined-date already exist)
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref:u1", {
      "student-id": "2024999",
      year: "Senior",
    })
  })

  it("does not call updateDoc when all fields already exist", async () => {
    mockGetDoc.mockResolvedValue(
      fakeDocSnap("u1", {
        name: "A",
        email: "e@uni.edu",
        "student-id": "123",
        major: "CS",
        year: "Junior",
        "joined-date": "exists",
      })
    )

    await initAdminFields("u1", {
      email: "e@uni.edu",
      studentId: "123",
      major: "CS",
      year: "Junior",
    })

    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })
})
