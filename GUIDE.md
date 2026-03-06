# Admin Panel — Developer Guide

## Running the App

```bash
npm install      # first time only
npm run dev      # starts dev server at http://localhost:5173
npm run build    # production build → dist/
```

---

## Project Structure

```
src/
├── components/
│   ├── admin/                  # Layout and shared panel components
│   │   ├── admin-layout.tsx    # Page shell: sidebar + header + content area
│   │   ├── sidebar.tsx         # Left nav (links, active state, mobile menu)
│   │   ├── stats-card.tsx      # Metric card with icon, value, trend
│   │   └── data-table.tsx      # Generic table with column render functions
│   └── ui/                     # shadcn/ui primitives (button, card, dialog, etc.)
├── pages/
│   ├── Dashboard.tsx           # / — overview stats, charts, recent rides
│   ├── Rides.tsx               # /rides — ride list, filters, create dialog
│   ├── Students.tsx            # /students — student cards, detail sheet
│   ├── Analytics.tsx           # /analytics — recharts dashboards
│   ├── Rewards.tsx             # /rewards — points, transactions, leaderboard
│   └── Settings.tsx            # /settings — platform config tabs
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
├── App.tsx                     # BrowserRouter + all Routes
└── index.css                   # Tailwind v4 + theme CSS variables
```

### Adding a new page

1. Create `src/pages/MyPage.tsx`, wrapping content in `<AdminLayout>`:
   ```tsx
   import { AdminLayout } from "@/components/admin/admin-layout"

   export default function MyPage() {
     return (
       <AdminLayout title="My Page" description="Optional subtitle">
         {/* your content */}
       </AdminLayout>
     )
   }
   ```
2. Add a route in `src/App.tsx`:
   ```tsx
   <Route path="/my-page" element={<MyPage />} />
   ```
3. Add a nav entry in `src/components/admin/sidebar.tsx` under the `navigation` array.

---

## Firebase Integration

### 1. Install Firebase

```bash
npm install firebase
```

### 2. Create the Firebase config file

Create `src/lib/firebase.ts`:

```ts
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db  = getFirestore(app)
export const auth = getAuth(app)
```

Create `.env.local` in the project root (never commit this file):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Firestore data structure

```
/students/{studentId}
  name: string
  email: string
  phone: string
  studentId: string
  major: string
  year: "Freshman" | "Sophomore" | "Junior" | "Senior"
  avatar: string          // initials, e.g. "SC"
  status: "active" | "pending" | "suspended"
  verifiedDriver: boolean
  ridesAsDriver: number
  ridesAsPassenger: number
  totalPoints: number
  co2Saved: number
  rating: number
  joinedDate: Timestamp

/rides/{rideId}
  driverRef: DocumentReference   // → /students/{studentId}
  driverName: string             // denormalized for fast reads
  driverAvatar: string
  origin: string
  destination: string
  passengers: number
  maxPassengers: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  departureTime: Timestamp
  pointsAwarded: number
  createdAt: Timestamp
```

### 4. Fetching students (real-time)

Create `src/hooks/use-students.ts`:

```ts
import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  studentId: string
  major: string
  year: string
  avatar: string
  status: "active" | "pending" | "suspended"
  verifiedDriver: boolean
  ridesAsDriver: number
  ridesAsPassenger: number
  totalPoints: number
  co2Saved: number
  rating: number
  joinedDate: string
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("name"))
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student)))
      setLoading(false)
    })
    return unsub
  }, [])

  return { students, loading }
}
```

Use it in `src/pages/Students.tsx` — replace the static `studentsData` array:

```tsx
import { useStudents } from "@/hooks/use-students"

export default function StudentsPage() {
  const { students, loading } = useStudents()
  // replace `studentsData` with `students` throughout the component
  // show a loading state while loading === true
}
```

### 5. Fetching rides (real-time)

Create `src/hooks/use-rides.ts`:

```ts
import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Ride {
  id: string
  driverName: string
  driverAvatar: string
  origin: string
  destination: string
  passengers: number
  maxPassengers: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  departureTime: string
  pointsAwarded: number
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "rides"), orderBy("departureTime", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setRides(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ride)))
      setLoading(false)
    })
    return unsub
  }, [])

  return { rides, loading }
}
```

Use it in `src/pages/Rides.tsx` — replace `ridesData` with `rides` from the hook.

### 6. Writing data (create a ride)

```ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

async function createRide(data: Omit<Ride, "id">) {
  await addDoc(collection(db, "rides"), {
    ...data,
    createdAt: serverTimestamp(),
  })
}
```

Call `createRide(...)` in the "Create Ride" dialog's submit handler inside `src/pages/Rides.tsx`.

### 7. Updating a record (e.g. change ride status)

```ts
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

async function updateRideStatus(rideId: string, status: string) {
  await updateDoc(doc(db, "rides", rideId), { status })
}
```

Hook this into the `DropdownMenuItem` actions in the rides table's action column.

### 8. Firestore security rules (Firebase console → Firestore → Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated admins can read/write
    match /students/{id} {
      allow read, write: if request.auth != null;
    }
    match /rides/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For tighter rules, check a custom claim (e.g. `request.auth.token.admin == true`) set via Firebase Admin SDK.

---

## Environment Variables Reference

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase console → Project settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same |
| `VITE_FIREBASE_PROJECT_ID` | Same |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `VITE_FIREBASE_APP_ID` | Same |

All env vars must be prefixed with `VITE_` to be exposed to the browser by Vite.
