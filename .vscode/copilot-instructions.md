# 🤖 Copilot Instructions

Este arquivo guia o GitHub Copilot ao trabalhar neste projeto.

## Referência Rápida

### Comando de Prompt Recomendado

Quando precisar de ajuda do Copilot, comece com:

```
"[PROJETO] [TIPO] [O QUE FAZER]"
```

**Exemplos:**

1. **Novo Componente:**

   ```
   "[Adap Treino] Componente React para listar atletas com Material-UI, mobile-first, usando Prisma
   ```

2. **API Route:**

   ```
   "[Adap Treino] API route para criar novo treino com Prisma e validação
   ```

3. **Correção de Bug:**

   ```
   "[Adap Treino] Corrija erro de autenticação seguindo NextAuth e convenções do projeto
   ```

4. **Feature Nova:**
   ```
   "[Adap Treino] Página de estatísticas do atleta com gráficos e Material-UI
   ```

---

## 📋 Checklist para Prompts Melhores

Ao fazer um prompt, inclua:

- [ ] O tipo de tarefa (componente, página, API, etc)
- [ ] Stack tecnológico relevante (React, Prisma, MUI, etc)
- [ ] Mobile-first ou responsivo
- [ ] Se é client ou server component
- [ ] Padrões do projeto (imports com @/, tipos, etc)
- [ ] Arquivo referência ou padrão

**Exemplo Completo:**

```
"[Adap Treino] Componente React 'use client' para FormulárioAtleta
com campos: nome, idade, foto
- Material-UI TextField, Button
- Mobile-optimized (100lvh, responsive)
- Validação de campos
- Props: onSubmit?: (data) => void
- TypeScript com interface AthleteFormProps
```

---

## 🎯 Contexto do Projeto

- **Mobile-first:** Todos os componentes devem ser otimizados para mobile
- **DB:** Prisma + PostgreSQL (Supabase)
- **UI:** Material-UI v7 com tema customizado
- **Estrutura:** Server + Client components separados

---

## 💻 Referência de Arquivos

Quando pedir ajuda, mencione:

- Padrão em `src/components/screens/TrainingsPage.tsx`
- Auth em `src/lib/auth.ts`
- Prisma em `prisma/schema.prisma`
- Tema em `src/theme/theme.ts`
- Layout em `src/components/layout/MainLayout.tsx`

---
