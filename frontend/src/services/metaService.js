import api from "./api";

export function listarMetas() {
  return api.get("/metas");
}

export function cadastrarMeta(dados) {
  return api.post("/metas", dados);
}

export function excluirMeta(id) {
  return api.delete(`/metas/${id}`);
}

export function buscarMetaPorId(id) {
  return api.get(`/metas/${id}`);
}