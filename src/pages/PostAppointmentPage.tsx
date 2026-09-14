import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmationBlock } from '../components/post-appointment/ConfirmationBlock.tsx'
import { FaqVideoPlayer } from '../components/post-appointment/FaqVideoPlayer.tsx'
import { GatedVideoPlayer } from '../components/post-appointment/GatedVideoPlayer.tsx'
import { postAgendaContent } from '../config/postAppointment.ts'
import {
  fetchAppointmentConfig,
  fetchAppointmentStatus,
  reportVideoCompleted,
  type AppointmentDisplay,
} from '../services/appointments.ts'

const copy = postAgendaContent

export default function PostAppointmentPage() {
  const [params] = useSearchParams()
  const reference = params.get('ref')?.trim() || ''
  const scope = reference || 'anon'
  const [display, setDisplay] = useState<AppointmentDisplay>('pending')
  const [title, setTitle] = useState(copy.pendingTitle)
  const [body, setBody] = useState(copy.pendingBody)
  const [demo, setDemo] = useState(false)
  const [openFaq, setOpenFaq] = useState(-1)

  useEffect(() => {
    document.title = copy.title
    void fetchAppointmentConfig()
    if (!reference) return
    void fetchAppointmentStatus(reference).then((status) => {
      if (!status) return
      setDisplay(status.display)
      setTitle(status.title)
      setBody(status.body)
      setDemo(status.demo)
    })
  }, [reference])

  const onVideoEnded = useCallback(() => {
    void reportVideoCompleted(reference || undefined)
      .then((status) => {
        setDisplay(status.display)
        setTitle(status.title)
        setBody(status.body)
        setDemo(status.demo)
        if (reference !== status.publicReference) {
          const url = new URL(window.location.href)
          url.searchParams.set('ref', status.publicReference)
          window.history.replaceState(null, '', url)
        }
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const node = document.getElementById('post-agenda-confirmacion')
        node?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' })
      })
      .catch(() => {
        setDisplay('video_completed')
        setTitle('¡Video completado correctamente!')
        setBody('Hemos registrado que terminaste el video. El equipo validará los datos de tu llamada.')
      })
  }, [reference])

  const confirmed = display !== 'pending'
  const headingId = useId()
  const stories = useMemo(() => copy.stories, [])

  return (
    <div className="post-agenda-page">
      <div className="pa-instr-bar">
        <div className="pa-instr-left">
          <span className="pa-instr-dot" aria-hidden />
          <span className="pa-instr-text">{copy.banner}</span>
        </div>
        <div className="pa-instr-right">{confirmed ? copy.stepProgressDone : copy.stepProgressPending}</div>
      </div>

      <section className="pa-hero">
        <div className="pa-wrap">
          <h1 id={headingId} className="pa-hero-headline">
            {copy.headlineBefore}
            <br />
            vamos a <span className="pa-accent">{copy.headlineAccent}</span>
          </h1>
          <p className="pa-hero-sub">{copy.kicker}</p>

          <div className="pa-video-shell">
            <div className="pa-video-label">
              <span className="pa-vl-left">{copy.videoLabel}</span>
              <span className="pa-vl-right">{copy.videoMeta}</span>
            </div>
            <GatedVideoPlayer
              src={copy.mainVideo.src}
              poster={copy.mainVideo.poster}
              storageScope={scope}
              onEnded={onVideoEnded}
            />
            <div className="pa-consequence">
              <span className="pa-cons-icon" aria-hidden>
                ⚠️
              </span>
              <p>
                <strong>{copy.warningLead}</strong>
                {copy.warningRest}
              </p>
            </div>
          </div>

          <div className="pa-steps">
            <div className="pa-step pa-step-done">
              <span className="pa-step-badge">{copy.stepDoneLabel}</span>
              <span className="pa-step-txt">{copy.stepDoneText}</span>
              <span className="pa-step-check" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </span>
            </div>
            <div className={`pa-step ${confirmed ? 'pa-step-done' : 'pa-step-pend'}`}>
              <span className="pa-step-badge">{confirmed ? copy.stepDoneLabel : copy.stepPendingLabel}</span>
              <span className="pa-step-txt">{confirmed ? title : copy.stepPendingText}</span>
              {confirmed ? (
                <span className="pa-step-check" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </span>
              ) : null}
            </div>
          </div>

          <ConfirmationBlock
            display={display}
            title={title}
            body={body}
            demo={demo}
            demoBadge={copy.demoBadge}
          />
        </div>
      </section>

      <section className="pa-section pa-faqv">
        <div className="pa-wrap">
          <div className="pa-eyebrow">
            <span className="pa-eyebrow-dash" aria-hidden />
            <span className="pa-eyebrow-txt">{copy.faqVideosEyebrow}</span>
          </div>
          <h2 className="pa-sec-h">
            {copy.faqVideosTitle}
            <br />
            <em className="pa-accent">{copy.faqVideosTitleAccent}</em>
          </h2>
          <p className="pa-sec-p">{copy.faqVideosLead}</p>
          <div className="pa-faqv-grid">
            {copy.faqVideos.map((item) => (
              <article key={item.id} className="pa-faqv-card">
                <FaqVideoPlayer src={item.src} poster={item.poster} title={item.title} size="sm" />
                <div className="pa-faqv-body">
                  <p className="pa-faqv-n">{item.n}</p>
                  <h3>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pa-section pa-cases">
        <div className="pa-wrap">
          <div className="pa-eyebrow">
            <span className="pa-eyebrow-dash" aria-hidden />
            <span className="pa-eyebrow-txt">{copy.resultsEyebrow}</span>
          </div>
          <h2 className="pa-sec-h">
            {copy.resultsTitle}
            <br />
            <em className="pa-accent">{copy.resultsTitleAccent}</em>
          </h2>
          <p className="pa-sec-p">{copy.resultsLead}</p>
          <div className="pa-stats">
            {copy.stats.map((stat) => (
              <div key={stat.value + stat.label} className={`pa-stat ${stat.highlight ? 'pa-stat-hi' : ''}`}>
                <p className="pa-stat-l">{stat.kicker}</p>
                <p className="pa-stat-v">{stat.value}</p>
                <p className="pa-stat-d">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="pa-wrap">
          {stories.map((story) => (
            <article key={story.name} className="pa-cr">
              <div className="pa-cv">
                {story.kind === 'video' ? (
                  <FaqVideoPlayer src={story.src ?? ''} poster={story.poster} title={story.name} size="md" />
                ) : (
                  <img src={story.poster} alt="" className="pa-video-poster" />
                )}
              </div>
              <div className="pa-ci">
                <p className="pa-ci-who">{story.name}</p>
                <h3>
                  {story.before}
                  {story.accent ? <em className="pa-accent">{story.accent}</em> : null}
                  {story.after}
                </h3>
                <p>{story.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pa-section pa-how">
        <div className="pa-wrap">
          <div className="pa-eyebrow">
            <span className="pa-eyebrow-dash" aria-hidden />
            <span className="pa-eyebrow-txt">{copy.methodEyebrow}</span>
          </div>
          <h2 className="pa-sec-h">
            {copy.methodTitle}
            <br />
            <em className="pa-accent">{copy.methodTitleAccent}</em>
          </h2>
          <p className="pa-sec-p">{copy.methodLead}</p>
          <div className="pa-av-grid">
            {copy.profiles.map((item) => (
              <article key={item.n} className={`pa-av ${item.highlight ? 'pa-av-hi' : ''}`}>
                <p className="pa-av-n">{item.n}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pa-section pa-faq">
        <div className="pa-wrap">
          <div className="pa-eyebrow">
            <span className="pa-eyebrow-dash" aria-hidden />
            <span className="pa-eyebrow-txt">{copy.faqEyebrow}</span>
          </div>
          <h2 className="pa-sec-h">
            {copy.faqTitle}
            <br />
            <em className="pa-accent">{copy.faqTitleAccent}</em>
            {copy.faqTitleAfter}
          </h2>
          <p className="pa-sec-p">{copy.faqLead}</p>
          <div className="pa-faq-list">
            {copy.faqs.map((item, index) => {
              const expanded = openFaq === index
              return (
                <div key={item.q} className={`pa-faq-row ${expanded ? 'pa-faq-open' : ''}`}>
                  <h3>
                    <button
                      type="button"
                      className="pa-faq-q"
                      aria-expanded={expanded}
                      onClick={() => setOpenFaq(expanded ? -1 : index)}
                    >
                      <span className="pa-faq-qt">“{item.q}”</span>
                      <span className="pa-faq-ico" aria-hidden>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div className="pa-faq-a">
                    <p>
                      {item.before}
                      {item.strong ? <strong>{item.strong}</strong> : null}
                      {item.after}
                    </p>
                    {item.proof ? <div className="pa-faq-proof">{item.proof}</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="pa-footer">
        <div className="pa-wrap">
          <div className="pa-fi">
            <div className="pa-fb">
              {copy.footerBrand}
              <span>.</span>
            </div>
            <p>{copy.footerCopy}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
