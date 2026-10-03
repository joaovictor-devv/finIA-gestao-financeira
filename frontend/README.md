# Frontend FinIA

Frontend final do TCC FinIA, construído com React, Vite, Tailwind CSS e Axios.

## Objetivo de experiência

Cada tela responde uma pergunta simples:

```text
Dashboard       -> Como estou hoje?
Meu Orçamento   -> Quanto entra e quanto sai?
Metas           -> Consigo alcançar isso?
Simulações      -> O que acontece se eu fizer isso?
FinIA           -> O que esses números significam?
Perfil          -> Quanto tenho agora?
```

A interface evita termos bancários e financeiros desnecessariamente técnicos. O princípio do produto é:

> Você informa o básico. O FinIA calcula, simula e explica.

## Rotas

```text
/               Dashboard
/planejamento   Meu Orçamento
/metas          Metas
/simulacoes     Simulações
/insights       FinIA
/perfil         Perfil
```

## Integração

As páginas consomem a API Spring Boot configurada em `src/services/api.js`.

Por padrão:

```text
http://localhost:8080
```

Para usar outro endereço, configure:

```text
VITE_API_URL
```

## Executar

```bash
npm install
npm run dev
```

## Validar

```bash
npm run lint
npm run build
```

## Identidade visual

O frontend segue o conceito **Deep Ocean Tide**:

- fonte Manrope;
- Deep Navy;
- Deep Teal;
- Seafoam/Cyan;
- fundo claro;
- cards brancos;
- estados positivos, de atenção e de problema bem diferenciados;
- layout responsivo para desktop e celular.

Todos os valores monetários exibidos ao usuário usam Real brasileiro (`R$`).

## Jornadas automatizadas

```bash
npx playwright install chromium --only-shell
npm test
```

Os testes cobrem edição de metas, rejeição de meta inviável, progresso vazio, eventos personalizados, descarte de resultado obsoleto, falhas da IA e navegação nas seis telas em desktop/mobile. As respostas da API são controladas nos testes de navegador. As fontes são empacotadas localmente, sem depender do Google Fonts em tempo de execução.

Para executar frontend, API e MySQL juntos, consulte `../docs/EXECUTAR.md`.
