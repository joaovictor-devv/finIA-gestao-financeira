import { useEffect, useState } from "react";
import {
  buscarSugestoes,
  buscarResumoInteligente,
  buscarAnaliseGastos,
  buscarPrevisaoMetas,
} from "../services/iaService";

function Insights() {
  const [sugestoes, setSugestoes] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [analiseGastos, setAnaliseGastos] = useState(null);
  const [previsaoMetas, setPrevisaoMetas] = useState(null);

  useEffect(() => {
    buscarSugestoes().then((response) => setSugestoes(response.data));
    buscarResumoInteligente().then((response) => setResumo(response.data));
    buscarAnaliseGastos().then((response) => setAnaliseGastos(response.data));
    buscarPrevisaoMetas().then((response) => setPrevisaoMetas(response.data));
  }, []);

  const cards = [
    {
      titulo: sugestoes?.recurso || "Sugestões Inteligentes",
      mensagem:
        sugestoes?.mensagem ||
        "As sugestões financeiras serão geradas futuramente pela IA do FinIA.",
      icone: "lightbulb",
    },
    {
      titulo: resumo?.recurso || "Resumo Inteligente",
      mensagem:
        resumo?.mensagem ||
        "O resumo inteligente será gerado futuramente pela IA do FinIA.",
      icone: "auto_awesome",
    },
    {
      titulo: analiseGastos?.recurso || "Análise Inteligente de Gastos",
      mensagem:
        analiseGastos?.mensagem ||
        "A análise inteligente de gastos será realizada futuramente pela IA.",
      icone: "monitoring",
    },
    {
      titulo: previsaoMetas?.recurso || "Previsão de Metas",
      mensagem:
        previsaoMetas?.mensagem ||
        "A previsão de metas será calculada futuramente pela IA.",
      icone: "flag",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Insights Inteligentes
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Área reservada para recomendações e análises futuras da IA do FinIA.
        </p>
      </section>

      <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <span className="material-symbols-outlined">psychology</span>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Módulo de IA em desenvolvimento
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Futuramente, esta área irá utilizar os dados financeiros do
              usuário para identificar padrões, calcular probabilidades,
              analisar hábitos de consumo e gerar recomendações personalizadas.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.titulo}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="material-symbols-outlined text-blue-600">
                  {card.icone}
                </span>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                IA futura
              </span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              {card.titulo}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {card.mensagem}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Insights;