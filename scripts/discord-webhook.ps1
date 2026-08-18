# Helpers Discord com UTF-8 correto no Windows PowerShell 5.1 (Task Scheduler le .ps1 como ANSI).

function U8 {
    param([byte[]]$Bytes)
    [System.Text.Encoding]::UTF8.GetString($Bytes)
}

function Send-DiscordWebhookUtf8 {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][hashtable]$Payload
    )

    $utf8 = New-Object System.Text.UTF8Encoding $false
    $json = $Payload | ConvertTo-Json -Depth 8 -Compress
    $body = $utf8.GetBytes($json)

    Invoke-WebRequest `
        -Uri $Url `
        -Method Post `
        -Body $body `
        -ContentType 'application/json; charset=utf-8' `
        -UseBasicParsing | Out-Null
}

function Get-DiscordWebhookGeral {
    param([string]$ScriptDir)

    $DiscordWebhookGeral = $null
    $DiscordGeralSilencioso = $null

    $webhooksConfig = Join-Path $ScriptDir 'discord-webhooks.config.ps1'
    if (Test-Path $webhooksConfig) {
        . $webhooksConfig
        if (-not [string]::IsNullOrWhiteSpace($DiscordWebhookGeral)) {
            return $DiscordWebhookGeral
        }
    }

    $legacyConfig = Join-Path $ScriptDir 'discord-pc-ligado.config.ps1'
    if (Test-Path $legacyConfig) {
        $DiscordWebhookUrl = $null
        . $legacyConfig
        if (-not [string]::IsNullOrWhiteSpace($DiscordWebhookUrl)) {
            return $DiscordWebhookUrl
        }
    }

    return $null
}

function Get-DiscordGeralSilencioso {
    param([string]$ScriptDir)

    $DiscordGeralSilencioso = $null
    $EnviarSilencioso = $null

    $webhooksConfig = Join-Path $ScriptDir 'discord-webhooks.config.ps1'
    if (Test-Path $webhooksConfig) {
        . $webhooksConfig
        if ($null -ne $DiscordGeralSilencioso) {
            return [bool]$DiscordGeralSilencioso
        }
    }

    $legacyConfig = Join-Path $ScriptDir 'discord-pc-ligado.config.ps1'
    if (Test-Path $legacyConfig) {
        . $legacyConfig
        if ($null -ne $EnviarSilencioso) {
            return [bool]$EnviarSilencioso
        }
    }

    return $false
}
