# Manual de Uso — PROSPECTA Finance

> Guia de como usar o sistema, escrito para quem vai operar a ferramenta no dia a dia —
> não exige conhecimento técnico. Para o funcionamento interno (código, banco de dados,
> arquitetura), ver `PROJECT_STATE.md`. Para o histórico de mudanças, ver `CHANGELOG.md`.
>
> **Este manual deve ser atualizado ao final de toda etapa que muda algo visível ao
> usuário** — uma tela nova, um campo novo, um fluxo que mudou de lugar. Se a mudança é
> só interna (performance, refatoração, correção invisível), ela entra no `CHANGELOG.md`
> mas não necessariamente aqui.

---

## 1. O que é o sistema

O PROSPECTA Finance é uma plataforma de gestão financeira pessoal e familiar: lançamentos
de receitas, despesas, investimentos e outras movimentações, organizados por carteira
(conta, cartão, caixinha), categoria e responsável, com painel de indicadores, controle de
compromissos a vencer e importação/exportação de planilhas.

Acesso: **[URL de produção — preencher quando o domínio final estiver definido]**
(hoje: `https://prospecta-finance.vercel.app`). Funciona em navegador, no computador ou no
celular, e pode ser **instalado como aplicativo** (PWA) — um banner de instalação aparece
na tela de login.

---

## 2. Primeiros passos

### 2.1 Criar conta
Na tela de login, escolha "Criar conta". Informe nome completo, e-mail e senha (com
confirmação). É obrigatório marcar o aceite da Política de Privacidade. Depois de criar a
conta, um e-mail de confirmação é enviado — é preciso clicar no link antes de conseguir
entrar.

Também é possível entrar direto com **Google** ("Entrar com Google"), sem precisar criar
senha.

Ao criar sua conta pela primeira vez (fora de um convite), o sistema cria automaticamente
um workspace pessoal seu, onde você é o **titular**.

### 2.2 Entrar
E-mail e senha, ou Google. Esqueceu a senha? Link "Esqueci minha senha" na tela de login —
você recebe um e-mail com um link para definir uma nova.

### 2.3 Convite
Se você foi convidado por outra pessoa (para participar de um workspace existente, ou
como cliente de um consultor), você recebe um link por e-mail ou WhatsApp. Ao abrir o
link, se ainda não tem conta, você a cria nessa mesma tela (`/definir-senha`); se já tem
conta, basta entrar normalmente — o convite é aceito automaticamente.

---

## 3. Navegação

**Desktop/tablet:** menu lateral fixo à esquerda, com os grupos Painel, Lançamentos,
Compromissos, Cadastros, Admin (só para administradores da plataforma) e Minha conta.

**Celular:** o mesmo menu abre como uma gaveta lateral (drawer) pelo botão de hambúrguer no
topo. Fecha sozinho ao navegar, no X, ou tocando fora dele.

**Trocar de workspace:** se você tem acesso a mais de um workspace (por exemplo, é
consultor de um cliente além de ter seu próprio workspace pessoal), aparece um seletor no
topo do menu — escolha para qual quer ir. Cada cliente de consultoria aparece identificado
pelo **código + os dois primeiros nomes do titular** (ex.: "0008, Fulano de Tal"), para
diferenciar clientes de nomes parecidos. Quando você está em um workspace de cliente como
consultor, um selo indica isso claramente, para evitar lançar algo no lugar errado.

---

## 4. Painel

Tela inicial depois do login. Mostra, para o período selecionado:

- **Cards de Receita, Despesa e Saldo** do período.
- **Saldos por carteira**, agrupados em Contas, Investimentos e Vouchers, mais o saldo
  líquido total.
- **Gráfico "Últimos 6 meses"** — receita × despesa × saldo, sempre fixo em 6 meses.
- **Gráfico "Provisão"** — a mesma visualização, mas projetando os próximos 6 meses a
  partir de hoje (parcelas futuras, recorrências e compromissos agendados).
- **Top 5 receitas e Top 5 despesas** do período.
- **Distribuição por categoria** — anéis de progresso mostrando o peso de cada categoria
  de despesa.
- **Cobertura de fatura** — quanto você tem guardado nas caixinhas vinculadas ao cartão
  versus o que está a pagar nele.
- **Metas** — um velocímetro para cada meta marcada como "Mostrar no Painel" (em
  Patrimônio → Metas), com o saldo atual da caixinha vinculada e o quanto falta para o
  valor-alvo. Sem nenhuma meta marcada, esta seção fica ausente.

**Trocar o período:** navegue por mês, ou use o seletor **Mensal / Anual / Geral** no topo
para ver o mês corrente, o ano inteiro (com navegação de ano) ou todo o histórico.

---

## 5. Lançamentos

Tabela com todos os seus lançamentos, filtrável por período, tipo, categoria, carteira,
responsável, situação e texto livre.

**No desktop (telas ≥768px):**
- Marque uma ou mais linhas com o checkbox para usar as **ações em lote**: excluir, ou
  marcar como pago/recebido.
- Clique em um campo da linha (descrição, categoria, subcategoria, responsável, situação,
  vencimento, valor) para **editar direto na tabela**, sem abrir outra tela.

**No celular:** a tela funciona como consulta (somente leitura); lançar e editar em massa
é feito no desktop.

**Exportar:** botão "Exportar" respeita os filtros ativos na tela — escolha CSV (dados
crus, útil para reimportar) ou XLSX (planilha formatada, pronta para abrir no Excel).

---

## 6. Novo lançamento (lançamento rápido)

Botão flutuante **+**, disponível em qualquer tela do produto. Pensado para ser rápido no
celular:

1. Escolha o tipo — **Despesa, Receita, Investimento ou Outro** (os 4 botões no topo).
2. Digite o valor (sempre positivo — você nunca digita o sinal; o sistema aplica
   automaticamente conforme o tipo). Investimento e Outro têm um botão para inverter o
   sinal, já que não têm uma dicotomia natural como Despesa/Receita.
3. Carteira e categoria vêm pré-preenchidas com a última usada e uma sugestão baseada no
   texto da descrição (se você já lançou "Padaria" várias vezes, a categoria certa aparece
   sozinha).
4. Data de vencimento e situação (pago/a pagar) são calculadas automaticamente pelo tipo de
   carteira escolhida — conta/dinheiro assume pago hoje; cartão de crédito assume a pagar
   na fatura vigente.
5. Campos avançados (parcelamento, recorrência, observação, responsável diferente) ficam em
   "Mais opções".

Para lançar em várias parcelas ou como uma assinatura recorrente, use as opções avançadas —
o sistema gera automaticamente todas as ocorrências vinculadas (mesmo "grupo"), o que
depois permite ver ou editar o compromisso inteiro de uma vez.

---

## 7. Transferência entre carteiras

Tela própria (`Lançamentos → Transferir`) para mover dinheiro entre suas próprias
carteiras — por exemplo, guardar dinheiro numa caixinha, ou fazer um saque. Informe origem,
destino, valor, data e responsável. O sistema cria as duas pontas da movimentação
automaticamente; isso **não conta como receita nem despesa** no seu resultado do período —
é só o dinheiro trocando de lugar.

---

## 8. Importar planilha (CSV) ou extrato bancário (OFX)

Botão "Importar" na tela de Lançamentos. O sistema detecta o formato pela extensão do
arquivo enviado.

**CSV** — fluxo em 4 passos:

1. **Enviar o arquivo** (.csv).
2. **Conferir o mapeamento de colunas** — o sistema já reconhece os nomes usados
   normalmente (Compra, Vence, Tipo de Carteira, Categoria, etc.) e você corrige se algo
   estiver diferente.
3. **Revisar a prévia** — linhas com erro (data inválida, carteira que não existe) ficam
   bloqueadas; linhas com aviso (possível duplicata, sinal do valor estranho para o tipo)
   entram sinalizadas, mas podem ser importadas.
4. **Confirmar** — só as linhas válidas entram, em um lote atômico.

**OFX** (.ofx/.qfx, extrato exportado do banco) — o arquivo não traz carteira,
responsável nem categoria por lançamento, então antes de validar você escolhe uma vez
para o extrato inteiro:

- **Carteira** e **Responsável** — aplicados a todos os lançamentos do arquivo.
- **Categoria padrão para despesas** e **para receitas** — usadas só quando não houver
  histórico de categoria para aquela descrição no sistema; quando você já lançou a mesma
  descrição antes (ex.: "MERCADO LIVRE"), a categoria já usada é sugerida automaticamente.
- Se a carteira escolhida for um **cartão de crédito**, o vencimento de cada compra é
  calculado pela fatura certa (fechamento/vencimento da carteira), não pela data da
  compra em si.
- Lançamentos que caíram na categoria padrão (sem histórico) ficam marcados com um aviso
  e aparecem em **Compromissos → Incidentes** para você confirmar ou corrigir a
  categoria depois.

Em ambos os formatos, se algo deu errado, o lote inteiro pode ser **revertido com um
clique**, na tela de Importar — desde que nenhum dos lançamentos importados já tenha
sido editado depois.

---

## 9. Compromissos

Mostra o que está vencendo: **vencidos, hoje, próximos 7 e próximos 30 dias**. Um toque em
"Marcar como pago/recebido" resolve o compromisso sem precisar abrir o lançamento.

**Aba Calendário:** a mesma informação em uma grade mensal — navegue entre meses, clique em
um dia para ver a lista completa daquele dia (com destaque em vermelho para os vencidos).

**Aba Incidentes:** lançamentos que precisam de revisão manual — parcelas sem par
encontrado (por exemplo, uma parcela sem nenhuma outra correspondente — mesma carteira,
categoria, descrição e valor) ou lançamentos importados de OFX que caíram na categoria
padrão por falta de histórico (§8). Cada linha
mostra o motivo e dois botões: **"Confirmar que está correto"** (se a linha realmente está
assim mesmo, some da lista sem alterar nada) ou **"Editar"** (formulário completo da
linha — carteira, categoria, subcategoria, responsável, descrição, valor, datas, situação
e o número/total de parcelas, que não é editável na tela normal de Lançamentos). Ao
corrigir uma linha, o sistema tenta combiná-la de novo com a parcela irmã automaticamente
— se a correção resolveu o problema, as duas saem da lista sozinhas.

**Integração com o Google Agenda:** no topo da aba Calendário, clique em "Conectar Google
Agenda" e autorize o acesso na sua conta Google (autorização própria, separada do
"Continuar com Google" do login — pede permissão específica para criar eventos). O sistema
cria um calendário próprio chamado "PROSPECTA Finance" na sua conta e passa a enviar para
lá, em tempo real, todo compromisso a pagar/a receber: criar, editar ou pagar/receber um
lançamento atualiza o evento correspondente na hora. Quando você marca um compromisso como
pago ou recebido, o evento **some** da agenda — ele deixa de precisar de atenção, não fica
marcado como concluído. Para desconectar, use o botão "Desconectar" no mesmo lugar: o
calendário dedicado é apagado e nenhum novo evento é enviado até conectar de novo.

---

## 10. Relatórios

Cinco telas de análise, acessíveis pelo grupo "Relatórios" no menu lateral, cada uma com
navegação de ano/mês e alternância entre regime Caixa e Competência (igual ao Painel):

- **Analítico mês a mês:** Receita, Despesa, Investimento e Saldo lado a lado, um mês em
  cada coluna, com o total do ano.
- **Balanço anual:** o mesmo resumo acima ("sintético"), mais uma tabela "descritivo por
  categoria" — quanto você gastou em cada categoria, mês a mês, ao longo do ano.
- **Fluxo projetado:** o saldo líquido de hoje, projetado para os próximos meses (escolha
  6, 12 ou 24), considerando parcelas, recorrências e compromissos já lançados — ajuda a
  responder "daqui a 6 meses, quanto sobra?".
- **Despesas parceladas:** todo financiamento ou compra parcelada que ainda não terminou de
  pagar — quantas parcelas já foram pagas, quantas faltam, quanto ainda falta pagar e a
  data da última parcela. Parcelamentos já quitados não aparecem aqui.
- **Orçamento:** defina quanto planeja gastar em cada categoria por mês (clique em
  "Editar" na linha da categoria) e acompanhe o realizado, a diferença e o percentual já
  usado — fica vermelho quando passa do orçado, âmbar perto do limite.

Todas as cinco telas têm um botão **"Baixar PDF"**, que gera um relatório com a mesma
informação da tela, identidade visual da PROSPECTA Finance e um aviso de que o documento
tem finalidade informativa, sem constituir recomendação de investimento.

---

## 11. Patrimônio (Bens, Metas e Dívidas)

Três telas de acompanhamento de longo prazo, no grupo "Patrimônio" do menu lateral. Assim
como os Relatórios, cada uma tem um botão **"Baixar PDF"** próprio.

### 11.1 Bens

Lista de bens (imóveis, veículos, investimentos registrados manualmente, etc.), cada um com
o valor atual (soma de todos os lançamentos de aquisição e valorização/desvalorização
ligados a ele) e um **gráfico de evolução patrimonial** — o valor acumulado do seu
patrimônio total, ponto a ponto, ao longo do tempo.

Cada bem aparece em um cartão travado para edição: os dados ficam visíveis, mas somente
leitura, até você clicar em **"Editar"**; depois de alterar, clique em **"Salvar"** para
confirmar (ou "Cancelar" para descartar). Botões **"Arquivar"** (mantém o histórico, tira da
lista ativa) e **"Excluir"** (remove de vez, junto com o histórico de valorizações) ficam
sempre visíveis, fora da trava de edição.

### 11.2 Metas

Cada meta tem um velocímetro de progresso (saldo atual da caixinha vinculada versus o
valor-alvo) e, se definida, uma data-alvo. Mesma trava de edição de Bens: clique em
"Editar" para alterar nome, valor-alvo ou data, depois "Salvar". Um checkbox **"Mostrar no
Painel"**, fora da trava de edição, decide se aquela meta aparece na seção "Metas" do
Painel — marque quantas quiser, ou nenhuma.

Uma meta de reserva de emergência é uma meta como qualquer outra: crie uma vinculada à
caixinha de reserva, com o valor-alvo real que você quer atingir. Sem essa meta criada,
nenhum indicador de reserva aparece em lugar nenhum do sistema.

### 11.3 Dívidas

Somente leitura — pensada para você (e, se tiver, seu consultor) enxergarem a magnitude das
dívidas em aberto. Considera **despesas parceladas com duas ou mais parcelas** (financiamentos,
compras parceladas) que ainda não terminaram de pagar; parcelamentos já quitados não
aparecem.

- **Dívida total em aberto**, **compromisso mensal** (soma das próximas parcelas de cada
  dívida) e **percentual da despesa mensal média** comprometido com dívidas, no topo.
- **Gráfico de diminuição** — o saldo devedor combinado de todas as dívidas em aberto,
  caindo ao longo do tempo até a última parcela.
- Tabela com cada dívida, ordenada da maior para a menor: total contratado, parcelas pagas
  e restantes, valor restante, próxima parcela e prazo final.

---

## 12. Cadastros

Telas de configuração, cada uma com regra própria de quem pode editar:

| Tela | Quem pode criar/editar |
|---|---|
| **Carteiras** | Qualquer membro do workspace |
| **Responsáveis** | Qualquer membro do workspace |
| **Categorias** | Só administrador da plataforma |
| **Subcategorias** | Só administrador da plataforma |
| **Tipos** (rótulo de Receita/Despesa/Investimento/Outro) | Só administrador da plataforma |
| **Membros** | Titular do workspace ou administrador |

Em **Membros**, você convida outra pessoa para o seu workspace (link ou botão "Enviar por
WhatsApp"), escolhendo o papel dela: Membro (lança e vê), Leitura (só vê) ou Consultor
(acesso equivalente a membro, com registro de auditoria de cada acesso).

Itens que já foram usados em algum lançamento não são excluídos — são **arquivados**, para
preservar o histórico.

---

## 13. Minha conta

- **Dados pessoais:** nome, telefone, CPF, data de nascimento, endereço (com busca
  automática pelo CEP). Campos ficam bloqueados até clicar em "Editar"; deixar um campo em
  branco e salvar apaga essa informação.
- **Seus usuários do sistema:** lista dos workspaces onde você tem acesso.
- **Meus clientes da consultoria:** se você é consultor (papel ADVISOR) de algum
  workspace, aparece aqui, com botão "Entrar como consultor" para trocar de contexto.
- **Privacidade e dados (LGPD):** botão para baixar todos os seus dados pessoais e
  financeiros em JSON ou PDF; link para a Política de Privacidade.
- **Zona de risco:** exclusão de conta. Digite "EXCLUIR" para confirmar — a ação é
  definitiva. Se você é o único titular de um workspace, o workspace inteiro (com todos os
  lançamentos) é apagado junto.

---

## 14. Administração (só para administrador da plataforma)

- **`/admin/usuarios`** — todos os usuários cadastrados no sistema: **código do cliente**
  (número sequencial imutável, atribuído automaticamente ao workspace de cada pessoa ou
  família), nome, e-mail, se é admin, workspaces e papel em cada um, e-mail confirmado,
  data de cadastro, último login. Permite editar dados pessoais de qualquer pessoa,
  promover/remover admin, atribuir consultor, excluir conta.
- **`/admin/clientes`** — cria o pré-cadastro de um novo cliente de consultoria: workspace
  novo, plano escolhido, consultor responsável opcional, e um link/WhatsApp de convite para
  o cliente.
- **`/admin/consultores`** — visão em árvore de quem atende quem: um card por consultor com
  a lista de clientes atendidos.

---

## 15. Segurança e privacidade

Toda a base do sistema segue a Lei Geral de Proteção de Dados (LGPD). Detalhes completos em
`/politica-privacidade` (dentro do sistema) e no rascunho jurídico `TERMOS-DE-USO.md`. Em
resumo: seus dados financeiros são seus, você pode exportá-los ou apagá-los a qualquer
momento, e todo acesso de um consultor ou administrador ao seu workspace fica registrado.

---

## 16. Dúvidas frequentes

**Lancei um valor errado, como corrijo?**
No desktop, edite direto na tabela de Lançamentos. No celular, abra o lançamento pela tela
de Compromissos ou peça para alguém corrigir no desktop (edição in-line ainda não existe no
celular).

**Importei um lote errado, como desfaço?**
Tela de Importar → botão de reverter no lote, desde que nenhum lançamento dele tenha sido
editado depois.

**Esqueci a senha.**
Tela de login → "Esqueci minha senha" → link chega por e-mail.

**Não recebi o e-mail de confirmação/convite.**
Confira a caixa de spam. Se não chegar, avise o administrador — pode haver um problema
pontual de entrega (ver `RUNBOOK-OPERACIONAL.md`, seção de incidentes conhecidos).

**Como saio de um workspace ou removo meu acesso?**
Fale com o titular do workspace (ele pode remover seu convite/membership em Cadastros →
Membros) ou exclua sua própria conta em Minha conta → Zona de risco.
