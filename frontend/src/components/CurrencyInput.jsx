function CurrencyInput({ label, ajuda, value, onChange, placeholder = "0,00", required = false, disabled = false }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-[#0A192F]">{label}</span>
      {ajuda && <span className="mt-1 block text-sm leading-5 text-slate-500">{ajuda}</span>}
      <div className="relative mt-2">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-slate-500">
          R$
        </span>
        <input
          type="number"
          min="0"
          max="9999999999.99"
          inputMode="decimal"
          step="0.01"
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="finia-input finia-number h-12 pl-12 pr-4"
        />
      </div>
    </label>
  );
}

export default CurrencyInput;
