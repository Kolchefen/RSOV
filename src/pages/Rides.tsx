import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DataTable } from "@/components/admin/data-table"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Car,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRides, type Ride } from "@/hooks/use-rides"

const rideColumns = [
  {
    key: "tripName",
    label: "Trip",
    render: (value: unknown, row: Ride) => (
      <div>
        <p className="text-sm font-medium text-foreground">{String(value) || "Untitled"}</p>
        <p className="text-xs font-mono text-muted-foreground">{row.id.slice(0, 8)}...</p>
      </div>
    ),
  },
  {
    key: "driver",
    label: "Driver",
    render: (_: unknown, row: Ride) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-xs font-medium text-foreground">
            {row.driver.avatar}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">{row.driver.name}</p>
      </div>
    ),
  },
  {
    key: "route",
    label: "Route",
    render: (_: unknown, row: Ride) => (
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-foreground">{row.origin || "—"}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-foreground">{row.destination || "—"}</span>
      </div>
    ),
  },
  {
    key: "passengerCount",
    label: "Passengers",
    render: (_: unknown, row: Ride) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">{row.passengerCount}/{row.maxPassengers}</span>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value: unknown) => {
      const status = value as string
      const variants: Record<string, { label: string; className: string }> = {
        "completed": { label: "Completed", className: "bg-success/10 text-success border-success/20" },
        "in-progress": { label: "In Progress", className: "bg-accent/10 text-accent border-accent/20" },
        "not-started": { label: "Not Started", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
        "cancelled": { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
      }
      const variant = variants[status] || variants["not-started"]
      return (
        <Badge variant="outline" className={variant.className}>
          {variant.label}
        </Badge>
      )
    },
  },
  {
    key: "tripType",
    label: "Type",
    render: (value: unknown) => (
      <Badge variant="secondary" className="capitalize">
        {String(value)}
      </Badge>
    ),
  },
  {
    key: "dateCreated",
    label: "Created",
    render: (value: unknown) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        {String(value) || "—"}
      </div>
    ),
  },
  {
    key: "pointsAwarded",
    label: "Points",
    render: (value: unknown) => (
      <span className={`text-sm font-medium ${Number(value) > 0 ? "text-success" : "text-muted-foreground"}`}>
        {Number(value) > 0 ? `+${value}` : "—"}
      </span>
    ),
  },
  {
    key: "actions",
    label: "",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export default function RidesPage() {
  const { rides, loading } = useRides()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredRides = rides.filter((ride) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      ride.tripName.toLowerCase().includes(q) ||
      ride.driver.name.toLowerCase().includes(q) ||
      ride.origin.toLowerCase().includes(q) ||
      ride.destination.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || ride.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalRides = rides.length
  const activeRides = rides.filter((r) => r.status === "in-progress").length
  const notStarted = rides.filter((r) => r.status === "not-started").length
  const avgPassengers =
    rides.length > 0
      ? (rides.reduce((sum, r) => sum + r.passengerCount, 0) / rides.length).toFixed(1)
      : "0"

  return (
    <AdminLayout
      title="Ride Management"
      description="Manage and monitor all carpooling rides"
    >
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatsCard
          title="Total Trips"
          value={loading ? "..." : String(totalRides)}
          icon={Car}
        />
        <StatsCard
          title="Active Now"
          value={loading ? "..." : String(activeRides)}
          icon={Clock}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Not Started"
          value={loading ? "..." : String(notStarted)}
          icon={MapPin}
          iconColor="bg-chart-2/10 text-chart-2"
        />
        <StatsCard
          title="Avg Passengers"
          value={loading ? "..." : avgPassengers}
          icon={Users}
          iconColor="bg-chart-4/10 text-chart-4"
        />
      </div>

      {/* Filters */}
      <Card className="border-border mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredRides.length} trips found
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={rideColumns}
        data={filteredRides}
        emptyMessage={loading ? "Loading trips..." : "No trips found"}
      />
    </AdminLayout>
  )
}
