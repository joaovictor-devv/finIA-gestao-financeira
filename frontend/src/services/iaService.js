import api from "./api";

export function buscarSaudeFinanceira() {
  return api.get("/ia/saude-financeira");
}

export function buscarSugestoes() {
  return api.get("/ia/sugestoes");
}

export function buscarResumoInteligente() {
  return api.get("/ia/resumo-inteligente");
}

export function buscarAnaliseGastos() {
  return api.get("/ia/analise-gastos");
}

export function buscarPrevisaoMetas() {
  return api.get("/ia/previsao-metas");
}