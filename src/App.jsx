import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SettingsProvider } from './lib/SettingsContext.jsx'
import AuthGate from './components/AuthGate.jsx'
import Layout from './components/Layout.jsx'
import NotFound from './pages/NotFound.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Guests = lazy(() => import('./pages/Guests.jsx'))
const Checklist = lazy(() => import('./pages/Checklist.jsx'))
const Vendors = lazy(() => import('./pages/Vendors.jsx'))
const Budget = lazy(() => import('./pages/Budget.jsx'))
const DayTimeline = lazy(() => import('./pages/DayTimeline.jsx'))
const Seating = lazy(() => import('./pages/Seating.jsx'))
const Gifts = lazy(() => import('./pages/Gifts.jsx'))
const Moodboard = lazy(() => import('./pages/Moodboard.jsx'))
const Documents = lazy(() => import('./pages/Documents.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const PublicRsvp = lazy(() => import('./pages/PublicRsvp.jsx'))
const PublicShare = lazy(() => import('./pages/PublicShare.jsx'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/rsvp/:token" element={<PublicRsvp />} />
        <Route path="/share/:token" element={<PublicShare />} />
        <Route
          path="/*"
          element={
            <AuthGate>
              <SettingsProvider>
                <Layout>
                  <Suspense fallback={null}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/convidados" element={<Guests />} />
                      <Route path="/checklist" element={<Checklist />} />
                      <Route path="/fornecedores" element={<Vendors />} />
                      <Route path="/orcamento" element={<Budget />} />
                      <Route path="/cronograma" element={<DayTimeline />} />
                      <Route path="/mesas" element={<Seating />} />
                      <Route path="/presentes" element={<Gifts />} />
                      <Route path="/mural" element={<Moodboard />} />
                      <Route path="/documentos" element={<Documents />} />
                      <Route path="/configuracoes" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </SettingsProvider>
            </AuthGate>
          }
        />
      </Routes>
    </Suspense>
  )
}
