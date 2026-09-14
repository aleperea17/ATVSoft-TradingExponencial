type Props = {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const percent = Math.round(((current + 1) / total) * 100)
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm text-muted">
        <span>
          Paso {current + 1} de {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
