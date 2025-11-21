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

  const sportsData = [
    'Futebol',
    'Vôlei',
    'Arremesso de Peso',
    'Natação',
    'Corrida',
    'Basquete',
    'Lançamento de Disco',
  ]

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
    {
      name: 'Lucas Andrade',
      gender: 'M',
      birthDate: new Date('2001-05-04'),
      sports: ['Corrida', 'Futebol'],
    },
    {
      name: 'Carla Menezes',
      gender: 'F',
      birthDate: new Date('1998-09-18'),
      sports: ['Natação', 'Basquete'],
    },
    {
      name: 'Rafael Coutinho',
      gender: 'M',
      birthDate: new Date('1995-12-02'),
      sports: ['Basquete', 'Arremesso de Peso'],
    },
    {
      name: 'Bianca Rocha',
      gender: 'F',
      birthDate: new Date('2003-02-27'),
      sports: ['Vôlei'],
    },
    {
      name: 'Eduardo Lima',
      gender: 'M',
      birthDate: new Date('2000-08-30'),
      sports: ['Lançamento de Disco', 'Corrida'],
    },
  ]

  const athletes = []

  for (const athleteData of athletesData) {
    const existingAthlete = await prisma.athlete.findFirst({
      where: { name: athleteData.name },
    })

    if (existingAthlete) {
      console.log(`  ✓ Atleta "${athleteData.name}" já existe`)
      athletes.push(existingAthlete)
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

    athletes.push(athlete)
  }

  console.log('\n')

  // ==========================================
  // 4. CRIAR MODELOS DE TREINO
  // ==========================================
  console.log('📋 Criando modelos de treino...')

  const trainingModelsData = [
    {
      name: 'Treino Lançamento de Disco',
      description: 'Sessão focada em técnica, rotação e explosão para lançadores de disco.',
      sportName: 'Lançamento de Disco',
      fields: [
        {
          key: 'aquecimento_notas',
          label: 'Anotações de aquecimento',
          fieldType: 'text',
          sortOrder: 1,
          formType: 'general' as const,
          isRequired: false,
        },
        {
          key: 'distancia_media',
          label: 'Distância média dos lançamentos',
          fieldType: 'number',
          unit: 'm',
          sortOrder: 2,
          formType: 'general' as const,
          isRequired: true,
        },
        {
          key: 'melhor_marca',
          label: 'Melhor marca do dia',
          fieldType: 'number',
          unit: 'm',
          sortOrder: 3,
          formType: 'athlete' as const,
          isRequired: false,
        },
        {
          key: 'sensacao_lancamento',
          label: 'Sensação técnica',
          fieldType: 'choice',
          sortOrder: 4,
          formType: 'athlete' as const,
          config: {
            options: [
              { id: 'excelente', label: 'Excelente' },
              { id: 'boa', label: 'Boa' },
              { id: 'regular', label: 'Regular' },
              { id: 'precisa_ajuste', label: 'Precisa de ajustes' },
            ],
          },
        },
      ],
    },
    {
      name: 'Basquete - Fundamentos Intensivos',
      description: 'Modelo voltado para fundamentos ofensivos e controle de carga.',
      sportName: 'Basquete',
      fields: [
        {
          key: 'series_arremessos_convertidos',
          label: 'Séries de arremessos convertidos',
          fieldType: 'number',
          unit: 'cestas',
          sortOrder: 1,
          formType: 'athlete' as const,
          isRequired: true,
        },
        {
          key: 'porcentagem_lances_livres',
          label: 'Aproveitamento nos lances livres',
          fieldType: 'number',
          unit: '%',
          sortOrder: 2,
          formType: 'athlete' as const,
          isRequired: false,
        },
        {
          key: 'drills_realizados',
          label: 'Drills realizados',
          fieldType: 'multiple-choice',
          sortOrder: 3,
          formType: 'general' as const,
          config: {
            options: [
              { id: 'ball_handling', label: 'Ball handling' },
              { id: 'pick_and_roll', label: 'Pick and roll' },
              { id: 'defesa_pressao', label: 'Defesa com pressão' },
            ],
          },
        },
        {
          key: 'intensidade_percebida',
          label: 'Intensidade percebida',
          fieldType: 'choice',
          sortOrder: 4,
          formType: 'athlete' as const,
          config: {
            options: [
              { id: 'leve', label: 'Leve' },
              { id: 'moderada', label: 'Moderada' },
              { id: 'alta', label: 'Alta' },
            ],
          },
        },
        {
          key: 'observacoes_gerais',
          label: 'Observações gerais',
          fieldType: 'text',
          sortOrder: 5,
          formType: 'general' as const,
          isRequired: false,
        },
      ],
    },
  ]

  for (const modelData of trainingModelsData) {
    const sport = sports.find((s) => s.name === modelData.sportName)
    if (!sport) {
      console.warn(`  ⚠️ Esporte "${modelData.sportName}" não encontrado. Pulando modelo.`)
      continue
    }

    let model = await prisma.trainingModel.findFirst({
      where: { name: modelData.name },
    })

    if (model) {
      console.log(`  ✓ Modelo "${modelData.name}" já existe`)
    } else {
      model = await prisma.trainingModel.create({
        data: {
          name: modelData.name,
          description: modelData.description,
          sportId: sport.id,
        },
      })
      console.log(`  ✓ Modelo "${modelData.name}" criado`)
    }

    const existingFieldsCount = await prisma.trainingModelField.count({
      where: { trainingModelId: model.id },
    })

    if (existingFieldsCount === 0) {
      for (const field of modelData.fields) {
        await prisma.trainingModelField.create({
          data: {
            trainingModelId: model.id,
            key: field.key,
            label: field.label,
            fieldType: field.fieldType,
            unit: field.unit,
            sortOrder: field.sortOrder,
            parentId: null,
            config: {
              isRequired: field.isRequired ?? false,
              formType: field.formType,
              ...(field.config || {}),
            },
          },
        })
      }
      console.log('    → Campos base adicionados')
    } else {
      console.log('    → Modelo já possui campos (pulando criação)')
    }
  }

  console.log('\n')

  // ==========================================
  // 5. METAS E RECORDES PESSOAIS
  // ==========================================
  console.log('🎯 Criando metas e recordes pessoais...')

  const athleteMap = new Map(athletes.map((athlete) => [athlete.name, athlete]))

  const goalsData = [
    {
      athleteName: 'João Silva',
      title: 'Passar dos 60m no lançamento',
      unit: 'm',
      startValue: 56.5,
      targetValue: 60,
      startDate: new Date('2025-01-01'),
      targetDate: new Date('2025-06-30'),
      strategyNotes: 'Trabalhar rotação final e estabilidade do tronco.',
    },
    {
      athleteName: 'Maria Santos',
      title: 'Melhorar tempo nos 100m livre',
      unit: 's',
      startValue: 59.8,
      targetValue: 57.5,
      startDate: new Date('2025-02-15'),
      targetDate: new Date('2025-07-31'),
      strategyNotes: 'Ênfase em saídas e viradas.',
    },
    {
      athleteName: 'Pedro Oliveira',
      title: 'Elevar FG% em jogos amistosos',
      unit: '%',
      startValue: 45,
      targetValue: 50,
      startDate: new Date('2025-01-20'),
      targetDate: new Date('2025-05-30'),
      strategyNotes: 'Mais repetições de arremesso em movimento.',
    },
  ]

  for (const goalData of goalsData) {
    const athlete = athleteMap.get(goalData.athleteName)
    if (!athlete) {
      console.warn(`  ⚠️ Atleta "${goalData.athleteName}" não encontrado para metas.`)
      continue
    }

    const existingGoal = await prisma.goal.findFirst({
      where: {
        athleteId: athlete.id,
        title: goalData.title,
      },
    })

    if (existingGoal) {
      console.log(`  ✓ Meta "${goalData.title}" já existe para ${goalData.athleteName}`)
      continue
    }

    await prisma.goal.create({
      data: {
        athleteId: athlete.id,
        performanceMetricId: null,
        title: goalData.title,
        startValue: goalData.startValue,
        targetValue: goalData.targetValue,
        unit: goalData.unit,
        startDate: goalData.startDate,
        targetDate: goalData.targetDate,
        strategyNotes: goalData.strategyNotes,
      },
    })

    console.log(`  ✓ Meta "${goalData.title}" criada para ${goalData.athleteName}`)
  }

  const personalRecordsData = [
    {
      athleteName: 'Lucas Andrade',
      title: 'Melhor tempo nos 10km',
      value: 38.25,
      unit: 'min',
      dateAchieved: new Date('2024-12-10'),
    },
    {
      athleteName: 'Carla Menezes',
      title: 'Maior distância em série de nado',
      value: 3.2,
      unit: 'km',
      dateAchieved: new Date('2025-01-05'),
    },
    {
      athleteName: 'Rafael Coutinho',
      title: 'Recorde pessoal de pontos',
      value: 32,
      unit: 'pts',
      dateAchieved: new Date('2025-03-08'),
    },
    {
      athleteName: 'Eduardo Lima',
      title: 'Melhor marca no disco',
      value: 59.4,
      unit: 'm',
      dateAchieved: new Date('2025-02-18'),
    },
  ]

  for (const recordData of personalRecordsData) {
    const athlete = athleteMap.get(recordData.athleteName)
    if (!athlete) {
      console.warn(`  ⚠️ Atleta "${recordData.athleteName}" não encontrado para recordes.`)
      continue
    }

    const existingRecord = await prisma.personalRecord.findFirst({
      where: {
        athleteId: athlete.id,
        title: recordData.title,
      },
    })

    if (existingRecord) {
      console.log(`  ✓ Recorde "${recordData.title}" já existe para ${recordData.athleteName}`)
      continue
    }

    await prisma.personalRecord.create({
      data: {
        athleteId: athlete.id,
        performanceMetricId: null,
        title: recordData.title,
        value: recordData.value,
        unit: recordData.unit,
        dateAchieved: recordData.dateAchieved,
        trainingId: null,
      },
    })

    console.log(`  ✓ Recorde "${recordData.title}" criado para ${recordData.athleteName}`)
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
