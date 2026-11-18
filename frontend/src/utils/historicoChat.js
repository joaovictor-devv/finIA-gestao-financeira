/**
 * Histórico temporário da conversa, separado por aba do navegador.
 * Não é gravado no banco nem enviado ao backend; somente as perguntas
 * enviadas pelo usuário chegam à API da IA.
 */
const CHAVE = "finia:historico-chat:v1";
const EVENTO = "finia:historico-chat-alterado";
const LIMITE_MENSAGENS = 60;
const LIMITE_CARACTERES = 4000;

function sanitizar(mensagens) {
  if (!Array.isArray(mensagens)) return [];
  return mensagens
    .filter((item) => item && (item.tipo === "usuario" || item.tipo === "finia")
      && typeof item.texto === "string" && item.texto.trim())
    .map((item) => ({ tipo: item.tipo, texto: item.texto.slice(0, LIMITE_CARACTERES) }))
    .slice(-LIMITE_MENSAGENS);
}

export function carregarHistoricoChat() {
  try {
    const salvo = window.sessionStorage.getItem(CHAVE);
    return salvo ? sanitizar(JSON.parse(salvo)) : [];
  } catch {
    return [];
  }
}

export function salvarHistoricoChat(mensagens) {
  const dados = sanitizar(mensagens);
  try {
    if (dados.length) window.sessionStorage.setItem(CHAVE, JSON.stringify(dados));
    else window.sessionStorage.removeItem(CHAVE);
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    // O chat continua funcional quando o navegador bloqueia armazenamento.
  }
  return dados;
}

export function observarHistoricoChat(onChange) {
  const atualizar = () => onChange(carregarHistoricoChat());
  window.addEventListener(EVENTO, atualizar);
  return () => window.removeEventListener(EVENTO, atualizar);
}
