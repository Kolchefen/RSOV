

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { updateStudentAdminFields } from "@/lib/firestore/services/users"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Car,
  Gift,
  Star,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Leaf,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAllStudents, deleteStudent } from "@/lib/firestore/services/users"
import type { StudentViewModel } from "@/lib/firestore/types"

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentViewModel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentViewModel | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StudentViewModel>>({});
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  
  const [formValues, setFormValues] = useState({
  firstName: "",
  lastName: "",
  email: "",
  studentId: "",
  major: "",
  year: "Freshman",
  phone: ""
  });

  // Helper to update state as you type
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormValues({ ...formValues, [e.target.id]: e.target.value });
  };

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch((err) => console.error("Failed to fetch students:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleViewClick = (student: StudentViewModel) => {
  setSelectedStudent(student);
  setIsViewSheetOpen(true);
};

  // Function to open the Edit Dialog with existing data
  const handleEditClick = (student: StudentViewModel) => {
    setSelectedStudent(student);
    setEditForm({
      studentId: student.studentId,
      major: student.major,
      year: student.year,
      verifiedDriver: student.verifiedDriver,
      status: student.status
    });
    setIsEditDialogOpen(true);
    setIsViewSheetOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      await updateStudentAdminFields(selectedStudent.id, {
        "student-id": editForm.studentId,
        "major": editForm.major,
        "year": editForm.year as any,
        "verified-driver": editForm.verifiedDriver,
      });

      // Directly update the local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { ...s, ...editForm } 
          : s
      ));
      
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      setEditForm({}); // Clear edit form
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      setLoading(true);
      const newUid = formValues.email.replace(".", "_"); 

      await updateStudentAdminFields(newUid, {
        "email": formValues.email,
        "student-id": formValues.studentId,
        "major": formValues.major,
        "year": formValues.year as any,
        "verified-driver": false,
        "total-points": 0,
      });

      // Refresh list and close
      const updated = await getAllStudents();
      setStudents(updated);
      setIsAddDialogOpen(false);
      
      // Reset form
      setFormValues({
        firstName: "", lastName: "", email: "", 
        studentId: "", major: "", year: "Freshman", phone: ""
      });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.includes(searchQuery) ||
      student.major.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    const matchesYear = yearFilter === "all" || student.year === yearFilter

    return matchesSearch && matchesStatus && matchesYear
  })

  return (
    <AdminLayout
      title="Student Profiles"
      description="Manage student accounts and driver verification"
      actions={
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Register a new student to the carpooling platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formValues.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formValues.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@university.edu"
                  value={formValues.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="12345678"
                  value={formValues.studentId}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    value={formValues.major}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={formValues.year} onValueChange={(value) => setFormValues({...formValues, year: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Freshman">Freshman</SelectItem>
                      <SelectItem value="Sophomore">Sophomore</SelectItem>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formValues.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent} disabled={loading}>
                {loading ? "Saving..." : "Add Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatsCard
          title="Total Students"
          value={students.length.toLocaleString()}
          icon={Users}
        />
        <StatsCard
          title="Verified Drivers"
          value={students.filter((s) => s.verifiedDriver).length.toLocaleString()}
          icon={Car}
          iconColor="bg-chart-2/10 text-chart-2"
        />
        <StatsCard
          title="Avg Rating"
          value={
            students.filter((s) => s.rating > 0).length > 0
              ? (students.filter((s) => s.rating > 0).reduce((sum, s) => sum + s.rating, 0) /
                  students.filter((s) => s.rating > 0).length).toFixed(2)
              : "0"
          }
          icon={Star}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Pending Verification"
          value={students.filter((s) => s.status === "pending").length.toLocaleString()}
          icon={CheckCircle}
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
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="Freshman">Freshman</SelectItem>
                  <SelectItem value="Sophomore">Sophomore</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredStudents.length} students found
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading students...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No students found.
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Map each student in the DB with a card */}
        {filteredStudents.map((student) => (
          <Card key={student.id} className="border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {student.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{student.name}</h3>
                      {student.verifiedDriver && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Driver
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{student.major}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewClick(student)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(student)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => {
                        setTimeout(() => {
                          if (confirm(`Delete ${student.name}'s account? This cannot be undone.`)) {
                            deleteStudent(student.id)
                              .then(() => setStudents((prev) => prev.filter((s) => s.id !== student.id)))
                              .catch((err) => console.error("Failed to delete student:", err))
                          }
                        })
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{student.year} - ID: {student.studentId}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{student.ridesAsDriver + student.ridesAsPassenger}</p>
                  <p className="text-xs text-muted-foreground">Total Rides</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">{student.totalPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-accent fill-accent" />
                    <p className="text-lg font-semibold text-foreground">{student.rating > 0 ? student.rating : "-"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Badge
                  variant="outline"
                  className={
                    student.status === "active"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : student.status === "pending"
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedStudent(null);
            setEditForm({});
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-studentId">Student ID</Label>
              <Input 
                id="edit-studentId" 
                value={editForm.studentId || ""} 
                onChange={(e) => setEditForm({...editForm, studentId: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-major">Major</Label>
              <Input 
                id="edit-major" 
                value={editForm.major || ""} 
                onChange={(e) => setEditForm({...editForm, major: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-year">Year</Label>
              <Select value={editForm.year || ""} onValueChange={(value) => setEditForm({...editForm, year: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Freshman">Freshman</SelectItem>
                  <SelectItem value="Sophomore">Sophomore</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="edit-verifiedDriver" 
                checked={editForm.verifiedDriver || false}
                onChange={(e) => setEditForm({...editForm, verifiedDriver: e.target.checked})}
              />
              <Label htmlFor="edit-verifiedDriver">Verified Driver</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Detail Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedStudent && (
            <>
              <SheetHeader>
                <SheetTitle>Student Profile</SheetTitle>
                <SheetDescription>
                  Detailed information about {selectedStudent.name}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedStudent.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{selectedStudent.name}</h2>
                      {selectedStudent.verifiedDriver && (
                        <Badge className="bg-primary text-primary-foreground">Verified Driver</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{selectedStudent.major} - {selectedStudent.year}</p>
                  </div>
                </div>

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                    <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm">{selectedStudent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm">{selectedStudent.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Joined</p>
                          <p className="text-sm">{selectedStudent.joinedDate ? new Date(selectedStudent.joinedDate).toLocaleDateString() : "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="stats" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{selectedStudent.ridesAsDriver}</p>
                          <p className="text-xs text-muted-foreground">Rides as Driver</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Users className="h-8 w-8 mx-auto mb-2 text-chart-2" />
                          <p className="text-2xl font-bold">{selectedStudent.ridesAsPassenger}</p>
                          <p className="text-xs text-muted-foreground">Rides as Passenger</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Gift className="h-8 w-8 mx-auto mb-2 text-accent" />
                          <p className="text-2xl font-bold text-primary">{selectedStudent.totalPoints.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Points</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Leaf className="h-8 w-8 mx-auto mb-2 text-chart-4" />
                          <p className="text-2xl font-bold">{selectedStudent.co2Saved} kg</p>
                          <p className="text-xs text-muted-foreground">CO2 Saved</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <div className="space-y-4">
                      {[
                        { action: "Completed ride to Downtown", time: "2 hours ago", type: "ride" },
                        { action: "Earned 45 points", time: "2 hours ago", type: "points" },
                        { action: "Updated profile info", time: "1 day ago", type: "profile" },
                        { action: "Completed ride to Campus", time: "2 days ago", type: "ride" },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                          <div className={`p-2 rounded-full ${activity.type === "ride" ? "bg-primary/10" :
                              activity.type === "points" ? "bg-accent/10" : "bg-chart-2/10"
                            }`}>
                            {activity.type === "ride" ? <Car className="h-4 w-4 text-primary" /> :
                              activity.type === "points" ? <Gift className="h-4 w-4 text-accent" /> :
                                <Edit className="h-4 w-4 text-chart-2" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
