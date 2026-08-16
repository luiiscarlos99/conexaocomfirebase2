# Bot Shadow of Shinobi

Automação para o jogo [Shadow of Shinobi](https://shadowofshinobi.com/) via extensão de injeção de código (**Inject Code** / similar) ou **Tampermonkey**, com painel web no **Firebase Realtime Database** para comandos remotos (captcha e ataque no invasor).

---

## Arquivos do projeto

| Arquivo | Descrição |
|---|---|
| `atkSOS.js` | Bot de **Caçadas** — login, caçadas, atacar jogador por classe |
| `atkInvSOS.js` | Bot do **Invasor** — ataque automático/remoto no boss |
| `firebase.html` | Painel web para enviar comandos ao Firebase |

Arquivos locais ignorados pelo Git (rascunhos, HTMLs de referência, documentação antiga):

- `paginas/` — HTMLs salvos do jogo para consulta
- `invSOS.js`, `login e atk`, `sof.js` — versões/notas antigas
- `README-contexto-gemini.md` — documentação completa gerada no Gemini

---

## Instalação (Inject Code — Chrome / Opera)

### Regra 1 — Caçadas (sempre ativa)

| Campo | Valor |
|---|---|
| **Auto-run** | Ligado |
| **URL / filtro** | `https://shadowofshinobi.com/*` |
| **Código** | conteúdo de `atkSOS.js` |

### Regra 2 — Invasor (ativar ao farmar boss)

| Campo | Valor |
|---|---|
| **Auto-run** | Ligado |
| **URL / filtro** | `https://shadowofshinobi.com/status\|https://shadowofshinobi.com/invasor\|https://shadowofshinobi.com/invasor-combate` |
| **Código** | conteúdo de `atkInvSOS.js` |

> **Por que incluir `/status`?** Após o login, o jogo costuma cair em `/status`. Sem essa URL no filtro do invasor, o script nem injeta e a aba não volta sozinha para `/invasor`.

### Painel Firebase

Publique `firebase.html` no GitHub Pages ou abra localmente.

**Painel online:** [luiiscarlos99.github.io/conexaocomfirebase2/firebase.html](https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html)

---

## Dois scripts ao mesmo tempo

Os dois podem ficar **ativos em paralelo**. Cada um cuida das suas páginas:

```
┌─────────────────────────────────────────────────────────────┐
│  atkSOS.js (todas as páginas)                               │
│  → login na home (sempre, antes de qualquer skip)           │
│  → captcha, caçadas, atacar                                 │
│  → ignora /invasor* e /status (se bot invasor injetado)     │
│  → demais páginas desconhecidas → /cacadas                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  atkInvSOS.js (status + invasor + invasor-combate)          │
│  → /status → redireciona para /invasor                      │
│  → /invasor → ataca, reload, Firebase                       │
│  → /invasor-combate → espera 1min → /invasor                │
│  → qualquer outra URL no filtro → /invasor                  │
└─────────────────────────────────────────────────────────────┘
```

### Sem conflito entre os dois scripts

O `atkInvSOS.js` define `window.__BOT_INVASOR_ATIVO__ = true` ao carregar. O `atkSOS.js` verifica isso **só em `/status`**:

- **Regra invasor ligada** → os dois injetam em `/status` → caçadas cede → invasor redireciona para `/invasor`
- **Regra invasor desligada** → só caçadas injeta → `/status` vai para `/cacadas`

Nada de marcar modo no `localStorage`. Basta ligar/desligar a regra do invasor na extensão.

### Login

O login fica **sempre** com o `atkSOS.js` (página home / formulário `#login`). O filtro do invasor **não inclui a home**, então só o script de caçadas injeta lá. No código, o login é tratado **antes** de qualquer skip de invasor ou status — nunca é ignorado.

### Captcha

Captcha **não aparece** na tela do invasor. Quando ocorre, cai em URL própria (`captcha_seguranca`) — só o `atkSOS.js` trata (alerta Discord + Firebase). O filtro do invasor não precisa incluir captcha.

---

## Scripts ativos

### `atkSOS.js` — Caçadas (v2.5)

Fluxo: **Login → Caçadas → Atacar**

- **Login na home** — tratado primeiro, antes de qualquer skip (só este script injeta na home)
- Caçadas com atraso aleatório entre **5min e 12min** (ritmo humano)
- Clique automático em **Atacar**
- Captcha: alerta sonoro, print no Discord, escuta Firebase
- Ignora páginas do invasor (`/invasor*`)
- `/status` → `/cacadas` (exceto se bot invasor estiver ativo)
- Demais páginas desconhecidas → `/cacadas`

### `atkInvSOS.js` — Invasor (v4.0)

Fluxo focado em **status + invasor + pós-combate**

| Página | Ação |
|---|---|
| `/status` | Redireciona para `/invasor` |
| `/invasor` | Ataca, escuta Firebase, reload 60s (2s se conta gerenciada) |
| `/invasor-combate` | Aguarda 1min, print Discord, volta para `/invasor` |
| Login (home) | Não injeta — login fica com `atkSOS.js` |
| Sessão expirada | Volta / vai para invasor |
| Qualquer outra (no filtro) | Redireciona para `/invasor` |

- Ataque local automático (limite configurável de derrotas)
- Escuta e dispara `comando_atacar` no Firebase
- Sinalização em massa quando invasor ativo sem botão/cooldown
- Trata sessão expirada, conta gerenciada e erros HTTP 500+

---

## Configuração

Valores padrão ficam no topo de cada script. Credenciais e preferências também podem ser definidas via `localStorage` no console (F12):

```javascript
localStorage.setItem('BOT_USUARIO', 'SeuUsuario');
localStorage.setItem('BOT_SENHA', 'SuaSenha');
localStorage.setItem('BOT_NIVEL_CACADAS', '1'); // apenas atkSOS.js
```

### Sincronização automática do usuário

Quando logado, ambos os scripts leem o nome na **sidebar esquerda** (box com Vila/HP) e atualizam `BOT_USUARIO` automaticamente.

### Parâmetros principais (`atkInvSOS.js`)

| Variável | Padrão | Função |
|---|---|---|
| `LIMITE_PLAYERS_DERROTADOS` | `99999999` | Máximo de derrotas para ataque local automático |
| `TEMPO_RELOAD_PADRAO` | 60s | Intervalo de refresh na página do invasor |
| `TEMPO_RELOAD_GERENCIADA` | 2s | Refresh em conta gerenciada |
| `TEMPO_ESPERA_POS_COMBATE` | 60s | Espera após combate antes de voltar ao invasor |
| `TEMPO_TIMEOUT_CAPTCHA` | 10min | Timeout do captcha (redireciona para invasor) |

---

## Integração Firebase

| Chave | Direção | Usado por |
|---|---|---|
| `comando_recebido` | Painel → Bot | Captcha (`atkSOS.js`) |
| `comando_atacar` | Painel/Bot → Bot | Ataque remoto invasor (`atkInvSOS.js`) |
| `codigo_servidor` | Bot → Firebase | ID da sessão (`atkSOS.js`) |

### Resolver captcha

1. Bot detecta captcha e envia alerta no Discord
2. Abra `firebase.html`
3. Chave: `comando_recebido` — Valor: código do captcha
4. **ENVIAR COMANDO**

### Atacar invasor remotamente

1. Abra `firebase.html`
2. Chave: `comando_atacar` — Valor: `atacar`

---

## Fluxo resumido

```
Jogo (Inject Code)  ←——→  Firebase Realtime DB  ←——→  firebase.html
        ↓
   Discord Webhook (alertas + prints)
```

---

## Desenvolvimento

Salve HTMLs de referência em `paginas/` (ignorado pelo Git).

Documentação antiga com código completo: `README-contexto-gemini.md` (local, não versionado).
