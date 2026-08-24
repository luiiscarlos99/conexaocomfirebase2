// ==UserScript==
// @name         Bot Atacar - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      2.77
// @description  Automação do Caçadas/Atacar com portão via relatórios, blacklist por nome, cancelamento de missão, OCR auto captcha (5min) e Firebase (captcha).
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var BOT_MODO_KEY = 'BOT_MODO_ABA';

  // Modo so via URL (query/referrer) ou sessionStorage desta aba — nunca localStorage
  try { localStorage.removeItem('BOT_MODO_ABA'); } catch (e) {}

  function parseEsperaCacadasMinutos(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarEsperaCacadasParam(valor) {
    var minutos = parseEsperaCacadasMinutos(valor);
    if (minutos === null) return false;
    localStorage.setItem('BOT_ESPERA_CACADAS', String(minutos));
    return true;
  }

  function parseLimiteInvasor(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseInt(String(valor).replace(/\./g, '').replace(',', ''), 10);
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarLimiteInvasorParam(valor) {
    var limite = parseLimiteInvasor(valor);
    if (limite === null) return false;
    localStorage.setItem('BOT_LIMITE_INVASOR', String(limite));
    return true;
  }

  function parseNumeroInteiro(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseInt(String(valor).replace(/\./g, '').replace(',', ''), 10);
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarMaxRyousCacadasParam(valor) {
    var max = parseNumeroInteiro(valor);
    if (max === null) return false;
    localStorage.setItem('BOT_MAX_RYOUS_CACADAS', String(max));
    return true;
  }

  function gravarDiffNivelCacadasParam(valor) {
    var diff = parseNumeroInteiro(valor);
    if (diff === null) return false;
    localStorage.setItem('BOT_DIFF_NIVEL_CACADAS', String(diff));
    return true;
  }

  function gravarWhitelistCacadasParam(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return false;
    localStorage.setItem('BOT_WHITELIST_CACADAS', String(valor).trim());
    return true;
  }

  function gravarWhitelistClaCacadasParam(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return false;
    localStorage.setItem('BOT_WHITELIST_CLA_CACADAS', String(valor).trim());
    return true;
  }

  function gravarBlacklistCacadasParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim();
    if (s === '') {
      try { localStorage.removeItem('BOT_BLACKLIST_CACADAS'); } catch (e) {}
      return true;
    }
    localStorage.setItem('BOT_BLACKLIST_CACADAS', s);
    return true;
  }

  function gravarRotacaoAutomacaoParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '' || s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem('BOT_ROTACAO_AUTOMACAO'); } catch (e) {}
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_ROTACAO_AUTOMACAO', '1');
      return true;
    }
    return false;
  }

  var BOT_USUARIO_LOGIN_KEY = 'BOT_USUARIO_LOGIN';

  function gravarUsuarioLoginParam(valor) {
    if (valor === null || valor === undefined) return false;
    var u = String(valor).trim();
    if (!u) return false;
    localStorage.setItem(BOT_USUARIO_LOGIN_KEY, u);
    localStorage.setItem('BOT_USUARIO', u);
    return true;
  }

  function lerUsuarioLoginArmazenado() {
    try {
      return localStorage.getItem(BOT_USUARIO_LOGIN_KEY) || localStorage.getItem('BOT_USUARIO') || '';
    } catch (e) {
      return '';
    }
  }

  function rotacaoAutomacaoAtiva() {
    return localStorage.getItem('BOT_ROTACAO_AUTOMACAO') === '1';
  }

  function descreverRotacaoAutomacao() {
    if (!rotacaoAutomacaoAtiva()) return 'desligada';
    return 'ligada (bot_rotacao_automacao=1)';
  }

  function aplicarParamsCacadasAtacar(rp) {
    if (!rp) return;
    var w = rp.get('bot_whitelist_cacadas');
    var wc = rp.get('bot_whitelist_cla_cacadas');
    var bl = rp.get('bot_blacklist_cacadas');
    var ra = rp.get('bot_rotacao_automacao');
    var r = rp.get('bot_max_ryous_cacadas');
    var d = rp.get('bot_diff_nivel_cacadas');
    var v = rp.get('bot_min_ryous_vitoria_cacadas');
    if (w !== null && w !== '') gravarWhitelistCacadasParam(w);
    if (wc !== null && wc !== '') gravarWhitelistClaCacadasParam(wc);
    if (bl !== null) gravarBlacklistCacadasParam(bl);
    if (ra !== null) gravarRotacaoAutomacaoParam(ra);
    if (r !== null && r !== '') gravarMaxRyousCacadasParam(r);
    if (d !== null && d !== '') gravarDiffNivelCacadasParam(d);
    if (v !== null && v !== '') gravarMinRyousVitoriaCacadasParam(v);
  }

  function gravarMinRyousVitoriaCacadasParam(valor) {
    var min = parseNumeroInteiro(valor);
    if (min === null) return false;
    localStorage.setItem('BOT_MIN_RYOUS_VITORIA_CACADAS', String(min));
    return true;
  }

  function lerModoReferrer() {
    try {
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return '';
      var modo = new URLSearchParams(new URL(ref).search).get('bot_modo');
      if (modo === 'invasor' || modo === 'cacadas') return modo;
    } catch (e) {}
    return '';
  }

  function lerModoUrl(params) {
    var modo = params.get('bot_modo');
    if (modo === 'invasor' || modo === 'cacadas') return modo;

    try {
      var hash = (window.location.hash || '').replace(/^#/, '');
      if (hash) {
        var hp = new URLSearchParams(hash.charAt(0) === '?' ? hash.slice(1) : hash);
        modo = hp.get('bot_modo');
        if (modo === 'invasor' || modo === 'cacadas') return modo;
      }
    } catch (e) {}

    return lerModoReferrer();
  }

  function aplicarCredenciaisReferrer() {
    try {
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return;
      var rp = new URLSearchParams(new URL(ref).search);
      var u = rp.get('bot_user');
      var p = rp.get('bot_pass');
      var n = rp.get('bot_nivel');
      var e = rp.get('bot_espera_cacadas');
      var l = rp.get('bot_limite_invasor');
      if (u) gravarUsuarioLoginParam(u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      aplicarParamsCacadasAtacar(rp);
    } catch (e) {}
  }

  function logDiagnosticoModo(rotulo) {
    if (window.__BOT_BOOTSTRAP_LOG__) return;
    window.__BOT_BOOTSTRAP_LOG__ = true;
    var s = '(erro)';
    try { s = sessionStorage.getItem(BOT_MODO_KEY) || '(vazio)'; } catch (e) {}
    console.log('[Bot Bootstrap] URL: ' + location.href);
    console.log('[Bot Bootstrap] referrer: ' + (document.referrer || '(vazio)'));
    console.log('[Bot Bootstrap] session=' + s + ' | path=' + location.pathname);
  }

  // Bootstrap imediato — antes de qualquer return (redirect /status nao perde o modo)
  function aplicarParamsUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var modo = lerModoUrl(params);
      var modoVeioDeQuery = params.get('bot_modo') === 'invasor' || params.get('bot_modo') === 'cacadas';

      if (params.get('bot_modo') === 'off' || params.get('bot_modo') === 'manual') {
        sessionStorage.removeItem(BOT_MODO_KEY);
        return params;
      }

      if (modo === 'invasor' || modo === 'cacadas') {
        sessionStorage.setItem(BOT_MODO_KEY, modo);
      }

      var u = params.get('bot_user');
      var p = params.get('bot_pass');
      var n = params.get('bot_nivel');
      var e = params.get('bot_espera_cacadas');
      var l = params.get('bot_limite_invasor');
      if (u) gravarUsuarioLoginParam(u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      aplicarParamsCacadasAtacar(params);
      if (!u && !p && !n) aplicarCredenciaisReferrer();

      if ((u || p || n || e || l || params.get('bot_whitelist_cacadas') ||
          params.get('bot_whitelist_cla_cacadas') || params.get('bot_blacklist_cacadas') ||
          params.get('bot_rotacao_automacao') ||
          params.get('bot_max_ryous_cacadas') || params.get('bot_diff_nivel_cacadas') ||
          params.get('bot_min_ryous_vitoria_cacadas') ||
          modoVeioDeQuery) && window.history && window.history.replaceState) {
        history.replaceState(null, document.title, location.pathname + location.hash);
      }

      return params;
    } catch (e) {
      return null;
    }
  }

  function obterModoAba() {
    try {
      var modoSessao = sessionStorage.getItem(BOT_MODO_KEY);
      if (modoSessao === 'invasor' || modoSessao === 'cacadas') {
        return modoSessao;
      }
    } catch (e) {}
    return '';
  }

  function sincronizarModoAba() {
    var params = aplicarParamsUrl();
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return params;
  }

  aplicarParamsUrl();

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '2.77';
  var SCRIPT_ATUALIZADO = '24/08/2026 19:40';
  var URL_HOME = 'https://shadowofshinobi.com/';
  var TEMPO_RECUPERACAO_FALHA = 20000;
  var TEMPO_RECUPERACAO_SERVIDOR = 3000;
  var reloadAgendado = false;

  function montarUrlLoginComParams() {
    if (window.__BOT_RECOVERY__) {
      return window.__BOT_RECOVERY__.montarUrlLoginComParams();
    }

    var params = new URLSearchParams();
    var modo = obterModoAba();
    if (modo === 'invasor' || modo === 'cacadas') params.set('bot_modo', modo);

    try {
      var u = lerUsuarioLoginArmazenado();
      var p = localStorage.getItem('BOT_SENHA');
      var n = localStorage.getItem('BOT_NIVEL_CACADAS');
      var e = localStorage.getItem('BOT_ESPERA_CACADAS');
      var l = localStorage.getItem('BOT_LIMITE_INVASOR');
      var w = localStorage.getItem('BOT_WHITELIST_CACADAS');
      var wc = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS');
      var bl = localStorage.getItem('BOT_BLACKLIST_CACADAS');
      var ra = localStorage.getItem('BOT_ROTACAO_AUTOMACAO');
      var r = localStorage.getItem('BOT_MAX_RYOUS_CACADAS');
      var d = localStorage.getItem('BOT_DIFF_NIVEL_CACADAS');
      var v = localStorage.getItem('BOT_MIN_RYOUS_VITORIA_CACADAS');
      if (u) params.set('bot_user', u);
      if (p) params.set('bot_pass', p);
      if (n) params.set('bot_nivel', n);
      if (e !== null && e !== '') params.set('bot_espera_cacadas', e);
      if (l !== null && l !== '') params.set('bot_limite_invasor', l);
      if (w !== null && w !== '') params.set('bot_whitelist_cacadas', w);
      if (wc !== null && wc !== '') params.set('bot_whitelist_cla_cacadas', wc);
      if (bl !== null && bl !== '') params.set('bot_blacklist_cacadas', bl);
      if (ra === '1') params.set('bot_rotacao_automacao', '1');
      if (r !== null && r !== '') params.set('bot_max_ryous_cacadas', r);
      if (d !== null && d !== '') params.set('bot_diff_nivel_cacadas', d);
      if (v !== null && v !== '') params.set('bot_min_ryous_vitoria_cacadas', v);
    } catch (err) {}

    var qs = params.toString();
    return URL_HOME + (qs ? '?' + qs : '');
  }

  function salvarRecuperacaoAntesDeSair(url) {
    var destino = url || montarUrlLoginComParams();
    if (window.__BOT_RECOVERY__) {
      window.__BOT_RECOVERY__.salvar(destino);
    } else {
      try { window.name = '__BOT_RECUP__:' + destino; } catch (e) {}
    }
    return destino;
  }

  function agendarRecuperacaoViaLogin(motivo, delayMs) {
    if (reloadAgendado) return;
    reloadAgendado = true;

    var url = salvarRecuperacaoAntesDeSair();
    var espera = typeof delayMs === 'number' ? delayMs : TEMPO_RECUPERACAO_FALHA;

    console.warn('[Script] FALHA DE EXECUÇÃO: ' + motivo);
    setTimeout(function() {
      console.log('[Script] Recuperacao — login com parametros da sessao (sem reload)...');
      try { location.replace(url); } catch (e) { location.href = url; }
    }, espera);
  }

  if (!window.__BOT_CONTROLE__) {
    window.__BOT_CONTROLE__ = {
      parar: function() {
        try { sessionStorage.setItem(BOT_KILL_KEY, '1'); } catch (e) {}
        console.warn('[Bot] Desativado nesta aba.');
        location.reload();
      },
      ligar: function() {
        try { sessionStorage.removeItem(BOT_KILL_KEY); } catch (e) {}
        console.log('[Bot] Reativado nesta aba.');
        location.reload();
      },
      status: function() {
        try { return sessionStorage.getItem(BOT_KILL_KEY) === '1' ? 'off' : 'on'; }
        catch (e) { return 'on'; }
      }
    };
    window.botParar = window.__BOT_CONTROLE__.parar;
    window.botLigar = window.__BOT_CONTROLE__.ligar;
    window.botStatus = window.__BOT_CONTROLE__.status;
  }

  window.botRotacaoAutomacao = function(ligar) {
    if (arguments.length === 0) {
      return descreverRotacaoAutomacao();
    }
    gravarRotacaoAutomacaoParam(ligar ? '1' : '0');
    console.log('[Automacao] Rotacao: ' + descreverRotacaoAutomacao());
    return descreverRotacaoAutomacao();
  };

  window.__BOT_BUILD_CACADAS__ = { versao: SCRIPT_VERSAO, atualizado: SCRIPT_ATUALIZADO };
  console.log(
    '%c[Bot Caçadas] v' + SCRIPT_VERSAO + ' | atualizado: ' + SCRIPT_ATUALIZADO,
    'color:#2ecc71;font-weight:bold'
  );

  try {
    if (sessionStorage.getItem(BOT_KILL_KEY) === '1') {
      console.log('[Bot] Pausado nesta aba — botLigar() para reativar.');
      return;
    }
  } catch (e) {}

  var modoInicial = obterModoAba();
  if (!modoInicial) {
    logDiagnosticoModo('cacadas');
    console.log('[Script Caçadas] Sem BOT_MODO_ABA — sem acao (modo atual: vazio). Use /mensagens?tab=relatorios_ataque&bot_modo=cacadas ou /invasor?bot_modo=invasor.');
    return;
  }

  if (modoInicial !== 'cacadas' && modoInicial !== 'invasor') {
    return;
  }

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = TEMPO_RECUPERACAO_FALHA;
  var TEMPO_TIMEOUT_CAPTCHA = 600000; // 10 minutos — reload se ainda sem resposta
  var TEMPO_OCR_AUTO_CAPTCHA = 300000; // 5 min — 1a tentativa OCR auto
  var CAPTCHA_OCR_AUTO_INTERVALO_MS = 120000; // 2 min entre tentativas
  var CAPTCHA_OCR_AUTO_MAX_TENTATIVAS = 3;
  var BOT_CAPTCHA_OCR_AUTO_KEY = 'BOT_CAPTCHA_OCR_AUTO_TENTATIVAS';
  var COMANDO_ZERAR_OCR_AUTO = 'botZerarOcrAuto()';
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var URL_MISSOES = 'https://shadowofshinobi.com/missoes';
  var URL_AUTOMACAO = 'https://shadowofshinobi.com/automacao';
  var URL_RELATORIOS_ATAQUE = 'https://shadowofshinobi.com/mensagens?tab=relatorios_ataque';
  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var BOT_CACADAS_GATE_KEY = 'BOT_CACADAS_GATE_PASS';
  var BOT_CACADAS_MODO_KEY = 'BOT_CACADAS_MODO';
  var BOT_CACADAS_ALVO_NOME_KEY = 'BOT_CACADAS_ALVO_NOME';
  var BOT_ROTACAO_CICLO_KEY = 'BOT_ROTACAO_CICLO_PENDENTE';
  var BOT_ROTACAO_ASSUMIDA_KEY = 'BOT_AUTO_ROT_ASSUMIDA';
  var DISCORD_WEBHOOK_CAPTCHA = 'https://discord.com/api/webhooks/1539267966741389332/ZGwiXDDDTh4e698YVUvobQQL8FvNDREjVm0ph4tzxISa53c-7TLfF_BhiR6pl7DXt6vw';
  var DISCORD_WEBHOOK_CACADAS = 'https://discord.com/api/webhooks/1539268065190084779/9KxMifl2A0HkdvPAm5lxR6QK_oEGkvP98dtUSVyeDyxrekaNjyT5n0PcqRtE5-Xr2bWQ';
  var DISCORD_ALVO_IGNORADO_SILENCIOSO = true; // flags 4096 = sem @ping/notificacao push
  var URL_PAINEL_BASE = 'https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html';
  var captchaJaNotificado = false;
  var atacarJaProcessado = false;
  var BOT_ULTIMO_ALVO_KEY = 'BOT_ULTIMO_ALVO_CACADAS';
  var BOT_COMBATE_NOTIFICADO_KEY = 'BOT_COMBATE_NOTIFICADO';
  var timerCaptchaTimeout = null;
  var timerCaptchaOcrAuto = null;
  var captchaRespostaProcessando = false;
  var loginJaEnviado = false;
  var portaoRelatoriosAgendado = false;
  var missaoCancelamentoClicado = false;
  var automacaoAssumirEmAndamento = false;

  function marcarRotacaoCicloPendente() {
    try { sessionStorage.setItem(BOT_ROTACAO_CICLO_KEY, '1'); } catch (e) {}
  }

  function consumirRotacaoCicloPendente() {
    try {
      if (sessionStorage.getItem(BOT_ROTACAO_CICLO_KEY) === '1') {
        sessionStorage.removeItem(BOT_ROTACAO_CICLO_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function marcarContaAutomacaoAssumida() {
    try { sessionStorage.setItem(BOT_ROTACAO_ASSUMIDA_KEY, '1'); } catch (e) {}
  }

  function consumirContaAutomacaoAssumida() {
    try {
      if (sessionStorage.getItem(BOT_ROTACAO_ASSUMIDA_KEY) === '1') {
        sessionStorage.removeItem(BOT_ROTACAO_ASSUMIDA_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function extrairContasAutomacaoPagina() {
    var mapa = {};
    var forms = document.querySelectorAll('form[action*="automacao"]');

    for (var i = 0; i < forms.length; i++) {
      if (!forms[i].querySelector('input[name="assumir"]')) continue;
      var contaIdInput = forms[i].querySelector('input[name="conta_id"]');
      if (!contaIdInput) continue;

      var contaId = String(contaIdInput.value || '').trim();
      if (!contaId || mapa[contaId]) continue;

      var card = forms[i].closest('div[style*="background:#181818"]');
      var nome = '';
      if (card) {
        var strong = card.querySelector('strong');
        if (strong) nome = (strong.innerText || strong.textContent || '').trim();
      }

      mapa[contaId] = { contaId: contaId, nome: nome, form: forms[i] };
    }

    return Object.keys(mapa).map(function(k) { return mapa[k]; }).sort(function(a, b) {
      var na = parseInt(a.contaId, 10);
      var nb = parseInt(b.contaId, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return String(a.contaId).localeCompare(String(b.contaId));
    });
  }

  function escolherProximaContaAutomacao(contas) {
    if (!contas.length) return null;
    if (contas.length === 1) return contas[0];

    var atual = extrairNomeUsuarioLogado();
    var idx = -1;
    if (atual) {
      var normAtual = normalizarNomeCacadas(atual);
      for (var i = 0; i < contas.length; i++) {
        if (normalizarNomeCacadas(contas[i].nome) === normAtual) {
          idx = i;
          break;
        }
      }
    }

    if (idx === -1) return contas[0];
    return contas[(idx + 1) % contas.length];
  }

  function marcarAtaqueIniciadoRotacao() {
    if (!rotacaoAutomacaoAtiva()) return;
    try { sessionStorage.setItem('BOT_ROTACAO_APOS_ATAQUE', String(Date.now())); } catch (e) {}
  }

  function consumirAtaqueRecenteRotacao() {
    try {
      var raw = sessionStorage.getItem('BOT_ROTACAO_APOS_ATAQUE');
      if (!raw) return false;
      sessionStorage.removeItem('BOT_ROTACAO_APOS_ATAQUE');
      var ts = parseInt(raw, 10);
      return !isNaN(ts) && Date.now() - ts < 180000;
    } catch (e) {}
    return false;
  }

  function deveRotacionarAutomacaoNoPortao(decisao) {
    if (!rotacaoAutomacaoAtiva()) return false;
    if (decisao.waitMs > 0) return true;
    return consumirAtaqueRecenteRotacao();
  }

  function irParaRotacaoAutomacao(motivo) {
    console.warn('[Automacao] ' + motivo + ' — rotacionando para proxima conta...');
    marcarRotacaoCicloPendente();
    consumirGateCacadas();
    portaoRelatoriosAgendado = false;
    limparEstadoModoCacadas();
    setTimeout(function() {
      window.location.href = URL_AUTOMACAO;
    }, 1500);
  }

  function processarPaginaAutomacao() {
    if (!rotacaoAutomacaoAtiva() || !consumirRotacaoCicloPendente()) return false;
    if (automacaoAssumirEmAndamento) return true;

    var contas = extrairContasAutomacaoPagina();
    if (!contas.length) {
      console.warn('[Automacao] Nenhuma conta gerenciada encontrada — voltando ao portao.');
      irParaPortaoRelatorios('Rotacao automacao sem contas');
      return true;
    }

    var proxima = escolherProximaContaAutomacao(contas);
    if (!proxima) {
      irParaPortaoRelatorios('Rotacao automacao falhou');
      return true;
    }

    automacaoAssumirEmAndamento = true;
    marcarContaAutomacaoAssumida();
    console.warn('[Automacao] Assumindo conta: ' + proxima.nome + ' (id ' + proxima.contaId + ')');

    var btn = proxima.form.querySelector('input[type="submit"]');
    if (btn) btn.click();
    else proxima.form.submit();
    return true;
  }

  function instalarConfirmAutoOkMissao() {
    if (window.__BOT_CONFIRM_MISSAO_OK__) return;
    window.__BOT_CONFIRM_MISSAO_OK__ = true;
    var confirmOriginal = window.confirm;
    window.confirm = function(msg) {
      var t = normalizarTextoCombate(msg);
      if (t.indexOf('cancelar a miss') !== -1) {
        console.log('[Missao] confirm() auto-OK — ' + msg);
        return true;
      }
      return confirmOriginal.call(window, msg);
    };
  }

  function paginaCacadasBloqueadaPorMissao() {
    if (document.getElementById('mn_timer')) return true;

    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');

    if (texto.indexOf('cacada bloqueada') !== -1 && texto.indexOf('missao') !== -1) return true;
    if (texto.indexOf('esta em missao') !== -1 && texto.indexOf('cacar') !== -1) return true;
    return texto.indexOf('conclua ou cancele a missao') !== -1;
  }

  function obterFormCancelarMissao() {
    var forms = document.querySelectorAll('form[action*="missoes"]');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('input[name="cancelar_missao"]')) return forms[i];
    }
    return null;
  }

  function obterFormReceberMissao() {
    var btn = document.getElementById('btn_receber_mis');
    if (!btn) return null;
    if (btn.style && btn.style.display === 'none') return null;
    return btn.closest('form');
  }

  function paginaMissoesComMissaoAtiva() {
    if (obterFormCancelarMissao()) return true;
    if (document.getElementById('missao_timer_mis')) return true;

    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
    return texto.indexOf('em missao') !== -1;
  }

  function missaoConcluidaAguardandoReceber() {
    if (obterFormReceberMissao()) return true;
    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
    return texto.indexOf('missao concluida') !== -1;
  }

  function processarCacadasBloqueadaPorMissao() {
    console.warn('[Missao] Caçadas bloqueadas — missao em andamento. Indo para /missoes...');
    window.location.href = URL_MISSOES;
    return true;
  }

  function obterFormReceberCacadaTempo() {
    var forms = document.querySelectorAll('form[action*="cacadas"]');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('input[name="receber_missao"]')) return forms[i];
    }
    return null;
  }

  function paginaCacadasComMissaoTempo() {
    if (document.getElementById('mn_timer')) return false;

    if (document.getElementById('missao_timer') && obterFormReceberCacadaTempo()) return true;

    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
    return texto.indexOf('missao especial de cacada') !== -1 &&
      texto.indexOf('iniciou uma cacada') !== -1;
  }

  function cacadaTempoRecompensaPronta() {
    var btn = document.getElementById('btn_receber');
    if (btn && btn.style.display !== 'none') return true;

    var aviso = document.getElementById('missao_aviso');
    if (aviso) {
      var t = normalizarTextoCombate(aviso.innerText || aviso.textContent || '');
      if (t.indexOf('missao concluida') !== -1) return true;
    }
    return false;
  }

  function processarCacadasMissaoTempo() {
    if (cacadaTempoRecompensaPronta()) {
      var btn = document.getElementById('btn_receber');
      if (btn) {
        console.log('[Caçada tempo] Recompensa pronta — recebendo...');
        btn.click();
        return true;
      }
    }

    console.log('[Caçada tempo] Em andamento (cooldown) — voltando ao portao de relatorios.');
    irParaPortaoRelatorios('Caçada por tempo em andamento', { rotacionarAutomacao: true });
    return true;
  }

  function processarPaginaMissoes() {
    if (missaoConcluidaAguardandoReceber()) {
      var formRec = obterFormReceberMissao();
      if (formRec) {
        var btnRec = formRec.querySelector('input[type="submit"]');
        if (btnRec) {
          console.log('[Missao] Concluida — recebendo recompensa para liberar caçadas...');
          btnRec.click();
          return true;
        }
      }
    }

    if (!paginaMissoesComMissaoAtiva()) {
      console.log('[Missao] Sem missao ativa — voltando ao portao de caçadas.');
      window.location.href = URL_RELATORIOS_ATAQUE;
      return true;
    }

    if (missaoCancelamentoClicado) return true;

    var formCancel = obterFormCancelarMissao();
    if (!formCancel) {
      console.warn('[Missao] Botao cancelar_missao nao encontrado.');
      return false;
    }

    instalarConfirmAutoOkMissao();
    missaoCancelamentoClicado = true;
    console.warn('[Missao] Cancelando missao em andamento (confirm auto-OK)...');

    var btnCancel = formCancel.querySelector('input[type="submit"]');
    if (btnCancel) {
      btnCancel.click();
      return true;
    }

    formCancel.submit();
    return true;
  }

  function recarregarCredenciaisLogin() {
    USUARIO_FINAL = obterUsuarioLogin();
    SENHA_FINAL = localStorage.getItem('BOT_SENHA') || SENHA_DEFAULT;
  }

  function tentarLoginAutomatico(origem) {
    if (loginJaEnviado) return false;

    sincronizarModoAba();
    recarregarCredenciaisLogin();

    var formLogin = document.getElementById('login');
    if (!formLogin) return false;

    if (!USUARIO_FINAL || !SENHA_FINAL || USUARIO_FINAL === '?' || SENHA_FINAL === '?') {
      console.warn('[Script Caçadas] Login (' + origem + ') — credenciais ausentes no localStorage.');
      return false;
    }

    console.log('[Script Caçadas] Tela de login — preenchendo credenciais (' + origem + ')...');

    var selectServer = formLogin.querySelector('select[name="server_login"]');
    var inputUsuario = formLogin.querySelector('#usuario');
    var inputSenha = formLogin.querySelector('#senha');

    if (selectServer) {
      selectServer.value = '0';
      selectServer.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (inputUsuario) {
      inputUsuario.value = USUARIO_FINAL;
      inputUsuario.dispatchEvent(new Event('input', { bubbles: true }));
      inputUsuario.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (inputSenha) {
      inputSenha.value = SENHA_FINAL;
      inputSenha.dispatchEvent(new Event('input', { bubbles: true }));
      inputSenha.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (!inputUsuario || !inputSenha) {
      console.warn('[Script Caçadas] Login (' + origem + ') — campos #usuario / #senha nao encontrados.');
      return false;
    }

    loginJaEnviado = true;

    setTimeout(function() {
      var btnLogin = formLogin.querySelector('input[type="submit"]');
      if (btnLogin) {
        btnLogin.click();
        console.log('[Script Caçadas] Login enviado (' + origem + ').');
      } else {
        loginJaEnviado = false;
        agendarReloadFalha('Botao de login nao encontrado.');
      }
    }, 1500);

    return true;
  }

  function agendarRetentativasLogin() {
    [500, 2000, 5000, 10000, 15000].forEach(function(ms) {
      setTimeout(function() {
        if (document.getElementById('login')) {
          tentarLoginAutomatico('retry-' + ms + 'ms');
        }
      }, ms);
    });
  }

  // Configurações do Firebase Realtime Database
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCn92W9swCRMJfomc30lSn4GckgA2Esjm0",
    authDomain: "shizuo-a07d9.firebaseapp.com",
    databaseURL: "https://shizuo-a07d9-default-rtdb.firebaseio.com",
    projectId: "shizuo-a07d9",
    storageBucket: "shizuo-a07d9.firebasestorage.app",
    messagingSenderId: "558853797700",
    appId: "1:558853797700:web:71e454196334d2a5be8911",
    measurementId: "G-LDVNCKS73Z"
  };

  // Credenciais do Usuário e Configuração de Caçadas
  var USUARIO_DEFAULT = 'Shiroe';
  var USUARIO_FINAL = lerUsuarioLoginArmazenado() || USUARIO_DEFAULT;
  var USUARIO_EXIBICAO = USUARIO_FINAL;
  var SENHA_DEFAULT = 'lulacarlos';
  var SENHA_FINAL = localStorage.getItem('BOT_SENHA') || SENHA_DEFAULT;

  agendarRetentativasLogin();

  // --- DETECTA USUÁRIO LOGADO NA SIDEBAR E SINCRONIZA localStorage ---
  function extrairNomeUsuarioLogado() {
    if (document.getElementById('login')) return null;

    var colEsquerda = document.getElementById('col_esquerda');
    if (!colEsquerda) return null;

    var tabelas = colEsquerda.querySelectorAll('table');
    for (var i = 0; i < tabelas.length; i++) {
      var tabela = tabelas[i];
      var info = tabela.querySelector('td.box_preto_cor_central');
      if (!info) continue;

      var textoInfo = info.innerText || info.textContent || '';
      if (textoInfo.indexOf('Vila:') === -1 || textoInfo.indexOf('HP:') === -1) continue;

      var tdNome = tabela.querySelector('td[style*="max-width:95px"]');
      if (!tdNome) {
        var logo = tabela.querySelector('img[src*="logo_simples"]');
        if (logo && logo.parentElement) {
          tdNome = logo.parentElement.nextElementSibling;
        }
      }
      if (!tdNome) continue;

      var nome = (tdNome.innerText || tdNome.textContent || '').split('\n')[0].trim();
      if (nome && nome !== 'Conta doador' && nome !== 'Contatos') {
        return nome;
      }
    }

    return null;
  }

  function estaEmContaGerenciada() {
    if (document.querySelector('a[href*="automacao?voltar=1"]')) return true;
    var body = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    return /conta gerenciada/i.test(body);
  }

  function obterUsuarioLogin() {
    return lerUsuarioLoginArmazenado() || USUARIO_DEFAULT;
  }

  function obterUsuarioExibicao() {
    if (USUARIO_EXIBICAO && USUARIO_EXIBICAO !== obterUsuarioLogin()) {
      return USUARIO_EXIBICAO;
    }
    var nomeSidebar = extrairNomeUsuarioLogado();
    if (nomeSidebar && estaEmContaGerenciada()) return nomeSidebar;
    return obterUsuarioLogin();
  }

  function sincronizarUsuarioLocalStorage() {
    var loginSalvo = obterUsuarioLogin();
    USUARIO_FINAL = loginSalvo;

    var nomeLogado = extrairNomeUsuarioLogado();
    USUARIO_EXIBICAO = nomeLogado || loginSalvo;

    if (nomeLogado && nomeLogado !== loginSalvo && (estaEmContaGerenciada() || rotacaoAutomacaoAtiva())) {
      console.log('[Automacao] Conta ativa: ' + nomeLogado + ' | Login: ' + loginSalvo);
    }

    exibirModoAbaServerID();
  }

  function processarRotacaoContaPrincipal() {
    if (!rotacaoAutomacaoAtiva()) return false;
    if (obterModoAba() !== 'cacadas') return false;
    if (document.getElementById('login')) return false;
    if (estaEmContaGerenciada()) return false;

    var url = window.location.href;
    if (url.indexOf('automacao') !== -1) return false;
    if (url.indexOf('captcha_seguranca') !== -1) return false;

    try {
      if (sessionStorage.getItem(BOT_ROTACAO_CICLO_KEY) === '1') return false;
      if (sessionStorage.getItem(BOT_ROTACAO_ASSUMIDA_KEY) === '1') return false;
    } catch (e) {}

    console.warn('[Automacao] Conta principal detectada — indo assumir automacao...');
    marcarRotacaoCicloPendente();
    portaoRelatoriosAgendado = false;
    setTimeout(function() {
      window.location.href = URL_AUTOMACAO;
    }, 1500);
    return true;
  }

  // Nível da Caçada (Lê do localStorage ou usa '3' como padrão)
  var NIVEL_CACADAS_DEFAULT = '4';
  var NIVEL_CACADAS_FINAL = localStorage.getItem('BOT_NIVEL_CACADAS') || NIVEL_CACADAS_DEFAULT;

  // Intervalo apos ultimo ataque (relatorios) — bot_espera_cacadas (minutos) via URL ou localStorage
  // Penalidade fixa 5min pos-ataque + extra aleatorio: comercial +2-4 (7-9 total); madrugada +8-15 (13-20 total)
  var COOLDOWN_PENALIDADE_CACADAS_MS = 300000;    // 5 min obrigatorio pos-ataque
  var EXTRA_CACADAS_COMERCIAL_MIN_MS = 120000;    // +2 min
  var EXTRA_CACADAS_COMERCIAL_MAX_MS = 240000;    // +4 min
  var EXTRA_CACADAS_MADRUGADA_MIN_MS = 480000;    // +8 min
  var EXTRA_CACADAS_MADRUGADA_MAX_MS = 900000;    // +15 min
  var ESPERA_CACADAS_HORA_INICIO_LENTA = 2;       // 02:00
  var ESPERA_CACADAS_HORA_FIM_LENTA = 9;          // ate 08:59
  var GATE_CACADAS_VALIDADE_MS = 60000;

  function estaNoHorarioEsperaCacadasLenta() {
    var hora = new Date().getHours();
    return hora >= ESPERA_CACADAS_HORA_INICIO_LENTA && hora < ESPERA_CACADAS_HORA_FIM_LENTA;
  }

  function calcularIntervaloEsperaCacadas() {
    var madrugada = estaNoHorarioEsperaCacadasLenta();
    var penMs = COOLDOWN_PENALIDADE_CACADAS_MS;
    var minutos = parseEsperaCacadasMinutos(localStorage.getItem('BOT_ESPERA_CACADAS'));

    if (minutos === null) {
      if (madrugada) {
        var minMad = penMs + EXTRA_CACADAS_MADRUGADA_MIN_MS;
        var maxMad = penMs + EXTRA_CACADAS_MADRUGADA_MAX_MS;
        return {
          minMs: minMad,
          maxMs: maxMad,
          tetoOciosoMs: maxMad,
          penMs: penMs,
          origem: 'padrao-madrugada'
        };
      }
      var minCom = penMs + EXTRA_CACADAS_COMERCIAL_MIN_MS;
      var maxCom = penMs + EXTRA_CACADAS_COMERCIAL_MAX_MS;
      return {
        minMs: minCom,
        maxMs: maxCom,
        tetoOciosoMs: maxCom,
        penMs: penMs,
        origem: 'padrao-comercial'
      };
    }

    if (minutos < 2) {
      var maxCfgCurto = penMs + 120000;
      return {
        minMs: penMs,
        maxMs: maxCfgCurto,
        tetoOciosoMs: maxCfgCurto,
        penMs: penMs,
        origem: 'config',
        minutos: minutos
      };
    }

    var minCfg = penMs + Math.round((minutos - 2) * 60000);
    var maxCfg = penMs + Math.round(minutos * 60000);
    return {
      minMs: minCfg,
      maxMs: maxCfg,
      tetoOciosoMs: maxCfg,
      penMs: penMs,
      origem: 'config',
      minutos: minutos
    };
  }

  function sortearTargetEsperaCacadas(iv) {
    var intervalo = iv || calcularIntervaloEsperaCacadas();
    if (intervalo.minMs >= intervalo.maxMs) return intervalo.maxMs;
    return Math.floor(Math.random() * (intervalo.maxMs - intervalo.minMs + 1)) + intervalo.minMs;
  }

  function descreverEsperaCacadas() {
    var iv = calcularIntervaloEsperaCacadas();
    var penMin = Math.round(iv.penMs / 60000);
    var minMin = Math.round(iv.minMs / 60000);
    var maxMin = Math.round(iv.maxMs / 60000);
    if (iv.origem === 'padrao-madrugada') {
      return penMin + 'min cooldown + 8-15min (' + minMin + '-' + maxMin + ' total, madrugada)';
    }
    if (iv.origem === 'padrao-comercial') {
      return penMin + 'min cooldown + 2-4min (' + minMin + '-' + maxMin + ' total, comercial)';
    }
    return penMin + 'min cooldown + extra (' + minMin + '-' + maxMin + ' total, bot_espera_cacadas=' +
      iv.minutos + ')';
  }

  function parseDataHoraRelatorioAtaque(texto) {
    var m = String(texto || '').trim().match(/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
    if (!m) return null;

    var dia = parseInt(m[1], 10);
    var mes = parseInt(m[2], 10) - 1;
    var hora = parseInt(m[3], 10);
    var minuto = parseInt(m[4], 10);
    var agora = new Date();
    var ano = agora.getFullYear();
    var dt = new Date(ano, mes, dia, hora, minuto, 0, 0);

    if (dt.getTime() > agora.getTime() + 86400000) {
      dt = new Date(ano - 1, mes, dia, hora, minuto, 0, 0);
    }
    if (dt.getTime() > agora.getTime() + 3600000) {
      dt.setDate(dt.getDate() - 1);
    }

    return dt.getTime();
  }

  function extrairUltimoAtaqueRelatorios() {
    var col = document.getElementById('col_direita') || document;
    var links = col.querySelectorAll('a[href*="relatorios_ataque"]');

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('ver=') === -1) continue;

      var texto = (links[i].innerText || links[i].textContent || '').replace(/\s+/g, ' ').trim();
      var textoNorm = normalizarTextoCombate(texto);
      if (textoNorm.indexOf('voce atacou') === -1) continue;

      var matchData = texto.match(/(\d{2}\/\d{2}\s+\d{2}:\d{2})/);
      if (!matchData) continue;

      var ts = parseDataHoraRelatorioAtaque(matchData[1]);
      if (ts === null) continue;

      return {
        ts: ts,
        dataTexto: matchData[1],
        resumo: texto
      };
    }

    return null;
  }

  function extrairVitimaDoRelatorioAtaque(texto) {
    var norm = normalizarTextoCombate(texto);
    if (norm.indexOf('voce atacou') === -1) return null;

    var m = String(texto || '').match(/voce atacou\s+(.+?)(?:\s+[-–—]\s|\s+em\s|\.\s*$|$)/i);
    if (m) return m[1].trim();

    m = String(texto || '').match(/voce atacou\s+(.+)/i);
    return m ? m[1].trim() : null;
  }

  function extrairAtaquesRelatorios() {
    var col = document.getElementById('col_direita') || document;
    var links = col.querySelectorAll('a[href*="relatorios_ataque"]');
    var ataques = [];

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('ver=') === -1) continue;

      var texto = (links[i].innerText || links[i].textContent || '').replace(/\s+/g, ' ').trim();
      var vitima = extrairVitimaDoRelatorioAtaque(texto);
      if (!vitima) continue;

      var matchData = texto.match(/(\d{2}\/\d{2}\s+\d{2}:\d{2})/);
      var ts = matchData ? parseDataHoraRelatorioAtaque(matchData[1]) : null;

      ataques.push({
        ts: ts,
        vitima: vitima,
        vitimaNorm: normalizarNomeCacadas(vitima),
        dataTexto: matchData ? matchData[1] : null,
        resumo: texto
      });
    }

    return ataques;
  }

  function calcularEsperaAposUltimoAtaque(ultimoAtaqueMs) {
    var iv = calcularIntervaloEsperaCacadas();
    var agora = Date.now();

    if (ultimoAtaqueMs === null || ultimoAtaqueMs === undefined || isNaN(ultimoAtaqueMs)) {
      return {
        waitMs: 0,
        motivo: 'sem historico de ataque — caçada imediata',
        iv: iv
      };
    }

    var elapsedMs = agora - ultimoAtaqueMs;
    if (elapsedMs < 0) elapsedMs = 0;

    var targetMs = sortearTargetEsperaCacadas(iv);
    var tetoMs = iv.tetoOciosoMs;
    var elapsedMin = (elapsedMs / 60000).toFixed(1);
    var targetMin = (targetMs / 60000).toFixed(1);
    var tetoMin = (tetoMs / 60000).toFixed(0);

    if (elapsedMs >= tetoMs) {
      return {
        waitMs: 0,
        motivo: 'teto ocioso atingido (' + elapsedMin + 'min >= ' + tetoMin + 'min)',
        elapsedMs: elapsedMs,
        targetMs: targetMs,
        tetoMs: tetoMs,
        iv: iv
      };
    }

    if (elapsedMs >= targetMs) {
      return {
        waitMs: 0,
        motivo: 'intervalo alvo atingido (' + elapsedMin + 'min >= ' + targetMin + 'min)',
        elapsedMs: elapsedMs,
        targetMs: targetMs,
        tetoMs: tetoMs,
        iv: iv
      };
    }

    var waitBrutoMs = targetMs - elapsedMs;
    var waitMaxMs = tetoMs - elapsedMs;
    var waitMs = Math.min(waitBrutoMs, waitMaxMs);

    if (waitMs <= 0) {
      return {
        waitMs: 0,
        motivo: 'espera zero — caçada imediata',
        elapsedMs: elapsedMs,
        targetMs: targetMs,
        tetoMs: tetoMs,
        iv: iv
      };
    }

    return {
      waitMs: waitMs,
      motivo: 'aguardando ' + Math.round(waitMs / 1000) + 's (' +
        elapsedMin + 'min desde ultimo, alvo ' + targetMin + 'min, teto ' + tetoMin + 'min)',
      elapsedMs: elapsedMs,
      targetMs: targetMs,
      tetoMs: tetoMs,
      iv: iv
    };
  }

  function liberarGateCacadas() {
    try { sessionStorage.setItem(BOT_CACADAS_GATE_KEY, String(Date.now())); } catch (e) {}
  }

  function gateCacadasLiberado() {
    try {
      var raw = sessionStorage.getItem(BOT_CACADAS_GATE_KEY);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      if (isNaN(ts) || Date.now() - ts > GATE_CACADAS_VALIDADE_MS) {
        sessionStorage.removeItem(BOT_CACADAS_GATE_KEY);
        return false;
      }
      return true;
    } catch (e) {}
    return false;
  }

  function consumirGateCacadas() {
    try { sessionStorage.removeItem(BOT_CACADAS_GATE_KEY); } catch (e) {}
  }

  function irParaCacadasLiberado(motivo) {
    console.log('[Caçadas] ' + motivo + ' — redirecionando para caçadas.');
    liberarGateCacadas();
    window.location.href = URL_CACADAS;
  }

  function irParaPortaoRelatorios(motivo, opcoes) {
    var opts = opcoes || {};
    if (opts.rotacionarAutomacao && rotacaoAutomacaoAtiva()) {
      irParaRotacaoAutomacao(motivo);
      return;
    }
    console.log('[Caçadas] ' + motivo + ' — portao relatorios de ataque...');
    consumirGateCacadas();
    portaoRelatoriosAgendado = false;
    setTimeout(function() {
      window.location.href = URL_RELATORIOS_ATAQUE;
    }, 1500);
  }

  function processarPortaoRelatoriosAtaque() {
    if (portaoRelatoriosAgendado) return true;

    var ultimo = extrairUltimoAtaqueRelatorios();
    var decisao = calcularEsperaAposUltimoAtaque(ultimo ? ultimo.ts : null);

    if (ultimo) {
      console.log('[Caçadas] Ultimo ataque: ' + ultimo.dataTexto + ' — ' + ultimo.resumo);
    } else {
      console.warn('[Caçadas] Nenhum relatorio "Voce atacou" encontrado.');
    }

    console.log('[Caçadas] Portao — ' + decisao.motivo);

    if (deveRotacionarAutomacaoNoPortao(decisao)) {
      var seg = decisao.waitMs > 0 ? Math.round(decisao.waitMs / 1000) + 's cooldown' : 'ataque recente';
      irParaRotacaoAutomacao('Portao (' + seg + ')');
      return true;
    }

    function irAposResolver() {
      if (decisao.waitMs <= 0) {
        irParaCacadasLiberado('portao-imediato');
        return;
      }

      portaoRelatoriosAgendado = true;
      var segundos = Math.round(decisao.waitMs / 1000);
      console.log('[Caçadas] Portao — aguardando ' + segundos + 's nesta pagina...');

      setTimeout(function() {
        var ultimoPos = extrairUltimoAtaqueRelatorios();
        var decisaoPos = calcularEsperaAposUltimoAtaque(ultimoPos ? ultimoPos.ts : null);
        console.log('[Caçadas] Portao pos-espera — ' + decisaoPos.motivo);
        resolverBlacklistNoPortao(decisaoPos, function() {
          irParaCacadasLiberado('portao-pos-espera (' + segundos + 's)');
        }, { aposEsperaNoPortao: true });
      }, decisao.waitMs);
    }

    if (decisao.waitMs <= 0) {
      resolverBlacklistNoPortao(decisao, irAposResolver, { aposEsperaNoPortao: false });
    } else {
      irAposResolver();
    }

    return true;
  }

  // --- Whitelist = nomes/clas que NAO atacar (pagina atacar) ---
  var WHITELIST_CACADAS_DEFAULT = 'yoruhime,bardo,shizuo,sora,shiroe';
  var WHITELIST_CLA_CACADAS_DEFAULT = 'akatsuki';
  var MAX_RYOUS_CACADAS_DEFAULT = 30000000;
  var DIFF_NIVEL_CACADAS_DEFAULT = 20;

  function normalizarNomeCacadas(nome) {
    return String(nome || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function obterWhitelistCacadas() {
    var raw = localStorage.getItem('BOT_WHITELIST_CACADAS');
    if (!raw) raw = WHITELIST_CACADAS_DEFAULT;
    return raw.split(',').map(function(s) { return normalizarNomeCacadas(s); }).filter(Boolean);
  }

  function obterMaxRyousCacadas() {
    var n = parseNumeroInteiro(localStorage.getItem('BOT_MAX_RYOUS_CACADAS'));
    return n === null ? MAX_RYOUS_CACADAS_DEFAULT : n;
  }

  function obterDiffNivelCacadas() {
    var n = parseNumeroInteiro(localStorage.getItem('BOT_DIFF_NIVEL_CACADAS'));
    return n === null ? DIFF_NIVEL_CACADAS_DEFAULT : n;
  }

  function obterWhitelistClaCacadas() {
    var raw = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS');
    if (!raw) raw = WHITELIST_CLA_CACADAS_DEFAULT;
    return raw.split(',').map(function(s) { return normalizarNomeCacadas(s); }).filter(Boolean);
  }

  function descreverWhitelistClaAtacar() {
    var lista = obterWhitelistClaCacadas();
    var sufixo = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS')
      ? ' (bot_whitelist_cla_cacadas)'
      : ' (padrao)';
    return 'nao atacar cla: ' + lista.join(', ') + sufixo;
  }

  function descreverWhitelistAtacar() {
    var lista = obterWhitelistCacadas();
    var sufixo = localStorage.getItem('BOT_WHITELIST_CACADAS')
      ? ' (bot_whitelist_cacadas)'
      : ' (padrao)';
    return 'nao atacar: ' + lista.join(', ') + sufixo;
  }

  function obterBlacklistCacadas() {
    var raw = localStorage.getItem('BOT_BLACKLIST_CACADAS');
    if (!raw || !String(raw).trim()) return [];
    return String(raw).split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  }

  function blacklistCacadasAtiva() {
    return obterBlacklistCacadas().length > 0;
  }

  function descreverBlacklistCacadas() {
    var lista = obterBlacklistCacadas();
    if (!lista.length) {
      return 'vazia (caçada por nivel se disponivel)';
    }
    var sufixo = localStorage.getItem('BOT_BLACKLIST_CACADAS')
      ? ' (bot_blacklist_cacadas)'
      : '';
    return lista.join(', ') + sufixo;
  }

  function escHtmlPainelServer(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function obterNomeAutomacaoPainel() {
    var login = obterUsuarioLogin();
    var ativo = obterUsuarioExibicao();
    if (!ativo || ativo === login) return '';
    if (estaEmContaGerenciada() || rotacaoAutomacaoAtiva()) return ativo;
    return '';
  }

  function resumirTextoPainel(texto, max) {
    var s = String(texto || '');
    var lim = typeof max === 'number' ? max : 72;
    if (s.length <= lim) return s;
    return s.substring(0, lim - 3) + '...';
  }

  function montarHtmlPainelServerID(el) {
    if (!el.dataset.botServerBase) {
      var primeira = (el.textContent || '').split('\n')[0];
      el.dataset.botServerBase = primeira.replace(/\s*\|\s*Bot:.*$/i, '').trim();
    }

    var modo = '';
    try { modo = sessionStorage.getItem(BOT_MODO_KEY) || ''; } catch (e) {}
    var label = (modo === 'invasor' || modo === 'cacadas') ? modo : 'manual';
    var login = obterUsuarioLogin();
    var auto = obterNomeAutomacaoPainel();
    var linhas = [
      escHtmlPainelServer(el.dataset.botServerBase),
      'Bot: <b>' + escHtmlPainelServer(label) + '</b>',
      'Principal: ' + escHtmlPainelServer(login)
    ];

    if (auto) {
      linhas.push('Auto: <b>' + escHtmlPainelServer(auto) + '</b>');
    }

    linhas.push('<span style="opacity:.65">—</span>');
    linhas.push(
      'Nivel: ' + escHtmlPainelServer(NIVEL_CACADAS_FINAL) +
      ' | Rotacao: ' + escHtmlPainelServer(descreverRotacaoAutomacao())
    );
    linhas.push('Espera: ' + escHtmlPainelServer(resumirTextoPainel(descreverEsperaCacadas(), 48)));
    linhas.push('Blacklist: ' + escHtmlPainelServer(resumirTextoPainel(descreverBlacklistCacadas(), 64)));
    linhas.push(
      'Max ryous: ' + escHtmlPainelServer(formatarNumeroBr(obterMaxRyousCacadas())) +
      ' | Diff: ' + escHtmlPainelServer(String(obterDiffNivelCacadas())) +
      ' | Min vit: ' + escHtmlPainelServer(formatarNumeroBr(obterMinRyousVitoriaCacadas()))
    );
    linhas.push(
      'WL nome: ' + escHtmlPainelServer(resumirTextoPainel(descreverWhitelistAtacar(), 40))
    );
    linhas.push(
      'WL cla: ' + escHtmlPainelServer(resumirTextoPainel(descreverWhitelistClaAtacar(), 40))
    );
    linhas.push('v' + escHtmlPainelServer(SCRIPT_VERSAO));

    return linhas.join('<br>');
  }

  function exibirModoAbaServerID() {
    function aplicar() {
      var el = document.getElementById('serverID');
      if (!el) return false;
      el.style.lineHeight = '1.35';
      el.style.fontSize = '9pt';
      el.style.whiteSpace = 'normal';
      el.innerHTML = montarHtmlPainelServerID(el);
      return true;
    }
    if (aplicar()) return;
    setTimeout(aplicar, 800);
    setTimeout(aplicar, 2500);
  }

  function extrairNinjaNaoEncontradoCacadas() {
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('ninja nao encontrado') === -1) continue;

      var m = texto.match(/ninja n[aã]o encontrado:\s*(.+)$/i);
      return m ? m[1].trim() : null;
    }

    return null;
  }

  function removerNomeBlacklistCacadas(nome) {
    if (!nome) return false;

    var lista = obterBlacklistCacadas();
    if (!lista.length) return false;

    var normRemover = normalizarNomeCacadas(nome);
    var nova = lista.filter(function(n) {
      return normalizarNomeCacadas(n) !== normRemover;
    });

    if (nova.length === lista.length) return false;

    if (nova.length === 0) {
      try { localStorage.removeItem('BOT_BLACKLIST_CACADAS'); } catch (e) {}
    } else {
      localStorage.setItem('BOT_BLACKLIST_CACADAS', nova.join(','));
    }

    console.warn('[Blacklist] Removido da lista (ninja nao encontrado): ' + nome);
    console.log('[Blacklist] Lista atual: ' + descreverBlacklistCacadas());
    return true;
  }

  function processarNinjaNaoEncontradoCacadas() {
    var nome = extrairNinjaNaoEncontradoCacadas();
    if (!nome) return false;

    removerNomeBlacklistCacadas(nome);
    limparEstadoModoCacadas();
    irParaPortaoRelatorios('Ninja nao encontrado: ' + nome, { rotacionarAutomacao: true });
    return true;
  }

  function mapaAtacadosNoRelatorio(ataques) {
    var mapa = {};
    for (var i = 0; i < ataques.length; i++) {
      if (ataques[i].vitimaNorm) mapa[ataques[i].vitimaNorm] = true;
    }
    return mapa;
  }

  function nomesBlacklistJaAtacadosNoRelatorio(ataques) {
    var lista = obterBlacklistCacadas();
    var mapa = mapaAtacadosNoRelatorio(ataques);
    var atacados = [];
    lista.forEach(function(nome) {
      if (mapa[normalizarNomeCacadas(nome)]) atacados.push(nome);
    });
    return atacados;
  }

  function escolherProximoAlvoBlacklist(ataques) {
    var lista = obterBlacklistCacadas();
    var mapa = mapaAtacadosNoRelatorio(ataques);
    var pendentes = [];

    for (var i = 0; i < lista.length; i++) {
      var nome = lista[i];
      if (!mapa[normalizarNomeCacadas(nome)]) pendentes.push(nome);
    }

    if (!pendentes.length) return null;
    return pendentes[Math.floor(Math.random() * pendentes.length)];
  }

  function limparEstadoModoCacadas() {
    try {
      sessionStorage.removeItem(BOT_CACADAS_MODO_KEY);
      sessionStorage.removeItem(BOT_CACADAS_ALVO_NOME_KEY);
      sessionStorage.removeItem('BOT_ROTACAO_APOS_ATAQUE');
    } catch (e) {}
  }

  function definirModoCacadasClasse(motivo) {
    try {
      sessionStorage.setItem(BOT_CACADAS_MODO_KEY, 'classe');
      sessionStorage.removeItem(BOT_CACADAS_ALVO_NOME_KEY);
    } catch (e) {}
    console.log('[Blacklist] Modo classe — ' + motivo);
  }

  function definirModoCacadasBlacklist(nome) {
    try {
      sessionStorage.setItem(BOT_CACADAS_MODO_KEY, 'blacklist');
      sessionStorage.setItem(BOT_CACADAS_ALVO_NOME_KEY, nome);
    } catch (e) {}
    console.warn('[Blacklist] Proximo alvo por nome: ' + nome);
  }

  function obterModoCacadasSessao() {
    try { return sessionStorage.getItem(BOT_CACADAS_MODO_KEY) || 'classe'; } catch (e) {}
    return 'classe';
  }

  function obterAlvoNomeCacadasSessao() {
    try { return sessionStorage.getItem(BOT_CACADAS_ALVO_NOME_KEY) || ''; } catch (e) {}
    return '';
  }

  function cacadaAtualPorNomeBlacklist() {
    return obterModoCacadasSessao() === 'blacklist' && !!obterAlvoNomeCacadasSessao();
  }

  function decisaoIgnoraBlacklist(decisao, aposEsperaNoPortao) {
    // So apos esperar no portao: se o teto ocioso forcar caçada, evita blacklist (alvo pode estar em penalidade).
    // Ao chegar com caçada imediata (ja passou do teto), blacklist continua valendo.
    if (!aposEsperaNoPortao) return false;
    return !!(decisao && decisao.waitMs <= 0 && decisao.motivo &&
      decisao.motivo.indexOf('teto ocioso') !== -1);
  }

  function resolverBlacklistNoPortao(decisao, callback, opcoes) {
    var opts = opcoes || {};
    var aposEsperaNoPortao = !!opts.aposEsperaNoPortao;
    limparEstadoModoCacadas();

    if (!blacklistCacadasAtiva()) {
      definirModoCacadasClasse('lista vazia ou nao configurada');
      callback();
      return;
    }

    if (decisaoIgnoraBlacklist(decisao, aposEsperaNoPortao)) {
      definirModoCacadasClasse('teto apos espera no portao — evita penalidade, ignorando blacklist');
      callback();
      return;
    }

    var ataques = extrairAtaquesRelatorios();
    var jaAtacados = nomesBlacklistJaAtacadosNoRelatorio(ataques);
    if (jaAtacados.length) {
      console.log('[Blacklist] Ja no relatorio de ataque: ' + jaAtacados.join(', '));
    }

    var proximo = escolherProximoAlvoBlacklist(ataques);
    if (proximo) {
      definirModoCacadasBlacklist(proximo);
    } else {
      console.warn('[Blacklist] Todos os nomes da lista ja constam no relatorio — caçada por nivel (se disponivel).');
      definirModoCacadasClasse('todos os nomes ja no relatorio');
    }
    callback();
  }

  function parseNumeroBr(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var s = String(valor).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function formatarNumeroBr(n) {
    if (n === null || n === undefined || isNaN(n)) return '?';
    try {
      return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      return String(n);
    }
  }

  function extrairValorLinhaTabela(rotuloParcial, escopo) {
    var root = escopo || document.getElementById('col_direita') || document;
    var linhas = root.querySelectorAll('table tr');
    var alvo = rotuloParcial.toLowerCase();

    for (var i = 0; i < linhas.length; i++) {
      var tds = linhas[i].querySelectorAll('td');
      if (tds.length < 2) continue;

      var rotulo = (tds[0].innerText || tds[0].textContent || '').trim().toLowerCase();
      if (rotulo.indexOf(alvo) !== 0) continue;

      return (tds[1].innerText || tds[1].textContent || '').replace(/^\|\s*/, '').trim();
    }

    return null;
  }

  function extrairNivelJogadorSidebar() {
    var col = document.getElementById('col_esquerda');
    if (!col) return null;

    var html = col.innerHTML || '';
    var m = html.match(/N[ií]vel:<\/strong>\s*(\d+)/i);
    if (m) return parseInt(m[1], 10);

    var texto = col.innerText || col.textContent || '';
    m = texto.match(/N[ií]vel:\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function extrairNivelInimigo(textoNivel) {
    if (!textoNivel) return null;
    var m = String(textoNivel).match(/\[(\d+)\]/);
    if (m) return parseInt(m[1], 10);
    m = String(textoNivel).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  function extrairNomeInimigo() {
    var col = document.getElementById('col_direita');
    var texto = col ? (col.innerText || col.textContent || '') : '';

    var m = texto.match(/Resultados da busca\s*[-–—]\s*Inimigo\s+(.+)/i);
    if (m) return m[1].trim();

    var els = col
      ? col.querySelectorAll('td[style*="padding-top"]')
      : document.querySelectorAll('td[style*="padding-top"]');

    for (var i = 0; i < els.length; i++) {
      var txt = (els[i].innerText || els[i].textContent || '').trim();
      m = txt.match(/Inimigo\s+(.+)/i);
      if (m) return m[1].trim();
    }

    return null;
  }

  function extrairDadosAlvoAtacar() {
    var colDireita = document.getElementById('col_direita');
    var inimigo = extrairNomeInimigo();
    var personagem = extrairValorLinhaTabela('personagem', colDireita);
    var nivelTexto = extrairValorLinhaTabela('nível ninja', colDireita);
    if (!nivelTexto) nivelTexto = extrairValorLinhaTabela('nivel ninja', colDireita);
    var ryousTexto = extrairValorLinhaTabela('ryous faturados', colDireita);
    var cla = extrairValorLinhaTabela('clã', colDireita);
    if (!cla) cla = extrairValorLinhaTabela('cla', colDireita);

    return {
      inimigo: inimigo || '(desconhecido)',
      personagem: personagem || '?',
      nivelTexto: nivelTexto || '?',
      nivel: extrairNivelInimigo(nivelTexto),
      ryousTexto: ryousTexto || '?',
      ryous: parseNumeroBr(ryousTexto),
      cla: cla || '?',
      meuNivel: extrairNivelJogadorSidebar()
    };
  }

  function nomeExibicaoInimigo(dados) {
    if (!dados) return '?';
    if (dados.inimigo && dados.inimigo !== '(desconhecido)') return dados.inimigo;
    return '?';
  }

  function nomeBloqueadoPorWhitelist(nome) {
    var norm = normalizarNomeCacadas(nome);
    if (!norm) return false;
    var lista = obterWhitelistCacadas();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function claBloqueadoPorWhitelist(cla) {
    var norm = normalizarNomeCacadas(cla);
    if (!norm || norm === '?') return false;
    var lista = obterWhitelistClaCacadas();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function validarAlvoAtacar() {
    var dados = extrairDadosAlvoAtacar();
    var motivos = [];
    var porNomeBlacklist = cacadaAtualPorNomeBlacklist();
    var maxRyous = obterMaxRyousCacadas();
    var diffMin = obterDiffNivelCacadas();
    var whitelist = obterWhitelistCacadas();
    var whitelistCla = obterWhitelistClaCacadas();

    if (porNomeBlacklist) {
      console.log('[Atacar] Caçada por nome (blacklist) — validacao so nome/cla whitelist.');
    }

    if (dados.inimigo === '(desconhecido)') {
      motivos.push('Nome do inimigo nao encontrado na pagina');
    } else if (nomeBloqueadoPorWhitelist(dados.inimigo)) {
      motivos.push(
        'Inimigo "' + dados.inimigo + '" esta na whitelist — nao atacar (' + whitelist.join(', ') + ')'
      );
    }

    if (dados.cla && dados.cla !== '?') {
      if (claBloqueadoPorWhitelist(dados.cla)) {
        motivos.push(
          'Cla "' + dados.cla + '" esta na whitelist — nao atacar (' + whitelistCla.join(', ') + ')'
        );
      }
    }

    if (!porNomeBlacklist) {
      if (dados.ryous === null) {
        motivos.push('Ryous faturados nao encontrados na pagina');
      } else if (dados.ryous >= maxRyous) {
        motivos.push(
          'Ryous faturados ' + formatarNumeroBr(dados.ryous) +
          ' >= limite ' + formatarNumeroBr(maxRyous)
        );
      }

      if (dados.meuNivel === null) {
        motivos.push('Nivel do jogador nao encontrado na sidebar');
      } else if (dados.nivel === null) {
        motivos.push('Nivel do inimigo nao encontrado (' + dados.nivelTexto + ')');
      } else {
        var diff = dados.meuNivel - dados.nivel;
        dados.diffNivel = diff;
        if (diff < diffMin) {
          motivos.push(
            'Inimigo nivel ' + dados.nivel + ' nao esta ' + diffMin +
            '+ abaixo do seu (' + dados.meuNivel + ', diff=' + diff + ')'
          );
        }
      }
    } else if (dados.meuNivel !== null && dados.nivel !== null) {
      dados.diffNivel = dados.meuNivel - dados.nivel;
    }

    return {
      ok: motivos.length === 0,
      motivos: motivos,
      dados: dados,
      porNomeBlacklist: porNomeBlacklist,
      config: {
        whitelist: whitelist,
        whitelistCla: whitelistCla,
        maxRyous: maxRyous,
        diffNivel: diffMin
      }
    };
  }

  function enviarDiscordTexto(mensagem, webhookUrl, silencioso) {
    var url = webhookUrl || DISCORD_WEBHOOK_CACADAS;
    if (!url) return Promise.resolve();
    var payload = {
      username: 'Bot Shadow of Shinobi',
      content: mensagem
    };
    if (silencioso) {
      payload.flags = 4096; // SUPPRESS_NOTIFICATIONS — posta no canal sem notificar
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r) {
      if (r.ok) console.log('[Discord] Aviso enviado.' + (silencioso ? ' (silencioso)' : ''));
      else console.warn('[Discord] Falha ao enviar aviso:', r.status);
    }).catch(function(e) {
      console.error('[Discord] Erro ao enviar aviso:', e);
    });
  }

  function montarMensagemAlvoIgnorado(resultado) {
    var d = resultado.dados;
    var linhas = [
      '**Alvo ignorado** — ' + obterUsuarioExibicao(),
      'Inimigo: **' + nomeExibicaoInimigo(d) + '**'
    ];
    linhas.push(
      'Ryous faturados: ' + d.ryousTexto,
      'Nivel inimigo: ' + d.nivelTexto +
        ' | Seu nivel: ' + (d.meuNivel !== null ? d.meuNivel : '?') +
        ' | Diff: ' + (d.diffNivel !== undefined ? d.diffNivel : '?'),
      'Cla: ' + d.cla,
      'Motivo: ' + resultado.motivos.join('; ')
    );
    return linhas.join('\n');
  }

  function avisarDiscordEVoltarCacadas(mensagem) {
    enviarDiscordTexto(mensagem, null, DISCORD_ALVO_IGNORADO_SILENCIOSO).finally(function() {
      irParaPortaoRelatorios('Alvo ignorado', { rotacionarAutomacao: true });
    });
  }

  function atacarAlvoValido(resultado, btnAtacar) {
    var d = resultado.dados;
    if (resultado.porNomeBlacklist) {
      console.log(
        '[Atacar] Blacklist — alvo aprovado (so nome/cla): ' + nomeExibicaoInimigo(d) +
        ' | Ryous ' + (d.ryousTexto || '?') +
        ' | Nivel ' + (d.nivelTexto || '?')
      );
    } else {
      console.log(
        '[Atacar] Alvo aprovado — ' + nomeExibicaoInimigo(d) +
        ' | Ryous ' + d.ryousTexto +
        ' | Diff nivel ' + d.diffNivel
      );
    }
    if (btnAtacar) {
      marcarAtaqueIniciadoRotacao();
      btnAtacar.click();
    }
  }

  function pularAlvoInvalido(resultado) {
    console.warn('[Atacar] Alvo ignorado — ' + resultado.motivos.join(' | '));
    avisarDiscordEVoltarCacadas(montarMensagemAlvoIgnorado(resultado));
  }

  function paginaConfirmacaoAtaque() {
    return !!document.querySelector('form[action="atacar"] input[name="confirmar_ataque"]');
  }

  // --- Resultado do combate (caçadas) — pagina /combate ---
  // Ref: div.avisos_erro em /combate
  // Vitoria: "O vencedor X faturou Y ryous."
  // Derrota: "X foi derrotado por Y e perdeu Z ryous."
  var MIN_RYOUS_VITORIA_CACADAS_DEFAULT = 100000;

  function obterMinRyousVitoriaCacadas() {
    var n = parseNumeroInteiro(localStorage.getItem('BOT_MIN_RYOUS_VITORIA_CACADAS'));
    return n === null ? MIN_RYOUS_VITORIA_CACADAS_DEFAULT : n;
  }

  function limparNotificacaoCombate() {
    try { sessionStorage.removeItem(BOT_COMBATE_NOTIFICADO_KEY); } catch (e) {}
  }

  function marcarCombateNotificado() {
    try { sessionStorage.setItem(BOT_COMBATE_NOTIFICADO_KEY, '1'); } catch (e) {}
  }

  function combateJaNotificado() {
    try { return sessionStorage.getItem(BOT_COMBATE_NOTIFICADO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function salvarUltimoAlvo(dados) {
    try {
      sessionStorage.setItem(BOT_ULTIMO_ALVO_KEY, JSON.stringify({
        inimigo: dados.inimigo,
        personagem: dados.personagem,
        ryous: dados.ryous,
        ryousTexto: dados.ryousTexto,
        cla: dados.cla,
        ts: Date.now()
      }));
      limparNotificacaoCombate();
    } catch (e) {}
  }

  function lerUltimoAlvo() {
    try {
      var raw = sessionStorage.getItem(BOT_ULTIMO_ALVO_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function ehPaginaCombateCacadas(url) {
    return url.indexOf('invasor-combate') === -1 && /\/combate(?:[\/?#]|$)/i.test(url);
  }

  function estaNaPaginaCombateCacadas() {
    return ehPaginaCombateCacadas(window.location.href);
  }

  function normalizarTextoCombate(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function classificarResultadoCombate() {
    var col = document.getElementById('col_direita') || document.body || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);

      if (norm.indexOf('foi derrotado') !== -1) {
        return { resultado: 'derrota', texto: texto };
      }

      if (norm.indexOf('o vencedor') !== -1 && norm.indexOf('faturou') !== -1) {
        return { resultado: 'vitoria', texto: texto };
      }
    }

    return null;
  }

  function extrairRyousDoResumoCombate(texto, resultado) {
    if (!texto) return null;

    var padrao = resultado === 'derrota'
      ? /perdeu\s+([\d.,]+)\s*ryous/i
      : /faturou\s+([\d.,]+)\s*ryous/i;
    var m = texto.match(padrao);
    if (!m) return null;

    var bruto = m[1].trim();
    return {
      valor: parseNumeroBr(bruto),
      texto: bruto
    };
  }

  function aplicarRyousDoResumoCombate(dados, textoResumo, resultado) {
    var ryousCombate = extrairRyousDoResumoCombate(textoResumo, resultado);
    if (!ryousCombate || ryousCombate.valor === null) return dados;

    dados.ryous = ryousCombate.valor;
    dados.ryousTexto = ryousCombate.texto;
    return dados;
  }

  function extrairDadosResultadoCombate() {
    var dados = extrairDadosAlvoAtacar();
    var alvo = lerUltimoAlvo();

    if ((!dados.inimigo || dados.inimigo === '(desconhecido)') && alvo && alvo.inimigo) {
      dados.inimigo = alvo.inimigo;
    }
    if (dados.ryous === null && alvo) {
      dados.ryous = alvo.ryous;
      dados.ryousTexto = alvo.ryousTexto || '?';
    }
    if ((!dados.cla || dados.cla === '?') && alvo && alvo.cla) {
      dados.cla = alvo.cla;
    }

    return dados;
  }

  function montarMensagemCombateDerrota(dados) {
    var linhas = [
      '**Combate — Derrota** — ' + obterUsuarioExibicao(),
      'Inimigo: **' + nomeExibicaoInimigo(dados) + '**',
      'Ryous faturados: ' + (dados.ryousTexto || '?')
    ];
    if (dados.resumoCombate) linhas.push('Resumo: ' + dados.resumoCombate);
    return linhas.join('\n');
  }

  function montarMensagemCombateVitoria(dados) {
    var linhas = [
      '**Combate — Vitoria** — ' + obterUsuarioExibicao(),
      'Inimigo: **' + nomeExibicaoInimigo(dados) + '**',
      'Ryous faturados: ' + (dados.ryousTexto || '?') +
        ' (min. ' + formatarNumeroBr(obterMinRyousVitoriaCacadas()) + ')'
    ];
    if (dados.resumoCombate) linhas.push('Resumo: ' + dados.resumoCombate);
    return linhas.join('\n');
  }

  function notificarCombateSeNecessario(origem, dados, resultado) {
    if (combateJaNotificado()) {
      console.log('[Combate] Ja notificado nesta batalha (' + origem + ').');
      return false;
    }

    if (resultado === 'derrota') {
      marcarCombateNotificado();
      enviarDiscordTexto(montarMensagemCombateDerrota(dados));
      console.log('[Combate] Derrota avisada no Discord (' + origem + ').');
      return true;
    }

    if (resultado === 'vitoria') {
      var minRyous = obterMinRyousVitoriaCacadas();
      var ryousFaturados = dados.ryous;
      if (ryousFaturados !== null && ryousFaturados > minRyous) {
        marcarCombateNotificado();
        enviarDiscordTexto(montarMensagemCombateVitoria(dados));
        console.log('[Combate] Vitoria avisada no Discord (' + origem + '). Ryous faturados: ' + ryousFaturados);
        return true;
      }
      console.log('[Combate] Vitoria com ryous faturados <= limite (' + (ryousFaturados !== null ? ryousFaturados : '?') + ') — sem Discord.');
      marcarCombateNotificado();
    }

    return false;
  }

  function irParaCacadasAposCombate(motivo) {
    irParaPortaoRelatorios(motivo, { rotacionarAutomacao: true });
  }

  function processarPaginaCombate() {
    if (!estaNaPaginaCombateCacadas()) return false;

    if (combateJaNotificado()) {
      irParaCacadasAposCombate('Combate ja processado');
      return true;
    }

    var parsed = classificarResultadoCombate();
    if (!parsed) {
      console.log('[Combate] Pagina /combate sem resultado final (vitoria/derrota).');
      return true;
    }

    var dados = extrairDadosResultadoCombate();
    dados.resumoCombate = parsed.texto;
    aplicarRyousDoResumoCombate(dados, parsed.texto, parsed.resultado);
    notificarCombateSeNecessario('combate', dados, parsed.resultado);

    console.log('[Combate] ' + parsed.resultado + ' detectado: ' + parsed.texto);
    irParaCacadasAposCombate('Resultado processado');
    return true;
  }

  // --- FUNÇÃO PARA GERAR OU OBTER O CÓDIGO ÚNICO DO SERVIDOR/SESSÃO ---
  function obterCodigoServidor() {
    var usuario = obterUsuarioLogin().trim();
    var chave = 'BOT_CODIGO_SRV_' + usuario;
    var codigo = localStorage.getItem(chave);
    if (!codigo) {
      var slug = usuario.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() || 'BOT';
      codigo = 'SRV_' + slug + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem(chave, codigo);
    }
    return codigo;
  }

  var CODIGO_SERVIDOR = obterCodigoServidor();

  // --- FUNÇÃO PARA SIMULAR DIGITAÇÃO HUMANA ---
  function digitarTexto(elementoInput, texto, callbackConcluido) {
    elementoInput.focus();
    elementoInput.value = '';

    var i = 0;
    function proximoCaractere() {
      if (i < texto.length) {
        elementoInput.value += texto.charAt(i);

        // Dispara eventos normais de teclado para simular ação do usuário
        elementoInput.dispatchEvent(new Event('keydown', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('keypress', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('input', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('keyup', { bubbles: true }));

        i++;
        // Intervalo humano aleatório entre 80ms e 200ms por caractere
        var atrasoHumano = Math.floor(Math.random() * (200 - 80 + 1)) + 80;
        setTimeout(proximoCaractere, atrasoHumano);
      } else {
        elementoInput.dispatchEvent(new Event('change', { bubbles: true }));
        elementoInput.blur();
        if (callbackConcluido) callbackConcluido();
      }
    }

    proximoCaractere();
  }

  // --- DETECÇÃO DE ERROS DE SERVIDOR (HTTP 500, 502, 503, 504, etc.) ---
  function checarErroServidor() {
    var elErro = document.querySelector('.error-code');
    if (elErro) {
      var txtErro = (elErro.innerText || elErro.textContent || '').toUpperCase();
      if (txtErro.indexOf('HTTP ERROR') !== -1 || txtErro.indexOf('500') !== -1) {
        return 'HTTP ERROR 500 detectado (.error-code)';
      }
    }

    var textoCorpo = (document.body ? document.body.innerText || document.body.textContent || '' : '').toUpperCase();
    if (
      textoCorpo.indexOf('HTTP ERROR 500') !== -1 ||
      textoCorpo.indexOf('500 INTERNAL SERVER ERROR') !== -1 ||
      textoCorpo.indexOf('502 BAD GATEWAY') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNAVAILABLE') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNVAILABLE') !== -1 ||
      textoCorpo.indexOf('504 GATEWAY TIMEOUT') !== -1
    ) {
      return 'Erro de Servidor detectado no HTML';
    }

    return null;
  }

  // --- CAPTCHA: imagem -> Firebase + Discord (OCR no painel) ---
  function obterRefFirebaseCaptcha() {
    return 'comandos/' + CODIGO_SERVIDOR + '/resposta';
  }

  function lerTentativasOcrAutoCaptcha() {
    try {
      var n = parseInt(sessionStorage.getItem(BOT_CAPTCHA_OCR_AUTO_KEY), 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {}
    return 0;
  }

  function incrementarTentativasOcrAutoCaptcha() {
    var n = lerTentativasOcrAutoCaptcha() + 1;
    try { sessionStorage.setItem(BOT_CAPTCHA_OCR_AUTO_KEY, String(n)); } catch (e) {}
    return n;
  }

  function logOcrAutoNoConsole(origem) {
    var feitas = lerTentativasOcrAutoCaptcha();
    var max = CAPTCHA_OCR_AUTO_MAX_TENTATIVAS;
    var restantes = Math.max(0, max - feitas);
    var linha = '[Script Caçadas] OCR auto: ' + feitas + '/' + max +
      ' tentativas (' + restantes + ' restantes)';
    if (origem) linha += ' — ' + origem;
    console.log(linha);
    console.log(COMANDO_ZERAR_OCR_AUTO);
  }

  function zerarTentativasOcrAutoCaptcha(motivo) {
    try { sessionStorage.removeItem(BOT_CAPTCHA_OCR_AUTO_KEY); } catch (e) {}
    logOcrAutoNoConsole(motivo || 'contador zerado');
  }

  function logStatusOcrAutoCaptcha(origem) {
    logOcrAutoNoConsole(origem);
  }

  window.botZerarOcrAuto = function() {
    zerarTentativasOcrAutoCaptcha('comando manual botZerarOcrAuto()');
    agendarProximaTentativaOcrAuto();
    return lerTentativasOcrAutoCaptcha();
  };

  window.botBlacklistCacadas = function(lista) {
    if (arguments.length === 0) {
      return descreverBlacklistCacadas();
    }
    if (lista && typeof lista === 'object' && lista.join) {
      lista = lista.join(',');
    }
    gravarBlacklistCacadasParam(lista);
    console.log('[Blacklist] Lista atualizada: ' + descreverBlacklistCacadas());
    return descreverBlacklistCacadas();
  };

  function montarLinkPainelCaptcha(opcoes) {
    var opts = opcoes || {};
    var url = URL_PAINEL_BASE + '?codigo=' + encodeURIComponent(CODIGO_SERVIDOR);
    if (opts.auto) {
      url += '&auto=1&fechar=1';
    }
    return url;
  }

  function limparTimersCaptcha() {
    if (timerCaptchaTimeout) {
      clearTimeout(timerCaptchaTimeout);
      timerCaptchaTimeout = null;
    }
    if (timerCaptchaOcrAuto) {
      clearTimeout(timerCaptchaOcrAuto);
      timerCaptchaOcrAuto = null;
    }
  }

  function tentarOcrAutomaticoCaptcha() {
    if (captchaRespostaProcessando) return;

    var feitas = lerTentativasOcrAutoCaptcha();
    if (feitas >= CAPTCHA_OCR_AUTO_MAX_TENTATIVAS) {
      console.warn('[Captcha] OCR auto — limite de ' + CAPTCHA_OCR_AUTO_MAX_TENTATIVAS + ' tentativas.');
      logStatusOcrAutoCaptcha('limite atingido');
      return;
    }

    var tentativa = incrementarTentativasOcrAutoCaptcha();
    logStatusOcrAutoCaptcha('tentativa ' + tentativa);
    var link = montarLinkPainelCaptcha({ auto: true });
    console.warn('[Captcha] OCR automatico ' + tentativa + '/' + CAPTCHA_OCR_AUTO_MAX_TENTATIVAS + ': ' + link);

    var novaAba = null;
    try {
      novaAba = window.open(link, 'bot_ocr_' + CODIGO_SERVIDOR + '_' + tentativa, 'noopener,noreferrer');
    } catch (e) {}

    if (!novaAba) {
      console.warn('[Captcha] Popup bloqueado — usando iframe oculto para OCR.');
      var iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;border:0';
      iframe.src = link;
      document.body.appendChild(iframe);
      setTimeout(function() {
        try { iframe.remove(); } catch (e) {}
      }, 180000);
    }
  }

  function agendarProximaTentativaOcrAuto() {
    if (timerCaptchaOcrAuto) {
      clearTimeout(timerCaptchaOcrAuto);
      timerCaptchaOcrAuto = null;
    }

    var feitas = lerTentativasOcrAutoCaptcha();
    if (feitas >= CAPTCHA_OCR_AUTO_MAX_TENTATIVAS || captchaRespostaProcessando) {
      return;
    }

    var delay = feitas === 0 ? TEMPO_OCR_AUTO_CAPTCHA : CAPTCHA_OCR_AUTO_INTERVALO_MS;
    var minutos = (delay / 60000).toFixed(1);

    console.log('[Captcha] Proxima tentativa OCR auto em ' + minutos + ' min (' +
      (feitas + 1) + '/' + CAPTCHA_OCR_AUTO_MAX_TENTATIVAS + ')...');

    timerCaptchaOcrAuto = setTimeout(function() {
      timerCaptchaOcrAuto = null;
      if (captchaRespostaProcessando) return;
      if (lerTentativasOcrAutoCaptcha() >= CAPTCHA_OCR_AUTO_MAX_TENTATIVAS) return;

      tentarOcrAutomaticoCaptcha();

      if (!captchaRespostaProcessando &&
          lerTentativasOcrAutoCaptcha() < CAPTCHA_OCR_AUTO_MAX_TENTATIVAS) {
        agendarProximaTentativaOcrAuto();
      }
    }, delay);
  }

  function agendarTimersCaptcha() {
    limparTimersCaptcha();

    console.log('[Captcha] OCR auto: ate ' + CAPTCHA_OCR_AUTO_MAX_TENTATIVAS +
      ' tentativas (1a em ' + (TEMPO_OCR_AUTO_CAPTCHA / 60000) + ' min) | reload em ' +
      (TEMPO_TIMEOUT_CAPTCHA / 60000) + ' min...');

    agendarProximaTentativaOcrAuto();
    logStatusOcrAutoCaptcha('timers iniciados');

    timerCaptchaTimeout = setTimeout(function() {
      timerCaptchaTimeout = null;
      var destino = urlAposCaptcha();
      console.warn('[Captcha] Tempo limite esgotado! Redirecionando...');
      window.location.href = destino;
    }, TEMPO_TIMEOUT_CAPTCHA);
  }

  function obterImagemCaptcha() {
    var form = document.querySelector('form[action*="captcha_seguranca"]');
    if (form) {
      var imgForm = form.querySelector('img');
      if (imgForm) return imgForm;
    }
    var input = document.querySelector('input[name="resposta"]');
    if (input && input.form) {
      var imgInput = input.form.querySelector('img');
      if (imgInput) return imgInput;
    }
    return null;
  }

  function capturarBlobCaptcha(callback) {
    var img = obterImagemCaptcha();
    if (!img) {
      console.warn('[Captcha] Imagem nao encontrada no DOM.');
      callback(null);
      return;
    }

    function desenhar() {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) {
        callback(null);
        return;
      }
      var scale = 3;
      var canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function(blob) {
        callback(blob);
      }, 'image/png');
    }

    if (img.complete && img.naturalWidth > 0) {
      desenhar();
    } else {
      img.onload = desenhar;
      img.onerror = function() { callback(null); };
    }
  }

  function garantirFirebase(callback) {
    function conectar() {
      if (!window.firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      callback(firebase.database());
    }

    if (window.firebase && window.firebase.database) {
      conectar();
      return;
    }

    var scriptApp = document.createElement('script');
    scriptApp.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
    scriptApp.onload = function() {
      var scriptDb = document.createElement('script');
      scriptDb.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js';
      scriptDb.onload = conectar;
      document.head.appendChild(scriptDb);
    };
    document.head.appendChild(scriptApp);
  }

  function montarDescricaoDiscordCaptcha() {
    return [
      'Verificacao de seguranca — **a imagem abaixo e a valida** (salva no Firebase).',
      'O navegador pode mostrar numeros diferentes; resolva pela imagem desta mensagem.',
      '',
      '**Conta:** ' + obterUsuarioExibicao(),
      '**Codigo:** `' + CODIGO_SERVIDOR + '`',
      '',
      'OCR automatico: ate ' + CAPTCHA_OCR_AUTO_MAX_TENTATIVAS + ' tentativas (1a aos 5 min).',
      '',
      '[**Abrir painel (OCR + confirmar)**](' + montarLinkPainelCaptcha() + ')'
    ].join('\n');
  }

  function enviarDiscordCaptchaBlob(blob, descricao, callback) {
    var corDecimal = parseInt('FF0000'.replace('#', ''), 16);
    var payloadData = {
      username: 'Bot Shadow of Shinobi',
      embeds: [{
        title: 'CAPTCHA DETECTADO',
        description: descricao,
        color: corDecimal,
        timestamp: new Date().toISOString(),
        image: { url: 'attachment://captcha.png' },
        footer: { text: 'Usuario: ' + obterUsuarioExibicao() + ' | ' + CODIGO_SERVIDOR }
      }]
    };

    var formData = new FormData();
    formData.append('payload_json', JSON.stringify(payloadData));
    formData.append('file', blob, 'captcha.png');

    fetch(DISCORD_WEBHOOK_CAPTCHA, { method: 'POST', body: formData })
      .then(function(r) {
        if (r.ok) console.log('[Discord] Captcha enviado (recorte, sem html2canvas).');
        if (callback) callback();
      })
      .catch(function(e) {
        console.error('[Discord] Erro:', e);
        if (callback) callback();
      });
  }

  function processarCaptchaDetectado() {
    if (captchaJaNotificado) {
      console.log('[Captcha] Ja notificado nesta pagina — ignorando.');
      return;
    }
    captchaJaNotificado = true;
    tocarAlertaSonoro();

    capturarBlobCaptcha(function(blob) {
      if (!blob) {
        console.error('[Captcha] Falha ao capturar imagem.');
        return;
      }

      garantirFirebase(function(database) {
        var reader = new FileReader();
        reader.onload = function() {
          var dataUrl = reader.result;
          var refBase = 'comandos/' + CODIGO_SERVIDOR;

          database.ref(refBase + '/imagem').set(dataUrl)
            .then(function() {
              console.log('[Captcha] Imagem salva: ' + refBase + '/imagem');
              return database.ref(refBase + '/resposta').remove();
            })
            .then(function() {
              database.ref('codigo_servidor').set(CODIGO_SERVIDOR).catch(function() {});
              iniciarEscutaFirebaseCaptcha(database);
              enviarDiscordCaptchaBlob(blob, montarDescricaoDiscordCaptcha());
            })
            .catch(function(err) {
              console.error('[Captcha] Erro ao salvar Firebase:', err);
            });
        };
        reader.readAsDataURL(blob);
      });
    });
  }

  // --- ESCUTA DO FIREBASE PARA O CAPTCHA ---
  function iniciarEscutaFirebaseCaptcha(databaseExistente) {
    function conectarEListen(database) {
      var refPath = obterRefFirebaseCaptcha();
      var campoComando = database.ref(refPath);

      console.log('%c[Firebase] Aguardando captcha em: ' + refPath, 'color: #00ff00; font-weight: bold;');

      campoComando.off();

      campoComando.on('value', function(snapshot) {
        var valor = snapshot.val();

        if (valor !== null && valor !== undefined && valor !== '') {
          if (captchaRespostaProcessando) return;
          captchaRespostaProcessando = true;
          campoComando.off();

          var codigoCaptcha = String(valor).trim();
          console.log('%c[Firebase] CODIGO DO CAPTCHA RECEBIDO:', 'color: #ffff00; font-weight: bold;', codigoCaptcha);

          limparTimersCaptcha();
          zerarTentativasOcrAutoCaptcha('captcha resolvido');

          var inputCaptcha = document.querySelector('input[name="resposta"]') ||
                             document.querySelector('input[name="captcha"], input[name="codigo"], #captcha');

          if (inputCaptcha) {
            console.log('[Captcha] Iniciando simulacao de digitacao...');

            digitarTexto(inputCaptcha, codigoCaptcha, function() {
              console.log('[Captcha] Digitacao concluida! Limpando Firebase...');

              var urlDelete = FIREBASE_CONFIG.databaseURL + '/' + refPath + '.json';

              fetch(urlDelete, { method: 'DELETE' })
                .then(function() {
                  console.log('[Firebase] Resposta apagada do banco.');
                })
                .catch(function(err) {
                  console.warn('[Firebase] Erro ao apagar:', err);
                })
                .finally(function() {
                  var delayClique = Math.floor(Math.random() * (700 - 300 + 1)) + 300;

                  setTimeout(function() {
                    var formCaptcha = inputCaptcha.closest('form');
                    var btnConfirmar = formCaptcha ? formCaptcha.querySelector('input[type="submit"]') : null;

                    if (btnConfirmar) {
                      console.log('[Script] Clicando Confirmar...');
                      btnConfirmar.click();
                    } else if (formCaptcha) {
                      formCaptcha.submit();
                    }
                  }, delayClique);
                });
            });

          } else {
            console.error('[Script] Input do captcha nao encontrado na pagina.');
            captchaRespostaProcessando = false;
          }
        }
      });
    }

    if (databaseExistente) {
      conectarEListen(databaseExistente);
      return;
    }

    garantirFirebase(conectarEListen);
  }

  // --- ALERTA SONORO ---
  function tocarAlertaSonoro() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      var ctx = new AudioContext();
      [0, 0.3, 0.6].forEach(function(delay) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + delay + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {
      console.warn('[Script] Erro ao tocar alerta sonoro:', e);
    }
  }

  function agendarReloadFalha(motivo, delayMs) {
    agendarRecuperacaoViaLogin(motivo, delayMs);
  }

  function redirecionarParaCacadas(motivo) {
    console.warn('[Script] PÁGINA NÃO MAPEADA (' + motivo + '). Redirecionando...');
    if (obterModoAba() === 'cacadas') {
      irParaPortaoRelatorios('Pagina nao mapeada');
      return;
    }
    window.location.href = URL_CACADAS;
  }

  function aguardandoAutenticacao() {
    if (document.getElementById('login')) return true;

    var texto = (document.body ? document.body.innerText || document.body.textContent || '' : '').toLowerCase();
    if (texto.indexOf('sessão expirada ou requisição inválida') !== -1) return true;
    if (texto.indexOf('sessao expirada ou requisicao invalida') !== -1) return true;
    if (document.querySelector('a[href*="history.back()"]')) return true;

    return false;
  }

  function sessaoExpiradaSemLogin() {
    if (document.getElementById('login')) return false;
    return aguardandoAutenticacao();
  }

  function redirecionarParaLogin(motivo) {
    console.warn('[Script Caçadas] ' + motivo + ' — redirecionando para login com parametros da sessao...');
    var url = salvarRecuperacaoAntesDeSair();
    try { location.replace(url); } catch (e) { location.href = url; }
  }

  function executarCacadaPorNome(nome) {
    var input = document.getElementById('por_nome') ||
      document.querySelector('input[name="por_nome"]');
    if (!input) return false;

    var form = input.closest('form');
    if (!form) return false;

    input.value = nome;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    var btnSubmit = form.querySelector('input[type="submit"]');
    if (!btnSubmit) return false;

    console.log('[Caçadas] Blacklist — caçando por nome: ' + nome);
    btnSubmit.click();
    return true;
  }

  function executarCacadaPorNivel() {
    var selectNivel = document.getElementById('por_nivel');
    if (!selectNivel) return false;

    var formNivel = selectNivel.closest('form');
    if (!formNivel) return false;

    var btnNivel = formNivel.querySelector('input[type="submit"]');
    if (!btnNivel) return false;

    selectNivel.value = NIVEL_CACADAS_FINAL;
    selectNivel.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Caçadas] Gate OK — caçada por nivel ' + NIVEL_CACADAS_FINAL + ', clicando Caçar...');
    btnNivel.click();
    return true;
  }

  function processarCacadasSemFormularioNivel(motivo) {
    console.warn(
      '[Caçadas] ' + motivo + ' — formulario por_nivel (caçar por nivel) indisponivel. ' +
      'Nenhuma caçada iniciada.'
    );
    irParaPortaoRelatorios('Sem caçada por nivel disponivel');
    return true;
  }

  function urlAposCaptcha() {
    if (obterModoAba() === 'invasor') return URL_INVASOR;
    return URL_RELATORIOS_ATAQUE;
  }

  console.log(
    '[Script Caçadas] Login: ' + obterUsuarioLogin() + ' | Ativo: ' + obterUsuarioExibicao() +
    ' | Nível: ' + NIVEL_CACADAS_FINAL +
    ' | Espera caçadas: ' + descreverEsperaCacadas() +
    ' | Whitelist: ' + descreverWhitelistAtacar() +
    ' | ' + descreverWhitelistClaAtacar() +
    ' | Blacklist: ' + descreverBlacklistCacadas() +
    ' | Rotacao automacao: ' + descreverRotacaoAutomacao() +
    ' | Max ryous: ' + formatarNumeroBr(obterMaxRyousCacadas()) +
    ' | Diff nivel: ' + obterDiffNivelCacadas() +
    ' | Min ryous vitoria: ' + formatarNumeroBr(obterMinRyousVitoriaCacadas()) +
    ' | Código: ' + CODIGO_SERVIDOR
  );
  logOcrAutoNoConsole();

  setTimeout(function() {
    try {
      sincronizarModoAba();

      if (obterModoAba() === 'invasor') {
        var ehLogin = !!document.getElementById('login');
        var urlInv = window.location.href;
        var ehCaptcha = urlInv.indexOf('captcha_seguranca') !== -1 ||
          document.querySelector('form[action="captcha_seguranca"]');

        if (sessaoExpiradaSemLogin()) {
          redirecionarParaLogin('Sessao expirada (aba invasor)');
          return;
        }

        if (!ehLogin && !ehCaptcha) {
          console.log('[Script Caçadas] Aba invasor — sem acao.');
          return;
        }
      }

      sincronizarUsuarioLocalStorage();
      CODIGO_SERVIDOR = obterCodigoServidor();

      if (obterModoAba() === 'cacadas' && consumirContaAutomacaoAssumida()) {
        console.log('[Automacao] Conta assumida — iniciando portao de caçadas...');
        window.location.href = URL_RELATORIOS_ATAQUE;
        return;
      }

      var urlAtual = window.location.href;
      var formLogin = document.getElementById('login');

      // Login antes de checar erro 500 — evita reload na tela de login
      if (formLogin) {
        if (tentarLoginAutomatico('principal')) {
          return;
        }
        agendarReloadFalha('Campos de login (#usuario / #senha) nao encontrados.');
        return;
      }

      // 1. VERIFICAÇÃO DE ERRO NO SERVIDOR (HTTP 500)
      var erroServidor = checarErroServidor();
      if (erroServidor) {
        agendarReloadFalha(erroServidor, TEMPO_RECUPERACAO_SERVIDOR);
        return;
      }

      // Modo cacadas: ignora paginas do invasor
      if (obterModoAba() === 'cacadas' && urlAtual.indexOf('invasor') !== -1) {
        console.log('[Script Caçadas] Pagina do invasor — sem acao.');
        return;
      }

      // Modo cacadas: /status → automacao (rotacao) ou portao relatorios
      if (obterModoAba() === 'cacadas' && urlAtual.indexOf('status') !== -1) {
        if (processarRotacaoContaPrincipal()) return;
        console.log('[Script Caçadas] Status — redirecionando ao portao de relatorios...');
        window.location.href = URL_RELATORIOS_ATAQUE;
        return;
      }

      if (processarRotacaoContaPrincipal()) return;

      if (sessaoExpiradaSemLogin()) {
        redirecionarParaLogin('Sessao expirada');
        return;
      }

      if (aguardandoAutenticacao()) {
        console.log('[Script Caçadas] Aguardando login — sem acao.');
        return;
      }

      var paginasConhecidas = [
        {
          id: 'captcha_seguranca',
          checar: function() { 
            return urlAtual.indexOf('captcha_seguranca') !== -1 || document.querySelector('form[action="captcha_seguranca"]') !== null; 
          },
          executar: function() {
            console.warn('[Script] Captcha detectado! Imagem -> Firebase + Discord...');
            processarCaptchaDetectado();

            agendarTimersCaptcha();

            return true;
          }
        },
        {
          id: 'combate',
          checar: function() {
            return obterModoAba() === 'cacadas' && ehPaginaCombateCacadas(urlAtual);
          },
          executar: function() {
            return processarPaginaCombate();
          }
        },
        {
          id: 'relatorios_ataque',
          checar: function() {
            if (obterModoAba() !== 'cacadas') return false;
            if (urlAtual.indexOf('relatorios_ataque') !== -1) return true;
            return !!document.querySelector('.msg-pipetabs a.active[href*="relatorios_ataque"]');
          },
          executar: function() {
            return processarPortaoRelatoriosAtaque();
          }
        },
        {
          id: 'automacao',
          checar: function() {
            if (obterModoAba() !== 'cacadas') return false;
            return urlAtual.indexOf('automacao') !== -1;
          },
          executar: function() {
            return processarPaginaAutomacao();
          }
        },
        {
          id: 'missoes',
          checar: function() {
            if (obterModoAba() !== 'cacadas') return false;
            return urlAtual.indexOf('missoes') !== -1;
          },
          executar: function() {
            return processarPaginaMissoes();
          }
        },
        {
          id: 'cacadas',
          checar: function() { return urlAtual.indexOf('cacadas') !== -1; },
          executar: function() {
            if (paginaCacadasBloqueadaPorMissao()) {
              return processarCacadasBloqueadaPorMissao();
            }

            if (paginaCacadasComMissaoTempo()) {
              return processarCacadasMissaoTempo();
            }

            if (processarNinjaNaoEncontradoCacadas()) {
              return true;
            }

            if (!gateCacadasLiberado()) {
              console.log('[Caçadas] Gate nao liberado — redirecionando ao portao...');
              window.location.href = URL_RELATORIOS_ATAQUE;
              return true;
            }
            consumirGateCacadas();

            var modo = obterModoCacadasSessao();
            var alvoNome = obterAlvoNomeCacadasSessao();

            if (modo === 'blacklist' && alvoNome) {
              if (executarCacadaPorNome(alvoNome)) {
                return true;
              }
              console.warn('[Blacklist] Formulario por_nome indisponivel — tentando caçada por nivel...');
            }

            if (executarCacadaPorNivel()) {
              return true;
            }

            if (!blacklistCacadasAtiva()) {
              return processarCacadasSemFormularioNivel('Blacklist vazia');
            }

            if (modo === 'classe') {
              return processarCacadasSemFormularioNivel('Blacklist esgotada ou ignorada (teto de espera)');
            }

            return processarCacadasSemFormularioNivel('Blacklist ativa mas por_nome e por_nivel indisponiveis');
          }
        },
        {
          id: 'atacar',
          checar: function() {
            return urlAtual.indexOf('atacar') !== -1 && paginaConfirmacaoAtaque();
          },
          executar: function() {
            if (atacarJaProcessado) return true;

            var btnAtacar = document.querySelector('form[action="atacar"] input[type="submit"]');
            if (!btnAtacar) return false;

            var resultado = validarAlvoAtacar();
            atacarJaProcessado = true;
            salvarUltimoAlvo(resultado.dados);

            if (!resultado.ok) {
              pularAlvoInvalido(resultado);
              return true;
            }

            atacarAlvoValido(resultado, btnAtacar);
            return true;
          }
        }
      ];

      var paginaEncontrada = false;

      for (var i = 0; i < paginasConhecidas.length; i++) {
        var pagina = paginasConhecidas[i];
        
        if (pagina.checar()) {
          paginaEncontrada = true;
          var sucessoAcao = pagina.executar();

          if (!sucessoAcao && pagina.id !== 'captcha_seguranca' && pagina.id !== 'combate') { 
            agendarReloadFalha('Falha de ação na página ' + pagina.id);
          }
          break;
        }
      }

      if (!paginaEncontrada) {
        redirecionarParaCacadas(urlAtual);
      }

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();