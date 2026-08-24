# Bot Shadow of Shinobi

Automação para [Shadow of Shinobi](https://shadowofshinobi.com/) via **Inject Code** (auto-run em `/*`), painel **Firebase** para captcha remoto e launcher PowerShell para abrir contas.

---

## Arquivos do projeto

| Arquivo | Descrição |
|---|---|
| `bot-ranking.js` | **Script novo** — scan ranking mult (inject separado, so /ranking) |
| `bot-recovery.js` | Recuperação em erro 500 / `chrome-error://` via `window.name` |
| `bot-bootstrap.js` | Bootstrap cedo — grava modo/credenciais + URL de recuperação |
| `atkSOS.js` | Bot **Caçadas** — login, caçadas, captcha, atacar |
| `atkInvSOS.js` | Bot **Invasor** — status, invasor, combate, Firebase |
| `firebase.html` | Painel captcha (OCR + envio ao bot) |
| `scripts/abrir-contas-jogo.ps1` | Abre contas com `bot_modo` por perfil |
| `scripts/instalar-atalho-contas.ps1` | Atalho + tarefa agendada no logon |
| `scripts/discord-pc-ligado.ps1` | Aviso Discord quando o PC liga |

Locais (gitignore): `contas-jogo.config.ps1`, `discord-pc-ligado.config.ps1`, `paginas/`

---

## Inject Code — ordem e auto-run

Injetar **nesta ordem** (auto-run ON em todos):

| # | Script | CDN |
|---|---|---|
| 1 | `bot-recovery.js` | `.../bot-recovery.js` |
| 2 | `bot-bootstrap.js` | `.../bot-bootstrap.js` |
| 3 | Caçadas | `.../atkSOS.js` |
| 4 | Invasor | `.../atkInvSOS.js` |

**Ranking (script separado — nao entra na ordem acima):**

| Script | Quando injectar |
|---|---|
| `bot-ranking.js` | So na aba de ranking, ou `@match` ranking — **nao** mistura com caçadas/invasor |

Abra o ranking em **aba manual** (sem `?bot_modo=`) para caçadas/invasor nao agirem.

| Regra | Auto-run | CDN |
|---|---|---|
| Caçadas | ✅ ON | `https://cdn.jsdelivr.net/gh/luiiscarlos99/conexaocomfirebase2@main/atkSOS.js` |
| Invasor | ✅ ON | `https://cdn.jsdelivr.net/gh/luiiscarlos99/conexaocomfirebase2@main/atkInvSOS.js` |

**Sem filtro de URL** na extensão. Os dois carregam em toda aba, mas **só agem** se `?bot_modo=` foi passado na URL **desta aba** (fica no `sessionStorage` até fechar a aba):

| `?bot_modo=` na URL | Caçadas | Invasor |
|---|---|---|
| *(omitido)* | ❌ manual | ❌ manual |
| `cacadas` | ✅ login, caçadas, captcha, atacar | ❌ |
| `invasor` | ✅ login, captcha, re-login após logout | ✅ status, invasor, combate |

- **Aba nova sem `?bot_modo=`** → manual (não herda de outra aba)
- **Login na mesma aba** → modo gravado antes do redirect para `/status`
- **Credenciais** (`bot_user`, `bot_pass`) continuam no `localStorage` para re-login

### Favoritos (sempre com `?bot_modo=`)

**Shiroe (caçadas)**
```
https://shadowofshinobi.com/mensagens?tab=relatorios_ataque&bot_modo=cacadas
```

**Shizuo / Sora (invasor)**
```
https://shadowofshinobi.com/invasor?bot_modo=invasor
```

**Login (sessão expirada — home não redireciona antes do script)**
```
https://shadowofshinobi.com/?bot_modo=cacadas&bot_user=Shiroe&bot_pass=SUA_SENHA&bot_nivel=4
https://shadowofshinobi.com/?bot_modo=invasor&bot_user=Shizuo&bot_pass=SUA_SENHA
```

**Manual (desliga bot nesta aba):** `/?bot_modo=off` ou `/?bot_modo=manual`

**Recuperação de modo pós-login:** se cair em `/status`, o script lê o modo desta **aba** (`sessionStorage`). Se vazio, tenta a URL salva em `window.name` (`__BOT_RECUP__:`) — nunca `localStorage` nem referrer.

### Onde cada dado fica

| Dado | Storage | Escopo |
|------|---------|--------|
| `BOT_MODO_ABA` (invasor/cacadas/manual) | `sessionStorage` | **Só esta aba** |
| Login, senha, whitelist, rotação | `localStorage` | Todo o navegador |
| URL de recuperação | `window.name` | **Só esta aba** (backup chrome-error) |

### Redirect `/status`

| Opção | Como |
|---|---|
| **A — URL com `?bot_modo=`** | Obrigatório para ligar o bot na aba |
| **B — sessionStorage + window.name** | Automático pós-login na mesma aba |
| **C — `bot-recovery.js` + bootstrap** | Recuperação em erro 500 / `chrome-error://` |

---

## Fluxo por modo

### Aba `cacadas`
```
Login → portão /mensagens?tab=relatorios_ataque → (espera se necessário) → /cacadas → atacar → (captcha → painel Firebase)
```

### Aba `invasor`
```
Login (caçadas preenche) → /status → /invasor → atacar/reload
Logout/sessão expirada → home → login automático → /invasor
Captcha → caçadas trata → volta ao invasor
```

---

## Scripts (versões atuais)

### `atkSOS.js` — v2.84

- Modo **só desta aba** (`sessionStorage`); aba nova sem `?bot_modo=` = manual
- Exige `BOT_MODO_ABA` (`cacadas` ou `invasor`) para agir
- Modo `invasor`: login, captcha, re-login e redirect `/status` → invasor
- Modo `cacadas`: portão, caçadas, atacar, rotação automação
- Captcha: Firebase + Discord; OCR no painel

### `atkInvSOS.js` — v7.4

- Exige `BOT_MODO_ABA=invasor` (mesma regra de aba — sem referrer/localStorage)
- `/status` → `/invasor` | last hit scout/data/sorteio
- Captcha delegado ao `atkSOS.js`

### `bot-ranking.js` — v1.0 *(script novo, separado)*

- Arquivo **independente** — nao modifica `atkSOS.js` nem `atkInvSOS.js`
- Inject **so no ranking** (URL `/ranking*` ou aba dedicada)
- **Manual:** `botRankingScan()` no console
- Percorre ranking geral de 50 em 50 ate pagina vazia
- Filtra lvl > 55 e ryous < 1M (parametros na URL)
- 2 logs no fim: detalhado + lista para `bot_blacklist_cacadas`

**Parâmetros URL:**
```
/ranking?view=personagens&vila=geral&ranking=0&bot_ranking_max_ryous=1000000&bot_ranking_min_nivel=55
```

**Console:**
```javascript
botRankingScan()
botRankingScan({ maxRyous: 999000, minNivel: 56 })
botRankingParar()
botRankingStatus()
```

---

## Firebase

| Chave | Uso |
|---|---|
| `comandos/{CODIGO}/imagem` | PNG do captcha (bot → painel) |
| `comandos/{CODIGO}/resposta` | 5 dígitos (painel → bot) |
| `invasor_coord` | Last hit — baseline de players derrotados |
| `comando_atacar` | Legado v5 (removido automaticamente no v6) |

Painel: [firebase.html](https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html?codigo=SRV_XXX)

---

## Launcher (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\abrir-contas-jogo.ps1
```

Por conta no `contas-jogo.config.ps1` — **duas fases**:

| Fase | O que abre |
|---|---|
| **1 — Login** | `/?bot_modo=invasor&bot_user=...` nas **3 contas** (Shiroe inclui `bot_nivel`) |
| **Espera** | 60s — Shizuo/Sora vão para `/invasor` sozinhos |
| **2 — Jogo** | Sora → Shizuo (`/invasor`) → Shiroe (`/mensagens?tab=relatorios_ataque`, portão caçadas) |

**Fase 2 anon (Sora):** `--private` **sem** `--new-window` → nova aba `/invasor?bot_modo=invasor` na janela privada do login (Sora abre **antes** do Shizuo).

**Anonimo fase 1 (Sora):** `launcher.exe` + `--private --new-window URL`.

**Modo na tela:** `#serverID` mostra `| Bot: invasor`, `cacadas` ou `manual`.

### Atalhos

| Tipo | Precisa mudar? | Observação |
|---|---|---|
| **Área de trabalho** (`Shadow of Shinobi - Contas.lnk`) | **Não** | Só executa `abrir-contas-jogo.ps1` — URLs montadas na hora |
| **Auto-start Windows** (tarefa agendada) | **Não** | Mesmo script da fase 2 |
| **Favoritos do navegador** | **Sim** (caçadas) | Trocar `/cacadas?bot_modo=cacadas` → `/mensagens?tab=relatorios_ataque&bot_modo=cacadas` |
| **Favorito invasor** | Não | `/invasor?bot_modo=invasor` continua igual |

Atalho + auto-start: `scripts/instalar-atalho-contas.ps1`

---

## Desenvolvimento

Bump `SCRIPT_VERSAO` + `SCRIPT_ATUALIZADO` a cada alteração (`.cursor/rules/bot-scripts-versionamento.mdc`).

Opcional no console: `botParar()` / `botLigar()` / `botStatus()`
