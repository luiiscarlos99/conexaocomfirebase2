// ==UserScript==
// @name         Bot Invasor - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      7.7
// @description  Automação do Invasor: last hit sorteio (2k-3k, padrao), scout ou data (+3min). Discord boss morto 1x via Firebase.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var BOT_MODO_KEY = 'BOT_MODO_ABA';

  // sessionStorage = desta aba (modo). localStorage = navegador (credenciais/config). Nunca modo em localStorage.
  try {
    localStorage.removeItem('BOT_MODO_ABA');
    localStorage.removeItem('BOT_MODO_PREFERIDO');
  } catch (e) {}

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

  function obterLimitePlayersDerrotados() {
    var limite = parseLimiteInvasor(localStorage.getItem('BOT_LIMITE_INVASOR'));
    if (limite === null) return LIMITE_INVASOR_DEFAULT;
    return limite;
  }

  function descreverLimiteInvasor() {
    var limite = obterLimitePlayersDerrotados();
    var raw = localStorage.getItem('BOT_LIMITE_INVASOR');
    if (raw === null || raw === '') return limite + ' (padrao)';
    return limite + ' (bot_limite_invasor=' + raw + ')';
  }

  function parseMinAtaquesInvasor(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseInt(String(valor).replace(/\./g, '').replace(',', ''), 10);
    if (isNaN(n) || n < 1) return null;
    return n;
  }

  function gravarMinAtaquesInvasorParam(valor) {
    var min = parseMinAtaquesInvasor(valor);
    if (min === null) return false;
    localStorage.setItem('BOT_MIN_ATAQUES_INVASOR', String(min));
    return true;
  }

  function obterMinAtaquesInvasor() {
    var min = parseMinAtaquesInvasor(localStorage.getItem('BOT_MIN_ATAQUES_INVASOR'));
    if (min === null) return MIN_ATAQUES_INVASOR_DEFAULT;
    return min;
  }

  function descreverMinAtaquesInvasor() {
    var min = obterMinAtaquesInvasor();
    var raw = localStorage.getItem('BOT_MIN_ATAQUES_INVASOR');
    if (raw === null || raw === '') return min + ' (padrao)';
    return min + ' (bot_min_ataques_invasor=' + raw + ')';
  }

  function parseLastHitPorData(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      return false;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') return true;
    return null;
  }

  function gravarLastHitPorDataParam(valor) {
    var v = parseLastHitPorData(valor);
    if (v === null) return false;
    if (v) {
      localStorage.setItem('BOT_LASTHIT_MODO', 'data');
    } else {
      localStorage.setItem('BOT_LASTHIT_MODO', 'scout');
    }
    try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e) {}
    return true;
  }

  function normalizarLastHitModo(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var s = String(valor).trim().toLowerCase();
    if (s === 'scout' || s === '0' || s === 'false' || s === 'off') return 'scout';
    if (s === 'data' || s === '1' || s === 'true' || s === 'on') return 'data';
    if (s === 'sorteio' || s === 'random' || s === 'aleatorio' || s === 'aleatório') return 'sorteio';
    return null;
  }

  function gravarLastHitModoParam(valor) {
    var modo = normalizarLastHitModo(valor);
    if (!modo) return false;
    localStorage.setItem('BOT_LASTHIT_MODO', modo);
    try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e) {}
    return true;
  }

  function obterLastHitModo() {
    var modo = normalizarLastHitModo(localStorage.getItem('BOT_LASTHIT_MODO'));
    if (modo) return modo;
    if (parseLastHitPorData(localStorage.getItem('BOT_LASTHIT_POR_DATA')) === true) return 'data';
    return LASTHIT_MODO_DEFAULT;
  }

  function lastHitModoData() {
    return obterLastHitModo() === 'data';
  }

  function lastHitModoSorteio() {
    return obterLastHitModo() === 'sorteio';
  }

  function parseLastHitSorteioNum(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseInt(String(valor).replace(/\./g, '').replace(',', ''), 10);
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarLastHitSorteioMinParam(valor) {
    var n = parseLastHitSorteioNum(valor);
    if (n === null) return false;
    localStorage.setItem('BOT_LASTHIT_SORTEIO_MIN', String(n));
    return true;
  }

  function gravarLastHitSorteioMaxParam(valor) {
    var n = parseLastHitSorteioNum(valor);
    if (n === null) return false;
    localStorage.setItem('BOT_LASTHIT_SORTEIO_MAX', String(n));
    return true;
  }

  function obterLastHitSorteioMin() {
    var n = parseLastHitSorteioNum(localStorage.getItem('BOT_LASTHIT_SORTEIO_MIN'));
    if (n === null) return LASTHIT_SORTEIO_MIN_DEFAULT;
    return n;
  }

  function obterLastHitSorteioMax() {
    var n = parseLastHitSorteioNum(localStorage.getItem('BOT_LASTHIT_SORTEIO_MAX'));
    if (n === null) return LASTHIT_SORTEIO_MAX_DEFAULT;
    return n;
  }

  function formatarNumeroInvasor(n) {
    if (n == null || isNaN(n)) return '?';
    try {
      return Number(n).toLocaleString('pt-BR');
    } catch (e) {
      return String(n);
    }
  }

  function descreverLastHitModo() {
    var modo = obterLastHitModo();
    if (modo === 'data') return 'data (+3min pos-janela)';
    if (modo === 'sorteio') {
      return 'sorteio (' + formatarNumeroInvasor(obterLastHitSorteioMin()) + '-' +
        formatarNumeroInvasor(obterLastHitSorteioMax()) + ' aleatorio, padrao)';
    }
    return 'scout (derrotados)';
  }

  var COMANDO_LASTHIT_SCOUT = 'botLastHitScout()';
  var COMANDO_LASTHIT_DATA = 'botLastHitData()';
  var COMANDO_LASTHIT_SORTEIO = 'botLastHitSorteio()';

  function logLastHitNoConsole(origem) {
    var linha = '[Script Invasor] Last hit: ' + descreverLastHitModo();
    if (origem) linha += ' — ' + origem;
    console.log(linha);
    console.log(COMANDO_LASTHIT_SCOUT);
    console.log(COMANDO_LASTHIT_DATA);
    console.log(COMANDO_LASTHIT_SORTEIO);
  }

  var LIMITE_INVASOR_DEFAULT = 500;
  var MIN_ATAQUES_INVASOR_DEFAULT = 5;
  var LASTHIT_MODO_DEFAULT = 'sorteio';
  var LASTHIT_SORTEIO_MIN_DEFAULT = 2000;
  var LASTHIT_SORTEIO_MAX_DEFAULT = 3000;

  function extrairModoDeUrlString(urlStr) {
    try {
      if (!urlStr) return '';
      var u = urlStr.indexOf('://') !== -1 ? new URL(urlStr) : new URL(urlStr, 'https://shadowofshinobi.com/');
      var m = new URLSearchParams(u.search).get('bot_modo');
      if (m === 'invasor' || m === 'cacadas') return m;
    } catch (e) {}
    return '';
  }

  function ehReferrerPosLogin() {
    var ref = document.referrer || '';
    if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return false;
    try {
      var u = new URL(ref);
      var p = (u.pathname || '/').replace(/\/+$/, '') || '/';
      return p === '/' || u.pathname.indexOf('login') !== -1;
    } catch (e) {}
    return false;
  }

  function gravarModoAba(modo) {
    if (modo !== 'invasor' && modo !== 'cacadas') return;
    try {
      sessionStorage.setItem(BOT_MODO_KEY, modo);
    } catch (e) {}
  }

  function gravarUsuarioLoginParam(valor) {
    if (!valor) return false;
    var u = String(valor).trim();
    if (!u) return false;
    localStorage.setItem('BOT_USUARIO_LOGIN', u);
    localStorage.setItem('BOT_USUARIO', u);
    try {
      sessionStorage.removeItem('BOT_USUARIO_LOGIN');
      sessionStorage.removeItem('BOT_USUARIO');
    } catch (e) {}
    return true;
  }

  function gravarSenhaLoginParam(valor) {
    if (!valor) return false;
    localStorage.setItem('BOT_SENHA', String(valor));
    try { sessionStorage.removeItem('BOT_SENHA'); } catch (e) {}
    return true;
  }

  function lerUsuarioLoginArmazenado() {
    try {
      return localStorage.getItem('BOT_USUARIO_LOGIN') || localStorage.getItem('BOT_USUARIO') || '';
    } catch (e) {
      return '';
    }
  }

  function aplicarCredenciaisReferrer() {
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      var ehLoginOuHome = path === '/' || !!document.getElementById('login');
      var ehStatusPosLogin = path.indexOf('status') !== -1 && ehReferrerPosLogin();
      if (!ehLoginOuHome && !ehStatusPosLogin) return;
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return;
      var rp = new URLSearchParams(new URL(ref).search);
      var u = rp.get('bot_user');
      var p = rp.get('bot_pass');
      var l = rp.get('bot_limite_invasor');
      var ma = rp.get('bot_min_ataques_invasor');
      var lh = rp.get('bot_lasthit_data');
      var lm = rp.get('bot_lasthit_modo');
      var lsm = rp.get('bot_lasthit_sorteio_min');
      var lsx = rp.get('bot_lasthit_sorteio_max');
      if (u) gravarUsuarioLoginParam(u);
      if (p) gravarSenhaLoginParam(p);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      if (ma !== null && ma !== '') gravarMinAtaquesInvasorParam(ma);
      if (lm !== null && lm !== '') gravarLastHitModoParam(lm);
      else if (lh !== null && lh !== '') gravarLastHitPorDataParam(lh);
      if (lsm !== null && lsm !== '') gravarLastHitSorteioMinParam(lsm);
      if (lsx !== null && lsx !== '') gravarLastHitSorteioMaxParam(lsx);
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

  function aplicarParamsUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var modoParamRaw = params.get('bot_modo');
      var modoVeioDeQuery = modoParamRaw === 'invasor' || modoParamRaw === 'cacadas';
      var modo = modoVeioDeQuery ? modoParamRaw : '';

      if (modoParamRaw && modoParamRaw !== 'invasor' && modoParamRaw !== 'cacadas' &&
          modoParamRaw !== 'off' && modoParamRaw !== 'manual') {
        console.warn('[Bot] bot_modo invalido: "' + modoParamRaw + '". Use invasor ou cacadas.');
      }

      var u = params.get('bot_user');
      var p = params.get('bot_pass');
      var l = params.get('bot_limite_invasor');
      var ma = params.get('bot_min_ataques_invasor');
      var lh = params.get('bot_lasthit_data');
      var lm = params.get('bot_lasthit_modo');
      var lsm = params.get('bot_lasthit_sorteio_min');
      var lsx = params.get('bot_lasthit_sorteio_max');
      if (u) gravarUsuarioLoginParam(u);
      if (p) gravarSenhaLoginParam(p);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      if (ma !== null && ma !== '') gravarMinAtaquesInvasorParam(ma);
      if (lm !== null && lm !== '') gravarLastHitModoParam(lm);
      else if (lh !== null && lh !== '') gravarLastHitPorDataParam(lh);
      if (lsm !== null && lsm !== '') gravarLastHitSorteioMinParam(lsm);
      if (lsx !== null && lsx !== '') gravarLastHitSorteioMaxParam(lsx);

      if (modoParamRaw === 'off' || modoParamRaw === 'manual') {
        sessionStorage.removeItem(BOT_MODO_KEY);
      } else if (modo === 'invasor' || modo === 'cacadas') {
        gravarModoAba(modo);
      }

      var pathAtual = window.location.pathname || '';
      if (!u && !p && (document.getElementById('login') ||
          pathAtual.indexOf('status') !== -1 || pathAtual === '/' || pathAtual === '')) {
        aplicarCredenciaisReferrer();
      }

      if ((u || p || l || ma || lh || lm || lsm || lsx || modoVeioDeQuery) &&
          window.history && window.history.replaceState) {
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

  function recuperarModoAbaPosLogin() {
    var modo = obterModoAba();
    if (modo) return modo;

    try {
      if (window.__BOT_RECOVERY__) {
        modo = extrairModoDeUrlString(window.__BOT_RECOVERY__.ler());
        if (modo) {
          gravarModoAba(modo);
          return modo;
        }
      }
    } catch (e) {}

    modo = extrairModoDeUrlString(window.location.href);
    if (modo) {
      gravarModoAba(modo);
      return modo;
    }

    return '';
  }

  function sincronizarModoAba() {
    return aplicarParamsUrl();
  }

  aplicarParamsUrl();

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '7.7';
  var SCRIPT_ATUALIZADO = '29/08/2026 01:05';
  var INVASOR_MORTO_AVISO_FB_PATH = 'invasor_morto_aviso';

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
        try { return sessionStorage.getItem(BOT_KILL_KEY) === '1' ? 'off' : 'on'; } catch (e) { return 'on'; }
      }
    };
    window.botParar = window.__BOT_CONTROLE__.parar;
    window.botLigar = window.__BOT_CONTROLE__.ligar;
    window.botStatus = window.__BOT_CONTROLE__.status;
  }

  window.botLastHitData = function() {
    localStorage.setItem('BOT_LASTHIT_MODO', 'data');
    try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e) {}
    logLastHitNoConsole('comando manual — recarregando...');
    location.reload();
    return 'data';
  };

  window.botLastHitScout = function() {
    localStorage.setItem('BOT_LASTHIT_MODO', 'scout');
    try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e) {}
    logLastHitNoConsole('comando manual — recarregando...');
    location.reload();
    return 'scout';
  };

  window.botLastHitSorteio = function() {
    localStorage.setItem('BOT_LASTHIT_MODO', 'sorteio');
    try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e) {}
    logLastHitNoConsole('comando manual — recarregando...');
    location.reload();
    return 'sorteio';
  };

  window.__BOT_BUILD_INVASOR__ = { versao: SCRIPT_VERSAO, atualizado: SCRIPT_ATUALIZADO };

  if ((function() {
    try {
      var p = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      return p.indexOf('ranking') !== -1;
    } catch (e) {}
    return false;
  })()) {
    console.log('[Script Invasor] Pagina /ranking — sem acao (use bot-ranking.js + botRankingScan()).');
    return;
  }

  console.log(
    '%c[Bot Invasor] v' + SCRIPT_VERSAO + ' | atualizado: ' + SCRIPT_ATUALIZADO,
    'color:#3498db;font-weight:bold'
  );

  try {
    if (sessionStorage.getItem(BOT_KILL_KEY) === '1') {
      console.log('[Bot] Pausado nesta aba — botLigar() para reativar.');
      return;
    }
  } catch (e) {}

  function classificarPaginaInvasor(url) {
    var ehCombate = url.indexOf('invasor-combate') !== -1;
    var ehInvasor = url.indexOf('invasor') !== -1 && !ehCombate;
    var ehStatus = url.indexOf('/status') !== -1;
    var ehCaptcha = url.indexOf('captcha_seguranca') !== -1;

    return {
      ehCombate: ehCombate,
      ehInvasor: ehInvasor,
      ehStatus: ehStatus,
      ehCaptcha: ehCaptcha,
      noEscopo: ehCombate || ehInvasor || ehStatus || ehCaptcha
    };
  }

  function ehAbaInvasor() {
    return obterModoAba() === 'invasor';
  }

  if (!obterModoAba()) {
    logDiagnosticoModo('invasor');
    console.log('[Script Invasor] Sem BOT_MODO_ABA — sem acao (modo atual: vazio). Use /invasor?bot_modo=invasor.');
    return;
  }

  if (!ehAbaInvasor()) {
    console.log('[Script Invasor] BOT_MODO_ABA=cacadas — sem acao.');
    return;
  }

  var urlInicial = window.location.href;
  var paginaInicial = classificarPaginaInvasor(urlInicial);

  if (!paginaInicial.noEscopo && !document.getElementById('login')) {
    console.log('[Script Invasor] Pagina fora do escopo — sem acao.');
    return;
  }

  // --- CONFIGURAÇÕES DE TEMPO E LIMITES ---
  var LIMITE_PLAYERS_DERROTADOS = obterLimitePlayersDerrotados();
  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = 20000;
  var TEMPO_RELOAD_PADRAO = 60000;          // 1 min — fase early com botao/cooldown 10min
  var TEMPO_RELOAD_GERENCIADA = 2000;
  var TEMPO_RELOAD_MONITOR = 2000;           // poll reload — scout atualiza Firebase; seguidores refrescam botao
  var TEMPO_ESPERA_POS_COMBATE = 60000;      // 1 minuto
  var TEMPO_LASTHIT_POR_DATA_MS = 180000;    // 3 min apos sumir botao/cooldown (modo data)
  var COORD_INVASOR_PATH = '/invasor_coord.json';
  var COMANDO_ATACAR_PATH = '/comando_atacar.json';
  var COORD_MAX_IDADE_MS = 45 * 60 * 1000; // seguranca — evita poll 4s eterno
  var LEGACY_COMANDO_LIMPO_KEY = 'BOT_INV_COMANDO_LEGADO_LIMPO';

  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var URL_HOME = 'https://shadowofshinobi.com/';
  var DISCORD_WEBHOOK_INVASOR = '';
  var FIREBASE_WEBHOOKS_PATH = 'config/discordWebhooks';
  var DISCORD_COMBATE_SILENCIOSO = true; // flags 4096 = sem @ping/notificação push

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
      var ma = localStorage.getItem('BOT_MIN_ATAQUES_INVASOR');
      var lm = localStorage.getItem('BOT_LASTHIT_MODO');
      var lsm = localStorage.getItem('BOT_LASTHIT_SORTEIO_MIN');
      var lsx = localStorage.getItem('BOT_LASTHIT_SORTEIO_MAX');
      if (u) params.set('bot_user', u);
      if (p) params.set('bot_pass', p);
      if (n) params.set('bot_nivel', n);
      if (e !== null && e !== '') params.set('bot_espera_cacadas', e);
      if (l !== null && l !== '') params.set('bot_limite_invasor', l);
      if (ma !== null && ma !== '') params.set('bot_min_ataques_invasor', ma);
      if (lm === 'data' || lm === 'sorteio' || lm === 'scout') params.set('bot_lasthit_modo', lm);
      if (lsm !== null && lsm !== '') params.set('bot_lasthit_sorteio_min', lsm);
      if (lsx !== null && lsx !== '') params.set('bot_lasthit_sorteio_max', lsx);
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

  var reloadAgendado = false;
  var jaAtacouNestaPagina = false;
  var reloadInvasorTimer = null;
  var escutaCoordInvasorAtiva = false;
  var escutaCoordRef = null;
  var monitorLastHitCoord = null;
  var lastHitAtaqueEmAndamento = false;

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

  var webhooksDiscordPromise = null;
  var webhooksDiscordCarregados = false;

  function aplicarWebhooksDiscordFirebase(dados) {
    if (!dados || typeof dados !== 'object') return;
    if (dados.invasor) DISCORD_WEBHOOK_INVASOR = String(dados.invasor);
  }

  function garantirWebhooksDiscord() {
    if (webhooksDiscordCarregados) return Promise.resolve();
    if (webhooksDiscordPromise) return webhooksDiscordPromise;

    var url = FIREBASE_CONFIG.databaseURL + '/' + FIREBASE_WEBHOOKS_PATH + '.json';
    webhooksDiscordPromise = fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(dados) {
        aplicarWebhooksDiscordFirebase(dados);
        webhooksDiscordCarregados = true;
        console.log('[Discord] Webhook invasor do Firebase: ' +
          (DISCORD_WEBHOOK_INVASOR ? 'ok' : 'ausente'));
      })
      .catch(function(err) {
        console.warn('[Discord] Falha ao ler ' + FIREBASE_WEBHOOKS_PATH + ':', err);
        webhooksDiscordPromise = null;
      });
    return webhooksDiscordPromise;
  }

  garantirWebhooksDiscord();

  // Credenciais do Usuário
  var USUARIO_DEFAULT = 'Shiroe';
  var USUARIO_FINAL = lerUsuarioLoginArmazenado() || USUARIO_DEFAULT;
  var SENHA_DEFAULT = 'lulacarlos';
  var SENHA_FINAL = localStorage.getItem('BOT_SENHA') || SENHA_DEFAULT;

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

  function sincronizarUsuarioLocalStorage() {
    USUARIO_FINAL = lerUsuarioLoginArmazenado() || USUARIO_DEFAULT;
  }

  // --- CHECA SESSÃO EXPIRADA OU REQUISICÃO INVÁLIDA ---
  function checarSessaoExpirada() {
    var textoCorpo = (document.body ? document.body.innerText || document.body.textContent || '' : '').toLowerCase();
    var linkVoltar = document.querySelector('a[href*="history.back()"]');

    if (textoCorpo.indexOf('sessão expirada ou requisição inválida') !== -1 ||
        textoCorpo.indexOf('sessao expirada ou requisicao invalida') !== -1 ||
        linkVoltar) {
      console.warn('[Script Invasor] Sessao expirada — indo para login com parametros da sessao...');
      var url = salvarRecuperacaoAntesDeSair();
      try { location.replace(url); } catch (e) { location.href = url; }
      return true;
    }
    return false;
  }

  function extrairDerrotadoPorTexto(texto) {
    if (!texto) return null;
    var m = String(texto).match(/Derrotado por:\s*([^|\n]+?)\s+em:\s*([^\n|]+)/i);
    if (m) return { vencedor: m[1].trim(), em: m[2].trim() };
    m = String(texto).match(/Derrotado por:\s*([^\n|]+)/i);
    if (m) return { vencedor: m[1].trim(), em: '' };
    return null;
  }

  function extrairDerrotadoPorInvasorPagina() {
    var linhas = document.querySelectorAll('tr');
    for (var i = 0; i < linhas.length; i++) {
      var textoLinha = linhas[i].innerText || linhas[i].textContent || '';
      if (textoLinha.indexOf('Derrotado por:') === -1) continue;
      var lower = textoLinha.toLowerCase();
      if (lower.indexOf('ainda n') !== -1 && lower.indexOf('derrotado') !== -1) continue;
      var info = extrairDerrotadoPorTexto(textoLinha);
      if (info) return info;
    }
    var corpo = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    return extrairDerrotadoPorTexto(corpo);
  }

  function normalizarChaveFirebaseBossMorto(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function montarChaveEventoBossMorto(nomeInvasor, derrotadoEm) {
    var boss = normalizarChaveFirebaseBossMorto(nomeInvasor) || 'boss';
    var em = String(derrotadoEm || '').replace(/[^\d]/g, '');
    return boss + (em ? '_' + em : '');
  }

  function tentarReservarAvisoBossMortoFirebase(chave, payload, callback) {
    garantirFirebaseDatabase(function(db) {
      var ref = db.ref(INVASOR_MORTO_AVISO_FB_PATH + '/' + chave);
      ref.transaction(function(current) {
        if (current && current.vencedor) return undefined;
        return payload;
      }, function(error, committed, snapshot) {
        if (error) {
          console.warn('[Invasor] Firebase aviso boss morto:', error);
          callback(false);
          return;
        }
        var val = snapshot && snapshot.val();
        var ganhou = !!(committed && val && val.vencedor === payload.vencedor && val.ts === payload.ts);
        callback(ganhou);
      }, false);
    });
  }

  function tentarAvisarDiscordBossMorto(dados) {
    var nomeInvasor = (dados && dados.nomeInvasor ? dados.nomeInvasor : '').trim();
    var vencedor = (dados && dados.vencedor ? dados.vencedor : '').trim();
    var derrotadoEm = (dados && dados.derrotadoEm ? dados.derrotadoEm : '').trim();
    if (!nomeInvasor || !vencedor) {
      console.warn('[Invasor] Boss morto sem boss/vencedor — sem Discord.');
      return;
    }

    var chave = montarChaveEventoBossMorto(nomeInvasor, derrotadoEm);
    try {
      if (localStorage.getItem('BOT_INVASOR_MORTO_FB_' + chave) === '1') return;
    } catch (e) {}

    var payload = {
      boss: nomeInvasor,
      vencedor: vencedor,
      em: derrotadoEm,
      ts: Date.now(),
      conta: USUARIO_FINAL
    };

    tentarReservarAvisoBossMortoFirebase(chave, payload, function(ganhou) {
      try { localStorage.setItem('BOT_INVASOR_MORTO_FB_' + chave, '1'); } catch (e) {}
      if (!ganhou) {
        console.log('[Invasor] Aviso boss morto ja registrado no Firebase (' + chave + ').');
        return;
      }

      garantirWebhooksDiscord().then(function() {
        if (!DISCORD_WEBHOOK_INVASOR) {
          console.warn('[Discord] Webhook invasor ausente — boss morto nao enviado.');
          return;
        }

        var linhas = [
          '💀 **Invasor derrotado**',
          'Boss: **' + nomeInvasor + '**',
          'Vencedor: **' + vencedor + '**'
        ];
        if (derrotadoEm) linhas.push('Em: ' + derrotadoEm);
        linhas.push('Detectado por: `' + USUARIO_FINAL + '`');

        fetch(DISCORD_WEBHOOK_INVASOR, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Bot Shadow of Shinobi',
            content: linhas.join('\n')
          })
        }).then(function(r) {
          if (r.ok) {
            console.log('[Invasor] Discord boss morto — ' + vencedor + ' derrotou ' + nomeInvasor);
          }
        }).catch(function(err) {
          console.warn('[Discord] Falha boss morto:', err);
        });
      });
    });
  }

  // --- CHECA SE O INVASOR FOI DERROTADO (somente quando explicito no DOM) ---
  function checarInvasorDerrotadoExplicito() {
    var linhas = document.querySelectorAll('tr');
    for (var i = 0; i < linhas.length; i++) {
      var textoLinha = linhas[i].innerText || linhas[i].textContent || '';
      if (textoLinha.indexOf('Derrotado por:') === -1) continue;

      var lower = textoLinha.toLowerCase();
      if (lower.indexOf('ainda n') !== -1 && lower.indexOf('derrotado') !== -1) {
        return false;
      }
      return true;
    }
    return false;
  }

  function checarInvasorDerrotadoNoCombate() {
    var corpo = document.body ? document.body.innerText || document.body.textContent || '' : '';
    if (/AINDA N[AÃ]O foi derrotado/i.test(corpo)) return false;
    if (/invasor[^.\n]{0,40}foi derrotado/i.test(corpo)) return true;
    if (/foi derrotado[^.\n]{0,40}invasor/i.test(corpo)) return true;
    return checarInvasorDerrotadoExplicito();
  }

  // Assume invasor ativo se a pagina nao confirmar derrota (evita apagar Firebase cedo demais)
  function checarInvasorNaoDerrotado() {
    return !checarInvasorDerrotadoExplicito();
  }

  function extrairNomeInvasorPagina() {
    var linhas = document.querySelectorAll('tr');
    for (var i = 0; i < linhas.length; i++) {
      var tds = linhas[i].querySelectorAll('td');
      if (tds.length < 2) continue;
      var rotulo = (tds[0].textContent || '').trim().toLowerCase();
      if (rotulo.indexOf('nome do inimigo') === -1) continue;
      return (tds[1].textContent || '').replace(/^\|\s*/, '').trim();
    }
    var corpo = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    var m = corpo.match(/Nome do inimigo:\s*([^\n]+)/i);
    return m ? m[1].trim() : '';
  }

  function publicarEstadoInvasorParaCacadas(invasorDerrotado, temBotao, temTimer, derrotados, nomeInvasor) {
    try {
      var aguardandoProximoBoss = !!invasorDerrotado;
      if (!aguardandoProximoBoss && (temBotao || temTimer)) {
        aguardandoProximoBoss = false;
      } else if (!aguardandoProximoBoss && !temBotao && !temTimer) {
        aguardandoProximoBoss = (derrotados || 0) === 0;
      }

      localStorage.setItem('BOT_INVASOR_EVENTO_CACHE', JSON.stringify({
        aguardandoProximoBoss: aguardandoProximoBoss,
        invasorDerrotado: !!invasorDerrotado,
        temBotao: !!temBotao,
        temTimer: !!temTimer,
        derrotados: derrotados || 0,
        nomeInvasor: nomeInvasor || extrairNomeInvasorPagina() || '',
        ts: Date.now()
      }));
    } catch (e) {}
  }

  // --- EXTRAIR QUANTIDADE DE PLAYERS DERROTADOS ---
  function obterPlayersDerrotados() {
    var textoCorpo = document.body ? document.body.innerText || document.body.textContent || '' : '';
    var matchDerrotados = textoCorpo.match(/Players derrotados:\s*([\d.]+)/i);
    if (matchDerrotados) {
      var numString = matchDerrotados[1].replace(/\./g, '');
      var valor = parseInt(numString, 10);
      return isNaN(valor) ? 0 : valor;
    }
    return 0;
  }

  // --- OBTÉM O BOTÃO DE ATAQUE NO DOM ---
  function obterBotaoAtaque() {
    var btn = null;

    var formInvasor = document.querySelector('form[action*="invasor"]');
    if (formInvasor) {
      btn = formInvasor.querySelector('input[type="submit"]') || 
            formInvasor.querySelector('button[type="submit"]') || 
            formInvasor.querySelector('input[value="Atacar"]');
      if (btn) return btn;
    }

    btn = document.querySelector('input[name="atacar"]') || 
          document.querySelector('input[value="Atacar"]') || 
          document.querySelector('button[name="atacar"]');
    if (btn) return btn;

    var candidatos = document.querySelectorAll('input[type="submit"], button');
    for (var i = 0; i < candidatos.length; i++) {
      var el = candidatos[i];
      var txt = (el.value || el.innerText || '').toLowerCase();
      if (txt.indexOf('atacar') !== -1) {
        return el;
      }
    }

    return null;
  }

  // --- CARREGA HTML2CANVAS DINAMICAMENTE ---
  function carregarBibliotecaPrint() {
    if (window.html2canvas) return Promise.resolve();

    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // --- ROLA A TELA E ENVIA PRINT PRO DISCORD ---
  async function capturarEEnviarPrintInferiorDiscord(motivo, silencioso) {
    await garantirWebhooksDiscord();
    if (!DISCORD_WEBHOOK_INVASOR) {
      console.warn('[Discord] Webhook invasor ausente no Firebase (' + FIREBASE_WEBHOOKS_PATH + ').');
      return;
    }

    try {
      window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);

      await new Promise(function(r) { setTimeout(r, 300); });
      await carregarBibliotecaPrint();

      var canvas = await html2canvas(document.body, { 
        logging: false, 
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY
      });

      canvas.toBlob(function(blob) {
        if (!blob) {
          console.error('[Discord] Falha ao gerar imagem (Blob nulo).');
          return;
        }

        var payload = {
          content: '🚨 **Invasor Detectado / Visão Inferior!**\n**Gatilho:** `' + motivo + '`\n**Usuário:** `' + USUARIO_FINAL + '`'
        };

        if (silencioso) {
          payload.flags = 4096; // SUPPRESS_NOTIFICATIONS — posta no canal sem notificar
        }

        var formData = new FormData();
        formData.append('payload_json', JSON.stringify(payload));
        formData.append('file', blob, 'print-invasor.png');

        fetch(DISCORD_WEBHOOK_INVASOR, {
          method: 'POST',
          body: formData
        })
        .then(function(resposta) {
          if (resposta.ok) {
            console.log('[Discord] Print enviado com sucesso!' + (silencioso ? ' (silencioso)' : ''));
          } else {
            console.error('[Discord] Erro no Webhook:', resposta.status, resposta.statusText);
          }
        })
        .catch(function(erro) {
          console.error('[Discord] Erro de rede ao enviar print:', erro);
        });

      }, 'image/png');

    } catch (erro) {
      console.error('[Discord] Erro ao capturar print:', erro);
    }
  }

  function urlFirebase(path) {
    return FIREBASE_CONFIG.databaseURL + path;
  }

  function garantirFirebaseDatabase(callback) {
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

  function pararEscutaCoordInvasor() {
    if (escutaCoordRef) {
      try { escutaCoordRef.off(); } catch (e) {}
      escutaCoordRef = null;
    }
    escutaCoordInvasorAtiva = false;
    monitorLastHitCoord = null;
    lastHitAtaqueEmAndamento = false;
  }

  function ehScoutDaCoord(coord) {
    if (!coord) return false;
    if (checarContaGerenciada()) return true;
    return coord.scout === USUARIO_FINAL;
  }

  function obterDerrotadosReferencia(coord, localDerrotados) {
    if (coord && coord.derrotados_atual != null && !ehScoutDaCoord(coord)) {
      return coord.derrotados_atual;
    }
    return localDerrotados;
  }

  function sortearAlvoLastHit(coord) {
    var min = (coord && coord.sorteio_min != null) ? coord.sorteio_min : obterLastHitSorteioMin();
    var max = (coord && coord.sorteio_max != null) ? coord.sorteio_max : obterLastHitSorteioMax();
    if (max < min) {
      var tmp = min;
      min = max;
      max = tmp;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function garantirAlvoSorteadoNoFirebase(coord, derrotadosLocal) {
    if (!coordEhModoSorteio(coord) || coord.alvo_sorteado != null) {
      return Promise.resolve(coord);
    }
    if (!ehScoutDaCoord(coord)) {
      return Promise.resolve(coord);
    }
    if (derrotadosLocal == null || isNaN(derrotadosLocal)) {
      return Promise.resolve(coord);
    }

    var min = coord.sorteio_min || obterLastHitSorteioMin();
    if (derrotadosLocal < min) {
      return Promise.resolve(coord);
    }

    var alvo = sortearAlvoLastHit(coord);
    var atualizado = Object.assign({}, coord, {
      alvo_sorteado: alvo,
      derrotados_atual: derrotadosLocal,
      ts_atualizado: Date.now(),
      sorteado_por: USUARIO_FINAL
    });

    console.warn('[LastHit] Sorteio realizado! Alvo=' + formatarNumeroInvasor(alvo) +
      ' (faixa ' + formatarNumeroInvasor(min) + '-' +
      formatarNumeroInvasor(coord.sorteio_max || obterLastHitSorteioMax()) +
      ', atual ' + formatarNumeroInvasor(derrotadosLocal) + ')');

    return putCoordInvasor(atualizado).then(function() {
      enviarDiscordLastHitBaseline(atualizado);
      return atualizado;
    }).catch(function(err) {
      console.warn('[LastHit] Falha ao publicar alvo sorteado:', err);
      return coord;
    });
  }

  function atualizarDerrotadosAtualNoFirebase(coord, derrotadosLocal) {
    if (coordEhModoData(coord)) {
      return Promise.resolve(coord);
    }
    if (!coordMonitorAtivo(coord) || !ehScoutDaCoord(coord)) {
      return Promise.resolve(coord);
    }
    if (derrotadosLocal == null || isNaN(derrotadosLocal)) {
      return Promise.resolve(coord);
    }

    var atualizado = Object.assign({}, coord, {
      derrotados_atual: derrotadosLocal,
      ts_atualizado: Date.now()
    });

    return putCoordInvasor(atualizado).then(function() {
      return atualizado;
    }).catch(function(err) {
      console.warn('[LastHit] Falha ao publicar derrotados_atual:', err);
      return coord;
    });
  }

  function dispararLastHitSePronto(coord, derrotadosRef, origem) {
    if (!coordMonitorAtivo(coord) || jaAtacouNestaPagina || lastHitAtaqueEmAndamento) {
      return Promise.resolve(false);
    }

    var lh = avaliarLastHit(derrotadosRef, coord);
    if (coordEhModoData(coord)) {
      console.log('[LastHit] ' + (origem || 'check') + ' modo=data ataque=' +
        formatarHoraLocal(coord.ts_atacar) + ' restante=' + Math.ceil(lh.restanteMs / 1000) +
        's fase=' + lh.fase);
    } else if (coordEhModoSorteio(coord)) {
      console.log('[LastHit] ' + (origem || 'check') + ' modo=sorteio alvo=' +
        (coord.alvo_sorteado != null ? formatarNumeroInvasor(coord.alvo_sorteado) : '?') +
        ' ref=' + formatarNumeroInvasor(derrotadosRef) +
        ' faltam=' + (lh.faltam != null ? formatarNumeroInvasor(lh.faltam) : '?') +
        ' fase=' + lh.fase);
    } else {
      console.log('[LastHit] ' + (origem || 'check') + ' base=' + lh.base +
        ' ref=' + derrotadosRef + ' delta=' + lh.delta + '/' + lh.minDelta +
        ' fase=' + lh.fase);
    }

    if (!lh.pronto) return Promise.resolve(false);

    lastHitAtaqueEmAndamento = true;
    var motivoAtaque;
    if (coordEhModoData(coord)) {
      motivoAtaque = 'Last hit ' + origem + ' (3min pos-janela)';
    } else if (coordEhModoSorteio(coord)) {
      motivoAtaque = 'Last hit ' + origem + ' (sorteio >= ' + formatarNumeroInvasor(lh.alvo) + ')';
    } else {
      motivoAtaque = 'Last hit ' + origem + ' (+' + lh.delta + ' derrotados)';
    }
    console.warn('[LastHit] Pronto (' + origem + ')! Disparando ataque (' + USUARIO_FINAL + ')...');

    return marcarCoordAtacando(coord).then(function() {
      tentarAtacarLocalmente(motivoAtaque);
      return true;
    }).catch(function(err) {
      console.warn('[LastHit] Erro ao atacar:', err);
      return false;
    }).then(function(atacou) {
      lastHitAtaqueEmAndamento = false;
      return atacou;
    });
  }

  function aoReceberCoordFirebase(coord) {
    if (!coordMonitorAtivo(coord)) return;

    var entradaNova = !monitorLastHitCoord;
    monitorLastHitCoord = coord;

    if (entradaNova) {
      if (coordEhModoData(coord)) {
        console.warn('[LastHit] Janela Firebase ativa (modo data) — ataque=' +
          formatarHoraLocal(coord.ts_atacar) + ', registrado_por=' + (coord.registrado_por || '?'));
      } else if (coordEhModoSorteio(coord)) {
        console.warn('[LastHit] Janela Firebase ativa (modo sorteio) — alvo=' +
          (coord.alvo_sorteado != null ? formatarNumeroInvasor(coord.alvo_sorteado) : 'pendente') +
          ', scout=' + (coord.scout || '?'));
      } else {
        console.warn('[LastHit] Janela Firebase ativa — scout=' + (coord.scout || '?') +
          ', base=' + coord.derrotados_base +
          ', atual=' + (coord.derrotados_atual != null ? coord.derrotados_atual : '?'));
      }
      if (!ehScoutDaCoord(coord) || coordEhModoData(coord)) {
        if (reloadInvasorTimer) {
          clearTimeout(reloadInvasorTimer);
          reloadInvasorTimer = null;
        }
        agendarReloadInvasor(TEMPO_RELOAD_MONITOR);
      }
    }

    if (ehScoutDaCoord(coord) && !coordEhModoData(coord)) return;

    var derrotadosRef = obterDerrotadosReferencia(coord, obterPlayersDerrotados());
    dispararLastHitSePronto(coord, derrotadosRef, 'escuta Firebase');
  }

  function garantirEscutaCoordInvasor() {
    if (escutaCoordInvasorAtiva) return;

    escutaCoordInvasorAtiva = true;
    garantirFirebaseDatabase(function(db) {
      if (!escutaCoordInvasorAtiva) return;

      escutaCoordRef = db.ref('invasor_coord');
      escutaCoordRef.on('value', function(snap) {
        aoReceberCoordFirebase(snap.val());
      });

      console.log('[LastHit] Escuta invasor_coord ativa (janela + derrotados_atual do scout).');
    });
  }

  function reloadInvasorImediato(motivo) {
    if (reloadInvasorTimer) {
      clearTimeout(reloadInvasorTimer);
      reloadInvasorTimer = null;
    }
    pararEscutaCoordInvasor();
    console.warn('[LastHit] Reload imediato — ' + motivo);
    location.reload();
  }

  function agendarReloadInvasor(ms) {
    if (reloadInvasorTimer) clearTimeout(reloadInvasorTimer);
    reloadInvasorTimer = setTimeout(function() {
      reloadInvasorTimer = null;
      pararEscutaCoordInvasor();
      location.reload();
    }, ms);
  }

  function deveEscutarCoordScout(coord, derrotados) {
    if (checarContaGerenciada()) return false;
    if (coordMonitorAtivo(coord)) return false;
    return derrotados > LIMITE_PLAYERS_DERROTADOS;
  }

  function iniciarEscutaCoordInvasor() {
    garantirEscutaCoordInvasor();
  }

  function fetchCoordInvasor() {
    return fetch(urlFirebase(COORD_INVASOR_PATH))
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(data) {
        if (data === null || data === undefined) return null;
        if (typeof data !== 'object' || Array.isArray(data)) return null;
        return data;
      })
      .catch(function(err) {
        console.warn('[LastHit] Falha ao ler invasor_coord:', err);
        return null;
      });
  }

  function putCoordInvasor(data) {
    return fetch(urlFirebase(COORD_INVASOR_PATH), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(res) {
      if (!res.ok) {
        throw new Error('PUT invasor_coord HTTP ' + res.status);
      }
      return res;
    });
  }

  function limparCoordInvasor(motivo) {
    return fetch(urlFirebase(COORD_INVASOR_PATH), { method: 'DELETE' })
      .then(function(res) {
        if (res.ok || res.status === 404) {
          console.log('[LastHit] invasor_coord removido (' + motivo + ').');
        } else {
          console.warn('[LastHit] DELETE invasor_coord HTTP ' + res.status);
        }
      })
      .catch(function(err) {
        console.warn('[LastHit] Falha ao limpar invasor_coord:', err);
      });
  }

  function limparComandoAtacar(motivo) {
    return fetch(urlFirebase(COMANDO_ATACAR_PATH), { method: 'DELETE' })
      .then(function(res) {
        if (res.ok || res.status === 404) {
          if (motivo) console.log('[LastHit] comando_atacar removido (' + motivo + ').');
        } else {
          console.warn('[LastHit] DELETE comando_atacar HTTP ' + res.status);
        }
      })
      .catch(function(err) {
        console.warn('[LastHit] Falha ao limpar comando_atacar:', err);
      });
  }

  function limparAvisosMonitorSession() {
    try {
      var keys = [];
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf('BOT_LASTHIT_AVISO_') === 0) keys.push(k);
      }
      keys.forEach(function(k) { sessionStorage.removeItem(k); });
    } catch (e) {}
  }

  function limparEstadoFirebaseInvasor(motivo) {
    console.log('[LastHit] Limpando Firebase invasor (' + motivo + ')...');
    return Promise.all([
      limparCoordInvasor(motivo),
      limparComandoAtacar(motivo)
    ]).then(function() {
      limparAvisosMonitorSession();
      try { sessionStorage.removeItem(LEGACY_COMANDO_LIMPO_KEY); } catch (e) {}
    });
  }

  function limparComandoAtacarLegadoSeNecessario() {
    try {
      if (sessionStorage.getItem(LEGACY_COMANDO_LIMPO_KEY) === '1') {
        return Promise.resolve();
      }
      sessionStorage.setItem(LEGACY_COMANDO_LIMPO_KEY, '1');
    } catch (e) {
      return Promise.resolve();
    }
    return limparComandoAtacar('legado v5.x — comando_atacar obsoleto no v6');
  }

  function coordExpirada(coord) {
    if (!coord || !coord.ts) return false;
    return (Date.now() - coord.ts) > COORD_MAX_IDADE_MS;
  }

  function coordEhModoData(coord) {
    return !!(coord && coord.modo === 'data' && coord.ts_atacar != null);
  }

  function coordEhModoSorteio(coord) {
    return !!(coord && coord.modo === 'sorteio');
  }

  function coordMonitorAtivo(coord) {
    if (!coord || (coord.fase !== 'aguardando' && coord.fase !== 'atacando')) return false;
    if (coordEhModoData(coord)) return true;
    if (coordEhModoSorteio(coord)) return true;
    return coord.derrotados_base != null;
  }

  function formatarHoraLocal(ts) {
    try {
      return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return String(ts);
    }
  }

  function enviarDiscordLastHitBaseline(coord) {
    if (!coord) return;

    garantirWebhooksDiscord().then(function() {
      if (!DISCORD_WEBHOOK_INVASOR) {
        console.warn('[Discord] Webhook invasor ausente no Firebase (' + FIREBASE_WEBHOOKS_PATH + ').');
        return;
      }

      var conteudo;
    if (coordEhModoData(coord)) {
      conteudo = [
        '🎯 **Janela Last Hit aberta (modo data)**',
        '**Janela aberta:** `' + formatarHoraLocal(coord.ts_janela) + '`',
        '**Ataque programado:** `' + formatarHoraLocal(coord.ts_atacar) + '` (+3min)',
        '**Registrado por:** `' + (coord.registrado_por || '?') + '`',
        '**Contas:** Firebase sincroniza; todas atacam 3min apos sumir botao/cooldown (sem scout de derrotados).'
      ].join('\n');
    } else if (coordEhModoSorteio(coord)) {
      conteudo = [
        '🎲 **Janela Last Hit aberta (modo sorteio)**',
        '**Faixa:** `' + formatarNumeroInvasor(coord.sorteio_min) + ' - ' +
          formatarNumeroInvasor(coord.sorteio_max) + '`',
        '**Alvo sorteado:** `' + (coord.alvo_sorteado != null ? formatarNumeroInvasor(coord.alvo_sorteado) : 'aguardando >= min') + '`',
        '**Atual:** `' + formatarNumeroInvasor(coord.derrotados_atual) + '`',
        '**Scout:** `' + (coord.scout || '?') + '`',
        '**Contas:** scout publica derrotados; todas atacam ao atingir o alvo sorteado.'
      ].join('\n');
    } else {
      conteudo = [
        '🎯 **Janela Last Hit aberta**',
        '**Players derrotados (base):** `' + coord.derrotados_base + '`',
        '**Ataques minimos (delta):** `' + coord.min_delta + '`',
        '**Alvo:** `' + (coord.derrotados_base + coord.min_delta) + ' derrotados`',
        '**Scout:** `' + (coord.scout || '?') + '`',
        '**Contas:** scout publica `derrotados_atual` a cada reload; seguidores atacam ao delta `' +
          coord.min_delta + '` (meta `' + (coord.derrotados_base + coord.min_delta) + '`).'
      ].join('\n');
    }

    fetch(DISCORD_WEBHOOK_INVASOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: conteudo })
    }).catch(function(err) {
      console.warn('[Discord] Falha ao avisar last hit:', err);
    });
    });
  }

  function registrarJanelaLastHitSeNecessario(derrotadosAtual) {
    return fetchCoordInvasor().then(function(coord) {
      if (coordMonitorAtivo(coord)) {
        if (coordEhModoData(coord)) {
          console.log('[LastHit] Coord ja ativa (modo data) — ataque=' +
            formatarHoraLocal(coord.ts_atacar) + ' fase=' + coord.fase);
        } else if (coordEhModoSorteio(coord)) {
          console.log('[LastHit] Coord ja ativa (modo sorteio) — alvo=' +
            (coord.alvo_sorteado != null ? formatarNumeroInvasor(coord.alvo_sorteado) : '?') +
            ' fase=' + coord.fase);
    } else {
          console.log('[LastHit] Coord ja ativa — base=' + coord.derrotados_base + ' fase=' + coord.fase);
        }
        return coord;
      }

      var agora = Date.now();
      var novo;

      if (lastHitModoData()) {
        novo = {
          modo: 'data',
          ts_janela: agora,
          ts_atacar: agora + TEMPO_LASTHIT_POR_DATA_MS,
          fase: 'aguardando',
          ts: agora,
          ts_atualizado: agora,
          registrado_por: USUARIO_FINAL
        };

        console.warn('[LastHit] Janela detectada (modo data)! Ataque em 3min — ' +
          formatarHoraLocal(novo.ts_atacar));
      } else if (lastHitModoSorteio()) {
        var sortMin = obterLastHitSorteioMin();
        var sortMax = obterLastHitSorteioMax();
        novo = {
          modo: 'sorteio',
          sorteio_min: sortMin,
          sorteio_max: sortMax,
          alvo_sorteado: null,
          derrotados_atual: derrotadosAtual,
          fase: 'aguardando',
          ts: agora,
          ts_atualizado: agora,
          scout: USUARIO_FINAL
        };

        if (derrotadosAtual != null && !isNaN(derrotadosAtual) && derrotadosAtual >= sortMin) {
          novo.alvo_sorteado = sortearAlvoLastHit(novo);
          novo.sorteado_por = USUARIO_FINAL;
          console.warn('[LastHit] Sorteio registrado! Alvo=' + formatarNumeroInvasor(novo.alvo_sorteado) +
            ' (atual ' + formatarNumeroInvasor(derrotadosAtual) + ')');
      } else {
          console.warn('[LastHit] Sorteio registrado — aguardando ' + formatarNumeroInvasor(sortMin) +
            ' para sortear (atual ' + formatarNumeroInvasor(derrotadosAtual) + ')');
        }
      } else {
        novo = {
          derrotados_base: derrotadosAtual,
          derrotados_atual: derrotadosAtual,
          min_delta: obterMinAtaquesInvasor(),
          fase: 'aguardando',
          ts: agora,
          ts_atualizado: agora,
          scout: USUARIO_FINAL
        };

        console.warn('[LastHit] Janela detectada! Gravando baseline=' + derrotadosAtual +
          ' min_delta=' + novo.min_delta);
      }

      return putCoordInvasor(novo).then(function() {
        enviarDiscordLastHitBaseline(novo);
        var motivoPrint;
        if (coordEhModoData(novo)) {
          motivoPrint = 'Last Hit — modo data (ataque ' + formatarHoraLocal(novo.ts_atacar) + ')';
        } else if (coordEhModoSorteio(novo)) {
          motivoPrint = 'Last Hit — sorteio ' + (novo.alvo_sorteado != null
            ? formatarNumeroInvasor(novo.alvo_sorteado)
            : ('aguardando ' + formatarNumeroInvasor(novo.sorteio_min)));
        } else {
          motivoPrint = 'Last Hit — baseline ' + derrotadosAtual + ' (+' + novo.min_delta + ')';
        }
        capturarEEnviarPrintInferiorDiscord(motivoPrint, false);
        return novo;
      });
    });
  }

  function marcarCoordAtacando(coord) {
    if (!coord || coord.fase === 'atacando') return Promise.resolve();
    var atualizado = Object.assign({}, coord, {
      fase: 'atacando',
      ts_atacando: Date.now()
    });
    return putCoordInvasor(atualizado);
  }

  function avaliarLastHit(derrotadosAtual, coord) {
    if (!coordMonitorAtivo(coord)) {
      return { pronto: false, delta: 0, minDelta: 0, restanteMs: 0 };
    }

    if (coordEhModoData(coord)) {
      var restanteMs = Math.max(0, coord.ts_atacar - Date.now());
      return {
        pronto: Date.now() >= coord.ts_atacar,
        restanteMs: restanteMs,
        ts_atacar: coord.ts_atacar,
        ts_janela: coord.ts_janela,
        fase: coord.fase,
        modo: 'data'
      };
    }

    if (coordEhModoSorteio(coord)) {
      var alvo = coord.alvo_sorteado;
      var prontoSorteio = alvo != null && derrotadosAtual != null && !isNaN(derrotadosAtual) &&
        derrotadosAtual >= alvo;
      return {
        pronto: prontoSorteio,
        alvo: alvo,
        faltam: alvo != null && derrotadosAtual != null ? Math.max(0, alvo - derrotadosAtual) : null,
        fase: coord.fase,
        restanteMs: 0,
        modo: 'sorteio'
      };
    }

    var minDelta = coord.min_delta || obterMinAtaquesInvasor();
    var delta = derrotadosAtual - coord.derrotados_base;

    return {
      pronto: delta >= minDelta,
      delta: delta,
      minDelta: minDelta,
      base: coord.derrotados_base,
      fase: coord.fase,
      restanteMs: 0,
      modo: 'scout'
    };
  }

  function logMonitorLastHitAtivo(coord, derrotados, temBotao, temTimer) {
    var extras = [];
    if (temTimer) extras.push('cooldown local');
    if (temBotao) extras.push('botao visivel');
    if (!temBotao && !temTimer) extras.push('janela aberta nesta conta');

    if (coordEhModoData(coord)) {
      var restanteMs = Math.max(0, coord.ts_atacar - Date.now());
      console.warn(
        '[LastHit] Firebase ATIVO (modo data) — reload ' + (TEMPO_RELOAD_MONITOR / 1000) +
        's | ataque em ' + Math.ceil(restanteMs / 1000) + 's (' +
        formatarHoraLocal(coord.ts_atacar) + ')' +
        (extras.length ? ' (' + extras.join(', ') + ')' : '')
      );
      return;
    }

    if (coordEhModoSorteio(coord)) {
      var alvoSort = coord.alvo_sorteado;
      var msgSort = alvoSort != null
        ? 'meta ' + formatarNumeroInvasor(alvoSort) + ' | atual ' + formatarNumeroInvasor(derrotados) +
          ' | faltam ' + formatarNumeroInvasor(Math.max(0, alvoSort - derrotados))
        : 'aguardando sorteio (>= ' + formatarNumeroInvasor(coord.sorteio_min || obterLastHitSorteioMin()) +
          ') | atual ' + formatarNumeroInvasor(derrotados);
      console.warn(
        '[LastHit] Firebase ATIVO (modo sorteio) — reload ' + (TEMPO_RELOAD_MONITOR / 1000) +
        's | ' + msgSort +
        (extras.length ? ' (' + extras.join(', ') + ')' : '')
      );
      return;
    }

    var minDelta = coord.min_delta || obterMinAtaquesInvasor();
    var alvo = coord.derrotados_base + minDelta;

    console.warn(
      '[LastHit] Firebase ATIVO — reload ' + (TEMPO_RELOAD_MONITOR / 1000) + 's | meta ' +
      alvo + ' derrotados | atual ' + derrotados +
      (extras.length ? ' (' + extras.join(', ') + ')' : '')
    );
  }

  function avisarMonitorSeNecessario(coord, derrotados, temBotao, temTimer) {
    if (!coordMonitorAtivo(coord)) return;
    try {
      var chave = 'BOT_LASTHIT_AVISO_' + coord.ts;
      if (sessionStorage.getItem(chave) === '1') return;
      sessionStorage.setItem(chave, '1');
    } catch (e) {
      return;
    }
    logMonitorLastHitAtivo(coord, derrotados, temBotao, temTimer);
  }

  function resolverTempoReloadInvasor(coord) {
    if (checarContaGerenciada()) return TEMPO_RELOAD_GERENCIADA;
    if (coordMonitorAtivo(coord)) return TEMPO_RELOAD_MONITOR;
    return TEMPO_RELOAD_PADRAO;
  }

  function descreverTempoReload(tempoMs) {
    return (tempoMs / 1000) + 's' +
      (tempoMs === TEMPO_RELOAD_GERENCIADA ? ' (conta gerenciada)' : '');
  }

  function processarCoordInvasor(coord, derrotados, temBotao, temTimer) {
    if (coord && coordExpirada(coord)) {
      console.warn('[LastHit] Coord expirada (>45min) — limpando estado.');
      return limparEstadoFirebaseInvasor('coord expirada').then(function() {
        return resolverTempoReloadInvasor(null);
      });
    }

    if (coord && !coordEhModoData(coord) && !coordEhModoSorteio(coord) &&
        coord.derrotados_base != null && derrotados < coord.derrotados_base) {
      console.warn('[LastHit] Derrotados (' + derrotados + ') < base (' +
        coord.derrotados_base + ') — novo evento? Limpando coord.');
      return limparEstadoFirebaseInvasor('contador derrotados regrediu').then(function() {
        return resolverTempoReloadInvasor(null);
      });
    }

    if (coordMonitorAtivo(coord)) {
      if (coordEhModoData(coord)) {
        avisarMonitorSeNecessario(coord, derrotados, temBotao, temTimer);
        garantirEscutaCoordInvasor();
        return dispararLastHitSePronto(coord, derrotados, 'reload data').then(function() {
          return resolverTempoReloadInvasor(coord);
        });
      }

      if (coordEhModoSorteio(coord)) {
        return atualizarDerrotadosAtualNoFirebase(coord, derrotados).then(function(coordPub) {
          return garantirAlvoSorteadoNoFirebase(coordPub || coord, derrotados).then(function(coordSorteio) {
            var coordAtiva = coordSorteio;
            var derrotadosRef = obterDerrotadosReferencia(coordAtiva, derrotados);

            avisarMonitorSeNecessario(coordAtiva, derrotadosRef, temBotao, temTimer);

            if (!ehScoutDaCoord(coordAtiva)) {
              garantirEscutaCoordInvasor();
            }

            return dispararLastHitSePronto(
              coordAtiva,
              derrotadosRef,
              ehScoutDaCoord(coordAtiva) ? 'reload sorteio scout' : 'reload sorteio'
            ).then(function() {
              return resolverTempoReloadInvasor(coordAtiva);
            });
          });
        });
      }

      return atualizarDerrotadosAtualNoFirebase(coord, derrotados).then(function(coordPub) {
        var coordAtiva = coordPub || coord;
        var derrotadosRef = obterDerrotadosReferencia(coordAtiva, derrotados);

        avisarMonitorSeNecessario(coordAtiva, derrotadosRef, temBotao, temTimer);

        if (!ehScoutDaCoord(coordAtiva)) {
          garantirEscutaCoordInvasor();
        }

        return dispararLastHitSePronto(
          coordAtiva,
          derrotadosRef,
          ehScoutDaCoord(coordAtiva) ? 'reload scout' : 'reload seguidor'
        ).then(function() {
          return resolverTempoReloadInvasor(coordAtiva);
        });
      });
    }

    console.log('[Invasor] Players derrotados: ' + derrotados +
      ' (limite early: ' + LIMITE_PLAYERS_DERROTADOS + ')');

    if (temBotao && derrotados <= LIMITE_PLAYERS_DERROTADOS) {
      tentarAtacarLocalmente('Early (<= ' + LIMITE_PLAYERS_DERROTADOS + ' derrotas)');
    } else if (derrotados > LIMITE_PLAYERS_DERROTADOS) {
      var tempoPosLimite = resolverTempoReloadInvasor(coord);
      if (lastHitModoData()) {
        console.log('[Invasor] Pos-limite (modo data) — aguardando sumir botao/cooldown para registrar janela (reload ' +
          descreverTempoReload(tempoPosLimite) + ').');
      } else if (lastHitModoSorteio()) {
        console.log('[Invasor] Pos-limite (modo sorteio) — aguardando >= ' +
          formatarNumeroInvasor(obterLastHitSorteioMin()) + ' derrotados (reload ' +
          descreverTempoReload(tempoPosLimite) + ').');
    } else {
        console.log('[Invasor] Pos-limite — aguardando scout registrar janela no Firebase (reload ' +
          descreverTempoReload(tempoPosLimite) + ').');
      }
      if (deveEscutarCoordScout(coord, derrotados)) {
        iniciarEscutaCoordInvasor();
      }
    }

    return resolverTempoReloadInvasor(coord);
  }

  function processarPaginaInvasor() {
    return limparComandoAtacarLegadoSeNecessario().then(function() {
      var invasorDerrotado = checarInvasorDerrotadoExplicito();
      var derrotados = obterPlayersDerrotados();
      var btnAtacar = obterBotaoAtaque();
      var elementoTimer = document.querySelector('[id^="inv_cd_timer_"]');
      var temBotao = !!btnAtacar;
      var temTimer = elementoTimer !== null;

      console.log('[Invasor Checklist]', {
        temBotao: temBotao,
        temTimer: temTimer,
        invasorDerrotado: invasorDerrotado,
        derrotados: derrotados
      });

      publicarEstadoInvasorParaCacadas(
        invasorDerrotado, temBotao, temTimer, derrotados, extrairNomeInvasorPagina()
      );

      if (invasorDerrotado) {
        var derrotaInfo = extrairDerrotadoPorInvasorPagina();
        tentarAvisarDiscordBossMorto({
          nomeInvasor: extrairNomeInvasorPagina(),
          vencedor: derrotaInfo ? derrotaInfo.vencedor : '',
          derrotadoEm: derrotaInfo ? derrotaInfo.em : ''
        });
        return limparEstadoFirebaseInvasor('boss derrotado na pagina /invasor').then(function() {
          return resolverTempoReloadInvasor(null);
        });
      }

      // 1) Le Firebase primeiro — contas com cooldown entram no poll 2s assim que scout registrar
      return fetchCoordInvasor().then(function(coord) {
        if (coordMonitorAtivo(coord)) {
          return processarCoordInvasor(coord, derrotados, temBotao, temTimer);
        }

        // 2) Sem coord: registrar janela ou iniciar sorteio ao atingir faixa minima
        if (!temBotao && !temTimer) {
          var msgJanela;
          if (lastHitModoData()) {
            msgJanela = '[LastHit] Sem botao/cooldown — registrando janela (modo data, +3min)...';
          } else if (lastHitModoSorteio()) {
            msgJanela = '[LastHit] Sem botao/cooldown — registrando sorteio no Firebase...';
          } else {
            msgJanela = '[LastHit] Sem botao/cooldown — registrando baseline no Firebase...';
          }
          console.warn(msgJanela);
          return registrarJanelaLastHitSeNecessario(derrotados).then(function() {
            return fetchCoordInvasor();
          }).then(function(coordNova) {
            return processarCoordInvasor(coordNova, derrotados, temBotao, temTimer);
          });
        }

        if (lastHitModoSorteio() && derrotados >= obterLastHitSorteioMin()) {
          console.warn('[LastHit] Sorteio — >= ' + formatarNumeroInvasor(obterLastHitSorteioMin()) +
            ' derrotados, registrando coord no Firebase...');
          return registrarJanelaLastHitSeNecessario(derrotados).then(function() {
            return fetchCoordInvasor();
          }).then(function(coordNova) {
            return processarCoordInvasor(coordNova, derrotados, temBotao, temTimer);
          });
        }

        return processarCoordInvasor(coord, derrotados, temBotao, temTimer);
      });
    });
  }

  // --- EXECUTA ATAQUE LOCALMENTE ---
  function tentarAtacarLocalmente(motivo) {
    if (jaAtacouNestaPagina) {
      console.warn('[Invasor] Ataque já disparado neste ciclo. Ignorando.');
      return;
    }
    jaAtacouNestaPagina = true;

    var tentativas = 0;
    var maxTentativas = 15;

    console.log('[Invasor] Solicitando ataque local (' + motivo + '). Tentando encontrar o botão...');

    var timerBusca = setInterval(function() {
      tentativas++;
      var btnAtacar = obterBotaoAtaque();

      if (btnAtacar) {
        clearInterval(timerBusca);

        console.log('[Invasor] Botão localizado na tentativa #' + tentativas + '! Clicando...');
        
        for (var c = 0; c < 5; c++) {
          btnAtacar.click();
        }

      } else if (tentativas >= maxTentativas) {
        clearInterval(timerBusca);
        console.error('[Invasor] Botão de ataque não encontrado após ' + maxTentativas + ' tentativas.');
      }
    }, 200);
  }

  // --- CHECA SE É CONTA GERENCIADA ---
  function normalizarTextoPagina(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function checarContaGerenciada() {
    try {
      if (localStorage.getItem('BOT_CONTA_GERENCIADA') === '1') return true;
    } catch (e) {}

    var linkVoltar = document.querySelector('a[href*="automacao?voltar=1"]') ||
      document.querySelector('a[href*="automacao"][href*="voltar"]');

    if (linkVoltar) return true;

    var corpo = normalizarTextoPagina(
      document.body ? (document.body.innerText || document.body.textContent || '') : ''
    );

    if (corpo.indexOf('conta gerenciada') !== -1) return true;
    if (corpo.indexOf('jogando com a conta gerenciada') !== -1) return true;
    if (corpo.indexOf('voce esta jogando com a conta gerenciada') !== -1) return true;

    return false;
  }

  // --- DETECÇÃO DE ERRO DE SERVIDOR ---
  function checarErroServidor() {
    var elErro = document.querySelector('.error-code');
    if (elErro) {
      var txtErro = (elErro.innerText || elErro.textContent || '').toUpperCase();
      if (txtErro.indexOf('HTTP ERROR') !== -1 || txtErro.indexOf('500') !== -1) return true;
    }
    var textoCorpo = (document.body ? document.body.innerText || document.body.textContent || '' : '').toUpperCase();
    return (
      textoCorpo.indexOf('HTTP ERROR 500') !== -1 ||
      textoCorpo.indexOf('500 INTERNAL SERVER ERROR') !== -1 ||
      textoCorpo.indexOf('502 BAD GATEWAY') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNAVAILABLE') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNVAILABLE') !== -1 ||
      textoCorpo.indexOf('504 GATEWAY TIMEOUT') !== -1
    );
  }

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
    } catch (e) {}
  }

  function agendarReloadFalha(motivo, delayMs) {
    if (reloadAgendado) return;
    reloadAgendado = true;

    var url = salvarRecuperacaoAntesDeSair();
    var espera = typeof delayMs === 'number' ? delayMs : TEMPO_RELOAD_FALHA;

    console.warn('[Script Invasor] FALHA: ' + motivo);
    setTimeout(function() {
      console.log('[Script Invasor] Recuperacao — login com parametros da sessao (sem reload)...');
      try { location.replace(url); } catch (e) { location.href = url; }
    }, espera);
  }

  function redirecionarParaInvasor(motivo) {
    console.warn('[Script Invasor] Redirecionando para Invasor (' + motivo + ')...');
    window.location.href = URL_INVASOR;
  }

  console.log('[Script Invasor] Usuário: ' + USUARIO_FINAL +
    ' | Limite early: ' + descreverLimiteInvasor() +
    ' | Min ataques last hit: ' + descreverMinAtaquesInvasor());
  logLastHitNoConsole();

  setTimeout(function() {
    try {
      sincronizarModoAba();

      if (!ehAbaInvasor()) {
        return;
      }

      if (document.getElementById('login')) {
        console.log('[Script Invasor] Tela de login — sem acao (caçadas faz login).');
        return;
      }

      if (checarContaGerenciada()) {
        console.warn('[Invasor] Conta GERENCIADA detectada — reload rapido ' +
          (TEMPO_RELOAD_GERENCIADA / 1000) + 's para acompanhar sumida do botao.');
      }

      var urlAtual = window.location.href;

      var pagina = classificarPaginaInvasor(urlAtual);

      if (!pagina.noEscopo) {
        console.log('[Script Invasor] Pagina fora do escopo — sem acao.');
        return;
      }

      sincronizarUsuarioLocalStorage();

      if (checarSessaoExpirada()) {
        return;
      }

      if (checarErroServidor()) {
        agendarReloadFalha('Erro de Servidor 500/502/503/504 detectado.', 3000);
        return;
      }

      // 1. CAPTCHA — delegado ao atkSOS.js (evita Discord/Firebase duplicado)
      if (pagina.ehCaptcha || document.querySelector('form[action="captcha_seguranca"]')) {
        console.log('[Script Invasor] Captcha — sem acao (delegado ao atkSOS).');
        return;
      }

      // Login fica a cargo do atkSOS.js (home não está no filtro desta extensão)

      // 2. TELA DO INVASOR (PRINCIPAL)
      if (pagina.ehInvasor) {
        processarPaginaInvasor().then(function(tempoReload) {
          var espera = typeof tempoReload === 'number'
            ? tempoReload
            : resolverTempoReloadInvasor(null);
          console.log('[Script Invasor] Reload em ' + descreverTempoReload(espera) + '.');
          agendarReloadInvasor(espera);
        }).catch(function(err) {
          agendarReloadFalha('Erro last hit: ' + (err && err.message ? err.message : err));
        });
        return;
      }

      // 3. TELA PÓS-COMBATE
      if (pagina.ehCombate) {
        if (checarInvasorDerrotadoNoCombate()) {
          var derrotaCombate = extrairDerrotadoPorInvasorPagina();
          tentarAvisarDiscordBossMorto({
            nomeInvasor: extrairNomeInvasorPagina(),
            vencedor: derrotaCombate ? derrotaCombate.vencedor : '',
            derrotadoEm: derrotaCombate ? derrotaCombate.em : ''
          });
          limparEstadoFirebaseInvasor('boss derrotado na pagina de combate');
        }

        console.log('[Invasor Combate] Batalha concluída. Aguardando 1 min para retornar...');
        capturarEEnviarPrintInferiorDiscord('Relatório de Combate Concluído', DISCORD_COMBATE_SILENCIOSO);

        setTimeout(function() {
          window.location.href = URL_INVASOR;
        }, TEMPO_ESPERA_POS_COMBATE);
        return;
      }

      // 4. STATUS → redireciona para invasor (recupera modo da aba se necessario)
      if (pagina.ehStatus) {
        if (!obterModoAba() && ehReferrerPosLogin()) {
          recuperarModoAbaPosLogin();
        }
        if (obterModoAba() === 'invasor') {
          redirecionarParaInvasor('status');
        }
        return;
      }

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();