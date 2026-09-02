import { useState } from "react";
import { Link } from "react-router-dom";

function Perfil() {
  const [perfil, setPerfil] = useState({
    nome: "Usuário FinIA",
    rendaMensal: 0,
    objetivoPrincipal: "economizar",
    perfilEconomia: "equilibrado",
  });

  const atualizarCampo = (campo, valor) => {
    setPerfil({
      ...perfil,
      [campo]: valor,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Perfil Financeiro
        </h1>

        <p className="mt-2 text-lg text-slate-500">
          Configure suas informações principais para personalizar sua experiência no FinIA.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Dados do usuário
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Nome
                </label>

                <input
                  type="text"
                  value={perfil.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Renda mensal
                </label>

                <input
                  type="number"
                  min="0"
                  value={perfil.rendaMensal}
                  onChange={(e) =>
                    atualizarCampo("rendaMensal", Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                  placeholder="Ex: 4000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Objetivo principal
                </label>

                <select
                  value={perfil.objetivoPrincipal}
                  onChange={(e) =>
                    atualizarCampo("objetivoPrincipal", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                >
                  <option value="economizar">Economizar mais</option>
                  <option value="quitar-dividas">Quitar dívidas</option>
                  <option value="comprar-algo">Comprar algo</option>
                  <option value="reserva-emergencia">
                    Criar reserva de emergência
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Perfil de economia
                </label>

                <select
                  value={perfil.perfilEconomia}
                  onChange={(e) =>
                    atualizarCampo("perfilEconomia", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600"
                >
                  <option value="conservador">Conservador</option>
                  <option value="equilibrado">Equilibrado</option>
                  <option value="agressivo">Agressivo</option>
                </select>
              </div>

              <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700">
                Salvar perfil
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                {perfil.nome ? perfil.nome.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {perfil.nome || "Usuário FinIA"}
                </h2>

                <p className="text-sm text-slate-500">
                  Assistente financeiro pessoal
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Objetivo principal
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {perfil.objetivoPrincipal}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Perfil de economia
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {perfil.perfilEconomia}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <span className="material-symbols-outlined text-blue-600">
                  assessment
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Revisão Mensal
                </h3>
                <p className="text-xs text-slate-500">
                  Revise informações importantes do mês
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-slate-500">
              Registre gastos inesperados, valores incorretos e observações que
              poderão ajudar nas análises futuras do FinIA.
            </p>

            <Link
              to="/revisao-mensal"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span className="material-symbols-outlined">edit_note</span>
              Acessar revisão
            </Link>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                <span className="material-symbols-outlined">psychology</span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Personalização futura
                </h3>
                <span className="text-xs font-semibold text-blue-600">
                  IA futura
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Futuramente, a IA do FinIA poderá usar o perfil financeiro,
              objetivo principal e estilo de economia para gerar orientações
              personalizadas ao usuário.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Perfil;