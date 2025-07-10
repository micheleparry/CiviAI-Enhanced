import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Dashboard from './components/EnhancedDashboard'
import ApplicationReview from './components/EnhancedApplicationReview'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/review/:id" element={<Layout><ApplicationReview /></Layout>} />
    </Routes>
  )
}

export default App 