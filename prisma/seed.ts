import bcrypt from 'bcrypt'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // ==========================================
  // 1. CRIAR USUÁRIO ADMIN
  // ==========================================
  console.log('👤 Criando usuário admin...')
  const existingUser = await prisma.user.findUnique({
    where: { email: 'avea2025' },
  })

  let user
  if (existingUser) {
    console.log('✅ Usuário "avea2025" já existe no banco.')
    user = existingUser
  } else {
    const hashedPassword = await bcrypt.hash('avea2025%', 10)
    user = await prisma.user.create({
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

  console.log('\n')

  // ==========================================
  // 2. CRIAR ESPORTES
  // ==========================================
  console.log('⚽ Criando esportes...')

  const sportsData = ['Futebol', 'Vôlei', 'Arremesso de Peso', 'Natação', 'Corrida', 'Basquete']

  const sports = []
  for (const sportName of sportsData) {
    const existingSport = await prisma.sport.findFirst({
      where: { name: sportName },
    })

    if (existingSport) {
      console.log(`  ✓ Esporte "${sportName}" já existe`)
      sports.push(existingSport)
    } else {
      const newSport = await prisma.sport.create({
        data: { name: sportName },
      })
      console.log(`  ✓ Esporte "${sportName}" criado`)
      sports.push(newSport)
    }
  }

  console.log('\n')

  // ==========================================
  // 3. CRIAR ATLETAS MOCKADOS
  // ==========================================
  console.log('🏃 Criando atletas mockados...')

  const athletesData = [
    {
      name: 'João Silva',
      gender: 'M',
      birthDate: new Date('1999-03-15'), // 25 anos
      sports: ['Futebol', 'Vôlei', 'Arremesso de Peso'],
    },
    {
      name: 'Maria Santos',
      gender: 'F',
      birthDate: new Date('1996-07-22'), // 28 anos
      sports: ['Natação', 'Corrida'],
    },
    {
      name: 'Pedro Oliveira',
      gender: 'M',
      birthDate: new Date('2002-11-10'), // 22 anos
      sports: ['Basquete'],
    },
  ]

  for (const athleteData of athletesData) {
    const existingAthlete = await prisma.athlete.findFirst({
      where: { name: athleteData.name },
    })

    if (existingAthlete) {
      console.log(`  ✓ Atleta "${athleteData.name}" já existe`)
      continue
    }

    // Criar atleta
    const athlete = await prisma.athlete.create({
      data: {
        name: athleteData.name,
        gender: athleteData.gender,
        birthDate: athleteData.birthDate,
        photo: null,
        weight: null,
        height: null,
      },
    })

    // Associar esportes ao atleta
    for (const sportName of athleteData.sports) {
      const sport = sports.find((s) => s.name === sportName)
      if (sport) {
        await prisma.athleteSport.create({
          data: {
            athleteId: athlete.id,
            sportId: sport.id,
            isMain: athleteData.sports[0] === sportName, // Primeiro esporte é o principal
          },
        })
      }
    }

    console.log(
      `  ✓ Atleta "${athleteData.name}" criado com ${athleteData.sports.length} esporte(s)`
    )
  }

  console.log('\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('✨ Seed finalizado com sucesso!\n')
  })
  .catch(async (e) => {
    console.error('❌ Erro durante seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
