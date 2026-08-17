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

## 2026-08-17

### Corrigido (Registro Nº 095)
- **O menu Admin podia aparecer para quem não é administrador** ao trocar de conta no mesmo navegador. Era aparência apenas — as telas de administração sempre exigiram permissão no servidor, então clicar levava a erro de autorização, nunca a dado de outra pessoa. Corrigido invalidando o cache de layout no login e no logout.

### Adicionado (Registro Nº 094)
- **Abrir e encerrar consultoria** direto em `/admin/usuarios`, na coluna Workspaces. Escolha a modalidade (Diagnóstico, Planejamento, Projeto ou Acompanhamento) e o contrato passa a valer na hora; Projeto pede também a fase contratada.
- **É isso que faz o menu Método aparecer para um cliente.** Atribuir um consultor dá acesso ao workspace; abrir a consultoria é o que registra a responsabilidade metodológica e libera Trilha, Diagnóstico e Entregáveis.
- Só existe uma consultoria ativa por cliente: abrir uma nova encerra a anterior, com aviso antes. Encerrar não apaga — vira histórico.

### Alterado (Registro Nº 093)
- **As perguntas do diagnóstico ganharam redação definitiva.** Antes os campos apareciam com o nome técnico ("Ocupação", "Renda líquida do núcleo"); agora são perguntas em português de conversa ("O que você faz hoje?", "Somando todo mundo da casa, quanto entra por mês já descontados os impostos?").
- **O questionário comportamental (C) passou a mostrar afirmações**, não nomes de dimensão — numa escala de concordância, "Locus de controle financeiro" não é algo com que se concorde. A pergunta sobre tolerância a perda usa valores em reais, não porcentagem.
- O aviso de "redação em revisão" saiu das telas.

### Adicionado (Registro Nº 092)
- **Diagnóstico (DIP)** — novo item no menu Método, com os três formulários do diagnóstico: **A1** (pré-diagnóstico, curto, antes da entrevista), **A2** (complementação detalhada, depois dela) e **C** (perfil comportamental, respondido individualmente).
- O A2 tem **"Salvar rascunho"**, porque é longo e não se responde de uma sentada. Enviar exige os campos obrigatórios preenchidos, e a tela diz quantos faltam.
- Depois de enviado, o formulário vira leitura: as respostas continuam visíveis, mas corrigir passa a ser conversa com o consultor.
- **Ainda não implementado:** o envio automático e os lembretes de prazo do A2 — hoje o formulário só é encontrado entrando na tela.

### Adicionado (Registro Nº 091)
- **Tela de Automações no Admin** (`/admin/automacoes`) — mostra se a verificação diária está rodando, quando rodou pela última vez e o que cada execução produziu. Passou de 26h sem rodar, o painel avisa. Tem um botão "Executar agora" para disparar na hora.
- **Alerta de gasto por categoria agora aceita período**: por mês (como era), por semana (segunda a domingo) ou por dia. Regras já criadas continuam mensais, sem mudança.
- **Botão "Limpar histórico" no Assistente**, com confirmação — apaga todas as perguntas do workspace.
- **Barra de nível na Saúde Financeira**: cada indicador mostra em qual das cinco faixas está e se subiu ou caiu de nível desde a última foto salva.

### Adicionado (Registro Nº 090)
- **Simulador "E se…?" na Reserva de Emergência.** Teste uma mudança na sua vida e veja o efeito na reserva recomendada: custo mensal caindo X%, renda extra entrando, uma dívida quitada, liquidez acrescentada, a atividade alternativa virando renda de verdade, ou uma proteção contratada. Dá para combinar várias.
- **O resultado aparece lado a lado com o cálculo real**, com a diferença de cada linha. Nada é salvo, e o botão "Salvar no histórico" continua gravando sempre o cálculo real.
- **Uma simulação é um link:** as hipóteses ficam no endereço da página, então dá para salvar nos favoritos ou mandar para outra pessoa.
- Se você digitar algo impossível — uma redução de 150%, um valor negativo — a tela avisa que descartou aquela hipótese, em vez de ignorar em silêncio.

### Corrigido (Registro Nº 089)
- **Os alertas automáticos voltaram a chegar.** A verificação diária que avisa sobre limite de categoria, vencimento próximo, meta fora da trajetória e fila de incidentes não estava rodando em produção — era barrada antes de executar. A falha era silenciosa: nenhum alerta chegava e nada indicava o motivo. Confirmada funcionando em 2026-08-17.

### Alterado (Registro Nº 088)
- **Manual de uso atualizado.** O menu **Método** (Trilha e Entregáveis) ganhou seção própria (§13-A), explicando por que ele é o único que não abre por plano — depende de consultoria ativa —, como funciona a passagem de fase e o ciclo dos dez entregáveis.
- **Proteção e Segurança (§12-A) completa.** Quatro telas já entregues estavam sem manual: Seguros, Proteções e Benefícios, Eventos e Recomposição, e Reserva de Emergência. O texto de abertura, que ainda dizia que o menu "está sendo construído por partes", foi corrigido.
- **Navegação (§3)** passou a listar os grupos de menu na ordem real, com a indicação de quais dependem de plano e quais dependem de consultoria.

### Alterado (Registro Nº 087)
- **Os entregáveis PAN e AFF agora aparecem com o nome completo:** **Panorama Financeiro** e **Acordo Financeiro Familiar**. Os dois eram os únicos que ainda apareciam só pela sigla, com aviso de nome não confirmado — a expansão foi localizada na Metodologia PROSPECTA v5.0 e o aviso saiu da tela e do PDF.
- Ambos passaram a constar na **Fase 1**, que é onde a Metodologia os produz: o Panorama é a devolutiva do diagnóstico, e o Acordo Financeiro Familiar é o documento de uma página, assinado por todos, que fecha a fase. As seções de cada um passaram a refletir o que a Metodologia descreve.

### Adicionado (Registro Nº 086)
- **Método → Entregáveis** (nova tela): os dez documentos do método — mapa de riscos, política de investimento, plano de continuidade e os demais —, cada um com suas seções, versionado e com PDF para baixar.
- **Validar não sobrescreve.** Uma revisão futura gera uma versão nova e a anterior continua existindo: é ela que prova o que foi dito na época. Documento validado não pode ser reescrito nem excluído.
- Também no menu **Método**, junto da Trilha.

### Adicionado (Registro Nº 085)
- **Proteção e Segurança → Eventos e Recomposição** (nova tela, plano Max): registre o que já aconteceu de verdade — uma despesa inesperada, uma perda de renda, um reparo — com o quanto saiu do seu bolso, se havia seguro e quanto tempo o reembolso levou para cair.
- **O que já aconteceu com você pesa mais que qualquer simulação.** O maior desembolso registrado passa a compor o piso da sua reserva, e a tela mostra exatamente qual evento mudou qual número — nada acontece por trás.
- **Usou a reserva? A tela cobra a reposição.** Usar não é fracasso, é a reserva funcionando; o sistema passa a acompanhar quanto falta repor.

### Adicionado (Registro Nº 084)
- **Trilha do Método** (nova tela): acompanha as fases da consultoria, de 0 a 8 mais a Fase ∞, com o registro de cada passagem — o critério avaliado, o resultado e a evidência. Avanço condicional e retorno assistido exigem uma micrometa com prazo.
- A trilha só existe quando há uma consultoria ativa. Diferente das demais telas, ela **não é liberada por plano**: acompanha um trabalho conduzido por um profissional. O cliente vê a trilha; só o consultor responsável registra a passagem de fase.

### Adicionado (Registro Nº 083)
- **Reserva de Emergência → "Como chegar lá"**: mostra em quantos meses você atinge a meta guardando o que realmente sobra depois do custo essencial — e, quando não sobra nada, diz isso em vez de inventar um prazo.
- **Como reduzir a necessidade de reserva sem ficar menos protegido**: sugestões conforme seu caso — contratar seguro, desenvolver uma segunda renda, reduzir despesa presa, diversificar. Guardar mais dinheiro financia o risco; transferir ou diversificar o diminui na origem.

### Alterado (Registro Nº 083)
- **Saúde Financeira: Liquidez e Proteção ficaram mais precisas.** Liquidez deixa de medir "6 meses de despesa para todo mundo" e passa a medir o quanto você já construiu da **sua** reserva recomendada. Proteção finalmente considera os seguros contratados, além da reserva — antes ela só olhava a reserva e ficava baixa mesmo para quem tinha boa cobertura.

## 2026-08-16

### Adicionado (Registro Nº 082)
- **Proteção e Segurança → Reserva de Emergência** (nova tela, plano Max): sua Reserva Recomendada PROSPECTA, com barra de progresso, quanto você já tem e quanto falta. Mostra seu custo essencial de hoje ao lado do custo durante uma crise, por quantos meses sua reserva cobriria cada um, e um painel com os dez cenários simulados indicando onde você está protegido e onde não está.
- **"Por que este valor?"**: em vez de despejar matemática, a tela explica em poucas linhas o que mais pesou no seu caso — e lista o que você poderia preencher para o cálculo ficar mais preciso.

### Corrigido (Registro Nº 082)
- **O custo essencial saía pela metade para quem tem menos de um ano de sistema.** O cálculo considerava doze meses e tratava os meses anteriores ao seu primeiro lançamento como se você não tivesse gasto nada, derrubando a mediana. Agora ele usa só os meses que você realmente tem, e avisa quando o histórico é curto. Isso afetaria a reserva de praticamente todo usuário novo.

### Adicionado (Registro Nº 081)
- **O cálculo da Reserva Recomendada está pronto** (interno; as telas vêm na próxima etapa). O sistema simula dez cenários adversos mês a mês — perda de renda, redução parcial, incapacidade, emergência com o carro ou a casa, emergência familiar, queda de faturamento e o choque combinado — e mede quanta liquidez cada um consumiria até a recuperação. A reserva é o maior entre esses cenários e um piso mínimo de liquidez, com margem maior quando faltam dados no seu perfil.
- Cada cálculo é guardado com a versão da metodologia que o produziu, para que comparar sua evolução ao longo do tempo continue fazendo sentido.

### Adicionado (Registro Nº 080)
- **Motor de cálculo de risco completo** (interno, ainda sem tela): o sistema agora sabe calcular quanto do seu patrimônio realmente serve de reserva — um imóvel não paga a conta do mês que vem, e limite de cartão não é dinheiro — e o quanto sua profissão facilita recomeçar caso a renda pare. São as últimas peças antes do cálculo da Reserva Recomendada.

### Adicionado (Registro Nº 079)
- **Admin → Metodologia** (nova tela, só administrador): controla os parâmetros do cálculo de risco para todo o sistema. Define quanto uma despesa ajustável encolhe durante uma crise (padrão 30%) e classifica cada despesa como **rígida** (contrato que não cede, como aluguel e mensalidade), **ajustável** (consumo que você controla, como supermercado e combustível) ou **discricionária** (pode suspender). Energia, água, gás, telefone e internet entram como rígidas, por escolha conservadora.
- Essa classificação é o que separa "quanto sua vida custa hoje" de "quanto custaria durante uma crise" — e é a segunda medida que dimensiona a reserva de emergência, não a primeira.

### Adicionado (Registro Nº 078)
- **Proteção e Segurança → Seguros** (nova tela, plano Max): cadastre suas apólices e, dentro de cada uma, as coberturas — com franquia, carência e, principalmente, **quanto tempo leva até a indenização cair na conta**. Esse último dado é o que o cálculo da reserva mais precisa: um seguro que paga em 60 dias não resolve a conta que vence semana que vem.
- **Proteção e Segurança → Proteções e Benefícios** (nova tela, plano Max): FGTS, seguro-desemprego, auxílio-doença, licenças e benefícios do empregador, com valor, duração e prazo até o recebimento. As opções mudam conforme o regime de trabalho de cada pessoa — quem é servidor ou militar não tem as proteções típicas de CLT, e o sistema explica isso em vez de simplesmente omitir.

### Adicionado (Registro Nº 077)
- **Proteção e Segurança → Perfil de Risco** (novo menu e nova tela, plano Max): o primeiro passo da Reserva de Emergência PROSPECTA. Para cada pessoa da sua unidade financeira você informa regime de trabalho, profissão, tempo de casa, experiência e se tem outra atividade capaz de gerar renda — e cadastra as fontes de renda, incluindo quem paga cada uma.
- **A renda não é perguntada.** A tela mostra a renda que o sistema já mediu nos seus lançamentos, com quantos meses de histórico e o quanto isso é confiável. Usa a mediana, não a média, para que um 13º não faça parecer que você ganha mais do que ganha todo mês.
- **Concentração da renda**: mostra o quanto a família depende de uma única fonte. É diagnóstico — não aumenta sua reserva por si só.

### Corrigido (Registro Nº 076)
- **As automações não teriam disparado nunca.** A verificação de login barrava a chamada automática diária antes dela chegar ao sistema, e o erro não aparecia em lugar nenhum — pareceria apenas que "as automações não funcionam". Corrigido e coberto por teste.

### Adicionado (Registro Nº 075)
- **Tudo do Bloco I e da Etapa 7 entrou no ar.** Saúde Financeira, Assistente e Automações, Régua de Alocação, Função do Patrimônio, Planos (admin) e o acesso do consultor com escrita explícita passaram a existir em produção. A Régua já abre com as 282 subcategorias de despesa classificadas.
- **Patrimônio → Função do Patrimônio** ganhou aba própria na seção Patrimônio (antes só aparecia no menu lateral).

### Alterado (Registro Nº 075)
- **Consultores agora começam sem permissão de escrita.** Quem já tinha acesso como consultor passou a somente-leitura; o titular (ou o administrador, em `/admin/usuarios`) concede escrita explicitamente quando quiser. Mudança de segurança planejada, não um efeito colateral.

### Corrigido (Registro Nº 074)
- **Função do Patrimônio: total inflado.** Dinheiro parado numa carteira de investimento era somado junto com as posições compradas com ele — R$ 10.000 apareciam como R$ 20.000. Agora o saldo da carteira desconta as posições que ela abriga, e o que sobra é o caixa ainda não investido.
- **Função do Patrimônio: percentuais sem sentido** quando o patrimônio total ficava negativo (conta no cheque especial maior que o resto) — apareciam invertidos e acima de 100%.
- **Função do Patrimônio:** a conta interna "Patrimônio" deixou de aparecer na lista como se fosse algo a classificar.

### Corrigido — incidente (Registro Nº 075)
- **Sistema fora do ar em 2026-08-15.** Uma publicação levou código novo ao ar sem preparar o banco de produção, e todas as telas depois do login passaram a dar erro. Restabelecido no mesmo dia voltando à versão anterior; nenhum dado foi afetado. A subida foi refeita depois com o banco preparado primeiro.

## 2026-08-15

### Adicionado (Registro Nº 073)
- **Patrimônio → Função do Patrimônio** (nova tela, plano Max): além de "quanto eu tenho", responde "para que serve cada parte" — Proteção, Liquidez operacional, Objetivos, Longevidade, Crescimento, Uso e Sucessão. Bens, investimentos e carteiras ativas entram no mesmo mapa, com o valor que o sistema já calcula. A tela também aponta sozinha o que ainda está **sem função definida**, do maior valor para o menor, e deixa você classificar ali mesmo. Cartão de crédito (e qualquer carteira de dívida) fica de fora — dívida não recebe função patrimonial.

### Adicionado (Registro Nº 072)
- **Painel → Assistente** (nova tela, plano Max): pergunte em português simples sobre seu saldo, receita/gasto do mês (geral ou por categoria), quanto falta pra reserva ou quantos incidentes estão pendentes — a resposta usa sempre os mesmos cálculos do Painel/Relatórios, nunca um número inventado. Nunca recomenda produto ou ativo específico — se a pergunta parecer pedir isso, o assistente recusa e explica por quê.
- **Painel → Assistente — Automações** (mesma tela, plano Max): 5 tipos de alerta automático que você liga/desliga (gasto de categoria passou de X, compromisso vencendo, recorrência mudou de valor, meta fora do ritmo, fila de incidentes acumulando). Roda 1x por dia; só avisa, nunca cria, edita ou paga nada sozinho.

### Adicionado (Registro Nº 071)
- **Painel → Saúde Financeira** (nova tela, a partir do plano Pro): cinco indicadores gerenciais — Organização, Endividamento, Liquidez e, no Max, Proteção e Construção Patrimonial — numa escala de 5 faixas (Crítico a Consolidado). Botão "Salvar no histórico" grava uma foto dos indicadores na data de hoje, para comparar a evolução mais adiante.

### Adicionado (Registro Nº 070)
- **Admin → Usuários**: novo controle "conceder acesso temporário" — eleva o nível de um workspace por um período (cortesia, teste), sem mudar o plano contratado. Revogável a qualquer momento.
- **Convites**: quando o workspace tem um plano com limite de pessoas definido (Individual ou Família), o sistema agora impede convidar além do limite. Workspaces sem plano definido continuam sem restrição.

### Adicionado (Registro Nº 069)
- **Admin → Planos** (nova tela): catálogo comercial completo — os 6 planos (Start, Pro, Max, cada um em Individual e Família) e o que cada um libera, editável sem precisar de deploy.
- **Relatórios → Régua de Alocação**: passa a exigir o plano Pro ou superior (a maioria dos workspaces já ativos continua com acesso total).

### Adicionado (Registro Nº 068)
- **Cadastros → Carteiras**: nova coluna "Conciliação" — confira o saldo real de uma conta/carteira contra o que o sistema calcula a partir dos seus lançamentos, com a diferença em R$ e a data da última conferência. Ajuda a perceber cedo se algum lançamento ficou de fora.

### Adicionado (Registro Nº 067)
- **Relatórios → Régua de Alocação** (nova tela): mostra como sua receita do mês se distribuiu entre Essenciais, Estilo de vida, Obrigações e Poupança e Patrimônio, comparando com uma faixa de referência calibrada pela sua própria receita do período. Despesas ainda sem um bloco definido, e receita que não virou despesa nem aporte, aparecem destacadas separadamente em vez de escondidas dentro de outro número.

### Segurança (Registro Nº 066)
- **Acesso do consultor**: consultor (papel Consultor/ADVISOR) deixa de ter permissão automática para editar ou excluir lançamentos — nasce só com leitura, mesmo já atribuído a um workspace. O administrador da plataforma concede escrita explicitamente em `/admin/usuarios` (botão "conceder", ao lado do nome do consultor), revogável a qualquer momento; toda concessão/revogação fica registrada na auditoria do workspace. Trocar de consultor sempre reinicia essa permissão do zero.

### Adicionado (Registro Nº 065)
- **Documentação**: `ARQUITETURA-METODO-PROSPECTAR.md` — proposta de arquitetura para integrar a Metodologia PROSPECTA v5.0 (consultoria financeira, Painel de Saúde Financeira, Régua de Alocação, camada comercial Start/Pro/Max) ao sistema já em produção. Documento de projeto, ainda sem nenhum código ou schema alterado — aguardando aprovação item a item antes da implementação.

## 2026-08-12

### Adicionado (continuação, mesmo dia — Registro Nº 064)
- **Compromissos → Lista e Incidentes**: caixa de seleção por linha + "Selecionar todos", com ação em lote ("Marcar como pago/recebido" na Lista, "Confirmar selecionados" em Incidentes). As duas telas ganharam filtro de datas por vencimento (De/Até).
- **Compromissos → Incidentes, editar**: novo botão "Salvar e Confirmar" ao lado de "Salvar"/"Cancelar" — grava as correções e já tira a linha da lista de incidentes. "Salvar" sozinho grava as correções mas mantém a linha pendente, pra conferir depois.

### Alterado (continuação, mesmo dia — Registro Nº 063)
- **Importação de planilha/extrato/fatura**: erros durante a importação agora aparecem num popup centralizado na tela, em vez de um texto pequeno em vermelho acima do formulário — mais difícil de passar despercebido.

### Corrigido (continuação, mesmo dia — Registro Nº 062)
- **Importação de planilha (CSV)**: importações grandes (centenas de linhas, típico de uma planilha histórica completa) podiam falhar com "Erro interno." depois da prévia carregar normalmente. Causa: a transação do banco que grava os lançamentos tinha um limite de tempo curto demais para lotes grandes. Nenhum dado chegava a ser gravado quando isso acontecia (a operação inteira era desfeita), mas confirmamos e aumentamos esse limite para evitar o erro.

### Corrigido (continuação, mesmo dia — Registro Nº 061)
- **Painel, Balanço**: um aporte de investimento não é mais somado como se fosse receita — agora é descontado, porque tira dinheiro da carteira disponível (só volta a ficar líquido se resgatado). Uma retirada, ao contrário, aumenta o Balanço, porque devolve liquidez. Dividendo/aluguel recebido de verdade não muda (já era tratado como Receita). A correção também alcança o Balanço Anual e o Fluxo Projetado, que usam a mesma fórmula.

### Alterado (continuação, mesmo dia — Registro Nº 061)
- **Painel, gráficos "Últimos 6 meses" e "Provisão"**: a barra de Despesa agora desenha acima do zero, igual a Receita (diferenciada só pela cor vermelha) — antes ficava abaixo, dificultando a comparação visual entre as duas. Nova linha branca de "Investimento" no gráfico, podendo aparecer abaixo de zero num mês de retirada.

### Corrigido
- **Patrimônio → Dívidas, filtro de curto/longo prazo**: critério trocado de "vencimento da última parcela" para "quantidade de parcelas restantes" — o critério anterior classificava errado quando havia parcela atrasada (ex.: um financiamento 1/24 com 23 parcelas restantes aparecia em "Curto prazo"; um 1/12 com 11 restantes aparecia em "Longo prazo", o oposto do esperado).
- **Investimentos, Carteira**: arquivar um investimento não faz mais ele sumir da lista — continua visível, numa seção "Arquivados" separada e esmaecida (podia dar a impressão de que o valor tinha desaparecido do sistema, quando na verdade só ficava sem aparecer na Carteira).
- **Tela de login/cadastro**: mensagens de erro do Supabase (senha fraca, e-mail já cadastrado, credenciais inválidas etc.) apareciam em inglês, cruas — agora sempre em português. Logo, título e subtítulo do card também passaram a ficar centralizados.

### Adicionado
- Investimentos: a tabela "histórico de movimentações" ganhou botão "Excluir" por linha, ao lado de "Editar" — remove o lançamento de verdade (com confirmação antes, por ser irreversível).
- **Bloqueio de acesso ao sistema (admin-only)**: em Admin → Usuários, o administrador pode pausar o acesso de um cliente (fatura em aberto, solicitação do próprio cliente, verificação de segurança, orientação do consultor ou outro motivo, escrito por ele) sem excluir a conta. O cliente bloqueado, ao tentar acessar, vê uma mensagem explicando o motivo — reversível a qualquer momento pelo mesmo admin.

### Segurança
- Corrigidos os achados do Supabase Security Advisor em produção: `_prisma_migrations` (única tabela sem proteção de acesso por linha) agora protegida; as 5 funções internas do sistema deixaram de ser executáveis por visitantes sem login via API — só quem está logado (e só quando de fato preciso) continua com acesso. Nenhum efeito no funcionamento do sistema (a correção fecha uma porta que o próprio app nunca usava). Falta uma configuração manual do administrador no painel do Supabase ("Leaked password protection") — passo a passo entregue separadamente.
- **Autocadastro passa a exigir aprovação do administrador**: quem cria conta sozinho (e-mail/senha ou primeiro login via Google), sem ter sido convidado, fica com acesso pausado até um admin aprovar em Admin → Usuários — o admin recebe um e-mail avisando na hora. Convite por e-mail específico (Admin → Clientes) continua dando acesso imediato, sem mudança. Dica de senha (mínimo de 10 caracteres, com maiúscula, minúscula, número e símbolo) adicionada na tela de cadastro.

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
