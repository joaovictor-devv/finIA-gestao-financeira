import CurrencyInput from "./CurrencyInput";

const tipos = {
  RENDA_EXTRAORDINARIA: "Renda extra (uma vez)",
  GASTO_EXTRAORDINARIO: "Gasto extra (uma vez)",
  ALTERAR_RENDA: "Nova renda mensal",
  ALTERAR_GASTOS: "Novos gastos mensais",
  ALTERAR_APORTE_META: "Novo aporte extra mensal para metas",
};

export default function EventosCenario({ eventos, meses, metas, onChange }) {
  function alterar(index, campo, valor) {
    onChange(eventos.map((evento, i) => i === index ? { ...evento, [campo]: valor } : evento));
  }
  return <section className="space-y-4">
    <h3 className="font-bold text-[#0A192F]">Eventos do cenário</h3>
    <p className="text-sm text-slate-500">Entradas e gastos extras ocorrem uma vez. Mudanças mensais passam a valer a partir do mês escolhido. Valores são totais novos, não diferenças.</p>
    {eventos.map((evento, index) => <fieldset key={index} className="rounded-xl bg-slate-50 p-4 space-y-3">
      <legend className="font-semibold">Evento {index + 1}</legend>
      <label className="block text-sm font-bold">Tipo de evento
        <select className="finia-input mt-2 p-3" value={evento.tipo} onChange={(e) => alterar(index, "tipo", e.target.value)}>
          {Object.entries(tipos).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold">Mês do evento
        <input className="finia-input mt-2 p-3" type="number" min="1" max={meses} step="1" required value={evento.mes} onChange={(e) => alterar(index, "mes", e.target.value)} />
      </label>
      <CurrencyInput label="Valor do evento" value={evento.valor} required onChange={(e) => alterar(index, "valor", e.target.value)} />
      {evento.tipo === "ALTERAR_APORTE_META" && <label className="block text-sm font-bold">Destino do aporte
        <select className="finia-input mt-2 p-3" value={evento.metaId || ""} onChange={(e) => alterar(index, "metaId", e.target.value)}>
          <option value="">Distribuir entre as metas</option>
          {metas.map((meta) => <option key={meta.id} value={meta.id}>{meta.nome}</option>)}
        </select>
      </label>}
      <button type="button" onClick={() => onChange(eventos.filter((_, i) => i !== index))} className="text-sm font-bold text-red-700">Remover evento {index + 1}</button>
    </fieldset>)}
    <button type="button" disabled={eventos.length >= 100} className="finia-button-secondary px-4 py-3" onClick={() => onChange([...eventos, { mes: 1, tipo: "RENDA_EXTRAORDINARIA", valor: "", metaId: "" }])}>Adicionar evento</button>
  </section>;
}
