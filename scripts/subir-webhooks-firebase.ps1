# Grava os webhooks Discord no Firebase RTDB (caminho fixo usado pelo Inject Code).
#
# Caminho: config/discordWebhooks
#   { captcha, cacadas, invasor, geral }
#
# Uso (na pasta scripts/):
#   powershell -ExecutionPolicy Bypass -File .\subir-webhooks-firebase.ps1
#
# Le discord-webhooks.config.ps1 (gitignore). Nao coloque URL neste arquivo.

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir 'discord-webhooks.config.ps1'
$firebaseUrl = 'https://shizuo-a07d9-default-rtdb.firebaseio.com/config/discordWebhooks.json'

if (-not (Test-Path $configPath)) {
    Write-Error "Crie $configPath a partir de discord-webhooks.config.example.ps1"
}

. $configPath

function Test-DiscordWebhookUrl {
    param([string]$Name, [string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) {
        Write-Error "Webhook '$Name' vazio no config local."
    }
    if ($Url -notmatch '^https://discord\.com/api/webhooks/\d+/.+') {
        Write-Error "Webhook '$Name' nao parece uma URL de webhook do Discord."
    }
}

Test-DiscordWebhookUrl 'captcha' $DiscordWebhookCaptcha
Test-DiscordWebhookUrl 'cacadas' $DiscordWebhookCacadas
Test-DiscordWebhookUrl 'invasor' $DiscordWebhookInvasor
Test-DiscordWebhookUrl 'geral' $DiscordWebhookGeral

$bodyObj = [ordered]@{
    captcha = $DiscordWebhookCaptcha.Trim()
    cacadas = $DiscordWebhookCacadas.Trim()
    invasor = $DiscordWebhookInvasor.Trim()
    geral   = $DiscordWebhookGeral.Trim()
}

$utf8 = New-Object System.Text.UTF8Encoding $false
$json = ($bodyObj | ConvertTo-Json -Compress)
$bytes = $utf8.GetBytes($json)

Write-Host "Gravando em $firebaseUrl ..."

$response = Invoke-RestMethod `
    -Uri $firebaseUrl `
    -Method Put `
    -Body $bytes `
    -ContentType 'application/json; charset=utf-8'

function Show-WebhookOk {
    param([string]$Name, [string]$Url)
    $tail = if ($Url.Length -gt 8) { $Url.Substring($Url.Length - 8) } else { $Url }
    Write-Host ("  {0}: ok (...{1})" -f $Name, $tail)
}

Write-Host 'Webhooks publicados no Firebase:'
Show-WebhookOk 'captcha' $response.captcha
Show-WebhookOk 'cacadas' $response.cacadas
Show-WebhookOk 'invasor' $response.invasor
Show-WebhookOk 'geral' $response.geral
Write-Host 'Inject Code le este no: config/discordWebhooks'
