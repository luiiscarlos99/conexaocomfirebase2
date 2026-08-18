# Copie para discord-webhooks.config.ps1 (esta copia local fica no .gitignore).
#
# Canais Discord:
#   geral   — PC ligado, abrir navegadores, avisos de sistema
#   captcha — atkSOS.js (Inject Code)
#   cacadas — atkSOS.js (Inject Code)
#   invasor — atkInvSOS.js (Inject Code)

$DiscordWebhookGeral = "https://discord.com/api/webhooks/1539273777236549732/dk6e8TcLeiSTlOnKQpBX3APe8UqzpecojIk7oVbMLyKS_WZn1HccnJel3zviSgs9rTHP"

# true = posta no canal #geral sem notificacao push (flag 4096)
$DiscordGeralSilencioso = $false
