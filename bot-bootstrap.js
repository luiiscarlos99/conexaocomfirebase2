// Bootstrap minimo — injetar PRIMEIRO na Inject Code (document_start / o mais cedo possivel).
// Captura bot_modo da URL ou do referrer antes do jogo redirecionar para /status.
(function() {
  'use strict';

  if (window.__BOT_BOOTSTRAP_OK__) return;

  var BOT_MODO_KEY = 'BOT_MODO_ABA';
  var BOT_MODO_PERFIL_KEY = 'BOT_MODO_ABA';

  function extrairModo(search) {
    try {
      var modo = new URLSearchParams(search || '').get('bot_modo');
      if (modo === 'invasor' || modo === 'cacadas') return modo;
    } catch (e) {}
    return '';
  }

  function inferirModoPorPath() {
    var p = (window.location.pathname || '').toLowerCase();
    if (p.indexOf('/invasor') !== -1) return 'invasor';
    if (p.indexOf('/cacadas') !== -1 || p.indexOf('/atacar') !== -1) return 'cacadas';
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
      if (u) localStorage.setItem('BOT_USUARIO', u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
    } catch (e) {}
  }

  function gravarModo(modo) {
    if (modo !== 'invasor' && modo !== 'cacadas') return;
    try {
      sessionStorage.setItem(BOT_MODO_KEY, modo);
      localStorage.setItem(BOT_MODO_PERFIL_KEY, modo);
    } catch (e) {}
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var modoQuery = extrairModo(window.location.search);

    if (modoQuery === 'off' || modoQuery === 'manual') {
      sessionStorage.removeItem(BOT_MODO_KEY);
      localStorage.removeItem(BOT_MODO_PERFIL_KEY);
    } else {
      var modo =
        modoQuery ||
        extrairModo((window.location.hash || '').replace(/^#/, '').replace(/^\?/, '')) ||
        lerModoReferrer() ||
        inferirModoPorPath() ||
        (window.__BOT_MODO_FIXO__ === 'invasor' || window.__BOT_MODO_FIXO__ === 'cacadas' ? window.__BOT_MODO_FIXO__ : '');

      gravarModo(modo);

      aplicarCredenciais(window.location.search);
      if (!params.get('bot_user') && !params.get('bot_pass')) {
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
