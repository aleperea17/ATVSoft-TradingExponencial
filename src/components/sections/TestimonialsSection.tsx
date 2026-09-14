import { testimonials } from '../../config/content.ts'
import { VideoEmbed } from '../common/VideoEmbed.tsx'

export function TestimonialsSection() {
  return (
    <section className="px-4 pb-5 pt-5 text-center">
      <div className="page-shell">
        <p className="text-[14px] font-bold leading-[1.3] text-highlight">RESULTADOS REALES</p>
        <h2 className="mt-2 text-[32px] font-bold leading-[1.3] md:text-[40px]">
          Casos de <span className="text-highlight">éxito</span>
        </h2>
        <p className="mt-3 text-base font-bold text-muted">
          Lo que dicen los alumnos que ya operan con un proceso claro
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <article key={item.youtubeId} className="text-center">
              <VideoEmbed
                provider="youtube"
                src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?rel=0`}
                poster={item.poster}
                title={`Testimonio de ${item.name}`}
                className="rounded-md"
              />
              <p className="mt-3 text-base text-white">{item.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
