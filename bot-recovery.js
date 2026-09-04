// Recuperacao em paginas de erro (chrome-error://) — injetar PRIMEIRO no Inject Code.
// window.name persiste na aba. Modo bot vem do sessionStorage desta aba (nao localStorage).
(function() {
  'use strict';

  if (window.__BOT_RECOVERY__) return;

  var PREFIX = '__BOT_RECUP__:';
  var URL_HOME = 'https://shadowofshinobi.com/';
  var BOT_MODO_KEY = 'BOT_MODO_ABA';
  var TEMPO_REDIRECT_ERRO = 2000;

  function montarUrlLoginComParams() {
    var params = new URLSearchParams();

    try {
      var modo = sessionStorage.getItem(BOT_MODO_KEY);
      if (modo === 'invasor' || modo === 'cacadas') params.set('bot_modo', modo);

      var u = sessionStorage.getItem('BOT_USUARIO_LOGIN') || sessionStorage.getItem('BOT_USUARIO');
      if (!u) u = localStorage.getItem('BOT_USUARIO_LOGIN') || localStorage.getItem('BOT_USUARIO');
      var p = sessionStorage.getItem('BOT_SENHA');
      if (!p) p = localStorage.getItem('BOT_SENHA');
      var n = localStorage.getItem('BOT_NIVEL_CACADAS');
      var e = localStorage.getItem('BOT_ESPERA_CACADAS');
      var l = localStorage.getItem('BOT_LIMITE_INVASOR');
      var ma = localStorage.getItem('BOT_MIN_ATAQUES_INVASOR');
      var lm = localStorage.getItem('BOT_LASTHIT_MODO');
      var lsm = localStorage.getItem('BOT_LASTHIT_SORTEIO_MIN');
      var lsx = localStorage.getItem('BOT_LASTHIT_SORTEIO_MAX');
      var w = localStorage.getItem('BOT_WHITELIST_CACADAS');
      var wc = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS');
      var wff = localStorage.getItem('BOT_WHITELIST_FIREBASE_FILA');
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
      if (ma !== null && ma !== '') params.set('bot_min_ataques_invasor', ma);
      if (lm === 'data' || lm === 'sorteio' || lm === 'scout') params.set('bot_lasthit_modo', lm);
      else if (lm === 'off') params.set('bot_lasthit_modo', 'off');
      if (lsm !== null && lsm !== '') params.set('bot_lasthit_sorteio_min', lsm);
      if (lsx !== null && lsx !== '') params.set('bot_lasthit_sorteio_max', lsx);
      if (w !== null && w !== '') params.set('bot_whitelist_cacadas', w);
      if (wc !== null && wc !== '') params.set('bot_whitelist_cla_cacadas', wc);
      if (wff !== null && wff !== '') params.set('bot_whitelist_firebase_fila', wff);
      if (bl !== null && bl !== '') params.set('bot_blacklist_cacadas', bl);
      if (ra === '1') params.set('bot_rotacao_automacao', '1');
      if (r !== null && r !== '') params.set('bot_max_ryous_cacadas', r);
      if (d !== null && d !== '') params.set('bot_diff_nivel_cacadas', d);
      if (v !== null && v !== '') params.set('bot_min_ryous_vitoria_cacadas', v);
      var ct29 = localStorage.getItem('BOT_CACADAS_PORTAO_TETO_29');
      var dg = localStorage.getItem('BOT_DIARIO_GERENCIADA');
      var dgs = localStorage.getItem('BOT_DIARIO_SEM_CACADAS');
      if (ct29 === '1') params.set('bot_cacadas_teto_29', '1');
      else if (ct29 === '0') params.set('bot_cacadas_teto_29', '0');
      if (dg === '1') params.set('bot_diario_gerenciada', '1');
      else if (dg === '0') params.set('bot_diario_gerenciada', '0');
      if (dgs === '1') params.set('bot_diario_sem_cacadas', '1');
      else if (dgs === '0') params.set('bot_diario_sem_cacadas', '0');
    } catch (err) {}

    var qs = params.toString();
    return qs ? URL_HOME + '?' + qs : URL_HOME;
  }

  function montarLoginDeUrlSearch(search) {
    var rp = new URLSearchParams(search || '');
    var dest = new URLSearchParams();
    var modo = rp.get('bot_modo');

    if (modo === 'invasor' || modo === 'cacadas') dest.set('bot_modo', modo);

    ['bot_user', 'bot_pass', 'bot_nivel', 'bot_espera_cacadas', 'bot_limite_invasor',
     'bot_min_ataques_invasor', 'bot_lasthit_data', 'bot_lasthit_modo',
     'bot_lasthit_sorteio_min', 'bot_lasthit_sorteio_max',
     'bot_whitelist_cacadas', 'bot_whitelist_cla_cacadas', 'bot_whitelist_firebase_fila',
     'bot_blacklist_cacadas',
     'bot_rotacao_automacao',
     'bot_max_ryous_cacadas', 'bot_diff_nivel_cacadas',
     'bot_min_ryous_vitoria_cacadas', 'bot_cacadas_teto_29',
     'bot_diario_gerenciada', 'bot_diario_sem_cacadas'].forEach(function(k) {
      var v = rp.get(k);
      if (v !== null && v !== '') dest.set(k, v);
    });

    var qs = dest.toString();
    return qs ? URL_HOME + '?' + qs : '';
  }

  function salvar(url) {
    var destino = url || montarUrlLoginComParams();
    try { window.name = PREFIX + destino; } catch (e) {}
    return destino;
  }

  function ler() {
    try {
      if (window.name && window.name.indexOf(PREFIX) === 0) {
        return window.name.slice(PREFIX.length);
      }
    } catch (e) {}
    return '';
  }

  function ehPaginaErro() {
    try {
      if (location.protocol === 'chrome-error:' || location.protocol === 'edge-error:') return true;
    } catch (e) {}

    if (document.getElementById('login')) return false;

    var el = document.querySelector('.error-code');
    if (el) {
      var t = (el.innerText || el.textContent || '').toUpperCase();
      if (t.indexOf('HTTP ERROR') !== -1 || t.indexOf('500') !== -1 ||
          t.indexOf('502') !== -1 || t.indexOf('503') !== -1 || t.indexOf('504') !== -1) {
        return true;
      }
    }

    return false;
  }

  function irParaLogin(url, motivo) {
    if (!url) return false;
    console.warn('[Bot Recovery] ' + motivo);
    console.log('[Bot Recovery] -> ' + url.replace(/bot_pass=[^&]+/, 'bot_pass=***'));
    try { location.replace(url); } catch (e) { location.href = url; }
    return true;
  }

  function tentarRecuperarErro() {
    if (!ehPaginaErro()) return;

    var salva = ler();
    if (salva) {
      setTimeout(function() {
        irParaLogin(salva, 'Pagina de erro — recuperando via window.name');
      }, TEMPO_REDIRECT_ERRO);
      return;
    }

    console.warn(
      '[Bot Recovery] Pagina de erro sem URL salva. ' +
      'Confira se bot-recovery.js esta primeiro no Inject Code e reabra via launcher.'
    );
  }

  window.__BOT_RECOVERY__ = {
    PREFIX: PREFIX,
    montarUrlLoginComParams: montarUrlLoginComParams,
    montarLoginDeUrlSearch: montarLoginDeUrlSearch,
    salvar: salvar,
    ler: ler,
    ehPaginaErro: ehPaginaErro,
    irParaLogin: irParaLogin
  };

  tentarRecuperarErro();
})();
