/**
 * Recebe reais em formato brasileiro (1.250,50) ou número simples (1250.50).
 * Retorna NaN para campos vazios, negativos, imprecisos ou acima do limite do banco.
 */
export function lerValorMonetario(valor) {
  const texto = String(valor ?? "").trim().replace(/^R\$\s*/, "").replace(/\s/g, "");
  if (!texto) return NaN;
  let canonico;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(texto)) {
    canonico = texto.replaceAll(".", "").replace(",", ".");
  } else if (/^\d+(,\d{1,2})?$/.test(texto) || /^\d+(\.\d{1,2})?$/.test(texto)) {
    canonico = texto.replace(",", ".");
  } else {
    return NaN;
  }
  const n = Number(canonico);
  return Number.isFinite(n) && n >= 0 && n <= 9999999999.99 ? n : NaN;
}

export function editarComoMoeda(valor) {
  const numero = lerValorMonetario(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(valor ?? "");
}
