# Habit Tracker

Acompanhamento diário de hábitos pessoais. Construído com Next.js 14 (App Router), TypeScript e Tailwind CSS.

## Hábitos rastreados

🏋️ Exercício · 🥗 Alimentação · 📖 Leitura · 😴 Sono · 📚 Estudos · ✍️ Escrita · 💧 Água

## Setup local (desenvolvimento)

**Pré-requisitos:** Node.js 18+

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Os dados são salvos em `data/habits.json`.

Nenhuma variável de ambiente é necessária para desenvolvimento.

## Deploy na Vercel

### 1. Criar o repositório e importar no Vercel

```bash
git remote add origin https://github.com/<seu-usuario>/habit-tracker.git
git push -u origin main
```

Importe o repositório em [vercel.com/new](https://vercel.com/new).

### 2. Adicionar o Upstash Redis

No Vercel Dashboard:

1. Vá em **Integrations → Browse Marketplace → Upstash Redis**
2. Clique em **Add Integration** e conecte ao projeto
3. A integração cria automaticamente as variáveis de ambiente:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

> **Por que Redis?** A Vercel usa funções serverless sem sistema de arquivos persistente. O Redis substitui o `data/habits.json` em produção.

### 3. Deploy

Após conectar o Redis, faça redeploy:

```bash
git push origin main
```

O app detecta as variáveis automaticamente:
- `UPSTASH_REDIS_REST_URL` presente → usa Redis (produção)
- Variáveis ausentes → usa `data/habits.json` (desenvolvimento)

### Variáveis de ambiente

Veja `.env.example` para referência. Copie para `.env.local` se precisar testar com Redis localmente:

```bash
cp .env.example .env.local
# preencha com as credenciais do Upstash
```

## Estrutura

```
app/
  page.tsx          # Registro diário (página principal)
  semana/
    page.tsx        # Visão semanal em grade
  api/habits/
    route.ts        # GET /api/habits, POST /api/habits
lib/
  storage.ts        # Abstração de persistência (JSON local ou Redis)
data/
  habits.json       # Banco de dados local (desenvolvimento)
```
