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

  // ==========================================
  // 6. CRIAR TREINOS HISTÓRICOS
  // ==========================================
  console.log('🏋️ Criando treinos históricos (outubro e novembro)...')

  // Buscar modelos de treino
  const basqueteModel = await prisma.trainingModel.findFirst({
    where: { name: 'Basquete - Fundamentos Intensivos' },
    include: { fields: true, sport: true },
  })

  const discoModel = await prisma.trainingModel.findFirst({
    where: { name: 'Treino Lançamento de Disco' },
    include: { fields: true, sport: true },
  })

  const trainingsData = [
    {
      date: new Date('2024-10-05T09:00:00'),
      model: basqueteModel,
      athletes: ['Pedro Oliveira', 'Rafael Coutinho'],
      notes: 'Foco em arremessos de média distância',
      data: {
        values: {
          drills_realizados: ['ball_handling', 'pick_and_roll'],
          observacoes_gerais: 'Bom aproveitamento geral',
          intensidade_percebida: 'moderada',
        },
        athleteValues: {
          // Pedro Oliveira
          series_arremessos_convertidos: 12,
          porcentagem_lances_livres: 78,
          intensidade_percebida: 'moderada',
        },
      },
      duration: 5400, // 90 minutos
    },
    {
      date: new Date('2024-10-10T15:30:00'),
      model: discoModel,
      athletes: ['Eduardo Lima', 'João Silva'],
      notes: 'Trabalho técnico de rotação',
      data: {
        values: {
          aquecimento_notas: 'Mobilidade de ombros e quadril',
          distancia_media: 52.3,
        },
        athleteValues: {
          melhor_marca: 58.7,
          sensacao_lancamento: 'boa',
        },
      },
      duration: 7200, // 2 horas
    },
    {
      date: new Date('2024-10-15T10:00:00'),
      model: basqueteModel,
      athletes: ['Pedro Oliveira', 'Rafael Coutinho', 'Carla Menezes'],
      notes: 'Treino em grupo - defesa',
      data: {
        values: {
          drills_realizados: ['defesa_pressao', 'pick_and_roll'],
          observacoes_gerais: 'Boa intensidade defensiva',
        },
        athleteValues: {
          series_arremessos_convertidos: 8,
          porcentagem_lances_livres: 72,
          intensidade_percebida: 'alta',
        },
      },
      duration: 6300, // 105 minutos
    },
    {
      date: new Date('2024-10-20T14:00:00'),
      model: discoModel,
      athletes: ['Eduardo Lima'],
      notes: 'Sessão individual focada em explosão',
      data: {
        values: {
          aquecimento_notas: 'Trabalho de pliometria',
          distancia_media: 55.8,
        },
        athleteValues: {
          melhor_marca: 61.2,
          sensacao_lancamento: 'excelente',
        },
      },
      duration: 5400,
    },
    {
      date: new Date('2024-10-25T16:00:00'),
      model: basqueteModel,
      athletes: ['Rafael Coutinho', 'Carla Menezes'],
      notes: 'Treino de finalização',
      data: {
        values: {
          drills_realizados: ['ball_handling'],
          observacoes_gerais: 'Foco em bandejas e finalizações próximas',
          intensidade_percebida: 'moderada',
        },
        athleteValues: {
          series_arremessos_convertidos: 15,
          porcentagem_lances_livres: 85,
        },
      },
      duration: 4800,
    },
    {
      date: new Date('2024-11-02T09:30:00'),
      model: basqueteModel,
      athletes: ['Pedro Oliveira'],
      notes: 'Treino individual - arremessos',
      data: {
        values: {
          drills_realizados: ['ball_handling', 'pick_and_roll'],
          observacoes_gerais: 'Excelente aproveitamento',
        },
        athleteValues: {
          series_arremessos_convertidos: 18,
          porcentagem_lances_livres: 92,
          intensidade_percebida: 'alta',
        },
      },
      duration: 4500,
    },
    {
      date: new Date('2024-11-08T15:00:00'),
      model: discoModel,
      athletes: ['João Silva', 'Eduardo Lima'],
      notes: 'Comparativo de técnicas',
      data: {
        values: {
          aquecimento_notas: 'Revisão de fundamentos',
          distancia_media: 54.5,
        },
        athleteValues: {
          melhor_marca: 59.8,
          sensacao_lancamento: 'boa',
        },
      },
      duration: 6600,
    },
    {
      date: new Date('2024-11-12T10:30:00'),
      model: basqueteModel,
      athletes: ['Rafael Coutinho', 'Pedro Oliveira', 'Carla Menezes'],
      notes: 'Simulação de jogo',
      data: {
        values: {
          drills_realizados: ['pick_and_roll', 'defesa_pressao'],
          observacoes_gerais: 'Ótima comunicação em quadra',
        },
        athleteValues: {
          series_arremessos_convertidos: 10,
          porcentagem_lances_livres: 80,
          intensidade_percebida: 'alta',
        },
      },
      duration: 7200,
    },
    {
      date: new Date('2024-11-17T14:30:00'),
      model: discoModel,
      athletes: ['Eduardo Lima'],
      notes: 'Preparação para competição',
      data: {
        values: {
          aquecimento_notas: 'Protocolo pré-competição',
          distancia_media: 57.2,
        },
        athleteValues: {
          melhor_marca: 62.4,
          sensacao_lancamento: 'excelente',
        },
      },
      duration: 5100,
    },
    {
      date: new Date('2024-11-21T16:00:00'),
      model: basqueteModel,
      athletes: ['Pedro Oliveira', 'Rafael Coutinho'],
      notes: 'Treino de recuperação',
      data: {
        values: {
          drills_realizados: ['ball_handling'],
          observacoes_gerais: 'Intensidade controlada',
        },
        athleteValues: {
          series_arremessos_convertidos: 7,
          porcentagem_lances_livres: 75,
          intensidade_percebida: 'leve',
        },
      },
      duration: 3600,
    },
  ]

  for (const trainingData of trainingsData) {
    if (!trainingData.model) {
      console.warn(`  ⚠️ Modelo de treino não encontrado. Pulando.`)
      continue
    }

    // Verificar se treino já existe (por data e modelo)
    const existingTraining = await prisma.training.findFirst({
      where: {
        date: trainingData.date,
        modelId: trainingData.model.id,
      },
    })

    if (existingTraining) {
      console.log(`  ✓ Treino em ${trainingData.date.toLocaleDateString('pt-BR')} já existe`)
      continue
    }

    // Criar snapshot do modelo
    const snapshot = {
      modelId: trainingData.model.id,
      modelName: trainingData.model.name,
      sportId: trainingData.model.sportId,
      sportName: trainingData.model.sport.name,
      fields: trainingData.model.fields.map((field) => ({
        id: field.id.toString(),
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        unit: field.unit || undefined,
        sortOrder: field.sortOrder,
        parentId: field.parentId?.toString() || null,
        formType: (field.config as any)?.formType || 'general',
        isRequired: (field.config as any)?.isRequired || false,
        config: field.config,
      })),
    }

    const endTime = new Date(trainingData.date.getTime() + trainingData.duration * 1000)

    // Criar treino
    const training = await prisma.training.create({
      data: {
        date: trainingData.date,
        modelId: trainingData.model.id,
        sportId: trainingData.model.sportId,
        notes: trainingData.notes,
        data: {
          snapshot,
          startTime: trainingData.date.toISOString(),
          endTime: endTime.toISOString(),
          duration: trainingData.duration,
          values: trainingData.data.values,
          athleteValues: trainingData.data.athleteValues || {},
        },
      },
    })

    // Adicionar participantes
    for (const athleteName of trainingData.athletes) {
      const athlete = athleteMap.get(athleteName)
      if (athlete) {
        await prisma.trainingParticipant.create({
          data: {
            trainingId: training.id,
            athleteId: athlete.id,
            status: 'present',
          },
        })
      }
    }

    console.log(
      `  ✓ Treino "${trainingData.model.name}" criado em ${trainingData.date.toLocaleDateString('pt-BR')} com ${trainingData.athletes.length} atleta(s)`
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
