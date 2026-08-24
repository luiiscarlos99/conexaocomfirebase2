# Copie para contas-jogo.config.ps1 e preencha as senhas.
# O .config.ps1 está no .gitignore.

$ChromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$OperaExe  = "C:\Users\SEU_USUARIO\AppData\Local\Programs\Opera GX\opera.exe"
# O script usa launcher.exe na mesma pasta (melhor para --private + URL)

$UrlBase = 'https://shadowofshinobi.com'
$NivelCacadas = '4'

# Favoritos manuais no navegador (se nao usar o launcher):
#   Caçadas:  $UrlBase/mensagens?tab=relatorios_ataque&bot_modo=cacadas
#   Caçadas (blacklist por nome):  ...&bot_blacklist_cacadas=Nome1,Nome2,Nome3
#   Caçadas (rotacao 10 contas automacao):  ...&bot_rotacao_automacao=1
#   Invasor:  $UrlBase/invasor?bot_modo=invasor
#   Invasor (last hit por data):  ...&bot_lasthit_modo=data
#   Invasor (last hit sorteio 36k-38k):  ...&bot_lasthit_modo=sorteio
# Nao use /cacadas direto — o bot exige passar pelo portao de relatorios primeiro.

# Intervalo entre abrir cada navegador (segundos)
$IntervaloEntreContas = 3

# Pausa antes de abrir a 1ª aba (Inject Code / Chrome aquecendo)
$IntervaloAntesPrimeiraConta = 5

# Pausa extra entre 1ª e 2ª conta na fase de login (Chrome costuma ser a 1ª)
$IntervaloAposPrimeiraConta = 8

# Espera apos abrir logins, antes de abrir invasor/cacadas (segundos)
$IntervaloAposSetup = 60

# DevTools (F12) — desligado; nao abre janelas extras
$AbrirDevTools = $false

# Aviso Discord ao abrir contas (canal #geral — discord-webhooks.config.ps1)
$AvisarDiscordStart = $true
# $DiscordWebhookUrl = "..."  # opcional: sobrescreve o webhook #geral
# $DiscordStartSilencioso = $false

# BotModo: 'cacadas' ou 'invasor' — define login + aba da fase 2
$Contas = @(
    @{
        Rotulo  = 'Chrome anônimo - Shiroe'
        Exe     = $ChromeExe
        Anonimo = $true
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
