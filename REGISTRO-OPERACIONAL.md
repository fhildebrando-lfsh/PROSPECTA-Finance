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

## Próximo número de registro: **027**

*(a próxima etapa concluída deve gerar uma nova entrada aqui, numerada sequencialmente,
seguindo o mesmo formato: Data · Etapa concluída · Descrição · Solicitado por · Executado
por · Evidência · Documentos relacionados)*
