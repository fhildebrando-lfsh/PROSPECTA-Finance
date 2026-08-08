# Runbook Operacional — PROSPECTA Finance

> Procedimentos técnicos internos: deploy, segredos, backup, migrations e resposta a
> incidentes conhecidos. Público-alvo: quem opera a infraestrutura (hoje, só Felipe
> Hildebrando + Claude Code) — não é material para o usuário final (ver `MANUAL-DE-USO.md`
> para isso).
>
> **Atualizar sempre que:** um novo incidente real for resolvido (adicionar à seção 6), um
> segredo/serviço novo entrar em uso, ou o processo de deploy/backup mudar.

---

## 1. Visão geral do ambiente

| Item | Valor |
|---|---|
| Hospedagem da aplicação | Vercel — projeto `prospecta-finance` |
| URL de produção | `https://prospecta-finance.vercel.app` |
| Repositório | GitHub — `github.com/fhildebrando-lfsh/PROSPECTA-Finance`, branch `master` |
| Banco de dados | PostgreSQL gerenciado pelo Supabase, região `sa-east-1`, projeto `zfugldawxhvzclooisqj` |
| E-mail transacional | Brevo (API HTTP), domínio próprio `prospectafinance.com.br` |
| Autenticação | Supabase Auth (`@supabase/ssr`) |

**⚠️ Risco conhecido, aceito por enquanto:** o mesmo banco de dados é usado em
desenvolvimento e produção — não há ambiente separado. Testes locais tocam dado real. Ao
testar algo destrutivo (import, exclusão), confirmar duas vezes o workspace/registro alvo.

## 2. Deploy

- **Automático:** todo push na branch `master` do GitHub dispara build e deploy na Vercel.
- **Rollback:** painel da Vercel → aba Deployments → escolher um deploy anterior → "Promote
  to Production". Não requer reverter commit no Git para reverter o ar produtivo
  imediatamente (mas o commit revertido deve ser corrigido/revertido no Git também, para
  não reintroduzir o problema no próximo push).
- **Build:** `npm run build` usa `next build --webpack` (não Turbopack) — decisão registrada
  por causa de instabilidade de cache do Turbopack já observada em dev (ver seção 6).

## 3. Variáveis de ambiente / segredos

**Nunca colar valores de segredo neste ou em qualquer documento do repositório.** Lista do
que existe (sem valores):

| Variável | Uso | Onde vive |
|---|---|---|
| `DATABASE_URL` | Connection string do Postgres (via pooler Supabase) | `.env.local` (dev) / Vercel env vars (prod) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase Auth (browser) | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API do Supabase (`lib/supabase/admin.ts`) — contorna RLS, só server-side | idem |
| `BREVO_API_KEY` | Envio de e-mail transacional do app (`lib/email/send.ts`) | idem |

**Procedimento de rotação:** gerar a chave nova no painel do provedor (Supabase/Brevo) →
atualizar a env var na Vercel (redeploy automático) → confirmar funcionamento (login/envio
de e-mail de teste) → **só então** revogar a chave antiga no painel do provedor. Nunca
revogar antes de confirmar a nova funcionando.

**Se um segredo aparecer em texto puro no chat, print ou log:** considerá-lo comprometido e
rotacionar, mesmo que pareça improvável de ter vazado.

## 4. Backup

- **Automático:** Supabase mantém backup do banco (verificar retenção no painel do projeto).
- **Manual, mensal (recomendado a Felipe):** exportar todos os lançamentos em CSV pelo
  próprio sistema (Lançamentos → Exportar, sem filtro) e guardar fora do sistema (Drive, HD
  externo). Ver `GUIA-DE-INICIO.md` §4.1.
- **Antes de qualquer operação destrutiva em massa** (import de teste, exclusão de conta em
  produção), preferir rodar contra dado que pode ser recriado, ou confirmar exportação
  recente disponível.

## 5. Migrations

- **Gerenciadas pelo Prisma:** `npx prisma migrate dev` (local) gera e aplica; em produção,
  aplicadas via `prisma migrate deploy` ou diretamente pelo fluxo já em uso nas sessões
  anteriores (ver histórico de migrations em `PROJECT_STATE.md` §10).
- **SQL manual (RLS, triggers em `auth.users`)** — não gerenciado pelo Prisma, vive em
  `prisma/sql/*.sql`, aplicado com `prisma db execute --file <arquivo>`. Ordem de aplicação
  importa — seguir a numeração dos arquivos (`001_...` a `007_...`).
- **Regra vigente:** migrations em produção com dado real devem ser **aditivas primeiro**
  (nunca remover coluna/tabela na mesma leva que adiciona) — ver estratégia completa em
  `ARQUITETURA-IDENTIDADE-PLANOS.md` §20.

## 6. Incidentes conhecidos e resolução

| Data | Sintoma | Causa raiz | Resolução |
|---|---|---|---|
| 2026-07-31 | 500 em `/lancamentos` | Esgotamento do pool de conexões do Supabase | Corrigido no código (ver `PROJECT_STATE.md`, entrada de 2026-07-31) |
| 2026-07-30 / 08-04 | E-mail de confirmação/convite não chega | Remetente `@gmail.com` não passa DKIM/DMARC em provedor terceiro | Domínio próprio `prospectafinance.com.br` configurado, remetente autenticado |
| 2026-08-05 | Nenhum e-mail chega em produção (convite/exclusão) | `BREVO_API_KEY` salva errada na Vercel | Chave nova gerada e aplicada; `catch` silencioso trocado por log real |
| Recorrente (dev) | `Cache corruption detected: checksum mismatch` no Turbopack | Vários start/stop forçados do dev server | Apagar a pasta `.next` e reiniciar |
| 2026-07-31 (dev) | Porta 3000 ocupada ao iniciar o dev server | Processo `node.exe` órfão de sessão de preview anterior | Encerrar o processo manualmente antes de reiniciar |
| 2026-08-04 | Conta de teste caía no workspace real (com todos os dados) | `WorkspaceInvite` de teste antigo ainda pendente + fallback de sessão não filtrava `status=ACTIVE` | Convites de teste limpos; `resolveActiveMembership()` corrigido para filtrar `ACTIVE` |

**Ao investigar um erro em produção:** ler os logs reais (`vercel logs <url>`, CLI
autenticado via `vercel link`) antes de hipotetizar — o incidente de 2026-08-05 só ficou
visível depois de trocar um `catch` silencioso por log de verdade.

## 7. Testes

```bash
npm test          # roda toda a suíte (Vitest, só testes unitários em lib/)
npm run test:watch
```

Não há testes de integração/e2e ainda (só `lib/finance` e `lib/import`, ~130+ testes). Toda
mudança em `lib/finance/*` deve vir acompanhada de teste.

## 8. Contatos e responsáveis

- **Owner de produto e técnico:** Felipe Hildebrando (fhildebrando@gmail.com) — único
  administrador de plataforma (`isPlatformAdmin`/`platformRole`) hoje.
- **Execução de desenvolvimento:** Claude Code, sob instrução direta de Felipe.
- Não há hoje uma segunda pessoa com acesso técnico ao ambiente de produção (Vercel/Supabase)
  além do Felipe.
