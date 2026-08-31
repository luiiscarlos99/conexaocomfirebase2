// Bootstrap minimo — injetar PRIMEIRO na Inject Code (document_start / o mais cedo possivel).
// Modo bot: sessionStorage desta ABA (nao localStorage). So grava com ?bot_modo= na URL.
(function() {
  'use strict';

  if (window.__BOT_BOOTSTRAP_OK__) return;

  var BOT_MODO_KEY = 'BOT_MODO_ABA';
  var BOT_USUARIO_LOGIN_KEY = 'BOT_USUARIO_LOGIN';

  function gravarUsuarioLoginParam(valor) {
    if (!valor) return false;
    var u = String(valor).trim();
    if (!u) return false;
    localStorage.setItem(BOT_USUARIO_LOGIN_KEY, u);
    localStorage.setItem('BOT_USUARIO', u);
    try {
      sessionStorage.removeItem(BOT_USUARIO_LOGIN_KEY);
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
      return localStorage.getItem(BOT_USUARIO_LOGIN_KEY) || localStorage.getItem('BOT_USUARIO') || '';
    } catch (e) {
      return '';
    }
  }

  try {
    localStorage.removeItem('BOT_MODO_ABA');
    localStorage.removeItem('BOT_MODO_PREFERIDO');
  } catch (e) {}

  function extrairModo(search) {
    try {
      var modo = new URLSearchParams(search || '').get('bot_modo');
      if (modo === 'invasor' || modo === 'cacadas') return modo;
    } catch (e) {}
    return '';
  }

  function extrairModoDeUrl(urlStr) {
    try {
      if (!urlStr) return '';
      var u = urlStr.indexOf('://') !== -1
        ? new URL(urlStr)
        : new URL(urlStr.replace(/^\?/, ''), 'https://shadowofshinobi.com/');
      return extrairModo(u.search);
    } catch (e) {}
    return '';
  }

  function recuperarModoAbaBootstrap(origem) {
    try {
      var modo = sessionStorage.getItem(BOT_MODO_KEY);
      if (modo === 'invasor' || modo === 'cacadas') return modo;
    } catch (e) {}

    var modoRec = '';
    try {
      if (window.__BOT_RECOVERY__) {
        modoRec = extrairModoDeUrl(window.__BOT_RECOVERY__.ler());
      }
    } catch (e) {}

    if (!modoRec) {
      try {
        var ref = document.referrer || '';
        if (ref.indexOf('shadowofshinobi.com') !== -1) {
          modoRec = extrairModoDeUrl(ref);
        }
      } catch (e) {}
    }

    if (modoRec === 'invasor' || modoRec === 'cacadas') {
      try {
        sessionStorage.setItem(BOT_MODO_KEY, modoRec);
        console.log('[Bot Bootstrap] Modo recuperado da aba (' + (origem || 'bootstrap') + '): ' + modoRec);
      } catch (e) {}
      return modoRec;
    }
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
      var bl = rp.get('bot_blacklist_cacadas');
      var ra = rp.get('bot_rotacao_automacao');
      var r = rp.get('bot_max_ryous_cacadas');
      var d = rp.get('bot_diff_nivel_cacadas');
      var v = rp.get('bot_min_ryous_vitoria_cacadas');
      if (u) gravarUsuarioLoginParam(u);
      if (p) gravarSenhaLoginParam(p);
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
      var lm = rp.get('bot_lasthit_modo');
      var lsm = rp.get('bot_lasthit_sorteio_min');
      var lsx = rp.get('bot_lasthit_sorteio_max');
      if (lm !== null && lm !== '') {
        var lmv = String(lm).trim().toLowerCase();
        if (lmv === 'scout' || lmv === 'data' || lmv === 'sorteio' ||
            lmv === 'random' || lmv === 'aleatorio' || lmv === 'aleatório') {
          if (lmv === 'random' || lmv === 'aleatorio' || lmv === 'aleatório') lmv = 'sorteio';
          localStorage.setItem('BOT_LASTHIT_MODO', lmv);
          try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e2) {}
        }
      } else if (lh !== null && lh !== '') {
        var lhv = String(lh).trim().toLowerCase();
        if (lhv === '1' || lhv === 'true' || lhv === 'on' || lhv === 'sim' || lhv === 'yes') {
          localStorage.setItem('BOT_LASTHIT_MODO', 'data');
        } else if (lhv === '0' || lhv === 'false' || lhv === 'off' || lhv === 'nao' || lhv === 'não' || lhv === 'no') {
          localStorage.setItem('BOT_LASTHIT_MODO', 'scout');
        }
        try { localStorage.removeItem('BOT_LASTHIT_POR_DATA'); } catch (e2) {}
      }
      if (lsm !== null && lsm !== '') {
        var lsmin = parseInt(String(lsm).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(lsmin) && lsmin >= 0) localStorage.setItem('BOT_LASTHIT_SORTEIO_MIN', String(lsmin));
      }
      if (lsx !== null && lsx !== '') {
        var lsmax = parseInt(String(lsx).replace(/\./g, '').replace(',', ''), 10);
        if (!isNaN(lsmax) && lsmax >= 0) localStorage.setItem('BOT_LASTHIT_SORTEIO_MAX', String(lsmax));
      }
      if (w !== null && w !== '') localStorage.setItem('BOT_WHITELIST_CACADAS', String(w).trim());
      if (wc !== null && wc !== '') localStorage.setItem('BOT_WHITELIST_CLA_CACADAS', String(wc).trim());
      if (bl !== null) {
        var bls = String(bl).trim();
        if (bls === '') {
          try { localStorage.removeItem('BOT_BLACKLIST_CACADAS'); } catch (eBl) {}
        } else {
          localStorage.setItem('BOT_BLACKLIST_CACADAS', bls);
        }
      }
      if (ra !== null) {
        var ras = String(ra).trim().toLowerCase();
        if (ras === '' || ras === '0' || ras === 'false' || ras === 'off' || ras === 'nao' || ras === 'não' || ras === 'no') {
          try { localStorage.removeItem('BOT_ROTACAO_AUTOMACAO'); } catch (eRa) {}
        } else if (ras === '1' || ras === 'true' || ras === 'on' || ras === 'sim' || ras === 'yes') {
          localStorage.setItem('BOT_ROTACAO_AUTOMACAO', '1');
        }
      }
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

  function escHtmlPainelBootstrap(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function resumirBootstrap(texto, max) {
    var s = String(texto || '');
    if (s.length <= max) return s;
    return s.substring(0, max - 3) + '...';
  }

  function escAttrPainelBootstrap(s) {
    return escHtmlPainelBootstrap(s).replace(/"/g, '&quot;');
  }

  function montarHtmlLinhaPrincipalLoginBootstrap(login) {
    var val = escAttrPainelBootstrap(login || '');
    return 'Principal: <input type="text" id="bot-principal-login" value="' + val +
      '" autocomplete="off" spellcheck="false"' +
      ' title="Login principal — Enter ou sair do campo para salvar"' +
      ' style="width:76px;max-width:42vw;font-size:9pt;padding:1px 4px;margin:0;' +
      'border:1px solid #555;background:#1a1a1a;color:#eee;border-radius:2px;" />';
  }

  function instalarEditorPrincipalLoginBootstrap(el) {
    if (!el || el.dataset.botPrincipalEditor === '1') return;
    el.dataset.botPrincipalEditor = '1';
    el.addEventListener('focusout', function(ev) {
      var t = ev.target;
      if (!t || t.id !== 'bot-principal-login') return;
      var u = String(t.value || '').trim();
      if (!u) return;
      if (window.__BOT_APLICAR_PRINCIPAL__) {
        window.__BOT_APLICAR_PRINCIPAL__(u);
        return;
      }
      gravarUsuarioLoginParam(u);
      console.log('[Bot Bootstrap] Principal alterado no painel: ' + u);
    });
    el.addEventListener('keydown', function(ev) {
      if (!ev.target || ev.target.id !== 'bot-principal-login') return;
      if (ev.key === 'Enter') {
        ev.preventDefault();
        ev.target.blur();
      }
    });
  }

  function ehPaginaRankingBootstrap() {
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      return path.indexOf('ranking') !== -1;
    } catch (e) {}
    return false;
  }

  function exibirModoAbaServerID() {
    function aplicar() {
      var el = document.getElementById('serverID');
      if (!el) return false;
      var inputAtivo = document.activeElement && document.activeElement.id === 'bot-principal-login';
      if (inputAtivo) return true;
      if (!el.dataset.botServerBase) {
        var primeira = (el.textContent || '').split('\n')[0];
        el.dataset.botServerBase = primeira.replace(/\s*\|\s*Bot:.*$/i, '').trim();
      }
      var login = '';
      try { login = lerUsuarioLoginArmazenado() || '?'; } catch (e) { login = '?'; }

      if (ehPaginaRankingBootstrap()) {
        el.style.lineHeight = '1.35';
        el.style.fontSize = '9pt';
        el.style.whiteSpace = 'normal';
        el.innerHTML = [
          escHtmlPainelBootstrap(el.dataset.botServerBase),
          'Bot: <b>manual</b> (ranking — sem acao)',
          montarHtmlLinhaPrincipalLoginBootstrap(login),
          '<span style="opacity:.65">—</span>',
          'Ranking: bot-ranking.js + botRankingScan()'
        ].join('<br>');
        instalarEditorPrincipalLoginBootstrap(el);
        return true;
      }

      var modo = '';
      try { modo = sessionStorage.getItem(BOT_MODO_KEY) || ''; } catch (e) {}
      if (!el.dataset.botServerBase) {
        var primeira = (el.textContent || '').split('\n')[0];
        el.dataset.botServerBase = primeira.replace(/\s*\|\s*Bot:.*$/i, '').trim();
      }
      var label = (modo === 'invasor' || modo === 'cacadas') ? modo : 'manual';
      var login = '';
      try { login = lerUsuarioLoginArmazenado() || '?'; } catch (e) { login = '?'; }
      var rot = descreverRotacaoAutomacaoBootstrap();
      var nivel = '';
      var bl = '';
      try {
        nivel = localStorage.getItem('BOT_NIVEL_CACADAS') || '?';
        bl = localStorage.getItem('BOT_BLACKLIST_CACADAS') || 'vazia';
      } catch (e) {}

      var linhas = [
        escHtmlPainelBootstrap(el.dataset.botServerBase),
        'Bot: <b>' + escHtmlPainelBootstrap(label) + '</b>',
        montarHtmlLinhaPrincipalLoginBootstrap(login),
        '<span style="opacity:.65">—</span>',
        'Nivel: ' + escHtmlPainelBootstrap(nivel) + ' | Rotacao: ' + escHtmlPainelBootstrap(rot),
        'Blacklist: ' + escHtmlPainelBootstrap(resumirBootstrap(bl || 'vazia', 64))
      ];

      el.style.lineHeight = '1.35';
      el.style.fontSize = '9pt';
      el.style.whiteSpace = 'normal';
      el.innerHTML = linhas.join('<br>');
      instalarEditorPrincipalLoginBootstrap(el);
      return true;
    }
    if (aplicar()) return;
    setTimeout(aplicar, 800);
    setTimeout(aplicar, 2500);
  }

  function descreverRotacaoAutomacaoBootstrap() {
    try {
      return localStorage.getItem('BOT_ROTACAO_AUTOMACAO') === '1'
        ? 'ligada (bot_rotacao_automacao=1)' : 'desligada';
    } catch (e) {
      return 'desligada';
    }
  }

  function registrarComandosConsolePagina() {
    try {
      var el = document.createElement('script');
      el.textContent =
        'window.botRotacaoAutomacao=function(ligar){' +
        'function s(){try{return localStorage.getItem("BOT_ROTACAO_AUTOMACAO")==="1"?' +
        '"ligada (bot_rotacao_automacao=1)":"desligada";}catch(e){return "desligada";}}' +
        'if(arguments.length===0)return s();' +
        'try{if(ligar)localStorage.setItem("BOT_ROTACAO_AUTOMACAO","1");' +
        'else localStorage.removeItem("BOT_ROTACAO_AUTOMACAO");}catch(e){}' +
        'console.log("[Automacao] Rotacao: "+s());return s();};';
      (document.documentElement || document.head).appendChild(el);
      el.parentNode.removeChild(el);
    } catch (e) {}
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var modoRaw = params.get('bot_modo');
    var modoQuery = extrairModo(window.location.search);

    if (modoRaw === 'off' || modoRaw === 'manual') {
      sessionStorage.removeItem(BOT_MODO_KEY);
    } else if (modoQuery === 'invasor' || modoQuery === 'cacadas') {
      sessionStorage.setItem(BOT_MODO_KEY, modoQuery);
    } else if (modoRaw && modoRaw !== 'off' && modoRaw !== 'manual') {
      console.warn('[Bot Bootstrap] bot_modo invalido: "' + modoRaw + '". Use invasor ou cacadas.');
    }

    aplicarCredenciais(window.location.search);
    var pathBoot = (window.location.pathname || '').replace(/\/+$/, '') || '/';
    var ehPaginaLoginBoot = pathBoot === '/' || pathBoot.indexOf('login') !== -1;
    if (ehPaginaLoginBoot && !extrairModo(window.location.search)) {
      recuperarModoAbaBootstrap('login');
    }
    if (!params.get('bot_user') && !params.get('bot_pass') && !params.get('bot_nivel') &&
        (pathBoot === '/' || pathBoot.indexOf('status') !== -1) &&
        !params.get('bot_espera_cacadas') && !params.get('bot_limite_invasor') &&
        !params.get('bot_min_ataques_invasor') && !params.get('bot_lasthit_data') &&
        !params.get('bot_lasthit_modo') && !params.get('bot_lasthit_sorteio_min') &&
        !params.get('bot_lasthit_sorteio_max') &&
        !params.get('bot_whitelist_cacadas') && !params.get('bot_whitelist_cla_cacadas') &&
        !params.get('bot_blacklist_cacadas') && !params.get('bot_rotacao_automacao') &&
        !params.get('bot_max_ryous_cacadas') &&
        !params.get('bot_diff_nivel_cacadas') && !params.get('bot_min_ryous_vitoria_cacadas')) {
      try {
        var ref = document.referrer || '';
        if (ref.indexOf('shadowofshinobi.com') !== -1) {
          aplicarCredenciais(new URL(ref).search);
        }
      } catch (e) {}
    }

    try {
      if (window.__BOT_RECOVERY__) {
        var modoSalvar = sessionStorage.getItem(BOT_MODO_KEY);
        if (modoSalvar === 'invasor' || modoSalvar === 'cacadas') {
          window.__BOT_RECOVERY__.salvar();
        }
      }
    } catch (e) {}
  } catch (e) {}

  exibirModoAbaServerID();
  registrarComandosConsolePagina();
  window.__BOT_BOOTSTRAP_BUILD__ = { versao: '2.0', rotacao: descreverRotacaoAutomacaoBootstrap() };
  console.log('[Bot Bootstrap] ok | rotacao automacao: ' + descreverRotacaoAutomacaoBootstrap());

  window.__BOT_BOOTSTRAP_OK__ = true;
})();
