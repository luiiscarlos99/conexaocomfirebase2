// ==UserScript==
// @name         iCherry - Caçada por Classe Ninja
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Bot simples: só caçada por classe (por_nivel). Sem login, Firebase ou captcha OCR.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==/UserScript==

// Inject Code — script separado (nao misturar com atkSOS na mesma aba).
//
// Ligar/desligar pela URL (copie e cole na barra de endereco):
//   ?icherry=1                      liga o bot
//   ?icherry=0                      desliga
//   ?icherry=sim                    liga  |  ?icherry=nao  desliga
//   ?icherry=1&icherry_classe=6     classe 6 (padrao) — troque o numero
//   ?icherry=1&classe=6             atalho igual ao de cima
//
// Console (F12):
//   botIcherry()        ver se esta ligado
//   botIcherry(true)    ligar  |  botIcherry(false)  desligar
//   botIcherryClasse()  ver classe atual
//   botIcherryClasse(6) mudar classe do seletor por_nivel
//
(function() {
  'use strict';

  if (window.__ICHERRY_OK__) return;
  window.__ICHERRY_OK__ = true;

  var VERSAO = '1.1';
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var TEMPO_INICIAL_MS = 2000;
  var REFRESH_PENAL_MS = 30000;
  var REFRESH_CAPTCHA_MS = 300000;
  var ALERTA_SEM_SELETOR_MS = 120000;

  var KEY_ATIVO = 'ICHERRY_ATIVO';
  var KEY_CLASSE = 'ICHERRY_CLASSE';
  var KEY_CAPTCHA_ATE = 'ICHERRY_CAPTCHA_ATE';
  var KEY_ALERTA_TS = 'ICHERRY_ALERTA_SEM_SELETOR_TS';

  var CLASSE_PADRAO = 6;
  var reloadAgendado = false;

  function lerStorage(chave) {
    try { return localStorage.getItem(chave); } catch (e) {}
    try { return sessionStorage.getItem(chave); } catch (e) {}
    return null;
  }

  function gravarStorage(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) {}
    try { sessionStorage.setItem(chave, valor); } catch (e) {}
  }

  function parseSimNao(valor) {
    if (valor === null || valor === undefined) return null;
    var v = String(valor).trim().toLowerCase();
    if (!v) return null;
    if (v === '1' || v === 'true' || v === 'sim' || v === 's' || v === 'on' ||
        v === 'ligar' || v === 'liga' || v === 'ativar' || v === 'ativo') return true;
    if (v === '0' || v === 'false' || v === 'nao' || v === 'não' || v === 'n' ||
        v === 'off' || v === 'desligar' || v === 'desliga' || v === 'desativar') return false;
    return null;
  }

  function aplicarParamsUrl() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var ligar = parseSimNao(params.get('icherry'));
      if (ligar !== null) gravarStorage(KEY_ATIVO, ligar ? '1' : '0');

      var classeRaw = params.get('icherry_classe');
      if (classeRaw === null || classeRaw === '') classeRaw = params.get('classe');
      if (classeRaw !== null && classeRaw !== '') {
        var n = parseInt(String(classeRaw).trim(), 10);
        if (!isNaN(n) && n >= 0) gravarStorage(KEY_CLASSE, String(n));
      }
    } catch (e) {}
  }

  function icherryAtivo() {
    return lerStorage(KEY_ATIVO) === '1';
  }

  function obterClasseIcherry() {
    var raw = lerStorage(KEY_CLASSE);
    if (raw === null || raw === '') return CLASSE_PADRAO;
    var n = parseInt(raw, 10);
    return isNaN(n) ? CLASSE_PADRAO : n;
  }

  function definirIcherryAtivo(ligar) {
    gravarStorage(KEY_ATIVO, ligar ? '1' : '0');
    if (!ligar) {
      try { sessionStorage.removeItem(KEY_CAPTCHA_ATE); } catch (e) {}
    }
    return ligar;
  }

  function definirClasseIcherry(valor) {
    if (valor === undefined || valor === null) return obterClasseIcherry();
    var n = parseInt(valor, 10);
    if (isNaN(n) || n < 0) {
      console.warn('[iCherry] Classe invalida:', valor);
      return obterClasseIcherry();
    }
    gravarStorage(KEY_CLASSE, String(n));
    return n;
  }

  window.botIcherry = function(ligar) {
    if (ligar === undefined) return icherryAtivo();
    return definirIcherryAtivo(!!ligar);
  };

  window.botIcherryClasse = function(valor) {
    if (valor === undefined) return obterClasseIcherry();
    return definirClasseIcherry(valor);
  };

  function normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function parseSegundosTimer(texto) {
    if (texto === null || texto === undefined) return null;
    var t = String(texto).replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) return null;
    if (t.indexOf('concluida') !== -1 || t.indexOf('concluída') !== -1) return 0;

    var total = 0;
    var achou = false;
    var hm = t.match(/(\d+)\s*h\b/);
    var mm = t.match(/(\d+)\s*m\b/);
    var sm = t.match(/(\d+)\s*s\b/);

    if (hm) { total += parseInt(hm[1], 10) * 3600; achou = true; }
    if (mm) { total += parseInt(mm[1], 10) * 60; achou = true; }
    if (sm) { total += parseInt(sm[1], 10); achou = true; }

    if (!achou && /^\d+$/.test(t)) {
      total = parseInt(t, 10);
      achou = true;
    }

    return achou ? total : null;
  }

  function ehPaginaCaptcha() {
    var url = window.location.href || '';
    if (url.indexOf('captcha_seguranca') !== -1) return true;
    return !!document.querySelector('form[action="captcha_seguranca"]');
  }

  function ehPaginaCombate() {
    var url = window.location.href || '';
    if (url.indexOf('invasor-combate') !== -1) return false;
    return /\/combate(?:[\/?#]|$)/i.test(url);
  }

  function ehPaginaCacadas() {
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      return path.indexOf('/cacadas') === 0;
    } catch (e) {}
    return (window.location.href || '').indexOf('cacadas') !== -1;
  }

  function ehPaginaAtacar() {
    return (window.location.href || '').indexOf('atacar') !== -1;
  }

  function seletorClasseDisponivel() {
    var select = document.getElementById('por_nivel');
    if (!select) return null;
    var form = select.closest('form');
    if (!form) return null;
    var btn = form.querySelector('input[type="submit"], button[type="submit"]');
    if (!btn || btn.disabled) return null;
    return { select: select, form: form, btn: btn };
  }

  function emPenalidadeCacadas() {
    var ids = ['caca_cd_timer', 'missao_timer', 'mn_timer'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var seg = parseSegundosTimer(el.textContent || el.innerText || '');
      if (seg !== null && seg > 0) return true;
    }

    var col = document.getElementById('col_direita') || document.body;
    if (!col) return false;
    var avisos = col.querySelectorAll('.avisos_erro');
    for (var j = 0; j < avisos.length; j++) {
      var t = normalizarTexto(avisos[j].innerText || avisos[j].textContent || '');
      if (t.indexOf('penal') !== -1) return true;
      if (t.indexOf('disponivel em') !== -1) return true;
      if (t.indexOf('aguarde') !== -1 && t.indexOf('cacad') !== -1) return true;
    }
    return false;
  }

  function alertarSemSeletorClasse() {
    var agora = Date.now();
    var ultimo = 0;
    try { ultimo = parseInt(sessionStorage.getItem(KEY_ALERTA_TS) || '0', 10) || 0; } catch (e) {}
    if (agora - ultimo < ALERTA_SEM_SELETOR_MS) return;
    try { sessionStorage.setItem(KEY_ALERTA_TS, String(agora)); } catch (e) {}
    window.alert(
      'iCherry: seletor de classe (por_nivel) nao encontrado nesta pagina.\n' +
      'Nao e possivel realizar a caçada por classe ninja.'
    );
  }

  function agendarReload(ms, motivo) {
    if (reloadAgendado) return;
    reloadAgendado = true;
    setTimeout(function() {
      window.location.reload();
    }, ms);
  }

  function irParaCacadas() {
    if ((window.location.href || '').indexOf('cacadas') !== -1) return;
    window.location.href = URL_CACADAS;
  }

  function marcarCaptchaAguardando() {
    try {
      sessionStorage.setItem(KEY_CAPTCHA_ATE, String(Date.now() + REFRESH_CAPTCHA_MS));
    } catch (e) {}
  }

  function limparCaptchaAguardando() {
    try { sessionStorage.removeItem(KEY_CAPTCHA_ATE); } catch (e) {}
  }

  function captchaAguardando() {
    if (!ehPaginaCaptcha()) return false;
    try {
      var ate = parseInt(sessionStorage.getItem(KEY_CAPTCHA_ATE) || '0', 10);
      if (!ate) return false;
      if (Date.now() >= ate) {
        limparCaptchaAguardando();
        return false;
      }
      return true;
    } catch (e) {}
    return false;
  }

  function processarCaptcha() {
    marcarCaptchaAguardando();
    var falta = 0;
    try {
      var ate = parseInt(sessionStorage.getItem(KEY_CAPTCHA_ATE) || '0', 10);
      falta = Math.max(0, ate - Date.now());
    } catch (e) {
      falta = REFRESH_CAPTCHA_MS;
    }
    agendarReload(Math.max(falta, 5000));
  }

  function executarCacadaPorClasse() {
    var sel = seletorClasseDisponivel();
    if (!sel) {
      alertarSemSeletorClasse();
      return false;
    }

    var classe = obterClasseIcherry();
    sel.select.value = String(classe);
    try { sel.select.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}

    var optExiste = false;
    for (var i = 0; i < sel.select.options.length; i++) {
      if (String(sel.select.options[i].value) === String(classe)) {
        optExiste = true;
        break;
      }
    }
    if (!optExiste) {
      window.alert('iCherry: classe ' + classe + ' nao existe no seletor por_nivel.');
      return false;
    }

    sel.btn.click();
    return true;
  }

  function processarCacadas() {
    if (emPenalidadeCacadas()) {
      agendarReload(REFRESH_PENAL_MS);
      return;
    }

    if (!seletorClasseDisponivel()) {
      alertarSemSeletorClasse();
      agendarReload(REFRESH_PENAL_MS);
      return;
    }

    executarCacadaPorClasse();
  }

  function processarAtacar() {
    var btn = document.querySelector('form[action="atacar"] input[type="submit"]');
    if (!btn) {
      btn = document.querySelector('form[action*="atacar"] input[type="submit"]');
    }
    if (btn) {
      btn.click();
      return;
    }
    irParaCacadas();
  }

  function processarCombate() {
    setTimeout(function() {
      if (icherryAtivo()) irParaCacadas();
    }, 1500);
  }

  function tick() {
    if (!icherryAtivo()) return;

    if (ehPaginaCaptcha()) {
      if (captchaAguardando()) {
        var faltaCaptcha = REFRESH_CAPTCHA_MS;
        try {
          var ate = parseInt(sessionStorage.getItem(KEY_CAPTCHA_ATE) || '0', 10);
          faltaCaptcha = Math.max(5000, ate - Date.now());
        } catch (e) {}
        agendarReload(faltaCaptcha);
        return;
      }
      processarCaptcha();
      return;
    }

    limparCaptchaAguardando();

    if (ehPaginaCacadas()) {
      processarCacadas();
      return;
    }

    if (ehPaginaAtacar()) {
      processarAtacar();
      return;
    }

    if (ehPaginaCombate()) {
      processarCombate();
      return;
    }

    irParaCacadas();
  }

  aplicarParamsUrl();
  setTimeout(tick, TEMPO_INICIAL_MS);
})();
