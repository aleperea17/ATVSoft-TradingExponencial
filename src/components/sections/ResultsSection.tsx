import { results } from '../../config/content.ts'

export function ResultsSection() {
  return (
    <section className="px-4 py-5 text-center">
      <div className="page-narrow">
        <h2 className="text-[28px] font-bold leading-[1.3] md:text-[36px]">Resultados Reales</h2>
        <p className="mt-3 text-base text-muted">Retiros y resultados de mis alumnos</p>
      </div>
      <div className="page-shell mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {results.map((item) => (
          <img
            key={item.src}
            src={item.src}
            alt={item.alt}
            className="mx-auto h-auto w-full p-[10px]"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  )
}
