# PROSPECTA Finance — Especificação Mestre
## Gestão de Risco Financeiro Pessoal e Reserva de Emergência Inteligente

**Versão da especificação:** 1.0  
**Metodologia sugerida:** PROSPECTA-MCRF-1.0  
**Objetivo deste arquivo:** orientar o Claude Code a analisar, projetar e implementar no sistema PROSPECTA Finance um módulo de **Gestão de Risco Financeiro Pessoal**, tendo a Reserva de Emergência como uma das ferramentas centrais.

---

# 1. INSTRUÇÃO PRINCIPAL AO CLAUDE CODE

Você atuará simultaneamente como:

- arquiteto de software sênior;
- desenvolvedor full-stack sênior;
- especialista em engenharia financeira;
- especialista em planejamento financeiro pessoal;
- especialista em análise e gestão de riscos;
- especialista em modelagem estatística;
- especialista em UX para sistemas financeiros;
- especialista em modelagem de regras de negócio.

Sua missão é analisar o sistema PROSPECTA Finance existente e projetar um novo módulo de **Gestão de Risco Financeiro Pessoal**, tendo a Reserva de Emergência como uma de suas ferramentas centrais.

A proposta **NÃO** é construir uma calculadora tradicional de reserva de emergência.

A proposta é criar um sistema capaz de responder:

> **“Quais riscos financeiros relevantes existem na vida desta pessoa ou família, quais deles já estão protegidos, quais permanecem descobertos e quanto de liquidez é necessário para que ela consiga atravessar eventos adversos mantendo suas despesas essenciais e sem recorrer a decisões financeiras destrutivas?”**

---

# 2. PRINCÍPIO CENTRAL DA METODOLOGIA

A Reserva de Emergência PROSPECTA não deverá ser calculada simplesmente como:

```text
despesa mensal × número arbitrário de meses
```

Também não deverá ser determinada exclusivamente por um score do tipo:

```text
score de risco → 3, 6, 9, 12 ou 18 meses
```

O novo modelo deverá funcionar com base em:

- dados reais do usuário;
- estrutura familiar;
- comportamento financeiro;
- estabilidade e volatilidade das fontes de renda;
- obrigações financeiras;
- dependentes;
- seguros;
- liquidez;
- capacidade de recomposição de renda;
- riscos profissionais;
- proteção previdenciária e trabalhista;
- cenários financeiros;
- stress tests individualizados.

O sistema deverá criar uma representação financeira do usuário ou da família e simular diferentes eventos adversos.

Para cada cenário, deverá responder:

1. Qual renda continuaria existindo?
2. Qual renda desapareceria ou seria reduzida?
3. Quais despesas continuariam obrigatórias?
4. Quais despesas poderiam ser temporariamente reduzidas?
5. Surgiria alguma despesa extraordinária?
6. Há seguro para esse evento?
7. Existe franquia?
8. Existe carência?
9. Existe benefício previdenciário ou trabalhista?
10. Quando esse recurso estaria efetivamente disponível?
11. Existe outra fonte de renda?
12. Quanto tempo levaria para essa renda alternativa começar?
13. Quanto da renda original ela conseguiria substituir?
14. Existe outro provedor na família?
15. As rendas familiares são realmente independentes ou estão correlacionadas?
16. Qual seria o déficit de caixa mês a mês?
17. Quanto de liquidez seria necessário até a recuperação?

O resultado final deverá ser a:

# **Reserva Recomendada PROSPECTA**

---

# 3. MCRF — MOTOR PROSPECTA DE CONTINUIDADE E RESILIÊNCIA FINANCEIRA

Criar internamente o:

## **MCRF — Motor PROSPECTA de Continuidade e Resiliência Financeira**

Responsabilidades:

- identificar riscos;
- analisar riscos;
- avaliar vulnerabilidades;
- reconhecer mecanismos de proteção;
- calcular riscos residuais;
- executar stress tests;
- calcular necessidade de liquidez;
- explicar o resultado;
- recomendar ações de mitigação;
- acompanhar a evolução da resiliência financeira ao longo do tempo.

O MCRF deverá ser o núcleo matemático e lógico da funcionalidade.

---

# 4. IPRF — ÍNDICE PROSPECTA DE RESILIÊNCIA FINANCEIRA

Manter também:

## **IPRF — Índice PROSPECTA de Resiliência Financeira**

O IPRF deverá ser utilizado como um **indicador de diagnóstico e comunicação**, e não como multiplicador direto da reserva.

Quanto maior o IPRF, melhor a resiliência.

O índice poderá considerar, entre outros:

- adequação da liquidez;
- continuidade da renda;
- diversificação das fontes de renda;
- correlação das rendas familiares;
- flexibilidade das despesas;
- comprometimento com dívidas;
- cobertura de seguros;
- exposição residual;
- capacidade de recuperação;
- qualidade e confiabilidade dos dados.

O IPRF deve ser consequência da análise, não o mecanismo principal que determina a reserva.

---

# 5. FILOSOFIA DE GESTÃO DE RISCO

Estruturar o módulo segundo princípios gerais de gestão de risco:

1. estabelecer contexto;
2. identificar riscos;
3. analisar riscos;
4. avaliar riscos;
5. tratar riscos;
6. monitorar riscos;
7. comunicar riscos.

Todo risco financeiro poderá receber uma estratégia:

- **reter** → financiar com reserva;
- **reduzir** → diminuir exposição;
- **diversificar** → criar fontes alternativas;
- **transferir** → seguro ou outra proteção;
- **evitar** → eliminar determinada exposição;
- **aceitar** → risco suficientemente pequeno.

Princípio fundamental:

> **A solução para todo risco não deve ser simplesmente aumentar a reserva de emergência.**

---

# 6. REGRA DE IMPLEMENTAÇÃO: ANALISAR ANTES DE PROGRAMAR

ANTES DE ALTERAR QUALQUER ARQUIVO:

Analise completamente:

- arquitetura atual;
- banco de dados;
- autenticação;
- usuários;
- famílias;
- contas;
- receitas;
- despesas;
- categorias;
- investimentos;
- patrimônio;
- financiamentos;
- empréstimos;
- seguros;
- planejamento financeiro;
- objetivos;
- dados profissionais;
- dados familiares;
- integrações existentes;
- componentes visuais;
- design system.

Identifique todas as informações que o sistema já conhece.

## Regra absoluta de UX e arquitetura

> **Nunca pergunte novamente ao usuário aquilo que a PROSPECTA já sabe com confiabilidade suficiente.**

Não crie fontes duplicadas de verdade.

Quando uma informação já existir, o formulário deverá preferencialmente exibir:

> “Encontramos esta informação em seu perfil. Ela continua correta?”

Com opções:

- Confirmar;
- Atualizar.

---

# 7. MODOS DE CÁLCULO

O módulo deverá funcionar em:

## 7.1 Conta individual

Considerar exclusivamente:

- renda pessoal;
- despesas pessoais;
- obrigações;
- seguros;
- patrimônio;
- liquidez;
- profissão;
- capacidade de recomposição.

## 7.2 Conta familiar

Considerar:

- renda de todos os membros;
- despesas compartilhadas;
- dependentes;
- contribuição financeira de cada adulto;
- impacto da perda de cada fonte de renda;
- correlação entre rendas;
- capacidade das demais rendas sustentarem a família.

Evitar contar transferências internas entre membros da família como renda adicional.

---

# 8. PROVENIÊNCIA DOS DADOS

Cada variável relevante deverá possuir, quando possível:

- valor;
- origem;
- data;
- nível de confiança.

Classificar origem como:

```text
SYSTEM_OBSERVED
USER_DECLARED
OFFICIAL_EXTERNAL_DATA
SYSTEM_INFERRED
```

Exemplo:

```yaml
occupation:
  value: "policial militar"
  source: USER_DECLARED
  confidence: HIGH

monthlyEssentialCost:
  value: 5430
  source: SYSTEM_OBSERVED
  historyMonths: 12
  confidence: HIGH
```

Dado inferido nunca deve ser tratado como fato confirmado.

---

# 9. CONFIANÇA DO MODELO

Criar o indicador:

## **Confiança da Análise PROSPECTA**

Sugestão de classificação:

- Muito alta;
- Alta;
- Moderada;
- Baixa.

Considerar:

- quantidade de meses disponíveis;
- qualidade da categorização;
- dados automáticos versus declarados;
- campos desconhecidos;
- estabilidade histórica;
- disponibilidade de dados profissionais;
- disponibilidade de dados dos seguros;
- qualidade de integrações externas.

Quanto menor a qualidade da informação, maior deve ser a incerteza exibida.

Evitar falsa precisão.

---

# 10. NÃO CONFUNDIR TRÊS CONCEITOS

## 10.1 Despesas previsíveis

Exemplos:

- IPVA;
- IPTU;
- matrícula;
- manutenção programada;
- seguros anuais;
- impostos conhecidos.

Essas despesas devem possuir **provisões financeiras próprias**.

Não devem ser classificadas como emergência.

## 10.2 Emergências financeiras

Eventos inesperados ou interrupções relevantes.

Exemplos:

- perda de renda;
- incapacidade;
- reparo essencial inesperado;
- acidente;
- emergência familiar.

## 10.3 Riscos catastróficos transferíveis

Eventos de grande impacto que deveriam ser analisados prioritariamente por:

- seguros;
- benefícios;
- outras formas de proteção.

A reserva não deve tentar substituir todos os seguros existentes.

---

# 11. CEMA — CUSTO ESSENCIAL MENSAL AJUSTADO

Criar:

## **CEMA — Custo Essencial Mensal Ajustado**

Usar preferencialmente 12 meses de dados.

Quando não houver 12 meses, utilizar 6 meses.

Caso haja menos dados, utilizar os meses disponíveis e reduzir a confiança da análise.

## 11.1 Despesas essenciais rígidas

Exemplos:

- moradia;
- aluguel;
- financiamento imobiliário;
- condomínio;
- energia;
- água;
- gás;
- alimentação básica;
- transporte indispensável;
- saúde;
- medicamentos;
- educação essencial;
- seguros necessários;
- pensão;
- despesas com dependentes;
- parcelas obrigatórias de dívidas;
- impostos essenciais.

## 11.2 Essenciais ajustáveis

Despesas necessárias, mas passíveis de redução parcial durante crise.

## 11.3 Discricionárias

Despesas que podem ser suspensas temporariamente.

Exemplos:

- lazer;
- viagens;
- restaurantes;
- compras não essenciais;
- assinaturas dispensáveis;
- gastos supérfluos;
- aportes e investimentos.

## 11.4 Método de cálculo

Preferir a mediana das despesas essenciais dos últimos meses para reduzir distorções causadas por eventos atípicos.

Adicionar despesas essenciais anuais ou periódicas convertidas para equivalente mensal.

```text
CEMA =
despesas essenciais recorrentes
+
equivalente mensal das despesas essenciais periódicas
```

O usuário deverá poder revisar quais categorias foram consideradas essenciais.

---

# 12. CCM — CUSTO DE CONTINGÊNCIA MENSAL

Criar:

## **CCM — Custo de Contingência Mensal**

O CCM representa quanto a pessoa ou família precisaria gastar durante uma emergência após realizar cortes financeiramente razoáveis, sem comprometer:

- dignidade;
- saúde;
- moradia;
- alimentação;
- educação essencial;
- mobilidade necessária;
- obrigações legais e contratuais relevantes.

Não assumir que toda despesa não essencial poderá ser eliminada imediatamente.

---

# 13. HISTÓRICO DE CHOQUES REAIS

Utilizar o histórico financeiro para identificar:

- meses com queda extraordinária de renda;
- meses com elevação extraordinária de despesas;
- despesas inesperadas;
- reparos;
- despesas médicas;
- eventos familiares;
- oscilações relevantes.

Quando necessário, perguntar:

> “Qual foi a maior despesa essencial inesperada que você ou sua família enfrentaram nos últimos 24 meses?”

Registrar:

- categoria;
- valor;
- causa;
- existência de seguro;
- valor reembolsado;
- valor pago pelo usuário;
- tempo até eventual reembolso.

Esses dados deverão melhorar a personalização futura.

---

# 14. MOTOR DE RENDA

Cada fonte de renda deverá possuir:

- titular;
- valor;
- média;
- mediana;
- variabilidade;
- frequência;
- previsibilidade;
- vínculo;
- dependência de empregador;
- dependência de clientes;
- setor;
- atividade;
- possibilidade de interrupção;
- possibilidade de recuperação.

Não considerar todas as rendas igualmente seguras.

---

# 15. VOLATILIDADE DA RENDA

Quando houver histórico suficiente, medir a volatilidade observada.

Não depender exclusivamente da resposta:

> “Minha renda é variável.”

Avaliar:

- mediana;
- percentis inferiores;
- meses sem renda;
- amplitude;
- sazonalidade;
- recorrência;
- tendência.

Para rendas variáveis, utilizar valores conservadores nos stress tests.

---

# 16. RRC — RENDA RESILIENTE DO CENÁRIO

Criar:

## **RRC — Renda Resiliente do Cenário**

A RRC deverá ser calculada separadamente em cada stress test.

Pode incluir, conforme o cenário:

- renda do cônjuge;
- aposentadoria;
- pensão;
- aluguel recorrente;
- segunda atividade comprovada;
- renda passiva de alta previsibilidade;
- benefícios elegíveis.

Não incluir automaticamente:

- limite de cartão;
- cheque especial;
- empréstimos;
- patrimônio ilíquido;
- venda de bens;
- investimentos comprometidos com outros objetivos;
- FGTS sem hipótese concreta de saque;
- renda eventual.

---

# 17. CONCENTRAÇÃO DE RENDA FAMILIAR

Calcular concentração das fontes de renda.

Uma métrica possível é o HHI:

```text
HHI = soma das participações individuais da renda²
```

Exemplos:

Uma única renda familiar:

```text
HHI ≈ 1
```

Duas rendas iguais:

```text
HHI = 0,50
```

Quanto maior a concentração, maior a vulnerabilidade.

O indicador deverá auxiliar o diagnóstico, não determinar sozinho a reserva.

---

# 18. CORRELAÇÃO ENTRE AS RENDAS

Duas rendas não devem ser automaticamente consideradas independentes.

Perguntar ou inferir:

- trabalham na mesma empresa?
- trabalham no mesmo negócio familiar?
- possuem a mesma profissão?
- dependem dos mesmos clientes?
- atuam no mesmo setor?
- uma renda depende diretamente da outra?

Criar:

## **Correlação de Renda Familiar**

Classificação sugerida:

- baixa;
- moderada;
- alta;
- muito alta.

Exemplo:

Se marido e esposa trabalham na mesma empresa, a renda do segundo não pode ser considerada proteção integral contra o fechamento da empresa.

---

# 19. SITUAÇÃO PROFISSIONAL

Identificar:

- servidor público efetivo;
- militar;
- empregado público;
- CLT;
- cargo comissionado;
- temporário;
- profissional liberal;
- autônomo;
- empresário;
- MEI;
- informal;
- aposentado;
- pensionista;
- desempregado;
- outros.

Registrar:

- profissão;
- cargo;
- setor;
- tempo na atividade;
- tempo no vínculo atual;
- experiência total;
- região;
- formação;
- certificações;
- registro profissional.

Sempre que possível, preparar a estrutura para normalização pela CBO.

---

# 20. IPP — ÍNDICE DE PORTABILIDADE PROFISSIONAL

Criar:

## **IPP — Índice de Portabilidade Profissional**

Objetivo:

Estimar o quão facilmente a capacidade produtiva do usuário pode ser convertida em nova renda.

Avaliar:

- experiência transferível;
- experiência recente;
- formação;
- certificações;
- profissão regulamentada;
- segunda profissão;
- existência de clientes;
- networking;
- possibilidade de trabalho remoto;
- possibilidade de atuação em áreas correlatas;
- flexibilidade geográfica;
- renda paralela;
- tempo desde a última experiência fora da carreira principal.

Não confundir escolaridade com empregabilidade.

Graduação nunca utilizada profissionalmente deverá receber peso inferior a atividade secundária efetivamente exercida.

---

# 21. SEGUNDA PROFISSÃO E RENDA SUBSTITUTA

Perguntar:

> “Você possui outra atividade capaz de gerar renda caso sua principal fonte seja interrompida?”

Investigar:

- qual atividade;
- formação;
- registro profissional;
- experiência;
- experiência recente;
- clientes;
- renda atual;
- renda histórica;
- tempo necessário para começar;
- capacidade de expansão;
- percentual possível de substituição.

Classificar:

## 21.1 Renda secundária ativa

Já existe e pode ser comprovada.

## 21.2 Renda secundária adormecida

Já existiu recentemente.

## 21.3 Capacidade profissional potencial

Existe formação e alguma capacidade, mas pouca evidência prática.

## 21.4 Possibilidade teórica

Não deverá ser considerada renda resiliente.

---

# 22. CURVA DE RECUPERAÇÃO DE RENDA

Evitar a lógica simplista:

> “Desempregado durante 8 meses.”

Criar uma:

## **Curva de Recuperação de Renda**

Exemplo conceitual:

```text
Mês 1: 0%
Mês 2: 20%
Mês 4: 50%
Mês 6: 75%
Mês 8: 100%
```

Os percentuais NÃO poderão ser universais.

Devem considerar:

- profissão;
- segunda atividade;
- experiência;
- mercado;
- dados externos oficiais;
- histórico;
- capacidade efetiva de geração de renda.

A curva deverá ser conservadora e explicável.

Não afirmar:

> “Você levará exatamente 4,7 meses para conseguir emprego.”

---

# 23. TRATAMENTO ESPECIAL — SERVIDORES E MILITARES

Criar lógica específica.

Separar:

## 23.1 Estabilidade da renda atual

Pode ser muito alta.

## 23.2 Portabilidade profissional

Pode ser baixa.

## 23.3 Proteções trabalhistas/previdenciárias

Podem ser completamente diferentes das de um trabalhador CLT.

Não presumir:

- FGTS;
- seguro-desemprego;
- regras de RGPS;
- verbas rescisórias típicas de CLT.

Identificar o regime aplicável.

Regra importante:

> Um policial, militar ou servidor estável não deverá receber automaticamente uma reserva gigantesca apenas porque teria dificuldade de recolocação no setor privado.

A baixa portabilidade profissional deverá inicialmente gerar:

- diagnóstico de concentração no capital humano;
- recomendação de segunda carreira;
- análise de proteção por incapacidade;
- análise previdenciária;
- análise de renda alternativa.

Somente deverá aumentar fortemente o stress de interrupção de renda quando existir cenário materialmente relevante de saída, afastamento ou perda daquela fonte.

---

# 24. DADOS EXTERNOS DE MERCADO DE TRABALHO

Preparar arquitetura desacoplada para futura utilização de:

- CBO;
- Novo Caged;
- PNAD Contínua;
- outras fontes oficiais.

Poder analisar:

- estoque de empregos;
- admissões;
- desligamentos;
- crescimento ou retração;
- remuneração;
- localização;
- densidade de oportunidades;
- famílias ocupacionais relacionadas.

Registrar sempre:

- fonte;
- competência;
- abrangência;
- limitações.

Não transformar dados agregados em previsão individual exata.

---

# 25. PROTEÇÕES TRABALHISTAS E PREVIDENCIÁRIAS

Mapear quando aplicável:

- FGTS;
- seguro-desemprego;
- verbas rescisórias;
- benefícios previdenciários;
- benefícios estatutários;
- pensões;
- benefícios do empregador;
- outras proteções.

Não considerar apenas “tem direito”.

Considerar também:

- elegibilidade;
- valor;
- duração;
- carência;
- prazo até recebimento.

O recurso só poderá entrar no fluxo do stress test no mês em que razoavelmente estará disponível.

---

# 26. SEGUROS

Buscar no sistema antes de perguntar.

Analisar:

- seguro de vida;
- incapacidade;
- proteção de renda;
- saúde;
- automóvel;
- residencial;
- prestamista;
- empresarial, quando relevante;
- outros.

Para cada cobertura registrar:

- risco coberto;
- capital segurado;
- limite;
- franquia;
- carência;
- exclusões relevantes;
- vigência;
- tempo estimado de indenização.

Calcular:

## **Exposição Financeira Residual**

```text
risco financeiro bruto
-
proteção efetivamente aplicável
=
exposição residual
```

Nunca reduzir automaticamente a reserva apenas porque existe uma apólice.

---

# 27. SAÚDE E MINIMIZAÇÃO DE DADOS

O objetivo do módulo é financeiro.

Evitar coletar diagnóstico médico quando isso não for necessário.

Perguntar preferencialmente:

- possui plano de saúde?
- há coparticipação?
- existem franquias?
- existem medicamentos essenciais recorrentes?
- existem dependentes com despesas recorrentes?
- existe proteção por incapacidade?
- qual seria o impacto financeiro de um afastamento?

Aplicar minimização de dados.

---

# 28. DÍVIDAS E RIGIDEZ FINANCEIRA

Calcular:

## Debt Service Ratio

```text
parcelas obrigatórias de dívidas / renda líquida
```

Criar também:

## Índice de Rigidez Financeira

```text
despesas essenciais rígidas / renda líquida
```

Quanto maior a rigidez, menor a capacidade de adaptação durante uma crise.

Não utilizar um único limite arbitrário como decisão binária.

---

# 29. CLASSIFICAÇÃO DA LIQUIDEZ

Nem todo patrimônio é reserva.

Classificar ativos em:

## 29.1 Liquidez imediata

Recursos de acesso rápido e baixo risco.

## 29.2 Liquidez secundária

Recursos acessíveis em poucos dias, com alguma restrição.

## 29.3 Patrimônio estratégico

Recursos destinados a outros objetivos.

## 29.4 Patrimônio ilíquido

Exemplos:

- imóveis;
- veículos;
- bens físicos.

## 29.5 Crédito contingencial

Exemplos:

- cartão;
- cheque especial;
- linha de crédito.

Crédito NÃO deve ser classificado como reserva.

---

# 30. VALOR ELEGÍVEL PARA RESERVA

Criar:

## **EmergencyEligibleValue**

Modelo conceitual:

```text
valor
× fator de liquidez
× fator de estabilidade
× fator de disponibilidade
```

Exemplo:

Um recurso líquido, estável e destinado a emergência poderá receber alta elegibilidade.

Um ativo volátil ou comprometido com outra meta receberá baixa ou nenhuma elegibilidade.

Os fatores deverão ficar centralizados em configuração e versionados.

---

# 31. STRESS TEST FINANCEIRO PESSOAL

Este será o núcleo inovador do sistema.

Criar, no mínimo, os seguintes cenários.

## Cenário A — Volatilidade normal severa

Queda de renda e aumento de despesas dentro de extremos historicamente observados.

## Cenário B — Interrupção da renda principal

Simular perda da principal fonte.

## Cenário C — Redução parcial de renda

Exemplos:

- 25%;
- 50%;
- 75%.

## Cenário D — Incapacidade temporária

Considerar:

- redução de renda;
- benefícios;
- seguros;
- despesas adicionais.

## Cenário E — Emergência com ativo essencial

Exemplos:

- veículo indispensável;
- residência;
- equipamento essencial.

Calcular somente a exposição não coberta.

## Cenário F — Emergência familiar

Exemplos:

- aumento temporário de despesas;
- necessidade de cuidado;
- redução da capacidade laboral de um provedor.

## Cenário G — Autônomo/empresário

Simular queda prolongada de faturamento.

Avaliar também dependência entre negócio e renda pessoal.

## Cenário H — Choque combinado

Simular simultaneamente:

```text
queda de renda
+
despesa extraordinária
```

Esse cenário deve ter grande relevância.

---

# 32. STRESS TESTS FAMILIARES

Para famílias com múltiplos provedores, simular separadamente:

- perda da renda A;
- perda da renda B;
- perda parcial de ambas;
- choque correlacionado;
- incapacidade de um provedor;
- eventos familiares.

Identificar o cenário financeiramente mais severo entre os materialmente relevantes.

---

# 33. EQUAÇÃO CENTRAL DOS CENÁRIOS

Para cada cenário `s` e mês `t`:

```text
Deficit_s,t =
max(
    0,
    EssentialOutflow_s,t
    + ExtraordinaryOutflow_s,t
    - ResilientIncome_s,t
    - AvailableBenefits_s,t
    - InsuranceCashflow_s,t
)
```

A necessidade financeira do cenário será:

```text
ScenarioNeed_s =
ImmediateOutOfPocket_s
+
Σ Deficit_s,t
```

O momento dos fluxos deve ser respeitado.

Exemplo:

Se uma indenização somente chega no terceiro mês, ela não pode reduzir a necessidade de liquidez do primeiro mês.

---

# 34. PLI — PISO DE LIQUIDEZ IMEDIATA

Criar:

## **PLI — Piso de Liquidez Imediata**

Mesmo usuários extremamente estáveis precisam de liquidez de curto prazo.

O PLI deverá considerar:

- CEMA;
- CCM;
- volatilidade observada;
- histórico de grandes despesas;
- franquias relevantes;
- dependência de ativos essenciais;
- prazo de recebimento de indenizações e benefícios.

Não utilizar valor nacional fixo.

---

# 35. RESERVA RECOMENDADA PROSPECTA

A Reserva Recomendada deverá ser obtida essencialmente por:

```text
ReservaRecomendada =
max(
    PisoLiquidezImediata,
    necessidades dos cenários materiais de stress
)
```

Depois poderá ser aplicada uma:

## **Margem de Incerteza do Modelo**

A margem deverá aumentar quando:

- faltarem dados;
- houver poucos meses de histórico;
- houver alta volatilidade;
- informações críticas forem apenas declaradas;
- seguros não estiverem confirmados;
- benefícios forem incertos.

Os parâmetros devem ficar centralizados e versionados.

---

# 36. EVITAR DUPLA CONTAGEM

Não simplesmente somar:

- seis meses de custo;
- franquia do carro;
- franquia residencial;
- desemprego;
- seguro ausente;
- despesas médicas.

Isso produziria reservas exageradas.

Usar cenários.

Somar riscos apenas quando fizer sentido financeiro que ocorram simultaneamente.

O cenário combinado deverá ser explicitamente modelado.

---

# 37. TRÊS NÍVEIS DE PROTEÇÃO

Apresentar:

## Proteção Essencial

Cobertura mínima para choques comuns e de curto prazo.

## Proteção Recomendada PROSPECTA

Resultado principal do MCRF.

## Proteção Reforçada

Inclui cenário combinado mais severo ou margem adicional de segurança.

A recomendação PROSPECTA deve ser o destaque principal.

---

# 38. COBERTURA ATUAL

Mostrar duas medidas.

## 38.1 Cobertura matemática

```text
Reserva atual / CEMA
```

Exemplo:

> “Seu patrimônio emergencial equivale a 7,4 meses do seu custo essencial.”

## 38.2 Cobertura em cenário

Executar simulação mês a mês.

Exemplo:

> “No cenário de interrupção da sua principal renda, considerando a renda do seu cônjuge e sua atividade secundária, sua reserva atual sustentaria a família por aproximadamente 11 meses.”

Essa segunda medida deve ter maior relevância analítica.

---

# 39. MAPA PROSPECTA DE RISCOS PESSOAIS

Criar um registro de riscos semelhante a um risk register.

Exemplo:

```text
Risco:
Interrupção da principal fonte de renda

Exposição:
Alta

Proteções:
Renda do cônjuge + atividade secundária

Risco residual:
Moderado

Tratamento:
Reserva + fortalecimento da renda secundária
```

Outro exemplo:

```text
Risco:
Colisão do veículo essencial

Proteção:
Seguro contratado

Exposição residual:
Franquia + indisponibilidade temporária

Tratamento:
Reserva para franquia e mobilidade temporária
```

A reserva não deve tentar cobrir o valor integral de um risco que pode ser transferido por seguro.

---

# 40. PLANO DE TRATAMENTO DE RISCOS

Depois de calcular a reserva, responder:

> “Como este usuário poderia reduzir sua necessidade de reserva sem ficar menos protegido?”

Possíveis recomendações:

- criar segunda fonte de renda;
- desenvolver segunda profissão;
- aumentar cobertura de seguro;
- reduzir dívida;
- diminuir despesas rígidas;
- reduzir concentração de renda;
- criar provisões para despesas previsíveis;
- fortalecer liquidez;
- revisar seguros;
- melhorar diversificação profissional.

Isso transforma a funcionalidade em ferramenta de gestão de risco financeiro pessoal.

---

# 41. EXPLICAÇÃO AUTOMÁTICA AO USUÁRIO

Não mostrar matemática excessiva na tela principal.

Modelo:

> **Sua Reserva Recomendada PROSPECTA é de R$ 46.800.**
>
> Esse valor foi calculado considerando seu custo essencial, a estabilidade das suas fontes de renda, a renda da sua família, suas obrigações financeiras e os riscos que permanecem descobertos.
>
> Sua principal proteção é a estabilidade da sua renda atual.
>
> Entretanto, identificamos elevada concentração da renda familiar e baixa capacidade de substituição imediata da renda principal.
>
> Por esse motivo, sua recomendação ficou acima da referência básica.
>
> Hoje você possui R$ 28.400 elegíveis para emergências, correspondentes a 61% da sua meta.

Adicionar botão:

## **“Por que este valor?”**

Ao abrir, mostrar de 3 a 5 fatores principais.

---

# 42. STRESS TEST VISUAL

Criar painel de leitura simples.

Exemplo:

```text
Choque financeiro de curto prazo
Protegido

Queda de 50% da renda
Protegido

Interrupção da renda principal
Parcialmente protegido

Incapacidade temporária
Proteção insuficiente

Emergência + perda de renda
Proteção insuficiente
```

Evitar linguagem alarmista.

---

# 43. SIMULADOR “E SE?”

Permitir simular:

- E se eu quitar esta dívida?
- E se meu cônjuge começar a trabalhar?
- E se minha segunda atividade gerar R$ 2.000?
- E se eu contratar proteção de renda?
- E se meu custo mensal cair 10%?
- E se eu mudar de emprego?
- E se eu cancelar um seguro?
- E se eu aumentar minha liquidez?

Recalcular:

- reserva;
- stress tests;
- IPRF;
- riscos residuais;
- cobertura atual.

---

# 44. PLANO PARA CONSTRUIR A RESERVA

Após definir a meta, calcular como alcançá-la.

Utilizar:

- capacidade mensal de poupança;
- fluxo de caixa projetado;
- 13º salário;
- bônus;
- receitas extraordinárias;
- rendas variáveis;
- metas concorrentes.

Exemplo:

> “Mantendo aporte médio de R$ X, sua reserva atingirá o nível recomendado aproximadamente em Y meses.”

Não comprometer despesas essenciais.

---

# 45. PROTOCOLO DE RECOMPOSIÇÃO

Quando o usuário utilizar a reserva:

1. registrar o evento;
2. registrar o valor;
3. identificar a categoria;
4. verificar eventual indenização;
5. recalcular saldo;
6. atualizar cobertura;
7. atualizar riscos;
8. gerar plano de recomposição.

A reserva deve ser tratada como sistema vivo.

---

# 46. APRENDIZADO COM EVENTOS REAIS

Ao ocorrer uma emergência, registrar:

- categoria;
- impacto;
- duração;
- perda de renda;
- despesa extraordinária;
- existência de seguro;
- reembolso;
- tempo de recuperação.

Esses dados poderão melhorar o modelo daquele usuário.

Não implementar aprendizado opaco.

Toda inferência relevante deverá ser identificável.

---

# 47. EVENTOS DE RECÁLCULO

Recalcular quando houver:

- casamento;
- separação;
- nascimento de filho;
- novo dependente;
- mudança de emprego;
- mudança de profissão;
- alteração relevante de renda;
- alteração relevante de despesas;
- novo financiamento;
- quitação de dívida;
- contratação ou cancelamento de seguro;
- nova fonte de renda;
- perda de renda;
- mudança residencial;
- utilização da reserva.

Manter histórico.

---

# 48. VERSIONAMENTO

Todo cálculo deverá registrar:

```text
methodologyVersion
calculationDate
dataReferenceDate
CEMA
CCM
reserveTarget
eligibleReserve
IPRF
scenarios
mainDrivers
dataConfidence
```

Exemplo:

```text
methodologyVersion = "PROSPECTA-MCRF-1.0"
```

Nunca sobrescrever silenciosamente cálculos históricos.

---

# 49. FONTES EXTERNAS FUTURAS

Preparar arquitetura desacoplada para integrações com:

- Banco Central do Brasil;
- IBGE;
- Ministério do Trabalho e Emprego;
- CBO;
- Novo Caged;
- PNAD Contínua;
- SUSEP;
- Previdência Social;
- outras fontes oficiais.

Cada dado externo deverá registrar:

- fonte;
- competência;
- data de atualização;
- escopo;
- limitações.

Não utilizar scraping improvisado quando houver fonte oficial.

---

# 50. PRIVACIDADE E SEGURANÇA

Aplicar:

- minimização de dados;
- segregação entre usuários;
- isolamento familiar;
- controle de acesso;
- criptografia conforme arquitetura existente;
- registro de alterações relevantes.

Um usuário nunca poderá acessar informações de outro usuário ou família sem autorização.

Não coletar dados sensíveis sem finalidade clara.

---

# 51. COMPLIANCE FINANCEIRO

Separar:

## Cálculo de necessidade de liquidez

de

## Recomendação específica de investimento

O MCRF pode classificar necessidades de:

- liquidez;
- segurança;
- disponibilidade.

Não recomendar automaticamente produto financeiro específico sem passar por camada de compliance aplicável.

---

# 52. ARQUITETURA DE SOFTWARE SUGERIDA

Separar módulos conceituais:

```text
dataCollection
financialProfile
riskRegistry
incomeEngine
expenseEngine
employmentEngine
insuranceEngine
benefitsEngine
liquidityEngine
stressTestEngine
reserveEngine
resilienceScore
explanationEngine
recommendationEngine
history
methodologyConfig
```

O motor de cálculo deve ser independente da interface.

Criar funções puras e testáveis sempre que possível.

Parâmetros metodológicos deverão ficar centralizados.

Não espalhar “números mágicos” pelo código.

---

# 53. EXPLICABILIDADE

Para cada resultado, o sistema deverá conseguir responder:

- quais dados utilizou;
- de onde vieram;
- quais regras foram aplicadas;
- quais cenários foram executados;
- quais fatores elevaram a reserva;
- quais fatores reduziram a reserva;
- quais informações estavam incertas.

Nenhuma recomendação importante deverá depender exclusivamente de uma caixa-preta de IA.

IA generativa poderá ser utilizada para escrever explicações.

A matemática deverá ser determinística, auditável e versionada.

---

# 54. TESTES OBRIGATÓRIOS

Criar testes para, no mínimo:

1. CLT estável;
2. CLT altamente especializado;
3. autônomo;
4. profissional liberal;
5. empresário;
6. MEI;
7. servidor efetivo;
8. policial/militar sem segunda profissão;
9. policial/militar com segunda profissão ativa;
10. aposentado;
11. família com um provedor;
12. família com dois provedores independentes;
13. casal trabalhando na mesma empresa;
14. casal do mesmo setor;
15. renda altamente variável;
16. alto endividamento;
17. baixa liquidez;
18. grande patrimônio ilíquido;
19. seguro robusto;
20. seguro com franquia alta;
21. usuário sem seguro;
22. incapacidade temporária;
23. gasto inesperado com veículo;
24. gasto inesperado residencial;
25. choque combinado;
26. dados incompletos;
27. menos de três meses de histórico;
28. doze meses ou mais de histórico;
29. reserva acima da meta.

Testar também:

- divisão por zero;
- valores negativos;
- renda ausente;
- despesas ausentes;
- duplicidades;
- transferências internas;
- categorias desconhecidas;
- benefícios recebidos com atraso;
- seguro pago posteriormente;
- renda secundária intermitente;
- dados externos indisponíveis.

---

# 55. CRITÉRIOS DE ACEITE

A implementação somente poderá ser considerada adequada se:

- não usar regra fixa de 3/6/12 meses como motor principal;
- utilizar dados já existentes antes de perguntar novamente;
- diferenciar pessoa individual de família;
- diferenciar estabilidade profissional de portabilidade profissional;
- tratar militares e servidores de forma específica;
- diferenciar seguro de reserva;
- considerar franquias e tempo de indenização;
- considerar correlação entre fontes de renda;
- tratar ativos ilíquidos separadamente;
- considerar momento dos fluxos;
- executar stress tests;
- evitar dupla contagem de riscos;
- apresentar explicação simples;
- manter lógica auditável;
- registrar versão da metodologia;
- permitir evolução futura dos parâmetros;
- manter histórico;
- não quebrar funcionalidades existentes.

---

# 56. EXPERIÊNCIA DO USUÁRIO

A tela principal deverá priorizar:

## Sua Reserva de Emergência PROSPECTA

Exemplo:

```text
Reserva recomendada
R$ 46.800

Reserva atual elegível
R$ 28.400

Progresso
61%

Cobertura matemática
5,2 meses

Cobertura no cenário principal
8,7 meses

Confiança da análise
Alta
```

Depois apresentar:

- Por que este valor?
- Seus principais riscos;
- Suas principais proteções;
- Pontos a melhorar;
- Cenários de stress;
- Simulador;
- Plano de construção da reserva.

---

# 57. OBJETIVO FINAL DO PRODUTO

O objetivo NÃO é dizer:

> “Você precisa guardar seis meses.”

O objetivo é dizer:

> **“Analisamos sua estrutura financeira, sua família, suas fontes de renda, suas obrigações e os riscos que poderiam afetá-lo. Testamos diferentes cenários e calculamos quanto de liquidez você precisaria para atravessá-los. Esta é sua Reserva Recomendada PROSPECTA e estas são as ações que podem tornar sua vida financeira ainda mais resiliente.”**

A Reserva de Emergência PROSPECTA deverá ser tratada como uma ferramenta de:

# **GESTÃO DE RISCO FINANCEIRO PESSOAL**

e não apenas como uma calculadora de meses de despesas.

---

# 58. PRIMEIRA RESPOSTA OBRIGATÓRIA DO CLAUDE CODE

**NÃO COMECE IMPLEMENTANDO IMEDIATAMENTE.**

A primeira resposta deverá conter uma análise técnica do projeto atual.

Apresente:

1. diagnóstico da estrutura atual do projeto;
2. módulos existentes que serão reutilizados;
3. informações que já existem;
4. informações faltantes;
5. possíveis duplicidades de dados;
6. modelo de dados necessário;
7. proposta do MCRF;
8. proposta do registro de riscos;
9. proposta do motor de stress test;
10. proposta do motor profissional;
11. proposta de integração com seguros;
12. proposta de tratamento de benefícios e proteções;
13. fórmula completa;
14. cenários a serem simulados;
15. proposta do IPRF;
16. proposta do IPP;
17. fluxo UX do formulário;
18. telas necessárias;
19. alterações de banco de dados;
20. APIs e serviços necessários;
21. riscos técnicos;
22. problemas ou inconsistências encontrados nesta especificação;
23. sugestões para melhorar a metodologia;
24. plano de implementação por etapas;
25. estratégia de testes.

Se identificar qualquer problema conceitual nesta especificação:

- não implemente silenciosamente;
- explique o problema;
- proponha solução superior;
- preserve os objetivos de negócio definidos neste documento.

Somente depois dessa análise deverá ser iniciada a implementação.

---

# 59. REGRA FINAL DE PRESERVAÇÃO

Preserve tudo o que já funciona no PROSPECTA Finance.

Não:

- remova funcionalidades existentes;
- altere estruturas críticas sem necessidade;
- duplique entidades;
- crie nova fonte de verdade para dados existentes;
- substitua arquitetura consolidada sem justificativa técnica;
- misture regra de negócio com componentes visuais;
- crie lógica financeira opaca.

Priorize integração nativa e evolução incremental do sistema.

---

# 60. RESUMO EXECUTIVO PARA O DESENVOLVEDOR

A funcionalidade a ser criada deverá unir:

```text
dados financeiros reais
+
perfil profissional
+
estrutura familiar
+
seguros
+
benefícios
+
liquidez
+
riscos
+
stress tests
+
recuperação de renda
+
explicabilidade
=
Reserva Recomendada PROSPECTA
```

O valor final não será um múltiplo arbitrário de despesas.

Ele será a **necessidade de liquidez calculada a partir dos riscos materiais da vida financeira do usuário ou família**.

Essa é a essência da metodologia PROSPECTA-MCRF.
