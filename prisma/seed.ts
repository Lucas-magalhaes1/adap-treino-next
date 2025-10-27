import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Verificar se o usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: 'avea2025' },
  })

  if (existingUser) {
    console.log('✅ Usuário "avea2025" já existe no banco.')
    return
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash('avea2025%', 10)

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      email: 'avea2025',
      name: 'Administrador',
      password: hashedPassword,
    },
  })

  console.log('✅ Usuário criado com sucesso!')
  console.log('📧 Email: avea2025')
  console.log('🔐 Senha: avea2025%')
  console.log('👤 ID:', user.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✨ Seed finalizado!')
  })
  .catch(async (e) => {
    console.error('❌ Erro durante seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
