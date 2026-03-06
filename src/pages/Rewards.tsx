

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DataTable } from "@/components/admin/data-table"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Gift,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Trophy,
  Zap,
  Coffee,
  ShoppingBag,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const pointsDistributionData = [
  { name: "Mon", earned: 4200, redeemed: 1800 },
  { name: "Tue", earned: 3800, redeemed: 2200 },
  { name: "Wed", earned: 5100, redeemed: 1500 },
  { name: "Thu", earned: 4600, redeemed: 2800 },
  { name: "Fri", earned: 6200, redeemed: 3200 },
  { name: "Sat", earned: 3200, redeemed: 2100 },
  { name: "Sun", earned: 2800, redeemed: 1400 },
]

const redemptionCategories = [
  { name: "Food & Drinks", value: 35, color: "hsl(145, 60%, 45%)" },
  { name: "Campus Store", value: 28, color: "hsl(220, 60%, 50%)" },
  { name: "Events", value: 22, color: "hsl(45, 80%, 55%)" },
  { name: "Parking", value: 15, color: "hsl(35, 70%, 50%)" },
]

const recentTransactions = [
  {
    id: "TXN-001",
    student: { name: "Sarah Chen", avatar: "SC" },
    type: "earned",
    amount: 45,
    description: "Completed ride: North Campus → Downtown",
    timestamp: "2024-03-15 10:30 AM",
    category: "ride",
  },
  {
    id: "TXN-002",
    student: { name: "Mike Johnson", avatar: "MJ" },
    type: "redeemed",
    amount: 500,
    description: "Campus Store: UniRide T-Shirt",
    timestamp: "2024-03-15 10:15 AM",
    category: "store",
  },
  {
    id: "TXN-003",
    student: { name: "Emily Davis", avatar: "ED" },
    type: "earned",
    amount: 30,
    description: "Completed ride as passenger",
    timestamp: "2024-03-15 09:45 AM",
    category: "ride",
  },
  {
    id: "TXN-004",
    student: { name: "James Wilson", avatar: "JW" },
    type: "bonus",
    amount: 100,
    description: "Weekly streak bonus (5 rides)",
    timestamp: "2024-03-15 09:00 AM",
    category: "bonus",
  },
  {
    id: "TXN-005",
    student: { name: "Lisa Park", avatar: "LP" },
    type: "redeemed",
    amount: 250,
    description: "Campus Cafe: $5 Gift Card",
    timestamp: "2024-03-15 08:30 AM",
    category: "food",
  },
  {
    id: "TXN-006",
    student: { name: "David Kim", avatar: "DK" },
    type: "earned",
    amount: 60,
    description: "Completed ride with full car (4 passengers)",
    timestamp: "2024-03-14 06:00 PM",
    category: "ride",
  },
]

const rewards = [
  {
    id: "RWD-001",
    name: "Campus Cafe $5 Gift Card",
    points: 250,
    category: "food",
    stock: 145,
    redemptions: 234,
    icon: Coffee,
  },
  {
    id: "RWD-002",
    name: "UniRide T-Shirt",
    points: 500,
    category: "store",
    stock: 78,
    redemptions: 156,
    icon: ShoppingBag,
  },
  {
    id: "RWD-003",
    name: "Football Game Ticket",
    points: 1000,
    category: "events",
    stock: 50,
    redemptions: 89,
    icon: Ticket,
  },
  {
    id: "RWD-004",
    name: "Free Week Parking Pass",
    points: 750,
    category: "parking",
    stock: 25,
    redemptions: 67,
    icon: Zap,
  },
]

const leaderboard = [
  { rank: 1, name: "Sarah Chen", avatar: "SC", points: 4680, rides: 156 },
  { rank: 2, name: "Mike Johnson", avatar: "MJ", points: 4260, rides: 142 },
  { rank: 3, name: "Emily Davis", avatar: "ED", points: 3840, rides: 128 },
  { rank: 4, name: "James Wilson", avatar: "JW", points: 3450, rides: 115 },
  { rank: 5, name: "Anna Martinez", avatar: "AM", points: 2840, rides: 76 },
]

type Transaction = typeof recentTransactions[0]

const transactionColumns = [
  {
    key: "student",
    label: "Student",
    render: (_: unknown, row: Transaction) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {row.student.avatar}
          </AvatarFallback>
        </Avatar>
        <span className="text-foreground font-medium">{row.student.name}</span>
      </div>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (value: unknown) => {
      const type = value as string
      const variants: Record<string, { label: string; className: string; icon: typeof ArrowUpRight }> = {
        earned: { label: "Earned", className: "bg-success/10 text-success border-success/20", icon: ArrowUpRight },
        redeemed: { label: "Redeemed", className: "bg-chart-2/10 text-chart-2 border-chart-2/20", icon: ArrowDownRight },
        bonus: { label: "Bonus", className: "bg-accent/10 text-accent border-accent/20", icon: Zap },
      }
      const variant = variants[type] || variants.earned
      const Icon = variant.icon
      return (
        <Badge variant="outline" className={`${variant.className} gap-1`}>
          <Icon className="h-3 w-3" />
          {variant.label}
        </Badge>
      )
    },
  },
  {
    key: "amount",
    label: "Points",
    render: (value: unknown, row: Transaction) => (
      <span className={`font-semibold ${row.type === "redeemed" ? "text-chart-2" : "text-success"}`}>
        {row.type === "redeemed" ? "-" : "+"}{String(value)}
      </span>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (value: unknown) => (
      <span className="text-muted-foreground">{String(value)}</span>
    ),
  },
  {
    key: "timestamp",
    label: "Time",
    render: (value: unknown) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        {String(value)}
      </div>
    ),
  },
]

export default function RewardsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isAddRewardDialogOpen, setIsAddRewardDialogOpen] = useState(false)
  const [isGrantPointsDialogOpen, setIsGrantPointsDialogOpen] = useState(false)

  const filteredTransactions = recentTransactions.filter((txn) => {
    const matchesSearch =
      txn.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === "all" || txn.type === typeFilter
    
    return matchesSearch && matchesType
  })

  return (
    <AdminLayout
      title="Reward Points"
      description="Track points distribution and manage rewards"
      actions={
        <div className="flex gap-3">
          <Dialog open={isGrantPointsDialogOpen} onOpenChange={setIsGrantPointsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Gift className="mr-2 h-4 w-4" />
                Grant Points
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Bonus Points</DialogTitle>
                <DialogDescription>
                  Award bonus points to a student manually.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="studentEmail">Student Email</Label>
                  <Input id="studentEmail" placeholder="student@university.edu" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points">Points Amount</Label>
                  <Input id="points" type="number" placeholder="100" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" placeholder="e.g., Contest winner, Referral bonus" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGrantPointsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsGrantPointsDialogOpen(false)}>Grant Points</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddRewardDialogOpen} onOpenChange={setIsAddRewardDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Reward</DialogTitle>
                <DialogDescription>
                  Create a new reward that students can redeem.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="rewardName">Reward Name</Label>
                  <Input id="rewardName" placeholder="e.g., Campus Store $10 Gift Card" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rewardPoints">Points Required</Label>
                    <Input id="rewardPoints" type="number" placeholder="500" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" placeholder="100" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Drinks</SelectItem>
                      <SelectItem value="store">Campus Store</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRewardDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddRewardDialogOpen(false)}>Add Reward</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatsCard
          title="Total Points Earned"
          value="124.5K"
          change="+18.3%"
          trend="up"
          icon={Gift}
        />
        <StatsCard
          title="Points Redeemed"
          value="45.2K"
          change="+12.1%"
          trend="up"
          icon={ShoppingBag}
          iconColor="bg-chart-2/10 text-chart-2"
        />
        <StatsCard
          title="Active Rewards"
          value="24"
          icon={Trophy}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Avg Points/Student"
          value="1,284"
          change="+5.2%"
          trend="up"
          icon={TrendingUp}
          iconColor="bg-chart-4/10 text-chart-4"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Points Distribution (This Week)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pointsDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                      <XAxis dataKey="name" stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 20%)",
                          borderRadius: "8px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                      />
                      <Bar dataKey="earned" fill="hsl(145, 60%, 45%)" radius={[4, 4, 0, 0]} name="Earned" />
                      <Bar dataKey="redeemed" fill="hsl(220, 60%, 50%)" radius={[4, 4, 0, 0]} name="Redeemed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Redemption Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={redemptionCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {redemptionCategories.map((entry, index) => (
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
                  {redemptionCategories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-muted-foreground">{category.name}</span>
                      </div>
                      <span className="font-medium">{category.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Preview */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Badge variant="secondary">Live</Badge>
            </CardHeader>
            <CardContent>
              <DataTable columns={transactionColumns} data={recentTransactions.slice(0, 5)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="earned">Earned</SelectItem>
                      <SelectItem value="redeemed">Redeemed</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {filteredTransactions.length} transactions found
                </p>
              </div>
            </CardContent>
          </Card>

          <DataTable columns={transactionColumns} data={filteredTransactions} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <reward.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="bg-secondary">
                      {reward.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{reward.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">{reward.points}</span>
                    <span className="text-muted-foreground">points</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock</span>
                      <span className="font-medium">{reward.stock} left</span>
                    </div>
                    <Progress value={(reward.stock / 150) * 100} className="h-1.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {reward.redemptions} total redemptions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Top Earners This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      user.rank === 1 ? "bg-accent/10 border border-accent/20" :
                      user.rank === 2 ? "bg-chart-2/10 border border-chart-2/20" :
                      user.rank === 3 ? "bg-chart-4/10 border border-chart-4/20" :
                      "bg-secondary"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      user.rank === 1 ? "bg-accent text-accent-foreground" :
                      user.rank === 2 ? "bg-chart-2 text-foreground" :
                      user.rank === 3 ? "bg-chart-4 text-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {user.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.rides} rides completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">{user.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
