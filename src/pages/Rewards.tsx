
import { useEffect, useMemo, useState } from "react"
import { getDocs, onSnapshot, orderBy, query, limit as fsLimit } from "firebase/firestore"
import { usersCol, transactionsCol } from "@/lib/firestore/collections"
import { getAllRewards, createReward, grantBonusPoints } from "@/lib/firestore/services/rewards"
import { getStudentByPhone } from "@/lib/firestore/services/users"
import type { RewardDocument, RewardCategory } from "@/lib/firestore/types"
import { toast } from "sonner"
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

const categoryIconMap: Record<RewardCategory, typeof Coffee> = {
  food: Coffee,
  store: ShoppingBag,
  events: Ticket,
  parking: Zap,
}

const categoryLabelMap: Record<RewardCategory, string> = {
  food: "Food & Drinks",
  store: "Campus Store",
  events: "Events",
  parking: "Parking",
}

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

type Transaction = {
  id: string
  student: { name: string; avatar: string }
  type: string
  amount: number
  description: string
  category: string
}

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
]

export default function RewardsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isAddRewardDialogOpen, setIsAddRewardDialogOpen] = useState(false)
  const [isGrantPointsDialogOpen, setIsGrantPointsDialogOpen] = useState(false)

  // Grant Points form state
  const [grantPhone, setGrantPhone] = useState("")
  const [grantAmount, setGrantAmount] = useState("")
  const [grantReason, setGrantReason] = useState("")
  const [isGrantingPoints, setIsGrantingPoints] = useState(false)

  async function handleGrantPoints() {
    const amount = Number(grantAmount)
    if (!grantPhone || !grantReason || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a phone number, positive amount, and reason")
      return
    }
    setIsGrantingPoints(true)
    try {
      const student = await getStudentByPhone(grantPhone.trim())
      if (!student) {
        toast.error(`No student found with phone ${grantPhone}`)
        return
      }
      await grantBonusPoints(student.id, amount, grantReason)
      toast.success(`Granted ${amount} points to ${student.name || student.id}`)
      setGrantPhone("")
      setGrantAmount("")
      setGrantReason("")
      setIsGrantPointsDialogOpen(false)
    } catch (err) {
      toast.error(`Failed to grant points: ${(err as Error).message}`)
    } finally {
      setIsGrantingPoints(false)
    }
  }

  // Add Reward form state
  const [newRewardName, setNewRewardName] = useState("")
  const [newRewardPoints, setNewRewardPoints] = useState("")
  const [newRewardStock, setNewRewardStock] = useState("")
  const [newRewardCategory, setNewRewardCategory] = useState<RewardCategory | "">("")
  const [isCreatingReward, setIsCreatingReward] = useState(false)

  async function handleCreateReward() {
    if (!newRewardName || !newRewardPoints || !newRewardStock || !newRewardCategory) return
    setIsCreatingReward(true)
    try {
      await createReward({
        name: newRewardName,
        pointsRequired: Number(newRewardPoints),
        stock: Number(newRewardStock),
        category: newRewardCategory as RewardCategory,
      })
      const updated = await getAllRewards()
      setRewards(updated)
      setNewRewardName("")
      setNewRewardPoints("")
      setNewRewardStock("")
      setNewRewardCategory("")
      setIsAddRewardDialogOpen(false)
    } finally {
      setIsCreatingReward(false)
    }
  }

  const [users, setUsers] = useState<any[]>([])

    useEffect(() => {
      async function fetchUsers() {
        const snap = await getDocs(usersCol)

        const data = snap.docs.map((doc) => doc.data())

        setUsers(data)
      }

      fetchUsers()
    }, [])

  const [rewards, setRewards] = useState<RewardDocument[]>([])

  useEffect(() => {
    getAllRewards().then(setRewards)
  }, [])

  type RawTransaction = {
    id: string
    userId: string
    type: string
    amount: number
    description: string
    category: string
    createdAt: number
  }
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>([])

  useEffect(() => {
    const q = query(transactionsCol, orderBy("created-at", "desc"), fsLimit(100))
    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log(`[transactions] snapshot: ${snap.docs.length} docs, fromCache=${snap.metadata.fromCache}, hasPendingWrites=${snap.metadata.hasPendingWrites}`)
        snap.docs.forEach((doc) => {
          const d = doc.data()
          console.log(`[transactions] ${doc.id}`, {
            type: d.type,
            userId: d["user-id"],
            amount: d.amount,
            createdAt: d["created-at"],
          })
        })
        setRawTransactions(
          snap.docs.map((doc) => {
            const d = doc.data()
            return {
              id: doc.id,
              userId: d["user-id"] ?? "",
              type: d.type ?? "earned",
              amount: d.amount ?? 0,
              description: d.description ?? "",
              category: d.category ?? "",
              createdAt: d["created-at"]?.toMillis?.() ?? 0,
            }
          })
        )
      },
      (err) => console.error("[transactions] subscribe error:", err)
    )
    return unsub
  }, [])

  // Join transactions with users to resolve names + initials for the table.
  const transactions = useMemo(() => {
    const usersById = new Map<string, any>(users.map((u) => [u.id, u]))
    return rawTransactions.map((txn) => {
      const user = usersById.get(txn.userId)
      const name = user?.name ?? txn.userId
      const avatar = (name || "?")
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
      return {
        id: txn.id,
        student: { name, avatar },
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        category: txn.category,
      }
    })
  }, [rawTransactions, users])
  /* 
  const filteredTransactions = recentTransactions.filter((txn) => {
    const matchesSearch =
      txn.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === "all" || txn.type === typeFilter
    
    return matchesSearch && matchesType
  })
    */
  const leaderboardData = users
    .sort((a, b) => (b["total-points"] ?? 0) - (a["total-points"] ?? 0))
    .slice(0, 5)
    .map((user, index) => ({
      rank: index + 1,
      name: user.name,
      avatar: user.name
        ?.split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      points: user["total-points"] ?? 0,
      rides: (user["rides-as-driver"] ?? 0) + (user["rides-as-passenger"] ?? 0),
    }))

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
                  <Label htmlFor="studentPhone">Student Phone Number</Label>
                  <Input
                    id="studentPhone"
                    type="tel"
                    placeholder="+15551234567"
                    value={grantPhone}
                    onChange={(e) => setGrantPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the full E.164 number (e.g. +1 country code).
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points">Points Amount</Label>
                  <Input
                    id="points"
                    type="number"
                    placeholder="100"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Contest winner, Referral bonus"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGrantPointsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGrantPoints} disabled={isGrantingPoints}>
                  {isGrantingPoints ? "Granting..." : "Grant Points"}
                </Button>
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
                  <Input
                    id="rewardName"
                    placeholder="e.g., Campus Store $10 Gift Card"
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rewardPoints">Points Required</Label>
                    <Input
                      id="rewardPoints"
                      type="number"
                      placeholder="500"
                      value={newRewardPoints}
                      onChange={(e) => setNewRewardPoints(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="100"
                      value={newRewardStock}
                      onChange={(e) => setNewRewardStock(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newRewardCategory}
                    onValueChange={(v) => setNewRewardCategory(v as RewardCategory)}
                  >
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
                <Button onClick={handleCreateReward} disabled={isCreatingReward}>
                  {isCreatingReward ? "Adding..." : "Add Reward"}
                </Button>
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
          value={String(rewards.filter((r) => r["is-active"]).length)}
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
              <DataTable columns={transactionColumns} data={transactions.slice(0, 5)} />
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
                  {transactions.length} transactions found
                </p>
              </div>
            </CardContent>
          </Card>

          <DataTable columns={transactionColumns} data={transactions} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {rewards.map((reward) => {
              const Icon = categoryIconMap[reward.category] ?? Gift
              const label = categoryLabelMap[reward.category] ?? reward.category
              const stock = reward.stock ?? 0
              const stockPct = Math.min(100, (stock / Math.max(1, stock + (reward["total-redemptions"] ?? 0))) * 100)
              return (
                <Card key={reward.id} className="border-border">
                  <CardContent className="p-6">

                  {/* Top row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="bg-secondary">
                      {label}
                    </Badge>
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-foreground mb-2">
                    {reward.name ?? "No Name"}
                  </h3>

                  {/* Points */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-primary">
                      {reward["points-required"] ?? 0}
                    </span>
                    <span className="text-muted-foreground">points</span>
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock</span>
                      <span className="font-medium">
                        {stock} left
                      </span>
                    </div>
                    <Progress
                      value={stockPct}
                      className="h-1.5"
                    />
                  </div>

                  {/* Redemptions */}
                  <p className="text-xs text-muted-foreground mt-3">
                    {reward["total-redemptions"] ?? 0} total redemptions
                  </p>

                </CardContent>
              </Card>
            )
          })}
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
                {leaderboardData.map((user) => (
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
