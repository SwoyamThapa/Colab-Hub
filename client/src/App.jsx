import { Routes, Route } from 'react-router-dom'
import DiscoveryFeed from './pages/DiscoveryFeed.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx' 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DiscoveryFeed />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}