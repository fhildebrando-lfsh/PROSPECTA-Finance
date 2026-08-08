# Registro Operacional — PROSPECTA Finance

> **Natureza deste documento:** livro de registro formal de cada etapa de
> desenvolvimento/melhoria concluída no sistema, no espírito de uma escrituração —
> cada entrada é numerada, datada e não é reescrita depois de fechada (correções viram
> uma entrada nova, que referencia a anterior). É o documento que comprova, de forma
> auditável, **o que foi entregue, quando, a pedido de quem e com que evidência de
> funcionamento**.
>
> **Diferença para os outros documentos do projeto:**
> - `CHANGELOG.md` — o que mudou, em linguagem de produto, por data.
> - `PROJECT_STATE.md` — a memória técnica completa (decisões, causas-raiz, código
>   envolvido) para retomar o trabalho sem perder contexto.
> - **Este documento (`REGISTRO-OPERACIONAL.md`)** — o registro formal e resumido de
>   cada etapa fechada, para fins de auditoria/confiabilidade do processo.
>
> **Regra de escrituração, vigente a partir de 2026-08-08:** toda finalização de etapa
> (funcionalidade entregue, correção relevante, decisão arquitetural aplicada) gera uma
> nova entrada numerada sequencialmente ao final deste documento, no mesmo momento em
> que `PROJECT_STATE.md` e `CHANGELOG.md` são atualizados. As entradas 001–018 abaixo
> são o **backfill histórico** de tudo que já foi entregue antes dessa data, reconstruído
> a partir do histórico real do Git e de `PROJECT_STATE.md`, para que o livro comece
> completo em vez de vazio.

---

### Registro Nº 001
- **Data:** 2026-07-29
- **Etapa concluída:** Fase 0 — Fundação
- **Descrição:** Estrutura inicial do sistema — Next.js + Prisma + Supabase Auth/RLS, schema do banco, seed completo da taxonomia (393 combinações Tipo→Categoria→Subcategoria), carteiras, responsáveis e referências. Motor de regras financeiras puras (`lib/finance/`) implementado com testes desde a primeira linha.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** login funcionando, listas de categorias/carteiras carregadas; testes automatizados passando.
- **Documentos relacionados:** `PROJECT_STATE.md` §1–§3; commits `2026-07-29`.

### Registro Nº 002
- **Data:** 2026-07-30
- **Etapa concluída:** Fase 1 — Lançamentos, importação e painel (Conversas 3–5)
- **Descrição:** CRUD de lançamentos, importador de CSV, telas de Cadastros, lançamento rápido, Painel, permissões, exportação CSV/XLSX, PWA/responsividade. Pontas soltas fechadas: Compromissos, reverter importação, transferência entre carteiras, convite de membro, edição in-line.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** fluxo completo testado manualmente (lançar, importar, exportar, convidar).
- **Documentos relacionados:** `PROJECT_STATE.md` (entradas de 2026-07-30).

### Registro Nº 003
- **Data:** 2026-07-30
- **Etapa concluída:** Primeiro deploy em produção
- **Descrição:** Sistema publicado na Vercel (`prospecta-finance.vercel.app`), repositório `github.com/fhildebrando-lfsh/PROSPECTA-Finance`. Convite de membro por WhatsApp, "Esqueci minha senha", nome no cadastro, painel `/admin/usuarios`.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** deploy acessível publicamente, testado ao vivo.
- **Observação registrada:** causa raiz do e-mail de confirmação não funcionar foi diagnosticada (remetente `@gmail.com` sem DKIM/DMARC válido) — correção adiada de propósito até compra de domínio próprio.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-07-30, "Problemas conhecidos" #9).

### Registro Nº 004
- **Data:** 2026-07-31
- **Etapa concluída:** Rebranding + redesenho do Painel
- **Descrição:** Sistema renomeado para "PROSPECTA Finance" com logo própria; menu lateral desktop; Painel redesenhado (cards, anéis de categoria, velocímetro de reserva); visão Mensal/Anual/Geral; gráfico "Provisão"; correções de bugs reais (fundo branco por cascade do Tailwind, zoom mobile, pool de conexões do Supabase esgotado, favicon errado).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testado ao vivo em produção; bug do pool de conexões confirmado resolvido sob uso real.
- **Documentos relacionados:** `PROJECT_STATE.md` (entradas de 2026-07-31).

### Registro Nº 005
- **Data:** 2026-08-01
- **Etapa concluída:** Reformulação de Cadastros
- **Descrição:** Telas de Cadastros redesenhadas (editar sob demanda, exclusão em massa, cor por Tipo em Subcategorias, fluxo Tipo→Categoria→Nome); correção de duplicação de `sort_order` em Categoria.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testado manualmente contra dados reais.
- **Documentos relacionados:** `PROJECT_STATE.md` (entradas de 2026-08-01, primeira metade).

### Registro Nº 006
- **Data:** 2026-08-01
- **Etapa concluída:** Arquitetura de Identidade/Planos — Fase 1 (projeto) aprovada
- **Descrição:** Documento `ARQUITETURA-IDENTIDADE-PLANOS.md` produzido e aprovado pelo dono do produto — decisão central: "Consultor"/"Cliente" não são papéis fixos de pessoa, e sim o valor `ADVISOR` de uma `Membership`; plano é `Subscription`/`Entitlement`, nunca papel de autorização.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** documento revisado e aprovado item a item antes do início da Fase 2 (implementação).
- **Documentos relacionados:** `ARQUITETURA-IDENTIDADE-PLANOS.md`.

### Registro Nº 007
- **Data:** 2026-08-01
- **Etapa concluída:** Arquitetura de Identidade/Planos — Fase 2, Etapas 1–3
- **Descrição:** Etapa 1 (schema aditivo: `platformRole`, `MembershipRole.ADVISOR`, `Membership.status`, tabelas comerciais/auditoria) aplicada em produção sem alterar dado real (1085 entries, 47 wallets confirmados intactos). Etapa 2 (backend: `can()`, `hasFeature()`, `logAccess()`). Etapa 3 (frontend: seletor de workspace, `WorkspaceSwitcher`, cookie de workspace ativo).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** 126 testes automatizados passando (5 novos); zero mudança visual confirmada no navegador para o usuário real com 1 membership.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-01, Etapas 1–3).

### Registro Nº 008
- **Data:** 2026-08-01/02
- **Etapa concluída:** Catálogo comercial de planos
- **Descrição:** Planos reais definidos pelo CEO: `START`/`PLUS`/`PREMIUM`/`PREMIUM_NEGOCIOS`, em escada estrita de features, com mapeamento completo do roadmap de funcionalidades.
- **Solicitado por:** Felipe Hildebrando (CEO)
- **Executado por:** Claude Code
- **Evidência:** migrations aplicadas (`20260802003511`, `20260802004826`); nenhum `Subscription` real apontando para eles ainda (nenhum cliente pagante no momento).
- **Documentos relacionados:** `PROJECT_STATE.md` §10 (migrations 9 e 10).

### Registro Nº 009
- **Data:** 2026-08-04
- **Etapa concluída:** E-mail transacional resolvido + correção de bug de segurança de sessão
- **Descrição:** Domínio próprio `prospectafinance.com.br` configurado ponta a ponta (DNS, DKIM, DMARC, Brevo), destravando o problema histórico de e-mail. Corrigido `resolveActiveMembership()`: o fallback não filtrava por `status === "ACTIVE"`, então revogar uma membership não tinha efeito prático — 2 testes novos cobrindo o caso.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** cadastro real de teste confirmou e-mail chegando; 128 testes totais.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-04).

### Registro Nº 010
- **Data:** 2026-08-04
- **Etapa concluída:** Arquitetura de Identidade/Planos — Fase 2, Etapa 4 (onboarding ADVISOR)
- **Descrição:** Tela `/admin/clientes` para pré-cadastro de cliente de consultoria (workspace + assinatura + convite `TITULAR` + consultor opcional). Expiração real de convites (7 dias).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** verificado ao vivo via Admin API contra dados reais (criação, listagem, aceite simulado, cancelamento); 132 testes totais.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-04, "Fase 2 Etapa 4 RETOMADA E CONCLUÍDA").

### Registro Nº 011
- **Data:** 2026-08-05
- **Etapa concluída:** Onboarding completo de cliente + segurança de conta
- **Descrição:** Confirmação de senha no cadastro, e-mail transacional próprio do app, convite de cliente por e-mail real (com reenvio), exclusão de conta self-service e via admin, login social com Google.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testado ponta a ponta com conta real (`aventuras.saf@gmail.com`) — e-mail chegou, senha definida, workspace correto.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-05).

### Registro Nº 012
- **Data:** 2026-08-05
- **Etapa concluída:** Correção de incidente de e-mail em produção
- **Descrição:** `BREVO_API_KEY` salva na Vercel estava incorreta, causando falha silenciosa no envio de e-mails (convite de cliente e aviso de exclusão). Corrigido `catch` silencioso para `console.error` real; chave nova gerada e aplicada.
- **Solicitado por:** identificado durante uso real por Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** confirmado pelo usuário em produção — os dois e-mails chegaram.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-05, continuação); `RUNBOOK-OPERACIONAL.md` (incidentes conhecidos).

### Registro Nº 013
- **Data:** 2026-08-06
- **Etapa concluída:** Fechamento de rodada — testes finais em produção
- **Descrição:** Cadastro público, convite de cliente com consultor, `/definir-senha` e login com Google testados e confirmados em produção. Chave do Brevo trocada por precaução (chave antiga revogada).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** todos os fluxos testados ao vivo, sem bug conhecido em aberto ao fim do dia.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-06, "FECHAMENTO DO DIA").

### Registro Nº 014
- **Data:** 2026-08-06
- **Etapa concluída:** Gestão de consultores pelo admin
- **Descrição:** `assignAdvisor()` generalizado para qualquer workspace com titular (antes só no pré-cadastro); controle inline em `/admin/usuarios`; botão promover/remover admin da plataforma; nova aba `/admin/consultores` (visão em árvore de quem atende quem).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testado explicitamente (atribuir → trocar → voltar → remover, sem duplicação).
- **Documentos relacionados:** `PROJECT_STATE.md` (entradas de 2026-08-06, pós-fechamento).

### Registro Nº 015
- **Data:** 2026-08-07
- **Etapa concluída:** Conformidade com a LGPD
- **Descrição:** Página pública `/politica-privacidade`, checkbox obrigatório de aceite no cadastro (com trava retroativa via `/aceitar-politica`), campo `Profile.privacyPolicyAcceptedAt`, formulário de dados pessoais (CPF, telefone, endereço com CEP), exportação de dados em JSON/PDF incluindo lançamentos financeiros.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testado ao vivo contra a conta real do admin (JSON com 1085 lançamentos, PDF ~41KB, trava redirecionando conta antiga corretamente).
- **Ressalva registrada:** a política de privacidade contém placeholders `[ENTRE COLCHETES]` (razão social/CPF do controlador, dados do DPO) que só o dono do produto pode preencher — **não é peça jurídica validada** até isso ser feito e revisado por advogado.
- **Documentos relacionados:** `PROJECT_STATE.md` (entradas de 2026-08-07); `app/politica-privacidade/page.tsx`.

### Registro Nº 016
- **Data:** 2026-08-07
- **Etapa concluída:** Calendário de Compromissos
- **Descrição:** Nova aba Calendário em Compromissos — grade mensal, navegação por mês, painel de detalhe por dia, reaproveitando `markSettled()` já existente.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testado ao vivo contra dados reais (agosto/2026).
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-07).

### Registro Nº 017
- **Data:** 2026-08-08
- **Etapa concluída:** Menu lateral no mobile + correção de overflow horizontal
- **Descrição:** `Sidebar` também como drawer no mobile (substitui `MobileNav`, removido). Causa raiz completa do overflow horizontal/zoom indevido no mobile identificada e corrigida (`min-w-0` faltando em múltiplos containers flex/grid, incluindo o grid do Top 5). Ajustes visuais do calendário (fundo da grade, cores dos chips).
- **Solicitado por:** Felipe Hildebrando (após teste real no celular)
- **Executado por:** Claude Code
- **Evidência:** `document.body.scrollWidth === window.innerWidth` confirmado (375=375) após a correção; usuário confirmou em produção ("testei, ficou bom").
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-08).

### Registro Nº 018
- **Data:** 2026-08-08
- **Etapa concluída:** Criação da governança documental do projeto
- **Descrição:** A pedido explícito de Felipe Hildebrando, todas as ações operacionais e de desenvolvimento do sistema passam a ser formalmente escrituradas. Criados: `MANUAL-DE-USO.md` (manual do usuário final), `REGISTRO-OPERACIONAL.md` (este documento), `CHANGELOG.md` (histórico de mudanças), `TERMOS-DE-USO.md` (rascunho jurídico) e `RUNBOOK-OPERACIONAL.md` (procedimentos técnicos internos). Regra estabelecida: toda finalização de etapa atualiza esses documentos, para que ao fim do projeto toda a documentação esteja em dia.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** os 5 documentos publicados no repositório, na raiz do projeto, junto dos documentos já existentes.
- **Documentos relacionados:** todos os documentos listados acima.

### Registro Nº 019
- **Data:** 2026-08-08
- **Etapa concluída:** Preenchimento colaborativo dos placeholders do `TERMOS-DE-USO.md`
- **Descrição:** Percorridos os 9 placeholders do rascunho de Termos de Uso junto com o
  dono do produto. Definido: foro (Ribeirão Preto/SP), e-mail de contato
  (`admin@prospectafinance.com.br`, mesmo do DPO), natureza do vínculo com consultores
  (funcionário ou parceiro estratégico/societário da PROSPECTA Finance, não terceiro
  independente), esboço de direito de arrependimento de 7 dias (CDC Art. 49) e de
  mecanismo de inadimplência por **bloqueio de acesso** (não exclusão). Mantidos como
  **pendentes, explicitamente marcados**: titularidade legal do software (pessoa física
  vs. empresa), preços/periodicidade dos planos, SLA formal, e a cláusula de limitação de
  responsabilidade (que recebeu um esboço de estrutura, mas segue sinalizada como
  "pendente de revisão jurídica" por envolver risco de nulidade sob o Art. 51 do CDC).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** documento revisado seção a seção, com as respostas do usuário aplicadas
  diretamente ao texto.
- **Documentos relacionados:** `TERMOS-DE-USO.md`.

### Registro Nº 020
- **Data:** 2026-08-08
- **Etapa concluída:** Sincronização do e-mail do encarregado (DPO) entre `TERMOS-DE-USO.md` e a Política de Privacidade
- **Descrição:** O e-mail de contato definido no Registro Nº 019 (`admin@prospectafinance.com.br`) foi propagado para `app/politica-privacidade/page.tsx`, que ainda trazia `[e-mail de contato do encarregado — PREENCHER]` como placeholder. O nome do encarregado continua pendente (não informado).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** verificado no navegador (dev server local) — a página `/politica-privacidade` renderiza o e-mail correto.
- **Documentos relacionados:** `app/politica-privacidade/page.tsx`, `TERMOS-DE-USO.md` (Registro Nº 019).

---

### Registro Nº 021
- **Data:** 2026-08-08
- **Etapa concluída:** Fase 2 — Relatórios avançados
- **Descrição:** Retomada explicitamente pelo usuário (estava pausada desde 31/07). 5 telas
  novas em `/relatorios` (Analítico mês a mês, Balanço anual, Fluxo projetado, Despesas
  parceladas, Orçamento), cada uma reaproveitando ao máximo o motor de cálculo já existente
  em `lib/finance/` e acrescentando 4 funções puras novas e testadas
  (`monthlySeries`, `categoryMonthlyBreakdown`, `projectedBalance`, `openInstallmentGroups`).
  Única mudança de schema: tabela nova `Budget` (só aditiva — orçado por categoria/mês),
  com Server Action de upsert e edição sob demanda na tela, mesmo padrão já usado em
  Cadastros. Planejado previamente em modo de planejamento (plano aprovado antes de
  qualquer código, conforme `GUIA-DE-INICIO.md`).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** 147/147 testes automatizados (15 novos), `tsc --noEmit` limpo, `npm run
  build` de produção limpo (as 5 rotas novas aparecem no build). **Bug real encontrado e
  corrigido no caminho:** `BudgetTable.tsx` (Client Component) importava
  `formatCurrencyBRL` de `lib/format.ts`, que arrasta o runtime do Prisma (`Decimal`) —
  módulos Node (`node:crypto`/`node:fs`/...) que o webpack não consegue empacotar pro
  navegador; corrigido com um formatter de moeda local, sem essa dependência. Testado ao
  vivo pelo usuário (`npm run start`, build de produção, porta 3001, para não sobrecarregar
  a máquina com o watcher do modo dev) — confirmado funcionando ("testei, ficou bom").
- **Observação de processo:** durante a verificação, duas tentativas de usar a técnica de
  sessão sem senha (Admin API do Supabase) para testar as telas de forma autenticada foram
  bloqueadas pelo classificador de modo automático desta sessão — não houve tentativa de
  contornar; a verificação final foi feita pelo próprio usuário.
- **Documentos relacionados:** `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §13, plano em
  `functional-rolling-quiche.md`, `PROJECT_STATE.md` (entrada de 2026-08-08).

---

## Próximo número de registro: **022**

*(a próxima etapa concluída deve gerar uma nova entrada aqui, numerada sequencialmente,
seguindo o mesmo formato: Data · Etapa concluída · Descrição · Solicitado por · Executado
por · Evidência · Documentos relacionados)*
