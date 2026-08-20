// Bootstrap minimo — injetar PRIMEIRO na Inject Code (document_start / o mais cedo possivel).
// Grava bot_modo so quando veio na URL (query/referrer) — sessionStorage desta aba.
(function() {
  'use strict';

  if (window.__BOT_BOOTSTRAP_OK__) return;

  var BOT_MODO_KEY = 'BOT_MODO_ABA';

  try { localStorage.removeItem('BOT_MODO_ABA'); } catch (e) {}

  function extrairModo(search) {
    try {
      var modo = new URLSearchParams(search || '').get('bot_modo');
      if (modo === 'invasor' || modo === 'cacadas') return modo;
    } catch (e) {}
    return '';
  }

  function lerModoReferrer() {
    try {
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return '';
      return extrairModo(new URL(ref).search);
    } catch (e) {}
    return '';
  }

  function aplicarCredenciais(search) {
    try {
      var rp = new URLSearchParams(search || '');
      var u = rp.get('bot_user');
      var p = rp.get('bot_pass');
      var n = rp.get('bot_nivel');
      var e = rp.get('bot_espera_cacadas');
      var l = rp.get('bot_limite_invasor');
      var ma = rp.get('bot_min_ataques_invasor');
      var w = rp.get('bot_whitelist_cacadas');
      var wc = rp.get('bot_whitelist_cla_cacadas');
      var r = rp.get('bot_max_ryous_cacadas');
      var d = rp.get('bot_diff_nivel_cacadas');
      var v = rp.get('bot_min_ryous_vitoria_cacadas');
      if (u) localStorage.setItem('BOT_USUARIO', u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') {
        var em = parseFloat(String(e).replace(',', '.'));
        if (!isNaN(em) && em >= 0) localStorage.setItem('BOT_ESPERA_CACADAS', String(em));
      }
      if (l !== null && l !== '') {
        var lm = parseInt(String(l).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(lm) && lm >= 0) localStorage.setItem('BOT_LIMITE_INVASOR', String(lm));
      }
      if (ma !== null && ma !== '') {
        var mam = parseInt(String(ma).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(mam) && mam >= 1) localStorage.setItem('BOT_MIN_ATAQUES_INVASOR', String(mam));
      }
      var lh = rp.get('bot_lasthit_data');
      if (lh !== null && lh !== '') {
        var lhv = String(lh).trim().toLowerCase();
        if (lhv === '1' || lhv === 'true' || lhv === 'on' || lhv === 'sim' || lhv === 'yes') {
          localStorage.setItem('BOT_LASTHIT_POR_DATA', '1');
        } else if (lhv === '0' || lhv === 'false' || lhv === 'off' || lhv === 'nao' || lhv === 'não' || lhv === 'no') {
          localStorage.setItem('BOT_LASTHIT_POR_DATA', '0');
        }
      }
      if (w !== null && w !== '') localStorage.setItem('BOT_WHITELIST_CACADAS', String(w).trim());
      if (wc !== null && wc !== '') localStorage.setItem('BOT_WHITELIST_CLA_CACADAS', String(wc).trim());
      if (r !== null && r !== '') {
        var rm = parseInt(String(r).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(rm) && rm >= 0) localStorage.setItem('BOT_MAX_RYOUS_CACADAS', String(rm));
      }
      if (d !== null && d !== '') {
        var dm = parseInt(String(d).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(dm) && dm >= 0) localStorage.setItem('BOT_DIFF_NIVEL_CACADAS', String(dm));
      }
      if (v !== null && v !== '') {
        var vm = parseInt(String(v).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(vm) && vm >= 0) localStorage.setItem('BOT_MIN_RYOUS_VITORIA_CACADAS', String(vm));
      }
    } catch (e) {}
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var modoQuery = extrairModo(window.location.search);

    if (modoQuery === 'off' || modoQuery === 'manual') {
      sessionStorage.removeItem(BOT_MODO_KEY);
    } else {
      var modo = modoQuery || lerModoReferrer();

      if (modo === 'invasor' || modo === 'cacadas') {
        sessionStorage.setItem(BOT_MODO_KEY, modo);
      }

      aplicarCredenciais(window.location.search);
      if (!params.get('bot_user') && !params.get('bot_pass') && !params.get('bot_nivel') &&
          !params.get('bot_espera_cacadas') && !params.get('bot_limite_invasor') &&
          !params.get('bot_min_ataques_invasor') && !params.get('bot_lasthit_data') &&
          !params.get('bot_whitelist_cacadas') && !params.get('bot_whitelist_cla_cacadas') &&
          !params.get('bot_max_ryous_cacadas') &&
          !params.get('bot_diff_nivel_cacadas') && !params.get('bot_min_ryous_vitoria_cacadas')) {
        try {
          var ref = document.referrer || '';
          if (ref.indexOf('shadowofshinobi.com') !== -1) {
            aplicarCredenciais(new URL(ref).search);
          }
        } catch (e) {}
      }

      // Salva URL de login em window.name (sobrevive a chrome-error://)
      try {
        if (window.__BOT_RECOVERY__) {
          var modoSalvar = sessionStorage.getItem(BOT_MODO_KEY);
          if (modoSalvar === 'invasor' || modoSalvar === 'cacadas') {
            window.__BOT_RECOVERY__.salvar();
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  window.__BOT_BOOTSTRAP_OK__ = true;
})();
