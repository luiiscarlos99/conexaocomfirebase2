# Copie para discord-webhooks.config.ps1 (essa copia local fica no .gitignore).
#
# Canais:
#   geral   — scripts locais (PC ligado, abrir navegadores)
#   captcha / cacadas / invasor — Inject Code le do Firebase (nao deste arquivo)
#
# Para gravar captcha/cacadas/invasor/geral no Firebase:
#   powershell -ExecutionPolicy Bypass -File .\subir-webhooks-firebase.ps1

$DiscordWebhookGeral = "COLE_O_WEBHOOK_GERAL_AQUI"
$DiscordWebhookCaptcha = "COLE_O_WEBHOOK_CAPTCHA_AQUI"
$DiscordWebhookCacadas = "COLE_O_WEBHOOK_CACADAS_AQUI"
$DiscordWebhookInvasor = "COLE_O_WEBHOOK_INVASOR_AQUI"

# true = posta no canal #geral sem notificacao push (flag 4096)
$DiscordGeralSilencioso = $false
