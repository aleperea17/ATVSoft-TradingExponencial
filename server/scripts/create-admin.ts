import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Uso: npm run create-admin -- "tu-contraseña"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 12)
console.log('\nCopia esta línea en tu archivo .env:\n')
console.log(`ADMIN_PASSWORD_HASH=${hash}`)
console.log('\nNo compartas este hash ni la contraseña en repositorios públicos.\n')
