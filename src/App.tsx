import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/common/ProtectedRoute.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { QuestionnairePage } from './pages/QuestionnairePage.tsx'
import { ThankYouPage } from './pages/ThankYouPage.tsx'

const PostAppointmentPage = lazy(() => import('./pages/PostAppointmentPage.tsx'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.tsx').then((mod) => ({ default: mod.AdminLoginPage })))
const AdminLeadsPage = lazy(() => import('./pages/AdminLeadsPage.tsx').then((mod) => ({ default: mod.AdminLeadsPage })))

function PageFallback() {
  return <p className="px-6 py-10 text-sm text-[#6b7280]">Cargando…</p>
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cuestionario" element={<QuestionnairePage />} />
        <Route path="/gracias" element={<ThankYouPage />} />
        <Route path="/post-agenda" element={<PostAppointmentPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/leads"
          element={
            <ProtectedRoute>
              <AdminLeadsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/leads" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
