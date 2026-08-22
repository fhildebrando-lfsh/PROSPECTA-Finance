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

### Registro Nº 065
- **Data:** 2026-08-15
- **Etapa concluída:** Reformulação da arquitetura — integração do Método PROSPECTAR (documento produzido, aguardando aprovação)
- **Descrição:** Leitura integral de `Metodologia PROSPECTA v5.0 — Diretrizes de Planejamento Financeiro, Consultoria e Gestão Patrimonial.docx` (fornecido pelo usuário) e produção de `ARQUITETURA-METODO-PROSPECTAR.md` — diagnóstico verificado linha a linha contra o código real (confirmando, entre outras coisas, que o PSF não tem nenhum código hoje e que a camada comercial `Plan`/`Feature`/`Subscription` existe no schema mas não está ligada a nenhuma tela), modelagem Prisma aditiva das 10 entidades novas do método (§13.7 do documento de origem) mais a entidade `Debt` (resgatada de uma decisão de escopo adiada em 2026-08-11), classificação de cada rota real de `app/(app)/` em Start/Pro/Max/Método (resolvendo a Pendência #1 "Alta" do documento de origem), e tradução da sequência de 17 passos (§13.9) em 16 Etapas de implementação agrupadas em 4 blocos. Segue o mesmo protocolo do Registro Nº 006 (`ARQUITETURA-IDENTIDADE-PLANOS.md`): documento de projeto, nenhum código/schema alterado, implementação só começa após aprovação item a item.
- **Regra confirmada com o usuário para todo o trabalho futuro:** nenhuma função, tela, tabela, coluna ou comportamento já existente pode ser alterado, renomeado ou removido — toda extensão é aditiva (tabela nova, coluna opcional, módulo novo).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** documento revisado seção a seção contra `prisma/schema.prisma`, `lib/`, `app/(app)/` e `prisma/seed.ts` reais antes de cada afirmação técnica.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md`, `ARQUITETURA-IDENTIDADE-PLANOS.md`, `PROJECT_STATE.md`.

---

### Registro Nº 066
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 0 do roteiro do Método — acesso do consultor deixa de ser escrita automática
- **Descrição:** Implementado `Membership.advisorCanWrite` (default `false`) — consultor (`ADVISOR`) nasce só com leitura, mesmo com Membership ativa; escrita exige concessão explícita do administrador, revogável a qualquer momento, sempre auditada em `AccessLog` (`GRANT_ADVISOR_WRITE`/`REVOKE_ADVISOR_WRITE`). Antes, `ADVISOR` tinha escrita plena, idêntica a `MEMBRO`, tanto em `lib/auth/session.ts::can()` quanto na RLS (`008_rls_completeness.sql`, 2026-08-10) — decisão revertida por exigência de segurança/LGPD Art. 20 (toda ação sobre dado de terceiro precisa ser rastreável, não automática por papel), conforme `AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md` §4.5 e `ARQUITETURA-METODO-PROSPECTAR.md` §3.2/5.7.
- **O que mudou:** `assertCanWrite()` ganhou terceiro parâmetro obrigatório (`advisorCanWrite`, sem default — mesmo padrão já usado em `periodTotals(settlement)`, força o compilador a apontar todo call site que precisa revisão); 46 pontos de chamada em 20 arquivos atualizados. `lib/workspace/advisor.ts::setAdvisorWriteAccess()` (novo) concede/revoga, e `assignAdvisor()` passou a zerar `advisorCanWrite` sempre que um consultor é (re)atribuído — trocar de consultor, ou a mesma pessoa saindo e voltando, nunca herda concessão anterior. Nova tela em `/admin/usuarios` (`AdvisorWriteToggle.tsx`) mostra "Escrita: só leitura/concedida" com botão conceder/revogar ao lado do consultor atribuído. Migration `20260815120000_advisor_can_write` (coluna nova) + `prisma/sql/011_advisor_write_grant.sql` (RLS em sincronia, defesa em profundidade — RLS ainda não é tecnicamente exercida, Prisma conecta como owner).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 305/305 (4 casos novos cobrindo `can()` com `role=ADVISOR` × `advisorCanWrite`); `npm run build` limpo, 61 rotas; suíte de integração contra o banco de dev real — 9 testes novos em `tests/integration/workspace/advisor.test.ts` cobrindo concessão, revogação, registro em `AccessLog`, erro sem consultor ativo, e reset da concessão ao trocar de consultor. Migration e RLS aplicadas e confirmadas no banco de dev (coluna `advisor_can_write`, default `false`). Não verificado via login real na UI (exigiria senha real do administrador).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; resultado da suíte de integração contra o banco de dev; consulta a `information_schema.columns` confirmando a coluna aplicada.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §3.2/5.7, `AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md` §4.5, `MANUAL-DE-USO.md` (seções 14/16), `lib/auth/session.ts`, `lib/workspace/advisor.ts`, `prisma/migrations/20260815120000_advisor_can_write/`, `prisma/sql/011_advisor_write_grant.sql`.

---

### Registro Nº 067
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 1 do roteiro do Método — `macro_bloco` na taxonomia, Régua de Alocação (posição atual) e `ownerPersonId`
- **Descrição:** Primeira etapa do Bloco I de `ARQUITETURA-METODO-PROSPECTAR.md`. `Subcategory.macroBloco`/`Entry.macroBlocoOverride` (novo, enum `MacroBloco`: ESSENCIAL/ESTILO_DE_VIDA/OBRIGACAO/POUPANCA) — as 285 subcategorias de Despesa classificadas via `seeds/seed_macro_blocos.csv` (282 preenchidas, 3 linhas de ajuste contábil ficam sem bloco de propósito), incorporando as decisões da revisão de 2026-08-15 (financiamento de Habitação/Transporte = Essencial, não Obrigação; vestuário conforme o método). `lib/method/allocation.ts` (novo) — `computeAllocation()` soma os 4 blocos por período (Poupança pela fórmula (b): aportes de INVESTIMENTO + transferências pra carteira CONTA_CAIXA, decisão do usuário), `percentOfIncome()`, bandas de referência por faixa de renda (§11.3) e comparação abaixo/dentro/acima. Nova tela `/relatorios/regua` mostra a posição do mês corrente contra a faixa da própria receita do período, com "não classificado" e "não alocado" sempre exibidos separados, nunca escondidos dentro de um bloco. `Wallet/Investment/Asset.ownerPersonId` (novo, opcional, aponta pra `Person`) — preparação para Open Finance e diagnóstico familiar do Método (§4.3 de `AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md`), sem UI nova nesta etapa.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 323/323 (18 casos novos em `lib/method/allocation.ts` — soma por bloco, Poupança pelas duas pernas de origem, receita zero sem dividir por zero, bandas de renda, comparação abaixo/dentro/acima); `npm run build` limpo, 62 rotas (`/relatorios/regua` nova). Migration `20260815130000_etapa1_macro_bloco_e_titularidade` e seed aplicados no banco de dev — confirmado por consulta direta (`supermercado`=ESSENCIAL, `restaurante`=ESTILO_DE_VIDA, `financiamento`/Habitação=ESSENCIAL, `uniforme_escolar`=ESSENCIAL) e por teste de integração novo (`tests/integration/method/allocation.test.ts`) que cria `Entry` reais no banco de dev, lê de volta com os relations de `subcategory`/`wallet`/`category`, e confirma que `computeAllocation` bate com o esperado (2/2). Suíte de integração completa: 9 arquivos, 35 testes. Não verificado por navegação real na tela (exigiria login com senha real do admin) — a suíte de integração cobre a mesma query/mapeamento que a tela usa.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; saída do seed (`macro_blocos: 282 subcategorias classificadas`); resultado da suíte de integração contra o banco de dev.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.1/6 (Etapa 1), `MANUAL-DE-USO.md` (seção 11), `lib/method/allocation.ts`, `lib/method/from-db.ts`, `app/(app)/relatorios/regua/page.tsx`, `seeds/seed_macro_blocos.csv`, `prisma/migrations/20260815130000_etapa1_macro_bloco_e_titularidade/`.

---

### Registro Nº 068
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 2 do roteiro do Método — Índice de Consistência (§13.6) e captura de conciliação de saldo
- **Descrição:** Segunda entrega do Bloco I. `lib/method/consistency.ts` (novo) — 5 componentes 0–1 (`coberturaTemporal`, `qualidadeCategorizacao`, `filaDeIncidentes`, `coberturaDeCarteiras`, `conciliacao`) e `computeConsistencyIndex()`, com os pesos confirmados na revisão de 2026-08-15 (25/25/20/15/15). Componente sem dado suficiente (`null`) nunca penaliza — o peso é redistribuído proporcionalmente entre os que têm dado, mesmo espírito de "não avaliado" do PSF. `filaDeIncidentes` reaproveita `lib/finance/incidents.ts::isEntryIncident` (não duplica a definição de incidente já existente) e degrada proporcionalmente conforme incidentes passam de 30 dias em aberto, sem corte abrupto. `BalanceReconciliation` (novo model) — captura "saldo declarado" × "saldo do sistema" (`lib/finance/balance.ts::walletBalance`, recalculado no momento da checagem, nunca confiando em valor do formulário). `lib/method/reconciliation.ts` (novo, impuro) — `reconcileWalletBalance()`/`latestReconciliationByWallet()`. Nova coluna "Conciliação" em Cadastros → Carteiras (`WalletReconcileControl.tsx`) — mesmo padrão visual de `AdvisorControl.tsx`, formatação de moeda/data feita local no componente (gotcha de bundle de Client Component com `Decimal`, já documentado, evitado de propósito).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 350/350 (27 casos novos de `consistency.ts` — cada componente isoladamente, pesos somando 100, redistribuição de peso quando componente é `null`, `overall` só `null` quando nada tem dado); `npm run build` limpo, 62 rotas (nenhuma nova — a conciliação vive dentro de `/cadastros/carteiras` já existente). Migration `20260815140000_balance_reconciliation` aplicada e confirmada no banco de dev. Suíte de integração ganhou `tests/integration/method/reconciliation.test.ts` (4 testes: saldo do sistema calculado a partir de `Entry` real, diferença registrada corretamente, erro pra carteira de outro workspace, `latestReconciliationByWallet` devolve só a checagem mais recente) — suíte completa: 10 arquivos, 37 testes, tudo verde. Não verificado por navegação real na tela (sem senha real do admin) — a suíte de integração cobre a mesma função que a tela chama.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; resultado da suíte de integração contra o banco de dev.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.6/6 (Etapa 2), `MANUAL-DE-USO.md` (seção 14), `lib/method/consistency.ts`, `lib/method/reconciliation.ts`, `app/(app)/cadastros/carteiras/WalletReconcileControl.tsx`, `prisma/migrations/20260815140000_balance_reconciliation/`.

---

### Registro Nº 069
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 3 do roteiro do Método — catálogo comercial real (6 SKUs, §13.8), `/admin/planos` e primeira tela gateada por `hasFeature()`
- **Descrição:** Terceira entrega do Bloco I. `Feature.gateKind` (novo, enum PLANO/METODO) — admin decide, por feature, se ela é liberada por nível de plano ou por camada de método. `prisma/seed-plans.ts` (novo, `npm run db:seed:plans`) — catálogo de 51 features de §13.8 + 6 Plans reais (Start/Pro/Max × Individual/Família, preços de §5.1). **Achado crítico antes de gatear qualquer tela:** 0 dos 3 workspaces do banco de dev (incluindo o workspace pessoal real) tinham qualquer `Subscription` — gatear direto travaria todo mundo. Descoberto que o mecanismo de backfill já existia (`LEGACY_INTERNAL`, criado na Arquitetura de Identidade/Planos, nunca reaplicado no banco de dev atual porque ele é um projeto Supabase novo, Registro Nº 047). O seed reforça `LEGACY_INTERNAL` com o catálogo inteiro (antigo + novo, 61 features) e reaplica o backfill idempotente da migration original — os 3 workspaces reais do banco de dev ganharam Subscription em `LEGACY_INTERNAL`. Só depois disso confirmado seguro, a tela `/relatorios/regua` (Etapa 1) passou a checar `hasFeature(workspaceId, "regua_posicao")` — primeiro uso real de `hasFeature()` desde que foi criada (Fase 2 Etapa 2 da Arquitetura de Identidade). Planos superados de um exercício de roadmap anterior (`START`/`PLUS`/`PREMIUM`/`PREMIUM_NEGOCIOS`, 12 features sem sobreposição de nome com o catálogo novo) marcados inativos (`isActive=false`, nunca apagados). Nova tela `/admin/planos` — matriz feature × plano com checkbox, seletor de `gateKind` por feature, ativar/desativar plano — tudo sem deploy.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 350/350 (sem teste novo — `entitlements.ts` e `consistency.ts`/`allocation.ts` já cobertos; `hasFeature` é impura, testada via integração); `npm run build` limpo, 69 rotas (`/admin/planos` nova). Migration `20260815150000_feature_gate_kind` aplicada. Seed rodado contra o banco de dev real e confirmado por query direta: 61 features no catálogo, `LEGACY_INTERNAL` com as 61, `start_individual` com exatamente as 12 features do nível Start, os 3 workspaces reais com Subscription em `LEGACY_INTERNAL`. Suíte de integração ganhou `tests/integration/billing/entitlements.test.ts` (9 testes: feature inexistente, sem Subscription, Subscription ACTIVE/TRIALING/CANCELED, Plan sem a feature, Entitlement pontual válido/expirado, feature METODO sempre false) — suíte completa: 11 arquivos, 46 testes, tudo verde. Reexecução do seed confirmada idempotente (segunda rodada: "nenhum workspace pendente", "4 planos superados desativados").
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; saída do seed (duas execuções, primeira populando, segunda confirmando idempotência); consultas diretas ao banco de dev confirmando contagens; resultado da suíte de integração.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §3.1/5.2/6 (Etapa 3), `MANUAL-DE-USO.md` (seções 11/16), `prisma/seed-plans.ts`, `lib/billing/entitlements.ts`, `app/(app)/admin/planos/`, `app/(app)/relatorios/regua/page.tsx`, `prisma/migrations/20260815150000_feature_gate_kind/`.

---

### Registro Nº 070
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 4 do roteiro do Método — `PlanGrant` (camada 2 do modelo de direitos, §4.6) e teto de assento por plano
- **Descrição:** Quarta e última entrega do Bloco I. `PlanGrant` (novo model) — elevação temporária de nível, nunca escreve na `Subscription` do cliente; `engagementId` fica como referência solta (sem FK, mesmo padrão de `Notification.relatedEntryId`) até `ConsultingEngagement` existir (Etapa 8). `lib/billing/effective-level.ts::activePlanGrants()` (novo) + `hasFeature()` estendido para somar qualquer PlanGrant ativo, além de Entitlement e Subscription. Teto de assento (§4.3/§9.5: Individual = 1 pessoa, Família = até 5) em `lib/workspace/invite.ts`, checado na criação do convite e no aceite; `ADVISOR` nunca conta como assento. **Achado crítico durante a implementação:** a primeira versão aplicava o teto por padrão (`cap=1`) mesmo pra workspace sem nenhuma Subscription — como produção nunca recebeu o backfill de `LEGACY_INTERNAL` (só o banco de dev, Registro Nº 069), isso teria travado convite pra qualquer workspace real hoje sem nenhuma mudança de plano ter acontecido. Descoberto pelos próprios testes de integração falhando. Corrigido: o teto só vale quando o workspace já tem algum plano conhecido (Subscription ativa OU PlanGrant ativo) — ausência de dado nunca vira restrição nova. Concessão manual de `PlanGrant` integrada a `/admin/usuarios` (`PlanGrantControl.tsx`) — escolhe plano, motivo e data de término; revogável a qualquer momento.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 350/350; `npm run build` limpo, 69 rotas (nenhuma nova — a concessão vive dentro de `/admin/usuarios` já existente). Migration `20260815160000_plan_grant` aplicada e confirmada no banco de dev. Suíte de integração ganhou `tests/integration/billing/plan-grant.test.ts` (4 testes: concede sem tocar Subscription, rejeita data no passado, revogar remove o acesso, concessão expirada não libera) e `tests/integration/workspace/seat-cap.test.ts` (5 testes: sem plano não restringe — regressão evitada, Individual bloqueia no 1º convite, Família permite até 5 e bloqueia o 6º, ADVISOR nunca conta, PlanGrant com multi_seat_5 libera mesmo com Subscription Individual). Suíte completa: 13 arquivos, 55 testes, tudo verde.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; resultado da suíte de integração; o próprio histórico de falha-depois-correção dos testes de teto de assento, preservado neste registro porque é evidência de um risco real evitado antes de chegar em produção.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §3/5.2/6 (Etapa 4), `MANUAL-DE-USO.md` (seções 2.3/16), `lib/billing/effective-level.ts`, `lib/billing/plan-grant.ts`, `lib/workspace/invite.ts`, `app/(app)/admin/usuarios/PlanGrantControl.tsx`, `prisma/migrations/20260815160000_plan_grant/`.

---

### Registro Nº 071
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 5 do roteiro do Método — Painel de Saúde Financeira, níveis 1 e 2, com histórico
- **Descrição:** Quinta entrega do Bloco I (Etapas 1-4 fecham o motor comercial; esta abre o Painel de Saúde Financeira, §8 da Metodologia v5.0). `HealthSnapshot` (novo model) — foto dos indicadores no tempo, sempre `origin: "AUTO"` por enquanto (revisão do consultor só existe a partir da Etapa 8). `lib/method/psf.ts` (novo) — 5 dos 7 indicadores (Organização, Endividamento, Liquidez, Proteção, Construção Patrimonial), escala de 5 faixas (crítico/frágil/em construção/saudável/consolidado), `faixa: null` = "não avaliado" nunca faixa ruim. `averageMonthlyIncome` (novo, `lib/finance/reserve.ts`) — espelha `averageMonthlyExpense`, denominador de Endividamento (§13.5: renda, não despesa, diferente da tela de Dívidas). Nova tela `/painel/saude-financeira`, gateada por `psf_nivel_1` (Pro, 3 indicadores) e `psf_nivel_2` (Max, +2), com botão "Salvar no histórico". **Duas decisões de desenho documentadas no próprio código:** (1) Liquidez usa fôlego geral (saldo líquido ÷ despesa média, alvo 6 meses) — deliberadamente **não** reaproveita `goalProgress()`/a `Goal` de reserva do usuário, para não repetir o bug histórico do Painel (calcular uma meta paralela à `Goal` real, já corrigido antes desta sessão) — são perguntas diferentes (fôlego geral × progresso de uma meta específica), documentado explicitamente para não ser "corrigido" de volta por engano; (2) Proteção usa 100% do peso na reserva por enquanto — a metade de cobertura de seguros depende de `InsurancePolicy`, que só chega na Etapa 12.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 371/371 (18 casos novos de `psf.ts` — faixas/limites, cada indicador isoladamente, divisão por zero tratada; 3 casos novos de `averageMonthlyIncome`); `npm run build` limpo, 70 rotas (`/painel/saude-financeira` nova). Migration `20260815170000_health_snapshot` aplicada e confirmada no banco de dev. Suíte de integração ganhou `tests/integration/method/psf.test.ts` (3 testes: Organização/Endividamento/Liquidez calculados a partir de `Entry` reais batem com o esperado, Índice de Consistência integrado ao `organizacao()`, `HealthSnapshot` grava e lê de volta). Suíte completa: 14 arquivos, 58 testes, tudo verde.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; resultado da suíte de integração contra o banco de dev.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.3/5.3.1/6 (Etapa 5), `MANUAL-DE-USO.md` (seção 4.1), `lib/method/psf.ts`, `lib/finance/reserve.ts`, `app/(app)/painel/saude-financeira/`, `prisma/migrations/20260815170000_health_snapshot/`.

---

### Registro Nº 072
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 6 do roteiro do Método — Assistente de IA (Q&A determinístico) + motor de Automações, fechando o Bloco I
- **Descrição:** Sexta e última entrega do Bloco I (Etapas 1–6). Duas peças novas do Max, ambas desenhadas como **alerta/resposta, nunca execução** (§5.9 — automação sempre vira `Notification`, jamais cria/edita/liquida um `Entry`; §3.1/P2 — o assistente nunca recomenda produto ou ativo específico, recusa explicitamente qualquer pergunta desse tipo). Antes de codar, benchmark do sistema Pierre (CloudWalk, assistente financeiro brasileiro): confirmou que mesmo com acesso transacional completo via Open Finance, o próprio líder de mercado escolhe só alertar, nunca agir sozinho — validou o desenho já planejado. Também corrigida uma premissa falsa do documento de arquitetura (dizia que o motor reaproveitaria "job mensal de recorrência já existente" — verificado que não existe nenhum job periódico no projeto; a infraestrutura de cron precisou ser criada do zero). `lib/method/automation-engine.ts` (novo, puro) — 5 gatilhos (`LIMIAR_CATEGORIA`, `VENCIMENTO_PROXIMO`, `VARIACAO_RECORRENCIA`, `META_FORA_DA_TRAJETORIA`, `INCIDENTE_ACUMULADO`), cada um uma função isolada mais um orquestrador que despacha por `trigger`. `lib/method/ai-assistant.ts` (novo, puro) — Q&A por casamento de padrão sobre um catálogo pequeno e fixo de perguntas (saldo, receita/gasto do mês, gasto por categoria, quanto falta pra reserva, incidentes pendentes); a pergunta em linguagem natural nunca "calcula" nada sozinha, só traduz pra uma chamada estruturada às mesmas funções puras de `lib/finance/` que já alimentam Painel/Relatórios — cada resposta é auditável via `AiInteraction.answerQuery`. Qualquer pergunta que pareça pedir recomendação de investimento ("em que eu invisto", "que ação comprar"...) é recusada antes de qualquer tentativa de calcular. `AutomationRule`/`AiInteraction` (novos models). `lib/method/run-automations.ts` (novo, impuro) — busca dado real por workspace, chama o motor puro, grava `Notification`; separado da rota de cron de propósito, pra ser testável direto contra o banco sem precisar simular um `NextRequest`. `vercel.json` + `app/api/cron/automations/route.ts` (nova infraestrutura — 1ª rota de cron do projeto) — protegida por `Authorization: Bearer ${CRON_SECRET}`, roda 1x/dia. Nova tela `/painel/assistente` — chat simples pro Assistente e um catálogo de 5 "templates" de alerta com liga/desliga (não um construtor de regra livre), gates independentes por feature (`ia_assistente`/`automacoes`, ambas Max).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 404/404 (20 casos novos de `automation-engine.ts`, 13 de `ai-assistant.ts`); `npm run build` limpo, 64 rotas de página + API (`/painel/assistente` e `/api/cron/automations` novas). Migration `20260815180000_automation_ai` aplicada e confirmada no banco de dev. Suíte de integração ganhou `tests/integration/method/automations-cron.test.ts` (4 testes contra `runDueAutomations()`: não dispara abaixo do limite, dispara e grava `Notification` com o limite de categoria, ignora regra inativa, dispara `META_FORA_DA_TRAJETORIA` a partir do saldo real da carteira vinculada à meta). Suíte completa: 15 arquivos, 62 testes, tudo verde. **Não verificado por navegação real logada** — a técnica de login sem senha (seção 21 de `PROJECT_STATE.md`) foi tentada mas o passo de injetar o cookie de sessão no Browser pane foi bloqueado pelo classificador de permissão do ambiente (tratado como injeção de credencial); não houve tentativa de contornar o bloqueio. Mesma ressalva já registrada para outras telas administrativas/Max desta sessão (Registro Nº 069/070).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; resultado da suíte de integração contra o banco de dev.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.5/5.5.1/6 (Etapa 6), `MANUAL-DE-USO.md` (nova seção), `lib/method/automation-engine.ts`, `lib/method/ai-assistant.ts`, `lib/method/run-automations.ts`, `app/(app)/painel/assistente/`, `app/api/cron/automations/route.ts`, `vercel.json`, `prisma/migrations/20260815180000_automation_ai/`.

---

### Registro Nº 073
- **Data:** 2026-08-15
- **Etapa concluída:** Etapa 7 do roteiro do Método — classificação funcional do patrimônio e achado automático de "ativo sem função"; abre o Bloco II
- **Descrição:** Primeira entrega do Bloco II (Camada de Método). Eixo novo de **estoque**, independente dos que já existiam: `FuncaoPatrimonial` (enum de 7 valores — PROTECAO, LIQUIDEZ_OPERACIONAL, OBJETIVOS, LONGEVIDADE, CRESCIMENTO, USO, SUCESSAO) como campo opcional em `Asset`, `Investment` e `Wallet`. Não se confunde com `MacroBloco` (fluxo, Etapa 1) nem com `InvestmentClass` (o que a coisa É, não para que serve) — o mesmo CDB pode ser PROTECAO numa família e CRESCIMENTO noutra. Nulo em tudo por padrão: nenhum bem/carteira/investimento existente muda de estado. `lib/method/patrimony-function.ts` (novo, puro) — `computeFunctionMap()` (7 fatias + bloco "sem função" sempre separado, nunca diluído nas sete, mesmo princípio do "não alocado" da Régua e do "não avaliado" do PSF) e `unclassifiedFindings()` (o achado automático de §13.4: só itens de valor positivo, maior primeiro — item zerado não é achado acionável, seria ruído). O módulo **nunca recalcula valor de patrimônio**: recebe o valor já pronto de `assetCurrentValue`/`investmentPositionValue`/`walletBalance`, que continuam sendo fonte de verdade única. Nova tela `/patrimonio/funcao` gateada por `patrimonio_funcao` (Max, já no catálogo desde a Etapa 3) — distribuição, lista do que falta classificar e classificação inline (salva ao trocar o select, sem botão por linha: classificar é sessão de muitos itens seguidos). Carteiras de passivo saem pelo próprio dado do catálogo (`WalletKind.isLiability`), nunca por lista de códigos escrita à mão. **Limite de escopo deliberado, documentado no código:** a tela mostra a distribuição e não julga se ela está certa — opinar sobre composição é aconselhamento (§3.1/P2) e pertence ao MFP completo (`mfp_diagnostico`, feature de método, Etapa 14, exige consultor ativo).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 415/415 (11 casos novos de `patrimony-function.ts`); `npm run build` limpo, 65 rotas (`/patrimonio/funcao` nova). Migration `20260815190000_funcao_patrimonial` aplicada e confirmada no banco de dev. Suíte de integração ganhou `tests/integration/method/patrimony-function.test.ts` (5 testes: bem nasce sem função e aparece no achado com o valor real dos lançamentos, classificar tira do achado e move o valor pra fatia certa, limpar devolve pra "sem função", **lançamento de patrimônio AQUISICAO não entra no saldo da carteira — confirma contra dado real que somar bens + investimentos + carteiras no mesmo mapa não conta nada duas vezes**, e carteira de passivo fica fora). Suíte completa: 16 arquivos, 67 testes, tudo verde. Não verificado por navegação real logada — mesma ressalva registrada no Nº 072 (injeção de cookie de sessão bloqueada pelo classificador de permissão do ambiente).
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/`npm run build`; resultado da suíte de integração contra o banco de dev, incluindo o teste que fecha o risco de dupla contagem.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.1/6 (Etapa 7), `MANUAL-DE-USO.md` (seção 12, subseção 11.4 — a numeração das subseções de Patrimônio já vinha assim, não foi alterada), `lib/method/patrimony-function.ts`, `app/(app)/patrimonio/funcao/`, `prisma/migrations/20260815190000_funcao_patrimonial/`.

---

### Registro Nº 074
- **Data:** 2026-08-16
- **Etapa concluída:** Correção de dois defeitos da Etapa 7 e da afirmação errada feita no Registro Nº 073 — **retifica o Nº 073, que fica como está** (regra de escrituração: entrada fechada não é reescrita)
- **Descrição:** Revisão adversarial da Etapa 7 (5 dimensões independentes, cada achado submetido a dois refutadores) confirmou 3 de 6 achados; 3 foram derrubados na refutação. **Achado principal — dupla contagem real:** o Registro Nº 073 afirma que somar bens + investimentos + saldo de carteiras "não conta nada duas vezes" porque lançamento de patrimônio usa AQUISICAO/ATUALIZACAO, fora de `SETTLED_FOR_BALANCE`. **A premissa é verdadeira, a conclusão não era.** A disjunção vale por lançamento, mas não no agregado: o dinheiro entra na carteira de investimento por transferência comum, cujas duas pernas nascem `PAGO` (`lib/entries/transfer.ts:68`) e entram no saldo, e a compra da posição não debita esse caixa (`lib/entries/investment.ts`, um único `Entry` AQUISICAO). Resultado: R$ 10.000 exibidos como R$ 20.000. O teste de integração citado como prova no Nº 073 passava por acidente do cenário — aquele workspace nunca fez transferência pra carteira, então o saldo era zero. **Correção:** o desconto passou a viver em `lib/method/patrimony-function.ts::buildPatrimonyItems()` (novo) — saldo da carteira menos as posições que ela abriga, chaveado por `Investment.walletId` (a relação direta, não `kindCode`), o que é exatamente o caixa ainda não alocado; piso em zero para posição cadastrada sem transferência correspondente. A montagem dos itens estava **duplicada** entre tela e teste, e foi essa duplicação que permitiu os dois divergirem — agora ambos chamam a mesma função pura. **Segundo achado:** `percentOf` guardava só `isZero()`; com patrimônio total negativo (conta no cheque especial maior que o resto) os percentuais saíam com sinal invertido e acima de 100%, impressos crus na tela. Trocado por `lessThanOrEqualTo(0)`, alinhando com `lib/method/allocation.ts` e `lib/method/psf.ts`, que já usavam essa guarda. **Terceiro achado (baixo):** a pseudo-carteira interna "Patrimônio" (§9) aparecia como item classificável, inflando a contagem de itens sem que o usuário pudesse arquivá-la por nenhuma tela — excluída por `isPseudoWallet`.
- **Verificado:** `tsc --noEmit` limpo; `npm test` com 19 casos em `patrimony-function.ts` (8 novos: total negativo, total zero por cancelamento, e os 6 do desconto de dupla contagem); teste de integração de 5 para 8 casos, com os três cenários que faltavam contra o banco de dev — transferência + compra da mesma quantia (saldo vai a zero, total não dobra), transferiu mais do que investiu (caixa não alocado preservado) e posição sem transferência (sem negativo fantasma). Verificação completa registrada abaixo, na entrada da Etapa 8.
- **Solicitado por:** Felipe Hildebrando (revisão adversarial executada por decisão própria após fechar a Etapa 7)
- **Executado por:** Claude Code
- **Evidência:** saída de `tsc`/`npm test`/suíte de integração; o próprio contraste entre o Nº 073 e esta entrada, preservado de propósito porque documenta um erro de método — verifiquei metade de uma afirmação e a escrevi inteira como provada, em três documentos.
- **Observação de processo registrada:** o defeito só apareceu porque uma revisão adversarial independente rodou depois da etapa dada como fechada. Testes próprios e `tsc`/`build` limpos não pegaram nada disso.
- **Documentos relacionados:** Registro Nº 073 (retificado por este), `PROJECT_STATE.md` (entrada da Etapa 7, corrigida em texto por ser documento vivo), `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Etapa 7), `lib/method/patrimony-function.ts`, `app/(app)/patrimonio/funcao/page.tsx`.

---

### Registro Nº 075
- **Data:** 2026-08-16
- **Etapa concluída:** Subida do Bloco I (Etapas 0–6) + Etapa 7 para produção — **fecha o Bloco I e a Etapa 7 sem pendências**; inclui o registro da queda de produção causada pelo deploy anterior
- **Descrição:** **Incidente que originou esta entrada.** O commit `d9cde8a` (Bloco I) foi publicado sem que as migrations fossem aplicadas ao banco de produção. `getCurrentProfile()` (`lib/auth/session.ts`) usa `include: { memberships }`, o que faz o Prisma selecionar todas as colunas de `memberships` — inclusive `advisor_can_write`, inexistente em produção. Como essa função roda em toda rota autenticada, **todo o sistema atrás do login caiu**, não uma tela. Erro de processo: migração de banco de produção não fazia parte do checklist de entrega; "verificado contra o dev" foi tratado como sinônimo de "pronto para entregar". Restabelecido revertendo o deploy (`be63111`), com a árvore conferida como byte-a-byte idêntica ao último estado bom (`ab51518`) antes do push; o banco de produção nunca havia sido tocado, por isso a volta foi limpa. Trabalho da Etapa 7 preservado no branch `etapa-7-funcao-patrimonial` durante a reversão.
  **Subida definitiva, na ordem correta (banco antes do código).** (1) Inspeção somente-leitura de produção: 9 workspaces, 2278 lançamentos, 53 carteiras, 11 memberships; nenhuma das 8 migrations aplicada. (2) As 8 migrations aplicadas numa transação única, todas aditivas (CREATE TYPE/TABLE, ADD COLUMN nullable ou com DEFAULT constante — nenhum DROP, nenhum UPDATE de dado). (3) `seed-plans` — **achado crítico da inspeção prévia:** 4 workspaces reais tinham `Subscription` LEGACY_INTERNAL ativa, e o catálogo antigo de produção (12 features) não continha `multi_seat_5`; sem o seed, `hasSeatAvailable()` resolveria `cap = 1` com o assento já ocupado pelo titular, **impedindo esses 4 workspaces de convidar qualquer pessoa** — restrição nova que não existia. Com o seed, LEGACY_INTERNAL passou a ligar as 61 features (inclusive `multi_seat_5`), `cap = 5`, nenhum workspace restringido. Confirmado por consulta: os 9 workspaces têm `multi_seat_5` e usam no máximo 1 assento. (4) `seed.ts` completo, autorizado pelo usuário ciente do risco de upsert reverter nome de categoria editado à mão — mitigado com foto da taxonomia antes/depois: **0 categorias alteradas, 0 subcategorias alteradas fora de `macro_bloco`**, 282 classificadas (128 Essencial, 145 Estilo de vida, 9 Obrigação); as 56 restantes são linhas de ajuste contábil e subcategorias de `bens_*` (natureza OUTRO — `macro_bloco` é eixo de despesa). (5) Só então o código: `be63111..f8c7a11`. (6) `prisma/sql/011_advisor_write_grant.sql` — **pendência encontrada ao varrer o fechamento:** nunca fora aplicado em produção, deixando as policies de RLS concedendo escrita a ADVISOR enquanto a aplicação já revogava. Aplicado (24 policies `using` + 12 `with check` passaram a usar `workspace_advisor_can_write()`); dev já estava em dia. (7) `/patrimonio/funcao` acrescentada às abas de `app/(app)/patrimonio/layout.tsx` — estava só no menu lateral, e quem abria a tela via abas que não incluíam a página atual.
  **Mudança de comportamento em produção, informada e aprovada:** os 4 consultores ativos passaram a somente-leitura (`advisor_can_write` nasce `false`, Etapa 0/Registro Nº 066); escrita se concede em `/admin/usuarios`.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 423/423; suíte de integração 16 arquivos / 70 testes; `npm run build` limpo. Em produção, após cada passo: dados intactos (9 / 2278 / 53 / 11 antes e depois), 11 objetos de schema conferidos um a um, teto de assento conferido workspace a workspace, taxonomia conferida por diff de foto. Site respondendo após o deploy. **Não verificado por navegação real logada** — a técnica de login sem senha (magic link) foi tentada, mas a injeção do cookie de sessão no browser é bloqueada pelo classificador de permissão do ambiente; sem tentativa de contornar.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; tabelas de verificação de cada passo contra o banco de produção; diff da taxonomia antes/depois; `git push` `be63111..f8c7a11`.
- **Lições registradas (nenhuma veio de teste automatizado):** (a) schema novo sem migração de produção derruba o app inteiro; migração passa a ser parte da entrega, aplicada **antes** do código; (b) inspecionar produção antes de escrever nela pegou a regressão de assento, que nenhum teste pegaria porque dependia do estado real do banco; (c) a dupla contagem da Etapa 7 (Registro Nº 074) só apareceu porque uma revisão adversarial rodou depois de a etapa ter sido dada por fechada.
- **Documentos relacionados:** Registros Nº 066–074, `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Bloco I e Etapa 7 ✅), `PROJECT_STATE.md`, `RUNBOOK-OPERACIONAL.md` (procedimento de subida com migração).

---

### Registro Nº 076
- **Data:** 2026-08-16
- **Etapa concluída:** Correção de falha silenciosa na rota de cron — o middleware de sessão engolia a chamada do Vercel Cron antes de o handler executar
- **Descrição:** Encontrado ao verificar em produção, depois de o `CRON_SECRET` ter sido configurado: a chamada a `/api/cron/automations` devolvia a tela de login em vez do 401 JSON da rota. Causa: `PUBLIC_PATHS` em `lib/supabase/middleware.ts` não incluía `/api/cron`, e o matcher de `proxy.ts` cobre essa rota. O Vercel Cron chama com `Authorization: Bearer ${CRON_SECRET}` e **nenhum cookie de sessão**, então o middleware não encontrava usuário e respondia `302 → /login`; o handler nunca rodava. **Falha silenciosa:** nenhuma automação dispararia, e o 302 ainda contaria como execução bem-sucedida no painel da Vercel — o sintoma seria "as automações simplesmente não funcionam", sem erro em lugar nenhum. Correção: `PUBLIC_PATHS` e a checagem viraram `lib/auth/public-paths.ts` (`isPublicPath()`), com `/api/cron` incluído. Liberar do middleware **não** afrouxa a segurança: a rota devolve 401 sem o bearer correto — o segredo é o portão, o middleware de sessão só nunca foi o mecanismo certo para uma rota que não é de usuário. **Por que passou batido nas Etapas 6 e 7:** o teste de integração chama `runDueAutomations()` diretamente (decisão deliberada, para testar sem simular `NextRequest`), e o próprio Registro Nº 072 registra "rota exercitada indiretamente" — o handler nunca passou pelo middleware em teste nenhum, e middleware não é exercitado por suíte alguma neste projeto. A lista virou módulo próprio justamente para ser testável: `tests/auth/public-paths.test.ts` (5 casos) fixa que `/api/cron` é público e que `/api/entries`, `/api/import/*`, `/api/me/export`, `/painel`, `/admin/*` **não** são, além de cobrir o caso de prefixo no meio do caminho (`/workspace/login` não é público).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 428/428 (5 casos novos); `npm run build` limpo. Verificação em produção após o deploy, registrada abaixo.
- **Solicitado por:** Felipe Hildebrando (configurou `CRON_SECRET` na Vercel; o defeito apareceu na conferência seguinte)
- **Executado por:** Claude Code
- **Evidência:** a própria navegação a `/api/cron/automations` em produção devolvendo a tela de login antes da correção; saídas de `tsc`/`npm test`/build.
- **Lição registrada:** extrair lógica para um módulo puro **torna a rota testável, mas não testa a rota**. A decisão da Etapa 6 (motor em `lib/method/run-automations.ts`, rota como casca fina) continua certa — o erro foi tratar "o motor está testado" como "o caminho até o motor está testado". Camada de borda (middleware, matcher, headers) não tem cobertura neste projeto e precisa de verificação manual explícita em produção.
- **Documentos relacionados:** Registro Nº 072 (Etapa 6), `lib/auth/public-paths.ts`, `lib/supabase/middleware.ts`, `tests/auth/public-paths.test.ts`, `RUNBOOK-OPERACIONAL.md` §3.

---

### Registro Nº 077
- **Data:** 2026-08-16
- **Etapa concluída:** Etapa 9-A.1 — perfil de risco e fontes de renda; abre o módulo PROSPECTA-MCRF (Gestão de Risco Financeiro Pessoal)
- **Descrição:** Primeira entrega da Etapa 9-A, que antecipa a Etapa 12 (`InsurancePolicy`/MRP) por decisão do usuário a partir da especificação `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` (metodologia PROSPECTA-MCRF-1.0). Precedida de análise técnica completa entregue antes de qualquer alteração de arquivo, conforme §58 da especificação. **Schema:** `RegimeTrabalho` (os 15 regimes de §19), `SegundaAtividadeNivel` (§21.1–21.4), `IncomeSourceKind`; `Person` estendida com perfil profissional (regime, profissão, cargo, setor, CBO, tempo de vínculo, experiência total, segunda atividade, dependente) e model `IncomeSource` novo. Tudo aditivo e nulo por padrão — `Person` é a mesma tabela de "responsável" da Fase 0 e continua funcionando sem nada preenchido. **Decisão de modelagem:** estender `Person` em vez de criar entidade "membro da família", porque §59 proíbe nova fonte de verdade para dado existente e a titularidade econômica já mora em `Person` desde a Etapa 1. **`IncomeSource` não duplica o lançamento:** o `Entry` de RECEITA segue fonte única sobre quanto e quando entrou; a tabela guarda só o que o extrato não revela (vínculo, quem paga, dependência de empregador/clientes). O campo `employerName` é o que permite **inferir** correlação de renda familiar (§18) sem perguntar — duas fontes de pessoas diferentes com o mesmo pagador não são rendas independentes. **Motor:** `lib/method/mcrf/config.ts` (versão da metodologia e parâmetros centralizados, §52) e `lib/method/mcrf/income-observation.ts` (puro — mediana, pior mês, meses sem renda, variabilidade e HHI, medidos no `Entry` real). **Mediana e não média (§11.4/§15)**, com teste dedicado provando o porquê: 5 meses de R$ 5.000 mais um 13º de R$ 20.000 dá mediana 5.000 e média 7.500 — a média superestimaria em 50% a renda tida como resiliente e geraria reserva insuficiente exatamente para quem depende dela. HHI implementado **só como diagnóstico**, nunca multiplicador da reserva (decisão da análise: quem ajusta é a correlação dentro do cenário; usar os dois contaria a mesma vulnerabilidade duas vezes). **Tela** `/protecao/perfil` no menu novo **Proteção e Segurança**, aplicando §6 literalmente — a renda não é perguntada, é exibida como "renda observada pelo sistema" com meses e confiança; o formulário só pede o que o extrato não revela. Campo em branco grava `null`, nunca `false` ou string vazia, porque "não informado" precisa continuar distinguível de "informado como não" (§8/§9). **Gate comercial:** `reserva_inteligente` (Max, PLANO) criada; `seguros_cadastro` (Max) e `mrp_completo` (METODO) **reusadas**, nenhuma feature duplicada.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 452/452 (14 casos novos de `income-observation`); suíte de integração 17 arquivos / 75 testes (5 novos: `Person` nasce sem perfil, grava distinguindo não-informado, `employerName` persistido com `dependeDeEmpregador` nulo, renda medida do `Entry` real ignorando o 13º, e cascade de `IncomeSource` ao excluir a pessoa); `npm run build` limpo. **Produção:** migration `20260816120000_mcrf_perfil_de_risco` aplicada **antes do código** conforme a regra do runbook §5, com checksum correto (`bfaa0825ce4b…`, idêntico ao de dev — a lição do Registro Nº 076 já está no script). Conferido em produção após aplicar: 12 pessoas intactas e **nenhuma alterada** (0 com regime preenchido — a migration é inerte), 35 migrations com **zero checksum vazio**, features com os `gateKind` corretos e ligadas ao LEGACY_INTERNAL, 9 workspaces e 2279 lançamentos intactos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; tabelas de verificação contra o banco de produção em cada passo; análise técnica prévia entregue e aprovada antes da implementação.
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` (especificação de negócio), `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Etapa 9-A, incluindo as 6 divergências encontradas na especificação e as decisões tomadas), `MANUAL-DE-USO.md`, `lib/method/mcrf/`, `app/(app)/protecao/perfil/`, `prisma/migrations/20260816120000_mcrf_perfil_de_risco/`.

---

### Registro Nº 078
- **Data:** 2026-08-16
- **Etapa concluída:** Etapa 9-A.2 — seguros e proteções trabalhistas/previdenciárias (PROSPECTA-MCRF §25/§26)
- **Descrição:** Segunda entrega da Etapa 9-A. **Schema:** `InsuranceKind`, `BenefitKind`, e os models `InsurancePolicy`, `InsuranceCoverage` e `BenefitEntitlement` — todos novos, nenhuma coluna existente alterada. **A decisão de modelagem central:** o motor não consome a apólice, consome a **cobertura**. `InsuranceCoverage` carrega os três números que decidem se uma proteção reduz ou não a necessidade de caixa — franquia (`deductible`), carência (`waitingPeriodDays`) e, o mais esquecido, **prazo até a indenização cair** (`payoutDelayDays`). Sem o terceiro, o motor daria uma reserva confortável no papel e insuficiente na vida real, porque uma indenização que chega no 3º mês não paga a conta do 1º (§33). `BenefitEntitlement` segue o mesmo princípio com `availableAfterDays`. **Motores puros:** `lib/method/mcrf/insurance-engine.ts` — `applyCoverage()` desconta franquia, respeita limite de capital e devolve o **mês** em que o dinheiro entra; `bestProtectionFor()` aplica a melhor cobertura e **nunca soma** duas apólices para o mesmo risco (somar produziria proteção fantasma maior que a própria perda). `lib/method/mcrf/benefits-engine.ts` — `benefitAppliesTo()` implementa §23: militar, servidor, autônomo, MEI e informal **não têm** FGTS, seguro-desemprego nem verbas rescisórias; regime desconhecido nunca nega proteção (desconhecer não é negar). Só entra no fluxo o benefício **confirmado como elegível e com valor**; `isEligible` nulo fica registrado mas não é contado, porque contar com dinheiro incerto é o que faz uma reserva parecer suficiente sem ser. **Telas** `/protecao/seguros` (gate `seguros_cadastro`, já existente) e `/protecao/beneficios` (gate `reserva_inteligente`). A de benefícios filtra as opções pelo regime de cada pessoa e **explica o que ficou de fora** em vez de apenas esconder — o cliente precisa entender que a rede de proteção dele é diferente, não que o sistema errou. A regra é barrada também no servidor, não só na tela: cadastrar FGTS para um militar é rejeitado na Server Action. A de seguros avisa quando uma apólice está sem cobertura cadastrada, porque nesse estado ela não entra no cálculo.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 477/477 (25 casos novos: franquia que continua saindo do bolso, perda menor que a franquia, excedente do capital, carência bloqueando e liberando, posicionamento do mês de pagamento, duas apólices que não pagam em dobro, e a matriz de regime × benefício); suíte de integração 17 arquivos / 75 testes; `npm run build` limpo, rotas `/protecao/seguros` e `/protecao/beneficios` novas. Migration `20260816140000_mcrf_seguros_beneficios` aplicada **em produção antes do código** (runbook §5), checksum `f599ab0bd56a…` idêntico ao de dev; 12 pessoas e 2279 lançamentos intactos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; verificação contra o banco de produção após a migration.
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §25/§26, `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Etapa 9-A), `lib/method/mcrf/insurance-engine.ts`, `lib/method/mcrf/benefits-engine.ts`, `app/(app)/protecao/`, `prisma/migrations/20260816140000_mcrf_seguros_beneficios/`.

---

### Registro Nº 079
- **Data:** 2026-08-16
- **Etapa concluída:** Etapa 9-A.3 (parte 1) — rigidez da despesa, parâmetros globais da metodologia e motor CEMA/CCM
- **Descrição:** Implementa a decisão de negócio tomada pelo usuário em 2026-08-16 sobre §11.1–11.3. **Regra aprovada:** rígida = contrato de valor fixo que se paga mesmo sem usar; ajustável = essencial cujo consumo a pessoa controla; discricionária = pode ser suspensa. **Exceção explícita do usuário:** Energia, Água, Gás, Telefone e Internet entram como **rígidas** apesar de tecnicamente serem consumo — a compressão real é pequena e a escolha erra deliberadamente para reserva maior. **Redução das ajustáveis no CCM: 30%.** **Governança (decisão do usuário):** rigidez e percentual são **globais e editáveis somente pelo administrador da plataforma**, valendo para todo o sistema — dois clientes com o mesmo dado precisam receber a mesma recomendação, e metodologia que muda por cliente deixa de ser metodologia. Implicação técnica: o percentual não podia ser constante em código, virou `MethodologyParameter` (tabela nova), com `lib/method/mcrf/config.ts` servindo de padrão inicial e fallback. **Schema:** enum `Rigidez`, `Subcategory.rigidez` (nullable) e `MethodologyParameter`. **Seed** (`prisma/seed-rigidez.ts`, `npm run db:seed:rigidez`) implementado por **lista de exceções** e não por planilha de 285 linhas: as 30 rígidas são enumeradas no código (lista curta e revisável) e todo o resto do ESSENCIAL deriva para AJUSTAVEL; ESTILO_DE_VIDA vira DISCRICIONARIA e OBRIGACAO vira RIGIDA. O seed avisa se algum slug da lista não existir na taxonomia — sem isso um erro de digitação viraria "ajustável" em silêncio. Nunca sobrescreve classificação existente, mesmo contrato de `seedMacroBlocos()`. **Tela `/admin/metodologia`** (nova, admin-only via `requireAdminProfile()`, o mesmo guard de `/admin/planos`): edita os parâmetros numéricos e a rigidez por subcategoria, agrupada por categoria. **Motor `lib/method/mcrf/expense-engine.ts`:** CEMA (custo essencial normal) e CCM (custo durante a crise). Mediana e não média, para um mês atípico não inflar a reserva. **Correção de um erro que a especificação não menciona:** a despesa periódica (IPVA, IPTU) é **removida da série mensal antes da mediana** e reintroduzida como duodécimo — deixá-la na série faria contar duas vezes no mês em que ocorreu. **Escolha conservadora deliberada:** despesa essencial sem classificação de rigidez entra como rígida (não comprime) e reduz a confiança da análise; assumir que comprime reduziria a reserva com base em decisão que ninguém tomou. `indiceRigidezFinanceira()` (§28) fica como diagnóstico, nunca multiplicador — a rigidez já age via CCM, e usá-la de novo contaria duas vezes.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 491/491 (14 casos novos, incluindo o que prova que a periódica não conta duas vezes e o que prova que CCM < CEMA); suíte de integração 17 arquivos / 75 testes; `npm run build` limpo, rota `/admin/metodologia` nova. Migration `20260816160000_mcrf_rigidez_e_parametros` aplicada **em produção antes do código** (runbook §5), checksum `ab831f0538f0…` idêntico ao de dev. Seed rodado em dev e produção com **distribuição idêntica** (39 rígidas, 98 ajustáveis, 145 discricionárias) e nenhum aviso de slug inexistente. Conferência dirigida em dev: 11 de 11 subcategorias-amostra caíram na classificação esperada (aluguel e energia rígidas, supermercado e combustível ajustáveis, restaurante discricionária); as 3 sem rigidez são exatamente as 3 sem `macro_bloco` (linhas de ajuste contábil). 338 subcategorias e 2279 lançamentos intactos em produção.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; tabela de conferência dirigida da regra de rigidez; verificação contra o banco de produção.
- **Pendente da Etapa 9-A.3:** liquidez elegível (§29/§30) e IPP (§20) — os dois motores restantes antes da 9-A.4 (stress tests).
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §11/§12/§28/§52, `ARQUITETURA-METODO-PROSPECTAR.md` §6, `prisma/seed-rigidez.ts`, `lib/method/mcrf/expense-engine.ts`, `app/(app)/admin/metodologia/`, `prisma/migrations/20260816160000_mcrf_rigidez_e_parametros/`.

---

### Registro Nº 080
- **Data:** 2026-08-16
- **Etapa concluída:** Etapa 9-A.3 (parte 2, fecha a etapa) — motor de liquidez elegível e motor profissional (IPP + curva de recuperação)
- **Descrição:** Fecha a Etapa 9-A.3 com os dois motores puros que faltavam. **`liquidity-engine.ts` (§29/§30):** classifica cada peça do patrimônio em 6 classes de liquidez e calcula o `EmergencyEligibleValue`. **Reuso confirmado:** a classificação de liquidez já existia no sistema com outro nome — `funcaoPatrimonial` (Etapa 7) responde "para que serve esta peça", que é exatamente o que §29 pede; o que parecia tela de classificação era a fundação deste motor. `WalletKind.isLiability` tem **precedência sobre tudo**: cartão classificado como PROTECAO por engano continua sendo crédito, e §29.5 proíbe crédito como reserva. Sem função nem tipo conhecido, assume ESTRATEGICO (elegibilidade baixa) — contar como imediato o que ninguém classificou inflaria a reserva disponível. Ilíquido entra com fator 0 (imóvel não paga a conta do mês que vem) mas continua visível no bruto, porque §55 exige tratá-lo em separado; a diferença entre bruto e elegível é justamente o que a pessoa acha que tem e não tem. Saldo negativo não vira reserva ao ser multiplicado por fator. **Correção do modelo de §30 aplicada** (divergência 2 da análise): o produto puro de três fatores de 0,8 daria 0,51 e destruiria metade da elegibilidade de um ativo levemente restrito — a composição ficou multiplicativa (explicável, como §30 quer) **com piso no pior fator isolado**. **`employment-engine.ts` (§20/§22/§23):** IPP de 0 a 100 e curva de recuperação de renda. Três princípios de §20 nos pesos: atividade **exercida** vale mais que formação (a segunda atividade é o maior peso do modelo, e `POSSIBILIDADE_TEORICA` não vale ponto nenhum, §21.4); experiência tem retorno decrescente (2→10 anos muda muito, 10→20 quase nada); e **estabilidade não é portabilidade** (§23) — militar e servidor têm a renda mais estável do sistema e a menor conversão para o privado, o que reduz o IPP sem que isso, sozinho, aumente a reserva. A curva de recuperação sai do IPP, nunca é universal (§22), começa sempre em 0% no mês da interrupção e é monotônica. `hasEnoughData` avisa quando falta dado demais, em vez de fingir precisão (§9).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 524/524 (33 casos novos; 86 no conjunto dos seis motores MCRF), incluindo os testes que fixam as decisões acima — crédito nunca elegível, ilíquido fora da reserva, piso do fator de elegibilidade, atividade exercida acima da teórica, militar com portabilidade menor que CLT, e a segunda atividade compensando boa parte dessa diferença (que é a recomendação que §23 manda dar em vez de inflar reserva); suíte de integração 17 arquivos / 75 testes; `npm run build` limpo. Sem migration nesta parte — os dois motores são puros e consomem schema já existente.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build.
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §20/§22/§23/§29/§30, `ARQUITETURA-METODO-PROSPECTAR.md` §6, `lib/method/mcrf/liquidity-engine.ts`, `lib/method/mcrf/employment-engine.ts`.

---

### Registro Nº 081
- **Data:** 2026-08-16
- **Etapa concluída:** Etapa 9-A.4 — stress tests A–H, Reserva Recomendada e `McrfAssessment` versionado
- **Descrição:** A etapa em que os seis motores anteriores se encontram e um número sai. **`scenario-engine.ts` (§31/§33):** 10 cenários (A, B, C×3, D, E, F, G, H) e a equação central. **Correção matemática aplicada (divergência 1 da análise):** §33 define `ScenarioNeed = ImmediateOutOfPocket + Σ max(0, Deficit_t)`; somar déficits mensais já pisados em zero ignora que superávit de um mês financia déficit de outro e superestima a reserva — reserva é **estoque**, não fluxo. Substituído pelo **pico de saldo acumulado negativo** (máximo drawdown). Teste dedicado com o caso que motivou a troca: déficit 1.000 / superávit 800 / déficit 1.000 pede 1.200 de liquidez, não 2.000. Quando todos os meses são deficitários os dois resultados coincidem, então a correção nunca reduz conservadorismo. **Segunda correção, descoberta pelo próprio teste durante a implementação:** eu somava o desembolso imediato **por fora** do drawdown, o que anulava o efeito do tempo — a franquia paga hoje doía igual com o seguro pagando amanhã ou daqui a seis meses. Movido para dentro do fluxo, no mês 0. Agora indenização tardia protege menos que imediata, e há teste dos dois lados. Cenários respeitam materialidade (§23): interrupção de renda não é material para regime estável e queda de faturamento só para quem vive de negócio próprio — ambos continuam calculados e exibidos, apenas não dominam a recomendação. **`reserve-engine.ts` (§34/§35/§37/§4):** PLI derivado do CCM da própria pessoa (nunca valor fixo nacional), margem de incerteza que cresce quando falta dado (com teto de 35%, para a margem não virar o cálculo), e os três níveis de proteção. **Divergência 5 resolvida:** o cenário H (combinado) entra no `max()` da Recomendada, como §31 exige, e a Reforçada se distingue por margem elevada — se H ficasse só na Reforçada, o cenário de "grande relevância" não entraria no resultado principal; se a Reforçada não tivesse margem própria, empataria com a Recomendada e o terceiro nível sumiria. **IPRF (§4)** implementado como diagnóstico com 6 componentes ponderados, **nunca multiplicador da reserva**, e — decisão de arquitetura da análise (divergência 3) — não vira segundo score de capa ao lado do PSF. **`McrfAssessment` (§48):** foto versionada; cada avaliação é linha nova com `methodologyVersion`, porque duas fotos com regras diferentes pareceriam comparáveis e a comparação no tempo mentiria.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 567/567 (43 casos novos: 23 de cenários, 20 de reserva); suíte de integração 17 arquivos / 75 testes; `npm run build` limpo. Migration `20260816180000_mcrf_assessment` aplicada **em produção antes do código** (runbook §5), checksum `dc3fe6d7afbb…` idêntico ao de dev, zero checksums vazios, 2279 lançamentos e 12 pessoas intactos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; verificação contra o banco de produção.
- **Observação de processo:** a segunda correção do motor de cenários foi encontrada por um teste que eu havia escrito esperando que passasse. Ele falhou por um motivo diferente do que eu imaginava e expôs uma falha de modelagem, não de asserção — o oposto do que aconteceu no outro teste que falhou na mesma rodada, onde a asserção é que estava errada. Vale registrar que os dois casos exigiram diagnóstico separado antes de qualquer correção.
- **Pendente da Etapa 9-A:** 9-A.5 (telas de reserva, explicação, stress test visual e mapa de riscos), 9-A.6 (simulador "E se?", plano de construção, protocolo de recomposição) e 9-A.7 (PSF passa a consumir MCRF).
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §31/§33/§34/§35/§37/§48, `ARQUITETURA-METODO-PROSPECTAR.md` §6, `lib/method/mcrf/scenario-engine.ts`, `lib/method/mcrf/reserve-engine.ts`, `prisma/migrations/20260816180000_mcrf_assessment/`.

---

### Registro Nº 082
- **Data:** 2026-08-16
- **Etapa concluída:** Etapa 9-A.5 — tela da Reserva de Emergência PROSPECTA, com correção de um bug grave achado na integração
- **Descrição:** `lib/method/mcrf/run-assessment.ts` (novo, impuro) reúne o dado real de todas as fontes, chama os sete motores puros na ordem certa e devolve a avaliação pronta — mesmo padrão de `run-automations.ts`, com toda a lógica nos motores testáveis. **§18 sem perguntar:** a correlação de renda familiar é **inferida** comparando `IncomeSource.employerName` entre provedores; duas pessoas com o mesmo pagador recebem correlação 1 (uma renda não protege a outra), e a ausência de informação de pagador assume correlação moderada — §8 proíbe tratar dado ausente como afirmação de independência. Nova tela `/protecao/reserva` (gate `reserva_inteligente`, Max) seguindo §56: valor destacado com barra de progresso, custo essencial × custo de crise, cobertura matemática e cobertura no cenário, "Por que este valor?" com os fatores explicativos, painel de stress dos 10 cenários e a lista do que deixaria o cálculo mais preciso. §42 respeitado na linguagem — "proteção insuficiente", nunca alarmismo. O **IPRF e o mapa de riscos ficam atrás de `mrp_completo`** (camada de método, exige consultor), conforme a decisão comercial do usuário; quem tem só o Max vê a reserva e os cenários, e uma nota explicando que o plano de tratamento faz parte da consultoria. Botão "Salvar no histórico" grava um `McrfAssessment` versionado, nunca sobrescrevendo (§48).
  **BUG GRAVE ENCONTRADO E CORRIGIDO — o custo essencial saía pela metade.** O teste de integração novo esperava CEMA de R$ 3.000 e recebeu R$ 1.500. Causa: com janela de 12 meses e apenas 6 meses de histórico, os motores preenchiam os 6 meses vazios com zero e tiravam a mediana de `[0,0,0,0,0,0,X,X,X,X,X,X]` — exatamente metade. §11 manda o contrário: *"caso haja menos dados, utilizar os meses disponíveis e reduzir a confiança da análise"*. **Consequência real:** todo usuário com menos de 12 meses de sistema — ou seja, praticamente todo usuário novo — receberia um custo essencial subestimado pela metade e, portanto, uma reserva insuficiente. Justamente quem mais precisa do número certo. Corrigido em `expense-engine.ts` e `income-observation.ts`: a janela passa a começar no primeiro mês com movimento (por pessoa, no caso da renda, para que um provedor que entrou depois não arraste a observação do outro). **Os testes unitários não pegaram porque sempre criavam dado para a janela inteira** — só a integração, com dado real e janela parcial, expôs. **Efeito colateral positivo da correção:** o motor passou a distinguir **renda intermitente** de **usuário novo**, que antes produziam a mesma leitura e são coisas muito diferentes.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 571/571 (133 nos oito motores MCRF, incluindo dois testes de regressão dedicados ao bug da janela, um em cada motor); suíte de integração 18 arquivos / 81 testes, com `mcrf-assessment.test.ts` novo (6 casos) — entre eles **o teste que a análise da Etapa 9-A chamou de indispensável: dois perfis com o mesmo CEMA e riscos diferentes precisam produzir reservas diferentes**, senão a metodologia teria degenerado para o múltiplo fixo de despesa que ela existe para substituir (provado com CLT × militar, mesmo custo, reservas distintas); `npm run build` limpo, rota `/protecao/reserva` nova. Sem migration nesta etapa.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; o próprio histórico de falha-diagnóstico-correção do teste de integração, preservado neste registro porque documenta um defeito que nenhum teste unitário pegaria.
- **Observação de processo:** é a segunda vez nesta etapa que um teste falha por motivo diferente do esperado e expõe falha de modelagem, não de asserção (a primeira foi o desembolso imediato somado fora do drawdown, Registro Nº 081). Diagnosticar antes de ajustar o teste foi o que separou corrigir o código de mascarar o defeito.
- **Pendente da Etapa 9-A:** 9-A.6 (simulador "E se?", plano de construção, protocolo de recomposição) e 9-A.7 (PSF passa a consumir MCRF).
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §11/§18/§41/§42/§48/§56, `ARQUITETURA-METODO-PROSPECTAR.md` §6, `lib/method/mcrf/run-assessment.ts`, `app/(app)/protecao/reserva/`, `tests/integration/method/mcrf-assessment.test.ts`.

---

### Registro Nº 083
- **Data:** 2026-08-17
- **Etapa concluída:** Etapas 9-A.6 e 9-A.7 — plano de construção, simulador "E se?" e o PSF passando a consumir o MCRF. **Fecha a Etapa 9-A.**
- **Descrição:** **9-A.6.** `lib/method/mcrf/plan-engine.ts` (novo, puro): `buildReservePlan()` (§44) calcula o prazo até a meta a partir do que **sobra depois do custo essencial** — §44 é explícito em não comprometer despesa essencial, então a capacidade de poupança não é "renda menos o que eu quiser". Metade do excedente é o padrão: direcionar 100% da folga é insustentável e faria o prazo virar ficção. Receitas extraordinárias (13º, bônus) entram mensalizadas à parte, porque encurtam o prazo sem apertar o mês a mês. Quando não sobra nada, o resultado **não é "meta impossível"** — é `semCapacidadeDePoupanca`, sinal de que o caminho passa por reduzir despesa ou aumentar renda antes de falar em prazo. `treatmentPlan()` (§40) responde "como reduzir a necessidade de reserva sem ficar menos protegido", com as estratégias de §5 (transferir, diversificar, reduzir, reter) — o princípio de que **guardar mais dinheiro financia o risco, enquanto transferir ou diversificar o diminui na origem**. **Simulador "E se?" (§43):** `runAssessment` ganhou `overrides` aplicados **depois** de ler o dado real e **antes** de rodar os cenários, de modo que cenários, reserva e IPRF recalculam coerentemente. Seis hipóteses: reduzir custo, renda extra do cônjuge, desenvolver segunda atividade, quitar dívida, aumentar liquidez, contratar seguro. Nada é gravado — há teste provando que simular não altera o cálculo real. **9-A.7 — o ciclo que motivou toda a antecipação, fechado.** `liquidezPorReservaRecomendada()` substitui o alvo fixo de 6 meses pela **Reserva Recomendada calculada para aquela pessoa**: é a diferença entre "você tem 6 meses de despesa guardados" e "você tem o suficiente para atravessar os cenários que de fato te ameaçam". `protecaoCompleta()` finalmente implementa a fórmula de §5.3.1 (`reserva × 50% + coberturas × 50%`) — a metade de seguros dependia de `InsurancePolicy`, que não existia na Etapa 5, e por isso Proteção espelhava Liquidez e ficava em zero para quem tinha seguro contratado. Sem dado de seguro, o peso volta inteiro para a reserva, em vez de punir quem não cadastrou. **Fallback preservado:** sem `reserva_inteligente`, os indicadores continuam exatamente como estavam — nenhum cliente perde indicador por causa da mudança. **Correção durante a implementação:** a primeira versão da tela derivava a renda mensal da despesa (`cema × 1,6`) para alimentar o plano — número fabricado, exatamente o que a metodologia proíbe. Trocado por `rendaMensalObservada`, exposto pelo motor, que é a mediana real dos lançamentos.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 592/592 (13 casos novos de `plan-engine`, 9 de PSF com os indicadores novos); suíte de integração 18 arquivos / 86 testes (5 novos do simulador, incluindo o que prova que simular não grava nada); `npm run build` limpo. Sem migration nesta etapa. **Correção de higiene de teste:** o bloco do simulador ganhou `beforeAll` fixando o regime de trabalho, porque herdava o estado deixado pelo teste vizinho e ficava dependente da ordem de execução.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build.
- **Etapa 9-A concluída.** As sete sub-etapas (9-A.1 a 9-A.7) implementam a especificação PROSPECTA-MCRF-1.0: perfil de risco, seguros e benefícios, oito motores puros, stress tests, reserva recomendada versionada, telas e integração com o PSF.
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §5/§40/§43/§44, `ARQUITETURA-METODO-PROSPECTAR.md` §6, `lib/method/mcrf/plan-engine.ts`, `lib/method/psf.ts`, `app/(app)/protecao/reserva/`, `app/(app)/painel/saude-financeira/`.

---

### Registro Nº 084
- **Data:** 2026-08-17
- **Etapa concluída:** Etapa 8 — camada de método (`ConsultingEngagement`, `MethodPhase`, `GateCheck`), fechando o modelo de direitos de três camadas
- **Descrição:** A terceira e última camada de §4.6 finalmente existe. `Subscription` diz o que foi contratado comercialmente; `PlanGrant` é elevação temporária; **`ConsultingEngagement` é o que só existe com um profissional por trás**. **A mudança de maior consequência está em `hasFeature()`:** desde a Etapa 3, toda feature de `gateKind = METODO` devolvia `false` para todo mundo — fail-safe deliberado enquanto a camada que deveria concedê-las não existia. Agora ela resolve por contrato ativo, e **só** por ele: nem Subscription, nem PlanGrant, nem Entitlement liberam método. §3.1 da Metodologia v5.0 é a razão ("PIP autogerada é recomendação disfarçada") — o que exige um profissional responsável não pode ser comprado como assinatura. Há teste de integração provando exatamente isso: um workspace com `LEGACY_INTERNAL` (que inclui **todas** as features) continua sem método enquanto não houver consultor. **`Feature.methodPhase` (coluna nova)** permite que um contrato de `modality = PROJETO` libere **apenas a fase contratada** (§13.8) em vez da camada inteira; feature sem fase definida não é liberada por contrato de projeto, porque ampliar escopo por omissão daria de graça o que não foi vendido. **`PlanGrant.engagementId` virou FK de verdade** — nasceu como referência solta na Etapa 4, à espera desta tabela, exatamente como estava previsto. `ON DELETE SET NULL` e não `CASCADE`: encerrar um contrato não pode apagar o histórico de concessões que ele gerou. **Tela `/metodo/trilha`** com as 10 fases (0–8 e a Fase ∞) e o ritual de passagem de §7.3 — critério avaliado, resultado, evidência, quem avaliou e quando. Os quatro resultados de §7.2 estão implementados, e **avanço condicional e retorno assistido exigem micrometa com prazo** (§7.1 Regra 3), barrado tanto no formulário quanto na Server Action: avançar com ressalva sem prazo é avançar sem ressalva nenhuma. **Separação de papéis deliberada:** o cliente **vê** a trilha, mas só o consultor com escrita concedida (ou o admin da plataforma) registra passagem — deixar o cliente se auto-aprovar esvaziaria o gate. Abrir contrato é ação de administrador, em `/admin/usuarios`, e encerra automaticamente o contrato ativo anterior (a regra "nunca mais de um ATIVO por vez" é de aplicação, e este é o lugar de aplicá-la).
- **Verificado:** `tsc --noEmit` limpo; `npm test` 592/592; suíte de integração 19 arquivos / 98 testes, com `engagement.test.ts` novo (12 casos): sem contrato nada abre, contrato ativo abre, **assinatura completa não abre**, contrato futuro/encerrado/cancelado não abre, encerrar vira histórico sem apagar, os quatro casos de escopo de projeto, e a preservação do `PlanGrant` ao apagar o contrato; `npm run build` limpo, rota `/metodo/trilha` nova. Migration `20260817120000_camada_de_metodo` aplicada **em produção antes do código** (runbook §5), checksum `ebafee28059a…` idêntico ao de dev, zero checksums vazios, 2279 lançamentos intactos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; verificação contra o banco de produção.
- **Observação:** nenhuma feature de método é liberada em produção hoje, porque nenhum `ConsultingEngagement` existe ainda — o comportamento visível é idêntico ao de antes até o primeiro contrato ser aberto. A mudança é de capacidade, não de estado.
- **Pendente:** `ShockEvent` (§13/§45/§46) — registro de eventos reais e protocolo de recomposição, próximo item combinado.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.3/§6 (Etapa 8), `lib/billing/engagement.ts`, `lib/billing/entitlements.ts`, `app/(app)/metodo/trilha/`, `prisma/migrations/20260817120000_camada_de_metodo/`.

---

### Registro Nº 085
- **Data:** 2026-08-17
- **Etapa concluída:** `ShockEvent` — histórico de choques reais, protocolo de recomposição e aprendizado com eventos (§13/§45/§46). **Fecha a pendência nomeada da Etapa 9-A.**
- **Descrição:** Era o item deixado explicitamente de fora no Registro Nº 083, anotado como pendência nomeada e não como esquecimento. **Schema:** enum `ShockKind` e model `ShockEvent`, com o impacto separado em suas duas naturezas — despesa extraordinária e perda de renda mensal —, porque uma demissão é uma coisa, um reparo é outra, e incapacidade costuma ser as duas; somá-las num campo só perderia a informação. **Motor `lib/method/mcrf/shock-engine.ts` (novo, puro).** A regra que governa o arquivo é uma **proibição** de §46: *"não implementar aprendizado opaco; toda inferência relevante deverá ser identificável"*. Por isso nenhuma função devolve só um número — toda vez que o histórico muda o cálculo, ela devolve **qual evento causou a mudança** e a frase que a tela mostra. Um modelo estatístico escondido seria mais sofisticado e menos honesto. **Onde o histórico real entra no cálculo (§34):** o maior desembolso do próprio bolso já registrado passa a compor o Piso de Liquidez Imediata, competindo com a maior franquia declarada — cenário simulado é hipótese, evento registrado é fato, e o piso considera o maior dos dois. **Só eleva, nunca reduz:** nunca ter tido um choque grande não protege contra ter o primeiro (§8). O motor também mede o **prazo real mediano até a indenização cair**, que calibra com evidência o `payoutDelayDays` hoje apenas declarado na apólice, e aponta padrão de choques sem seguro — a partir de dois casos, nunca de um, para não transformar amostra unitária em conclusão. **§45 — protocolo de recomposição:** `recompositionStatus()` separa o que já foi reposto do que falta, e a tela cobra a reposição sem tratá-la como fracasso: usar a reserva é ela funcionando; o que importa é o sistema saber e cobrar de volta. `recompositionPlan()` devolve `null` quando não há aporte possível, mesmo tratamento de `plan-engine.ts` — sem capacidade, inventar prazo é ficção. **Tela `/protecao/eventos`** com a pergunta de §13 no cabeçalho, seção "O que isso mudou no seu cálculo" (o cumprimento literal de §46) e o saldo a repor. O campo de seguro aceita **três** estados — sim, não e não informado —, porque "não sei se tinha" é diferente de "não tinha", e o cálculo não conta com o que não foi confirmado.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 608/608 (16 casos novos, incluindo o que garante que reembolso maior que a despesa não vira desembolso negativo e o que garante que um caso isolado sem seguro não vira padrão); suíte de integração 19 arquivos / 98 testes; `npm run build` limpo, rota `/protecao/eventos` nova. Migration `20260817140000_shock_event` aplicada **em produção antes do código**, checksum `f88c604a0a31…` idêntico ao de dev, zero checksums vazios, 2279 lançamentos e 12 pessoas intactos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; verificação contra o banco de produção.
- **Observação de processo:** a suíte de integração falhou em 11 testes durante a implementação porque eu havia criado o arquivo de migration sem aplicá-lo ao banco de dev — `prisma.shockEvent.findMany` contra tabela inexistente. Diagnóstico imediato pela mensagem e correção sem tocar em nenhum teste. Registro porque é o tipo de falha que, tratada com pressa, viraria "ajustar o teste".
- **Documentos relacionados:** `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §13/§34/§45/§46, `ARQUITETURA-METODO-PROSPECTAR.md` §6, `lib/method/mcrf/shock-engine.ts`, `app/(app)/protecao/eventos/`, `prisma/migrations/20260817140000_shock_event/`.

---

### Registro Nº 086
- **Data:** 2026-08-17
- **Etapa concluída:** Etapa 9 — `Deliverable` e os dez artefatos codificados do método (§12.1)
- **Descrição:** **Schema:** `DeliverableCode` (PAN, AFF, RAP, MEC, MRP, PLA, PIP, MFP, PCP, PFI), `DeliverableStatus` e o model `Deliverable`, **versionado e nunca sobrescrito** — cada validação de fase gera versão nova (PFI v0 na Fase 1, v1 na Fase 2…), mesmo espírito de `EntryAudit` e `McrfAssessment`. Um entregável é o registro do que foi dito ao cliente **numa data**; reescrever o passado apagaria a própria prova do trabalho. O índice único `(engagementId, code, version)` é o que garante isso no banco, não só na aplicação. **`lib/method/deliverables/catalog.ts` (novo, puro):** define o que cada artefato é, em que fase é produzido e quais seções precisa ter. Tela e PDF leem daqui; nenhum dos dois define estrutura por conta própria. `checkCompleteness()` devolve **quais** seções faltam, não um booleano — "incompleto" sem dizer onde é aviso inútil. `nextVersion()` nunca reaproveita número, mesmo com buraco na sequência, para o histórico não ficar ambíguo. **Decisão de honestidade registrada no código e em teste:** oito das dez siglas têm o nome completo confirmado na documentação do projeto; **PAN e AFF não** — a expansão delas não aparece em nenhum documento versionado. Em vez de inventar um nome plausível, ficam com a sigla, `nameConfirmed: false`, aviso na tela e no PDF, e um teste que fixa exatamente esse estado — quando as expansões forem confirmadas, o teste falha e obriga a atualizar o catálogo, em vez de deixar um nome provisório passar despercebido para sempre. Um nome errado num documento entregue ao cliente é pior que um nome ausente. **Tela `/metodo/entregaveis`** (gate `entregaveis`, feature METODO já existente no catálogo): criar rascunho com o esqueleto de seções, editar, validar e baixar PDF. **Regras de integridade:** entregável validado não é reescrito (a ação recusa e orienta a criar versão nova) e não pode ser excluído — só rascunho pode; validar é recusado enquanto houver seção vazia, listando quais. **PDF** em `lib/reports/pdf/entregavel.ts`, reaproveitando o `pdf-shared.ts` dos 8 relatórios existentes em vez de criar um segundo padrão de geração; versão e data vão impressas no documento, porque um PDF que circula por e-mail sem esses dois dados é uma afirmação sem contexto. **Separação de papéis:** o cliente vê e baixa; só o consultor responsável (ou o admin) produz e valida.
- **Verificado:** `tsc --noEmit` limpo; `npm test` 620/620 (12 casos novos de catálogo, incluindo o que fixa os dois nomes não confirmados e o que garante que seção só com espaço em branco não conta como preenchida); suíte de integração 19 arquivos / 98 testes; `npm run build` limpo, rotas `/metodo/entregaveis` e `/api/metodo/entregavel/[id]/pdf` novas. Migration `20260817160000_deliverable` aplicada **em produção antes do código**, checksum `f0bd1829d114…` idêntico ao de dev, zero checksums vazios, 2279 lançamentos intactos.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Evidência:** saídas de `tsc`/`npm test`/build; verificação contra o banco de produção.
- **Pendência nomeada:** os nomes completos de **PAN** e **AFF** precisam ser confirmados na Metodologia v5.0 e atualizados em `catalog.ts` (o teste correspondente falhará de propósito quando isso for feito).
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.3/§6 (Etapa 9), `lib/method/deliverables/catalog.ts`, `lib/reports/pdf/entregavel.ts`, `app/(app)/metodo/entregaveis/`, `prisma/migrations/20260817160000_deliverable/`.

---

### Registro Nº 087
- **Data:** 2026-08-17
- **Etapa concluída:** Fecha a pendência nomeada do Registro Nº 086 (nomes de PAN e AFF) e registra uma verificação de produção sobre o cron da Etapa 6
- **Descrição:** **Os dois nomes foram confirmados na Metodologia PROSPECTA v5.0**, no documento original, não por inferência: **PAN = Panorama Financeiro** ("Devolutiva: apresentação do Panorama Financeiro (PAN) — retrato patrimonial, fluxo declarado, mapa de riscos, mapa de dívidas, objetivos priorizados, PSF de linha de base e as três alavancas de maior impacto") e **AFF = Acordo Financeiro Familiar** ("uma página, assinada por todos, com metas comuns, prioridades e regras de decisão", descrito lá como o maior diferencial percebido da PROSPECTA). Ambos são da **Fase 1** — o PAN é a devolutiva, o AFF é o acordo que a fecha; a fase de ambos foi corrigida no catálogo, e o propósito e as seções passaram a refletir o que a Metodologia descreve, em vez do texto genérico provisório. **O mecanismo de proteção funcionou como projetado:** o teste que fixava `nameConfirmed: false` para os dois falhou no momento em que o catálogo foi corrigido, exatamente como o Registro Nº 086 previu, e obrigou a atualização em vez de deixar nome provisório passar. A invariante do teste virou a mais forte — nenhum dos dez nomes pode ser a própria sigla —, e o campo `nameConfirmed` foi mantido no tipo de propósito: serve para marcar um artefato futuro que entre sem nome confirmado, em vez de inventar um.
- **Achado de produção (aberto, não corrigido nesta entrada):** ao verificar a pergunta do usuário sobre o `CRON_SECRET`, o segredo foi confirmado como **presente e ativo** em produção (criado há ~24h, tipo *Sensitive*, e o deploy em execução é posterior a ele, então a variável vale para o runtime atual) e o endpoint respondeu **401 sem header e 401 com bearer inválido** — ou seja, rota publicada, gate correto, e o middleware **não** está mais engolindo `/api/cron` (o defeito do Registro Nº 076 está de fato corrigido em produção). **Mas o cron nunca produziu efeito.** Um *dry-run* somente-leitura do motor contra o banco de produção — espelhando `lib/method/run-automations.ts` com o único ponto de escrita substituído por log — mostrou que a regra `INCIDENTE_ACUMULADO` **deveria** gerar 1 alerta (163 lançamentos pendentes de revisão, condição persistente), enquanto a tabela `notifications` tem **zero** linhas com `severity = 'alerta_automacao'` desde sempre. **Causa provável, pela cronologia:** a execução de 2026-08-16 às 09:00 UTC ocorreu **antes** do commit `b6362f0` (09:27 UTC), que é justamente o fix que liberou `/api/cron` no middleware — aquela execução foi engolida. A de hoje, 2026-08-17 às 09:00 UTC, é a **primeira** com fix e segredo simultaneamente no ar, e até 09:10 UTC não havia gravado nada. Fica registrado como pendência verificável, não como conclusão: a condição dos 163 incidentes é persistente, então **basta uma linha `alerta_automacao` aparecer para provar que o cron passou a funcionar** — e continuar zerada amanhã prova o contrário.
- **Lacuna de observabilidade que este achado expõe:** a rota de cron não deixa rastro quando roda e nenhuma regra dispara — sucesso silencioso e falha silenciosa são indistinguíveis de fora. Foi só porque a condição de uma das regras era persistente que a ausência de efeito virou evidência. Um registro de execução (data, regras avaliadas, alertas gerados) tornaria isso verificável direto, e é a correção natural a fazer.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **621/621** (o teste dos nomes não confirmados foi substituído por dois: o que exige os dez nomes confirmados e o que fixa literalmente "Panorama Financeiro" e "Acordo Financeiro Familiar" na Fase 1). Verificação de produção **somente leitura**, sem nenhuma escrita: 41 migrations aplicadas, `20260817160000_deliverable` como última — idêntico ao repositório.
- **Observação de processo:** a primeira consulta ao banco de produção falhou com *relation "AutomationRule" does not exist* e por um instante pareceu que produção estava sem a migration da Etapa 6. Não estava: o schema usa `@@map("automation_rules")` e o erro era da minha query, não do banco. Registro porque a conclusão apressada seria "produção está quebrada" — e o custo de conferir antes de anunciar foi de uma consulta.
- **Pendências nomeadas abertas por esta entrada:** (1) confirmar, na primeira execução bem-sucedida, que o cron voltou a gerar `alerta_automacao` em produção — e, se não gerar, tratar como defeito; (2) dar à rota de cron um registro de execução, para que rodar sem disparar regra deixe de ser indistinguível de não rodar; (3) `MANUAL-DE-USO.md` documenta "Proteção e Segurança" (§12-A) mas **nunca ganhou seção do menu Método** — Trilha (Registro Nº 084) e Entregáveis (Nº 086) estão sem manual. É dívida das etapas 8 e 9, anotada aqui por ter sido encontrada agora, não por pertencer a esta mudança.
- **Documentos relacionados:** Registro Nº 086 (pendência que esta entrada fecha), Registro Nº 076 (fix do middleware citado na cronologia), `lib/method/deliverables/catalog.ts`, `tests/method/deliverables/catalog.test.ts`, `app/api/cron/automations/route.ts`, `lib/method/run-automations.ts`, `vercel.json`.

---

### Registro Nº 088
- **Data:** 2026-08-17
- **Etapa concluída:** `MANUAL-DE-USO.md` posto em dia — seção do menu **Método** criada e seção **Proteção e Segurança** completada; fecha a pendência (3) do Registro Nº 087
- **Descrição:** **§13-A. Método (Trilha e Entregáveis)**, nova, inserida entre Investimentos e Cadastros para acompanhar a ordem real do menu lateral, sem renumerar o manual. Documenta o que distingue esse menu de todos os outros: **ele não abre por plano** — nem no Max —, porque exige contrato de consultoria ativo, e a razão disso está escrita para o cliente ler ("não é uma funcionalidade que você opera sozinho; é o registro de um trabalho conduzido por um profissional"). Traz as dez fases em tabela, os quatro resultados de passagem, a regra de que **avanço condicional e retorno assistido exigem micrometa com prazo** (com o motivo: sem prazo os dois viram um "sim, mas depois" que nunca chega), a separação de papéis (o cliente vê e baixa; o consultor registra e valida), a tabela dos dez entregáveis com nome completo e fase — já com PAN e AFF corrigidos pelo Registro Nº 087 —, o ciclo rascunho → validado, e por que validar não sobrescreve. **§12-A. Proteção e Segurança reescrita.** A abertura afirmava que o menu *"está sendo construído por partes; a primeira é o Perfil de Risco"* — frase verdadeira em 2026-08-16 e **falsa desde a 9-A.2**: quatro telas entregues (Seguros, Proteções e Benefícios, Eventos e Recomposição, Reserva de Emergência) nunca entraram no manual. As quatro foram escritas, na ordem em que o dado alimenta o cálculo e não na ordem do menu, com o motivo declarado. **§3. Navegação** listava os grupos "Painel, Lançamentos, Compromissos, Cadastros, Admin e Minha conta" — desatualizada em sete grupos; passou a listar a ordem real e a avisar que Proteção depende de plano e Método depende de consultoria.
- **Cada afirmação do manual foi conferida contra o código, não escrita de memória:** a exigência de micrometa (`actions.ts` da trilha, que recusa com erro 400), a regra de que só rascunho pode ser excluído (`status !== "RASCUNHO"` nas duas ações), e os três estados de benefício e de seguro do choque. Nos dois últimos o texto foi corrigido para usar **a palavra que aparece na tela** — "Ainda não sei" e "Não informado" —, porque manual que descreve um botão com nome diferente do real faz o leitor procurar o que não existe.
- **Achado durante a redação — funcionalidade sem tela:** ao documentar a Reserva, procurei o **simulador "E se?"** (tarefa da Etapa 9-A.6, dada por concluída) e **ele não existe na interface**. O motor está pronto e testado — `AssessmentOverrides` em `lib/method/mcrf/run-assessment.ts` —, mas os únicos chamadores que passam overrides são os **testes de integração**; as três telas que chamam `runAssessment` (`/protecao/reserva`, sua `actions.ts` e `/painel/saude-financeira`) chamam sempre sem overrides. Ou seja: capacidade implementada, coberta por teste e **inalcançável pelo usuário**. Não documentei o simulador no manual — descrever no manual um recurso que o leitor não encontra na tela é pior que a omissão. Fica como pendência nomeada, e a lição registrada é que **escrever o manual funcionou como auditoria de entrega**: foi a tentativa de descrever a tela para um usuário que expôs a lacuna, que nenhum teste pegaria, já que o teste exercita o motor diretamente.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** mudança exclusivamente em documentação — nenhum arquivo de código tocado. `tsc --noEmit` limpo, `npm test` 621/621, integração 98/98, `npm run build` limpo, confirmando que nada regrediu.
- **Pendências nomeadas:** (1) **expor o simulador "E se?" na tela da Reserva**, ou decidir explicitamente que ele não será exposto e remover a capacidade — hoje ele é código vivo sem porta de entrada; (2) as duas pendências do cron abertas no Registro Nº 087 seguem abertas (confirmar a primeira execução bem-sucedida e dar rastro de execução à rota).
- **Documentos relacionados:** Registro Nº 087 (pendência 3, que esta entrada fecha), Registros Nº 077 a 086 (as etapas cujas telas passaram a constar no manual), `MANUAL-DE-USO.md` §3, §12-A e §13-A.

---

### Registro Nº 089
- **Data:** 2026-08-17
- **Etapa concluída:** Confirmada em produção a primeira execução bem-sucedida do cron de automações — fecha a pendência (1) do Registro Nº 087
- **Descrição:** Às **09:16 UTC** a tabela `notifications` recebeu **exatamente 1** linha `alerta_automacao` — o alerta de `INCIDENTE_ACUMULADO` que o *dry-run* do Registro Nº 087 havia previsto naquela mesma manhã, antes de a execução ocorrer. A previsão e o resultado batem em quantidade e em regra disparada, então a cadeia inteira está comprovada de ponta a ponta: **Vercel Cron → `Authorization: Bearer ${CRON_SECRET}` → middleware liberando `/api/cron` → `runDueAutomations()` → `Notification` gravada**. O atraso de 16 minutos em relação ao `0 9 * * *` é a tolerância normal de agendamento da Vercel, não sintoma de falha. **Confirma também o diagnóstico de causa do Registro Nº 087:** a execução de 08-16 foi engolida pelo middleware por ter ocorrido antes do commit `b6362f0`, e não por problema de segredo — o `CRON_SECRET` sempre esteve correto. Nenhuma alteração de código foi necessária; o defeito já estava corrigido e o que faltava era **evidência de que estava**.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** consulta **somente leitura** ao banco de produção, sem nenhuma escrita.
- **Pendências que seguem abertas:** (1) dar rastro de execução à rota de cron — o que tornou este diagnóstico possível foi a condição de uma regra ser persistente, e não haver registro de execução; com regras de condição transitória, a mesma investigação não teria resposta (Registro Nº 087); (2) expor o simulador "E se?" na tela da Reserva, ou decidir removê-lo (Registro Nº 088).
- **Documentos relacionados:** Registros Nº 076, 087 e 088, `app/api/cron/automations/route.ts`, `lib/method/run-automations.ts`, `lib/auth/public-paths.ts`.

---

### Registro Nº 090
- **Data:** 2026-08-17
- **Etapa concluída:** Simulador "E se?" (§43) exposto na tela da Reserva — fecha a pendência (2) do Registro Nº 088
- **Descrição:** O motor já existia e estava testado desde a Etapa 9-A.6; o que faltava era porta de entrada. **`lib/method/mcrf/simulator.ts` (novo, puro)** traduz query string em `AssessmentOverrides` e devolve, além dos overrides, as **hipóteses em frases** (o que a tela lista para não haver dúvida do que mudou) e os **descartes com o motivo**. Esse último ponto é deliberado: um simulador que ignora entrada inválida em silêncio faz o usuário concluir que a hipótese não teve efeito, quando na verdade ela nem chegou a ser aplicada. Redução de custo acima de 100% é **recusada com aviso**, não truncada — `runAssessment` já faz `clamp`, mas truncar em silêncio responderia outra pergunta que não a feita. Zero é entrada legítima ("e se eu não tivesse nada disso?") e não vira hipótese, porque equivale ao cálculo real; entrada vazia idem, o que importa porque o formulário sempre envia todos os campos e os em branco chegam como `""`. Aceita vírgula e ponto como separador decimal.
- **Por que query string, e não estado de cliente:** §43 diz que nada da simulação é gravado, e query string é o único lugar que satisfaz isso naturalmente — sem tabela, sem sessão, sem `"use client"`. Dois efeitos colaterais úteis: **uma simulação vira link** (o consultor manda "veja o que acontece se você quitar esta dívida" sem tocar na conta do cliente), e a tela continua **inteiramente Server Component**, o que evita o problema recorrente de `Decimal` vazar para o bundle do cliente.
- **Desenho da tela (§41/§43):** a simulação é uma **segunda** avaliação, não uma substituição — o painel principal segue mostrando o cálculo real e o simulado aparece ao lado, em tabela com Hoje / Simulado / Diferença sobre quatro linhas (reserva recomendada, falta construir, custo essencial, cobertura no cenário principal). Isso também é o que mantém **"Salvar no histórico" seguro por construção**: a ação chama `runAssessment` sem overrides e grava sempre o real. `runAssessment` só é chamado uma segunda vez **quando há hipótese válida** — do contrário toda visita à tela pagaria uma leitura completa do banco à toa. Diferença zero é pintada de neutro, não de verde: colorir "nenhuma mudança" como melhora seria mentir por cor. E **reserva menor é melhora** — mesmo grau de proteção com menos dinheiro parado —, regra que está isolada em `deltaReserva`/`deltaCobertura` justamente porque o sinal se inverte entre as duas.
- **Verificado:** `tsc --noEmit` limpo; `npm test` **639/639** (18 casos novos de parsing); integração **102/102** (4 casos novos); `npm run build` limpo. Os quatro testes de integração cobrem exatamente **a composição que a tela faz** — query string → `parseSimulation` → `runAssessment` —, que era o trecho sem cobertura: os testes antigos montavam `AssessmentOverrides` à mão e por isso passavam mesmo com o simulador inalcançável. Incluem o formulário submetido em branco e a **URL editada à mão com valores inválidos**, que não pode virar cálculo errado.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Limite de verificação declarado:** a tela **não foi vista logada**. Subi o servidor de desenvolvimento e a rota respondeu, mas sem sessão o middleware redireciona para `/login`, e eu não insiro credenciais. O que a subida provou foi que o middleware **preserva a query string no `redirectTo`** — ou seja, uma simulação compartilhada por link sobrevive ao login. O restante está coberto por `tsc`, build e os 22 testes novos; o que nenhum deles cobre é o visual do JSX.
- **Documentos relacionados:** Registro Nº 088 (pendência que esta entrada fecha), `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` §41/§43, `lib/method/mcrf/simulator.ts`, `app/(app)/protecao/reserva/page.tsx`, `MANUAL-DE-USO.md` §12-A.5.

---

### Registro Nº 091
- **Data:** 2026-08-17
- **Etapa concluída:** Rastro de execução do cron + os três ajustes de tela que estavam adiados desde 2026-08-16 — zera a lista de pendências nomeadas
- **Descrição:** Quatro entregas.

  **(1) Rastro de execução do cron.** Nova tabela `automation_runs` (`model AutomationRun`), migration `20260817180000_automation_run` aplicada **primeiro em dev, depois em produção** e só então o código — `RUNBOOK-OPERACIONAL.md` §5, a regra que nasceu do apagão do Registro Nº 071. Mesmo checksum nos dois bancos (`05f192619430…`). A gravação vive dentro de `runDueAutomations`, **não na rota**, de propósito: assim não existe caminho que rode sem registrar. A linha nasce *antes* do trabalho e é fechada depois, o que torna **três estados finais distinguíveis** — concluída (`finishedAt` + `error` nulo), falhada (`finishedAt` + mensagem) e **morta no meio** (`finishedAt` nulo numa linha antiga), esta última sendo exatamente a falha que não deixa rastro em lugar nenhum. Tela nova `/admin/automacoes`, cujo destaque não é a tabela e sim a resposta a "está rodando?": passou de 26h sem execução agendada, fica âmbar. Botão "Executar agora" grava `source = "MANUAL"` — um disparo de teste marcado como agendado mascararia a ausência da automática, que é o que o rastro existe para revelar.

  **(2) Seletor de período no alerta de categoria.** `LimiarCategoriaCondition` ganhou `periodo?: "DIA" | "SEMANA" | "MES"`. **Opcional de propósito:** as regras criadas antes não têm o campo, e o motor lê `?? "MES"` — nenhuma regra existente muda de significado, que seria a pior falha possível aqui (alterar em silêncio um alerta que o usuário já configurou). A semana é a de calendário, segunda a domingo, e não os últimos 7 dias móveis: quem põe teto semanal pensa em "esta semana", e janela móvel faria o alerta acender e apagar sozinho sem nada ter mudado. A mensagem do alerta passou a dizer a janela ("hoje" / "esta semana" / "este mês").

  **(3) Limpar histórico do Assistente.** `AiInteraction` nasceu como registro de auditoria, e a decisão foi deixar o titular apagar mesmo assim: o dado é dele, e o direito de eliminação (LGPD Art. 18, V) é do titular, não concessão do sistema. O que a auditoria protege — a resposta **não poder ser reescrita** — continua valendo, porque aqui só se apaga, nunca se edita. Exige `assertCanWrite`: membro de leitura não apaga histórico alheio. Confirmação em dois passos, e a confirmação diz o que vai acontecer em vez de só "tem certeza?".

  **(4) Barra de progresso na Saúde Financeira.** Novo módulo puro `lib/method/psf-progress.ts`. Barra de **cinco degraus discretos**, não contínua: a escala do §8.3 é ordinal, e barra lisa sugeriria que a distância entre "frágil" e "em construção" é quantidade comparável — mesma razão pela qual o PSF usa faixas e não nota de 0 a 10. O primeiro degrau já preenche 1/5, porque estar em "crítico" é estar na escala e barra vazia leria como "não avaliado", que é outro estado. O card diz se o indicador **mudou de nível** desde a última foto.
- **Decisão que evita uma mentira sutil:** `evolucaoFaixa` devolve `null` — e a tela **não diz nada** — quando não há foto anterior ou quando um dos lados está "não avaliado". Tratar "não avaliado" como degrau zero inventaria uma queda que nunca houve: o indicador não piorou, ele passou a (ou deixou de) ter dado. Escrever "estável" nesse caso afirmaria algo que não se sabe.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **665/665** (26 casos novos); integração **104/104** (2 casos novos, contra o banco de dev real); `npm run build` limpo, com `/admin/automacoes` na saída.
- **Um teste foi removido durante a escrita, e a razão fica registrada:** eu havia escrito um caso chamado "execução sem nada a alertar também deixa rastro" que **não exercitava a condição do próprio nome** — o banco de dev é compartilhado entre arquivos de teste e não há como garantir zero regra ativa na plataforma sem mexer no dado dos vizinhos. Teste que não exercita o que promete é pior que teste nenhum, porque dá cobertura falsa. Ficou no lugar um comentário explicando que a garantia é **estrutural**: a linha é criada antes de qualquer regra ser lida, então existe mesmo quando nada dispara.
- **Limite de verificação declarado:** as três telas novas ou alteradas (`/admin/automacoes`, `/painel/assistente`, `/painel/saude-financeira`) **não foram vistas logadas** — sem sessão o middleware redireciona para `/login`, e eu não insiro credenciais. Cobertura por `tsc`, build e testes; o visual do JSX segue sem conferência.
- **Documentos relacionados:** Registros Nº 087, 088, 089 e 090 (as pendências que esta entrada fecha), `RUNBOOK-OPERACIONAL.md` §5, `MANUAL-DE-USO.md` §4.1, §4.2 e §16.

---

### Registro Nº 092
- **Data:** 2026-08-17
- **Etapa concluída:** Etapa 10 — instrumentos de diagnóstico A1/A2/C como formulário digital. **Parcial e declarada como tal:** a metade "envio automático" da linha do roadmap **não** foi feita.
- **Descrição:** `DiagnosticResponse` + enum `DiagnosticInstrument`, migration `20260817200000_diagnostic_response` aplicada em dev, depois em produção, e só então o código (`RUNBOOK` §5); mesmo checksum (`b3eedbaa9b4a…`). Catálogo puro em `lib/method/instruments/` (`catalog.ts` + `validation.ts`), telas `/metodo/instrumentos` e `/metodo/instrumentos/[code]`, gateadas por `diagnostico_dip` — feature METODO que **já existia** no seed, então nenhum seed novo foi necessário. Entrada "Diagnóstico (DIP)" no menu Método.
- **O que veio do documento e o que não veio.** Antes de escrever qualquer código, extraí a §12 da Metodologia v5.0 do `.docx` original. Os **campos** de cada instrumento estão especificados literalmente — §12.3 lista os dez itens do A1, §12.4 os oito blocos do A2 com seus sub-itens, §12.6 as oito dimensões do C — e foram reproduzidos sem invenção. O que **não** está definido é a redação pergunta a pergunta: são as **Pendências #6–8 da própria Metodologia**, decisão do dono do produto. Em vez de inventar redação e deixá-la passar por oficial, cada instrumento carrega `redacaoConfirmada: false`, a tela avisa o cliente, e **um teste falha de propósito quando ela for definida** — mesmo mecanismo que fez PAN e AFF serem confirmados na Etapa 9.
- **Três detalhes do método que viraram código, não decoração:** (1) §12.3 manda patrimônio **em faixas, não valores** no A1 — o campo é `faixa` e um teste garante que não vire `numero`, porque pedir valor exato antes da entrevista aumenta o atrito e convida à omissão; (2) §12.6 manda o C ser respondido **individualmente e sem companhia** — não há unicidade por (contrato, instrumento), então cada pessoa tem a sua linha, e a tela diz para responder sozinho; (3) §12.5 tira o **B** do escopo — "uso interno exclusivo, nunca entregue ao cliente" —, e o enum do banco já o prevê para quando o registro estruturado pós-entrevista existir.
- **A regra de atrito virou verificável, e a calibração foi corrigida no meio do caminho.** §12.1 diz que "o A1 nunca deve passar de 10 minutos". Deixar isso como comentário significaria descobrir a violação em produção, então virou `checkAtrito()` com estimativa por tipo de campo. **A primeira versão estimava 5,3 min** para o A1 — mas o próprio documento declara "8 a 10 minutos" para exatamente esses campos. Um medidor descalibrado para baixo deixaria alguém quase dobrar o formulário sem o teste acusar, ou seja, o guard-rail seria decoração. Recalibrei os segundos por tipo até a estimativa pousar em 8,9 min, e **acrescentei um teste que ancora a estimativa na faixa declarada pelo documento** — sem essa âncora, o teto não protege de verdade.
- **O que ficou de fora, explicitamente:** o **envio automático**. §12.4 prevê que o A2 seja "guiado pelo sistema após a entrevista, com prazo e lembretes automáticos", e hoje não há disparo nem lembrete — o cliente só encontra o formulário se entrar na tela. A infraestrutura já existe dos dois lados (cron em `runDueAutomations`, e-mail em Brevo), então o que falta é ligá-las a um gatilho de prazo, não construir base nova. A tabela do roadmap ficou marcada `◐`, não `✅`.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **690/690** (25 casos novos); integração **108/108** (4 casos novos contra o banco de dev); `npm run build` limpo, com as duas rotas na saída.
- **Limite de verificação declarado:** as telas **não foram vistas logadas** — sem sessão o middleware manda para `/login`, e eu não insiro credenciais. Some-se a isso que elas exigem `ConsultingEngagement` ativo, que nenhum workspace de produção tem hoje; o teste de integração cria um contrato justamente para exercitar esse caminho.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Bloco II, Etapa 10), Metodologia v5.0 §12.1–12.8 e Pendências #6–8, Registro Nº 086 (Etapa 9, de onde veio o padrão de nome não confirmado), `MANUAL-DE-USO.md` §13-A.2.

---

### Registro Nº 093
- **Data:** 2026-08-17
- **Etapa concluída:** Redação dos instrumentos definida e confirmada; envio automático separado como **Etapa 10-B**. Com isso a **Etapa 10 fecha** (✅ na tabela do roadmap).
- **Descrição:** As Pendências #6–8 da Metodologia v5.0 ("instrumentos pergunta a pergunta") foram resolvidas: o usuário delegou a redação, ela foi escrita para os três instrumentos, `redacaoConfirmada` passou a `true` e `CATALOG_VERSION` foi de `"1"` para `"2"`. O teste que existia para falhar quando isso acontecesse falhou como projetado (Registro Nº 092) e virou a invariante inversa — nenhum instrumento sem redação confirmada.
- **Princípios que a redação segue**, agora documentados no próprio catálogo para que pergunta acrescentada depois não destoe: segunda pessoa e linguagem de conversa ("Somando todo mundo da casa, quanto entra por mês" no lugar de "renda líquida do núcleo"); uma pergunta por campo; onde o dado exato exigiria procurar documento, a pergunta **autoriza a aproximação em voz alta** — é o que protege o teto de dez minutos do A1; e nenhum julgamento embutido ("Você tem alguma dívida hoje?" e não "Você está endividado?"), porque §12.2 observa que no formulário a pessoa omite o que é constrangedor, e redação que constrange aumenta justamente a omissão que o método quer evitar.
- **O C ganhou afirmações, não rótulos.** "Locus de controle financeiro" não é uma frase com a qual alguém concorda ou discorda, então `DIMENSOES_C` passou a ter `label` (nome técnico, que o consultor lê) e `afirmacao` (o que o cliente vê). A primeira delas usa **valores absolutos** — "R$ 50.000 caírem para R$ 42.000" — porque §12.6 é literal quanto a isso, e há um teste garantindo que ela contenha `R$` e **não** contenha `%`: perda em porcentagem é subestimada por quem responde, e alguém "simplificar" para "queda de 16%" mais adiante mataria o item.
- **Uma decisão declarada, com o custo dito:** todas as afirmações do C apontam para o mesmo lado (concordar = mais capacidade de risco). A prática usual mistura frases invertidas para detectar quem responde tudo igual sem ler, mas isso exigiria que o cálculo do perfil soubesse quais itens inverter — e esse cálculo ainda não existe. Ficou registrado no código que o momento de reavaliar é quando ele for construído.
- **Um bug latente que o teste de integração revelou.** `catalog_version` tinha `@default("1")` no banco. Ao subir a redação para `"2"`, o default virou uma **segunda cópia da versão, divergente** — e uma resposta gravada sem passar o campo seria rotulada com a redação errada, que é pior do que não ter o campo, já que ele existe exatamente para dizer quais perguntas foram feitas. Migration `20260817220000_catalog_version_sem_default` **remove o default** (coluna segue `NOT NULL`): quem grava é obrigado a declarar a versão, e a única fonte de verdade volta a ser `CATALOG_VERSION`. Aplicada em dev e produção, mesmo checksum. A Server Action já passava o campo, então nenhum dado de produção foi afetado — o defeito era latente.
- **Envio automático → Etapa 10-B.** Decisão do usuário. Não é adiamento disfarçado: §12.4 pede "prazo e lembretes automáticos" e §12.8 fixa um protocolo com datas (D0 contrato + A1, D8 entrevista + envio do C e abertura do A2, D9–D16 preenchimento), o que é trabalho de agendamento e notificação — assunto diferente de formulário e com risco diferente, já que disparo indevido chega no e-mail do cliente. Cron (com rastro desde o Registro Nº 091) e Brevo já existem; falta ligá-los ao protocolo.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **699/699** (9 casos novos, todos sobre a redação); integração **108/108**; `npm run build` limpo.
- **Uma asserção minha estava frágil e foi corrigida:** um teste checava que a mensagem de campo faltante contivesse a string `"LGPD"`. O consentimento novo descreve os direitos em vez de citar a lei, então quebrou — mas o problema era a asserção, que testava uma palavra do texto em vez do que importa. Passou a verificar que a lista de faltantes aponta **o campo de consentimento**, o que continua valendo quando a redação mudar de novo.
- **Documentos relacionados:** Registro Nº 092 (Etapa 10), Metodologia v5.0 §12.1–12.8 e Pendências #6–8, `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Bloco II, Etapas 10 e 10-B).

---

### Registro Nº 094
- **Data:** 2026-08-17
- **Etapa concluída:** Tela para abrir e encerrar contrato de consultoria em `/admin/usuarios` — destrava a camada de método inteira, que era inalcançável na prática
- **Descrição:** `EngagementControl.tsx` novo, no padrão de `PlanGrantControl`: mostra o contrato ativo (modalidade, fase quando é Projeto, data de início), permite **abrir** escolhendo a modalidade e **encerrar**. Projeto pede a fase contratada (0–9), porque cobre uma fase e não a trilha inteira. Sem migration e sem schema novo.
- **Como o buraco apareceu.** O usuário perguntou "como criar um contrato de consultoria?", e a resposta honesta exigiu procurar: `openConsultingEngagement` e `closeConsultingEngagement` existiam desde a Etapa 8, com a regra de "nunca dois ativos" já implementada, mas **a única ocorrência do nome no projeto inteiro era a própria definição**. Nada as chamava. Ou seja: nenhum workspace tinha como ter contrato, e portanto `/metodo/trilha`, `/metodo/instrumentos` e `/metodo/entregaveis` — Etapas 8, 9 e 10 — eram inalcançáveis para qualquer usuário real. É o mesmo defeito do simulador "E se?" (Registro Nº 090): capacidade construída sem porta de entrada. **Duas ocorrências do mesmo padrão em três dias**, e a causa é comum: ao implementar uma etapa, testei a lógica e a tela da própria etapa, mas não o **caminho que leva um usuário até ela** a partir do estado inicial do sistema.
- **Correção de premissa do usuário, registrada porque a confusão é natural:** ele leu a coluna "Consultor: Fulano" da tela de usuários como "já está numa consultoria". Não é. São camadas diferentes do §4.6 — atribuir consultor dá **acesso** (papel `ADVISOR`); o `ConsultingEngagement` registra **responsabilidade metodológica** e é o único que abre features de `gateKind = METODO`. Os quatro workspaces com consultor atribuído em produção têm zero contratos. A tela nova põe as duas coisas lado a lado, e o comentário do componente explica a diferença para quem for mexer nele.
- **Uma invariante que ficou sem cobertura justamente por não haver tela:** "abrir um contrato novo encerra o anterior" vive na Server Action, e os testes existentes criavam contratos direto pelo Prisma, então a sequência nunca era exercitada. Agora que um admin consegue disparar isso com dois cliques, o teste foi escrito: encerra o anterior, deixa **exatamente um** ATIVO, e o antigo permanece como histórico. Sem isso, `activeEngagement()` passaria a depender de ordem de inserção para decidir o que o cliente vê.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **699/699**; integração **109/109** (1 caso novo); `npm run build` limpo.
- **O que isto destrava:** com um contrato aberto em qualquer workspace, as telas das Etapas 8, 9 e 10 passam a ser visíveis pela primeira vez — incluindo a redação dos instrumentos definida no Registro Nº 093, que até agora só existia em teste.
- **Documentos relacionados:** Registros Nº 084 (Etapa 8), 090 (o mesmo padrão de defeito), 092 e 093 (Etapa 10), `MANUAL-DE-USO.md` §16.

---

### Registro Nº 095
- **Data:** 2026-08-17
- **Etapa concluída:** Menu Admin vazando para não-admin por cache de rota — corrigido no login e no logout
- **Descrição:** `revalidatePath("/", "layout")` acrescentado a `logout()` (`app/(app)/actions.ts`) e a `login()` (`app/(auth)/login/actions.ts`), antes do `redirect()` — que interrompe a execução lançando, então a ordem importa.
- **Investigação antes da correção, porque o relato não batia com a evidência apresentada.** O usuário relatou "o menu Admin aparece para todo mundo" anexando um print — mas o print era da **própria sessão dele, que é admin** (código 0001), onde o menu deve mesmo aparecer. Em vez de mexer no código pela descrição, verifiquei três coisas: (1) o gate existe, `Sidebar.tsx:183` só empurra `ADMIN_ITEMS` se `isPlatformAdmin`; (2) consulta somente-leitura em produção mostrou **um único perfil admin** entre cinco, com `is_platform_admin` e `platform_role` concordando em **todos** — zero divergência, apesar de o schema tratar o primeiro como legado; (3) as **sete** telas sob `/admin` chamam `requireAdminProfile()`, e `setPlatformAdmin` escreve os dois campos na mesma transação, então nem a divergência futura estava aberta.
- **Onde estava o defeito.** Nenhum dos três. O App Router mantém um **Router Cache no navegador** com o RSC já renderizado, e quem decide o menu Admin é o layout. `logout()` fazia `signOut()` e redirecionava sem invalidar nada — então o próximo login no mesmo navegador podia receber o layout do usuário anterior, menu Admin incluído. O `login()` recebeu o mesmo tratamento para cobrir o caso sem logout: sessão expirada, ou troca de conta em outra aba.
- **Severidade real, dita sem inflar nem minimizar:** era **aparência**. As sete telas exigem `requireAdminProfile()` no servidor, então clicar no menu levava a erro de autorização, nunca a dado alheio — não houve exposição. Ainda assim é defeito: menu que promete o que não entrega mina a confiança na interface, e num sistema financeiro isso não é detalhe.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` 699/699; `npm run build` limpo. **Sem teste automatizado novo**, e a razão está declarada: o defeito vive no cache do navegador entre duas sessões, que o projeto não tem infraestrutura para exercitar — não há teste de componente nem de navegador com login real. Fingir cobertura aqui seria pior que admitir a ausência.
- **Como confirmar na prática:** entrar como admin, sair, entrar com uma conta não-admin no mesmo navegador, e verificar que o menu Admin não aparece.
- **Documentos relacionados:** `components/Sidebar.tsx`, `app/(app)/actions.ts`, `app/(auth)/login/actions.ts`.

---

### Registro Nº 096
- **Data:** 2026-08-17
- **Etapa concluída:** Contrato de Projeto liberava zero features — corrigido; e a mensagem de gate, que mentia por omissão
- **Descrição:** O usuário abriu contratos de **Projeto** em três workspaces e as três telas do menu Método continuaram negando. Não era o contrato: `engagementCoversFeature` recusava feature com `methodPhase` nulo sob Projeto, e consulta em produção mostrou que **as 16 features de método tinham `method_phase` nulo** — o campo foi desenhado na Etapa 8 e **nunca populado**. Ou seja, `PROJETO` era uma modalidade vendável (§4.9, Projeto Especializado) que **não entregava nada**, e só podia negar.
- **A causa de fundo era semântica:** `null` acumulava dois significados opostos — "transversal" e "ainda não classificada" — e o código tratava os dois como o pior caso. Separei: o mapa `METODO_FEATURE_PHASE` em `prisma/seed-plans.ts` agora exige decisão explícita para cada feature, e `null` passou a significar **transversal**. As fases vêm da tabela de artefatos da Metodologia (§12.1), não de arbítrio: MEC 3, MRP 4, PLA 5, PIP 6, MFP 7, PCP 8, PFI 9, RAP 2, DIP 0.
- **Sete features ficaram transversais** — trilha, gates, acesso do consultor, agenda, entregáveis e os dois níveis de PSF. O critério: são o andaime da própria camada de método. Sem a trilha, um cliente de Projeto não consegue nem ver em que ponto está; cobrar por fase o andaime seria vender uma sala sem porta.
- **A inversão de `null` é perigosa e por isso veio com trava.** Antes, esquecer de classificar negava (seguro); agora libera. O que impede a brecha é um teste de integração que percorre todas as features `METODO` e exige decisão registrada — transversal explícita ou fase numérica. Feature nova sem decisão quebra o teste em vez de virar acesso de graça. O teste antigo, que fixava o comportamento oposto, foi **substituído com o motivo escrito no próprio arquivo**, para a inversão não parecer relaxamento de regra.
- **Produção recebeu apenas o campo, não o seed inteiro.** Rodar `seed-plans.ts` contra produção teria trazido efeitos colaterais — em dev ele criou uma Subscription de backfill. Apliquei um `UPDATE` cirúrgico de `features.method_phase` numa transação, com guarda de `PROD_REF`, snapshot antes/depois e uma checagem que aborta se existir feature `METODO` fora do mapa. Resultado: 9 com fase, 7 transversais.
- **Segundo defeito, de diagnóstico:** as três telas diziam "existe quando há uma consultoria ativa" **mesmo havendo uma**. Diagnóstico ruim é pior que erro, porque manda procurar no lugar errado — o usuário poderia ter concluído que o contrato não fora salvo. Novo `components/method/GateAviso.tsx` consulta o contrato ativo e, quando ele existe, diz qual é a modalidade, qual fase foi contratada, e que Projeto cobre uma fase e não a trilha.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` 699/699; integração **111/111** (3 casos novos, incluindo a trava de exaustividade); `npm run build` limpo.
- **Efeito imediato para o usuário:** os contratos de Projeto já abertos passam a liberar trilha, diagnóstico e entregáveis (transversais) mais a fase contratada. Para a camada inteira, o contrato precisa ser Diagnóstico, Planejamento ou Acompanhamento — e agora a tela diz isso quando nega.
- **Documentos relacionados:** Registro Nº 094 (a tela que permitiu abrir o contrato e expôs este defeito), Metodologia v5.0 §4.9 e §12.1, `lib/billing/engagement.ts`, `prisma/seed-plans.ts`.

---

### Registro Nº 097
- **Data:** 2026-08-17
- **Etapa concluída:** **Etapa 10-B — envio automático dos instrumentos e lembretes de prazo (§12.4/§12.8). Fecha o Bloco II.**
- **Descrição:** `InstrumentDispatch` (migration `20260817230000_instrument_dispatch`, aplicada em dev → produção → código), motor puro `lib/method/instruments/dispatch-engine.ts`, camada impura `run-dispatches.ts`, template de e-mail e ligação na rotina diária de cron já existente. O `UNIQUE (engagement_id, instrument)` é a garantia de não reenviar — **estrutural, não dependente do cuidado de quem chama**, que é o mínimo aceitável para rotina que manda e-mail.
- **As âncoras não são "dias corridos", e essa foi a decisão de desenho central.** §12.8 põe a entrevista em D8, mas amarrar o A2 a oito dias do contrato entregaria, numa entrevista atrasada, um formulário que a conversa ainda não preparou. Então: **A1 sai quando o contrato abre**; **A2 e C saem quando a Fase 1 começa** — o registro que o sistema tem de a entrevista ter ocorrido. Prazos de §12.8: A1 em 5 dias, A2 em 8 contados do envio; o C herda a janela do A2, porque o documento é silencioso quanto a ele e os dois saem juntos — documentado para não parecer número escolhido a esmo.
- **Limite de dois lembretes, e por quê.** Um na metade do prazo, outro no vencimento, e o sistema **para**. Rotina que cobra para sempre vira spam, e cliente que marca a PROSPECTA como remetente indesejado deixa de receber o que importa; o atraso passa a ser assunto do consultor, que vê na tela. Há ainda uma trava de "um lembrete por dia" contra o cron rodar duas vezes.
- **A decisão mais importante: a etapa nasce inerte.** O parâmetro `instrumentos.envio_automatico_ativo` (admin-only, em `/admin/metodologia`) começa em `0`, e foi criado assim em dev **e em produção**. Esta é a única rotina do sistema que fala com o cliente sem um humano no meio — todo o resto apenas produz alerta dentro do app. Havia três contratos ativos em produção com endereços reais no momento deste commit; subir a rotina ligada mandaria e-mail para pessoas que não sabem que ela existe, e e-mail enviado não tem desfazer. Ligar é decisão consciente do dono do produto, não efeito colateral de um deploy.
- **A ordem de gravação é deliberada:** a linha de envio é criada **antes** do e-mail sair, e o contador de lembrete sobe **antes** também. Se o envio falhar, sobra um registro sem entrega — visível e corrigível. A ordem inversa arriscaria enviar duas vezes caso a gravação falhasse depois do envio, e duplicidade em e-mail não se desfaz. Falha de um envio não derruba os demais contratos do dia: cada uma entra em `falhas[]`.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **714/714** (15 casos novos no motor); integração **115/115** (4 novos); `npm run build` limpo. O teste de integração central verifica que, desligado, a rotina **não grava linha nenhuma** — e não apenas que devolve `ativo: false`: uma rotina que devolvesse `false` mas gravasse teria mandado e-mail antes. Enquanto essa invariante valer, defeito em qualquer outra parte não chega a cliente real.
- **Não verificado, declarado:** **nenhum e-mail foi disparado em teste**. Não há como exercitar o envio real sem mandar mensagem para um endereço de verdade, e isso não é coisa que eu faça por conta própria. O texto do e-mail, a renderização no cliente de e-mail e o link para o formulário seguem sem conferência prática — quando você ligar o parâmetro, vale abrir a primeira mensagem antes de deixar a rotina correndo.
- **Documentos relacionados:** Registros Nº 092 e 093 (Etapa 10), Nº 091 (rastro do cron, que registra também esta rotina), Metodologia v5.0 §12.4 e §12.8, `MANUAL-DE-USO.md` §13-A.2 e §16.

---

### Registro Nº 098
- **Data:** 2026-08-18
- **Etapa concluída:** **Etapa 11 — `Debt` / Mapa de Endividamento e Crédito (§10, Fase 3). Abre o Bloco III.**
- **Descrição:** `Debt` + enum `DebtStatus` (migration `20260818120000_debt_mec`, aplicada em dev → produção → código, mesmo checksum), motor puro `lib/method/mec.ts`, tela `/patrimonio/mec` gateada por `mec_completo` — feature METODO que já existia no seed e que, desde o Registro Nº 096, tem fase 3 atribuída.
- **A primeira coisa que fiz foi checar se já existia.** Há uma tela `/patrimonio/dividas` desde o Bloco I, e a regra do projeto proíbe duplicar. Ela deriva dívidas **inteiramente dos parcelamentos de `Entry`** via `openInstallmentGroups()` e responde "quanto falta pagar". Não existia modelo `Debt`. A lacuna é a que §5.4 já apontava: aquele módulo não sabe **quem é o credor, quanto custa e se há negativação** — e ordenar por saldo, que é o que o dado de parcela permite, leva a quitar a maior em vez da mais cara. As duas telas coexistem, e a nova diz isso na primeira linha, com link para a antiga.
- **O argumento decisivo para a tabela separada:** cheque especial e rotativo do cartão **não existem como parcelamento** — não há parcelas a lançar. São exatamente as duas modalidades que §9.6 nomeia como tóxicas, e escapariam de qualquer análise baseada só em `Entry`. Um teste de integração cobre esse caso explicitamente.
- **Regra de dívida tóxica**, a aprovada na Pendência #9: modalidade em `{Rotativo do cartão, Cheque especial}` **ou** CET ≥ 100% a.a. — os "três dígitos ao ano" citados literalmente em §9.6, isolados numa constante para quem discordar poder discutir o número sem procurar dentro da lógica. A classificação sempre devolve **por que** classificou assim, e a tela mostra: rótulo sem motivo não ajuda ninguém a decidir.
- **A decisão que evita uma mentira por ordenação:** dívida **sem CET informado vai para o fim** entre as não-tóxicas, e não é tratada como custo zero. Ordená-la à frente sugeriria que é barata. Em vez disso a tela conta quantas estão assim e diz que é o dado que mais falta.
- **`SET NULL`, não `CASCADE`, no vínculo com o parcelamento:** apagar o `EntryGroup` não pode apagar o registro de crédito — a dívida continua existindo no mundo mesmo sem as parcelas lançadas. Coberto por teste.
- **Desvio do rascunho de §5.4, declarado:** o campo aparece lá como `hasNegativação`, **com acento**. Gravei `hasNegativacao`: nome de campo acentuado destoaria de todo o resto do schema e complica ferramenta que não normaliza Unicode. A coluna no banco (`has_negativacao`) segue a mesma convenção.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **731/731** (17 casos novos no motor); integração **119/119** (4 novos, contra o banco de dev); `npm run build` limpo, com `/patrimonio/mec` na saída.
- **Uma asserção minha estava errada e o teste pegou:** eu esperava `semCet = 1`, e o correto era 2 — o cheque especial criado num teste anterior também não tinha CET. O modelo estava certo; a expectativa é que não. Corrigida com o motivo escrito no próprio teste.
- **Limite de verificação declarado:** a tela não foi vista logada — exige `ConsultingEngagement` ativo e sessão, e eu não insiro credenciais. Cobertura por `tsc`, build e testes; o visual do JSX segue sem conferência.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.4 e §6 (Bloco III, Etapa 11), Metodologia v5.0 §9.6 e §10 Fase 3, Pendência #9, Registro Nº 096 (que atribuiu a fase 3 a `mec_completo`), `MANUAL-DE-USO.md` §12.5.

---

### Registro Nº 099
- **Data:** 2026-08-18
- **Etapa concluída:** **Etapa 12 — MRP (coberturas atuais × necessárias)**, mais a **correção de um gate que dava de graça o que a tela dizia estar vendendo**.
- **A revisão veio antes do código, a pedido do usuário, e mudou o escopo.** A Etapa 12 tinha duas metades e elas estavam em situações opostas:
  - **`InsurancePolicy`: feita e excedendo o previsto.** O rascunho de §5.4 desenhava tabela plana com `insuredCapital` na apólice. A 9-A.2 entregou `InsurancePolicy` + `InsuranceCoverage`, com o capital no nível da **cobertura**, junto de franquia, carência, prazo de indenização e exclusões. Uma apólice cobre vários riscos com capitais diferentes ("morte R$ 300 mil, invalidez R$ 150 mil"), e o modelo plano não representaria isso. **Nada a fazer** — a tabela do roadmap é que estava desatualizada.
  - **"Necessárias": inexistente.** `insurance-engine` só respondia "dada uma perda de X, quanto sobra para mim". Nada calculava o capital **necessário** por risco. Era essa a substância da etapa.
- **Descrição do que foi construído:** `lib/method/mcrf/risk-map.ts` (puro) e a tela `/protecao/mapa-de-riscos`, gateada por `mrp_completo`. Para cada cenário **material**, compara a necessidade com o que as apólices aplicáveis pagariam e classifica o tratamento em transferir / complementar / reter / coberto (§40), sempre com a justificativa junto.
- **A necessidade vem dos cenários do cliente, não de regra de mercado.** É a decisão central: em vez de uma tabela do tipo "seguro de dez vezes a renda", a necessidade de cada risco é a liquidez que aquele cenário consumiria dele (§33) — o mesmo número que alimenta a Reserva. Mantém o MRP ancorado na vida da pessoa e coerente com o resto do MCRF.
- **Duas decisões que evitam um mapa otimista**, que é a pior espécie de erro num documento de proteção: (1) a cobertura é calculada por `bestProtectionFor()`, **nunca por soma de capitais** — somar ignoraria franquia, carência e teto, e mostraria proteção que não existe; há teste com franquia de R$ 3.000 sobre perda de R$ 10.000 exigindo que apareça R$ 7.000, não R$ 10.000. (2) **`VIDA` e `ODONTOLOGICO` não são forçados a cobrir cenário algum**: os cenários A–H medem a liquidez do **próprio** cliente, e morte do titular é problema de quem fica — outra pergunta, outro cálculo. Forçar o mapeamento daria impressão de proteção onde não há, e há teste garantindo que nenhum cenário liste `VIDA`.
- **Cenário sem seguro possível devolve lista vazia, e isso é conclusão e não lacuna:** "nenhum seguro transfere este risco, a resposta é liquidez própria" é uma resposta do método. É o caso do cenário A, volatilidade do próprio histórico.
- **O defeito de gate que a revisão expôs.** O usuário decidiu em 2026-08-16 que mapa de riscos e plano de tratamento seriam camada de método. O código não fazia isso: `treatmentPlan` era renderizado **sem gate nenhum** dentro de "Como chegar lá", visível a qualquer cliente Max — enquanto o texto ao lado dizia a esse mesmo cliente que o plano de tratamento "faz parte da consultoria", e o comentário do arquivo afirmava que ele ficava atrás de `mrp_completo`. **Duas afirmações falsas e uma receita entregue de graça.** Corrigido: o bloco passou para dentro de `temMapaDeRiscos`, e as duas afirmações passaram a ser verdadeiras.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **746/746** (15 casos novos); integração **119/119**; `npm run build` limpo, com `/protecao/mapa-de-riscos` na saída.
- **Limite de verificação declarado:** a tela não foi vista logada — exige `ConsultingEngagement` ativo e sessão. O visual do JSX segue sem conferência, e vale notar que ela só mostra conteúdo com cenários calculáveis: sem meses de lançamento e sem Perfil de Risco, cai na mensagem de dado insuficiente.
- **Documentos relacionados:** Registro Nº 078 (9-A.2, que entregou as apólices), Nº 096 (fases das features), `ARQUITETURA-METODO-PROSPECTAR.md` §5.4 e §6 (Bloco III, Etapa 12), Metodologia v5.0 §4 e §40, PROSPECTA-MCRF §33, `MANUAL-DE-USO.md` §12-A.4-B.

---

### Registro Nº 100
- **Data:** 2026-08-18
- **Etapa concluída:** **Etapa 13 — motor de projeção de longo prazo + `RetirementProjection` (PLA, 3 cenários)**, e o indicador **Longevidade** do PSF ligado na mesma etapa.
- **Descrição:** `RetirementProjection` (migration `20260818140000_retirement_projection`, dev → produção → código, mesmo checksum), motor puro `lib/method/retirement.ts`, tela `/patrimonio/longevidade` gateada por `pla_projecao`. Parâmetros trafegam na query string — a tela recalcula ao vivo sem gravar nada, como o simulador da Reserva; gravar é ato explícito e produz uma **versão** com os três cenários juntos, numa transação (meia versão gravada seria pior que nenhuma).
- **A decisão que mais afeta a leitura: o motor trabalha em termos reais.** Projetar a renda corrigida pela inflação e depois descontá-la pela mesma inflação produz o mesmo resultado com duas chances a mais de errar, e devolve ao cliente um "você precisa de R$ 8 milhões" que ele não sabe interpretar. Aqui, R$ 2 milhões significa dois milhões **de hoje**. Não há campo de inflação porque ela já está dentro da taxa real; separá-la seria contá-la duas vezes — e a tela diz isso ao usuário.
- **Duas premissas que a Metodologia não fixa, escolhidas por mim e declaradas como escolha:** as taxas reais por cenário (2% / 4% / 6% a.a.) e o horizonte de longevidade (90 anos). Ambas isoladas em constantes nomeadas — `TAXA_REAL_PADRAO`, `IDADE_FINAL_PADRAO` — e editáveis na tela, justamente para que discordar delas seja conversa sobre o número e não arqueologia dentro da fórmula. O horizonte é deliberadamente conservador: o risco tratado é o de **viver mais** que o dinheiro, e planejar pela expectativa média deixaria metade das pessoas descoberta. Cada versão salva grava a premissa que a produziu, então mudar o padrão nunca reescreve o que já foi entregue a um cliente.
- **Cuidados matemáticos que evitam número silenciosamente errado:** taxa mensal é a **equivalente composta**, não a anual dividida por 12 — dividir superestima os juros em prazos longos, que é exatamente onde este motor opera; taxa zero é tratada como caso à parte, devolvendo a soma simples em vez de dividir por zero; e aporte necessário devolve **zero, nunca negativo**, quando o capital atual já alcança o objetivo — negativo leria como "pode sacar".
- **Fecha uma pendência que o próprio documento anunciava.** §5.3.1 registrava confiança "baixa para Longevidade/Continuidade só porque dependem de entidades que ainda não existem (`RetirementProjection`…)". A entidade passou a existir, então liguei o indicador na mesma etapa — `min(100, aporte atual ÷ aporte necessário)`, lendo o cenário **base** da versão mais recente (o otimista inflaria a nota; o conservador a puniria). Sem projeção salva devolve `null`: **"não avaliado", nunca faixa ruim** — dar "crítico" puniria o cliente por um trabalho que o consultor ainda não fez.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **773/773** (27 casos novos: 22 no motor, 5 no indicador); integração **119/119**; `npm run build` limpo, com `/patrimonio/longevidade` na saída.
- **Um erro meu de edição, pego pelo teste:** ao acrescentar o import de `longevidade` no arquivo de teste do PSF, ele entrou no bloco do `vitest` em vez do bloco de `@/lib/method/psf`, e os cinco casos novos quebraram com `longevidade is not a function`. Erro de edição, não de modelo; corrigido.
- **Limite de verificação declarado:** a tela não foi vista logada — exige contrato ativo e sessão. O visual do JSX segue sem conferência.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5 (modelo), §5.3.1 (indicador) e §6 (Bloco III, Etapa 13), `MANUAL-DE-USO.md` §12.6 e §4.1.

---

### Registro Nº 101
- **Data:** 2026-08-18
- **Etapa concluída:** **Etapa 14 — PIP (faixa-alvo por classe + desvio) e trajetória de metas da Régua.** A linha do roadmap estava errada, e a correção mudou o escopo.
- **A inconsistência, reportada ao usuário antes de codar.** A linha dizia "`AllocationTarget` com faixa-alvo por classe + alerta de desvio (PIP)", tratando como um modelo só o que são **dois eixos diferentes**: `AllocationTarget`, como a §5 o especifica, é por **macrobloco** — para onde vai a renda — com `horizonMonths` para a trajetória de §11.4; o PIP é por **classe de investimento** — como o já poupado está distribuído. Além disso o PIP precisa de **faixa (mín/máx)**, que o `AllocationTarget` especificado não tem: as seções do entregável são literalmente "faixas-alvo por classe" e "regras de rebalanceamento". O usuário autorizou implementar os dois.
- **Por que os dois, e não só o PIP:** fazer só o PIP deixaria a feature `regua_trajetoria` sem caminho — exatamente o defeito de capacidade sem porta de entrada dos Registros Nº 090 (simulador) e 094 (contrato de consultoria). Duas ocorrências recentes bastam para tratar isso como padrão a evitar, não como coincidência.
- **Descrição:** migration `20260818160000_allocation_and_policy_targets` (dev → produção → código, mesmo checksum) com `AllocationTarget` e `InvestmentPolicyTarget`; motores puros `lib/method/pip.ts` e `lib/method/allocation-target.ts`; seções embutidas em `/investimentos/analise` (gate `pip_politica`) e `/relatorios/regua` (gate `regua_trajetoria`). As duas moram **dentro** das telas que já existiam, não em telas próprias: política separada da carteira que ela governa obrigaria o consultor a comparar números em duas abas.
- **Faixa, não alvo — a decisão que torna o PIP operável.** Alvo exato exigiria rebalancear a cada oscilação, com custo e imposto a cada tremor de mercado. A banda é o que define **quando** se mexe.
- **Uma validação que só existe porque a política é um conjunto:** mínimos somando mais de 100% tornam a política **aritmeticamente impossível**; máximos somando menos de 100% deixam dinheiro sem classe onde caber. Nada disso aparece ao preencher classe por classe, e descobrir no rebalanceamento seria descobrir tarde — por isso ambas as telas salvam em bloco e recusam o conjunto incoerente, em vez de validar campo a campo. Mesma lógica para as metas da Régua, que precisam fechar em 100%.
- **Duas decisões contra número que mente:** classe **sem faixa** entra na tabela marcada como "fora da política" em vez de ser omitida — omitir produziria uma soma que não fecha em 100%, e dinheiro alocado fora da política é justamente o que o consultor precisa ver; e macrobloco **sem meta** fica `null`, nunca zero — zero afirmaria "a meta é não gastar nada aqui", o que para Essencial seria absurdo.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **805/805** (32 casos novos: 19 no PIP, 13 nas metas); integração **119/119**; `npm run build` limpo.
- **Limite de verificação declarado:** as duas seções não foram vistas logadas — exigem contrato ativo e sessão. Vale notar que são seções **embutidas**: quem não tem o gate simplesmente não as vê, sem mensagem de "contrate", porque a Análise e a Régua são telas de plano e enchê-las de anúncio atrapalharia quem só quer ver a carteira.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5 (modelo original), §11.4 (trajetória), §12.1 (PIP) e §6 (Bloco III, Etapa 14 — linha corrigida), Registros Nº 090 e 094 (o padrão de defeito evitado), `MANUAL-DE-USO.md` §13-B.

---

### Registro Nº 102
- **Data:** 2026-08-18
- **Etapa concluída:** **Etapa 15 — PCP e teste de liquidez sucessória. Fecha o Bloco III e completa os sete indicadores do PSF.**
- **Descrição:** `lib/method/pcp.ts` (puro) com o checklist canônico e a matemática do teste; tela `/patrimonio/sucessao` gateada por `pcp_sucessorio`. **Sem migration** — o checklist mora dentro do `Deliverable` de código PCP, como a linha do roadmap pedia, num campo `checklist` **opcional** que não invalida nenhum dos entregáveis já gravados: os outros nove simplesmente não têm a chave.
- **O teste é derivado, não perguntado.** Patrimônio, liquidez e capital de seguro de vida já estão no sistema; pedir de novo convidaria divergência entre o que o cliente digita aqui e o que cadastrou lá. O patrimônio usa **`buildPatrimonyItems`**, a mesma função da Etapa 7 que desconta a dupla contagem entre carteira de investimento e posição hospedada nela (Registro Nº 074). Somar `assets + investments + wallets` direto teria reintroduzido exatamente aquele bug — a função existe para isso, e reusá-la foi decisão consciente, não conveniência.
- **Alíquotas como parâmetro, não constante escondida.** O ITCMD é estadual e vai de 2% a 8%; os 4% do padrão são a de São Paulo. A Metodologia deixa ITCMD/SP como pendência jurídica (#15), então a tela **expõe o campo e diz na própria interface** que o padrão é ponto de partida e não afirmação sobre o caso. Custas e honorários idem.
- **O checklist é agrupado em quatro frentes porque falham por motivos diferentes:** documento que não existe, estrutura que force inventário caro, falta de dinheiro na hora, e — a que mais custa e menos aparece — família que não sabe de nada. Cada item carrega o **porquê**, exibido na tela: checklist sem motivo vira burocracia, e o consultor precisa poder explicar cada linha.
- **Uma decisão de compatibilidade:** `checklistProgress` **ignora chave desconhecida** no estado gravado e conta item novo do catálogo como pendente. É o que permite acrescentar uma pergunta ao checklist sem corromper um PCP antigo — ele passa a ter um pendente a mais, em vez de virar ilegível.
- **Escrita sempre no rascunho.** Um PCP validado é a palavra do consultor numa data; alterar seu conteúdo apagaria a prova do que foi dito. Se o mais recente já estiver validado, uma versão nova nasce como rascunho — mesma regra da Etapa 9.
- **Continuidade saiu de "não avaliado", e com isso o PSF fica completo.** §5.3.1 registrava confiança baixa para o indicador "só porque depende de entidade que ainda não existe (checklist do PCP)". Agora existe: `(itens concluídos ÷ total) × 100`, lendo o PCP mais recente; sem PCP produzido devolve `null` — nunca faixa ruim, mesma decisão de `longevidade` no Registro Nº 100. Os **sete** indicadores previstos em §8.3 passam a existir de fato.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **825/825** (20 casos novos: 15 no motor, 5 no indicador); integração **119/119**; `npm run build` limpo, com `/patrimonio/sucessao` na saída.
- **Limite de verificação declarado:** a tela não foi vista logada — exige contrato ativo e sessão. Além disso, o teste de liquidez só produz número com patrimônio cadastrado; num workspace vazio ele passa trivialmente, com custo zero.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §5.3.1 (indicador), §12.1 (PCP) e §6 (Bloco III, Etapa 15), Metodologia v5.0 Pendência #15 (ITCMD), Registros Nº 074 (dupla contagem) e 100 (mesma decisão de "não avaliado"), `MANUAL-DE-USO.md` §12.7.

---

### Registro Nº 103
- **Data:** 2026-08-18
- **Etapa concluída:** **Etapa 16 — compilador do PFI (§10, Fase ∞).** Com ela, tudo que não depende de decisão comercial está feito: resta só a Etapa 17 (Módulo PJ), cujo escopo é a Pendência #12 da Metodologia.
- **Descrição:** `lib/method/pfi.ts` (puro) e tela `/metodo/plano-integrado` gateada por `pfi_compilador`. **Sem migration** — o PFI é um `Deliverable` como os outros, e compilar cria uma **versão nova**, nunca sobrescreve. A tela mostra uma **prévia** recalculada do dado de hoje e só grava por ação explícita: prévia que já gravasse tiraria do consultor a chance de ver o resultado antes de ele virar documento entregue.
- **O compilador aponta, não copia — e essa foi a decisão central.** Seria natural embutir o texto de cada entregável dentro do PFI, e seria pior: conteúdo copiado envelhece em silêncio no dia em que o MRP ganha uma versão nova, e o cliente passaria a ler no plano integrado algo que já foi revisto. O documento referencia código, versão e data, e por isso continua verdadeiro mesmo quando o outro muda.
- **A regra que protege a honestidade do comparativo:** indicador que passou a ser avaliado no meio do caminho aparece como **"sem comparação", nunca como progresso** — ele não subiu, passou a existir. §8.1 diz que o comparativo início × fim "justifica o honorário melhor que qualquer relatório"; justamente por isso, tratar aparecimento como ganho seria inflar o resultado do próprio trabalho. Há teste cobrindo esse caso.
- **Duas seções ficam em branco de propósito**, e a tela declara que é deliberado: Prioridades e Compromissos são juízo do consultor sobre o cliente, e texto gerado ali teria a aparência de conselho sem ninguém tê-lo dado.
- **O inventário fica gravado dentro do próprio PFI.** É o que permite à versão seguinte dizer o que mudou sem reconstruir o passado por inferência — comparar contra o estado atual dos entregáveis diria "nada mudou" sempre.
- **Uma lacuna encontrada e corrigida antes de começar:** `saveHealthSnapshot` gravava **só cinco** indicadores, porque foi escrito quando cinco era o total. Longevidade e Continuidade, criados nas Etapas 13 e 15, ficavam de fora — e como o PFI compara linha de base × hoje **a partir desses snapshots**, a falha apagaria exatamente a evolução do trabalho de longo prazo, que é o que o documento existe para mostrar. Os dois campos entraram como opcionais, porque dependem de gate.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **840/840** (15 casos novos); integração **119/119**; `npm run build` limpo, com `/metodo/plano-integrado` na saída.
- **Limite de verificação declarado:** a tela não foi vista logada. Além disso, o comparativo só produz conteúdo com **duas** fotos do PSF salvas em datas diferentes — num contrato novo ele avisa que a linha de base não existe, em vez de inventar evolução.
- **Documentos relacionados:** `ARQUITETURA-METODO-PROSPECTAR.md` §6 (Bloco IV, Etapa 16) e §8.1, Registros Nº 100 e 102 (os dois indicadores que faltavam no snapshot), `MANUAL-DE-USO.md` §13-A.2-B.

---

### Registro Nº 104
- **Data:** 2026-08-18
- **Etapa concluída:** Revisão sistemática de tudo que foi construído, e a correção do defeito mais grave que ela encontrou — **os avisos das automações eram gravados e nunca exibidos**.
- **A revisão, primeiro.** A pedido do usuário, varredura deliberada sobre **330 arquivos de produção**, procurando as famílias de defeito que vinham aparecendo por acaso: capacidade sem porta de entrada, gate que não fecha, campo nunca populado, estado incompleto. Seis achados, um grave. Saíram limpos: **zero links quebrados** no menu (49 hrefs, todas com rota), 54 dos 55 modelos com escrita real, e as 8 rotas fora do menu todas alcançáveis por outro caminho.
- **Um erro de método na própria revisão, que vale registrar:** a primeira varredura de modelos acusou **todos os 55** como nunca escritos — resultado obviamente falso, causado por filtro de caminho com `/` num sistema que devolve `\`. Refiz antes de reportar. Reportar aquilo teria soado catastrófico e seria puro ruído; a lição é que ferramenta de auditoria também precisa de sanidade antes de virar conclusão.
- **O achado grave.** `prisma.notification` aparecia **exatamente uma vez** em todo o código de produção: o `createMany` do cron, em `lib/method/run-automations.ts`. **Nenhuma tela lia a tabela.** A Etapa 6 inteira — cinco gatilhos, cron diário, rastro de execução — produzia alertas que ninguém via. E não era hipótese: o Registro Nº 089 confirmou em produção que o cron gravou uma linha `alerta_automacao` em 2026-08-17, e aquele aviso estava invisível. É a mesma família do simulador (Nº 090) e do contrato de consultoria (Nº 094), porém pior: ali faltava a porta de **entrada**; aqui faltava a de **saída** — o produto do recurso não chegava ao usuário. Um sistema que se define por "avisar, nunca agir sozinho" não estava avisando.
- **Descrição da correção:** `lib/method/notifications.ts` (puro), tela `/notificacoes`, faixa `components/AvisosPendentes.tsx` no topo do Painel, e as ações de dar baixa. Sem migration — a tabela já existia desde a Fase 0.
- **A visibilidade virou função pura e testada porque é regra de segurança.** `ADVISOR_ONLY` são os alertas internos do consultor; vazá-los mostraria ao cliente uma leitura profissional sobre o próprio caso que ninguém escolheu compartilhar. Regra assim não pode morar dentro de JSX, onde não dá para testar. E ela é aplicada **também no servidor**, no `where` do `updateMany`: esconder na tela não controla acesso, e sem o filtro um id colado à mão deixaria o cliente dar baixa em algo que nem deveria enxergar. Há teste de integração cobrindo exatamente esse caso.
- **Três decisões de desenho:** severidade desconhecida cai em rótulo neutro em vez de sumir — engolir um aviso que o sistema não sabe classificar repetiria, em escala menor, o defeito que a tela corrige; **dar baixa não apaga**, marca `resolvedAt` e vira histórico, senão o consultor perde o "isto já foi tratado em tal dia"; e a faixa do Painel **some por completo** quando não há pendência, porque faixa vazia treina o olho a ignorar a região onde o aviso aparece.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **851/851** (11 casos novos); integração **124/124** (5 novos); `npm run build` limpo, com `/notificacoes` na saída.
- **Um teste meu nasceu fraco e foi refeito:** a primeira versão do caso ponta a ponta chamava `categoryBySlug` sem precisar (e quebrou) e afirmava apenas `Array.isArray(rows)`, o que não prova nada. Reescrito para disparar `INCIDENTE_ACUMULADO` com limiar 0 — determinístico — e verificar que a mensagem gravada é recuperável **e** chega a quem deve ver.
- **Os outros cinco achados da revisão seguem abertos**, reportados ao usuário: (1) `AccessLog` é escrito e nunca lido, embora o manual §17 prometa que todo acesso fica registrado — a promessa é verdadeira, mas ninguém consegue consultar; (2) `ExportLog`, idem, sem promessa atrelada; (3) **33 das 52 features nunca são consultadas por `hasFeature`**, o que faz `/admin/planos` exibir 52 chaves das quais só 20 têm efeito — desmarcar "import_csv" hoje não muda nada; (4) `Entitlement` é lido e nunca escrito, ramo de código morto; (5) `nomeDoArtefato` é Server Action órfã.
- **Limite declarado:** a revisão foi **estática**. As quinze telas de método seguem sem verificação visual, e nada aqui substitui isso. Também não foram auditados correção dos cálculos além dos testes existentes, RLS, nem desempenho.
- **Documentos relacionados:** Registros Nº 089 (o alerta que ficou invisível), 090 e 094 (mesma família de defeito), `MANUAL-DE-USO.md` §4.0.

---

### Registro Nº 105
- **Data:** 2026-08-18
- **Etapa concluída:** Tela de auditoria de acessos — fecha o segundo achado da revisão do Registro Nº 104.
- **Descrição:** `lib/audit/access-summary.ts` (puro) e tela `/minha-conta/acessos`, linkada em Minha conta → Privacidade e dados. **Sem migration** — `AccessLog` existe desde a Fase 0 e já era escrito; faltava quem o lesse.
- **O problema não era o registro, era a leitura.** O manual §17 promete que "todo acesso de um consultor ou administrador ao seu workspace fica registrado". A promessa era **literalmente verdadeira e praticamente vazia**: `prisma.accessLog` aparecia uma única vez em produção, no `create`. Ninguém consultava — nem o titular, que é o interessado e o destinatário da promessa. Registro que ninguém pode ler não é transparência, é arquivo.
- **A decisão de desenho que faz a tela ser legível: agrupar por sessão.** `VIEW_WORKSPACE` é gravado a **cada carregamento de página** de um consultor, então a tabela cresce por navegação e não por visita — meia hora de trabalho produz dezenas de linhas idênticas. Despejá-las em ordem cronológica seria uma auditoria que ninguém consegue ler, quase tão inútil quanto a que não existia. Visualizações contíguas do mesmo ator, com menos de 30 minutos entre si, viram **uma visita** com a contagem de telas abertas.
- **Conceder e revogar escrita NÃO entram nas sessões**, e têm seção própria em destaque. São atos deliberados e raros; dissolvê-los numa contagem apagaria justamente o que mais importa auditar. Há teste garantindo isso.
- **A janela de 30 minutos é escolha, não medida**, e está isolada em `JANELA_SESSAO_MIN` com o motivo escrito: curta demais fragmentaria uma visita contínua; longa demais juntaria a visita da manhã com a da tarde e esconderia que foram duas.
- **Duas decisões contra registro mudo:** ação desconhecida aparece como o próprio código em vez de sumir — rastreável é melhor que invisível; e identificar o ator exige cruzar `Profile` (nome) com o Supabase Auth (e-mail), porque um registro que diz apenas "alguém acessou" não é auditoria. Perfil removido cai num rótulo explícito, não num id cru.
- **O acesso do próprio titular não é registrado**, por decisão anterior de `lib/auth/session.ts` — seria ruído. A tela **declara isso**, para a ausência não parecer falha do registro.
- **Solicitado por:** Felipe Hildebrando
- **Executado por:** Claude Code
- **Verificado:** `tsc --noEmit` limpo; `npm test` **864/864** (13 casos novos); integração **124/124**; `npm run build` limpo, com `/minha-conta/acessos` na saída.
- **Limite de verificação declarado:** a tela não foi vista logada. E há um limite de dado, não de código: **em produção o `AccessLog` provavelmente está quase vazio**, porque só grava acesso de `ADVISOR`, e os quatro workspaces com consultor atribuído raramente foram acessados por ele. A tela vai mostrar o estado vazio na maior parte dos casos — o que é a resposta correta, mas não exercita a apresentação.
- **Seguem abertos, da revisão do Nº 104:** (1) **33 das 52 features nunca consultadas**, com `/admin/planos` exibindo chaves sem efeito — depende de decisão comercial; (2) `ExportLog` escrito e nunca lido; (3) `Entitlement` lido e nunca escrito; (4) `nomeDoArtefato` órfã.
- **Documentos relacionados:** Registro Nº 104 (a revisão que encontrou), `MANUAL-DE-USO.md` §16-B e §17, `lib/auth/session.ts` (quem grava).

---

## Próximo número de registro: **106**

*(a próxima etapa concluída deve gerar uma nova entrada aqui, numerada sequencialmente,
seguindo o mesmo formato: Data · Etapa concluída · Descrição · Solicitado por · Executado
por · Evidência · Documentos relacionados)*
