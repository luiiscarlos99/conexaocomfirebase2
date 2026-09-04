// ==UserScript==
// @name         Bot Caçadas Timer Som - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Toca som quando cronômetro de caçadas/penalidade chega a zero. Sem bot_modo — roda direto na aba.
// @match        https://shadowofshinobi.com/cacadas*
// @match        https://shadowofshinobi.com/combate*
// @grant        none
// ==/UserScript==

// Inject Code: script separado — não depende de bot_modo nem sessionStorage.
// Alerta de penalidade <5s fica no atkSOS.js; este script só dispara no zero.
(function() {
  'use strict';

  if (window.__BOT_CACADAS_TIMER_SOM__) return;
  window.__BOT_CACADAS_TIMER_SOM__ = true;

  var SCRIPT_VERSAO = '1.0';
  var INTERVALO_MS = 400;
  var TIMER_IDS = ['caca_cd_timer', 'missao_timer', 'mn_timer'];
  var estadoTimers = {};

  function ehPaginaRelevante() {
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      if (path.indexOf('/cacadas') === 0) return true;
      if (path.indexOf('/combate') === 0 && path.indexOf('invasor-combate') === -1) return true;
    } catch (e) {}
    return false;
  }

  if (!ehPaginaRelevante()) return;

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

  function obterEstadoTimer(id) {
    if (!estadoTimers[id]) {
      estadoTimers[id] = { ultimoSeg: null, zeroTocado: false };
    }
    return estadoTimers[id];
  }

  function tocarSomZero() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      var notas = [523.25, 659.25, 783.99, 1046.5];
      notas.forEach(function(freq, i) {
        var delay = i * 0.22;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + delay + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch (e) {}
  }

  function lerSegundosElemento(el) {
    if (!el) return null;
    var seg = parseSegundosTimer(el.textContent || el.innerText || '');
    if (seg !== null) return seg;
    return parseSegundosTimer(el.innerHTML || '');
  }

  function verificarTimers() {
    for (var i = 0; i < TIMER_IDS.length; i++) {
      var id = TIMER_IDS[i];
      var el = document.getElementById(id);
      if (!el) continue;

      var st = obterEstadoTimer(id);
      var seg = lerSegundosElemento(el);
      var textoVazio = !(String(el.textContent || el.innerText || '').trim());

      if (seg === null) {
        if (textoVazio && st.ultimoSeg !== null && st.ultimoSeg > 0 && !st.zeroTocado) {
          st.zeroTocado = true;
          console.log('[Caçadas Som] Timer #' + id + ' zerou (texto limpo).');
          tocarSomZero();
        }
        continue;
      }

      if (seg > 0) {
        st.zeroTocado = false;
        st.ultimoSeg = seg;
        continue;
      }

      if (seg === 0 && !st.zeroTocado) {
        st.zeroTocado = true;
        st.ultimoSeg = 0;
        console.log('[Caçadas Som] Timer #' + id + ' chegou a zero.');
        tocarSomZero();
      }
    }
  }

  console.log('[Caçadas Som] v' + SCRIPT_VERSAO + ' — monitorando timers (#caca_cd_timer, #missao_timer, #mn_timer).');
  verificarTimers();
  setInterval(verificarTimers, INTERVALO_MS);
})();
