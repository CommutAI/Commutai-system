import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@commutai/auth'
import Login from './pages/Login'

// Operator pages
import Dashboard from './pages/operator/Dashboard'
import LiveOperations from './pages/operator/LiveOperations'
import Buses from './pages/operator/Buses'
import AIMonitoring from './pages/operator/AIMonitoring'
import Transactions from './pages/operator/Transactions'
import Baggage from './pages/operator/Baggage'
import Revenue from './pages/operator/Revenue'
import Announcements from './pages/operator/Announcements'
import Reports from './pages/operator/Reports'


// Customer Service pages
import QRCards from './pages/customer-service/QRCards'
import ReloadCard from './pages/customer-service/ReloadCard'
import TemporaryQRCards from './pages/customer-service/TemporaryQRCards'
import PassengerList from './pages/customer-service/PassengerList'
import CSDashboard from './pages/customer-service/Dashboard'
import CSReports from './pages/customer-service/Reports'
import CSTransactions from './pages/customer-service/Transactions'

// Sys Admin pages
import TripManagement from './pages/sys-admin/TripManagement'
import PassengerAnalytics from './pages/sys-admin/PassengerAnalytics'
import SysReports from './pages/sys-admin/Reports'
import ManageUsers from './pages/sys-admin/ManageUsers'
import Settings from './pages/sys-admin/Settings'
import AuditLogs from './pages/sys-admin/AuditLogs'
import FareMatrix from './pages/sys-admin/FareMatrix'
import CardManagement from './pages/sys-admin/CardManagement'
import SysDashboard from './pages/sys-admin/Dashboard'

// Driver pages
import DriverLogin from './pages/driver/Login'
import DriverDashboard from './pages/driver/Dashboard'
import DriverCurrentTrip from './pages/driver/CurrentTrip'
import DriverNavigation from './pages/driver/DriverNavigation'
import DriverGPSMonitoring from './pages/driver/GPSMonitoring'
import DriverPassengerOccupancy from './pages/driver/PassengerOccupancy'
import DriverIncidentReporting from './pages/driver/IncidentReporting'
import DriverAnnouncements from './pages/driver/Announcements'
import DriverNotifications from './pages/driver/Notifications'
import DriverProfile from './pages/driver/DriverProfile'
import DriverTripHistory from './pages/driver/TripHistory'
import OrganicMapsIntegration from './pages/driver/OrganicMapsIntegration'

// Layouts
import OperatorLayout from './layouts/OperatorLayout'
import CustomerServiceLayout from './layouts/CustomerServiceLayout'
import SysAdminLayout from './layouts/SysAdminLayout'
import DriverLayout from './layouts/DriverLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/driver/login" element={<DriverLogin />} />
      
      {/* Operator Routes */}
      <Route
        path="/operator"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="live-operations" element={<LiveOperations />} />
        <Route path="buses" element={<Buses />} />
        <Route path="ai-monitoring" element={<AIMonitoring />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="baggage" element={<Baggage />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Customer Service Routes */}
      <Route
        path="/customer-service"
        element={
          <ProtectedRoute allowedRoles={['cs_desk', 'admin']}>
            <CustomerServiceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CSDashboard />} />
        <Route path="qr-cards" element={<QRCards />} />
        <Route path="temporary-qr-cards" element={<TemporaryQRCards />} />
        <Route path="reload-card" element={<ReloadCard />} />
        <Route path="passengers" element={<PassengerList />} />
        <Route path="transactions" element={<CSTransactions />} />
        <Route path="reports" element={<CSReports />} />
      </Route>

      {/* Sys Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SysAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SysDashboard />} />
        <Route path="trips" element={<TripManagement />} />
        <Route path="buses" element={<Navigate to="/admin/trips" replace />} />
        <Route path="analytics" element={<PassengerAnalytics />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="fare-matrix" element={<FareMatrix />} />
        <Route path="card-management" element={<CardManagement />} />
        <Route path="reports" element={<SysReports />} />
      </Route>

      {/* Driver Routes */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DriverDashboard />} />
        <Route path="dashboard" element={<DriverDashboard />} />
        <Route path="current-trip" element={<DriverCurrentTrip />} />
        <Route path="navigation" element={<DriverNavigation />} />
        <Route path="gps" element={<DriverGPSMonitoring />} />
        <Route path="occupancy" element={<DriverPassengerOccupancy />} />
        <Route path="incident-reporting" element={<DriverIncidentReporting />} />
        <Route path="announcements" element={<DriverAnnouncements />} />
        <Route path="notifications" element={<DriverNotifications />} />
        <Route path="profile" element={<DriverProfile />} />
        <Route path="trip-history" element={<DriverTripHistory />} />
        <Route path="organic-maps" element={<OrganicMapsIntegration />} />
      </Route>

      {/* Default redirect based on role */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
