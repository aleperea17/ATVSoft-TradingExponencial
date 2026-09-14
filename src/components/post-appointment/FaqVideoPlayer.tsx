import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  poster: string
  title: string
  size?: 'sm' | 'md'
}

export function FaqVideoPlayer({ src, poster, title, size = 'sm' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lockPauseRef = useRef(false)
  const [active, setActive] = useState(false)
  const [ended, setEnded] = useState(false)
  const [inView, setInView] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true)
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  function play() {
    const video = videoRef.current
    if (!video) return
    lockPauseRef.current = true
    setActive(true)
    setEnded(false)
    void video.play()
  }

  function replay() {
    const video = videoRef.current
    if (!video) return
    lockPauseRef.current = true
    video.currentTime = 0
    setEnded(false)
    void video.play()
  }

  function onPause() {
    const video = videoRef.current
    if (!video || !lockPauseRef.current) return
    if (video.ended) return
    void video.play()
  }

  function onEnded() {
    lockPauseRef.current = false
    setEnded(true)
  }

  const icon = size === 'md' ? 20 : 14

  return (
    <div ref={rootRef} className={size === 'md' ? 'pa-story-media' : 'pa-faqv-thumb'}>
      <video
        ref={videoRef}
        className={`pa-video-el ${active ? 'pointer-events-none' : ''}`}
        poster={inView ? poster : undefined}
        src={inView ? src : undefined}
        playsInline
        preload="none"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(event) => event.preventDefault()}
        onPause={onPause}
        onEnded={onEnded}
      />
      {!active ? (
        <button type="button" className="pa-play-overlay" onClick={play} aria-label={`Reproducir ${title}`}>
          <span className={size === 'md' ? 'pa-play-md' : 'pa-play-sm'}>
            <svg width={icon} height={icon} viewBox="0 0 24 24" fill="#fff" aria-hidden>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </span>
        </button>
      ) : null}
      {ended ? (
        <button type="button" className="pa-replay" onClick={replay} aria-label={`Volver a reproducir ${title}`}>
          Replay
        </button>
      ) : null}
    </div>
  )
}
