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

## Próximo número de registro: **041**

*(a próxima etapa concluída deve gerar uma nova entrada aqui, numerada sequencialmente,
seguindo o mesmo formato: Data · Etapa concluída · Descrição · Solicitado por · Executado
por · Evidência · Documentos relacionados)*
