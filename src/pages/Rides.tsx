

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Car,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ridesData = [
  {
    id: "R-1234",
    driver: { name: "Sarah Chen", email: "sarah.chen@university.edu", avatar: "SC" },
    origin: "North Campus",
    destination: "Downtown Transit Hub",
    passengers: 3,
    maxPassengers: 4,
    status: "completed",
    departureTime: "2024-03-15 08:30 AM",
    pointsAwarded: 45,
  },
  {
    id: "R-1235",
    driver: { name: "Mike Johnson", email: "mike.j@university.edu", avatar: "MJ" },
    origin: "Engineering Hall",
    destination: "West Dormitories",
    passengers: 2,
    maxPassengers: 3,
    status: "in_progress",
    departureTime: "2024-03-15 09:15 AM",
    pointsAwarded: 0,
  },
  {
    id: "R-1236",
    driver: { name: "Emily Davis", email: "emily.d@university.edu", avatar: "ED" },
    origin: "Main Library",
    destination: "South Campus",
    passengers: 4,
    maxPassengers: 4,
    status: "scheduled",
    departureTime: "2024-03-15 10:00 AM",
    pointsAwarded: 0,
  },
  {
    id: "R-1237",
    driver: { name: "James Wilson", email: "james.w@university.edu", avatar: "JW" },
    origin: "Athletic Center",
    destination: "Main Gate",
    passengers: 1,
    maxPassengers: 4,
    status: "completed",
    departureTime: "2024-03-15 07:45 AM",
    pointsAwarded: 15,
  },
  {
    id: "R-1238",
    driver: { name: "Lisa Park", email: "lisa.p@university.edu", avatar: "LP" },
    origin: "Medical School",
    destination: "Research Park",
    passengers: 2,
    maxPassengers: 3,
    status: "cancelled",
    departureTime: "2024-03-15 11:00 AM",
    pointsAwarded: 0,
  },
  {
    id: "R-1239",
    driver: { name: "David Kim", email: "david.k@university.edu", avatar: "DK" },
    origin: "Business School",
    destination: "Student Union",
    passengers: 3,
    maxPassengers: 4,
    status: "completed",
    departureTime: "2024-03-15 08:00 AM",
    pointsAwarded: 45,
  },
  {
    id: "R-1240",
    driver: { name: "Anna Martinez", email: "anna.m@university.edu", avatar: "AM" },
    origin: "Art Building",
    destination: "Downtown Gallery",
    passengers: 2,
    maxPassengers: 2,
    status: "in_progress",
    departureTime: "2024-03-15 09:30 AM",
    pointsAwarded: 0,
  },
]

type Ride = typeof ridesData[0]

const rideColumns = [
  {
    key: "id",
    label: "Ride ID",
    render: (value: unknown) => (
      <span className="font-mono text-sm text-foreground">{String(value)}</span>
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
        <div>
          <p className="text-sm font-medium text-foreground">{row.driver.name}</p>
          <p className="text-xs text-muted-foreground">{row.driver.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "route",
    label: "Route",
    render: (_: unknown, row: Ride) => (
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-foreground">{row.origin}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-foreground">{row.destination}</span>
      </div>
    ),
  },
  {
    key: "passengers",
    label: "Passengers",
    render: (_: unknown, row: Ride) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">{row.passengers}/{row.maxPassengers}</span>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value: unknown) => {
      const status = value as string
      const variants: Record<string, { label: string; className: string }> = {
        completed: { label: "Completed", className: "bg-success/10 text-success border-success/20" },
        in_progress: { label: "In Progress", className: "bg-accent/10 text-accent border-accent/20" },
        scheduled: { label: "Scheduled", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
        cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
      }
      const variant = variants[status] || variants.scheduled
      return (
        <Badge variant="outline" className={variant.className}>
          {variant.label}
        </Badge>
      )
    },
  },
  {
    key: "departureTime",
    label: "Departure",
    render: (value: unknown) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        {String(value)}
      </div>
    ),
  },
  {
    key: "pointsAwarded",
    label: "Points",
    render: (value: unknown) => (
      <span className={`text-sm font-medium ${Number(value) > 0 ? "text-success" : "text-muted-foreground"}`}>
        {Number(value) > 0 ? `+${value}` : "-"}
      </span>
    ),
  },
  {
    key: "actions",
    label: "",
    render: (_: unknown, row: Ride) => (
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
          {row.status === "scheduled" && (
            <>
              <DropdownMenuItem>
                <CheckCircle className="mr-2 h-4 w-4" />
                Start Ride
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Ban className="mr-2 h-4 w-4" />
                Cancel Ride
              </DropdownMenuItem>
            </>
          )}
          {row.status === "in_progress" && (
            <DropdownMenuItem>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Ride
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export default function RidesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredRides = ridesData.filter((ride) => {
    const matchesSearch =
      ride.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || ride.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout
      title="Ride Management"
      description="Manage and monitor all carpooling rides"
      actions={
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Ride
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Ride</DialogTitle>
              <DialogDescription>
                Schedule a new carpool ride for the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="driver">Driver Email</Label>
                <Input id="driver" placeholder="driver@university.edu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north-campus">North Campus</SelectItem>
                      <SelectItem value="south-campus">South Campus</SelectItem>
                      <SelectItem value="library">Main Library</SelectItem>
                      <SelectItem value="engineering">Engineering Hall</SelectItem>
                      <SelectItem value="athletic">Athletic Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downtown">Downtown</SelectItem>
                      <SelectItem value="west-dorms">West Dorms</SelectItem>
                      <SelectItem value="main-gate">Main Gate</SelectItem>
                      <SelectItem value="transit-hub">Transit Hub</SelectItem>
                      <SelectItem value="student-union">Student Union</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seats">Available Seats</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select seats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 seat</SelectItem>
                    <SelectItem value="2">2 seats</SelectItem>
                    <SelectItem value="3">3 seats</SelectItem>
                    <SelectItem value="4">4 seats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Create Ride</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatsCard
          title="Today's Rides"
          value="124"
          change="+8%"
          trend="up"
          icon={Car}
        />
        <StatsCard
          title="Active Now"
          value="23"
          icon={Clock}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Scheduled"
          value="47"
          icon={MapPin}
          iconColor="bg-chart-2/10 text-chart-2"
        />
        <StatsCard
          title="Avg Passengers"
          value="2.8"
          change="+0.3"
          trend="up"
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
                  placeholder="Search rides..."
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredRides.length} rides found
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable columns={rideColumns} data={filteredRides} />
    </AdminLayout>
  )
}
