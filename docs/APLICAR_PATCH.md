# Aplicar a entrega ao repositório

O ZIP contém uma pasta `FinIA/` com o código revisado e `finia-atualizacao.patch` com as alterações. Você pode executar a pasta completa diretamente ou aplicar o patch a uma cópia limpa do repositório.

Para preservar seu trabalho, primeiro confira `git status` e salve quaisquer alterações locais. Os comandos abaixo não descartam arquivos.

```bash
git switch dev/finia-desenvolvimento
git switch -c entrega/finia-conclusao
git apply --check caminho/finia-atualizacao.patch
git apply caminho/finia-atualizacao.patch
git diff --stat
```

O patch foi produzido contra o commit `1d1295a7a03d28cc34e288ea7d1b1e4293f1a28f`. Se a branch tiver mudado e a checagem falhar, não force a aplicação; compare as alterações antes.

Depois execute os testes descritos em `docs/EXECUTAR.md`. Para publicar usando o Git instalado e autenticado no seu computador:

```bash
git add .
git commit -m "Completa jornadas do FinIA, validações e testes"
git push -u origin entrega/finia-conclusao
```

No GitHub, compare essa branch com `dev/finia-desenvolvimento` e revise antes de integrar à `main`. Na entrega inicial a conexão era somente leitura. Se a branch `entrega/finia-conclusao` e seu pull request já estiverem no GitHub, use essa versão e não reaplique o patch.
