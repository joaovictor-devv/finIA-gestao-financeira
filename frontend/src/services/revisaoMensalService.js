import api from "./api";

export function listarRevisoesMensais() {
  return api.get("/revisoes-mensais");
}

export function cadastrarRevisaoMensal(revisao) {
  return api.post("/revisoes-mensais", revisao);
}

export function buscarRevisaoMensalPorId(id) {
  return api.get(`/revisoes-mensais/${id}`);
}

export function excluirRevisaoMensal(id) {
  return api.delete(`/revisoes-mensais/${id}`);
}