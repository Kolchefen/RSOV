import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Rides from './pages/Rides'
import Students from './pages/Students'
import Analytics from './pages/Analytics'
import Rewards from './pages/Rewards'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/students" element={<Students />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
