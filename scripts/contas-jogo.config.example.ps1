# Copie para contas-jogo.config.ps1 e preencha as senhas.
# O .config.ps1 está no .gitignore.

$ChromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$OperaExe  = "C:\Users\SEU_USUARIO\AppData\Local\Programs\Opera GX\opera.exe"
# O script usa launcher.exe na mesma pasta (melhor para --private + URL)

$UrlBase = 'https://shadowofshinobi.com'
$NivelCacadas = '2'

# Intervalo entre abrir cada navegador (segundos)
$IntervaloEntreContas = 3

# Espera apos abrir logins, antes de abrir invasor/cacadas (segundos)
$IntervaloAposSetup = 60

# DevTools (F12) — desligado; nao abre janelas extras
$AbrirDevTools = $false

# Aviso Discord ao abrir contas (usa discord-pc-ligado.config.ps1 se omitir URL)
$AvisarDiscordStart = $true
# $DiscordWebhookUrl = "https://discord.com/api/webhooks/..."
# $DiscordStartSilencioso = $false

# BotModo: 'cacadas' ou 'invasor' — define login + aba da fase 2
$Contas = @(
    @{
        Rotulo  = 'Chrome - Shiroe'
        Exe     = $ChromeExe
        Anonimo = $false
        BotModo = 'cacadas'
        Usuario = 'Shiroe'
        Senha   = 'SUA_SENHA'
    },
    @{
        Rotulo  = 'Opera - Shizuo'
        Exe     = $OperaExe
        Anonimo = $false
        BotModo = 'cacadas'
        Usuario = 'Shizuo'
        Senha   = 'SUA_SENHA'
    },
    @{
        Rotulo  = 'Opera anônimo - Sora'
        Exe     = $OperaExe
        Anonimo = $true
        BotModo = 'cacadas'
        Usuario = 'Sora'
        Senha   = 'SUA_SENHA'
    }
)
