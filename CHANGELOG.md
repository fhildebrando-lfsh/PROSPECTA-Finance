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

## 2026-08-09

### Adicionado
- **Integração com o Google Agenda**: em Compromissos → Calendário, é possível conectar o Google Agenda do cliente (autorização própria, separada do login com Google) — o sistema cria um calendário dedicado "PROSPECTA Finance" na conta dele e passa a enviar, em tempo real, todo compromisso a pagar/a receber. Ao liquidar (pagar/receber) um lançamento, o evento correspondente some da agenda em vez de ficar marcado como concluído. Botão "Desconectar" apaga o calendário dedicado e revoga o acesso.

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
