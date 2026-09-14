import { IngresarButton } from '../IngresarButton.tsx'

export function FinalCtaSection() {
  return (
    <section className="px-4 py-8 text-center">
      <div className="page-narrow">
        <h2 className="text-[28px] font-bold leading-[1.3] md:text-[36px]">
          ¿Crees que Trading Exponencial
          <br />
          puede ayudarte?
        </h2>
        <p className="mt-4 text-base text-muted">Agenda una llamada y veremos si realmente tiene</p>
        <p className="text-base text-muted">sentido trabajar juntos</p>
        <div className="mt-8 flex justify-center">
          <IngresarButton variant="footer">QUIERO INGRESAR</IngresarButton>
        </div>
      </div>
    </section>
  )
}
