import { useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '../components/questionnaire/ProgressBar.tsx'
import { QuestionField } from '../components/questionnaire/QuestionField.tsx'
import { StepNav } from '../components/questionnaire/StepNav.tsx'
import { useQuestionnaire } from '../hooks/useQuestionnaire.ts'
import { useUtmParams } from '../hooks/useUtmParams.ts'
import { getSchedulingStatus, shouldShowCalendar } from '../services/scheduling.ts'

export function QuestionnairePage() {
  const navigate = useNavigate()
  const { utm } = useUtmParams()
  const q = useQuestionnaire()

  useEffect(() => {
    const onPop = () => {
      if (q.hasUnsaved && !window.confirm('Tienes respuestas sin enviar. ¿Seguro que quieres salir?')) {
        window.history.pushState(null, '', window.location.href)
      }
    }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [q.hasUnsaved])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!q.isLast) {
      q.next()
      return
    }
    const result = await q.submit({
      sourceUrl: window.location.href,
      referrer: document.referrer,
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign,
      utmContent: utm.utm_content,
      utmTerm: utm.utm_term,
    })
    if (!result.ok) return
    const status = await getSchedulingStatus()
    if (shouldShowCalendar(status)) {
      navigate('/gracias')
      return
    }
    navigate('/gracias')
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-[640px]">
        <p className="text-center text-[14px] font-bold text-highlight">TRADING EXPONENCIAL</p>
        <h1 className="mt-3 text-center text-[28px] font-bold leading-[1.3] md:text-[36px]">{q.current.title}</h1>
        {q.current.description ? <p className="mt-2 text-center text-muted">{q.current.description}</p> : null}
        <div className="mt-8">
          <ProgressBar current={q.step} total={q.total} />
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {q.current.fields.map((fieldId) => (
            <QuestionField
              key={fieldId}
              fieldId={fieldId}
              answers={q.answers}
              error={q.errors[fieldId]}
              onChange={q.update}
            />
          ))}
          <div aria-hidden="true" className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
            <label htmlFor="website">
              Sitio web
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={q.answers.website}
                onChange={(event) => q.update({ website: event.target.value })}
              />
            </label>
          </div>
          {q.submitError ? (
            <p role="alert" className="text-sm text-danger">
              {q.submitError}
            </p>
          ) : null}
          <StepNav
            canGoBack={q.step > 0}
            isLast={q.isLast}
            submitting={q.submitting}
            onPrev={q.prev}
            onNext={() => undefined}
          />
        </form>
      </div>
    </main>
  )
}
