// Bot Ranking — detectar contas mult no ranking de personagens (Inject Code: apos bootstrap, antes de atkSOS).
(function() {
  'use strict';

  if (window.__BOT_RANKING_OK__) return;

  var SCRIPT_VERSAO = '1.0';
  var SCAN_KEY = 'BOT_RANKING_SCAN_ATIVO';
  var DADOS_KEY = 'BOT_RANKING_MULT_RESULTADOS';
  var PARAMS_KEY = 'BOT_RANKING_SCAN_PARAMS';
  var PASSO_RANKING = 50;
  var DELAY_PROXIMA_PAGINA_MS = 1200;

  var DEFAULTS = {
    maxRyous: 1000000,
    minNivel: 55,
    vila: 'geral',
    view: 'personagens'
  };

  function ehPaginaRanking() {
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      return path.indexOf('ranking') !== -1;
    } catch (e) {}
    return false;
  }

  window.__BOT_RANKING_PAGINA__ = ehPaginaRanking();

  function parseNumeroRanking(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var s = String(valor).trim().replace(/^\|\s*/, '');
    if (!s) return null;
    var lower = s.toLowerCase();
    if (/m$/.test(lower)) {
      var m = parseFloat(lower.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return isNaN(m) ? null : Math.round(m * 1000000);
    }
    if (/k$/.test(lower)) {
      var k = parseFloat(lower.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return isNaN(k) ? null : Math.round(k * 1000);
    }
    var n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : Math.round(n);
  }

  function parseIntRanking(valor) {
    var n = parseNumeroRanking(valor);
    if (n === null) return null;
    return Math.round(n);
  }

  function lerParamsUrl() {
    var p = {
      maxRyous: DEFAULTS.maxRyous,
      minNivel: DEFAULTS.minNivel,
      vila: DEFAULTS.vila,
      view: DEFAULTS.view
    };
    try {
      var rp = new URLSearchParams(window.location.search);
      var mr = rp.get('bot_ranking_max_ryous');
      var mn = rp.get('bot_ranking_min_nivel');
      var v = rp.get('bot_ranking_vila');
      var vw = rp.get('bot_ranking_view');
      if (mr !== null && mr !== '') {
        var nmr = parseNumeroRanking(mr);
        if (nmr !== null && nmr > 0) p.maxRyous = nmr;
      }
      if (mn !== null && mn !== '') {
        var nmn = parseInt(String(mn).replace(/\./g, ''), 10);
        if (!isNaN(nmn)) p.minNivel = nmn;
      }
      if (v) p.vila = v;
      if (vw) p.view = vw;
    } catch (e) {}
    return p;
  }

  function mesclarParams(extra) {
    var base = lerParamsUrl();
    if (!extra || typeof extra !== 'object') return base;
    if (extra.maxRyous != null) {
      var mr = parseNumeroRanking(extra.maxRyous);
      if (mr !== null && mr > 0) base.maxRyous = mr;
    }
    if (extra.minNivel != null) {
      var mn = parseInt(String(extra.minNivel).replace(/\./g, ''), 10);
      if (!isNaN(mn)) base.minNivel = mn;
    }
    if (extra.vila) base.vila = String(extra.vila);
    if (extra.view) base.view = String(extra.view);
    return base;
  }

  function salvarParams(params) {
    try {
      sessionStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    } catch (e) {}
  }

  function lerParamsSalvos() {
    try {
      var raw = sessionStorage.getItem(PARAMS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return mesclarParams(null);
  }

  function offsetRankingAtual() {
    try {
      var rp = new URLSearchParams(window.location.search);
      var r = rp.get('ranking');
      if (r === null || r === '') return 0;
      var n = parseInt(String(r).replace(/\./g, ''), 10);
      return isNaN(n) ? 0 : n;
    } catch (e) {}
    return 0;
  }

  function montarUrlRanking(offset, params) {
    var p = params || lerParamsSalvos();
    var qs = new URLSearchParams();
    qs.set('view', p.view || 'personagens');
    qs.set('vila', p.vila || 'geral');
    qs.set('ranking', String(typeof offset === 'number' ? offset : 0));
    return 'https://shadowofshinobi.com/ranking?' + qs.toString();
  }

  function textoCelula(td) {
    return (td && td.textContent ? td.textContent : '').replace(/^\|\s*/, '').trim();
  }

  function extrairJogadoresPagina() {
    var out = [];
    var tabelas = document.querySelectorAll('table.box_largura_100');
    for (var t = 0; t < tabelas.length; t++) {
      var tb = tabelas[t];
      var header = tb.querySelector('tr.box_preto_tarja');
      if (!header || (header.textContent || '').indexOf('Player') === -1) continue;

      var rows = tb.querySelectorAll('tr');
      for (var i = 0; i < rows.length; i++) {
        var tr = rows[i];
        if (tr.classList.contains('box_preto_tarja')) continue;
        var tds = tr.querySelectorAll('td');
        if (tds.length < 7) continue;

        var link = tds[2].querySelector('a[href*="jogador"]');
        if (!link) continue;

        var nome = (link.textContent || '').trim();
        if (!nome) continue;

        var pos = textoCelula(tds[0]).replace(/\u00ba/g, '').trim();
        var nivel = parseIntRanking(tds[3]);
        var vitorias = parseIntRanking(tds[4]);
        var derrotas = parseIntRanking(tds[5]);
        var ryousTexto = textoCelula(tds[6]);
        var ryous = parseNumeroRanking(ryousTexto);

        if (nivel === null || ryous === null) continue;

        out.push({
          pos: pos,
          nome: nome,
          nivel: nivel,
          vitorias: vitorias != null ? vitorias : '?',
          derrotas: derrotas != null ? derrotas : '?',
          ryous: ryous,
          ryousTexto: ryousTexto
        });
      }
    }
    return out;
  }

  function lerResultadosAcumulados() {
    try {
      var raw = sessionStorage.getItem(DADOS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function salvarResultados(lista) {
    try {
      sessionStorage.setItem(DADOS_KEY, JSON.stringify(lista));
    } catch (e) {}
  }

  function limparScan() {
    try {
      sessionStorage.removeItem(SCAN_KEY);
      sessionStorage.removeItem(DADOS_KEY);
      sessionStorage.removeItem(PARAMS_KEY);
    } catch (e) {}
  }

  function scanAtivo() {
    try {
      return sessionStorage.getItem(SCAN_KEY) === '1';
    } catch (e) {}
    return false;
  }

  function marcarScanAtivo(ativo) {
    try {
      if (ativo) sessionStorage.setItem(SCAN_KEY, '1');
      else sessionStorage.removeItem(SCAN_KEY);
    } catch (e) {}
  }

  function filtrarMult(jogadores, params) {
    var maxR = params.maxRyous;
    var minN = params.minNivel;
    var filtrados = [];
    for (var i = 0; i < jogadores.length; i++) {
      var j = jogadores[i];
      if (j.nivel > minN && j.ryous < maxR) {
        filtrados.push(j);
      }
    }
    return filtrados;
  }

  function mesclarSemDuplicar(acumulado, novos) {
    var map = {};
    var i;
    for (i = 0; i < acumulado.length; i++) {
      map[acumulado[i].nome.toLowerCase()] = acumulado[i];
    }
    for (i = 0; i < novos.length; i++) {
      map[novos[i].nome.toLowerCase()] = novos[i];
    }
    var out = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    }
    out.sort(function(a, b) {
      var pa = parseInt(String(a.pos).replace(/\D/g, ''), 10) || 0;
      var pb = parseInt(String(b.pos).replace(/\D/g, ''), 10) || 0;
      return pa - pb;
    });
    return out;
  }

  function logAjuda(params) {
    console.log(
      '%c[Bot Ranking] v' + SCRIPT_VERSAO + ' — pagina ranking detectada',
      'color:#9b59b6;font-weight:bold;font-size:13px'
    );
    console.log('[Bot Ranking] Caçadas/Invasor ficam inativos aqui. So este script age (quando voce chamar).');
    console.log('[Bot Ranking] Filtro atual: lvl > ' + params.minNivel + ' e ryous < ' + params.maxRyous.toLocaleString('pt-BR'));
    console.log('[Bot Ranking] Parametros URL (opcional):');
    console.log('  bot_ranking_max_ryous=1000000   (padrao: 1M — pega 999,9k ou menos)');
    console.log('  bot_ranking_min_nivel=55        (padrao: 55 — lvl tem que ser MAIOR que este valor)');
    console.log('  bot_ranking_vila=geral          (padrao: geral)');
    console.log('[Bot Ranking] Comandos console:');
    console.log('  botRankingScan()                — inicia do ranking=0 (ou continua scan)');
    console.log('  botRankingScan({maxRyous:999000,minNivel:56})');
    console.log('  botRankingParar()               — cancela scan em andamento');
    console.log('  botRankingStatus()              — status do scan');
    console.log('[Bot Ranking] Exemplo URL:');
    console.log('  /ranking?view=personagens&vila=geral&ranking=0&bot_ranking_max_ryous=1000000&bot_ranking_min_nivel=55');
  }

  function logResultadoFinal(resultados, params) {
    console.log('');
    console.log(
      '%c[Ranking Mult] FIM — ' + resultados.length + ' jogador(es) | lvl > ' + params.minNivel +
      ' | ryous < ' + params.maxRyous.toLocaleString('pt-BR'),
      'color:#e74c3c;font-weight:bold;font-size:13px'
    );

    if (!resultados.length) {
      console.log('[Ranking Mult] Nenhum jogador encontrado com esses criterios.');
      return;
    }

    console.log('%c[Ranking Mult] LOG 1 — detalhado (nome, lvl, vit, derrotas, ryous)', 'color:#3498db;font-weight:bold');
    for (var i = 0; i < resultados.length; i++) {
      var j = resultados[i];
      console.log(
        (j.pos || '?') + ' | ' + j.nome +
        ' | lvl ' + j.nivel +
        ' | vit ' + j.vitorias +
        ' | der ' + j.derrotas +
        ' | ryous ' + j.ryousTexto +
        ' (' + j.ryous.toLocaleString('pt-BR') + ')'
      );
    }

    var nomes = [];
    for (var n = 0; n < resultados.length; n++) {
      nomes.push(resultados[n].nome);
    }

    console.log('');
    console.log('%c[Ranking Mult] LOG 2 — blacklist (copiar para bot_blacklist_cacadas)', 'color:#2ecc71;font-weight:bold');
    console.log(nomes.join(','));
    console.log('');
    console.log('[Ranking Mult] Colar na URL: &bot_blacklist_cacadas=' + encodeURIComponent(nomes.join(',')));
  }

  function finalizarScan(params) {
    var resultados = lerResultadosAcumulados();
    marcarScanAtivo(false);
    logResultadoFinal(resultados, params);
    try { sessionStorage.removeItem(DADOS_KEY); } catch (e) {}
  }

  function processarPaginaScan() {
    if (!ehPaginaRanking()) return;

    var params = lerParamsSalvos();
    var offset = offsetRankingAtual();
    var jogadores = extrairJogadoresPagina();

    if (!jogadores.length) {
      console.log('[Bot Ranking] Faixa ranking=' + offset + ' vazia — fim do ranking.');
      finalizarScan(params);
      return;
    }

    var mult = filtrarMult(jogadores, params);
    var acumulado = mesclarSemDuplicar(lerResultadosAcumulados(), mult);
    salvarResultados(acumulado);

    console.log(
      '[Bot Ranking] ranking=' + offset + ' (' + (offset + 1) + '-' + (offset + PASSO_RANKING) + '): ' +
      jogadores.length + ' jogadores, ' + mult.length + ' mult nesta pagina, ' + acumulado.length + ' acumulado.'
    );

    var proximo = offset + PASSO_RANKING;
    var url = montarUrlRanking(proximo, params);
    setTimeout(function() {
      try { location.href = url; } catch (e) { location.assign(url); }
    }, DELAY_PROXIMA_PAGINA_MS);
  }

  function iniciarScan(extraParams) {
    if (!ehPaginaRanking()) {
      console.warn('[Bot Ranking] Abra a pagina /ranking?view=personagens antes de scanear.');
      return false;
    }

    var params = mesclarParams(extraParams);
    salvarParams(params);
    salvarResultados([]);
    marcarScanAtivo(true);

    console.log(
      '%c[Bot Ranking] Scan iniciado — lvl > ' + params.minNivel + ', ryous < ' +
      params.maxRyous.toLocaleString('pt-BR') + ', vila=' + params.vila,
      'color:#9b59b6;font-weight:bold'
    );

    var rp = new URLSearchParams(window.location.search);
    var viewOk = (rp.get('view') || 'personagens') === params.view;
    var vilaOk = (rp.get('vila') || 'geral') === params.vila;
    var offset = offsetRankingAtual();

    if (!viewOk || !vilaOk || offset !== 0) {
      var urlInicio = montarUrlRanking(0, params);
      console.log('[Bot Ranking] Indo para inicio: ' + urlInicio);
      try { location.href = urlInicio; } catch (e) { location.assign(urlInicio); }
      return true;
    }

    processarPaginaScan();
    return true;
  }

  function pararScan() {
    marcarScanAtivo(false);
    console.warn('[Bot Ranking] Scan cancelado.');
    return 'cancelado';
  }

  function statusScan() {
    var params = lerParamsSalvos();
    var info = {
      ativo: scanAtivo(),
      pagina: ehPaginaRanking(),
      offset: offsetRankingAtual(),
      acumulado: lerResultadosAcumulados().length,
      params: params
    };
    console.log('[Bot Ranking] Status:', info);
    return info;
  }

  function atualizarPainelRanking() {
    function aplicar() {
      var el = document.getElementById('serverID');
      if (!el) return false;
      if (!el.dataset.botServerBase) {
        var primeira = (el.textContent || '').split('\n')[0];
        el.dataset.botServerBase = primeira.replace(/\s*\|\s*Bot:.*$/i, '').trim();
      }
      var login = '?';
      try {
        login = localStorage.getItem('BOT_USUARIO_LOGIN') || localStorage.getItem('BOT_USUARIO') || '?';
      } catch (e) {}
      var params = lerParamsUrl();
      var scanTxt = scanAtivo() ? 'scan ON' : 'scan off';
      el.style.lineHeight = '1.35';
      el.style.fontSize = '9pt';
      el.style.whiteSpace = 'normal';
      el.innerHTML = [
        el.dataset.botServerBase,
        'Bot: <b>ranking</b> (' + scanTxt + ')',
        'Principal: ' + login,
        '<span style="opacity:.65">—</span>',
        'Filtro: lvl &gt; ' + params.minNivel + ' | ryous &lt; ' + params.maxRyous.toLocaleString('pt-BR'),
        'Console: botRankingScan()'
      ].join('<br>');
      return true;
    }
    if (aplicar()) return;
    setTimeout(aplicar, 800);
  }

  window.botRankingScan = iniciarScan;
  window.botRankingParar = pararScan;
  window.botRankingStatus = statusScan;
  window.__BOT_RANKING_OK__ = true;
  window.__BOT_RANKING_BUILD__ = { versao: SCRIPT_VERSAO };

  if (ehPaginaRanking()) {
    var paramsInicial = lerParamsUrl();
    logAjuda(paramsInicial);
    atualizarPainelRanking();

    if (scanAtivo()) {
      setTimeout(processarPaginaScan, 900);
    }
  }
})();
