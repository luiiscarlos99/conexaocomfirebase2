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
      if (u) localStorage.setItem('BOT_USUARIO', u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') {
        var em = parseFloat(String(e).replace(',', '.'));
        if (!isNaN(em) && em >= 0) localStorage.setItem('BOT_ESPERA_CACADAS', String(em));
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
      if (!params.get('bot_user') && !params.get('bot_pass') && !params.get('bot_nivel') && !params.get('bot_espera_cacadas')) {
        try {
          var ref = document.referrer || '';
          if (ref.indexOf('shadowofshinobi.com') !== -1) {
            aplicarCredenciais(new URL(ref).search);
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  window.__BOT_BOOTSTRAP_OK__ = true;
})();
