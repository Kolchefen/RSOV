import { describe, it, expect } from "vitest"
import { userDocToViewModel } from "../types"
import type { UserDocument } from "../types"
import type { Timestamp } from "firebase/firestore"

/** Helper to build a minimal valid UserDocument with overrides. */
function makeUserDoc(overrides: Partial<UserDocument> = {}): UserDocument {
  return {
    id: "uid-1",
    name: "Jane Doe",
    "phone-number": "+15551234567",
    "app-mode": "passenger",
    location: "Campus",
    bio: "Hello",
    "profile-img": "",
    "cur-selected-location": {},
    "account-status": "active",
    ...overrides,
  }
}

/** Helper to create a fake Firestore Timestamp. */
function fakeTimestamp(isoDate: string): Timestamp {
  return {
    toDate: () => new Date(isoDate),
  } as unknown as Timestamp
}

describe("userDocToViewModel", () => {
  it("maps all core fields correctly", () => {
    const doc = makeUserDoc({
      email: "jane@uni.edu",
      "student-id": "2024001",
      major: "Computer Science",
      year: "Junior",
      "rides-as-driver": 5,
      "rides-as-passenger": 12,
      "total-points": 340,
      "co2-saved": 28,
      rating: 4.7,
      "joined-date": fakeTimestamp("2025-08-15"),
      "verified-driver": true,
    })

    const vm = userDocToViewModel(doc)

    expect(vm).toEqual({
      id: "uid-1",
      name: "Jane Doe",
      email: "jane@uni.edu",
      phone: "+15551234567",
      studentId: "2024001",
      major: "Computer Science",
      year: "Junior",
      avatar: "JD",
      status: "active",
      ridesAsDriver: 5,
      ridesAsPassenger: 12,
      totalPoints: 340,
      co2Saved: 28,
      rating: 4.7,
      joinedDate: "2025-08-15",
      verifiedDriver: true,
    })
  })

  it("defaults optional fields when missing", () => {
    const doc = makeUserDoc()
    const vm = userDocToViewModel(doc)

    expect(vm.email).toBe("")
    expect(vm.studentId).toBe("")
    expect(vm.major).toBe("")
    expect(vm.year).toBe("")
    expect(vm.ridesAsDriver).toBe(0)
    expect(vm.ridesAsPassenger).toBe(0)
    expect(vm.totalPoints).toBe(0)
    expect(vm.co2Saved).toBe(0)
    expect(vm.rating).toBe(0)
    expect(vm.joinedDate).toBe("")
  })

  describe("avatar initials", () => {
    it("takes first letter of first and last name", () => {
      const vm = userDocToViewModel(makeUserDoc({ name: "Alice Smith" }))
      expect(vm.avatar).toBe("AS")
    })

    it("handles single-word name", () => {
      const vm = userDocToViewModel(makeUserDoc({ name: "Madonna" }))
      expect(vm.avatar).toBe("M")
    })

    it("handles three-word name (takes first two initials)", () => {
      const vm = userDocToViewModel(makeUserDoc({ name: "Mary Jane Watson" }))
      expect(vm.avatar).toBe("MJ")
    })

    it("uppercases lowercase names", () => {
      const vm = userDocToViewModel(makeUserDoc({ name: "bob jones" }))
      expect(vm.avatar).toBe("BJ")
    })
  })

  describe("verifiedDriver fallback", () => {
    it("uses verified-driver field when present", () => {
      const vm = userDocToViewModel(
        makeUserDoc({ "verified-driver": true, "app-mode": "passenger" })
      )
      expect(vm.verifiedDriver).toBe(true)
    })

    it("uses verified-driver false even if app-mode is driver", () => {
      const vm = userDocToViewModel(
        makeUserDoc({ "verified-driver": false, "app-mode": "driver" })
      )
      expect(vm.verifiedDriver).toBe(false)
    })

    it("falls back to app-mode when verified-driver is undefined", () => {
      const vmDriver = userDocToViewModel(makeUserDoc({ "app-mode": "driver" }))
      expect(vmDriver.verifiedDriver).toBe(true)

      const vmPassenger = userDocToViewModel(makeUserDoc({ "app-mode": "passenger" }))
      expect(vmPassenger.verifiedDriver).toBe(false)
    })
  })

  describe("account status mapping", () => {
    const statuses = ["active", "pending", "suspended", "blocked"] as const
    statuses.forEach((status) => {
      it(`maps account-status "${status}"`, () => {
        const vm = userDocToViewModel(makeUserDoc({ "account-status": status }))
        expect(vm.status).toBe(status)
      })
    })
  })

  it("formats joined-date as ISO date string (YYYY-MM-DD)", () => {
    const vm = userDocToViewModel(
      makeUserDoc({ "joined-date": fakeTimestamp("2024-01-15T10:30:00Z") })
    )
    expect(vm.joinedDate).toBe("2024-01-15")
  })
})
