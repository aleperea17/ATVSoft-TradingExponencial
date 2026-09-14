import { benefits } from '../../config/content.ts'
import { IngresarButton } from '../IngresarButton.tsx'

export function BenefitsSection() {
  return (
    <section className="px-4 pt-5">
      <div className="page-narrow text-center">
        <h2 className="text-[28px] font-bold leading-[1.3] md:text-[36px]">
          ¿Qué obtendrás dentro de <span className="text-highlight">Trading Exponencial</span>?
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-base leading-[1.7] text-muted">
          Después de haber ayudado a <span className="text-highlight">más de 300 alumnos</span> a convertirse en
          traders consistentes, puedo decirte que la razón número uno por la que la mayoría de la gente fracasa es
          que su estrategia <span className="text-highlight">no es lo suficientemente sencilla</span>.
        </p>
        <p className="mt-4 text-base font-bold text-white">
          Y por eso he creado <span className="text-highlight">Trading Exponencial</span>.
        </p>
        <p className="mt-4 text-base text-muted">No se trata de un programa de coaching genérico…</p>
        <p className="mx-auto mt-4 max-w-[760px] text-base leading-[1.7] text-muted">
          Se trata de una solución sencilla y «todo en uno» en la que, literalmente, te proporcionamos{' '}
          <span className="text-highlight">TODO</span> lo que necesitas para convertirte en un trader fondeado y
          conseguir resultados consistentes.
        </p>
      </div>
      <div className="page-shell mt-10 grid gap-10 md:grid-cols-3">
        {benefits.map((item) => (
          <article key={item.title} className="text-center">
            <img src={item.image} alt={item.alt} className="mx-auto mb-4 h-auto w-full max-w-[280px] p-[10px]" loading="lazy" />
            <h3 className="text-[18px] font-bold">{item.title}</h3>
            {item.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-[1.7] text-muted md:text-base">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
      <div className="flex justify-center py-8">
        <IngresarButton variant="mid">Quiero Ingresar</IngresarButton>
      </div>
    </section>
  )
}
