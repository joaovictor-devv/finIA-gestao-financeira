import api from "./api";

export function buscarPerfilFinanceiro() {
  return api.get("/perfil-financeiro");
}

export function salvarPerfilFinanceiro(dados) {
  return api.post("/perfil-financeiro", dados);
}

export function atualizarPerfilFinanceiro(id, dados) {
  return api.put(`/perfil-financeiro/${id}`, dados);
}