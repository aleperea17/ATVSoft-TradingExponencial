import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAdminSession } from '../../services/admin.ts'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'in' | 'out'>('loading')

  useEffect(() => {
    void getAdminSession().then((session) => setState(session ? 'in' : 'out'))
  }, [])

  if (state === 'loading') {
    return <p className="px-6 py-10 text-muted">Verificando acceso...</p>
  }
  if (state === 'out') {
    return <Navigate to="/admin/login" replace />
  }
  return children
}
