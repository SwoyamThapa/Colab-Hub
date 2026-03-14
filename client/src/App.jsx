import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DiscoveryFeed from './pages/DiscoveryFeed.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CreateRequest from './pages/CreateRequest.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workspace from './pages/Workspace.jsx'
import Navbar from './components/Navbar.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/feed" element={<DiscoveryFeed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-request" element={<CreateRequest />} />
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route path="/workspace/:id" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  )
}