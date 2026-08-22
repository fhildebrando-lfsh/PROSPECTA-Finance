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
um workspace pessoal seu, onde você é o **titular** — mas, desde 2026-08-12, o acesso
fica pausado até um administrador aprovar (o administrador recebe um e-mail avisando na
hora do cadastro). Enquanto isso, ao tentar entrar, você vê uma tela explicando que o
acesso está aguardando aprovação. Quem entra por um **convite** (veja 2.3 abaixo) não
passa por essa espera — já fica com acesso liberado assim que cria a senha.

### 2.2 Entrar
E-mail e senha, ou Google. Esqueceu a senha? Link "Esqueci minha senha" na tela de login —
você recebe um e-mail com um link para definir uma nova.

### 2.3 Convite
Se você foi convidado por outra pessoa (para participar de um workspace existente, ou
como cliente de um consultor), você recebe um link por e-mail ou WhatsApp. Ao abrir o
link, se ainda não tem conta, você a cria nessa mesma tela (`/definir-senha`); se já tem
conta, basta entrar normalmente — o convite é aceito automaticamente.

Quando o workspace já tem um plano comercial definido (Individual ou Família, 2026-08-15),
o número de pessoas é limitado por ele — Individual permite só o titular, Família até 5. Se
o limite já estiver atingido, o convite não pode ser criado (ou fica pendente, sem aceitar,
se a pessoa convidada tentar entrar depois do limite ter sido atingido); libera espaço
removendo alguém, ou faça upgrade pro Plano Família. Workspaces sem plano nenhum
definido não têm esse limite.

---

## 3. Navegação

**Desktop/tablet:** menu lateral fixo à esquerda, na seguinte ordem: **Painel**, **Saúde
Financeira**, **Assistente**, **Lançamentos**, **Compromissos**, **Cartões de Crédito**,
**Relatórios**, **Patrimônio**, **Investimentos**, **Proteção e Segurança**, **Método**,
**Cadastros**, **Admin** (só para administradores da plataforma) e **Minha conta**.

Nem todo grupo aparece para todo mundo. **Proteção e Segurança** depende do plano
(a partir do Max) e **Método** depende de haver uma consultoria ativa — ver §12-A e §13-A.

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

- **Cards de Receita, Despesa, Investimento e Balanço** do período — só o que já foi
  efetivamente recebido/pago (situação Pago/Recebido/Isento/Aquisição/Atualização);
  lançamento a pagar ou a receber não entra nesses totais. O **Balanço desconta o
  Investimento** (`Receita + Despesa − Investimento`) — um aporte tira dinheiro da
  carteira disponível, só volta a contar como líquido se for resgatado; uma retirada, ao
  contrário, aumenta o Balanço.
- **Saldos por carteira**, agrupados em Contas, Investimentos e Vouchers, mais o saldo
  líquido total.
- **Gráfico "Últimos 6 meses"** — barras de receita (verde) e despesa (vermelha, sempre
  acima do zero, pra facilitar a comparação visual), linha de saldo (dourada) e linha de
  investimento (branca, pode aparecer abaixo de zero num mês de retirada) — tudo já
  liquidado, sempre fixo em 6 meses.
- **Gráfico "Provisão"** — mesmo formato do gráfico acima, mas projeta os próximos 6
  meses a partir de hoje somando só o que ainda está **pendente** (a pagar/a receber/
  estimativa) — é sempre uma expectativa, nunca mistura com o que já aconteceu.
- **Top 5 receitas e Top 5 despesas** do período — só liquidado, mesmo critério dos cards.
- **Distribuição por categoria** — anéis de progresso mostrando o peso de cada categoria
  de despesa já liquidada.
- **Cobertura de fatura** — quanto você tem guardado nas caixinhas vinculadas ao cartão
  versus o que está a pagar nele.
- **Metas** — um velocímetro para cada meta marcada como "Mostrar no Painel" (em
  Patrimônio → Metas), com o saldo atual da caixinha vinculada e o quanto falta para o
  valor-alvo. Sem nenhuma meta marcada, esta seção fica ausente.

**Trocar o período:** navegue por mês, ou use o seletor **Mensal / Anual / Geral** no topo
para ver o mês corrente, o ano inteiro (com navegação de ano) ou todo o histórico.

### 4.1 Saúde Financeira (novo, 2026-08-15; a partir do plano Pro)

Sete indicadores gerenciais que traduzem sua situação financeira numa leitura visual e
comparável ao longo do tempo — cinco já disponíveis: **Organização** (qualidade e
regularidade dos seus lançamentos), **Endividamento** (peso das dívidas sobre sua renda),
**Liquidez** (quantos meses seu saldo disponível cobre de despesa), e, a partir do Max,
**Proteção** e **Construção Patrimonial**. **Longevidade** passou a ser calculada a partir do seu Plano de Longevidade (§12.6) —
sem uma projeção salva ela aparece como "não avaliado", nunca como nota ruim.
Continuidade só existe com um consultor ativo.

Cada indicador aparece numa escala de 5 faixas — Crítico, Frágil, Em construção, Saudável,
Consolidado — nunca uma nota exata de 0 a 10: é um indicador gerencial, não um score de
crédito nem diagnóstico clínico, e compara você só com você mesmo ao longo do tempo, nunca
com outros clientes. Indicador sem dado suficiente aparece como "não avaliado"; indicador
de um nível que seu plano não inclui aparece como "disponível no Max" — os dois estados são
visualmente diferentes de propósito.

Abaixo de cada indicador há uma **barra de cinco degraus**, um por faixa, mostrando em qual
deles você está. Os degraus são separados de propósito, em vez de uma barra contínua: a
escala é ordinal, e uma barra lisa daria a impressão de que a distância entre "frágil" e
"em construção" é uma quantidade mensurável — é a mesma razão pela qual não existe nota de
0 a 10 aqui.

Quando há uma foto anterior salva, o card também diz **se o indicador mudou de nível** desde
ela: "↑ subiu um nível desde a última foto", "↓ caiu dois níveis", ou "mesmo nível da última
foto". Essa é a leitura que importa — o número isolado diz pouco, a direção diz muito.

Se não houver foto anterior, ou se o indicador estava "não avaliado" numa das duas pontas,
**nada é dito**. O sistema não escreve "estável" nesse caso: não saber se mudou é diferente
de saber que não mudou, e um indicador que passou a ter dado não "subiu" — ele apenas
passou a existir.

Botão **"Salvar no histórico"** grava uma foto dos indicadores na data de hoje — é o que
permite comparar "como eu estava" com "como estou agora" mais adiante.

### 4.2 Assistente (novo, 2026-08-15; a partir do plano Max)

Duas ferramentas na mesma tela, sempre no espírito de **avisar, nunca agir sozinho**.

**Pergunte em português simples:** saldo total, quanto você recebeu ou gastou no mês
(geral ou de uma categoria específica), quanto falta pra sua reserva chegar no valor-alvo,
quantos incidentes estão pendentes de revisão. A resposta usa sempre os mesmos cálculos que
alimentam o Painel e os Relatórios — o assistente nunca "inventa" um número. Toda pergunta e
resposta fica registrada no histórico da própria tela, para você conferir depois. **Não
recomenda produto ou ativo específico:** se a pergunta parecer pedir isso ("em que eu
invisto", "que ação comprar"), o assistente recusa e explica que diagnóstico é papel da
PROSPECTA, indicação de investimento é papel de um profissional licenciado.

O histórico tem um botão **"Limpar histórico"**, que apaga todas as perguntas do workspace.
Ele pede confirmação antes, porque é irreversível. O registro existe para auditoria — cada
resposta guarda a consulta que a gerou —, mas o dado é seu: apagar é um direito seu, e o que
a auditoria garante é que uma resposta **não pode ser reescrita**, o que continua valendo
(aqui só se apaga, nunca se edita). Exige permissão de escrita: quem tem acesso só de
leitura não apaga histórico dos outros.

**Automações:** 5 tipos de alerta que você liga e desliga conforme sua necessidade —
gasto de uma categoria passou de um valor, compromisso vencendo em N dias, valor de uma
recorrência mudou (ex.: assinatura que subiu de preço), meta abaixo do ritmo esperado para
a data-alvo, fila de Incidentes acumulando. Avaliados uma vez por dia; cada disparo vira um
aviso — o sistema nunca cria, edita, paga ou transfere nada por conta própria.

No alerta de **gasto de categoria** você escolhe a janela: **por mês**, **por semana** ou
**por dia**. A semana é a de calendário, de segunda a domingo, e não os últimos sete dias
corridos — quem define um teto semanal pensa em "esta semana", e uma janela que anda todo
dia faria o alerta acender e apagar sozinho sem nada ter mudado. Regras criadas antes deste
seletor continuam mensais, exatamente como eram.

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

## 8. Importar planilha (CSV), extrato bancário (OFX) ou fatura de cartão (PDF)

Botão "Importar" na tela de Lançamentos (ou "Importar fatura" direto na tela de um cartão,
em Cartões de Crédito). O sistema detecta o formato pela extensão do arquivo enviado.

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

**PDF** (fatura de cartão de crédito) — só disponível para carteiras de cartão já
cadastradas em Cartões de Crédito:

1. **Enviar o arquivo** (.pdf) e confirmar que é uma fatura de cartão de crédito.
2. **Escolher o cartão, o responsável e as categorias padrão** (mesma lógica do OFX).
3. Se o PDF tiver senha, informar a senha e marcar o **termo de consentimento** — a senha
   é usada só para abrir o arquivo naquele momento, nunca é salva em lugar nenhum (nem o
   arquivo em si sai do seu computador; só as compras já lidas são enviadas).
4. O sistema lê a fatura e sugere os lançamentos, com o vencimento calculado pela fatura
   certa. Compras parceladas: a primeira vez que uma parcela aparece, todas as parcelas
   futuras já são lançadas de uma vez; nos meses seguintes, a mesma parcela reaparecendo
   na fatura é reconhecida e não duplicada.
5. **Revisar a prévia e confirmar**, igual aos outros formatos.

Cada banco tem um formato de fatura diferente — a leitura de um banco específico só fica
disponível depois de configurada; se o seu banco ainda não tem suporte, você verá um
aviso na tela. Bancos com suporte hoje: Nubank, Casas Bahia/Bradescard, Porto Seguro,
Itaú (Signature e PDA) e Santander (incluindo as variantes 123 e Free).

Em todos os formatos, se algo deu errado, o lote inteiro pode ser **revertido com um
clique**, na tela de Importar — desde que nenhum dos lançamentos importados já tenha
sido editado depois.

---

## 9. Compromissos

Mostra o que está vencendo: **vencidos, hoje, próximos 7 e próximos 30 dias**. Um toque em
"Marcar como pago/recebido" resolve o compromisso sem precisar abrir o lançamento. Um
filtro de datas (De/Até, por vencimento) restringe a lista a um período específico. Cada
linha tem uma caixa de seleção — marque várias e use "Marcar como pago/recebido" no topo
para resolver todas de uma vez ("Selecionar todos" marca a lista inteira).

**Aba Calendário:** a mesma informação em uma grade mensal — navegue entre meses, clique em
um dia para ver a lista completa daquele dia (com destaque em vermelho para os vencidos).

**Aba Incidentes:** lançamentos que precisam de revisão manual — parcelas sem par
encontrado (por exemplo, uma parcela sem nenhuma outra correspondente — mesma carteira,
categoria, descrição e valor) ou lançamentos importados de OFX/PDF que caíram na categoria
padrão por falta de histórico (§8). Também tem filtro de datas (De/Até, por vencimento) e
caixa de seleção por linha para confirmar várias de uma vez ("Confirmar selecionados").
Cada linha mostra o motivo e dois botões: **"Confirmar que está correto"** (se a linha
realmente está assim mesmo, some da lista sem alterar nada) ou **"Editar"** (formulário
completo da linha — carteira, categoria, subcategoria, responsável, descrição, valor,
datas, situação e o número/total de parcelas, que não é editável na tela normal de
Lançamentos). No formulário de edição, **"Salvar"** grava as correções mas mantém a linha
pendente (para você conferir de novo depois); **"Salvar e Confirmar"** grava as correções
e já tira a linha da lista, como se tivesse clicado em "Confirmar que está correto" depois
de editar. Ao corrigir uma linha (por qualquer um dos dois botões), o sistema tenta
combiná-la de novo com a parcela irmã automaticamente — se a correção resolveu o problema,
as duas saem da lista sozinhas.

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

## 10. Cartões de Crédito

Grupo próprio no menu lateral, com duas abas.

**Meus Cartões:** cada cartão aparece como um cartão visual, com a imagem cadastrada (ou
uma cor com a inicial do banco, se não tiver imagem), a fatura vigente e o vencimento.
Clique num cartão para ver:

- A fatura vigente e o histórico das últimas faturas fechadas.
- Um **seletor de mês** para conferir qualquer fatura, passada ou futura, lançamento a
  lançamento — útil para bater com o que o banco mostrou de verdade. Cada linha tem um
  botão "Editar": a descrição que veio da fatura fica sempre travada (é o que o banco
  imprimiu, não dá pra mudar), mas você pode personalizar a descrição, a categoria e a
  subcategoria. Essa personalização é lembrada — da próxima vez que a mesma descrição do
  banco aparecer em qualquer fatura importada (de qualquer cartão), já vem com a
  personalização aplicada, sem precisar editar de novo.
- Os dados cadastrais (instituição, dia de fechamento/vencimento, limite, anuidade,
  programa de pontos) ficam travados até clicar em "Editar", com botões Salvar/Cancelar.
- O botão "Importar fatura" (ver §8).
- Arquivar (some da lista sem perder histórico) ou excluir (só se o cartão nunca teve
  lançamento).

**"+ Novo cartão"** cadastra um cartão novo — nome, instituição financeira (ou digite uma
nova, se o seu banco ainda não estiver na lista), imagem (opcional, até 2MB), dia de
fechamento/vencimento, limite, e os dados de anuidade/pontos usados na Análise de
Benefícios. Todo cartão cadastrado aqui também aparece em Cadastros → Carteiras
automaticamente — é a mesma carteira, só com esses dados extras.

**Análise de Benefícios:** compara, para cada cartão com anuidade e programa de pontos
preenchidos, se o que você ganha em pontos/milhas compensa a anuidade — calculado sobre o
seu **gasto real** dos últimos 12 meses naquele cartão, não uma estimativa do banco.
Benefício líquido positivo (verde) significa que o cartão está compensando; negativo
(vermelho), que a anuidade está custando mais do que os pontos valem.

---

## 11. Relatórios

Cinco telas de análise, acessíveis pelo grupo "Relatórios" no menu lateral. As quatro
primeiras têm navegação de ano/mês e alternância entre regime Caixa e Competência (igual
ao Painel):

- **Balanço anual:** Receita, Despesa, Investimento e Saldo lado a lado, um mês em cada
  coluna, com o total do ano ("sintético"), mais uma tabela "descritivo por categoria" —
  quanto você gastou em cada categoria, mês a mês, ao longo do ano. Só o que já foi
  liquidado — é um relatório do que realmente aconteceu, não do que estava previsto.
- **Fluxo projetado:** o saldo líquido de hoje, projetado para os próximos meses (escolha
  6, 12 ou 24), somando só o que ainda está pendente (a pagar/a receber/estimativa) —
  ajuda a responder "daqui a 6 meses, quanto sobra?".
- **Despesas parceladas:** todo financiamento ou compra parcelada que ainda não terminou de
  pagar — quantas parcelas já foram pagas, quantas faltam, quanto ainda falta pagar e a
  data da última parcela. Parcelamentos já quitados não aparecem aqui.
- **Orçamento:** defina quanto planeja gastar em cada categoria por mês (clique em
  "Editar" na linha da categoria) e acompanhe o realizado, a diferença e o percentual já
  usado — fica vermelho quando passa do orçado, âmbar perto do limite.
- **Régua de Alocação** (novo, 2026-08-15; a partir do plano Pro desde 2026-08-15): como
  sua receita do mês se distribuiu entre quatro blocos — Essenciais, Estilo de vida,
  Obrigações e Poupança e Patrimônio — com uma faixa de referência calibrada pela sua
  própria receita do período (ex.: renda até R$ 3.000 tem uma faixa diferente de renda
  acima de R$ 25.000). Mostra se cada bloco está abaixo, dentro ou acima da faixa de
  referência, e destaca separadamente qualquer despesa ainda sem bloco definido ou receita
  que não virou despesa nem aporte no período. Só navegação de mês (sem regime nem PDF,
  por enquanto).

As outras quatro telas têm um botão **"Baixar PDF"**, que gera um relatório com a mesma
informação da tela, identidade visual da PROSPECTA Finance e um aviso de que o documento
tem finalidade informativa, sem constituir recomendação de investimento.

---

## 12. Patrimônio (Bens, Metas, Dívidas e Função do Patrimônio)

Telas de acompanhamento de longo prazo, no grupo "Patrimônio" do menu lateral. Bens, Metas e
Dívidas têm, assim como os Relatórios, um botão **"Baixar PDF"** próprio.

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

- **Filtro de prazo** — Todas, Curto prazo (até 12 parcelas restantes) ou Longo prazo
  (mais de 12 parcelas restantes). Os cards de resumo, o gráfico e a tabela abaixo mudam
  junto com o filtro escolhido; "Baixar PDF" respeita o filtro atual.
- **Dívida total em aberto**, **compromisso mensal** (soma das próximas parcelas de cada
  dívida) e **percentual da despesa mensal média** comprometido com dívidas, no topo.
- **Gráfico de diminuição** — o saldo devedor combinado de todas as dívidas em aberto,
  caindo ao longo do tempo até a última parcela.
- Tabela com cada dívida, ordenada da maior para a menor: total contratado, parcelas pagas
  e restantes, valor restante, próxima parcela e prazo final.

### 11.4 Função do Patrimônio (novo, 2026-08-15; a partir do plano Max)

Enquanto as outras telas respondem "quanto eu tenho", esta responde **"para que serve cada
parte"**. Seus bens, investimentos e carteiras ativas entram num mapa só, cada um recebendo
uma de sete funções:

- **Proteção** — cobre imprevisto sem desmontar o resto.
- **Liquidez operacional** — dinheiro do dia a dia, disponível na hora.
- **Objetivos** — guardado para algo com data e nome.
- **Longevidade** — sustenta você quando a renda do trabalho parar.
- **Crescimento** — aceita oscilar para crescer no longo prazo.
- **Uso** — serve para usar, não para render.
- **Sucessão** — pensado para atravessar gerações.

A função é uma dimensão **independente** do tipo da coisa: dois CDBs iguais podem ter funções
diferentes, porque função é o papel que aquele dinheiro cumpre na sua vida, não o produto que
ele é. Nada nasce classificado — todo bem, investimento e carteira começa como "sem função
definida", e essa é uma resposta válida, não um erro.

A tela aponta sozinha **o que ainda está sem função**, do maior valor para o menor (o que mais
pesa é o que mais vale classificar primeiro), e você classifica ali mesmo: escolha a função no
seletor e ela é salva na hora, sem botão de confirmar. Para desfazer, escolha "— sem função —".
O bloco "Sem função definida" aparece sempre separado dos outros sete, nunca somado dentro
deles.

Cartão de crédito e qualquer outra carteira de dívida ficam de fora — dívida não recebe função
patrimonial.

**O que esta tela não faz:** ela mostra como seu patrimônio está distribuído, mas não diz se
essa distribuição está certa. Avaliar a composição e recomendar mudanças é trabalho de
consultoria — faz parte do Mapa Funcional do Patrimônio completo, que exige um consultor ativo.

---

### 12.5 Mapa de Dívidas — MEC (com consultoria ativa)

Enquanto **Dívidas** mostra o que já está lançado como parcela e responde
*quanto falta pagar*, o **Mapa de Dívidas** responde outra coisa: **quanto
custa, para quem você deve, e em que ordem sair**.

**Por que a ordem importa mais que o tamanho.** Quitar a maior dívida parece
progresso, mas quem manda no seu bolso é o juro. Cada real amortizado na dívida
mais cara rende mais do que na maior — por isso o mapa ordena por **custo**, e
não por saldo.

**O que você registra em cada dívida:** credor, modalidade, saldo devedor, o
**CET ao ano** (está no contrato ou na fatura), a situação (em dia, negativado,
renegociado, quitado), se há ação judicial e uma meta de quitação.

**O CET é o campo que mais importa.** Sem ele o mapa não consegue dizer qual sai
primeiro, e a tela mostra quantas dívidas ainda estão sem esse número. Uma
dívida sem CET vai para o **fim** da fila, nunca para a frente: não saber quanto
custa não é o mesmo que custar pouco.

**Dívidas caras aparecem sinalizadas, com o motivo escrito** — rotativo do
cartão e cheque especial, que são as modalidades mais caras do mercado, ou
juros de três dígitos ao ano.

**Serve para dívidas que não estão no sistema como parcela.** Cheque especial e
rotativo não têm parcelas a lançar — e são justamente os dois casos mais caros.
Eles escapariam de qualquer conta baseada só nos seus lançamentos.

**O mapa diagnostica e ordena; não indica produto nem credor.** Renegociar é
decisão sua com quem você deve.

Dívida paga: prefira marcar como **quitada** a excluir. Ela sai do mapa mas
continua no histórico — o que já foi pago é parte do trabalho.

---

### 12.6 Longevidade (PLA) — com consultoria ativa

Responde duas perguntas: **quanto capital precisa existir** para você parar de
trabalhar na idade que quer com a renda que deseja, e **quanto isso pede de
aporte por mês**.

**Tudo em poder de compra de hoje.** Se a tela diz R$ 2 milhões, são dois
milhões de hoje — não um número inflacionado de trinta anos à frente, que
ninguém sabe interpretar. É por isso que não existe campo de inflação aqui: ela
já está descontada dentro da taxa de retorno usada.

**O que você informa:** sua idade, a idade em que quer parar, a renda mensal
desejada, quanto já acumulou para isso, quanto aporta hoje, e — importante — a
**renda que já existirá** (INSS, previdência, aluguel). Essa última abate o que
o capital precisa produzir: quem terá R$ 4 mil de INSS e quer R$ 10 mil precisa
que o capital gere R$ 6 mil, não R$ 10 mil.

**Três cenários, não um.** A resposta depende de uma premissa que ninguém
conhece: o retorno real dos próximos anos. Mostrar um número só esconderia isso.
Conservador, base e otimista aparecem lado a lado, e a diferença entre eles é
justamente a lição — a premissa muda o tamanho do problema.

**"Até que idade o dinheiro precisa durar"** vem preenchido com 90 anos, bem
acima da média de propósito: o risco que se está tratando aqui é o de **viver
mais** que o dinheiro. Planejar pela expectativa média deixaria metade das
pessoas descoberta.

As taxas de retorno ficam abertas para ajuste, dentro de "Premissas de retorno
real". Elas **não vêm da metodologia** — são ponto de partida, e o consultor
ajusta ao caso.

**Salvar gera uma versão** com os três cenários e as premissas que os
produziram. Versão nova nunca sobrescreve a anterior: é isso que permite mostrar
o que mudou desde a última conversa, e por quê.

**Projeção é hipótese, não promessa.** Ela diz o que aconteceria *se* as
premissas se confirmarem. A PROSPECTA não indica onde investir.

---

## 12-A. Proteção e Segurança (a partir do plano Max)

Menu dedicado a uma pergunta diferente das outras telas: **o que aconteceria com suas
finanças se algo desse errado?** São cinco telas — Reserva de Emergência, Perfil de Risco,
Seguros, Proteções e Benefícios, e Eventos e Recomposição.

No menu, a **Reserva de Emergência** vem primeiro porque é o resultado. Aqui no manual ela
aparece por último, porque as outras quatro são o que a alimenta: fica mais fácil entender
o número depois de saber de onde ele vem.

**Por que não é "seis meses de despesa".** O sistema não multiplica sua despesa por um
número fixo de meses. Ele monta o retrato do seu risco — de onde vem sua renda, quem
depende dela, que proteções você tem, o que já aconteceu com você — e simula o que
aconteceria com o seu caixa em cenários adversos. O valor recomendado é a liquidez que
precisaria existir para você atravessá-los sem se endividar.

Nada aqui é obrigatório. Quanto mais preenchido, mais preciso o cálculo — e o sistema
sempre informa o quanto está confiante, em vez de fingir precisão que não tem.

### 12-A.1 Perfil de Risco

É a base do cálculo da sua Reserva de Emergência. Em vez de multiplicar sua despesa por um
número fixo de meses — três, seis, doze —, o sistema vai analisar de onde vem sua renda,
quem depende dela e o que aconteceria se ela parasse. Para isso precisa conhecer duas coisas
que seus lançamentos não contam.

**O que o sistema já sabe e não vai te perguntar.** No topo de cada pessoa aparece a **renda
observada**: quanto ela recebe por mês, medido nos seus próprios lançamentos, com quantos
meses de histórico existem e o quanto isso é confiável. Esse número usa a **mediana**, não a
média — assim um 13º ou umas férias não fazem parecer que você ganha todo mês mais do que
realmente ganha. Essa distinção importa: superestimar a renda produziria uma reserva menor
do que a necessária.

**O que você informa.** Por pessoa: regime de trabalho (CLT, servidor efetivo, militar,
autônomo, MEI, aposentado e outros), profissão, cargo, setor, há quanto tempo está no
vínculo atual e quanto tempo de experiência tem no total. Esses dois tempos são separados de
propósito — tempo de casa mede estabilidade, experiência total mede a facilidade de
recomeçar em outro lugar, e são coisas diferentes.

Há também um campo para **outra atividade capaz de gerar renda** caso a principal seja
interrompida, com quatro respostas possíveis: já gera renda hoje, gerou recentemente, tenho
formação mas pouca prática, ou é só uma possibilidade. A diferença é importante: só as duas
primeiras entram nos cálculos como renda de verdade. Uma possibilidade teórica não protege
ninguém.

Marque **dependente** para quem não gera renda própria e depende financeiramente da família.

**Fontes de renda.** Cadastre cada fonte com nome, tipo e, opcionalmente, **quem paga** —
empregador ou cliente principal. Esse último campo tem um propósito específico: se duas
pessoas da família recebem da mesma empresa, essas rendas não protegem uma à outra. Se a
empresa fechar, as duas param juntas. O sistema precisa saber disso para não considerar a
família mais protegida do que ela é.

Marque **fonte principal** aquela cuja interrupção é o cenário mais relevante a simular.

**Concentração da renda.** No topo da tela, mostra o quanto a família depende de uma única
fonte. É um diagnóstico para você enxergar sua exposição — ele não aumenta sua reserva
sozinho.

Nada aqui é obrigatório — vale a regra geral do menu.

### 12-A.2 Seguros

Cadastro das apólices que você já tem: nome, tipo (vida, incapacidade, proteção de renda,
saúde, odontológico, automóvel, residencial, prestamista, empresarial ou outro),
seguradora, a quem se refere e o prêmio mensal.

**O que o cálculo consome não é a apólice — é a cobertura.** Dentro de cada apólice você
cadastra as coberturas, e é ali que estão os campos que realmente mudam o tamanho da sua
reserva: **qual risco está coberto**, **capital segurado**, **franquia**, **carência** e
**prazo até a indenização cair**. Uma apólice sem nenhuma cobertura cadastrada não reduz
nada no cálculo, e a tela avisa quando isso acontece.

A razão é simples: seguro e reserva resolvem problemas diferentes. **O seguro transfere o
risco grande; a reserva cobre o que sobra** — a franquia que você paga do próprio bolso, o
período de carência em que ainda não há direito, e principalmente o tempo entre o sinistro
e o dinheiro chegar na conta. Um seguro excelente que demora 90 dias para pagar não
dispensa você de ter caixa para esses 90 dias.

Se você tiver **duas apólices cobrindo o mesmo risco**, o sistema considera a melhor
proteção — não soma as duas. Somar superestimaria sua cobertura.

### 12-A.3 Proteções e Benefícios

Aqui entram as proteções que não são seguro contratado: **FGTS**, **seguro-desemprego**,
**verbas rescisórias**, **auxílio-doença**, **aposentadoria por invalidez**, **pensão por
morte**, **licença estatutária**, **benefício do empregador** e outras.

**As opções mudam conforme o regime de trabalho de cada pessoa.** Militar e servidor
público efetivo não têm FGTS, seguro-desemprego nem verbas rescisórias; autônomo, MEI e
trabalhador informal também não. A tela não se limita a esconder essas opções — ela
**explica o que ficou de fora e por quê**. Isso é proposital: a rede de proteção de um
servidor é diferente da de um CLT, não menor por engano do sistema, e você precisa
enxergar essa diferença para entender sua reserva.

Cada proteção aceita **três respostas: tenho direito, não tenho, ou "Ainda não sei"**. A
terceira é tratada como não confirmada e **nunca entra no cálculo como proteção existente**
— contar com um direito que talvez não exista produziria uma reserva menor do que a
necessária. Ela fica registrada mesmo assim, para você lembrar de confirmar depois. Só
entra no cálculo o que estiver confirmado **e com valor**.

### 12-A.4 Eventos e Recomposição

Onde você registra o que **já aconteceu de verdade**: perda de renda, redução de renda,
despesa inesperada, incapacidade, emergência familiar, reparo essencial ou outro. Para cada
evento: quando foi, quanto saiu do seu bolso, se havia seguro e quanto tempo o reembolso
levou para cair.

O campo de seguro também aceita **três respostas** — Sim, Não e **Não informado**. "Não sei
se eu tinha" é diferente de "eu não tinha", e o cálculo não conta com o que não foi
confirmado.

**Por que isso importa mais que qualquer simulação.** Um cenário simulado é hipótese; o que
já aconteceu com você é fato. O maior desembolso do próprio bolso que você já registrou
passa a compor o piso da sua reserva, competindo com a maior franquia declarada nas suas
apólices — o piso considera o maior dos dois.

**Isso só eleva o valor, nunca reduz.** Nunca ter tido um choque grande não protege contra
ter o primeiro.

A seção **"O que isso mudou no seu cálculo"** mostra, para cada conclusão, **qual evento a
produziu**. Nada muda por trás: se o sistema passou a esperar um prazo maior de indenização
ou um desembolso maior, ele diz qual registro seu levou a isso. Padrões (como "seus choques
costumam não ter seguro") só aparecem a partir de **dois casos**, nunca de um — uma
ocorrência isolada não é padrão.

**Recomposição.** Se você usou a reserva, a tela acompanha quanto falta repor. Usar a
reserva **não é fracasso — é ela funcionando**; o que importa é o sistema saber disso e
cobrar a reposição. Quando não há capacidade de aporte, ele diz isso em vez de inventar um
prazo.

### 12-A.4-B Mapa de Riscos (MRP) — com consultoria ativa

Enquanto a Reserva responde *"quanto preciso ter guardado"*, este mapa responde
**risco a risco**: quanto aquele evento específico custaria, quanto seus seguros
pagariam de fato, e o que sobra para você.

**Quatro colunas, uma linha por risco:**

| Coluna | O que é |
| --- | --- |
| **Necessário** | quanta liquidez aquele cenário consumiria de você |
| **Seguro paga** | o que suas apólices realmente pagariam, **já descontadas franquia e carência** |
| **Sobra para você** | a exposição que continua sendo sua |
| **Tratamento** | transferir, complementar, reter ou já coberto — sempre com o motivo escrito |

**A necessidade não vem de uma regra de mercado.** Não existe aqui um "faça
seguro de dez vezes a renda". Ela vem dos seus próprios cenários — os mesmos que
calculam sua Reserva de Emergência —, então o mapa fala da sua vida, não de uma
média.

**"Seguro paga" não é o capital da apólice.** É o que sobraria depois da
franquia, e zero se o evento cair dentro da carência. Uma apólice de R$ 50 mil
com franquia de R$ 3 mil paga R$ 7 mil num prejuízo de R$ 10 mil — e é esse
número que aparece.

**Os quatro tratamentos:**

- **Transferir** — existe seguro no mercado e você não tem cobertura aplicável.
- **Complementar** — há proteção, mas ela não alcança o tamanho do evento.
- **Reter** — nenhum seguro transfere esse risco. É por causa deles que a
  reserva existe, e é essa a resposta certa aqui, não uma apólice.
- **Coberto** — não pede ação.

**Os totais no topo somam riscos que não acontecem todos juntos.** Servem para
dimensionar a conversa, não como um valor a guardar; quem diz quanto guardar é a
Reserva.

O mapa diagnostica exposição — **não indica seguradora nem produto.** Que apólice
contratar é conversa sua com um profissional licenciado.

### 12-A.5 Reserva de Emergência

A tela onde tudo vira número.

**No topo:** sua **Reserva Recomendada PROSPECTA**, uma barra de progresso, quanto você tem
**elegível hoje** e quanto falta. "Elegível" é importante: nem todo dinheiro que você tem
serve de reserva. Um investimento com carência, um imóvel ou um limite de cartão não
atendem uma emergência amanhã, e o sistema não os conta como se atendessem.

**Quatro números logo abaixo:**

| Cartão | O que é |
| --- | --- |
| **Custo essencial (mês)** | o que a sua vida custa hoje, considerando só o essencial |
| **Custo durante a crise** | o mesmo custo depois dos cortes que seriam razoáveis numa emergência |
| **Cobertura matemática** | reserva ÷ custo essencial, em meses |
| **Cobertura no cenário principal** | quantos meses ela dura de fato, considerando a renda que continuaria entrando |

Os dois últimos costumam ser diferentes, e é essa diferença que a conta dos "seis meses"
não enxerga.

**"Por que este valor?"** — os principais fatores que puxaram sua reserva para cima ou para
baixo, escritos em linguagem comum, mais a **confiança da análise** e a **margem de
segurança** aplicada. A margem existe porque dado faltando é incerteza, e incerteza pede
folga: quanto menos o sistema sabe, maior a margem — e ela diminui conforme você preenche.

**Cenários de stress** — a tabela que mostra o que aconteceria com o seu caixa em cada
cenário adverso simulado. A linguagem aqui é deliberadamente sóbria: "proteção
insuficiente", não "você está desprotegido".

**Resiliência financeira (IPRF)** — um índice de diagnóstico, para você acompanhar sua
evolução. Ele **não** define sozinho o valor da reserva.

**"Como chegar lá"** — o plano de construção: quanto sobra por mês depois do custo
essencial, quanto disso vai para a reserva e em quanto tempo você chega à meta. Se não há
sobra, a tela diz que não há capacidade de poupança no momento, em vez de apresentar um
prazo fictício.

**"E se…?" — o simulador.** Testa uma mudança na sua vida e mostra o efeito na reserva
recomendada, sem alterar nada. Você pode combinar seis hipóteses:

| Hipótese | Exemplo |
| --- | --- |
| Meu custo mensal cai X% | e se eu enxugar 10% das despesas? |
| Entra renda extra por mês | e se meu cônjuge voltar a trabalhar? |
| Quito uma dívida de R$ X por mês | e se eu me livrar desta prestação? |
| Acrescento liquidez de R$ X | e se eu resgatar aquele investimento? |
| Minha atividade alternativa passa a gerar renda de verdade | e se eu profissionalizar o freela? |
| Contrato proteção para o risco principal | e se eu fizer um seguro de renda? |

Deixe em branco o que não quiser testar. O resultado aparece **lado a lado com o cálculo
real** — reserva recomendada, quanto falta construir, custo essencial e cobertura no cenário
principal —, com a diferença de cada linha.

**Precisar de menos reserva é melhora**, e a tela pinta assim: é o mesmo grau de proteção com
menos dinheiro parado. Por isso uma diferença negativa aparece em verde.

**Nada é salvo.** O cálculo real, no topo da tela, não muda; o botão "Salvar no histórico"
grava sempre o cálculo real, nunca a simulação. Se você digitar algo que não faz sentido —
uma redução de 150%, um valor negativo —, a tela **avisa que descartou** aquela hipótese, em
vez de ignorar em silêncio e deixar você achar que ela não teve efeito.

As hipóteses ficam no endereço da página, então **uma simulação é um link**: dá para salvar
nos favoritos ou mandar para outra pessoa, e ela abre com os mesmos números.

**"O que sua própria história ensinou"** — o que os eventos de §12-A.4 mudaram no cálculo.

**"O que deixaria este cálculo mais preciso"** — a lista do que está faltando preencher, com
o efeito de cada lacuna. É o caminho mais rápido para melhorar a confiança da análise.

**Histórico** — cada versão salva do cálculo fica registrada, com a data. Isso permite ver
como sua situação evoluiu, e nenhuma versão anterior é sobrescrita.

**Mapa de riscos e plano de tratamento** aparecem nesta tela **apenas com consultoria
ativa** (ver §13-A): reserva e cenários de stress são do plano Max, mas o diagnóstico de
risco e a recomendação de tratamento são trabalho de consultor.

**Se ainda não houver histórico suficiente**, a tela diz isso claramente e pede alguns
meses de lançamentos, em vez de produzir um número apoiado em estimativa.

---

## 13. Investimentos

Grupo de menu dedicado a investimentos, com duas telas: **Carteira** e **Análise**.

### 13.1 Carteira

Lista de posições (renda fixa, renda variável, imóveis para aluguel, veículos para
revenda, participação societária, criptoativos, metais preciosos, commodities, terras e
produção rural, bens colecionáveis, previdência privada ou qualquer outra coisa),
filtrável por classe. Cada cartão mostra a classe, a carteira/corretora, o valor investido,
o valor atual e a rentabilidade (%), colorida em verde ou vermelho. Posições arquivadas
continuam aparecendo, numa seção "Arquivados" separada logo abaixo, esmaecidas.

**Cadastrar um investimento** pede: nome, classe (dirige quais campos específicos
aparecem — ex.: indexador/taxa/vencimento para Renda Fixa, ticker/quantidade/preço médio
para Renda Variável, endereço/aluguel esperado para Imóveis), tipo específico (texto livre,
com sugestões de mercado — CDB, Ações, Apartamento etc. — mas você pode digitar qualquer
coisa que não esteja na lista), carteira onde a posição mora (a corretora, ou o próprio
imóvel/veículo/empresa se não houver corretora — pode criar uma nova na hora), responsável
e o valor/data do aporte inicial. **Assim que você cadastra, o aporte inicial já aparece em
Lançamentos automaticamente** — não precisa lançar duas vezes.

### 13.2 Detalhe de cada investimento

Ao abrir uma posição: valor investido, valor atual, ganho de capital, rentabilidade %,
renda recebida e retorno total % (ganho de capital + renda recebida, sobre o que foi
aportado), com um gráfico de evolução da posição e o histórico completo de lançamentos
ligados a ela.

- **Histórico de movimentações** — cada linha tem um botão **"Editar"** (data, categoria,
  responsável e valor); "Salvar" corrige o lançamento de verdade, e os números do topo da
  página (ganho de capital, rentabilidade etc.) já aparecem atualizados na mesma hora.
  Também tem um botão **"Excluir"** (pede confirmação antes) — remove o lançamento de
  verdade, e os números do topo recalculam a partir do que sobrou.
- **Registrar evento da posição** — ganho/perda de capital, dividendo, juro, retirada,
  imposto ou variação cambial: fica ligado à posição, na própria carteira/corretora.
- **Registrar renda recebida** — aluguel de imóvel ou distribuição de lucro de sócio: é
  dinheiro de verdade caindo numa conta, então você escolhe em qual carteira ele entrou
  (diferente da carteira da posição).
- **Gerar lançamentos recorrentes de aluguel** (só para a classe Imóveis) — cria a série
  mensal de aluguel a receber de uma vez, a partir de uma data de início.
- Metadados (nome, classe, campos específicos) ficam travados até você clicar em
  **"Editar"**, mesmo padrão de Bens e Cartões.
- **"Arquivar"** marca a posição como encerrada (use quando vender tudo, por exemplo) —
  ela continua aparecendo na Carteira, só que numa seção separada "Arquivados", esmaecida;
  o histórico não é apagado, e "Reativar" volta ela pra lista principal. **"Excluir"**
  (do próprio investimento, não das linhas do histórico) só é permitido se não houver
  nenhum lançamento vinculado — do contrário, arquive.

### 13.3 Análise

Visão consolidada de toda a carteira: total investido, valor atual, rentabilidade
consolidada, renda total recebida, alocação por classe (em barras, com percentual e valor),
renda recebida ao longo do tempo (gráfico mensal) e um ranking de todas as posições por
rentabilidade. Botão **"Baixar PDF"** para exportar o relatório.

---

## 13-A. Método (Trilha e Entregáveis)

Menu com duas telas — **Trilha do Método** e **Entregáveis** — que registram o trabalho de
consultoria conduzido pelo Método PROSPECTAR.

**Este menu não abre por plano.** É a única parte do sistema em que assinar o plano mais
completo não dá acesso: ele exige um **contrato de consultoria ativo**. A razão é que o que
está aqui não é uma funcionalidade que você opera sozinho — é o registro de um trabalho
conduzido por um profissional, com a responsabilidade que isso implica. Sem consultoria
ativa, as duas telas explicam o que existiria ali, sem dados.

**Quem faz o quê.** Você **vê** tudo e baixa os documentos — eles são seus. Quem **registra**
passagem de fase e quem **produz e valida** entregáveis é o consultor responsável (ou o
administrador da plataforma). Deixar o cliente aprovar a própria passagem de fase esvaziaria
o sentido do método.

### 13-A.1 Trilha do Método

Acompanha em que ponto do método você está. São dez etapas:

| Fase | Do que trata |
| --- | --- |
| **Fase 0** | Diagnóstico e contexto |
| **Fase 1** | Organização e consciência |
| **Fase 2** | Estabilização |
| **Fase 3** | Endividamento e crédito |
| **Fase 4** | Proteção e riscos |
| **Fase 5** | Construção patrimonial |
| **Fase 6** | Longevidade |
| **Fase 7** | Continuidade patrimonial |
| **Fase 8** | Consolidação |
| **Fase ∞** | Plano Integrado |

A Fase ∞ não é uma décima etapa que termina: é o acompanhamento contínuo depois que o
plano está montado.

**A passagem de fase é registrada, não presumida.** Cada vez que uma fase se encerra, fica
gravado o **critério avaliado**, o **resultado** e a **evidência** — quem decidiu, quando e
com base em quê. São quatro resultados possíveis:

| Resultado | O que significa |
| --- | --- |
| **Em andamento** | a fase está aberta |
| **Avanço pleno** | os critérios foram cumpridos; segue para a próxima |
| **Avanço condicional** | segue adiante, mas com pendência assumida |
| **Retorno assistido** | volta a uma fase anterior, com acompanhamento |

**Avanço condicional e retorno assistido exigem uma micrometa com prazo.** Sem isso, os dois
viram um jeito de adiar indefinidamente: um "sim, mas depois" que nunca chega. O prazo é o
que transforma a pendência em compromisso.

Retorno assistido não é punição nem fracasso — é o reconhecimento de que uma etapa precisa
ser retomada, o que é normal em qualquer processo longo.

O tipo de contrato também aparece aqui: **Diagnóstico**, **Planejamento**, **Projeto** ou
**Acompanhamento**. Um contrato de projeto cobre uma fase específica, e não o método
inteiro.

### 13-A.2 Diagnóstico (DIP)

Os formulários que o consultor usa para conhecer sua situação. São três, e a
separação entre eles é proposital.

| Instrumento | Quando | O que pergunta |
| --- | --- | --- |
| **A1 — Pré-Diagnóstico** | Fase 0, antes da entrevista | o essencial: identificação, ocupação, renda aproximada, existência de dívidas e de patrimônio, suas três maiores preocupações |
| **A2 — Complementação** | Fase 1, depois da entrevista | o detalhe: renda e estabilidade, despesas, patrimônio, passivos e crédito, proteção, previdência, tributação, objetivos |
| **C — Perfil Comportamental** | Fase 1 | oito dimensões sobre como você lida com risco, em escala de concordância |

**Por que não é um formulário só.** Porque os erros são de tipos opostos. Num
formulário, a pessoa tende a omitir o que é constrangedor; numa conversa, tende
a errar o número. Separar as camadas neutraliza os dois, e o cruzamento entre o
que você escreveu e o que contou na entrevista é, em si, material de
diagnóstico.

**O A1 é curto de propósito** — não deve passar de dez minutos. Tudo que exige
procurar documento fica para o A2. Por isso ele pergunta seu patrimônio em
**faixa, não em valor**: valor exato antes da entrevista aumenta o atrito e
convida à omissão, e é justamente o que o A2 levanta depois com calma.

**O C se responde sozinho.** Sem companhia, inclusive sem o cônjuge — é sobre
como *você* se relaciona com risco, e a presença de outra pessoa muda a
resposta. Em família, cada um responde o seu. Ele **não substitui** o
questionário de perfil de investidor da instituição onde você investe.

**Rascunho e envio.** O A2 é longo e não se responde de uma sentada, então há
**"Salvar rascunho"** ao lado de **"Enviar"**. Enviar exige que os campos
obrigatórios estejam preenchidos, e a tela diz quantos faltam. Depois de
enviado, o formulário vira leitura — suas respostas continuam visíveis, mas
corrigir passa a ser conversa com o consultor, não um clique.

**Envio automático.** Quando o administrador liga essa opção, você não precisa
lembrar de entrar aqui: o **A1** chega por e-mail assim que sua consultoria é
aberta, e o **A2** e o **C** chegam quando a Fase 1 começa — ou seja, depois da
entrevista, que é quando eles fazem sentido.

Se algum ficar em aberto, o sistema manda **no máximo dois lembretes** — um na
metade do prazo e outro no vencimento — e depois **para**. Passado isso, o
assunto vira conversa com seu consultor, não mais e-mail automático.

Os prazos seguem o protocolo do método: cinco dias para o A1, oito para o A2 e
para o C.

**Sobre o C especificamente.** Ele não pergunta o que você sabe, e sim como você
reage. São oito afirmações, e você diz o quanto concorda com cada uma. A
primeira usa um cenário com valores em reais — não uma porcentagem — porque
"cair 16%" quase não assusta ninguém no papel, enquanto "R$ 50.000 virarem
R$ 42.000" é sentido de verdade, e é essa reação que interessa medir.

**Existe um quarto instrumento, o B** — o roteiro da entrevista. Ele não aparece
no sistema para o cliente: é conduzido como conversa e preenchido pelo consultor
depois da reunião, porque preencher formulário na frente de alguém destrói a
conversa.

### 13-A.3 Entregáveis

Os dez documentos codificados do método. Cada um tem seções próprias, e a tela mostra quais
faltam preencher.

| Sigla | Nome | Fase |
| --- | --- | --- |
| **PAN** | Panorama Financeiro | 1 |
| **AFF** | Acordo Financeiro Familiar | 1 |
| **RAP** | Régua de Alocação | 1 |
| **MEC** | Mapa de Endividamento e Crédito | 3 |
| **MRP** | Mapa de Riscos e Proteção | 4 |
| **PIP** | Política de Investimento Pessoal | 5 |
| **MFP** | Mapa Funcional do Patrimônio | 5 |
| **PLA** | Plano de Longevidade e Aposentadoria | 6 |
| **PCP** | Plano de Continuidade Patrimonial | 7 |
| **PFI** | Plano Financeiro Integrado | 8 |

O **PAN** é a devolutiva do diagnóstico: retrato patrimonial, fluxo declarado, mapa de
riscos, mapa de dívidas, objetivos priorizados, sua Saúde Financeira de linha de base e as
três alavancas de maior impacto. O **AFF** é o documento de uma página, assinado por todos
da família, com metas comuns, prioridades e regras de decisão. O **PFI** compila os demais
numa visão única e ganha uma versão nova a cada fase.

**Como funciona o ciclo.** O consultor cria um **rascunho**, que já nasce com o esqueleto
de seções do documento; preenche; e depois **valida**. Validar só é possível com todas as
seções preenchidas — e, se faltar alguma, a tela diz **quais**, em vez de apenas recusar.

**Validar não sobrescreve.** Uma revisão futura gera uma **versão nova**, e a anterior
continua existindo. Um entregável é o registro do que foi dito a você **numa data**;
reescrever o passado apagaria a própria prova do trabalho. Por isso, documento validado não
pode ser reescrito nem excluído — só rascunho pode ser apagado.

**PDF.** Todo entregável pode ser baixado em PDF, com o **número da versão e a data**
impressos no documento. Um PDF que circula por e-mail sem esses dois dados é uma afirmação
sem contexto — daqui a um ano ninguém sabe se aquilo ainda vale.

---

## 13-B. Política de Investimento e metas da Régua (com consultoria ativa)

Duas coisas que aparecem dentro de telas que você já usa.

### 13-B.1 Política de Investimento (PIP)

Fica na **Análise de investimentos**, logo abaixo dos totais. Você define em que
**faixa** cada classe deve ficar — por exemplo, renda fixa entre 40% e 60% —, e
a tabela passa a mostrar, para cada classe: quanto ela representa hoje, qual a
faixa, se está dentro ou fora, e **quanto precisaria entrar ou sair** para
voltar à borda.

**Por que faixa e não um alvo exato.** Um alvo exato exigiria rebalancear a cada
oscilação do mercado — com custo e imposto a cada tremor. A faixa é o que torna
a regra operável: só se mexe quando a posição sai dela.

**Classe sem faixa aparece assim mesmo**, marcada como "fora da política".
Dinheiro alocado onde a política não previu é justamente o que precisa ser
discutido; escondê-lo faria a soma não fechar.

**O sistema recusa política impossível.** Se os mínimos somarem mais de 100%,
nenhuma carteira consegue cumprir; se os máximos somarem menos de 100%, sobra
dinheiro sem onde caber. Nenhum dos dois aparece ao preencher classe por classe,
então a validação é do conjunto, na hora de salvar.

**A PROSPECTA mede o desvio; não diz o que comprar ou vender.** Isso é conversa
com um profissional licenciado.

### 13-B.2 Trajetória de metas da Régua

Fica na **Régua de Alocação**. A banda que já existia ali é a referência da sua
faixa de renda; esta seção acrescenta a meta **sua**, com prazo: hoje, em 12 e
em 24 meses.

A tabela mostra as quatro fatias — essencial, estilo de vida, obrigações,
poupança —, quanto cada uma é hoje, a meta de cada horizonte e a distância até
ela em pontos percentuais.

**A Régua é instrumento de diagnóstico e trajetória, nunca norma.** Cobrar o
ideal de imediato produz frustração e abandono; por isso a meta tem prazo.

As metas de um horizonte precisam fechar em **100%** — são fatias da mesma
renda. Salvar substitui as metas daquele horizonte e não toca nos demais.

---

## 14. Cadastros

Telas de configuração, cada uma com regra própria de quem pode editar:

| Tela | Quem pode criar/editar |
|---|---|
| **Carteiras** | Qualquer membro do workspace |
| **Responsáveis** | Qualquer membro do workspace |
| **Categorias** | Só administrador da plataforma |
| **Subcategorias** | Só administrador da plataforma |
| **Tipos** (rótulo de Receita/Despesa/Investimento/Outro) | Só administrador da plataforma |
| **Membros** | Titular do workspace ou administrador |

Em **Carteiras** (novo, 2026-08-15), cada linha tem uma coluna **Conciliação**: clique em
"conferir" e digite o saldo real daquela conta/carteira (o que você vê no extrato do
banco/app). O sistema compara com o que calcula a partir dos seus lançamentos e mostra se
bate ou a diferença em R$, com a data da última conferência. Serve para você perceber cedo
se algum lançamento ficou de fora — não precisa conferir toda semana, é uma checagem
opcional.

Em **Membros**, você convida outra pessoa para o seu workspace (link ou botão "Enviar por
WhatsApp"), escolhendo o papel dela: Membro (lança e vê), Leitura (só vê) ou Consultor
(só leitura por padrão, com registro de auditoria de cada acesso — editar/excluir
lançamentos exige concessão explícita do administrador, ver seção 16).

Itens que já foram usados em algum lançamento não são excluídos — são **arquivados**, para
preservar o histórico.

---

## 15. Minha conta

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

## 16. Administração (só para administrador da plataforma)

- **`/admin/usuarios`** — todos os usuários cadastrados no sistema: **código do cliente**
  (número sequencial imutável, atribuído automaticamente ao workspace de cada pessoa ou
  família), nome, e-mail, se é admin, workspaces e papel em cada um, e-mail confirmado,
  data de cadastro, último login. Permite editar dados pessoais de qualquer pessoa,
  promover/remover admin, atribuir consultor, excluir conta.
  - **Escrita do consultor** — todo consultor atribuído nasce só com leitura, mesmo já
    ativo no workspace. Ao lado do nome do consultor aparece "Escrita: só leitura" com um
    botão "conceder"; clicar libera edição/exclusão de lançamentos para aquele consultor
    até você revogar (botão vira "revogar"). Toda concessão e revogação fica registrada no
    histórico de auditoria do workspace. Trocar de consultor sempre zera essa concessão — o
    novo consultor começa do zero, mesmo que seja a mesma pessoa voltando.
  - **Bloquear acesso** — alternativa a excluir a conta de um cliente (por exemplo,
    inadimplência): pausa o acesso de todo mundo que usa aquele workspace (titular,
    membros, consultor), sem apagar nada, escolhendo um motivo num menu suspenso —
    Fatura em aberto, Solicitação do próprio cliente, Verificação de segurança,
    Orientação do consultor, ou Outro (com uma mensagem digitada na hora). Na próxima
    tentativa de acesso, a pessoa vê essa mensagem em vez do sistema; "desbloquear"
    libera o acesso de novo a qualquer momento. Quem tem acesso a outros workspaces não
    bloqueados (ex.: um consultor com vários clientes) consegue trocar para eles direto
    dessa mesma tela, em vez de ficar sem alternativa.
  - **Aprovar acesso** — quando alguém se cadastra sozinho (sem convite, veja 2.1), o
    acesso já nasce pausado automaticamente ("Aguardando aprovação", destacado em âmbar)
    e você recebe um e-mail avisando. O botão "aprovar acesso" nessa linha libera —
    mesmo mecanismo do bloqueio manual acima, só que automático na hora do cadastro.
  - **Conceder acesso temporário** (novo, 2026-08-15) — eleva o nível de um workspace por
    um período (ex.: dar acesso ao Max sem mudar o plano contratado — útil pra cortesia ou
    teste). Escolha o plano, escreva o motivo e a data de término; "revogar" tira o acesso
    a qualquer momento antes disso. Nunca muda a assinatura do cliente — ao vencer ou ser
    revogada, o workspace volta exatamente pro plano que já tinha.
- **`/admin/clientes`** — cria o pré-cadastro de um novo cliente de consultoria: workspace
  novo, plano escolhido, consultor responsável opcional, e um link/WhatsApp de convite para
  o cliente.
- **`/admin/consultores`** — visão em árvore de quem atende quem: um card por consultor com
  a lista de clientes atendidos.
- **`/admin/planos`** (novo, 2026-08-15) — catálogo comercial: os 6 planos (Start, Pro, Max
  × Individual, Família) e cada funcionalidade que cada um libera, numa matriz com
  checkbox. Marque/desmarque pra mudar o que um plano inclui — vale na hora, sem precisar
  de deploy. Cada funcionalidade também tem um seletor "Plano"/"Método": a maioria é
  liberada por nível de plano; um grupo à parte só é liberado com consultor ativo (ainda
  não implementado). Ativar/desativar um plano inteiro (sem excluir) fica no topo da tela.

- **Abrir uma consultoria** — na coluna Workspaces, abaixo do acesso temporário,
  cada workspace mostra se tem **contrato de consultoria** e permite abrir ou
  encerrar um.

  **Isto é diferente de atribuir um consultor**, logo acima na mesma célula, e a
  diferença importa: atribuir consultor dá a alguém **acesso** ao workspace do
  cliente; abrir a consultoria registra que um profissional assumiu
  **responsabilidade metodológica** por ele. É só o contrato que faz o menu
  **Método** existir para aquele cliente — Trilha, Diagnóstico e Entregáveis.
  Um cliente pode perfeitamente ter consultor com acesso e nenhuma consultoria
  aberta.

  Ao abrir, escolha a **modalidade**: Diagnóstico, Planejamento, Projeto ou
  Acompanhamento. **Projeto pede também a fase contratada** (0 a 9), porque
  esse tipo de contrato cobre uma fase específica do método, e não a trilha
  inteira — sem o número, o sistema não teria como saber o que liberar.

  **Só existe uma consultoria ativa por cliente.** Abrir uma nova encerra a
  anterior, e o sistema avisa antes de fazer isso. Encerrar não apaga nada: o
  contrato vira histórico, e tudo que foi produzido nele continua gravado.

  Isso é admin-only de propósito: nem o cliente contrata clicando, nem o
  consultor se autoconcede.

- **`/admin/metodologia`** — os parâmetros do Método PROSPECTAR que valem para **toda a
  plataforma**, não por cliente: a classificação de cada despesa em rígida, ajustável ou
  discricionária, e o percentual de corte considerado possível numa emergência. São
  admin-only de propósito — metodologia que muda por cliente deixa de ser metodologia.

- **`/admin/metodologia` → envio automático dos instrumentos** — um parâmetro
  liga e desliga o envio automático do diagnóstico para **todos** os clientes com
  consultoria ativa: `0` desligado, `1` ligado.

  Ele **nasce desligado**, e isso é proposital. Esta é a única rotina do sistema
  que fala com o cliente sem uma pessoa no meio — todo o resto apenas mostra
  avisos dentro do aplicativo. Ligar junto com uma atualização mandaria e-mail
  para quem ainda não sabe que a rotina existe, e e-mail enviado não tem como
  ser desfeito. Ligue quando tiver certeza de que os textos e os prazos estão
  como você quer.

- **`/admin/automacoes`** — a verificação diária de automações: se está rodando, quando
  rodou pela última vez e o que cada execução produziu.

  O destaque no topo responde a uma única pergunta: **"está rodando?"**. Se a última
  execução automática tem mais de 26 horas, o painel fica âmbar e diz "Atrasado"; caso
  contrário, "Em dia". Abaixo, uma tabela com as últimas 30 execuções — início, origem
  (agendada ou manual), duração, quantos workspaces e regras foram avaliados, quantos
  alertas saíram, e o resultado.

  Três resultados possíveis, e a diferença entre eles importa: **Concluída** (correu bem),
  **Falhou** (com a mensagem do erro na própria linha), e **Não terminou** — esta última é
  a execução que começou e morreu no meio, o tipo de problema que normalmente não deixa
  rastro em lugar nenhum.

  **Zero alertas numa execução concluída é resultado normal:** significa que nenhuma
  condição estava verdadeira naquele dia. Essa tela existe justamente porque, antes dela,
  esse caso era indistinguível de a rotina não ter rodado — e uma rotina que falha em
  silêncio é pior que uma que falha alto, porque ninguém procura o que não sabe que
  quebrou.

  O botão **"Executar agora"** dispara a mesma rotina na hora, sem esperar o horário
  agendado. Ela fica registrada como **manual**, separada das agendadas — um disparo de
  teste marcado como agendado mascararia a ausência da automática, que é exatamente o que
  este rastro existe para revelar.

---

## 17. Segurança e privacidade

Toda a base do sistema segue a Lei Geral de Proteção de Dados (LGPD). Detalhes completos em
`/politica-privacidade` (dentro do sistema) e no rascunho jurídico `TERMOS-DE-USO.md`. Em
resumo: seus dados financeiros são seus, você pode exportá-los ou apagá-los a qualquer
momento, e todo acesso de um consultor ou administrador ao seu workspace fica registrado.

---

## 18. Dúvidas frequentes

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
