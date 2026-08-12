import type { AuthError } from "@supabase/supabase-js";

// O SDK do Supabase Auth só devolve mensagens em inglês (`error.message`) — nunca
// mostrar isso direto pro usuário (§ achado real em produção, 2026-08-12: erro de senha
// fraca vazou cru na tela). Traduz pelo `error.code` (estável entre versões do SDK,
// diferente do texto livre de `error.message`); qualquer código não mapeado cai num
// texto genérico seguro, nunca no inglês original.
const MESSAGES_BY_CODE: Record<string, string> = {
  weak_password:
    "A senha não atende aos requisitos mínimos: use pelo menos 10 caracteres, com letra maiúscula, minúscula, número e símbolo.",
  user_already_exists: 'Este e-mail já está cadastrado. Tente entrar, ou clique em "Esqueci minha senha" se não lembrar a senha.',
  email_exists: 'Este e-mail já está cadastrado. Tente entrar, ou clique em "Esqueci minha senha" se não lembrar a senha.',
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar — veja sua caixa de entrada (e o spam).",
  over_email_send_rate_limit: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  same_password: "A nova senha precisa ser diferente da senha atual.",
  user_not_found: "Não encontramos uma conta com esse e-mail.",
  validation_failed: "E-mail inválido.",
  email_address_invalid: "E-mail inválido.",
  signup_disabled: "O cadastro está temporariamente desativado. Fale com o administrador.",
};

/** Traduz o erro do Supabase Auth pra uma mensagem em português que faz sentido pro
 * usuário final. Nunca expõe `error.message` (sempre em inglês) diretamente na tela. */
export function translateAuthError(error: AuthError): string {
  return MESSAGES_BY_CODE[error.code ?? ""] ?? "Não foi possível concluir. Tente novamente em instantes.";
}
