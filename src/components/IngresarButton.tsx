import { Link } from 'react-router-dom'
import { useUtmParams } from '../hooks/useUtmParams.ts'

type Variant = 'hero' | 'mid' | 'footer'

const variantClass: Record<Variant, string> = {
  hero: 'inline-flex items-center justify-center bg-cobalt text-white text-base font-bold px-8 py-4 rounded-xl border border-white blue-glow cta-grow',
  mid: 'inline-flex items-center justify-center bg-secondary text-white text-base font-normal px-5 py-[15px] rounded-[5px] w-[280px] max-w-full',
  footer:
    'inline-flex items-center justify-center bg-cobalt text-white text-base font-bold px-8 py-4 rounded-[5px] border border-white cta-grow',
}

type Props = {
  variant?: Variant
  children: string
}

export function IngresarButton({ variant = 'hero', children }: Props) {
  const { withQuery } = useUtmParams()
  return (
    <Link to={withQuery('/cuestionario')} className={variantClass[variant]} data-cta="quiero-ingresar">
      {children}
    </Link>
  )
}
