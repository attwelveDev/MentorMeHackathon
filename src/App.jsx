import { Routes, Route, Link } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Profile from './pages/Profile'
import Analysis from './pages/Analysis'
import Roadmap from './pages/Roadmap'
import MarketUpdates from './pages/MarketUpdates'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './lib/auth'

function AuthNav() {
  const { user, signOut } = useAuth()
  return user ? (
    <button onClick={signOut} className="text-slate-500 hover:text-slate-900">Sign out</button>
  ) : (
    <>
      <Link to="/signup" className="text-slate-500 hover:text-slate-900">Sign up</Link>
      <Link to="/login" className="text-slate-500 hover:text-slate-900">Log in</Link>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-4 text-sm">
            <Link to="/" className="font-bold text-slate-900">CareerCompass AU</Link>
            <Link to="/profile" className="text-slate-500 hover:text-slate-900">Profile</Link>
            <Link to="/plan" className="text-slate-500 hover:text-slate-900">Plan</Link>
            <Link to="/updates" className="text-slate-500 hover:text-slate-900">Updates</Link>
            <AuthNav />
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/plan" element={<Roadmap />} />
          <Route path="/updates" element={<MarketUpdates />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
