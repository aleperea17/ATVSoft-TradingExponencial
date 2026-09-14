import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../services/admin.ts'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await adminLogin(email, password)
      navigate('/admin/leads', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-bold text-highlight">PANEL PRIVADO</p>
        <h1 className="mt-2 text-3xl font-bold">Acceso de prospectos</h1>
        <label className="mt-6 block text-sm" htmlFor="admin-email">
          Correo
        </label>
        <input
          id="admin-email"
          type="email"
          className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label className="mt-4 block text-sm" htmlFor="admin-password">
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-cobalt py-3 font-bold text-white disabled:opacity-60"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
