import { useEffect, useRef, useState } from 'react'
import { clampSeek, readGatedProgress, writeGatedProgress } from '../../hooks/useGatedVideo.ts'

type Props = {
  src: string
  poster: string
  storageScope: string
  onEnded: () => void
}

export function GatedVideoPlayer({ src, poster, storageScope, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const maxRef = useRef(0)
  const completedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [maxWatched, setMaxWatched] = useState(0)

  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  useEffect(() => {
    const saved = readGatedProgress(storageScope)
    maxRef.current = saved.maxWatchedTime
    completedRef.current = saved.completed
    setMaxWatched(saved.maxWatchedTime)
    const video = videoRef.current
    if (video && saved.maxWatchedTime > 0) {
      video.currentTime = saved.maxWatchedTime
      setCurrent(saved.maxWatchedTime)
      setStarted(true)
    }
    if (saved.completed) onEndedRef.current()
  }, [storageScope])

  function persist(nextMax: number, completed: boolean) {
    maxRef.current = nextMax
    completedRef.current = completed
    setMaxWatched(nextMax)
    writeGatedProgress(storageScope, { maxWatchedTime: nextMax, completed })
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  function onTimeUpdate() {
    const video = videoRef.current
    if (!video) return
    const time = video.currentTime
    setCurrent(time)
    if (time > maxRef.current + 0.05) {
      persist(time, completedRef.current)
    }
  }

  function onSeeking() {
    const video = videoRef.current
    if (!video) return
    const clamped = clampSeek(video.currentTime, maxRef.current)
    if (clamped < video.currentTime - 0.05) {
      video.currentTime = clamped
    }
  }

  function onBarPointer(clientX: number) {
    const video = videoRef.current
    const bar = barRef.current
    if (!video || !bar || !video.duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const target = ratio * video.duration
    video.currentTime = clampSeek(target, maxRef.current)
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0
  const unlocked = duration > 0 ? (maxWatched / duration) * 100 : 0

  return (
    <div className="pa-video-stage">
      <video
        ref={videoRef}
        className="pa-video-el"
        poster={poster}
        src={src}
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(event) => event.preventDefault()}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0)
          setReady(true)
        }}
        onPlay={() => {
          setPlaying(true)
          setStarted(true)
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onSeeking={onSeeking}
        onEnded={() => {
          persist(Math.max(maxRef.current, duration), true)
          setPlaying(false)
          onEnded()
        }}
        onRateChange={(event) => {
          if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1
        }}
      />
      {!playing ? (
        <>
          <div className="pa-video-dim" />
          <button type="button" className="pa-play-overlay" onClick={togglePlay} aria-label="Reproducir video obligatorio">
            <span className="pa-play-ring">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </span>
            <span className="pa-play-label">Toca para reproducir</span>
          </button>
        </>
      ) : null}
      {started ? (
        <div className="pa-gate-bar">
          <button type="button" onClick={togglePlay} aria-label={playing ? 'Pausar video' : 'Reproducir video'}>
            {playing ? 'Pausa' : 'Reproducir'}
          </button>
          <div
            ref={barRef}
            className="pa-gate-track"
            onPointerDown={(event) => {
              event.stopPropagation()
              onBarPointer(event.clientX)
            }}
            role="slider"
            aria-label="Progreso del video"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
          >
            <div className="pa-gate-unlocked" style={{ width: `${unlocked}%` }} />
            <div className="pa-gate-progress" style={{ width: `${progress}%` }} />
          </div>
          {ready ? (
            <span className="pa-gate-time">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function formatTime(value: number): string {
  const total = Math.max(0, Math.floor(value))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
