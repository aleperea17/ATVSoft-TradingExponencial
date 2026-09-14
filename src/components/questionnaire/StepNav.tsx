type Props = {
  canGoBack: boolean
  isLast: boolean
  submitting: boolean
  onPrev: () => void
  onNext: () => void
}

export function StepNav({ canGoBack, isLast, submitting, onPrev, onNext }: Props) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoBack || submitting}
        className="rounded-xl border border-white/20 px-5 py-3 text-white disabled:opacity-40"
      >
        Anterior
      </button>
      <button
        type="submit"
        onClick={onNext}
        disabled={submitting}
        className="rounded-xl bg-cobalt px-6 py-3 font-bold text-white blue-glow disabled:opacity-60"
      >
        {submitting ? 'Enviando...' : isLast ? 'Enviar solicitud' : 'Continuar'}
      </button>
    </div>
  )
}
