import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { StudentViewModel } from "@/lib/firestore/types"

// ---------------------------------------------------------------------------
// Mock the Firestore service — never hit Firebase
// ---------------------------------------------------------------------------
const mockGetAllStudents = vi.fn()

vi.mock("@/lib/firestore/services/users", () => ({
  getAllStudents: (...args: unknown[]) => mockGetAllStudents(...args),
}))

// ---------------------------------------------------------------------------
// Mock layout components — avoids react-router-dom / Sidebar dependencies
// ---------------------------------------------------------------------------
vi.mock("@/components/admin/admin-layout", () => ({
  AdminLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="admin-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

vi.mock("@/components/admin/stats-card", () => ({
  StatsCard: ({ title, value }: { title: string; value: string }) => (
    <div data-testid={`stats-${title}`}>{value}</div>
  ),
}))

import StudentsPage from "../Students"

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeStudent(overrides: Partial<StudentViewModel> = {}): StudentViewModel {
  return {
    id: "u1",
    name: "Jane Doe",
    email: "jane@uni.edu",
    phone: "+15551234567",
    studentId: "2024001",
    major: "Computer Science",
    year: "Junior",
    avatar: "JD",
    status: "active",
    ridesAsDriver: 3,
    ridesAsPassenger: 10,
    totalPoints: 250,
    co2Saved: 15,
    rating: 4.5,
    joinedDate: "2025-08-15",
    verifiedDriver: false,
    ...overrides,
  }
}

const STUDENTS: StudentViewModel[] = [
  makeStudent({ id: "u1", name: "Jane Doe", email: "jane@uni.edu", major: "Computer Science", year: "Junior", status: "active", verifiedDriver: true, rating: 4.5 }),
  makeStudent({ id: "u2", name: "Bob Smith", email: "bob@uni.edu", major: "Physics", year: "Senior", status: "pending", avatar: "BS", rating: 0 }),
  makeStudent({ id: "u3", name: "Alice Lee", email: "alice@uni.edu", major: "Biology", year: "Junior", status: "suspended", avatar: "AL", rating: 4.8, verifiedDriver: true }),
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

describe("StudentsPage", () => {
  describe("loading state", () => {
    it("shows loading message while fetching", () => {
      // Never resolve — keeps component in loading state
      mockGetAllStudents.mockReturnValue(new Promise(() => {}))

      render(<StudentsPage />)

      expect(screen.getByText("Loading students...")).toBeInTheDocument()
    })
  })

  describe("empty state", () => {
    it("shows 'No students found.' when service returns empty array", async () => {
      mockGetAllStudents.mockResolvedValue([])

      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("No students found.")).toBeInTheDocument()
      })
    })
  })

  describe("error handling", () => {
    it("shows empty state and does not crash when service rejects", async () => {
      mockGetAllStudents.mockRejectedValue(new Error("Network error"))

      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("No students found.")).toBeInTheDocument()
      })
    })
  })

  describe("data rendering", () => {
    beforeEach(() => {
      mockGetAllStudents.mockResolvedValue(STUDENTS)
    })

    it("renders student names after loading", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })
      expect(screen.getByText("Bob Smith")).toBeInTheDocument()
      expect(screen.getByText("Alice Lee")).toBeInTheDocument()
    })

    it("renders student emails", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("jane@uni.edu")).toBeInTheDocument()
      })
      expect(screen.getByText("bob@uni.edu")).toBeInTheDocument()
    })

    it("renders student majors", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Computer Science")).toBeInTheDocument()
      })
      expect(screen.getByText("Physics")).toBeInTheDocument()
    })

    it("shows Driver badge for verified drivers", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })

      // Jane and Alice are verified drivers
      const driverBadges = screen.getAllByText("Driver")
      expect(driverBadges.length).toBe(2)
    })

    it("renders status badges with capitalized text", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument()
      })
      expect(screen.getByText("Pending")).toBeInTheDocument()
      expect(screen.getByText("Suspended")).toBeInTheDocument()
    })

    it("displays the correct student count", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("3 students found")).toBeInTheDocument()
      })
    })
  })

  describe("stats cards", () => {
    beforeEach(() => {
      mockGetAllStudents.mockResolvedValue(STUDENTS)
    })

    it("shows total student count", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByTestId("stats-Total Students")).toHaveTextContent("3")
      })
    })

    it("counts verified drivers", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByTestId("stats-Verified Drivers")).toHaveTextContent("2")
      })
    })

    it("calculates average rating excluding zero-rated students", async () => {
      render(<StudentsPage />)

      // Jane (4.5) + Alice (4.8) = 9.3 / 2 = 4.65
      await waitFor(() => {
        expect(screen.getByTestId("stats-Avg Rating")).toHaveTextContent("4.65")
      })
    })

    it("counts pending students", async () => {
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByTestId("stats-Pending Verification")).toHaveTextContent("1")
      })
    })
  })

  describe("search filtering", () => {
    beforeEach(() => {
      mockGetAllStudents.mockResolvedValue(STUDENTS)
    })

    it("filters by name", async () => {
      const user = userEvent.setup()
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search students...")
      await user.type(searchInput, "Bob")

      expect(screen.getByText("Bob Smith")).toBeInTheDocument()
      expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument()
      expect(screen.queryByText("Alice Lee")).not.toBeInTheDocument()
      expect(screen.getByText("1 students found")).toBeInTheDocument()
    })

    it("filters by email", async () => {
      const user = userEvent.setup()
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search students...")
      await user.type(searchInput, "alice@uni")

      expect(screen.getByText("Alice Lee")).toBeInTheDocument()
      expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument()
    })

    it("filters by major", async () => {
      const user = userEvent.setup()
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search students...")
      await user.type(searchInput, "Physics")

      expect(screen.getByText("Bob Smith")).toBeInTheDocument()
      expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument()
    })

    it("is case-insensitive", async () => {
      const user = userEvent.setup()
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search students...")
      await user.type(searchInput, "jane doe")

      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument()
    })

    it("shows empty state when search matches nothing", async () => {
      const user = userEvent.setup()
      render(<StudentsPage />)

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search students...")
      await user.type(searchInput, "nonexistent")

      expect(screen.getByText("No students found.")).toBeInTheDocument()
      expect(screen.getByText("0 students found")).toBeInTheDocument()
    })
  })
})
