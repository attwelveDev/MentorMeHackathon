import { Routes, Route, Link } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Profile from './pages/Profile'
import Analysis from './pages/Analysis'
import Plan from './pages/Plan'
import Dashboard from './pages/Dashboard'
import MarketUpdates from './pages/MarketUpdates'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4 text-sm">
          <Link to="/" className="font-bold text-slate-900">CareerCompass AU</Link>
          <Link to="/profile" className="text-slate-500 hover:text-slate-900">Profile</Link>
          <Link to="/plan" className="text-slate-500 hover:text-slate-900">Plan</Link>
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-900">Dashboard</Link>
          <Link to="/updates" className="text-slate-500 hover:text-slate-900">Updates</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/updates" element={<MarketUpdates />} />
      </Routes>
    </div>
  )
}
