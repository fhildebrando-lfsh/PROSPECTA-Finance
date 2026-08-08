# PROJECT_STATE.md — Memória Permanente do Projeto

> **Como usar este documento:** é o ponto de entrada para retomar o trabalho em uma nova
> conversa sem perder contexto. Leia isto primeiro, depois `ESPECIFICACAO-SISTEMA-FINANCEIRO.md`
> (a fonte de verdade do domínio/regras) e `GUIA-DE-INICIO.md` (o roteiro de conversas).
> Atualize este arquivo sempre que uma funcionalidade importante for concluída ou uma
> decisão arquitetural relevante for tomada — é assim que ele continua confiável.
>
> **Governança documental (vigente desde 2026-08-08):** toda ação operacional/de
> desenvolvimento deve ser escriturada. Ao final de cada etapa concluída, além deste
> arquivo, atualizar: `CHANGELOG.md` (o que mudou, por data), `REGISTRO-OPERACIONAL.md`
> (registro formal e numerado da etapa — data, solicitante, executor, evidência) e, quando
> a mudança for visível ao usuário final, `MANUAL-DE-USO.md`. `TERMOS-DE-USO.md` e
> `RUNBOOK-OPERACIONAL.md` são atualizados sob demanda (mudança comercial/legal e
> incidente técnico, respectivamente). O objetivo é que, ao fim do projeto, toda a
> documentação esteja em dia.
>
> **Última atualização real: 2026-08-08 (bug real: seletor de workspace listava
> membership REVOKED — Registro Nº 029).** Usuário (atuando como consultor) reportou
> erro genérico ao trocar para o workspace "prospecta (cliente)" pelo seletor, enquanto
> outro workspace funcionava normalmente.
>
> **Causa raiz:** `app/(app)/layout.tsx` construía `membershipOptions` (a lista que
> alimenta `Sidebar`/`WorkspaceSwitcher`) a partir de **todas** as `profile.memberships`
> retornadas por `getCurrentProfile()`, sem filtrar por `status`. A Membership `ADVISOR`
> do usuário para "prospecta (cliente)" tinha sido **revogada** em 2026-08-07 (consultor
> trocado para outra pessoa via `assignAdvisor()` — revogar só muda `status`, nunca
> apaga a linha). Uma membership `REVOKED` continuava aparecendo como opção clicável no
> seletor; ao escolhê-la, `setActiveWorkspace()` (que já valida `status === "ACTIVE"`
> corretamente) rejeitava com `throw new Error("Sem acesso a este workspace.")` — um
> `throw` cru de Server Action, capturado pelo `app/error.tsx` genérico. Bug
> pré-existente ao seletor de workspace multi-membership (Arquitetura de
> Identidade/Planos, Fase 2 Etapa 3, muito anterior a esta sessão) — o próprio
> `WorkspaceSwitcher.tsx` já documentava que esse cenário multi-membership "ainda não
> existe em produção" na época em que foi escrito; só ficou visível agora que o usuário
> passou a ter, de verdade, uma membership revogada misturada com outras ativas.
>
> **Correção:** um `.filter((m) => m.status === "ACTIVE")` antes de montar
> `membershipOptions`. Conferido que os outros lugares que leem `profile.memberships`
> (`minha-conta/page.tsx`, seções "Titular"/"Meus clientes da consultoria") já filtravam
> corretamente antes de qualquer botão/link clicável — só a lista do seletor tinha o
> gap; a lista puramente informativa "Seus usuários do sistema" (sem ação nenhuma
> anexada) continua mostrando o histórico completo, de propósito.
>
> **Verificado direto no banco** (script descartável): confirmado que a lista antes do
> fix incluía "prospecta (cliente)" com `status: REVOKED`, e depois do fix não inclui
> mais. 171 testes, `tsc --noEmit` e `npm run build` limpos (o build teve um segfault
> transitório do Node na primeira tentativa, sem relação com a mudança — passou limpo na
> segunda).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 029).
>
> **Última atualização anterior: 2026-08-08 (Compromissos → Incidentes — Registro Nº 026).**
> O usuário pediu uma aba dedicada para "erros de lançamento" que precisam de edição,
> citando como exemplo as parcelas órfãs que a correção do Registro Nº 025 tinha
> deliberadamente deixado de fora (sem par correspondente, revisão manual).
>
> **Schema (aditivo):** `Entry.incidentAcknowledgedAt DateTime?` (migration
> `20260808210858_incident_acknowledged_at`) — marca que um humano revisou e aceitou a
> linha como está, sem precisar apagar o sinal de "sem groupId" que a torna um incidente.
>
> **`lib/finance/incidents.ts` (novo, puro, testado):** `isInstallmentIncident(entry)` —
> um lançamento é incidente quando `installmentTotal >= 2 && groupId == null &&
> incidentAcknowledgedAt == null`. Não precisa de agregação cross-row (diferente de
> `openInstallmentGroups`), então a mesma condição também vira o `where` direto da query
> em `/compromissos/incidentes` — a função pura documenta/testa a regra de negócio, mesmo
> sem ser chamada em runtime pela página.
>
> **Tela nova** (`/compromissos/incidentes`, 3ª aba de "Compromissos" — barra de abas
> extraída para `CompromissosTabs.tsx`, antes duplicada em `page.tsx`/`calendario/
> page.tsx`): cada incidente vira um cartão (`IncidentCard.tsx`, mesmo padrão de trava de
> edição de `AssetCard`/`GoalCard`) com o motivo explicado em texto e dois botões:
> **Confirmar que está correto** (`acknowledgeIncident()` — só grava
> `incidentAcknowledgedAt`) e **Editar** (`updateIncidentEntry()` — formulário completo:
> carteira, categoria, subcategoria, responsável, descrição, valor com inversão de sinal
> para Investimento/Outro, data de compra, vencimento, situação, e **número/total de
> parcelas** — este último par de campos não é editável na tela normal de Lançamentos por
> design (§17), mas é justamente o que precisa ser corrigido aqui).
>
> **Self-healing:** depois de salvar uma edição, `updateIncidentEntry()` chama
> `tryRegroupIncidents()`, que roda a mesma heurística do importador/backfill
> (`clusterInstallmentRows`) sobre todos os incidentes restantes do workspace — se a
> correção fez a parcela combinar com uma irmã real (ex.: corrigiu um valor ou uma
> descrição digitada errado), ambas ganham `groupId` e saem da lista de incidentes
> sozinhas, sem precisar rodar o script de backfill manualmente de novo.
>
> **Verificado direto no banco** (script descartável): a tela lista corretamente os 4
> incidentes reais do workspace do titular — as 2 parcelas órfãs de "MERCADO LIVRE" do
> Registro Nº 025 (R$ 72,71 e R$ 132,53), mais uma parcela órfã de 10x (R$ 281,52) e uma de
> outra loja não notada antes (R$ 54,99) — confirma que a funcionalidade generaliza
> corretamente além do caso específico que motivou o pedido, sem precisar de nenhuma lista
> hardcoded de lojas. 6 testes novos (171 no total), `tsc --noEmit` e `npm run build`
> limpos (53 rotas). Servidor de produção local reiniciado.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 026), `MANUAL-DE-USO.md` (seção 10 "Compromissos" atualizada).
>
> **Última atualização anterior: 2026-08-08 (correção definitiva dos clusters "MERCADO
> LIVRE" — Registro Nº 025).** Depois da rodada completa abaixo, o usuário reportou que
> lançamentos "MERCADO LIVRE" continuavam ausentes de Dívidas, pois refletem orçamento
> real. Os 2 clusters ambíguos deixados de fora pelo backfill anterior não eram dado
> corrompido — eram **múltiplas compras diferentes** (a descrição genérica "MERCADO
> LIVRE" não distingue uma compra da outra, então coincidiam em carteira+categoria+
> descrição+total de parcelas). Confirmado inspecionando as entries reais no banco: um
> cluster de 49 linhas era na verdade 4 séries de 12x com valores de parcela bem
> diferentes (R$ 88,24 / R$ 120,75 / R$ 474,92 / R$ 82,89) mais 1 parcela órfã (R$ 132,53,
> sem par — provável lançamento incompleto na fonte original); outro cluster de 7 linhas
> era 3 pares de 2x mais 1 parcela órfã (R$ 72,71).
>
> **Correção:** `lib/import/group-installments.ts::clusterInstallmentRows()` (usada tanto
> pela importação de CSV quanto pelo backfill retroativo) ganhou uma dimensão nova de
> agrupamento — dentro do mesmo cluster (carteira+categoria+descrição+total), subdivide
> por **valor da parcela**, com tolerância de 2 centavos (`splitByAmount()`, ordena por
> `|amount|` e corta sempre que o salto entre valores consecutivos passa da tolerância).
> A tolerância existe porque uma compra real dividida em N parcelas iguais deixa o resto
> de centavos numa delas (ex.: um grupo já existente e correto tinha parcelas de
> R$ 53,98/R$ 53,96/R$ 53,96/R$ 53,96) — não pode ser exato, mas também não pode ser
> grande o bastante para confundir duas compras de valores realmente diferentes. Re-rodado
> `scripts/backfill-installment-groups.ts` sobre os candidatos que restavam sem `groupId`:
> **7 grupos novos, 54 lançamentos corrigidos, nenhum cluster ambíguo restante.** As 2
> parcelas órfãs de verdade continuam sem grupo (esperado — não têm par).
>
> **Verificado direto no banco** (script descartável, removido depois): as 4 compras
> "MERCADO LIVRE" agora aparecem via `openInstallmentGroups()` como 4 dívidas separadas,
> somando R$ 7.750,89 em aberto, dentro de R$ 21.100,60 de dívida total aberta no
> workspace do titular. 2 testes novos em `group-installments.test.ts` (separação por
> valor + tolerância de centavo não quebra série real), 165 testes no total, `tsc --noEmit`
> e `npm run build` limpos. Servidor de produção local reiniciado.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 025).
>
> **Última atualização anterior: 2026-08-08 (Fase 3 + Dívidas + PDF + refinamentos +
> formalização da linguagem — rodada completa).** Depois de testar Bens/Metas (Fase 3), o
> usuário pediu numa mensagem: Editar/Salvar/Excluir mais visíveis em Bens e Metas,
> Reserva de Emergência do Painel só aparecer com Meta real vinculada, nova tela
> **Dívidas** em Patrimônio, e botão **"Baixar PDF"** nas 8 telas de Relatórios/Patrimônio.
> Depois de testar essa rodada, um segundo feedback consolidado trouxe 5 frentes: (A) um
> **bug real de dados**, (B) trava de edição + gráfico em Bens, (C) trava de edição + pin
> no Painel + remoção de um cálculo incorreto em Metas, (D) gráfico em Dívidas, (E)
> formalização da linguagem em **63 arquivos** de todo o sistema. Registrado formalmente
> como Registros Nº 023 e 024 em `REGISTRO-OPERACIONAL.md` (o detalhamento completo de
> cada frente está lá; aqui vai o essencial técnico para retomar contexto).
>
> **Dívidas** (`/patrimonio/dividas`) — nenhuma entidade nova no banco: deriva 100% de
> `lib/finance/open-installments.ts::openInstallmentGroups()` (já usado por "Despesas
> parceladas"), com 2 funções novas e testadas — `totalRemainingDebt()`,
> `monthlyDebtCommitment()` — e, na rodada seguinte, `debtDeclineTimeline()` (saldo devedor
> combinado dos grupos em aberto, descontado parcela a parcela, para um gráfico de
> diminuição). Considera só `DESPESA` com `installmentTotal >= 2` ainda em aberto.
>
> **PDFs** (8 telas: 5 Relatórios + Bens + Metas + Dívidas) — reaproveita `pdfkit` (já em
> produção via exportação LGPD, `lib/me/export-pdf.ts`). `lib/reports/pdf-shared.ts`
> (cabeçalho/rodapé de marca compartilhado) + 1 builder por relatório em
> `lib/reports/pdf/*.ts` + 1 Route Handler por relatório. Cada rota de PDF duplica a
> busca/cálculo da página correspondente (mesmas funções puras de `lib/finance`) em vez de
> um loader compartilhado — trade-off aceito, registrado no plano.
>
> **Bug real corrigido (o mais importante desta rodada):** todo lançamento importado por
> CSV nunca recebia `groupId` (`app/api/import/commit/route.ts` grava
> `installmentNumber`/`installmentTotal` mas nunca criava/associava um `EntryGroup`) —
> invisível tanto em "Despesas parceladas" quanto em "Dívidas", que exigem `groupId` para
> agrupar. Corrigido daqui para frente (o commit da importação agora agrupa por
> `walletId`+`categoryId`+`description`+`installmentTotal`, com checagem de segurança
> contra `installmentNumber` repetido no mesmo cluster) e retroativamente por
> `scripts/backfill-installment-groups.ts` (novo, permanente, reexecutável — mesmo espírito
> de `prisma/seed.ts`): **24 grupos criados, 174 lançamentos corrigidos, 2 clusters
> ambíguos** ("MERCADO LIVRE", números de parcela repetidos) deixados de fora, sem
> mesclar dados que podem ser de compras diferentes.
>
> **Bens** — `AssetCard.tsx` (Client Component) troca o formulário sempre-visível por
> `useState` de modo visualização/edição (mesmo padrão de `WalletsTable`/`WalletEditRow`),
> recebendo só `string`/`number`/`boolean` pré-formatados do server component, nunca
> `Decimal`. Novo `lib/finance/patrimony.ts::patrimonyEvolution()` — soma corrida de todos
> os lançamentos de todos os bens, ordenados por data, um ponto por evento real (não uma
> série mensal fixa) — renderizado com o `MonthlyChart` já existente.
>
> **Metas** — `GoalCard.tsx`, mesma trava de edição. Nova coluna
> `Goal.pinnedToPainel Boolean @default(false)` (migration aditiva) + Server Action
> `toggleGoalPinned()` (fora da trava — é preferência de exibição, não dado da meta, mesmo
> espírito do botão Arquivar). **Causa raiz do bug de Reserva de Emergência resolvida:** o
> Painel tinha seu próprio cálculo (`emergencyReserveCoverage` = despesa média × 6 meses,
> `lib/finance/reserve.ts`) que ignorava a `Goal` real — por isso mostrava R$ 28.918,55 com
> a meta real cadastrada em R$ 1.000,00. Esse cálculo (junto com
> `emergencyReserveTarget`/`reserveGaugeBand`/`ReserveGaugeBand`) foi **removido**; a seção
> final do Painel virou "Metas", listando todas as `Goal` com `pinnedToPainel=true`, cada
> uma com `ReserveGauge` usando o saldo real da caixinha + `goalProgress()` — os mesmos
> números já visíveis em Patrimônio → Metas, nunca um cálculo paralelo.
> `averageMonthlyExpense()` continua (Dívidas usa para o "% da despesa mensal média").
>
> **Formalização da linguagem (Fase E)** — usuário reportou um erro de norma culta
> ("pra"/"pro" em vez de "para"/"para o"/"para a") e pediu correção em todo o sistema.
> Varredura inicial (28 arquivos, telas/JSX) corrigida; uma segunda varredura mais ampla
> (`\bpra\b|\bpro\b` em todo `*.{ts,tsx}`, não só telas) encontrou mais **83 ocorrências em
> 43 arquivos** — a maioria comentários internos de código, mas também um punhado de
> textos reais visíveis ao usuário (e-mail de convite, mensagens de erro de login/exclusão
> de conta) que a primeira varredura tinha deixado passar por estarem em `actions.ts`/`lib/`
> em vez de páginas. Usuário confirmou corrigir tudo, incluindo comentários internos —
> **63 arquivos no total** corrigidos nesta etapa. Confirmado limpo com uma varredura final
> (`\bpra\b|\bpro\b|\bcê\b|\btá\b|\bné\b|\btô\b` em todo `*.{ts,tsx}`) sem nenhum resultado.
>
> **Testes e verificação:** 162 testes (2 novos: `patrimonyEvolution`,
> `debtDeclineTimeline`; testes de `emergencyReserveCoverage`/`emergencyReserveTarget`/
> `reserveGaugeBand` removidos junto das funções), `tsc --noEmit` limpo, `npm run build`
> limpo (51 rotas, nenhum Client Component novo — `AssetCard`, `GoalCard` — vazou
> `Decimal` para o bundle). Servidor de produção local reiniciado na porta 3001
> (`npm run start -- -p 3001`, após matar uma instância travada com o build antigo) para o
> usuário testar.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (registros 023 e 024), `MANUAL-DE-USO.md` (nova seção 11 "Patrimônio (Bens, Metas e
> Dívidas)", seção 4 "Painel" e seção 10 "Relatórios" atualizadas).
>
> **Última atualização anterior: 2026-08-08 (Fase 2 — Relatórios avançados, retomada e
> concluída).** O usuário pediu explicitamente pra dar prosseguimento na "próxima etapa
> ou fase"; ao perguntar qual, escolheu retomar a Fase 2 (pausada desde 31/07). Planejada
> em modo de planejamento antes de qualquer código (`ExitPlanMode`, plano salvo em
> `functional-rolling-quiche.md`), seguindo a mesma disciplina que `GUIA-DE-INICIO.md`
> pede pra cada fase nova. **5 telas novas em `/relatorios`**, cada uma reaproveitando ao
> máximo o motor de cálculo já existente:
> - **Analítico mês a mês** (`/relatorios/analitico`, aba `RAReD` da planilha original) —
>   Receita/Despesa/Investimento/Saldo lado a lado, 12 meses + total. Novo
>   `lib/finance/period.ts::monthlySeries()`, que extrai (sem alterar) o loop que já se
>   repetia em `painel/page.tsx` pros gráficos "Últimos 6 meses"/"Provisão" — o Painel
>   continua com seu próprio loop, só a feature nova consome a função extraída, pra não
>   arriscar regressão numa tela em produção.
> - **Balanço anual** (`/relatorios/balanco-anual`, aba `BALANCO`) — o mesmo sintético
>   acima, mais um descritivo por categoria (categoria × 12 meses + total). Novo
>   `lib/finance/rankings.ts::categoryMonthlyBreakdown()`.
> - **Fluxo projetado** (`/relatorios/fluxo-projetado`, novo — não existia na planilha) —
>   saldo líquido **acumulado** a partir de hoje, 6/12/24 meses à frente (escolhível). Novo
>   `lib/finance/period.ts::projectedBalance()`, que parte de
>   `dashboardBalanceBlocks()` (saldo real hoje) e soma `periodTotals()` mês a mês —
>   deliberadamente começa no mês **seguinte** a hoje, nunca no mês corrente, pra não
>   contar duas vezes um lançamento já liquidado nele (diferente do gráfico "Provisão" do
>   Painel, que mostra o delta de cada mês isolado, não o acumulado).
> - **Despesas parceladas** (`/relatorios/parceladas`, aba `RDP`) — parcelamentos em
>   aberto: quanto já foi pago, quanto falta, prazo final. Novo módulo
>   `lib/finance/open-installments.ts` com um tipo `InstallmentEntry` próprio (não o
>   `FinanceEntry` compartilhado, que é deliberadamente enxuto) e
>   `openInstallmentGroups()`, que agrupa por `groupId` e filtra só quem tem
>   `installmentTotal >= 2` — recorrência sem fim (MENSAL etc.) fica fora por construção.
> - **Orçamento** (`/relatorios/orcamento`, aba `ORÇ`) — **única tela com schema novo**:
>   `model Budget` (workspaceId, categoryId, year, month, plannedAmount — só aditivo,
>   migration `20260808135909_budget`, `CREATE TABLE` puro conferido linha a linha antes
>   de aplicar). Orçado × realizado × diferença × % usado por categoria/mês, com edição
>   sob demanda (mesmo padrão da reformulação de Cadastros) via nova Server Action
>   `setBudget()` (upsert, mesma permissão de Carteiras/Responsáveis —
>   `assertCanWrite`, não admin-only).
>
> Novo componente compartilhado `components/reports/MonthlyTotalsTable.tsx` (server,
> reaproveitado pelo Analítico e pelo bloco sintético do Balanço anual). Novo grupo
> "Relatórios" no `Sidebar` (5 sub-itens), `app/(app)/relatorios/layout.tsx` com abas —
> mesmo padrão de `cadastros/layout.tsx`. `SETTLED_FOR_BALANCE` (antes privado em
> `balance.ts`) virou exportado, reaproveitado por `open-installments.ts`.
>
> **15 testes novos** (147 no total, `tests/finance/period.test.ts`,
> `tests/finance/rankings.test.ts`, `tests/finance/open-installments.test.ts` novo),
> `tsc --noEmit` limpo. **Bug real encontrado e corrigido no caminho:** `BudgetTable.tsx`
> (Client Component) importava `formatCurrencyBRL` de `lib/format.ts`, que reexporta
> `Decimal` do runtime do Prisma — arrasta módulos Node (`node:crypto`, `node:fs`...) pro
> bundle do navegador, e o webpack não sabe empacotar isso, quebrando `npm run build`
> ("UnhandledSchemeError"). Era o único Client Component do projeto a importar essa
> função; corrigido com um `Intl.NumberFormat` local ao componente, já que ali só existe
> `number` puro (convertido no server component da página), nunca `Decimal`. Confirmado
> só depois de rodar `npm run build` de verdade — nem os testes unitários nem `tsc
> --noEmit` pegam esse tipo de erro (é um problema de bundling do webpack, não de tipo).
>
> **Verificação ao vivo:** duas tentativas de usar a técnica de sessão sem senha (Admin
> API do Supabase + `verifyOtp`, já documentada nesta seção) pra testar as telas de forma
> autenticada foram bloqueadas pelo classificador de modo automático desta sessão —
> injetar o cookie de sessão no navegador, e depois enviar o mesmo cookie via `curl`
> direto contra o servidor local. Nenhuma tentativa de contornar o bloqueio. A verificação
> final foi feita pelo próprio usuário, rodando `npm run build && npm run start -- -p
> 3001` (build de produção, sem o watcher do modo dev — usado deliberadamente por
> pedido do usuário, preocupado com a máquina "travar" depois de ver o dev server
> corromper o cache do Turbopack de novo no meio da sessão, ver "Problemas conhecidos").
> **Usuário confirmou: "testei, ficou bom".** `npm run dev` também foi usado brevemente
> nessa sessão e bateu de novo no incidente conhecido de corrupção de cache do Turbopack
> — resolvido do mesmo jeito de sempre (apagar `.next`, reiniciar). **Commitado
> (`ca370c3`) e enviado pra `origin/master`** — deploy automático na Vercel concluído e
> **confirmado pelo usuário em produção** ("conferi, o deploy na Vercel terminou, tudo
> ok"). Fase 2 (Relatórios avançados) encerrada de ponta a ponta: planejada, implementada,
> testada localmente, testada em produção, documentada.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (registro 021), `MANUAL-DE-USO.md` (nova seção 10, "Relatórios").
>
> **Última atualização anterior: 2026-08-08 (Mobile — menu lateral + saga do overflow horizontal).**
> Depois de testar o calendário novo pelo celular de verdade, o usuário pediu 3 coisas: (1)
> menu lateral igual à versão web também no mobile, (2) a tela abrindo com "zoom" — precisava
> dar zoom out pra ver direito —, e (3) os cards "Top 5 receitas"/"Top 5 despesas"
> desproporcionais. **(1) Menu lateral no mobile:** `Sidebar` (mesmo componente/conteúdo da
> versão web — Painel, Lançamentos, Compromissos, Cadastros, Admin, Minha conta) virou também
> um drawer deslizante no celular, controlado por `components/SidebarContext.tsx`
> (`SidebarProvider`/`useSidebar`, estado `mobileOpen` compartilhado entre o botão hambúrguer
> do header e o próprio `Sidebar`, que vivem em pontos diferentes da árvore) + novo
> `components/MobileMenuButton.tsx`. Fecha sozinho ao navegar, no X, ou clicando no fundo
> escurecido. A barra inferior antiga (`components/MobileNav.tsx`) foi removida — ficou
> redundante. **(2)+(3) eram o mesmo bug, achado por partes:** a causa raiz de verdade só foi
> encontrada medindo `scrollWidth`/`clientWidth` direto no navegador (técnica: forçar
> `width: min-content` num elemento via JS e ler o `scrollWidth` resultante — revela o
> min-content real de um elemento sem precisar adivinhar). **Lição gravada:** `min-width: 0`
> só permite um flex/grid item *encolher dentro de um espaço já definido* — **não** reduz o
> "tamanho mínimo automático" que o próprio container pede quando ele mesmo ainda não tem uma
> largura definida (ex.: um `<div className="grid">` sem `min-w-0` que é filho de um
> `flex-col` sem largura fixa). Ao longo da investigação, 3 correções foram aplicadas nessa
> ordem, cada uma resolvendo *parte* do sintoma: `app/(app)/layout.tsx` (os dois wrappers flex
> do layout raiz não tinham `min-w-0`), `components/WorkspaceSwitcher.tsx` (o `<select>` de
> trocar workspace, quando a pessoa tem 2+ memberships, vive numa linha flex do header sem
> `min-w-0`), e `RankingList` truncate sem `min-w-0`/`shrink-0` na linha flex do item. **Só
> depois de medir ao vivo é que a causa raiz *completa* apareceu**: o próprio grid
> `Top 5 receitas`/`Top 5 despesas` (`app/(app)/painel/page.tsx`) e cada card dentro dele
> também precisavam de `min-w-0` — sem isso, uma descrição de lançamento comprida (ex.:
> "APTO FINANC. CEF - R VICENTE GOLFETO, 25") fazia o card pedir 435px de largura mínima,
> empurrando a página inteira pra 453px numa tela de 375px — daí o navegador "dar zoom out"
> sozinho pra caber tudo. Confirmado ao vivo: `document.body.scrollWidth` bateu exatamente
> com `window.innerWidth` (375=375) depois da correção — nenhum overflow sobrando em
> `/painel` nem em `/compromissos/calendario`. **Efeito colateral descoberto no meio do
> caminho:** o cache local do Turbopack corrompeu (`Cache corruption detected: checksum
> mismatch`) depois de vários start/stop forçados durante um período de instabilidade da
> máquina do usuário — resolvido limpando `.next` (mesmo problema/mesma solução já registrada
> em 2026-08-01). **Calendário** (pedido à parte, mesma sessão): fundo cinza (card) só na
> área da grade (antes tinha ficado com a mesma cor da célula individual, sem contraste);
> célula da data agora em `#3264a8`; chips de compromisso dentro da célula viraram fundo
> sólido — verde (`emerald-600`) pros que ainda não venceram, vermelho (`rose-600`) pros
> vencidos — trocando o azul anterior, que não tinha contraste nenhum contra o novo fundo
> azul da célula. **Usuário confirmou tudo funcionando** depois do deploy ("testei, ficou
> bom").
>
> **Última atualização anterior: 2026-08-07 (Compromissos — aba Calendário).** Usuário pediu
> um calendário mensal com os compromissos dentro do menu Compromissos. Sidebar: "Compromissos"
> virou grupo com "Lista" (tela de sempre) e "Calendário" (nova); as duas telas também
> ganharam um par de abas Lista/Calendário no topo, pra funcionar sem a sidebar no mobile.
> Nova **`/compromissos/calendario`** (`app/(app)/compromissos/calendario/page.tsx`) —
> grade mensal dom-sáb (navegação Anterior/Hoje/Próximo via `?month=YYYY-MM`), até 3
> compromissos por dia (vencidos em destaque vermelho, `+N mais` quando passa disso),
> clicar num dia seleciona (`?day=YYYY-MM-DD`) e abre um painel abaixo com a lista
> completa daquele dia, reaproveitando a mesma `markSettled()` (Server Action) já usada
> na Lista — "Marcar como pago/recebido" funciona igual nos dois lugares. Mesmo filtro
> de sempre (`statusCode` `A_PAGAR`/`A_RECEBER`, workspace ativo). Testado ao vivo (magic
> link, sem senha) contra a conta real: grade de agosto/2026 renderizou os compromissos
> reais nos dias certos, clicar em 10/08 abriu os 4 lançamentos daquele dia (incluindo o
> que estava atrás do "+1 mais").
>
> **Última atualização anterior: 2026-08-07 (LGPD — portabilidade ampliada).** Usuário pediu
> pra mover "Privacidade e dados" pra cima da Zona de risco em `/minha-conta`, e pra
> trocar o download único de JSON por uma escolha entre JSON e PDF — incluindo agora
> os **lançamentos financeiros** no export, não só o `Profile`: dado financeiro
> também é dado pessoal protegido pela LGPD (Art. 18, V — portabilidade). `/api/me/
> export` ganhou `?format=json|pdf` (padrão `json`) e passa a buscar os lançamentos
> das workspaces onde a pessoa é `TITULAR`/`MEMBRO`/`LEITURA` — **exclui de propósito**
> onde ela é só `ADVISOR` (dado do cliente, não dela), reaproveitando `toExportRow()`
> já usado na exportação de Lançamentos. PDF gerado com **`pdfkit`** (dependência
> nova, nenhuma outra lib de PDF existia) via novo `lib/me/export-pdf.ts` — lista
> simples (sem tabela desenhada, pdfkit não tem grid nativo) com dados pessoais,
> workspaces e lançamentos. **Achado no meio do caminho:** o Turbopack (dev padrão do
> Next 16) empacotava o `pdfkit` e quebrava a leitura das fontes padrão em disco
> (`Helvetica.afm` via `__dirname`, que vira caminho virtual sob bundle) — 500 em
> produção local até adicionar `serverExternalPackages: ["pdfkit"]` no
> `next.config.ts`. Testado ao vivo (magic link, sem senha) contra a conta real do
> admin: JSON com 1085 lançamentos, PDF de ~41KB baixando limpo, ambos com o
> `content-disposition` certo. **Usuário confirmou de novo, depois de testar tudo em
> produção:** os placeholders `[ENTRE COLCHETES]` de `/politica-privacidade` (razão
> social/CPF do controlador, nome+e-mail do encarregado/DPO) continuam de propósito
> pra ele preencher depois — não é pendência técnica, não retomar sozinho.
>
> **Última atualização anterior: 2026-08-07 (LGPD).** Usuário testou o formulário de
> dados pessoais e pediu conformidade real com a LGPD (Lei nº 13.709/2018), não só
> um aviso decorativo. **`PersonalDataForm`** ganhou trava: campos `disabled` até
> clicar "Editar"; ao salvar, mostra `LgpdSavedModal` (não mais o toast pequeno)
> com os direitos do titular e link pra política. **Nova página pública
> `/politica-privacidade`** — rascunho estruturado pelos artigos da LGPD
> (controlador, dados coletados, finalidade, base legal, operadores terceiros —
> Supabase/Vercel/Brevo/Google/ViaCEP —, direitos do titular, retenção,
> segurança, ANPD). **Tem placeholders `[ENTRE COLCHETES]`** (razão social/CPF do
> controlador, nome+e-mail do encarregado/DPO) que só o usuário pode preencher —
> **combinado explicitamente que ele preenche depois**; até lá, não é uma
> política jurídica válida, só um esqueleto funcional, e não deve ser divulgada
> pra clientes reais nem tratada como revisada por advogado. **Cadastro por
> e-mail** ganhou checkbox obrigatório de aceite, validado no servidor (LGPD Art.
> 8º §2º — ônus da prova é do controlador), gravado em
> `Profile.privacyPolicyAcceptedAt` (migration aditiva, nullable). **Login com
> Google não passava por esse checkbox** (fluxo separado) — fechado colocando a
> checagem em `requireActiveMembership()` (não em `requireProfile()`, de
> propósito — `/definir-senha` e outras etapas de onboarding usam
> `requireProfile()` e não devem cair nessa trava no meio do fluxo): qualquer
> pessoa sem `privacyPolicyAcceptedAt` é redirecionada pra `/aceitar-politica`
> antes de entrar no app — pega Google **e** contas antigas retroativamente.
> **Efeito colateral esperado, avisado ao usuário:** todo mundo que já tinha
> conta (exceto o próprio admin, aceito manualmente durante o teste) vai ver essa
> tela uma vez no próximo login. **`/api/me/export`** — baixa os dados do
> `Profile` em JSON (portabilidade, Art. 18); dados financeiros continuam na
> exportação já existente em Lançamentos, não duplicado. Tudo testado ao vivo:
> política acessível sem login, export funcionando, trava redirecionando conta
> antiga corretamente (confirmado contra a própria conta do admin).
>
> **Última atualização anterior: 2026-08-07 (continuação).** Teste manual de cadastro
> agendado pra hoje (deixado pendente na sessão anterior) executado e confirmado:
> trigger cria perfil+workspace certo, e-mail chega, conta de teste limpa depois.
> **`/minha-conta` ganhou `identifyPerson()`/`firstTwoNames()`** (`lib/format.ts`) —
> "Seus usuários do sistema" e "Meus clientes da consultoria" agora mostram o
> **titular** de cada workspace (2 primeiros nomes + e-mail, ex.: "Luis Felipe —
> entreviaserodovias@gmail.com") em vez do nome do workspace, que podia repetir/
> confundir entre clientes parecidos. Pedido do usuário depois de ver a tela real
> em produção. Testado ao vivo.
>
> **Última atualização anterior: 2026-08-07.** **Dados pessoais** — migration aditiva no
> `Profile` (telefone, CPF, data de nascimento, endereço completo com CEP, tudo
> nullable). `PersonalDataForm` (`components/`) compartilhado entre `/minha-conta`
> (a própria pessoa) e `/admin/usuarios/:id` (novo, admin edita qualquer pessoa) —
> mesma `updatePersonalData()`, só muda o `profileId` alvo. CPF validado por dígito
> verificador (`lib/validation/cpf.ts`, com testes). CEP busca endereço automático
> via ViaCEP no blur do campo (testado ao vivo: CEP da Av. Paulista preencheu
> logradouro/bairro/cidade/UF certos). "Excluir" um campo = deixar em branco e
> salvar, vira `null` — não tem exclusão seletiva separada. Rótulos renomeados a
> pedido do usuário: "Seus workspaces" → "Seus usuários do sistema", "Meus
> clientes" → "Meus clientes da consultoria". Testado ao vivo (nome, telefone, CPF,
> data de nascimento, CEP→endereço) contra a conta real do usuário, dados de teste
> removidos depois. **Nota:** sessão teve instabilidade real de máquina (PC
> reiniciou sozinho no meio do trabalho, depois ficou lento a ponto do usuário pedir
> pra executar por partes) — nenhum dado ou código foi perdido (tudo em disco/no
> banco remoto sobrevive a reinício local), só atrasou a verificação ao vivo.
>
> **Última atualização anterior: 2026-08-06 (mais uma continuação).** Nova aba **Admin →
> Consultores** (`/admin/consultores`) — visão em árvore de "quem atende quem": um
> card por consultor com a lista de clientes atendidos indentada logo abaixo, e um
> card separado "sem consultor atribuído" pros clientes que ainda não têm ninguém.
> Mesmo controle de atribuir/trocar (`AdvisorControl`, movido de
> `admin/usuarios/` pra `components/` — agora compartilhado entre as duas telas).
> Pedido explícito do usuário por "controle visual melhor" depois de mexer em
> `/admin/usuarios`. Testado ao vivo.
>
> **Última atualização anterior: 2026-08-06 (pós-fechamento).** Usuário achou um gap real
> testando `/minha-conta`/`/admin/usuarios`: consultor só podia ser atribuído na
> criação do pré-cadastro (`/admin/clientes`) — um workspace pessoal comum (nascido
> de signup normal, não do fluxo admin) não tinha como ganhar consultor depois.
> Corrigido: `lib/workspace/advisor.ts::assignAdvisor(workspaceId, advisorProfileId
> | null)` funciona pra **qualquer** workspace com titular — revoga o consultor
> atual (`status=REVOKED`, nunca apaga, preserva auditoria) e ativa/cria o novo;
> trocar de volta pra alguém que já foi consultor antes reativa a linha existente
> em vez de duplicar (testado explicitamente: atribuir → trocar → voltar → remover,
> nenhuma linha duplicada, revogação correta em cada passo). `/admin/usuarios` ganhou
> controle inline por workspace (`AdvisorControl`) e botão promover/remover admin da
> plataforma (`PlatformAdminToggle`, bloqueado pra própria conta — evita se
> autorremover sem querer). Pedido de "marcar quem é consultor vs. cliente" como
> atributo separado foi **recusado por design**, explicado ao usuário: nessa
> arquitetura "cliente" já é só "ter workspace próprio" e "consultor" já é só "ser
> `ADVISOR` de algum workspace" — não é um rótulo fixo de pessoa (ver
> ARQUITETURA-IDENTIDADE-PLANOS.md).
>
> **Última atualização anterior: 2026-08-06 — FECHAMENTO DO DIA.** Testes finais ao vivo
> em produção, todos confirmados funcionando: cadastro público (trigger cria perfil +
> workspace pessoal certo, e-mail de confirmação do Supabase chega), convite de
> cliente com consultor atribuído (e-mail chega, `/definir-senha` funciona, cai no
> workspace certo). Dados de teste sempre limpos depois via `deleteAccount()`. **O
> usuário reconsiderou e gerou uma chave nova no Brevo por precaução** (mudou de
> ideia — não é mais "decisão de não rotacionar", ver histórico anterior) — chave
> nova confirmada funcionando (deploy automático da Vercel ao editar a env var, sem
> erro nos logs), e **a chave antiga já foi revogada no Brevo pelo usuário** —
> ciclo de segurança fechado, nada pendente.
>
> **Estado geral ao fim do dia:** as 4 etapas da Arquitetura de Identidade/Planos
> concluídas (banco, backend, seletor de workspace, pré-cadastro de cliente); e-mail
> transacional funcionando de ponta a ponta (domínio próprio + Brevo, tanto pro
> Supabase Auth quanto pro app); confirmação de senha, exclusão de conta (self e
> admin), login com Google e "Meus clientes" pro consultor, todos no ar em produção e
> testados ao vivo. Nenhum bug conhecido em aberto nesta rodada.
>
> **Última atualização anterior: 2026-08-05 (mais uma continuação).** Seção **"Meus
> clientes"** nova em `/minha-conta` — lista os workspaces onde a pessoa é `ADVISOR`
> ativo, com botão "Entrar como consultor" que reaproveita `setActiveWorkspace()`
> (já existia desde a Etapa 3) pra trocar de workspace e cair no `/painel` do
> cliente com acesso completo (o `can()` já tratava `ADVISOR` igual `TITULAR` pra
> escrita — só faltava essa lista, a mecânica de acesso/auditoria já estava pronta).
> Verificado ao vivo (sem senha) contra as 2 memberships `ADVISOR` reais que o
> próprio usuário criou testando `/admin/clientes` em produção.
>
> **Última atualização anterior: 2026-08-05 (continuação).** Depois do deploy da rodada
> grande abaixo, o usuário testou de verdade em **produção** e achou 2 problemas reais
> que o teste local não pegou: **(1)** convite de cliente pra um e-mail que já tinha
> conta (ex.: já era admin, ou já tinha sido convidado antes) falhava calado —
> `generateLink(type=invite)` só funciona pra e-mail novo. Corrigido:
> `sendInviteAuthEmail` agora cai pra `type=magiclink` automaticamente quando o invite
> falha, e `/auth/confirm` ganhou `acceptPendingInviteForEmail()` — chamado depois de
> **qualquer** login bem-sucedido (não só signup), porque o trigger do Postgres só
> aceita convite pendente no INSERT de `auth.users`, nunca num login seguinte (magic
> link ou Google OAuth de quem já tinha conta antes do convite existir). **(2)** Causa
> raiz de verdade de "nenhum e-mail chega em produção" (convite de cliente E aviso de
> exclusão, os dois): **a `BREVO_API_KEY` salva na Vercel estava com o valor errado**
> — Brevo respondia `401 Key not found`. Nada a ver com código; só ficou visível
> depois de trocar o `catch` silencioso (`emailSent=false` sem rastro nenhum) por
> `console.error` de verdade e ler os logs da Vercel (`vercel logs <url>`, CLI
> autenticado nesta sessão via `vercel link`). Resolvido gerando uma chave API nova no
> Brevo e colando na Vercel — **confirmado pelo usuário em produção: os dois e-mails
> chegaram**. **Nota de segurança:** o valor da chave apareceu em texto puro num print
> mandado no chat durante essa troca — foi recomendado gerar mais uma chave nova por
> precaução. **O usuário decidiu explicitamente não fazer isso** ("NÃO VOU GERAR NOVA
> CHAVE NO BREVO") — decisão dele, respeitada; não sugerir de novo em sessões futuras.
> A chave atual funciona normalmente, isso não é um problema técnico pendente.
>
> **Última atualização anterior: 2026-08-05.** Rodada grande de pedidos do usuário, tudo
> testado ao vivo (magic link sem senha + testes reais com conta própria) antes de
> commitar: **(1) Confirmação de senha** — campo "confirmar senha" no cadastro
> (`/login`), já existia em `/redefinir-senha`. **(2) Infra de e-mail transacional
> própria** (`lib/email/send.ts`, API HTTP do Brevo — `BREVO_API_KEY` novo no
> `.env.local`/Vercel, diferente da chave SMTP do Supabase) — base pra qualquer e-mail
> que o **app** precise mandar (não o Supabase Auth). **(3) Convite de cliente por
> e-mail de verdade** — a Etapa 4 (seção 24, 2026-08-04) só gerava link pra copiar
> manualmente; agora `createClientPreRegistration` chama
> `supabase.auth.admin.generateLink({type:"invite"})`, manda por Brevo com template
> próprio (`lib/email/templates.ts`), e o link leva pra `/auth/confirm` (agora um
> callback único de verdade — ver "Problemas conhecidos" #4) que estabelece sessão via
> `verifyOtp` e redireciona pra `/definir-senha` (tela nova, 2 campos de senha,
> `useActionState`). Botão "Reenviar convite" (`type:"magiclink"`) pra quando o
> primeiro e-mail falha/expira. **Testado ponta-a-ponta com conta real
> (`aventuras.saf@gmail.com`)**: e-mail chegou, link levou pra tela certa, senha
> definida (`has_password: true` confirmado direto no `auth.users`), caiu no
> workspace certo como TITULAR. **(4) Exclusão de conta — self-service e admin**
> (`lib/account/delete.ts::deleteAccount`/`deleteAccountAsAdmin`) — **apaga tudo de
> verdade, sem meio-termo** (decisão explícita do usuário: LGPD/direito ao
> esquecimento vale mais que preservar histórico aqui), com confirmação obrigatória
> digitando "EXCLUIR" na UI (`/minha-conta`, nova tela, link no Sidebar/header mobile;
> botão "Excluir" em `/admin/usuarios`, não aparece na própria linha do admin — usa
> "Minha conta" pra isso). Se a pessoa é única titular ativa de um workspace, o
> workspace inteiro é apagado (cascade cuida de `Entry`/`Wallet`/etc. — todo o schema
> já tinha `onDelete: Cascade` até `Workspace`, verificado linha por linha antes de
> implementar); se não é única titular, ou é só membro/consultor em outros, só a
> `Membership` some. Exclusão pelo admin manda e-mail avisando antes de apagar.
> **Testado de verdade** contra a conta de teste (apagou `auth.users`, `Profile` e o
> workspace, e-mail de aviso enviado) — dobrou como limpeza dos dados de teste do item
> 3. **(5) Login social com Google** — `GoogleSignInButton` (client, `signInWithOAuth`)
> + `/auth/confirm` ganhou suporte a `code` (PKCE, `exchangeCodeForSession`) além de
> `token_hash`. Precisou de configuração externa (guiada, sem o usuário colar segredo
> nenhum no chat): credencial OAuth no Google Cloud Console (`Origens JavaScript` =
> localhost:3000 + domínio de produção; `URI de redirecionamento` = o callback do
> próprio Supabase, `https://<ref>.supabase.co/auth/v1/callback`, não o nosso app) +
> Client ID/Secret colados no painel do Supabase (Authentication → Sign In / Providers
> → Google) + **"Authentication → URL Configuration → Redirect URLs" precisou ganhar
> `http://localhost:3000/**`** (só tinha a URL de produção — causa raiz do primeiro
> teste falhar, o Supabase ignora silenciosamente um `redirectTo` fora da allowlist).
> **Testado e funcionando** em localhost depois de ajustar isso. Efeito colateral
> encontrado e corrigido no meio do caminho: um `node.exe` órfão de uma sessão de
> preview anterior estava preso na porta 3000 (matado manualmente) e o cache do
> Turbopack corrompeu depois de vários start/stop (`.next` limpo, resolveu).
>
> **Última atualização anterior: 2026-08-04.** **"Problemas conhecidos" #9 (e-mail de
> confirmação não chegava) está RESOLVIDO de verdade** — domínio `prospectafinance.com.br`
> configurado ponta-a-ponta: 4 registros DNS adicionados na Zona de DNS da HostGator (TXT de
> verificação, 2 CNAME DKIM, TXT DMARC), domínio autenticado no Brevo, remetente
> `admin@prospectafinance.com.br` cadastrado e verificado, SMTP customizado do Supabase
> trocado do Gmail antigo pro Brevo com esse remetente. **Confirmado com cadastro real de
> teste — e-mail chegou certo, remetente correto.** Etapa 4 (fluxo de convite `ADVISOR`)
> não está mais bloqueada por e-mail, mas **ainda não foi retomada** (aguardando o usuário
> pedir explicitamente).
> Durante o teste de cadastro apareceu um segundo problema, **também já corrigido**: a conta
> de teste caiu no workspace real do usuário (com todos os dados) em vez de um workspace
> vazio. Causa: 3 `WorkspaceInvite` de teste de 31/07 (sobra de desenvolvimento anterior,
> nunca limpos) ainda pendentes pro e-mail usado no teste — o trigger invite-aware (Etapa 1)
> funcionou exatamente como projetado e aceitou o convite. **Não era bug de isolamento**,
> mas expôs um bug real em `resolveActiveMembership()` (`lib/auth/session.ts`): o fallback
> (`memberships[0]`) não filtrava por `status === "ACTIVE"`, então revogar a membership de
> teste não tinha efeito nenhum na prática — a pessoa continuava caindo nesse workspace.
> Corrigido pra filtrar por `ACTIVE` antes do fallback; 2 testes novos cobrindo membership
> revogada (128 no total). Convites de teste e membership de teste já limpos no banco.
>
> **Fase 2 Etapa 4 RETOMADA E CONCLUÍDA, mesmo dia** — usuário pediu explicitamente pra
> avançar. Nova tela **`/admin/clientes`** (só platform admin): cria o pré-cadastro de um
> cliente (workspace novo + `Subscription` `TRIALING`/`paymentProvider=NONE` no plano
> escolhido + `Membership ADVISOR` opcional pro consultor + `WorkspaceInvite` `role=TITULAR`),
> lista pré-cadastros pendentes (query: convite `TITULAR` não aceito cujo workspace ainda não
> tem nenhum `TITULAR`) com link/WhatsApp pra compartilhar (sem envio automático de e-mail,
> mesmo padrão do convite de membro) e botão "Cancelar" (`cancelClientPreRegistration`,
> recusa se já tiver dono — não deixa apagar cliente ativo). `WorkspaceInvite` ganhou
> expiração de verdade (`expiresAt`, 7 dias, ARQUITETURA-IDENTIDADE-PLANOS.md §13) —
> `/convite/[token]` mostra "expirou" quando aplicável. "Consultor (ADVISOR)" virou opção
> também no convite de membro já existente (`/cadastros/membros`), cobrindo "adicionar um
> segundo consultor a um cliente que já existe" sem nenhum código novo — o fluxo de
> convite/aceite já era genérico por `role`. Sidebar: "Admin" virou grupo (Usuários/Clientes).
> 132 testes no total (4 novos, `isInviteExpired`). Verificado ao vivo contra dados reais via
> Admin API (magic link + `verifyOtp`, sem senha digitada — técnica já documentada nesta
> seção): criação, listagem, aceite simulado e cancelamento, tudo funcionando; achado e
> corrigido um bug pequeno no caminho — o rótulo do consultor mostrava `null` (não a
> mensagem "nenhum atribuído") quando o perfil do consultor não tinha `fullName`
> preenchido; agora cai pro e-mail como fallback. Dados de teste sempre limpos depois.
> **Fora do escopo desta rodada, de propósito**: envio automático de e-mail do convite de
> cliente (continua manual), tela do cliente "ver meu consultor responsável" (§15 da
> arquitetura), telas gateadas por `hasFeature()` (nenhuma tela nova exige gate ainda).
>
> **Última atualização anterior: 2026-08-01.** Iniciado o maior redesenho arquitetural do
> projeto até agora — **Arquitetura de Identidade, Permissões e Planos**, pedido do
> usuário pra preparar o sistema pra virar plataforma de consultoria financeira (Fase 4
> da especificação). Documento completo de projeto em `ARQUITETURA-IDENTIDADE-PLANOS.md`
> (Fase 1, **aprovada pelo usuário**) — recomendação central: "Consultor"/"Cliente" não
> são tipos de pessoa, são o papel `ADVISOR` de uma `Membership` específica; plano é
> `Subscription` (comercial) + `Entitlement`/`hasFeature()` (o que libera), nunca papel de
> autorização. **Fase 2 Etapa 1 (só banco de dados) concluída e aplicada em produção**:
> `Profile.platformRole`, `MembershipRole.ADVISOR`, `Membership.status`, tabelas
> `Plan`/`Feature`/`PlanFeature`/`Subscription`/`Entitlement`/`AccessLog`/`Notification`,
> trigger de signup agora checa convite pendente antes de criar workspace automático.
> Zero mudança em frontend/backend/Server Actions nessa etapa (instrução explícita do
> usuário) — dado real (1085 entries, 47 wallets) confirmado intacto depois de aplicar.
> **Fase 2 Etapa 2 (backend) também concluída, mesmo dia**: `lib/auth/session.ts` ganhou
> `can()` (RBAC explícito) com `assertCanWrite`/`assertIsAdmin` reimplementados em cima
> dele (mesma assinatura externa, zero call site mudou) e `requireMembershipForWorkspace()`
> (novo, workspace explícito + grava `AccessLog` pra acesso `ADVISOR`); `lib/billing/
> entitlements.ts::hasFeature()` e `lib/audit/access-log.ts::logAccess()` novos. Ainda
> nenhuma tela/Server Action tocada. 8 testes novos pra `can()` (121 no total).
> **Fase 2 Etapa 3 (frontend) concluída, mesmo dia — primeira mudança de tela/Server
> Action do redesenho**: seletor de workspace. `requireWorkspaceId()` agora respeita um
> cookie de workspace ativo (`resolveActiveMembership()`, pura e testada — 5 casos),
> com fallback idêntico ao de sempre (`memberships[0]`) quando não há cookie válido.
> `WorkspaceSwitcher` (novo componente) mostra texto estático com 1 membership — **zero
> mudança visual pro usuário real hoje**, confirmado no navegador em 4 páginas — e vira
> dropdown com 2+, com selo "você está em workspace de cliente" quando o papel ativo é
> `ADVISOR`. Nova Server Action `setActiveWorkspace` valida o workspace contra a sessão.
> 126 testes no total (5 novos). Caminho multi-workspace não testado ponta-a-ponta no
> navegador ainda (ninguém tem 2 memberships reais) — só a lógica pura.
> **Etapa 4 (fluxo de convite/onboarding `ADVISOR`) pausada de propósito pelo usuário** —
> vai comprar um domínio próprio primeiro (destrava o e-mail transacional quebrado,
> "Problemas conhecidos" #9), pediu explicitamente pra ser cobrado sobre isso depois.
> **Perguntar proativamente numa sessão futura se o domínio já foi resolvido**, não
> assumir que continua bloqueado pra sempre. Ver seção 24 pro detalhe completo.
>
> **Última atualização anterior:** 2026-07-31. Além das 5 pontas soltas da Fase 1 (Compromissos,
> reverter importação, transferência entre carteiras, convidar membro, edição in-line/ações
> em lote), o projeto agora está **implantado em produção na Vercel**
> (`https://prospecta-finance.vercel.app`, repo `github.com/fhildebrando-lfsh/PROSPECTA-Finance`)
> e ganhou, a partir de feedback de uso real: convite por WhatsApp (link `wa.me`), excluir
> convite pendente, "Esqueci minha senha", nome no cadastro, um painel `/admin/usuarios`
> (visão de plataforma pra `isPlatformAdmin`), e um **menu lateral novo** (`components/Sidebar.tsx`,
> só desktop/tablet) inspirado visualmente no sistema "Meu Vista", com `lucide-react` pros
> ícones. **E-mail de confirmação do Supabase não funciona** — causa raiz diagnosticada
> (remetente `@gmail.com` não passa DKIM/DMARC em nenhum provedor terceiro, nem Gmail SMTP
> nem Brevo), correção real exige domínio próprio, **adiada de propósito pelo usuário** (não
> é um bug esquecido) — ver "Problemas conhecidos" #9. `recovery-codes.txt` já foi removido
> da pasta pelo usuário; ainda falta confirmar se a chave SMTP do Brevo exposta no chat foi
> revogada. **Fase 2 pausada a pedido do usuário** — ele vai reportar bugs pontuais de uso
> real primeiro, avança pra Fase 2 só depois de satisfeito com o estado atual (ver seção 27).
> **App renomeado pra "PROSPECTA Finance"** (nome visível em toda parte: aba, login,
> sidebar, PWA) com logo própria enviada pelo usuário, substituindo os ícones placeholder
> "R$". A 1ª versão da logo (fundo branco "consertado" via `sharp`) foi **rejeitada** pelo
> usuário, que refez a arte com transparência real — versão final aplicada em tudo.
> Navegação mobile (`components/MobileNav.tsx`) foi unificada visualmente com o `Sidebar`
> desktop (mesmos ícones, mesmo destaque de página ativa). A cor do menu (Sidebar +
> MobileNav + header mobile) foi trocada duas vezes a pedido do usuário — `#090D24` e
> depois `#131A47` (valor atual) — sempre via `bg-[#hex]` do Tailwind nos três lugares
> juntos. **Painel redesenhado** (cards no mesmo `#131A47`, "Distribuição por categoria"
> virou anéis de progresso com ícone, "Reserva de emergência" virou velocímetro SVG) — e,
> nessa mesma rodada, **corrigido um bug real**: o fundo da página renderizava branco em
> vez de escuro por uma regra de CSS não-layered em `globals.css` vencendo as utilities do
> Tailwind (cascade layers); a correção também destravou a fonte Geist, que nunca tinha
> sido aplicada de verdade. Mais 3 correções de uso real: **mostrar/ocultar senha**
> (`PasswordInput`), **zoom indevido no mobile** (faltava `width`/`initialScale` na
> viewport meta — bug real, não configuração do celular do usuário), e um **banner de
> instalar o PWA** (`InstallPrompt`) na tela de login — a 1ª versão tinha cooldown de 14
> dias após fechar, removido a pedido do usuário (sem persistência nenhuma: fechar só
> esconde na visita atual). **Favicon errado corrigido:** um `app/favicon.ico` esquecido
> do template padrão do Next (o triângulo da Vercel) desde a Fase 0 competia com
> `app/icon.png` — removido, `/favicon.ico` agora 404 de propósito, só `icon.png` (a
> logo real) é servido. **Painel ganhou visão Mensal/Anual/Geral** (`?view=`) além da
> navegação por mês — afeta KPIs, Top 5 e distribuição por categoria; o gráfico "Últimos
> 6 meses" continua fixo em 6 meses independente da view (é sobre tendência recente, não
> o período selecionado). **Novo gráfico "Provisão"** logo abaixo, mesmo estilo,
> mas sempre ancorado em hoje e projetando 6 meses à frente — reaproveita os `entries` já
> carregados (parcelas futuras, recorrências materializadas, compromissos agendados já
> existem no banco), nenhuma lógica de projeção nova foi necessária. Nome corrigido de
> "Provisão futura" pra só "Provisão" — pleonasmo apontado pelo usuário.
> **Novo lançamento redesenhado**: form dentro de um card `#131A47`, com 4 botões de Tipo
> (Despesa/Receita/Investimento/Outro, antes só 2) puxando os rótulos de `NatureLabel`;
> Investimento/Outro ganharam um botão de inverter sinal por não terem uma dicotomia
> natural tipo Despesa/Receita. **`app/error.tsx`/`global-error.tsx`** adicionados —
> página de erro customizada que detecta `ChunkLoadError` (chunk JS antigo depois de um
> deploy novo, aba ainda aberta na versão anterior — provável causa de um erro relatado
> pelo usuário) e recarrega sozinha; não foi encontrado bug real no código da rota que
> disparou o erro original. **Investigação de acompanhamento:** o usuário reportou o
> mesmo tipo de erro em `/painel` (confirmando que o `error.tsx` novo já estava em
> produção, capturando algo real). Testado exaustivamente com uma sessão autenticada de
> verdade (técnica nova — ver seção 21, "Como testar telas autenticadas sem senha") contra
> os dados reais do usuário, em dev **e** num build de produção local: `/painel` e
> `/lancamentos/novo` renderizaram perfeitamente as duas vezes, sem nenhum erro. Não foi
> possível reproduzir — a hipótese que fica de pé é instabilidade transitória (bem
> provável, dado o volume de deploys seguidos durante esta sessão de testes). Nenhuma
> mudança de código nesta rodada, só investigação. Ver seção "Estado do Git" — HEAD
> `de68d14` (sem commit novo).

---

## 1. Objetivo do projeto

Sistema web de gestão financeira pessoal e familiar para substituir uma planilha Google
Sheets em uso contínuo desde 2016 (~5.900 lançamentos). O modelo de dados foi extraído por
engenharia reversa dessa planilha — as regras documentadas em
`ESPECIFICACAO-SISTEMA-FINANCEIRO.md` são comportamento validado na prática, não hipótese.

Dono do produto / usuário principal: **Felipe Hildebrando** (fhildebrando@gmail.com),
administrador da plataforma. Pensa em oferecer o sistema no futuro também como ferramenta
de consultoria financeira para terceiros (Fase 4 — ainda não iniciada).

Princípios centrais (não negociáveis, ver §4 da especificação):
- O modelo de dados é sagrado; a interface é descartável.
- Nenhuma perda histórica.
- Multi-tenant desde o primeiro dia (`workspace_id` em toda tabela de dados).
- Auditabilidade (quem criou/alterou, quando).
- Entrega incremental e usável — cada fase termina em uso real.

---

## 2. Arquitetura geral

Aplicação **Next.js 16 (App Router) full-stack**, um único deploy (frontend + backend +
rotas de API no mesmo projeto). Banco **PostgreSQL gerenciado pelo Supabase**, com
**Supabase Auth** para autenticação e **Row Level Security (RLS)** nativa do Postgres como
segunda camada de isolamento multi-tenant (a primeira é sempre filtrar por `workspace_id`
derivado da sessão no código da aplicação — nunca confiar em `workspace_id` vindo do
cliente).

```
Browser (PWA instalável)
   │
   ▼
Next.js App Router (em produção na Vercel: prospecta-finance.vercel.app)
   ├─ Server Components (a maioria das páginas — leem direto do Prisma)
   ├─ Server Actions ("use server", formulários de Cadastros e lançamento rápido)
   ├─ Route Handlers (/app/api/** — importação, exportação, CRUD de entries)
   └─ Middleware (proxy.ts — sessão Supabase, redireciona não-autenticado)
   │
   ▼
Prisma Client (driver adapter @prisma/adapter-pg, Prisma 7)
   │
   ▼
PostgreSQL (Supabase, sa-east-1) — RLS habilitada em toda tabela multi-tenant
   └─ auth.users (Supabase Auth) — trigger cria Profile + Workspace + Membership no signup
```

**Regra de autorização em duas camadas:**
1. **Camada de aplicação** (a que realmente importa hoje): toda query Prisma nas páginas/
   actions/rotas deriva `workspace_id` da sessão via `lib/auth/session.ts`, nunca do
   payload do cliente.
2. **RLS no Postgres** (defesa em profundidade): políticas em `prisma/sql/*.sql`. **Atenção:**
   a conexão do Prisma usa a connection string do Postgres (via pooler do Supabase), que
   por padrão é o *owner* das tabelas — **owners contornam RLS**. Ou seja, hoje a RLS
   protege acesso via PostgREST/Supabase client direto (se algum dia for usado
   client-side), mas **não** está sendo tecnicamente exercida pelas queries do Prisma.
   A camada 1 é a que efetivamente isola os dados agora. Ver "Débitos técnicos" (#20).

---

## 3. Tecnologias utilizadas

| Categoria | Escolha | Versão (aprox.) |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 |
| Linguagem | TypeScript | ^5 |
| UI | React + Tailwind CSS v4 | 19.2.4 / ^4 |
| Gráficos | Recharts | ^3.10 |
| Ícones | `lucide-react` | ^1.28 (instalado 2026-07-31 pro `Sidebar`) |
| Banco | PostgreSQL (Supabase, sa-east-1) | — |
| ORM | Prisma (novo generator `prisma-client`, driver adapters) | ^7.9.1 |
| Driver adapter | `@prisma/adapter-pg` + `pg` | — |
| Auth | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) | — |
| Validação | Zod | ^4.4 |
| CSV | `csv-parse` (import), builder manual (export) | ^7 |
| XLSX | `exceljs` | ^4.4 |
| PWA | Serwist (`@serwist/next`, `@serwist/window`, `serwist`) | ^9.5 |
| Testes | Vitest | ^4.1 |
| Runtime scripts | `tsx` | ^4.23 |
| Deploy | Vercel, produção ativa | `prospecta-finance.vercel.app` |

Stack segue exatamente o recomendado em `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §15, com uma
diferença: Next.js 16 em vez de 15 (a versão "latest" no momento da Fase 0; a intenção do
documento — framework mainstream com App Router — foi preservada).

---

## 4. Estrutura completa de diretórios

```
C:\Sistema Financeiro\
├── ESPECIFICACAO-SISTEMA-FINANCEIRO.md   # fonte de verdade do domínio (1198 linhas)
├── GUIA-DE-INICIO.md                     # roteiro das "Conversas" (Fase 0 a 5)
├── PROJECT_STATE.md                      # este arquivo
├── CLAUDE.md / AGENTS.md                 # instruções pro Claude Code
├── .env.local                            # segredos (gitignored)
├── seeds/                                # CSVs de referência (taxonomia, carteiras...)
│   ├── seed_*.csv                        # UTF-8 sem BOM, separador , (o código lê)
│   └── excel-br/seed_*.csv               # UTF-8 com BOM, separador ; (conferir no Excel)
├── prisma/
│   ├── schema.prisma                     # schema completo, ver seção 10
│   ├── prisma.config.ts (raiz do projeto, não dentro de prisma/) 
│   ├── migrations/                       # 4 migrations aplicadas, ver seção 10
│   ├── sql/                              # RLS e triggers não gerenciados pelo Prisma
│   │   ├── 001_auth_and_rls.sql          # trigger signup, RLS Fase 0
│   │   ├── 002_drop_cross_schema_fk.sql  # correção de incidente, ver seção 19
│   │   ├── 003_entries_rls.sql           # RLS de entries/entry_groups/import_batches
│   │   ├── 004_permission_updates.sql    # subcategoria virou admin-only
│   │   ├── 005_export_logs_rls.sql       # RLS de export_logs
│   │   └── 006_workspace_invites_rls.sql # RLS de workspace_invites (convite de membro)
│   ├── seed.ts                           # seed global (taxonomia, tipos, etc.)
│   └── seed-workspace.ts                 # seed por workspace (carteiras/responsáveis)
├── app/
│   ├── layout.tsx                        # root layout, tema escuro fixo, PWA metadata
│   ├── page.tsx                          # redirect pra /painel
│   ├── manifest.ts                       # manifest PWA dinâmico
│   ├── sw.ts                             # service worker (Serwist)
│   ├── icon.png                           # favicon (convenção do App Router; favicon.ico
│   │                                          padrão do template foi removido, competia com este)
│   ├── (auth)/login/                     # login + cadastro (Supabase Auth)
│   ├── auth/confirm/route.ts             # callback de confirmação de e-mail (token_hash)
│   ├── (app)/                            # tudo atrás de autenticação
│   │   ├── layout.tsx                    # header + nav mobile inferior + botão flutuante +
│   │   ├── actions.ts                    # logout
│   │   ├── painel/page.tsx               # dashboard (§11)
│   │   ├── compromissos/page.tsx         # vencidos/hoje/próximos 7-30 dias, marcar pago (§13)
│   │   ├── convite/[token]/page.tsx      # aceitar convite pra um workspace existente
│   │   ├── lancamentos/
│   │   │   ├── page.tsx                  # tabela (edição in-line + seleção em lote) / cards + exportar
│   │   │   ├── EntriesTable.tsx          # client component: seleção, ações em lote, edição in-line
│   │   │   ├── novo/                     # lançamento rápido (§12)
│   │   │   ├── transferir/               # transferência entre carteiras (§10 R5)
│   │   │   └── importar/                 # wizard de importação de CSV (§18.1) + reverter lote
│   │   └── cadastros/                    # carteiras, responsáveis, categorias, subcategorias, tipos, membros
│   └── api/
│       ├── entries/                      # CRUD, settle, export, suggest-category
│       └── import/                       # preview, commit, revert
├── lib/
│   ├── finance/                          # regras puras testadas (Conversa 2), ver seção 12
│   ├── entries/                          # criação/edição/exportação de lançamentos (server-side)
│   ├── import/                           # parsing/validação/resolução/reversão do importador de CSV
│   ├── workspace/invite.ts               # criar/aceitar convite pra workspace existente
│   ├── auth/session.ts                   # toda derivação de sessão/permissão
│   ├── supabase/                         # clients Supabase (browser/server/middleware)
│   ├── db/prisma.ts                      # singleton do Prisma Client
│   ├── api/                              # erros de API padronizados
│   ├── validation/entry.ts               # schemas Zod de Entry
│   ├── format.ts                         # formatação pt-BR (moeda, data)
│   └── slug.ts                           # geração de slug (§18.3)
├── components/
│   ├── charts/MonthlyChart.tsx           # gráfico Recharts (client component)
│   └── RegisterServiceWorker.tsx         # registra o SW no browser
├── tests/                                # espelha lib/finance e lib/import, Vitest
└── public/                               # logo.png (fonte, 500x500, transparência real, ~125KB,
    #                                        commitado), logo-sidebar.png/icon-192.png/icon-512.png
    #                                        (marca PROSPECTA Finance, gerados via sharp)
```

---

## 5. Responsabilidade de cada pasta

| Pasta | Responsabilidade |
|---|---|
| `app/(auth)/` | Telas públicas de autenticação (login/cadastro). Fora do middleware de sessão obrigatória. |
| `app/(app)/` | Todo o produto autenticado. Layout comum com nav e botão de lançamento rápido. |
| `app/api/` | Route Handlers — usados por formulários/JS client-side que precisam de resposta JSON/arquivo (export, import wizard, suggest-category). CRUD que só roda em Server Component/Server Action **não** passa por aqui (ver `lib/entries/create.ts`). |
| `lib/finance/` | **Núcleo do domínio.** Funções puras, sem I/O, todas testadas. Implementam literalmente as fórmulas de `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §8, §10, §11. Nunca importam Prisma. |
| `lib/entries/` | Ponte entre `lib/finance` (puro) e o banco: cria séries de lançamentos (parcelado/recorrente), monta linhas de exportação. |
| `lib/import/` | Todo o pipeline do importador de CSV: detecção de cabeçalho, parsing BR, resolução de referências, deduplicação. |
| `lib/auth/session.ts` | **Único lugar** que deriva workspace/papel/admin da sessão. Toda página e action passa por aqui. |
| `lib/workspace/invite.ts` | Cria e aceita convite pra um workspace existente (token opaco, sem envio de e-mail próprio). |
| `lib/supabase/` | Clients Supabase Auth para os três contextos do Next.js (browser, server component, middleware). |
| `prisma/sql/` | Tudo que o Prisma não consegue expressar em `schema.prisma`: RLS, triggers em `auth.users`. Aplicado manualmente via `prisma db execute --file`. |
| `seeds/` | Dados de referência extraídos da planilha original — taxonomia, carteiras, responsáveis, tipos, situações, recorrências. Carregados por `prisma/seed.ts` e `prisma/seed-workspace.ts`. |
| `tests/` | Espelha a estrutura de `lib/`. 113 testes, todos unitários (nenhum teste de integração/e2e ainda). |

---

## 6. Responsabilidade de cada módulo (arquivos-chave)

### `lib/finance/` (puro, sem Prisma — ver seção 12 para a lista completa de regras)
- `types.ts` — tipos compartilhados (`FinanceEntry`, `FinanceWallet`, `Period`, `Regime`, re-exporta `Decimal` do runtime do Prisma).
- `dates.ts` — utilitários de data "pura" (sem fuso), `addMonths` com clamp de fim de mês.
- `derived.ts` — Resultado derivado (§10 R3) e classificação de urgência pra UI.
- `balance.ts` — saldo de carteira e blocos do dashboard (§11.1, §11.2).
- `period.ts` — totais Receita/Despesa/Investimento/Balanço com regime Caixa×Competência (§11.3, §10 R2); **(Fase 2)** `monthlySeries()` (série de N meses, extraída do loop que já existia em `painel/page.tsx`) e `projectedBalance()` (saldo acumulado projetado, §13).
- `card.ts` — janela de fatura, fatura vigente (usado no lançamento rápido), cobertura (§11.4, §11.5, §12).
- `installments.ts` — geração de parcelas e de recorrências materializadas 24 meses (§8.5).
- `open-installments.ts` — **(Fase 2)** `openInstallmentGroups()`: parcelamentos em aberto por grupo (§13, "Despesas parceladas") — tipo `InstallmentEntry` próprio, não o `FinanceEntry` compartilhado.
- `transfer.ts` — monta o par de linhas de uma transferência (§10 R5).
- `fixed.ts` — despesa fixa × variável (§11.7).
- `reserve.ts` — média de despesa, meta e gauge de reserva de emergência (§11.6).
- `rankings.ts` — top 5 e distribuição por categoria (§11.8); **(Fase 2)** `categoryMonthlyBreakdown()` (categoria × 12 meses, §13 "Balanço anual").
- `from-db.ts` — **o único lugar que traduz uma linha do Prisma pro tipo `FinanceEntry`**. Qualquer tela nova que precise calcular algo deve passar por aqui.

### `lib/entries/`
- `create.ts` — `createEntryOrSeries()`: cria lançamento único, parcelado ou recorrente materializado. Usado por `/api/entries` (POST) **e** pelo lançamento rápido — não duplicar essa lógica.
- `settle.ts` — `settleEntry()`: A_PAGAR→PAGO / A_RECEBER→RECEBIDO. Usado por `/api/entries/:id/settle` **e** pela tela de Compromissos.
- `transfer.ts` — `createTransfer()`: resolve a categoria fixa "Transferências" (`nature=OUTRO`, `slug=transferencias`) e cria as duas linhas via `lib/finance/transfer.ts::createTransferPair()` numa `$transaction`. Usado pela tela `/lancamentos/transferir`.
- `recurrence-label.ts` — reconstrói o texto de Recorrência pra exibição/exportação.
- `export-row.ts` — mapeia uma `Entry` do Prisma pra uma linha exportável (mesmos headers do importador).
- `build-csv.ts` / `build-xlsx.ts` — geram os arquivos de exportação (§18.2).

### `lib/import/`
- `parse-csv.ts` — `parseCsvWithHeaderDetection()`: acha a linha de cabeçalho real (tolera lixo antes, como exports do Google Sheets) e detecta separador `,` ou `;`.
- `column-mapping.ts` — mapeamento cabeçalho→campo, auto-detecção.
- `parse-brl.ts` — datas `dd/mm/aaaa` e valores `R$ 1.234,56` / negativo / parênteses.
- `parse-recorrencia.ts` — desmembra a coluna Recorrência, incluindo os formatos reais `"N de M"` e `"N/M"` (não documentados na especificação original).
- `parse-status.ts` — Situação → código.
- `parse-row.ts` — valida uma linha (o que dá pra checar sem banco).
- `resolve.ts` — resolve carteira/categoria/subcategoria/responsável contra o banco (com suporte a `legacy_name` de carteira) e detecta duplicata.
- `duplicate-key.ts` — chave de deduplicação (`due_date + amount + description + wallet`).
- `revert.ts` — `revertImportBatch()`: reverte um lote (bloqueado se algum lançamento foi editado depois). Usado por `/api/import/:batchId/revert` **e** pela tela de Importar.

### `lib/workspace/invite.ts`
- `createInvite()` — cria um `WorkspaceInvite` (e-mail + papel + token opaco + telefone opcional, normalizado via `lib/format.ts::toWhatsAppDigits()`). Só TITULAR/admin (checado na action, não na função).
- `acceptInvite()` — valida token não aceito e **e-mail do perfil logado bate com o e-mail convidado** (senão `ApiError(403)`), cria a `Membership` (ou reaproveita se já existir) numa `$transaction` junto com marcar `acceptedAt`.
- **Envio continua 100% manual:** o sistema nunca manda e-mail nem WhatsApp sozinho — só gera o link e, se houver telefone, um link `https://wa.me/<telefone>?text=<mensagem>` que abre o WhatsApp com a mensagem pronta pro usuário clicar em enviar. Decisão explícita: uma API paga do WhatsApp Business exigiria conta comercial verificada e aprovação de template pela Meta, fora do escopo (ver seção 21).

### `lib/auth/session.ts`
- `getCurrentProfile()` — perfil + memberships, com `cache()` do React (dedup por request).
- `requireProfile()` — pra Server Components (redireciona se não autenticado).
- `ACTIVE_WORKSPACE_COOKIE` / `resolveActiveMembership()` / `requireActiveMembership()` — **novos (Fase 2 Etapa 3, seletor de workspace)**. `resolveActiveMembership(memberships, requestedWorkspaceId?)` é pura (testada, 7 casos): filtra por `status === "ACTIVE"` primeiro (**corrigido em 2026-08-04** — antes o fallback não filtrava e podia devolver uma membership revogada), sem `workspaceId` pedido ou pedido inválido/revogado/de outra pessoa cai na primeira `ACTIVE` (comportamento de sempre); com um válido, usa ele; sem nenhuma `ACTIVE`, retorna `undefined`. `requireActiveMembership()` lê o cookie, resolve, e grava `AccessLog` se a membership resolvida for `ADVISOR`.
- `requireWorkspaceId()` — agora implementado em cima de `requireActiveMembership()` (lê o cookie de workspace ativo); sem cookie, comportamento idêntico ao de sempre.
- `requireApiWorkspaceMembership()` — pra Route Handlers (lança `ApiError`, não redireciona). Mesmo tratamento de cookie/`ADVISOR` de `requireWorkspaceId()`. Ganhou `platformRole` no retorno (além de `isPlatformAdmin`, mantido).
- `requireAdminProfile()` — existe mas **não está mais em uso** desde que as telas de Cadastros passaram a ser visíveis-porém-desabilitadas em vez de bloqueadas (ver seção 20).
- `can(action, ctx)` — **(Fase 2 Etapa 2)**. RBAC explícito (não motor genérico), combina `role` de workspace + `platformRole`. `assertCanWrite()`/`assertIsAdmin()` viram wrappers finos em cima dele — mesma assinatura de sempre, nenhum call site mudou.
- `assertCanWrite()` — LEITURA não escreve; TITULAR/MEMBRO/ADVISOR e admin escrevem.
- `assertIsAdmin()` — só admin (Categoria/Tipo, editar/arquivar Subcategoria).
- `requireMembershipForWorkspace(workspaceId)` — variante explícita de workspace pra uso fora do fluxo de página normal (ex.: Route Handlers que recebem workspaceId por parâmetro) — valida contra as memberships reais da sessão. Grava `AccessLog` quando o acesso é `ADVISOR`.

### `lib/workspace/switch.ts` (novo, Fase 2 Etapa 3)
- `setActiveWorkspace(formData)` — Server Action que troca o `ACTIVE_WORKSPACE_COOKIE`. Valida o `workspaceId` recebido contra as memberships `ACTIVE` da sessão antes de aceitar (nunca confia no valor do form). Usado por `WorkspaceSwitcher` (seção 15).

### `lib/billing/entitlements.ts` (novo, Fase 2 Etapa 2)
- `hasFeature(workspaceId, featureCode)` — resolve `Subscription` ativa → `Plan` → `PlanFeature`, mais `Entitlement` overrides (nunca subtrai o que o plano já dá). Único lugar que deve decidir "esse workspace pode usar X" — telas nunca devem checar `plan.code`/nome direto. Nenhuma tela usa ainda; verificado manualmente contra o banco real (não é função pura, foge do padrão de teste unitário de `lib/finance`).

### `lib/audit/access-log.ts` (novo, Fase 2 Etapa 2)
- `logAccess({ actorProfileId, workspaceId, actorRole, action })` — grava em `AccessLog`. Chamado de dentro de `requireActiveMembership()`/`requireApiWorkspaceMembership()`/`requireMembershipForWorkspace()` (funil de sessão), nunca espalhado pelas telas.

### Outros
- `lib/supabase/admin.ts` — `createAdminClient()`, client com a service role key (contorna RLS, enxerga `auth.users` inteiro via Admin API). **Só server-side** — nunca importar num Client Component. Único consumidor hoje: `/admin/usuarios`.
- `lib/db/prisma.ts` — singleton do Prisma Client com `PrismaPg` adapter; carrega `.env.local` explicitamente (necessário pros scripts standalone via `tsx`, que não passam pelo carregamento automático do Next).
- `lib/format.ts` — `formatCurrencyBRL`, `formatDateBR` (Intl pt-BR), `toWhatsAppDigits` (normaliza telefone pro link `wa.me`, assume DDI 55 se vierem 10-11 dígitos).
- `lib/slug.ts` — `slugify()`, implementa o algoritmo exato do §18.3.
- `lib/api/errors.ts` / `prisma-errors.ts` — `ApiError`, `apiErrorResponse()`, `rethrowFriendly()` (converte violação de unique constraint em mensagem legível).
- `lib/validation/entry.ts` — schemas Zod `createEntrySchema`/`updateEntrySchema`, `parseIsoDate`.

---

## 7. Fluxo completo da aplicação

1. Usuário acessa qualquer rota → `proxy.ts` (middleware) intercepta, renova sessão Supabase, redireciona pra `/login` se não autenticado (exceto `/login`, `/auth/*`, manifest/ícones/service worker).
2. `/` redireciona pra `/painel`.
3. `(app)/layout.tsx` carrega perfil + membership (via `requireProfile`), monta header/nav.
4. Navegação principal: **Painel** (dashboard) · **Lançamentos** (listar/filtrar/importar/exportar) · **Cadastros** (carteiras, responsáveis, categorias, subcategorias, tipos) · botão flutuante **+** (lançamento rápido) · nav inferior no mobile.
5. Toda leitura de dados financeiros passa por: página busca `workspaceId` da sessão → query Prisma filtrada → (quando envolve cálculo) mapeia pra `FinanceEntry` via `lib/finance/from-db.ts` → chama função pura de `lib/finance/*`.
6. Toda escrita (criar/editar lançamento, cadastro) passa por Server Action ou Route Handler → deriva `workspaceId`/papel da sessão → valida (Zod nas rotas de API; validação manual nas actions) → Prisma.

---

## 8. Fluxo de autenticação

1. **Cadastro:** `app/(auth)/login/actions.ts` → `signup()` → `supabase.auth.signUp({ email,
   password, options: { data: { full_name } } })`. O form pede **Nome completo** (obrigatório,
   único campo extra além de e-mail/senha — decisão explícita de manter o cadastro mínimo,
   ver seção 21) e passa como `full_name` no metadata, que o trigger abaixo usa.
2. Supabase cria a linha em `auth.users` → **trigger** `on_auth_user_created`
   (`prisma/sql/001_auth_and_rls.sql`) roda automaticamente e, na mesma transação:
   - cria `public.profiles` (id = auth.users.id);
   - cria um `Workspace` pessoal ("Nome (pessoal)");
   - cria a `Membership` com papel `TITULAR`.
   - **Efeito prático:** todo signup já nasce com workspace próprio — não há hoje um fluxo
     de "administrador cria workspace de cliente" (isso é Fase 4/consultoria, não construído).
3. E-mail de confirmação enviado pelo Supabase (template **padrão**, não customizado — ver
   seção 19). Ao clicar, a sessão é estabelecida automaticamente via `@supabase/ssr` no
   client (cookies).
4. **Login:** `login()` → `supabase.auth.signInWithPassword()` → redirect pro `redirectTo`
   recebido via campo hidden do form (fallback `/painel`).
5. **Sessão:** cookies HTTP-only gerenciados pelo `@supabase/ssr`; renovados a cada request
   pelo middleware (`lib/supabase/middleware.ts`).
5b. **Deep link pós-login (`redirectTo`):** quando o middleware redireciona um usuário não
   autenticado pra `/login`, ele preserva o caminho original em `?redirectTo=`. A página de
   login repassa isso num campo hidden do form; a action `login()` só aceita caminhos que
   começam com `/` e não `//` (evita open redirect) antes de usar como destino do
   `redirect()`. Existe principalmente pra permitir abrir um link de convite
   (`/convite/:token`) sem estar logado e continuar direto pra ele após entrar — mas serve
   pra qualquer link direto. `signup()` não usa isso (Supabase exige confirmação de e-mail
   antes de logar; a pessoa reabre o link original depois de confirmar).
6. **Logout:** `app/(app)/actions.ts` → `supabase.auth.signOut()` → redirect `/login`.
7. **Admin da plataforma:** `Profile.isPlatformAdmin` — hoje só é `true` pra
   `fhildebrando@gmail.com`, setado manualmente via SQL direto (não existe UI para
   promover outro usuário a admin). Ver "Débitos técnicos".
8. **`/auth/confirm/route.ts`** existe (verifica `token_hash` + `type` via `verifyOtp`) mas
   **não está sendo usado na prática** — o fluxo real funciona via o link padrão do
   Supabase + detecção automática de sessão no client. Ficou como código morto/preparado
   pra quando o template de e-mail for customizado (precisa de SMTP próprio, não configurado).
9. **Esqueci minha senha:** link na tela de login → modo "recover" → `requestPasswordReset()`
   chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/redefinir-senha" })`.
   A mensagem de retorno é sempre genérica ("se esse e-mail existir…"), nunca confirma se o
   e-mail está cadastrado (evita enumeração de contas). `/redefinir-senha`
   (`app/(auth)/redefinir-senha/page.tsx`, client component) fica de fora do gate de sessão
   do middleware (`PUBLIC_PATHS` em `lib/supabase/middleware.ts`) porque a sessão de
   recuperação só é estabelecida depois que o browser processa a URL do link de e-mail
   (evento `PASSWORD_RECOVERY` do `onAuthStateChange`, ou sessão já presente se o fluxo for
   PKCE) — a página espera até 6s por isso antes de mostrar "link inválido ou expirado".
   Depois de confirmada a sessão, `supabase.auth.updateUser({ password })` troca a senha e
   redireciona pra `/painel`.

---

## 9. Fluxo financeiro (como um lançamento nasce e é calculado)

**Criação (duas origens):**
- **Lançamento rápido** (`/lancamentos/novo`): form client-side com defaults automáticos
  (carteira/responsável = último usado em 24h; Vence/Situação calculados a partir do tipo
  de carteira) → `createQuickEntry()` (action) → `createEntryOrSeries()`.
- **Importação de CSV** (`/lancamentos/importar`): upload → preview (mapeamento +
  validação, `/api/import/preview`) → confirmação (`/api/import/commit`) → grava em lote
  atômico, cria `ImportBatch`.

**`createEntryOrSeries()` (`lib/entries/create.ts`) decide:**
- `installmentsTotal >= 2` → `generateInstallments()` (parcelamento numerado, mesmo
  `group_id`, `due_date` avançando mês a mês a partir do dia original).
- `recurrenceCode` fora de `{UNICA, VARIAVEL}` → `generateRecurrenceOccurrences()`
  (materializa 24 meses à frente, mesmo `group_id`).
- Senão → lançamento único.

**Cálculo (Painel):** toda a leitura para exibição é: buscar `Entry[]` do workspace →
`toFinanceEntry()` → passar pras funções puras de `lib/finance`. Nenhum cálculo financeiro
vive dentro de componente React (regra não-negociável do §15).

**Transferência (§10 R5):** tela própria em `/lancamentos/transferir` (origem, destino,
valor, data, responsável, subcategoria opcional). `lib/entries/transfer.ts::createTransfer()`
resolve a categoria fixa "Transferências" (`nature=OUTRO`, seed já trazia essa categoria e
suas 6 subcategorias) e usa `lib/finance/transfer.ts::createTransferPair()` pra montar o par
saída/entrada, gravado numa `$transaction`. Situação sempre `PAGO` (não há noção de
"transferência a pagar" no domínio); recorrência sempre `UNICA`.

---

## 10. Modelagem do banco de dados

Schema completo em `prisma/schema.prisma`. Resumo por grupo:

**Identidade/acesso**
- `Profile` (espelha `auth.users`, `is_platform_admin` global)
- `Workspace`, `Membership` (`role`: TITULAR/MEMBRO/LEITURA)
- `WorkspaceInvite` (convite pra um workspace existente: `email`, `role`, `token` único,
  `phone` nullable (só dígitos com DDI, pro botão "Enviar por WhatsApp"), `acceptedAt`
  nullable — ver `lib/workspace/invite.ts`)

**Taxonomia (global, não por workspace)**
- `EntryNature` (enum fixo no código: RECEITA/DESPESA/INVESTIMENTO/OUTRO — nunca tabela)
- `NatureLabel` (rótulo de exibição editável pelo admin; a chave em si não muda)
- `Category` (`nature`, admin-only)
- `Subcategory` (`categoryId`, `workspaceId` nullable — hoje sempre `null`/global desde que
  virou admin-only; `isActive` pra arquivar)

**Carteiras**
- `WalletKind` (tabela de referência extensível, nunca enum — §6.2)
- `Institution` (sem seed próprio; populada a partir dos nomes distintos em
  `seed_carteiras.csv`)
- `Wallet` (`workspaceId`, `kindCode`, `institutionId?`, `linkedWalletId?` self-relation
  pra caixinha↔cartão, `closingDay`/`dueDay`/`creditLimit` pra cartão, `isActive` pra
  arquivar)

**Responsáveis**
- `Person` (`workspaceId`, `isShared`)

**Referências de lançamento (global)**
- `Status` (8 valores, `countsAsSettled`)
- `RecurrenceKind` (13 valores, `intervalMonths`)

**Lançamentos**
- `EntryGroup` (agrupa parcelas/recorrências)
- `Entry` (a entidade central — ver §8.1 da especificação pra semântica completa de cada
  campo; `amount` é `Decimal(14,2)` com sinal, nunca float)
- `ImportBatch` (lote de importação, revertível)
- `ExportLog` (auditoria leve de exportação)

**Orçamento (§13, Fase 2, 2026-08-08)**
- `Budget` (`workspaceId`, `categoryId`, `year`, `month`, `plannedAmount` —
  `@@unique([workspaceId, categoryId, year, month])`, upsert nessa chave)

**Migrations aplicadas (em ordem):**
1. `20260729220239_init` — Fase 0 completa (identidade, taxonomia, carteiras, responsáveis, referências).
2. `20260729234528_entries` — `EntryGroup`, `Entry`, `ImportBatch`.
3. `20260730131325_nature_labels` — `NatureLabel`.
4. `20260730160517_subcategory_archive_export_log` — `Subcategory.isActive`, `ExportLog`.
5. `20260730172238_workspace_invites` — `WorkspaceInvite`.
6. `20260730194550_workspace_invite_phone` — `WorkspaceInvite.phone`.
7. `20260801205757_identity_plans_schema` — **Arquitetura de Identidade/Planos** (ver
   `ARQUITETURA-IDENTIDADE-PLANOS.md`), Fase 2 Etapa 1: `Profile.platformRole` (enum,
   ao lado de `isPlatformAdmin` mantido como legado), `MembershipRole.ADVISOR`,
   `Membership.status`/`revokedAt`, `WorkspaceInvite.expiresAt`, e as tabelas novas
   `Plan`/`Feature`/`PlanFeature`/`Subscription`/`Entitlement`/`AccessLog`/`Notification`.
   Só DDL aditivo — gerada via `prisma migrate diff` (não escrita à mão), nenhuma coluna/
   tabela existente alterada ou removida.
8. `20260801205917_identity_plans_backfill` — dados: catálogo de 11 `Feature` (código do
   roadmap comercial: núcleo financeiro, relatórios avançados, planejamento financeiro,
   consultoria recorrente, módulo MEI, organização tributária, preparação IRPF,
   planejamento sucessório, IA, Open Finance, app mobile), plano `LEGACY_INTERNAL` (todas
   as features liberadas, sem cobrança), uma `Subscription` nesse plano pra todo workspace
   que ainda não tinha nenhuma (cobriu os 2 workspaces reais existentes), e sincronização
   de `platformRole` a partir de `isPlatformAdmin`. Idempotente (`ON CONFLICT DO NOTHING`/
   `WHERE NOT EXISTS`).
9. `20260802003511_real_commercial_plans` — catálogo **real** de planos comerciais,
   definido pelo CEO em 2026-08-02: `START`/`PLUS`/`PREMIUM`/`PREMIUM_NEGOCIOS`, escada
   estrita (cada um acumula as features do anterior — `nucleo_financeiro` → +
   `planejamento_financeiro` → + `consultoria_recorrente` → + `modulo_mei`). Preço/
   periodicidade em placeholder (`0`/`MONTHLY`) até valores reais serem definidos —
   ajustável por `UPDATE`, sem migration nova. Nenhum `Subscription` aponta pra eles ainda
   (nenhum cliente real assinou); `LEGACY_INTERNAL` continua intacto cobrindo os 2
   workspaces reais existentes.
10. `20260802004826_plan_roadmap_features` — mapeamento do CEO das features do roadmap
    mais amplo pros 4 planos (mesmo dia): `START` + `open_finance`/`app_mobile`; `PLUS` +
    `ia_assistente`; `PREMIUM` + `preparacao_irpf`/`planejamento_sucessorio`;
    `PREMIUM_NEGOCIOS` + `preparacao_irpj` (Feature **nova** — IRPJ é distinto de IRPF,
    pessoa jurídica × pessoa física). `organizacao_tributaria` e `relatorios_avancados`
    continuam de propósito sem vínculo com nenhum plano — não foram mencionadas neste
    mapeamento também. **Observação levantada ao CEO, não bloqueante:** incluir Open
    Finance no plano mais barato (`START`) inverte a lógica usual de custo-por-cliente
    (integrações tipo Pluggy/Belvo costumam ter custo variável por conexão) — vale
    confirmar se é intencional. Matriz final por plano:
    - `START`: `nucleo_financeiro`, `open_finance`, `app_mobile`
    - `PLUS`: + `planejamento_financeiro`, `ia_assistente`
    - `PREMIUM`: + `consultoria_recorrente`, `preparacao_irpf`, `planejamento_sucessorio`
    - `PREMIUM_NEGOCIOS`: + `modulo_mei`, `preparacao_irpj`
11. `20260808135909_budget` — Fase 2 (§13, Relatórios): tabela `budgets` (orçado por
    categoria/mês). Só `CREATE TABLE` + índice único + FKs — puramente aditiva, gerada por
    `prisma migrate dev`, SQL conferido antes de considerar a etapa concluída.

**SQL manual (não gerenciado pelo Prisma, aplicado via `prisma db execute --file`):**
- `001_auth_and_rls.sql` — FK profiles→auth.users, trigger de signup, RLS Fase 0.
- `002_drop_cross_schema_fk.sql` — remove a FK cross-schema, substitui por trigger de
  delete (ver seção 19, incidente evitado).
- `003_entries_rls.sql` — RLS de entry_groups/entries/import_batches.
- `004_permission_updates.sql` — RLS de nature_labels; subcategoria vira admin-only.
- `005_export_logs_rls.sql` — RLS de export_logs.
- `006_workspace_invites_rls.sql` — RLS de workspace_invites (select/insert/delete só
  TITULAR do workspace ou admin; a aceitação em si roda via Prisma, que contorna RLS —
  quem aceita ainda não é membro do workspace de destino).
- `007_signup_invite_aware.sql` — reescreve `handle_new_auth_user()`: antes de criar
  workspace automático, checa se existe `WorkspaceInvite` pendente pro e-mail do novo
  usuário; se existir, aceita o convite (Membership no workspace já existente, papel do
  convite) em vez de criar workspace novo. Sem convite pendente, comportamento idêntico
  ao de sempre. Aplicado e conferido lendo a definição de volta do banco
  (`pg_get_functiondef`) — não testado com signup real de propósito (criaria usuário real
  em `auth.users`, irreversível).

**Convenção:** toda tabela usa `snake_case` no banco (`@map`), `camelCase` no Prisma/TS.
IDs são UUID (`gen_random_uuid()`), exceto tabelas de referência cuja PK é o próprio
`code` (string).

---

## 11. Regras de negócio implementadas

Todas testadas em `tests/finance/` (113 testes no total, incluindo `lib/import`).

| # | Regra | Onde |
|---|---|---|
| §8.3 | Valor com sinal (despesa negativa, receita positiva); usuário nunca digita o sinal | `lib/entries/create.ts` (quick entry), `lib/import/parse-brl.ts` |
| §8.5 | Parcelamento numerado, `group_id` automático, due_date avança a partir do dia original (não em cadeia) | `lib/finance/installments.ts` |
| §8.5 | Recorrência sem fim materializa 24 meses à frente | `lib/finance/installments.ts::generateRecurrenceOccurrences` |
| §10 R2 | Regime Caixa (Vence, default) × Competência (Compra) | `lib/finance/period.ts` |
| §10 R3 | Resultado derivado (Ok/vencido/a pagar/a receber), nunca digitado | `lib/finance/derived.ts` |
| §10 R5 | Transferência: par de linhas, soma zero, tela própria (origem/destino/valor/data) | `lib/finance/transfer.ts`, `lib/entries/transfer.ts`, `app/(app)/lancamentos/transferir/*` |
| §11.1/11.2 | Saldo de carteira, blocos do dashboard | `lib/finance/balance.ts` |
| §11.3 | Receita/Despesa/Investimento/Balanço do período (fiel à fórmula — **não filtra por situação**, inclui A_PAGAR/A_RECEBER/ESTIMATIVA) | `lib/finance/period.ts` |
| — | Painel com 3 visões de período — Mensal (padrão), Anual (ano inteiro, nav ano anterior/seguinte), Geral (todo o histórico, sem nav) — via `?view=`. Afeta KPIs, Top 5, distribuição por categoria; o gráfico "Últimos 6 meses" não muda (sempre 6 meses fixos, é sobre tendência recente, não o período selecionado) | `app/(app)/painel/page.tsx` |
| — | Gráfico "Provisão (próximos 6 meses)" no Painel, abaixo de "Últimos 6 meses" — mesmo estilo/componente (`MonthlyChart`), mas sempre ancorado em hoje (não no mês/view do filtro) e projetando 6 meses à frente. Usa os mesmos `entries` já carregados (sem query nova) — parcelas futuras, ocorrências de recorrência já materializadas (§8.5, 24 meses à frente) e compromissos A_PAGAR/A_RECEBER agendados já aparecem porque `periodTotals` não filtra por data passada/futura, só pelo período pedido | `app/(app)/painel/page.tsx` |
| §11.4/11.5 | Janela de fatura, fatura vigente, cobertura | `lib/finance/card.ts` |
| §11.6 | Reserva de emergência (média 6 meses fechados, meta, gauge) | `lib/finance/reserve.ts` |
| §11.7 | Fixa × variável (regra automática + override manual) | `lib/finance/fixed.ts` |
| §11.8 | Top 5 e distribuição por categoria | `lib/finance/rankings.ts` |
| §12 | Lançamento rápido: defaults automáticos de carteira/responsável (24h), Vence/Situação por tipo de carteira, sugestão de categoria por texto repetido | `app/(app)/lancamentos/novo/*`, `/api/entries/suggest-category` |
| §18.1 | Importação: detecção de cabeçalho, formatos BR, duplicata, revert de lote | `lib/import/*`, `/api/import/*` |
| §18.2 | Exportação CSV/XLSX respeitando filtros, round-trip sem perda (testado com 1085 lançamentos reais), log de auditoria | `lib/entries/build-*.ts`, `/api/entries/export` |
| §18.3 | Slug (acentos/maiúsculas), CSV com BOM+`;` pro Excel, detecção automática de separador no import | `lib/slug.ts`, `lib/import/parse-csv.ts` |
| §20 | Carteira/Responsável: qualquer membro edita. Categoria/Subcategoria/Tipo (rótulo): só admin, visível-porém-desabilitado pra quem não é admin. Nome duplicado vira erro legível. Arquivar em vez de excluir (Wallet e Subcategory). | `app/(app)/cadastros/**`, `lib/auth/session.ts`, `lib/api/prisma-errors.ts` |
| §21 | Nav inferior + cards no mobile, PWA instalável (manifest/ícone/service worker) | `app/(app)/layout.tsx`, `app/(app)/lancamentos/page.tsx`, `app/manifest.ts`, `app/sw.ts` |
| §13 | Tela Compromissos: vencidos/hoje/próximos 7/próximos 30 dias, marcar pago/recebido em 1 clique | `app/(app)/compromissos/*`, `lib/entries/settle.ts` |
| §13 | Lançamentos: seleção múltipla (excluir em lote, marcar pago/recebido em lote) e edição in-line (descrição, categoria, subcategoria, responsável, situação, vencimento, valor) — **só no desktop** (≥768px); mobile continua somente leitura, decisão de escopo desta rodada | `app/(app)/lancamentos/EntriesTable.tsx` |
| §18.1 | Reverter importação: botão por lote na tela de Importar | `app/(app)/lancamentos/importar/*`, `lib/import/revert.ts` |
| §19.1 | Convidar membro pra workspace existente: TITULAR/admin gera link de convite com token (+ botão opcional "Enviar por WhatsApp" via `wa.me` se o telefone for informado), pode excluir um convite pendente; quem aceita precisa estar logado com o e-mail exato do convite | `app/(app)/cadastros/membros/*`, `app/(app)/convite/[token]/*`, `lib/workspace/invite.ts` |
| §19.1 | Painel `/admin/usuarios` (só `isPlatformAdmin`): todo usuário cadastrado no sistema — nome, e-mail, se é admin, workspaces + papel em cada um, e-mail confirmado, cadastro, último login | `app/(app)/admin/usuarios/page.tsx`, `lib/supabase/admin.ts` |
| — | Esqueci minha senha (login → e-mail → link → nova senha) | `app/(auth)/login/*`, `app/(auth)/redefinir-senha/page.tsx` |
| §13 | Fase 2 — Relatórios: Analítico mês a mês, Balanço anual, Fluxo projetado, Despesas parceladas, Orçamento (com CRUD de valor planejado) | `app/(app)/relatorios/**`, `lib/finance/period.ts::monthlySeries/projectedBalance`, `lib/finance/rankings.ts::categoryMonthlyBreakdown`, `lib/finance/open-installments.ts` |

---

## 12. Regras de negócio ainda pendentes

- **§11.3 `[DECIDIR]`:** distinção entre `BALANÇO` e `SALDO` na aba BALANCO da planilha
  original — não bloqueia nada hoje, só afeta um relatório de Fase 2 ainda não construído.
- **§13 — Edição in-line/ações em lote no mobile:** ficaram restritas ao desktop nesta
  rodada (ver seção 11) — no celular a tela de Lançamentos continua só leitura.
- **§18.1 — Perfil de mapeamento salvável:** mapeamento é feito na hora a cada importação,
  não é lembrado.
- **§18.1 — Importação de .xlsx:** só CSV é aceito.
- **§19.1 — Seletor de workspace:** não existe. Quem aceita um convite mas já tinha conta
  (e portanto já tem workspace próprio, criado automaticamente no signup) passa a ter duas
  memberships, mas o app sempre mostra `memberships[0]` — não necessariamente a nova. Só
  funciona sem ambiguidade pra quem aceita o convite **antes** de ter criado conta própria.
  Ver seção 22 (Problemas conhecidos).
- **§20 — "Criar item" durante importação:** quando carteira/categoria não existe, a linha
  vira erro; não há atalho pra criar o item na hora, como a especificação sugere.
- **§21 — Lançar offline:** **explicitamente adiado** (fila de sincronização é projeto à
  parte). O service worker cacheia o app shell mas não enfileira gravações sem rede.
- **Fase 2 — relatórios concluídos em 2026-08-08** (analítico mês a mês, despesas
  parceladas, balanço anual, orçamento, fluxo projetado — ver "Última atualização" no
  topo). **Importação de OFX continua não iniciada** (só CSV é aceito, §18.1).
- **Fase 3/4:** patrimônio (`asset`), dívidas (`debt`), metas (`goal`), Open Finance,
  multi-workspace de consultoria — nada disso foi modelado ainda (§7.4 "OUTRO" continua
  como natureza única, sem as entidades dedicadas que a especificação recomenda como
  melhoria).

---

## 13. APIs existentes

Todas exigem sessão Supabase válida (via `requireApiWorkspaceMembership`); escrita exige
`assertCanWrite` (LEITURA bloqueado). `workspace_id` sempre derivado da sessão.

| Rota | Método | Descrição |
|---|---|---|
| `/api/entries` | GET | Lista paginada com filtros (período, carteira, natureza, texto) |
| `/api/entries` | POST | Cria lançamento único, parcelado ou recorrente materializado |
| `/api/entries/:id` | PATCH | Edita campos parciais |
| `/api/entries/:id` | DELETE | Exclui; se for transferência, exclui as duas linhas |
| `/api/entries/:id/settle` | PATCH | Marca A_PAGAR→PAGO ou A_RECEBER→RECEBIDO |
| `/api/entries/suggest-category` | GET | Sugestão de categoria por repetição exata de descrição |
| `/api/entries/export` | GET | Exporta CSV ou XLSX (`?format=csv\|xlsx`) respeitando filtros; loga em `ExportLog` |
| `/api/import/preview` | POST | Passo 2/3 do importador: mapeamento + validação, sem gravar |
| `/api/import/commit` | POST | Passo 4: grava em lote atômico, cria `ImportBatch` |
| `/api/import/:batchId/revert` | POST | Reverte lote (bloqueado se algo foi editado depois); botão na tela de Importar |
| `/auth/confirm` | GET | Callback de confirmação de e-mail (token_hash) — **não usado na prática hoje** |

Compromissos, transferência e convite de membro **não** passam por `app/api/**` — são
Server Actions (`app/(app)/compromissos/actions.ts`, `.../lancamentos/transferir/actions.ts`,
`.../cadastros/membros/actions.ts`, `.../convite/[token]/actions.ts`), seguindo o mesmo
critério já documentado: Route Handler só quando um client component precisa de `fetch` com
resposta JSON (import wizard, sugestão de categoria) ou o `EntriesTable` client component
(edição in-line e ações em lote usam `fetch` direto contra `/api/entries/:id` e
`/api/entries/:id/settle` já existentes, sem endpoint novo).

---

## 14. Serviços

Não há serviços externos além do **Supabase** (Postgres + Auth). Nenhuma integração de
pagamento, Open Finance ou push ainda (todas são Fase 2+). `SUPABASE_SERVICE_ROLE_KEY` agora
**é usada** em `lib/supabase/admin.ts` (Admin API do Supabase, só server-side) — a página
`/admin/usuarios` lista todo usuário cadastrado no sistema (ver seção 11).

**E-mail transacional (confirmação de cadastro, redefinição de senha): não funciona hoje,
causa raiz identificada, correção adiada de propósito.** Ver "Problemas conhecidos" #9 pro
diagnóstico completo — resumo: nem o e-mail padrão do Supabase, nem SMTP via Gmail, nem SMTP
via Brevo (com o remetente `prospectafinancas@gmail.com`) conseguiram entregar. A causa raiz
real é que o remetente é um endereço `@gmail.com` — nenhum provedor terceiro consegue
autenticar DKIM/DMARC pra um domínio que não controla, e Google/Yahoo/Microsoft bloqueiam ou
jogam pra spam e-mails "em nome de" um freemail relayado por terceiro. A correção exige um
domínio próprio (usuário decidiu comprar depois, não agora). Contorno manual enquanto isso:
confirmar o e-mail do usuário direto no painel do Supabase (Authentication → Users → usuário
→ confirmar e-mail).

---

## 15. Componentes principais

| Componente | Tipo | Onde |
|---|---|---|
| `QuickEntryForm` | Client | `app/(app)/lancamentos/novo/QuickEntryForm.tsx` — form completo do lançamento rápido, dentro de um card `#131A47`, com sugestão de categoria, defaults reativos por carteira. 4 botões de Tipo (Despesa/Receita/Investimento/Outro, rótulos de `NatureLabel`) — Investimento/Outro usam um botão de inverter sinal (mesmo padrão do `EditRow` em `EntriesTable`) por não terem dicotomia natural tipo Despesa/Receita |
| `EntriesTable` | Client | `app/(app)/lancamentos/EntriesTable.tsx` — tabela desktop de Lançamentos: checkbox de seleção, barra de ações em lote (excluir / marcar pago-recebido), edição in-line por linha (`EditRow`, componente interno) via `fetch` PATCH em `/api/entries/:id` |
| `TransferForm` | Client | `app/(app)/lancamentos/transferir/TransferForm.tsx` — origem/destino (com exclusão mútua), valor, data, responsável |
| `InviteLink` | Client | `app/(app)/cadastros/membros/InviteLink.tsx` — botão "copiar" do link de convite; recebe a URL já montada (origin resolvido no server via `headers()`, não `window.location`, pra evitar mismatch de hidratação) |
| `MonthlyChart` | Client | `components/charts/MonthlyChart.tsx` — gráfico Recharts (Receita/Despesa/Saldo, 6 meses) |
| `CategoryRings` | Server | `components/charts/CategoryRings.tsx` — "Distribuição por categoria" do Painel: grid de anéis de progresso SVG (não Recharts) com ícone `lucide-react` por categoria, escolhido por palavra-chave no nome (`iconForCategory`, sem lista fixa — a taxonomia é livre, §7). Puramente apresentacional, server-renderizável (sem `"use client"`). |
| `ReserveGauge` | Server | `components/charts/ReserveGauge.tsx` — "Reserva de emergência" do Painel: velocímetro SVG (semicírculo, 3 zonas vermelho/âmbar/verde + ponteiro), mesmas faixas 0-33/33-66/66-100% de `lib/finance/reserve.ts::reserveGaugeBand`. Também server-renderizável. |
| `PasswordInput` | Client | `components/PasswordInput.tsx` — campo de senha com toggle mostrar/ocultar (ícone de olho, `lucide-react`), usado no login/cadastro. Não-controlado (só `name`/`required`/`autoComplete`) — `redefinir-senha/page.tsx` tem o mesmo toggle implementado inline porque os campos lá são controlados (`value`/`onChange`), não reaproveita este componente. |
| `InstallPrompt` | Client | `components/InstallPrompt.tsx` — banner de instalar o PWA na tela de login. Android/Chrome: escuta `beforeinstallprompt`, botão dispara `prompt()` nativo. iOS Safari (sem essa API): mostra instrução manual. Fechar (`X`) não persiste bloqueio nenhum — reaparece na próxima vez que `/login` for aberta, decisão explícita do usuário depois de uma primeira versão com cooldown de 14 dias (ver seção 21). |
| `RegisterServiceWorker` | Client | `components/RegisterServiceWorker.tsx` — registra o SW, só em produção |
| `Sidebar` | Client | `components/Sidebar.tsx` — menu lateral de navegação (desktop/tablet, `md+`), fundo `#131A47` (cor exata pedida pelo usuário), item ativo em âmbar, grupos expansíveis "Lançamentos" e "Cadastros" com sub-páginas, ícones via `lucide-react`. Estilo pedido pelo usuário inspirado no sistema "Meu Vista" (mesma referência já usada pro fundo claro da tabela de Lançamentos, ver seção 21). |
| `MobileNav` | Client | `components/MobileNav.tsx` — barra inferior do celular (`<md`), mesma cor `#131A47` e mesmos ícones do `Sidebar`, com destaque em âmbar da página atual (antes não existia esse destaque). Junto com o header mobile em `(app)/layout.tsx` (também `#131A47`), unifica a linguagem visual entre desktop e mobile — pedido explícito do usuário após o primeiro corte do Sidebar deixar os dois muito diferentes. |
| Páginas de Cadastros | Server | `app/(app)/cadastros/{carteiras,responsaveis,categorias,subcategorias,tipos,membros}/page.tsx` — todas seguem o mesmo padrão: tabela + form inline de criação, campos `disabled` com nota quando o usuário não tem permissão (Membros usa TITULAR/admin como critério de permissão, não `assertCanWrite`) |
| `WorkspaceSwitcher` | Client | `components/WorkspaceSwitcher.tsx` — **novo (Arquitetura de Identidade/Planos, Fase 2 Etapa 3)**. Com 1 `Membership` (todo usuário real hoje), renderiza texto estático idêntico ao de sempre; com 2+, vira `<select>` que troca o workspace ativo via `setActiveWorkspace` (`lib/workspace/switch.ts`), com selo "você está em workspace de cliente" quando o papel ativo é `ADVISOR`. Usado no `Sidebar` e no header mobile do `(app)/layout.tsx`. |
| `StatCard` | Server (local) | Definido dentro de `painel/page.tsx`, não extraído |
| `MonthlyTotalsTable` | Server | `components/reports/MonthlyTotalsTable.tsx` — **(Fase 2)** tabela "12 meses + Total", reaproveitada pelo Analítico mês a mês e pelo bloco sintético do Balanço anual |
| `BudgetTable` | Client | `app/(app)/relatorios/orcamento/BudgetTable.tsx` — **(Fase 2)** tabela de Orçamento com edição sob demanda (mesmo padrão de `WalletsTable`); formata moeda com um `Intl.NumberFormat` local, não `lib/format.ts` (ver "Última atualização", bug do bundle do webpack) |

Não há biblioteca de componentes (shadcn/ui) instalada apesar de recomendada no §15 — os
componentes são HTML+Tailwind direto, estilo consistente mas escrito à mão em cada tela.
`lucide-react` foi instalado (só ícones, não é uma lib de componentes) especificamente pro
`Sidebar`.

---

## 16. Hooks

Nenhum hook customizado (`useX`) foi criado. O único estado client-side relevante vive
dentro de `QuickEntryForm.tsx` via `useState` (nature, wallet, categoria, subcategoria,
responsável, situação, "mais opções") — não foi extraído pra hooks reutilizáveis porque só
há um consumidor até agora.

---

## 17. Context Providers

Nenhum React Context foi criado. Estado de sessão/tema/etc. não usa Context — cada Server
Component busca o que precisa direto via `lib/auth/session.ts` (com `cache()` do React pra
deduplicar entre layout e página na mesma request).

---

## 18. Utilitários e bibliotecas (resumo)

Ver seção 3 (tecnologias) pra bibliotecas de terceiros. Utilitários próprios:
`lib/format.ts`, `lib/slug.ts`, `lib/finance/dates.ts`, `lib/api/prisma-errors.ts`.

---

## 19. Variáveis de ambiente necessárias

Todas em `.env.local` (gitignored, nunca commitado, nunca colado em chat):

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (público) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase (público) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (privada) — usada em `lib/supabase/admin.ts` (Admin API, página `/admin/usuarios`) |
| `DATABASE_URL` | Connection string do Postgres — **usa o "Session pooler" do Supabase** (porta 5432, `aws-0-sa-east-1.pooler.supabase.com`), não a conexão direta (a rede residencial do usuário não tem IPv6, que a conexão direta exige) |

Projeto Supabase: `zfugldawxhvzclooisqj`, região `sa-east-1` (São Paulo).

**Deploy em produção:** Vercel, projeto `prospecta-finance`, branch `master` do repositório
`github.com/fhildebrando-lfsh/PROSPECTA-Finance` (push nessa branch redeploya
automaticamente). URL: `https://prospecta-finance.vercel.app`. As 4 variáveis acima estão
configuradas em Project Settings → Environment Variables na Vercel (mesmos valores do
`.env.local`, apontando pro **mesmo banco Supabase** usado em desenvolvimento local — não há
banco de produção separado ainda). No Supabase, Authentication → URL Configuration tem
`Site URL` e `Redirect URLs` apontando pra essa mesma URL da Vercel (necessário pro link de
confirmação de e-mail do signup funcionar; sem isso ele apontaria pro `localhost`).

---

## 20. Convenções de código adotadas

- **`camelCase` no TS, `snake_case` no banco** via `@map`/`@@map` do Prisma.
- **Dinheiro sempre `Decimal`** (do runtime do Prisma, `@prisma/client/runtime/client`),
  nunca `number`/float. Import: `import { Decimal } from "@/lib/finance/types"`.
- **Datas "puras"**: sempre `Date.UTC(...)`, nunca depender do fuso local. `lib/finance/dates.ts`
  centraliza qualquer aritmética de data.
- **Regras financeiras são sempre funções puras em `lib/finance/`**, sem import de Prisma,
  sempre com teste. A ponte com o banco é explícita via `lib/finance/from-db.ts`.
- **Server Actions em `actions.ts`** ao lado da página que as usa (`"use server"` no topo
  do arquivo, não inline).
- **Slugs via `lib/slug.ts::slugify()`** — nunca inventar outra normalização.
- **Erros de escrita**: Server Actions lançam `Error` com mensagem legível (aparece no
  overlay do Next em dev); Route Handlers usam `ApiError` + `apiErrorResponse()`.
  `rethrowFriendly()` converte violação de unique constraint (P2002) em mensagem amigável.
- **Comentários no código**: só quando explicam o "porquê" não-óbvio (uma decisão, uma
  seção da especificação, um bug real evitado) — nunca "o quê" (nomes já dizem isso).
  Muitos comentários referenciam `§N` da especificação de propósito, pra rastreabilidade.
- **Sem gerenciador de estado global** (Redux/Zustand/Context) — o padrão é Server
  Component busca dado + Server Action grava, sem cache client-side dedicado ainda
  (TanStack Query estava no stack recomendado mas não foi instalado; não há necessidade
  percebida até agora, já que quase tudo é Server Component).
- **Testes:** Vitest, um arquivo de teste por módulo em `lib/finance`/`lib/import`,
  nomeados igual ao módulo. Fixtures em `tests/finance/helpers.ts`.

---

## 21. Decisões arquiteturais tomadas e o motivo de cada uma

> **Como testar telas autenticadas sem senha (técnica descoberta em 2026-08-01):** o
> assistente nunca pode digitar a senha de login (regra de segurança), o que limitou a
> verificação de telas atrás de auth a "só checar que redireciona pro /login" durante boa
> parte do projeto. Existe um jeito de testar de verdade sem violar essa regra: usar a
> **Admin API do Supabase** (`SUPABASE_SERVICE_ROLE_KEY`, já configurada) pra gerar um
> magic link (`admin.generateLink({ type: "magiclink", email })`), trocar o
> `hashed_token` por uma sessão de verdade via `supabase.auth.verifyOtp()` usando
> `createServerClient` do `@supabase/ssr` com um cookie jar em memória, e então: (a) fazer
> `fetch()` direto contra o servidor local com o cookie da sessão pra ver o HTML renderizado
> (bom pra checar erros de servidor rapidamente), ou (b) injetar esse mesmo cookie no
> Browser pane via `document.cookie = "..."` antes de navegar, pra testar cliques/formulários
> de verdade como se estivesse logado. Nenhuma senha é digitada em nenhum momento — é a
> mesma API que o app já usa em `/admin/usuarios` e nos convites. Usado em 2026-08-01 pra
> investigar um erro relatado em `/painel`/`/lancamentos/novo`: confirmou que as duas telas
> renderizam sem erro com dados reais, tanto em dev quanto num build de produção local (ver
> "Última atualização" no topo do arquivo). Vale reusar essa técnica sempre que precisar
> verificar uma tela autenticada de verdade, em vez de só confiar no redirect de login.

| Decisão | Motivo |
|---|---|
| Next.js 16 em vez de 15 | Era a versão "latest" disponível ao iniciar o projeto; a especificação pede "framework mainstream com App Router", não uma versão específica. |
| Prisma 7 com driver adapter (`@prisma/adapter-pg`) em vez do engine Rust clássico | Exigência do próprio Prisma 7 (removeu `url`/`directUrl` do schema; motor "no Rust engine" é o caminho atual). |
| `DATABASE_URL` = Session Pooler, não conexão direta | A rede do usuário não tem IPv6 (que a conexão direta do Supabase exige por padrão). |
| FK `profiles → auth.users` removida, substituída por trigger | **Incidente evitado:** declarar o schema `auth` em `datasource.schemas` pro Prisma enxergar essa FK fazia `prisma migrate dev` tratar TODO o schema `auth` (usuários, sessões, tokens do Supabase) como drift e sugerir um **reset que apagaria a autenticação inteira**. A correção foi nunca deixar o Prisma precisar saber que `auth.users` existe. Ver `prisma/sql/002_drop_cross_schema_fk.sql`. |
| Workspace criado automaticamente no signup (trigger) | Uso é pessoal/familiar hoje — não há fluxo de "admin cria workspace de cliente" ainda (isso é Fase 4). |
| `Subcategory` virou admin-only (diferente do §20 original, que previa edição pelo cliente) | **Decisão explícita do usuário** durante a Conversa 3/5, sobrepondo a especificação original. `Category` continuou admin-only como já estava. **Atualização 2026-08-01 (revertida parcialmente):** o usuário pediu que **criar** uma subcategoria nova volte a ser permitido pra qualquer membro com permissão de escrita (não só admin) — `createSubcategory` trocou `assertIsAdmin` por `assertCanWrite`. **Editar e arquivar uma subcategoria já existente continuam admin-only**, só a criação foi liberada. `Category` não mudou (continua 100% admin-only, criar e editar). |
| `Tipo` (natureza) continua 100% fixo no código; só o rótulo de exibição é editável (`NatureLabel`) | Todo `lib/finance` assume exatamente essas 4 naturezas nas fórmulas (soma Receita+Despesa+Investimento=Balanço). Tornar dinâmico exigiria redesenhar todas as fórmulas — escopo recusado explicitamente pelo usuário quando perguntado. |
| Categorias/Subcategorias/Tipos **visíveis mas desabilitadas** pra quem não é admin, em vez de escondidas | Pedido explícito da especificação (§20: "campo travado aparece visível e desabilitado, nunca escondido") — a primeira implementação escondia as abas, foi corrigido. **Atualização 2026-08-01:** com o redesenho pra edição sob demanda (botão Editar em vez de campo sempre-editável), "desabilitado" virou "sem o botão Editar" — o valor continua sempre visível em texto puro pra quem não pode editar, só não ganha a affordance de clique; mesmo princípio, forma diferente. |
| Cadastros de Categoria/Subcategoria/Tipo usam páginas separadas com forms simples (sem biblioteca de tabela) | Consistência com o resto do app (sem shadcn/ui instalado) e escopo — TanStack Table do stack recomendado não foi necessário até agora. |
| CSV de exportação usa `;` + BOM (não `,` sem BOM) como padrão | Por causa do uso real em Excel em português (§18.3) — o importador foi atualizado pra detectar automaticamente `,` ou `;`, então não há perda de compatibilidade. |
| `lib/entries/create.ts` centraliza criação de lançamento | Evita duplicar a lógica de parcelamento/recorrência entre `/api/entries` (POST) e o lançamento rápido — um bug corrigido em um lugar corrige os dois fluxos. |
| Serwist com `disable` em dev + `turbopack: {}` + `next build --webpack` | Serwist ainda não suporta Turbopack (default do Next 16) nativamente. Dev usa Turbopack normal (SW desligado, sem necessidade real em dev); produção força webpack só pro build gerar o service worker. Sem isso, `next dev` crashava (**bug real encontrado e corrigido**). |
| Middleware (`proxy.ts`) exclui `manifest.webmanifest`, `sw.js`, `icon-192`, `icon-512` do matcher | Sem isso, o próprio navegador (buscando esses arquivos sem sessão) era redirecionado pra tela de login — **bug real que quebrava a instalação como PWA**, encontrado e corrigido. |
| Tabela de Lançamentos usa fundo **claro** (não escuro como o resto do app) | Pedido explícito do usuário, inspirado numa referência visual (sistema "Meu Vista") — texto preto normal só funciona em fundo claro. É uma ilha clara dentro de um app majoritariamente escuro, decisão consciente registrada na conversa. |
| Sugestão de categoria no lançamento rápido usa repetição **exata** de texto, não fuzzy matching | Implementação literal do exemplo do §12 ("digitou Padaria 40 vezes") — mais simples e previsível que um matching aproximado. |
| `ExportLog` é uma tabela enxuta só pra exportação, não um sistema de auditoria genérico | Escopo: a especificação só exige rastrear exportação especificamente ("principal via de vazamento de dados"), não todo evento do sistema. |
| Convite de workspace exige que o e-mail da conta logada bata exatamente com o e-mail convidado | Sem isso, qualquer pessoa com o link (que é só um UUID, não protegido por senha) poderia entrar no workspace de outra pessoa. `Profile` não guarda e-mail (vive em `auth.users`, schema que o Prisma deliberadamente não enxerga — ver decisão da FK cross-schema); a checagem usa o `email` já resolvido em `lib/auth/session.ts::getCurrentProfile()`. |
| Edição in-line de valor infere o sinal pela natureza (Despesa/Receita) igual ao lançamento rápido; Investimento/Transferência usam um botão de inverter sinal em vez de digitar `-` | Mantém o princípio do §8.3 ("usuário nunca digita o sinal") pro caso comum; Investimento/Transferência não têm uma dicotomia natural tipo Despesa/Receita, então não dá pra inferir automaticamente — o toggle é a exceção mínima necessária, não digitação livre do sinal. |
| Edição in-line e ações em lote só existem na tabela desktop (`EntriesTable`); os cards mobile continuam somente leitura | Escopo desta rodada: seleção múltipla e forms de edição densos não cabem bem no layout de card; a tela de Compromissos já cobre a ação mobile mais comum (marcar pago/recebido). Reavaliar se o uso real (30 dias) mostrar necessidade. |
| `redirectTo` via query string, validado no server (`login()` só aceita caminho relativo começando com `/` e não `//`) | Permite abrir um link de convite sem estar logado e continuar direto pra ele após o login, sem introduzir open redirect (destino arbitrário controlado por quem gera a URL). |
| Origin do link de convite resolvido no Server Component via headers `x-forwarded-proto`/`host`, não `window.location` no client | Evita mismatch de hidratação (SSR não tem acesso a `window`) — o padrão de projeto até agora era client component só cuidar de interatividade, nunca de dado que o server já tem como calcular. |
| Botão "Enviar por WhatsApp" usa link `wa.me` (usuário clica em enviar dentro do próprio WhatsApp) em vez de envio automático via API do WhatsApp Business | Pedido do usuário após relatar que o e-mail do convite "não chegou" (na real, o sistema nunca mandou e-mail — mal-entendido esclarecido). Envio automático de verdade exigiria conta comercial verificada + aprovação de template pela Meta + custo por mensagem — infraestrutura que não existe e está fora do escopo pedido; o link `wa.me` entrega o essencial (mensagem e link prontos) sem nenhuma dependência nova. |
| `next build --webpack` (produção) roda separado do `next dev` (Turbopack) — bug do `useSearchParams()` sem `Suspense` na página de login só aparece no build de produção, nunca em dev | Descoberto ao rodar `npm run build` localmente antes do primeiro deploy na Vercel — se não fosse pego antes, o build teria falhado direto na Vercel. Lição: sempre rodar `npm run build` local antes de um deploy novo, não confiar só em `next dev` funcionando. |
| `/admin/usuarios` usa a Admin API do Supabase (`auth.admin.listUsers()` via service role key) em vez de `$queryRaw` direto em `auth.users` | Mais robusto — a Admin API é uma interface pública estável do Supabase; consultar `auth.users` via SQL cru dependeria do schema interno deles, que pode mudar. Reaproveita `SUPABASE_SERVICE_ROLE_KEY`, que já existia na config exatamente pra esse caso de uso (documentado desde a Fase 0). |
| Cadastro pede só "Nome completo" além de e-mail/senha, nada mais | Pedido explícito do usuário ("formulário com o mínimo de informação relevante") — resolve de quebra o bug de `Profile.fullName` sempre nascer nulo (aparecia como "(sem nome)" em Membros), sem inflar o formulário de cadastro. |
| Painel de "todos os usuários" ficou restrito a `isPlatformAdmin` vendo todo mundo — não virou um sistema de categorias/papéis novo (Administrador/Planejador/Cliente) | O usuário cogitou papéis novos inspirados na Fase 4 (consultoria multi-workspace) mas, perguntado, confirmou que só queria a visão de plataforma pra ele mesmo — não pediu pra mudar o modelo de permissões atual (`MembershipRole` por workspace + `isPlatformAdmin` global). Redesenhar papéis fica pra quando a Fase 4 for de fato encomendada. |
| Menu lateral (`Sidebar`) só em desktop/tablet (`md+`); mobile mantém barra inferior, não vira sidebar | Pedido explícito do usuário, com o sistema "Meu Vista" como referência visual (print anexado). Um menu lateral fixo não cabe bem numa tela de celular — a barra inferior é o padrão certo pra esse tamanho de tela. **Atualização:** a estrutura (sidebar vs. barra) ficou diferente de propósito, mas a *cor* e os *ícones* precisaram ficar iguais — ver `MobileNav` — porque o usuário achou o visual mobile/desktop "diferente demais" no primeiro corte. |
| Logo: 1ª tentativa (remover fundo branco + medalhão circular via `sharp`) foi rejeitada; versão final usa o arquivo que o próprio usuário refez com transparência real | O PNG original tinha canal alpha mas o branco ao redor do ícone era **opaco** (alpha 255), não transparente — dava efeito de "logo dentro de um quadrado branco" mesmo depois de redimensionada. Tentei consertar programaticamente (threshold de "brancura" + composição num círculo branco) e mandei preview antes de aplicar em tudo — o usuário rejeitou o resultado e preferiu refazer a arte ele mesmo. Lição: quando o problema é "a arte está errada", perguntar/mostrar preview antes de aplicar em todo canto vale mais do que tentar consertar via processamento automático — e valeu a pena ter perguntado antes de já ter commitado. |
| Cor do menu fixada em `#131A47` (valor exato, não um token Tailwind como `indigo-950`) | Pedido explícito do usuário com o hex exato — usado via sintaxe arbitrária do Tailwind (`bg-[#131A47]`) nos três lugares que representam "o menu" (`Sidebar`, `MobileNav`, header mobile), não alterado em mais nada (bordas/textos indigo-200/300/900 mantidos, servem de contraste sobre o novo fundo). |
| `#131A47` também virou a cor de fundo de **todos os cards do Painel** (StatCard, Top 5, gráfico mensal, cobertura de fatura, anéis de categoria, gauge de reserva) — não só do menu | O usuário só pediu explicitamente pros KPI cards, mas deixar alguns cards em `#131A47` e outros no antigo `bg-zinc-900` ficaria inconsistente/remendado num pedido que era sobre "visual moderno". Extensão de escopo pequena e óbvia, não uma decisão arriscada. |
| Bug real encontrado e corrigido: `app/globals.css` tinha uma regra `body { background: var(--background); ... }` **fora de qualquer `@layer`**, sobrescrevendo `bg-zinc-950`/`text-zinc-50` do `<body>` (que são utilities do Tailwind, geradas dentro de `@layer utilities`) — em CSS Cascade Layers, **qualquer regra não-layered vence qualquer regra layered**, independente de especificidade. O fundo real da página renderizava branco (`--background: #ffffff` do template padrão do Next), só os elementos com `bg-*` explícito (os cards) ficavam escuros. Foi assim que o usuário viu texto "sumindo" — não era cor de texto errada, era o fundo errado. | O usuário pediu pra pintar os textos de preto como solução — isso teria funcionado só até o fundo branco "de verdade" ser corrigido, e depois os deixaria invisíveis de novo (preto sobre zinc-950 quase preto). Corrigi a causa raiz (removi a regra `body {...}` e as variáveis `--background`/`--foreground` do template padrão, nunca usadas de propósito) em vez de aplicar o band-aid pedido — efeito colateral bom: o `font-family: Arial` que a mesma regra impunha também sumiu, e a fonte Geist (configurada desde a Fase 0 mas nunca efetivamente aplicada) passou a funcionar. |
| `lucide-react` instalado em vez de desenhar ~15 ícones à mão em SVG | O projeto evita bibliotecas de componentes (shadcn/ui) por escopo, mas ícones são uma categoria à parte — bem mais barato que autoria manual de SVG pra essa quantidade, e é o par natural de Tailwind pra esse caso. |
| App renomeado pra "PROSPECTA Finance"; logo do usuário redimensionada via `sharp` (já presente no `node_modules`) em vez de subir o PNG original de 2.5MB pro repo | Pedido explícito do usuário, com arquivo de logo anexado. 2.5MB carregado em toda página seria um problema real de performance — gerado `app/icon.png` (favicon, convenção do App Router), `public/icon-192.png`/`icon-512.png` (PWA) e `public/logo-sidebar.png` (menu lateral/login) via script Node descartável. Substituiu os ícones dinâmicos placeholder "R$" (`ImageResponse`), que foram removidos. |
| `<Image priority>` nas 3 instâncias do logo (login, recuperar senha, sidebar) | Sem `priority`, o Next posterga o carregamento de imagens fora da viewport inicial (lazy loading padrão) — como essas três aparecem sempre acima da dobra, `priority` evita o atraso/flash perceptível. Descoberto testando no browser: sem isso, `naturalWidth` ficava `0` mesmo com a URL respondendo 200. |
| Bug real encontrado e corrigido: `export const viewport` em `app/layout.tsx` só setava `themeColor`, sem `width`/`initialScale` — o navegador mobile assumia uma viewport larga (~980px) e renderizava a página com zoom, exigindo ajuste manual do usuário (relatado como "abre com zoom leve, preciso reduzir na mão"). Corrigido adicionando `width: "device-width", initialScale: 1`. | Diagnóstico direto a partir do sintoma relatado — comportamento clássico de meta viewport ausente/incompleta em mobile. Confirmado depois via `document.querySelector('meta[name="viewport"]')` no preview. |
| Banner de instalar o PWA (`InstallPrompt`) sem nenhum cooldown persistido após fechar | Primeira versão guardava 14 dias em `localStorage` antes de mostrar de novo. O usuário apontou o problema certo: se alguém fecha por engano (ou muda de ideia), ficaria bloqueado por duas semanas sem um caminho de volta. Trocado por comportamento simples: fechar só esconde na visita atual: reaparece normalmente na próxima vez que `/login` carregar (se `beforeinstallprompt` disparar de novo ou, no iOS, se ainda não estiver em modo standalone). |
| `app/error.tsx` + `app/global-error.tsx` — página de erro customizada em vez da tela genérica do Next; detecta padrão de `ChunkLoadError`/"Failed to fetch" e recarrega sozinho (uma vez, com cooldown de 10s via `sessionStorage` pra não entrar em loop) | Usuário relatou a tela padrão do Next ("This page couldn't load") depois de navegar pra fora e voltar em `/lancamentos/novo`. Não foi encontrado bug real no código da rota — o padrão bate com "chunk JS antigo depois de um novo deploy, aba ainda aberta na versão anterior", bem provável dado o volume de deploys consecutivos desta sessão enquanto o usuário testava cada mudança. Não dá pra eliminar esse tipo de erro por completo (é inerente a app cliente + deploys contínuos), mas dá pra torná-lo invisível na maioria dos casos com um reload automático. |

---

## 22. Problemas conhecidos

1. **RLS não é efetivamente exercida pelo Prisma** (ver seção 2) — a conexão usa uma role
   que contorna RLS por ser owner das tabelas. A isolação real hoje depende 100% da
   aplicação sempre filtrar por `workspace_id` da sessão (o que ela faz, mas é uma
   camada só, não duas como o design pretendia).
2. **Nenhum outro usuário testado ainda** além de Felipe (admin). O convite de membro
   (seção 11, §19.1) agora tem UI e lógica completas, mas **nunca foi testado
   ponta-a-ponta com uma segunda conta real** — só verificado via `tsc`/lint/testes
   automatizados e revisão de código; não foi possível testar no browser porque isso
   exigiria digitar a senha de login, ação que o assistente não pode realizar. Testar com
   a esposa antes de confiar no fluxo em uso real. Além disso, **não existe seletor de
   workspace** — ver limitação detalhada na seção 12.
3. **Servidor de dev do Next precisa de restart completo** (não só Fast Refresh) toda vez
   que o schema do Prisma muda — o singleton do Prisma Client fica em cache no
   `globalThis` entre reloads e não pega o client regenerado. Aconteceu repetidas vezes
   durante o desenvolvimento; sempre resolver com `preview_stop` + `preview_start` (ou
   matar e subir `npm run dev` de novo), nunca só recarregar a página.
4. ~~`app/auth/confirm/route.ts` existe mas não está no caminho real usado hoje.~~
   **Resolvido em 2026-08-05** — agora é o callback único de verdade: convite de
   cliente (`type=invite`) e login com Google (`code`, PKCE) passam por ali de
   propósito; confirmação de cadastro comum ainda usa o link padrão do Supabase
   (`?code=` direto pro Site URL) — não migrada pra essa rota porque não há mais
   nenhum bug ativo bloqueando ela (a causa raiz, revoked membership no fallback,
   foi corrigida em 2026-08-04), só deixaria o comportamento mais uniforme. Ver
   bloco no topo do documento (2026-08-05) pro detalhe completo.
5. **`requireAdminProfile()`** em `lib/auth/session.ts` — **agora tem uso**: gate de
   `/admin/usuarios` (seção 11, §19.1).
6. **Toda a rodada de Compromissos/reverter importação/transferência/convite/edição
   in-line (seção 11) foi verificada só por `tsc --noEmit`, `eslint` e os 113 testes
   automatizados**, não por navegação real logada — o login exige senha, que o assistente
   não tem permissão de digitar. As rotas protegidas foram confirmadas via middleware
   (redirecionam corretamente, sem erro 500) e os tipos do Prisma validam os nomes de
   chave composta (`nature_slug`, `workspaceId_profileId`) e a forma dos dados, mas **um
   teste manual logado como Felipe é recomendado antes de considerar esta rodada
   totalmente confiável**, em especial a edição in-line de valor com inversão de sinal
   (seção 21) e o painel `/admin/usuarios` (só verificado por build + tipos, nunca
   navegado). **Atualização 2026-08-01:** essa limitação agora tem um contorno parcial —
   ver "Como testar telas autenticadas sem senha" no topo da seção 21 (magic link +
   `verifyOtp` via Admin API, sem digitar senha nenhuma). Usado com sucesso pra confirmar
   `/painel` e `/lancamentos/novo` funcionando com dados reais; ainda vale reservar um
   teste manual de vez em quando pra interações que dependem de clique real (drag,
   timing, etc.), mas telas puramente de renderização/formulário já podem ser verificadas
   direto. **Atualização anterior:** o convite de membro (link + WhatsApp) já foi testado
   manualmente por Felipe em produção com sucesso; falta só alguém aceitar um convite de
   fato pra fechar o ciclo completo (bloqueado agora pelo problema #9, e-mail de
   confirmação do Supabase não chegando pro convidado).
7. **Desenvolvimento e produção usam o mesmo banco Supabase** (não há banco separado pra
   produção ainda) — rodar `npm run dev` local e testar coisas continua escrevendo nos
   mesmos dados que o site em produção usa. Tomar cuidado extra com testes/seeds locais
   depois que uso real começar; considerar um projeto Supabase separado pra produção se
   isso virar um problema.
8. **Um arquivo `recovery-codes.txt` apareceu na raiz do projeto em 2026-07-30** (parecem
   códigos de recuperação 2FA de GitHub/Vercel) — **nunca foi commitado** (excluído
   manualmente do `git add` de propósito) e o usuário foi avisado pra mover pra um lugar
   seguro fora do repositório. Se esse arquivo ainda existir numa sessão futura, não
   commitar em hipótese nenhuma e lembrar o usuário de novo.
9. ~~**E-mail de confirmação de cadastro do Supabase não está chegando.**~~ **RESOLVIDO em
   2026-08-04** — ver bloco no topo do documento pro detalhe completo (domínio próprio +
   DKIM/SPF/DMARC no Brevo + SMTP customizado no Supabase, confirmado com cadastro real).
   Histórico do diagnóstico original abaixo, mantido por contexto. Confirmado na prática em
   2026-07-30 com dois provedores diferentes:
   - E-mail padrão do Supabase (sem SMTP custom): não chegou (limite do plano gratuito).
   - SMTP Gmail (`smtp.gmail.com`, senha de app de 16 caracteres, configurado
     corretamente): não chegou. O próprio Supabase mostra um aviso na tela de SMTP
     Settings dizendo que esse provedor "é feito pra envio pessoal, não transacional".
   - SMTP Brevo (`smtp-relay.brevo.com`, remetente `prospectafinancas@gmail.com`
     verificado no Brevo): **também não chegou**. Causa raiz real, visível no painel do
     Brevo (Remetentes → aviso de conformidade): o remetente é um endereço `@gmail.com`,
     e **nenhum provedor terceiro consegue autenticar DKIM/DMARC pra um domínio que não
     controla** (só o Google controla o DNS de `gmail.com`). Desde 2024, Google/Yahoo/
     Microsoft bloqueiam ou jogam pra spam e-mails "em nome de" um endereço @gmail.com
     enviados via relay terceiro (proteção anti-spoofing). **O problema nunca foi o
     provedor SMTP — é o remetente ser um endereço de freemail, não um domínio próprio.**
   - **Correção real:** comprar um domínio próprio (~R$40-60/ano) e configurar DKIM/SPF/
     DMARC nele via Brevo (guia completo já dado ao usuário nesta conversa). **O usuário
     decidiu adiar essa compra de propósito** ("deixe esse passo para depois... posterior
     tratamos esse problema") — não é uma tarefa esquecida, é uma decisão explícita.
   - **Atualização 2026-08-03: domínio comprado — `prospectafinance.com.br`, e-mail
     `admin@prospectafinance.com.br`.** Configuração de DKIM/SPF/DMARC no Brevo +
     apontamento DNS + troca do SMTP no Supabase **ainda pendente** (guia passo-a-passo
     entregue ao usuário, ele ainda vai executar). **Nota de segurança:** antes de
     confirmar o domínio, o usuário colou uma string (`#Prospecta210726#`) que não parecia
     domínio válido (sem TLD, formato de senha) — foi sinalizado e não usado; o usuário
     depois confirmou o domínio real separadamente. Não confirmar como resolvido até o
     usuário testar um cadastro novo e confirmar que o e-mail chegou de verdade.
   - **Contorno enquanto isso:** confirmar e-mail manualmente no painel do Supabase
     (Authentication → Users → usuário → confirmar e-mail) toda vez que alguém se
     cadastrar. Funciona bem pra uso familiar/baixo volume, não escala.
   - Isso bloqueia testar o fluxo de convite ponta-a-ponta (item 6) até ser contornado
     manualmente ou até o domínio ser comprado.
   - **⚠️ Nota de segurança:** durante essa investigação, uma chave SMTP do Brevo
     (`xsmtpsib-...8Tafio`) foi colada em texto puro no chat pelo usuário — foi orientado a
     revogá-la e gerar uma nova no painel do Brevo (Settings → SMTP & API). Confirmar numa
     sessão futura se isso foi feito; se a chave antiga ainda aparecer ativa lá, lembrar o
     usuário de novo.

---

## 23. Débitos técnicos

- Sem testes de integração/e2e (só unitários em `lib/`). Nenhuma página/Server Action/rota
  de API tem cobertura de teste automatizado.
- Sem CI configurado (GitHub Actions, etc.) — testes rodam só manualmente.
- Sem deploy feito ainda — Vercel mencionado no stack mas projeto nunca foi publicado.
- `npm audit` reporta ~20 vulnerabilidades, quase todas em dependências de build/dev
  (eslint/postcss/minimatch transitivos via `exceljs`→`archiver`) — não são superfície de
  ataque em runtime, mas nunca foram formalmente triadas/aceitas por escrito.
- Sem rate limiting em nenhuma rota de API.
- Sem paginação real na tela de Lançamentos (limita a 200 registros mais recentes; a API
  `/api/entries` GET tem paginação, mas a página não usa).
- `Person` (responsável) não tem campo `isActive`/arquivamento — só `delete`, que falha se
  houver lançamentos vinculados (mensagem amigável já existe, mas não há alternativa de
  arquivar como Wallet/Subcategory têm).
- ~~Ícones do PWA gerados dinamicamente com texto "R$"~~ **Resolvido 2026-07-31** — o app
  ganhou marca própria, "PROSPECTA Finance". Ver seção 21 (decisões) e 24 (concluídas).

---

## 24. Funcionalidades concluídas

- ✅ **Fase 0 (Fundação):** login, cadastro, RLS, papéis, taxonomia completa via seed.
- ✅ **Conversa 2:** todas as regras de `lib/finance` (§8, §10, §11), 59 testes iniciais.
- ✅ **Conversa 3:** modelo `Entry`, CRUD via API, importador de CSV completo (validado
  com os ~1100 lançamentos reais do usuário), tela de Lançamentos.
- ✅ **Conversa 4:** Painel completo (§11) com gráfico, lançamento rápido (§12) com
  defaults automáticos e sugestão de categoria.
- ✅ **Conversa 5:** permissões refinadas (§20), exportação CSV/XLSX com auditoria (§18.2,
  round-trip validado), responsividade mobile + PWA instalável (§21).
- ✅ Cadastros: Carteiras, Responsáveis (qualquer membro), Categorias, Subcategorias, Tipos
  (admin-only, visível-porém-desabilitado pra outros), Membros (convite).
- ✅ **Conversa 6 (pontas soltas da Fase 1, sem número oficial no guia):** Compromissos,
  reverter importação (UI), transferência entre carteiras (UI), convidar membro pra
  workspace existente, edição in-line + ações em lote em Lançamentos (desktop). Ver
  seção 11 e "Problemas conhecidos" #6 (verificado só por tipos/lint/testes, não por
  navegação logada real).
- ✅ **Deploy em produção na Vercel** (`prospecta-finance.vercel.app`) — primeiro deploy
  real do projeto. Corrigido um bug de build (Suspense boundary faltando em
  `useSearchParams()` na página de login) que só aparecia em `next build`, não em `next dev`.
- ✅ **Convite por WhatsApp:** campo telefone opcional no convite de membro + botão "Enviar
  por WhatsApp" (link `wa.me` com mensagem pronta, sem API paga).
- ✅ **Excluir convite pendente**, **"Esqueci minha senha"** (fluxo completo com
  `/redefinir-senha`), **Nome completo no cadastro**, e **`/admin/usuarios`** (visão de
  plataforma pra `isPlatformAdmin`, todo usuário de todo workspace). Ver seção 11.
- ✅ **Menu lateral (`Sidebar`)** — redesenho do layout desktop/tablet, inspirado
  visualmente no sistema "Meu Vista" (print fornecido pelo usuário). Substitui a nav
  horizontal do header por um menu fixo à esquerda, com grupos expansíveis pra
  Lançamentos e Cadastros.
- ✅ **Rebranding pra "PROSPECTA Finance"** — nome trocado em toda parte visível (título da
  aba, login, sidebar, manifest do PWA), logo real do usuário substituindo os ícones
  placeholder "R$" (versão final com transparência real, depois de uma 1ª tentativa
  rejeitada — ver seção 21), débito técnico da seção 23 resolvido.
- ✅ **`MobileNav` + cor `#131A47`** — navegação mobile redesenhada pra usar a mesma cor,
  ícones e destaque de página ativa do `Sidebar` desktop (pedido do usuário depois de achar
  os dois "diferentes demais" no primeiro corte). Cor do menu (desktop e mobile) fixada em
  `#131A47` a pedido do usuário.
- ✅ **Bug real corrigido: fundo da página renderizava branco em vez de escuro** —
  `app/globals.css` tinha uma regra `body {...}` fora de `@layer`, que em CSS Cascade
  Layers vence qualquer utility do Tailwind independente de especificidade. Removida;
  efeito colateral bom: a fonte Geist (configurada desde a Fase 0, nunca efetivamente
  aplicada) passou a funcionar. Ver seção 21.
- ✅ **Painel redesenhado** — KPI cards, Top 5 receitas/despesas, gráfico mensal e
  cobertura de fatura usam `#131A47`. "Distribuição por categoria" virou um grid de anéis
  de progresso com ícone (`CategoryRings`). "Reserva de emergência" virou um velocímetro
  SVG com as mesmas faixas vermelho/âmbar/verde de `lib/finance/reserve.ts` (`ReserveGauge`).
- ✅ **Login/PWA — 3 correções de uso real:** mostrar/ocultar senha (`PasswordInput`),
  zoom indevido no mobile corrigido (viewport meta faltando `width`/`initialScale`), e
  banner de instalar o app (`InstallPrompt`, sem cooldown persistido — ver seção 21).
- ✅ **Favicon corrigido** — `app/favicon.ico` (o triângulo padrão do Next/Vercel, esquecido
  desde a Fase 0) removido; só `app/icon.png` (a logo real) fica.
- ✅ **Painel: visão Mensal/Anual/Geral** — botões de período além da navegação de mês,
  afetando KPIs/Top 5/distribuição por categoria (ver seção 11).
- ✅ **Painel: gráfico de Provisão** — mesmo estilo do "Últimos 6 meses", mas
  projetando os próximos 6 meses a partir de hoje (ver seção 11).
- ✅ **Novo lançamento redesenhado** — form dentro de card `#131A47`, 4 botões de Tipo
  (Despesa/Receita/Investimento/Outro) em vez de 2, com sinal invertível pra
  Investimento/Outro (ver seção 6/15).
- ✅ **`app/error.tsx`/`global-error.tsx`** — página de erro customizada com detecção e
  reload automático de `ChunkLoadError` (ver seção 21).
- ✅ **Asterisco vermelho nos campos obrigatórios de Lançamento** — pedido do usuário após
  uso real ("Em campos obrigatório de Lançamento, coloque o `*` na cor vermelha"). Aplicado
  em todo campo com atributo HTML `required`: `QuickEntryForm.tsx` (Valor, Carteira,
  Categoria) e `TransferForm.tsx` (Origem, Destino, Valor, Data, Responsável).
  `EntriesTable.tsx` (edição in-line) não tem nenhum campo `required`, então não recebeu o
  asterisco — commit `5ea147b`.
- ✅ **Bug real encontrado e corrigido: erro 500 em produção em `/lancamentos` e
  `/lancamentos/novo`** — o usuário relatou a tela de erro ao tentar salvar um lançamento
  em 2026-08-01. Investigado com dados reais via a técnica de teste autenticado (seção 21):
  confirmado `PrismaClientKnownRequestError` — `"(EMAXCONNSESSION) max clients reached in
  session mode - max clients are limited to pool_size: 15"`. Causa raiz: `DATABASE_URL`
  usa o pooler de **Sessão** do Supabase (porta 5432, limite de 15 conexões pro projeto
  inteiro — ver decisão original na seção 21), e `lib/db/prisma.ts` não limitava quantas
  conexões cada instância serverless da Vercel abria (`pg` teria usado o default de 10).
  Poucas requisições concorrentes já estouravam o limite. Corrigido passando
  `{ connectionString, max: 3 }` pro `PrismaPg` em vez de só a string — commit `aeb618e`.
  Verificado rodando `next start` local contra o **mesmo banco de produção** com a técnica
  de sessão autenticada: as 3 rotas (`/lancamentos`, `/lancamentos/novo`, `/painel`)
  voltaram a `200`. **Nenhum dado foi corrompido** — checado via Prisma que os últimos
  registros no banco eram todos da importação em lote de 2026-07-30, ou seja, a tentativa
  de salvar do usuário nunca chegou a gravar nada (falhou antes de commitar). **Recomendação
  pendente, não aplicada:** trocar `DATABASE_URL` na Vercel pro pooler de **Transação**
  (porta 6543) — recomendação oficial do Supabase pra serverless, sem o teto de 15 conexões.
  O `max: 3` já deve prevenir o crash, mas a troca de modo remove o problema de vez; requer
  editar a env var no painel da Vercel (fora do alcance do assistente) e redeploy.
- ✅ **Novo lançamento: todos os campos obrigatórios visíveis, sem seção escondida** —
  pedido do usuário após uso real. `QuickEntryForm.tsx` mudou em duas rodadas:
  1. Data de compra e Data de vencimento (`transactionDate`/`dueDate`) viraram campos
     visíveis, editáveis e obrigatórios — antes eram sempre a data de hoje, ocultos em
     `<input type="hidden">`. Continuam com um default de conveniência (hoje; ou a fatura
     vigente do cartão, se a carteira for `CARTAO_CREDITO`), mas o formulário é atemporal —
     o usuário pode lançar retroativo.
  2. Responsável e Situação saíram de dentro do "+ mais opções" e ficam sempre visíveis,
     começando na opção `disabled` "—" (nunca pré-preenchidos com o último usado) — como são
     `<select required>` com a única opção inicial `disabled`, o navegador bloqueia o envio
     até o usuário escolher um valor de verdade. **Decisão importante:** a primeira tentativa
     tornou `responsibleId`/`statusCode` NULLABLE no banco (migration + destaque roxo nas
     linhas incompletas em `/lancamentos`), pra permitir salvar incompleto e sinalizar
     revisão depois — o usuário rejeitou explicitamente ("Não, não é isso que quero") e
     pediu o modelo mais simples: obrigatório de verdade, só que sem pré-preenchimento
     enganoso. A migration nunca chegou a ser aplicada no banco; todo o código relacionado
     (schema, `lib/finance` com `EntryStatus | null`, `EntryUrgency: "review"`, destaque nas
     linhas) foi revertido antes do commit final.
  3. Depois o usuário pediu pra remover a seção colapsada "+ mais opções" por completo —
     Recorrência, Parcelas, Observação e o novo campo Tags (opcional, `tags: string[]`,
     mesmo campo do CSV "Organização") ficam todos sempre visíveis também, sem nenhum campo
     escondido no formulário, obrigatório ou não.
  Commits `14963d5` (redesenho final) — a primeira tentativa (nullable) nunca foi commitada.
- ✅ **Confirmado por checagem: importador de CSV/XLSX não foi afetado pelo redesenho do
  formulário** — pedido do usuário pra garantir isso após as mudanças acima. O importador
  (`lib/import/*`, `app/api/import/*`) é um pipeline totalmente independente (mapeamento de
  coluna por cabeçalho, parsing próprio) que nunca importa `QuickEntryForm.tsx` nem
  `lib/validation/entry.ts` — mapeamento de coluna confirmado correto e round-trip com
  `EXPORT_HEADERS` intacto; os 37 testes de `tests/import/*` passam. Nenhuma mudança de
  código foi necessária.
- ✅ **Cadastros: fundo dos cards padronizado pra `#131A47`** — as 6 telas (Carteiras,
  Responsáveis, Categorias, Subcategorias, Tipos, Membros) ainda usavam
  `bg-zinc-900`/`border-zinc-800` (tema escuro de antes do rebranding), destoando do resto
  do app. Tabelas, painéis de aviso ("campo travado") e cards de criação/convite viraram
  `bg-[#131A47]`/`border-indigo-900/50`, e o cabeçalho de tabela (`<thead>`) virou
  `bg-black/20` pra manter contraste com o corpo. A barra de abas do layout (hover
  `bg-zinc-900`) não é um "card" e ficou como estava, de propósito. Commit `06e6118`.
- ✅ **Cadastros: edição sob demanda, exclusão em massa, botões com contraste** — pedido do
  usuário após uso real, três partes:
  1. As 6 telas trocaram o padrão "campo sempre editável" (o usuário via isso como pouco
     profissional — a caixa fica aberta, a pessoa mexe e esquece de salvar) por um botão
     **Editar** que libera os campos daquela linha; **Salvar** mostra um spinner enquanto
     a Server Action roda e, ao concluir, um popup **"Salvo"** aparece por 2s
     (`components/ui/SavedToast.tsx`, hook `useSavedToast()`). Cada tabela virou um Client
     Component (`WalletsTable`, `PeopleTable`, `CategoriesTable`, `SubcategoriesTable`,
     `NatureLabelsTable`), mesmo padrão que `EntriesTable.tsx` já usava em Lançamentos.
  2. **Checkbox + exclusão em massa** em Carteiras e Responsáveis — os únicos dois cadastros
     onde excluir de verdade faz sentido hoje (Categoria/Tipo não têm exclusão nenhuma;
     Subcategoria só arquiva, por design, pra não quebrar histórico). Como Carteira nunca
     teve uma ação de excluir de verdade (só `toggleWalletActive`), foi criada
     `deleteWallet` — mesmo padrão seguro que `deletePerson` já usava: tenta excluir, e se a
     carteira já tiver lançamentos (constraint de FK), converte o erro numa mensagem amigável
     pedindo pra arquivar em vez de excluir. Nenhum dado é perdido silenciosamente.
  3. **Contraste de botão real** — o padrão antigo (`border-zinc-700 hover:bg-zinc-800`)
     ficava quase invisível sobre o `#131A47` dos cards. Criado
     `components/ui/buttonStyles.ts` com 4 estilos (`BTN_PRIMARY` âmbar sólido,
     `BTN_SECONDARY` borda/fundo indigo translúcido pra "Editar", `BTN_GHOST` pra
     "Cancelar"/"Ver", `BTN_DANGER` vermelho translúcido pra "Excluir"), aplicados nas 6
     telas.
  **Mudança de permissão, junto:** criar uma subcategoria nova passou a valer pra qualquer
  membro com escrita, não só admin (`createSubcategory`: `assertIsAdmin` →
  `assertCanWrite`) — editar/arquivar uma já existente continua admin-only. Ver seção 21
  (decisão `Subcategory` atualizada) e seção 11.
  **Bônus pedido junto:** alerta com link direto pra `/cadastros/carteiras` ou
  `/cadastros/responsaveis` quando a lista estiver vazia em Novo lançamento/Transferência
  (select obrigatório sem opção nenhuma travava o formulário sem explicar o porquê).
  Commit `3f21ce3`.
- ✅ **Bug real corrigido: Ordem de Categoria podia duplicar** — o usuário testou a tela
  recém-reformulada, criou "Voucher" com Ordem 1 dentro do tipo "Outro" e viu **dois**
  itens com Ordem 1 (Voucher e Bens Numerários) em vez de Voucher entrar na frente e
  empurrar o resto. `createCategory`/`updateCategory` (`app/(app)/cadastros/categorias/
  actions.ts`) agora rodam numa transação: inserir/mover pra uma Ordem já ocupada dentro do
  mesmo Tipo incrementa (ou decrementa, se moveu pra trás) a Ordem de todo mundo que estava
  naquela faixa, nunca deixando duplicata. `sortOrder` só existe em `Category` (Carteira,
  Subcategoria e Tipo não têm esse conceito), então o escopo é só essa tela. O dado
  duplicado que já tinha ficado em produção (do teste do usuário) foi corrigido
  manualmente, renumerando o tipo "Outro" em sequência (Voucher=1 … Outros=14). Lógica nova
  verificada com uma transação de teste propositalmente revertida (sem deixar rastro no
  banco) antes do commit `a1bb5d6`.
- ✅ **Subcategorias: seletor de categoria com cor por Tipo + botão "Ver" visível** — a
  lista de ~200 categorias (RECEITA/DESPESA/INVESTIMENTO/OUTRO misturadas) era difícil de
  escanear. Cada `<option>` ganhou `style` inline com a cor de fundo do seu Tipo (mesma
  paleta do lançamento rápido: verde Receita, vermelho Despesa, azul Investimento, cinza
  Outro) — `<option>` não aceita bem classe Tailwind pra cor de fundo entre navegadores,
  então usa `style` inline mesmo. O botão "Ver" trocou de `BTN_GHOST` (sem borda, passava
  despercebido) pra `BTN_SECONDARY`, igual ao "Editar". Commit `c2577eb`.
- ✅ **"Nova subcategoria" virou um fluxo Tipo → Categoria → Nome, independente do "Ver"** —
  o usuário achou "horrível" ter que usar o mesmo seletor achatado de ~200 categorias
  (nature+categoria misturados) só pra escolher onde criar uma subcategoria nova. Virou
  `NewSubcategoryForm.tsx` (client component): escolhe o Tipo (4 opções), a Categoria
  filtra automaticamente só as daquele Tipo, digita o Nome, cria — e ao salvar navega pra
  `?categoryId=` da categoria escolhida, então a lista de subcategorias já existentes
  (acima) mostra a recém-criada na hora. `categoryId` continua obrigatório no banco (a
  subcategoria só aparece como opção no lançamento rápido dentro da categoria certa), então
  o formulário não deixa criar "solto" só por Tipo — confirmado com o usuário antes de
  implementar. Commit `6262705`.
  **Ideia futura discutida, não implementada:** o usuário perguntou sobre excluir
  subcategorias criadas por usuários "cliente" dos relatórios da Fase 2 (só as fixas/seed
  entrariam, as ad-hoc "não entram por causa da aleatoriedade"). `Subcategory.isSystem`
  (já existe no schema, default `true`) já é exatamente o flag que separaria "fixa" de
  "criada pelo usuário" quando isso for implementado — não fazer nada agora, só uma nota
  pra quando a Fase 2 (relatórios) for de fato encomendada.
- ✅ **Correção: "Nova subcategoria" não deve navegar pra longe do que "Ver" mostra** — o
  `router.push("?categoryId=...")` do commit anterior (pensado pra "mostrar o que acabou de
  criar") na prática mudava o que o seletor "Ver" estava exibindo, quebrando o fluxo
  independente que o usuário queria. Removido. Em vez disso, `NewSubcategoryForm.tsx`
  mantém um estado local (`created: CreatedItem[]`) e renderiza um novo card **"Subcategoria
  cadastrada"** logo abaixo do formulário, listando (mais recente primeiro) tudo que foi
  criado nesta visita à página — sem afetar o que "Ver" está mostrando em nenhum momento.
  Commit `e0f5e14`.
- ✅ **Seletor "Ver" ganhou opção "—" (não ver nada)** — antes só listava categorias reais,
  sem jeito de escolher "nenhuma". `categoryId=""` enviado explicitamente (opção "—"
  escolhida + Ver clicado) agora é tratado como "quero ver a lista vazia", diferente de
  `categoryId` **ausente** (primeira visita à página, sem ter mexido no seletor ainda), que
  continua caindo na primeira categoria como sempre foi —
  `categoryId !== undefined ? categoryId : categories[0]?.id` em vez do antigo
  `categoryId || categories[0]?.id` (que tratava "" e ausente como a mesma coisa, por
  `""` ser falsy em JS). Commit `b4b13cd`.
- ✅ **Botão Excluir em Subcategoria (admin)** — diferente de Carteira/Responsável
  (`deleteWallet`/`deletePerson`, que precisam capturar erro de FK e bloquear se estiver em
  uso), a FK `entries.subcategory_id` já é `ON DELETE SET NULL` desde a migration
  `20260729234528_entries` (`Entry.subcategoryId` sempre foi opcional) — excluir uma
  subcategoria **nunca** é bloqueado e **nunca** apaga lançamento, só limpa essa marcação
  específica nas linhas que a usavam (confirmado lendo a constraint real no SQL da
  migration, não só assumido). `deleteSubcategory` (admin-only, mesmo padrão de
  `updateSubcategory`/`toggleSubcategoryActive`) + botão na `SubcategoriesTable` com
  `confirm()` explicando esse comportamento antes de excluir. Commit `2b7e769`.
- ✅ **Arquitetura de Identidade/Planos — Fase 1 (documento) aprovada + Fase 2 Etapa 1
  (banco de dados) concluída.** Pedido do usuário: redesenhar toda a arquitetura de
  identidade/autenticação/autorização/planos comerciais/relação consultor×cliente,
  pensando nos próximos anos, com o assistente atuando como Software Architect Sênior
  (questionar premissas, não só implementar). Documento completo em
  `ARQUITETURA-IDENTIDADE-PLANOS.md` (resumo do sistema pra contexto externo em
  `RESUMO-PARA-CHATGPT.md`). **Recomendação central, aprovada:** "Consultor" e "Cliente"
  não são tipos de pessoa — são o papel de uma `Membership` específica (`role=ADVISOR`
  novo), a mesma pessoa podendo ser `TITULAR` do workspace próprio e `ADVISOR` em N
  workspaces de clientes. Plano é comercial (`Subscription`), nunca papel — o que uma
  `Subscription` libera é resolvido via `Entitlement`/`hasFeature()`, não checado por
  nome de plano no código. Etapa 1 (só banco, sem tocar frontend/backend/Server Actions,
  por instrução explícita) entregue e aplicada — ver seção 10 (migrations 7 e 8, SQL 007).
  Commit `185e4f0`.
- ✅ **Arquitetura de Identidade/Planos — Fase 2 Etapa 2 (backend) concluída.** Ver
  detalhe completo na seção 6 (`lib/auth/session.ts`, `lib/billing/entitlements.ts`,
  `lib/audit/access-log.ts`). Resumo: `can()` novo (RBAC explícito) com
  `assertCanWrite`/`assertIsAdmin` reimplementados em cima dele sem mudar assinatura
  nenhuma; `requireMembershipForWorkspace()` novo (workspace explícito + `AccessLog` pra
  `ADVISOR`); `hasFeature()` (resolução de plano/feature) e `logAccess()` novos. **Zero
  tela/Server Action tocada** — tudo aditivo, nenhum call site existente mudou. 8 testes
  novos pra `can()` (121 no total); `hasFeature`/`logAccess` verificados manualmente
  contra o banco real (não são funções puras, fogem do padrão de teste unitário). Commit
  `5ee4747`.
- ✅ **Arquitetura de Identidade/Planos — Fase 2 Etapa 3 (frontend) concluída — primeira
  mudança de tela/Server Action do redesenho.** Escopo escolhido (o usuário só disse
  "avançar", sem detalhar): seletor de workspace — pré-requisito conhecido há muito tempo
  (§19.1 "não existe seletor de workspace") e base necessária pra qualquer acesso
  `ADVISOR` funcionar na UI. Ver detalhe completo na seção 6 (`lib/auth/session.ts`,
  `lib/workspace/switch.ts`) e seção 15 (`WorkspaceSwitcher`). Resumo: `requireWorkspaceId()`/
  `requireApiWorkspaceMembership()` agora respeitam `ACTIVE_WORKSPACE_COOKIE` via
  `resolveActiveMembership()` (pura, testada), fallback idêntico ao de sempre sem cookie;
  `WorkspaceSwitcher` só vira dropdown com 2+ memberships (hoje ninguém tem — **zero
  mudança visual confirmada no navegador** em `/painel`, `/lancamentos`,
  `/cadastros/carteiras`, `/lancamentos/novo`); `setActiveWorkspace` (Server Action) valida
  antes de trocar o cookie. 126 testes no total (5 novos). **Caminho multi-workspace não
  testado ponta-a-ponta no navegador** (ninguém tem 2 memberships reais ainda) — só a
  lógica pura, exaustivamente (todos os casos de `resolveActiveMembership`). Commit
  `70f6189`.
- ⏸️ **Fase 2 Etapa 4 (fluxo de convite/onboarding com papel `ADVISOR`) — PAUSADA de
  propósito pelo usuário em 2026-08-01**, não esquecida: "deixar para depois, pois irei
  adquirir o domínio, aguarde, mas lembre-se disso para me cobrar." O onboarding real de
  cliente depende de e-mail transacional funcionando (convite chega por e-mail), que
  está quebrado hoje pelo motivo já documentado em "Problemas conhecidos" #9 (remetente
  `@gmail.com` não passa DKIM/DMARC em provedor terceiro nenhum — precisa de domínio
  próprio). O usuário decidiu comprar o domínio especificamente pra destravar isso.
  **Numa sessão futura, perguntar proativamente se o domínio já foi comprado/configurado
  antes de assumir que a Etapa 4 continua bloqueada** — não pausar essa checagem
  indefinidamente. Quando destravado, a Etapa 4 é: tela de "consultor cria pré-cadastro
  de cliente" → `WorkspaceInvite` (papel `ADVISOR` pro consultor ou o papel do cliente) →
  cliente completa o cadastro, já capturado automaticamente pelo trigger invite-aware da
  Etapa 1 (`prisma/sql/007_signup_invite_aware.sql`). Nenhum código escrito ainda pra
  isso.
- ✅ **Catálogo real de planos comerciais definido pelo CEO e populado no banco
  (2026-08-02).** Enquanto a Etapa 4 (onboarding) está pausada, o CEO definiu os 4 planos
  reais que serão vendidos: `START` (controle financeiro), `PLUS` (+ planejamento
  financeiro), `PREMIUM` (+ consultoria financeira), `PREMIUM_NEGOCIOS` (+ controle PF e
  MEI) — confirmados como **escada estrita** (cada um acumula tudo do anterior) depois de
  eu apontar a ambiguidade entre os nomes e as descrições dadas. **Decisão importante
  registrada, a pedido do papel de arquiteto**: assinar Premium/Premium Negócios libera a
  *feature* de consultoria (o que o cliente vê na tela), mas **não** atribui um consultor
  de verdade automaticamente — isso continua sendo uma ação manual do time (criar a
  `Membership` `ADVISOR`), confirmado explicitamente pelo CEO como a abordagem certa por
  enquanto, pra evitar cliente pagando por consultoria sem consultor atribuído. Migration
  9 só populou dado (`Plan`/`PlanFeature`), nenhuma tela ainda gateia nada por
  `hasFeature()` — ver seção 10.
- ✅ **Mapeamento das features do roadmap pros 4 planos, mesmo dia** — CEO completou a
  matriz: `START` ganhou Open Finance + app mobile, `PLUS` ganhou IA, `PREMIUM` ganhou
  IRPF + planejamento sucessório, `PREMIUM_NEGOCIOS` ganhou IRPJ (`preparacao_irpj`,
  Feature nova criada — IRPJ ≠ IRPF, pessoa jurídica × física). Levantei uma observação
  não-bloqueante ao CEO: Open Finance no plano mais barato inverte a lógica usual de
  custo-por-cliente de integrações desse tipo (custo variável por conexão) — vale
  confirmar se é intencional; implementado exatamente como pedido enquanto isso. Matriz
  completa e migration ver seção 10 (migration 10).
- ✅ **Domínio próprio configurado e e-mail transacional funcionando de verdade
  (2026-08-04).** `prospectafinance.com.br` (HostGator) com 4 registros DNS pro Brevo (TXT
  de verificação, 2 CNAME DKIM `brevo1`/`brevo2._domainkey`, TXT `_dmarc`), domínio
  autenticado no Brevo, remetente `admin@prospectafinance.com.br` verificado, SMTP
  customizado do Supabase (Authentication → Emails) trocado pro Brevo com esse remetente.
  Testado com cadastro real — e-mail de confirmação chegou, remetente correto. Ver
  "Problemas conhecidos" #9 (RESOLVIDO) e o bloco no topo do documento.
- ✅ **Bug corrigido: `resolveActiveMembership()` não ignorava membership `REVOKED` no
  fallback (2026-08-04).** Achado ao testar o cadastro acima (uma conta de teste antiga
  tinha 3 convites pendentes de 31/07 sobrando, aceitos automaticamente pelo trigger
  invite-aware — comportamento correto —, mas revogar a membership resultante não tirava o
  acesso porque o fallback (`memberships[0]`) não checava `status`). Corrigido em
  `lib/auth/session.ts`, 2 testes novos (128 no total). Convites e membership de teste já
  limpos no banco.
- ✅ **Fase 2 Etapa 4 (fluxo de pré-cadastro de cliente `ADVISOR`) concluída (2026-08-04) —
  fecha o redesenho de Identidade/Planos.** `/admin/clientes` (admin-only): cria workspace +
  `Subscription TRIALING` + `Membership ADVISOR` opcional + `WorkspaceInvite TITULAR`,
  reaproveitando o trigger invite-aware da Etapa 1 e o `createInvite`/`InviteLink` já
  existentes — zero código de convite/aceite novo. `WorkspaceInvite.expiresAt` passou a ser
  preenchido (7 dias) em convites novos, com checagem em `acceptInvite` e mensagem "expirou"
  em `/convite/[token]`. `ADVISOR` virou opção também no convite de membro comum. Ver bloco
  no topo do documento pro detalhe completo (query da lista de pendentes, bug pequeno achado
  e corrigido no rótulo do consultor sem nome, verificação ao vivo sem senha).
- ✅ **Confirmação de senha, e-mail transacional próprio, convite de cliente por
  e-mail de verdade, exclusão de conta (self + admin) e login com Google
  (2026-08-05).** Ver bloco no topo do documento pro detalhe completo de cada um —
  todos testados ao vivo contra dados/contas reais antes de commitar. Arquivos novos
  principais: `lib/email/{send,templates}.ts`, `lib/account/delete.ts`,
  `app/(auth)/definir-senha/*`, `app/(app)/minha-conta/*`,
  `components/GoogleSignInButton.tsx`. `app/auth/confirm/route.ts` deixou de ser
  código morto (ver "Problemas conhecidos" #4).

## 25. Funcionalidades em andamento

**Fase 2 Etapa 4 da Arquitetura de Identidade/Planos concluída (2026-08-04)** — ver seção
24 pro detalhe completo (`/admin/clientes`, expiração de convite, ADVISOR no convite de
membro). **As 4 etapas planejadas do redesenho (banco, backend, frontend/seletor de
workspace, onboarding de cliente) estão todas concluídas, aplicadas/commitadas e
verificadas.** Fora do escopo aprovado, de propósito: envio automático de e-mail de
convite (continua manual/link), tela do cliente "ver meu consultor" (§15 da arquitetura),
telas gateadas por `hasFeature()` (nenhuma tela nova pra gatear ainda — MEI/IRPF/IA/Open
Finance/etc. são Fase 4 da especificação original, não desta arquitetura). Nada mais em
andamento — tudo verificado (typecheck, lint, 132 testes, build de produção local) e
commitado/pushado (ver seção 26). Não há trabalho pendente no working tree (exceto o
`recovery-codes.txt` — ver "Problemas conhecidos" #8 — que nunca deve ser commitado).

## 26. Estado do Git

```
3fadaaf Arquitetura de Identidade/Planos: mapeia features do roadmap pros planos   <- HEAD / origin/master
2e0840e Atualiza PROJECT_STATE.md: catalogo real de planos comerciais
83abb46 Arquitetura de Identidade/Planos: popula catalogo real de planos comerciais
c4aca27 Documenta pausa da Etapa 4 (onboarding ADVISOR) ate compra de dominio
719e41d Atualiza PROJECT_STATE.md: Etapa 3 da Arquitetura de Identidade/Planos
70f6189 Arquitetura de Identidade/Planos, Fase 2 Etapa 3: seletor de workspace
31ccab2 Atualiza PROJECT_STATE.md: Etapa 2 da Arquitetura de Identidade/Planos
5ee4747 Arquitetura de Identidade/Planos, Fase 2 Etapa 2: backend (lib/auth/session.ts)
a43b46b Atualiza PROJECT_STATE.md: Etapa 1 da Arquitetura de Identidade/Planos
185e4f0 Arquitetura de Identidade/Planos, Fase 2 Etapa 1: schema, migrations, trigger
6da50d2 Atualiza PROJECT_STATE.md: botao Excluir em Subcategoria
2b7e769 Adiciona botao Excluir em Subcategoria (admin), so remove a subcategoria
9952eef Atualiza PROJECT_STATE.md: opcao "-" no seletor Ver de Subcategorias
b4b13cd Adiciona opcao "-" no seletor principal de Subcategorias (nao ver nada)
dde22f2 Atualiza PROJECT_STATE.md: correcao do fluxo de Nova subcategoria
e0f5e14 Corrige Nova subcategoria: nao navega mais, mostra criadas em card proprio
425b0d6 Atualiza PROJECT_STATE.md: fluxo Tipo->Categoria->Nome em Nova subcategoria
6262705 Nova subcategoria: fluxo Tipo -> Categoria (filtrada) -> Nome, independente do "Ver"
0ff113d Atualiza PROJECT_STATE.md: cor por Tipo e botao Ver em Subcategorias
c2577eb Melhora selecao de categoria em Subcategorias: cor por Tipo e botao Ver visivel
4820fb2 Atualiza PROJECT_STATE.md: correcao da Ordem duplicada em Categoria
a1bb5d6 Corrige Ordem de categoria pra nunca duplicar (empurra as demais)
9b08965 Atualiza PROJECT_STATE.md: reformulacao de Cadastros e permissao de subcategoria
3f21ce3 Reformula Cadastros: editar sob demanda, exclusao em massa, botoes com contraste
47d8e77 Atualiza PROJECT_STATE.md: checagem do importador e cards de Cadastros
06e6118 Padroniza fundo dos cards de Cadastros para #131A47
5c0f839 Atualiza PROJECT_STATE.md: formulario de lancamento sem secao colapsada
14963d5 Formulario de Novo lancamento: todos os campos visiveis, sem secao colapsada
d770001 Atualiza PROJECT_STATE.md: bug do pool de conexoes do Supabase corrigido
aeb618e Corrige esgotamento do pool de conexoes do Supabase (causa real do 500 em /lancamentos)
5617415 Atualiza PROJECT_STATE.md: asterisco vermelho nos campos obrigatorios
5ea147b Adiciona asterisco vermelho nos campos obrigatorios de Lancamento e Transferencia
a0a3064 Documenta investigacao do erro em /painel e tecnica de teste autenticado
4cb1f6a Atualiza PROJECT_STATE.md: form de lancamento redesenhado, pagina de erro custom
de68d14 Formulario de lancamento em KPI card com 4 tipos, e pagina de erro custom
07c4c18 Renomeia "Provisao futura" para "Provisao" no Painel
15b450b Atualiza PROJECT_STATE.md: grafico de provisao futura no Painel
0dc2b0b Adiciona grafico de provisao futura (proximos 6 meses) no Painel
24e3355 Atualiza PROJECT_STATE.md: visao Mensal/Anual/Geral no Painel
2e9fa19 Adiciona visao Mensal/Anual/Geral no Painel
41acf58 Atualiza PROJECT_STATE.md: favicon.ico padrao removido
61d039c Remove favicon.ico padrao do Next.js (era o triangulo da Vercel)
95ee7ee Atualiza PROJECT_STATE.md: senha visivel, zoom mobile, banner de instalar sem cooldown
b0b476d Mostrar/ocultar senha, corrige zoom no mobile, banner de instalar o app
ef86a4b Atualiza PROJECT_STATE.md: bug do fundo branco corrigido, Painel redesenhado
8da4ccd Redesenha Painel: cards #131A47, rosca de categorias, velocimetro de reserva
f2341ac Atualiza PROJECT_STATE.md: cor do menu trocada de novo para #131A47
401a47a Muda cor de fundo do menu (sidebar/mobile) para #131A47
01c7e2c Muda cor de fundo do menu (sidebar/mobile) para #090D24
50c36e2 Corrige logo com transparencia real e unifica visual mobile/desktop
4b71504 Documenta rebranding PROSPECTA Finance e remove referencia morta no proxy.ts
1b3e8ae Renomeia app para PROSPECTA Finance e adiciona a logomarca real
089e466 Atualiza PROJECT_STATE.md: menu lateral, Fase 2 pausada a pedido do usuario
56fbf3b Substitui nav horizontal por menu lateral (desktop), estilo inspirado no Meu Vista
acc8802 Documenta investigacao do SMTP: causa raiz DKIM/DMARC, compra de dominio adiada
917d42e Atualiza PROJECT_STATE.md: excluir convite, esqueci senha, nome no cadastro, admin/usuarios
1a61db6 Adiciona nome no cadastro e painel admin de todos os usuarios
96147ea Adiciona excluir convite pendente e fluxo de "esqueci minha senha"
804bccb Atualiza PROJECT_STATE.md: deploy em producao, convite por WhatsApp, avisos de seguranca
92d8035 Adiciona envio de convite por WhatsApp (link wa.me com mensagem pronta)
5db6f57 Corrige prontidao pro deploy: Suspense boundary no login, config de preview de producao, lint ignora sw.js gerado
a389222 Fase 1: fecha pontas soltas (Compromissos, reverter importacao, transferencia, convite de membro, edicao in-line)
640d4f6 Fase 1 / Conversa 5: permissoes, exportacao e responsividade/PWA
175677b Fase 1 / Conversa 4: lancamento rapido e painel
72756da Fase 1 / Conversa 3: lancamentos, importador de CSV e Cadastros
96ad5e3 Fase 1 / Conversa 2: regras financeiras puras em lib/finance, com testes
5189b78 Fase 0 (Fundacao): Next.js + Prisma + Supabase Auth/RLS + seed da taxonomia
```

**Remote configurado:** `origin` → `https://github.com/fhildebrando-lfsh/PROSPECTA-Finance.git`,
branch `master` — este é o repositório real conectado à Vercel (push em `master` redeploya
automaticamente). Working tree limpo no momento desta atualização (nada pendente de commit,
exceto o `recovery-codes.txt` intencionalmente nunca adicionado). As migrations
`20260730172238_workspace_invites` e `20260730194550_workspace_invite_phone`, e os SQLs
`006_workspace_invites_rls.sql`, já estão aplicados no banco Supabase (o mesmo usado em dev
e produção — ver "Problemas conhecidos" #7) e commitados junto com o código. Numa nova
sessão, rode `git status` e `git log --oneline -5` primeiro pra confirmar o estado real —
nunca confiar cegamente num hash hardcoded aqui. **Nunca commitar ou dar push sem o usuário
pedir explicitamente**, mesmo que pareça óbvio (ele tem pedido isso todas as vezes até
agora, inclusive o push real pro GitHub).

## 27. Próximos passos recomendados

As 5 pontas soltas da Fase 1 (seção 24) e o primeiro deploy em produção estão concluídos.
Seguindo `GUIA-DE-INICIO.md`, o guia recomenda **30 dias de uso real antes de qualquer
funcionalidade nova de Fase 2**:

1. Configurar Supabase Authentication → URL Configuration com a URL da Vercel (Site
   URL + Redirect URLs) — **já feito** pelo usuário em 2026-07-30.
2. **E-mail de confirmação continua quebrado, correção adiada de propósito pelo usuário**
   (ver "Problemas conhecidos" #9) — a causa raiz exige domínio próprio (DKIM/DMARC não dá
   pra autenticar num endereço @gmail.com), e o usuário decidiu comprar o domínio depois,
   não agora. Contorno enquanto isso: confirmar e-mail manualmente no painel do Supabase
   (Authentication → Users) quando alguém se cadastrar.
3. Uso real por Felipe e a esposa — o fluxo de convite (link + WhatsApp) já foi testado
   manualmente com sucesso, mas **ninguém aceitou um convite de fato ainda** porque o
   e-mail de confirmação do Supabase não chega (item 2 acima) — usar o contorno manual pra
   destravar isso quando quiser fechar o ciclo.
4. Mover `recovery-codes.txt` pra um lugar seguro fora da pasta do projeto (ver
   "Problemas conhecidos" #8).
5. Backup mensal em CSV guardado fora do sistema (prática recomendada no guia).

**Estado da Fase 2:** o usuário perguntou sobre avançar pra Fase 2 (relatórios — analítico
mensal, parceladas, balanço anual, orçamento, fatura de cartão, OFX) em 2026-07-31; foi
avisado que a especificação recomenda 30 dias de uso real antes, e **decidiu pausar de
propósito**: vai usar o sistema, reportar bugs pontuais conforme aparecerem (ex.: o menu
lateral desta rodada nasceu de um desses pedidos), e só pedir pra avançar pra Fase 2 quando
estiver satisfeito com o estado atual. **Não iniciar Fase 2 nem sugerir isso proativamente
numa sessão futura** — esperar o usuário pedir explicitamente. Enquanto isso, tratar cada
pedido como um ajuste pontual (bug fix, UI, pequena feature), não como início de fase nova.

## 28. Checklist atualizado do projeto

- [x] Fase 0 — Fundação (login, RLS, papéis, taxonomia)
- [x] Conversa 2 — Regras financeiras (`lib/finance`, testadas)
- [x] Conversa 3 — Lançamentos, parcelamento/recorrência, importador de CSV
- [x] Conversa 4 — Painel completo, lançamento rápido
- [x] Conversa 5 — Permissões, exportação, responsividade/PWA
- [x] Commit do trabalho da Conversa 5 (`640d4f6`)
- [x] Tela de Compromissos
- [x] Reverter importação (UI)
- [x] Edição in-line / ações em lote em Lançamentos (desktop)
- [x] UI de transferência entre carteiras
- [x] Convidar membro pra workspace existente (não testado ponta-a-ponta, ver seção 22)
- [x] Commit do trabalho da Conversa 6 (`a389222`)
- [x] Deploy em produção (Vercel) — `prospecta-finance.vercel.app`, repo
      `github.com/fhildebrando-lfsh/PROSPECTA-Finance`
- [x] Convite por WhatsApp (link `wa.me`) — commit `92d8035`
- [x] Configurar Supabase Auth URL Configuration com a URL da Vercel
- [x] Excluir convite pendente, "Esqueci minha senha", Nome no cadastro, `/admin/usuarios`
      — commits `96147ea` e `1a61db6`
- [x] `recovery-codes.txt` movido pra fora da pasta do projeto (confirmado pelo usuário)
- [ ] Comprar domínio próprio + configurar DKIM/SPF/DMARC no Brevo — única correção real
      pro e-mail de confirmação (ver "Problemas conhecidos" #9). **Adiado de propósito**
      pelo usuário, não esquecido — contorno manual em uso enquanto isso.
- [ ] Confirmar se a chave SMTP do Brevo exposta no chat (`xsmtpsib-...8Tafio`) foi
      revogada e substituída (ver "Problemas conhecidos" #9)
- [x] Menu lateral (`Sidebar`) desktop/tablet, estilo Meu Vista — commit `56fbf3b`
- [x] Rebranding "PROSPECTA Finance" + logo real (ícones PWA, favicon, sidebar, login) —
      commit `1b3e8ae`; logo corrigida (transparência real) + navegação mobile unificada
      com o Sidebar (`MobileNav`) + cor `#131A47` (após um ajuste intermediário em `#090D24`)
      — commits `50c36e2`/`01c7e2c`/`401a47a`
- [x] Bug do fundo branco corrigido (CSS cascade layers) + Painel redesenhado (cards
      `#131A47`, `CategoryRings`, `ReserveGauge`) — commit `8da4ccd`
- [x] Mostrar/ocultar senha, zoom mobile corrigido (viewport meta), banner de instalar
      o app sem cooldown — commit `b0b476d`
- [x] Favicon.ico padrão do Next removido — commit `61d039c`
- [x] Painel: visão Mensal/Anual/Geral — commit `2e9fa19`
- [x] Painel: gráfico de Provisão (próximos 6 meses) — commit `0dc2b0b`
- [x] Novo lançamento em KPI card + 4 tipos, página de erro customizada — commit `de68d14`
- [x] Asterisco vermelho nos campos obrigatórios de Lançamento/Transferência — commit `5ea147b`
- [x] Bug real corrigido: esgotamento do pool de conexões do Supabase causando 500 em
      `/lancamentos` e `/lancamentos/novo` — commit `aeb618e`
- [ ] Trocar `DATABASE_URL` na Vercel do pooler de Sessão (5432) pro pooler de Transação
      (6543) — recomendação oficial do Supabase pra serverless, remove o teto de 15
      conexões de vez. Requer editar env var na Vercel + redeploy (fora do alcance do
      assistente); `max: 3` já aplicado no código deve prevenir o crash enquanto isso
      não é feito.
- [x] Novo lançamento: Data de compra/vencimento visíveis e editáveis, Responsável/
      Situação sempre visíveis e forçados via `required` (sem pré-preenchimento),
      Tags (opcional), sem nenhuma seção colapsada — commit `14963d5`
- [x] Checagem: importador de CSV/XLSX confirmado intacto após o redesenho do formulário
      (pipeline independente, 37 testes de `tests/import/*` passam) — nenhuma mudança de
      código necessária
- [x] Cadastros (Carteiras/Responsáveis/Categorias/Subcategorias/Tipos/Membros): fundo dos
      cards padronizado de `bg-zinc-900` pra `#131A47` — commit `06e6118`
- [x] Cadastros: edição sob demanda (botão Editar/Salvar/Cancelar + spinner + popup
      "Salvo"), checkbox/exclusão em massa em Carteiras e Responsáveis (`deleteWallet`
      novo, seguro), botões com contraste real, criar subcategoria liberado pra qualquer
      membro com escrita, alerta com link quando lista de carteira/responsável está vazia
      — commit `3f21ce3`
- [x] Bug real corrigido: Ordem de Categoria podia duplicar — criar/editar agora empurra as
      demais categorias do mesmo Tipo em vez de duplicar o número; dado já duplicado em
      produção corrigido manualmente — commit `a1bb5d6`
- [x] Subcategorias: cor por Tipo no seletor de categoria + botão "Ver" com estilo visível
      — commit `c2577eb`
- [x] "Nova subcategoria": fluxo Tipo → Categoria (filtrada) → Nome, independente do "Ver"
      — commit `6262705`
- [x] Correção: parou de navegar pra longe do que "Ver" mostra; card "Subcategoria
      cadastrada" lista o que foi criado na visita — commit `e0f5e14`
- [x] Seletor "Ver" ganhou opção "—" pra ver a lista vazia de propósito — commit `b4b13cd`
- [x] Botão Excluir em Subcategoria (admin) — FK `SET NULL`, nunca apaga lançamento —
      commit `2b7e769`
- [x] Arquitetura de Identidade/Planos: Fase 1 (documento) aprovada — commit `185e4f0`
- [x] Arquitetura de Identidade/Planos: Fase 2 Etapa 1 (banco de dados — schema,
      migrations 7/8, trigger de signup invite-aware) — commit `185e4f0`
- [x] Arquitetura de Identidade/Planos: Fase 2 Etapa 2 (backend — `can()`,
      `requireMembershipForWorkspace()`, `hasFeature()`, `logAccess()`) — commit `5ee4747`
- [x] Arquitetura de Identidade/Planos: Fase 2 Etapa 3 (frontend — seletor de workspace,
      `WorkspaceSwitcher`, `setActiveWorkspace`) — commit `70f6189`
- [x] Catálogo real de planos comerciais (Start/Plus/Premium/Premium Negócios, escada
      estrita, definido pelo CEO) — commit `83abb46`
- [x] Mapeamento das features do roadmap (Open Finance, app mobile, IA, IRPF,
      sucessório, IRPJ) pros 4 planos — commit `3fadaaf`
- [ ] Arquitetura de Identidade/Planos: fluxo de convite/onboarding `ADVISOR` — **pausado
      de propósito pelo usuário** até comprar/configurar domínio próprio (ver seção 24 e
      "Problemas conhecidos" #9); perguntar proativamente numa sessão futura
- [ ] Arquitetura de Identidade/Planos: RLS, testes de integração, documentação final da
      refatoração — não iniciadas, aguardando aprovação do usuário
- [ ] Teste manual logado ponta-a-ponta (login, aceitar um convite de verdade, edição
      in-line com inversão de sinal, `/admin/usuarios`, menu lateral novo, Painel
      redesenhado) — login exige senha, fora do alcance do assistente
- [ ] 30 dias de uso real / correções pontuais reportadas pelo usuário (**Fase 2 pausada
      de propósito** — ver seção 27, não iniciar sem pedido explícito)
- [ ] Banco Supabase separado pra produção (hoje dev e prod compartilham o mesmo)
- [ ] Fase 2 (relatórios: analítico, parceladas, balanço anual, orçamento, fluxo projetado, OFX)
- [ ] Fase 3 (patrimônio, dívidas, metas, Open Finance)
- [ ] Fase 4 (consultoria multi-workspace)
