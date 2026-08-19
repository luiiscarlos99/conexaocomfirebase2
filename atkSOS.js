// ==UserScript==
// @name         Bot Atacar - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      2.51
// @description  Automação do Caçadas/Atacar com digitação simulada de Captcha, atraso aleatório, timeout de Captcha (10min) e Firebase.
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

  function aplicarParamsCacadasAtacar(rp) {
    if (!rp) return;
    var w = rp.get('bot_whitelist_cacadas');
    var wc = rp.get('bot_whitelist_cla_cacadas');
    var r = rp.get('bot_max_ryous_cacadas');
    var d = rp.get('bot_diff_nivel_cacadas');
    var v = rp.get('bot_min_ryous_vitoria_cacadas');
    if (w !== null && w !== '') gravarWhitelistCacadasParam(w);
    if (wc !== null && wc !== '') gravarWhitelistClaCacadasParam(wc);
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
      if (u) localStorage.setItem('BOT_USUARIO', u);
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
      if (u) localStorage.setItem('BOT_USUARIO', u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      aplicarParamsCacadasAtacar(params);
      if (!u && !p && !n) aplicarCredenciaisReferrer();

      if ((u || p || n || e || l || params.get('bot_whitelist_cacadas') ||
          params.get('bot_whitelist_cla_cacadas') ||
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
    exibirModoAbaServerID();
    return params;
  }

  function exibirModoAbaServerID() {
    function aplicar() {
      var el = document.getElementById('serverID');
      if (!el) return false;
      var modo = '';
      try { modo = sessionStorage.getItem(BOT_MODO_KEY) || ''; } catch (e) {}
      if (!el.dataset.botServerBase) {
        el.dataset.botServerBase = (el.textContent || '').replace(/\s*\|\s*Bot:.*$/i, '').trim();
      }
      var label = (modo === 'invasor' || modo === 'cacadas') ? modo : 'manual';
      el.textContent = el.dataset.botServerBase + ' | Bot: ' + label;
      return true;
    }
    if (aplicar()) return;
    setTimeout(aplicar, 800);
    setTimeout(aplicar, 2500);
  }

  aplicarParamsUrl();
  exibirModoAbaServerID();

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '2.51';
  var SCRIPT_ATUALIZADO = '19/08/2026 11:52';
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
      var u = localStorage.getItem('BOT_USUARIO');
      var p = localStorage.getItem('BOT_SENHA');
      var n = localStorage.getItem('BOT_NIVEL_CACADAS');
      var e = localStorage.getItem('BOT_ESPERA_CACADAS');
      var l = localStorage.getItem('BOT_LIMITE_INVASOR');
      var w = localStorage.getItem('BOT_WHITELIST_CACADAS');
      var wc = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS');
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
    console.log('[Script Caçadas] Sem BOT_MODO_ABA — sem acao (modo atual: vazio). Use /cacadas?bot_modo=cacadas ou /invasor?bot_modo=invasor.');
    return;
  }

  if (modoInicial !== 'cacadas' && modoInicial !== 'invasor') {
    return;
  }

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = TEMPO_RECUPERACAO_FALHA;
  var TEMPO_TIMEOUT_CAPTCHA = 600000; // 10 minutos (60 * 10 * 1000)
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var DISCORD_WEBHOOK_CAPTCHA = 'https://discord.com/api/webhooks/1539267966741389332/ZGwiXDDDTh4e698YVUvobQQL8FvNDREjVm0ph4tzxISa53c-7TLfF_BhiR6pl7DXt6vw';
  var DISCORD_WEBHOOK_CACADAS = 'https://discord.com/api/webhooks/1539268065190084779/9KxMifl2A0HkdvPAm5lxR6QK_oEGkvP98dtUSVyeDyxrekaNjyT5n0PcqRtE5-Xr2bWQ';
  var URL_PAINEL_BASE = 'https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html';
  var captchaJaNotificado = false;
  var atacarJaProcessado = false;
  var BOT_ULTIMO_ALVO_KEY = 'BOT_ULTIMO_ALVO_CACADAS';
  var BOT_COMBATE_NOTIFICADO_KEY = 'BOT_COMBATE_NOTIFICADO';
  var timerCaptchaTimeout = null;
  var captchaRespostaProcessando = false;
  var loginJaEnviado = false;

  function recarregarCredenciaisLogin() {
    USUARIO_FINAL = localStorage.getItem('BOT_USUARIO') || USUARIO_DEFAULT;
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
  var USUARIO_FINAL = localStorage.getItem('BOT_USUARIO') || USUARIO_DEFAULT;
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

  function sincronizarUsuarioLocalStorage() {
    var nomeLogado = extrairNomeUsuarioLogado();
    if (!nomeLogado) return;

    var nomeSalvo = localStorage.getItem('BOT_USUARIO');
    if (nomeSalvo !== nomeLogado) {
      localStorage.setItem('BOT_USUARIO', nomeLogado);
      console.log('[Script] BOT_USUARIO atualizado automaticamente: ' + nomeLogado);
    }

    USUARIO_FINAL = nomeLogado;
  }

  // Nível da Caçada (Lê do localStorage ou usa '3' como padrão)
  var NIVEL_CACADAS_DEFAULT = '4';
  var NIVEL_CACADAS_FINAL = localStorage.getItem('BOT_NIVEL_CACADAS') || NIVEL_CACADAS_DEFAULT;

  // Espera antes de clicar "Caçar" — bot_espera_cacadas (minutos) via URL ou localStorage
  // Padrao sem config: madrugada (2h-9h) = 8-15min; comercial = 3-12min
  var ESPERA_CACADAS_MADRUGADA_MIN_MS = 480000;   // 8 min
  var ESPERA_CACADAS_MADRUGADA_MAX_MS = 900000;    // 15 min
  var ESPERA_CACADAS_COMERCIAL_MIN_MS = 180000;    // 3 min
  var ESPERA_CACADAS_COMERCIAL_MAX_MS = 720000;    // 12 min
  var ESPERA_CACADAS_HORA_INICIO_LENTA = 2;        // 02:00
  var ESPERA_CACADAS_HORA_FIM_LENTA = 9;           // ate 08:59

  function estaNoHorarioEsperaCacadasLenta() {
    var hora = new Date().getHours();
    return hora >= ESPERA_CACADAS_HORA_INICIO_LENTA && hora < ESPERA_CACADAS_HORA_FIM_LENTA;
  }

  function calcularIntervaloEsperaCacadas() {
    var minutos = parseEsperaCacadasMinutos(localStorage.getItem('BOT_ESPERA_CACADAS'));

    if (minutos === null) {
      if (estaNoHorarioEsperaCacadasLenta()) {
        return {
          minMs: ESPERA_CACADAS_MADRUGADA_MIN_MS,
          maxMs: ESPERA_CACADAS_MADRUGADA_MAX_MS,
          origem: 'padrao-madrugada'
        };
      }
      return {
        minMs: ESPERA_CACADAS_COMERCIAL_MIN_MS,
        maxMs: ESPERA_CACADAS_COMERCIAL_MAX_MS,
        origem: 'padrao-comercial'
      };
    }

    if (minutos < 2) {
      return { minMs: 0, maxMs: 120000, origem: 'config', minutos: minutos };
    }

    return {
      minMs: Math.round((minutos - 2) * 60000),
      maxMs: Math.round(minutos * 60000),
      origem: 'config',
      minutos: minutos
    };
  }

  function sortearTempoEsperaCacadas() {
    var iv = calcularIntervaloEsperaCacadas();
    if (iv.minMs >= iv.maxMs) return iv.maxMs;
    return Math.floor(Math.random() * (iv.maxMs - iv.minMs + 1)) + iv.minMs;
  }

  function descreverEsperaCacadas() {
    var iv = calcularIntervaloEsperaCacadas();
    if (iv.origem === 'padrao-madrugada') {
      return '8-15min (madrugada 2h-9h)';
    }
    if (iv.origem === 'padrao-comercial') {
      return '3-12min (horario comercial)';
    }
    var minMin = Math.round(iv.minMs / 60000);
    var maxMin = Math.round(iv.maxMs / 60000);
    return minMin + '-' + maxMin + 'min (bot_espera_cacadas=' + iv.minutos + ')';
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
    var maxRyous = obterMaxRyousCacadas();
    var diffMin = obterDiffNivelCacadas();
    var whitelist = obterWhitelistCacadas();
    var whitelistCla = obterWhitelistClaCacadas();

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

    return {
      ok: motivos.length === 0,
      motivos: motivos,
      dados: dados,
      config: {
        whitelist: whitelist,
        whitelistCla: whitelistCla,
        maxRyous: maxRyous,
        diffNivel: diffMin
      }
    };
  }

  function enviarDiscordTexto(mensagem, webhookUrl) {
    var url = webhookUrl || DISCORD_WEBHOOK_CACADAS;
    if (!url) return Promise.resolve();
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Bot Shadow of Shinobi',
        content: mensagem
      })
    }).then(function(r) {
      if (r.ok) console.log('[Discord] Aviso enviado.');
      else console.warn('[Discord] Falha ao enviar aviso:', r.status);
    }).catch(function(e) {
      console.error('[Discord] Erro ao enviar aviso:', e);
    });
  }

  function montarMensagemAlvoIgnorado(resultado) {
    var d = resultado.dados;
    var linhas = [
      '**Alvo ignorado** — ' + USUARIO_FINAL,
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
    enviarDiscordTexto(mensagem).finally(function() {
      setTimeout(function() {
        window.location.href = URL_CACADAS;
      }, 1500);
    });
  }

  function atacarAlvoValido(resultado, btnAtacar) {
    console.log(
      '[Atacar] Alvo aprovado — ' + nomeExibicaoInimigo(resultado.dados) +
      ' | Ryous ' + resultado.dados.ryousTexto +
      ' | Diff nivel ' + resultado.dados.diffNivel
    );
    if (btnAtacar) btnAtacar.click();
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
      '**Combate — Derrota** — ' + USUARIO_FINAL,
      'Inimigo: **' + nomeExibicaoInimigo(dados) + '**',
      'Ryous faturados: ' + (dados.ryousTexto || '?')
    ];
    if (dados.resumoCombate) linhas.push('Resumo: ' + dados.resumoCombate);
    return linhas.join('\n');
  }

  function montarMensagemCombateVitoria(dados) {
    var linhas = [
      '**Combate — Vitoria** — ' + USUARIO_FINAL,
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
    console.log('[Combate] ' + motivo + ' — redirecionando para caçadas...');
    setTimeout(function() {
      window.location.href = URL_CACADAS;
    }, 1500);
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
    var usuario = (localStorage.getItem('BOT_USUARIO') || USUARIO_DEFAULT).trim();
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

  function montarLinkPainelCaptcha() {
    return URL_PAINEL_BASE + '?codigo=' + encodeURIComponent(CODIGO_SERVIDOR);
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
      '**Conta:** ' + USUARIO_FINAL,
      '**Codigo:** `' + CODIGO_SERVIDOR + '`',
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
        footer: { text: 'Usuario: ' + USUARIO_FINAL + ' | ' + CODIGO_SERVIDOR }
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

          if (timerCaptchaTimeout) {
            clearTimeout(timerCaptchaTimeout);
            timerCaptchaTimeout = null;
          }

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

  function urlAposCaptcha() {
    return obterModoAba() === 'invasor' ? URL_INVASOR : URL_CACADAS;
  }

  console.log(
    '[Script Caçadas] Usuário: ' + USUARIO_FINAL + ' | Nível: ' + NIVEL_CACADAS_FINAL +
    ' | Espera caçadas: ' + descreverEsperaCacadas() +
    ' | Whitelist: ' + descreverWhitelistAtacar() +
    ' | ' + descreverWhitelistClaAtacar() +
    ' | Max ryous: ' + formatarNumeroBr(obterMaxRyousCacadas()) +
    ' | Diff nivel: ' + obterDiffNivelCacadas() +
    ' | Min ryous vitoria: ' + formatarNumeroBr(obterMinRyousVitoriaCacadas()) +
    ' | Código: ' + CODIGO_SERVIDOR
  );

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

      // Modo cacadas: /status → caçadas
      if (obterModoAba() === 'cacadas' && urlAtual.indexOf('status') !== -1) {
        console.log('[Script Caçadas] Status — redirecionando para caçadas...');
        window.location.href = URL_CACADAS;
        return;
      }

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

            console.log('[Captcha] Timer de 10 minutos iniciado...');
            if (timerCaptchaTimeout) clearTimeout(timerCaptchaTimeout);
            timerCaptchaTimeout = setTimeout(function() {
              var destino = urlAposCaptcha();
              console.warn('[Captcha] Tempo limite esgotado! Redirecionando...');
              window.location.href = destino;
            }, TEMPO_TIMEOUT_CAPTCHA);

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
          id: 'cacadas',
          checar: function() { return urlAtual.indexOf('cacadas') !== -1; },
          executar: function() {
            var selectNivel = document.getElementById('por_nivel');

            if (selectNivel) {
              selectNivel.value = NIVEL_CACADAS_FINAL;
              selectNivel.dispatchEvent(new Event('change', { bubbles: true }));

              var formNivel = selectNivel.closest('form');
              if (formNivel) {
                var btnSubmit = formNivel.querySelector('input[type="submit"]');
                if (btnSubmit) {
                  var ivEspera = calcularIntervaloEsperaCacadas();
                  var tempoAleatorio = sortearTempoEsperaCacadas();
                  var segundos = Math.round(tempoAleatorio / 1000);

                  console.log(
                    '[Caçadas] Nivel selecionado (' + NIVEL_CACADAS_FINAL + '). Aguardando ' + segundos +
                    's (faixa ' + Math.round(ivEspera.minMs / 1000) + '-' + Math.round(ivEspera.maxMs / 1000) + 's)...'
                  );

                  setTimeout(function() {
                    console.log('[Caçadas] Tempo concluído. Clicando no botão para iniciar caçada...');
                    btnSubmit.click();
                  }, tempoAleatorio);

                  return true;
                }
              }
            }
            return false;
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