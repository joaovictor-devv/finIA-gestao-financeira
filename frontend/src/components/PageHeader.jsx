function PageHeader({ pergunta, titulo, descricao, acao }) {
  return (
    <header className="finia-page-header">
      <div className="min-w-0">
        {pergunta && <p className="finia-eyebrow">{pergunta}</p>}
        <h1>{titulo}</h1>
        {descricao && <p className="finia-page-description">{descricao}</p>}
      </div>
      {acao && <div className="finia-header-action">{acao}</div>}
    </header>
  );
}

export default PageHeader;
