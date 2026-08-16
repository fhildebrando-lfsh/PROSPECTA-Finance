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

### Registro Nº 022
- **Data:** 2026-08-08
- **Etapa concluída:** Commit, push e confirmação em produção do Registro Nº 021 (Fase 2)
- **Descrição:** O trabalho descrito no Registro Nº 021 foi commitado (`ca370c3`) e enviado
  a `origin/master`, disparando o deploy automático da Vercel. Fecha o ciclo completo da
  etapa: planejamento → implementação → teste local → commit/push → confirmação em
  produção.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `git push origin master` bem-sucedido; usuário confirmou o deploy em
  produção funcionando ("conferi, o deploy na Vercel terminou, tudo ok").
- **Documentos relacionados:** Registro Nº 021, `PROJECT_STATE.md` (entrada de 2026-08-08).

---

### Registro Nº 023
- **Data:** 2026-08-08
- **Etapa concluída:** Fase 3 (Bens/Metas) + Dívidas + Relatórios/Patrimônio em PDF
- **Descrição:** Depois de testar Bens e Metas (Fase 3 original), o usuário pediu, na mesma
  mensagem: botões de Editar/Salvar/Excluir mais visíveis em Bens e Metas; a Reserva de
  Emergência do Painel vinculada de fato a uma Meta (não aparecer se não houver Meta
  criada); uma nova tela **Dívidas** dentro de Patrimônio (parcelamentos de despesa com
  2+ parcelas ainda em aberto — financiamentos, compras parceladas — excluindo o que já
  foi quitado); e botão **"Baixar PDF"** em todas as telas de Relatórios e Patrimônio (8
  no total). Dívidas reaproveita 100% o motor já existente de
  `lib/finance/open-installments.ts` (nenhuma entidade nova no banco) com 2 funções novas
  (`totalRemainingDebt`, `monthlyDebtCommitment`). PDFs usam `pdfkit` (já em produção via
  exportação LGPD), com cabeçalho/rodapé de marca compartilhado
  (`lib/reports/pdf-shared.ts`) e um builder por relatório.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** testes automatizados, `tsc --noEmit` e `npm run build` limpos; 2 PDFs
  gerados e conferidos manualmente (inclusive correção de um bug de exibição — valores de
  dívida apareciam com sinal negativo em contexto de magnitude, corrigido com `.abs()`).
  Usuário confirmou em teste manual ("testei, ficou bom").
- **Documentos relacionados:** plano em `functional-rolling-quiche.md`,
  `PROJECT_STATE.md` (entrada de 2026-08-08).

---

### Registro Nº 024
- **Data:** 2026-08-08
- **Etapa concluída:** Refinamentos de Patrimônio/Metas/Dívidas, correção de bug real de
  dados, Painel modulável e formalização da linguagem em todo o sistema
- **Descrição:** Rodada de 5 frentes a partir de um feedback único e consolidado do
  usuário: **(A)** correção do bug real que deixava lançamentos importados por CSV sem
  `groupId` — invisíveis em "Despesas parceladas" e "Dívidas" — corrigida no importador e
  retroativamente por script de backfill (24 grupos criados, 174 lançamentos corrigidos,
  2 clusters ambíguos deixados de fora para revisão manual, sem risco de mesclar dados de
  compras diferentes); **(B)** Bens: cartão travado até clicar "Editar" + gráfico de
  evolução patrimonial (valor acumulado por data); **(C)** Metas: mesma trava de edição +
  checkbox "Mostrar no Painel" (nova coluna `Goal.pinnedToPainel`) + remoção do cálculo
  próprio de Reserva de Emergência do Painel (usava despesa média × 6 meses e mostrava um
  valor incorreto — R$ 28.918,55 em vez da meta real de R$ 1.000,00 cadastrada pelo
  usuário) — a seção final do Painel virou "Metas", 100% derivada de `Goal` de verdade;
  **(D)** Dívidas: gráfico de diminuição do saldo devedor combinado ao longo do tempo;
  **(E)** revisão de linguagem informal ("pra"/"pro" → "para"/"para o"/"para a") em **63
  arquivos** de todo o sistema — telas, mensagens de erro, e-mails transacionais e
  comentários de código — a pedido explícito do usuário ("a linguagem do sistema deve ser
  totalmente formal e de acordo com a norma culta da língua portuguesa"), confirmado por
  ele para cobrir também a documentação interna do código, não só o texto visível ao
  usuário final.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** 162 testes automatizados passando (2 novos: `patrimonyEvolution`,
  `debtDeclineTimeline`), `tsc --noEmit` limpo, `npm run build` de produção limpo (51
  rotas). Servidor de produção local (`npm run start -- -p 3001`) reiniciado com o build
  final para o usuário testar.
- **Documentos relacionados:** plano em `functional-rolling-quiche.md`,
  `PROJECT_STATE.md` (entrada de 2026-08-08), `CHANGELOG.md` (2026-08-08).

---

### Registro Nº 025
- **Data:** 2026-08-08
- **Etapa concluída:** Correção definitiva dos 2 clusters "MERCADO LIVRE" deixados de fora
  pelo backfill do Registro Nº 024
- **Descrição:** O usuário reportou que lançamentos "MERCADO LIVRE" precisavam aparecer em
  Dívidas por refletirem o orçamento real. Investigação confirmou que os 2 clusters
  ambíguos do backfill anterior eram, na verdade, **múltiplas compras diferentes** que
  coincidiam em carteira+categoria+descrição+total de parcelas (a descrição genérica da
  loja não distingue uma compra da outra) — não um problema de dado corrompido. A
  heurística de agrupamento (`lib/import/group-installments.ts::clusterInstallmentRows()`,
  usada tanto pela importação quanto pelo backfill) ganhou uma dimensão nova: dentro do
  mesmo cluster, subdivide por **valor da parcela**, com tolerância de 2 centavos (absorve
  só o resto da divisão do total por N parcelas iguais — não o suficiente para confundir
  duas compras de valores diferentes). Re-executado `scripts/backfill-installment-groups.ts`
  sobre os candidatos que ainda restavam sem `groupId`: **7 grupos novos criados, 54
  lançamentos corrigidos, nenhum cluster ambíguo restante** — as 4 compras parceladas reais
  de "MERCADO LIVRE" (12x cada, workspace do titular) agora aparecem em Dívidas
  corretamente separadas, e 2 parcelas órfãs de verdade (sem par — provável lançamento
  incompleto na fonte original) permaneceram sem grupo, como esperado.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** 2 testes novos em `tests/import/group-installments.test.ts` (separação por
  valor + tolerância de centavo, 8 testes no total no arquivo), 165 testes automatizados no
  total, `tsc --noEmit` e `npm run build` limpos. Verificação direta no banco (script
  descartável) confirmou os 4 grupos "MERCADO LIVRE" com `openInstallmentGroups()`: R$
  7.750,89 em aberto entre eles, de um total de R$ 21.100,60 de dívida aberta no workspace.
  Servidor de produção local reiniciado com o build final.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-08),
  `REGISTRO-OPERACIONAL.md` (Registro Nº 024, backfill original).

---

### Registro Nº 026
- **Data:** 2026-08-08
- **Etapa concluída:** Nova aba "Incidentes" em Compromissos — revisão de lançamentos
  parcelados que a heurística de agrupamento não conseguiu combinar
- **Descrição:** O usuário pediu uma aba dedicada a "erros de lançamento" que precisam de
  edição, citando como exemplo justamente as parcelas órfãs (sem par correspondente) que o
  Registro Nº 025 tinha deixado de fora de propósito. Nova coluna aditiva
  `Entry.incidentAcknowledgedAt` (migration `20260808210858_incident_acknowledged_at`) —
  marca que um humano revisou e aceitou a linha como está. Novo `lib/finance/incidents.ts`
  (`isInstallmentIncident()`/`installmentIncidents()`, puro e testado): um lançamento é
  "incidente" quando diz fazer parte de um parcelamento (`installmentTotal >= 2`) mas não
  tem `groupId` — órfão de verdade ou cluster ambíguo, mesma condição expressa como filtro
  de banco na nova tela `/compromissos/incidentes`. Cada linha aparece num cartão com o
  motivo (ex.: "Parcela 12 de 12 sem outras parcelas correspondentes encontradas") e dois
  botões: **"Confirmar que está correto"** (marca `incidentAcknowledgedAt`, sai da lista
  sem alterar nada) e **"Editar"** (formulário completo — carteira, categoria,
  subcategoria, responsável, descrição, valor com inversão de sinal, datas, situação, e
  **número/total de parcelas**, que a edição normal de Lançamentos não permite tocar).
  Depois de salvar uma edição, a Server Action tenta reagrupar automaticamente os
  incidentes restantes do workspace com a mesma heurística do importador/backfill — se a
  correção fizer a parcela combinar com uma irmã real, as duas saem da lista sozinhas.
  Terceira aba do menu "Compromissos" (Lista/Calendário/Incidentes), com a barra de abas
  extraída para `CompromissosTabs.tsx` (compartilhada pelas 3 páginas, antes duplicada em
  cada uma).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** 6 testes novos em `tests/finance/incidents.test.ts` (171 no total),
  `tsc --noEmit` e `npm run build` limpos (53 rotas, incluindo `/compromissos/incidentes`).
  Verificado direto no banco: a tela lista corretamente os 4 incidentes reais do workspace
  do titular — as 2 parcelas órfãs de "MERCADO LIVRE" (R$ 72,71 e R$ 132,53) do Registro
  Nº 025, mais 1 parcela órfã de 10x (R$ 281,52) e 1 de outra loja não notada antes (R$
  54,99) — confirmando que a funcionalidade generaliza corretamente além do caso que a
  motivou. Servidor de produção local reiniciado com o build final.
- **Documentos relacionados:** `PROJECT_STATE.md` (entrada de 2026-08-08),
  `REGISTRO-OPERACIONAL.md` (Registro Nº 025), `MANUAL-DE-USO.md` (seção 10 "Compromissos"
  atualizada).

---

### Registro Nº 027
- **Data:** 2026-08-08
- **Etapa concluída:** Commit e push dos Registros Nº 023–026 (Fase 3, Dívidas+PDF,
  refinamentos, correção MERCADO LIVRE, Compromissos → Incidentes)
- **Descrição:** Todo o trabalho descrito nos Registros Nº 023 a 026 — desde Patrimônio
  (Bens/Metas) até a nova aba Incidentes — ficou acumulado sem commit intermediário ao
  longo da sessão. Consolidado num único commit (`061aef2`) e enviado a `origin/master`.
  Excluído do commit o diretório `.tmp.driveupload/` (artefato de sincronização externa
  presente na pasta de trabalho, sem relação com o projeto).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `git push origin master` bem-sucedido (`ca370c3..061aef2`). 124 arquivos
  alterados — 171 testes automatizados, `tsc --noEmit` e `npm run build` já confirmados
  limpos antes do commit (ver Registros Nº 023–026).
- **Documentos relacionados:** Registros Nº 023, 024, 025, 026.

---

### Registro Nº 028
- **Data:** 2026-08-08
- **Etapa concluída:** Confirmação em produção dos Registros Nº 023–027
- **Descrição:** Usuário testou em produção (`prospecta-finance.vercel.app`) o conjunto
  completo entregue nesta rodada — Patrimônio (Bens/Metas), Dívidas, PDFs, Painel modular,
  correção do bug de `groupId`/MERCADO LIVRE e a nova aba Compromissos → Incidentes — e
  confirmou que está funcionando ("testei, ficou bom"). Fecha de ponta a ponta o ciclo
  desta etapa: planejamento → implementação → testes automatizados → build → commit → push
  → deploy confirmado → teste manual do usuário em produção.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** confirmação direta do usuário no chat; deploy de produção verificado como
  `Ready` via `vercel ls` antes da confirmação (Registro Nº 027).
- **Documentos relacionados:** Registros Nº 023–027.

---

### Registro Nº 029
- **Data:** 2026-08-08
- **Etapa concluída:** Bug real corrigido — seletor de workspace listava membership
  REVOKED, causando erro ao trocar para "prospecta (cliente)"
- **Descrição:** Usuário (atuando como consultor) reportou erro ("Algo deu errado") ao
  tentar entrar no workspace "prospecta (cliente)" pelo seletor, enquanto trocar para
  "Luis Felipe da Silva Hildebrando (pessoal)" funcionava normalmente. Investigado
  diretamente no banco: a Membership ADVISOR do usuário para "prospecta (cliente)" foi
  **revogada** em 2026-08-07 (o consultor daquele workspace foi trocado para Daniela
  Araújo, via `assignAdvisor()` — revogar nunca apaga a relação anterior, só muda o
  `status`). Causa raiz: `app/(app)/layout.tsx` construía a lista de workspaces do
  seletor a partir de **todas** as `profile.memberships`, sem filtrar por
  `status === "ACTIVE"` — uma membership REVOKED continuava aparecendo como opção
  clicável. Ao escolhê-la, `setActiveWorkspace()` (que já checa `status === "ACTIVE"`
  corretamente) rejeitava com um `throw new Error(...)` genérico, que o Next.js
  capturava no `app/error.tsx` — daí a tela de erro. Bug pré-existente à sessão atual
  (parte do seletor de workspace multi-membership da Arquitetura de Identidade/Planos,
  Fase 2 Etapa 3), nunca antes exercido em produção com uma membership revogada
  misturada a outras ativas para o mesmo usuário — só ficou visível agora que essa
  combinação de dados passou a existir de verdade. Corrigido com um filtro
  `.filter((m) => m.status === "ACTIVE")` antes de montar `membershipOptions`.
  Verificado que os outros lugares que leem `profile.memberships` (`minha-conta/page.tsx`)
  já filtravam corretamente antes de qualquer ação clicável — só o seletor tinha o gap.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** reproduzido diretamente no banco (script descartável) e confirmado que
  a correção remove "prospecta (cliente)" da lista de opções do seletor sem afetar os
  workspaces com membership ativa. 171 testes automatizados, `tsc --noEmit` e
  `npm run build` limpos (53 rotas).
- **Documentos relacionados:** `app/(app)/layout.tsx`, `lib/workspace/switch.ts`,
  `lib/workspace/advisor.ts`, `PROJECT_STATE.md` (entrada de 2026-08-08).

---

### Registro Nº 030
- **Data:** 2026-08-08
- **Etapa concluída:** Confirmação em produção do Registro Nº 029
- **Descrição:** Usuário testou em produção, entrando como consultor no workspace
  "prospecta (cliente)" — antes gerava a tela "Algo deu errado", agora a membership
  revogada não aparece mais como opção do seletor. Confirmou que está funcionando
  ("testei, ficou bom").
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** confirmação direta do usuário no chat, após deploy do commit `5699b6a`.
- **Documentos relacionados:** Registro Nº 029.

---

### Registro Nº 031
- **Data:** 2026-08-08
- **Etapa concluída:** Código do cliente (`Workspace.clientCode`) — coluna "Código" em
  Admin → Usuários e identificação do cliente no seletor de workspace
- **Descrição:** Usuário pediu um código imutável por cliente (pessoa ou família) para
  diferenciar clientes de nomes parecidos. Cada `Workspace` já representa exatamente
  uma pessoa ou família (§9) — o código foi adicionado ali, não em `Profile` (um
  profile pode ter acesso a vários workspaces; o workspace é a unidade "cliente").
  `Workspace.clientCode Int @unique @default(autoincrement())` (migration manual
  `20260808220000_workspace_client_code`, aditiva): coluna criada nullable, backfill
  sequencial por `created_at ASC` para os 8 workspaces existentes (0001 = mais antigo),
  depois `NOT NULL` + `UNIQUE` + sequence do Postgres assumindo o próximo valor — a
  sequence garante o código pra qualquer workspace novo, inclusive os criados pelo
  trigger `on_auth_user_created` (que só insere `name`, nunca passa por Prisma). Nova
  função `lib/format.ts::formatClientCode()` (4 dígitos com zero à esquerda, "0001"),
  testada. **Admin → Usuários**: nova coluna "Código" antes de "Nome", mostrando o
  código do workspace onde a pessoa é TITULAR (o "próprio" dela). **Seletor de
  workspace** (`app/(app)/layout.tsx`): para memberships ADVISOR (workspaces de
  cliente), o rótulo não usa mais `workspace.name` — usa
  `"{código}, {dois primeiros nomes do titular} (cliente)"` (ex.: "0008, Luis Felipe
  (cliente)"), buscando o nome do titular via uma query adicional por
  `workspaceId in (...)` só quando há memberships ADVISOR.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** migration aplicada e conferida — 8 workspaces existentes numerados
  0001–0008 em ordem de criação; testado que um `INSERT` novo recebe o próximo código
  da sequence corretamente. 2 testes novos para `formatClientCode` (173 no total),
  `tsc --noEmit` e `npm run build` limpos. Rótulos do seletor conferidos direto no
  banco com dados reais do usuário: "0008, Luis Felipe (cliente)" e "0007, Prospecta 1
  (cliente)".
- **Documentos relacionados:** `prisma/schema.prisma`, `lib/format.ts`,
  `app/(app)/layout.tsx`, `app/(app)/admin/usuarios/page.tsx`, `PROJECT_STATE.md`
  (entrada de 2026-08-08).

---

### Registro Nº 032
- **Data:** 2026-08-08
- **Etapa concluída:** Confirmação em produção do Registro Nº 031 (Código do cliente) e
  encerramento do dia
- **Descrição:** Usuário testou em produção — coluna "Código" em Admin → Usuários e o
  seletor de workspace identificando clientes por código + nome do titular — e
  confirmou que está funcionando ("testei, ficou bom"). Pediu para documentar tudo e
  encerrar o dia. Fecha, de ponta a ponta, o último item pendente de documentação desta
  sessão: todos os Registros Nº 021–031 já tinham `PROJECT_STATE.md`/`CHANGELOG.md`
  atualizados; este registro consolida a confirmação final e o fechamento do dia (ver
  `PROJECT_STATE.md`, bloco "FECHAMENTO DO DIA").
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** confirmação direta do usuário no chat, após deploy do commit `1f3be65`.
- **Documentos relacionados:** Registros Nº 021–031, `PROJECT_STATE.md` (entrada de
  2026-08-08).

---

### Registro Nº 033
- **Data:** 2026-08-08
- **Etapa concluída:** Importação de OFX (Fase 2 da especificação, item que ainda faltava)
- **Descrição:** Usuário pediu para implementar a importação de extrato bancário em OFX,
  prevista desde a especificação original ("importação de OFX com sugestão de
  categorização", §3/Fase 2) mas nunca construída — só CSV era aceito (§18.1). Planejado
  em modo de planejamento antes do código, com 2 perguntas de escopo confirmadas com o
  usuário: (1) quando não houver histórico de categoria para uma descrição, pedir 2
  categorias padrão no import (nunca bloquear a linha) e destacar essas linhas para
  revisão; (2) usar o cálculo de fatura (fechamento/vencimento) já existente quando o
  arquivo for de cartão de crédito.

  **Reaproveitamento total do pipeline de CSV já testado**: um OFX é convertido em linhas
  `Record<string,string>` com os mesmos cabeçalhos canônicos que
  `column-mapping.ts::KNOWN_HEADERS` já reconhece — o resto (validação, resolução de IDs,
  deduplicação, agrupamento de parcelas, transação atômica, revert de lote) roda sem
  nenhuma mudança. Trabalho novo: `lib/import/parse-ofx.ts` (parser tolerante a SGML
  solto — a maioria dos bancos brasileiros exporta OFX 1.x sem fechamento de tag),
  `lib/import/suggest-category-bulk.ts` (sugestão de categoria por histórico de
  descrição, em lote — mesma ideia do lançamento rápido), `lib/import/ofx-to-rows.ts`
  (síntese das linhas — natureza pelo sinal, categoria sugerida ou padrão, recorrência
  fixa "avulsa", vencimento roteado por fatura quando é cartão de crédito, situação por
  data), `lib/import/ofx-import.ts` (orquestração, usada igual por preview e commit).
  `lib/finance/card.ts::statementWindowForDate()` generaliza `currentStatementWindow()`
  pra uma data de referência qualquer (comportamento idêntico pra "hoje").

  **Nova coluna `Entry.autoReviewReason`** (aditiva) generaliza o conceito de "Incidente"
  (Registro Nº 026, antes só parcela órfã) — `lib/finance/incidents.ts::isEntryIncident()`
  passa a cobrir as duas origens. A tela Compromissos → Incidentes, já construída hoje,
  passou a listar as duas sem nenhuma mudança estrutural (Confirmar/Editar já serviam).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** 21 testes novos (215 no total — parser OFX, síntese de linhas, cartão de
  crédito, incidentes), `tsc --noEmit` e `npm run build` limpos (52 rotas). Verificação
  ponta a ponta contra o banco real (script descartável, sem gravar nada): um extrato de
  amostra com "MERCADO LIVRE" confirmou a sugestão batendo com a categoria real já usada
  no workspace, uma descrição nova confirmou a categoria padrão + marcação de revisão, e
  as linhas sintetizadas passaram pela validação/resolução real sem nenhum erro
  inesperado. **Bug real encontrado e corrigido no caminho**: a migration manual do
  Registro Nº 031 (`client_code`) quebrava a replicação em banco vazio (`setval` para 0,
  fora dos limites de uma sequence) — só aparece ao rodar `prisma migrate dev` de novo
  (não afeta o banco de produção, que já tinha dados); corrigido preservando o arquivo já
  aplicado e criando a migration seguinte pelo caminho manual (`migrate deploy`, já usado
  nesta sessão por causa do ambiente não-interativo). Servidor de produção local
  reiniciado com o build final.
- **Documentos relacionados:** `functional-rolling-quiche.md` (plano), `PROJECT_STATE.md`
  (entrada de 2026-08-08), `CHANGELOG.md`, `MANUAL-DE-USO.md` (seções 8 e 9).

---

### Registro Nº 034
- **Data:** 2026-08-08
- **Etapa concluída:** Bug real corrigido — banco de dados trocado do pooler de sessão
  para o pooler de transação (elimina o teto de 15 conexões simultâneas)
- **Descrição:** Usuário reportou "Algo deu errado" em `/lancamentos` no celular, logo
  depois do deploy da correção de contraste (Registro anterior). Investigado direto no
  banco: o erro real era `max clients reached in session mode - max clients are limited
  to pool_size: 15` — o pooler de **sessão** do Supabase (porta 5432), usado desde o
  início do projeto, limita o projeto inteiro a 15 conexões simultâneas, somando
  instâncias serverless da Vercel em produção **e** qualquer script rodado localmente
  contra o mesmo banco. Já era um débito técnico conhecido e documentado (§23 do
  `PROJECT_STATE.md`, causa raiz de uma queda real em 2026-08-01) — "fora do alcance do
  assistente" numa sessão anterior, porque a correção exige editar variável de ambiente
  direto no painel da Vercel. Usuário autorizou explicitamente fazer a troca por aqui.

  **Correção:** `DATABASE_URL` trocado do pooler de **sessão** (porta 5432) para o pooler
  de **transação** (porta 6543) — mesmo host/usuário/senha, só a porta muda; o pooler de
  transação multiplexa conexões de verdade no lado do Supabase, sem o teto de 15 por
  cliente. Atualizado em `.env.local` (local) e nas variáveis de ambiente da Vercel
  (`Production` e `Preview`, via `vercel env rm`/`vercel env add`). Comentário de
  `lib/db/prisma.ts` atualizado para refletir a mudança (o `max: 3` do adapter continua,
  agora só como precaução geral, não mais pra evitar estourar um teto duro).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** verificado direto no banco antes e depois — a mesma query de
  `/lancamentos` (200 entries, 6 relações) e 10 consultas concorrentes simultâneas
  passaram sem erro contra o pooler de transação; a versão anterior (sessão) já tinha
  falhado uma vez nesta mesma tarde sob uso concorrente normal. `vercel env ls` confirma
  a variável nova em `Production` e `Preview`.
- **Documentos relacionados:** `lib/db/prisma.ts`, `.env.local` (não versionado),
  `PROJECT_STATE.md` (§23 "Débitos técnicos", entrada resolvida; entrada de 2026-08-08).

### Registro Nº 035
- **Data:** 2026-08-09
- **Etapa concluída:** Integração com o Google Agenda (Compromissos → Calendário)
- **Descrição:** Usuário pediu, depois de confirmar a correção do pooler de conexões
  (Registro Nº 034), a viabilidade e implementação de sincronização do sistema com o
  Google Agenda de cada cliente — um sentido só (sistema → Google), vínculo por
  workspace, com autorização própria do cliente. Confirmado com 2 perguntas: compromisso
  liquidado remove o evento da agenda (não marca como concluído); sincronização em tempo
  real, não em lote.

  **Arquitetura:** OAuth2 próprio (Google Cloud, escopo `calendar.events`), separado do
  "Entrar com Google" do login (que usa o broker do Supabase Auth, só identidade). Cada
  workspace ganha um calendário **dedicado** ("PROSPECTA Finance") na conta do cliente —
  desconectar vira 1 chamada (apagar o calendário) em vez de apagar evento por evento.
  Tokens (`GoogleCalendarConnection.accessToken`/`refreshToken`) gravados cifrados em
  repouso (AES-256-GCM, `lib/security/crypto.ts`, chave `TOKEN_ENCRYPTION_KEY` nova).
  `Entry.googleEventId` liga um lançamento ao evento correspondente. Sincronização
  (`lib/integrations/google-calendar/sync.ts`) plugada nos pontos de escrita já
  centralizados (criar, liquidar, editar/excluir via API, importar CSV/OFX, reverter
  importação, editar incidente), sempre via `after()` do Next.js — não bloqueia a
  resposta ao usuário — e nunca lança exceção (melhor esforço; falha na API do Google
  vira log, não quebra o lançamento real).

  **Infraestrutura, achado durante a etapa:** `prisma migrate deploy`/`status` passou a
  travar indefinidamente nesta máquina (o binário `schema-engine-windows.exe` ficava
  parado em `cli can-connect-to-database`, mesmo com o banco alcançável em ~100ms via
  `pg` puro — indício de firewall/antivírus local bloqueando especificamente esse
  executável, não um problema do projeto nem do Supabase). Contornado aplicando o SQL da
  migration diretamente via `pg` e registrando a entrada em `_prisma_migrations` à mão
  (mesmo formato que o Prisma gravaria), dentro de uma transação. Documentado como débito
  técnico (§23 do `PROJECT_STATE.md`) para as próximas migrations, caso o travamento
  persista numa sessão futura.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (206/206), `tsc --noEmit` limpo, `npm run build` de produção
  concluído com as 2 rotas novas (`/api/integrations/google-calendar/{connect,callback}`)
  listadas. Migration aplicada e conferida direto no banco (`_prisma_migrations`).
  `TOKEN_ENCRYPTION_KEY` gerada e configurada em `.env.local` e na Vercel
  (`Production`/`Preview`, via `vercel env add`). Acesso não autenticado a
  `/compromissos/calendario` redireciona para `/login` sem erro. **Fluxo OAuth completo
  (autorizar no Google, ver o calendário/evento sendo criado de verdade) ainda não
  testado ponta a ponta** — bloqueado até o usuário criar as credenciais no Google Cloud
  Console (checklist em `PROJECT_STATE.md` §19) e informar
  `GOOGLE_CALENDAR_CLIENT_ID`/`GOOGLE_CALENDAR_CLIENT_SECRET`.
- **Documentos relacionados:** `prisma/schema.prisma` (model `GoogleCalendarConnection`,
  `Entry.googleEventId`), `prisma/migrations/20260809000000_google_calendar_integration/`,
  `lib/security/crypto.ts`, `lib/integrations/google-calendar/{client,sync}.ts`,
  `app/api/integrations/google-calendar/{connect,callback}/route.ts`,
  `app/(app)/compromissos/calendario/{page.tsx,actions.ts}`, `MANUAL-DE-USO.md` §9,
  `PROJECT_STATE.md` §19/§23.

---

### Registro Nº 036
- **Data:** 2026-08-09
- **Etapa concluída:** Google Agenda — bug real corrigido (escopo `calendar.calendars`
  faltando) + primeira conexão real verificada ponta a ponta
- **Descrição:** Depois do Registro Nº 035 (código pronto, mas fluxo OAuth nunca testado
  de verdade por faltar credencial), o usuário configurou o cliente OAuth no Google Cloud
  e tentou conectar — falhou repetidamente com `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` na
  chamada `calendar.v3.Calendars.Insert`, mesmo com a tela de consentimento do Google
  mostrando a permissão de Agenda corretamente e o usuário autorizando.

  **Diagnóstico:** descartadas, em ordem, três causas prováveis mas erradas —
  `redirect_uri` incorreto (real, mas já corrigido antes deste registro: as URIs tinham
  sido coladas no campo "Origens JavaScript autorizadas" em vez de "URIs de
  redirecionamento autorizados"), escopo mal configurado na tela de consentimento
  (conferido, estava correto) e propagação lenta da configuração no Google (esperado, não
  era isso). Causa raiz encontrada só depois de instrumentar o código para logar o `scope`
  que o Google efetivamente devolve no token (`lib/integrations/google-calendar/
  client.ts::exchangeCodeForTokens` passou a checar e logar isso, mudança permanente, não
  só diagnóstica) — o token **tinha** `calendar.events` concedido, confirmando que o
  problema não era a concessão em si, mas que **criar um calendário novo
  (`Calendars.insert`) exige um escopo diferente de criar/editar eventos**:
  `https://www.googleapis.com/auth/calendar.calendars`. O desenho original só previa
  `calendar.events`, insuficiente para a etapa de criação do calendário dedicado.
- **Correção:** `SCOPES` em `client.ts` passou a pedir os dois escopos
  (`calendar.events` + `calendar.calendars`); `REQUIRED_SCOPES` valida ambos logo após a
  troca do código OAuth, falhando cedo com mensagem clara em vez de deixar a 403 genérica
  da Calendar API aparecer só depois. Usuário adicionou o escopo novo em "Acesso a dados"
  no Google Auth Platform, revogou o acesso anterior (`myaccount.google.com/permissions`)
  e reconectou — sucesso na primeira tentativa depois da correção.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** log de produção confirma escopos concedidos incluindo
  `.../auth/calendar.calendars` e `.../auth/calendar.events`, callback em nível `info`
  (sem erro). Conferido direto no banco: `google_calendar_connections` com 1 linha,
  `google_calendar_id` preenchido com um calendário real
  (`...@group.calendar.google.com`), `revoked_at` nulo. Dois deploys de produção
  (`vercel --prod`) durante a investigação, cada um `tsc --noEmit` limpo antes.
- **Documentos relacionados:** `lib/integrations/google-calendar/client.ts`,
  `PROJECT_STATE.md` §19 (nota de pendência resolvida), Registro Nº 035 (etapa original).

---

### Registro Nº 037
- **Data:** 2026-08-09
- **Etapa concluída:** Calendário de Compromissos redesenhado (sugestão externa aplicada
  com correção) + jargão interno ("§N") removido de textos voltados ao usuário
- **Descrição:** Usuário pediu uma sugestão de layout ao Google Gemini para o calendário de
  Compromissos e trouxe a análise para ser aplicada. Avaliada e aplicada com uma correção:
  a sugestão presumiu, sem acesso ao código, que a cor vermelho/verde dos eventos
  representava despesa/receita — na verdade sempre representou vencido (vermelho) vs.
  dentro do prazo (verde); mantida essa lógica real, só trocado o estilo visual (bloco
  sólido → linha com barra colorida à esquerda, cabeçalho dos dias da semana com mais
  contraste, dias de outro mês com fundo mais escuro). A sugestão de sombra no botão "+"
  flutuante já estava implementada, nenhuma mudança necessária ali.

  Na mesma conversa, o usuário reportou que a descrição da aba Calendário trazia
  "(§13)" — numeração interna da especificação técnica, sem sentido para quem usa o
  sistema. Corrigido ali e, a pedido explícito ("pode alterar em todo o sistema que for
  identificado inconformidade de escrita"), levantada uma varredura em todo o código por
  esse mesmo padrão em texto renderizado (não em comentário — comentários internos como
  `§20`, `§7` etc. continuam normalmente, são para quem lê o código, não para quem usa o
  sistema). Encontradas mais 3 ocorrências: Compromissos → Lista, Importar planilha e
  Transferir entre carteiras (essa última também tinha "R5", outra referência interna) —
  todas reescritas em português comum.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `tsc --noEmit` limpo, `npm test` (206/206), deploy de produção
  (`vercel --prod`) concluído. Verificação visual ao vivo não foi possível nesta etapa — a
  técnica de sessão sem senha (Admin API + magic link) foi bloqueada pelo classificador de
  permissões desta sessão; usuário orientado a conferir diretamente no navegador.
- **Documentos relacionados:** `app/(app)/compromissos/calendario/page.tsx`,
  `app/(app)/compromissos/page.tsx`, `app/(app)/compromissos/incidentes/page.tsx`,
  `app/(app)/lancamentos/importar/page.tsx`, `app/(app)/lancamentos/transferir/page.tsx`.

---

### Registro Nº 038
- **Data:** 2026-08-09
- **Etapa concluída:** Bug real corrigido — grade do calendário de Compromissos não cabia
  em telas de celular
- **Descrição:** Logo depois do redesenho visual (Registro Nº 037), o usuário reportou que
  o calendário mensal "não está proporcionalmente aberto na tela do app pelo celular" e
  parecia amador. Causa raiz: a grade de 7 colunas tinha `min-width: 608px` fixo (um
  resquício de quando a única forma de caber os textos dos eventos era rolar a tabela para
  o lado) — maior que a largura de qualquer tela de celular, forçando rolagem horizontal e
  cortando o calendário visualmente ao abrir.
- **Correção:** removida a largura mínima fixa — a grade agora é totalmente fluida, sempre
  cabe na largura da tela, sem rolagem horizontal em nenhum tamanho de dispositivo. Como
  texto de compromisso não cabe de forma legível em 7 colunas numa tela estreita de
  celular, criada uma visualização compacta específica para telas pequenas: cada dia
  mostra só indicadores coloridos (pontinhos — vermelho para vencido, verde para dentro do
  prazo) em vez do texto truncado; tocar no dia continua abrindo a lista completa abaixo da
  grade (recurso que já existia). Em telas de desktop (`sm:` e acima) nada muda — continua
  mostrando o texto do compromisso, como no Registro Nº 037. Cabeçalho de dias da semana,
  espaçamento interno das células e os botões de navegação (Anterior/Próximo) também
  ganharam tamanhos reduzidos e `flex-wrap` para telas estreitas.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `tsc --noEmit` limpo, `npm test` (206/206), deploy de produção
  (`vercel --prod`) concluído. Usuário confirmou visualmente no próprio celular após o
  deploy ("perfeito, ficou bom").
- **Documentos relacionados:** `app/(app)/compromissos/calendario/page.tsx`, Registro Nº
  037 (redesenho visual desta mesma etapa, na mesma conversa).

---

### Registro Nº 039
- **Data:** 2026-08-09
- **Etapa concluída:** Relatório "Analítico mês a mês" removido (redundante com Balanço
  anual)
- **Descrição:** Usuário identificou que a tela "Analítico mês a mês" (Receita/Despesa/
  Investimento/Saldo lado a lado, por mês) ficou redundante — a mesma tabela ("sintético")
  já existe dentro de "Balanço anual", que ainda soma a ela o descritivo por categoria.
  Conferido no código antes de remover: as duas telas usavam exatamente a mesma consulta e
  o mesmo componente (`MonthlyTotalsTable`), confirmando que não havia nenhuma informação
  exclusiva do Analítico.
- **Correção:** removidos a página (`app/(app)/relatorios/analitico/`), a rota de PDF
  (`app/api/relatorios/analitico/pdf/`) e o builder de PDF
  (`lib/reports/pdf/analitico.ts`) — nada reaproveitado por outra tela, então excluídos por
  completo, não só desativados. Aba tirada de `app/(app)/relatorios/layout.tsx` e do menu
  lateral (`components/Sidebar.tsx`, ícone `CalendarRange` também removido, sem mais uso).
  `MANUAL-DE-USO.md` §10 atualizado ("Cinco telas" → "Quatro telas", descrição de "Balanço
  anual" absorveu a frase que descrevia o sintético).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `tsc --noEmit` limpo, `npm test` (206/206), `npm run build` de produção
  concluído sem `/relatorios/analitico` nem `/api/relatorios/analitico/pdf` na lista de
  rotas.
- **Documentos relacionados:** `app/(app)/relatorios/layout.tsx`, `components/Sidebar.tsx`,
  `MANUAL-DE-USO.md` §10.

---

### Registro Nº 040
- **Data:** 2026-08-09
- **Etapa concluída:** Cartões de Crédito — cadastro completo, fatura, análise de
  benefícios e infraestrutura de importação de fatura em PDF
- **Descrição:** Usuário pediu uma aba nova "Cartões de Crédito" com dois objetivos:
  mostrar a fatura de cada cartão de forma fácil, e analisar se o benefício de pontos/
  milhas compensa a anuidade (evitar "jogada de número" de marketing bancário). Planejado
  em modo de planejamento, com pesquisa prévia no código confirmando que `Wallet` já tinha
  `kindCode=CARTAO_CREDITO`/`institutionId`/`creditLimit`/`closingDay`/`dueDay` e que
  `lib/finance/card.ts` já calculava fatura (`cardStatementWindow`/`cardStatementTotal`)
  sem nenhuma tela usar isso de verdade. Confirmado com o usuário: análise de benefício
  calculada sobre o gasto real dos últimos 12 meses (não estimativa digitada); importação
  de PDF constrói a infraestrutura completa nesta rodada, sem leitor de banco real (precisa
  de um PDF de exemplo por banco).

  **Refinamento pedido pelo usuário no meio da implementação, antes da importação de PDF
  ser escrita:** (1) confirmar que todo lançamento de cartão é um `Entry` de verdade,
  vinculado ao resto do sistema — já era assim por design; (2) regra própria de
  deduplicação de parcelamento para a importação de fatura, "100% imprescindível" — fatura
  de cartão lista a mesma parcela todo mês, e o texto que o banco imprime não bate com o
  que a pessoa digitaria à mão, então a deduplicação da importação de PDF nunca compara
  descrição, sempre carteira + total de parcelas + número da parcela + vencimento; a
  primeira vez que uma série aparece, todas as parcelas futuras são geradas de uma vez
  (mesma lógica do lançamento manual). Também pedido: um seletor de mês na tela do cartão
  para conferir qualquer fatura, passada ou futura, contra o extrato real do banco.
- **O que foi feito:**
  - **Schema:** novo model `CreditCard` (1:1 com `Wallet` por `walletId`) — imagem,
    anuidade, isenção, programa de pontos, pontos por R$, valor estimado do ponto. Campos
    de fatura (`institutionId`/`creditLimit`/`closingDay`/`dueDay`) continuam só em
    `Wallet`, sem duplicação.
  - **`lib/finance/card.ts::annualCardSpend`** e **`lib/finance/credit-card-benefit.ts`**
    (novo, puro) — gasto real de 12 meses e cálculo de benefício líquido, testados.
  - **Telas** (`app/(app)/cartoes/`): "Meus Cartões" (grade com imagem/fatura vigente),
    detalhe do cartão (fatura vigente + histórico + seletor de mês + edição + importar +
    arquivar/excluir), "+ Novo cartão", "Análise de Benefícios" (ranking por benefício
    líquido). Grupo novo no menu lateral, entre Compromissos e Relatórios.
  - **Upload de imagem:** bucket novo `credit-card-images` no Supabase Storage (público
    para leitura), criado via script com o client admin — infraestrutura que não existia
    no projeto até agora. Server Action valida tipo/tamanho (até 2MB) antes de gravar.
  - **Importação de fatura em PDF** (`lib/import/pdf-statement/`): extração de texto no
    navegador via `pdfjs-dist` (senha e arquivo nunca saem do computador do cliente),
    registro de leitores por banco (começa vazio, de propósito), síntese de linhas
    reaproveitando o mesmo formato canônico de CSV/OFX, com a regra de deduplicação de
    parcelamento descrita acima. Plugado no assistente de Importar existente (`.pdf` vira
    um terceiro formato, ao lado de CSV/OFX) e nas rotas `/api/import/preview`/`commit`.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `tsc --noEmit` limpo, `npm test` (217/217, incluindo os casos de
  deduplicação/expansão de parcelamento com dados fictícios), `npm run build` de produção
  concluído com as 4 rotas novas (`/cartoes`, `/cartoes/[id]`, `/cartoes/novo`,
  `/cartoes/analise`) e o bundle do `pdfjs-dist` compilando sem erro no Client Component.
  Bucket de imagens confirmado criado no Supabase Storage. Verificação visual ao vivo não
  foi possível nesta etapa (mesma limitação de sessão sem senha já documentada); usuário
  orientado a conferir diretamente no navegador.
- **Documentos relacionados:** `prisma/schema.prisma` (model `CreditCard`),
  `prisma/migrations/20260809140000_credit_card/`, `lib/finance/card.ts`,
  `lib/finance/credit-card-benefit.ts`, `app/(app)/cartoes/**`,
  `lib/import/pdf-statement/**`, `app/(app)/lancamentos/importar/ImportWizard.tsx`,
  `app/api/import/{preview,commit}/route.ts`, `components/Sidebar.tsx`,
  `MANUAL-DE-USO.md` §8 e §10 (nova), `PROJECT_STATE.md`.

---

### Registro Nº 041
- **Data:** 2026-08-09
- **Etapa concluída:** Leitores de fatura em PDF para 5 bancos reais (Nubank, Casas Bahia,
  Porto Seguro, Itaú, Santander)
- **Descrição:** Depois do Registro Nº 040 (infraestrutura de importação de PDF pronta,
  sem nenhum leitor de banco real), o usuário compartilhou ~30 faturas reais de 8+
  instituições e anos (2018-2026), com as senhas de cada uma, pedindo para "aprender tudo
  sobre eles" e trabalhar em partes se fosse muita informação. O leitor de arquivo padrão
  não abre PDF com senha; a extração de texto real foi feita com um script Node avulso
  usando a mesma `pdfjs-dist` já instalada no projeto (build `legacy`, sem DOM), só para
  estudo — nunca parte do código do produto, que já fazia (e continua fazendo) a extração
  inteiramente no navegador.
- **O que foi feito:**
  - **5 leitores novos** em `lib/import/pdf-statement/parsers/`: `nubank.ts` (já existia,
    sem commit — fechado aqui), `casas-bahia.ts`, `porto-seguro.ts`, `itau.ts` (cobre
    Signature e PDA, mesmo layout) e `santander.ts` (cobre as variantes 123/Free/sem
    sufixo, mesmo layout), cada um com bateria de testes usando texto extraído de faturas
    reais como fixture (52 testes novos ao todo).
  - **Mercado Pago ficou de fora, de propósito**: a única fatura enviada veio zerada ("Você
    não consumiu nada esse mês"), sem nenhuma linha de transação real para basear o
    formato — registrar um leitor adivinhado arriscaria interpretar errado o extrato real
    do cliente. Fica pendente até uma fatura de exemplo com consumo real.
  - **Correção de design, encontrada ao comparar os bancos entre si:** o leitor do Nubank
    já excluía corretamente a linha de "pagamento da fatura" (não é uma compra, é dinheiro
    saindo da conta para quitar o cartão), mas os leitores da Casas Bahia e Porto Seguro
    (escritos antes desta comparação) estavam importando o equivalente ("PAGAMENTO
    RECEBIDO", "PAGAMENTO"/"PAGAMENTO PIX") como se fosse um crédito/estorno — corrigido
    nos dois para excluir também, e o leitor do Santander já nasceu com a regra certa.
  - **Bug real encontrado e corrigido em `extract-text.ts`** (a reconstrução de linha usada
    por TODOS os leitores, não só os novos): quando duas colunas da fatura ficam muito
    próximas verticalmente, fragmentos de texto do PDF na mesma linha visual às vezes têm
    coordenada Y ligeiramente diferente (variação de sub-pixel entre fontes) — o
    agrupamento por linha já tolerava isso, mas a ORDEM final dentro da linha só respeitava
    a posição horizontal quando o Y batia exatamente, então esses fragmentos podiam sair
    fora de ordem (descoberto na fatura do Santander: "PARC 08/12" aparecendo antes de
    "MERCPAGO", quando a posição horizontal real dizia o contrário). Corrigido reordenando
    cada linha por X depois de agrupada — melhora a confiabilidade de todos os 5 leitores,
    não só do Santander.
  - **Bug de build de produção encontrado e corrigido**: `npm run build` nunca tinha sido
    rodado depois que o primeiro leitor de banco (Nubank) foi registrado — só descoberto
    ao rodar o build nesta etapa. `Decimal` era importado de `@/lib/finance/types`, que
    reexporta de `@prisma/client/runtime/client`; esse módulo carrega imports exclusivos
    do Node (`node:fs`, `node:crypto` etc.) que o webpack não consegue empacotar para o
    navegador — e como `ImportWizard.tsx` (Client Component) importa o registro de
    leitores diretamente, o build do cliente quebrava por inteiro assim que qualquer leitor
    real existisse. Corrigido importando `Decimal` de `@prisma/client-runtime-utils`
    (adicionado como dependência direta) — a mesma classe, só sem o import Node-only.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (261/261, incluindo os 52 testes novos dos 4 leitores desta
  etapa), `npx tsc --noEmit` limpo, `npm run build` de produção concluído com sucesso
  (primeira vez rodado com leitores reais registrados — foi o que revelou o bug do
  `Decimal`/webpack).
- **Documentos relacionados:** `lib/import/pdf-statement/extract-text.ts`,
  `lib/import/pdf-statement/types.ts`, `lib/import/pdf-statement/parsers/{registry,nubank,
  casas-bahia,porto-seguro,itau,santander}.ts`, `tests/import/pdf-statement/*.test.ts`,
  `package.json` (`@prisma/client-runtime-utils`), Registro Nº 040 (etapa original).

---

### Registro Nº 042
- **Data:** 2026-08-09
- **Etapa concluída:** Cadastro de Cartão de Crédito — dia de fechamento/vencimento só
  aceita dígitos, Limite de crédito e Anuidade em padrão monetário (R$)
- **Descrição:** Usuário pediu duas melhorias de UX no formulário de cartão (criação e
  edição): (1) dia de fechamento/vencimento aceitando só números, no máximo 2 dígitos,
  sem permitir letra nenhuma; (2) Limite de crédito e Anuidade recebendo o valor em
  formato monetário brasileiro (ex.: "R$ 1.500,00"), como qualquer app de banco.
- **O que foi feito:**
  - `components/ui/DayInput.tsx` (novo) — campo de dia do mês que filtra qualquer
    caractere não numérico em tempo real (não só na hora de enviar o formulário) e trava
    em 2 dígitos.
  - `components/ui/CurrencyInputBRL.tsx` (novo) — campo de valor em reais: os dígitos
    digitados preenchem da direita pra esquerda (centavos primeiro), sem precisar digitar
    vírgula ou ponto; manda pro formulário um valor escondido em decimal cru ("1500.00"),
    o formato que o Server Action já esperava — nenhuma mudança em `actions.ts`.
  - Os dois componentes substituem os `<input type="number">` de dia de
    fechamento/vencimento/limite/anuidade em `app/(app)/cartoes/novo/page.tsx` e
    `app/(app)/cartoes/[id]/page.tsx` (criação e edição).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (270/270, incluindo 9 testes novos da formatação/conversão de
  moeda — ida e volta sem perder centavo, campo vazio ficando vazio em vez de "R$ 0,00"),
  `npx tsc --noEmit` limpo, `npm run build` de produção concluído. Verificação visual ao
  vivo não foi possível (mesma limitação de sessão sem senha de login já documentada).
- **Documentos relacionados:** `components/ui/DayInput.tsx`,
  `components/ui/CurrencyInputBRL.tsx`, `app/(app)/cartoes/novo/page.tsx`,
  `app/(app)/cartoes/[id]/page.tsx`, `tests/components/currency-input-brl.test.ts`.

---

### Registro Nº 043
- **Data:** 2026-08-09
- **Etapa concluída:** 5 melhorias na tela de Cartão de Crédito: bug de vencimento
  corrigido (+ backfill), lançamento da fatura editável com regra de descrição
  personalizada, "Editar cartão" travado até clicar em Editar
- **Descrição:** Usuário testou a tela de detalhe do cartão e reportou 5 problemas: (1)
  vencimento da fatura mostrado errado ("vence 10/09/2026" em vez de "10/08/2026") e sem
  parênteses no intervalo; (2) mesmo bug no card da lista de cartões; (3) faltava botão de
  editar nos lançamentos da fatura; (4) faltava separar a descrição que vem do banco
  (travada) da personalizada (editável), com o sistema "aprendendo" a personalização pra
  faturas futuras; (5) formulário "Editar cartão" ficava sempre editável, sem seguir o
  padrão de trava usado em Bens/Metas. Planejado em modo de planejamento, com 3 perguntas
  confirmadas (todas a opção recomendada): corrigir também o vencimento já gravado em
  lançamentos antigos dos cartões afetados; a regra de descrição personalizada vale pra
  qualquer cartão do workspace; a regra só vale pras próximas importações, não reescreve
  lançamentos já existentes.
- **O que foi feito:**
  - **Causa raiz do bug de vencimento:** `cardStatementWindow` (`lib/finance/card.ts`)
    calculava o vencimento sempre no mês seguinte ao fechamento — só está certo quando
    `dueDay <= closingDay`; quando `dueDay > closingDay` (caso do usuário: fecha dia 2,
    vence dia 10), o vencimento cai no MESMO mês. Corrigido com uma condição; testes novos
    cobrindo os dois ramos (os testes existentes só cobriam o ramo que já funcionava, por
    isso o bug não tinha sido pego antes).
  - **Schema (migration aditiva):** `Entry.importedDescription` (descrição original da
    fatura, nunca editável) e novo model `DescriptionRule` (regra aprendida: descrição do
    banco normalizada → descrição/categoria/subcategoria personalizadas, por workspace).
  - **Importação de PDF** (`lib/import/pdf-statement/`) passa a: gravar
    `__importedDescription` em toda linha (mesmo padrão de `__autoReviewReason` já
    existente); consultar `DescriptionRule` do workspace e aplicá-la com prioridade sobre
    a sugestão por histórico de frequência; e também passou a preencher `Subcategoria` na
    linha (lacuna que existia desde sempre — `CategorySuggestion.subcategoryId` nunca
    tinha sido usado).
  - **Tabela de lançamentos da fatura** (`app/(app)/cartoes/FaturaEntriesTable.tsx`,
    componente novo): edição em linha por lançamento (mesmo padrão de
    `IncidentCard.tsx`), com "Descrição da fatura" sempre travada e "Descrição
    personalizada" + Categoria + Subcategoria editáveis. Nova Server Action
    `updateFaturaEntry` atualiza o lançamento e, quando ele veio de importação de PDF,
    grava/atualiza a `DescriptionRule` correspondente.
  - **"Editar cartão"** extraído pra `app/(app)/cartoes/CardEditForm.tsx`, no molde de
    `AssetCard.tsx`: campos desabilitados até clicar em "Editar", Salvar/Cancelar.
    `DayInput`/`CurrencyInputBRL` ganharam prop `disabled`.
  - **Bug real encontrado e corrigido durante o próprio backfill do vencimento:** a
    primeira versão do script de backfill recalculava `due_date` direto de
    `transactionDate` — mas parcelas de uma mesma série compartilham a MESMA
    `transactionDate` por design (`lib/finance/installments.ts`), só `due_date` avança
    mês a mês por `installmentNumber`. Isso colapsou o vencimento de parcelas 2+ de volta
    pro vencimento da parcela 1 em toda série do cartão afetado (121 de 561 lançamentos,
    todos parcelados). Detectado ao inspecionar o próprio log do backfill (uma sequência
    de datas repetidas onde deveriam ser sequenciais), corrigido com um script de reparo
    que recalcula respeitando `installmentNumber`, e a lógica corrigida foi incorporada de
    volta no script principal (`scripts/backfill-card-due-dates.ts`) — reexecutado até
    reportar zero mudanças (idempotente), e uma série real de 12 parcelas conferida
    manualmente mostrando vencimentos sequenciais corretos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (277/277), `npx tsc --noEmit` limpo, `npm run build` de
  produção concluído. Backfill rodado em produção: 561 lançamentos verificados, 513
  corrigidos na primeira passada (depois corrigido o bug de colapso de parcelas: 121
  lançamentos parcelados reparados), script reexecutado confirmando 0 pendências.
- **Documentos relacionados:** `lib/finance/card.ts`, `prisma/schema.prisma`
  (`Entry.importedDescription`, `DescriptionRule`),
  `prisma/migrations/20260810000000_description_rules/`,
  `lib/import/pdf-statement/{pdf-to-rows,pdf-import}.ts`, `lib/import/parse-row.ts`,
  `lib/import/suggest-category-bulk.ts`, `app/api/import/commit/route.ts`,
  `app/(app)/cartoes/{FaturaEntriesTable,CardEditForm,actions}.ts(x)`,
  `app/(app)/cartoes/[id]/page.tsx`, `scripts/backfill-card-due-dates.ts`,
  `tests/finance/card.test.ts`, `tests/import/pdf-to-rows.test.ts`.

---

### Registro Nº 044
- **Data:** 2026-08-09
- **Etapa concluída:** Menu "Investimentos" — carteira analítica, integração automática
  com Lançamentos, tela de Análise consolidada e PDF
- **Descrição:** Usuário pediu um menu de topo exclusivo para investimentos, cobrindo
  renda variável, renda fixa, imóveis para aluguel (gera receita), veículos para revenda,
  participação societária como sócio investidor, e "qualquer outra coisa" — com dois
  requisitos centrais: (1) cadastrar um investimento deve aparecer, de forma sintética,
  em Lançamentos; (2) dentro do menu Investimentos, a informação deve ser analítica
  (posição, rentabilidade, alocação, rendimentos), com termos reais de mercado. Planejado
  em modo de planejamento — a primeira versão do plano foi devolvida pelo usuário com uma
  classificação de mercado bem mais rica e detalhada, incorporada na revisão aprovada.
  Descoberta decisiva durante o planejamento: a funcionalidade já estava projetada em
  `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §7.3 (carteira `CONTA_INVESTIMENTO` + 13
  categorias `INVESTIMENTO` já seedadas, nunca usadas) — o requisito nº 1 já estava
  resolvido pelo desenho original, sem precisar de nenhum mecanismo novo de
  sincronização.
- **O que foi feito:**
  - **Schema (migration aditiva, `20260810100000_investments`):** `InvestmentClass`
    (tabela de referência, `code/labelPt/groupLabel/sortOrder`, 13 linhas, mesmo padrão
    de `WalletKind`) e `Investment` (posição individual: nome, classe, carteira
    `CONTA_INVESTIMENTO`, `details` Json livre por classe). `Entry.investmentId` novo
    (nullable, SEM cascade — decisão deliberada: pode haver renda real recebida numa
    carteira de verdade ligada à posição, que nunca pode ser apagada em cascata).
  - **Seed:** `seeds/seed_investment_classes.csv` (13 classes) +
    `seedInvestmentClasses()` em `prisma/seed.ts`; uma categoria nova em
    `seed_taxonomia.csv` (`INVESTIMENTO > Juros`) — o resto das 13 categorias
    `INVESTIMENTO` e as categorias `RECEITA > Aluguel`/`Participação nos Lucros` já
    existiam, sem uso, reaproveitadas como estão.
  - **`lib/finance/investment.ts`** (puro, testado): valor investido/atual, ganho de
    capital, rentabilidade %, renda recebida, retorno total % (ganho de capital + renda,
    termo real de mercado), alocação da carteira por classe. Split deliberado em
    `lib/finance/investment-instruments.ts` (sem import de `Decimal`) pros tipos/listas de
    sugestão de instrumento por classe, pra formulário Client Component poder importar sem
    quebrar o bundle do navegador (mesmo cuidado já tomado com PDF de fatura).
  - **`lib/entries/investment.ts`:** `createInvestment` (posição + primeiro aporte, numa
    transação), `registerInvestmentEvent` (ganho/perda/dividendo/juro/retirada/
    imposto/câmbio — sempre na carteira da posição), `registerInvestmentIncome` (renda
    real — aluguel/participação nos lucros — numa carteira de verdade escolhida pelo
    cliente), `generateRentIncome` (série mensal de aluguel, reaproveitando
    `generateRecurrenceOccurrences` já testada), `updateInvestment`, `archiveInvestment`,
    `deleteInvestment` (só permite excluir sem nenhum lançamento vinculado — mesma regra
    de Carteira/Cartão/Subcategoria).
  - **Telas:** `app/(app)/investimentos/` — layout com abas "Carteira"/"Análise"; lista
    filtrável por classe; cadastro (classe dirige os campos específicos, tipo de
    instrumento com sugestões, atalho pra criar carteira nova inline); detalhe analítico
    (posição, ganho de capital, rentabilidade %, retorno total %, gráfico de evolução,
    histórico completo, formulários de registrar evento/renda, geração de aluguel
    recorrente pra Imóveis, edição travada até "Editar", arquivar/excluir); Análise
    (consolidado da carteira inteira, alocação por classe em barras, renda mensal
    recebida — reaproveita `MonthlyChart` —, ranking por rentabilidade, "Baixar PDF").
  - **PDF:** `lib/reports/pdf/investimentos.ts` + `app/api/investimentos/pdf/route.ts`,
    mesmo par `startReportPdf`/`finishReportPdf` dos outros 8 relatórios.
  - **Sidebar:** novo grupo "Investimentos" (ícone `CandlestickChart`), logo depois de
    "Patrimônio", com os itens Carteira e Análise.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (288/288, incluindo 11 testes novos de
  `tests/finance/investment.test.ts`), `npx tsc --noEmit` limpo, `npm run build` de
  produção concluído (rotas `/investimentos`, `/investimentos/novo`, `/investimentos/[id]`,
  `/investimentos/analise` e `/api/investimentos/pdf` registradas). Verificação visual ao
  vivo não foi possível (mesma limitação de sessão sem senha de login já documentada) —
  usuário confirma no navegador depois do deploy.
- **Documentos relacionados:** `prisma/schema.prisma` (`InvestmentClass`, `Investment`,
  `Entry.investmentId`), `prisma/migrations/20260810100000_investments/`,
  `seeds/seed_investment_classes.csv`, `seeds/seed_taxonomia.csv`, `prisma/seed.ts`,
  `lib/finance/investment.ts`, `lib/finance/investment-instruments.ts`,
  `lib/entries/investment.ts`, `app/(app)/investimentos/`, `lib/reports/pdf/investimentos.ts`,
  `app/api/investimentos/pdf/route.ts`, `components/Sidebar.tsx`,
  `components/charts/InvestmentEvolutionChart.tsx`, `tests/finance/investment.test.ts`.

---

### Registro Nº 045
- **Data:** 2026-08-09
- **Etapa concluída:** Exemplos de investimento para validar o menu "Investimentos" —
  script reutilizável guardado no repositório
- **Descrição:** Depois do Registro Nº 044 (menu Investimentos construído), usuário pediu
  10 exemplos de investimentos variados pra conferir como cada classe aparece no sistema.
  Criados 10 investimentos reais (não fictícios num ambiente separado — no próprio
  workspace de produção do usuário, "fhildebrando (pessoal)"), um por classe de mercado
  (com Renda Fixa e Renda Variável em dobro, pra mostrar título de dívida vs. ação/FII):
  Tesouro IPCA+ 2029, CDB Banco Inter 110% CDI, PETR4, HGLG11, Fundo Multimercado XP,
  Bitcoin, Apartamento Rua das Flores, Honda Civic 2020, 15% Padaria do Zé e Ouro físico
  (100g) — cada um com pelo menos um evento de rendimento/ganho/perda lançado, e os dois
  que geram renda real (Apartamento e Padaria) com lançamentos de verdade de
  aluguel/distribuição de lucro numa carteira real (NU Conta), pra Análise não ficar
  zerada. Usuário conferiu ao vivo e aprovou ("Ficou muito bom"), depois pediu pra guardar
  o exemplo nos registros do sistema pra reuso futuro.
- **O que foi feito:** Todos os 10 investimentos foram criados chamando as mesmas funções
  que o formulário usa (`createInvestment`/`registerInvestmentEvent`/
  `registerInvestmentIncome` de `lib/entries/investment.ts`), não um atalho por fora do
  sistema — passaram pelas mesmas validações. A lista foi guardada como script permanente
  e reexecutável em `scripts/seed-investment-examples.ts` (molde de
  `prisma/seed-workspace.ts`): idempotente (pula investimentos cujo nome já existe no
  workspace, não duplica), cria as carteiras de investimento que faltarem, resolve
  workspace/responsável/carteira de renda automaticamente (ou por `--workspace-id`) — pode
  ser rodado de novo no futuro pra recriar o mesmo cenário numa demo ou workspace novo.
  **Bug real encontrado e corrigido antes de guardar o script:** a primeira versão passava
  o mesmo id (`Person`, o "responsável" do lançamento) tanto pro parâmetro `responsibleId`
  quanto pro parâmetro `profileId` (quem "criou" o lançamento, `Entry.createdBy`/
  `updatedBy`) — são tabelas diferentes (`Person` vs. `Profile`, via `Membership`). Não
  quebrava a gravação (essas duas colunas não têm FK no banco), mas gravava o autor errado
  em todo lançamento de exemplo. Corrigido resolvendo os dois ids separadamente
  (`resolveResponsibleId` via `Person`, `resolveProfileId` via `Membership`, priorizando o
  titular do workspace).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** Rodado ao vivo contra o workspace de produção (10 investimentos criados,
  conferidos pelo usuário no navegador). Depois da correção do bug de `profileId`,
  reexecutado em modo idempotente confirmando "0 criados, 10 já existiam, pulados" (nenhuma
  duplicata). `npm test` (288/288), `npx tsc --noEmit` limpo.
- **Documentos relacionados:** `scripts/seed-investment-examples.ts`.

---

### Registro Nº 046
- **Data:** 2026-08-10
- **Etapa concluída:** Débitos técnicos — CI (GitHub Actions) e RLS completa (documental)
- **Descrição:** Usuário pediu para verificar o estado do projeto e iniciar a próxima
  etapa. Como todas as Fases 0-4 da especificação original já estavam concluídas (última
  formalizada: Registro Nº 045), sem "próxima fase" de produto decidida, o usuário
  escolheu atacar débito técnico (item já documentado em `PROJECT_STATE.md` seção 23).
  Perguntado como separar o banco de dev/teste do de produção — não há Docker nem `gh`
  CLI nesta máquina para automatizar isso sozinho —, o usuário escolheu criar o projeto
  Supabase novo ele mesmo; essa etapa fica para uma sessão futura, quando ele passar a
  URL/chaves. Esta etapa cobriu só o que dava para entregar sem depender disso.
- **O que foi feito:**
  1. **CI** — `.github/workflows/ci.yml`, roda `npx tsc --noEmit`, `npm run lint`
     (`continue-on-error`), `npm test` e `npm run build` em todo push/PR para `master`.
     Confirmado localmente (antes de escrever o workflow) que o build funciona
     identicamente com valores placeholder de env var ou com as credenciais reais — nenhuma
     rota toca Prisma/Supabase em build-time — então o workflow não depende de nenhum
     segredo real cadastrado no GitHub.
  2. **RLS completa** — `prisma/sql/008_rls_completeness.sql`, seguindo a mesma convenção
     dos arquivos 001-007. Cobre as 14 tabelas criadas depois da Fase 0 que nunca tinham
     nenhuma policy (`credit_cards`, `description_rules`, `budgets`, `assets`, `goals`,
     `investment_classes`, `investments`, `google_calendar_connections`, `notifications`,
     `plans`, `features`, `plan_features`, `subscriptions`, `entitlements`, `access_logs`).
     **Bug real encontrado na investigação:** as policies de escrita mais antigas
     (`people`/`wallets`/`entry_groups`/`entries`/`import_batches`) só liberavam
     `TITULAR`/`MEMBRO`, mas `lib/auth/session.ts::can()` já libera qualquer papel
     diferente de `LEITURA` (inclui `ADVISOR`) desde a Arquitetura de Identidade/Planos —
     inconsistência nunca visível porque RLS não é exercida. Corrigido no mesmo arquivo.
     **Confirmado antes de aplicar qualquer coisa:** nenhuma tabela do projeto tem `FORCE
     ROW LEVEL SECURITY`, e a conexão do Prisma usa a role *owner*, que o Postgres sempre
     deixa ignorar RLS nesse caso — ou seja, este arquivo é 100% aditivo/dormant, não muda
     nenhum comportamento do app rodando hoje.
  3. **Documentação** — `PROJECT_STATE.md` (topo + seções 22 e 23) e este registro.
- **Achado fora do escopo, não corrigido:** `npm run lint` tem 11 erros pré-existentes
  (4x `<a>` que deveriam ser `<Link/>`, 2x reatribuição de variável durante render,
  regra `react-hooks/immutability`, 2 warnings de import não usado) — sem relação com CI
  ou RLS, mexeria em código de tela. Deixado como débito técnico registrado, CI roda lint
  sem bloquear até alguém pedir a correção.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (288/288), `npx tsc --noEmit` limpo, `npm run build` limpo
  (local, com e sem `.env.local` real — confirmando que CI não precisa de segredo real).
  SQL de RLS revisado mas **ainda não aplicado contra o banco real** — aplicação e
  commit/push ficam para depois da confirmação explícita do usuário.
- **Documentos relacionados:** `.github/workflows/ci.yml`,
  `prisma/sql/008_rls_completeness.sql`, `PROJECT_STATE.md`.

---

### Registro Nº 047
- **Data:** 2026-08-10
- **Etapa concluída:** Banco de dev/teste separado do de produção
- **Descrição:** Continuação do Registro Nº 046 (débitos técnicos). O usuário criou um
  projeto Supabase novo pelo próprio dashboard (`prospecta-finance-dev`, região
  `sa-east-1`, mesma região de produção) e passou as credenciais via `.env.dev.local`
  (nunca coladas em chat). Com isso, o assistente aplicou o schema completo, ativou
  auth/RLS, populou a taxonomia e criou um workspace de teste — fechando o débito técnico
  "desenvolvimento e produção usam o mesmo banco" (`PROJECT_STATE.md` §22 item 7).
- **O que foi feito:**
  1. Corrigido um `?` não escapado na senha do banco dentro da `DATABASE_URL` (precisa
     virar `%3F` — senão o parser de URL confunde tudo depois do `?` com query string,
     erro "invalid port number").
  2. `npx prisma migrate deploy` travou nesta máquina Windows, confirmando que o débito
     técnico documentado (§23, `schema-engine-windows.exe`) continua ativo — aplicadas as
     24 migrations manualmente via `pg` (mesmo contorno já usado no Registro Nº 035),
     recriando a tabela `_prisma_migrations` com o schema exato do Prisma (conferido
     contra a tabela real de produção antes de replicar) para que `prisma migrate
     status` continue confiável no futuro.
  3. **Bug real encontrado no processo:** a migration `20260808220000_workspace_client_code`
     falha em banco vazio (`setval(seq, 0)`, já documentado em §23) — contornado
     executando, só nesta aplicação manual, uma versão em memória da última linha
     (`DO $body$ ... setval(seq, 1, false) quando não há linhas ... $body$`) sem tocar no
     arquivo `.sql` original (evita quebrar o checksum já aplicado em produção). O
     checksum gravado em `_prisma_migrations` é o do arquivo original, sem modificação.
  4. **Segundo bug real, no próprio script de aplicação:** `String.prototype.replace()`
     trata `"$$"` na string de substituição como sequência de escape (colapsa pra um `$`
     só) quando o segundo argumento é string — corrigido usando a forma de função
     (`replace(padrão, () => texto)`), que não tem esse efeito colateral.
  5. Aplicados os 8 arquivos `prisma/sql/001-008` (auth, RLS, triggers de signup) na
     ordem, e `prisma/seed.ts` (taxonomia global: 10 wallet_kinds, 8 statuses, 13
     recurrence_kinds, 67 categories, 336 subcategories, 19 institutions, 4 nature_labels,
     13 investment_classes).
  6. `.env.local` (o que `npm run dev` usa) trocado para apontar pro projeto novo; o
     `.env.local` antigo (produção) preservado como `.env.prod.local`, para o caso de
     precisar rodar algum script pontual contra produção no futuro. Vercel/produção não
     foram tocados.
  7. Usuário de teste (`fhildebrando+dev@gmail.com`) criado via Admin API do Supabase
     (`email_confirm: true`, sem precisar digitar senha nem depender de e-mail chegar) —
     disparou o trigger `handle_new_auth_user`, criando profile + workspace ("Felipe (dev)
     (pessoal)", código 0001) + membership TITULAR automaticamente, confirmado direto no
     banco. `prisma/seed-workspace.ts` populou 12 responsáveis e 47 carteiras nesse
     workspace.
  8. Servidor local iniciado contra o banco novo — `/login` renderiza sem erro de
     servidor, confirmando que o app conecta corretamente no projeto Supabase novo.
     Verificação de página autenticada via magic link não completou (o formato de link
     gerado pela Admin API não bateu com o fluxo de callback do app) — não bloqueia nada,
     os dados foram confirmados corretos direto no banco.
- **Ainda não feito, registrado como pendência:** configurar Authentication → URL
  Configuration (Site URL `http://localhost:3000`) no projeto Supabase novo — recomendado
  antes de testar fluxos que dependem de redirect (redefinir senha, aceitar convite), mas
  não bloqueou nada desta etapa. Suíte de testes de integração de verdade (o motivo de
  toda essa separação) ainda não construída — próximo passo.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** Consultas SQL diretas no banco novo confirmando: 24 migrations em
  `_prisma_migrations`, RLS habilitada e 94 policies, taxonomia seedada, 1 workspace/1
  profile/1 membership criados pelo trigger, 12 people/47 wallets no seed de workspace.
  `npm run dev` local contra o banco novo, `/login` renderizado sem erro de servidor
  (`preview_logs` sem erros).
- **Documentos relacionados:** `.env.dev.local`, `.env.prod.local`, `.env.local`
  (nenhum commitado — todos em `.gitignore`).

---

### Registro Nº 048
- **Data:** 2026-08-10
- **Etapa concluída:** Suíte de testes de integração de verdade (primeira leva)
- **Descrição:** Continuação dos Registros Nº 046/047. Com o banco de dev/teste separado
  e seguro para escrever/apagar dados, o usuário pediu para construir a suíte de
  integração de verdade — diferente dos ~288 testes unitários existentes em `tests/`, que
  só testam funções puras e nunca tocam banco.
- **O que foi feito:**
  1. **`tests/integration/setup.ts`** — guard de segurança: carrega `.env.dev.local`
     explicitamente (nunca `.env.local`, que pode um dia voltar a apontar pra produção) e
     **aborta a suíte inteira, antes de qualquer query**, se não conseguir confirmar que o
     banco alvo é o projeto de dev/teste (checa o ref do projeto Supabase na
     `DATABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` — nem o ref de dev nem o de produção são
     segredo, já aparecem em texto puro no `PROJECT_STATE.md`). **Testado de propósito**:
     apontei `.env.dev.local` temporariamente pro ref de produção (arquivo restaurado
     depois) e confirmei que os 5 arquivos de teste falham imediatamente com "0 tests" —
     nenhuma query chega a rodar.
  2. Mesmo arquivo mocka `next/server` (`after()` executa o callback na hora em vez de
     agendar) — `createEntryOrSeries`/`settleEntry` chamam `after()`, que lança exceção
     síncrona fora de um request scope real do Next; o callback real
     (`syncEntryToGoogleCalendar`) é melhor-esforço e não faz nada quando o workspace não
     tem `GoogleCalendarConnection` (nenhum de teste tem), então é seguro executar.
  3. **`vitest.integration.config.ts`** (novo, config separado) + script
     `npm run test:integration`. **Bug real encontrado ao rodar `npm test` depois**: o
     `include` do config de unitários (`tests/**/*.test.ts`) também casava com
     `tests/integration/**`, então `npm test` tentou rodar os testes de integração sem o
     guard/mock — 4 testes quebraram de verdade (o `after()` fora de request scope).
     Corrigido adicionando `tests/integration/**` ao `exclude` de `vitest.config.ts`
     (preservando os excludes padrão via `configDefaults.exclude`). Sem essa correção,
     `npm test` rodando com `.env.local` apontado pra produção (o que já foi verdade antes
     do Registro Nº 047 e pode voltar a ser um dia) escreveria dados de teste em produção
     sem guard nenhum — bug encontrado e corrigido antes de virar risco real.
  4. **`tests/integration/helpers/fixtures.ts`** — `createTestWorkspace()`/
     `cleanupTestWorkspace()` criam/apagam `Profile`+`Workspace`+`Membership` direto via
     Prisma (sem signup real no Supabase Auth — `Profile.id` não tem mais FK pra
     `auth.users` desde a migration `002_drop_cross_schema_fk.sql`, só um trigger de
     delete). Limpeza é um único `prisma.workspace.delete()` (`onDelete: Cascade` em
     todas as 18 relações por workspace, confirmado por grep no schema antes de confiar
     nisso) + `prisma.profile.delete()`.
  5. Primeira leva de testes, um workspace de teste por arquivo (`beforeAll`/`afterAll`):
     `entries/transfer.test.ts` (par saída/entrada, sinais, rejeita carteira de outro
     workspace), `entries/create.test.ts` (lançamento único, série parcelada, série
     recorrente mensal — 25 ocorrências), `entries/settle.test.ts` (liquidação, rejeita
     lançamento de outro workspace, rejeita situação não liquidável), `entries/investment.test.ts`
     (criar posição + registrar evento + registrar renda real, mesmo padrão de
     `scripts/seed-investment-examples.ts` agora automatizado), `workspace/invite.test.ts`
     (ciclo completo de convite: criar, aceitar, rejeitar e-mail errado, rejeitar convite
     já aceito).
- **Não incluído nesta rodada, deixado explícito (não é dívida esquecida):**
  `lib/entries/asset.ts`, `lib/workspace/advisor.ts`, e o commit de importação (a lógica
  está solta dentro de `app/api/import/commit/route.ts`, não numa função de `lib/`
  exportada — testar isso pede outra abordagem). Rodar `test:integration` no CI do GitHub
  Actions também ficou de fora — exigiria cadastrar as credenciais do banco de dev como
  *secret* do repositório, decisão à parte.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm run test:integration` — 5 arquivos, 15 testes, todos passando contra
  o banco de dev real. `npm test` (unitários) — 288/288, sem nenhuma mudança de
  comportamento. `npx tsc --noEmit` limpo. Guard de segurança testado manualmente (aborta
  com o ref de produção, sem rodar nenhuma query). Conferido direto no banco que nenhum
  workspace/profile de teste ficou órfão depois de duas rodadas completas da suíte.
- **Documentos relacionados:** `tests/integration/`, `vitest.integration.config.ts`,
  `vitest.config.ts`, `package.json`.

---

### Registro Nº 049
- **Data:** 2026-08-10
- **Etapa concluída:** Suíte de testes de integração — segunda leva + CI rodando contra o
  banco de dev
- **Descrição:** Continuação do Registro Nº 048. Usuário pediu para estender a suíte
  (`lib/entries/asset.ts`, `lib/workspace/advisor.ts`, commit de importação — as 3 frentes
  deixadas de fora explicitamente na rodada anterior) e para colocar as credenciais do
  banco de dev como *secret* do GitHub, com CI rodando `test:integration` de verdade.
- **O que foi feito:**
  1. **`tests/integration/setup.ts`** ficou flexível: continua exigindo `.env.dev.local`
     localmente, mas no CI (onde esse arquivo não existe, é gitignored) aceita as mesmas
     variáveis já vindas do ambiente — o guard de segurança (ref de produção/dev) continua
     rodando igual, só a fonte da variável muda.
  2. **`.github/workflows/ci.yml`** ganhou o job `integration-tests`, com env vindo de 4
     secrets novos do repositório (`DEV_SUPABASE_URL`, `DEV_SUPABASE_ANON_KEY`,
     `DEV_SUPABASE_SERVICE_ROLE_KEY`, `DEV_DATABASE_URL` — prefixo `DEV_` de propósito,
     nunca as credenciais de produção). Usuário cadastrou os secrets no GitHub (Settings >
     Secrets and variables > Actions) copiando de `.env.dev.local`, sem colar em chat.
  3. **`tests/integration/entries/asset.test.ts`** — `createAsset`/`registerAssetValuation`:
     cria o bem + lançamento de aquisição na pseudo-conta "Patrimônio" (workspace de teste
     precisou ganhar sua própria, `isPseudoWallet=true` — não vem do seed global),
     valorização/desvalorização sem tocar o lançamento original, rejeita bem de outro
     workspace.
  4. **`tests/integration/workspace/advisor.test.ts`** — `assignAdvisor`: atribuir
     consultor novo, trocar (revoga o anterior sem apagar, ativa o novo), remover
     (`advisorProfileId=null`), reativar um consultor revogado anteriormente.
  5. **Refactor comportamento-preservado**: extraído `lib/import/commit.ts::commitImportBatch()`
     de dentro de `app/api/import/commit/route.ts` — mesmo espírito de
     `lib/import/revert.ts`, já extraído antes. A rota virou um wrapper fino (decide
     formato CSV/OFX/PDF, monta `records`/`mapping`, chama a função). Resposta HTTP
     idêntica (`{batchId, imported, skipped}`), confirmado por `npm run build` (mesmas 61
     rotas, nenhuma mudança de warning/erro).
  6. **`tests/integration/import/commit.test.ts`** — cobre `commitImportBatch` isolado do
     formato de entrada (mapeamento identidade, sem depender do parser de CSV real):
     importa linha válida, ignora linha com erro (carteira inexistente) contando em
     `skipped`, detecta duplicata dentro do mesmo lote, agrupa parcelas com `groupId`
     quando os números batem.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm run test:integration` — 8 arquivos, 26 testes, todos passando contra
  o banco de dev real. `npm test` (unitários) 288/288 intacto. `npx tsc --noEmit` limpo.
  `npm run build` limpo, 61 rotas, sem diferença de warnings. Conferido direto no banco
  que nenhum workspace/profile de teste ficou órfão depois da rodada completa. CI do
  GitHub Actions ainda não confirmado rodando de verdade nesta entrada (depende do push).
- **Documentos relacionados:** `lib/import/commit.ts`, `app/api/import/commit/route.ts`,
  `tests/integration/entries/asset.test.ts`, `tests/integration/workspace/advisor.test.ts`,
  `tests/integration/import/commit.test.ts`, `tests/integration/setup.ts`,
  `.github/workflows/ci.yml`.

---

### Registro Nº 050
- **Data:** 2026-08-10
- **Etapa concluída:** CI confirmado rodando de verdade contra o banco de dev (job `integration-tests`)
- **Descrição:** Fechamento do Registro Nº 049 — a primeira execução do job novo no
  GitHub Actions (run do commit `2d3fae2`) falhou. `build-and-test` passou normalmente;
  `integration-tests` falhou no guard de segurança de `tests/integration/setup.ts`, com o
  erro esperado do próprio guard ("não foi possível confirmar que o banco alvo é o
  projeto de dev/teste") — ou seja, o guard funcionou exatamente como desenhado: abortou
  antes de qualquer query em vez de deixar passar silenciosamente.
- **Causa raiz (bug real, achado ao investigar o log do CI):** os secrets cadastrados pelo
  usuário no GitHub têm nomes `DEV_NEXT_PUBLIC_SUPABASE_URL`/`DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (nomes até mais claros — batem com o nome real da env var), mas `.github/workflows/ci.yml`
  (Registro Nº 049) tinha sido escrito esperando `DEV_SUPABASE_URL`/`DEV_SUPABASE_ANON_KEY`.
  Secret com nome não encontrado resolve pra string vazia no GitHub Actions (não é erro de
  sintaxe), então `NEXT_PUBLIC_SUPABASE_URL` chegou vazia no job — o guard corretamente não
  conseguiu confirmar o ref do projeto e abortou.
- **Correção:** `ci.yml` ajustado pra usar os nomes reais dos secrets (`DEV_NEXT_PUBLIC_SUPABASE_URL`/
  `DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY`), em vez de pedir pro usuário recriar os secrets com
  outro nome. `PROJECT_STATE.md`/`CHANGELOG.md` corrigidos para os nomes certos
  (`REGISTRO-OPERACIONAL.md` não — é ledger, entradas fechadas não são reescritas).
- **Verificado direto na API do GitHub Actions** (não só pela UI, que numa consulta
  anterior resumiu errado o job `build-and-test` como falho quando na verdade tinha
  passado — conferido via `api.github.com/.../actions/runs/{id}/jobs`, dado bruto, sem
  intermediário resumindo): run do commit `f077c9a`, os dois jobs (`build-and-test` e
  `integration-tests`) com `conclusion: "success"` em todos os steps.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** GitHub Actions run `31443189781` (commit `f077c9a`), ambos os jobs
  verdes, confirmado via API (`/repos/.../actions/runs/31443189781/jobs`).
- **Documentos relacionados:** `.github/workflows/ci.yml`.

---

### Registro Nº 051
- **Data:** 2026-08-10
- **Etapa concluída:** Primeira leva de testes E2E com Playwright
- **Descrição:** Continuação dos Registros Nº 048-050 (suíte de integração). O que ficou de
  fora da suíte de integração — `lib/workspace/switch.ts` (mecânica pura de
  `cookies()`/`redirect()`, baixo valor mockar) e qualquer página/Server Action/rota
  testada "pela tela" — exige navegador real + servidor Next real + sessão autenticada de
  verdade. Usuário pediu para continuar com E2E via Playwright.
- **O que foi feito:**
  1. `@playwright/test` instalado + browser Chromium baixado (só um projeto, suficiente
     pra uma primeira leva pessoal).
  2. **`scripts/assert-dev-database.ts`** — mesmo guard de segurança da suíte de
     integração, mas verificando `.env.local` (o arquivo que o `next dev` real usa) em vez
     de `.env.dev.local`. Encadeado no próprio comando do `webServer` do Playwright
     (`npx tsx scripts/assert-dev-database.ts && npm run dev`), então roda **antes** do
     processo do Next existir — não depende de nenhuma garantia de ordem entre
     `globalSetup` e `webServer` do Playwright.
  3. **Login sem senha via magic link** (`tests/e2e/helpers/auth.ts`) — técnica já
     documentada (topo deste arquivo, seção 21 do `PROJECT_STATE.md`) implementada de
     verdade pela primeira vez: gera magic link via Admin API, troca por sessão chamando
     `verifyOtp()` **direto pela API** (nunca navegando o browser pro link — isso usa hash
     fragment/implicit flow, que a rota de callback do app não trata), com
     `createServerClient` do `@supabase/ssr` e um cookie jar em memória como adapter — a
     própria lib gera os cookies no formato exato que espera ler depois. `globalSetup.ts`
     usa isso pra gerar um `storageState` do Playwright (login uma vez, todo teste já
     nasce autenticado).
  4. **`tests/e2e/helpers/fixtures.ts`** — cria um usuário REAL no Supabase Auth (Admin
     API, diferente das fixtures de integração que só criam `Profile` via Prisma) — o
     trigger de signup cria Profile+Workspace+Membership automaticamente. Também marca
     `privacy_policy_accepted_at` (senão cai em `/aceitar-politica` em vez de `/painel` —
     achado ao rodar o primeiro teste) e cria uma carteira/responsável mínimos.
     `globalTeardown.ts` apaga tudo depois (Admin API + `workspace` órfão).
  5. **3 specs**: `login.spec.ts` (smoke test, validado sozinho antes dos outros dois —
     prova a técnica de cookie jar de verdade, não só na teoria), `create-entry.spec.ts`
     (formulário de lançamento rápido, confirma que aparece em `/lancamentos`),
     `import-csv.spec.ts` (upload de CSV pequeno, preview automático, confirma
     importação).
- **3 bugs/obstáculos reais encontrados e corrigidos no processo, nenhum deles previsto no
  plano original:**
  1. Cache do Turbopack corrompido nesta máquina (mesmo problema já documentado em sessão
     anterior) — `.next` limpo antes de rodar.
  2. **`import()` dinâmico sai do transform do Playwright que resolve o alias `"@/"`** —
     tentar `await import("@/lib/db/prisma")` dentro de uma função (pra controlar a ordem
     de carga do `.env.dev.local` antes do singleton capturar `.env.local`) falhava com
     "Cannot find module". Corrigido usando caminho relativo — mas o Prisma Client gerado
     usa `import.meta` internamente, incompatível com o transform CommonJS do Playwright
     de qualquer forma. Solução final: fixtures E2E usam `pg` puro (mesmo padrão de vários
     scripts avulsos já usados nesta sessão), não o Prisma Client gerado.
  3. Timeout padrão de 5s do Playwright estourava no primeiro `Server Action` de cada
     rota nova (Turbopack compila sob demanda em `next dev` — primeira visita de cada rota
     é mais lenta). Corrigido com `expect.timeout: 15_000` no `playwright.config.ts`.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npx playwright test` — 3 specs, 3 testes, todos passando contra o
  banco de dev real e o servidor `next dev` local. `npm test` (288/288) e `npm run
  test:integration` (26/26) continuam intactos — Playwright é um runner totalmente
  separado do Vitest. `npx tsc --noEmit` limpo. Conferido direto no banco que nenhum
  usuário/workspace E2E ficou órfão depois de duas rodadas completas da suíte.
- **Documentos relacionados:** `playwright.config.ts`, `scripts/assert-dev-database.ts`,
  `tests/e2e/`.

---

### Registro Nº 052
- **Data:** 2026-08-11
- **Etapa concluída:** E2E — segunda leva (troca de workspace, importação OFX)
- **Descrição:** Continuação do Registro Nº 051. Usuário pediu para estender a suíte E2E
  cobrindo troca de workspace e importação de OFX (PDF ficou de fora, decisão explícita —
  não existe nenhum PDF de exemplo, binário ou sintético, no repositório; construir um do
  zero pra bater com o layout de um parser de banco era mais esforço/risco do que os
  outros dois fluxos, então foi adiado).
- **O que foi feito:**
  1. **`tests/e2e/helpers/fixtures.ts`** — `addSecondWorkspaceMembership()` (cria um
     segundo workspace + Membership `ADVISOR` pro mesmo Profile) e
     `cleanupSecondWorkspace()`. De propósito **não** entra no usuário compartilhado por
     todos os specs — com 2 memberships, `resolveActiveMembership()` sem cookie não
     garante qual é `memberships[0]` (Prisma não ordena por padrão), arriscaria os outros
     specs operarem no workspace errado às vezes.
  2. **`tests/e2e/switch-workspace.spec.ts`** — spec isolado, login e sessão próprios
     (`test.use({ storageState: { cookies: [], origins: [] } })`, nunca reaproveita o
     storageState compartilhado). Seleciona o segundo workspace pelo `<select
     aria-label="Trocar de workspace">` (escopado no `<aside>` — o componente é montado 2x
     no DOM, sidebar desktop + header mobile) e confirma pela badge "você está em
     workspace de cliente" (só aparece quando a Membership ativa é `ADVISOR`).
  3. **`tests/e2e/import-ofx.spec.ts`** — reaproveita a amostra `LOOSE_SGML_SAMPLE` já
     usada em `tests/import/parse-ofx.test.ts` (SGML solto real de banco, 2 transações),
     preenche o mini-formulário de 4 campos que o OFX pede antes do preview (Carteira,
     Responsável, Categoria padrão despesas/receitas), confirma as 2 transações
     importadas.
- **Nenhum bug novo encontrado** nesta rodada — os dois fluxos funcionaram na primeira
  tentativa, reaproveitando os padrões já validados no Registro Nº 051 (guard de
  segurança, `storageState`, timeout de 15s pro cold-compile do Turbopack).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npx playwright test` — 5 specs, 5 testes, todos passando. `npm test`
  (288/288) e `npm run test:integration` (26/26) intactos. `npx tsc --noEmit` limpo.
  Conferido direto no banco que nenhum workspace/profile E2E (incluindo o segundo
  workspace do teste de troca) ficou órfão.
- **Documentos relacionados:** `tests/e2e/helpers/fixtures.ts`,
  `tests/e2e/switch-workspace.spec.ts`, `tests/e2e/import-ofx.spec.ts`.

---

### Registro Nº 053
- **Data:** 2026-08-11
- **Etapa concluída:** Correção de regra de negócio — totais por situação (liquidado ×
  pendente)
- **Descrição:** Usuário reportou, na versão real/original do sistema (não em teste): os
  totais de Receita/Despesa/Investimento mostrados no Painel somavam todos os lançamentos
  do período, misturando o que já foi liquidado (PAGO/RECEBIDO) com o que ainda está
  pendente (A_PAGAR/A_RECEBER/ESTIMATIVA). Pedido: todo total "realizado" deve refletir
  só o que foi efetivamente recebido/pago; toda apresentação de "provisão"/expectativa
  deve calcular só em cima do pendente.
- **Achado na investigação:** era comportamento **intencional por design atual**, não um
  bug de implementação isolado — `lib/finance/period.ts::periodTotals` tinha um
  comentário explícito ("§11.3 — a fórmula da planilha não filtra por situação") e um
  teste que afirmava esse comportamento como correto, "fiel à fórmula da planilha
  original". O usuário pediu pra mudar essa regra de propósito.
- **O que foi feito:**
  1. `lib/finance/derived.ts` — `OK_STATUSES` (privado) renomeado e exportado como
     `SETTLED_STATUSES`; `PENDING_STATUSES` novo (complemento exato, batendo com
     `Status.countsAsSettled = false`). Fonte única reusada por `period.ts`,
     `rankings.ts` e `reserve.ts` — sem duplicar mais um `Set` (já existiam dois
     hard-coded, um em `balance.ts` outro em `derived.ts`, nenhum lendo a coluna do
     banco).
  2. `periodTotals`/`monthlySeries` (`lib/finance/period.ts`) ganharam parâmetro
     `settlement: "settled" | "pending"` **obrigatório** (de propósito, sem default) —
     força cada chamador a declarar a intenção; o compilador TS pegou automaticamente
     todos os 8 call sites que precisavam de atualização (nenhum esquecido). `projectedBalance`
     não ganhou parâmetro novo — só tem um uso legítimo (fluxo projetado é sempre sobre o
     pendente), ficou hard-coded `"pending"` internamente.
  3. `topEntries`/`categoryDistribution`/`categoryMonthlyBreakdown` (`rankings.ts`) e
     `averageMonthlyExpense` (`reserve.ts`) — cada uma só tinha um call site real, sempre
     "realizado"; filtro por `SETTLED_STATUSES` ficou fixo internamente, sem mudar
     assinatura.
  4. Call sites atualizados: Painel (KPIs e "Últimos 6 meses" = settled; "Provisão" =
     pending), Balanço anual tela + PDF (settled). Fluxo projetado, Orçamento e Dívidas
     não precisaram de mudança externa (filtro interno das funções que usam).
  5. Testes: `period.test.ts` reescrito nos call sites + o teste "inclui não liquidado —
     fiel à planilha" virou dois testes novos (`settled` exclui pendente, `pending`
     inclui só pendente); teste de `projectedBalance` ganhou um caso a mais (RECEBIDO
     antecipado no mês projetado não deveria contar — só reforça o que já era esperado).
     `rankings.test.ts` e `reserve.test.ts` ganharam um teste novo cada, confirmando
     exclusão de pendente (não tinham cobertura nenhuma de status antes).
  6. `MANUAL-DE-USO.md` — seções "Painel" e "Relatórios" atualizadas pra deixar explícito
     que os cards/gráficos "realizados" são só liquidado, e "Provisão"/"Fluxo projetado"
     são só pendente.
- **Verificado ao vivo, contra o banco de dev, servidor `next dev` real** (login sem
  senha via magic link, mesma técnica dos testes E2E): criados 2 lançamentos de teste no
  workspace "Felipe (dev)" — uma despesa liquidada (PAGO, -R$1.000) e uma pendente
  (A_PAGAR, -R$5.000), mesmo mês. Painel mostrou **Despesa: -R$1.000,00** (bate exato,
  pendente excluído) e "Top 5 despesas" listou só o lançamento liquidado. Fluxo Projetado
  mostrou "Saldo hoje: -R$1.000,00" (bate); meses futuros não mudaram porque o
  lançamento pendente de teste vencia no mês corrente, que a projeção
  intencionalmente ignora (evita contar duas vezes o que já está no saldo de hoje —
  mesma regra já coberta por teste unitário). Os 2 lançamentos de teste foram apagados
  depois da verificação.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (294/294, +6 testes novos), `npx tsc --noEmit` limpo (pegou
  automaticamente todos os call sites do parâmetro novo), `npm run test:integration`
  (26/26, intacto). Verificação manual descrita acima, contra dados reais no banco de
  dev.
- **Documentos relacionados:** `lib/finance/derived.ts`, `lib/finance/period.ts`,
  `lib/finance/rankings.ts`, `lib/finance/reserve.ts`, `app/(app)/painel/page.tsx`,
  `app/(app)/relatorios/balanco-anual/page.tsx`,
  `app/api/relatorios/balanco-anual/pdf/route.ts`, `tests/finance/period.test.ts`,
  `tests/finance/rankings.test.ts`, `tests/finance/reserve.test.ts`,
  `MANUAL-DE-USO.md`.

---

### Registro Nº 054
- **Data:** 2026-08-11
- **Etapa concluída:** Editar histórico de investimento + filtro de prazo em Dívidas
- **Descrição:** Usuário pediu, direto na versão real do sistema, duas features
  independentes: (1) na tela de detalhe de um investimento, a tabela "histórico de
  movimentações" precisa de Editar/Salvar, impactando o `Entry` de verdade por trás; (2)
  em Patrimônio → Dívidas, filtro de curto prazo (até 12 meses) × longo prazo (acima de
  12 meses).
- **O que foi feito:**
  1. **`lib/entries/investment.ts::updateInvestmentEventEntry`** — nova função (não
     existia nenhum update de evento/entry de investimento, só create). Carrega o `Entry`
     existente validando `workspaceId`+`investmentId` (escopo duplo), resolve a categoria
     nova pela MESMA natureza do `Entry` original (nunca deixa trocar Renda↔Posição),
     atualiza categoria/responsável/valor/data. `updateInvestmentEventEntryAction`
     (`app/(app)/investimentos/actions.ts`) + `InvestmentHistoryRow.tsx` (novo, Client
     Component por linha da tabela, mesmo padrão de `InvestmentEditForm.tsx`/`AssetCard.tsx`
     — campos sempre renderizados, `disabled` até "Editar", estado controlado em vez de
     `<form>`+`FormData` do DOM porque `<form>` não é filho válido de `<tr>`). Os totais do
     topo da página (Investido, Valor atual, Ganho de capital, Rentabilidade, Renda
     recebida, Retorno total) já eram recalculados em tempo real a partir das entries —
     editar uma linha já propaga sozinho, só precisou de `revalidatePath`.
     `EVENT_CATEGORY_OPTIONS`/`INCOME_CATEGORY_OPTIONS` movidos de `page.tsx` pra
     `lib/finance/investment-instruments.ts` (evita duplicar entre a tela e o componente
     novo).
  2. **`lib/finance/open-installments.ts::classifyDebtTerm`** — função pura nova,
     `"curto"` se `lastDueDate` (já exibido como "Prazo") vence em até 12 meses a partir de
     hoje, `"longo"` depois disso (usa `addMonths`, já existente). `dividas/page.tsx`
     ganhou 3 abas (Todas/Curto/Longo) via `searchParams` + `<Link>`, mesmo padrão já
     usado em Fluxo Projetado (6/12/24 meses) — nenhum `"use client"` novo nessa tela. Os
     cards de resumo, o gráfico e a tabela recalculam sobre os grupos já filtrados (mostra
     o total do que está sendo visto). `app/api/patrimonio/dividas/pdf/route.ts` lê o
     mesmo `?prazo=` e aplica o mesmo filtro; `buildDividasPdf` ganhou um `title` opcional
     pra refletir o filtro no PDF baixado.
- **Verificado ao vivo, contra o banco de dev, servidor `next dev` real** (login sem
  senha via magic link): criado um investimento de teste com aporte (R$2.000) + evento de
  Ganho de Capital (R$150) — editei o evento pra R$300 e confirmei que "Ganho de capital"
  no topo da página foi de R$150,00 pra R$300,00, exato. Criadas duas dívidas parceladas
  de teste (uma vencendo em 3 meses, outra em ~21 meses) — filtro "Todas" mostrou as duas
  (R$900,00 total), "Curto prazo" só a de 3 meses (R$300,00), "Longo prazo" só a de 21
  meses (R$600,00). Dados de teste apagados depois.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (298/298, +4 testes novos de `classifyDebtTerm`),
  `npx tsc --noEmit` limpo, `npm run build` limpo (61 rotas, incluindo as duas telas
  mexidas). Verificação manual descrita acima, contra dados reais no banco de dev.
- **Documentos relacionados:** `lib/entries/investment.ts`,
  `app/(app)/investimentos/actions.ts`,
  `app/(app)/investimentos/[id]/InvestmentHistoryRow.tsx`,
  `app/(app)/investimentos/[id]/page.tsx`, `lib/finance/investment-instruments.ts`,
  `lib/finance/open-installments.ts`, `app/(app)/patrimonio/dividas/page.tsx`,
  `app/api/patrimonio/dividas/pdf/route.ts`, `lib/reports/pdf/dividas.ts`,
  `tests/finance/open-installments.test.ts`.

---

### Registro Nº 055
- **Data:** 2026-08-12
- **Etapa concluída:** Correção de bug real em produção (filtro de prazo em Dívidas) +
  duas extensões do histórico de investimento (excluir lançamento; arquivar sem sumir da
  Carteira)
- **Descrição:** Usuário reportou, direto na versão real, que o filtro de curto/longo
  prazo de Dívidas (Registro Nº 054) estava classificando errado: um financiamento 1/24
  (23 parcelas restantes) apareceu em "Curto prazo", e um 1/12 (11 restantes) apareceu em
  "Longo prazo" — o oposto do esperado. Junto, dois pedidos novos sobre o histórico de
  investimento (Registro Nº 054): botão de excluir lançamento (precisa remover o `Entry`
  de verdade); e o botão "Arquivar" fazendo o investimento sumir inteiro da Carteira, com
  o cliente sem entender por que o valor dele ainda aparecia em outros lugares do sistema.
- **O que foi feito:**
  1. **`lib/finance/open-installments.ts::classifyDebtTerm`** — trocado o critério.
     Versão anterior comparava `lastDueDate` (vencimento da última parcela) contra
     `hoje + 12 meses`; isso dá resultado errado quando há parcela atrasada (empurra
     `lastDueDate` sem refletir quanto realmente falta pagar). Novo critério: compara
     `remainingCount` (parcelas que ainda faltam, já calculado por `openInstallmentGroups`)
     contra o limiar (padrão 12) — como todo parcelamento deste sistema é mensal,
     "12 parcelas restantes" e "12 meses restantes" são equivalentes, sem depender de
     estar em dia. Função não recebe mais `today` (não precisa). Call sites atualizados em
     `dividas/page.tsx` e `app/api/patrimonio/dividas/pdf/route.ts`.
  2. **`lib/entries/investment.ts::deleteInvestmentEventEntry`** — nova função, mesmo
     escopo duplo (`workspaceId`+`investmentId`) de `updateInvestmentEventEntry`, exclui o
     `Entry` de verdade. `deleteInvestmentEventEntryAction` (`actions.ts`) +
     botão "Excluir" em `InvestmentHistoryRow.tsx` (com `window.confirm()` antes, já que é
     irreversível) ao lado de "Editar". Os totais do topo da página recalculam sozinhos no
     próximo render (mesma razão do Registro Nº 054 — são sempre derivados das entries).
  3. **`app/(app)/investimentos/page.tsx`** (Carteira) — investigado o relato do "cálculo
     ainda aparecendo no painel": os totais de Investimento no Painel (`totals.investimento`
     e "Saldos por carteira → Investimentos") vêm direto de `Entry`/`Wallet`, nunca de
     `Investment.isActive` — **por design correto**: arquivar não é vender, o dinheiro
     continua de verdade na carteira. A tela de Análise de Investimentos já filtra
     `isActive: true` corretamente (não mudou). O bug de verdade era só a Carteira escondendo
     o investimento inteiro ao arquivar, o que dava a impressão de "sumiu mas ainda conta em
     algum lugar". Corrigido: query não filtra mais `isActive`, os investimentos são
     separados em duas seções — ativos normais, e "Arquivados" abaixo com opacidade
     reduzida (`opacity-50`) e rótulo "(arquivado)" — continuam clicáveis (é como o cliente
     reativa).
- **Verificado ao vivo, contra o banco de dev, servidor `next dev` real** (login sem
  senha via magic link): criada dívida parcelada 12x (1 paga, 11 restantes) e outra 24x (1
  paga, 23 restantes) — `?prazo=curto` mostrou só a 12x, `?prazo=longo` só a 24x, confirmando
  a correção exata dos dois casos reportados. Criado investimento com 2 lançamentos,
  clicado "Excluir" numa linha do histórico — confirmado no banco que o `Entry` foi
  removido de verdade e que os totais da página recalcularam a partir do que sobrou.
  Arquivado um investimento de teste e confirmado que ele continua aparecendo em
  `/investimentos`, na seção "Arquivados".
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (300/300, testes de `classifyDebtTerm` reescritos pro novo
  critério + 2 casos cobrindo os bugs reais reportados), `npx tsc --noEmit` limpo,
  `npm run build` limpo. Verificação manual descrita acima, contra dados reais no banco de
  dev.
- **Documentos relacionados:** `lib/finance/open-installments.ts`,
  `app/(app)/patrimonio/dividas/page.tsx`, `app/api/patrimonio/dividas/pdf/route.ts`,
  `lib/entries/investment.ts`, `app/(app)/investimentos/actions.ts`,
  `app/(app)/investimentos/[id]/InvestmentHistoryRow.tsx`,
  `app/(app)/investimentos/page.tsx`, `tests/finance/open-installments.test.ts`.

---

### Registro Nº 056
- **Data:** 2026-08-12
- **Etapa concluída:** Bloqueio de acesso ao sistema (admin-only)
- **Descrição:** Usuário pediu uma alternativa a excluir a conta de um cliente
  inadimplente: um bloqueio reversível, com motivo escolhido num menu suspenso, que
  mostra uma mensagem específica pro cliente na próxima vez que ele tentar acessar o
  sistema — incluindo um botão "Atualizar pagamento" sem destino ainda (usuário disse
  explicitamente que não sabe pra onde apontar). Decisão confirmada com o usuário antes
  de implementar: o bloqueio é **por workspace** (a "conta do cliente" inteira — todo
  mundo que acessa aquele workspace fica bloqueado), não por pessoa/profile, porque
  inadimplência é um conceito de workspace neste sistema (é onde já mora `Subscription`).
- **O que foi feito:**
  1. **Schema** — `Workspace` ganhou `blockedAt`/`blockedReason` (novo enum
     `WorkspaceBlockReason`: FATURA_EM_ABERTO, SOLICITACAO_DO_CLIENTE,
     VERIFICACAO_DE_SEGURANCA, ORIENTACAO_DO_CONSULTOR, OUTRO)/`blockedDetail` (texto
     livre, só usado com OUTRO)/`blockedBy`. Sem tabela de histórico separada — mesmo
     espírito leve de `Entitlement.reason`/`grantedBy`; desbloquear zera os 4 campos.
     Migration aplicada à mão (`prisma migrate dev` trava nesta máquina/banco — problema
     conhecido, ver seção 23 do PROJECT_STATE.md — `.sql` escrito manualmente e aplicado
     via `pg` cru + registro em `_prisma_migrations`, mesmo contorno já documentado).
  2. **Gate de acesso** — `lib/auth/session.ts::requireActiveMembership()` ganhou o
     mesmo mecanismo do gate de LGPD: `if (membership.workspace.blockedAt) redirect("/acesso-bloqueado")`,
     logo após resolver a membership ativa. Como `app/(app)/layout.tsx` chama essa função
     uma vez no topo da árvore, cobre toda a `(app)` de graça. `requireApiWorkspaceMembership()`
     (rotas de API, não passam pelo layout) e `requireMembershipForWorkspace()` (não usada
     ainda, mas existe pronta) ganharam o mesmo check, virando `ApiError(403)`.
  3. **Tela `/acesso-bloqueado`** — mesmo esqueleto de `/aceitar-politica`: resolve a
     membership bloqueada, mostra a mensagem do motivo (`lib/workspace/block-reasons.ts`),
     botão "Atualizar pagamento" desabilitado (só no motivo Fatura em aberto, com aviso
     "em breve"), contato por e-mail (reusa `admin@prospectafinance.com.br`, já usado em
     Política de Privacidade — nenhum contato novo inventado). Escape hatch: se a pessoa
     tiver outro workspace ACTIVE e não bloqueado (ex.: consultor com vários clientes, só
     um bloqueado), mostra links reusando a Server Action já existente
     `lib/workspace/switch.ts::setActiveWorkspace` — sem isso, ficaria preso na tela.
  4. **Admin** — `app/(app)/admin/usuarios` ganhou `BlockAccessControl.tsx` (mesmo
     esqueleto de `AdvisorControl.tsx`), na linha do titular de cada workspace: fechado
     mostra o status + botão bloquear/desbloquear; aberto (bloquear) vira um `<select>`
     de motivo + `<textarea>` condicional pro motivo "Outro". Nunca aparece na própria
     linha do admin logado (mesma auto-proteção de `DeleteUserButton`/`PlatformAdminToggle`
     — evita se trancar fora sem ninguém pra desbloquear). `blockWorkspaceAccess`/
     `unblockWorkspaceAccess` em `actions.ts`, mesmo padrão de auth das outras actions do
     arquivo.
  5. `lib/workspace/block-reasons.ts` (rótulos + mensagens, sem import de `prisma` — usado
     por um Client Component) separado de `lib/workspace/block.ts` (`blockWorkspace`/
     `unblockWorkspace`, com `prisma`) — mesmo cuidado de bundle já documentado nesta
     sessão pra `lib/finance/investment-instruments.ts`.
- **Fora de escopo (de propósito):** banir no Supabase Auth (bloqueio é só em nível de
  aplicação — precisa logar pra VER a mensagem, igual ao gate de LGPD); link real do
  botão "Atualizar pagamento"; tabela de histórico/auditoria separada de bloqueios.
- **Verificado ao vivo, contra o banco de dev, servidor `next dev` real** (login sem
  senha via magic link, dois usuários de teste — um platform admin, um cliente comum):
  bloqueado pelo admin com motivo "Fatura em aberto" → confirmado no banco → cliente
  redirecionado pra `/acesso-bloqueado` com a mensagem certa e o botão desabilitado →
  rota de API (`/api/patrimonio/dividas/pdf`) retornou 403 → desbloqueado → cliente voltou
  a acessar `/painel` normalmente → motivo "Outro" com texto customizado apareceu exato →
  dado ao cliente uma segunda membership ADVISOR num workspace não bloqueado → escape
  hatch apareceu na tela de bloqueio e o link levou pro `/painel` do outro workspace.
  Dados de teste apagados depois.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (301/301, +1 teste de regressão em `tests/auth/session.test.ts`
  documentando que `resolveActiveMembership` não considera bloqueio de propósito),
  `npx tsc --noEmit` limpo, `npm run build` limpo (rota `/acesso-bloqueado` nova
  confirmada na lista). Verificação manual completa descrita acima.
- **Documentos relacionados:** `prisma/schema.prisma`,
  `prisma/migrations/20260812080000_workspace_block_access/migration.sql`,
  `lib/auth/session.ts`, `lib/workspace/block.ts`, `lib/workspace/block-reasons.ts`,
  `app/(auth)/acesso-bloqueado/page.tsx`, `app/(app)/admin/usuarios/actions.ts`,
  `app/(app)/admin/usuarios/BlockAccessControl.tsx`, `app/(app)/admin/usuarios/page.tsx`,
  `tests/auth/session.test.ts`.

---

### Registro Nº 057
- **Data:** 2026-08-12
- **Etapa concluída:** Deploy do bloqueio de acesso (Registro Nº 056) — commit, produção e
  confirmação do usuário
- **Descrição:** Fechamento do Registro Nº 056: commit/push autorizados pelo usuário,
  CI verde, migration aplicada em produção (faltava — só tinha ido pro banco de dev
  durante o desenvolvimento) e teste ao vivo do próprio usuário na versão real,
  confirmando que a feature funciona de ponta a ponta.
- **O que foi feito:**
  1. Commit `fcf1734` ("Adiciona bloqueio de acesso ao sistema (admin-only)"), push pro
     `master`. CI (`.github/workflows/ci.yml`) rodou verde nos dois jobs —
     `build-and-test` e `integration-tests` — run
     [31587968561](https://github.com/fhildebrando-lfsh/PROSPECTA-Finance/actions/runs/31587968561).
  2. **Migration `20260812080000_workspace_block_access` aplicada em produção.** Só tinha
     sido aplicada no banco de dev durante o desenvolvimento (Registro Nº 056) — sem
     aplicar em produção também, o deploy automático da Vercel quebraria toda consulta
     que toca `Workspace` (o `Prisma Client` novo pede as 4 colunas novas, que não
     existiam ainda lá). Confirmado antes de aplicar: última migration registrada em
     produção era a mesma que em dev antes desta (`20260810100000_investments`), e as
     colunas `blocked_*` realmente não existiam ainda. Aplicado com o mesmo contorno já
     documentado (seção 23 do PROJECT_STATE.md — `prisma migrate deploy`/`dev` travam
     nesta máquina): `.sql` aplicado via `pg` cru dentro de uma transação + registro em
     `_prisma_migrations`, usando `.env.prod.local` (guarda dupla no script: aborta se
     detectar o ref de dev, exige o ref de produção). Confirmado depois: 4 colunas novas
     presentes, todas nulas, nenhum dos 8 workspaces reais afetados (ninguém ficou
     bloqueado por engano).
  3. **Usuário testou na versão real e confirmou que funcionou tudo** ("testei, funcionou
     tudo") — validação final, em cima do teste ao vivo já feito contra o banco de dev no
     Registro Nº 056.
- **Solicitado por:** Felipe Hildebrando (autorizou commit/push e aplicação em produção
  em mensagens separadas, cada uma com confirmação explícita antes de agir)
- **Executado por:** Claude Code
- **Evidência:** CI verde (link acima); consulta direta ao `information_schema.columns`
  de produção confirmando as 4 colunas novas antes/depois; confirmação verbal do usuário
  após teste na versão real.
- **Documentos relacionados:** mesmos do Registro Nº 056 — nenhum arquivo de código novo
  nesta etapa, só operação (deploy) e verificação.

---

### Registro Nº 058
- **Data:** 2026-08-12
- **Etapa concluída:** Correção dos achados do Supabase Security Advisor (RLS + funções +
  senha vazada)
- **Descrição:** Usuário recebeu o e-mail automático do Supabase ("Action required:
  security vulnerabilities detected", 11/08/2026) reportando 2 problemas críticos no
  projeto de produção, e trouxe também 3 capturas de tela do Security Advisor ao vivo (1
  erro, 11 avisos, 0 sugestões). Pediu correção completa, com o padrão explícito de "o
  sistema tem que ser 100% seguro" — e passo a passo pra qualquer coisa que só ele consiga
  fazer.
- **Investigação (só leitura, contra produção, antes de qualquer mudança):**
  - O 2º problema crítico do e-mail (`sensitive_columns_exposed`) **já estava resolvido**
    — confirmado que as 33 tabelas do schema `public`, exceto uma, já tinham RLS habilitada
    (trabalho de RLS completa de sessões anteriores). Só `_prisma_migrations` estava sem
    RLS — bate exatamente com o único erro ainda listado no Advisor ao vivo.
  - As 5 funções `SECURITY DEFINER` (`handle_new_auth_user`, `handle_deleted_auth_user`,
    `is_platform_admin`, `is_workspace_member`, `workspace_role`) nunca tiveram
    `GRANT`/`REVOKE` explícito desde que foram criadas (`prisma/sql/001`/`002`) — ficaram
    com o padrão do Postgres + do Supabase: `EXECUTE` liberado pra `anon` (visitante sem
    login) e `authenticated` via API (`/rest/v1/rpc/...`). Confirmado via
    `information_schema.routine_privileges`.
  - Confirmado que `is_platform_admin`/`is_workspace_member`/`workspace_role` são usadas
    DENTRO de praticamente toda policy de RLS do banco (`prisma/sql/001`, `003`, `004`,
    `005`, `006`, `008`) — não dá pra revogar de `authenticated`, só de `anon`.
    `handle_new_auth_user`/`handle_deleted_auth_user` só disparam via trigger — não
    precisam de `EXECUTE` de ninguém pra funcionar (o motor de triggers do Postgres
    invoca, não depende do privilégio de quem fez o INSERT/DELETE em `auth.users`).
  - Consultada a documentação oficial do Supabase sobre o lint "Function Executable by
    Anon/Authenticated" — confere o padrão de correção usado (`revoke ... from anon,
    public`, mantendo `authenticated` quando a função é usada em policy).
- **O que foi feito:** `prisma/sql/009_security_advisor_fixes.sql` (novo, mesmo padrão
  numerado dos arquivos 001-008) — `alter table public._prisma_migrations enable row
  level security` (sem nenhuma policy — ninguém além da própria ferramenta de migration,
  que conecta como owner e ignora RLS, precisa tocar essa tabela); `revoke execute` das 2
  funções de trigger de `public, anon, authenticated` (ninguém precisa); `revoke execute`
  das 3 funções auxiliares de RLS só de `public, anon` (mantém `authenticated`, que as
  policies exigem). O app não usa PostgREST hoje (acessa o banco via `pg`/Prisma com uma
  role privilegiada, que ignora esses `GRANT`/`REVOKE`) — é defesa em profundidade, sem
  efeito no funcionamento atual.
- **Verificado no banco de dev antes de tocar em produção:** criado um usuário de teste
  real via Admin API — trigger `handle_new_auth_user()` continuou criando
  profile+workspace+membership normalmente; excluído o usuário — trigger
  `handle_deleted_auth_user()` continuou removendo tudo normalmente; `is_workspace_member()`
  continuou executável. `npm test` (301/301) e `npm run test:integration` (26/26) verdes.
  Só depois disso, com autorização explícita do usuário, aplicado em produção.
- **Aplicado em produção e confirmado:** `_prisma_migrations` com RLS habilitada; as 33
  tabelas do schema `public` (nenhuma exceção) agora com RLS; grants das 5 funções
  exatamente como projetado (`anon` removido de todas, `authenticated` mantido só nas 3
  usadas por policy).
- **Fora do alcance de SQL/código — precisa de ação manual do usuário no painel do
  Supabase:** "Leaked Password Protection Disabled" (1 aviso restante) — é uma
  configuração de Auth, não uma tabela/função do banco; sem acesso de administrador ao
  projeto Supabase (fora do escopo de credenciais desta sessão), não dá pra ligar por
  aqui. Passo a passo entregue ao usuário: Dashboard do Supabase → projeto
  `financas-pessoais` → **Authentication** → **Policies** (ou **Auth Settings**, conforme
  a versão do painel) → seção **Password Security** → ativar **"Leaked password
  protection"** (verifica contra o HaveIBeenPwned a cada cadastro/troca de senha) → Save.
- **Resultado esperado no Advisor após o recarregar:** Errors 1 → 0. Warnings 11 → 4 (3
  "Signed-In Users Can Execute" nas funções auxiliares de RLS — **esperado por design**,
  documentação do próprio Supabase confirma que isso é intencional quando a função é usada
  em policy — + 1 "Leaked Password Protection", até o usuário aplicar o passo manual
  acima).
- **Solicitado por:** Felipe Hildebrando (autorizou a aplicação em produção depois de ver
  a explicação do que mudaria)
- **Executado por:** Claude Code
- **Evidência:** consultas diretas ao `pg_class`/`information_schema.routine_privileges`
  de dev e produção, antes/depois; teste real de criação/exclusão de usuário contra dev;
  `npm test` + `npm run test:integration` verdes.
- **Documentos relacionados:** `prisma/sql/009_security_advisor_fixes.sql`.

---

### Registro Nº 059
- **Data:** 2026-08-12
- **Etapa concluída:** Restringe autocadastro aberto — exige aprovação do admin
- **Descrição:** Usuário reportou que qualquer pessoa com o link `/login` conseguia criar
  conta sozinha e ganhar acesso imediato, com workspace próprio criado na hora — e pediu
  pra fechar isso, pelo menos por enquanto. Descreveu dois mecanismos: (1) autocadastro
  livre vira pendente, com e-mail avisando o admin pra liberar; (2) admin convida um
  e-mail específico, a pessoa recebe convite e já fica apta a criar conta com acesso.
  Investigação (agente Explore) achou que o mecanismo (2) **já existia e funcionava**,
  via `/admin/clientes` → `createClientPreRegistration` — nenhum código novo precisou
  pra isso. Só o (1) precisou ser construído.
- **O que foi feito:**
  1. **Schema** — `WorkspaceBlockReason` ganhou o valor `AGUARDANDO_APROVACAO` (só o
     próprio trigger de signup grava, nunca uma escolha manual do admin — excluído do
     `<select>` de bloqueio manual). `Workspace` ganhou `adminNotifiedAt` (idempotência do
     e-mail de aviso). Migration `20260812120000_pending_approval` — `ALTER TYPE ... ADD
     VALUE` + `ADD COLUMN`, aplicada à mão (mesmo contorno da seção 23) em dev e depois
     produção.
  2. **Trigger** — `prisma/sql/010_self_signup_requires_approval.sql` reescreve
     `handle_new_auth_user()` (definida em 001, invite-aware desde 007): o branch "sem
     convite pendente" agora grava `blocked_at`/`blocked_reason = 'AGUARDANDO_APROVACAO'`
     no mesmo INSERT do workspace novo — reaproveita o mecanismo de bloqueio de acesso do
     Registro Nº 056 em vez de criar um conceito de "pendente" do zero. O branch com
     convite (fluxo de `/admin/clientes`) não muda em nada — continua dando acesso
     imediato. O workspace pessoal continua sendo criado mesmo bloqueado (evita o `throw`
     duro de `requireActiveMembership()` pra quem fica com zero membership — a pessoa
     sempre tem exatamente 1).
  3. **Notificação** — `lib/workspace/pending-approval.ts::notifyAdminsOfPendingApproval`
     busca todo `profile.isPlatformAdmin=true`, resolve e-mail via Admin API, manda
     e-mail (novo template `pendingApprovalNotificationEmail`) linkando pra
     `/admin/usuarios` — idempotente via `adminNotifiedAt`. Chamado de dois pontos (os
     únicos onde uma pessoa nova pode terminar de se cadastrar):
     `app/(auth)/login/actions.ts::signup()` (cadastro por e-mail/senha) e
     `app/auth/confirm/route.ts` (primeiro login via Google).
  4. **Admin aprova pela mesma tela do Registro Nº 056** — `BlockAccessControl.tsx` mostra
     "Aguardando aprovação" (âmbar, não vermelho) + botão "aprovar acesso" em vez de
     "desbloquear" quando o motivo é este — mesma action `unblockWorkspaceAccess`, zero
     lógica nova. `/admin/usuarios` ganhou um banner de contagem no topo.
  5. `tests/e2e/helpers/fixtures.ts::createE2EUser()` ajustado pra desbloquear o
     workspace logo após criar (cai no mesmo fallback sem convite) — sem isso, os specs
     E2E existentes quebrariam.
  6. Dica de senha adicionada em `/login` (modo cadastro) — "Mínimo de 10 caracteres, com
     letra maiúscula, minúscula, número e símbolo" — depois que o usuário reforçou a
     política de senha no painel do Supabase (Registro Nº 058, item pendente do Leaked
     Password Protection).
- **Verificado no banco de dev antes de produção:** cadastro sem convite (via Admin API,
  mesmo trigger que `signUp()` dispara) → workspace nasceu bloqueado
  `AGUARDANDO_APROVACAO`, `adminNotifiedAt` ainda vazio (só a chamada da aplicação seta).
  `notifyAdminsOfPendingApproval()` chamada direto → `adminNotifiedAt` gravado; chamada de
  novo → não reenvia (idempotência confirmada). Pessoa bloqueada caiu em
  `/acesso-bloqueado` com a mensagem certa. Banner apareceu em `/admin/usuarios`; clique em
  "aprovar acesso" → `blocked_at` voltou a `null` → acesso a `/painel` liberado na hora.
  Cadastro COM convite pendente → entrou direto no workspace certo, sem bloqueio, acesso
  imediato confirmado. Suíte E2E completa (5 specs) rodou verde depois do ajuste da
  fixture. **Nota:** não foi possível exercitar o formulário público de `/login` de
  verdade nesta rodada — o projeto de dev (sem SMTP próprio, só o remetente padrão
  limitadíssimo do Supabase) bateu o rate limit de e-mail depois de poucas tentativas;
  contornado testando a mesma lógica via Admin API (dispara o mesmo trigger, sem mandar
  e-mail) + chamada direta de `notifyAdminsOfPendingApproval`. Produção já usa SMTP
  próprio (Brevo, Registro Nº 034/035-ish), não deve ter esse teto.
- **Fora de escopo (de propósito):** o fluxo de convite por e-mail específico
  (`/admin/clientes`) — já existia, só confirmado ao vivo; checkbox de LGPD no primeiro
  login via Google — gap já conhecido, não fazia parte deste pedido; feature flag pra
  reabrir autocadastro livre — não pedido, reversível bastando reverter o arquivo `010`.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test` (301/301), `npx tsc --noEmit` limpo, `npm run build` limpo,
  `npm run test:e2e` (5/5) verde. Verificação manual completa descrita acima, contra
  dados reais no banco de dev.
- **Documentos relacionados:** `prisma/schema.prisma`,
  `prisma/migrations/20260812120000_pending_approval/migration.sql`,
  `prisma/sql/010_self_signup_requires_approval.sql`, `lib/workspace/block-reasons.ts`,
  `lib/workspace/pending-approval.ts`, `lib/email/templates.ts`,
  `app/(auth)/login/actions.ts`, `app/(auth)/login/page.tsx`, `app/auth/confirm/route.ts`,
  `app/(app)/admin/usuarios/BlockAccessControl.tsx`, `app/(app)/admin/usuarios/page.tsx`,
  `tests/e2e/helpers/fixtures.ts`.

---

### Registro Nº 060
- **Data:** 2026-08-12
- **Etapa concluída:** Traduz erros do Supabase Auth (bug real achado em produção) +
  centraliza cabeçalho do card de login
- **Descrição:** Usuário testou o cadastro em produção logo após o deploy do Registro
  Nº 059 e achou um bug real: ao digitar uma senha que não atende à política reforçada
  (Registro Nº 058), a tela mostrava o erro cru do Supabase, em inglês —
  `"Password should contain at least one character of each: ..."` — direto na tela,
  violando a exigência do usuário de que todo texto do sistema seja português formal,
  sem erro. Pediu também pra centralizar o logo/título/subtítulo do card de login (hoje
  alinhados à esquerda).
- **O que foi feito:**
  1. **`lib/auth/error-messages.ts`** (novo) — `translateAuthError(error)` traduz pelo
     `error.code` (estável entre versões do SDK, ao contrário do texto livre de
     `error.message`, sempre em inglês) — mapeia os códigos mais comuns
     (`weak_password`, `user_already_exists`, `invalid_credentials`,
     `email_not_confirmed`, `over_email_send_rate_limit`, `same_password`,
     `user_not_found`, `email_address_invalid`, `signup_disabled`) pra mensagens em
     português que fazem sentido pro usuário final. Código não mapeado cai num texto
     genérico seguro ("Não foi possível concluir…") — nunca vaza o inglês original.
     Confirmado o `error.code` real contra o banco de dev antes de mapear (não chutado).
  2. Aplicado em **todo lugar que hoje mostra erro do Supabase Auth pro usuário final**
     (grep confirmou que eram só esses 5, nenhum a mais): `app/(auth)/login/actions.ts`
     (`login`, `signup`, `requestPasswordReset`), `app/(auth)/definir-senha/actions.ts`,
     `app/(auth)/redefinir-senha/page.tsx`, `components/GoogleSignInButton.tsx`. Páginas
     admin-only que mostram `error.message` de outras APIs (ex.: listagem de usuários)
     não foram mexidas — erro técnico visível só pro admin é aceitável, diferente de
     erro de autenticação visível pro cliente final.
  3. **`app/(auth)/login/page.tsx`** — logo, título e subtítulo dos dois cards (login/
     cadastro e "esqueci minha senha") envolvidos num `<div className="flex flex-col
     items-center text-center">` — antes alinhados à esquerda por padrão do bloco,
     agora centralizados.
- **Verificado:** `translateAuthError` chamada diretamente com os códigos reais
  (confirmado contra o SDK: `weak_password` de verdade tem `code: "weak_password"`) —
  cada um cai na mensagem certa em português; código desconhecido cai no genérico, nunca
  no texto em inglês. Centralização confirmada via inspeção de `getComputedStyle`
  (`display: flex`, `align-items: center`, `text-align: center`) contra o servidor de
  dev. `npm test` (301/301), `npx tsc --noEmit` e `npm run build` limpos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** teste direto de `translateAuthError` com os `error.code` reais;
  `npm test`, `tsc`, `build` limpos; inspeção de layout ao vivo contra dev.
- **Documentos relacionados:** `lib/auth/error-messages.ts`,
  `app/(auth)/login/actions.ts`, `app/(auth)/login/page.tsx`,
  `app/(auth)/definir-senha/actions.ts`, `app/(auth)/redefinir-senha/page.tsx`,
  `components/GoogleSignInButton.tsx`.

---

### Registro Nº 061
- **Data:** 2026-08-12
- **Etapa concluída:** Balanço do Painel passa a descontar Investimento + gráficos
  ganham linha de Investimento e despesa como barra positiva
- **Descrição:** Usuário revisou o Painel em produção e identificou um problema
  conceitual: o "Balanço" (KPI e linha "Saldo" dos gráficos) somava "Investimento" como
  se fosse receita, quando na verdade um aporte tira dinheiro da carteira disponível (só
  volta a ficar líquido se resgatado). Pediu também duas melhorias visuais nos gráficos
  de barra (Últimos 6 meses / Provisão): linha branca nova pra "Investimento" (pode ir
  abaixo de zero) e despesa passando a desenhar como barra positiva (acima do zero, igual
  receita, diferenciada só pela cor vermelha) — só visual, sem mexer em lançamentos.
- **O que foi feito:**
  1. **`lib/finance/period.ts`** — `periodTotals()`: `balanco` passa de
     `receita.plus(despesa).plus(investimento)` para `receita.plus(despesa).minus(investimento)`.
     Como `investimento` já vem com o sinal certo (positivo em aporte, negativo em
     retirada), inverter a soma sozinho cobre os três casos: aporte reduz o Balanço,
     retirada aumenta o Balanço, e dividendo/aluguel recebido de verdade (já lançado como
     Receita numa carteira real, nunca passa por `investimento`) continua somando certo,
     sem mudança. Card "Investimento" continua exatamente como está — só a fórmula do
     Balanço mudou. Como `periodTotals`/`monthlySeries`/`projectedBalance` são
     compartilhadas, a correção se propaga automaticamente pro Painel (KPI + 2 gráficos),
     Balanço Anual (tela+PDF) e Fluxo Projetado (tela+PDF).
  2. **`components/charts/MonthlyChart.tsx`** — `MonthlyChartPoint` ganha
     `investimento?: number` (opcional, pra não quebrar os outros 4 reaproveitamentos do
     componente: Fluxo Projetado, Dívidas, Análise de Investimentos, Bens). Despesa passa
     a desenhar com `Math.abs()` na barra (só na barra — o dado original com sinal
     continua intacto fora do componente). Nova `<Line dataKey="investimento" stroke="#ffffff">`
     branca, só renderiza quando pelo menos um ponto de `data` tem `investimento`
     definido — com sinal real (sem `Math.abs()`), pode desenhar abaixo de zero.
  3. **`app/(app)/painel/page.tsx`** — os dois loops que montam `monthlyChartData` e
     `forecastChartData` passam `investimento: t.investimento.toNumber()` ao objeto
     retornado.
  4. **`tests/finance/period.test.ts`** — fixture existente de `periodTotals` (receita
     5000, despesa -2000, investimento -500) atualizada de `balanco = 2500` pra
     `balanco = 3500` (`5000 - 2000 - (-500)`). Novo caso em `projectedBalance` com um
     aporte pendente (`nature: "INVESTIMENTO"`, `status: "ESTIMATIVA"`) confirmando que
     reduz o saldo projetado — a fixture original não cobria esse sinal.
- **Verificado:** `npm test` (302/302), `npx tsc --noEmit` e `npm run build` limpos.
  Verificação ao vivo contra o banco de dev (login sem senha, técnica da seção 21): criado
  workspace de teste temporário com receita (R$5.000, recebida), despesa (R$2.000, paga) e
  um investimento novo com aporte inicial de R$800 no mesmo mês — Balanço do Painel
  mostrou R$2.200,00 (`5000 - 2000 - 800`, confirmado na mão), o KPI "Investimento" mostrou
  R$800,00 separado, e o gráfico "Últimos 6 meses" desenhou a barra de despesa em vermelho
  acima do zero, ao lado da barra de receita em verde. Fluxo Projetado ("Saldo hoje")
  também refletiu o novo cálculo (R$3.000,00, batendo com `dashboardBalanceBlocks`, que não
  foi alterado). Dados de teste removidos do banco de dev ao final.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** `npm test`, `tsc`, `build` limpos; verificação ao vivo com lançamentos
  reais no banco de dev (Balanço = R$2.200,00 confirmado na mão) e captura de tela do
  gráfico mostrando a barra de despesa positiva.
- **Documentos relacionados:** `lib/finance/period.ts`,
  `components/charts/MonthlyChart.tsx`, `app/(app)/painel/page.tsx`,
  `tests/finance/period.test.ts`.

---

### Registro Nº 062
- **Data:** 2026-08-12
- **Etapa concluída:** Corrige "Erro interno." na importação de planilhas grandes
  (timeout de transação do Prisma)
- **Descrição:** Usuário tentou importar sua planilha histórica completa (`DADOS
  (finanças pessoais) - 2025.csv`, 1737 linhas, anos de lançamentos) em produção e
  recebeu "Erro interno." depois da prévia carregar normalmente (2 erros reais, 717
  avisos majoritariamente duplicatas contra o histórico já existente). Antes de
  qualquer correção, confirmado via log real do Vercel (`vercel logs`) que a causa era
  `PrismaClientKnownRequestError` código `P2028`: "A commit cannot be executed on an
  expired transaction. The timeout for this transaction was 5000 ms, however 5486 ms
  [e, numa segunda tentativa, 6202 ms] passed since the start of the transaction."
  Também confirmado (consulta direta e somente leitura no banco de produção) que
  **nenhum dado foi gravado** — a transação expirada faz o Prisma abortar tudo, sem
  gravação parcial; o usuário só via o erro sem perder nem duplicar nada.
- **Causa raiz:** `lib/import/commit.ts::commitImportBatch` roda tudo dentro de um
  único `prisma.$transaction`: criação do lote, um `tx.entryGroup.create()`
  **sequencial** por grupo de parcelas/recorrência detectado (61 grupos nesta
  planilha) e depois um `tx.entry.createMany()` com todas as linhas importáveis. Para
  uma importação histórica grande, a soma dos passos sequenciais passa dos 5000ms
  padrão do Prisma pra transações interativas — a rota nunca definia um valor próprio.
- **O que foi feito:**
  1. **`lib/import/commit.ts`** — `prisma.$transaction(fn, { timeout: 30_000 })`
     (era o default de 5000ms). 30s dá folga confortável mesmo pra lotes bem maiores
     que os 1682 lançamentos importados nesta planilha.
  2. **`app/api/import/commit/route.ts`** — `export const maxDuration = 60` (novo),
     pra a função da Vercel não matar a requisição antes da transação atingir seu
     próprio limite mais alto.
- **Verificado:** reproduzido o problema de ponta a ponta rodando a lógica real de
  commit contra o banco de dev com a planilha real do usuário antes da correção
  (sucesso isolado, sem o `after()` de sincronização de Agenda, que só funciona dentro
  de uma requisição Next.js de verdade — não é o bug relatado). Depois da correção,
  reproduzida a importação completa pela UI real (login sem senha, upload do arquivo,
  clique em "Confirmar importação") contra o banco de dev: **"Importação concluída:
  1682 lançamentos importados, 55 ignorados (erro ou duplicata)"** em 3,3 segundos, sem
  erro. Dados de teste removidos do banco de dev ao final (dois lotes, no total, das
  duas rodadas de teste). `npm test` (302/302), `tsc --noEmit` e `build` limpos.
- **Solicitado por:** Felipe Hildebrando (relatado ao vivo em produção)
- **Executado por:** Claude Code
- **Evidência:** log real do Vercel confirmando a causa (`P2028`, timeout de 5000ms);
  consulta somente-leitura em produção confirmando zero gravação parcial; reprodução
  completa do fluxo de importação contra o banco de dev, antes (falha) e depois
  (sucesso, 1682 lançamentos) da correção; `npm test`, `tsc`, `build` limpos.
- **Documentos relacionados:** `lib/import/commit.ts`, `app/api/import/commit/route.ts`.

---

### Registro Nº 063
- **Data:** 2026-08-12
- **Etapa concluída:** Erro de importação passa a aparecer em popup no centro da tela
- **Descrição:** Usuário pediu, depois de esbarrar no erro corrigido no Registro Nº 062,
  que qualquer erro de importação (não só aquele) fosse mostrado de forma mais visível —
  um popup no meio da tela, em vez do texto pequeno em vermelho que hoje aparece logo
  acima do formulário e pode passar despercebido.
- **O que foi feito:** `app/(app)/lancamentos/importar/ImportWizard.tsx` — novo componente
  `ImportErrorModal` (mesmo padrão visual já usado em `LgpdSavedModal`: overlay escuro,
  card centralizado, botão "Fechar"), substitui o `<p className="text-red-400">{error}</p>`
  inline. Cobre os três formatos de importação (CSV/OFX/PDF) e as duas fases (prévia e
  confirmação), já que todos usam o mesmo estado `error` do wizard — nenhuma mudança na
  lógica de quando/por que um erro acontece, só em como ele é mostrado.
- **Verificado:** contra o banco de dev (login sem senha), upload de um CSV vazio pra
  forçar o erro "Arquivo vazio." de propósito — popup renderizou centralizado, com título,
  mensagem e botão "Fechar" funcionando (confirmado que o popup some ao clicar).
  `npm test` (302/302), `tsc --noEmit` e `build` limpos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** captura de tela do popup ao vivo contra o banco de dev; `npm test`,
  `tsc`, `build` limpos.
- **Documentos relacionados:** `app/(app)/lancamentos/importar/ImportWizard.tsx`.

---

### Registro Nº 064
- **Data:** 2026-08-12
- **Etapa concluída:** Compromissos — seleção em lote, filtro de datas e "Salvar e
  Confirmar" em Incidentes
- **Descrição:** Usuário pediu três melhorias em Compromissos: (1) caixa de seleção
  (checkbox) pra marcar pendências em lote nas abas "Lista" e "Incidentes"; (2) filtro
  de datas nas duas abas; (3) em Incidentes, ao clicar "Editar", um terceiro botão
  "Salvar e Confirmar" ao lado de "Salvar"/"Cancelar" — "Salvar" grava as correções e
  mantém a linha pendente (pra conferir depois), "Salvar e Confirmar" grava e já tira a
  linha da lista (equivalente a "Confirmar que está correto", mas depois de editar).
- **O que foi feito:**
  1. **`app/(app)/compromissos/actions.ts`** — nova `bulkMarkSettled(ids: string[])`,
     mesma regra de `markSettled` em lote (`Promise.allSettled`, tolerante a falha
     individual — ex.: duas abas marcando o mesmo lançamento ao mesmo tempo).
  2. **`app/(app)/compromissos/CompromissosList.tsx`** (novo, client) — extrai a
     renderização da lista de `page.tsx` pra um componente com estado de seleção
     (`Set<string>`, mesmo padrão de `EntriesTable.tsx`): checkbox por linha,
     "Selecionar todos", barra de ação em lote quando há seleção. O botão individual
     "Marcar como pago/recebido" de cada linha passou a chamar a mesma
     `bulkMarkSettled` (lista de 1 id) — não duplica lógica com `markSettled` /
     `settleEntry`.
  3. **`app/(app)/compromissos/page.tsx`** — ganhou filtro de data por vencimento
     (`?from=&to=`, mesmo padrão de `app/(app)/lancamentos/page.tsx`: `<form>` GET com
     dois `<input type="date">` + botão "Filtrar", link "Limpar" quando ativo) e passou
     a delegar a renderização pro novo `CompromissosList`.
  4. **`app/(app)/compromissos/incidentes/actions.ts`** — nova
     `acknowledgeIncidentsBulk(ids: string[])` (mesmo padrão de `bulkMarkSettled`).
     `updateIncidentEntry` ganhou um campo `acknowledge` no `FormData`: quando `"1"`,
     grava `incidentAcknowledgedAt: new Date()` junto com o resto da atualização — é o
     que faz "Salvar e Confirmar" tirar a linha da lista, enquanto "Salvar" sozinho
     (`acknowledge` ausente/`"0"`) não mexe nesse campo, mantendo a linha pendente.
  5. **`app/(app)/compromissos/incidentes/IncidentCard.tsx`** — `handleSave` ganhou
     parâmetro `acknowledge: boolean`, setado por dois botões distintos. Checkbox de
     seleção (props `selected`/`onToggleSelect`, opcionais — card continua utilizável
     sozinho sem seleção, ex. se reaproveitado em outro contexto no futuro), desabilitada
     durante edição pra não confundir "selecionado pra ação em lote" com "em edição".
  6. **`app/(app)/compromissos/incidentes/IncidentsList.tsx`** (novo, client) — mesmo
     padrão de `CompromissosList`: seleção + barra de ação em lote ("Confirmar
     selecionados", chama `acknowledgeIncidentsBulk`).
  7. **`app/(app)/compromissos/incidentes/page.tsx`** — mesmo filtro de data por
     vencimento da Lista, delega a renderização pro novo `IncidentsList`.
- **Fora do escopo:** `app/(app)/compromissos/calendario/page.tsx` não foi tocado —
  continua usando `markSettled` (form action simples) por lançamento; o pedido foi só
  sobre "Lista" e "Incidentes".
- **Verificado:** contra o banco de dev (login sem senha), seedadas 4 pendências (Lista)
  e 2 incidentes de teste via SQL direto. Lista: selecionadas 2 pendências por checkbox,
  "Marcar como pago/recebido" em lote confirmou "2 lançamento(s) marcados." e as duas
  saíram dos buckets; filtro `?from=&to=` restringiu corretamente aos vencimentos dentro
  do intervalo. Incidentes: "Editar" abriu os 3 botões na ordem certa (Salvar / Salvar e
  Confirmar / Cancelar); "Salvar e Confirmar" gravou as correções e reduziu a contagem de
  2 para 1 incidente pendente. Dados de teste removidos do banco de dev ao final.
  `npm test` (302/302), `tsc --noEmit` e `build` limpos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** capturas de tela ao vivo (seleção em lote na Lista, formulário de
  edição de Incidente com os 3 botões); mensagens de confirmação em lote conferidas no
  texto da página; `npm test`, `tsc`, `build` limpos.
- **Documentos relacionados:** `app/(app)/compromissos/actions.ts`,
  `app/(app)/compromissos/CompromissosList.tsx`, `app/(app)/compromissos/page.tsx`,
  `app/(app)/compromissos/incidentes/actions.ts`,
  `app/(app)/compromissos/incidentes/IncidentCard.tsx`,
  `app/(app)/compromissos/incidentes/IncidentsList.tsx`,
  `app/(app)/compromissos/incidentes/page.tsx`.

---

## Próximo número de registro: **065**

*(a próxima etapa concluída deve gerar uma nova entrada aqui, numerada sequencialmente,
seguindo o mesmo formato: Data · Etapa concluída · Descrição · Solicitado por · Executado
por · Evidência · Documentos relacionados)*
