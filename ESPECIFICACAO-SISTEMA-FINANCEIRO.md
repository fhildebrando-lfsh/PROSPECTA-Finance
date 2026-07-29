# Sistema de Gestão Financeira Pessoal e Familiar
## Especificação Funcional e Técnica — v1.0

> **Para quem lê este documento:** este é o briefing completo para construção do sistema.
> Ele foi extraído por engenharia reversa de uma planilha Google Sheets em uso real e
> contínuo desde 2016, com ~5.900 lançamentos registrados. A planilha funciona: as regras
> aqui descritas são regras validadas na prática, não hipóteses. O objetivo do sistema é
> **preservar integralmente o modelo mental já validado** e eliminar o atrito de entrada
> de dados.
>
> **Regra de ouro:** onde este documento descreve um comportamento da planilha, ele é
> requisito. Onde propõe uma melhoria, está marcado como `[MELHORIA]`. Onde há dúvida,
> está marcado como `[DECIDIR]` e deve ser confirmado com o dono do produto antes de
> implementar.

---

# PARTE I — CONTEXTO E VISÃO

## 1. O que é este sistema

Uma plataforma web (com uso pleno em desktop e lançamento rápido em celular) para
gestão financeira pessoal e familiar, construída sobre um modelo contábil de quatro
naturezas — Receita, Despesa, Investimento e Outro — com hierarquia
`Tipo → Categoria → Subcategoria`, controle por carteira (conta/cartão/caixinha),
controle de parcelamentos e recorrências, e projeção de fluxo de caixa futuro.

## 2. Quem usa

| Papel | Descrição | Fase |
|---|---|---|
| **Titular** | Felipe. Faz lançamentos, configura o sistema, vê tudo. | 1 |
| **Cônjuge** | Esposa. Faz lançamentos, vê relatórios da família. | 1 |
| **Terceiros rastreados** | Irmãos, tios, colegas — **não são usuários**, são *responsáveis* atribuídos a lançamentos (ex.: uma despesa que o irmão vai reembolsar). Nunca acessam o sistema. | 1 |
| **Cliente de consultoria** | Pessoa externa com espaço de dados isolado. | 3 |
| **Consultor** | Titular atuando como profissional, com visão sobre múltiplos clientes. | 3 |

**Importante para a modelagem:** "Responsável" e "Usuário" são conceitos **diferentes**.
A planilha tem 12 responsáveis (`Felipe (eu)`, `Lucas (irmão)`, `Dani (Ex)`,
`Felipe & Dani`, `Jaque (sicoob)`, `Hussar (PM)`, etc.) e apenas 1–2 pessoas que
efetivamente operam o arquivo. Não colapse os dois em uma tabela só.

## 3. O problema central a resolver

A planilha resolve *o quê* controlar. Ela **não** resolve o atrito de captura. Hoje é
preciso abrir o PC, achar a aba `DADOS`, ir à última linha, e preencher ~15 colunas com
dropdowns encadeados. O resultado previsível: despesas pequenas deixam de ser lançadas
e a qualidade do dado cai.

O sistema deve atacar isso em três níveis, nesta ordem de prioridade:

1. **Manual rápido (Fase 1):** lançar uma despesa no celular em **≤ 4 toques e ≤ 10
   segundos**, com valores default inteligentes. Este é o requisito de sucesso mais
   importante da Fase 1.
2. **Semiautomático (Fase 2):** importação de OFX/CSV com sugestão de categorização.
3. **Automático (Fase 3):** Open Finance via agregador (Pluggy/Belvo).

## 4. Princípios de projeto

- **O modelo de dados é sagrado, a interface é descartável.** Se houver conflito entre
  fidelidade ao modelo da planilha e conveniência de UI, o modelo vence.
- **Nada de perda histórica.** Os ~5.900 lançamentos desde 2016 migram integralmente,
  com IDs preservados.
- **Multi-tenant desde o primeiro dia.** Toda tabela de dados carrega `workspace_id`,
  mesmo que na Fase 1 exista um único workspace. Retrofitar isolamento depois é caro e
  arriscado.
- **Auditabilidade.** Todo lançamento guarda quem criou, quando, e o histórico de
  alterações de valor e situação.
- **Entrega incremental e usável.** Cada fase termina com o sistema em uso real. Não
  existe uma fase de "só infraestrutura".

---

# PARTE II — GLOSSÁRIO DO DOMÍNIO

Termos do usuário → termos do sistema. **Use os termos do usuário em toda a interface.**

| Termo do usuário | Significado | Nome técnico sugerido |
|---|---|---|
| **Lançamento** | Uma linha da aba `DADOS`. Unidade atômica do sistema. | `entry` |
| **Tipo de Carteira** | Onde o dinheiro está ou por onde transitou: banco, cartão, caixinha, voucher, dinheiro físico. | `wallet` |
| **Tipo** | Natureza do lançamento. 4 valores fixos: Receita, Despesa, Investimento, Outro. | `entry_nature` |
| **Categoria** | 2º nível da hierarquia. Depende do Tipo. | `category` |
| **Subcategoria** | 3º nível. Depende da Categoria. | `subcategory` |
| **Compra** | Data do fato gerador (quando comprou/contratou). | `transaction_date` |
| **Vence** | Data de liquidação (quando sai/entra do bolso). | `due_date` |
| **Responsável** | A quem o lançamento pertence ou de quem se cobra. | `responsible` |
| **Situação** | Estado de liquidação: a pagar, pago, a receber, recebido, Isento, aquisição, atualização, estimativa. | `status` |
| **Resultado** | Campo **calculado**: "Ok" ou "vencido há N dias" ou "em N dias". | `derived_status` |
| **Recorrência** | Campo polivalente: nº da parcela **ou** periodicidade. **Precisa ser desmembrado.** | ver §8.3 |
| **ID Grupo** | Vincula lançamentos que nasceram do mesmo evento. | `group_id` |
| **Caixinha** | Sub-conta do Nubank usada como envelope de objetivo (Reserva de Emergência, Viagem, Seguro do Carro...). | `wallet` com `kind = 'caixinha'` |
| **Organização** | Marcador auxiliar (`CONTA`, vazio). Uso não determinado. | `[DECIDIR]` |

---

# PARTE III — MODELO DE DADOS

## 5. Diagrama de entidades

```
workspace (tenant)
 ├─ user ──────────────< membership >───── workspace
 ├─ person                        (responsáveis: Felipe, Dani, Lucas, Hussar…)
 ├─ institution                   (Itaú, Nubank, Sicoob, Caixa…)
 ├─ wallet ─────────────► institution
 │    └─ wallet_kind            (conta bancária, cartão de crédito, caixinha, voucher…)
 ├─ category ───────────► entry_nature
 │    └─ subcategory
 ├─ entry_group                  (agrupa parcelas / recorrências)
 │    └─ entry ─────────► wallet, category, subcategory, person, entry_group
 │         └─ entry_audit
 ├─ goal                         (Sonhos/Metas) ──► wallet (caixinha vinculada)
 ├─ asset                        (Patrimônio: imóveis, veículos, intangíveis)
 │    └─ asset_valuation         (aquisição / valorização / desvalorização)
 ├─ debt                         (Dívidas: financiamentos, consignados)
 ├─ budget                       (Orçamento por categoria/mês)
 └─ card_statement               (fatura de cartão: competência + vencimento)
```

## 6. Enumerações fixas

Estes valores vêm da planilha e **não devem ser inventados nem "melhorados"** sem
autorização.

### 6.1 `entry_nature` (Tipo) — 4 valores
```
RECEITA | DESPESA | INVESTIMENTO | OUTRO
```

### 6.2 `wallet_kind` (Tipos de Contas) — 10 valores
```
CARTAO_CREDITO | CARTAO_DEBITO | CARTEIRA_FISICA | CONTA_ATIVO
CONTA_BANCARIA | CONTA_CAIXA   | CONTA_INVESTIMENTO | VOUCHER
CONTA_PAGAMENTO | CONTA_RECEBIVEL
```

Os dois últimos são acréscimos ao conjunto da planilha:

- **`CONTA_PAGAMENTO`** — carteiras digitais de pagamento que não são banco nem cartão
  (99 Pay, PicPay, Mercado Pago, PayPal). Comportam-se como conta corrente para efeito de
  saldo, mas são uma categoria própria em qualquer integração de Open Finance.
- **`CONTA_RECEBIVEL`** — dinheiro que está com terceiros e deve voltar (empréstimos a
  amigos). Saldo positivo significa "tenho a receber". Ver §9.

**Esta enumeração é extensível.** Novos tipos de carteira surgem no mercado com
frequência, então `wallet_kind` deve ser uma tabela de referência no banco (com `code`,
`label`, `affects_net_worth`, `is_liability`), **não** um `enum` nativo do Postgres nem
um union type fixo no TypeScript. Adicionar um tipo novo tem que ser um `INSERT`, não uma
migration com alteração de tipo.

### 6.3 `status` (Situação) — 8 valores
```
A_PAGAR | PAGO | A_RECEBER | RECEBIDO | ISENTO | AQUISICAO | ATUALIZACAO | ESTIMATIVA
```

Semântica:

| Valor | Quando usar | Entra no saldo realizado? |
|---|---|---|
| `A_PAGAR` | Despesa futura ou vencida não paga | Não |
| `PAGO` | Despesa liquidada | Sim |
| `A_RECEBER` | Receita prevista | Não |
| `RECEBIDO` | Receita liquidada | Sim |
| `ISENTO` | Obrigação existiu mas valor foi R$ 0,00 (ex.: IPVA isento, DAS MEI zerado). **Preserva o registro sem impactar valores.** | Sim (com valor 0) |
| `AQUISICAO` | Entrada de um bem no patrimônio | Sim, no patrimônio |
| `ATUALIZACAO` | Reavaliação de valor de bem/conta | Sim, no patrimônio |
| `ESTIMATIVA` | Projeção/previsão, não é compromisso firme | Não — apenas em relatórios de projeção |

### 6.4 `recurrence_kind` (periodicidades observadas)
```
UNICA | VARIAVEL | MENSAL | BIMESTRAL | TRIMESTRAL | QUADRIMESTRAL | SEMESTRAL
ANUAL | BIENIO | TRIENIO | QUINQUENIO | DECENIO | VICENIO | PATRIMONIO | PREVISAO
```

> `PATRIMONIO` e `PREVISAO` não são periodicidades reais — são marcadores usados na
> planilha para excluir linhas de certos relatórios. `[MELHORIA]` No sistema, resolver
> isso com flags booleanas (`is_patrimonio`, `is_projecao`) em vez de poluir a
> enumeração de recorrência. Manter o valor original em `legacy_recurrence_label` para
> rastreabilidade da migração.

## 7. Taxonomia completa (Tipo → Categoria → Subcategoria)

Esta taxonomia deve ser **carregada por seed**, não digitada pelo usuário. Ela é editável
pelo usuário depois, mas nasce completa.

### 7.1 RECEITA — 30 categorias, sem subcategoria
```
13º Salário · 14º Salário · Aluguel · Ajuste · Bico · Bônus · Cashback · Crédito
Crédito (outros) · Desconto · Empréstimos · Estorno · Férias · Hora Extra
Investimentos · Outras (receitas) · Participação nos Lucros · Pensão · Pró-labore
Reembolso · Recebimentos · Recebimentos de Terceiros · Renda · Renda Extra
Restituição de IR · Salário (líquido) · Salário + Férias (líquido)
Salário + 13º (líquido) · Venda (outros) · Voucher
```

> Na planilha estas categorias recebem subcategorias-placeholder ("não necessário 1…29")
> por limitação técnica do dropdown encadeado. **No sistema, subcategoria é
> simplesmente opcional.** Não migrar os placeholders.

### 7.2 DESPESA — 10 categorias, ~300 subcategorias

A numeração no nome (`1.Alimentação`) define a ordem de exibição em todos os
relatórios. Preservar como campo `sort_order` separado do nome.

| # | Categoria | Nº aprox. de subcategorias |
|---|---|---|
| 1 | Alimentação | 34 |
| 2 | Habitação | 17 |
| 3 | Art. Residência | 39 |
| 4 | Vestuário | 29 |
| 5 | Transporte | 38 |
| 6 | Saúde | 24 |
| 7 | Des. Pessoais | 51 |
| 8 | Educação | 25 |
| 9 | Comunicação | 14 |
| 10 | Outras Desp. | 11 |

A lista integral está em **`seeds/seed_taxonomia.csv`** (393 combinações
Tipo→Categoria→Subcategoria) e deve ser importada verbatim, incluindo acentuação e
maiúsculas. Exemplos por categoria, para calibrar o nível de granularidade esperado:

- **1.Alimentação:** Açougue, Barzinho, Bebidas, Bebidas (alcoólica), Bolo, Carne,
  Café/Lanche, Cafeteria, Cerveja, Chá, Churrasco, Comida Japonesa, Delivery, Doce,
  Empório (diversos), Espetinho, Feira, Frango Assado, Lanche/Lanchonete, Marmita,
  Massas, Oleaginosas, Padaria, Pizza/Pizzaria, Refeição (almoço/janta), Restaurante,
  Sorveteria, Supermercado, Suplemento, Varejão, Vinho, Outros (alimentos), Ajuste
- **9.Comunicação:** Acesso à Internet, Aparelho Telefônico, App de Celular, Assinatura
  Benefícios, Assinatura Marketing, Assinatura TV/Tel/Int, Chip, Correios,
  IA - Inteligência Artificial, Plano de Tel. Fixa, Plano de Tel. Móvel, Serviços de
  Streaming, Tecnologia, Diverso
- **Outras Desp.:** Compra internacional, Despesas c/ Juros, Despesas c/ Juros
  (bancário), Empréstimo Consignado, Empréstimo Pessoal, Tarifas bancárias, Taxa Banco
  (outros), Taxa de cartão (anualidade), Taxa de serviços (bancário), Tributo,
  Outras (despesas)

### 7.3 INVESTIMENTO — 13 categorias, sem subcategoria
```
Aportes · Câmbio · Dividendos · Fundo Ativo · Fundo Passivo · Ganho de Capital
Impostos · Investimentos (empresa) · Investimentos (outros) · Perdas · Renda Fixa
Renda Variável · Retiradas
```

**Decisão do dono do produto (Questão 4 — resolvida):** caixinha **é carteira**, não é
investimento.

> As caixinhas do Nubank são apenas uma forma de organizar onde está cada dinheiro.
> A NuInvest é outra coisa: é corretora, oferece produtos financeiros de verdade, e isso
> sim é investimento.

O que decorre disso, e é o ponto mais importante desta seção:

| Ação | Como era na planilha | Como fica no sistema |
|---|---|---|
| Guardar R$ 500 na Caixinha Viagem | Lançamento de INVESTIMENTO, categoria `Caixinha (Viagem)` | **Transferência** entre carteiras: sai da NU Conta, entra na NU (Cx Viagem). Não é receita, não é despesa, não é investimento. |
| Aplicar R$ 500 na NuInvest | Lançamento de INVESTIMENTO | Continua INVESTIMENTO, categoria `Aportes`, carteira NuInvest. |

**Por que isso importa:** enquanto a caixinha era tratada como investimento, todo dinheiro
guardado aparecia como se tivesse saído do seu bolso. Guardar R$ 2.000 para a viagem
inflava a linha INVESTIMENTO do mês sem que seu patrimônio tivesse mudado em um centavo —
o dinheiro só trocou de gaveta. Com caixinha como carteira, o patrimônio líquido fica
correto e a linha INVESTIMENTO passa a significar o que ela deve significar: dinheiro que
foi para um produto financeiro e está rendendo.

As 13 categorias `Caixinha (...)` foram **removidas** do seed de INVESTIMENTO, que passou
de 26 para 13 categorias. As 13 carteiras `NU (Cx ...)` permanecem em `seed_carteiras.csv`
com `kind = CONTA_CAIXA` e a coluna `goal_purpose` já preenchida.

### 7.4 OUTRO — 13 categorias com subcategorias

| Categoria | Subcategorias |
|---|---|
| Bens Numerários | dinheiro em caixa, dinheiro em banco, valorização, desvalorização |
| Bens de Renda | valorização, desvalorização |
| Bens de Uso - Tangível | veículos, imóveis, outros, valorização, desvalorização |
| Bens de Uso - Intangível | marca/patente, outros, valorização, desvalorização |
| Bens de Venda | vendas de aquisições, outros, valorização, desvalorização |
| Bens | — |
| Câmbio | Compra, vendas, Compra e Venda, Outros |
| Despesas_Terceiros | Outros |
| Dívidas | Empréstimo (outros), Empréstimo Consignado, Empréstimo Pessoal CDC, Financiamento, Outras |
| Movimentações | Incluso na folha de Pg, Atualização de conta, Dinheiro de terceiros, Outros |
| Sonhos_Metas | Viagem, Viagem dos sonhos, Viagem para o exterior, Faculdade, Casa dos sonhos, Casa, Carro, Carro dos sonhos, Outros |
| Transferências | Saques, Depósitos, Saques e Depósitos, Entre Contas, Outras movimentações, Dividendos |
| Outros | Serviços de Streaming de terceiros, Compra internacional, Outro |

**O tipo `OUTRO` é o mais delicado do modelo.** Ele acumula quatro funções distintas que
a planilha não conseguiu separar:

1. **Patrimônio** (Bens *) — deveria ser a entidade `asset` + `asset_valuation`
2. **Dívidas** — deveria ser a entidade `debt`
3. **Metas** (Sonhos_Metas) — deveria ser a entidade `goal`
4. **Movimentações neutras** (Transferências, Câmbio) — são transferências entre
   carteiras, que **não devem afetar receita nem despesa**

`[MELHORIA]` O sistema deve ter entidades dedicadas para 1, 2 e 3, e um tipo de
lançamento `TRANSFERENCIA` de verdade para 4 (com carteira de origem *e* destino).
Na migração, os lançamentos históricos de `OUTRO` são convertidos para as novas
entidades preservando `legacy_nature = 'OUTRO'` e a categoria original.

## 8. Entidade central: `entry` (Lançamento)

### 8.1 Campos

| Campo | Tipo | Obrigatório | Origem na planilha | Notas |
|---|---|---|---|---|
| `id` | UUID | sim | — | chave interna |
| `legacy_id` | int | não | coluna `ID` | preservar (último = 5877) |
| `workspace_id` | UUID | sim | — | multi-tenant |
| `group_id` | UUID | não | coluna `ID Grupo` | ver §8.4 |
| `transaction_date` | date | sim | `Compra` | |
| `due_date` | date | sim | `Vence` | |
| `settled_at` | date | não | `[MELHORIA]` | data efetiva da liquidação |
| `wallet_id` | UUID | sim | `Tipo de Carteira` | |
| `nature` | enum | sim | `Tipo` | |
| `category_id` | UUID | sim | `Categoria` | |
| `subcategory_id` | UUID | não | `Subcategoria` | |
| `description` | text | sim | `Descrição` | ver §8.2 |
| `responsible_id` | UUID | sim | `Responsáveis` | |
| `amount` | decimal(14,2) | sim | `Valor` | **com sinal** — ver §8.3 |
| `recurrence_kind` | enum | sim | `Recorrência` | ver §8.5 |
| `installment_number` | int | não | `Recorrência` (numérico) | ver §8.5 |
| `installment_total` | int | não | derivado | ver §8.5 |
| `status` | enum | sim | `Situação` | |
| `note` | text | não | `Observação` | |
| `tags` | text[] | não | `Organização` | ver nota abaixo |
| `created_by` / `updated_by` | UUID | sim | — | auditoria |
| `created_at` / `updated_at` | timestamptz | sim | — | auditoria |

> **Sobre a coluna `Organização`** (valores `CONTA` ou vazio): o uso não foi determinado
> e ela aparece em uma minoria dos lançamentos. Em vez de criar um campo de significado
> desconhecido, ela vira um **array de tags** livres. Tags cobrem esse caso e vários
> outros que uma coluna fixa não cobriria — marcar lançamentos de uma viagem específica,
> de uma reforma, de um cliente a reembolsar. São filtráveis e não exigem alteração de
> schema para cada novo uso.

**Campos calculados — nunca persistir, sempre derivar:**
`derived_status` (Resultado), `days_to_due` (DIAS P/), `due_month`, `due_year`.
A planilha materializa essas colunas porque o Sheets não tem *views*. O sistema não deve
repetir esse erro.

### 8.2 Padrão da descrição

As descrições seguem um padrão informal consistente que carrega informação estruturada:

```
APTO FINANC. CEF - R VICENTE GOLFETO, 251
SEGURO SUHAI - BMW/R 1200 GS ADV
CELULAR PÓS-PAGO - CLARO - DANIELA
IPVA - HYUNDAI/VERACRUZ
CORTE CABELO (Barbearia Estrada)
RELÓGIO GALAXY WACHT6 (MercadoLivre*mercadol)
TÊNIS FILA CARBON RACE (Filo Outlet Santa Ursu)
```

Dois padrões: `ITEM - QUALIFICADOR` (contratos/serviços recorrentes) e
`ITEM (ESTABELECIMENTO)` (compras avulsas, onde o parêntese frequentemente reproduz o
descritor da fatura).

`[MELHORIA]` Adicionar campos opcionais `merchant` (estabelecimento) e `asset_ref`
(bem relacionado — qual veículo, qual imóvel). Isso viabiliza consultas como "quanto
custou a BMW este ano" sem depender de busca textual. Não obrigatório na Fase 1, mas o
schema deve prever.

### 8.3 Sinal do valor

Na planilha, o valor é armazenado **com sinal**: despesas negativas, receitas positivas.
Preservar esse comportamento — ele é o que faz `SOMA(coluna)` ser diretamente o saldo, e
está enraizado em todos os relatórios.

Regras de validação (soft — avisar, não bloquear, porque `Ajuste` e `Estorno` fogem):
- `nature = RECEITA` → espera-se `amount > 0`
- `nature = DESPESA` → espera-se `amount < 0`
- `status = ISENTO` → `amount = 0`

Na interface, o usuário **nunca digita o sinal**. Ele escolhe Receita ou Despesa e digita
o valor absoluto; o sistema aplica o sinal.

### 8.4 Agrupamento (`group_id`)

**Regra confirmada pelo dono do produto:**

> Todo lançamento tem um **ID próprio e único** que identifica aquela linha.
> Adicionalmente, lançamentos que **se estendem por mais de um mês** compartilham um
> **ID de grupo**, que permite localizar o compromisso completo.

Ou seja, `entry_group` representa **um compromisso financeiro que atravessa meses**.
Todas as parcelas de um financiamento, todas as ocorrências de uma assinatura mensal,
todas as parcelas de um 13º pertencem ao mesmo grupo. Lançamentos avulsos de mês único
não precisam de grupo (`group_id` nulo) — embora seja aceitável criar um grupo de um
elemento só, para uniformidade de código.

> **Nota sobre a planilha de origem:** foram observadas parcelas consecutivas do mesmo
> contrato com IDs de grupo diferentes (Seguro Suhai, parcelas 1/2/3 com grupos 42/52/78).
> Isso é desvio de preenchimento manual, não regra. Como não haverá migração histórica
> (§18), o desvio não se propaga: no sistema o `group_id` passa a ser **atribuído
> automaticamente** na criação do parcelamento ou da recorrência, nunca digitado.

Isso habilita operações que hoje são manuais e dolorosas:
- editar valor de todas as parcelas futuras de uma vez
- marcar um contrato como encerrado (cancelar as ocorrências futuras)
- ver "quanto ainda devo neste financiamento"
- responder "quanto o apartamento já me custou desde 2016" (na planilha: 115+ linhas)

### 8.5 Recorrência e parcelamento

A coluna `Recorrência` da planilha é polivalente e precisa ser desmembrada em três
campos:

| Conteúdo na planilha | `recurrence_kind` | `installment_number` | `installment_total` |
|---|---|---|---|
| `1`, `2`, `105` | `UNICA` (parcelada) | 1, 2, 105 | derivado do grupo |
| `Mensal` | `MENSAL` | null | null |
| `Anual` | `ANUAL` | null | null |
| `Variável` | `VARIAVEL` | null | null |
| `Patrimônio` | `UNICA` + `is_patrimonio = true` | null | null |
| `previsão` | `UNICA` + `is_projecao = true` | null | null |

**Regra de geração:** ao criar um lançamento parcelado em N vezes, o sistema gera N
lançamentos com o mesmo `group_id`, `installment_number` de 1 a N, `due_date` avançando
mês a mês, e `transaction_date` idêntica em todos. Este é exatamente o comportamento
observado nos financiamentos da planilha (ver o `APTO FINANC. CEF`, 115+ parcelas de
2016 até hoje, todas com `Compra` = data original).

**Regra de recorrência sem fim** (`MENSAL` para assinaturas, seguros) — **decidido:
materializar**. As duas opções consideradas foram:
- **(a)** materializar N meses à frente (ex.: 24) e estender por job mensal — mantém o
  modelo da planilha, relatórios simples;
- **(b)** guardar só a regra e gerar ocorrências virtuais na leitura — mais elegante,
  mais complexo de reconciliar quando uma ocorrência específica muda de valor.

**Escolhida: opção (a), materializar 24 meses à frente**, com um job mensal que estende a
janela. É o que o usuário já entende, e assinaturas mudam de valor com frequência (o
Spotify aparece a R$ 34,90 e a R$ 0,00 em meses diferentes), o que exige ocorrências reais
e editáveis uma a uma. Ocorrências virtuais dariam um modelo mais elegante e uma dor de
cabeça permanente de reconciliação.

Regras do job: roda no dia 1º, estende cada grupo ativo até 24 meses à frente, **nunca
sobrescreve** ocorrência já existente, e é idempotente — rodar duas vezes no mesmo dia não
duplica nada.

## 9. Entidade `wallet` (Carteira)

47 carteiras ativas na planilha. Campos: `name`, `kind`, `institution_id`,
`is_active`, `color`, `credit_limit`, `closing_day`, `due_day`, `linked_wallet_id`.

Classificação das carteiras existentes:

| Grupo | Carteiras |
|---|---|
| **Contas bancárias** | Banco do Brasil, Banco Inter, Bradesco, C6 Bank, Caixa Econômica, Itaú, NU Conta, Safra, Santander, Sicoob, 99 Pay, Conta de terceiros, Outras (contas) |
| **Cartões de crédito** | Cartão Casas Bahia, Cartão Bradesco (Gold), Cartão CEF (ELO), Cartão Inter (Black), Cartão Itaú (PDA Black), Cartão Itaú (PDA Platinum), Cartão Itaú (Signature), Cartão ITAÚ Uniclass, Cartão Nubank (Platinum) |
| **Caixinhas (envelopes)** | NU (Cx Cartão à prazo), NU (Cx Cartão à vista), NU (Cx Casa), NU (Cx Estudo), NU (Cx Outros), NU (Cx Reforma), NU (Cx Res. de Emerg), NU (Cx Res. de Oport), NU (Cx Seg. Carro), NU (Cx Seg. Moto), NU (Cx Sonhos), NU (Cx Veículo), NU (Cx Viagem) |
| **Investimento** | BTG Pactual, Clear, ModalMais, NUInvest, XP Investimento |
| **Vouchers** | Pluxee Aliment Pass, Sodexo Aliment Pass, Ticket Alimentação, Ticket Restaurante |
| **Físico / especial** | Dinheiro, Patrimônio, Dívidas c/ Terceiros |

Dois casos especiais, confirmados com o dono do produto:

- **`Patrimônio`** não é carteira de verdade — é uma pseudo-conta usada para registrar
  bens. Deve virar a entidade `asset` (§7.4).
- **`Dívidas c/ Terceiros`** é **dinheiro emprestado a amigos** — um recebível, não uma
  dívida. Apesar do nome herdado, o saldo positivo significa "tenho a receber".
  Modelar como carteira de `kind = CONTA_RECEBIVEL`, e **renomear na interface para
  "Empréstimos a Terceiros"**, que descreve o que é.

  Emprestar R$ 500 ao Lucas gera dois efeitos: saída de R$ 500 da conta real e entrada
  de R$ 500 em `Empréstimos a Terceiros` com `responsible = Lucas (irmão)`. É uma
  transferência entre carteiras (§10 R5), não uma despesa — o patrimônio não mudou, só
  mudou de lugar. Quando o Lucas devolve, a transferência é no sentido inverso.
  `[MELHORIA]` Uma tela "quem me deve o quê", agrupada por responsável, sai de graça
  desse modelo e hoje não existe na planilha.

**Campos de cartão de crédito** (`closing_day`, `due_day`) são novos, não existem na
planilha, e são o que permite calcular a fatura corretamente — ver §11.4.

**`linked_wallet_id`**: a caixinha `NU (Cx Cartão à vista)` e `NU (Cx Cartão à prazo)`
existem para provisionar a fatura do cartão. Esse vínculo caixinha↔cartão precisa ser
explícito para o indicador de cobertura de fatura funcionar (§11.5).

---

# PARTE IV — REGRAS DE NEGÓCIO E CÁLCULOS

## 10. Regras de lançamento

**R1 — Duas datas, sempre.** `Compra` é o fato gerador, `Vence` é a liquidação. Elas
divergem sistematicamente em compras no cartão (compra em 03/01, vence em 09/02).
Nenhum relatório pode assumir que são iguais.

**R2 — Regime de competência vs. caixa.** **Default: `Vence` em todos os relatórios**,
reproduzindo a planilha. Mas a tela de relatórios ganha um seletor de duas opções:

- **Caixa** (`Vence`) — "quando o dinheiro sai/entra". Default. É o que importa para
  fluxo de caixa e saldo.
- **Competência** (`Compra`) — "quando eu consumi". Responde melhor "quanto gastei no
  Natal", já que a compra de dezembro no cartão só vence em janeiro.

Um seletor resolve; escolher um dos dois para sempre deixaria metade das perguntas sem
resposta. Todo relatório precisa deixar visível qual regime está ativo — dois números
diferentes para a "mesma" pergunta, sem rótulo, é receita de desconfiança no sistema.

**R3 — `Resultado` é derivado, nunca digitado:**
```
se status ∈ {PAGO, RECEBIDO, ISENTO, AQUISICAO, ATUALIZACAO} → "Ok"
senão se due_date < hoje  → "vencido há {N} dias"
senão se status = A_RECEBER → "a receber em {N} dias"
senão                      → "a pagar em {N} dias"
```

**R4 — `Isento` preserva o registro.** Um IPVA isento continua sendo uma linha, com
valor R$ 0,00 e situação `ISENTO`. Isso mantém o histórico do compromisso e evita que a
ausência da linha seja lida como esquecimento. **Não filtrar isentos dos relatórios de
compromissos.**

**R5 — Transferências não geram receita nem despesa.** Um saque, um depósito, um aporte
em caixinha ou uma movimentação entre contas altera o saldo de duas carteiras e tem efeito
**zero** no resultado do período. Com a decisão de §7.3 (caixinha é carteira), transferência
deixa de ser detalhe e passa a ser uma das operações mais frequentes do sistema.

**Implementação obrigatória — transferência atômica.** Uma transferência cria **duas
linhas de lançamento** que nascem e morrem juntas:

| | Linha de saída | Linha de entrada |
|---|---|---|
| `wallet_id` | origem (NU Conta) | destino (NU Cx Viagem) |
| `amount` | −500,00 | +500,00 |
| `nature` | OUTRO | OUTRO |
| `category` | Transferências | Transferências |
| `transfer_id` | mesmo UUID nas duas | mesmo UUID nas duas |

Regras que o código precisa garantir:

- As duas linhas são criadas na **mesma transação de banco**. Nunca pode existir uma sem
  a outra — seria dinheiro sumindo ou aparecendo do nada.
- Editar ou excluir uma das linhas edita ou exclui **as duas**.
- A soma das duas é sempre zero. Vale um teste automatizado.
- Como `nature = OUTRO`, elas ficam **fora** de RECEITA, DESPESA e INVESTIMENTO por
  construção (§11.3). Nenhum filtro adicional é necessário — é o modelo que protege o
  cálculo, não uma regra que alguém pode esquecer de aplicar.
- Na interface é **uma** operação: "Transferir", com origem, destino e valor. O usuário
  nunca vê as duas linhas no formulário; vê as duas no extrato de cada carteira.

## 11. Cálculos do painel

### 11.1 Saldo de uma carteira
```
saldo(carteira, data_corte) =
  Σ amount de entries
  onde wallet_id = carteira
    e status ∈ {PAGO, RECEBIDO, ISENTO}
    e due_date ≤ data_corte
```

### 11.2 Blocos de saldo do dashboard

O dashboard atual agrupa saldos em três blocos e um total:

```
SUBTOTAL CONTAS       = Σ saldo(w) onde w.kind = CONTA_BANCARIA
SUBTOTAL INVESTIMENTOS = Σ saldo(w) onde w.kind ∈ {CONTA_INVESTIMENTO, CONTA_CAIXA}
SUBTOTAL VOUCHERS     = Σ saldo(w) onde w.kind = VOUCHER
SALDO LÍQUIDO TOTAL   = soma dos três subtotais
```

### 11.3 Receita / Despesa / Saldo do período
```
RECEITA(período)  = Σ amount onde nature = RECEITA      e due_date ∈ período
DESPESA(período)  = Σ amount onde nature = DESPESA      e due_date ∈ período
INVESTIMENTO(per) = Σ amount onde nature = INVESTIMENTO e due_date ∈ período
BALANÇO(período)  = RECEITA + DESPESA + INVESTIMENTO      (despesa já é negativa)
```

> `[DECIDIR]` A planilha tem duas visões — `BALANÇO` (inclui investimento) e `SALDO`
> (que na aba BALANCO diverge do balanço). Precisa ser esclarecido qual é a definição
> canônica de cada uma.

### 11.4 Fatura de cartão de crédito

Regra não implementada na planilha, e que é uma das maiores melhorias possíveis:

```
fatura(cartão, competência) =
  Σ amount de entries
  onde wallet_id = cartão
    e transaction_date entre (fechamento_anterior + 1) e fechamento_atual
```
Com `vencimento` da fatura em `due_day` do mês seguinte ao fechamento.

Isso permite responder "o que já entrou na fatura que fecha semana que vem", que hoje
exige leitura manual das linhas.

### 11.5 Cobertura de fatura (indicador existente no dashboard)
```
Caixinha Cartão  = saldo das caixinhas vinculadas ao cartão
Dívida Cartão    = Σ |amount| de entries de cartão com status = A_PAGAR
SALDO (diferença)= Caixinha Cartão − Dívida Cartão     [negativo = descoberto]
```
No dashboard de referência: R$ 78,15 − R$ 3.315,48 = **−R$ 3.237,33**, sinalizado em
vermelho com marcador de alerta.

### 11.6 Reserva de emergência (gauge do dashboard)

```
% cobertura = saldo(carteira marcada como reserva) / meta_reserva
meta_reserva = despesa_mensal_média × meses_alvo
```

**Default proposto** (a fórmula exata não estava documentada na planilha):

- `despesa_mensal_média` = média das despesas dos **últimos 6 meses fechados**,
  excluindo transferências e investimentos
- `meses_alvo` = **6**
- carteira de referência = a que estiver marcada com `goal_purpose = "Reserva de emergência"`

Ambos os parâmetros ficam **configuráveis na tela de Metas**. Seis meses é a convenção mais
usada para renda estável com vínculo formal; quem tem renda variável costuma trabalhar com
9 a 12. Como você é da área, é provável que queira ajustar — o ponto é que o sistema nasce
com um número defensável em vez de nascer sem número.

**Escala do gauge:** 0–100%, com faixas em vermelho até 33%, âmbar de 33% a 66%, verde
acima de 66%. Passar de 100% não é erro; o ponteiro trava no fim e o número real aparece
escrito.

### 11.7 Despesas fixas vs. variáveis

**Default proposto:**

```
é_fixa = recurrence_kind ∉ {UNICA, VARIAVEL}
```

Ou seja: tudo que se repete em intervalo previsível (mensal, bimestral, anual...) é fixa;
o resto é variável. Isso reproduz a intenção visível na planilha e não exige nenhum campo
novo de preenchimento.

**Com uma escapatória:** o lançamento ganha um campo opcional `is_fixed_override`
(booleano, nulo por padrão). Quando preenchido, ele manda; quando nulo, vale a regra
acima. Isso existe porque a regra automática erra em casos reais — o financiamento do
apartamento é a despesa mais fixa que existe, mas está registrado como parcela numerada,
que a regra classificaria como variável.

> A planilha apresenta `#ERROR!` nesta linha em alguns meses (janeiro e no total). Uma
> definição explícita e testável, como a acima, é justamente o que impede esse tipo de
> falha silenciosa.

### 11.8 Rankings e distribuições
```
TOP 5 RECEITAS  = entries de RECEITA no período, ordenadas por amount DESC, limit 5
TOP 5 DESPESAS  = entries de DESPESA no período, ordenadas por |amount| DESC, limit 5
DISTRIBUIÇÃO    = Σ |amount| agrupado por categoria, com % do total de despesas
```

---

# PARTE V — INTERFACE E EXPERIÊNCIA

## 12. Requisito nº 1: lançamento rápido

Esta é a tela que justifica o projeto inteiro. Ela precisa ser melhor que abrir a
planilha, ou o sistema falha.

**Meta: despesa registrada em ≤ 10 segundos, ≤ 4 toques, uma mão, na fila do caixa.**

Fluxo:
```
[ Botão flutuante + ]
        ↓
┌──────────────────────────────┐
│  R$ [teclado numérico]       │  ← foco imediato, teclado numérico nativo
│                              │
│  Despesa ● | Receita ○       │  ← default: Despesa
│                              │
│  [Carteira ▾]  [Categoria ▾] │  ← defaults: última usada / mais provável
│  [Descrição………………]           │  ← opcional
│                              │
│         [ Salvar ]           │
└──────────────────────────────┘
```

Regras de default que reduzem o atrito:
- **Carteira:** a última usada nas últimas 24h.
- **Categoria/subcategoria:** sugestão por histórico do texto da descrição. Se o usuário
  digitou "Padaria" 40 vezes → `1.Alimentação / Padaria` pré-selecionado. Esta única
  regra elimina a maior parte do trabalho manual.
- **Datas:** `Compra` = hoje. `Vence` = hoje se conta/dinheiro; = vencimento da fatura
  vigente se cartão de crédito. **Esta regra sozinha resolve o erro mais comum.**
- **Situação:** `PAGO` se conta/dinheiro; `A_PAGAR` se cartão.
- **Responsável:** o usuário logado.

Campos avançados (parcelamento, recorrência, observação, responsável diferente) ficam
atrás de um "Mais opções" recolhido.

`[MELHORIA]` Entrada por texto livre: "35 corte cabelo" → parseia valor + descrição +
categoria sugerida. Fase 2.

## 13. Telas do sistema

### Fase 1 — essencial
| Tela | Conteúdo |
|---|---|
| **Painel** | Cards Receita/Despesa/Saldo do período · saldos por carteira agrupados · gráfico mensal receita×despesa×saldo · Top 5 receitas e despesas · distribuição por categoria · cobertura de fatura · gauge de reserva |
| **Lançamentos** | Tabela filtrável e editável in-line. Filtros: período, tipo, categoria, carteira, responsável, situação, texto. Ações em lote: marcar como pago, alterar categoria, excluir |
| **Novo lançamento** | §12 |
| **Compromissos** | O que vence — vencidos, hoje, próximos 7/30 dias. Ação de 1 toque: "marcar como pago" |
| **Cadastros** | Carteiras, categorias, subcategorias, responsáveis, instituições |

### Fase 2 — relatórios
| Tela | Equivalente na planilha |
|---|---|
| **Analítico mês a mês** | aba `RAReD` — receitas e despesas lado a lado por mês |
| **Despesas parceladas** | aba `RDP` — parcelas em aberto, quanto falta, prazo |
| **Balanço anual** | aba `BALANCO` — sintético + descritivo por categoria, 12 meses + total |
| **Orçamento** | aba `ORÇ` — orçado × realizado por categoria |
| **Fluxo projetado** | novo — saldo futuro considerando compromissos e recorrências |

### Fase 3 — planejamento e consultoria
Patrimônio e evolução patrimonial · metas com progresso · projeções de cenário
(independência financeira, aposentadoria) · área do consultor com múltiplos clientes.

## 14. Direção visual

O dashboard atual da planilha já estabeleceu uma identidade: fundo escuro violeta-azulado,
tipografia monoespaçada nos números, blocos em cartões arredondados, verde para receita,
vermelho para despesa, âmbar para saldo. **Manter essa linguagem** — é reconhecível para
o usuário e evita o retrabalho de reaprender onde as coisas estão.

Diretrizes:
- **Números são o conteúdo, não a decoração.** Uma face monoespaçada com algarismos
  tabulares (JetBrains Mono, IBM Plex Mono) para todos os valores; alinhamento à direita
  com casas decimais alinhadas. Nenhum valor financeiro em fonte proporcional.
- **A cor carrega significado, não estilo.** Verde = entrada, vermelho = saída, âmbar =
  resultado, cinza = projeção/não realizado. Nada além disso recebe cor saturada.
- **Densidade é uma feature.** O usuário vem de uma planilha e está acostumado a ver
  30 linhas de uma vez. Não substituir a tabela por cards espaçados no desktop.
- **Mobile e desktop têm jobs diferentes.** Celular: lançar e consultar saldo. Desktop:
  analisar e conciliar. Não tente espremer a mesma tela nos dois.
- Acessibilidade como piso: contraste AA, foco de teclado visível, `prefers-reduced-motion`
  respeitado.

---

# PARTE VI — ARQUITETURA TÉCNICA

## 15. Stack recomendada

Critério de escolha: o dono do produto **não programa** e vai construir o sistema
assistido por IA. A stack precisa ser mainstream (muito material de treino), integrada
(menos peças para configurar), e com deploy trivial.

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | front e back no mesmo projeto; um deploy só |
| UI | **Tailwind CSS + shadcn/ui** | componentes acessíveis, sem lock-in |
| Gráficos | **Recharts** | cobre todos os gráficos do dashboard atual |
| Tabela | **TanStack Table** | filtros, ordenação, edição in-line, virtualização |
| Banco | **PostgreSQL** (Supabase ou Neon) | relacional, row-level security nativo |
| ORM | **Prisma** | migrations versionadas, schema legível |
| Auth | **Supabase Auth** ou **Auth.js** | e-mail + Google; MFA na Fase 3 |
| Validação | **Zod** | mesmo schema no cliente e no servidor |
| Estado servidor | **TanStack Query** | cache, revalidação, offline-friendly |
| PWA | **Serwist** | instalável, funciona offline para lançar |
| Testes | **Vitest** + **Playwright** | unitário nas regras financeiras, e2e nos fluxos |
| Deploy | **Vercel** | zero configuração, preview por branch |
| Erros | **Sentry** | |

**Decisões técnicas não negociáveis:**
- Valores monetários: `Decimal` no Prisma / `NUMERIC(14,2)` no Postgres. **Nunca float.**
- Datas: `date` puro para `Compra`/`Vence` (sem fuso). `timestamptz` só para auditoria.
- Fuso: `America/Sao_Paulo`. Locale `pt-BR` em toda formatação.
- Toda regra de cálculo financeiro vive em `/lib/finance/*.ts`, é pura, e tem teste
  unitário. Nenhum cálculo dentro de componente React.

## 16. Estrutura de pastas

```
/app
  /(auth)/login
  /(app)
    /painel
    /lancamentos
    /compromissos
    /relatorios/{analitico,parcelas,balanco,orcamento}
    /cadastros/{carteiras,categorias,responsaveis}
    /configuracoes
  /api/...
/components
  /ui              → shadcn
  /finance         → MoneyInput, EntryForm, EntryTable, BalanceCard…
  /charts
/lib
  /finance         → REGRAS PURAS E TESTADAS
    balance.ts     → §11.1, §11.2
    period.ts      → §11.3
    installments.ts→ §8.5
    card.ts        → §11.4, §11.5
    derived.ts     → §10 R3
  /db              → prisma client, queries
  /validation      → schemas zod
/prisma
  schema.prisma
  /seed
    taxonomia.csv      → §7 (obrigatório, verbatim)
    carteiras.csv      → §9
    responsaveis.csv
/scripts
  import-planilha.ts   → §18
/tests
```

## 17. API (rotas principais)

```
POST   /api/entries                 criar (com geração de parcelas)
GET    /api/entries                 listar com filtros e paginação
PATCH  /api/entries/:id             editar
PATCH  /api/entries/:id/settle      marcar pago/recebido
DELETE /api/entries/:id
PATCH  /api/entry-groups/:id        editar grupo (todas as parcelas futuras)
DELETE /api/entry-groups/:id        encerrar compromisso

GET    /api/dashboard?ano&mes       payload completo do painel, 1 chamada
GET    /api/reports/monthly?ano
GET    /api/reports/installments
GET    /api/reports/budget?ano&mes

GET    /api/wallets  · POST · PATCH
GET    /api/categories?nature=      taxonomia encadeada
GET    /api/responsibles
POST   /api/import/ofx              Fase 2
```

Todas as rotas: autenticação obrigatória, `workspace_id` derivado da sessão **nunca do
payload**, validação Zod na entrada, e Row Level Security no Postgres como segunda
barreira.

## 18. Importação e exportação de dados

**Decisão do dono do produto: não haverá migração do histórico.** O sistema começa vazio.
Os dados entram de duas formas: lançados na interface ou carregados por planilha. Isso
elimina o script de conciliação como bloqueio da Fase 1 e torna o importador — que seria
descartável — a funcionalidade permanente e mais importante deste módulo.

### 18.1 Importar CSV

Botão **"Importar planilha"** na tela de Lançamentos. Fluxo em quatro passos:

```
1. Enviar arquivo    → .csv ou .xlsx, arrastar ou selecionar
2. Mapear colunas    → o sistema propõe o de-para, o usuário corrige
3. Validar           → prévia com erros e avisos, linha a linha
4. Confirmar         → importa apenas as linhas válidas
```

**Passo 2 — mapeamento.** O sistema detecta os cabeçalhos e propõe o vínculo com os
campos de §8.1. Os nomes da planilha atual (`Compra`, `Vence`, `Tipo de Carteira`,
`Tipo`, `Categoria`, `Subcategoria`, `Descrição`, `Responsáveis`, `Valor`, `Recorrência`,
`Situação`, `Observação`) devem ser reconhecidos automaticamente. O mapeamento é
salvável como *perfil de importação* reutilizável.

**Passo 3 — validação.** Duas severidades:

| Severidade | Situação | Efeito |
|---|---|---|
| **Erro** | data inválida, valor não numérico, carteira/categoria inexistente, tipo fora das 4 naturezas | linha bloqueada |
| **Aviso** | sinal do valor incoerente com o tipo (§8.3), subcategoria não pertence à categoria, possível duplicata | linha importável, sinalizada |

Valores desconhecidos em campos de lista oferecem duas saídas na própria tela:
**criar o item** (permitido para carteira e subcategoria — ver §20) ou **mapear para um
existente**. Nunca importar silenciosamente com o campo vazio.

**Detecção de duplicatas.** Chave: `due_date + amount + description + wallet`. Linhas que
batem com algo já no banco entram como aviso, com a opção "ignorar duplicatas" marcada
por padrão.

**Formato de entrada.** Aceitar as convenções brasileiras sem exigir conversão prévia:
datas `dd/mm/aaaa`, decimal com vírgula, `R$` e separador de milhar, valores negativos
com sinal ou entre parênteses. Encoding UTF-8 e Latin-1.

**Transação.** A importação é atômica por lote: ou entram todas as linhas válidas, ou
nenhuma. Todo lote gera um registro `import_batch` com arquivo original, contagens e
autor — e é **revertível com um clique** enquanto nenhum dos lançamentos tiver sido
editado depois.

### 18.2 Exportar

Botão **"Exportar"** em Lançamentos e em cada relatório, com dois formatos:

- **CSV** — dados crus, respeitando os filtros ativos na tela, cabeçalhos iguais aos que
  o importador reconhece. Exportar e reimportar tem que ser uma viagem de ida e volta sem
  perda.
- **XLSX** — planilha formatada: valores como número (não texto), datas como data,
  moeda em `R$ #.##0,00`, cabeçalho congelado e filtro automático. Relatórios com mais de
  uma dimensão saem em abas separadas.

Ambos respeitam o escopo de acesso de quem exporta (§19) e ficam registrados na trilha de
auditoria — exportação é a principal via de vazamento de dados financeiros.

### 18.3 Codificação, acentos e chaves

Os rótulos são em português e **têm acento**: `1.Alimentação`, `Saúde`, `Açougue`,
`13º Salário`. Isso é conteúdo, não sujeira — nunca remover acentos dos nomes exibidos.

O problema real não é o acento em si, é usar o mesmo texto para duas funções diferentes.
A regra é separar as duas:

| Uso | Campo | Formato | Exemplo |
|---|---|---|---|
| **Exibir** para a pessoa | `name` / `label` | português completo, com acento | `Bebidas (alcoólica)` |
| **Identificar** no sistema | `slug` | ASCII, minúsculo, só `a-z 0-9 _` | `bebidas_alcoolica` |

O `slug` é o que entra em chaves de banco, parâmetros de URL, nomes de arquivo, chaves de
tradução e no casamento de colunas do importador. Ele nunca aparece na tela. Os CSVs de
seed (§25) já trazem as colunas de slug prontas e sem colisões — a função que os gerou
está documentada abaixo e deve ser a mesma usada no sistema, para que um item criado pelo
usuário receba slug pelo mesmo critério:

```
1. º → o,  ª → a,  & → " e "
2. normalizar em NFKD e descartar os acentos combinantes
3. minúsculas, forçar ASCII
4. tudo que não for [a-z0-9] vira "_", colapsar repetidos, aparar das pontas
```

**Regras de codificação obrigatórias em toda exportação:**

- **UTF-8 sempre.** Nunca Latin-1, nunca Windows-1252.
- **CSV para abrir no Excel: UTF-8 com BOM e separador `;`.** Sem o BOM, o Excel em
  português lê `Alimentação` como `AlimentaÃ§Ã£o`; com separador `,`, joga a linha inteira
  em uma célula só. Essa combinação é a causa mais comum de "a exportação veio quebrada".
- **CSV para consumo por programa: UTF-8 sem BOM e separador `,`.** É o padrão RFC 4180.
- Valores com `;`, `,`, aspas ou quebra de linha vão entre aspas duplas, com aspas
  internas duplicadas. `Cama, mesa e banho` é o caso real que existe na taxonomia.
- No XLSX o problema não existe: acento é nativo. O cuidado ali é outro — valor tem que
  sair como número e data como data, nunca como texto.
- **Ida e volta sem perda:** exportar e reimportar tem que devolver exatamente os mesmos
  dados. Isso merece um teste automatizado, não uma conferência manual.

---

# PARTE VII — ACESSO, PERMISSÕES E DISPOSITIVOS

## 19. Modelo de acesso

O sistema abre em uma **tela de login**. Não há área pública nem conteúdo acessível sem
autenticação — é um sistema de dados financeiros, não um site.

### 19.1 Papéis

| Papel | Quem é | O que pode |
|---|---|---|
| **Administrador** | O titular e os sócios | Acesso a todos os workspaces. Cria e gerencia contas de clientes, edita listas travadas (§20), vê a trilha de auditoria, configura o sistema. |
| **Titular do workspace** | Dono de um espaço de dados (o próprio admin no workspace pessoal, ou o cliente no dele) | Tudo dentro do seu workspace: lançar, editar, importar, exportar, ver relatórios. Convida membros. |
| **Membro** | Cônjuge, sócio familiar | Igual ao titular, exceto convidar/remover membros e excluir o workspace. |
| **Somente leitura** | Contador, familiar que só acompanha | Vê e exporta. Não cria, edita nem importa. |

Pontos que decorrem disso e precisam estar no código desde o início:

- **Administrador é um papel global, não do workspace.** Um admin acessa o workspace de
  qualquer cliente; um titular acessa apenas o seu. São duas verificações diferentes e
  não devem compartilhar a mesma função de autorização.
- **Todo acesso de administrador a workspace de terceiro é registrado** — quem, quando,
  qual workspace, quais telas. Na Fase 4 (consultoria), isso deixa de ser boa prática e
  passa a ser exigência: o cliente tem direito de saber quando seus dados foram vistos.
- **Nenhuma rota confia no `workspace_id` que vem do cliente.** Ele é sempre derivado da
  sessão e validado contra a associação do usuário, com Row Level Security no Postgres
  como segunda barreira.

### 19.2 Autenticação

O dono do produto não tem preferência técnica aqui, então a recomendação é a opção que
resolve o problema com menos peças para manter:

**Escolha: Supabase Auth.** Motivos concretos, não de preferência:

- Já vem com e-mail/senha, login com Google, recuperação de senha, verificação de e-mail
  e MFA por app autenticador — tudo isso é trabalho que não precisa ser escrito.
- Integra-se nativamente ao Row Level Security do Postgres. Como o banco já é Postgres
  (§15), o mesmo `auth.uid()` que autentica também isola os dados no nível da linha. Com
  uma solução de auth separada, esse isolamento vira código de aplicação — mais lugares
  para errar.
- Senhas ficam com o provedor. O sistema nunca armazena hash de senha, o que reduz
  drasticamente a superfície de um vazamento.

**Alternativa se você quiser independência de fornecedor:** Auth.js (NextAuth) com
adaptador Prisma. Custa mais trabalho de configuração e o RLS passa a exigir uma ponte
manual, mas nada fica preso ao Supabase.

Requisitos mínimos, qualquer que seja a escolha:

- **MFA obrigatório para administradores.** Uma conta de admin abre os dados financeiros
  de todos os clientes; senha sozinha não é suficiente. Opcional para os demais papéis.
- Sessão expira em 30 dias com renovação por atividade; **12 horas para administradores**.
- Bloqueio progressivo após tentativas falhas de login.
- Nenhuma senha, token ou chave de API no código ou no repositório — apenas variáveis de
  ambiente.

### 19.3 Sobre APIs

Não é preciso escolher nada agora. Na Fase 1 o sistema tem apenas a sua própria API
interna (§17), consumida pelas telas. As APIs externas entram depois e cada uma tem seu
momento:

| Integração | Para quê | Fase |
|---|---|---|
| Pluggy ou Belvo | Open Finance — sincronizar contas e cartões automaticamente | 3 |
| Provedor de e-mail (Resend, Postmark) | Convites, recuperação de senha, alertas de vencimento | 1 |
| Push (Web Push nativo do PWA) | Lembrete de conta vencendo | 2 |
| Gateway de pagamento (Stripe, Asaas) | Cobrança de assinatura dos clientes | 4 |

## 20. Permissões de edição das listas

Nem toda lista suspensa pode ser editada por todo mundo. A regra abaixo vem direto do
dono do produto e é o que impede que a taxonomia se degrade quando houver muitos
usuários.

| Campo | Coluna na planilha | Quem edita a lista | Justificativa |
|---|---|---|---|
| **Tipo de Carteira** | E | **Cliente** | Cada pessoa tem bancos e cartões diferentes. Sem isso o sistema não serve a ninguém além do titular. |
| **Tipo** (natureza) | F | **Ninguém** | As 4 naturezas são a estrutura contábil do sistema. Todo cálculo depende delas. Fixas no código. |
| **Categoria** | G | **Somente administrador** | É o eixo de comparação entre clientes e entre períodos. Se cada um criar as suas, nenhum relatório é comparável e a consultoria perde a base. |
| **Subcategoria** | H | **Cliente** | É onde mora a particularidade de cada família, e não afeta nenhum agregado — todo relatório soma por categoria. |
| **Descrição** | I | **Cliente** (texto livre) | Não é lista. Campo aberto para detalhar o lançamento. |

Implicações para a implementação:

- `nature` é um union type fixo no TypeScript e uma constante no código. **Não** é tabela
  editável.
- `category` tem `is_system = true` para as categorias do seed. O formulário de categoria
  só aparece para administradores; para os demais, a lista é somente leitura.
- `subcategory` e `wallet` têm CRUD completo disponível ao titular e ao membro do
  workspace, com validação de nome duplicado dentro do mesmo escopo.
- Excluir uma subcategoria ou carteira **em uso** é bloqueado. A ação disponível é
  **arquivar** (`is_active = false`): some dos formulários, permanece nos lançamentos
  antigos e nos relatórios históricos. Nenhum dado financeiro pode desaparecer porque
  alguém arrumou uma lista.
- Nas telas de cadastro, os campos travados aparecem visíveis e desabilitados, com o
  motivo ao lado — não escondidos. Um campo que some sem explicação vira chamado de
  suporte.

## 21. Dispositivos e responsividade

Aplicação **web com páginas**, acessada pelo navegador. Sem app de loja.

Prioridade declarada: **PC e celular em primeiro lugar, tablet em segundo.** Isso não
significa três layouts — significa dois desenhos e um caso que se resolve sozinho:

| Faixa | Dispositivo | Desenho |
|---|---|---|
| < 768px | Celular | Navegação inferior, uma coluna, tabelas viram cartões, botão flutuante de lançamento (§12) |
| 768–1279px | Tablet | Layout de desktop com a barra lateral recolhida. **Não é um terceiro desenho** — é o desktop com menos colunas visíveis na tabela. |
| ≥ 1280px | PC | Barra lateral fixa, tabelas densas, atalhos de teclado, edição in-line |

O tablet ser "segunda opção" quer dizer que ele herda o desktop e é apenas verificado, não
desenhado à parte. Se o desktop for construído com layout fluido, o tablet sai de graça.

Requisitos de dispositivo:

- **PWA instalável** — ícone na tela inicial do celular, abre em tela cheia, sem barra do
  navegador. É o que faz o lançamento rápido (§12) parecer um app nativo sem existir um.
- **Lançar funciona offline.** Sem rede, o lançamento é gravado localmente e sincroniza
  ao reconectar, com indicador visível de "pendente de sincronização". Consultar e
  relatórios podem exigir conexão; lançar, não — é justamente no supermercado sem sinal
  que o registro se perde.
- **Teclado numérico nativo** no campo de valor (`inputmode="decimal"`).
- Alvos de toque de no mínimo 44×44px no celular.
- Funciona nas duas últimas versões de Chrome, Safari, Firefox e Edge.

---

# PARTE VIII — PLANO DE EXECUÇÃO

## 22. Fases

### Fase 0 — Fundação (semana 1)
Projeto Next.js, Prisma, Postgres, deploy na Vercel, CI. Tela de login com Supabase Auth
(§19.2), papéis e Row Level Security. Seeds carregados a partir dos CSVs de §25.
**Critério de aceite:** login funciona, papéis são respeitados, taxonomia completa
visível, um usuário não enxerga dados de outro workspace.

### Fase 1 — Núcleo (semanas 2–5)
CRUD de lançamentos · parcelamento e recorrência com `group_id` automático (§8.4) ·
tela de lançamento rápido (§12) · painel (§11) · tela de compromissos ·
**importar e exportar CSV/XLSX (§18)** · permissões de edição das listas (§20) ·
PWA instalável com lançamento offline.
**Critério de aceite:** dá para carregar a planilha atual por CSV, conferir os números
na tela e passar a lançar direto no sistema. Uso real por 30 dias.

### Fase 2 — Relatórios (semanas 6–9)
Analítico mês a mês · despesas parceladas · balanço anual · orçamento · fatura de cartão ·
importação de OFX com categorização sugerida · alertas de vencimento por e-mail e push.
**Critério de aceite:** todo relatório que existia na planilha existe no sistema.

### Fase 3 — Automação e planejamento (semanas 10+)
Open Finance via Pluggy · patrimônio e evolução patrimonial · metas · projeções de
cenário · MFA.

### Fase 4 — Consultoria
Multi-workspace real · convite e autorização de cliente · painel do consultor ·
trilha de auditoria de recomendações · planos e cobrança.

> A Fase 4 depende de definições regulatórias (CVM, certificação) que **não são questão
> de software** e devem ser resolvidas em paralelo, não pelo desenvolvedor.

## 23. Como trabalhar com o Claude Code

- Uma fase por sessão. Não peça a Fase 1 inteira em um prompt.
- Comece sempre por: `Leia ESPECIFICACAO-SISTEMA-FINANCEIRO.md. Vamos implementar a
  Fase X, item Y. Antes de escrever código, me mostre o plano e as dúvidas.`
- Regras financeiras (`/lib/finance`) **antes** de qualquer tela, com testes.
- Ao final de cada fase, peça: revisão de segurança, verificação de que nenhum valor
  monetário virou float, e execução da suíte de testes.
- Nunca aceite "vou simplificar a taxonomia por enquanto". A taxonomia completa é
  requisito, não detalhe.

---

# PARTE IX — PENDÊNCIAS

## 24. Questões que precisam de resposta antes de codificar

| # | Questão | Status |
|---|---|---|
| 1 | Critério do `ID Grupo` | ✅ Agrupa compromissos que atravessam meses; ID próprio por linha; atribuído automaticamente (§8.4) |
| 2 | Fórmula do gauge de Reserva de Emergência | ✅ Default: média de despesa de 6 meses × 6 meses-alvo, configurável na tela de Metas (§11.6) |
| 3 | Critério de Despesa Fixa vs. Variável | ✅ Default: recorrência previsível ⇒ fixa, com campo de sobrescrita por lançamento (§11.7) |
| 4 | Caixinha: carteira ou categoria de investimento? | ✅ **Carteira.** 13 categorias removidas do seed; aporte em caixinha vira transferência (§7.3, §10 R5) |
| 5 | Análise de consumo usa `Compra` ou `Vence`? | ✅ Seletor Caixa/Competência nos relatórios, default Caixa (§10 R2) |
| 6 | Divergência `BALANCO` × `DASHBOARD` para 2025 | ✅ Sem efeito — não haverá migração histórica (§18) |
| 7 | Para que serve a coluna `Organização`? | ✅ Vira array de tags livres, mais flexível que uma coluna fixa (§8.1) |
| 8 | Diferença entre `BALANÇO` e `SALDO` na aba BALANCO | 🔲 **Aberto** — afeta só o relatório de balanço anual, na Fase 2 |
| 9 | Recorrência mensal: materializar ou virtual? | ✅ Materializar 24 meses à frente, job mensal idempotente (§8.5) |
| 10 | 15 abas ainda não analisadas | 🔲 **Aberto** — afeta relatórios da Fase 2, não a Fase 1 |
| 11 | Autenticação e APIs externas | ✅ Supabase Auth; APIs externas por fase (§19.2, §19.3) |
| 12 | Permissões de edição das listas | ✅ §20 |
| 13 | Dispositivos-alvo | ✅ §21 |

**Nenhuma pendência bloqueia o início.** Restam duas questões abertas, ambas sobre
relatórios da Fase 2, que podem ser respondidas com o sistema já em uso.

Onde este documento diz "default proposto", a decisão foi tomada para que o
desenvolvimento não pare — todas são reversíveis e nenhuma exige mudança de estrutura de
dados para ser alterada depois. Se você discordar de alguma, é trocar um número ou uma
condição, não refazer o sistema.

## 25. Anexos

### Prontos — usar como estão

| Arquivo | Conteúdo | Linhas |
|---|---|---|
| `seeds/seed_taxonomia.csv` | `nature, category, subcategory, category_sort_order, category_slug, subcategory_slug` | 380 |
| `seeds/seed_tipos_carteira.csv` | `code, label_pt, affects_net_worth, is_liability` — tabela de referência extensível (§6.2) | 10 |
| `seeds/seed_carteiras.csv` | `name, kind, institution, is_pseudo_wallet, legacy_name, slug, linked_wallet, goal_purpose` | 47 |
| `seeds/seed_responsaveis.csv` | `name, is_shared, slug` — `is_shared = true` para "Felipe & Dani" | 12 |
| `seeds/seed_situacoes.csv` | `code, label_pt, counts_as_settled` — a coluna `counts_as_settled` é o que define quem entra no saldo realizado (§11.1) | 8 |
| `seeds/seed_recorrencias.csv` | `code, legacy_label, interval_months` — `interval_months` gera as ocorrências futuras (§8.5) | 13 |

Cada arquivo existe em duas versões, com **conteúdo idêntico**:

- **`seeds/*.csv`** — UTF-8 sem BOM, separador `,`. É a versão que o código lê no seed.
- **`seeds/excel-br/*.csv`** — UTF-8 com BOM, separador `;`. Abre direto no Excel em
  português com os acentos corretos e cada campo na sua coluna. É a versão para conferir
  a olho.

Verificação já executada nos arquivos: nenhuma crase, til solto, aspa tipográfica,
caractere de controle ou espaço sobrando. Todos os caracteres não-ASCII são acentos
portugueses dentro do Latin-1. Os slugs foram conferidos e não há colisões. Todos os
arquivos foram relidos após a geração e têm largura de coluna consistente.

Observações sobre os seeds:
- `Fundo Passível` foi corrigido para **`Fundo Passivo`** (erro de digitação na planilha).
- As subcategorias-placeholder ("não necessário 1…55") **não** foram migradas; subcategoria
  é opcional no modelo.
- `99 Pay` está como `CONTA_PAGAMENTO`, não conta bancária — é carteira digital de
  pagamento.
- `Dívidas c/ Terceiros` foi renomeada para **`Empréstimos a Terceiros`** com
  `kind = CONTA_RECEBIVEL` (§9). O nome antigo fica em `legacy_name` para o importador
  reconhecer planilhas antigas.
- `Patrimônio` é a única carteira com `is_pseudo_wallet = true` — deve virar `asset` (§9).
- As 13 categorias `Caixinha (...)` **foram removidas** de INVESTIMENTO (Questão 4). As
  caixinhas existem apenas como carteiras, com `goal_purpose` preenchido.
- `linked_wallet` está vazio nas duas caixinhas de cartão — é você quem informa, na tela de
  Carteiras, qual cartão cada uma provisiona. O cálculo de cobertura de fatura (§11.5)
  depende disso.

### Ainda pendentes
- Prints ou export das abas listadas na Questão 10 (afeta os relatórios da Fase 2)
- Resposta à Questão 4 (caixinhas), antes de iniciar a Fase 1

O export da aba `DADOS` **não é mais pré-requisito**: ele entra pelo importador de CSV
da própria aplicação (§18.1), quando você quiser — no primeiro dia ou nunca.

---

*Documento gerado a partir da engenharia reversa da planilha "FINANÇAS Pessoais" /
"DADOS (finanças pessoais) - 2026" / "PAINEL (finanças pessoais)". Versão 1.0.*
