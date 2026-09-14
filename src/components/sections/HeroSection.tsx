import { IngresarButton } from '../IngresarButton.tsx'

export function HeroSection() {
  return (
    <section className="px-4 pb-0 pt-[70px] text-center">
      <div className="page-narrow">
        <p className="text-[14px] font-bold leading-[1.3] text-highlight">TRADING EXPONENCIAL</p>
        <h1 className="mt-0 pt-[33px] text-[32px] font-bold leading-[1.3] text-white md:text-[40px]">
          Consigue Fondearte Y Retirar $5.000 USD En 16 Semanas Con Mi Método{' '}
          <span className="text-highlight">Alineación Simple</span>
        </h1>
        <p className="mt-6 text-[18px] font-bold leading-[1.4] text-muted">
          Si en 16 semanas no te fondeas, sigo trabajando contigo hasta que lo consigas
        </p>
      </div>
    </section>
  )
}

export function HeroCta() {
  return (
    <div className="flex justify-center px-4 pb-[26px] pt-5">
      <IngresarButton variant="hero">QUIERO INGRESAR</IngresarButton>
    </div>
  )
}
