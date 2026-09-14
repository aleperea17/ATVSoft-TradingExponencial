import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faqs } from '../../config/content.ts'

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  const baseId = useId()

  return (
    <section className="px-4 py-5">
      <div className="page-narrow">
        <h2 className="text-center text-[28px] font-bold leading-[1.3] md:text-[36px]">Preguntas Frecuentes</h2>
        <p className="mt-3 text-center text-base text-muted">
          Resolvemos las dudas más comunes antes de agendar la llamada
        </p>
        <div className="mt-8">
          {faqs.map((item, index) => {
            const expanded = open === index
            const panelId = `${baseId}-panel-${index}`
            const buttonId = `${baseId}-button-${index}`
            return (
              <div key={item.q} className="faq-item overflow-hidden rounded-[10px] border border-smoke">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className={`flex w-full items-center justify-between bg-smoke px-[15px] py-[15px] text-left text-[15px] font-medium leading-[1.5] text-black md:text-base ${
                      expanded ? 'rounded-t-[10px]' : 'rounded-[10px]'
                    }`}
                    onClick={() => setOpen(expanded ? null : index)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`ml-3 size-4 shrink-0 transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                {expanded ? (
                  <div id={panelId} role="region" aria-labelledby={buttonId} className="rounded-b-[10px] bg-white p-[15px]">
                    <p className="text-[12px] leading-[1.5] text-black md:text-[15px]">{item.a}</p>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
