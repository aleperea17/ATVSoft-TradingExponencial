import { CheckCircle, X } from 'lucide-react'
import { forYou, notForYou } from '../../config/content.ts'

export function AudienceSection() {
  return (
    <section className="px-4 py-5 text-center">
      <div className="page-shell">
        <h2 className="text-[28px] font-bold leading-[1.3] md:text-[36px]">¿Es para ti?</h2>
        <p className="mt-3 text-base text-muted">Trading Exponencial no es para todo el mundo. Revisa si encajas</p>
        <div className="mt-10 grid gap-10 text-left md:grid-cols-2">
          <div>
            <h3 className="text-center text-[22px] font-bold">Para quién es</h3>
            <p className="mt-2 text-center text-muted">Trading Exponencial es para ti si...</p>
            <ul className="mt-6 space-y-1 text-base leading-[2] text-white">
              {forYou.map((item) => (
                <li key={item} className="flex items-start gap-3 pl-2">
                  <CheckCircle className="mt-[7px] size-5 shrink-0 text-cobalt" strokeWidth={2.4} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-center text-[22px] font-bold">Para quién NO es</h3>
            <p className="mt-2 text-center text-muted">Esto NO es para ti si...</p>
            <ul className="mt-6 space-y-1 text-base leading-[2] text-white">
              {notForYou.map((item) => (
                <li key={item} className="flex items-start gap-3 pl-2">
                  <X className="mt-[7px] size-5 shrink-0 text-danger" strokeWidth={3} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
