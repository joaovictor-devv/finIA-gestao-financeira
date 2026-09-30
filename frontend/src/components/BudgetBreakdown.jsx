import { formatarMoeda } from "../utils/finance";

export default function BudgetBreakdown({ capacidade, oculto = false }) {
  const itens = [
    { label: "Renda mensal", valor: capacidade.rendaMensal, cor: "#0A192F" },
    { label: "Gastos do mês", valor: capacidade.gastosMensais, cor: "#0E7490" },
    { label: "Reserva planejada", valor: capacidade.reservaPlanejada, cor: "#41899f" },
    { label: "Para suas metas", valor: capacidade.comprometimentoMensalMetas, cor: "#688295" },
  ];
  const escala = Math.max(1, ...itens.map((item) => Math.max(0, Number(item.valor) || 0)));
  return (
    <div className="finia-budget-list" aria-label="Composição do orçamento mensal">
      {itens.map((item) => (
        <div key={item.label} className="finia-budget-row" style={{ "--bar-color": item.cor }}>
          <div>
            <span className="finia-budget-label"><span className="finia-budget-dot" aria-hidden="true" />{item.label}</span>
            <strong className="finia-number">{oculto ? "••••" : formatarMoeda(item.valor)}</strong>
          </div>
          <div className="finia-budget-track" aria-hidden="true">
            <div style={{ width: oculto ? "0%" : (Math.max(0, Number(item.valor) || 0) / escala * 100) + "%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
