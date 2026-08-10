import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { vi } from "vitest";

// Guard de segurança: testes de integração ESCREVEM E APAGAM dados de
// verdade. Carrega .env.dev.local explicitamente (nunca .env.local, que
// pode ser trocado de volta pra produção a qualquer momento) e aborta a
// suíte inteira antes de qualquer query se não conseguir confirmar, com
// certeza, que o banco alvo é o projeto de dev/teste.
//
// Refs de projeto Supabase não são segredo (aparecem em texto puro em
// PROJECT_STATE.md, que está no Git) — só a URL/chaves/senha é que não vão
// pro repositório (.env.dev.local está no .gitignore).
const DEV_PROJECT_REF = "fmxzooefvbvhmgczznsa";
const PROD_PROJECT_REF = "zfugldawxhvzclooisqj";

// Localmente, as credenciais vêm de .env.dev.local (nunca commitado). No CI
// (GitHub Actions), não existe esse arquivo — as mesmas variáveis chegam
// direto via `env:` do job, alimentadas pelos secrets DEV_* do repositório
// (nunca os de produção, nomeados sem esse prefixo). Só exige o arquivo
// quando NENHuma das duas fontes já deixou DATABASE_URL definido.
const envPath = ".env.dev.local";
if (existsSync(envPath)) {
  loadEnv({ path: envPath });
} else if (!process.env.DATABASE_URL) {
  throw new Error(
    `Testes de integração exigem "${envPath}" na raiz do projeto (banco de dev/teste — ver PROJECT_STATE.md, Registro Nº 047) ou as variáveis já definidas no ambiente (CI). Nenhum dos dois encontrado.`,
  );
}

const databaseUrl = process.env.DATABASE_URL ?? "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

if (databaseUrl.includes(PROD_PROJECT_REF) || supabaseUrl.includes(PROD_PROJECT_REF)) {
  throw new Error(
    "ABORTADO: as credenciais carregadas apontam para o projeto Supabase de PRODUÇÃO. " +
      "Testes de integração nunca podem rodar contra produção — confira o conteúdo de .env.dev.local.",
  );
}

if (!databaseUrl.includes(DEV_PROJECT_REF) || !supabaseUrl.includes(DEV_PROJECT_REF)) {
  throw new Error(
    `ABORTADO: não foi possível confirmar que o banco alvo é o projeto de dev/teste (ref esperado "${DEV_PROJECT_REF}"). ` +
      "Confira DATABASE_URL/NEXT_PUBLIC_SUPABASE_URL em .env.dev.local antes de rodar os testes de integração.",
  );
}

// `after()` (next/server) lança exceção síncrona se chamado fora de um
// request scope real do Next — createEntryOrSeries/settleEntry usam para
// agendar sync com o Google Agenda. Substituído por "executa na hora": o
// callback real (syncEntryToGoogleCalendar) é melhor-esforço e retorna cedo
// quando o workspace não tem GoogleCalendarConnection (nenhum workspace de
// teste tem), então é seguro e não trava esperando rede.
vi.mock("next/server", () => ({
  after: (fn: () => unknown) => fn(),
}));
