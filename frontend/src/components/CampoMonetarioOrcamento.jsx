import { useState } from "react";
import { editarComoMoeda, lerValorMonetario } from "../utils/valorMonetario";

/**
 * Campo de moeda com entrada pt-BR. A máscara é aplicada apenas ao sair do
 * campo, sem reposicionar o cursor durante a digitação.
 */
export default function CampoMonetarioOrcamento({ label, ajuda, value, onChange, id, disabled = false }) {
  const [visitado, setVisitado] = useState(false);
  const invalido = visitado && !Number.isFinite(lerValorMonetario(value));
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-bold text-slate-800">{label}</label>
      <p id={id + "-ajuda"} className="mt-1 text-xs leading-5 text-slate-500">{ajuda}</p>
      <div className={"mt-3 flex h-14 items-center overflow-hidden rounded-xl border bg-white shadow-sm transition focus-within:border-cyan-700 focus-within:ring-[3px] focus-within:ring-cyan-700/10 " +
        (invalido ? "border-red-500" : "border-slate-300")}>
        <span aria-hidden="true" className="flex h-full items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600">R$</span>
        <input id={id} type="text" inputMode="decimal" autoComplete="off"
          aria-describedby={id + "-ajuda" + (invalido ? " " + id + "-erro" : "")}
          aria-invalid={invalido} required disabled={disabled}
          value={value} placeholder="0,00"
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => { setVisitado(true); if (Number.isFinite(lerValorMonetario(value))) onChange(editarComoMoeda(value)); }}
          className="finia-number h-full w-full min-w-0 bg-transparent px-4 text-lg font-semibold tracking-normal text-slate-900 outline-none placeholder:text-slate-400"
        />
        <span aria-hidden="true" className="pr-4 text-xs font-semibold text-slate-400">BRL</span>
      </div>
      {invalido && <p id={id + "-erro"} role="alert" className="mt-2 text-xs font-semibold text-red-700">Informe um valor válido, com até duas casas decimais.</p>}
    </div>
  );
}
