// ==UserScript==
// @name         Bot Ranking Mult - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Scan ranking personagens — detecta contas mult (lvl alto, ryous baixo). Script separado.
// @match        https://shadowofshinobi.com/ranking*
// @grant        none
// ==/UserScript==

// Inject Code: roda no contexto da PAGINA (nao content-script isolado) para ler a tabela HTML.
(function() {
  'use strict';

  if (window.__BOT_RANKING_INJECTOR__) return;
  window.__BOT_RANKING_INJECTOR__ = true;

  function injetarRankingNaPagina() {
    var el = document.createElement('script');
    el.textContent = '(' + function botRankingCore() {
      if (window.__BOT_RANKING_OK__) return;

      var SCRIPT_VERSAO = '1.3';
      var SCAN_KEY = 'BOT_RANKING_SCAN_ATIVO';
      var DADOS_KEY = 'BOT_RANKING_MULT_RESULTADOS';
      var PARAMS_KEY = 'BOT_RANKING_SCAN_PARAMS';
      var JA_LEU_KEY = 'BOT_RANKING_JA_LEU_PAGINA';
      var PASSO_RANKING = 50;
      var DELAY_PROXIMA_PAGINA_MS = 1200;
      var AGUARDAR_TABELA_MS = 250;
      var AGUARDAR_TABELA_TENTATIVAS = 30;

      var DEFAULTS = { maxRyous: 1000000, minNivel: 55, vila: 'geral', view: 'personagens' };

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
        if (valor && valor.nodeType === 1) valor = valor.textContent;
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
          if (mr !== null && mr !== '') {
            var nmr = parseNumeroRanking(mr);
            if (nmr !== null && nmr > 0) p.maxRyous = nmr;
          }
          if (mn !== null && mn !== '') {
            var nmn = parseInt(String(mn).replace(/\./g, ''), 10);
            if (!isNaN(nmn)) p.minNivel = nmn;
          }
          if (rp.get('bot_ranking_vila')) p.vila = rp.get('bot_ranking_vila');
          if (rp.get('bot_ranking_view')) p.view = rp.get('bot_ranking_view');
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
        try { sessionStorage.setItem(PARAMS_KEY, JSON.stringify(params)); } catch (e) {}
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
          var r = new URLSearchParams(window.location.search).get('ranking');
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
        qs.set('bot_ranking_max_ryous', String(p.maxRyous));
        qs.set('bot_ranking_min_nivel', String(p.minNivel));
        return 'https://shadowofshinobi.com/ranking?' + qs.toString();
      }

      function textoCelula(td) {
        return (td && td.textContent ? td.textContent : '').replace(/^\|\s*/, '').trim();
      }

      function acharTrDoLink(link) {
        var n = link;
        while (n && n !== document.body) {
          if (n.tagName === 'TR') return n;
          n = n.parentNode;
        }
        return null;
      }

      function parseLinhaRanking(tr) {
        if (!tr) return null;
        var tds = tr.querySelectorAll('td');
        if (tds.length < 4) return null;

        var link = null;
        var linkIdx = -1;
        for (var i = 0; i < tds.length; i++) {
          link = tds[i].querySelector('a[href*="jogador"]');
          if (link) { linkIdx = i; break; }
        }
        if (!link) return null;

        var nome = (link.textContent || '').replace(/\s+/g, ' ').trim();
        if (!nome) {
          try {
            nome = new URL(link.href, window.location.origin).searchParams.get('u') || '';
          } catch (e) {}
        }
        if (!nome) return null;

        var pos = textoCelula(tds[0]).replace(/\u00ba/g, '').trim();
        var nivel = null;
        var vitorias = null;
        var derrotas = null;
        var ryousTexto = textoCelula(tds[tds.length - 1]);
        var ryous = parseNumeroRanking(ryousTexto);

        if (tds.length >= 7) {
          nivel = parseIntRanking(textoCelula(tds[3]));
          vitorias = parseIntRanking(textoCelula(tds[4]));
          derrotas = parseIntRanking(textoCelula(tds[5]));
          ryousTexto = textoCelula(tds[6]);
          ryous = parseNumeroRanking(ryousTexto);
        } else if (linkIdx + 1 < tds.length) {
          nivel = parseIntRanking(textoCelula(tds[linkIdx + 1]));
          if (linkIdx + 2 < tds.length) vitorias = parseIntRanking(textoCelula(tds[linkIdx + 2]));
          if (linkIdx + 3 < tds.length) derrotas = parseIntRanking(textoCelula(tds[linkIdx + 3]));
        }

        if (nivel === null || ryous === null) return null;

        return {
          pos: pos, nome: nome, nivel: nivel,
          vitorias: vitorias != null ? vitorias : '?',
          derrotas: derrotas != null ? derrotas : '?',
          ryous: ryous, ryousTexto: ryousTexto
        };
      }

      function extrairJogadoresPagina() {
        var out = [];
        var vistos = {};

        function add(j) {
          if (!j || !j.nome) return;
          var k = j.nome.toLowerCase();
          if (vistos[k]) return;
          vistos[k] = true;
          out.push(j);
        }

        var tabelas = document.querySelectorAll('table.box_largura_100, table');
        for (var t = 0; t < tabelas.length; t++) {
          var tb = tabelas[t];
          var header = tb.querySelector('tr.box_preto_tarja');
          if (!header) continue;
          var ht = (header.textContent || '').toLowerCase();
          if (ht.indexOf('player') === -1) continue;

          var rows = tb.querySelectorAll('tr');
          for (var i = 0; i < rows.length; i++) {
            if (rows[i].classList.contains('box_preto_tarja')) continue;
            add(parseLinhaRanking(rows[i]));
          }
        }

        if (!out.length) {
          var raiz = document.getElementById('col_direita') || document.getElementById('motor_game') || document.body;
          var links = raiz.querySelectorAll('a[href*="jogador?u="], a[href*="jogador?"]');
          for (var l = 0; l < links.length; l++) {
            add(parseLinhaRanking(acharTrDoLink(links[l])));
          }
        }

        return out;
      }

      function diagDomRanking() {
        var login = !!document.getElementById('login');
        var links = document.querySelectorAll('a[href*="jogador"]').length;
        var tabelas = document.querySelectorAll('table.box_largura_100').length;
        return { login: login, linksJogador: links, tabelas: tabelas };
      }

      function aguardarJogadores(callback, tentativas) {
        var restantes = typeof tentativas === 'number' ? tentativas : AGUARDAR_TABELA_TENTATIVAS;
        var jogadores = extrairJogadoresPagina();
        if (jogadores.length > 0 || restantes <= 0) {
          callback(jogadores);
          return;
        }
        setTimeout(function() {
          aguardarJogadores(callback, restantes - 1);
        }, AGUARDAR_TABELA_MS);
      }

      function marcarJaLeuPagina() {
        try { sessionStorage.setItem(JA_LEU_KEY, '1'); } catch (e) {}
      }

      function jaLeuAlgumaPagina() {
        try { return sessionStorage.getItem(JA_LEU_KEY) === '1'; } catch (e) {}
        return false;
      }

      function lerResultadosAcumulados() {
        try {
          var raw = sessionStorage.getItem(DADOS_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
      }

      function salvarResultados(lista) {
        try { sessionStorage.setItem(DADOS_KEY, JSON.stringify(lista)); } catch (e) {}
      }

      function scanAtivo() {
        try { return sessionStorage.getItem(SCAN_KEY) === '1'; } catch (e) {}
        return false;
      }

      function marcarScanAtivo(ativo) {
        try {
          if (ativo) sessionStorage.setItem(SCAN_KEY, '1');
          else sessionStorage.removeItem(SCAN_KEY);
        } catch (e) {}
      }

      function filtrarMult(jogadores, params) {
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (j.nivel > params.minNivel && j.ryous < params.maxRyous) out.push(j);
        }
        return out;
      }

      function mesclarSemDuplicar(acumulado, novos) {
        var map = {};
        var i;
        for (i = 0; i < acumulado.length; i++) map[acumulado[i].nome.toLowerCase()] = acumulado[i];
        for (i = 0; i < novos.length; i++) map[novos[i].nome.toLowerCase()] = novos[i];
        var out = [];
        for (var k in map) {
          if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
        }
        out.sort(function(a, b) {
          return (parseInt(String(a.pos).replace(/\D/g, ''), 10) || 0) -
            (parseInt(String(b.pos).replace(/\D/g, ''), 10) || 0);
        });
        return out;
      }

      function logAjuda(params) {
        console.log('%c[Bot Ranking] v' + SCRIPT_VERSAO + ' — contexto pagina OK', 'color:#9b59b6;font-weight:bold;font-size:13px');
        console.log('[Bot Ranking] Filtro: lvl > ' + params.minNivel + ' | ryous < ' + params.maxRyous.toLocaleString('pt-BR'));
        console.log('[Bot Ranking] Digite botRankingScan() para iniciar');
        console.log('[Bot Ranking] URL: bot_ranking_max_ryous=1000000 & bot_ranking_min_nivel=55');
      }

      function logResultadoFinal(resultados, params) {
        console.log('');
        console.log('%c[Ranking Mult] FIM — ' + resultados.length + ' jogador(es)', 'color:#e74c3c;font-weight:bold;font-size:13px');
        if (!resultados.length) {
          console.log('[Ranking Mult] Nenhum jogador com lvl > ' + params.minNivel + ' e ryous < ' + params.maxRyous.toLocaleString('pt-BR'));
          return;
        }
        console.log('%c[Ranking Mult] LOG 1 — detalhado', 'color:#3498db;font-weight:bold');
        for (var i = 0; i < resultados.length; i++) {
          var j = resultados[i];
          console.log((j.pos || '?') + ' | ' + j.nome + ' | lvl ' + j.nivel +
            ' | vit ' + j.vitorias + ' | der ' + j.derrotas + ' | ryous ' + j.ryousTexto);
        }
        var nomes = resultados.map(function(j) { return j.nome; });
        console.log('');
        console.log('%c[Ranking Mult] LOG 2 — blacklist', 'color:#2ecc71;font-weight:bold');
        console.log(nomes.join(','));
      }

      function finalizarScan(params) {
        logResultadoFinal(lerResultadosAcumulados(), params);
        marcarScanAtivo(false);
        try { sessionStorage.removeItem(DADOS_KEY); sessionStorage.removeItem(JA_LEU_KEY); } catch (e) {}
      }

      function processarPaginaScanComJogadores(jogadores) {
        var params = lerParamsSalvos();
        var offset = offsetRankingAtual();

        if (!jogadores.length) {
          var d = diagDomRanking();
          if (jaLeuAlgumaPagina() || offset > 0) {
            console.log('[Bot Ranking] ranking=' + offset + ' vazio — fim.');
            finalizarScan(params);
            return;
          }
          if (d.login) {
            console.error('[Bot Ranking] Tela de LOGIN — faca login antes do scan.');
          } else {
            console.error('[Bot Ranking] Tabela nao encontrada. diag:', d);
          }
          marcarScanAtivo(false);
          return;
        }

        marcarJaLeuPagina();
        var mult = filtrarMult(jogadores, params);
        var acumulado = mesclarSemDuplicar(lerResultadosAcumulados(), mult);
        salvarResultados(acumulado);

        console.log('[Bot Ranking] ranking=' + offset + ': ' + jogadores.length + ' jogadores, ' +
          mult.length + ' mult, ' + acumulado.length + ' acumulado.');

        var proximo = offset + PASSO_RANKING;
        console.log('[Bot Ranking] Proxima faixa: ranking=' + proximo);
        setTimeout(function() {
          location.href = montarUrlRanking(proximo, params);
        }, DELAY_PROXIMA_PAGINA_MS);
      }

      function processarPaginaScan() {
        aguardarJogadores(processarPaginaScanComJogadores);
      }

      function iniciarScan(extraParams) {
        if (!ehPaginaRanking()) {
          console.warn('[Bot Ranking] Abra /ranking?view=personagens');
          return false;
        }
        var params = mesclarParams(extraParams);
        salvarParams(params);
        salvarResultados([]);
        try { sessionStorage.removeItem(JA_LEU_KEY); } catch (e) {}
        marcarScanAtivo(true);

        console.log('%c[Bot Ranking] Scan iniciado', 'color:#9b59b6;font-weight:bold');

        var rp = new URLSearchParams(window.location.search);
        var viewOk = (rp.get('view') || 'personagens') === params.view;
        var vilaOk = (rp.get('vila') || 'geral') === params.vila;
        if (!viewOk || !vilaOk || offsetRankingAtual() !== 0) {
          location.href = montarUrlRanking(0, params);
          return true;
        }
        processarPaginaScan();
        return true;
      }

      function pararScan() {
        marcarScanAtivo(false);
        console.warn('[Bot Ranking] Cancelado.');
        return 'cancelado';
      }

      function statusScan() {
        var info = {
          ativo: scanAtivo(),
          offset: offsetRankingAtual(),
          acumulado: lerResultadosAcumulados().length,
          diag: diagDomRanking(),
          params: lerParamsSalvos()
        };
        console.log('[Bot Ranking] Status:', info);
        return info;
      }

      function atualizarPainelRanking() {
        function aplicar() {
          var el = document.getElementById('serverID');
          if (!el) return false;
          if (!el.dataset.botServerBase) {
            el.dataset.botServerBase = (el.textContent || '').split('\n')[0]
              .replace(/\s*\|\s*Bot:.*$/i, '').trim();
          }
          var login = '?';
          try { login = localStorage.getItem('BOT_USUARIO_LOGIN') || localStorage.getItem('BOT_USUARIO') || '?'; } catch (e) {}
          var p = lerParamsUrl();
          el.style.lineHeight = '1.35';
          el.style.fontSize = '9pt';
          el.style.whiteSpace = 'normal';
          el.innerHTML = [
            el.dataset.botServerBase,
            'Bot: <b>ranking</b> (' + (scanAtivo() ? 'scan ON' : 'scan off') + ')',
            'Principal: ' + login,
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
        logAjuda(lerParamsUrl());
        atualizarPainelRanking();
        if (scanAtivo()) setTimeout(processarPaginaScan, 1200);
      }
    }.toString() + ')();';

    (document.documentElement || document.head || document.body).appendChild(el);
    el.parentNode.removeChild(el);
  }

  if (document.documentElement) {
    injetarRankingNaPagina();
  } else {
    document.addEventListener('DOMContentLoaded', injetarRankingNaPagina);
  }
})();
