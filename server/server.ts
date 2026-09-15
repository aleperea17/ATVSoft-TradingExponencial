import { createApp } from './app.ts'
import { env } from './config/env.ts'

const app = await createApp()

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Backend listo en http://localhost:${env.PORT}`)
  console.log(`Calendly: ${env.CALENDLY_ENABLED ? 'flag activo' : 'desactivado'}`)
})
