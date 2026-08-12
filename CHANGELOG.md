# Changelog — PROSPECTA Finance

> Histórico cronológico de mudanças entregues no sistema, em linguagem direta e
> orientada a "o que mudou" (não "como foi implementado" — para o detalhe técnico de
> cada decisão, ver `PROJECT_STATE.md`; para o registro formal de cada etapa concluída,
> ver `REGISTRO-OPERACIONAL.md`).
>
> **Convenção:** entradas agrupadas por data (o projeto ainda não usa versionamento
> semântico — `package.json` está em `0.1.0` desde o início), mais recente primeiro,
> categorizadas quando fizer sentido em **Adicionado** / **Alterado** / **Corrigido** /
> **Segurança**. **Este arquivo deve ser atualizado ao final de toda etapa concluída**,
> junto com `PROJECT_STATE.md` e `REGISTRO-OPERACIONAL.md` — é o compromisso de
> escrituração assumido em 2026-08-08.

---

## 2026-08-12

### Corrigido
- **Patrimônio → Dívidas, filtro de curto/longo prazo**: critério trocado de "vencimento da última parcela" para "quantidade de parcelas restantes" — o critério anterior classificava errado quando havia parcela atrasada (ex.: um financiamento 1/24 com 23 parcelas restantes aparecia em "Curto prazo"; um 1/12 com 11 restantes aparecia em "Longo prazo", o oposto do esperado).
- **Investimentos, Carteira**: arquivar um investimento não faz mais ele sumir da lista — continua visível, numa seção "Arquivados" separada e esmaecida (podia dar a impressão de que o valor tinha desaparecido do sistema, quando na verdade só ficava sem aparecer na Carteira).

### Adicionado
- Investimentos: a tabela "histórico de movimentações" ganhou botão "Excluir" por linha, ao lado de "Editar" — remove o lançamento de verdade (com confirmação antes, por ser irreversível).
- **Bloqueio de acesso ao sistema (admin-only)**: em Admin → Usuários, o administrador pode pausar o acesso de um cliente (fatura em aberto, solicitação do próprio cliente, verificação de segurança, orientação do consultor ou outro motivo, escrito por ele) sem excluir a conta. O cliente bloqueado, ao tentar acessar, vê uma mensagem explicando o motivo — reversível a qualquer momento pelo mesmo admin.

### Segurança
- Corrigidos os achados do Supabase Security Advisor em produção: `_prisma_migrations` (única tabela sem proteção de acesso por linha) agora protegida; as 5 funções internas do sistema deixaram de ser executáveis por visitantes sem login via API — só quem está logado (e só quando de fato preciso) continua com acesso. Nenhum efeito no funcionamento do sistema (a correção fecha uma porta que o próprio app nunca usava). Falta uma configuração manual do administrador no painel do Supabase ("Leaked password protection") — passo a passo entregue separadamente.

---

## 2026-08-11

### Adicionado
- Suíte E2E: troca de workspace (Playwright seleciona o segundo workspace pelo seletor da sidebar, confirma pela badge de consultor) e importação de OFX (mini-formulário + confirmação das transações).

### Corrigido
- **Painel, Balanço anual, Fluxo projetado, Orçamento, Reserva de emergência e Dívidas**: os totais de Receita/Despesa/Investimento agora representam só o que foi efetivamente recebido/pago (liquidado) — antes misturavam com o que ainda estava a pagar/a receber/estimado. O gráfico "Provisão" do Painel e o relatório "Fluxo projetado" continuam olhando pra frente, mas agora calculam só em cima do pendente, sem misturar com o que já aconteceu.

### Adicionado (continuação, mesmo dia — Registro Nº 054)
- Investimentos: a tabela "histórico de movimentações" ganhou Editar/Salvar por linha — corrige categoria, responsável, valor ou data de um lançamento já registrado, e os totais do topo da página (ganho de capital, rentabilidade etc.) recalculam na hora.
- Patrimônio → Dívidas: filtro de curto prazo (até 12 meses) e longo prazo (acima de 12 meses), incluindo no PDF baixado.

---

## 2026-08-10

### Adicionado
- CI no GitHub Actions (`.github/workflows/ci.yml`): `tsc --noEmit`, testes e build em todo push/PR para `master`.
- RLS (Row Level Security) completa para as 14 tabelas do banco que não tinham nenhuma policy desde que foram criadas (`prisma/sql/008_rls_completeness.sql`) — ainda documental, não exercida pelo app hoje.

### Corrigido
- Gap de RLS: policies de escrita de `people`/`wallets`/`entry_groups`/`entries`/`import_batches` não incluíam o papel `ADVISOR`, mesmo a aplicação já permitindo escrita para consultores.

### Observado
- `npm run lint` tem 11 erros pré-existentes (não relacionados a esta etapa) — CI roda lint sem bloquear (`continue-on-error`) até serem corrigidos.

### Adicionado (continuação, mesmo dia)
- Banco de desenvolvimento/teste separado do de produção — projeto Supabase novo (`prospecta-finance-dev`), com schema, RLS e taxonomia aplicados, e um workspace de teste seedado. `npm run dev` local agora aponta para ele; produção (Vercel) não muda.
- Suíte de testes de integração de verdade (`npm run test:integration`) — 5 arquivos, 15 testes, batendo no banco de dev real: criar/liquidar/parcelar/recorrer lançamento, transferência entre carteiras, criar investimento e registrar evento/renda, ciclo de convite de workspace. Guard de segurança dedicado impede que rode contra produção por engano.

### Corrigido (continuação, mesmo dia)
- `npm test` (unitários) estava sem querer incluindo os novos testes de integração no `include` do Vitest — corrigido excluindo `tests/integration/**` do config de unitários.

### Adicionado (continuação, mesmo dia — Registro Nº 049)
- Suíte de integração estendida: `lib/entries/asset.ts`, `lib/workspace/advisor.ts`, e o núcleo do commit de importação (`lib/import/commit.ts`, extraído de `app/api/import/commit/route.ts`) — 8 arquivos/26 testes no total.
- CI (GitHub Actions) passa a rodar `test:integration` de verdade contra o banco de dev, usando 4 secrets novos do repositório (`DEV_NEXT_PUBLIC_SUPABASE_URL`/`DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY`/`DEV_SUPABASE_SERVICE_ROLE_KEY`/`DEV_DATABASE_URL`).

### Alterado (continuação, mesmo dia)
- `app/api/import/commit/route.ts` simplificado — lógica de gravação em lote movida para `lib/import/commit.ts` (mesma resposta HTTP, comportamento idêntico, agora testável).

### Corrigido (continuação, mesmo dia — Registro Nº 050)
- CI: o job `integration-tests` procurava secrets com nomes diferentes dos que foram cadastrados no GitHub (`DEV_SUPABASE_URL`/`DEV_SUPABASE_ANON_KEY` vs. os reais `DEV_NEXT_PUBLIC_SUPABASE_URL`/`DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY`) — o guard de segurança abortou corretamente em vez de rodar com credencial vazia. `ci.yml` ajustado; CI confirmado verde nos dois jobs.

### Adicionado (continuação, mesmo dia — Registro Nº 051)
- Primeira leva de testes E2E com Playwright (`npm run test:e2e`): login sem senha via magic link, criar lançamento pelo formulário, importar CSV — os 3 rodando contra o `next dev` local e o banco de dev real. Guard de segurança dedicado (`scripts/assert-dev-database.ts`) impede rodar contra produção.

---

## 2026-08-09

### Adicionado
- **Menu "Investimentos"**: novo grupo de menu, exclusivo para investimentos, com integração automática com Lançamentos — cadastrar uma posição (renda fixa, renda variável, imóveis para aluguel, veículos para revenda, participação societária, criptoativos, metais preciosos, commodities, terras e produção rural, bens colecionáveis, previdência privada ou qualquer outra coisa) já cria um lançamento correspondente, visível em Lançamentos, sem passo extra. Dentro do menu Investimentos, cada posição tem uma tela analítica própria: valor investido, valor atual, ganho de capital, rentabilidade %, retorno total % (ganho de capital + renda recebida), gráfico de evolução e histórico completo de lançamentos ligados. Botões para registrar eventos da posição (ganho/perda de capital, dividendo, juro, retirada, imposto, variação cambial) e renda real recebida (aluguel, participação nos lucros) — para imóveis, ainda é possível gerar a série mensal de aluguel automaticamente. A aba "Análise" traz a visão consolidada de toda a carteira: total investido, valor atual, rentabilidade consolidada, alocação por classe, renda recebida ao longo do tempo, ranking por rentabilidade e exportação em PDF.

### Adicionado
- **Integração com o Google Agenda**: em Compromissos → Calendário, é possível conectar o Google Agenda do cliente (autorização própria, separada do login com Google) — o sistema cria um calendário dedicado "PROSPECTA Finance" na conta dele e passa a enviar, em tempo real, todo compromisso a pagar/a receber. Ao liquidar (pagar/receber) um lançamento, o evento correspondente some da agenda em vez de ficar marcado como concluído. Botão "Desconectar" apaga o calendário dedicado e revoga o acesso.

### Corrigido
- **Conexão com o Google Agenda falhava sempre** (`403`, permissão insuficiente) ao tentar criar o calendário dedicado, mesmo com a permissão de Agenda concedida pelo cliente — faltava um segundo escopo específico para criar/gerenciar calendários (diferente do escopo de criar/editar eventos). Corrigido e verificado com uma conexão real.
- **Calendário de Compromissos**: eventos de cada dia eram blocos de cor sólida que truncavam o texto agressivamente e ficavam confusos quando havia vários no mesmo dia — agora usam uma linha com uma barra colorida à esquerda (vermelha para vencido, verde para dentro do prazo), com mais espaço para o texto. Cabeçalho dos dias da semana com mais contraste; dias de outro mês com fundo mais escuro para se distinguir dos dias do mês atual.
- **Textos com numeração interna da especificação** (ex.: "(§13)", "§10 R5") apareciam em telas voltadas ao usuário final, em Compromissos (Lista, Calendário, Incidentes), Importar planilha e Transferir entre carteiras — reescritos em português comum, sem jargão de desenvolvimento.
- **Calendário de Compromissos no celular**: o mês inteiro não cabia na tela (largura mínima fixa maior que qualquer celular), forçando rolagem horizontal e cortando a visualização. Corrigido — a grade se ajusta a qualquer tamanho de tela; no celular, cada dia mostra indicadores coloridos em vez de texto (toque no dia para ver a lista completa).

### Removido
- **Relatório "Analítico mês a mês"**: a mesma informação (Receita/Despesa/Investimento/Saldo por mês) já está dentro de "Balanço anual", que ainda soma o detalhamento por categoria — a tela separada era redundante.

### Adicionado
- **Cartões de Crédito**: novo grupo no menu lateral, com cadastro completo de cartão (nome, instituição financeira — inclusive cadastrando uma nova na hora —, imagem, dia de fechamento/vencimento, limite), vinculado automaticamente a uma Carteira. Tela "Meus Cartões" mostra a fatura vigente de cada um; o detalhe de cada cartão traz o histórico das últimas faturas e um seletor para conferir qualquer fatura (passada ou futura) lançamento a lançamento contra o extrato real do banco.
- **Análise de Benefícios** (dentro de Cartões de Crédito): compara, cartão a cartão, se os pontos/milhas ganhos compensam a anuidade — calculado sobre o gasto real dos últimos 12 meses em cada cartão, não uma promessa do banco.
- **Importação de fatura em PDF**: além de CSV e OFX, a tela de Importar (e o botão "Importar fatura" de cada cartão) agora aceita a fatura de um cartão de crédito em PDF, com suporte a arquivo protegido por senha (nunca salva, usada só para abrir o arquivo naquele momento) e termo de consentimento. Compras parceladas: a primeira parcela lançada já gera a série inteira; parcelas que reaparecem em faturas de meses seguintes são reconhecidas e não duplicadas. A leitura do formato de cada banco é adicionada aos poucos, um de cada vez.
- **Leitura de fatura em PDF: 5 bancos suportados** (Nubank, Casas Bahia/Bradescard, Porto Seguro, Itaú — Signature e PDA — e Santander, incluindo as variantes 123/Free), conferidos contra faturas reais de 2018 a 2026. Pagamento da própria fatura nunca é importado como lançamento (não é compra); Mercado Pago fica pendente até haver uma fatura de exemplo com algum consumo real.

### Corrigido
- **Leitura de fatura em PDF**: a reconstrução de linha a partir do texto do PDF podia embaralhar a ordem de leitura dentro de uma mesma linha quando duas colunas da fatura ficavam muito próximas verticalmente (ex.: valor da parcela aparecendo antes do nome do estabelecimento) — corrigida a ordenação para respeitar sempre a posição horizontal real do texto.
- **Cadastro de Cartão de Crédito**: dia de fechamento e dia de vencimento agora só aceitam número (nenhuma letra passa, no máximo 2 dígitos). Limite de crédito e Anuidade agora são digitados em formato de moeda brasileira ("R$ 1.500,00"), preenchendo da direita pra esquerda como em qualquer app de banco, sem precisar digitar vírgula ou ponto.
- **Vencimento da fatura de cartão de crédito calculado errado** sempre que o dia de vencimento é maior que o dia de fechamento (ex.: fecha dia 2, vence dia 10) — o sistema jogava o vencimento pro mês seguinte, quando na verdade cai no mesmo mês do fechamento. Afetava a tela de Cartões (fatura vigente, histórico, seletor de mês) e a data de vencimento gravada em lançamentos de fatura importados. Corrigido, e os lançamentos já gravados dos cartões afetados foram recalculados.

### Adicionado
- **Cartão de Crédito — lançamento a lançamento da fatura editável**: cada linha da fatura agora tem um botão "Editar", com duas colunas de descrição — a que veio do banco (sempre travada) e uma personalizada (editável, junto com categoria e subcategoria). Editar uma vez "ensina" o sistema: da próxima vez que a mesma descrição do banco aparecer em qualquer fatura importada (de qualquer cartão), já vem com a personalização aplicada.
- **Editar cartão** (dados cadastrais) agora segue o mesmo padrão do resto do sistema: campos travados até clicar em "Editar", com Salvar/Cancelar.

---

## 2026-08-08

### Adicionado
- **Importação de OFX**: além de CSV, a tela de Importar agora aceita extratos bancários em OFX (§18). Escolha carteira, responsável e uma categoria padrão (despesas/receitas) para o arquivo inteiro; categorias são sugeridas automaticamente pelo histórico de descrições já lançadas. Se a carteira for cartão de crédito, o vencimento de cada compra usa a fatura certa (fechamento/vencimento), não a data da compra. Lançamentos sem histórico de categoria ficam marcados para revisão em Compromissos → Incidentes, que passou a cobrir os dois casos (parcela órfã e categoria sem histórico).
- **Código do cliente**: cada workspace (pessoa ou família) ganhou um código sequencial imutável ("0001", "0002"...). Nova coluna "Código" em Admin → Usuários. No seletor de workspace, clientes de consultoria agora aparecem como "código, nome do titular (cliente)" em vez do nome do workspace, para diferenciar clientes de nomes parecidos.

### Corrigido
- **Seletor de workspace** listava um workspace onde o acesso do usuário como consultor já tinha sido revogado (consultor trocado); selecioná-lo dava erro genérico em vez de simplesmente não aparecer como opção.
- **Cards de Lançamentos no celular** com contraste ruim (texto quase preto ou cinza sobre fundo escuro) — reaproveitavam cores pensadas para o fundo claro da tabela do desktop.
- **Banco de dados esgotando conexões sob uso normal** ("Algo deu errado" em `/lancamentos`) — trocado o pooler do Supabase de sessão (teto de 15 conexões simultâneas) para transação (sem esse teto).

### Adicionado
- **Compromissos → Incidentes**: nova aba para revisar lançamentos parcelados que não puderam ser combinados automaticamente com o resto da série (parcela órfã ou cluster ambíguo). Cada linha tem um botão "Confirmar que está correto" e um "Editar" (formulário completo, incluindo número/total de parcelas). Corrigir uma linha tenta reagrupá-la automaticamente com a parcela irmã, se agora existir uma combinando.
- **Fase 3 — Patrimônio (Bens e Metas)**: novo grupo "Patrimônio" no menu lateral, com telas de Bens (valor atual somando aquisição + valorizações/desvalorizações) e Metas (velocímetro de progresso vinculado a uma caixinha).
- **Dívidas**: nova tela em Patrimônio, somente leitura — total em aberto, compromisso mensal, percentual da despesa média comprometido e gráfico de diminuição do saldo devedor ao longo do tempo. Considera parcelamentos de despesa com 2+ parcelas ainda em aberto.
- **Relatórios e Patrimônio em PDF**: botão "Baixar PDF" nas 5 telas de Relatórios e nas 3 de Patrimônio (Bens, Metas, Dívidas), com identidade visual da PROSPECTA Finance.
- **Bens e Metas: trava de edição** — cada cartão fica somente leitura até clicar em "Editar"; "Arquivar"/"Excluir" continuam sempre visíveis.
- **Bens: gráfico de evolução patrimonial** — valor acumulado do patrimônio total, por data.
- **Metas: checkbox "Mostrar no Painel"** — escolha quais metas aparecem na seção "Metas" do Painel (modular; nenhuma marcada = seção ausente).
- **Fase 2 — Relatórios avançados**: 5 telas novas em `/relatorios` — Analítico mês a mês, Balanço anual, Fluxo projetado, Despesas parceladas e Orçamento (com valor planejado editável por categoria/mês, tabela nova `Budget` no banco). Novo grupo "Relatórios" no menu lateral.

### Corrigido
- **Bug real de dados**: lançamentos importados por CSV nunca recebiam o agrupamento de parcelas (`groupId`), deixando-os invisíveis em "Despesas parceladas" e "Dívidas". Corrigido daqui para frente (o importador agora agrupa por carteira/categoria/descrição/total de parcelas) e retroativamente (script de correção — 24 grupos criados, 174 lançamentos corrigidos; 2 casos ambíguos deixados de fora para revisão manual).
- **"MERCADO LIVRE" ausente em Dívidas**: os 2 casos ambíguos acima eram, na prática, compras diferentes com a mesma loja/quantidade de parcelas (a descrição genérica não distingue uma compra da outra). O agrupamento agora também considera o valor da parcela (com tolerância de 2 centavos para o resto da divisão) — 4 compras parceladas reais de Mercado Livre passam a aparecer em Dívidas, separadas corretamente.
- **Painel — Reserva de Emergência**: a seção usava um cálculo próprio (despesa média × 6 meses), ignorando a Meta de reserva real cadastrada pelo usuário. Substituída pela seção "Metas", que usa sempre os mesmos números já visíveis em Patrimônio → Metas.
- **Linguagem do sistema**: revisão geral de textos e comentários de código para a norma culta da língua portuguesa (contrações informais como "pra"/"pro" substituídas por "para"/"para o"/"para a"), incluindo textos de e-mail transacional (convite) e mensagens de erro.
- Governança documental do projeto: `MANUAL-DE-USO.md`, `REGISTRO-OPERACIONAL.md`, `CHANGELOG.md`, `TERMOS-DE-USO.md` e `RUNBOOK-OPERACIONAL.md` criados; placeholders do `TERMOS-DE-USO.md` preenchidos em conjunto com o dono do produto (foro, contato, vínculo com consultores, direito de arrependimento, mecanismo de bloqueio por inadimplência); e-mail do encarregado (DPO) sincronizado em `/politica-privacidade`.
- Menu lateral (`Sidebar`) passou a funcionar também no mobile, como drawer deslizante — substitui a barra inferior antiga (`MobileNav`, removida).

### Corrigido
- Bug de build encontrado durante os Relatórios: um Client Component (`BudgetTable`) importava um utilitário que arrastava o runtime do Prisma pro bundle do navegador, quebrando `npm run build`. Corrigido com um formatter de moeda local ao componente.
- Overflow horizontal real da página no mobile (causa do navegador "dar zoom out" sozinho): faltava `min-w-0` em vários containers flex/grid (layout raiz, seletor de workspace, `RankingList`, grid do Top 5 receitas/despesas).
- Cores dos chips de compromisso no calendário (verde/vermelho sólido) e fundo do card da grade do calendário, sem contraste antes.

---

## 2026-08-07

### Adicionado
- Nova aba **Calendário** em Compromissos — grade mensal com navegação por mês, até 3 compromissos por dia, clique no dia abre a lista completa.
- Exportação de dados pessoais (LGPD, portabilidade) em **JSON ou PDF**, incluindo agora os lançamentos financeiros das workspaces onde a pessoa é titular/membro/leitura (exclui workspaces onde é só consultor).
- Página pública `/politica-privacidade` (rascunho estruturado pela LGPD, com placeholders para o CEO preencher).
- Checkbox obrigatório de aceite da política de privacidade no cadastro, com trava (`/aceitar-politica`) para contas antigas e login via Google.
- Formulário de dados pessoais (telefone, CPF, data de nascimento, endereço com busca automática por CEP), compartilhado entre "Minha conta" e o admin editando qualquer usuário.

### Alterado
- "Minha conta" passou a identificar workspaces pelo nome do titular (2 primeiros nomes + e-mail) em vez do nome do workspace.

### Corrigido
- Overflow horizontal no header mobile quando há mais de um workspace, e no conteúdo largo do calendário.

---

## 2026-08-06

### Adicionado
- Nova aba **Admin → Consultores** — visão em árvore de "quem atende quem".
- `assignAdvisor()` generalizado: qualquer workspace com titular agora pode ganhar/trocar consultor depois da criação (antes só era possível no pré-cadastro).
- Botão de promover/remover admin da plataforma em `/admin/usuarios`.

### Segurança
- Chave nova gerada no Brevo por precaução; chave antiga revogada.

---

## 2026-08-05

### Adicionado
- Confirmação de senha no cadastro.
- Infraestrutura de e-mail transacional própria do app (Brevo via API HTTP).
- Convite de cliente por e-mail de verdade (antes só gerava link manual) com botão "Reenviar convite".
- Exclusão de conta self-service e pelo admin (`deleteAccount`/`deleteAccountAsAdmin`), com confirmação obrigatória digitando "EXCLUIR".
- Login social com Google.
- Seção "Meus clientes" em "Minha conta" para o consultor (ADVISOR) trocar de workspace com um clique.

### Corrigido
- Convite para e-mail que já tinha conta falhava silenciosamente — agora cai para magic link automaticamente.
- Causa raiz de "nenhum e-mail chega em produção": `BREVO_API_KEY` errada na Vercel.

---

## 2026-08-04

### Adicionado
- Domínio próprio `prospectafinance.com.br` configurado ponta a ponta (DNS, DKIM, DMARC) — resolve o problema histórico de e-mail de confirmação não chegar.
- Nova tela `/admin/clientes` — pré-cadastro de cliente de consultoria (workspace + assinatura + convite `TITULAR`, consultor opcional).
- Expiração real de convites (`WorkspaceInvite.expiresAt`, 7 dias).

### Corrigido
- `resolveActiveMembership()`: fallback não filtrava por `status === "ACTIVE"`, então revogar uma membership de teste não tinha efeito prático.

---

## 2026-08-01 a 2026-08-03

### Adicionado
- **Arquitetura de Identidade, Permissões e Planos** — maior redesenho arquitetural do projeto até então:
  - Etapa 1 (banco): `Profile.platformRole`, `MembershipRole.ADVISOR`, `Membership.status`, tabelas `Plan`/`Feature`/`PlanFeature`/`Subscription`/`Entitlement`/`AccessLog`/`Notification`.
  - Etapa 2 (backend): `can()` (RBAC explícito), `hasFeature()`, `logAccess()`.
  - Etapa 3 (frontend): seletor de workspace (`WorkspaceSwitcher`), cookie de workspace ativo.
  - Catálogo real de planos comerciais: `START`/`PLUS`/`PREMIUM`/`PREMIUM_NEGOCIOS`, com features mapeadas em escada.
- Reformulação completa das telas de Cadastros (editar sob demanda, exclusão em massa, cor por Tipo em Subcategorias, fluxo Tipo→Categoria→Nome).

### Corrigido
- Duplicação de `sort_order` ao reordenar categorias.

---

## 2026-07-31

### Adicionado
- Menu lateral desktop (`Sidebar`), rebranding completo para "PROSPECTA Finance" (nome, logo própria, ícones PWA).
- Painel redesenhado: cards no padrão `#131A47`, "Distribuição por categoria" em anéis de progresso, "Reserva de emergência" em velocímetro SVG.
- Visão Mensal/Anual/Geral no Painel (`?view=`) e gráfico "Provisão" (próximos 6 meses).
- Mostrar/ocultar senha no formulário de login, banner de instalar o PWA.
- Asterisco vermelho nos campos obrigatórios de Lançamento e Transferência.

### Corrigido
- Zoom indevido no mobile (faltava `width`/`initialScale` na viewport).
- Favicon errado (triângulo padrão do Next.js competindo com a logo real).
- Fundo da página renderizando branco em vez de escuro (regra de CSS não-layered vencendo o Tailwind).
- Esgotamento do pool de conexões do Supabase, causa real de 500 em `/lancamentos`.

---

## 2026-07-30

### Adicionado
- CRUD de Lançamentos, importador de CSV, telas de Cadastros.
- Lançamento rápido e Painel (Fase 1, Conversas 3 e 4 do `GUIA-DE-INICIO.md`).
- Permissões, exportação (CSV/XLSX) e responsividade/PWA (Conversa 5).
- Compromissos, reverter importação, transferência entre carteiras, convite de membro, edição in-line (pontas soltas da Fase 1).
- Convite de membro por WhatsApp (link `wa.me`), "Esqueci minha senha", nome no cadastro, painel `/admin/usuarios`.
- **Deploy em produção na Vercel** (`prospecta-finance.vercel.app`).

### Alterado
- Diagnosticada causa raiz do e-mail de confirmação não funcionar (remetente `@gmail.com` não passa DKIM/DMARC em provedor terceiro) — correção adiada de propósito até compra de domínio próprio.

---

## 2026-07-29

### Adicionado
- **Fase 0 — Fundação:** Next.js 16 + Prisma 7 + Supabase Auth/RLS, seed completo da taxonomia (393 combinações Tipo→Categoria→Subcategoria), carteiras, responsáveis, tipos e situações.
- Motor de regras financeiras puras em `lib/finance/` (saldo, período, parcelamento, recorrência, transferência, reserva de emergência, fixa×variável, rankings), com testes automatizados desde o início.
