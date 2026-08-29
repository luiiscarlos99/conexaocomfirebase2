// ==UserScript==
// @name         Bot Ranking Mult - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Scan ranking mult + watch ryous (aumento sem vit/der). Script separado.
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

      var SCRIPT_VERSAO = '1.6';
      var SCAN_KEY = 'BOT_RANKING_SCAN_ATIVO';
      var DADOS_KEY = 'BOT_RANKING_MULT_RESULTADOS';
      var PARAMS_KEY = 'BOT_RANKING_SCAN_PARAMS';
      var JA_LEU_KEY = 'BOT_RANKING_JA_LEU_PAGINA';
      var WATCH_KEY = 'BOT_RANKING_RYOUS_WATCH_ATIVO';
      var WATCH_PARAMS_KEY = 'BOT_RANKING_RYOUS_WATCH_PARAMS';
      var WATCH_ESTADO_KEY = 'BOT_RANKING_RYOUS_WATCH_ESTADO';
      var WATCH_SNAPSHOT_KEY = 'BOT_RANKING_RYOUS_SNAPSHOT';
      var WATCH_PARCIAL_KEY = 'BOT_RANKING_RYOUS_SCAN_PARCIAL';
      var WATCH_JA_LEU_KEY = 'BOT_RANKING_RYOUS_JA_LEU_PAGINA';
      var PASSO_RANKING = 50;
      var DELAY_PROXIMA_PAGINA_MS = 1200;
      var AGUARDAR_TABELA_MS = 250;
      var AGUARDAR_TABELA_TENTATIVAS = 30;
      var FIREBASE_WEBHOOKS_PATH = 'config/discordWebhooks';
      var FIREBASE_DB_URL = 'https://shizuo-a07d9-default-rtdb.firebaseio.com';

      var DEFAULTS = { maxRyous: 1000000, minNivel: 55, vila: 'geral', view: 'personagens' };
      var DEFAULTS_WATCH = {
        maxRyous: 150000000,
        minDeltaRyous: 100000,
        intervaloMs: 600000,
        vila: 'geral',
        view: 'personagens'
      };

      var DISCORD_WEBHOOK_GERAL = '';
      var DISCORD_WEBHOOK_CACADAS = '';
      var webhooksDiscordPromise = null;
      var webhooksDiscordCarregados = false;

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
          if (j.ryous === null || j.ryous <= 0) continue;
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

      function formatarNumeroBr(n) {
        if (n === null || n === undefined || isNaN(n)) return '?';
        try {
          return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        } catch (e) {
          return String(n);
        }
      }

      function aplicarWebhooksDiscordFirebase(dados) {
        if (!dados || typeof dados !== 'object') return;
        if (dados.geral) DISCORD_WEBHOOK_GERAL = String(dados.geral);
        if (dados.cacadas) DISCORD_WEBHOOK_CACADAS = String(dados.cacadas);
      }

      function garantirWebhooksDiscord() {
        if (webhooksDiscordCarregados) return Promise.resolve();
        if (webhooksDiscordPromise) return webhooksDiscordPromise;
        var url = FIREBASE_DB_URL + '/' + FIREBASE_WEBHOOKS_PATH + '.json';
        webhooksDiscordPromise = fetch(url)
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(dados) {
            aplicarWebhooksDiscordFirebase(dados);
            webhooksDiscordCarregados = true;
          })
          .catch(function(err) {
            console.warn('[Bot Ranking] Falha ao ler webhooks Discord:', err);
            webhooksDiscordPromise = null;
          });
        return webhooksDiscordPromise;
      }

      function obterWebhookRankingDiscord() {
        return DISCORD_WEBHOOK_GERAL || DISCORD_WEBHOOK_CACADAS;
      }

      function mesclarParamsWatch(extra) {
        var base = {
          maxRyous: DEFAULTS_WATCH.maxRyous,
          minDeltaRyous: DEFAULTS_WATCH.minDeltaRyous,
          intervaloMs: DEFAULTS_WATCH.intervaloMs,
          vila: DEFAULTS_WATCH.vila,
          view: DEFAULTS_WATCH.view
        };
        try {
          var raw = localStorage.getItem(WATCH_PARAMS_KEY);
          if (raw) {
            var saved = JSON.parse(raw);
            if (saved.maxRyous != null) base.maxRyous = saved.maxRyous;
            if (saved.minDeltaRyous != null) base.minDeltaRyous = saved.minDeltaRyous;
            if (saved.intervaloMs != null) base.intervaloMs = saved.intervaloMs;
            if (saved.vila) base.vila = saved.vila;
            if (saved.view) base.view = saved.view;
          }
        } catch (e) {}
        if (!extra || typeof extra !== 'object') return base;
        if (extra.maxRyous != null) {
          var mr = parseNumeroRanking(extra.maxRyous);
          if (mr !== null && mr > 0) base.maxRyous = mr;
        }
        if (extra.minDeltaRyous != null) {
          var md = parseNumeroRanking(extra.minDeltaRyous);
          if (md !== null && md > 0) base.minDeltaRyous = md;
        }
        if (extra.intervaloMs != null) {
          var iv = parseInt(String(extra.intervaloMs).replace(/\./g, ''), 10);
          if (!isNaN(iv) && iv >= 60000) base.intervaloMs = iv;
        }
        if (extra.intervaloMin != null) {
          var im = parseFloat(String(extra.intervaloMin).replace(',', '.'));
          if (!isNaN(im) && im >= 1) base.intervaloMs = Math.round(im * 60000);
        }
        if (extra.vila) base.vila = String(extra.vila);
        if (extra.view) base.view = String(extra.view);
        return base;
      }

      function salvarParamsWatch(params) {
        try { localStorage.setItem(WATCH_PARAMS_KEY, JSON.stringify(params)); } catch (e) {}
      }

      function lerParamsWatch() {
        return mesclarParamsWatch(null);
      }

      function watchAtivo() {
        try { return localStorage.getItem(WATCH_KEY) === '1'; } catch (e) {}
        return false;
      }

      function marcarWatchAtivo(ativo) {
        try {
          if (ativo) localStorage.setItem(WATCH_KEY, '1');
          else localStorage.removeItem(WATCH_KEY);
        } catch (e) {}
      }

      function lerEstadoWatch() {
        try {
          var raw = localStorage.getItem(WATCH_ESTADO_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { fase: 'idle', modo: 'baseline', aguardarAte: null };
      }

      function salvarEstadoWatch(estado) {
        try { localStorage.setItem(WATCH_ESTADO_KEY, JSON.stringify(estado)); } catch (e) {}
      }

      function lerSnapshotRyous() {
        try {
          var raw = localStorage.getItem(WATCH_SNAPSHOT_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { ts: 0, jogadores: {} };
      }

      function salvarSnapshotRyous(snapshot) {
        try { localStorage.setItem(WATCH_SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch (e) {}
      }

      function lerParcialWatch() {
        try {
          var raw = sessionStorage.getItem(WATCH_PARCIAL_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {};
      }

      function salvarParcialWatch(map) {
        try { sessionStorage.setItem(WATCH_PARCIAL_KEY, JSON.stringify(map)); } catch (e) {}
      }

      function jogadoresParaMap(jogadores) {
        var map = {};
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || !j.nome) continue;
          map[j.nome.toLowerCase()] = {
            pos: j.pos,
            nome: j.nome,
            nivel: j.nivel,
            vitorias: j.vitorias,
            derrotas: j.derrotas,
            ryous: j.ryous,
            ryousTexto: j.ryousTexto
          };
        }
        return map;
      }

      function mesclarMapsJogadores(a, b) {
        var out = {};
        var k;
        for (k in a) {
          if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
        }
        for (k in b) {
          if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k];
        }
        return out;
      }

      function marcarJaLeuPaginaWatch() {
        try { sessionStorage.setItem(WATCH_JA_LEU_KEY, '1'); } catch (e) {}
      }

      function jaLeuAlgumaPaginaWatch() {
        try { return sessionStorage.getItem(WATCH_JA_LEU_KEY) === '1'; } catch (e) {}
        return false;
      }

      function montarUrlRankingWatch(offset, params) {
        var p = params || lerParamsWatch();
        var qs = new URLSearchParams();
        qs.set('view', p.view || 'personagens');
        qs.set('vila', p.vila || 'geral');
        qs.set('ranking', String(typeof offset === 'number' ? offset : 0));
        return 'https://shadowofshinobi.com/ranking?' + qs.toString();
      }

      function detectarRyousSuspeitos(jogadores, snapshotMap, params) {
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || j.ryous === null || j.ryous > params.maxRyous) continue;

          var prev = snapshotMap[j.nome.toLowerCase()];
          if (!prev || prev.ryous === null) continue;

          var vitAnt = prev.vitorias;
          var derAnt = prev.derrotas;
          var vitAt = j.vitorias;
          var derAt = j.derrotas;
          if (typeof vitAnt !== 'number' || typeof derAnt !== 'number') continue;
          if (typeof vitAt !== 'number' || typeof derAt !== 'number') continue;
          if (vitAnt !== vitAt || derAnt !== derAt) continue;

          var delta = j.ryous - prev.ryous;
          if (delta >= params.minDeltaRyous) {
            out.push({
              pos: j.pos,
              nome: j.nome,
              nivel: j.nivel,
              vitorias: vitAt,
              derrotas: derAt,
              ryous: j.ryous,
              ryousTexto: j.ryousTexto,
              deltaRyous: delta,
              ryousAntes: prev.ryous,
              ryousAntesTexto: prev.ryousTexto || formatarNumeroBr(prev.ryous)
            });
          }
        }
        return out;
      }

      function enviarDiscordRyousSuspeitos(offset, suspeitos, params, callback) {
        if (!suspeitos.length) {
          if (callback) callback(false);
          return;
        }
        garantirWebhooksDiscord().then(function() {
          var webhook = obterWebhookRankingDiscord();
          if (!webhook) {
            console.warn('[Bot Ranking] Webhook Discord ausente (geral/cacadas).');
            if (callback) callback(false);
            return;
          }
          var fim = offset + PASSO_RANKING - 1;
          var linhas = [
            '⚠️ **Ranking — ryous subiu sem vit/der** (pos ' + offset + '–' + fim + ')',
            'Filtro: +>=' + formatarNumeroBr(params.minDeltaRyous) + ' ryous | max ' +
              formatarNumeroBr(params.maxRyous)
          ];
          for (var i = 0; i < suspeitos.length; i++) {
            var s = suspeitos[i];
            linhas.push(
              '• **' + s.nome + '** | lvl ' + s.nivel +
              ' | **+' + formatarNumeroBr(s.deltaRyous) + '** (' +
              s.ryousAntesTexto + ' → ' + s.ryousTexto + ')' +
              ' | vit ' + s.vitorias + ' | der ' + s.derrotas
            );
          }
          fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Bot Shadow of Shinobi',
              content: linhas.join('\n')
            })
          }).then(function(r) {
            if (r.ok) {
              console.log('[Bot Ranking Watch] Discord enviado — ' + suspeitos.length + ' jogador(es) ranking=' + offset);
            } else {
              console.warn('[Bot Ranking Watch] Discord HTTP ' + r.status);
            }
            if (callback) callback(r.ok);
          }).catch(function(err) {
            console.warn('[Bot Ranking Watch] Falha Discord:', err);
            if (callback) callback(false);
          });
        });
      }

      function logWatchPrePagina() {
        var params = lerParamsWatch();
        var estado = lerEstadoWatch();
        var offset = offsetRankingAtual();
        var snap = lerSnapshotRyous();
        var qtdSnap = snap.jogadores ? Object.keys(snap.jogadores).length : 0;
        console.log('%c[Bot Ranking Watch] v' + SCRIPT_VERSAO + ' — scan em andamento', 'color:#e67e22;font-weight:bold');
        console.log('[Bot Ranking Watch] ranking=' + offset + ' | modo=' + estado.modo +
          ' | snapshot=' + qtdSnap + ' jogadores | delta>=' + formatarNumeroBr(params.minDeltaRyous) +
          ' | maxRyous=' + formatarNumeroBr(params.maxRyous));
      }

      function agendarProximoWatchCiclo(params) {
        var aguardarAte = Date.now() + params.intervaloMs;
        salvarEstadoWatch({ fase: 'waiting', modo: 'compare', aguardarAte: aguardarAte });
        var min = Math.round(params.intervaloMs / 60000);
        console.log('%c[Bot Ranking Watch] Ciclo concluido — proximo scan em ~' + min + ' min', 'color:#e67e22;font-weight:bold');
        console.log('[Bot Ranking Watch] Proxima verificacao: ' + new Date(aguardarAte).toLocaleString('pt-BR'));
        atualizarPainelRanking();
        if (typeof window.__BOT_RANKING_WATCH_TIMER__ !== 'undefined' && window.__BOT_RANKING_WATCH_TIMER__) {
          clearTimeout(window.__BOT_RANKING_WATCH_TIMER__);
        }
        window.__BOT_RANKING_WATCH_TIMER__ = setTimeout(function() {
          if (!watchAtivo()) return;
          iniciarCicloWatchScan('compare');
        }, params.intervaloMs);
      }

      function finalizarWatchScanVazio(params, estado) {
        var parcial = lerParcialWatch();
        var qtd = Object.keys(parcial).length;
        var snapshot = { ts: Date.now(), jogadores: parcial };

        if (estado.modo === 'baseline') {
          salvarSnapshotRyous(snapshot);
          salvarParcialWatch({});
          try { sessionStorage.removeItem(WATCH_JA_LEU_KEY); } catch (e) {}
          console.log('[Bot Ranking Watch] Baseline salvo — ' + qtd + ' jogadores.');
          agendarProximoWatchCiclo(params);
          return;
        }

        salvarSnapshotRyous(snapshot);
        salvarParcialWatch({});
        try { sessionStorage.removeItem(WATCH_JA_LEU_KEY); } catch (e) {}
        console.log('[Bot Ranking Watch] Compare concluido — snapshot atualizado (' + qtd + ' jogadores).');
        agendarProximoWatchCiclo(params);
      }

      function processarPaginaWatchComJogadores(jogadores) {
        var params = lerParamsWatch();
        var estado = lerEstadoWatch();
        var offset = offsetRankingAtual();

        if (!jogadores.length) {
          var d = diagDomRanking();
          if (jaLeuAlgumaPaginaWatch() || offset > 0) {
            console.log('[Bot Ranking Watch] ranking=' + offset + ' vazio — fim do ciclo.');
            finalizarWatchScanVazio(params, estado);
            return;
          }
          if (d.login) {
            console.error('[Bot Ranking Watch] Tela de LOGIN — faca login antes.');
          } else {
            console.error('[Bot Ranking Watch] Tabela nao encontrada. diag:', d);
          }
          marcarWatchAtivo(false);
          return;
        }

        marcarJaLeuPaginaWatch();
        var parcial = mesclarMapsJogadores(lerParcialWatch(), jogadoresParaMap(jogadores));
        salvarParcialWatch(parcial);

        if (estado.modo === 'compare') {
          var snap = lerSnapshotRyous();
          var snapMap = (snap && snap.jogadores) ? snap.jogadores : {};
          var suspeitos = detectarRyousSuspeitos(jogadores, snapMap, params);
          if (suspeitos.length) {
            enviarDiscordRyousSuspeitos(offset, suspeitos, params);
          }
          console.log('[Bot Ranking Watch] ranking=' + offset + ': ' + jogadores.length +
            ' jogadores, ' + suspeitos.length + ' suspeito(s).');
        } else {
          console.log('[Bot Ranking Watch] ranking=' + offset + ': ' + jogadores.length +
            ' jogadores (baseline).');
        }

        var proximo = offset + PASSO_RANKING;
        setTimeout(function() {
          location.href = montarUrlRankingWatch(proximo, params);
        }, DELAY_PROXIMA_PAGINA_MS);
      }

      function processarPaginaWatch() {
        aguardarJogadores(processarPaginaWatchComJogadores);
      }

      function iniciarCicloWatchScan(modo) {
        if (!watchAtivo()) return false;
        if (scanAtivo()) {
          console.warn('[Bot Ranking Watch] Scan mult ativo — cancele com botRankingParar().');
          return false;
        }
        var params = lerParamsWatch();
        salvarEstadoWatch({ fase: 'scanning', modo: modo || 'compare', aguardarAte: null });
        salvarParcialWatch({});
        try { sessionStorage.removeItem(WATCH_JA_LEU_KEY); } catch (e) {}

        var rp = new URLSearchParams(window.location.search);
        var viewOk = (rp.get('view') || 'personagens') === (params.view || 'personagens');
        var vilaOk = (rp.get('vila') || 'geral') === (params.vila || 'geral');
        if (!viewOk || !vilaOk || offsetRankingAtual() !== 0) {
          location.href = montarUrlRankingWatch(0, params);
          return true;
        }
        logWatchPrePagina();
        processarPaginaWatch();
        return true;
      }

      function iniciarWatchRyous(extraParams) {
        if (!ehPaginaRanking()) {
          console.warn('[Bot Ranking Watch] Abra /ranking?view=personagens');
          return false;
        }
        if (scanAtivo()) {
          console.warn('[Bot Ranking Watch] Scan mult em andamento — botRankingParar() primeiro.');
          return false;
        }
        var params = mesclarParamsWatch(extraParams);
        salvarParamsWatch(params);
        marcarWatchAtivo(true);
        salvarParcialWatch({});
        try { sessionStorage.removeItem(WATCH_JA_LEU_KEY); } catch (e) {}
        garantirWebhooksDiscord();
        console.log('%c[Bot Ranking Watch] Iniciado — baseline + a cada ' +
          Math.round(params.intervaloMs / 60000) + ' min', 'color:#e67e22;font-weight:bold');
        console.log('[Bot Ranking Watch] maxRyous=' + formatarNumeroBr(params.maxRyous) +
          ' | minDelta=' + formatarNumeroBr(params.minDeltaRyous));
        iniciarCicloWatchScan('baseline');
        atualizarPainelRanking();
        return true;
      }

      function pararWatchRyous() {
        marcarWatchAtivo(false);
        try {
          localStorage.removeItem(WATCH_ESTADO_KEY);
          sessionStorage.removeItem(WATCH_PARCIAL_KEY);
          sessionStorage.removeItem(WATCH_JA_LEU_KEY);
        } catch (e) {}
        if (window.__BOT_RANKING_WATCH_TIMER__) {
          clearTimeout(window.__BOT_RANKING_WATCH_TIMER__);
          window.__BOT_RANKING_WATCH_TIMER__ = null;
        }
        console.warn('[Bot Ranking Watch] Cancelado.');
        atualizarPainelRanking();
        return 'cancelado';
      }

      function statusWatchRyous() {
        var estado = lerEstadoWatch();
        var snap = lerSnapshotRyous();
        var info = {
          ativo: watchAtivo(),
          fase: estado.fase,
          modo: estado.modo,
          aguardarAte: estado.aguardarAte,
          snapshotJogadores: snap.jogadores ? Object.keys(snap.jogadores).length : 0,
          snapshotTs: snap.ts || 0,
          offset: offsetRankingAtual(),
          params: lerParamsWatch(),
          diag: diagDomRanking()
        };
        console.log('[Bot Ranking Watch] Status:', info);
        return info;
      }

      function retomarWatchSeNecessario() {
        if (!watchAtivo() || !ehPaginaRanking()) return;
        var estado = lerEstadoWatch();
        if (estado.fase === 'scanning') {
          logWatchPrePagina();
          setTimeout(processarPaginaWatch, 1200);
          return;
        }
        if (estado.fase === 'waiting' && estado.aguardarAte) {
          var restante = estado.aguardarAte - Date.now();
          if (restante <= 0) {
            iniciarCicloWatchScan('compare');
            return;
          }
          var seg = Math.ceil(restante / 1000);
          console.log('[Bot Ranking Watch] Aguardando proximo ciclo (~' + Math.ceil(seg / 60) + ' min)...');
          if (window.__BOT_RANKING_WATCH_TIMER__) clearTimeout(window.__BOT_RANKING_WATCH_TIMER__);
          window.__BOT_RANKING_WATCH_TIMER__ = setTimeout(function() {
            if (watchAtivo()) iniciarCicloWatchScan('compare');
          }, restante);
        }
      }

      function logAjuda(params) {
        var p = params || lerParamsUrl();
        console.log('%c[Bot Ranking] v' + SCRIPT_VERSAO + ' — contexto pagina OK', 'color:#9b59b6;font-weight:bold;font-size:13px');
        console.log('[Bot Ranking] Caçadas/Invasor ficam inativos aqui. So este script age (quando voce chamar).');
        console.log('[Bot Ranking] Filtro atual: lvl > ' + p.minNivel + ' e ryous < ' + p.maxRyous.toLocaleString('pt-BR'));
        console.log('[Bot Ranking] Parametros URL (opcional):');
        console.log('  bot_ranking_max_ryous=' + p.maxRyous + '   (padrao: 1M — pega 999,9k ou menos)');
        console.log('  bot_ranking_min_nivel=' + p.minNivel + '        (padrao: 55 — lvl tem que ser MAIOR que este valor)');
        console.log('  bot_ranking_vila=' + (p.vila || 'geral') + '          (padrao: geral)');
        console.log('[Bot Ranking] Comandos console:');
        console.log('  botRankingScan()                — scan mult (lvl alto, ryous baixo)');
        console.log('  botRankingScan({maxRyous:999000,minNivel:56})');
        console.log('  botRankingParar()               — cancela scan mult');
        console.log('  botRankingStatus()              — status scan mult');
        console.log('  botRankingWatchRyous()          — watch ryous (+100k sem vit/der, a cada 10min)');
        console.log('  botRankingWatchRyous({maxRyous:150000000,minDeltaRyous:100000,intervaloMin:10})');
        console.log('  botRankingWatchParar()          — cancela watch ryous');
        console.log('  botRankingWatchStatus()         — status watch ryous');
        console.log('[Bot Ranking] Exemplo URL:');
        console.log('  /ranking?view=personagens&vila=geral&ranking=0&bot_ranking_max_ryous=1000000&bot_ranking_min_nivel=55');
      }

      function logPreScanPagina() {
        var params = lerParamsSalvos();
        var offset = offsetRankingAtual();
        var acum = lerResultadosAcumulados().length;
        console.log('%c[Bot Ranking] v' + SCRIPT_VERSAO + ' — scan em andamento', 'color:#9b59b6;font-weight:bold');
        console.log('[Bot Ranking] ranking=' + offset + ' | acumulado=' + acum + ' mult | lvl > ' + params.minNivel + ' | ryous < ' + params.maxRyous.toLocaleString('pt-BR'));
        console.log('[Bot Ranking] botRankingParar() — cancelar | botRankingStatus() — status');
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
        if (watchAtivo()) {
          console.warn('[Bot Ranking] Watch ryous ativo — botRankingWatchParar() primeiro.');
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
          var watchOn = watchAtivo();
          var watchEst = lerEstadoWatch();
          var watchTxt = 'off';
          if (watchOn) {
            if (watchEst.fase === 'scanning') watchTxt = 'watch ON (' + watchEst.modo + ')';
            else if (watchEst.fase === 'waiting' && watchEst.aguardarAte) {
              var segW = Math.max(0, Math.ceil((watchEst.aguardarAte - Date.now()) / 60000));
              watchTxt = 'watch aguarda ~' + segW + 'min';
            } else watchTxt = 'watch ON';
          }
          el.innerHTML = [
            el.dataset.botServerBase,
            'Bot: <b>ranking</b> (' + (scanAtivo() ? 'mult ON' : 'mult off') + ' | ' + watchTxt + ')',
            'Principal: ' + login,
            'Console: botRankingScan() | botRankingWatchRyous() | botRankingParar() | botRankingWatchParar()'
          ].join('<br>');
          return true;
        }
        if (aplicar()) return;
        setTimeout(aplicar, 800);
      }

      window.botRankingScan = iniciarScan;
      window.botRankingParar = pararScan;
      window.botRankingStatus = statusScan;
      window.botRankingWatchRyous = iniciarWatchRyous;
      window.botRankingWatchParar = pararWatchRyous;
      window.botRankingWatchStatus = statusWatchRyous;
      window.__BOT_RANKING_OK__ = true;
      window.__BOT_RANKING_BUILD__ = { versao: SCRIPT_VERSAO };

      if (ehPaginaRanking()) {
        garantirWebhooksDiscord();
        atualizarPainelRanking();
        if (watchAtivo()) {
          retomarWatchSeNecessario();
        } else if (scanAtivo()) {
          logPreScanPagina();
          setTimeout(processarPaginaScan, 1200);
        } else {
          logAjuda(lerParamsUrl());
        }
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
