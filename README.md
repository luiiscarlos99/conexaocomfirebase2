# Bot Shadow of Shinobi

Automação para [Shadow of Shinobi](https://shadowofshinobi.com/) via **Inject Code** (auto-run em `/*`), painel **Firebase** para captcha remoto e launcher PowerShell para abrir contas.

---

## Arquivos do projeto

| Arquivo | Descrição |
|---|---|
| `atkSOS.js` | Bot **Caçadas** — login, caçadas, captcha, atacar |
| `atkInvSOS.js` | Bot **Invasor** — status, invasor, combate, Firebase |
| `firebase.html` | Painel captcha (OCR + envio ao bot) |
| `scripts/abrir-contas-jogo.ps1` | Abre contas com `bot_modo` por perfil |
| `scripts/instalar-atalho-contas.ps1` | Atalho + tarefa agendada no logon |
| `scripts/discord-pc-ligado.ps1` | Aviso Discord quando o PC liga |

Locais (gitignore): `contas-jogo.config.ps1`, `discord-pc-ligado.config.ps1`, `paginas/`

---

## Inject Code — auto-run nos dois

| Regra | Auto-run | CDN |
|---|---|---|
| Caçadas | ✅ ON | `https://cdn.jsdelivr.net/gh/luiiscarlos99/conexaocomfirebase2@main/atkSOS.js` |
| Invasor | ✅ ON | `https://cdn.jsdelivr.net/gh/luiiscarlos99/conexaocomfirebase2@main/atkInvSOS.js` |

**Sem filtro de URL** na extensão. Os dois carregam em toda aba, mas **só agem** com `BOT_MODO_ABA` no `sessionStorage`:

| `sessionStorage` | Caçadas | Invasor |
|---|---|---|
| *(vazio)* | ❌ | ❌ |
| `cacadas` | ✅ login, caçadas, captcha, atacar | ❌ |
| `invasor` | ✅ login, captcha, re-login após logout | ✅ status, invasor, combate |

Abrir o jogo **sem** `?bot_modo=` = manual, sem bot (não precisa `botParar()`).

### Favoritos (logado — use `/invasor` ou `/cacadas`)

Abra direto na página do bot. O script infere o modo pelo path; se o jogo redirecionar para `/status`, o `referrer` preserva o `bot_modo`.

**Shiroe (caçadas)**
```
https://shadowofshinobi.com/cacadas?bot_modo=cacadas
```

**Shizuo / Sora (invasor)**
```
https://shadowofshinobi.com/invasor?bot_modo=invasor
```

**Login (sessão expirada — home não redireciona antes do script)**
```
https://shadowofshinobi.com/?bot_modo=cacadas&bot_user=Shiroe&bot_pass=SUA_SENHA&bot_nivel=2
https://shadowofshinobi.com/?bot_modo=invasor&bot_user=Shizuo&bot_pass=SUA_SENHA
```

**Manual (desliga bot):** `/?bot_modo=off`

**Fallback** (se `/invasor` ou `/cacadas` cair em `/status` sem modo): `/status?bot_modo=invasor` ou `/status?bot_modo=cacadas`

### Redirect `/status` — opções extras

| Opção | Como | Prós |
|---|---|---|
| **A — `/invasor` ou `/cacadas`** | Favoritos acima | Melhor: vai direto ao destino + path + referrer |
| **B — Referrer (v2.19+)** | Automático ao cair em `/status` | Recupera `bot_modo` da URL anterior |
| **C — `bot-bootstrap.js` primeiro** | Inject Code: `document_start` | Captura mais cedo |
| **D — Modo fixo por perfil** | `window.__BOT_MODO_FIXO__='invasor'` | 1 perfil = 1 modo sempre |

---

## Fluxo por modo

### Aba `cacadas`
```
Login → /status → /cacadas → atacar → (captcha → painel Firebase)
```

### Aba `invasor`
```
Login (caçadas preenche) → /status → /invasor → atacar/reload
Logout/sessão expirada → home → login automático → /invasor
Captcha → caçadas trata → volta ao invasor
```

---

## Scripts (versões atuais)

### `atkSOS.js` — v2.15

- Exige `BOT_MODO_ABA` (`cacadas` ou `invasor`)
- Modo `invasor`: só login, captcha e re-login
- Modo `cacadas`: login, caçadas (5–12 min aleatório), atacar
- Captcha: recorte da `<img>` → Firebase + Discord; OCR no painel
- Timeout captcha 10 min → `/cacadas` ou `/invasor` conforme o modo
- Código Firebase por usuário: `BOT_CODIGO_SRV_<usuario>`

### `atkInvSOS.js` — v4.8

- Exige `BOT_MODO_ABA=invasor`
- `/status` → `/invasor` | `/invasor` → ataque + reload 60s | combate → 1 min → invasor
- Sessão expirada → home (caçadas reloga)
- Firebase `comando_atacar` com debounce anti-burst
- Captcha delegado ao `atkSOS.js`

---

## Firebase

| Chave | Uso |
|---|---|
| `comandos/{CODIGO}/imagem` | PNG do captcha (bot → painel) |
| `comandos/{CODIGO}/resposta` | 5 dígitos (painel → bot) |
| `comando_atacar` | Ataque remoto invasor |

Painel: [firebase.html](https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html?codigo=SRV_XXX)

---

## Launcher (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\abrir-contas-jogo.ps1
```

Por conta no `contas-jogo.config.ps1`:

| Campo | Exemplo Shiroe | Exemplo Shizuo |
|---|---|---|
| `BotModo` | `cacadas` | `invasor` |
| Fase 1 | login com `bot_modo` + credenciais | idem |
| Fase 2 | `/cacadas?bot_modo=cacadas` | `/invasor?bot_modo=invasor` |

Atalho + auto-start: `scripts/instalar-atalho-contas.ps1`

---

## Desenvolvimento

Bump `SCRIPT_VERSAO` + `SCRIPT_ATUALIZADO` a cada alteração (`.cursor/rules/bot-scripts-versionamento.mdc`).

Opcional no console: `botParar()` / `botLigar()` / `botStatus()`
