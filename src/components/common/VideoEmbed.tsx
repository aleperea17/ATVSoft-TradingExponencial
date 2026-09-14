import { useState } from 'react'

type Props = {
  src: string
  title: string
  poster: string
  provider: 'vimeo' | 'youtube'
  className?: string
}

export function VideoEmbed({ src, title, poster, className = '' }: Props) {
  const [playing, setPlaying] = useState(false)
  const playSrc = `${src}${src.includes('?') ? '&' : '?'}autoplay=1`

  return (
    <figure className={`relative overflow-hidden ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={playSrc}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 h-full w-full"
            aria-label={`Reproducir ${title}`}
          >
            <img src={poster} alt="" className="h-full w-full object-cover" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-[50px] w-[75px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[10px] bg-black/50 text-[25px] leading-none text-white">
              ▶
            </span>
          </button>
        )}
      </div>
    </figure>
  )
}
