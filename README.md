# Bot Shadow of Shinobi

Automação para o jogo [Shadow of Shinobi](https://shadowofshinobi.com/) via extensão de injeção de código (**Inject Code** / similar) ou **Tampermonkey**, com painel web no **Firebase Realtime Database** para resolver captcha remotamente e disparar ataque no invasor.

---

## Arquivos do projeto

| Arquivo | Descrição |
|---|---|
| `atkSOS.js` | Bot de **Caçadas** — login, caçadas, captcha, atacar jogador |
| `atkInvSOS.js` | Bot do **Invasor** — ataque automático/remoto no boss |
| `firebase.html` | Painel captcha (OCR + envio ao bot) |
| `scripts/abrir-contas-jogo.ps1` | Abre 3 contas (login → espera → caçadas/invasor) |
| `scripts/instalar-atalho-contas.ps1` | Atalho na área de trabalho + tarefa agendada no logon |
| `scripts/discord-pc-ligado.ps1` | Aviso no Discord quando o PC liga |

Arquivos locais ignorados pelo Git:

- `paginas/` — HTMLs salvos do jogo para consulta
- `scripts/contas-jogo.config.ps1` — credenciais das contas (copie do `.example`)
- `scripts/discord-pc-ligado.config.ps1` — webhook Discord local

---

## Instalação (Inject Code — Chrome / Opera)

### Auto-run nos dois (sem filtro de URL)

Na **Inject Code**, o auto-run injeta em **todas** as páginas do jogo — **não há filtro por URL**. Por isso você cria **duas regras**, ambas com auto-run ligado:

| Regra | Auto-run | Code Source |
|---|---|---|
| Bot Caçadas | ✅ ON | `https://cdn.jsdelivr.net/gh/luiiscarlos99/conexaocomfirebase2@main/atkSOS.js` |
| Bot Invasor | ✅ ON | `https://cdn.jsdelivr.net/gh/luiiscarlos99/conexaocomfirebase2@main/atkInvSOS.js` |

Os dois scripts carregam em **toda** aba. Quem decide o que fazer é o **`bot_modo` por aba** (via URL + `sessionStorage`):

| Abrir a aba com | Comportamento |
|---|---|
| `.../cacadas?bot_modo=cacadas` | Só caçadas age |
| `.../invasor?bot_modo=invasor` | Só invasor age |
| Login (`/?bot_user=...`) | Só caçadas age (login) |

O launcher (`abrir-contas-jogo.ps1`) já abre com os parâmetros certos.

> **Importante:** não adianta “filtrar” só o invasor na extensão se ela não suporta filtro. O controle está no código + no `bot_modo` de cada aba.

### Painel Firebase (captcha)

**Online:** [luiiscarlos99.github.io/conexaocomfirebase2/firebase.html](https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html)

O bot envia no Discord um link `firebase.html?codigo=SRV_XXX` — abra esse link para ver a **mesma imagem** que foi salva no Firebase.

---

## Dois scripts ao mesmo tempo

```
┌─────────────────────────────────────────────────────────────┐
│  atkSOS.js (todas as páginas)                               │
│  → login na home (sempre, antes de qualquer skip)           │
│  → captcha, caçadas, atacar                                 │
│  → ignora /invasor* e /status se invasor presente           │
│  → demais páginas desconhecidas → /cacadas                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  atkInvSOS.js (status + invasor + invasor-combate)          │
│  → /status → redireciona para /invasor                      │
│  → /invasor → ataca, reload, Firebase                       │
│  → /invasor-combate → espera 1min → /invasor                │
│  → captcha → delegado ao atkSOS.js                          │
└─────────────────────────────────────────────────────────────┘
```

### Sem conflito (dois scripts em /*)

Cada aba guarda `BOT_MODO_ABA` no `sessionStorage`:

- **`bot_modo=cacadas`** → invasor **sai imediatamente**; caçadas cuida de login, caçadas, captcha, atacar
- **`bot_modo=invasor`** → caçadas **não age** em invasor/status; invasor cuida de status → invasor → combate

Após login, `/status` vai para **caçadas** ou **invasor** conforme o `bot_modo` da aba — não conforme “qual script existe no navegador”.

### Kill switch por aba

No console (F12):

```javascript
botParar()   // pausa o bot nesta aba
botLigar()   // reativa
botStatus()  // 'on' ou 'off'
```

---

## Scripts ativos

### `atkSOS.js` — Caçadas (v2.9)

Fluxo: **Login → Caçadas → Atacar**

- Login na home (tratado primeiro)
- Caçadas com atraso aleatório entre **5min e 12min**
- Clique automático em **Atacar**
- **Captcha:** recorta só a `<img>`, salva em Firebase, envia a **mesma imagem** ao Discord, escuta resposta em Firebase, digita no jogo
- OCR roda no **painel** (`firebase.html`), não no jogo
- Timeout captcha: **10 min** → redireciona para `/cacadas`
- `/status` → `/cacadas` (exceto se invasor presente)

### `atkInvSOS.js` — Invasor (v4.3)

| Página | Ação |
|---|---|
| `/status` | Redireciona para `/invasor` |
| `/invasor` | Ataca (local + Firebase), reload 60s (2s se conta gerenciada) |
| `/invasor-combate` | Aguarda 1min, print Discord, volta para `/invasor` |
| Captcha | Sem ação — delegado ao `atkSOS.js` |
| Login (home) | Não injeta — login fica com `atkSOS.js` |

- Ataque local com limite configurável de derrotas
- Escuta `comando_atacar` no Firebase (com debounce anti-burst)
- Trata sessão expirada, conta gerenciada e erros HTTP 500+

---

## Configuração

Valores padrão ficam no topo de cada script. Credenciais via `localStorage` ou URL do launcher:

```javascript
localStorage.setItem('BOT_USUARIO', 'SeuUsuario');
localStorage.setItem('BOT_SENHA', 'SuaSenha');
localStorage.setItem('BOT_NIVEL_CACADAS', '2'); // apenas atkSOS.js
```

O código do servidor Firebase é **por usuário**: `BOT_CODIGO_SRV_<usuario>` (evita colisão entre contas no mesmo perfil).

### Parâmetros principais (`atkInvSOS.js`)

| Variável | Padrão | Função |
|---|---|---|
| `LIMITE_PLAYERS_DERROTADOS` | `99999999` | Máximo de derrotas para ataque local automático |
| `TEMPO_RELOAD_PADRAO` | 60s | Intervalo de refresh na página do invasor |
| `TEMPO_RELOAD_GERENCIADA` | 2s | Refresh em conta gerenciada |
| `TEMPO_ESPERA_POS_COMBATE` | 60s | Espera após combate antes de voltar ao invasor |

---

## Integração Firebase

| Chave | Direção | Usado por |
|---|---|---|
| `comandos/{CODIGO}/imagem` | Bot → Painel | PNG do captcha (`atkSOS.js`) |
| `comandos/{CODIGO}/resposta` | Painel → Bot | 5 dígitos do captcha |
| `comando_atacar` | Painel/Bot → Bot | Ataque remoto invasor (`atkInvSOS.js`) |

`CODIGO` = `SRV_<slug>_<rand>` gerado por conta (ex.: `SRV_SHIROE_A3F2`).

### Resolver captcha

1. Bot detecta captcha → Discord recebe **a imagem recortada** + link do painel
2. Abra `firebase.html?codigo=SRV_XXX` (link do Discord)
3. Painel carrega imagem do Firebase, roda OCR, **confira os 5 números**
4. Clique **ENVIAR AO BOT** — bot digita e confirma no jogo

### Atacar invasor remotamente

1. No Firebase, chave `comando_atacar`, valor `atacar`

---

## Launcher (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\abrir-contas-jogo.ps1
```

Fase 1: abre 3 navegadores com login. Espera **60s**. Fase 2: abre caçadas (Shiroe) e invasor (Shizuo, Sora).

Instalar atalho + auto-start no logon:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar-atalho-contas.ps1
```

Requer `scripts/contas-jogo.config.ps1` (copie do `.example`).

---

## Fluxo resumido

```
Jogo (Inject Code)  ←——→  Firebase Realtime DB  ←——→  firebase.html (OCR)
        ↓
   Discord Webhook (captcha + prints invasor)
```

---

## Desenvolvimento

A cada alteração nos `.js`, atualize `SCRIPT_VERSAO` e `SCRIPT_ATUALIZADO` no topo do arquivo (regra em `.cursor/rules/bot-scripts-versionamento.mdc`).

Salve HTMLs de referência em `paginas/` (ignorado pelo Git).
