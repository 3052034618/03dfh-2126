import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import ActivityDetail from '@/pages/ActivityDetail'
import CreateActivity from '@/pages/CreateActivity'
import CarOffer from '@/pages/CarOffer'
import FleetGroup from '@/pages/FleetGroup'
import CheckIn from '@/pages/CheckIn'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activity/:id" element={<ActivityDetail />} />
        <Route path="/create" element={<CreateActivity />} />
        <Route path="/car-offer/:activityId" element={<CarOffer />} />
        <Route path="/fleet/:activityId" element={<FleetGroup />} />
        <Route path="/checkin/:activityId" element={<CheckIn />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}
