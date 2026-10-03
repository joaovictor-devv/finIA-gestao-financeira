# Abrir a FinIA com dois cliques

Na raiz do projeto, abra **Iniciar-FinIA.bat**. Nao precisa abrir o VS Code.

Na primeira vez, confirme a URL e o usuario do MySQL, informe a senha que voce
ja usa e cole a chave OpenAI. A entrada de senhas e oculta. Enter mantem um
segredo salvo anteriormente ou aproveita a variavel de ambiente existente.
Na primeira configuracao, Enter sem uma senha existente usa o padrao `root`
do backend. Se sua senha for diferente, informe a senha correta.
A chave e opcional: sem ela, o planejamento continua funcionando sem o chat.

Nas proximas vezes, basta abrir **Iniciar-FinIA.bat**. Ele seleciona Java 21,
inicia backend e frontend, espera as respostas locais e abre localhost:5173.
Instala as dependencias do frontend na primeira execucao e quando o lockfile muda.
Mantenha as duas janelas abertas. Para parar, pressione Ctrl+C em cada uma
(se aparecer a pergunta para encerrar o lote, confirme) e feche as janelas.

## Alterar configuracao

Feche os servicos, abra **Configurar-FinIA.bat**, informe os novos valores e
inicie novamente. Para remover uma chave salva ou refazer tudo, exclua
`%LOCALAPPDATA%\FinIA\config-local.json` e configure novamente. Caso exista
OPENAI_API_KEY nas variaveis do Windows, remova-a tambem para iniciar sem IA.

O arquivo de configuracao fica fora do projeto. Senha e chave sao protegidas com
DPAPI do Windows, vinculadas ao usuario e computador. Elas sao descriptografadas
somente para o backend funcionar. Nao copie esse arquivo para outros usuarios,
nao publique segredos no GitHub e nunca coloque a chave em variaveis VITE_*.
Este lancador usa a configuracao salva em vez de sobrescrever as variaveis
permanentes do Windows. As configuracoes sao compartilhadas pelas copias locais
da FinIA usadas pelo mesmo usuario.

## Requisitos e mensagens

- JDK 21 instalado em JAVA_HOME, Program Files\Eclipse Adoptium ou Program Files\Java.
- Maven e Node.js 22.12+ no PATH.
- MySQL instalado, iniciado e com o banco do projeto ja preparado.
- Portas 8080 e 5173 livres. O iniciador nao encerra processos de outros programas.
- Internet para baixar dependencias e consultar a IA. As consultas a IA usam seus creditos.

O iniciador nao instala Java/MySQL, nao recria o banco, nao altera dados e nao
atualiza o Git automaticamente. Se o banco falhar, confira o servico MySQL80,
a senha e o schema antes de tentar novamente. Se houver demora no download,
consulte as janelas abertas. Corrija o erro, pare os servicos e execute de novo.

Os servidores sao vinculados ao proprio computador. O ExecutionPolicy Bypass
dos atalhos vale apenas para o processo iniciado, sem mudar a politica permanente.
Politicas corporativas podem impedir scripts, e nao sao contornadas pelo iniciador.

Validacao: sintaxe aprovada pelo parser PowerShell 7.4 e revisao do fluxo de
configuracao. A execucao completa com
Windows PowerShell 5.1, MySQL e navegador precisa ser confirmada no Windows.
