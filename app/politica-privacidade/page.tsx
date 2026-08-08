import Link from "next/link";

export const metadata = { title: "Política de Privacidade — PROSPECTA Finance" };

/**
 * Rascunho estruturado conforme a LGPD (Lei nº 13.709/2018) — cobre os
 * elementos que a lei exige (Art. 9º: finalidade, forma de tratamento,
 * identificação do controlador, direitos do titular, etc.). **Isto é um
 * ponto de partida gerado por IA, não uma peça jurídica validada** — precisa
 * de revisão por advogado especializado em proteção de dados antes de valer
 * como política oficial da empresa. Campos marcados [ENTRE COLCHETES] são
 * placeholders que o controlador (CEO) precisa preencher.
 */
export default function PoliticaPrivacidadePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 text-zinc-200 sm:px-6">
      <div>
        <Link href="/login" className="text-sm text-indigo-300 hover:text-white">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-50">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Última atualização: 07/08/2026 · Elaborada conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº
          13.709/2018 — LGPD)
        </p>
      </div>

      <Section title="1. Quem trata seus dados (controlador)">
        <p>
          O PROSPECTA Finance é operado por <strong>[RAZÃO SOCIAL / NOME COMPLETO DO CONTROLADOR — PREENCHER]</strong>,
          [CNPJ/CPF — PREENCHER], responsável pelas decisões sobre o tratamento dos seus dados pessoais nesta
          plataforma.
        </p>
        <p>
          Encarregado de proteção de dados (DPO), pra dúvidas ou exercício de direitos:{" "}
          <strong>[NOME DO ENCARREGADO — PREENCHER]</strong>, e-mail{" "}
          <strong>admin@prospectafinance.com.br</strong>.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>Coletamos os seguintes dados pessoais, sempre que você cadastra ou usa o sistema:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Dados de conta:</strong> e-mail, senha (armazenada de forma criptografada, nunca em texto puro) ou
            identidade do Google (se você optar por entrar com Google).
          </li>
          <li>
            <strong>Dados pessoais opcionais:</strong> nome completo, telefone, CPF, data de nascimento e endereço —
            você decide se preenche, e pode apagar a qualquer momento em &ldquo;Minha conta&rdquo;.
          </li>
          <li>
            <strong>Dados financeiros:</strong> lançamentos, carteiras, categorias e responsáveis que você cadastra
            pra usar o sistema — é a finalidade central do produto.
          </li>
          <li>
            <strong>Dados de uso e acesso:</strong> quando um consultor ou administrador acessa o seu workspace,
            fica registrado (data/hora, quem acessou) — você pode ver esse histórico.
          </li>
        </ul>
      </Section>

      <Section title="3. Para que usamos seus dados (finalidade)">
        <ul className="list-disc space-y-1 pl-5">
          <li>Viabilizar o controle e planejamento financeiro pessoal que é o objetivo do sistema.</li>
          <li>Autenticar seu acesso e proteger sua conta.</li>
          <li>Permitir que um consultor financeiro que você (ou o administrador) atribuiu acompanhe suas finanças.</li>
          <li>Enviar e-mails necessários ao funcionamento da conta (confirmação de cadastro, redefinição de senha, convites).</li>
          <li>Cumprir obrigações legais e regulatórias aplicáveis, quando existirem.</li>
        </ul>
        <p>Não usamos seus dados pessoais para publicidade nem os vendemos a terceiros.</p>
      </Section>

      <Section title="4. Base legal pro tratamento">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Execução de contrato</strong> (Art. 7º, V) — dados de conta e dados financeiros essenciais pra
            você usar o serviço.
          </li>
          <li>
            <strong>Consentimento</strong> (Art. 7º, I) — dados pessoais opcionais (telefone, CPF, data de nascimento,
            endereço), que você fornece por vontade própria e pode remover quando quiser.
          </li>
          <li>
            <strong>Legítimo interesse</strong> (Art. 7º, IX) — registros de acesso/auditoria, essenciais pra
            segurança da plataforma e pra você saber quem viu seus dados.
          </li>
        </ul>
      </Section>

      <Section title="5. Com quem compartilhamos (operadores)">
        <p>Usamos os seguintes prestadores de serviço, que processam dados em nosso nome, sob contrato:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — hospedagem do banco de dados (região São Paulo/Brasil) e autenticação.
          </li>
          <li>
            <strong>Vercel</strong> — hospedagem da aplicação web.
          </li>
          <li>
            <strong>Brevo</strong> — envio de e-mails transacionais (confirmação de cadastro, convites, avisos).
          </li>
          <li>
            <strong>Google</strong> — só se você optar por entrar com sua conta Google.
          </li>
          <li>
            <strong>ViaCEP</strong> — busca de endereço a partir do CEP que você digita (só o CEP é enviado, nenhum
            outro dado pessoal).
          </li>
        </ul>
        <p>Nunca vendemos ou compartilhamos seus dados com terceiros pra fins de marketing.</p>
      </Section>

      <Section title="6. Seus direitos (Art. 18 da LGPD)">
        <p>Você tem direito a, a qualquer momento e gratuitamente:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Confirmar se tratamos dados seus e acessar quais são (tela &ldquo;Minha conta&rdquo;).</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados (botão &ldquo;Editar&rdquo; em &ldquo;Minha conta&rdquo;).</li>
          <li>Baixar uma cópia dos seus dados em formato legível (portabilidade — botão de exportação em &ldquo;Minha conta&rdquo;).</li>
          <li>Excluir sua conta e todos os seus dados permanentemente (&ldquo;Minha conta&rdquo; → Zona de risco).</li>
          <li>Revogar o consentimento dado a qualquer momento, sem afetar tratamentos já realizados.</li>
          <li>
            Pedir informação sobre com quem compartilhamos seus dados, e sobre a possibilidade de não fornecer
            consentimento e as consequências disso.
          </li>
        </ul>
        <p>
          Pra exercer qualquer um desses direitos que não esteja disponível diretamente no sistema, entre em contato
          com o encarregado (seção 1).
        </p>
      </Section>

      <Section title="7. Por quanto tempo guardamos seus dados">
        <p>
          Enquanto sua conta estiver ativa. Se você excluir sua conta, os dados são removidos permanentemente do
          nosso banco de dados, exceto quando a lei exigir retenção por prazo determinado (ex.: obrigações fiscais ou
          regulatórias aplicáveis, quando existirem — [REVISAR SE HÁ OBRIGAÇÃO DE RETENÇÃO ESPECÍFICA APLICÁVEL AO
          NEGÓCIO]).
        </p>
      </Section>

      <Section title="8. Segurança">
        <ul className="list-disc space-y-1 pl-5">
          <li>Conexão sempre criptografada (HTTPS) entre seu navegador e o sistema.</li>
          <li>Senhas nunca armazenadas em texto puro (hash criptográfico gerenciado pelo provedor de autenticação).</li>
          <li>Acesso aos seus dados restrito a você, e a consultores/administradores que você explicitamente autorizou.</li>
          <li>Todo acesso de consultor/administrador a um workspace que não é o dele é registrado e auditável.</li>
        </ul>
      </Section>

      <Section title="9. Reclamações">
        <p>
          Se você entender que seus direitos não foram respeitados, pode reclamar diretamente com o encarregado
          (seção 1) ou com a Autoridade Nacional de Proteção de Dados (ANPD) —{" "}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline hover:text-white">
            gov.br/anpd
          </a>
          .
        </p>
      </Section>

      <Section title="10. Alterações desta política">
        <p>
          Podemos atualizar esta política pra refletir mudanças no sistema ou na legislação. Alterações relevantes
          serão comunicadas por e-mail ou aviso no sistema.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 pt-5 text-sm leading-relaxed">
      <h2 className="text-base font-medium text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}
