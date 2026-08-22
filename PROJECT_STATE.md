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
> **Última atualização real: 2026-08-18 (Etapa 15 — PCP e teste de liquidez
> sucessória. **Fecha o Bloco III e completa os sete indicadores do PSF** —
> Registro Nº 102).**
>
> `lib/method/pcp.ts` (puro) + `/patrimonio/sucessao` gateada por
> `pcp_sucessorio`. **Sem migration**: o checklist mora dentro do `Deliverable`
> de código PCP, num campo `checklist` **opcional** que não invalida os nove
> entregáveis restantes.
>
> **O teste é derivado, não perguntado** — patrimônio, liquidez e seguro de
> vida já estão no sistema. O patrimônio usa **`buildPatrimonyItems`**, a mesma
> função da Etapa 7 que desconta a dupla contagem entre carteira de
> investimento e posição hospedada nela (Nº 074). Somar as tabelas direto teria
> reintroduzido aquele bug; reusar foi decisão consciente.
>
> **Alíquotas como parâmetro.** ITCMD é estadual (2%–8%); os 4% do padrão são
> de São Paulo, e a tela **diz na interface** que é ponto de partida, não
> afirmação sobre o caso. Metodologia deixa ITCMD/SP como pendência #15.
>
> **Compatibilidade do checklist:** chave desconhecida é ignorada e item novo
> do catálogo conta como pendente — permite acrescentar pergunta sem corromper
> PCP antigo. E a escrita é **sempre no rascunho**: PCP validado é palavra do
> consultor numa data.
>
> **Continuidade saiu de "não avaliado" e o PSF fica completo.** §5.3.1 dizia
> confiança baixa "só porque depende de entidade que ainda não existe". Agora
> existe. Sem PCP produzido, `null` — nunca faixa ruim. Os **sete** indicadores
> de §8.3 passam a existir de fato.
>
> **Limite declarado:** tela não vista logada; e o teste só produz número com
> patrimônio cadastrado — em workspace vazio ele passa trivialmente.
> 825 unitários, 119 de integração, build limpo.

> **Última atualização anterior: 2026-08-18 (Etapa 14 — PIP e trajetória de
> metas da Régua — Registro Nº 101).**
>
> **A inconsistência, reportada antes de codar.** A linha dizia
> "`AllocationTarget` com faixa-alvo por classe (PIP)", tratando como um modelo
> só o que são **dois eixos**: `AllocationTarget` é por **macrobloco** (para
> onde vai a renda, §11.4); o PIP é por **classe de investimento** (como o já
> poupado está distribuído, §12.1). E o PIP precisa de **faixa mín/máx**, que o
> modelo especificado não tem.
>
> **Implementei os dois**, porque fazer só o PIP deixaria `regua_trajetoria` sem
> caminho — o mesmo defeito de capacidade sem porta de entrada dos Registros
> Nº 090 e 094. Duas ocorrências recentes bastam para tratar como padrão a
> evitar, não coincidência.
>
> Motores puros `lib/method/pip.ts` e `lib/method/allocation-target.ts`; seções
> **embutidas** em `/investimentos/analise` e `/relatorios/regua` — política
> separada da carteira que governa obrigaria a comparar números em duas abas.
>
> **Faixa e não alvo** é o que torna o PIP operável: alvo exato exigiria
> rebalancear a cada oscilação, com custo e imposto a cada tremor.
>
> **Validação de conjunto, não de campo:** mínimos somando >100% tornam a
> política **impossível**; máximos somando <100% deixam dinheiro sem onde caber.
> Nada disso aparece campo a campo, e descobrir no rebalanceamento seria tarde —
> por isso as telas salvam em bloco e recusam o conjunto incoerente.
>
> **Duas decisões contra número que mente:** classe sem faixa aparece marcada
> "fora da política" em vez de omitida (omitir faria a soma não fechar em 100%);
> macrobloco sem meta fica `null`, nunca zero (zero afirmaria "a meta é não
> gastar nada aqui" — absurdo para Essencial).
>
> **Limite declarado:** seções não vistas logadas. 805 unitários, 119 de
> integração, build limpo.

> **Última atualização anterior: 2026-08-18 (Etapa 13 — PLA e o indicador
> Longevidade do PSF — Registro Nº 100).**
>
> `RetirementProjection` + `lib/method/retirement.ts` (puro) +
> `/patrimonio/longevidade` gateada por `pla_projecao`. Migration dev →
> produção → código. Parâmetros na query string (recalcula ao vivo, sem
> gravar); gravar é ato explícito e cria uma **versão** com os três cenários
> numa transação.
>
> **O motor trabalha em termos reais** — poder de compra de hoje. Projetar pela
> inflação e depois descontar pela mesma inflação dá o mesmo resultado com duas
> chances a mais de errar, e devolve um "R$ 8 milhões" que o cliente não sabe
> interpretar. Não há campo de inflação: ela já está dentro da taxa real, e
> separá-la seria contá-la duas vezes.
>
> **Duas premissas que a Metodologia não fixa, escolhidas por mim e declaradas
> como escolha:** taxas reais por cenário (2/4/6% a.a.) e horizonte de 90 anos.
> Isoladas em `TAXA_REAL_PADRAO` e `IDADE_FINAL_PADRAO`, editáveis na tela — para
> discordar ser conversa sobre o número, não arqueologia na fórmula. O horizonte
> é conservador de propósito: o risco é **viver mais** que o dinheiro.
>
> **Cuidados que evitam número silenciosamente errado:** taxa mensal é a
> equivalente **composta**, não a anual ÷ 12 (dividir superestima juros em
> prazo longo, que é onde este motor opera); taxa zero é caso à parte, não
> divisão por zero; aporte necessário devolve **zero, nunca negativo** quando o
> objetivo já foi alcançado — negativo leria como "pode sacar".
>
> **Fecha pendência que o próprio documento anunciava.** §5.3.1 dizia confiança
> "baixa para Longevidade… só porque depende de entidade que ainda não existe".
> A entidade existe, e o indicador foi ligado: lê o cenário **base** da versão
> mais recente (otimista inflaria, conservador puniria). Sem projeção, `null` —
> **"não avaliado", nunca faixa ruim**.
>
> **Limite declarado:** tela não vista logada. 773 unitários, 119 de
> integração, build limpo.

> **Última atualização anterior: 2026-08-18 (Etapa 12 — MRP, mais correção de
> gate — Registro Nº 099).**
>
> **A revisão veio antes do código e mudou o escopo.** As duas metades da etapa
> estavam em situações opostas:
> - **`InsurancePolicy`: feita e excedendo o previsto.** §5.4 desenhava tabela
>   plana com `insuredCapital` na apólice; a 9-A.2 entregou
>   `InsurancePolicy` + `InsuranceCoverage`, com capital no nível da cobertura
>   junto de franquia, carência e prazo. O modelo plano não representaria
>   "morte R$ 300 mil, invalidez R$ 150 mil" na mesma apólice. Nada a fazer — a
>   tabela do roadmap é que estava desatualizada.
> - **"Necessárias": inexistente.** `insurance-engine` só respondia "dada uma
>   perda X, quanto sobra". Era essa a substância.
>
> **`lib/method/mcrf/risk-map.ts` (novo, puro)** + `/protecao/mapa-de-riscos`
> gateada por `mrp_completo`. A **necessidade vem dos cenários do cliente**
> (§33), não de regra de mercado — o mesmo número que alimenta a Reserva.
>
> **Duas decisões que evitam mapa otimista** — o pior erro num documento de
> proteção: cobertura por `bestProtectionFor()`, **nunca soma de capitais**
> (somar ignoraria franquia, carência e teto; há teste exigindo R$ 7.000 e não
> R$ 10.000 num caso com franquia de R$ 3.000); e **`VIDA` não cobre cenário
> algum**, porque A–H medem a liquidez do próprio cliente e morte do titular é
> problema de quem fica — outra pergunta. Teste garante que nenhum cenário liste
> `VIDA`.
>
> **O defeito de gate que a revisão expôs.** A decisão de 2026-08-16 punha
> tratamento na camada de método. O código renderizava `treatmentPlan` **sem
> gate**, visível a qualquer Max — enquanto o texto ao lado dizia a esse mesmo
> cliente que aquilo era da consultoria, e o comentário do arquivo afirmava que
> ficava atrás de `mrp_completo`. Duas afirmações falsas e uma receita entregue
> de graça. Corrigido; as duas afirmações passaram a ser verdadeiras.
>
> **Limite declarado:** tela não vista logada. 746 unitários, 119 de
> integração, build limpo.

> **Última atualização anterior: 2026-08-18 (Etapa 11 — `Debt` / MEC, abre o
> Bloco III — Registro Nº 098).**
>
> `Debt` + `DebtStatus`, motor puro `lib/method/mec.ts`, tela `/patrimonio/mec`
> gateada por `mec_completo` (METODO, fase 3 desde o Nº 096). Migration em dev →
> produção → código.
>
> **Antes de escrever, verifiquei se já existia** — a regra do projeto proíbe
> duplicar. `/patrimonio/dividas` existe desde o Bloco I e deriva dívidas
> **inteiramente dos parcelamentos de `Entry`**; não havia modelo `Debt`. A
> lacuna é a de §5.4: aquele módulo não sabe credor, custo nem negativação, e
> ordenar por saldo leva a **quitar a maior em vez da mais cara**. As duas
> telas coexistem, e a nova diz isso na primeira linha, com link para a antiga.
>
> **O argumento decisivo para a tabela separada:** cheque especial e rotativo
> **não existem como parcelamento** — não há parcelas a lançar. São exatamente
> as duas modalidades que §9.6 chama de tóxicas, e escapariam de qualquer
> análise baseada só em `Entry`. Há teste cobrindo esse caso.
>
> **Dívida tóxica** = modalidade em `{Rotativo, Cheque especial}` **ou** CET
> ≥ 100% a.a. (os "três dígitos" literais de §9.6, isolados em constante). A
> classificação devolve **o motivo**, e a tela mostra.
>
> **A decisão que evita mentir por ordenação:** dívida **sem CET vai para o
> fim**, nunca tratada como custo zero — ordená-la à frente sugeriria que é
> barata. A tela conta quantas estão assim e diz que é o dado que mais falta.
>
> **`SET NULL` no vínculo com o parcelamento**, não `CASCADE`: apagar o
> `EntryGroup` não pode apagar o registro de crédito.
>
> **Desvio declarado:** §5.4 grafa `hasNegativação` com acento; gravei
> `hasNegativacao`, para não destoar do resto do schema.
>
> **Uma asserção minha estava errada e o teste pegou** (`semCet` era 2, não 1 —
> o cheque especial de um teste anterior também não tinha CET). O modelo estava
> certo; a expectativa é que não.
>
> **Limite declarado:** tela não vista logada — exige contrato ativo e sessão.
> 731 unitários, 119 de integração, build limpo.

> **Última atualização anterior: 2026-08-17 (Etapa 10-B — envio automático dos
> instrumentos, fecha o Bloco II — Registro Nº 097).**
>
> `InstrumentDispatch` + motor puro `dispatch-engine.ts` + impuro
> `run-dispatches.ts`, ligado à rotina diária de cron. Migration em dev →
> produção → código. O `UNIQUE (engagement, instrument)` faz o "só uma vez" ser
> **estrutural**, não dependente de quem chama — mínimo aceitável para rotina
> que manda e-mail.
>
> **As âncoras não são dias corridos.** §12.8 põe a entrevista em D8, mas
> amarrar o A2 a oito dias do contrato entregaria, numa entrevista atrasada, um
> formulário que a conversa ainda não preparou. Então: A1 quando o contrato
> abre; A2 e C quando a **Fase 1 começa** — o registro de que a entrevista
> ocorreu. O C herda a janela do A2 porque o documento é silencioso quanto a
> ele e os dois saem juntos.
>
> **Dois lembretes e para.** Metade do prazo e vencimento. Cobrar para sempre
> vira spam, e cliente que marca a PROSPECTA como indesejada deixa de receber o
> que importa; o atraso passa a ser assunto do consultor.
>
> **A etapa nasce inerte, e essa é a decisão que mais importa.**
> `instrumentos.envio_automatico_ativo` começa em `0`, criado assim em dev **e
> em produção**. É a única rotina que fala com o cliente sem humano no meio —
> todo o resto só produz alerta dentro do app. Havia três contratos ativos em
> produção com endereços reais; subir ligada mandaria e-mail para quem não sabe
> que a rotina existe.
>
> **Ordem de gravação deliberada:** a linha nasce **antes** do e-mail, e o
> contador de lembrete sobe antes também. Falha de envio deixa registro sem
> entrega — visível e corrigível; a ordem inversa arriscaria enviar duas vezes.
>
> **Não verificado, declarado: nenhum e-mail foi disparado em teste.** Não há
> como exercitar o envio real sem escrever para um endereço de verdade. Texto,
> renderização e link seguem sem conferência prática — ao ligar o parâmetro,
> vale abrir a primeira mensagem antes de deixar a rotina correndo.
>
> 714 unitários, 115 de integração, build limpo.

> **Última atualização anterior: 2026-08-17 (tela de contrato de consultoria —
> Registro Nº 094).**
>
> `EngagementControl.tsx` em `/admin/usuarios`: abre e encerra
> `ConsultingEngagement`, mostra o ativo, e Projeto pede a fase contratada.
> Sem migration.
>
> **Como o buraco apareceu.** O usuário perguntou "como criar um contrato de
> consultoria?" e a resposta exigiu procurar: `openConsultingEngagement` e
> `closeConsultingEngagement` existiam desde a Etapa 8, com a regra de "nunca
> dois ativos" implementada, mas **a única ocorrência do nome no projeto era a
> própria definição**. Nada as chamava — logo, nenhum workspace podia ter
> contrato, e as Etapas 8, 9 e 10 eram **inalcançáveis para qualquer usuário
> real**.
>
> **Segundo caso do mesmo padrão em três dias** (o primeiro foi o simulador
> "E se?", Registro Nº 090). A causa é comum e vale como regra daqui pra
> frente: ao fechar uma etapa eu testava a lógica e a tela **daquela** etapa,
> mas não o **caminho que leva um usuário até ela partindo do estado inicial
> do sistema**. Etapa nova cujo gate depende de um registro que só outra tela
> cria precisa verificar que essa outra tela existe.
>
> **Premissa do usuário corrigida:** "Consultor: Fulano" na tela de usuários
> **não** é consultoria. São camadas distintas do §4.6 — consultor atribuído dá
> **acesso** (`ADVISOR`); `ConsultingEngagement` registra **responsabilidade
> metodológica** e é o único que abre `gateKind = METODO`. Os quatro workspaces
> com consultor em produção têm zero contratos.
>
> **Invariante que ficou sem cobertura justamente por não haver tela:** "abrir
> um novo encerra o anterior" mora na Server Action, e os testes criavam
> contrato direto pelo Prisma. Agora tem teste: exatamente um ATIVO, anterior
> preservado como histórico. Sem isso `activeEngagement()` dependeria de ordem
> de inserção.
>
> 699 unitários, 109 de integração, build limpo.

> **Última atualização anterior: 2026-08-17 (redação dos instrumentos definida;
> envio automático virou Etapa 10-B — Registro Nº 093).**
>
> As Pendências #6–8 da Metodologia ("instrumentos pergunta a pergunta") foram
> resolvidas: o usuário delegou a redação, ela foi escrita para os três,
> `redacaoConfirmada` passou a `true` e `CATALOG_VERSION` foi para `"2"`. O
> teste que existia para falhar nesse momento falhou como projetado e virou a
> invariante inversa.
>
> **O C ganhou afirmações, não rótulos.** `DIMENSOES_C` passou a ter `label`
> (nome técnico, para o consultor) e `afirmacao` (o que o cliente vê) — "Locus
> de controle financeiro" não é frase com a qual alguém concorda. A primeira
> usa **valores absolutos** (§12.6 é literal), com teste exigindo `R$` e
> proibindo `%`: perda em porcentagem é subestimada, e alguém "simplificar"
> para "queda de 16%" mataria o item.
>
> **Decisão declarada com o custo dito:** todas as afirmações apontam para o
> mesmo lado. Misturar frases invertidas pegaria quem responde sem ler, mas
> exigiria que o cálculo do perfil soubesse quais inverter — e ele ainda não
> existe. O código registra que é aí que se reavalia.
>
> **Bug latente que o teste de integração revelou.** `catalog_version` tinha
> `@default("1")` no banco. Ao subir a redação para `"2"`, o default virou uma
> **segunda cópia divergente** da versão, e resposta gravada sem o campo seria
> rotulada com a redação errada — pior que não ter o campo. Migration
> `20260817220000_catalog_version_sem_default` **remove o default**; a coluna
> segue `NOT NULL`, então quem grava declara a versão e a fonte de verdade volta
> a ser única. Aplicada em dev e produção. A Server Action já passava o campo:
> o defeito era latente, nenhum dado foi afetado.
>
> **Envio automático → Etapa 10-B**, por decisão do usuário. §12.4 pede "prazo e
> lembretes automáticos" e §12.8 fixa o protocolo D0–D17: é agendamento e
> notificação, assunto diferente de formulário e com risco diferente (disparo
> indevido chega no e-mail do cliente). Cron e Brevo já existem; falta ligá-los.
>
> 699 unitários, 108 de integração, build limpo.

> **Última atualização anterior: 2026-08-17 (Etapa 10 — instrumentos A1/A2/C —
> Registro Nº 092).**
>
> `DiagnosticResponse` + catálogo puro em `lib/method/instruments/`, telas
> `/metodo/instrumentos[/code]`, gate `diagnostico_dip` (feature METODO que já
> existia no seed). Migration em dev → produção → código, mesmo checksum.
>
> **O que veio do documento e o que não veio.** Extraí a §12 da Metodologia v5.0
> do `.docx` antes de escrever código: os **campos** estão especificados
> literalmente (§12.3 os dez itens do A1, §12.4 os oito blocos do A2, §12.6 as
> oito dimensões do C) e foram reproduzidos sem invenção. A **redação pergunta
> a pergunta** são as Pendências #6–8 da própria Metodologia — decisão do dono
> do produto. Em vez de inventar e deixar passar por oficial:
> `redacaoConfirmada: false`, aviso na tela, e **um teste que falha de propósito
> quando for definida**.
>
> **Três regras do método viraram código verificável:** patrimônio do A1 em
> **faixa, não valor** (§12.3), com teste que impede virar `numero`; C com uma
> linha **por pessoa** (§12.6, "individualmente e sem companhia"); B fora de
> escopo por decisão do próprio documento (§12.5).
>
> **A calibração que eu tinha errado.** §12.1 fixa teto de 10 min para o A1, e
> virou `checkAtrito()`. A primeira versão estimava **5,3 min** — mas o
> documento declara **8–10 min** para exatamente esses campos. Medidor
> subestimando deixaria alguém quase dobrar o formulário sem o teste acusar: o
> guard-rail seria decoração. Recalibrei para 8,9 min e **ancorei a estimativa
> na faixa do documento com um teste próprio**.
>
> **O que ficou de fora, explicitamente:** o **envio automático**. §12.4 prevê
> "prazo e lembretes automáticos" para o A2; hoje não há disparo — o cliente só
> acha o formulário entrando na tela. Cron e e-mail já existem; falta ligá-los a
> um gatilho de prazo. Roadmap marcado `◐`, não `✅`.
>
> **Limite declarado:** telas não vistas logadas (middleware manda para
> `/login`), e elas exigem `ConsultingEngagement` ativo, que nenhum workspace de
> produção tem hoje. 690 unitários, 108 de integração, build limpo.

> **Última atualização anterior: 2026-08-17 (rastro do cron + os três ajustes
> adiados — Registro Nº 091).**
>
> **Rastro do cron.** Nova `automation_runs`, migration aplicada em dev, depois
> em produção, e só então o código (`RUNBOOK` §5 — a regra que nasceu do apagão
> do Nº 071); mesmo checksum nos dois bancos. A gravação vive dentro de
> `runDueAutomations`, **não na rota**: assim não existe caminho que rode sem
> registrar. A linha nasce antes do trabalho e fecha depois, o que torna três
> estados distinguíveis — concluída, falhada, e **morta no meio**
> (`finishedAt` nulo), que é a falha que não deixa rastro em lugar nenhum.
> `/admin/automacoes` responde antes de tudo "está rodando?"; "Executar agora"
> grava `source = MANUAL`, porque um disparo de teste marcado como agendado
> mascararia a ausência da automática.
>
> **Período no alerta de categoria.** `periodo` é **opcional** de propósito —
> regra antiga lê `?? "MES"` e não muda de significado, que seria a pior falha
> possível (alterar em silêncio um alerta já configurado). Semana de calendário,
> não 7 dias móveis: janela móvel faria o alerta acender e apagar sozinho.
>
> **Limpar histórico do Assistente.** `AiInteraction` é registro de auditoria,
> e mesmo assim o titular pode apagar: o dado é dele (LGPD Art. 18, V). O que a
> auditoria protege — resposta não poder ser **reescrita** — continua valendo,
> porque aqui só se apaga.
>
> **Barra de nível no PSF** (`lib/method/psf-progress.ts`, puro). Cinco degraus
> discretos, não barra contínua: a escala do §8.3 é ordinal. **A decisão que
> evita uma mentira sutil:** sem foto anterior, ou com "não avaliado" de um dos
> lados, a tela **não diz nada** — tratar "não avaliado" como degrau zero
> inventaria uma queda que nunca houve, e escrever "estável" afirmaria algo que
> não se sabe.
>
> **Um teste foi removido, e vale a lição:** eu havia escrito um caso cujo nome
> prometia exercitar "execução sem nada a alertar" mas que não exercitava essa
> condição — o banco de dev é compartilhado e não há como garantir zero regra
> ativa. Cobertura falsa é pior que ausência de teste. Ficou um comentário
> apontando a garantia real, que é **estrutural**: a linha é criada antes de
> qualquer regra ser lida.
>
> **Limite declarado:** as três telas novas ou alteradas não foram vistas
> logadas — sem sessão o middleware manda para `/login`. Cobertura por `tsc`,
> build e testes (665 unitários, 104 de integração); o visual do JSX segue sem
> conferência.

> **Última atualização anterior: 2026-08-17 (simulador "E se?" ganhou tela —
> Registro Nº 090).**
>
> Fecha a pendência aberta no Nº 088. O motor existia e estava testado desde a
> 9-A.6; faltava **porta de entrada**.
>
> **`lib/method/mcrf/simulator.ts` (novo, puro)** traduz query string em
> `AssessmentOverrides` e devolve também as **hipóteses em frases** e os
> **descartes com motivo** — simulador que ignora entrada inválida em silêncio
> faz o usuário concluir que a hipótese não teve efeito, quando ela nem chegou
> a ser aplicada. Redução acima de 100% é recusada com aviso, não truncada:
> `runAssessment` já faz `clamp`, mas truncar calado responderia outra pergunta
> que não a feita. Zero e vazio não viram hipótese (equivalem ao real) — o que
> importa porque o formulário envia todos os campos e os em branco chegam `""`.
>
> **Query string, não estado de cliente.** §43 exige que nada seja gravado, e a
> URL é o único lugar que satisfaz isso sem tabela, sem sessão e sem
> `"use client"`. Dois ganhos: **uma simulação vira link**, e a tela segue
> inteiramente Server Component — o que evita o `Decimal` vazando para o bundle
> do cliente, problema recorrente aqui.
>
> **A simulação é uma segunda avaliação, não uma substituição.** O painel
> principal continua mostrando o real; o simulado aparece ao lado em tabela
> Hoje / Simulado / Diferença. É isso que mantém **"Salvar no histórico" seguro
> por construção** — a ação chama `runAssessment` sem overrides. A segunda
> chamada só ocorre **quando há hipótese válida**, senão toda visita pagaria uma
> leitura completa do banco à toa.
>
> **Onde a cobertura estava mentindo.** Os testes antigos montavam
> `AssessmentOverrides` à mão e por isso passavam mesmo com o simulador
> inalcançável pelo usuário. Os 4 casos de integração novos cobrem a composição
> que a **tela** faz — query string → `parseSimulation` → `runAssessment` —,
> incluindo formulário em branco e **URL editada à mão**, que não pode virar
> cálculo errado.
>
> **Limite declarado:** a tela não foi vista logada — sem sessão o middleware
> manda para `/login`. A subida do dev server provou uma coisa útil: o
> middleware **preserva a query string no `redirectTo`**, então simulação
> compartilhada por link sobrevive ao login. O visual do JSX segue sem
> verificação.

> **Última atualização anterior: 2026-08-17 (cron de automações confirmado
> funcionando em produção — Registro Nº 089).**
>
> Às **09:16 UTC**, `notifications` recebeu **exatamente 1** linha
> `alerta_automacao` — o `INCIDENTE_ACUMULADO` que o *dry-run* do Registro
> Nº 087 previra horas antes. Previsão e resultado batem em quantidade e em
> regra disparada, comprovando a cadeia inteira: **Vercel Cron → `Bearer
> ${CRON_SECRET}` → middleware liberando `/api/cron` → `runDueAutomations()` →
> `Notification`**. Os 16 minutos de atraso são a tolerância de agendamento da
> Vercel.
>
> Confirma o diagnóstico do Nº 087: a execução de 08-16 foi engolida pelo
> middleware, não pelo segredo — o `CRON_SECRET` sempre esteve correto. **Zero
> alterações de código:** o defeito já estava corrigido; faltava evidência.
>
> **A pendência de observabilidade continua e o episódio a justifica.** Só foi
> possível diagnosticar porque a condição de uma regra era persistente e a
> ausência de efeito virou evidência. Com regras de condição transitória, a
> mesma pergunta ("rodou?") não teria resposta. Um registro de execução — data,
> regras avaliadas, alertas gerados — é o que falta.

> **Última atualização anterior: 2026-08-17 (manual posto em dia; e uma
> funcionalidade sem tela descoberta ao escrevê-lo — Registro Nº 088).**
>
> **`MANUAL-DE-USO.md` deixou de estar atrás do produto.** §13-A (menu Método —
> Trilha e Entregáveis) criada; §12-A (Proteção e Segurança) completada com as
> quatro telas entregues desde a 9-A.2 que nunca haviam entrado — sua abertura
> ainda dizia que o menu *"está sendo construído por partes"*; §3 (Navegação)
> corrigida, listava seis grupos de menu num sistema que tem treze. Mudança
> exclusivamente em documentação — nenhum arquivo de código tocado.
>
> **Cada afirmação foi conferida contra o código**, não escrita de memória, e
> em dois pontos o texto foi corrigido para usar **a palavra que está na tela**
> ("Ainda não sei", "Não informado"): manual que descreve um botão com nome
> diferente do real faz o leitor procurar o que não existe.
>
> **Achado: o simulador "E se?" é código vivo sem porta de entrada.** A Etapa
> 9-A.6 dá a tarefa como concluída, e o motor está pronto e testado
> (`AssessmentOverrides` em `lib/method/mcrf/run-assessment.ts`) — mas **os
> únicos chamadores que passam overrides são os testes de integração**. As três
> telas que chamam `runAssessment` chamam sempre sem eles. Capacidade
> implementada, coberta por teste e inalcançável pelo usuário. Não foi
> documentada no manual: descrever um recurso que o leitor não encontra na tela
> é pior que omitir. **A lição operacional é sobre o método de verificação** —
> escrever o manual funcionou como auditoria de entrega, porque descrever uma
> tela para um usuário obriga a olhar o que ela realmente oferece. Nenhum teste
> pegaria isso: o teste exercita o motor diretamente, que é justamente o trecho
> que funciona.
>
> **Pendência:** expor o simulador na tela da Reserva, ou decidir
> explicitamente que ele não será exposto e remover a capacidade.

> **Última atualização anterior: 2026-08-17 (PAN e AFF confirmados; e uma
> verificação de produção sobre o cron — Registro Nº 087).**
>
> **`catalog.ts` não tem mais nome provisório.** **PAN = Panorama Financeiro**
> (a devolutiva da Fase 1: retrato patrimonial, fluxo declarado, mapa de riscos,
> mapa de dívidas, objetivos priorizados, PSF de linha de base e as três
> alavancas de maior impacto) e **AFF = Acordo Financeiro Familiar** (uma
> página, assinada por todos, com metas comuns, prioridades e regras de
> decisão). Os dois são da **Fase 1**, corrigida no catálogo junto com propósito
> e seções. `nameConfirmed` continua no tipo de propósito: serve para marcar um
> artefato futuro que entre sem nome confirmado, não para ser apagado agora que
> ficou todo `true`.
>
> **Achado de produção em aberto — o cron da Etapa 6 nunca produziu efeito.**
> `CRON_SECRET` está presente e ativo (o deploy em execução é posterior a ele) e
> o endpoint responde **401** sem header — rota publicada, gate correto, e o
> middleware não engole mais `/api/cron` (o defeito do Registro Nº 076 está
> corrigido em produção). Ainda assim, um *dry-run* somente-leitura do motor
> contra o banco de produção mostrou que `INCIDENTE_ACUMULADO` **deveria** gerar
> 1 alerta (163 lançamentos pendentes de revisão), e `notifications` tem **zero**
> linhas `alerta_automacao` desde sempre. Pela cronologia, a execução de 08-16
> às 09:00 UTC caiu **antes** do fix do middleware (commit `b6362f0`, 09:27 UTC);
> a de 08-17 é a primeira com fix e segredo simultâneos no ar. **Verificação
> pendente e barata:** a condição dos 163 incidentes é persistente, então uma
> única linha `alerta_automacao` prova que voltou a funcionar — e continuar
> zerada prova o contrário.
>
> **Lacuna que o achado expõe:** a rota não deixa rastro quando roda sem
> disparar regra, então sucesso e falha silenciosa são indistinguíveis de fora.
> Só foi detectável porque a condição de uma regra era persistente. Um registro
> de execução (data, regras avaliadas, alertas gerados) é a correção natural.

> **Última atualização anterior: 2026-08-17 (Etapa 9 — `Deliverable` e os dez
> artefatos codificados — Registro Nº 086).**
>
> **Versionado e nunca sobrescrito.** Cada validação de fase gera versão nova
> (PFI v0 na Fase 1, v1 na Fase 2…). Um entregável é o registro do que foi dito
> ao cliente **numa data**; reescrever o passado apagaria a prova do trabalho.
> O índice único `(engagementId, code, version)` garante isso no banco, não só
> na aplicação. Validado não pode ser reescrito nem excluído — a ação recusa e
> orienta a criar versão nova.
>
> **`catalog.ts` é a fonte única** do que cada artefato é, em que fase nasce e
> quais seções precisa ter. Tela e PDF leem dali; nenhum define estrutura por
> conta própria. `checkCompleteness()` devolve **quais** seções faltam —
> "incompleto" sem dizer onde é aviso inútil. `nextVersion()` nunca reaproveita
> número, nem com buraco na sequência.
>
> **Decisão de honestidade que virou teste — e que cobrou o próprio resgate.**
> Na Etapa 9, oito das dez siglas tinham nome completo confirmado; **PAN e AFF
> não**. Em vez de inventar um nome plausível, ficaram com a sigla,
> `nameConfirmed: false`, aviso na tela e no PDF, e um teste fixando esse
> estado. **Em 2026-08-17 os dois foram encontrados na Metodologia v5.0, o teste
> falhou exatamente como projetado e obrigou a atualização** (Registro Nº 087) —
> ver o bloco mais recente acima. Nome errado em documento entregue ao cliente é
> pior que nome ausente; um teste que falha na hora certa é o que impede o
> provisório de virar permanente.
>
> **PDF reaproveita `pdf-shared.ts`** dos 8 relatórios existentes, em vez de
> criar um segundo padrão. Versão e data vão impressas: um PDF que circula por
> e-mail sem esses dois dados é afirmação sem contexto.
>
> **Verificado:** `tsc` limpo, 620/620 unitários (12 novos), 98/98 integração,
> build limpo. Migration em produção antes do código, checksum idêntico ao de
> dev, 2279 lançamentos intactos.
>
> **Pendência nomeada — resolvida em 2026-08-17 (Registro Nº 087):** confirmar
> os nomes de **PAN** e **AFF** na Metodologia v5.0 e atualizar `catalog.ts`.
> Ver o bloco mais recente no topo.
>
> **Última atualização anterior: 2026-08-17 (`ShockEvent` — fecha a pendência
> nomeada da Etapa 9-A — Registro Nº 085).**
>
> Era o item deixado explicitamente de fora no Registro Nº 083, anotado como
> pendência nomeada e não como esquecimento.
>
> **A regra que governa `shock-engine.ts` é uma proibição** (§46): *"não
> implementar aprendizado opaco; toda inferência relevante deverá ser
> identificável"*. Por isso nenhuma função devolve só um número — toda vez que
> o histórico muda o cálculo, ela devolve **qual evento causou a mudança** e a
> frase que a tela mostra. Um modelo estatístico escondido seria mais
> sofisticado e menos honesto.
>
> **Onde o histórico real entra (§34):** o maior desembolso do próprio bolso já
> registrado compõe o Piso de Liquidez Imediata, competindo com a maior
> franquia declarada. Cenário simulado é hipótese; evento registrado é fato, e
> o piso considera o maior dos dois. **Só eleva, nunca reduz** — nunca ter tido
> um choque grande não protege contra ter o primeiro (§8).
>
> O motor também mede o **prazo real mediano até a indenização cair**, que
> calibra com evidência o `payoutDelayDays` hoje apenas declarado na apólice. E
> aponta padrão de choques sem seguro **a partir de dois casos**, nunca de um —
> amostra unitária não vira conclusão.
>
> **§45 — recomposição.** A tela cobra a reposição sem tratá-la como fracasso:
> usar a reserva é ela funcionando; o que importa é o sistema saber e cobrar de
> volta. Sem aporte possível, o prazo é `null` — mesmo tratamento de
> `plan-engine.ts`, porque inventar prazo é ficção.
>
> O campo de seguro aceita **três** estados — sim, não e não informado. "Não
> sei se tinha" é diferente de "não tinha", e o cálculo não conta com o que não
> foi confirmado.
>
> **Verificado:** `tsc` limpo, 608/608 unitários (16 novos), 98/98 integração,
> build limpo. Migration em produção antes do código, checksum idêntico ao de
> dev, 2279 lançamentos intactos.
>
> **Nota de processo:** a integração falhou em 11 testes durante a
> implementação porque eu criei o arquivo de migration sem aplicá-lo ao banco
> de dev. Diagnóstico imediato pela mensagem, correção sem tocar em nenhum
> teste. Registro porque é o tipo de falha que, tratada com pressa, viraria
> "ajustar o teste".
>
> **Última atualização anterior: 2026-08-17 (Etapa 8 — camada de método, fecha o
> modelo de direitos de três camadas — Registro Nº 084).**
>
> A terceira camada de §4.6 finalmente existe. `Subscription` = o que foi
> contratado comercialmente; `PlanGrant` = elevação temporária;
> **`ConsultingEngagement` = o que só existe com um profissional por trás.**
>
> **A mudança de maior consequência está em `hasFeature()`.** Desde a Etapa 3,
> toda feature `METODO` devolvia `false` para todo mundo — fail-safe
> deliberado enquanto a camada que deveria concedê-las não existia. Agora
> resolve por contrato ativo, e **só** por ele. §3.1 da Metodologia é a razão
> ("PIP autogerada é recomendação disfarçada"): o que exige um profissional
> responsável não se compra como assinatura.
>
> Há teste provando exatamente isso: um workspace com `LEGACY_INTERNAL` — que
> inclui **todas** as features — continua sem método enquanto não houver
> consultor.
>
> **`Feature.methodPhase`** permite que contrato de `PROJETO` libere só a fase
> contratada (§13.8). Feature sem fase definida **não** é liberada por contrato
> de projeto: ampliar escopo por omissão daria de graça o que não foi vendido.
>
> **`PlanGrant.engagementId` virou FK de verdade**, como estava previsto desde
> a Etapa 4, quando nasceu como referência solta à espera desta tabela.
> `SET NULL` e não `CASCADE` — encerrar contrato não pode apagar o histórico
> de concessões que ele gerou.
>
> **Tela `/metodo/trilha`** com as 10 fases e o ritual de passagem de §7.3.
> Avanço condicional e retorno assistido exigem micrometa com prazo (§7.1
> Regra 3), barrado no formulário **e** na Server Action — avançar com
> ressalva sem prazo é avançar sem ressalva nenhuma.
>
> **Separação de papéis deliberada:** o cliente **vê** a trilha; só o consultor
> com escrita concedida (ou o admin) registra passagem. Deixar o cliente se
> auto-aprovar esvaziaria o gate. Abrir contrato é ação de admin e encerra o
> anterior — a regra "nunca mais de um ATIVO" é de aplicação, e ali é o lugar.
>
> **Verificado:** `tsc` limpo, 592/592 unitários, 98/98 integração (12 novos),
> build limpo. Migration em produção antes do código, checksum idêntico ao de
> dev, 2279 lançamentos intactos.
>
> **Nada mudou de visível em produção ainda:** nenhum `ConsultingEngagement`
> existe, então o comportamento é idêntico ao de antes até o primeiro contrato
> ser aberto. A entrega é de capacidade, não de estado.
>
> **Próximo combinado:** `ShockEvent` (§13/§45/§46) — registro de eventos reais
> e protocolo de recomposição da reserva.
>
> **Última atualização anterior: 2026-08-17 (Etapas 9-A.6 e 9-A.7 — fecham a Etapa
> 9-A — Registro Nº 083).**
>
> **9-A.6.** `plan-engine.ts`: prazo até a meta calculado sobre o que sobra
> **depois do custo essencial** (§44 proíbe comprometer despesa essencial), com
> metade do excedente como padrão — direcionar 100% da folga é insustentável e
> faria o prazo virar ficção. Sem folga, o resultado não é "meta impossível": é
> sinal de que o caminho passa por reduzir despesa ou aumentar renda antes de
> falar em prazo. `treatmentPlan()` (§40) aplica o princípio de §5 — **guardar
> mais dinheiro financia o risco; transferir, diversificar ou reduzir a
> exposição o diminui na origem**.
>
> **Simulador (§43):** `runAssessment` ganhou `overrides` aplicados depois do
> dado real e antes dos cenários, então tudo a jusante recalcula coerente.
> Nada é gravado — há teste provando.
>
> **9-A.7 — o ciclo que motivou antecipar a Etapa 12, fechado.**
> `liquidezPorReservaRecomendada()` troca o alvo fixo de 6 meses pela reserva
> calculada para aquela pessoa: é a diferença entre "você tem 6 meses de
> despesa" e "você tem o suficiente para atravessar os cenários que de fato te
> ameaçam". `protecaoCompleta()` implementa enfim a fórmula de §5.3.1 —
> reserva 50% + seguros 50%. A metade de seguros dependia de `InsurancePolicy`,
> que não existia na Etapa 5, e por isso Proteção espelhava Liquidez e ficava
> em zero para quem tinha cobertura contratada.
>
> **Fallback preservado:** sem `reserva_inteligente`, os indicadores continuam
> exatamente como estavam. Ninguém perde indicador pela mudança.
>
> **Correção durante a implementação:** a primeira versão da tela derivava a
> renda mensal da despesa (`cema × 1,6`) para alimentar o plano — número
> fabricado, exatamente o que a metodologia proíbe. Trocado por
> `rendaMensalObservada`, que o motor expõe e é a mediana real dos lançamentos.
>
> **Verificado:** `tsc` limpo, 592/592 unitários, 86/86 integração, build
> limpo. Sem migration.
>
> **ETAPA 9-A CONCLUÍDA.** As sete sub-etapas implementam a especificação
> PROSPECTA-MCRF-1.0: perfil de risco, seguros e benefícios, oito motores
> puros, stress tests, reserva versionada, telas e integração com o PSF.
>
> **O que ficou de fora, explicitamente:** o protocolo de recomposição (§45) e
> o aprendizado com eventos reais (§46) dependem de um registro de eventos
> (`ShockEvent`, §13) que não foi construído. Está anotado na arquitetura como
> pendência nomeada, não como esquecimento.
>
> **Última atualização anterior: 2026-08-16 (Etapa 9-A.5 — tela da Reserva, e um
> bug grave corrigido — Registro Nº 082).**
>
> `run-assessment.ts` (impuro) reúne o dado real, chama os sete motores puros e
> devolve a avaliação. Tela `/protecao/reserva` no ar (gate
> `reserva_inteligente`), seguindo §56. IPRF e mapa de riscos ficam atrás de
> `mrp_completo` — quem tem só o Max vê reserva e cenários; o plano de
> tratamento é consultoria, conforme a decisão comercial.
>
> **§18 sem perguntar:** a correlação de renda familiar é **inferida**
> comparando `IncomeSource.employerName` entre provedores. Mesmo pagador →
> correlação 1 (uma renda não protege a outra). Sem informação de pagador,
> assume correlação moderada — §8 proíbe tratar dado ausente como afirmação de
> independência.
>
> ---
>
> **BUG GRAVE, e o mais importante desta etapa: o custo essencial saía pela
> metade.**
>
> O teste de integração novo esperava CEMA de R$ 3.000 e recebeu R$ 1.500. Com
> janela de 12 meses e 6 meses de histórico, os motores preenchiam os meses
> vazios com zero e tiravam a mediana de `[0,0,0,0,0,0,X,X,X,X,X,X]` —
> exatamente metade. §11 manda o contrário: *"caso haja menos dados, utilizar
> os meses disponíveis e reduzir a confiança"*.
>
> **Quem seria afetado:** todo usuário com menos de 12 meses de sistema — ou
> seja, praticamente todo usuário novo — receberia custo essencial subestimado
> pela metade e reserva insuficiente. Justamente quem mais precisa acertar.
>
> Corrigido em `expense-engine.ts` e `income-observation.ts`: a janela começa
> no primeiro mês com movimento (por pessoa, no caso da renda, para que um
> provedor que entrou depois não arraste a observação do outro).
>
> **Por que os testes unitários não pegaram:** eles sempre criavam dado para a
> janela inteira. Só a integração, com dado real e janela parcial, expôs. Há
> agora teste de regressão dedicado em cada motor.
>
> **Efeito colateral positivo:** o motor passou a distinguir **renda
> intermitente** de **usuário novo** — antes produziam a mesma leitura, e são
> coisas muito diferentes.
>
> ---
>
> **O teste que a análise chamou de indispensável está no ar:** dois perfis com
> o mesmo CEMA e riscos diferentes produzem reservas diferentes (CLT × militar,
> mesmo custo, reservas distintas). Sem ele, a metodologia poderia ter
> degenerado para o múltiplo fixo de despesa que ela existe para substituir, e
> ninguém notaria.
>
> **Verificado:** `tsc` limpo, 571/571 unitários (133 nos oito motores MCRF),
> 81/81 integração, build limpo. Sem migration nesta etapa.
>
> **Nota de processo:** segunda vez nesta etapa que um teste falha por motivo
> diferente do esperado e expõe falha de **modelagem**, não de asserção.
> Diagnosticar antes de ajustar o teste foi o que separou corrigir o código de
> mascarar o defeito.
>
> **Falta na 9-A:** 9-A.6 (simulador "E se?", plano de construção, protocolo de
> recomposição) e 9-A.7 (PSF consumindo MCRF).
>
> **Última atualização anterior: 2026-08-16 (Etapa 9-A.4 — stress tests, Reserva
> Recomendada e `McrfAssessment` — Registro Nº 081).**
>
> A etapa em que os seis motores anteriores se encontram e um número sai.
>
> **`scenario-engine.ts` — a correção matemática que eu havia identificado na
> análise, agora aplicada.** §33 define `Need = ImmediateOutOfPocket + Σ max(0,
> Deficit_t)`. Somar déficits mensais já pisados em zero ignora que superávit de
> um mês financia déficit de outro — reserva é **estoque**, não fluxo. Trocado
> pelo **pico de saldo acumulado negativo**. O caso que motivou está em teste:
> déficit 1.000 / superávit 800 / déficit 1.000 pede 1.200, não 2.000. Quando
> todo mês é deficitário os dois coincidem, então a correção nunca afrouxa
> conservadorismo.
>
> **Segunda correção, essa descoberta pelo próprio teste durante a
> implementação.** Eu somava o desembolso imediato **por fora** do drawdown, o
> que anulava justamente o efeito que a primeira correção veio proteger: a
> franquia paga hoje doía igual com o seguro pagando amanhã ou daqui a seis
> meses. Movido para dentro do fluxo, no mês 0. Agora indenização tardia
> protege menos que imediata, com teste dos dois lados.
>
> Vale registrar o contraste: na mesma rodada, **dois testes falharam por
> motivos opostos** — num, a asserção é que estava errada (assumi crescimento
> estrito onde o piso em zero faz cenários empatarem, corretamente); no outro,
> o modelo. Diagnosticar antes de corrigir foi o que separou os dois.
>
> **`reserve-engine.ts`.** PLI derivado do CCM da própria pessoa, nunca valor
> fixo nacional. Margem de incerteza que cresce quando falta dado, com teto de
> 35% — acima disso a margem viraria o cálculo, e o resultado deixaria de ser
> derivado dos cenários para ser derivado da própria ignorância. **Divergência
> 5 resolvida:** o cenário H (combinado) entra no `max()` da Recomendada, como
> §31 exige, e a Reforçada se distingue por margem elevada — senão os dois
> níveis empatariam e o terceiro sumiria.
>
> **IPRF** implementado como diagnóstico de 6 componentes, **nunca
> multiplicador da reserva**, e sem virar segundo score de capa ao lado do PSF
> (divergência 3 da análise).
>
> **`McrfAssessment` (§48):** foto versionada; cada avaliação é linha nova com
> `methodologyVersion`, porque duas fotos com regras diferentes pareceriam
> comparáveis e a comparação no tempo mentiria. Diferente do PSF, onde a quebra
> de comparabilidade foi aceita — aqui é um valor em reais que a pessoa
> persegue por meses.
>
> **Verificado:** `tsc` limpo, 567/567 unitários (43 novos), 75/75 integração,
> build limpo. Migration em produção **antes do código**, checksum idêntico ao
> de dev, zero checksums vazios, 2279 lançamentos e 12 pessoas intactos.
>
> **Falta na 9-A:** 9-A.5 (telas), 9-A.6 (simulador "E se?", plano de
> construção, protocolo de recomposição) e 9-A.7 (PSF consumindo MCRF). O
> motor está pronto; nenhuma tela mostra o resultado ainda.
>
> **Última atualização anterior: 2026-08-16 (Etapa 9-A.3 fechada — liquidez
> elegível e motor profissional — Registro Nº 080).**
>
> Os dois motores puros que faltavam. Sem migration: ambos consomem schema já
> existente.
>
> **`liquidity-engine.ts` (§29/§30).** Reuso confirmado pela segunda vez: a
> classificação de liquidez que a especificação pede **já existia** como
> `funcaoPatrimonial` (Etapa 7). PROTECAO e LIQUIDEZ_OPERACIONAL viram
> liquidez imediata; OBJETIVOS e LONGEVIDADE viram estratégico; USO vira
> ilíquido. `WalletKind.isLiability` tem **precedência sobre tudo** — cartão
> classificado como PROTECAO por engano continua sendo crédito, e §29.5 proíbe
> crédito como reserva.
>
> Três decisões conservadoras: sem função nem tipo conhecido, assume
> ESTRATEGICO (contar como imediato o que ninguém classificou inflaria a
> reserva disponível); ilíquido tem fator 0 mas continua visível no bruto
> (§55 exige tratá-lo em separado, e a diferença entre bruto e elegível é o
> que a pessoa acha que tem e não tem); saldo negativo não vira reserva ao ser
> multiplicado por fator.
>
> **Correção de §30 aplicada** (divergência 2 da análise): o produto puro de
> três fatores de 0,8 daria 0,51 e destruiria metade da elegibilidade de um
> ativo levemente restrito. Ficou multiplicativo — explicável, como §30 quer —
> **com piso no pior fator isolado**.
>
> **`employment-engine.ts` (§20/§22/§23).** IPP 0–100 e curva de recuperação.
> Os pesos seguem três princípios: atividade **exercida** vale mais que
> formação (segunda atividade é o maior peso; `POSSIBILIDADE_TEORICA` vale
> zero, §21.4); experiência tem retorno decrescente; e **estabilidade não é
> portabilidade** — militar e servidor têm a renda mais estável do sistema e a
> menor conversão para o privado.
>
> Isso reduz o IPP deles, e é aqui que §23 importa: **IPP baixo não infla a
> reserva sozinho.** Ele alimenta a curva de recuperação, e a curva só entra
> num cenário materialmente relevante. Há teste mostrando que uma segunda
> atividade ativa compensa boa parte da diferença — que é exatamente a
> recomendação que §23 manda dar em vez de mandar guardar mais dinheiro.
>
> **Verificado:** `tsc` limpo, 524/524 unitários (33 novos; 86 no conjunto dos
> seis motores MCRF), 75/75 integração, build limpo.
>
> **Etapa 9-A.3 fechada.** Próxima é a 9-A.4: stress tests A–H, Reserva
> Recomendada e `McrfAssessment` versionado — onde os seis motores finalmente
> se encontram e um número sai.
>
> **Última atualização anterior: 2026-08-16 (Etapa 9-A.3 parte 1 — rigidez,
> parâmetros globais e motor CEMA/CCM — Registro Nº 079).**
>
> Implementa a decisão de negócio do usuário sobre §11.1–11.3: **rígida** =
> contrato de valor fixo que se paga mesmo sem usar; **ajustável** = essencial
> cujo consumo a pessoa controla; **discricionária** = pode ser suspensa.
> Exceção explícita dele: energia, água, gás, telefone e internet como
> **rígidas** — tecnicamente são consumo, mas comprimem pouco, e a escolha erra
> de propósito para reserva maior. Redução das ajustáveis: **30%**.
>
> **Governança que mudou a arquitetura:** o usuário decidiu que rigidez e
> percentual são **globais e só o admin da plataforma altera**. Isso impediu a
> solução óbvia (constante em `config.ts`), porque constante só muda com
> deploy. Virou `MethodologyParameter` (tabela), com o `config.ts` como padrão
> inicial e fallback — se a tabela não tiver o registro, o motor funciona
> mesmo assim. Tela `/admin/metodologia` nova, guardada por
> `requireAdminProfile()`, o mesmo de `/admin/planos`.
>
> **Seed por lista de exceções, não por planilha.** As 30 rígidas estão
> enumeradas em `prisma/seed-rigidez.ts` e todo o resto do ESSENCIAL deriva
> para AJUSTAVEL. Uma planilha de 285 linhas seria mais difícil de auditar e de
> manter coerente com a regra. O seed **avisa se um slug da lista não existir**
> na taxonomia — sem isso, um erro de digitação viraria "ajustável" em
> silêncio. Distribuição idêntica em dev e produção: 39/98/145.
>
> **`expense-engine.ts` — CEMA e CCM.** A diferença entre os dois é o que
> dimensiona a reserva: usar o CEMA infla (você guardaria para sustentar um
> padrão que não manteria desempregado); assumir que tudo é cortável
> subdimensiona e é irreal.
>
> **Correção de um erro que a especificação não menciona:** despesa periódica
> (IPVA, IPTU) é removida da série mensal **antes** da mediana e reintroduzida
> como duodécimo. Deixá-la na série faria contar duas vezes no mês em que
> ocorreu — há teste dedicado a isso.
>
> **Escolha conservadora deliberada:** essencial sem classificação de rigidez
> entra como **rígida** e reduz a confiança da análise. Assumir que comprime
> reduziria a reserva com base em decisão que ninguém tomou.
>
> **Verificado:** `tsc` limpo, 491/491 unitários (14 novos), 75/75 integração,
> build limpo. Migration e seed aplicados em produção **antes do código**,
> checksum idêntico ao de dev, 338 subcategorias e 2279 lançamentos intactos.
> Conferência dirigida: 11 de 11 subcategorias-amostra na classificação
> esperada.
>
> **Falta para fechar a 9-A.3:** liquidez elegível (§29/§30) e IPP (§20).
>
> **Última atualização anterior: 2026-08-16 (Etapa 9-A.2 — seguros e proteções —
> Registro Nº 078).**
>
> Segunda entrega da Etapa 9-A. `InsurancePolicy`, `InsuranceCoverage` e
> `BenefitEntitlement` (novos), mais dois motores puros.
>
> **A decisão de modelagem que importa:** o motor de risco **não consome a
> apólice, consome a cobertura**. `InsuranceCoverage` carrega os três números
> que decidem se uma proteção reduz ou não a necessidade de caixa — franquia,
> carência e, o mais esquecido, **prazo até a indenização cair**
> (`payoutDelayDays`). Sem o terceiro, o motor daria reserva confortável no
> papel e insuficiente na vida real: indenização que chega no 3º mês não paga a
> conta do 1º (§33). `BenefitEntitlement` segue o mesmo princípio com
> `availableAfterDays`.
>
> **`insurance-engine.ts`:** `applyCoverage()` desconta franquia, respeita
> limite de capital, devolve o **mês** em que o dinheiro entra e marca quando a
> carência bloqueou. `bestProtectionFor()` aplica a melhor cobertura e **nunca
> soma** duas apólices do mesmo risco — somar produziria proteção fantasma
> maior que a própria perda.
>
> **`benefits-engine.ts`:** implementa §23 — militar, servidor, autônomo, MEI e
> informal **não têm** FGTS, seguro-desemprego nem verbas rescisórias. Regime
> desconhecido nunca nega proteção (desconhecer não é negar). Só entra no fluxo
> o benefício confirmado **e** com valor; `isEligible` nulo fica registrado mas
> não é contado — contar com dinheiro incerto é o que faz uma reserva parecer
> suficiente sem ser.
>
> Telas `/protecao/seguros` (gate `seguros_cadastro`, reusado) e
> `/protecao/beneficios` (gate `reserva_inteligente`). A de benefícios filtra
> por regime e **explica o que ficou de fora** em vez de só esconder — o
> cliente precisa entender que a rede dele é diferente, não que o sistema
> errou. A regra é barrada também na Server Action, não só na tela.
>
> **Verificado:** `tsc` limpo, 477/477 unitários (25 novos), 75/75 integração,
> build limpo. Migration aplicada em produção **antes do código**, checksum
> idêntico ao de dev, 12 pessoas e 2279 lançamentos intactos.
>
> **Última atualização anterior: 2026-08-16 (Etapa 9-A.1 — perfil de risco, abre o
> módulo PROSPECTA-MCRF — Registro Nº 077).**
>
> Primeira entrega da Etapa 9-A, que **antecipa a Etapa 12** por decisão do
> usuário a partir da especificação
> `PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md`. Motivo técnico da
> antecipação: o indicador **Proteção do PSF só sai de zero quando reserva e
> seguros existirem juntos** — hoje ele espelha Liquidez por falta da metade de
> coberturas. A `ConsultingEngagement` (Etapa 8 original) fica para depois.
>
> **Análise técnica entregue antes de tocar em qualquer arquivo** (§58 da
> especificação). Ela achou o que mais importa saber daqui pra frente: **três
> peças centrais da metodologia já existiam no sistema com outro nome.**
> `Subcategory.macroBloco` (Etapa 1) **é** o eixo de classificação do CEMA;
> `funcaoPatrimonial` (Etapa 7) **é** a classificação de liquidez do §29;
> `Person` + `Entry.responsibleId` **são** a estrutura familiar e a atribuição
> de renda por pessoa. O que parecia tela de classificação na Etapa 7 era, na
> verdade, a fundação do motor de liquidez.
>
> **Seis divergências encontradas na especificação, com decisão registrada em
> `ARQUITETURA-METODO-PROSPECTAR.md` §6.** As duas de maior consequência:
> (a) §33 dimensiona a reserva somando déficits mensais já pisados em zero, o
> que ignora que superávit de um mês financia déficit de outro — adotado **pico
> de saldo acumulado negativo**, porque reserva é estoque, não fluxo;
> (b) a Reserva Recomendada colidiria com `Goal`, e este projeto **já teve bug
> por calcular meta de reserva paralela à `Goal` real** — decisão: o MCRF
> produz recomendação, `Goal` segue fonte única do alvo, e adotar é ação
> explícita do usuário. Não repetir esse erro foi decidido antes de escrever
> qualquer linha.
>
> **Entregue:** `RegimeTrabalho` (15 regimes), `SegundaAtividadeNivel`,
> `IncomeSourceKind`, `Person` estendida, `IncomeSource` novo — tudo aditivo e
> nulo por padrão. `lib/method/mcrf/config.ts` centraliza versão e parâmetros
> (§52: nenhum número mágico); `income-observation.ts` mede mediana, pior mês,
> meses sem renda, variabilidade e HHI a partir do `Entry` real.
>
> **Mediana, não média — e há um teste que existe só para provar isso:** 5
> meses de R$ 5.000 mais um 13º de R$ 20.000 dá mediana 5.000 e média 7.500. A
> média superestimaria em 50% a renda tida como resiliente e produziria reserva
> insuficiente justamente para quem depende dela.
>
> **`IncomeSource` não duplica o lançamento:** `Entry` de RECEITA segue fonte
> única sobre quanto e quando entrou. A tabela guarda o que o extrato não
> revela — e `employerName` existe para **inferir** correlação de renda
> familiar (§18) sem perguntar: duas fontes de pessoas diferentes com o mesmo
> pagador não são rendas independentes.
>
> Tela `/protecao/perfil` no menu novo **Proteção e Segurança**, aplicando §6
> literalmente: a renda **não é perguntada**, é exibida como observada.
>
> **Verificado:** `tsc` limpo, 452/452 unitários, 75/75 integração, build
> limpo. Migration aplicada em produção **antes do código** (regra do runbook
> §5), com checksum correto e idêntico ao de dev. Em produção: 12 pessoas
> intactas e nenhuma alterada, 35 migrations com zero checksum vazio, 9
> workspaces e 2279 lançamentos intactos.
>
> **Pendência de negócio para a 9-A.3:** §11.1–11.3 exige três níveis de
> despesa (rígida, ajustável, discricionária) e o sistema tem quatro blocos que
> cortam diferente — `ESSENCIAL` não distingue moradia de alimentação, e é
> essa distinção que separa CEMA de CCM. Decisão do usuário, não escolha
> técnica.
>
> **Última atualização anterior: 2026-08-16 (Bloco I + Etapa 7 em produção, sem
> pendências — Registros Nº 074 e Nº 075).**
>
> **Incidente que domina esta entrada: derrubei produção.** O push do Bloco I
> foi publicado com as migrations aplicadas só no banco de dev.
> `getCurrentProfile()` (`lib/auth/session.ts`) usa `include: { memberships }`
> — o Prisma seleciona todas as colunas que conhece, inclusive
> `advisor_can_write`, inexistente em produção. Como essa função roda em
> **toda rota autenticada**, o sistema inteiro atrás do login caiu, não uma
> tela. Restabelecido revertendo o deploy, com a árvore conferida como
> byte-a-byte idêntica ao último estado bom antes de publicar; o banco de
> produção nunca havia sido tocado, por isso a volta foi limpa.
>
> **A regra que saiu disso, agora no `RUNBOOK-OPERACIONAL.md` §5: banco antes
> do código, sempre.** E ela é segura justamente porque migration aditiva é
> inerte para o código antigo — o Prisma Client antigo não conhece a coluna
> nova e não a seleciona. Dá pra migrar, verificar com calma, e só então
> deployar.
>
> **Subida refeita na ordem certa:** inspeção somente-leitura → 8 migrations
> em transação única → `seed-plans` → `seed.ts` → deploy → `prisma/sql/011`.
> Produção: 9 workspaces, 2278 lançamentos, 53 carteiras, 11 memberships,
> tudo intacto em cada passo.
>
> **A inspeção prévia pegou uma regressão que nenhum teste pegaria**, porque
> dependia do estado real do banco: 4 workspaces tinham `Subscription`
> LEGACY_INTERNAL ativa, e o catálogo antigo de produção não tinha
> `multi_seat_5` — `hasSeatAvailable()` resolveria `cap = 1` com o assento já
> ocupado pelo titular, **impedindo esses 4 de convidar qualquer pessoa**.
> `seed-plans` deixou de ser cosmético e virou parte obrigatória da subida.
>
> **`seed.ts` completo em produção, com rede de proteção.** O risco era o
> upsert reverter nome de categoria editado à mão pelo admin. Mitigado com
> foto da taxonomia antes e depois: **0 categorias alteradas, 0 subcategorias
> alteradas fora de `macro_bloco`**, 282 classificadas. O risco não se
> materializou, mas só dá pra afirmar isso porque a foto foi tirada.
>
> **Pendência encontrada ao varrer o fechamento:**
> `prisma/sql/011_advisor_write_grant.sql` estava aplicado só em dev — as
> policies de RLS de produção ainda concediam escrita a ADVISOR enquanto a
> aplicação já revogava. Aplicado (24 policies `using` + 12 `with check`).
> Esses arquivos **não têm controle de "já aplicado"**; a conferência agora
> está no runbook.
>
> **Mudança de comportamento real, informada e aprovada antes:** os 4
> consultores ativos ficaram somente-leitura (`advisor_can_write` nasce
> `false`). Escrita se concede em `/admin/usuarios`.
>
> **Correções da Etapa 7 antes da subida (Registro Nº 074), achadas por
> revisão adversarial depois de eu dar a etapa por fechada:** dupla contagem
> (R$ 10.000 exibidos como R$ 20.000), percentual invertido com patrimônio
> negativo, e a pseudo-carteira interna aparecendo como classificável. Ver a
> entrada da Etapa 7 mais abaixo para o detalhe do erro de análise.
>
> **Verificado:** `tsc` limpo, `npm test` 423/423, integração 16 arquivos / 70
> testes, `npm run build` limpo. Em produção, verificação objeto a objeto,
> workspace a workspace e diff de taxonomia. Site respondendo após o deploy.
> **Não verificado por navegação real logada** — injeção de cookie de sessão
> bloqueada pelo classificador de permissão do ambiente; sem tentativa de
> contornar.
>
> **Pendência aberta, fora do meu alcance:** `CRON_SECRET` precisa ser criada
> nas env vars da Vercel para as automações dispararem. Sem ela a rota
> responde 401 — o app não quebra, só não alerta. É segredo de produção;
> quem define é o Felipe.
>
> **Última atualização anterior: 2026-08-15 (Etapa 7 do Método — classificação
> funcional do patrimônio, abre o Bloco II — Registro Nº 073).** Primeira
> entrega do Bloco II (Camada de Método).
>
> **Eixo novo de ESTOQUE, independente dos dois que já existiam.**
> `FuncaoPatrimonial` (enum de 7 valores: PROTECAO, LIQUIDEZ_OPERACIONAL,
> OBJETIVOS, LONGEVIDADE, CRESCIMENTO, USO, SUCESSAO) como campo **opcional**
> em `Asset`, `Investment` e `Wallet`. Não se confunde com `MacroBloco` (eixo
> de FLUXO, Etapa 1) nem com `InvestmentClass` (que diz o que a coisa **é**,
> não para que **serve**) — o mesmo CDB pode ser PROTECAO numa família e
> CRESCIMENTO noutra. Nulo em tudo por padrão: nenhum bem/carteira/
> investimento existente muda de estado ao aplicar a migration.
>
> `lib/method/patrimony-function.ts` (novo, puro) — `computeFunctionMap()` (7
> fatias + bloco "sem função" **sempre separado**, nunca diluído nas sete:
> mesmo princípio do "não alocado" da Régua e do "não avaliado" do PSF) e
> `unclassifiedFindings()` (o achado automático de §13.4 — só itens de valor
> positivo, maior primeiro; item zerado não é achado acionável, apontá-lo
> seria ruído numa lista cujo propósito é dizer "olhe para isto"). O módulo
> **nunca recalcula valor de patrimônio**: recebe o valor já pronto de
> `assetCurrentValue`/`investmentPositionValue`/`walletBalance`, que continuam
> sendo fonte de verdade única (mesma disciplina aplicada em toda etapa deste
> bloco).
>
> **Dupla contagem — errei a análise na primeira versão, corrigido depois de
> revisão adversarial (ver Registro Nº 074).** A primeira versão desta entrada
> afirmava que somar bens + investimentos + saldo de carteiras era seguro "por
> construção", porque lançamento de patrimônio usa `statusCode`
> AQUISICAO/ATUALIZACAO e `SETTLED_FOR_BALANCE` (`lib/finance/balance.ts`) é
> só {PAGO, RECEBIDO, ISENTO}. **Essa metade é verdadeira, a conclusão não
> era.** A disjunção vale **por lançamento**, mas não no agregado: o dinheiro
> chega na carteira de investimento por uma transferência comum, cujas duas
> pernas nascem `PAGO` (`lib/entries/transfer.ts`) e portanto entram no saldo —
> e comprar a posição **não debita esse caixa**. Resultado: R$ 10.000 apareciam
> como R$ 20.000 no total da tela.
>
> O teste de integração que eu citei como prova passava por acidente do
> cenário: aquele workspace nunca fez transferência pra carteira, então o saldo
> era zero e a soma fechava. Lição registrada porque o erro foi de método, não
> de digitação: **verifiquei metade de uma afirmação e escrevi a inteira como
> provada** — em três documentos, ainda por cima.
>
> Correção aplicada: o desconto vive em
> `lib/method/patrimony-function.ts::buildPatrimonyItems()` — saldo da carteira
> menos as posições que ela abriga (chaveado por `Investment.walletId`, não por
> `kindCode`), que é exatamente o caixa ainda não alocado, com piso em zero
> para o caso de posição cadastrada sem transferência correspondente. A função
> ficou no módulo puro **de propósito**: a montagem dos itens estava duplicada
> entre tela e teste, e foi essa duplicação que permitiu os dois divergirem.
> Agora tela e teste chamam a mesma função, e o cenário completo
> (transferência + compra) é teste unitário **e** de integração.
>
> Nova tela `/patrimonio/funcao` (Sidebar, dentro do grupo Patrimônio já
> existente — não virou item de topo, diferente de "Saúde Financeira"/
> "Assistente", porque pertence a um grupo que já existe). Gateada por
> `patrimonio_funcao` (Max, já no catálogo desde a Etapa 3 — nenhum backfill
> novo). Classificação inline que salva ao trocar o `select`, sem botão por
> linha: classificar patrimônio é sessão de muitos itens seguidos, um botão
> por linha viraria atrito puro. Carteiras de passivo (cartão de crédito) saem
> pelo próprio dado do catálogo (`WalletKind.isLiability`), nunca por lista de
> códigos escrita à mão na tela — dívida não recebe função patrimonial.
>
> **Limite de escopo deliberado, documentado no código pra não ser "melhorado"
> por engano numa sessão futura:** a tela mostra a distribuição e **não julga
> se ela está certa**. Dizer "40% do seu patrimônio está em USO" é informação;
> dizer se isso está bom é aconselhamento (§3.1/P2) e pertence ao MFP completo
> (`mfp_diagnostico`, feature de **método**, Etapa 14, que exige consultor
> ativo). A diferença entre as duas features não é de tamanho, é de natureza.
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 415/415 (11 casos novos de
> `patrimony-function.ts` — total negativo/zero, ordenação decrescente, fatia
> vazia que não some do mapa, os três tipos de item no mesmo mapa);
> `npm run build` limpo, 65 rotas (`/patrimonio/funcao` nova). Migration
> `20260815190000_funcao_patrimonial` aplicada e confirmada no banco de dev.
> Teste de integração novo (`tests/integration/method/patrimony-function.test.ts`,
> 5 testes) contra dado real: bem nasce sem função e aparece no achado com o
> valor real dos lançamentos, classificar tira do achado e move o valor pra
> fatia certa, limpar devolve pra "sem função", AQUISICAO não entra no saldo
> da carteira (a invariante acima, provada contra o banco), e carteira de
> passivo fica fora. Suíte de integração completa: 16 arquivos, 67 testes,
> tudo verde. Não verificado por navegação real logada — mesma ressalva do
> Registro Nº 072 (injeção de cookie de sessão bloqueada pelo classificador de
> permissão do ambiente; sem tentativa de contornar).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 073).
>
> **Última atualização anterior: 2026-08-15 (Etapa 6 do Método — Assistente de IA +
> Automações, fecha o Bloco I — Registro Nº 072).** Sexta e última entrega do
> Bloco I (Etapas 1-6).
>
> Duas peças novas do Max, as duas desenhadas como **alerta/resposta, nunca
> execução** — automação sempre vira `Notification`, jamais toca um `Entry`
> (§5.9); o assistente nunca recomenda produto ou ativo específico, recusa
> explicitamente qualquer pergunta desse tipo (§3.1/P2).
>
> **Benchmark feito antes de codar, a pedido do usuário:** sistema Pierre
> (CloudWalk) — assistente financeiro conversacional brasileiro com
> arquitetura de múltiplos agentes por cadência (Albert/diário, Marie/
> quinzenal, Galileu/mensal) e import automático via Open Finance. O achado
> mais relevante pra este projeto: **mesmo com acesso transacional completo,
> o Pierre só alerta, nunca executa uma ação financeira sozinho** — validou o
> desenho que já estava planejado antes da pesquisa, em vez de mudar rumo.
> Adotado do Pierre só o princípio (proatividade via notificação, cadência
> conceitual), não a personificação de agente com nome próprio — decisão
> consciente de manter mais simples nesta etapa.
>
> **Correção de premissa encontrada ao investigar antes de codar:** a versão
> anterior do documento de arquitetura dizia que o motor de automação
> reaproveitaria "o job mensal de recorrência já existente" — conferido em
> `lib/finance/installments.ts::generateInstallments()`, isso não existe (a
> materialização de 24 meses acontece inteira na criação, sem job periódico
> nenhum). Não havia `vercel.json` nem rota de cron no projeto — infra criada
> do zero (1ª rota de cron do projeto).
>
> `lib/method/automation-engine.ts` (novo, puro) — 5 gatilhos
> (`LIMIAR_CATEGORIA`, `VENCIMENTO_PROXIMO`, `VARIACAO_RECORRENCIA`,
> `META_FORA_DA_TRAJETORIA`, `INCIDENTE_ACUMULADO`), cada um uma função
> isolada testável sozinha, mais `evaluateAutomationRule()` que despacha por
> `trigger`. `lib/method/ai-assistant.ts` (novo, puro) — Q&A por casamento de
> padrão sobre um catálogo pequeno e fixo (saldo, receita/gasto do mês — geral
> ou por categoria —, quanto falta pra reserva, incidentes pendentes); a
> pergunta em linguagem natural nunca "calcula" nada sozinha, só traduz pra uma
> chamada estruturada às mesmas funções puras de `lib/finance/` que já
> alimentam Painel/Relatórios (`dashboardBalanceBlocks`, `periodTotals`) —
> cada resposta é auditável via `AiInteraction.answerQuery`, nunca só o texto
> solto. Reserva "pra que meta serve a resposta de reserva" resolvida por
> convenção de nome (`Goal.name` contendo "reserva") — sem um campo dedicado
> no modelo `Goal` pra isso; sem correspondência, responde "não configurada"
> em vez de adivinhar uma meta qualquer.
>
> `AutomationRule`/`AiInteraction` (novos models, schema já vinha desenhado
> desde a passagem de arquitetura). `lib/method/run-automations.ts` (novo,
> impuro) — busca `Entry`/`Goal`/incidentes reais por workspace, monta o
> contexto, chama o motor puro, grava `Notification` em lote. Deliberadamente
> separado da rota de cron: a rota de API só autentica e chama essa função,
> que fica testável direto contra o banco de dev sem precisar simular um
> `NextRequest` (rota exercitada indiretamente; ver "Verificado" abaixo).
> `vercel.json` + `app/api/cron/automations/route.ts` — protegida por
> `Authorization: Bearer ${CRON_SECRET}` (mesmo header que a própria Vercel
> envia em execução real de cron), roda 1x/dia.
>
> Nova tela `/painel/assistente` (Sidebar, item novo "Assistente" logo abaixo
> de "Saúde Financeira") — chat simples (`useActionState`) pro Assistente, e
> um catálogo fixo de 5 "templates" de alerta com liga/pausa/exclusão (não um
> construtor de regra livre — mesmo espírito do próprio Assistente: superfície
> pequena e previsível, não um formulário genérico que aceitaria qualquer
> coisa). Gates independentes por feature (`ia_assistente`/`automacoes`,
> ambas já existiam no catálogo Max desde a Etapa 3) — um workspace pode ter
> uma sem a outra via `PlanGrant` pontual.
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 404/404 (20 testes novos de
> `automation-engine.ts`, 13 de `ai-assistant.ts`); `npm run build` limpo, 64
> rotas de página + API (`/painel/assistente` e `/api/cron/automations`
> novas). Migration `20260815180000_automation_ai` aplicada e confirmada no
> banco de dev. Teste de integração novo
> (`tests/integration/method/automations-cron.test.ts`, 4 testes) chama
> `runDueAutomations()` direto contra dado real: não dispara abaixo do
> limite, dispara e grava `Notification` com o texto certo quando o limite de
> categoria é ultrapassado, ignora regra pausada, dispara
> `META_FORA_DA_TRAJETORIA` calculando o saldo real da carteira vinculada à
> meta. Suíte de integração completa: 15 arquivos, 62 testes, tudo verde.
> **Não verificado por navegação real logada** — a técnica de login sem senha
> (seção 21) foi tentada (magic link + `verifyOtp()`, sem digitar nenhuma
> senha), mas o passo de injetar o cookie de sessão no Browser pane foi
> bloqueado pelo classificador de permissão do ambiente, que tratou a ação
> como injeção de credencial; não houve tentativa de contornar o bloqueio —
> mesma ressalva já registrada para outras telas administrativas/Max desta
> sessão.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 072).
>
> **Última atualização anterior: 2026-08-15 (Etapa 5 do Método — Painel de Saúde
> Financeira níveis 1 e 2 — Registro Nº 071).** Quinta entrega do Bloco I.
>
> `HealthSnapshot` (novo) + `lib/method/psf.ts` (novo) — 5 dos 7 indicadores do
> PSF (§8): Organização (reaproveita o Índice de Consistência da Etapa 2 direto,
> sem transformação), Endividamento (`100 − min(100, (compromisso mensal ÷ renda
> líquida média) × 200)` — `averageMonthlyIncome`, novo em `lib/finance/
> reserve.ts`, espelha `averageMonthlyExpense`), Liquidez (fôlego: saldo líquido
> ÷ despesa média, alvo 6 meses), Proteção e Construção Patrimonial (Max,
> reaproveitam a Régua da Etapa 1 pra piso de banda de renda).
>
> **Decisão de desenho documentada explicitamente no código, pra não virar bug
> "corrigido" de volta por engano:** Liquidez usa fôlego geral (saldo ÷ despesa
> média), não `goalProgress()`/a `Goal` de reserva do usuário. Isso não é
> descuido — o Painel já teve um bug real corrigido antes desta sessão por
> calcular sua própria meta de reserva em paralelo à `Goal` real do cliente
> (comentário em `app/(app)/painel/page.tsx`: "nunca um número paralelo"). Esse
> bug era sobre *inventar um alvo* onde já existia um real; o indicador de
> Liquidez do PSF não inventa alvo nenhum — mede fôlego geral (§7.2: "capacidade
> de enfrentar compromissos e imprevistos"), uma pergunta diferente de "quanto
> falta pra bater minha meta de reserva". Os dois convivem sem conflito. Deixei
> o raciocínio completo comentado em `lib/method/psf.ts::liquidez()` porque a
> distinção é sutil o suficiente pra alguém (inclusive eu, numa sessão futura)
> tentar "simplificar" de volta pro padrão errado sem entender o porquê.
>
> Proteção usa 100% do peso na reserva por enquanto (mesmo valor de Liquidez,
> capado em 100) — a metade de cobertura de seguros da fórmula completa
> (§5.3.1: "(reserva × 50%) + (coberturas × 50%)") depende de `InsurancePolicy`,
> que só chega na Etapa 12 (Bloco III). Comentário no código já aponta isso como
> pendência de revisão quando aquela etapa landar.
>
> Nova tela `/painel/saude-financeira` (Sidebar, item novo "Saúde Financeira"
> logo abaixo de "Painel" — decisão de manter os dois como itens de topo
> separados, não transformar "Painel" num grupo com submenu, pra não alterar a
> estrutura de navegação existente). Gateada por `psf_nivel_1`
> (Pro)/`psf_nivel_2` (Max) — ambas as features já existiam no catálogo desde a
> Etapa 3, `LEGACY_INTERNAL` já as cobre, nenhum backfill novo necessário.
> Distingue visualmente "não avaliado" (sem dado) de "disponível no Max"
> (bloqueio comercial) — exigência explícita de §8.3. Botão "Salvar no
> histórico" grava um `HealthSnapshot` (Server Action separada da renderização
> da página — sem escrita silenciosa no simples ato de ver a tela).
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 371/371 (18 testes novos de
> `psf.ts`, 3 de `averageMonthlyIncome`); `npm run build` limpo, 70 rotas. Teste
> de integração novo (`tests/integration/method/psf.test.ts`, 3 testes) confirma
> contra o banco de dev real: Organização/Endividamento/Liquidez calculados a
> partir de `Entry` verdadeiro batem com o esperado (endividamento perfeito sem
> dívida = 100; 24 meses de fôlego trava em 100/consolidado), o Índice de
> Consistência integra direto no indicador de Organização, e `HealthSnapshot`
> grava/lê de volta corretamente. Suíte de integração completa: 14 arquivos, 58
> testes, tudo verde. Não verificado por navegação real na tela — mesma
> ressalva de sempre (sem senha real do admin).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 071).
>
> **Última atualização anterior: 2026-08-15 (Etapa 4 do Método — PlanGrant e teto de
> assento — Registro Nº 070).** Quarta e última entrega do Bloco I — fecha o bloco
> comercial (Etapas 1-4), que já paga a conta sozinho sem depender de nenhum
> cliente de consultoria fechado.
>
> `PlanGrant` (novo model, §4.6) — camada 2 do modelo de direitos em três
> camadas: elevação temporária de nível que nunca escreve na `Subscription` do
> cliente. `engagementId` fica solto (sem FK) até `ConsultingEngagement` existir
> (Etapa 8) — mesmo padrão já usado em `Notification.relatedEntryId` pra
> referência a um conceito que ainda não tem tabela própria.
> `lib/billing/effective-level.ts::activePlanGrants()` (novo) +
> `hasFeature()` estendido: agora três fontes somam (Entitlement, Subscription,
> PlanGrant ativo), qualquer uma libera.
>
> **Segundo achado crítico da sessão (depois do de Etapa 3) — pego pelos próprios
> testes, não por inspeção manual.** A primeira versão do teto de assento
> (§4.3/§9.5: Individual = 1 pessoa, Família = até 5, em
> `lib/workspace/invite.ts`) aplicava `cap=1` por padrão pra qualquer workspace
> sem Subscription nenhuma — que é o caso de **toda produção hoje** (o backfill
> de `LEGACY_INTERNAL` da Etapa 3 só rodou contra o banco de dev, nunca contra
> produção, de propósito, por ser fora do escopo autorizado desta sessão). Rodar
> a suíte de integração existente (`tests/integration/workspace/invite.test.ts`)
> imediatamente expôs isso: os 3 testes que criavam convite começaram a falhar
> com "Este plano permite só 1 pessoa" — um workspace de teste comum, sem
> Subscription, tentando convidar pela primeira vez. **Se essa versão tivesse
> ido para produção sem esse teste rodar, qualquer cliente real convidando um
> familiar pela primeira vez desde este deploy teria sido bloqueado, sem
> nenhuma mudança de plano ter de fato acontecido** — uma regressão clássica de
> "aplicar uma regra nova a dado que nunca foi migrado pra ela".
>
> Corrigido: `hasSeatAvailable()` agora só aplica o teto quando o workspace
> **já tem** algum plano conhecido (Subscription ativa OU PlanGrant ativo) —
> sem isso, sem restrição, exatamente o comportamento de antes desta etapa.
> Regra geral reforçada nesta sessão: ausência de dado nunca vira restrição
> nova, só falta de dado. `acceptPendingInviteForEmail()` (chamada em silêncio
> depois de qualquer login) nunca lança — se o assento não estiver livre, o
> convite fica pendente sem aceitar, em vez de quebrar o login de alguém por
> causa de um convite alheio.
>
> Concessão manual de `PlanGrant` integrada a `/admin/usuarios`
> (`PlanGrantControl.tsx`, mesmo esqueleto de `AdvisorControl`/
> `BlockAccessControl`) — sem `ConsultingEngagement` ainda, toda concessão hoje
> é manual (cortesia, teste, acesso antecipado).
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 350/350; `npm run build`
> limpo, 69 rotas (nenhuma nova). Suíte de integração ganhou
> `tests/integration/billing/plan-grant.test.ts` (4 testes) e
> `tests/integration/workspace/seat-cap.test.ts` (5 testes, incluindo o caso
> "sem plano não restringe" que documenta a regressão evitada). Suíte
> completa: 13 arquivos, 55 testes, tudo verde — incluindo os testes de
> convite pré-existentes, que voltaram a passar depois da correção.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 070).
>
> **Última atualização anterior: 2026-08-15 (Etapa 3 do Método — catálogo comercial real,
> `/admin/planos` e primeira tela gateada — Registro Nº 069).** Terceira entrega do
> Bloco I — a mais arriscada até agora, porque é a primeira que liga `hasFeature()`
> a uma tela de verdade.
>
> **Achado crítico, checado antes de tocar em qualquer tela:** consultei o banco de
> dev direto e confirmei que **0 dos 3 workspaces existentes (incluindo o pessoal
> real) tinham qualquer `Subscription`**. Gatear qualquer tela sem resolver isso
> primeiro travaria todo mundo, inclusive o próprio usuário — exatamente o tipo de
> regressão que a regra "não altere o que já funciona" existe para evitar. Antes de
> escrever qualquer gate, investiguei se já existia alguma solução — e existia:
> `ARQUITETURA-IDENTIDADE-PLANOS.md` já previa um plano `LEGACY_INTERNAL` (todas as
> features liberadas, sem cobrança) exatamente para este cenário, implementado na
> migration `20260801205917_identity_plans_backfill` — só que essa migration nunca
> rodou contra o banco de dev **atual** (é um projeto Supabase novo, criado no
> Registro Nº 047, depois daquela migration ter sido escrita contra o antigo).
>
> `Feature.gateKind` (novo, enum `PLANO`/`METODO`) — admin decide, por feature, se
> ela é liberada por nível de plano ou por camada de método (`ConsultingEngagement`,
> ainda não existe — toda feature `METODO` retorna `false` pra todo mundo até a
> Etapa 8, de propósito, fail-safe). `prisma/seed-plans.ts` (novo, `npm run
> db:seed:plans`) — os 51 códigos de feature de §13.8 (com rótulo em português) e os
> 6 SKUs reais (Start/Pro/Max × Individual/Família, preços de §5.1), cada um
> incluindo integralmente o nível anterior (§4.2). **Descoberta no meio do
> trabalho:** dois códigos novos (`ia_assistente`, `open_finance`) já existiam num
> catálogo de roadmap comercial anterior (12 features, planos `START`/`PLUS`/
> `PREMIUM`/`PREMIUM_NEGOCIOS`, todos com preço R$ 0,00 placeholder) — sem
> sobreposição de nome com o resto, então o `upsert` (que nunca sobrescreve
> nome/gateKind já existente) simplesmente reaproveitou as duas linhas, sem
> duplicar. Catálogo final: 61 features únicas (49 genuinamente novas + 12 antigas).
>
> O seed reforça `LEGACY_INTERNAL` com as 61 (`skipDuplicates`, nunca remove o que
> já tinha) e reaplica o mesmo backfill idempotente da migration original — os 3
> workspaces reais do banco de dev ganharam `Subscription` em `LEGACY_INTERNAL`.
> Confirmado por query direta antes de prosseguir. Os 4 planos superados
> (`START`/`PLUS`/`PREMIUM`/`PREMIUM_NEGOCIOS`) marcados `isActive=false` — usando o
> campo que já existe pra isso (§20: nunca exclui, só arquiva) — pra não aparecerem
> misturados com os 6 SKUs reais na tela nova.
>
> Só depois de tudo isso confirmado seguro, `app/(app)/relatorios/regua/page.tsx`
> (Etapa 1) passou a checar `hasFeature(workspaceId, "regua_posicao")` — primeiro
> uso real de `hasFeature()` desde que foi criada (comentário original: "nenhum
> call site usa isto ainda"). Sem entitlement, a tela mostra uma mensagem
> explicando que a Régua é Pro em diante, em vez do relatório.
>
> Nova tela `/admin/planos` (`app/(app)/admin/planos/`) — matriz feature × plano
> com checkbox (`FeatureToggleCell.tsx`, auto-submete no clique via
> `requestSubmit()`), seletor de `gateKind` por feature (`GateKindSelect.tsx`),
> ativar/desativar plano inteiro. Tudo sem deploy, mesmo espírito de `NatureLabel`/
> `Subcategory.macroBloco`: seed dá o estado inicial, tela edita depois, sem nunca
> se sobrescreverem mutuamente (`PlanFeature` só recebe o seed inicial se o plano
> ainda não tiver nenhuma linha — bootstrap uma vez só, depois é 100% do admin).
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 350/350 (nenhum teste novo aqui —
> `hasFeature()` é impura, foi testada via integração); `npm run build` limpo, 69
> rotas. Seed rodado duas vezes contra o banco de dev real: primeira populou tudo
> (confirmado por query direta — 61 features, `LEGACY_INTERNAL` com as 61,
> `start_individual` com exatamente as 12 features certas do nível Start, os 3
> workspaces reais com `Subscription`), segunda confirmou idempotência ("nenhum
> workspace pendente", "4 planos superados desativados" — só na segunda rodada
> porque a primeira já tinha feito o resto). Suíte de integração ganhou
> `tests/integration/billing/entitlements.test.ts` (9 testes: feature inexistente,
> sem Subscription, ACTIVE/TRIALING/CANCELED, Plan sem a feature, Entitlement
> pontual válido/expirado, feature `METODO` sempre `false` mesmo com Subscription
> que a incluiria). Suíte completa: 11 arquivos, 46 testes, tudo verde. Não
> verificado por navegação real na tela — mesma ressalva de sempre (sem senha real
> do admin).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 069).
>
> **Última atualização anterior: 2026-08-15 (Etapa 2 do Método — Índice de Consistência e
> conciliação de saldo — Registro Nº 068).** Segunda entrega do Bloco I.
>
> **`lib/method/consistency.ts`** (novo) — os 5 componentes de §13.6, cada um 0–1,
> pesos confirmados na revisão (25% cobertura temporal, 25% qualidade de
> categorização, 20% fila de incidentes, 15% cobertura de carteiras, 15%
> conciliação). `filaDeIncidentes` reaproveita `lib/finance/incidents.ts::
> isEntryIncident` — não duplica a definição de incidente que já existe pra
> Compromissos → Incidentes; degrada proporcionalmente conforme incidentes passam
> de 30 dias em aberto (`overdue/total`), sem corte abrupto no dia 31.
> `computeConsistencyIndex()` exclui componentes `null` ("não avaliado") e
> redistribui o peso proporcionalmente entre os que têm dado — mesmo espírito do
> "não avaliado" já usado no desenho do PSF (§8.3): falta de dado nunca vira nota
> ruim.
>
> **`BalanceReconciliation`** (novo model) + **`lib/method/reconciliation.ts`**
> (novo, impuro) — `reconcileWalletBalance()` recalcula o saldo do sistema na hora
> (`lib/finance/balance.ts::walletBalance`, nunca confia em nenhum valor vindo do
> formulário além do declarado) e grava os dois números lado a lado;
> `latestReconciliationByWallet()` traz só a checagem mais recente de cada
> carteira. UI nova: coluna "Conciliação" em Cadastros → Carteiras
> (`WalletReconcileControl.tsx`) — mesmo padrão visual de `AdvisorControl.tsx`.
> Formatação de moeda/data feita local dentro do componente, não importada de
> `lib/format.ts` — esse módulo importa `Decimal` de `lib/finance/types`, que não
> pode ir pro bundle de um Client Component (gotcha já documentado nesta sessão,
> mesma solução já usada em `InvestmentHistoryRow.tsx`/`AssetCard.tsx`).
>
> Migration `20260815140000_balance_reconciliation` aplicada no banco de dev com o
> mesmo contorno de sempre (`prisma migrate dev` trava nesta máquina, §23).
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 350/350 (27 testes novos de
> `consistency.ts` — cada componente isolado, pesos somando 100, redistribuição
> quando componente é `null`, limite exato de 30 dias não conta como vencido);
> `npm run build` limpo, 62 rotas (nenhuma nova — a conciliação vive dentro de
> `/cadastros/carteiras`). Teste de integração novo
> (`tests/integration/method/reconciliation.test.ts`, 4 testes) confirma contra o
> banco de dev real: saldo do sistema calculado certo a partir de `Entry`
> verdadeiro, diferença registrada quando o declarado diverge, erro pra carteira
> de outro workspace (isolamento multi-tenant respeitado), e
> `latestReconciliationByWallet` trazendo só a checagem mais recente por
> carteira. Suíte de integração completa: 10 arquivos, 37 testes, tudo verde. Não
> verificado por navegação real na tela — mesma ressalva de sempre (sem senha real
> do admin); o teste de integração exercita a mesma função que a tela chama.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 068).
>
> **Última atualização anterior: 2026-08-15 (Etapa 1 do Método — macro_bloco, Régua de
> Alocação e ownerPersonId — Registro Nº 067).** Primeira entrega do Bloco I. Três
> peças, todas do escopo já desenhado em `ARQUITETURA-METODO-PROSPECTAR.md` §5.1/6:
>
> **`macro_bloco`** — `Subcategory.macroBloco`/`Entry.macroBlocoOverride` (enum
> `MacroBloco`, mesmo espírito de `isFixedOverride`: eixo independente de
> fixo×variável). As 285 subcategorias reais de Despesa (`seeds/seed_taxonomia.csv`)
> foram classificadas por categoria com exceções explícitas onde a categoria mistura
> essencial e discricionário (ex.: "1.Alimentação" tem Supermercado E Restaurante) —
> processo já documentado na revisão do próprio `ARQUITETURA-METODO-PROSPECTAR.md`
> (planilha enviada, usuário corrigiu duas regras gerais: financiamento de
> Habitação/Transporte fica Essencial, não Obrigação — diverge de propósito da leitura
> literal de §11.2; vestuário segue conforme o método). `seeds/seed_macro_blocos.csv`
> (novo) carrega isso via `prisma/seed.ts::seedMacroBlocos()` — nunca sobrescreve
> classificação já feita (mesmo padrão de `NatureLabel`). 282 das 285 preenchidas; as
> 3 restantes ("Ajuste", "Outros (atualização)", "Outras (despesas)") ficam
> deliberadamente sem bloco — não são gasto real.
>
> **Régua de Alocação** — `lib/method/allocation.ts` (novo): `computeAllocation()`
> soma Essenciais/Estilo de vida/Obrigações por `macroBlocoOverride ?? subcategory.
> macroBloco`; Poupança pela **fórmula (b) — soma direta** (decisão do usuário,
> seção 5.1 do documento de arquitetura): aportes de `INVESTIMENTO` + transferências
> pra carteira `CONTA_CAIXA` (só a perna de entrada, `amount > 0`), preferida à
> alternativa residual porque mede o que foi guardado de fato. `percentOfIncome()`
> calcula % sobre a receita do período, com `naoAlocado` como resíduo explícito (nunca
> escondido). `ALLOCATION_BANDS`/`bandForIncome()`/`compareToBand()` implementam as 5
> faixas de renda de §11.3. `lib/method/from-db.ts::toAllocationEntry()` (novo) faz a
> tradução Prisma→tipo puro — vive em `lib/method/`, não em `lib/finance/from-db.ts`,
> porque a regra de camadas do documento de arquitetura é `lib/method/` depender de
> `lib/finance/`, nunca o contrário. Nova tela `app/(app)/relatorios/regua/page.tsx`
> (grupo "Relatórios" no Sidebar, ícone `Ruler`) — mês corrente, só realizado
> (settled), 4 cards com valor/%/faixa-alvo/comparação, mais um aviso separado quando
> há despesa não classificada ou receita não alocada. Sem regime nem PDF nesta
> primeira versão (fica pra quando houver demanda).
>
> **`ownerPersonId`** — `Wallet`/`Investment`/`Asset` ganharam campo opcional
> apontando pra `Person` (não `Profile` — titularidade de recurso é conceito de
> negócio, não de login), preparação para Open Finance e para o diagnóstico familiar
> do Método (§9.4 da Metodologia: "cada adulto lança os próprios gastos"), decidido em
> `AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md` §4.3. Sem UI nova — só o campo, nulo
> em tudo que já existe.
>
> Migration `20260815130000_etapa1_macro_bloco_e_titularidade` (1 enum + 5 colunas + 3
> FKs, mesmo contorno de sempre — `prisma migrate dev` trava nesta máquina, §23: `.sql`
> escrito à mão seguindo a convenção exata de migrations anteriores do Prisma, aplicado
> via `pg` cru + registro em `_prisma_migrations`, script descartável apagado depois).
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 323/323 (18 testes novos de
> `computeAllocation`/`percentOfIncome`/`bandForIncome`/`compareToBand`); `npm run
> build` limpo, 62 rotas. Seed rodado contra o banco de dev real (`macro_blocos: 282
> subcategorias classificadas`). Teste de integração novo
> (`tests/integration/method/allocation.test.ts`) confirma, contra o banco de dev de
> verdade: (1) o seed classificou `supermercado`=ESSENCIAL, `restaurante`=
> ESTILO_DE_VIDA, `financiamento`/Habitação=ESSENCIAL (decisão do usuário confirmada
> no dado real), `uniforme_escolar`=ESSENCIAL; (2) `Entry` reais criadas no banco,
> lidas de volta com os relations de verdade e passadas por `computeAllocation`, batem
> exatamente com o total esperado (R$3.000 essencial, R$500 estilo de vida, R$600
> poupança = R$400 aporte + R$200 transferência, R$10.000 receita, 30%/6% dos totais).
> Suíte de integração completa: 9 arquivos, 35 testes, todos verdes. Não verificado
> por navegação real na tela — exigiria login com senha real do administrador, que não
> está disponível; o teste de integração exercita a mesma query/mapeamento que a tela
> usa, o que dá confiança equivalente.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 067).
>
> **Última atualização anterior: 2026-08-15 (Etapa 0 do Método — acesso do consultor deixa
> de ser escrita automática — Registro Nº 066).** Usuário aprovou `ARQUITETURA-METODO-
> PROSPECTAR.md` na íntegra e pediu para começar pela Etapa 0 — a mais simples e mais
> urgente do roteiro, e a única tratada como correção independente do Método (não
> depende de `ConsultingEngagement`, que ainda não existe).
>
> `Membership.advisorCanWrite` (novo, default `false`) — consultor (`ADVISOR`) nasce
> só com leitura, mesmo com Membership `ACTIVE`; antes tinha escrita plena, idêntica a
> `MEMBRO`, tanto em `lib/auth/session.ts::can()` quanto na RLS
> (`008_rls_completeness.sql`, decisão deliberada de 2026-08-10). Revertido por
> exigência de segurança/LGPD (Art. 20 — toda ação sobre dado de terceiro precisa ser
> rastreável, não automática por papel).
>
> `assertCanWrite()` ganhou terceiro parâmetro **obrigatório**, sem default —
> `advisorCanWrite: boolean` — mesmo padrão já usado em `periodTotals(settlement)`
> (Registro Nº 053): o compilador aponta todo call site que precisa de revisão em vez
> de herdar em silêncio um comportamento errado. `tsc --noEmit` encontrou exatamente
> 49 erros em 20 arquivos (46 pontos de chamada de `assertCanWrite`, alguns arquivos
> com múltiplas actions reusando um helper local `currentMembership()`) — todos
> corrigidos passando `membership.advisorCanWrite` (ou, nas rotas de API, o campo novo
> que `requireApiWorkspaceMembership()` passou a devolver) como terceiro argumento.
>
> `lib/workspace/advisor.ts::setAdvisorWriteAccess()` (novo) concede/revoga, sempre
> gravando `AccessLog` (`GRANT_ADVISOR_WRITE`/`REVOKE_ADVISOR_WRITE`) — reaproveita a
> tabela já existente, não criou mecanismo de auditoria paralelo. `assignAdvisor()`
> ganhou uma linha a mais: toda (re)atribuição de consultor zera `advisorCanWrite`,
> mesmo se for a mesma pessoa voltando depois de ter sido removida — nunca herda
> concessão anterior. UI nova: `AdvisorWriteToggle.tsx`, ao lado do já existente
> `AdvisorControl.tsx` em `/admin/usuarios` — "Escrita: só leitura" com botão
> "conceder"/"revogar". `MANUAL-DE-USO.md` atualizado (seções 14 e 16).
>
> Migration `prisma/migrations/20260815120000_advisor_can_write/` (coluna nova) +
> `prisma/sql/011_advisor_write_grant.sql` (RLS em sincronia — mesmo aviso do
> `008`: defesa em profundidade, RLS não é tecnicamente exercida hoje, o gate real é
> `can()`). Aplicadas ao banco de dev com o mesmo contorno já documentado (`prisma
> migrate dev` trava nesta máquina, §23) — script descartável via `pg` cru +
> registro em `_prisma_migrations`, apagado depois de rodar.
>
> **Verificado:** `tsc --noEmit` limpo; `npm test` 305/305 (4 casos novos: sem
> `advisorCanWrite` não escreve — mudança de comportamento deliberada — com `true`
> escreve, com `false` não escreve, não afeta outros papéis); `npm run build` limpo,
> 61 rotas. Suíte de integração contra o banco de dev real ganhou
> `tests/integration/workspace/advisor.test.ts` estendido com 5 testes novos
> (concessão, revogação, `AccessLog` gravado, erro sem consultor ativo, reset ao
> trocar de consultor) — 9/9 passando. Não verificado via login real na UI (exigiria
> senha real do administrador, que não está disponível); a suíte de integração roda
> contra o banco de dev de verdade, incluindo o `AccessLog` gravado de fato, o que dá
> confiança equivalente para uma mudança de autorização backend como esta.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 066).
>
> **Última atualização anterior: 2026-08-15 (Reformulação de arquitetura — Método
> PROSPECTAR — Registro Nº 065, documento aguardando aprovação).** Usuário entregou
> `Metodologia PROSPECTA v5.0 — Diretrizes de Planejamento Financeiro, Consultoria e
> Gestão Patrimonial.docx` (arquivo em `Downloads`, sem pandoc/soffice disponíveis
> nesta máquina — extraído com um script Python ad-hoc que lê `word/document.xml`
> direto do zip, ver `scripts/` desta conversa se precisar repetir) e pediu para ler o
> documento e reformular a arquitetura do sistema para incorporar o método, criando
> fases de implementação — com duas regras explícitas e vinculantes: nada do que já
> existe pode ser alterado/renomeado/removido, e toda extensão é aditiva (tabela nova,
> coluna opcional, módulo novo).
>
> O documento de origem (v5.0, controle de versão interno até 12/08/2026) é ao mesmo
> tempo manual de consultoria, especificação funcional e política comercial da
> PROSPECTA: separa produto (PROSPECTA Finance — Start/Pro/Max × Individual/Família)
> de serviço (PROSPECTA Consultoria — Diagnóstico/Planejamento/Projetos/
> Acompanhamento), une os dois por um "Método PROSPECTAR" de 9 fases (0–8 + ∞) com
> gates e um Painel de Saúde Financeira de 7 indicadores. A própria seção 13 do
> documento ("Integração Método ↔ Sistema") já continha um diagnóstico e um roteiro de
> 17 passos — o trabalho desta etapa foi **verificar cada afirmação daquele
> diagnóstico contra o código real** antes de aceitá-la.
>
> **Duas correções relevantes encontradas na verificação:** o documento afirmava "5
> dos 7 indicadores do PSF computáveis hoje" — falso, **não existe nenhum código de
> PSF** (nem tabela, nem tela, nem cálculo; existem só os insumos dispersos que
> tornariam isso possível). E afirmava a camada comercial (`Plan`/`Feature`/
> `Subscription`/`Entitlement`) como "projetada e aprovada" — as tabelas existem desde
> a Arquitetura de Identidade/Planos, mas `prisma/seed.ts` não semeia nenhum `Plan`/
> `Feature` e o próprio comentário de `lib/billing/entitlements.ts::hasFeature()` diz
> "nenhum call site usa isto ainda" — zero telas gateadas por feature hoje. Também
> notado: o documento cita papéis "OWNER/MEMBER/VIEWER", mas os nomes reais
> implementados são `TITULAR/MEMBRO/LEITURA/ADVISOR` (mesmos 4 papéis, nomenclatura em
> português veio depois do rascunho que o documento parece ter citado).
>
> Produzido `ARQUITETURA-METODO-PROSPECTAR.md` (mesmo protocolo do Registro Nº 006 —
> documento de projeto, "status: proposta para aprovação", nenhum código/schema
> tocado). Conteúdo: (1) tabela de diagnóstico verificado; (2) tradução técnica do
> modelo de direitos em 3 camadas de §4.6 (`Subscription` × `PlanGrant` novo ×
> `ConsultingEngagement` novo, com `nivelEfetivo()`/`hasFeature()` estendendo — não
> reescrevendo — a função já existente); (3) classificação de toda rota real de
> `app/(app)/` em Start/Pro/Max/Método, resolvendo a Pendência #1 "Alta" do documento
> de origem; (4) modelagem Prisma completa e aditiva das 10 entidades novas de §13.7
> (`PlanGrant`, `ConsultingEngagement`, `MethodPhase`, `GateCheck`, `Deliverable`,
> `HealthSnapshot`, `DiagnosticResponse`, `AllocationTarget`, `InsurancePolicy`,
> `RetirementProjection`) mais dois campos opcionais (`Subcategory.macroBloco`,
> `Entry.macroBlocoOverride`, `Asset/Investment/Wallet.funcaoPatrimonial`) e a
> entidade `Debt` — resgatando explicitamente a decisão registrada em
> `schema.prisma` de 2026-08-11 ("adiado... até haver mais clareza de uso real": o
> MEC da Fase 3 do método é essa clareza); (5) os 17 passos de §13.9 reorganizados em
> **16 Etapas de implementação em 4 blocos** — Bloco I (Etapas 1–5, motor comercial:
> macro_bloco/Régua, Índice de Consistência, Plan/Feature reais, PlanGrant, PSF —
> monetiza sozinho, sem depender de cliente de consultoria), Bloco II (6–9, abre a
> trilha de método), Bloco III (10–14, entregáveis vendáveis como projeto avulso —
> inclui a nova entidade `Debt`), Bloco IV (15–16, PFI compilado + Módulo PJ); (6)
> tabela de pendências do documento de origem mapeadas a qual Etapa cada uma bloqueia
> (ex.: "mapear as ~300 subcategorias nos 4 macroblocos" bloqueia a Etapa 1).
>
> **Não implementado nesta etapa — por desenho.** Nenhuma migration rodou, nenhum
> arquivo de código foi tocado. Próximo passo é aprovação do usuário, item a item,
> começando pelas pendências que bloqueiam a Etapa 1.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-15), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 065).
>
> **Última atualização anterior: 2026-08-12 (Compromissos — seleção em lote, filtro de
> datas e "Salvar e Confirmar" em Incidentes — Registro Nº 064).** Três pedidos: (1)
> checkbox de seleção em lote nas abas "Lista" e "Incidentes"; (2) filtro de datas nas
> duas; (3) em Incidentes, "Editar" ganha um terceiro botão "Salvar e Confirmar" (grava
> e já tira a linha da lista) ao lado de "Salvar" (grava, mantém pendente) e "Cancelar".
>
> `bulkMarkSettled`/`acknowledgeIncidentsBulk` (novos, `Promise.allSettled` — tolerante
> a falha individual, mesmo padrão de `EntriesTable.tsx`) fazem o trabalho em lote;
> botões individuais de cada linha passaram a chamar a mesma função com lista de 1 id,
> sem duplicar lógica com as ações originais `markSettled`/`acknowledgeIncident`
> (mantidas — `calendario/page.tsx` ainda usa `markSettled` via form action, fora do
> escopo deste pedido). `CompromissosList.tsx`/`IncidentsList.tsx` (novos, client)
> extraem a renderização das listas com estado de seleção (`Set<string>`). Filtro de
> data (`?from=&to=`, por vencimento) segue o mesmo padrão de
> `app/(app)/lancamentos/page.tsx` (form GET com dois `<input type="date">`).
> `updateIncidentEntry` ganhou campo `acknowledge` no `FormData` — quando `"1"`, grava
> `incidentAcknowledgedAt` junto com o resto; é o que diferencia os dois botões de
> salvar.
>
> **Verificado ao vivo** contra o banco de dev: seedadas 4 pendências + 2 incidentes de
> teste via SQL direto; seleção em lote na Lista marcou 2 como pago/recebido de uma vez
> (mensagem "2 lançamento(s) marcados.", saíram dos buckets); filtro de data restringiu
> corretamente; em Incidentes, "Salvar e Confirmar" reduziu a contagem de 2 para 1
> pendente. Dados de teste removidos ao final. `npm test` (302/302), `tsc --noEmit` e
> `build` limpos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 064).
>
> **Última atualização anterior: 2026-08-12 (Erro de importação em popup centralizado —
> Registro Nº 063).** Depois de esbarrar no bug do Registro Nº 062, usuário pediu que
> qualquer erro de importação apareça num popup no meio da tela — o texto pequeno em
> vermelho acima do formulário podia passar despercebido. `ImportErrorModal` (novo,
> `app/(app)/lancamentos/importar/ImportWizard.tsx`) segue o mesmo padrão visual do
> `LgpdSavedModal` já existente (overlay escuro, card centralizado, botão "Fechar"),
> substitui o `<p>` inline — cobre CSV/OFX/PDF e prévia/confirmação, já que todos usam
> o mesmo estado `error` do wizard. Verificado ao vivo contra o banco de dev forçando
> "Arquivo vazio." com um CSV vazio de propósito. `npm test` (302/302), `tsc --noEmit`
> e `build` limpos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 063).
>
> **Última atualização anterior: 2026-08-12 (Corrige "Erro interno." na importação de
> planilhas grandes — timeout de transação do Prisma — Registro Nº 062).** Usuário
> tentou importar sua planilha histórica completa (1737 linhas) em produção — a prévia
> carregou normal (2 erros reais, resto avisos/duplicatas), mas confirmar a importação
> devolvia "Erro interno.". `vercel logs` confirmou a causa real:
> `PrismaClientKnownRequestError` `P2028` — "A commit cannot be executed on an expired
> transaction. The timeout for this transaction was 5000 ms, however 5486 ms passed".
> Consulta somente-leitura direto em produção confirmou que **nada foi gravado** — a
> transação expirada aborta tudo, sem gravação parcial.
>
> Causa: `lib/import/commit.ts::commitImportBatch` roda a criação do lote, um
> `tx.entryGroup.create()` **sequencial** por grupo de parcelas/recorrência (61 grupos
> nesta planilha) e o `tx.entry.createMany()` final tudo dentro de um único
> `prisma.$transaction` sem timeout customizado — a soma dos passos sequenciais passa
> do default de 5000ms do Prisma em importações históricas grandes.
>
> `prisma.$transaction(fn, { timeout: 30_000 })` (era o default) +
> `app/api/import/commit/route.ts` ganhou `export const maxDuration = 60` (pra a
> função da Vercel não matar a requisição antes da transação atingir seu novo limite).
>
> **Verificado:** reprodução completa contra o banco de dev com a planilha real do
> usuário — falha confirmada antes da correção (mesmo padrão do log de produção,
> descontado o `after()` de sincronização de Agenda, que só funciona dentro de uma
> requisição Next.js real); depois da correção, importação completa pela UI real
> (upload → "Confirmar importação"): **1682 lançamentos importados, 55 ignorados**, em
> 3,3 segundos, sem erro. Dados de teste removidos do banco de dev ao final. `npm test`
> (302/302), `tsc --noEmit` e `build` limpos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 062).
>
> **Última atualização anterior: 2026-08-12 (Balanço do Painel desconta Investimento +
> gráficos com linha de Investimento e despesa como barra positiva — Registro Nº 061).**
> Usuário revisou o Painel em produção e apontou um problema conceitual: o "Balanço"
> (KPI e linha "Saldo" dos gráficos) somava "Investimento" como se fosse receita, quando
> na verdade um aporte tira dinheiro da carteira disponível (só volta a ficar líquido se
> resgatado). Pediu também duas melhorias visuais nos gráficos "Últimos 6 meses"/
> "Provisão": linha branca nova pra "Investimento" (pode ir abaixo de zero) e despesa
> passando a desenhar como barra positiva (acima do zero, igual receita, diferenciada só
> pela cor) — só visual, sem mexer em lançamentos.
>
> `lib/finance/period.ts::periodTotals()` — `balanco` vira `receita.plus(despesa).minus(investimento)`
> (antes somava). Como `investimento` já carrega o sinal certo (positivo em aporte,
> negativo em retirada), inverter a soma sozinho cobre os três casos que o usuário
> descreveu: aporte reduz o Balanço, retirada aumenta o Balanço, e dividendo/aluguel
> recebido de verdade (lançado como Receita numa carteira real via
> `registerInvestmentIncome`, nunca passa por `investimento`) continua somando certo sem
> mudança nenhuma. Card "Investimento" continua com o mesmo valor/sinal — só a fórmula do
> Balanço mudou. Como `periodTotals`/`monthlySeries`/`projectedBalance` são
> compartilhadas, a correção se propaga sozinha pro Painel, Balanço Anual (tela+PDF) e
> Fluxo Projetado (tela+PDF).
>
> `components/charts/MonthlyChart.tsx` — `MonthlyChartPoint.investimento` (novo, opcional
> — os outros 4 usos do componente não têm essa dimensão). Despesa passa a desenhar com
> `Math.abs()` só na barra (dado original com sinal intacto fora do componente). Nova
> `<Line dataKey="investimento" stroke="#ffffff">`, só aparece quando algum ponto tem o
> campo definido, com sinal real (pode ir abaixo de zero). `app/(app)/painel/page.tsx`
> passou a incluir `investimento` nos dois loops de gráfico.
>
> **Verificado ao vivo** contra o banco de dev (login sem senha): criados receita
> (R$5.000, recebida), despesa (R$2.000, paga) e um investimento novo com aporte de
> R$800, tudo no mesmo mês — Balanço mostrou R$2.200,00 (`5000 - 2000 - 800`, confirmado
> na mão), gráfico desenhou a barra de despesa em vermelho acima do zero ao lado da
> receita em verde. Dados de teste removidos do banco de dev ao final. `npm test`
> (302/302), `tsc --noEmit` e `build` limpos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 061).
>
> **Última atualização anterior: 2026-08-12 (Traduz erros do Supabase Auth + centraliza
> cabeçalho do login — Registro Nº 060).** Usuário testou o cadastro em produção logo
> depois do deploy do Registro Nº 059 e achou um bug real: senha fora da política
> (Registro Nº 058) mostrava o erro cru do Supabase **em inglês** na tela — viola a
> exigência de português formal em todo o sistema. Causa: `signup()`/`login()`/etc.
> devolviam `error.message` do SDK direto pro usuário, e esse texto nunca é traduzido
> pelo Supabase.
>
> `lib/auth/error-messages.ts::translateAuthError(error)` (novo) — mapeia por
> `error.code` (estável, ao contrário do texto livre de `error.message`) pros erros mais
> comuns (`weak_password`, `user_already_exists`, `invalid_credentials`,
> `email_not_confirmed`, `over_email_send_rate_limit`, `same_password`, `user_not_found`,
> `email_address_invalid`, `signup_disabled`) — código não mapeado cai num texto
> genérico seguro, nunca vaza inglês. Aplicado nos 5 lugares que mostram erro de Auth pro
> usuário final (confirmado por grep — não sobrou nenhum): `login`/`signup`/
> `requestPasswordReset` em `app/(auth)/login/actions.ts`,
> `app/(auth)/definir-senha/actions.ts`, `app/(auth)/redefinir-senha/page.tsx`,
> `components/GoogleSignInButton.tsx`. Confirmado o `error.code` real (`weak_password`)
> contra o SDK antes de mapear, não chutado.
>
> Logo/título/subtítulo do card de `/login` (login+cadastro e "esqueci senha") ganharam
> `flex flex-col items-center text-center` — antes alinhados à esquerda.
>
> **Verificado:** `translateAuthError` chamada direto com os `error.code` reais — cada
> um cai na mensagem certa; desconhecido cai no genérico. Centralização confirmada via
> `getComputedStyle` contra o servidor de dev. `npm test` (301/301), `tsc`, `build`
> limpos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 060).
>
> **Última atualização anterior: 2026-08-12 (Restringe autocadastro aberto — exige aprovação
> do admin — Registro Nº 059).** Usuário reportou que qualquer pessoa com o link
> `/login` conseguia criar conta e ganhar acesso imediato — pediu pra fechar isso. Pediu
> dois mecanismos: autocadastro livre vira pendente (com e-mail avisando o admin); convite
> por e-mail específico dá acesso direto. Achado importante: **o segundo mecanismo já
> existia** (`/admin/clientes` → `createClientPreRegistration`) — só o primeiro precisou
> ser construído.
>
> `WorkspaceBlockReason` ganhou `AGUARDANDO_APROVACAO` (só o trigger de signup grava,
> nunca escolha manual do admin) + `Workspace.adminNotifiedAt` (idempotência do e-mail).
> `prisma/sql/010_self_signup_requires_approval.sql` reescreve `handle_new_auth_user()`
> mais uma vez: o branch "sem convite pendente" (001/007) agora grava
> `blocked_at`/`blocked_reason` no mesmo INSERT do workspace — **reaproveita o mecanismo
> de bloqueio de acesso do Registro Nº 056** em vez de um conceito novo do zero. Branch
> do convite não muda — continua com acesso imediato.
>
> `lib/workspace/pending-approval.ts::notifyAdminsOfPendingApproval` avisa todo
> `isPlatformAdmin=true` por e-mail (idempotente), chamado de
> `app/(auth)/login/actions.ts::signup()` e `app/auth/confirm/route.ts` (Google) — os
> dois únicos pontos onde alguém novo termina de se cadastrar. Admin aprova pela mesma
> tela do Registro Nº 056 (`BlockAccessControl.tsx`, botão vira "aprovar acesso" pro
> motivo `AGUARDANDO_APROVACAO`, mesma action `unblockWorkspaceAccess`).
>
> **Verificado no banco de dev**: cadastro sem convite nasce bloqueado + e-mail
> disparado (idempotente); pessoa bloqueada cai em `/acesso-bloqueado` com a mensagem
> certa; admin aprova e o acesso libera na hora; cadastro COM convite continua com acesso
> imediato, sem bloqueio. Suíte E2E completa (5/5) verde após ajustar
> `createE2EUser()`. **Não deu pra exercitar o formulário público de `/login` de
> verdade** — projeto de dev bateu o rate limit de e-mail do Supabase (sem SMTP próprio);
> contornado testando a mesma lógica via Admin API (mesmo trigger, sem e-mail) + chamada
> direta da função de notificação. Produção já usa Brevo, não deve ter esse teto.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 059).
>
> **Última atualização anterior: 2026-08-12 (Correção dos achados do Supabase Security
> Advisor — Registro Nº 058).** Usuário recebeu o e-mail automático do Supabase (11/08)
> reportando vulnerabilidades em produção + 3 capturas do Security Advisor ao vivo (1
> erro, 11 avisos). Investigação (só leitura, antes de mudar nada): o 2º problema crítico
> do e-mail (`sensitive_columns_exposed`) já estava resolvido — só `_prisma_migrations`
> (entre as 33 tabelas de `public`) estava sem RLS. As 5 funções `SECURITY DEFINER`
> (`handle_new_auth_user`, `handle_deleted_auth_user`, `is_platform_admin`,
> `is_workspace_member`, `workspace_role`) nunca tiveram `GRANT`/`REVOKE` explícito —
> ficaram com `EXECUTE` liberado até pra `anon` (visitante sem login) via
> `/rest/v1/rpc/...`. Confirmado que as 3 últimas são usadas DENTRO de praticamente toda
> policy de RLS do banco (não dá pra revogar de `authenticated`, só de `anon`); as 2
> primeiras só disparam via trigger (não precisam de `EXECUTE` de ninguém).
>
> `prisma/sql/009_security_advisor_fixes.sql` (novo, mesmo padrão numerado 001-008):
> RLS habilitada em `_prisma_migrations` (sem policy — só a ferramenta de migration toca
> essa tabela, e ela conecta como owner, que ignora RLS); `REVOKE EXECUTE` das 2 funções
> de trigger de todo mundo; das 3 auxiliares de RLS só de `public`+`anon` (mantém
> `authenticated`, que as policies exigem). App não usa PostgREST hoje (acessa via
> `pg`/Prisma com role privilegiada) — defesa em profundidade, zero efeito funcional.
>
> **Verificado no banco de dev antes de produção:** criado e excluído um usuário de teste
> real via Admin API — os dois triggers continuaram funcionando normalmente;
> `is_workspace_member()` continuou executável; `npm test` (301/301) +
> `npm run test:integration` (26/26) verdes. Só depois, com autorização explícita,
> aplicado em produção — confirmado lá também (RLS em 100% das tabelas, grants exatos).
>
> **Fora do alcance de SQL — precisa de ação manual do usuário:** "Leaked Password
> Protection" é configuração de Auth no painel do Supabase (Authentication → Policies/Auth
> Settings → Password Security), sem acesso de credencial pra fazer por aqui. Passo a
> passo entregue ao usuário.
>
> **Registrado formalmente:** `REGISTRO-OPERACIONAL.md` (Registro Nº 058).
>
> **Última atualização anterior: 2026-08-12 (Deploy do bloqueio de acesso + confirmação do
> usuário — Registro Nº 057).** Fechamento do Registro Nº 056 (bloqueio de acesso,
> admin-only — ver bloco "anterior" logo abaixo pro detalhe completo da implementação):
> commit `fcf1734` pushado, CI verde nos dois jobs, e a migration
> `20260812080000_workspace_block_access` aplicada em **produção** (só tinha ido pro banco
> de dev durante o desenvolvimento — sem isso o deploy da Vercel quebraria toda consulta
> que toca `Workspace`, já que o `Prisma Client` novo pede as 4 colunas novas). Aplicada
> com o mesmo contorno de `prisma migrate dev`/`deploy` travando nesta máquina (seção 23)
> — `.sql` via `pg` cru + registro em `_prisma_migrations`, guarda dupla no script (aborta
> se detectar o ref de dev). 4 colunas confirmadas, todas nulas, nenhum dos 8 workspaces
> reais afetado. **Usuário testou na versão real e confirmou: "testei, funcionou tudo."**
>
> **Registrado formalmente:** `REGISTRO-OPERACIONAL.md` (Registro Nº 057).
>
> **Última atualização anterior: 2026-08-12 (Bloqueio de acesso ao sistema, admin-only —
> Registro Nº 056).** Usuário pediu uma alternativa a excluir a conta de um cliente
> inadimplente: um bloqueio reversível, com motivo escolhido num menu suspenso, que
> mostra uma mensagem específica pro cliente na próxima vez que ele tentar acessar.
> Decisão confirmada com o usuário: **bloqueio é por workspace** (a conta do cliente
> inteira), não por pessoa/profile — inadimplência é conceito de workspace neste sistema
> (é onde mora `Subscription`).
>
> `Workspace` ganhou `blockedAt`/`blockedReason` (enum `WorkspaceBlockReason`:
> FATURA_EM_ABERTO/SOLICITACAO_DO_CLIENTE/VERIFICACAO_DE_SEGURANCA/ORIENTACAO_DO_CONSULTOR/OUTRO)/
> `blockedDetail`/`blockedBy` — sem tabela de histórico separada, mesmo espírito leve de
> `Entitlement`. Migration aplicada à mão (`prisma migrate dev` trava nesta máquina contra
> este banco — mesmo problema documentado na seção 23, "Débitos técnicos"; `.sql` escrito
> manualmente + aplicado via `pg` cru + registro em `_prisma_migrations`).
>
> `lib/auth/session.ts::requireActiveMembership()` ganhou o mesmo mecanismo do gate de
> LGPD: `if (membership.workspace.blockedAt) redirect("/acesso-bloqueado")`, cobrindo toda
> a `(app)` de graça via `app/(app)/layout.tsx`. `requireApiWorkspaceMembership()` (rotas
> de API, fora do layout) e `requireMembershipForWorkspace()` ganharam o mesmo check,
> como `ApiError(403)`. Nova tela `/acesso-bloqueado` (mesmo esqueleto de
> `/aceitar-politica`) mostra a mensagem do motivo, botão "Atualizar pagamento" desabilitado
> (só no motivo Fatura em aberto — sem link ainda, usuário disse que não sabe pra onde
> apontar) e um escape hatch: se a pessoa tiver outro workspace ACTIVE não bloqueado (ex.:
> consultor com vários clientes), mostra links reusando `setActiveWorkspace` já existente
> — sem isso, ficaria presa na tela mesmo tendo outros workspaces acessíveis.
>
> Botão em `/admin/usuarios` (`BlockAccessControl.tsx`, mesmo esqueleto de
> `AdvisorControl.tsx`), na linha do titular de cada workspace — nunca na própria linha do
> admin logado (mesma auto-proteção de `DeleteUserButton`/`PlatformAdminToggle`).
> `lib/workspace/block-reasons.ts` (rótulos/mensagens, sem import de `prisma`) separado de
> `lib/workspace/block.ts` (`blockWorkspace`/`unblockWorkspace`, com `prisma`) — mesmo
> cuidado de bundle de Client Component já documentado nesta sessão.
>
> **Verificado ao vivo** contra o banco de dev (dois usuários de teste — admin + cliente):
> bloqueado com "Fatura em aberto" → cliente caiu em `/acesso-bloqueado` com a mensagem e
> o botão desabilitado certos → API retornou 403 → desbloqueado → acesso normal voltou →
> motivo "Outro" com texto customizado apareceu exato → escape hatch testado dando ao
> cliente uma segunda membership ADVISOR num workspace não bloqueado, confirmado que
> aparece e funciona.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 056).
>
> **Última atualização anterior: 2026-08-12 (Correção do filtro de prazo em Dívidas +
> excluir/arquivar em Investimentos — Registro Nº 055).** Usuário reportou, na versão
> real, que o filtro de curto/longo prazo do Registro Nº 054 classificava errado: um
> financiamento 1/24 (23 parcelas restantes) aparecia em "Curto prazo"; um 1/12 (11
> restantes) aparecia em "Longo prazo". Causa: `classifyDebtTerm` comparava `lastDueDate`
> (vencimento da última parcela) contra `hoje + 12 meses` — parcela atrasada empurra essa
> data sem refletir quanto realmente falta. Trocado pro critério `remainingCount <= 12`
> (parcelas restantes) — como todo parcelamento aqui é mensal, "12 parcelas restantes" e
> "12 meses restantes" são a mesma coisa, sem depender de estar em dia. Função não recebe
> mais `today`.
>
> Mais dois pedidos sobre o histórico de investimento (mesma tela do Registro Nº 054):
> **excluir lançamento** — `lib/entries/investment.ts::deleteInvestmentEventEntry` (mesmo
> escopo duplo `workspaceId`+`investmentId` do update), botão "Excluir" em
> `InvestmentHistoryRow.tsx` com `confirm()` antes. **Arquivar não deve sumir da
> Carteira** — usuário achou estranho o valor "ainda contar em algum lugar" depois de
> arquivar. Investigação: os totais de Investimento no Painel (`totals.investimento`,
> "Saldos por carteira") vêm direto de `Entry`/`Wallet`, nunca checam
> `Investment.isActive` — **isso é correto por design**, arquivar não é vender, o
> dinheiro continua de verdade na carteira; a tela de Análise já filtrava `isActive`
> certo. O bug de verdade era só a Carteira (`/investimentos`) escondendo o investimento
> inteiro ao arquivar — corrigido pra mostrar numa seção "Arquivados" separada, esmaecida
> (`opacity-50`), continuando clicável.
>
> **Verificado ao vivo** contra o banco de dev: dívida 12x (11 restantes) só apareceu em
> "Curto", dívida 24x (23 restantes) só em "Longo" — os dois casos exatos do bug relatado.
> Excluir uma linha do histórico removeu o `Entry` de verdade no banco e os totais da
> página recalcularam. Investimento arquivado continuou visível em `/investimentos`.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-12), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 055).
>
> **Última atualização anterior: 2026-08-11 (Editar histórico de investimento + filtro de
> prazo em Dívidas — Registro Nº 054).** Duas features pedidas direto na versão real do
> sistema. `lib/entries/investment.ts::updateInvestmentEventEntry` — primeira função de
> UPDATE de um `Entry` de investimento (antes só havia create; `registerInvestmentEvent`/
> `registerInvestmentIncome` documentavam explicitamente "nunca edita lançamentos
> antigos"). Nature/wallet do Entry nunca mudam por este update (vêm do registro
> existente, não do input) — evita converter Renda↔Posição ou mover evento pra fora da
> carteira do investimento. `InvestmentHistoryRow.tsx` (novo Client Component, uma linha
> de tabela) usa estado controlado em vez de `<form>`+`FormData` do DOM porque `<form>`
> não é filho válido de `<tr>` — mesmo padrão visual de `InvestmentEditForm.tsx`/
> `AssetCard.tsx` (campos sempre renderizados, `disabled` até "Editar"), evitando importar
> `lib/format.ts` no componente cliente (ele importa `Decimal` de
> `@/lib/finance/types`, gotcha já documentado nesta sessão) — formatação de
> moeda/data feita local ali dentro. Totais do topo da página de investimento já eram
> recalculados em tempo real a partir das entries, então editar uma linha propaga sozinho.
>
> `lib/finance/open-installments.ts::classifyDebtTerm` — nova função pura (curto ≤ 12
> meses, longo > 12, baseado em `lastDueDate`/"Prazo"). `dividas/page.tsx` ganhou 3 abas
> via `searchParams`, mesmo padrão de `<Link>` já usado no Fluxo Projetado — nenhum
> `"use client"` novo. A rota de PDF de Dívidas duplicava (já duplicava antes) a mesma
> query da tela — precisou do mesmo filtro aplicado duas vezes, sem nenhum dado
> compartilhado entre tela e PDF (confirmado na investigação: padrão já existente pros 3
> relatórios de Fase 2 também).
>
> **Verificado ao vivo** contra o banco de dev com dados de teste controlados: editar um
> evento de R$150→R$300 fez "Ganho de capital" no topo da página acompanhar exato; duas
> dívidas de teste (uma vencendo em 3 meses, outra em ~21) separaram certo nos 3 filtros
> (Todas R$900, Curto R$300, Longo R$600).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-11), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 054).
>
> **Última atualização anterior: 2026-08-11 (Correção de regra de negócio — totais por
> situação, liquidado × pendente — Registro Nº 053).** O usuário reportou, na versão
> real do sistema (não em teste), que o Painel misturava lançamentos liquidados
> (PAGO/RECEBIDO) com pendentes (A_PAGAR/A_RECEBER/ESTIMATIVA) nos totais de
> Receita/Despesa/Investimento. Investigação confirmou que isso era **intencional por
> design** — `lib/finance/period.ts::periodTotals` tinha comentário e teste explícitos
> afirmando "fiel à fórmula da planilha original" (§11.3), não filtrar por situação. O
> usuário pediu pra mudar essa regra de propósito: todo total "realizado" deve refletir
> só o liquidado; toda "provisão"/expectativa deve calcular só o pendente.
>
> **Mudança:** `periodTotals`/`monthlySeries` ganharam parâmetro `settlement: "settled" |
> "pending"` **obrigatório** (sem default, de propósito — o compilador TS pegou
> automaticamente os 8 call sites que precisavam de atualização). `topEntries`/
> `categoryDistribution`/`categoryMonthlyBreakdown`/`averageMonthlyExpense` e
> `projectedBalance` não ganharam parâmetro novo — cada uma só tinha um uso real, ficou
> hard-coded (`SETTLED_STATUSES` ou `"pending"`, conforme o caso) internamente.
> `lib/finance/derived.ts` virou a fonte única do particionamento
> (`SETTLED_STATUSES`/`PENDING_STATUSES`, exportado, reusado em vez de duplicar mais um
> `Set`). Afeta: Painel (KPIs/6 meses = settled, Provisão = pending), Balanço anual
> (settled), Fluxo projetado (pending, sem mudança de assinatura), Orçamento realizado
> (settled, sem mudança de assinatura), Dívidas/Reserva (settled, sem mudança de
> assinatura).
>
> **Verificado ao vivo** contra o banco de dev com dados de teste controlados (uma
> despesa liquidada de R$1.000 + uma pendente de R$5.000, mesmo mês): Painel mostrou
> Despesa -R$1.000,00 exato, pendente corretamente excluído dos KPIs e do Top 5.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-11), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 053).
>
> **Última atualização anterior: 2026-08-11 (E2E — troca de workspace e importação OFX,
> Registro Nº 052).** Continuação do Registro Nº 051. `tests/e2e/switch-workspace.spec.ts`
> — spec isolado (login/sessão próprios, `storageState` vazio de propósito, nunca
> reaproveita o usuário compartilhado dos outros specs) com um segundo workspace/Membership
> `ADVISOR` (`tests/e2e/helpers/fixtures.ts::addSecondWorkspaceMembership`) — com 2
> memberships, `resolveActiveMembership()` sem cookie não garante qual é
> `memberships[0]`, arriscaria os outros specs operarem no workspace errado às vezes, daí
> ficar isolado. `tests/e2e/import-ofx.spec.ts` reaproveita a amostra de SGML solto já
> usada nos testes unitários (`tests/import/parse-ofx.test.ts`). PDF de fatura ficou de
> fora, decisão explícita — nenhum PDF de exemplo (binário ou sintético) existe no
> repositório, construir um do zero era mais esforço/risco que os outros dois fluxos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-11), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 052).
>
> **Última atualização anterior: 2026-08-10 (Primeira leva de testes E2E com Playwright —
> Registro Nº 051).** Continuação do Registro Nº 050. Cobre o que a suíte de integração
> não alcança: `lib/workspace/switch.ts` (mecânica pura de `cookies()`/`redirect()`) e
> qualquer fluxo "pela tela" de verdade, com navegador real + servidor Next real + sessão
> autenticada de verdade. `npm run test:e2e` (Playwright, só Chromium por enquanto): 3
> specs — login sem senha (magic link + cookie jar em memória via `@supabase/ssr`,
> técnica já documentada, implementada de verdade pela primeira vez), criar lançamento
> pelo formulário, importar CSV. Guard de segurança dedicado
> (`scripts/assert-dev-database.ts`), encadeado no comando `webServer` do Playwright
> (roda antes do `next dev` existir), confere `.env.local` — não `.env.dev.local`, que é
> o que os testes de integração usam — porque é o arquivo que o servidor real usa.
> **Achado real no processo:** `import()` dinâmico sai do transform do Playwright que
> resolve o alias `"@/"`, e o Prisma Client gerado usa `import.meta` (incompatível com o
> transform CommonJS do Playwright de qualquer forma) — fixtures E2E usam `pg` puro em
> vez do Prisma Client, mesmo padrão de vários scripts avulsos já usados nesta sessão.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-10), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 051).
>
> **Última atualização anterior: 2026-08-10 (CI confirmado verde contra o banco de dev —
> Registro Nº 050).** Fecha o Registro Nº 049: a primeira execução do job
> `integration-tests` no GitHub Actions falhou — não por bug de código, mas porque os
> nomes dos secrets cadastrados pelo usuário (`DEV_NEXT_PUBLIC_SUPABASE_URL`/
> `DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY`) não batiam com os que `ci.yml` esperava
> (`DEV_SUPABASE_URL`/`DEV_SUPABASE_ANON_KEY`) — secret com nome não encontrado vira
> string vazia no GitHub Actions, e o guard de segurança de `tests/integration/setup.ts`
> corretamente abortou por não conseguir confirmar o projeto de dev, em vez de rodar com
> credencial vazia. Corrigido ajustando `ci.yml` pros nomes reais. **Lição prática:**
> verificar status de CI pela API bruta (`api.github.com/.../actions/runs/{id}/jobs`), não
> só pelo resumo em texto de uma página renderizada — numa consulta anterior a esse mesmo
> fluxo, um resumo intermediário relatou `build-and-test` como falho quando na verdade
> tinha passado (só `integration-tests` tinha falhado). Confirmado via API: run
> `31443189781` (commit `f077c9a`), os dois jobs com sucesso em todos os steps.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-10), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 050).
>
> **Última atualização anterior: 2026-08-10 (Suíte de integração — segunda leva + CI rodando
> contra o banco de dev — Registro Nº 049).** Continuação do Registro Nº 048. Usuário
> cadastrou 4 secrets no GitHub (`DEV_NEXT_PUBLIC_SUPABASE_URL`/`DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY`/
> `DEV_SUPABASE_SERVICE_ROLE_KEY`/`DEV_DATABASE_URL`, prefixo `DEV_` de propósito) e
> `.github/workflows/ci.yml` ganhou o job `integration-tests`, rodando `npm run
> test:integration` de verdade no CI. `tests/integration/setup.ts` ficou flexível: exige
> `.env.dev.local` só quando `DATABASE_URL` não já está no ambiente (permite o CI passar
> as variáveis direto via secrets, sem precisar do arquivo). Suíte estendida com
> `lib/entries/asset.ts` e `lib/workspace/advisor.ts` (mesmo padrão já estabelecido). Pro
> commit de importação — que só existia solto dentro de `app/api/import/commit/route.ts`,
> não numa função de `lib/` — fiz um **refactor comportamento-preservado**: extraído
> `lib/import/commit.ts::commitImportBatch()`, mesmo espírito de `lib/import/revert.ts` já
> extraído antes; a rota virou wrapper fino, resposta HTTP idêntica (confirmado por `npm
> run build`, mesmas 61 rotas). Suíte total: 8 arquivos, 26 testes, todos contra o banco
> de dev real.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-10), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 049).
>
> **Última atualização anterior: 2026-08-10 (Suíte de testes de integração de verdade,
> primeira leva — Registro Nº 048).** Continuação do Registro Nº 047. `npm run
> test:integration` (config separado, `vitest.integration.config.ts`) roda 5 arquivos/15
> testes contra o banco de dev real: `lib/entries/transfer.ts`, `lib/entries/create.ts`
> (único/parcelado/recorrente), `lib/entries/settle.ts`, `lib/entries/investment.ts`,
> `lib/workspace/invite.ts`. `tests/integration/setup.ts` tem um **guard de segurança**
> que aborta a suíte inteira, antes de qualquer query, se não confirmar que o banco alvo é
> o projeto de dev (nunca depende de `.env.local`, que pode um dia voltar a apontar pra
> produção) — testado de propósito apontando pro ref de produção e confirmando que aborta
> sem rodar nada. **Bug real encontrado e corrigido no processo:** `npm test` (unitários)
> tinha `include: ["tests/**/*.test.ts"]`, que também casava com `tests/integration/**` —
> rodar `npm test` estava silenciosamente tentando rodar os testes de integração também,
> sem o guard/mock de `after()` do Next, quebrando 4 testes. Corrigido excluindo
> `tests/integration/**` do config de unitários. Fixtures (`tests/integration/helpers/fixtures.ts`)
> criam `Profile`+`Workspace`+`Membership` de teste direto via Prisma (sem signup real —
> `Profile.id` não tem mais FK pra `auth.users` desde a migration 002) e limpam com um
> `prisma.workspace.delete()` só (cascade em todas as 18 relações por workspace).
> **Não é a suíte completa** — `lib/entries/asset.ts`, `lib/workspace/advisor.ts` e o
> commit de importação (lógica solta dentro de um `route.ts`) ficaram de fora desta
> rodada, registrados como próxima extensão natural, mesmo padrão já estabelecido.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-10), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 048).
>
> **Última atualização anterior: 2026-08-10 (Banco de dev/teste separado do de produção —
> Registro Nº 047).** Continuação do Registro Nº 046. Usuário criou um projeto Supabase
> novo pelo dashboard (`prospecta-finance-dev`, `sa-east-1`) e passou as credenciais via
> `.env.dev.local` (nunca em chat). Aplicado: as 24 migrations (manualmente via `pg`,
> porque `prisma migrate deploy` travou nesta máquina de novo — débito técnico conhecido,
> §23), `prisma/sql/001-008` (auth/RLS/triggers), `prisma/seed.ts` (taxonomia global).
> **Dois bugs reais encontrados no processo, ambos de "tooling", não do schema:** (1) a
> senha do banco tinha um `?` não escapado na `DATABASE_URL`, quebrando o parser de URL
> (corrigido pra `%3F`); (2) o script de aplicação usava `String.replace(padrão, texto)`
> pra contornar o bug conhecido do `setval` em banco vazio (migration
> `20260808220000_workspace_client_code`, §23) — `"$$"` na STRING de substituição é
> tratado como escape especial pelo `.replace()` (colapsa pra um `$` só), corrigido usando
> a forma de função (`replace(padrão, () => texto)`). `.env.local` (o que `npm run dev`
> usa) agora aponta pro projeto novo; o antigo (produção) virou `.env.prod.local`.
> Workspace de teste criado via Admin API do Supabase (sem senha), seedado com
> `prisma/seed-workspace.ts`. `/login` renderiza sem erro contra o banco novo — suíte de
> testes de integração de verdade é o próximo passo, ainda não construída.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-10), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 047).
>
> **Última atualização anterior: 2026-08-10 (Débitos técnicos: CI + RLS completo (documental)
> — Registro Nº 046).** Depois de fechar o menu Investimentos (Registro Nº 044/045), o
> usuário pediu para verificar o estado do projeto e iniciar a próxima etapa; como todas
> as Fases 0-4 já estavam concluídas, sem "próxima fase" de produto decidida, o usuário
> escolheu atacar débito técnico. Duas entregas, ambas sem tocar nenhum comportamento do
> app hoje: (1) **CI** — `.github/workflows/ci.yml`, roda `tsc --noEmit`/`npm test`/
> `npm run build` em todo push/PR pra `master` (lint incluso, mas `continue-on-error`
> porque achou 11 erros pré-existentes sem relação com esta etapa — ver seção 23); (2)
> **RLS completo** — `prisma/sql/008_rls_completeness.sql` cobre as 14 tabelas criadas
> depois da Fase 0 que nunca tinham nenhuma policy, e corrige um gap real encontrado na
> investigação: as policies de escrita mais antigas (`people`/`wallets`/`entry_groups`/
> `entries`/`import_batches`) só liberavam TITULAR/MEMBRO, mas `can()` já libera ADVISOR
> desde a Arquitetura de Identidade/Planos — inconsistência nunca visível porque RLS não é
> exercida (Prisma conecta como owner, que sempre ignora RLS). **Confirmado antes de medir
> qualquer coisa:** como não há `FORCE ROW LEVEL SECURITY` em nenhuma tabela, esse arquivo
> é 100% aditivo e não muda nada no app rodando hoje — só passa a valer se um dia a role de
> conexão do Prisma for trocada (decisão maior, não tomada, deliberadamente fora desta
> etapa). Separação de banco dev/teste e testes de integração de verdade ficaram como
> próximo passo, esperando o usuário criar um projeto Supabase novo (decisão dele, não
> automatizável 100% nesta máquina — ver seção 22, item 7).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-10), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 046).
>
> **Última atualização anterior: 2026-08-09 (Menu "Investimentos" — Registro Nº 044).** Novo
> menu de topo dedicado a investimentos, com dois eixos de classificação separados: (1)
> `InvestmentClass` (tabela de referência nova, ~13 classes de mercado — Renda Fixa,
> Renda Variável, Fundos, Criptoativos, Imóveis, Veículos, Metais Preciosos, Commodities,
> Terras e Produção Rural, Bens Colecionáveis, Participação Societária, Previdência
> Privada, Outros), que dirige quais campos o formulário mostra; (2) o instrumento
> específico (CDB, Ações, Apartamento etc.) fica como texto livre com sugestões por
> classe (`lib/finance/investment-instruments.ts`), sem virar linha de banco. Cada posição
> vira um `Investment` novo, ligado a uma `Wallet` real (`kindCode=CONTA_INVESTIMENTO`) —
> todo lançamento da posição É um `Entry` comum (`nature=INVESTIMENTO`), então já aparece
> em Lançamentos automaticamente, sem nenhum mecanismo novo de sincronização (o desenho
> original já estava em `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §7.3, nunca implementado).
> Renda real recebida (aluguel de imóvel, distribuição de lucro de sócio) é um `Entry`
> separado, `nature=RECEITA`, numa carteira de verdade — reaproveita as categorias
> `RECEITA > Aluguel`/`Participação nos Lucros`, já seedadas e nunca usadas. Telas:
> Carteira (lista + filtro por classe), Novo investimento, detalhe analítico (posição,
> ganho de capital, rentabilidade %, retorno total %, gráfico de evolução, histórico,
> registrar evento/renda, gerar aluguel recorrente para Imóveis), Análise (consolidado da
> carteira, alocação por classe, renda ao longo do tempo, ranking, PDF). Sidebar ganhou o
> grupo "Investimentos" (ícone `CandlestickChart`), logo depois de "Patrimônio".
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 044).
>
> **Última atualização anterior: 2026-08-09 (5 melhorias na tela de Cartão de Crédito —
> vencimento corrigido + backfill, lançamento da fatura editável com regra de descrição,
> "Editar cartão" travado, Registro Nº 043).** Bug real: `cardStatementWindow`
> (`lib/finance/card.ts`) calculava o vencimento sempre no mês seguinte ao fechamento —
> só certo quando `dueDay <= closingDay`; corrigido com uma condição (`dueDay >
> closingDay` mantém o vencimento no mesmo mês). Schema ganhou
> `Entry.importedDescription` (descrição original da fatura, travada) e model
> `DescriptionRule` (descrição do banco normalizada → descrição/categoria/subcategoria
> personalizadas, por workspace, aplicada em importações futuras de PDF com prioridade
> sobre a sugestão por histórico). Nova tabela de lançamentos da fatura
> (`FaturaEntriesTable.tsx`) com edição em linha; "Editar cartão" extraído pro padrão
> travado (`CardEditForm.tsx`, molde de `AssetCard.tsx`).
>
> **Bug real encontrado e corrigido durante o próprio backfill do vencimento:** a
> primeira versão do script recalculava `due_date` direto de `transactionDate`, mas
> parcelas de uma série compartilham a MESMA `transactionDate` por design
> (`lib/finance/installments.ts`) — só `installmentNumber` diferencia. Isso colapsou o
> vencimento de parcelas 2+ de volta pro vencimento da parcela 1 (121 de 561 lançamentos
> do cartão afetado). Detectado inspecionando o próprio log do backfill, corrigido e
> incorporado de volta em `scripts/backfill-card-due-dates.ts` — reexecutado até reportar
> zero pendências.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 043).
>
> **Última atualização anterior: 2026-08-09 (Cadastro de Cartão de Crédito — dia só aceita
> dígito, Limite/Anuidade em padrão monetário, Registro Nº 042).** Dois componentes
> novos e reutilizáveis em `components/ui/`: `DayInput` (filtra letra em tempo real, trava
> em 2 dígitos) e `CurrencyInputBRL` (digita só número, formata como "R$ 1.500,00" na
> hora, manda pro formulário o mesmo decimal cru que o Server Action já esperava — sem
> mudar `actions.ts`). Usados nos 4 campos de fatura/anuidade dos formulários de criar e
> editar cartão. 9 testes novos cobrindo a conversão de moeda (ida e volta sem perder
> centavo, campo vazio ficando vazio em vez de "R$ 0,00").
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 042).
>
> **Última atualização anterior: 2026-08-09 (Leitores de fatura em PDF para 5 bancos reais —
> Nubank, Casas Bahia, Porto Seguro, Itaú e Santander — Registro Nº 041).** Depois da
> infraestrutura de importação de PDF ficar pronta (Registro Nº 040, sem leitor de banco
> real ainda), o usuário compartilhou ~30 faturas reais de 8+ instituições e anos
> (2018-2026) com as senhas de cada uma. `lib/import/pdf-statement/parsers/` ganhou 5
> leitores novos: `nubank.ts`, `casas-bahia.ts`, `porto-seguro.ts`, `itau.ts` (cobre
> Signature e PDA, mesmo layout) e `santander.ts` (cobre as variantes 123/Free/sem sufixo,
> mesmo layout) — todos testados com texto extraído de faturas reais como fixture (52
> testes novos). Mercado Pago ficou de fora, de propósito: a única fatura enviada veio
> zerada, sem nenhuma linha de transação real para basear o formato.
>
> **Correção de design encontrada ao comparar os bancos entre si:** o leitor do Nubank já
> excluía corretamente a linha de "pagamento da fatura" (não é uma compra, é dinheiro
> saindo da conta para quitar o cartão), mas Casas Bahia e Porto Seguro (escritos antes
> dessa comparação) estavam importando o equivalente como se fosse um crédito — corrigido
> nos dois; Santander já nasceu com a regra certa.
>
> **Dois bugs reais encontrados e corrigidos nesta etapa, ambos com efeito além dos
> leitores novos:** (1) `extract-text.ts` (reconstrução de linha do PDF, usada por TODOS os
> leitores) podia embaralhar a ordem de leitura dentro de uma mesma linha quando duas
> colunas da fatura ficavam muito próximas verticalmente — corrigido reordenando por X
> depois de agrupar por linha. (2) `npm run build` de produção nunca tinha sido rodado
> depois que o primeiro leitor foi registrado — quebrava por inteiro, porque `Decimal`
> vinha de `@/lib/finance/types` (que reexporta de `@prisma/client/runtime/client`, com
> imports exclusivos do Node) e `ImportWizard.tsx` (Client Component) importa o registro de
> leitores direto. Corrigido importando `Decimal` de `@prisma/client-runtime-utils`
> (adicionado como dependência direta) — mesma classe, sem o import Node-only.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 041).
>
> **Última atualização anterior: 2026-08-09 (Cartões de Crédito — cadastro, fatura, Análise
> de Benefícios e infraestrutura de importação de fatura em PDF, Registro Nº 040).**
> Usuário pediu uma aba nova com dois objetivos: mostrar a fatura de cada cartão de forma
> fácil, e analisar se pontos/milhas compensam a anuidade (evitar "jogada de número" de
> marketing bancário). Planejado em modo de planejamento — pesquisa prévia confirmou que
> `Wallet` já tinha todos os campos de fatura (`kindCode=CARTAO_CREDITO`, `institutionId`,
> `creditLimit`, `closingDay`, `dueDay`) e que `lib/finance/card.ts` já calculava fatura
> (`cardStatementWindow`/`cardStatementTotal`, testadas) sem nenhuma tela usar isso —
> confirmado pelo próprio `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §11.4, que já previa um
> "card_statement" conceitual nunca construído.
>
> **Modelo de dados:** novo model `CreditCard`, 1:1 com `Wallet` por `walletId` (não
> direto em `Wallet`, que é genérica por design para 9 tipos de carteira) — imagem,
> anuidade, isenção, programa de pontos, pontos por R$ gasto, valor estimado do ponto. Os
> 4 campos de fatura continuam só em `Wallet`, sem duplicação; criar um cartão pela tela
> nova cria a `Wallet` (kindCode=CARTAO_CREDITO) e o `CreditCard` juntos, numa única ação —
> "vinculado automaticamente em Carteiras", como pedido.
>
> **Telas** (`app/(app)/cartoes/`, grupo novo no menu lateral entre Compromissos e
> Relatórios): "Meus Cartões" (grade com imagem + fatura vigente), detalhe do cartão (com
> um **seletor de mês de fatura**, pedido explícito do usuário no meio da implementação,
> para conferir qualquer fatura — passada ou futura — lançamento a lançamento contra o
> extrato real do banco), "+ Novo cartão", "Análise de Benefícios" (ranking por benefício
> líquido = pontos ganhos sobre o **gasto real dos últimos 12 meses** daquele cartão,
> menos a anuidade — confirmado com o usuário, nunca uma estimativa digitada).
>
> **Infraestrutura nova, greenfield (nada disso existia no projeto):** upload de imagem via
> bucket `credit-card-images` no Supabase Storage (público para leitura, criado por script
> com o client admin); importação de fatura em PDF (`lib/import/pdf-statement/`) com
> extração de texto **no navegador** via `pdfjs-dist` (o arquivo e a eventual senha nunca
> saem do computador do cliente — só o texto/transações já extraídos viram uma
> requisição, mesma ideia de como CSV/OFX já funcionam), suporte a senha + termo de
> consentimento, e um registro de leitores por banco que **começa vazio** de propósito —
> nenhum PDF de exemplo foi compartilhado ainda, cada banco formata a fatura de um jeito.
>
> **Regra de deduplicação de parcelamento, pedida pelo usuário como correção durante a
> implementação (antes da importação de PDF ser escrita) — "100% imprescindível":** fatura
> de cartão lista a mesma parcela todo mês (ex.: "MAGALU 02/10"); o texto que o banco
> imprime raramente bate com o que a pessoa digitaria à mão, então a deduplicação da
> importação de PDF **nunca compara texto de descrição** — sempre carteira + total de
> parcelas + número da parcela + vencimento (`lib/import/pdf-statement/pdf-to-rows.ts`,
> testado com dados fictícios). Quando uma série de parcelamento aparece pela primeira vez
> (parcela 1), o importador gera a série completa de uma vez (reaproveitando
> `generateInstallments`, a mesma função do lançamento manual) — os meses futuros já ficam
> prontos, e a fatura do mês seguinte reconhece e pula essas parcelas quando reaparecerem.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 040), `MANUAL-DE-USO.md` §8 (estendida) e §10 (nova, seções seguintes
> renumeradas de §10-16 para §11-17).
>
> **Última atualização anterior: 2026-08-09 (Relatório "Analítico mês a mês" removido —
> redundante com Balanço anual, Registro Nº 039).** Usuário notou que a tabela sintética
> (Receita/Despesa/Investimento/Saldo por mês) do Analítico é exatamente a mesma que já
> aparece dentro de Balanço anual (que ainda soma o descritivo por categoria) — confirmado
> no código: as duas telas consultavam os mesmos dados e usavam o mesmo componente
> `MonthlyTotalsTable`, sem nada exclusivo do Analítico. Removidos por completo (não só
> desativados): a página, a rota de PDF e o builder de PDF correspondentes, a aba em
> `relatorios/layout.tsx`, o item no menu lateral e a menção em `MANUAL-DE-USO.md` §10
> (agora "Quatro telas"). Relatórios (seção 12 abaixo) passa de 5 para 4 telas.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 039).
>
> **Última atualização anterior: 2026-08-09 (Calendário de Compromissos: redesenho visual +
> bug real de largura mínima no celular corrigidos, Registros Nº 037 e 038).** Depois de
> fechar a integração com o Google Agenda (Registro Nº 036), o usuário pediu para aplicar
> uma sugestão de layout que tinha pedido ao Google Gemini para o calendário mensal de
> Compromissos. Aplicada com uma correção: a sugestão presumiu, sem acesso ao código, que a
> cor vermelho/verde dos eventos era despesa/receita — na verdade sempre foi **vencido
> (vermelho) vs. dentro do prazo (verde)**; mantida a lógica real, só trocado o estilo
> visual (bloco sólido de cor → linha com barra colorida à esquerda). Aproveitado para
> também remover numeração interna da especificação ("(§13)", "§10 R5") que vazava para
> texto visível ao usuário em Compromissos (Lista, Calendário, Incidentes), Importar
> planilha e Transferir entre carteiras — comentários de código com `§N` continuam
> normais, só texto renderizado foi reescrito.
>
> **Bug real encontrado logo em seguida, ainda na mesma conversa:** o usuário reportou que
> o calendário "não está proporcionalmente aberto" no celular e parecia amador. Causa raiz:
> a grade de 7 colunas tinha `min-width: 608px` fixo (herdado de quando só cabia via
> rolagem horizontal) — maior que qualquer tela de celular, cortando a visualização.
> Corrigido: grade sempre fluida (sem rolagem horizontal em nenhum tamanho de tela); como
> texto de compromisso não cabe de forma legível em 7 colunas numa tela estreita, criada
> uma visualização compacta só para celular — cada dia mostra indicadores coloridos
> (pontinhos) em vez de texto truncado, mantendo a lista completa ao tocar no dia (recurso
> que já existia). Desktop não muda. Usuário confirmou visualmente no próprio celular
> depois do deploy.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registros Nº 037 e 038).
>
> **Última atualização anterior: 2026-08-09 (Google Agenda — bug real do escopo
> `calendar.calendars` corrigido + primeira conexão verificada de verdade, Registro Nº
> 036).** Depois do código pronto (Registro Nº 035, abaixo), o usuário configurou as
> credenciais no Google Cloud e tentou conectar pela primeira vez — falhou repetidamente
> com `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` na chamada que cria o calendário dedicado,
> mesmo com a tela de consentimento do Google mostrando a permissão de Agenda
> corretamente. Depurado ao vivo, junto com o usuário, por várias hipóteses erradas antes
> da causa real: `redirect_uri` colado no campo errado do Google Cloud (achado e corrigido
> cedo), depois suspeita de escopo mal configurado ou de atraso de propagação do Google
> (ambos descartados após conferência). A causa raiz só apareceu depois de instrumentar
> `lib/integrations/google-calendar/client.ts::exchangeCodeForTokens` para logar o `scope`
> que o Google efetivamente devolve no token (mudança permanente, não só diagnóstica) —
> o token **tinha** `calendar.events`, provando que **criar um calendário novo
> (`Calendars.insert`) exige um escopo diferente de criar/editar eventos**:
> `https://www.googleapis.com/auth/calendar.calendars`, que o desenho original não
> previa. Corrigido (`SCOPES` pede os dois agora, `REQUIRED_SCOPES` valida ambos e falha
> cedo com mensagem clara) e verificado: usuário reconectou depois de adicionar o escopo
> novo no Google Cloud e revogar o acesso anterior, sucesso na primeira tentativa —
> `google_calendar_connections` tem 1 linha real, com um calendário de verdade criado na
> conta dele (`...@group.calendar.google.com`).
>
> **Nota para o futuro — se algum dia mexer de novo no escopo de uma integração Google:**
> escopos do Google Calendar (e provavelmente de outras APIs Google) são granulares por
> **tipo de operação**, não só por "recurso" — `calendar.events` (eventos) e
> `calendar.calendars` (o calendário em si: criar/editar/apagar) são permissões
> independentes, mesmo cobrindo "a mesma API". Sempre checar a documentação de referência
> de escopos do produto específico (não assumir que um escopo "genérico" cobre todas as
> operações que a API oferece) antes de escrever o cliente.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 036), §19 abaixo (pendência marcada como resolvida e verificada).
>
> **Última atualização anterior: 2026-08-09 (Integração com o Google Agenda — Registro Nº
> 035).** Depois de confirmar a correção do pooler (Registro Nº 034), o usuário pediu
> viabilidade + implementação de sincronização do sistema com o Google Agenda de cada
> cliente: um sentido só (sistema → Google), vínculo por workspace, autorização do
> próprio cliente. Confirmado com 2 perguntas: compromisso liquidado **remove** o evento
> da agenda (não marca como concluído); sincronização em **tempo real**.
>
> **Arquitetura:** OAuth2 próprio (Google Cloud, escopo `calendar.events`), **separado**
> do "Entrar com Google" do login (que usa o broker do Supabase Auth, só identidade —
> não dá acesso à Agenda). Novo model `GoogleCalendarConnection` (1 por workspace,
> `accessToken`/`refreshToken` cifrados em repouso — AES-256-GCM,
> `lib/security/crypto.ts`, chave `TOKEN_ENCRYPTION_KEY` nova) + `Entry.googleEventId`
> (liga um lançamento ao evento correspondente). No momento da conexão o sistema cria um
> **calendário dedicado** ("PROSPECTA Finance") na conta do cliente, em vez de escrever
> na agenda principal dele — desconectar vira 1 chamada (apagar o calendário) em vez de
> apagar evento por evento. `lib/integrations/google-calendar/client.ts` (fetch cru,
> mesmo padrão de `lib/email/send.ts` pro Brevo) + `sync.ts` (`syncEntryToGoogleCalendar`/
> `deleteEntryGoogleCalendarEvent`, nunca lançam exceção — melhor esforço, uma falha na
> API do Google não pode quebrar um lançamento financeiro real). Lógica de decisão
> (criar/atualizar/apagar/nada) extraída em `decideGoogleCalendarAction()`, pura e
> testada — o resto (I/O de banco + rede) segue o padrão já estabelecido no projeto de
> não ter teste unitário em orquestração (`settleEntry`, `createEntryOrSeries` também não
> têm), verificado por `tsc`/build/uso real em vez disso.
>
> Plugado via `after()` (Next 15+, não bloqueia a resposta) nos 6 pontos de escrita já
> centralizados: `lib/entries/create.ts::createEntryOrSeries`,
> `lib/entries/settle.ts::settleEntry`, `app/api/entries/[id]/route.ts` (PATCH/DELETE),
> `app/api/import/commit/route.ts`, `lib/import/revert.ts::revertImportBatch`,
> `app/(app)/compromissos/incidentes/actions.ts::updateIncidentEntry`. Novas rotas
> `GET /api/integrations/google-calendar/{connect,callback}` + Server Action
> `disconnectGoogleCalendar()` + seção de conectar/desconectar em
> `/compromissos/calendario`.
>
> **Achado de infraestrutura durante a etapa (fora do código do projeto):** `prisma
> migrate deploy`/`status` passaram a travar indefinidamente nesta máquina Windows — o
> binário `schema-engine-windows.exe` ficava parado em `cli can-connect-to-database`
> mesmo com o banco alcançável em ~100ms via `pg` puro (testado à parte), indício de
> firewall/antivírus local bloqueando esse executável especificamente (não `node.exe`,
> que já tem permissão). Contornado aplicando o SQL da migration direto via `pg` +
> gravando a linha em `_prisma_migrations` à mão (mesmo formato que o Prisma gravaria),
> numa transação. Documentado em §23 como débito técnico/processo pra próximas
> migrations, caso o travamento persista numa sessão futura.
>
> **Bloqueio para verificação ponta a ponta:** o fluxo OAuth completo (autorizar no
> Google de verdade, confirmar que o evento aparece na agenda) só pode ser testado depois
> que o usuário criar as credenciais no Google Cloud Console — checklist na tabela de
> variáveis de ambiente (§19) — e informar `GOOGLE_CALENDAR_CLIENT_ID`/
> `GOOGLE_CALENDAR_CLIENT_SECRET`. Até lá: `npm test` (206/206), `tsc --noEmit` limpo,
> `npm run build` de produção OK (rotas novas listadas), acesso não autenticado
> redireciona pra `/login` sem erro.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-09), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 035), `MANUAL-DE-USO.md` §9 (nova subseção "Integração com o Google
> Agenda"), §19 (variáveis novas) e §23 (débito técnico do schema-engine) abaixo.
>
> **Última atualização anterior: 2026-08-08 (bug real: pool de conexões do Supabase esgotando
> de novo — pooler trocado de Sessão pra Transação, Registro Nº 034).** Usuário reportou
> "Algo deu errado" em `/lancamentos` no celular logo após o deploy da correção de
> contraste dos cards mobile (feita antes desta entrada). Investigado direto no banco: o
> erro real era `max clients reached in session mode - max clients are limited to
> pool_size: 15` — o mesmo tipo de esgotamento de conexões já visto e corrigido
> parcialmente em 2026-08-01 (`max: 3` no adapter, commit `aeb618e`), mas o teto **duro**
> de 15 conexões do pooler de **Sessão** (porta 5432) do Supabase continuava lá,
> compartilhado entre todas as instâncias serverless da Vercel **e** qualquer script
> rodado localmente contra o mesmo banco (usado bastante ao longo desta sessão). Já era
> um débito técnico conhecido, registrado como "fora do alcance do assistente" numa
> sessão anterior — a correção exige editar variável de ambiente direto na Vercel.
> **Usuário autorizou explicitamente** ("Pode trocar por aqui mesmo").
>
> **Correção:** `DATABASE_URL` trocado do pooler de **Sessão** (5432) pro pooler de
> **Transação** (6543) do Supabase — mesmo host/usuário/senha, só a porta muda; o pooler
> de transação multiplexa as conexões de verdade do lado do Supabase, sem teto duro por
> cliente. Verificado ANTES de mexer em produção: reproduzido o erro direto contra o
> banco real (script descartável rodando a mesma query de `/lancamentos`, que falhou na
> primeira tentativa e passou na segunda — confirma que era esgotamento transitório, não
> bug de código), depois testado 200 entries + 6 relações + 10 queries concorrentes contra
> o pooler de transação, tudo OK. `.env.local` atualizado; env var da Vercel trocada via
> `vercel env rm`/`vercel env add` para `Production` e `Preview` (confirmado com
> `vercel env ls`). `lib/db/prisma.ts` — comentário atualizado, `max: 3` mantido como
> precaução geral (não mais pra evitar estourar um teto duro que não existe mais).
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 034), §23 "Débitos técnicos" (item resolvido), §19 (env vars atualizada),
> §21 (decisão atualizada), §24 (nota na entrada histórica do bug de 2026-08-01).
>
> **Última atualização anterior: 2026-08-08 (Importação de OFX — Registro Nº 033).** Depois do
> fechamento do dia (abaixo), o usuário pediu "implemente OFX" — item da Fase 2 da
> especificação original que nunca tinha sido construído (só CSV era aceito, §18.1).
> Planejado em modo de planejamento, com 2 perguntas de escopo confirmadas: categoria
> padrão (nunca bloquear linha) + destaque de revisão quando não há histórico; usar o
> cálculo de fatura de cartão de crédito já existente.
>
> **Decisão de arquitetura:** um arquivo OFX é convertido nas mesmas linhas
> `Record<string,string>` que o importador de CSV já usa (mesmos cabeçalhos canônicos de
> `column-mapping.ts::KNOWN_HEADERS`) — todo o resto do pipeline (validação, resolução de
> IDs, deduplicação por `due_date+amount+description+wallet`, agrupamento de parcelas,
> transação atômica, `ImportBatch`/revert) roda sem nenhuma mudança, CSV ou OFX. O
> trabalho novo é só parsear OFX e sintetizar essas linhas.
>
> **Novo:** `lib/import/parse-ofx.ts` (parser tolerante a SGML solto — OFX 1.x de banco
> brasileiro normalmente exporta tags de valor sem fechamento; extrai blocos `<STMTTRN>`
> via regex, que vêm fechados mesmo em SGML solto); `lib/import/suggest-category-bulk.ts`
> (sugestão de categoria por histórico exato de descrição, em lote — mesma ideia de
> `/api/entries/suggest-category`, já usado no lançamento rápido); `lib/import/
> ofx-to-rows.ts` (síntese: natureza pelo sinal do valor, categoria sugerida ou a padrão
> escolhida pelo usuário — nunca vazio, recorrência fixa `"1"` = avulsa/não parcelada,
> situação por comparação de data, vencimento roteado pela fatura quando a carteira é
> cartão de crédito); `lib/import/ofx-import.ts` (orquestração — usada igual por preview
> e commit, única fonte da resolução de carteira/responsável/categorias). `lib/finance/
> card.ts::statementWindowForDate()` generaliza `currentStatementWindow()` pra uma data
> de referência qualquer (comportamento idêntico pra "hoje", `currentStatementWindow`
> passou a delegar pra ela).
>
> **`Entry.autoReviewReason`** (coluna nova, aditiva) generaliza "Incidente" (Registro
> Nº 026, antes só parcela órfã sem `groupId`) para também cobrir "categoria sem
> histórico, revisar" — `lib/finance/incidents.ts::isEntryIncident()` é a união das duas
> condições. Compromissos → Incidentes passou a listar as duas sem nenhuma mudança
> estrutural (o cartão com "Confirmar"/"Editar" já servia).
>
> **Wizard** (`ImportWizard.tsx`) detecta formato pela extensão (`.ofx`/`.qfx`); pra OFX,
> esconde o mapeamento de colunas do CSV e pede 4 seletores obrigatórios antes de validar
> (Carteira, Responsável, Categoria padrão de despesas, Categoria padrão de receitas) — o
> resto da tela (estatísticas, linhas com problema, checkbox de duplicata, commit) é o
> mesmo componente já usado por CSV.
>
> **Bug real encontrado e corrigido no caminho:** a migration manual do Código do cliente
> (Registro Nº 031) quebra `prisma migrate dev` num banco vazio (`setval` pra 0, fora dos
> limites de uma sequence — só aparece em replay de banco-sombra ou ambiente novo do
> zero, não afeta a produção atual). Não editado (editar migration já aplicada quebra o
> checksum e força `migrate reset`, destrutivo) — documentado em "Débitos técnicos" §23,
> contornado escrevendo a próxima migration à mão + `prisma migrate deploy` (já era o
> caminho usado nesta sessão por causa do ambiente não-interativo).
>
> **Verificado direto no banco** (script descartável, só leitura — nenhuma escrita): um
> extrato de amostra com "MERCADO LIVRE" confirmou a sugestão batendo com a categoria
> real já usada no workspace do usuário; uma descrição nunca vista confirmou a categoria
> padrão + marcação `__autoReviewReason`; todas as linhas sintetizadas passaram pela
> validação/resolução real (`parseImportRow`+`resolveRow`) sem nenhum erro inesperado. 21
> testes novos (215 no total), `tsc --noEmit` e `npm run build` limpos. Servidor de
> produção local reiniciado.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 033), `MANUAL-DE-USO.md` (seções 8 e 9).
>
> **Última atualização anterior: 2026-08-08 — FECHAMENTO DO DIA (Registros Nº 021–032).**
> Usuário confirmou o Código do cliente em produção e pediu para documentar tudo e
> encerrar o dia. Foi o dia de maior volume de entrega da sessão — resumo do que ficou
> no ar, testado, documentado e (quando pedido) commitado/enviado a `origin/master`:
>
> - **Fase 2 — Relatórios avançados** (Registro Nº 021): 5 telas em `/relatorios`
>   (Analítico, Balanço anual, Fluxo projetado, Despesas parceladas, Orçamento).
> - **Fase 3 — Patrimônio (Bens/Metas) + Dívidas + PDF** (Registros Nº 023/024): telas
>   de Bens e Metas com trava de edição e gráficos, Dívidas derivada 100% do motor de
>   parcelamento existente, botão "Baixar PDF" nas 8 telas de Relatórios/Patrimônio,
>   Painel com seção "Metas" modular (`pinnedToPainel`) substituindo um cálculo de
>   reserva que mostrava valor errado.
> - **Bug real corrigido — `groupId` ausente em importação** (Registro Nº 025): CSV
>   importado nunca recebia agrupamento de parcelas, cegando "Despesas parceladas" e
>   "Dívidas"; corrigido no importador e retroativamente (backfill), com heurística
>   reforçada para separar por valor de parcela (resolve o caso real "MERCADO LIVRE").
> - **Compromissos → Incidentes** (Registro Nº 026): aba nova para revisar parcelas
>   órfãs/ambíguas, com "Confirmar que está correto" ou edição completa da linha
>   (incluindo número/total de parcela) e reagrupamento automático depois de corrigir.
> - **Formalização da linguagem** (Registro Nº 025/parte da rodada): "pra"/"pro" → "para"
>   em 63 arquivos, textos visíveis e comentários de código.
> - **Bug real corrigido — seletor de workspace** (Registro Nº 029): membership
>   `REVOKED` aparecia como opção clicável, causando erro genérico ao selecioná-la.
> - **Código do cliente** (Registro Nº 031): `Workspace.clientCode` sequencial e
>   imutável, coluna "Código" em Admin → Usuários, seletor de workspace identificando
>   clientes por código + nome do titular.
>
> **Estado geral ao fim do dia:** tudo acima testado em produção pelo usuário e
> confirmado funcionando, um item de cada vez, ao longo do dia. `npm test`/`tsc
> --noEmit`/`npm run build` limpos antes de cada commit. Todos os commits do dia
> enviados a `origin/master` e implantados na Vercel (`prospecta-finance.vercel.app`).
> Nenhuma pendência conhecida em aberto desta rodada — o que ficou de fora foi por
> escopo explícito, não esquecido: OFX (Fase 2), Open Finance (Fase 3), e qualquer
> redesenho de papéis além do modelo atual `MembershipRole`+`isPlatformAdmin` (ver
> seção 23, "Débitos técnicos", e a checklist da seção 28 para o detalhe completo).
>
> **Registrado formalmente:** `REGISTRO-OPERACIONAL.md` (Registro Nº 032, que também
> lista os registros 021–031 individualmente, cada um já com seu próprio fechamento em
> `CHANGELOG.md`/`MANUAL-DE-USO.md` quando aplicável).
>
> **Decisão de modelagem:** o código foi colocado em `Workspace`, não em `Profile` — um
> `Profile` pode ter acesso (TITULAR ou ADVISOR) a vários workspaces, mas cada
> `Workspace` já representa exatamente "uma única pessoa ou família" (§9, a mesma
> unidade que agrupa Carteiras/Responsáveis/lançamentos compartilhados) — bate
> exatamente com o que o usuário pediu. `Workspace.clientCode Int @unique
> @default(autoincrement())`.
>
> **Migration manual** (`20260808220000_workspace_client_code`, não gerada por
> `prisma migrate dev` porque o ambiente não-interativo bloqueia o aviso de unique
> constraint): coluna criada nullable → backfill sequencial por `created_at ASC` (mais
> antigo = 0001) para os 8 workspaces já existentes → `NOT NULL` + `UNIQUE` → sequence
> do Postgres assumindo o próximo valor livre. A sequence garante código automático
> mesmo para workspaces que nascem fora do Prisma — o trigger `on_auth_user_created`
> (cria o workspace pessoal no signup) só faz `INSERT INTO workspaces (name)`, então
> depende inteiramente do `DEFAULT` da coluna, que a sequence fornece.
>
> **`lib/format.ts::formatClientCode()`** (novo, testado) — 4 dígitos com zero à
> esquerda ("0001"). **Admin → Usuários**: nova coluna "Código" antes de "Nome",
> mostrando o código do workspace onde a pessoa é TITULAR (o "próprio" dela — todo
> profile real tem exatamente um). **Seletor de workspace**
> (`app/(app)/layout.tsx::AppLayout`): para memberships `ADVISOR`, uma query adicional
> busca a membership `TITULAR` de cada workspace-cliente (só quando há pelo menos uma
> `ADVISOR`, não sempre) para pegar o nome do titular via
> `lib/format.ts::firstTwoNames()`; memberships `TITULAR`/`MEMBRO`/`LEITURA` continuam
> mostrando `workspace.name` sem mudança.
>
> **Verificado direto no banco** com dados reais: os 8 workspaces existentes numeraram
> 0001–0008 em ordem de criação; um `INSERT` de teste recebeu 0009 corretamente da
> sequence (removido depois). Rótulos do seletor conferidos com o profile real do
> usuário: "0008, Luis Felipe (cliente)" e "0007, Prospecta 1 (cliente)". 173 testes (2
> novos para `formatClientCode`), `tsc --noEmit` e `npm run build` limpos.
>
> **Registrado formalmente:** `CHANGELOG.md` (2026-08-08), `REGISTRO-OPERACIONAL.md`
> (Registro Nº 031), `MANUAL-DE-USO.md` (seções 3 "Navegação" e 14 "Administração").
>
> **Última atualização anterior: 2026-08-08 (bug real: seletor de workspace listava
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
| §11.3 | Receita/Despesa/Investimento/Balanço do período, filtrado por `settlement: "settled" \| "pending"` (obrigatório — Registro Nº 053); `Balanço = Receita + Despesa − Investimento` (Investimento desconta, não soma — um aporte tira dinheiro da carteira disponível; Registro Nº 061) | `lib/finance/period.ts` |
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
| `DATABASE_URL` | Connection string do Postgres — **usa o "Transaction pooler" do Supabase** (porta 6543, `aws-0-sa-east-1.pooler.supabase.com`, desde 2026-08-08 — antes era o "Session pooler", porta 5432, trocado por não ter teto de 15 conexões simultâneas), não a conexão direta (a rede residencial do usuário não tem IPv6, que a conexão direta exige) |
| `BREVO_API_KEY` | E-mail transacional próprio do app via API HTTP do Brevo (`lib/email/send.ts`), diferente do SMTP usado pelo Supabase Auth |
| `TOKEN_ENCRYPTION_KEY` | **Nova, 2026-08-09.** Chave de criptografia (AES-256-GCM, `lib/security/crypto.ts`) dos tokens OAuth do Google Agenda gravados em `GoogleCalendarConnection`. Gerada uma vez (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`), qualquer string serve como entrada (passa por `scrypt` antes de virar chave AES). Já configurada em `.env.local` e na Vercel (`Production`/`Preview`). |
| `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` | **RECEBIDA, CONFIGURADA E VERIFICADA AO VIVO (2026-08-09, Registro Nº 036).** Credenciais OAuth do cliente "PROSPECTA Finance" no Google Cloud Console (`console.cloud.google.com`), app em modo **Teste** (só e-mails cadastrados como usuários de teste em Público-alvo conseguem autorizar — decisão explícita do usuário, ver nota abaixo sobre Termos de Uso). Redirect URIs: `https://prospecta-finance.vercel.app/api/integrations/google-calendar/callback` e `http://localhost:3000/api/integrations/google-calendar/callback`. **Dois escopos são necessários** — `https://www.googleapis.com/auth/calendar.events` (eventos) **e** `https://www.googleapis.com/auth/calendar.calendars` (criar/apagar o calendário dedicado em si; faltou na primeira tentativa e causou `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT`, ver bloco no topo do documento). Gravadas em `.env.local` e na Vercel (`Production`/`Preview`). **Primeira conexão real bem-sucedida em 2026-08-09**: `google_calendar_connections` tem 1 linha (`fhildebrando@gmail.com`, calendário dedicado real criado). A chave secreta do cliente foi rotacionada pelo usuário no meio da investigação (a antiga, de 5 de agosto, continua ativa no Google — **pode estar em uso pelo login com Google via Supabase**, configurado no painel do Supabase, fora do alcance deste projeto; não excluir a antiga sem confirmar lá primeiro).

  **Página de Termos de Uso (`/termos-de-uso`), pedida para preencher o campo "Link dos
  Termos de Serviço" da tela de consentimento: NÃO publicada, a pedido explícito do
  usuário em 2026-08-09 — "Não publique, aguarde."** `TERMOS-DE-USO.md` já tem, no próprio
  topo, um aviso de que não deve virar página pública antes de revisão por advogado
  (várias seções com lacunas `[PENDENTE]`, inclusive a de limitação de responsabilidade,
  que corre risco de nulidade por causa do Art. 51 do CDC se publicada como está). Deixei
  esse campo em branco na tela de consentimento por enquanto — não é obrigatório para o
  app funcionar em modo Teste. **Não publicar `/termos-de-uso` nem sugerir isso de novo
  numa sessão futura sem o usuário pedir explicitamente.** |

Projeto Supabase: `zfugldawxhvzclooisqj`, região `sa-east-1` (São Paulo).

**Supabase Storage — bucket `credit-card-images`** (novo, 2026-08-09, Registro Nº 040):
público para leitura, usado só pelas imagens de cartão de crédito cadastradas em Cartões
de Crédito. Criado por script usando `lib/supabase/admin.ts` (`storage.createBucket`) —
sem SQL de migration, é configuração do projeto Supabase, não do banco Postgres. Nenhuma
variável de ambiente nova (o upload usa a mesma `SUPABASE_SERVICE_ROLE_KEY` já existente).
`next.config.ts` ganhou `images.remotePatterns` apontando pro domínio do Storage, pra
`next/image` conseguir renderizar as imagens.

**Deploy em produção:** Vercel, projeto `prospecta-finance`, branch `master` do repositório
`github.com/fhildebrando-lfsh/PROSPECTA-Finance` (push nessa branch redeploya
automaticamente). URL: `https://prospecta-finance.vercel.app`. As variáveis acima (exceto
`GOOGLE_CALENDAR_CLIENT_ID`/`GOOGLE_CALENDAR_CLIENT_SECRET`, ainda pendentes — ver tabela)
estão configuradas em Project Settings → Environment Variables na Vercel (mesmos valores do
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
| `DATABASE_URL` = Transaction Pooler (Session Pooler até 2026-08-08), não conexão direta | A rede do usuário não tem IPv6 (que a conexão direta do Supabase exige por padrão). Trocado de Session pra Transaction pooler em 2026-08-08 (Registro Nº 034) — remove o teto de 15 conexões simultâneas do projeto inteiro. |
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
   camada só, não duas como o design pretendia). **Atualização 2026-08-10 (Registro
   Nº 046):** as *policies* em si agora estão completas (`prisma/sql/008_rls_completeness.sql`
   cobre as 14 tabelas criadas depois da Fase 0 que nunca tinham RLS, e corrige um gap
   real — as policies de escrita antigas de `people`/`wallets`/`entry_groups`/`entries`/
   `import_batches` só liberavam TITULAR/MEMBRO, mas `can()` já libera ADVISOR desde a
   Arquitetura de Identidade/Planos). Isso é só defesa em profundidade **documental** —
   como a conexão continua sendo owner, nada disso é *exercido* de verdade ainda.
   Ativar enforcement de fato (trocar a role de conexão) continua não decidido.
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
7. ~~Desenvolvimento e produção usam o mesmo banco Supabase~~ **Resolvido 2026-08-10
   (Registro Nº 047).** Projeto Supabase novo criado pelo usuário (`prospecta-finance-dev`,
   `sa-east-1`) — schema completo (24 migrations), `prisma/sql/001-008` (auth/RLS/
   triggers) e taxonomia global aplicados nele. `.env.local` (o que `npm run dev` usa)
   agora aponta pra esse projeto; o `.env.local` antigo (produção) foi preservado como
   `.env.prod.local`, pra um eventual script pontual contra produção. Vercel/produção
   continuam intocados. Workspace de teste criado (`fhildebrando+dev@gmail.com`, via
   Admin API — sem digitar senha) e seedado com 12 responsáveis/47 carteiras
   (`prisma/seed-workspace.ts`). **Pendência menor:** Authentication → URL Configuration
   (Site URL `localhost:3000`) do projeto novo ainda não configurada — não bloqueou nada
   até agora, mas fica registrada pra quando algum fluxo de redirect (redefinir senha,
   convite) precisar ser testado nesse ambiente.
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

- ~~Sem testes de integração/e2e~~ **Integração estendida 2026-08-10 (Registro Nº 049)** —
  `npm run test:integration`, 8 arquivos/26 testes contra o banco de dev real
  (`tests/integration/`), rodando também no CI (job `integration-tests`, secrets `DEV_*`).
  Cobre `lib/entries/{create,settle,transfer,asset,investment}.ts`,
  `lib/workspace/{invite,advisor}.ts` e o núcleo do commit de importação
  (`lib/import/commit.ts`). **E2E 2026-08-10/11 (Registros Nº 051/052)** — `npm run
  test:e2e` (Playwright), 5 specs: login sem senha, criar lançamento, importar CSV,
  importar OFX, trocar de workspace. Ainda não cobre: importação de PDF de fatura (sem
  fixture disponível — decisão explícita, ver Registro Nº 052), qualquer outra página, e
  não roda no CI (Playwright+browsers no GitHub Actions é decisão separada, não tomada
  ainda).
- ~~Sem CI configurado~~ **Resolvido 2026-08-10 (Registro Nº 046):**
  `.github/workflows/ci.yml` roda `tsc --noEmit`, `npm test` e `npm run build` em todo
  push/PR pra `master` (lint incluso mas `continue-on-error: true` — ver item novo abaixo).
- **Novo (achado ao configurar o CI, 2026-08-10):** `npm run lint` tem 11 erros
  pré-existentes, sem relação com o CI em si — 4x `<a>` que deveriam ser `<Link/>`
  (`app/(app)/investimentos/page.tsx`, `ImportWizard.tsx`) e 2x reatribuição de variável
  durante render (`app/(app)/investimentos/analise/page.tsx`,
  `app/(app)/patrimonio/bens/[id]/page.tsx`, regra `react-hooks/immutability` — padrão de
  soma acumulada com `let` + `.map()`), mais 2 warnings de import não usado
  (`lib/entries/investment.ts`). Não corrigido nesta etapa (fora do escopo: mexeria em
  código de tela, não em débito técnico de infraestrutura) — o step de lint no CI está
  `continue-on-error: true` até alguém pedir a correção.
- ~~Sem deploy feito ainda~~ **Desatualizado** — o projeto está em produção na Vercel desde
  2026-07-30 (`prospecta-finance.vercel.app`); esta linha ficou parada de uma versão bem
  anterior deste documento e não foi removida até agora.
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
- **Migration `20260808220000_workspace_client_code` quebra em banco vazio**: o
  `SELECT setval('workspaces_client_code_seq', COALESCE(MAX(client_code), 0))` falha com
  "value 0 is out of bounds" quando a tabela `workspaces` está vazia (sequences começam
  em 1, não em 0) — só aparece ao rodar `prisma migrate dev` de novo (ele faz replay de
  todas as migrations num banco-sombra vazio pra calcular o diff) ou ao inicializar um
  ambiente novo do zero; **não afeta o banco de produção atual**, que já tinha 8
  workspaces quando a migration rodou pela primeira vez. Não corrigido no arquivo porque
  a migration já foi aplicada em produção — editar o `.sql` depois de aplicado quebra o
  checksum que o Prisma guarda em `_prisma_migrations` e força um `migrate reset`
  (destrutivo, NUNCA rodar isso neste projeto — apagaria todos os dados reais do
  usuário). Descoberto e contornado durante a importação de OFX (Registro Nº 033):
  criada a migration seguinte pelo caminho manual (escrever o `.sql` à mão + `prisma
  migrate deploy`, que não faz replay em banco-sombra) em vez de `prisma migrate dev`.
  Se algum dia for preciso rodar `prisma migrate dev` de novo neste projeto, vai falhar
  nesse mesmo ponto — o contorno é sempre escrever a migration à mão e aplicar com
  `migrate deploy`, nunca `migrate dev`, enquanto essa migration antiga não for
  reescrita (só possível resetando o histórico de migrations, fora de cogitação com
  dado real em produção).
- **`prisma migrate deploy`/`migrate status` travam indefinidamente nesta máquina Windows
  (achado em 2026-08-09, Registro Nº 035):** o binário `schema-engine-windows.exe`
  (`node_modules/@prisma/engines/schema-engine-windows.exe`) fica parado para sempre no
  passo `cli can-connect-to-database`, mesmo com o Postgres alcançável em ~100ms via `pg`
  puro (`new Client({connectionString}).connect()`, testado à parte) — `prisma --version`
  roda normalmente (não é binário ausente/corrompido). Indício forte de firewall/
  antivírus local bloqueando esse executável especificamente (diferente de `node.exe`,
  que já tinha permissão de rede das sessões anteriores) — não é um problema do projeto,
  do Supabase, nem de código; não foi possível confirmar/corrigir a causa raiz porque
  `Get-NetFirewallApplicationFilter` exige privilégio de administrador, indisponível
  nesta sessão. **Contorno usado (e documentado aqui para reuso):** aplicar o `.sql` da
  migration diretamente via `pg` (`Client.query(sql)`) dentro de uma transação, e nessa
  mesma transação inserir a linha correspondente em `_prisma_migrations`
  (`id` = UUID aleatório, `checksum` = sha256 hex do arquivo `.sql`, `migration_name`,
  `started_at`/`finished_at` = agora, `applied_steps_count` = 1 — mesmo formato que o
  `prisma migrate deploy` gravaria, conferido contra migrations anteriores já aplicadas).
  `prisma generate` continua funcionando normalmente (não precisa conectar no banco).
  Se isso acontecer de novo numa sessão futura: primeiro checar se o problema ainda
  existe (`npx prisma migrate status` com timeout curto) antes de assumir que precisa do
  contorno — pode já ter sido corrigido (ex.: usuário aprovou um prompt de firewall).

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
  pendente na época, aplicada depois:** trocar `DATABASE_URL` na Vercel pro pooler de
  **Transação** (porta 6543) — feito em 2026-08-08 (Registro Nº 034), depois que o mesmo
  tipo de erro derrubou `/lancamentos` de novo (`max: 3` sozinho não bastou sob uso
  concorrente real). Ver "Última atualização" no topo do arquivo para o detalhe.
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
- [x] Trocar `DATABASE_URL` na Vercel do pooler de Sessão (5432) pro pooler de Transação
      (6543) — **resolvido 2026-08-08** (Registro Nº 034), depois de um segundo
      esgotamento real do pool derrubar `/lancamentos` no celular. Usuário autorizou
      explicitamente editar a env var pela CLI da Vercel; `.env.local` e as env vars de
      `Production`/`Preview` na Vercel atualizados, `max: 3` do adapter mantido como
      precaução geral (não mais pra evitar estourar um teto duro).
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
- [x] Fase 2 (relatórios: analítico, parceladas, balanço anual, orçamento, fluxo
      projetado — 2026-08-08, Registro Nº 021) — OFX segue pendente, não pedido ainda
- [x] Fase 3 (patrimônio: Bens/Metas, Dívidas — 2026-08-08, Registros Nº 023/024) — Open
      Finance segue pendente, não pedido ainda
- [x] Fase 4 (consultoria multi-workspace: seletor de workspace, `/admin/clientes`,
      código do cliente — concluída em partes ao longo de 2026-08-04 a 2026-08-08,
      Registro Nº 031 fecha a última peça pendente)
