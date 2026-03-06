

import { AdminLayout } from "@/components/admin/admin-layout"
import { StatsCard } from "@/components/admin/stats-card"
import { DataTable } from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, Users, Gift, TrendingUp, MapPin, Clock, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const rideData = [
  { name: "Jan", rides: 1200 },
  { name: "Feb", rides: 1400 },
  { name: "Mar", rides: 1800 },
  { name: "Apr", rides: 2200 },
  { name: "May", rides: 2800 },
  { name: "Jun", rides: 2400 },
]

const recentRides = [
  {
    id: "R-1234",
    driver: "Sarah Chen",
    route: "North Campus → Downtown",
    passengers: 3,
    status: "completed",
    time: "2 mins ago",
  },
  {
    id: "R-1235",
    driver: "Mike Johnson",
    route: "Engineering Hall → West Dorms",
    passengers: 2,
    status: "in_progress",
    time: "15 mins ago",
  },
  {
    id: "R-1236",
    driver: "Emily Davis",
    route: "Library → South Campus",
    passengers: 4,
    status: "scheduled",
    time: "30 mins",
  },
  {
    id: "R-1237",
    driver: "James Wilson",
    route: "Athletic Center → Main Gate",
    passengers: 1,
    status: "completed",
    time: "1 hour ago",
  },
]

const topDrivers = [
  { name: "Sarah Chen", rides: 156, points: 4680, avatar: "SC" },
  { name: "Mike Johnson", rides: 142, points: 4260, avatar: "MJ" },
  { name: "Emily Davis", rides: 128, points: 3840, avatar: "ED" },
  { name: "James Wilson", rides: 115, points: 3450, avatar: "JW" },
]

const rideColumns = [
  { key: "id", label: "Ride ID" },
  { key: "driver", label: "Driver" },
  { key: "route", label: "Route" },
  {
    key: "passengers",
    label: "Passengers",
    render: (value: unknown) => (
      <span className="text-foreground">{String(value)} riders</span>
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
        scheduled: { label: "Scheduled", className: "bg-muted text-muted-foreground border-border" },
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
    key: "time",
    label: "Time",
    render: (value: unknown) => (
      <span className="text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {String(value)}
      </span>
    ),
  },
]

export default function DashboardPage() {
  return (
    <AdminLayout
      title="Dashboard Overview"
      description="Monitor your university carpooling platform performance"
    >
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Rides Today"
          value="847"
          change="+12.5%"
          trend="up"
          icon={Car}
        />
        <StatsCard
          title="Active Students"
          value="3,428"
          change="+8.2%"
          trend="up"
          icon={Users}
          iconColor="bg-chart-2/10 text-chart-2"
        />
        <StatsCard
          title="Points Distributed"
          value="24.5K"
          change="+18.3%"
          trend="up"
          icon={Gift}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="CO2 Saved (kg)"
          value="1,256"
          change="+22.1%"
          trend="up"
          icon={TrendingUp}
          iconColor="bg-chart-4/10 text-chart-4"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Rides Chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Ride Activity</CardTitle>
            <Badge variant="secondary" className="bg-secondary">Last 6 months</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rideData}>
                  <defs>
                    <linearGradient id="rideGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(25, 70%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(25, 70%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(0, 0%, 50%)"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 12%)",
                      border: "1px solid hsl(0, 0%, 20%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 95%)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rides"
                    stroke="hsl(25, 70%, 45%)"
                    strokeWidth={2}
                    fill="url(#rideGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Top Drivers</CardTitle>
            <Link to="/students">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {topDrivers.map((driver, index) => (
              <div key={driver.name} className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground w-4">
                  {index + 1}
                </span>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {driver.avatar}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {driver.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {driver.rides} rides
                  </p>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <Gift className="h-4 w-4" />
                  <span className="text-sm font-medium">{driver.points}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Rides Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Recent Rides</h2>
          <Link to="/rides">
            <Button variant="outline" size="sm">
              View All Rides
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <DataTable columns={rideColumns} data={recentRides} />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-2/10">
                <MapPin className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">42</p>
                <p className="text-sm text-muted-foreground">Active Routes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8.5 min</p>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-4/10">
                <Users className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2.8</p>
                <p className="text-sm text-muted-foreground">Avg Passengers/Ride</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
