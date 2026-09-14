export type FieldType = 'text' | 'email' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'whatsapp'

export type QuestionnaireOption = {
  value: string
  label: string
}

export type QuestionnaireField = {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  helper?: string
  options?: QuestionnaireOption[]
  maxLength?: number
}

export type QuestionnaireStep = {
  id: string
  title: string
  description?: string
  fields: string[]
}

export const questionnaireFields: QuestionnaireField[] = [
  {
    id: 'fullName',
    label: 'Nombre y apellido',
    type: 'text',
    required: true,
    placeholder: 'Tu nombre completo',
    maxLength: 120,
  },
  {
    id: 'email',
    label: 'Correo electrónico',
    type: 'email',
    required: true,
    placeholder: 'tunombre@email.com',
    maxLength: 254,
  },
  {
    id: 'whatsapp',
    label: 'Número de WhatsApp',
    type: 'whatsapp',
    required: true,
    helper: 'Incluye el código de país para que el equipo pueda contactarte.',
  },
  {
    id: 'country',
    label: 'País',
    type: 'select',
    required: true,
    placeholder: 'Selecciona tu país',
  },
  {
    id: 'city',
    label: 'Ciudad',
    type: 'text',
    required: true,
    placeholder: 'Tu ciudad',
    maxLength: 80,
  },
  {
    id: 'experience',
    label: '¿Cuál es tu experiencia actual en trading?',
    type: 'radio',
    required: true,
    options: [
      { value: 'No tengo experiencia.', label: 'No tengo experiencia.' },
      { value: 'Menos de 6 meses.', label: 'Menos de 6 meses.' },
      { value: 'Entre 6 meses y 1 año.', label: 'Entre 6 meses y 1 año.' },
      { value: 'Más de 1 año.', label: 'Más de 1 año.' },
    ],
  },
  {
    id: 'currentSituation',
    label: '¿Actualmente estás operando?',
    type: 'radio',
    required: true,
    options: [
      { value: 'Sí, en una cuenta real.', label: 'Sí, en una cuenta real.' },
      { value: 'Sí, en una cuenta demo.', label: 'Sí, en una cuenta demo.' },
      { value: 'Estoy aprendiendo.', label: 'Estoy aprendiendo.' },
      { value: 'Todavía no.', label: 'Todavía no.' },
    ],
  },
  {
    id: 'goal',
    label: '¿Cuál es tu principal objetivo con el trading?',
    type: 'textarea',
    required: true,
    placeholder: 'Cuéntanos qué quieres lograr',
    maxLength: 500,
  },
  {
    id: 'mainProblem',
    label: '¿Cuál es el principal problema que te impide avanzar?',
    type: 'textarea',
    required: true,
    placeholder: 'Describe el obstáculo más importante',
    maxLength: 500,
  },
  {
    id: 'capital',
    label: '¿Cuánto capital tienes disponible para comenzar o mejorar tu operativa?',
    type: 'radio',
    required: true,
    options: [
      { value: 'Menos de USD 500.', label: 'Menos de USD 500.' },
      { value: 'Entre USD 500 y USD 1.000.', label: 'Entre USD 500 y USD 1.000.' },
      { value: 'Entre USD 1.000 y USD 3.000.', label: 'Entre USD 1.000 y USD 3.000.' },
      { value: 'Más de USD 3.000.', label: 'Más de USD 3.000.' },
      { value: 'Prefiero hablarlo con el equipo.', label: 'Prefiero hablarlo con el equipo.' },
    ],
  },
  {
    id: 'willingToInvest',
    label:
      '¿Estás dispuesto a invertir en formación y acompañamiento si consideras que el programa es adecuado para ti?',
    type: 'radio',
    required: true,
    options: [
      { value: 'Sí.', label: 'Sí.' },
      { value: 'Depende de la propuesta.', label: 'Depende de la propuesta.' },
      { value: 'No.', label: 'No.' },
    ],
  },
  {
    id: 'preferredTime',
    label: '¿En qué horario prefieres que te contactemos?',
    type: 'radio',
    required: true,
    options: [
      { value: 'Mañana.', label: 'Mañana.' },
      { value: 'Tarde.', label: 'Tarde.' },
      { value: 'Noche.', label: 'Noche.' },
    ],
  },
  {
    id: 'comments',
    label: '¿Hay algo más que deberíamos saber antes de contactarte?',
    type: 'textarea',
    required: false,
    placeholder: 'Opcional',
    maxLength: 1000,
  },
  {
    id: 'consent',
    label:
      'Acepto que el equipo se comunique conmigo por WhatsApp, correo electrónico o llamada para dar seguimiento a mi solicitud.',
    type: 'checkbox',
    required: true,
  },
]

export const questionnaireSteps: QuestionnaireStep[] = [
  { id: 'identity', title: '¿Cómo te llamas?', fields: ['fullName'] },
  { id: 'email', title: '¿Cuál es tu correo?', fields: ['email'] },
  {
    id: 'whatsapp',
    title: '¿Cuál es tu WhatsApp?',
    description: 'Usaremos este número para coordinar el seguimiento.',
    fields: ['whatsapp'],
  },
  { id: 'location', title: '¿Dónde vives?', fields: ['country', 'city'] },
  { id: 'experience', title: 'Tu experiencia', fields: ['experience'] },
  { id: 'situation', title: 'Tu situación actual', fields: ['currentSituation'] },
  { id: 'goal', title: 'Tu objetivo', fields: ['goal'] },
  { id: 'problem', title: 'Tu principal obstáculo', fields: ['mainProblem'] },
  { id: 'capital', title: 'Capital disponible', fields: ['capital'] },
  { id: 'invest', title: 'Formación y acompañamiento', fields: ['willingToInvest'] },
  { id: 'schedule', title: 'Horario de contacto', fields: ['preferredTime'] },
  { id: 'close', title: 'Últimos detalles', fields: ['comments', 'consent'] },
]

export const STORAGE_KEY = 'te-questionnaire-draft'
