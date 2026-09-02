import { useCallback, useEffect, useState } from "react";
import { buscarPrevisaoMetas } from "../services/iaService";
import { cadastrarMeta, excluirMeta, listarMetas } from "../services/metaService";

function Metas() {
  const [metas, setMetas] = useState([]);
  const [previsaoIA, setPrevisaoIA] = useState(null);
  const [mensagem, setMensagem] = useState("");

  const [novaMeta, setNovaMeta] = useState({
    nome: "",
    valorAlvo: "",
    prazoMeses: "",
    valorInicial: "",
    prioridade: "media",
    descricao: "",
  });

  const carregarMetas = useCallback(async () => {
    try {
      const response = await listarMetas();
      setMetas(response.data);
    } catch (error) {
      console.error("Erro ao listar metas:", error);
      setMensagem("Erro ao carregar metas.");
    }
  }, []);

  useEffect(() => {
    carregarMetas();

    buscarPrevisaoMetas()
      .then((response) => {
        setPrevisaoIA(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar previsão de metas IA:", error);
      });
  }, [carregarMetas]);

  const atualizarCampo = (campo, valor) => {
    setNovaMeta({
      ...novaMeta,
      [campo]: valor,
    });
  };

  const salvarMeta = async (e) => {
    e.preventDefault();
    setMensagem("");

    const dadosParaBackend = {
      nome: novaMeta.nome,
      valorAlvo: Number(novaMeta.valorAlvo),
      prazoMeses: Number(novaMeta.prazoMeses),
      valorInicial: Number(novaMeta.valorInicial || 0),
      prioridade: novaMeta.prioridade,
      descricao: novaMeta.descricao,
    };

    try {
      await cadastrarMeta(dadosParaBackend);

      setMensagem("Meta cadastrada com sucesso.");

      setNovaMeta({
        nome: "",
        valorAlvo: "",
        prazoMeses: "",
        valorInicial: "",
        prioridade: "media",
        descricao: "",
      });

      carregarMetas();
    } catch (error) {
      console.error("Erro ao cadastrar meta:", error);
      setMensagem("Erro ao cadastrar meta.");
    }
  };

  const removerMeta = async (id) => {
    setMensagem("");

    try {
      await excluirMeta(id);
      setMensagem("Meta excluída com sucesso.");
      carregarMetas();
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      setMensagem("Erro ao excluir meta.");
    }
  };

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const calcularProgresso = (valorAtual, valorAlvo) => {
    if (!valorAlvo || Number(valorAlvo) <= 0) return 0;

    return Math.min((Number(valorAtual || 0) / Number(valorAlvo)) * 100, 100);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Metas Financeiras
        </h1>

        <p className="mt-2 text-lg text-slate-500">
          Cadastre objetivos financeiros e acompanhe seu progresso.
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
                {previsaoIA?.recurso || "Previsão de Metas"}
              </h2>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                IA futura
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              {previsaoIA?.mensagem ||
                "A previsão de metas será calculada futuramente pela IA considerando progresso, histórico e probabilidade de alcance."}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form
            onSubmit={salvarMeta}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">Nova meta</h2>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Nome da meta
                </label>

                <input
                  type="text"
                  value={novaMeta.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: Reserva de emergência"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Valor alvo
                </label>

                <input
                  type="number"
                  min="0"
                  value={novaMeta.valorAlvo}
                  onChange={(e) => atualizarCampo("valorAlvo", e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: 10000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Valor inicial
                </label>

                <input
                  type="number"
                  min="0"
                  value={novaMeta.valorInicial}
                  onChange={(e) =>
                    atualizarCampo("valorInicial", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: 1500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Prazo em meses
                </label>

                <input
                  type="number"
                  min="1"
                  value={novaMeta.prazoMeses}
                  onChange={(e) =>
                    atualizarCampo("prazoMeses", e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: 12"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Prioridade
                </label>

                <select
                  value={novaMeta.prioridade}
                  onChange={(e) => atualizarCampo("prioridade", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Descrição
                </label>

                <textarea
                  value={novaMeta.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                  rows="3"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Descreva o objetivo da meta"
                ></textarea>
              </div>

              <button className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700">
                Cadastrar meta
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Metas cadastradas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Dados carregados diretamente do backend.
              </p>
            </div>
          </div>

          {metas.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300">
                flag
              </span>

              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                Nenhuma meta cadastrada
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Cadastre sua primeira meta financeira para começar o
                acompanhamento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {metas.map((meta) => {
                const progresso = calcularProgresso(
                  meta.valorInicial,
                  meta.valorAlvo
                );

                const valorFaltante =
                  Number(meta.valorAlvo || 0) - Number(meta.valorInicial || 0);

                return (
                  <div
                    key={meta.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {meta.nome}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Prazo: {meta.prazoMeses} meses
                        </p>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                        <span className="material-symbols-outlined text-blue-600">
                          flag
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-semibold text-blue-600">
                          {progresso.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-3 w-full rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full bg-blue-600"
                          style={{ width: `${progresso}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Valor inicial</span>
                        <span className="font-semibold text-slate-900">
                          {formatarMoeda(meta.valorInicial)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Valor alvo</span>
                        <span className="font-semibold text-slate-900">
                          {formatarMoeda(meta.valorAlvo)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Falta atingir</span>
                        <span className="font-semibold text-red-500">
                          {formatarMoeda(valorFaltante)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Prioridade</span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                          {meta.prioridade || "Não informada"}
                        </span>
                      </div>
                    </div>

                    {meta.descricao && (
                      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                        {meta.descricao}
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
                        Futuramente, a IA do FinIA calculará a probabilidade de
                        alcançar esta meta no prazo e sugerirá ajustes
                        personalizados.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerMeta(meta.id)}
                      className="mt-5 w-full rounded-xl border border-red-100 px-5 py-3 font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      Excluir meta
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Metas;