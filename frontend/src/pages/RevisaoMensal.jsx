import { useCallback, useEffect, useState } from "react";
import {
  cadastrarRevisaoMensal,
  excluirRevisaoMensal,
  listarRevisoesMensais,
} from "../services/revisaoMensalService";

function RevisaoMensal() {
  const [revisoes, setRevisoes] = useState([]);
  const [mensagem, setMensagem] = useState("");

  const [form, setForm] = useState({
    mesReferencia: "",
    gastoInesperado: false,
    valorIncorreto: false,
    revisarCategorias: false,
    observacoes: "",
  });

  const carregarRevisoes = useCallback(async () => {
    try {
      const response = await listarRevisoesMensais();
      setRevisoes(response.data);
    } catch (error) {
      console.error("Erro ao listar revisões mensais:", error);
      setMensagem("Erro ao carregar revisões mensais.");
    }
  }, []);

  useEffect(() => {
    carregarRevisoes();
  }, [carregarRevisoes]);

  const atualizarCampo = (campo, valor) => {
    setForm({
      ...form,
      [campo]: valor,
    });
  };

  const salvarRevisao = async (e) => {
    e.preventDefault();
    setMensagem("");

    const dadosParaBackend = {
      mesReferencia: form.mesReferencia,
      gastoInesperado: form.gastoInesperado,
      valorIncorreto: form.valorIncorreto,
      revisarCategorias: form.revisarCategorias,
      observacoes: form.observacoes,
    };

    try {
      await cadastrarRevisaoMensal(dadosParaBackend);

      setMensagem("Revisão mensal cadastrada com sucesso.");

      setForm({
        mesReferencia: "",
        gastoInesperado: false,
        valorIncorreto: false,
        revisarCategorias: false,
        observacoes: "",
      });

      carregarRevisoes();
    } catch (error) {
      console.error("Erro ao cadastrar revisão mensal:", error);
      setMensagem("Erro ao cadastrar revisão mensal.");
    }
  };

  const removerRevisao = async (id) => {
    setMensagem("");

    try {
      await excluirRevisaoMensal(id);
      setMensagem("Revisão mensal excluída com sucesso.");
      carregarRevisoes();
    } catch (error) {
      console.error("Erro ao excluir revisão mensal:", error);
      setMensagem("Erro ao excluir revisão mensal.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Revisão Mensal</h1>

        <p className="mt-2 text-lg text-slate-500">
          Registre informações importantes sobre o mês para melhorar o contexto
          financeiro do FinIA.
        </p>
      </section>

      {mensagem && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700">
          {mensagem}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <span className="material-symbols-outlined">psychology</span>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Contexto para IA futura
              </h2>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                IA futura
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Essas respostas não geram recomendações automáticas agora. Elas
              servem para armazenar contexto financeiro que futuramente poderá
              ser interpretado pela IA do FinIA.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form
            onSubmit={salvarRevisao}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              Nova revisão
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Mês de referência
                </label>

                <input
                  type="text"
                  value={form.mesReferencia}
                  onChange={(e) =>
                    atualizarCampo("mesReferencia", e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: Junho/2026"
                />
              </div>

              <div className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      Houve gasto inesperado?
                    </p>
                    <p className="text-sm text-slate-500">
                      Ex: saúde, manutenção, emergência ou despesa fora do
                      comum.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.gastoInesperado}
                    onChange={(e) =>
                      atualizarCampo("gastoInesperado", e.target.checked)
                    }
                    className="h-5 w-5"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      Algum valor parece incorreto?
                    </p>
                    <p className="text-sm text-slate-500">
                      Marque caso algum lançamento precise ser conferido depois.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.valorIncorreto}
                    onChange={(e) =>
                      atualizarCampo("valorIncorreto", e.target.checked)
                    }
                    className="h-5 w-5"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      Deseja revisar categorias?
                    </p>
                    <p className="text-sm text-slate-500">
                      Útil quando algum gasto foi classificado de forma errada.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.revisarCategorias}
                    onChange={(e) =>
                      atualizarCampo("revisarCategorias", e.target.checked)
                    }
                    className="h-5 w-5"
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Observações do mês
                </label>

                <textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    atualizarCampo("observacoes", e.target.value)
                  }
                  rows="5"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: Tive uma despesa médica inesperada e recebi uma renda extra neste mês."
                ></textarea>
              </div>

              <button className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700">
                Salvar revisão
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Revisões cadastradas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Histórico salvo diretamente no backend.
            </p>
          </div>

          {revisoes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300">
                event_note
              </span>

              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                Nenhuma revisão cadastrada
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Cadastre a primeira revisão mensal para registrar o contexto do
                mês.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {revisoes.map((revisao) => (
                <div
                  key={revisao.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {revisao.mesReferencia}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Contexto financeiro mensal
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                      <span className="material-symbols-outlined text-blue-600">
                        event_note
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <ItemStatus
                      label="Gasto inesperado"
                      ativo={revisao.gastoInesperado}
                    />

                    <ItemStatus
                      label="Valor incorreto"
                      ativo={revisao.valorIncorreto}
                    />

                    <ItemStatus
                      label="Revisar categorias"
                      ativo={revisao.revisarCategorias}
                    />
                  </div>

                  {revisao.observacoes && (
                    <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                      {revisao.observacoes}
                    </p>
                  )}

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-blue-600">
                        auto_awesome
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        IA futura
                      </span>
                    </div>

                    <p className="text-sm text-slate-500">
                      Futuramente, a IA poderá usar esse contexto para entender
                      melhor variações nos gastos do mês.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerRevisao(revisao.id)}
                    className="mt-5 w-full rounded-xl border border-red-100 px-5 py-3 font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    Excluir revisão
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ItemStatus({ label, ativo }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          ativo ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        {ativo ? "Sim" : "Não"}
      </span>
    </div>
  );
}

export default RevisaoMensal;