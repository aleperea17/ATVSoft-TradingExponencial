import { problems } from '../../config/content.ts'

export function ProblemsSection() {
  return (
    <section className="px-4 pb-[25px] pt-[70px] text-center">
      <div className="page-shell">
        <h2 className="text-[28px] font-bold leading-[1.3] text-[#f8f9fb] md:text-[36px]">
          ¿Por qué la mayoría no consigue <span className="text-highlight">fondearse</span>?
        </h2>
        <p className="mt-4 text-base font-bold text-muted">
          Si estás aquí, probablemente te estés encontrando con una o varias
        </p>
        <p className="text-base font-bold text-muted">de estas situaciones en este momento:</p>
        <ul className="mx-auto mt-8 w-full max-w-[500px] rounded-[30px] bg-white py-[15px] pl-10 pr-6 text-left text-base leading-[2] text-black sm:pl-[70px]">
          {problems.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-[10px] inline-block text-[15px] font-black leading-none text-danger" aria-hidden>
                ✕
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-10 text-[18px] font-bold">Lo único que necesitas es:</h3>
        <p className="mt-2 text-[18px] font-normal">
          <span className="text-highlight">Una estrategia</span>
        </p>
        <p className="text-[18px] text-highlight">Un roadmap</p>
        <p className="text-[18px] text-highlight">Acompañamiento diario</p>
      </div>
    </section>
  )
}
