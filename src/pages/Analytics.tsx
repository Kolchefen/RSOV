// @ts-nocheck


import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Users,
  Car,
  Leaf,
  Clock,
  MapPin,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

const monthlyRidesData = [
  { month: "Jan", rides: 12400, users: 2800 },
  { month: "Feb", rides: 14200, users: 3100 },
  { month: "Mar", rides: 18600, users: 3400 },
  { month: "Apr", rides: 22100, users: 3650 },
  { month: "May", rides: 28500, users: 4200 },
  { month: "Jun", rides: 24800, users: 4100 },
  { month: "Jul", rides: 21200, users: 3800 },
  { month: "Aug", rides: 19500, users: 3600 },
  { month: "Sep", rides: 31200, users: 4800 },
  { month: "Oct", rides: 35800, users: 5200 },
  { month: "Nov", rides: 32400, users: 5100 },
  { month: "Dec", rides: 28900, users: 4600 },
]

const hourlyDistribution = [
  { hour: "6am", rides: 120 },
  { hour: "7am", rides: 450 },
  { hour: "8am", rides: 890 },
  { hour: "9am", rides: 720 },
  { hour: "10am", rides: 380 },
  { hour: "11am", rides: 290 },
  { hour: "12pm", rides: 420 },
  { hour: "1pm", rides: 380 },
  { hour: "2pm", rides: 350 },
  { hour: "3pm", rides: 520 },
  { hour: "4pm", rides: 680 },
  { hour: "5pm", rides: 920 },
  { hour: "6pm", rides: 750 },
  { hour: "7pm", rides: 480 },
  { hour: "8pm", rides: 320 },
  { hour: "9pm", rides: 180 },
]

const routePopularity = [
  { name: "North Campus → Downtown", rides: 2840, percentage: 18.5 },
  { name: "Engineering Hall → West Dorms", rides: 2156, percentage: 14.1 },
  { name: "Library → South Campus", rides: 1892, percentage: 12.3 },
  { name: "Athletic Center → Main Gate", rides: 1654, percentage: 10.8 },
  { name: "Medical School → Research Park", rides: 1423, percentage: 9.3 },
]

const userSegments = [
  { name: "Drivers", value: 892, color: "hsl(145, 60%, 45%)" },
  { name: "Passengers Only", value: 2536, color: "hsl(220, 60%, 50%)" },
]

const sustainabilityData = [
  { month: "Jan", co2Saved: 2480, treesEquivalent: 124 },
  { month: "Feb", co2Saved: 2840, treesEquivalent: 142 },
  { month: "Mar", co2Saved: 3720, treesEquivalent: 186 },
  { month: "Apr", co2Saved: 4420, treesEquivalent: 221 },
  { month: "May", co2Saved: 5700, treesEquivalent: 285 },
  { month: "Jun", co2Saved: 4960, treesEquivalent: 248 },
]

const engagementMetrics = [
  { metric: "App Opens", A: 85 },
  { metric: "Ride Bookings", A: 72 },
  { metric: "Profile Completion", A: 68 },
  { metric: "Reward Claims", A: 45 },
  { metric: "Referrals", A: 38 },
  { metric: "Reviews Given", A: 62 },
]

const weekdayData = [
  { day: "Mon", rides: 4200 },
  { day: "Tue", rides: 4600 },
  { day: "Wed", rides: 5100 },
  { day: "Thu", rides: 4800 },
  { day: "Fri", rides: 5400 },
  { day: "Sat", rides: 2100 },
  { day: "Sun", rides: 1800 },
]

const kpiCards = [
  { 
    title: "Ride Completion Rate", 
    value: "94.2%", 
    change: "+2.1%", 
    trend: "up",
    description: "Rides successfully completed"
  },
  { 
    title: "Avg Wait Time", 
    value: "8.5 min", 
    change: "-1.2 min", 
    trend: "up",
    description: "Average passenger wait time"
  },
  { 
    title: "User Retention", 
    value: "78.4%", 
    change: "+5.3%", 
    trend: "up",
    description: "30-day active user retention"
  },
  { 
    title: "Avg Rating", 
    value: "4.72", 
    change: "+0.08", 
    trend: "up",
    description: "Average driver rating"
  },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("year")

  return (
    <AdminLayout
      title="Analytics"
      description="Platform performance and insights"
      actions={
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatsCard
          title="Total Rides"
          value="289.6K"
          change="+23.5%"
          trend="up"
          icon={Car}
        />
        <StatsCard
          title="Active Users"
          value="5,428"
          change="+18.2%"
          trend="up"
          icon={Users}
          iconColor="bg-chart-2/10 text-chart-2"
        />
        <StatsCard
          title="CO2 Saved"
          value="24.1 tons"
          change="+31.4%"
          trend="up"
          icon={Leaf}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Avg Trip Duration"
          value="18.5 min"
          change="-2.3%"
          trend="up"
          icon={Clock}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rides">Rides</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title} className="border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <div className={`flex items-center text-sm ${kpi.trend === "up" ? "text-primary" : "text-destructive"}`}>
                      {kpi.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {kpi.change}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Rides & Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRidesData}>
                      <defs>
                        <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                      <XAxis dataKey="month" stroke="hsl(0, 0%, 50%)" fontSize={12} />
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
                        stroke="hsl(145, 60%, 45%)"
                        strokeWidth={2}
                        fill="url(#ridesGradient)"
                        name="Rides"
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(220, 60%, 50%)"
                        strokeWidth={2}
                        fill="url(#usersGradient)"
                        name="Active Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={engagementMetrics}>
                      <PolarGrid stroke="hsl(0, 0%, 25%)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(0, 0%, 60%)", fontSize: 11 }} />
                      <PolarRadiusAxis stroke="hsl(0, 0%, 30%)" tick={{ fill: "hsl(0, 0%, 50%)" }} />
                      <Radar
                        name="Engagement"
                        dataKey="A"
                        stroke="hsl(145, 60%, 45%)"
                        fill="hsl(145, 60%, 45%)"
                        fillOpacity={0.3}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 20%)",
                          borderRadius: "8px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rides" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Hourly Distribution */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Rides by Hour of Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                      <XAxis dataKey="hour" stroke="hsl(0, 0%, 50%)" fontSize={11} />
                      <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 20%)",
                          borderRadius: "8px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                      />
                      <Bar dataKey="rides" fill="hsl(145, 60%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekday Distribution */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Rides by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                      <XAxis dataKey="day" stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 20%)",
                          borderRadius: "8px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                      />
                      <Bar dataKey="rides" fill="hsl(220, 60%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Routes */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Most Popular Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routePopularity.map((route, index) => (
                  <div key={route.name} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{route.name}</p>
                        <p className="text-sm text-muted-foreground">{route.rides.toLocaleString()} rides</p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${route.percentage * 5}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {route.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* User Segments */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">User Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userSegments}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {userSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 20%)",
                          borderRadius: "8px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {userSegments.map((segment) => (
                    <div key={segment.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                        <span className="text-muted-foreground">{segment.name}</span>
                      </div>
                      <span className="font-medium">{segment.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card className="lg:col-span-2 border-border">
              <CardHeader>
                <CardTitle className="text-lg">User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyRidesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                      <XAxis dataKey="month" stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 20%)",
                          borderRadius: "8px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(145, 60%, 45%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(145, 60%, 45%)", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-6">
          {/* Sustainability Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card className="border-border bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Leaf className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">24,120 kg</p>
                    <p className="text-sm text-muted-foreground">Total CO2 Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-chart-2/10">
                    <Car className="h-8 w-8 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">48,240</p>
                    <p className="text-sm text-muted-foreground">Solo Car Trips Avoided</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-accent/10">
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">1,206</p>
                    <p className="text-sm text-muted-foreground">Trees Equivalent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sustainability Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Environmental Impact Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sustainabilityData}>
                    <defs>
                      <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                    <XAxis dataKey="month" stroke="hsl(0, 0%, 50%)" fontSize={12} />
                    <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 12%)",
                        border: "1px solid hsl(0, 0%, 20%)",
                        borderRadius: "8px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                      formatter={(value: number | string, name: string) => [
                        name === "co2Saved" ? `${value} kg` : `${value} trees`,
                        name === "co2Saved" ? "CO2 Saved" : "Trees Equivalent"
                      ] as [string, string]}
                    />
                    <Area
                      type="monotone"
                      dataKey="co2Saved"
                      stroke="hsl(145, 60%, 45%)"
                      strokeWidth={3}
                      fill="url(#co2Gradient)"
                      name="co2Saved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
