import { countries } from '../../config/countries.ts'
import { questionnaireFields, type QuestionnaireField } from '../../config/questionnaire.ts'
import type { Answers } from '../../hooks/useQuestionnaire.ts'

type Props = {
  fieldId: string
  answers: Answers
  error?: string
  onChange: (patch: Partial<Answers>) => void
}

function FieldControl({
  field,
  answers,
  onChange,
}: {
  field: QuestionnaireField
  answers: Answers
  onChange: (patch: Partial<Answers>) => void
}) {
  const inputClass =
    'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 focus-visible:border-secondary'

  if (field.type === 'whatsapp') {
    return (
      <div className="grid grid-cols-[140px_1fr] gap-3">
        <label className="sr-only" htmlFor="countryCode">
          Código de país
        </label>
        <select
          id="countryCode"
          className={inputClass}
          value={answers.countryCode}
          onChange={(event) => onChange({ countryCode: event.target.value })}
        >
          {countries.map((country) => (
            <option key={`${country.name}-${country.dial}`} value={country.dial} className="text-black">
              {country.dial} {country.name}
            </option>
          ))}
        </select>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={inputClass}
          placeholder="WhatsApp"
          value={answers.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
        />
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        id={field.id}
        className={`${inputClass} min-h-[140px] resize-y`}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={String(answers[field.id as keyof Answers] ?? '')}
        onChange={(event) => onChange({ [field.id]: event.target.value })}
      />
    )
  }

  if (field.type === 'select') {
    const options =
      field.id === 'country' ? countries.map((country) => ({ value: country.name, label: country.name })) : field.options ?? []
    return (
      <select
        id={field.id}
        className={inputClass}
        value={String(answers[field.id as keyof Answers] ?? '')}
        onChange={(event) => onChange({ [field.id]: event.target.value })}
      >
        <option value="" className="text-black">
          {field.placeholder ?? 'Selecciona'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-black">
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'radio' && field.options) {
    return (
      <fieldset className="space-y-3">
        <legend className="sr-only">{field.label}</legend>
        {field.options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={answers[field.id as keyof Answers] === option.value}
              onChange={() => onChange({ [field.id]: option.value })}
              className="mt-1"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          id={field.id}
          type="checkbox"
          checked={answers.consent}
          onChange={(event) => onChange({ consent: event.target.checked })}
          className="mt-1"
        />
        <span>{field.label}</span>
      </label>
    )
  }

  return (
    <input
      id={field.id}
      type={field.type === 'email' ? 'email' : 'text'}
      autoComplete={field.id === 'fullName' ? 'name' : field.id === 'email' ? 'email' : 'on'}
      className={inputClass}
      maxLength={field.maxLength}
      placeholder={field.placeholder}
      value={String(answers[field.id as keyof Answers] ?? '')}
      onChange={(event) => onChange({ [field.id]: event.target.value })}
    />
  )
}

export function QuestionField({ fieldId, answers, error, onChange }: Props) {
  const field = questionnaireFields.find((item) => item.id === fieldId)
  if (!field) return null

  return (
    <div className="space-y-2">
      {field.type !== 'checkbox' ? (
        <label htmlFor={field.type === 'whatsapp' ? 'phone' : field.id} className="block text-sm font-medium text-white">
          {field.label}
          {field.required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      {field.helper ? <p className="text-sm text-muted">{field.helper}</p> : null}
      <FieldControl field={field} answers={answers} onChange={onChange} />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
