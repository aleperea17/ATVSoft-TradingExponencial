import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-[640px] rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-16 text-secondary" aria-hidden />
        <h1 className="mt-6 text-[28px] font-bold leading-[1.3] md:text-[36px]">¡Solicitud recibida correctamente!</h1>
        <p className="mt-4 text-base leading-[1.7] text-muted">
          Gracias por completar el cuestionario. Nuestro equipo revisará tus respuestas y se comunicará contigo por
          WhatsApp, correo electrónico o llamada para coordinar los próximos pasos.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-cobalt px-8 py-4 font-bold text-white blue-glow"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
