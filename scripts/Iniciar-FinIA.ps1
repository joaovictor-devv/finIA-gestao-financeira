# Windows PowerShell 5.1. No secrets are stored in the repository.
[CmdletBinding()]
param([ValidateSet('Iniciar', 'Configurar', 'Backend', 'Frontend')][string]$Modo = 'Iniciar')

$ErrorActionPreference = 'Stop'
$raizFinia = Split-Path -Parent $PSScriptRoot
$pastaConfigFinia = Join-Path $env:LOCALAPPDATA 'FinIA'
$arquivoConfigFinia = Join-Path $pastaConfigFinia 'config-local.json'

function Get-Setting([string]$Name, [string]$Fallback = '') {
    $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = [Environment]::GetEnvironmentVariable($Name, 'User')
    }
    if ([string]::IsNullOrWhiteSpace($value)) { return $Fallback }
    return $value
}

function Read-Default([string]$Label, [string]$Default) {
    $value = Read-Host "$Label [$Default]"
    if ([string]::IsNullOrWhiteSpace($value)) { return $Default }
    return $value.Trim()
}

function Protect-Input([string]$Label, [string]$Previous, [string]$Variable, [string]$Fallback = '') {
    $secret = Read-Host $Label -AsSecureString
    if ($secret.Length -gt 0) { return ConvertFrom-SecureString $secret }
    if ($Previous) { return $Previous }
    $existing = Get-Setting $Variable $Fallback
    if ($existing) {
        return ConvertFrom-SecureString (ConvertTo-SecureString $existing -AsPlainText -Force)
    }
    return ''
}

function Configure-Finia {
    $old = $null
    if (Test-Path -LiteralPath $arquivoConfigFinia) {
        $old = Get-Content -LiteralPath $arquivoConfigFinia -Raw | ConvertFrom-Json
    }
    Write-Host 'Configuracao local da FinIA. A digitacao de senhas fica oculta.' -ForegroundColor Cyan
    Write-Host 'Enter mantem o valor anterior. Sem chave, o restante do sistema funciona.'
    $url = Get-Setting 'DB_URL' 'jdbc:mysql://localhost:3306/banco_app?useSSL=false&serverTimezone=America/Sao_Paulo&allowPublicKeyRetrieval=true'
    $user = Get-Setting 'DB_USER' 'root'
    if ($old) { $url = $old.DB_URL; $user = $old.DB_USER }
    $settings = [ordered]@{
        DB_URL = Read-Default 'URL JDBC do banco' $url
        DB_USER = Read-Default 'Usuario MySQL' $user
        DB_PASSWORD_PROTECTED = Protect-Input 'Senha MySQL (Enter mantem anterior/ambiente ou padrao root)' $old.DB_PASSWORD_PROTECTED 'DB_PASSWORD' 'root'
        OPENAI_API_KEY_PROTECTED = Protect-Input 'Chave OpenAI (Enter para manter ou usar sem IA)' $old.OPENAI_API_KEY_PROTECTED 'OPENAI_API_KEY'
    }
    New-Item -ItemType Directory -Path $pastaConfigFinia -Force | Out-Null
    $settings | ConvertTo-Json | Set-Content -LiteralPath $arquivoConfigFinia -Encoding UTF8
    Write-Host 'Configuracao salva neste usuario do Windows. Reinicie os servicos para aplicar.' -ForegroundColor Green
}

function Unprotect-Value([string]$Value) {
    if (-not $Value) { return '' }
    $secure = ConvertTo-SecureString $Value
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Use-Java21 {
    $candidates = @()
    if ($env:JAVA_HOME) { $candidates += $env:JAVA_HOME }
    foreach ($folder in @((Join-Path $env:ProgramFiles 'Eclipse Adoptium'), (Join-Path $env:ProgramFiles 'Java'))) {
        if (Test-Path -LiteralPath $folder) {
            $candidates += @(Get-ChildItem -LiteralPath $folder -Directory | ForEach-Object { $_.FullName })
        }
    }
    foreach ($candidate in $candidates) {
        $release = Join-Path $candidate 'release'
        if ((Test-Path -LiteralPath $release) -and (Test-Path -LiteralPath (Join-Path $candidate 'bin\javac.exe'))) {
            if ((Get-Content -LiteralPath $release -Raw) -match 'JAVA_VERSION="21(?:\.|"|-)') {
                $env:JAVA_HOME = $candidate
                $env:Path = "$candidate\bin;$env:Path"
                return
            }
        }
    }
    throw 'JDK 21 nao encontrado. Instale o Temurin 21 ou ajuste JAVA_HOME para o JDK 21.'
}

function Start-FiniaWindow([string]$Service) {
    $arguments = '-NoLogo -NoProfile -NoExit -ExecutionPolicy Bypass -File "{0}" -Modo {1}' -f $PSCommandPath, $Service
    return Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WorkingDirectory $raizFinia -PassThru
}

function Wait-Finia([string]$Url, [int]$Seconds, $Process) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process.HasExited) { throw 'Um servico encerrou. Confira a mensagem na janela correspondente.' }
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return }
        } catch { }
        Start-Sleep -Seconds 1
    }
    throw "O servico nao ficou pronto em $Seconds segundos. Confira as janelas Backend e Frontend."
}

try {
    Set-Location -LiteralPath $raizFinia
    if (-not (Test-Path -LiteralPath 'pom.xml')) { throw 'Mantenha a pasta scripts ao lado do pom.xml.' }
    if ($Modo -eq 'Configurar') { Configure-Finia; return }

    if ($Modo -eq 'Backend') {
        $Host.UI.RawUI.WindowTitle = 'FinIA - Backend (Ctrl+C para parar)'
        Use-Java21
        $config = Get-Content -LiteralPath $arquivoConfigFinia -Raw | ConvertFrom-Json
        $env:DB_URL = $config.DB_URL
        $env:DB_USER = $config.DB_USER
        $env:DB_PASSWORD = Unprotect-Value $config.DB_PASSWORD_PROTECTED
        $env:OPENAI_API_KEY = Unprotect-Value $config.OPENAI_API_KEY_PROTECTED
        $env:OPENAI_MODEL = Get-Setting 'OPENAI_MODEL' 'gpt-5-mini'
        $env:SERVER_ADDRESS = '127.0.0.1'
        $env:SERVER_PORT = '8080'
        & mvn.cmd spring-boot:run
        if ($LASTEXITCODE -ne 0) { throw 'O backend falhou. Confira o erro do Maven acima.' }
        return
    }

    if ($Modo -eq 'Frontend') {
        $Host.UI.RawUI.WindowTitle = 'FinIA - Frontend (Ctrl+C para parar)'
        # The frontend process must not inherit backend credentials.
        foreach ($name in @('OPENAI_API_KEY', 'DB_PASSWORD', 'DB_USER', 'DB_URL')) {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
        $env:VITE_API_URL = 'http://localhost:8080'
        Set-Location -LiteralPath (Join-Path $raizFinia 'frontend')
        $hash = (Get-FileHash -LiteralPath 'package-lock.json' -Algorithm SHA256).Hash
        $stamp = 'node_modules\.finia-lock.sha256'
        if (-not (Test-Path -LiteralPath $stamp) -or (Get-Content -LiteralPath $stamp -Raw).Trim() -ne $hash) {
            & npm.cmd ci
            if ($LASTEXITCODE -ne 0) { throw 'A instalacao do frontend falhou. Confira o erro acima.' }
            Set-Content -LiteralPath $stamp -Value $hash
        }
        & npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
        if ($LASTEXITCODE -ne 0) { throw 'O frontend falhou. Confira o erro acima.' }
        return
    }

    Use-Java21
    foreach ($command in @('mvn.cmd', 'node.exe', 'npm.cmd')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "$command nao encontrado. Confira a instalacao e o PATH." }
    }
    $nodeVersion = [version]((& node.exe --version).Trim().TrimStart('v'))
    if ($nodeVersion -lt [version]'22.12.0') { throw 'Use Node.js 22.12 ou superior.' }
    foreach ($port in @(8080, 5173)) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
            throw "A porta $port ja esta em uso. Pare a execucao anterior com Ctrl+C antes de abrir novamente."
        }
    }
    if (-not (Test-Path -LiteralPath $arquivoConfigFinia)) { Configure-Finia }
    Write-Host 'Iniciando backend. Na primeira vez o Maven pode baixar dependencias...' -ForegroundColor Cyan
    $backend = Start-FiniaWindow 'Backend'
    Wait-Finia 'http://127.0.0.1:8080/ia/status' 240 $backend
    try { Invoke-WebRequest -Uri 'http://127.0.0.1:8080/metas' -UseBasicParsing -TimeoutSec 10 | Out-Null }
    catch { throw 'O backend abriu, mas o banco nao respondeu. Confira MySQL, schema e Configurar-FinIA.bat. Pare o backend antes de tentar novamente.' }
    Write-Host 'Iniciando frontend...' -ForegroundColor Cyan
    $frontend = Start-FiniaWindow 'Frontend'
    Wait-Finia 'http://localhost:5173' 240 $frontend
    Start-Process 'http://localhost:5173'
    Write-Host 'FinIA aberta! Mantenha as janelas Backend e Frontend abertas. Use Ctrl+C nas duas para parar.' -ForegroundColor Green
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
