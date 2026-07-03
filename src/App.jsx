import { Routes, Route } from 'react-router-dom'
import { SettingsProvider } from './lib/SettingsContext.jsx'
import AuthGate from './components/AuthGate.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Guests from './pages/Guests.jsx'
import Checklist from './pages/Checklist.jsx'
import Vendors from './pages/Vendors.jsx'
import Budget from './pages/Budget.jsx'
import DayTimeline from './pages/DayTimeline.jsx'
import Seating from './pages/Seating.jsx'
import Gifts from './pages/Gifts.jsx'
import Moodboard from './pages/Moodboard.jsx'
import Documents from './pages/Documents.jsx'
import Settings from './pages/Settings.jsx'
import PublicRsvp from './pages/PublicRsvp.jsx'
import PublicShare from './pages/PublicShare.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/rsvp/:token" element={<PublicRsvp />} />
      <Route path="/share/:token" element={<PublicShare />} />
      <Route
        path="/*"
        element={
          <AuthGate>
            <SettingsProvider>
              <Layout>
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
              </Layout>
            </SettingsProvider>
          </AuthGate>
        }
      />
    </Routes>
  )
}
