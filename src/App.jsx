import { Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Profile from './pages/Profile'
import Analysis from './pages/Analysis'
import Roadmap from './pages/Roadmap'
import Diary from './pages/Diary'
import MarketUpdates from './pages/MarketUpdates'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import { AuthProvider } from './lib/auth'
import GuestPlanMigrator from './components/GuestPlanMigrator'

export default function App() {
  return (
    <AuthProvider>
      <GuestPlanMigrator />
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/plan" element={<Roadmap />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/updates" element={<MarketUpdates />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
