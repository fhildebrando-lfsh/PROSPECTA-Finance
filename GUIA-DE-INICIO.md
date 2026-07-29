# Guia de Início — do zero até o sistema rodando

Este guia pressupõe que você **não sabe programar** e não conhece a terminologia da área.
Ele explica primeiro os conceitos, depois a sequência prática.

Leia a Parte 1 antes de tocar em qualquer ferramenta. São 10 minutos que evitam semanas
de confusão.

---

# PARTE 1 — O QUE VOCÊ PRECISA ENTENDER ANTES

## 1.1 As três peças de qualquer sistema web

Um sistema como o seu tem sempre três partes. A analogia do restaurante funciona bem:

| Peça | Nome técnico | No restaurante | No seu sistema |
|---|---|---|---|
| O que a pessoa vê e clica | **Frontend** | O salão, o cardápio, a mesa | As telas: painel, formulário de lançamento, relatórios |
| Onde as decisões acontecem | **Backend** | A cozinha | Calcula saldos, valida lançamentos, gera parcelas |
| Onde tudo fica guardado | **Banco de dados** | A despensa | Seus 5.900 lançamentos, carteiras, categorias |

Quando você abre o sistema no celular e digita R$ 35,00, o **frontend** captura, manda
para o **backend**, que confere se está tudo certo e grava no **banco de dados**. Quando
você abre o painel, o caminho é o inverso.

Você vai construir as três com o Claude Code. Você não precisa saber escrevê-las — precisa
saber que existem, para entender do que ele está falando.

## 1.2 O que é um banco de dados SQL, na prática

**Você já sabe o que é um banco de dados relacional.** Sua planilha é um.

Pense na aba `DADOS`: cada linha é um lançamento, cada coluna é uma informação. A aba
`VL1` guarda as listas que alimentam os menus suspensos, e a `DADOS` "puxa" delas.

Um banco SQL é exatamente isso, com três diferenças que importam:

| | Planilha | Banco de dados |
|---|---|---|
| **Tamanho** | Trava depois de dezenas de milhares de linhas | Milhões de linhas sem esforço |
| **Simultaneidade** | Duas pessoas editando ao mesmo tempo gera conflito | Feito para isso desde o início |
| **Integridade** | Nada impede escrever "Alimentaçao" errado numa célula | O banco **recusa** um lançamento com carteira que não existe |

**Vocabulário mínimo** (aparecerá o tempo todo nas conversas com o Claude Code):

- **Tabela** = uma aba da planilha. Você terá `entries` (lançamentos), `wallets`
  (carteiras), `categories` (categorias).
- **Registro** ou **linha** = um lançamento.
- **Campo** ou **coluna** = uma informação (valor, data, descrição).
- **Chave primária** = o ID único de cada linha. É a coluna `ID` da sua planilha.
- **Chave estrangeira** = o vínculo entre tabelas. O lançamento aponta para a carteira em
  vez de repetir o nome dela. Trocar "Itaú" por "Itaú Uniclass" muda **um** registro e
  todos os lançamentos acompanham — na planilha, exigiria localizar e substituir 800
  linhas.
- **SQL** = o idioma para conversar com o banco. `SELECT valor FROM entries WHERE ano =
  2025` significa "me dê os valores dos lançamentos de 2025". **Você não vai escrever
  SQL** — o Claude Code escreve. É útil reconhecer quando vir.
- **Migration** = um registro de alteração na estrutura do banco (criar tabela, adicionar
  coluna). Cada mudança fica versionada e é reversível.
- **Seed** = a carga inicial de dados. São os CSVs que já estão prontos.
- **Backup** = cópia de segurança. Falaremos disso na Parte 4, e é sério.

## 1.3 Você precisa contratar um banco de dados à parte?

**Sim, mas não é o que você está imaginando.** Não é comprar servidor nem instalar nada.

Você cria uma conta em um serviço que hospeda o banco na nuvem. O banco fica lá, acessível
pela internet, com backup automático. É como o Google Drive: você não tem servidor, tem
conta.

O serviço recomendado é o **Supabase**, e a razão está na especificação (§19.2): ele
entrega **três coisas em uma conta só** — o banco PostgreSQL, o sistema de login, e o
isolamento de dados entre clientes. Usar três serviços separados para isso significaria
três contas, três configurações e três lugares para errar.

**Custo real:** o plano gratuito comporta seu uso pessoal e familiar com folga. Quando
começar a atender clientes, o plano pago fica em torno de US$ 25/mês. Não há investimento
inicial.

## 1.4 O que é o Claude Code e qual é o seu papel

O Claude Code é o Claude rodando **dentro do seu computador**, com acesso aos arquivos do
projeto. Diferente desta conversa, onde eu escrevo texto, lá ele cria arquivos, escreve
código, roda testes e corrige erros.

**Seu papel não é programar. É três outras coisas:**

1. **Dizer o que o sistema deve fazer.** Já está feito — é a especificação.
2. **Testar como usuário.** Abrir a tela, lançar uma despesa, ver se o saldo bateu. Você é
   a única pessoa que sabe se o número está certo.
3. **Decidir quando algo estiver ambíguo.** Ele vai perguntar. Suas respostas de finanças
   valem mais que qualquer preferência técnica dele.

---

# PARTE 2 — PREPARAÇÃO (1 a 2 horas, uma única vez)

## Passo 1 — Instalar o Claude Code

Baixe o aplicativo do Claude para desktop em `claude.com/download` e ative a aba **Code**.
É a forma mais simples para quem não usa terminal. Se em algum momento você preferir, ele
também roda pelo terminal, mas não é necessário.

## Passo 2 — Criar a conta do banco de dados

1. Acesse `supabase.com` e crie uma conta
2. Crie um projeto novo — sugestão de nome: `financas-pessoais`
3. Escolha a região **South America (São Paulo)** — dados no Brasil respondem mais rápido
   e simplificam questões de LGPD
4. Defina a senha do banco e **guarde-a em um gerenciador de senhas**. Não é a senha de
   login do site; é a senha do banco em si, e recuperá-la depois é chato.
5. Em Project Settings → API, você encontrará a URL e as chaves. Não precisa fazer nada
   com elas agora — o Claude Code vai pedir na hora certa.

## Passo 3 — Criar a pasta do projeto

Crie uma pasta no seu computador, por exemplo `Documentos/sistema-financeiro`.

Dentro dela, coloque:

```
sistema-financeiro/
├── ESPECIFICACAO-SISTEMA-FINANCEIRO.md
└── seeds/
    ├── seed_taxonomia.csv
    ├── seed_carteiras.csv
    ├── seed_tipos_carteira.csv
    ├── seed_responsaveis.csv
    ├── seed_situacoes.csv
    ├── seed_recorrencias.csv
    └── excel-br/          (as versões para abrir no Excel)
```

Aponte o Claude Code para essa pasta. A partir daí ele enxerga tudo que está nela.

---

# PARTE 3 — CONSTRUÇÃO (a sequência de conversas)

A regra mais importante: **uma fase por conversa.** Pedir tudo de uma vez produz um
sistema que parece pronto e quebra no primeiro uso real.

Ao final de cada conversa, peça: *"Faça um resumo do que foi construído e do que falta."*
Guarde esses resumos — eles são o fio da meada entre as sessões.

## Conversa 1 — Fundação

> Leia o arquivo `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` por completo.
> Vamos implementar a **Fase 0 (Fundação)**, descrita na seção 22.
> Antes de escrever qualquer código, me apresente: o plano de execução, as decisões
> técnicas que você vai tomar, e todas as dúvidas que tiver.
> Não comece a implementar até eu aprovar o plano.

Ele vai perguntar sobre as credenciais do Supabase. **Nunca cole senhas ou chaves
diretamente na conversa** — peça que ele crie um arquivo `.env.local` e te oriente onde
colar. Esse arquivo fica só na sua máquina e nunca sai dela.

**Como saber que a Fase 0 terminou:** você abre o navegador, vê uma tela de login, entra
com seu e-mail, e consegue ver a lista completa de categorias e carteiras.

## Conversa 2 — Regras financeiras

> Vamos implementar as regras de cálculo da seção 11 e as regras de lançamento da
> seção 10, em `/lib/finance`.
> Escreva **testes automatizados para cada regra antes da implementação**.
> Nenhuma tela ainda — só as regras e os testes.

Esta é a conversa mais importante e a menos vistosa: não produz nada visível. É onde vive
a inteligência financeira do sistema. Um saldo calculado errado aqui contamina todos os
relatórios, e o erro só aparece meses depois.

**Como saber que terminou:** ele mostra os testes passando, e você consegue ler os nomes
dos testes e reconhecer suas próprias regras.

## Conversa 3 — Lançamentos e importação

> Vamos implementar o CRUD de lançamentos, o parcelamento e a recorrência da seção 8.5,
> e o importador de CSV da seção 18.

**Como saber que terminou:** você exporta a aba `DADOS` da planilha em CSV, importa no
sistema, e os lançamentos aparecem corretamente na tela.

## Conversa 4 — Lançamento rápido e painel

> Vamos implementar a tela de lançamento rápido da seção 12 e o painel da seção 11.
> A meta da seção 12 é inegociável: **4 toques, 10 segundos, uma mão.**

**Como saber que terminou:** você instala no celular, lança uma despesa em menos de 10
segundos e ela aparece no painel.

## Conversa 5 — Permissões, exportação e ajustes

> Vamos implementar as permissões da seção 20, a exportação da seção 18.2, e revisar a
> responsividade da seção 21.

## Depois: 30 dias de uso real antes de qualquer coisa nova

Não parta para os relatórios da Fase 2 sem usar o núcleo por um mês inteiro. É o uso que
revela o que falta — exatamente como aconteceu com a planilha, onde o problema real (o
atrito de lançar) só apareceu depois de meses de uso, não no desenho.

---

# PARTE 4 — O QUE VOCÊ PRECISA SABER PARA NÃO SE MACHUCAR

## 4.1 Backup

O Supabase faz backup automático, mas **backup automático que nunca foi testado não é
backup**. Uma vez por mês: exporte tudo em CSV pelo próprio sistema (§18.2) e guarde em
outro lugar — Drive, HD externo, o que for.

São seus dados financeiros de dez anos. Vale o hábito.

## 4.2 Segredos

Senhas, chaves de API e tokens **nunca** vão para dentro do código, nunca são colados em
conversa, nunca sobem para a internet. Ficam sempre em arquivos de ambiente (`.env.local`)
que permanecem só na sua máquina.

Se algum dia você publicar o código em algum lugar e uma chave escapar junto, ela precisa
ser trocada imediatamente — considere-a comprometida.

## 4.3 Quando o Claude Code errar

Ele vai errar. É normal e faz parte do processo. O que funciona:

- **Descreva o sintoma, não a solução.** "O saldo do painel está R$ 200 maior que a soma
  dos lançamentos" funciona muito melhor que "acho que o filtro está errado".
- **Cole a mensagem de erro inteira.** Ela costuma dizer exatamente onde está o problema.
- **Peça o teste junto com a correção.** "Corrija e escreva um teste que teria pego isso"
  impede que o mesmo erro volte.
- **Se ele insistir em um caminho ruim, aponte a especificação.** "A seção 11.1 define
  esse cálculo de outro jeito — siga a especificação."

## 4.4 Quando dizer não

Se ele propuser "vou simplificar a taxonomia por enquanto", "vou usar número em vez de
decimal para o valor" ou "vou deixar o multi-tenant para depois", **recuse**. Os três
parecem atalhos inofensivos e são exatamente os que custam caro para desfazer depois — o
terceiro é o pior de todos, porque adaptar um sistema já cheio de dados para múltiplos
clientes é praticamente reescrevê-lo.

## 4.5 O que você não deve fazer sozinho

- Mexer diretamente no banco por SQL sem entender o comando. Um `DELETE` sem `WHERE`
  apaga a tabela inteira, sem confirmação e sem desfazer.
- Aceitar código que você pediu para explicar e não entendeu a explicação. Peça de novo,
  mais simples. Se continuar sem fazer sentido, provavelmente o código está mais
  complicado do que precisa.

---

# RESUMO EM UMA PÁGINA

```
PREPARAÇÃO (uma vez)
  1. Instalar o Claude Code
  2. Criar conta no Supabase, região São Paulo, guardar a senha
  3. Criar a pasta do projeto com a especificação e os seeds

CONSTRUÇÃO (uma conversa por fase, sempre pedindo o plano antes)
  Conversa 1 → Fundação: login funcionando, listas carregadas
  Conversa 2 → Regras financeiras com testes (sem telas)
  Conversa 3 → Lançamentos, parcelas, importação de CSV
  Conversa 4 → Lançamento rápido no celular + painel
  Conversa 5 → Permissões, exportação, responsividade

  → 30 DIAS DE USO REAL antes de qualquer funcionalidade nova

SEMPRE
  Backup mensal em CSV, guardado fora do sistema
  Senhas só em arquivo de ambiente, nunca no código nem no chat
  Descrever sintoma, não solução, quando algo quebrar
  Recusar atalhos em: taxonomia, tipo decimal do valor, multi-tenant
```

---

*Complemento de `ESPECIFICACAO-SISTEMA-FINANCEIRO.md`. As referências entre parênteses
(§11.1, §18.2) apontam para as seções daquele documento.*
