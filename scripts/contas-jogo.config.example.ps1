# Copie para contas-jogo.config.ps1 e preencha as senhas.
# O .config.ps1 está no .gitignore.

$ChromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$OperaExe  = "C:\Users\SEU_USUARIO\AppData\Local\Programs\Opera GX\opera.exe"

$UrlBase = 'https://shadowofshinobi.com'
$NivelCacadas = '2'

# Intervalo entre abrir cada navegador (segundos)
$IntervaloEntreContas = 3

# Espera apos abrir a aba de login antes de abrir cacadas/invasor (segundos)
$IntervaloAposSetup = 60

# Aviso Discord ao abrir contas (usa discord-pc-ligado.config.ps1 se omitir URL)
$AvisarDiscordStart = $true
# $DiscordWebhookUrl = "https://discord.com/api/webhooks/..."
# $DiscordStartSilencioso = $false

$Contas = @(
    @{
        Rotulo  = 'Chrome - Shiroe'
        Exe     = $ChromeExe
        Anonimo = $false
        Usuario = 'Shiroe'
        Senha   = 'SUA_SENHA'
    },
    @{
        Rotulo  = 'Opera - Shizuo'
        Exe     = $OperaExe
        Anonimo = $false
        Usuario = 'Shizuo'
        Senha   = 'SUA_SENHA'
    },
    @{
        Rotulo  = 'Opera anônimo - Sora'
        Exe     = $OperaExe
        Anonimo = $true
        Usuario = 'Sora'
        Senha   = 'SUA_SENHA'
    }
)
