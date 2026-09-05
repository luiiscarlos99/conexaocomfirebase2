// ==UserScript==
// @name         Bot Ranking Mult - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      1.31
// @description  Scan ranking mult + watch ryous (aumento sem vit/der ou vit+2+ sem ryous faturados). Script separado.
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

      var SCRIPT_VERSAO = '1.31';
      var SCAN_KEY = 'BOT_RANKING_SCAN_ATIVO';
      var DEBUG_KEY = 'BOT_RANKING_DEBUG_ATIVO';
      var PERFIL_KEY = 'BOT_RANKING_PERFIL_ATIVO';
      var DADOS_KEY = 'BOT_RANKING_MULT_RESULTADOS';
      var PARAMS_KEY = 'BOT_RANKING_SCAN_PARAMS';
      var JA_LEU_KEY = 'BOT_RANKING_JA_LEU_PAGINA';
      var WATCH_KEY = 'BOT_RANKING_RYOUS_WATCH_ATIVO';
      var WATCH_PARAMS_KEY = 'BOT_RANKING_RYOUS_WATCH_PARAMS';
      var WATCH_ESTADO_KEY = 'BOT_RANKING_RYOUS_WATCH_ESTADO';
      var WATCH_SNAPSHOT_KEY = 'BOT_RANKING_RYOUS_SNAPSHOT';
      var WATCH_PARCIAL_KEY = 'BOT_RANKING_RYOUS_SCAN_PARCIAL';
      var WATCH_JA_LEU_KEY = 'BOT_RANKING_RYOUS_JA_LEU_PAGINA';
      var RETORNO_LOGIN_KEY = 'BOT_RANKING_RETORNO_URL';
      var PASSO_RANKING = 50;
      var DELAY_PROXIMA_PAGINA_MS = 1200;
      var DEBUG_PROXIMA_PAGINA_MS = 120000;
      var PERFIL_FETCH_DELAY_MS = 450;
      var PERFIL_FETCH_TIMEOUT_MS = 15000;
      var PERFIL_FETCH_RETRY_MAX = 3;
      var PERFIL_FETCH_RETRY_429_MS = 8000;
      var DISCORD_ALERTAS_KEY = 'BOT_RANKING_DISCORD_ALERTAS';
      var AGUARDAR_TABELA_MS = 250;
      var AGUARDAR_TABELA_TENTATIVAS = 30;
      var FIREBASE_WEBHOOKS_PATH = 'config/discordWebhooks';
      var FIREBASE_DB_URL = 'https://shizuo-a07d9-default-rtdb.firebaseio.com';
      var RANKING_RYOUS_FILA_FB_PATH = 'ranking_ryous_fila';
      var RANKING_RYOUS_FILA_TTL_MS = 3600000;

      var DEFAULTS = { maxRyous: 1000000, minNivel: 55, maxNivel: 999999, vila: 'geral', view: 'personagens' };
      var DEFAULTS_WATCH = {
        maxRyous: 100000000,
        minDeltaRyous: 100000,
        minDeltaDivergencia: 50000,
        minNivel: 74,
        maxNivel: 999999,
        intervaloMs: 600000,
        discordCooldownMin: 30,
        compareDeltaVitorias: true,
        minDeltaVitorias: 2,
        vila: 'geral',
        view: 'personagens'
      };

      var DISCORD_WATCH_RYOUS_SILENCIOSO = true;
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
          maxNivel: DEFAULTS.maxNivel,
          vila: DEFAULTS.vila,
          view: DEFAULTS.view
        };
        try {
          var rp = new URLSearchParams(window.location.search);
          var mr = rp.get('bot_ranking_max_ryous');
          var mn = rp.get('bot_ranking_min_nivel');
          var mx = rp.get('bot_ranking_max_nivel');
          if (mr !== null && mr !== '') {
            var nmr = parseNumeroRanking(mr);
            if (nmr !== null && nmr > 0) p.maxRyous = nmr;
          }
          if (mn !== null && mn !== '') {
            var nmn = parseInt(String(mn).replace(/\./g, ''), 10);
            if (!isNaN(nmn)) p.minNivel = nmn;
          }
          if (mx !== null && mx !== '') {
            var nmx = parseInt(String(mx).replace(/\./g, ''), 10);
            if (!isNaN(nmx) && nmx > 0) p.maxNivel = nmx;
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
        if (extra.maxNivel != null) {
          var mx = parseInt(String(extra.maxNivel).replace(/\./g, ''), 10);
          if (!isNaN(mx) && mx > 0) base.maxNivel = mx;
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
        qs.set('bot_ranking_max_nivel', String(p.maxNivel != null ? p.maxNivel : DEFAULTS.maxNivel));
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

        var urlJogador = '';
        try { urlJogador = new URL(link.href, window.location.origin).href; } catch (e) {
          urlJogador = link.href || '';
        }

        if (nivel === null) return null;

        var vitR = vitorias != null && !isNaN(vitorias) ? vitorias : null;
        var derR = derrotas != null && !isNaN(derrotas) ? derrotas : null;
        if (ryous === null && !urlJogador) return null;

        return {
          pos: pos, nome: nome, nivel: nivel,
          vitoriasRanking: vitR,
          derrotasRanking: derR,
          ryousRanking: ryous,
          ryousRankingTexto: ryousTexto,
          vitorias: vitR != null ? vitR : '?',
          derrotas: derR != null ? derR : '?',
          ryous: ryous,
          ryousTexto: ryousTexto,
          urlJogador: urlJogador
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

      function rankingPerfilAtivo() {
        try { return sessionStorage.getItem(PERFIL_KEY) === '1'; } catch (e) {}
        return false;
      }

      function marcarRankingPerfil(ativo) {
        try {
          if (ativo) sessionStorage.setItem(PERFIL_KEY, '1');
          else sessionStorage.removeItem(PERFIL_KEY);
        } catch (e) {}
        if (typeof atualizarPainelRanking === 'function') atualizarPainelRanking();
      }

      function botRankingCompareDeltaVitorias(ligar) {
        var params = lerParamsWatch();
        if (arguments.length === 0) {
          console.log('[Bot Ranking Watch] compareDeltaVitorias: ' +
            (params.compareDeltaVitorias !== false ? 'ligado' : 'desligado'));
          return params.compareDeltaVitorias !== false;
        }
        params.compareDeltaVitorias = !!ligar;
        salvarParamsWatch(params);
        console.log('[Bot Ranking Watch] compareDeltaVitorias: ' +
          (params.compareDeltaVitorias ? 'ligado' : 'desligado'));
        atualizarPainelRanking();
        return params.compareDeltaVitorias;
      }

      function botRankingPerfilRyous(ligar) {
        if (arguments.length === 0) {
          return rankingPerfilAtivo() ? 'perfil ON' : 'perfil OFF';
        }
        var desligar = ligar === false || ligar === 0 || ligar === '0' ||
          ligar === 'off' || ligar === 'false';
        if (desligar) {
          marcarRankingPerfil(false);
          console.log('[Bot Ranking Perfil] Desligado — volta a usar ryous do ranking.');
          return 'perfil OFF';
        }
        if (!watchAtivo() && !scanAtivo()) {
          console.warn('[Bot Ranking Perfil] Ligue botRankingWatchRyous() ou botRankingScan() primeiro.');
          return 'perfil OFF (watch/scan inativo)';
        }
        marcarRankingPerfil(true);
        console.log('%c[Bot Ranking Perfil] Ligado — ryous/vit/der do perfil; ranking sempre guardado em paralelo.',
          'color:#3498db;font-weight:bold');
        return 'perfil ON';
      }

      function normalizarRotuloPerfil(texto) {
        return String(texto || '').trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      function extrairValorLinhaHtmlPerfil(doc, rotulos) {
        if (!doc) return null;
        var escopos = [
          doc.getElementById('col_direita'),
          doc.getElementById('motor_game'),
          doc.body
        ];
        for (var s = 0; s < escopos.length; s++) {
          var escopo = escopos[s];
          if (!escopo) continue;
          var linhas = escopo.querySelectorAll('tr');
          for (var i = 0; i < linhas.length; i++) {
            var tds = linhas[i].querySelectorAll('td');
            if (tds.length < 2) continue;
            var rot = normalizarRotuloPerfil(tds[0].textContent);
            for (var r = 0; r < rotulos.length; r++) {
              if (rot.indexOf(rotulos[r]) !== 0) continue;
              return (tds[1].textContent || '').replace(/^\|\s*/, '').trim();
            }
          }
        }
        return null;
      }

      function extrairCampoRegexPerfil(texto, padroes) {
        if (!texto) return null;
        for (var i = 0; i < padroes.length; i++) {
          var m = texto.match(padroes[i]);
          if (m && m[1]) return String(m[1]).trim();
        }
        return null;
      }

      function parseHtmlPerfilJogador(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var bodyTxt = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
        if (doc.getElementById('login') || /login de usu[aá]rio/i.test(bodyTxt)) {
          return { erro: 'sessao expirada (login)' };
        }

        var ryousTexto = extrairValorLinhaHtmlPerfil(doc, ['ryous faturados', 'ryous']);
        if (!ryousTexto) {
          ryousTexto = extrairCampoRegexPerfil(bodyTxt, [
            /ryous faturados\s*[:\|]?\s*([\d.,]+(?:\s*[mk])?)/i,
            /ryous\s*[:\|]?\s*([\d.,]+(?:\s*[mk])?)/i
          ]);
        }

        var vitTexto = extrairValorLinhaHtmlPerfil(doc, ['vitorias', 'vitórias']);
        if (!vitTexto) {
          vitTexto = extrairCampoRegexPerfil(bodyTxt, [
            /vit[oó]rias\s*[:\|]?\s*(\d+)/i
          ]);
        }

        var derTexto = extrairValorLinhaHtmlPerfil(doc, ['derrotas']);
        if (!derTexto) {
          derTexto = extrairCampoRegexPerfil(bodyTxt, [
            /derrotas\s*[:\|]?\s*(\d+)/i
          ]);
        }

        var ryous = ryousTexto != null ? parseNumeroRanking(ryousTexto) : null;
        var vitorias = vitTexto != null ? parseIntRanking(vitTexto) : null;
        var derrotas = derTexto != null ? parseIntRanking(derTexto) : null;

        if (ryous === null) {
          return { erro: 'ryous nao encontrado no perfil' };
        }

        return {
          ryous: ryous,
          ryousTexto: ryousTexto,
          vitorias: vitorias,
          derrotas: derrotas
        };
      }

      function buscarDadosPerfilJogador(url, tentativa) {
        var n = typeof tentativa === 'number' ? tentativa : 0;
        return new Promise(function(resolve) {
          if (!url) {
            resolve({ erro: 'url vazia' });
            return;
          }
          var timer = null;
          var opts = { credentials: 'same-origin', cache: 'no-store' };
          if (typeof AbortController !== 'undefined') {
            var ctrl = new AbortController();
            opts.signal = ctrl.signal;
            timer = setTimeout(function() { ctrl.abort(); }, PERFIL_FETCH_TIMEOUT_MS);
          }
          fetch(url, opts).then(function(resp) {
            if (resp.status === 429) {
              if (timer) clearTimeout(timer);
              if (n >= PERFIL_FETCH_RETRY_MAX) {
                resolve({ erro: 'HTTP 429' });
                return null;
              }
              var espera = PERFIL_FETCH_RETRY_429_MS * (n + 1);
              console.warn('[Bot Ranking Perfil] HTTP 429 — retry ' + (n + 1) + '/' +
                PERFIL_FETCH_RETRY_MAX + ' em ' + Math.round(espera / 1000) + 's...');
              return new Promise(function(retryResolve) {
                setTimeout(function() {
                  buscarDadosPerfilJogador(url, n + 1).then(retryResolve);
                }, espera);
              });
            }
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.text();
          }).then(function(html) {
            if (html === null || html === undefined) return;
            if (timer) clearTimeout(timer);
            if (typeof html === 'object') {
              resolve(html);
              return;
            }
            resolve(parseHtmlPerfilJogador(html));
          }).catch(function(err) {
            if (timer) clearTimeout(timer);
            var msg = String(err && err.message ? err.message : err);
            if (/429/.test(msg) && n < PERFIL_FETCH_RETRY_MAX) {
              var esperaErr = PERFIL_FETCH_RETRY_429_MS * (n + 1);
              setTimeout(function() {
                buscarDadosPerfilJogador(url, n + 1).then(resolve);
              }, esperaErr);
              return;
            }
            resolve({ erro: msg });
          });
        });
      }

      function passaFiltroLvlRanking(j, minNivel, scanMode, maxNivel) {
        if (!j || j.nivel === null || isNaN(j.nivel)) return false;
        var max = maxNivel != null ? maxNivel : DEFAULTS.maxNivel;
        if (j.nivel > max) return false;
        if (scanMode) return j.nivel > minNivel;
        return j.nivel >= minNivel;
      }

      function temRyousPerfil(j) {
        return !!(j && j.ryousPerfil !== null && j.ryousPerfil !== undefined);
      }

      function temRyousRanking(j) {
        return !!(j && j.ryousRanking !== null && j.ryousRanking !== undefined);
      }

      function migrarJogadorLegado(j) {
        if (!j) return j;
        if (j.ryousRanking == null && j.ryous != null && !temRyousPerfil(j)) {
          j.ryousRanking = j.ryous;
          j.ryousRankingTexto = j.ryousTexto;
        }
        if (j.vitoriasRanking == null && typeof j.vitorias === 'number') {
          j.vitoriasRanking = j.vitorias;
        }
        if (j.derrotasRanking == null && typeof j.derrotas === 'number') {
          j.derrotasRanking = j.derrotas;
        }
        if (temRyousPerfil(j) && !j.ryousPerfilTexto && j.ryousTexto && rankingPerfilAtivo()) {
          j.ryousPerfilTexto = j.ryousTexto;
        }
        return j;
      }

      function escolherFonteCompare(prev, cur) {
        migrarJogadorLegado(prev);
        migrarJogadorLegado(cur);
        if (temRyousPerfil(prev) && temRyousPerfil(cur)) return 'perfil';
        return 'ranking';
      }

      function obterRyousCompare(j, fonte) {
        migrarJogadorLegado(j);
        if (!j) return null;
        if (fonte === 'perfil') return j.ryousPerfil;
        if (j.ryousRanking != null) return j.ryousRanking;
        return j.ryous != null ? j.ryous : null;
      }

      function obterRyousTextoCompare(j, fonte) {
        migrarJogadorLegado(j);
        if (!j) return '?';
        if (fonte === 'perfil') {
          return j.ryousPerfilTexto || formatarNumeroBr(j.ryousPerfil);
        }
        return j.ryousRankingTexto || j.ryousTexto || formatarNumeroBr(j.ryousRanking || j.ryous);
      }

      function obterVitDerCompare(j, fonte) {
        migrarJogadorLegado(j);
        if (!j) return { vit: null, der: null };
        if (fonte === 'perfil') {
          return {
            vit: typeof j.vitoriasPerfil === 'number' ? j.vitoriasPerfil : null,
            der: typeof j.derrotasPerfil === 'number' ? j.derrotasPerfil : null
          };
        }
        var vit = typeof j.vitoriasRanking === 'number' ? j.vitoriasRanking :
          (typeof j.vitorias === 'number' ? j.vitorias : null);
        var der = typeof j.derrotasRanking === 'number' ? j.derrotasRanking :
          (typeof j.derrotas === 'number' ? j.derrotas : null);
        return { vit: vit, der: der };
      }

      function ryousParaScanMult(j) {
        migrarJogadorLegado(j);
        if (!j) return null;
        if (rankingPerfilAtivo() && temRyousPerfil(j)) return j.ryousPerfil;
        if (temRyousRanking(j)) return j.ryousRanking;
        return j.ryous;
      }

      function aplicarDadosPerfilJogador(jog, dados) {
        if (dados && !dados.erro) {
          jog.ryousPerfil = dados.ryous;
          jog.ryousPerfilTexto = dados.ryousTexto;
          if (typeof dados.vitorias === 'number') jog.vitoriasPerfil = dados.vitorias;
          if (typeof dados.derrotas === 'number') jog.derrotasPerfil = dados.derrotas;
          jog.dadosPerfil = true;
          if (rankingPerfilAtivo()) {
            jog.ryous = dados.ryous;
            jog.ryousTexto = dados.ryousTexto;
            if (typeof dados.vitorias === 'number') jog.vitorias = dados.vitorias;
            if (typeof dados.derrotas === 'number') jog.derrotas = dados.derrotas;
          }
          return true;
        }
        jog.erroPerfil = dados ? dados.erro : 'fetch falhou';
        return false;
      }

      function enriquecerJogadoresComPerfil(jogadores, minNivel, scanMode, maxNivel, callback) {
        var fila = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || !j.urlJogador) continue;
          if (!passaFiltroLvlRanking(j, minNivel, scanMode, maxNivel)) continue;
          fila.push(j);
        }

        if (!fila.length) {
          console.log('[Bot Ranking Perfil] Nenhum jogador com lvl ok no ranking para buscar perfil.');
          callback(jogadores);
          return;
        }

        console.log('[Bot Ranking Perfil] Buscando ' + fila.length + ' perfil(is) um por um...');
        var pos = 0;
        var inicio = Date.now();
        var ok = 0;
        var falhas = 0;

        function proximo() {
          if (pos >= fila.length) {
            var seg = ((Date.now() - inicio) / 1000).toFixed(1);
            console.log('[Bot Ranking Perfil] Concluido em ' + seg + 's — ' + ok + ' ok, ' + falhas + ' falha(s).');
            callback(jogadores);
            return;
          }
          var jog = fila[pos];
          pos++;
          console.log('[Bot Ranking Perfil] (' + pos + '/' + fila.length + ') ' + jog.nome + '...');
          buscarDadosPerfilJogador(jog.urlJogador).then(function(dados) {
            if (aplicarDadosPerfilJogador(jog, dados)) ok++;
            else {
              falhas++;
              console.warn('[Bot Ranking Perfil] Falha em ' + jog.nome + ': ' + jog.erroPerfil);
            }
            setTimeout(proximo, PERFIL_FETCH_DELAY_MS);
          });
        }

        proximo();
      }

      function prepararJogadoresPagina(processarFn, minNivel, scanMode, maxNivel) {
        aguardarJogadores(function(jogadores) {
          for (var i = 0; i < jogadores.length; i++) migrarJogadorLegado(jogadores[i]);
          if (!rankingPerfilAtivo()) {
            processarFn(jogadores);
            return;
          }
          enriquecerJogadoresComPerfil(jogadores, minNivel, !!scanMode, maxNivel, processarFn);
        });
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

      function salvarRetornoPosLoginSeAtivo() {
        if (!scanAtivo() && !watchAtivo()) return;
        try { sessionStorage.setItem(RETORNO_LOGIN_KEY, window.location.href); } catch (e) {}
      }

      function limparRetornoPosLogin() {
        try { sessionStorage.removeItem(RETORNO_LOGIN_KEY); } catch (e) {}
      }

      function scanAtivo() {
        try { return sessionStorage.getItem(SCAN_KEY) === '1'; } catch (e) {}
        return false;
      }

      function marcarScanAtivo(ativo) {
        try {
          if (ativo) {
            sessionStorage.setItem(SCAN_KEY, '1');
            salvarRetornoPosLoginSeAtivo();
          } else {
            sessionStorage.removeItem(SCAN_KEY);
            if (!watchAtivo()) limparRetornoPosLogin();
          }
        } catch (e) {}
      }

      function maxNivelRanking(params) {
        if (params && params.maxNivel != null) return params.maxNivel;
        return DEFAULTS.maxNivel;
      }

      function filtrarMult(jogadores, params) {
        var maxNivel = maxNivelRanking(params);
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = migrarJogadorLegado(jogadores[i]);
          var ry = ryousParaScanMult(j);
          if (ry === null || ry <= 0) continue;
          if (j.nivel > params.minNivel && j.nivel <= maxNivel && ry < params.maxRyous) {
            var copia = {};
            for (var p in j) {
              if (Object.prototype.hasOwnProperty.call(j, p)) copia[p] = j[p];
            }
            copia.ryous = ry;
            copia.ryousTexto = rankingPerfilAtivo() && temRyousPerfil(j)
              ? (j.ryousPerfilTexto || formatarNumeroBr(ry))
              : (j.ryousRankingTexto || j.ryousTexto || formatarNumeroBr(ry));
            out.push(copia);
          }
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

      function parseBoolRankingParam(valor, padrao) {
        if (valor === null || valor === undefined) return padrao;
        if (typeof valor === 'boolean') return valor;
        var s = String(valor).trim().toLowerCase();
        if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
          return false;
        }
        if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
          return true;
        }
        return padrao;
      }

      function mesclarParamsWatch(extra) {
        var base = {
          maxRyous: DEFAULTS_WATCH.maxRyous,
          minDeltaRyous: DEFAULTS_WATCH.minDeltaRyous,
          minNivel: DEFAULTS_WATCH.minNivel,
          maxNivel: DEFAULTS_WATCH.maxNivel,
          intervaloMs: DEFAULTS_WATCH.intervaloMs,
          compareDeltaVitorias: DEFAULTS_WATCH.compareDeltaVitorias,
          minDeltaVitorias: DEFAULTS_WATCH.minDeltaVitorias,
          vila: DEFAULTS_WATCH.vila,
          view: DEFAULTS_WATCH.view
        };
        try {
          var raw = localStorage.getItem(WATCH_PARAMS_KEY);
          if (raw) {
            var saved = JSON.parse(raw);
            if (saved.maxRyous != null) base.maxRyous = saved.maxRyous;
            if (saved.minDeltaRyous != null) base.minDeltaRyous = saved.minDeltaRyous;
            if (saved.minDeltaDivergencia != null) base.minDeltaDivergencia = saved.minDeltaDivergencia;
            if (saved.minNivel != null) base.minNivel = saved.minNivel;
            if (saved.maxNivel != null) base.maxNivel = saved.maxNivel;
            if (saved.intervaloMs != null) base.intervaloMs = saved.intervaloMs;
            if (saved.discordCooldownMin != null) base.discordCooldownMin = saved.discordCooldownMin;
            if (saved.compareDeltaVitorias != null) {
              base.compareDeltaVitorias = parseBoolRankingParam(saved.compareDeltaVitorias, true);
            }
            if (saved.minDeltaVitorias != null) {
              var mdv = parseInt(String(saved.minDeltaVitorias).replace(/\./g, ''), 10);
              if (!isNaN(mdv) && mdv >= 1) base.minDeltaVitorias = mdv;
            }
            if (saved.vila) base.vila = saved.vila;
            if (saved.view) base.view = saved.view;
          }
        } catch (e) {}
        try {
          var rp = new URLSearchParams(window.location.search);
          var mnWatch = rp.get('bot_ranking_watch_min_nivel');
          if (mnWatch !== null && mnWatch !== '') {
            var nmnWatch = parseInt(String(mnWatch).replace(/\./g, ''), 10);
            if (!isNaN(nmnWatch)) base.minNivel = nmnWatch;
          }
          var mxWatch = rp.get('bot_ranking_watch_max_nivel');
          if (mxWatch !== null && mxWatch !== '') {
            var nmxWatch = parseInt(String(mxWatch).replace(/\./g, ''), 10);
            if (!isNaN(nmxWatch) && nmxWatch > 0) base.maxNivel = nmxWatch;
          }
          var cdv = rp.get('bot_ranking_compare_delta_vitorias');
          if (cdv !== null && cdv !== '') {
            base.compareDeltaVitorias = parseBoolRankingParam(cdv, true);
          }
          var mdvUrl = rp.get('bot_ranking_min_delta_vitorias');
          if (mdvUrl !== null && mdvUrl !== '') {
            var nmdv = parseInt(String(mdvUrl).replace(/\./g, ''), 10);
            if (!isNaN(nmdv) && nmdv >= 1) base.minDeltaVitorias = nmdv;
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
        if (extra.minDeltaDivergencia != null) {
          var mdd = parseNumeroRanking(extra.minDeltaDivergencia);
          if (mdd !== null && mdd > 0) base.minDeltaDivergencia = mdd;
        }
        if (extra.minNivel != null) {
          var mn = parseInt(String(extra.minNivel).replace(/\./g, ''), 10);
          if (!isNaN(mn)) base.minNivel = mn;
        }
        if (extra.maxNivel != null) {
          var mxExtra = parseInt(String(extra.maxNivel).replace(/\./g, ''), 10);
          if (!isNaN(mxExtra) && mxExtra > 0) base.maxNivel = mxExtra;
        }
        if (extra.intervaloMs != null) {
          var iv = parseInt(String(extra.intervaloMs).replace(/\./g, ''), 10);
          if (!isNaN(iv) && iv >= 60000) base.intervaloMs = iv;
        }
        if (extra.intervaloMin != null) {
          var im = parseFloat(String(extra.intervaloMin).replace(',', '.'));
          if (!isNaN(im) && im >= 1) base.intervaloMs = Math.round(im * 60000);
        }
        if (extra.discordCooldownMin != null) {
          var dcm = parseInt(String(extra.discordCooldownMin).replace(/\./g, ''), 10);
          if (!isNaN(dcm) && dcm >= 5) base.discordCooldownMin = dcm;
        }
        if (extra.compareDeltaVitorias != null) {
          base.compareDeltaVitorias = parseBoolRankingParam(extra.compareDeltaVitorias, true);
        }
        if (extra.minDeltaVitorias != null) {
          var mdvExtra = parseInt(String(extra.minDeltaVitorias).replace(/\./g, ''), 10);
          if (!isNaN(mdvExtra) && mdvExtra >= 1) base.minDeltaVitorias = mdvExtra;
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
          if (ativo) {
            localStorage.setItem(WATCH_KEY, '1');
            salvarRetornoPosLoginSeAtivo();
          } else {
            localStorage.removeItem(WATCH_KEY);
            if (!scanAtivo()) limparRetornoPosLogin();
          }
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

      function jogadorParaSnapshot(j) {
        j = migrarJogadorLegado(j);
        return {
          pos: j.pos,
          nome: j.nome,
          nivel: j.nivel,
          ryousRanking: j.ryousRanking,
          ryousRankingTexto: j.ryousRankingTexto,
          ryousPerfil: temRyousPerfil(j) ? j.ryousPerfil : null,
          ryousPerfilTexto: j.ryousPerfilTexto || null,
          vitoriasRanking: typeof j.vitoriasRanking === 'number' ? j.vitoriasRanking : null,
          derrotasRanking: typeof j.derrotasRanking === 'number' ? j.derrotasRanking : null,
          vitoriasPerfil: typeof j.vitoriasPerfil === 'number' ? j.vitoriasPerfil : null,
          derrotasPerfil: typeof j.derrotasPerfil === 'number' ? j.derrotasPerfil : null
        };
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
          map[j.nome.toLowerCase()] = jogadorParaSnapshot(j);
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
        if (p.minNivel != null) qs.set('bot_ranking_watch_min_nivel', String(p.minNivel));
        if (p.maxNivel != null) qs.set('bot_ranking_watch_max_nivel', String(p.maxNivel));
        return 'https://shadowofshinobi.com/ranking?' + qs.toString();
      }

      function normalizarChaveFirebaseRankingFila(nome) {
        return String(nome || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '');
      }

      function urlFirebaseRankingFila(suffix) {
        return FIREBASE_DB_URL + '/' + RANKING_RYOUS_FILA_FB_PATH + (suffix || '') + '.json';
      }

      function limparExpiradosFirebaseFila(callback) {
        var limiteTs = Date.now() - RANKING_RYOUS_FILA_TTL_MS;
        fetch(urlFirebaseRankingFila(''), { cache: 'no-store' })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(data) {
            if (!data || typeof data !== 'object') {
              if (callback) callback();
              return;
            }
            var deletes = [];
            for (var k in data) {
              if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
              var item = data[k];
              if (!item || !item.ts || item.ts < limiteTs) {
                deletes.push(fetch(urlFirebaseRankingFila('/' + k), { method: 'DELETE' }));
              }
            }
            Promise.all(deletes).catch(function() {}).finally(function() {
              if (callback) callback();
            });
          })
          .catch(function(err) {
            console.warn('[Bot Ranking Watch] Falha ao limpar expirados Firebase:', err);
            if (callback) callback();
          });
      }

      function salvarSuspeitoFirebaseFila(suspeito) {
        var chave = normalizarChaveFirebaseRankingFila(suspeito.nome);
        if (!chave) return Promise.resolve({ ok: false, motivo: 'nome invalido' });

        var payload = {
          nome: suspeito.nome,
          deltaRyous: suspeito.deltaRyous,
          ryous: suspeito.ryous,
          nivel: suspeito.nivel,
          vitorias: suspeito.vitorias,
          vitoriasAntes: suspeito.vitoriasAntes != null ? suspeito.vitoriasAntes : null,
          derrotas: suspeito.derrotas,
          tipo: suspeito.tipo || 'ciclo',
          tipoSuspeito: suspeito.tipoSuspeito || 'ryous_sem_vitder',
          deltaVitorias: suspeito.deltaVitorias != null ? suspeito.deltaVitorias : null,
          fonteCompare: suspeito.fonteCompare || null,
          ts: Date.now()
        };

        return fetch(urlFirebaseRankingFila('/' + chave), { cache: 'no-store' })
          .then(function(r) {
            if (r.status === 404) return null;
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(existing) {
            if (existing && existing.ts >= Date.now() - RANKING_RYOUS_FILA_TTL_MS) {
              var mesmoTipo = (existing.tipoSuspeito || 'ryous_sem_vitder') === payload.tipoSuspeito;
              if (mesmoTipo) {
                if (payload.tipoSuspeito === 'vit_sem_ryous') {
                  if ((existing.deltaVitorias || 0) >= (payload.deltaVitorias || 0)) {
                    return { ok: false, motivo: 'delta vit menor ou igual' };
                  }
                } else if ((existing.deltaRyous || 0) >= (payload.deltaRyous || 0)) {
                  return { ok: false, motivo: 'delta ryous menor ou igual' };
                }
              }
              if (existing.energiaVitalRetryApos > Date.now()) {
                payload.energiaVitalRetryApos = existing.energiaVitalRetryApos;
              }
            }
            return fetch(urlFirebaseRankingFila('/' + chave), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).then(function(r) {
              if (r.ok && payload.tipoSuspeito === 'vit_sem_ryous') {
                console.log('[Bot Ranking Watch] Firebase fila vit+sem ryous: ' + payload.nome +
                  ' (vit ' + (payload.vitoriasAntes != null ? payload.vitoriasAntes : '?') +
                  '->' + payload.vitorias + ', delta vit +' + (payload.deltaVitorias || '?') + ')');
              }
              return { ok: r.ok, motivo: r.ok ? 'salvo' : 'HTTP ' + r.status };
            });
          })
          .catch(function(err) {
            console.warn('[Bot Ranking Watch] Falha ao salvar ' + suspeito.nome + ':', err);
            return { ok: false, motivo: String(err) };
          });
      }

      function salvarSuspeitosFirebaseFila(suspeitos, callback) {
        if (!suspeitos.length) {
          if (callback) callback(0);
          return;
        }
        limparExpiradosFirebaseFila(function() {
          var idx = 0;
          var salvos = 0;
          function proximo() {
            if (idx >= suspeitos.length) {
              console.log('[Bot Ranking Watch] Firebase fila: ' + salvos + '/' + suspeitos.length +
                ' salvo(s) (TTL 1h; prioridade: delta ryous, depois vit+ sem ryous).');
              if (callback) callback(salvos);
              return;
            }
            salvarSuspeitoFirebaseFila(suspeitos[idx]).then(function(res) {
              if (res && res.ok) salvos++;
              idx++;
              proximo();
            });
          }
          proximo();
        });
      }

      function avaliarJogadorWatch(j, prev, params) {
        if (!j) return { status: 'descartado', motivo: 'jogador invalido' };
        j = migrarJogadorLegado(j);
        prev = migrarJogadorLegado(prev);
        var fonte = escolherFonteCompare(prev, j);
        var ryousAt = obterRyousCompare(j, fonte);
        var ryousPrev = obterRyousCompare(prev, fonte);

        if (ryousAt === null) {
          return {
            status: 'descartado', motivo: 'ryous nao parseado (' + fonte + ')',
            ryousTexto: obterRyousTextoCompare(j, fonte), fonteCompare: fonte
          };
        }
        if (ryousAt > params.maxRyous) {
          return {
            status: 'descartado', motivo: 'ryous acima do max',
            ryous: ryousAt, maxRyous: params.maxRyous, fonteCompare: fonte
          };
        }
        if (j.nivel === null || j.nivel < params.minNivel) {
          return {
            status: 'descartado', motivo: 'nivel abaixo do min',
            nivel: j.nivel, minNivel: params.minNivel, fonteCompare: fonte
          };
        }
        var maxNivelWatch = params.maxNivel != null ? params.maxNivel : DEFAULTS_WATCH.maxNivel;
        if (j.nivel > maxNivelWatch) {
          return {
            status: 'descartado', motivo: 'nivel acima do max',
            nivel: j.nivel, maxNivel: maxNivelWatch, fonteCompare: fonte
          };
        }
        if (!prev || ryousPrev === null) {
          return { status: 'descartado', motivo: 'sem snapshot anterior', nome: j.nome, fonteCompare: fonte };
        }

        var vdAt = obterVitDerCompare(j, fonte);
        var vdPrev = obterVitDerCompare(prev, fonte);
        var vitAnt = vdPrev.vit;
        var derAnt = vdPrev.der;
        var vitAt = vdAt.vit;
        var derAt = vdAt.der;
        if (typeof vitAnt !== 'number' || typeof derAnt !== 'number') {
          return {
            status: 'descartado', motivo: 'snapshot vit/der invalido',
            vitAnt: vitAnt, derAnt: derAnt, fonteCompare: fonte
          };
        }
        if (typeof vitAt !== 'number' || typeof derAt !== 'number') {
          return {
            status: 'descartado', motivo: 'vit/der invalido na pagina',
            vitAt: vitAt, derAt: derAt, fonteCompare: fonte
          };
        }

        var delta = ryousAt - ryousPrev;
        var deltaVit = vitAt - vitAnt;
        var vitDerIguais = vitAnt === vitAt && derAnt === derAt;
        var baseEv = {
          deltaRyous: delta,
          ryousAntes: ryousPrev,
          ryousAntesTexto: obterRyousTextoCompare(prev, fonte),
          fonteCompare: fonte,
          vitAnt: vitAnt, vitAt: vitAt, derAnt: derAnt, derAt: derAt
        };

        if (vitDerIguais && delta >= params.minDeltaRyous) {
          return Object.assign({
            status: 'suspeito', motivo: 'delta ok', tipoSuspeito: 'ryous_sem_vitder'
          }, baseEv);
        }

        var minDeltaVit = params.minDeltaVitorias != null ? params.minDeltaVitorias : DEFAULTS_WATCH.minDeltaVitorias;
        if (params.compareDeltaVitorias !== false && deltaVit >= minDeltaVit && delta <= 0) {
          return Object.assign({
            status: 'suspeito',
            motivo: 'vit subiu sem ryous faturados',
            tipoSuspeito: 'vit_sem_ryous',
            deltaVitorias: deltaVit
          }, baseEv);
        }

        if (!vitDerIguais) {
          return Object.assign({
            status: 'descartado', motivo: 'vit/der mudou'
          }, baseEv);
        }

        if (delta > 0) {
          return Object.assign({
            status: 'descartado', motivo: 'delta abaixo do min',
            minDeltaRyous: params.minDeltaRyous
          }, baseEv);
        }
        if (delta < 0) {
          return Object.assign({ status: 'descartado', motivo: 'ryous caiu' }, baseEv);
        }
        return Object.assign({ status: 'descartado', motivo: 'ryous igual', deltaRyous: 0 }, baseEv);
      }

      function montarRegistroSuspeitoWatch(j, prev, ev, extra) {
        var fonte = ev.fonteCompare || escolherFonteCompare(prev, j);
        var vd = obterVitDerCompare(j, fonte);
        var reg = {
          pos: j.pos,
          nome: j.nome,
          nivel: j.nivel,
          vitorias: vd.vit != null ? vd.vit : j.vitorias,
          derrotas: vd.der != null ? vd.der : j.derrotas,
          ryous: obterRyousCompare(j, fonte),
          ryousTexto: obterRyousTextoCompare(j, fonte),
          deltaRyous: ev.deltaRyous,
          ryousAntes: ev.ryousAntes,
          ryousAntesTexto: ev.ryousAntesTexto,
          fonteCompare: fonte,
          tipoSuspeito: ev.tipoSuspeito || 'ryous_sem_vitder',
          motivoSuspeito: ev.motivo,
          tipo: 'ciclo'
        };
        if (ev.deltaVitorias != null) reg.deltaVitorias = ev.deltaVitorias;
        if (typeof ev.vitAnt === 'number') reg.vitoriasAntes = ev.vitAnt;
        if (extra && typeof extra === 'object') {
          for (var ek in extra) {
            if (Object.prototype.hasOwnProperty.call(extra, ek)) reg[ek] = extra[ek];
          }
        }
        return reg;
      }

      function detectarRyousSuspeitos(jogadores, snapshotMap, params) {
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = migrarJogadorLegado(jogadores[i]);
          var prev = j && j.nome ? snapshotMap[j.nome.toLowerCase()] : null;
          var ev = avaliarJogadorWatch(j, prev, params);
          if (ev.status !== 'suspeito') continue;
          out.push(montarRegistroSuspeitoWatch(j, prev, ev));
        }
        return out;
      }

      function rankingDebugAtivo() {
        try { return sessionStorage.getItem(DEBUG_KEY) === '1'; } catch (e) {}
        return false;
      }

      function marcarRankingDebug(ativo) {
        try {
          if (ativo) sessionStorage.setItem(DEBUG_KEY, '1');
          else sessionStorage.removeItem(DEBUG_KEY);
        } catch (e) {}
        if (typeof atualizarPainelRanking === 'function') atualizarPainelRanking();
      }

      function botRankingDebugPagina(ligar) {
        if (arguments.length === 0) {
          return rankingDebugAtivo() ? 'debug ON' : 'debug OFF';
        }
        var desligar = ligar === false || ligar === 0 || ligar === '0' ||
          ligar === 'off' || ligar === 'false';
        if (desligar) {
          marcarRankingDebug(false);
          console.log('[Bot Ranking Debug] Desligado.');
          return 'debug OFF';
        }
        if (!watchAtivo() && !scanAtivo()) {
          console.warn('[Bot Ranking Debug] Ligue botRankingWatchRyous() ou botRankingScan() primeiro.');
          return 'debug OFF (watch/scan inativo)';
        }
        marcarRankingDebug(true);
        console.log('%c[Bot Ranking Debug] Ligado — log player a player + pausa 2min entre paginas.',
          'color:#1abc9c;font-weight:bold');
        return 'debug ON';
      }

      function delayProximaPaginaRanking() {
        return rankingDebugAtivo() ? DEBUG_PROXIMA_PAGINA_MS : DELAY_PROXIMA_PAGINA_MS;
      }

      function irParaProximaPaginaRanking(url) {
        var delay = delayProximaPaginaRanking();
        if (rankingDebugAtivo()) {
          console.log('[Bot Ranking Debug] Aguardando ' + Math.round(delay / 1000) +
            's antes da proxima pagina...');
        }
        salvarRetornoPosLoginSeAtivo();
        setTimeout(function() {
          location.href = url;
        }, delay);
      }

      function textoEvDebugWatch(ev, prev, j) {
        j = migrarJogadorLegado(j);
        prev = migrarJogadorLegado(prev);
        var fonte = ev.fonteCompare || escolherFonteCompare(prev, j);
        var deltaStr = ev.deltaRyous != null ? formatarNumeroBr(ev.deltaRyous) : '-';
        var antes = prev ? obterRyousTextoCompare(prev, fonte) : '(sem snapshot)';
        var agora = obterRyousTextoCompare(j, fonte);
        if (ev.status === 'suspeito') {
          if (ev.tipoSuspeito === 'vit_sem_ryous') {
            return '★ SUSPEITO vit+' + (ev.deltaVitorias || '?') + ' sem ryous [' + fonte + '] | ' +
              antes + ' -> ' + agora + ' (delta ryous ' + deltaStr + ')';
          }
          return '★ SUSPEITO [' + fonte + '] | delta +' + deltaStr + ' | ' + antes + ' -> ' + agora;
        }
        return '— ' + ev.motivo + ' [' + fonte + '] | delta ' + deltaStr + ' | ' + antes + ' -> ' + agora;
      }

      function logComparacoesDebugWatch(jogadores, snapMap, params, offset, modo) {
        if (!rankingDebugAtivo()) return;
        console.log('%c[Debug Watch] ranking=' + offset + ' | modo=' + modo + ' | ' +
          jogadores.length + ' jogadores', 'color:#1abc9c;font-weight:bold');
        for (var i = 0; i < jogadores.length; i++) {
          var j = migrarJogadorLegado(jogadores[i]);
          if (!j || !j.nome) continue;
          if (modo === 'baseline') {
            var txtR = temRyousRanking(j)
              ? (j.ryousRankingTexto || formatarNumeroBr(j.ryousRanking)) : '?';
            var txtP = temRyousPerfil(j)
              ? (j.ryousPerfilTexto || formatarNumeroBr(j.ryousPerfil)) : '—';
            console.log(
              '[Debug] baseline | ' + (j.pos || '?') + ' ' + j.nome +
              ' | lvl ' + j.nivel + ' | ranking ' + txtR + ' | perfil ' + txtP
            );
            continue;
          }
          var prev = snapMap[j.nome.toLowerCase()];
          var ev = avaliarJogadorWatch(j, prev, params);
          var fonte = ev.fonteCompare || escolherFonteCompare(prev, j);
          var vdPrev = obterVitDerCompare(prev, fonte);
          var vdAt = obterVitDerCompare(j, fonte);
          var vitInfo = (typeof vdPrev.vit === 'number' && typeof vdAt.vit === 'number')
            ? 'vit ' + vdPrev.vit + '->' + vdAt.vit + ' der ' + vdPrev.der + '->' + vdAt.der
            : 'vit ' + j.vitorias + ' der ' + j.derrotas;
          console.log(
            '[Debug] compare | ' + (j.pos || '?') + ' ' + j.nome + ' | lvl ' + j.nivel +
            ' | ' + vitInfo + ' | ' + textoEvDebugWatch(ev, prev, j)
          );
        }
      }

      function motivoScanMultDescarte(j, params) {
        j = migrarJogadorLegado(j);
        var maxNivel = maxNivelRanking(params);
        if (j && j.erroPerfil && rankingPerfilAtivo()) return 'perfil: ' + j.erroPerfil;
        var ry = ryousParaScanMult(j);
        if (!j || ry === null || ry <= 0) {
          return rankingPerfilAtivo() ? 'ryous perfil/ranking invalido' : 'ryous invalido';
        }
        if (j.nivel === null || j.nivel <= params.minNivel) return 'lvl <= ' + params.minNivel;
        if (j.nivel > maxNivel) return 'lvl > ' + maxNivel;
        if (ry >= params.maxRyous) return 'ryous >= max (' + formatarNumeroBr(params.maxRyous) + ')';
        return 'nao mult';
      }

      function logJogadoresDebugScan(jogadores, params, offset, mult) {
        if (!rankingDebugAtivo()) return;
        var multMap = {};
        for (var m = 0; m < mult.length; m++) {
          multMap[mult[m].nome.toLowerCase()] = true;
        }
        console.log('%c[Debug Scan] ranking=' + offset + ' | ' + jogadores.length + ' jogadores',
          'color:#9b59b6;font-weight:bold');
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || !j.nome) continue;
          var passa = !!multMap[j.nome.toLowerCase()];
          console.log(
            '[Debug] scan | ' + (j.pos || '?') + ' ' + j.nome + ' | lvl ' + j.nivel +
            ' | vit ' + j.vitorias + ' | der ' + j.derrotas +
            ' | ryous ' + (j.ryousTexto || '?') + ' (' + formatarNumeroBr(j.ryous) + ') | ' +
            (passa ? 'MULT ok' : motivoScanMultDescarte(j, params)) +
            (j.dadosPerfil ? ' | fonte: perfil' : '')
          );
        }
      }

      function paginaRankingAbaixoMinNivel(jogadores, minNivel, scanMode, maxNivel) {
        var comNivel = 0;
        var algumNoMinimo = false;
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || j.nivel === null || isNaN(j.nivel)) continue;
          comNivel++;
          if (passaFiltroLvlRanking(j, minNivel, scanMode, maxNivel)) algumNoMinimo = true;
        }
        if (!comNivel) return false;
        return !algumNoMinimo;
      }

      function resumirDescartesWatch(jogadores, snapMap, params) {
        var contagem = {};
        for (var i = 0; i < jogadores.length; i++) {
          var prev = snapMap[jogadores[i].nome.toLowerCase()];
          var ev = avaliarJogadorWatch(jogadores[i], prev, params);
          contagem[ev.motivo] = (contagem[ev.motivo] || 0) + 1;
        }
        return contagem;
      }

      function motivoMaisComumContagem(contagem) {
        var topMotivo = '';
        var topQtd = 0;
        for (var k in contagem) {
          if (!Object.prototype.hasOwnProperty.call(contagem, k)) continue;
          if (contagem[k] > topQtd) {
            topQtd = contagem[k];
            topMotivo = k;
          }
        }
        return { motivo: topMotivo, qtd: topQtd };
      }

      function limiarDivergenciaRankingPerfil(params) {
        if (params && params.minDeltaDivergencia != null) return params.minDeltaDivergencia;
        return DEFAULTS_WATCH.minDeltaDivergencia;
      }

      function detectarDivergenciasRankingPerfil(jogadores, params) {
        var minDiv = limiarDivergenciaRankingPerfil(params);
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = migrarJogadorLegado(jogadores[i]);
          if (!temRyousRanking(j) || !temRyousPerfil(j)) continue;
          var diff = Math.abs(j.ryousPerfil - j.ryousRanking);
          if (diff >= minDiv) {
            out.push({
              jogador: j,
              diff: diff,
              ranking: j.ryousRanking,
              perfil: j.ryousPerfil,
              rankingTexto: j.ryousRankingTexto || formatarNumeroBr(j.ryousRanking),
              perfilTexto: j.ryousPerfilTexto || formatarNumeroBr(j.ryousPerfil)
            });
          }
        }
        out.sort(function(a, b) { return b.diff - a.diff; });
        return out;
      }

      function logarDivergenciasRankingPerfil(jogadores, params, offset) {
        var divs = detectarDivergenciasRankingPerfil(jogadores, params);
        if (!divs.length) return divs;
        var minDiv = limiarDivergenciaRankingPerfil(params);
        console.log('%c[Bot Ranking] ranking=' + offset + ' — ' + divs.length +
          ' divergencia(s) ranking vs perfil (diff>=' + formatarNumeroBr(minDiv) + ')',
          'color:#e74c3c;font-weight:bold');
        for (var i = 0; i < Math.min(8, divs.length); i++) {
          var d = divs[i];
          console.warn('[Divergencia] ' + d.jogador.nome + ' | ranking ' + d.rankingTexto +
            ' vs perfil ' + d.perfilTexto + ' | diff ' + formatarNumeroBr(d.diff));
        }
        if (divs.length > 8) {
          console.warn('[Divergencia] ... +' + (divs.length - 8) + ' omitido(s) no log.');
        }
        return divs;
      }

      function cooldownDiscordMs(params) {
        var min = (params && params.discordCooldownMin != null)
          ? params.discordCooldownMin : DEFAULTS_WATCH.discordCooldownMin;
        return Math.max(5, min) * 60000;
      }

      function lerAlertasDiscordRecentes() {
        try {
          var raw = localStorage.getItem(DISCORD_ALERTAS_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {};
      }

      function salvarAlertasDiscordRecentes(map) {
        try { localStorage.setItem(DISCORD_ALERTAS_KEY, JSON.stringify(map)); } catch (e) {}
      }

      function limparAlertasDiscordExpirados(map) {
        var limite = Date.now() - 86400000;
        var out = {};
        for (var k in map) {
          if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
          if (map[k] && map[k].ts >= limite) out[k] = map[k];
        }
        return out;
      }

      function filtrarSuspeitosDiscordAntiSpam(suspeitos, params) {
        if (!suspeitos.length) return { enviar: [], suprimidos: 0 };
        var cooldown = cooldownDiscordMs(params);
        var recentes = limparAlertasDiscordExpirados(lerAlertasDiscordRecentes());
        var agora = Date.now();
        var enviar = [];
        var suprimidos = 0;
        for (var i = 0; i < suspeitos.length; i++) {
          var s = suspeitos[i];
          if (!s || !s.nome) continue;
          var k = s.nome.toLowerCase();
          var prev = recentes[k];
          if (prev && (agora - prev.ts) < cooldown) {
            var deltaAt = s.deltaRyous || 0;
            var deltaPrev = prev.delta || 0;
            var limiarSimilar = Math.max((params.minDeltaRyous || 0) * 0.25, 25000);
            if (deltaAt <= deltaPrev + limiarSimilar) {
              suprimidos++;
              continue;
            }
          }
          enviar.push(s);
        }
        if (suprimidos) {
          console.log('[Bot Ranking Watch] Discord anti-spam: ' + suprimidos +
            ' alerta(s) suprimido(s) (cooldown ' + Math.round(cooldown / 60000) + ' min).');
        }
        return { enviar: enviar, suprimidos: suprimidos };
      }

      function registrarAlertasDiscordEnviados(suspeitos) {
        if (!suspeitos.length) return;
        var map = limparAlertasDiscordExpirados(lerAlertasDiscordRecentes());
        var ts = Date.now();
        for (var i = 0; i < suspeitos.length; i++) {
          var s = suspeitos[i];
          if (!s || !s.nome) continue;
          map[s.nome.toLowerCase()] = { ts: ts, delta: s.deltaRyous || 0, tipo: s.tipo || 'ciclo' };
        }
        salvarAlertasDiscordRecentes(map);
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
            '⚠️ **Ranking Watch — alerta ryous/vit** (pos ' + offset + '–' + fim + ')',
            'Regras: +>=' + formatarNumeroBr(params.minDeltaRyous) + ' ryous sem vit/der | vit+>=' +
              (params.minDeltaVitorias != null ? params.minDeltaVitorias : DEFAULTS_WATCH.minDeltaVitorias) +
              ' sem ryous faturados',
            'Filtro: lvl>=' + params.minNivel + ' | lvl<=' + params.maxNivel +
              ' | max ' + formatarNumeroBr(params.maxRyous)
          ];
          for (var i = 0; i < suspeitos.length; i++) {
            var s = suspeitos[i];
            var tipoTxt = ' [ciclo|' + (s.fonteCompare || 'ranking') + ']';
            var deltaTxt;
            if (s.tipoSuspeito === 'vit_sem_ryous') {
              deltaTxt = '**vit +' + (s.deltaVitorias || '?') + ' sem ryous**';
            } else {
              deltaTxt = '**+' + formatarNumeroBr(s.deltaRyous) + '**';
            }
            linhas.push(
              '• **' + s.nome + '**' + tipoTxt + ' | lvl ' + s.nivel +
              ' | ' + deltaTxt + ' (' +
              s.ryousAntesTexto + ' → ' + s.ryousTexto + ')' +
              ' | vit ' + s.vitorias + ' | der ' + s.derrotas
            );
          }
          var payload = {
            username: 'Bot Shadow of Shinobi',
            content: linhas.join('\n')
          };
          if (DISCORD_WATCH_RYOUS_SILENCIOSO) {
            payload.flags = 4096;
          }
          fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(function(r) {
            if (r.ok) {
              console.log('[Bot Ranking Watch] Discord enviado' +
                (DISCORD_WATCH_RYOUS_SILENCIOSO ? ' (silencioso)' : '') +
                ' — ' + suspeitos.length + ' jogador(es) ranking=' + offset);
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
          ' | snapshot=' + qtdSnap + ' jogadores | lvl>=' + params.minNivel +
          ' | lvl<=' + params.maxNivel +
          ' | delta>=' + formatarNumeroBr(params.minDeltaRyous) +
          ' | minDeltaVit>=' + (params.minDeltaVitorias != null ? params.minDeltaVitorias : DEFAULTS_WATCH.minDeltaVitorias) +
          ' | maxRyous=' + formatarNumeroBr(params.maxRyous) +
          (rankingDebugAtivo() ? ' | DEBUG ON (2min/pagina)' : '') +
          (rankingPerfilAtivo() ? ' | PERFIL ON' : ''));
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

        logarDivergenciasRankingPerfil(jogadores, params, offset);

        if (estado.modo === 'compare') {
          var snap = lerSnapshotRyous();
          var snapMap = (snap && snap.jogadores) ? snap.jogadores : {};
          logComparacoesDebugWatch(jogadores, snapMap, params, offset, 'compare');
          var suspeitos = detectarRyousSuspeitos(jogadores, snapMap, params);
          if (suspeitos.length) {
            var filtroDiscord = filtrarSuspeitosDiscordAntiSpam(suspeitos, params);
            if (filtroDiscord.enviar.length) {
              enviarDiscordRyousSuspeitos(offset, filtroDiscord.enviar, params, function(ok) {
                if (ok) registrarAlertasDiscordEnviados(filtroDiscord.enviar);
              });
            }
            salvarSuspeitosFirebaseFila(suspeitos);
          } else if (jogadores.length && Object.keys(snapMap).length) {
            var resumo = resumirDescartesWatch(jogadores, snapMap, params);
            var top = motivoMaisComumContagem(resumo);
            if (top.motivo) {
              console.log('[Bot Ranking Watch] ranking=' + offset + ': 0 suspeitos — motivo mais comum: ' +
                top.motivo + ' (' + top.qtd + '/' + jogadores.length + ')');
            }
          }
          console.log('[Bot Ranking Watch] ranking=' + offset + ': ' + jogadores.length +
            ' jogadores, ' + suspeitos.length + ' suspeito(s).');
        } else {
          logComparacoesDebugWatch(jogadores, {}, params, offset, 'baseline');
          console.log('[Bot Ranking Watch] ranking=' + offset + ': ' + jogadores.length +
            ' jogadores (baseline).');
        }

        if (paginaRankingAbaixoMinNivel(jogadores, params.minNivel, false, params.maxNivel)) {
          console.log('%c[Bot Ranking Watch] ranking=' + offset +
            ' — todos abaixo do lvl min (' + params.minNivel + '). Encerrando ciclo cedo.',
            'color:#e67e22;font-weight:bold');
          finalizarWatchScanVazio(params, estado);
          return;
        }

        var proximo = offset + PASSO_RANKING;
        irParaProximaPaginaRanking(montarUrlRankingWatch(proximo, params));
      }

      function processarPaginaWatch() {
        var params = lerParamsWatch();
        prepararJogadoresPagina(processarPaginaWatchComJogadores, params.minNivel, false, params.maxNivel);
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
          ' | minDelta=' + formatarNumeroBr(params.minDeltaRyous) +
          ' | minNivel=' + params.minNivel +
          ' | maxNivel=' + params.maxNivel +
          ' | compareDeltaVitorias=' + (params.compareDeltaVitorias !== false ? 'sim' : 'nao') +
          ' | minDeltaVitorias=' + (params.minDeltaVitorias != null ? params.minDeltaVitorias : DEFAULTS_WATCH.minDeltaVitorias));
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
          debug: rankingDebugAtivo(),
          perfil: rankingPerfilAtivo(),
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
        console.log('[Bot Ranking] Filtro atual: lvl > ' + p.minNivel + ' | lvl <= ' + p.maxNivel +
          ' | ryous < ' + p.maxRyous.toLocaleString('pt-BR'));
        console.log('[Bot Ranking] Parametros URL (opcional):');
        console.log('  bot_ranking_max_ryous=' + p.maxRyous + '   (padrao: 1M — pega 999,9k ou menos)');
        console.log('  bot_ranking_min_nivel=' + p.minNivel + '        (padrao: 55 — lvl tem que ser MAIOR que este valor)');
        console.log('  bot_ranking_max_nivel=' + p.maxNivel + '       (padrao: 999999 — lvl tem que ser MENOR OU IGUAL)');
        console.log('  bot_ranking_vila=' + (p.vila || 'geral') + '          (padrao: geral)');
        console.log('[Bot Ranking] Comandos console:');
        console.log('  botRankingScan()                — scan mult (lvl alto, ryous baixo)');
        console.log('  botRankingScan({maxRyous:999000,minNivel:56,maxNivel:120})');
        console.log('  botRankingParar()               — cancela scan mult');
        console.log('  botRankingStatus()              — status scan mult');
        console.log('  botRankingWatchRyous()          — watch ryous (+100k sem vit/der, a cada 10min)');
        console.log('  botRankingWatchRyous({maxRyous:100000000,minDeltaRyous:100000,minNivel:74,maxNivel:999999,intervaloMin:10})');
        console.log('  botRankingWatchRyous({minDeltaDivergencia:50000,discordCooldownMin:30})');
        console.log('  botRankingWatchRyous({compareDeltaVitorias:false}) — desliga regra vit+ sem ryous');
        console.log('  botRankingWatchRyous({minDeltaVitorias:2}) — min vit+ para suspeito (padrao: 2)');
        console.log('  botRankingWatchParar()          — cancela watch ryous');
        console.log('  botRankingWatchStatus()         — status watch ryous');
        console.log('  botRankingDebugPagina(true)        — debug ON (log player a player + 2min/pagina)');
        console.log('  botRankingDebugPagina(false)       — debug OFF');
        console.log('  botRankingPerfilRyous(true)        — ryous/vit/der do perfil (lvl no ranking)');
        console.log('  botRankingPerfilRyous(false)       — perfil OFF (ryous do ranking)');
        console.log('[Bot Ranking Watch] Parametro URL: bot_ranking_watch_min_nivel=74 (padrao: 74)');
        console.log('[Bot Ranking Watch] Parametro URL: bot_ranking_watch_max_nivel=999999 (padrao: 999999)');
        console.log('[Bot Ranking Watch] Parametro URL: bot_ranking_compare_delta_vitorias=0|1 (padrao: 1)');
        console.log('[Bot Ranking Watch] Parametro URL: bot_ranking_min_delta_vitorias=2 (padrao: 2; ignora vit+1)');
        console.log('[Bot Ranking Watch] Suspeitos vao para Discord + Firebase ranking_ryous_fila (TTL 1h).');
        console.log('[Bot Ranking Watch] Caçadas: botCacadasFirebaseFila(1) no script de caçadas.');
        console.log('[Bot Ranking] Exemplo URL:');
        console.log('  /ranking?view=personagens&vila=geral&ranking=0&bot_ranking_max_ryous=1000000&bot_ranking_min_nivel=55');
      }

      function logPreScanPagina() {
        var params = lerParamsSalvos();
        var offset = offsetRankingAtual();
        var acum = lerResultadosAcumulados().length;
        console.log('%c[Bot Ranking] v' + SCRIPT_VERSAO + ' — scan em andamento', 'color:#9b59b6;font-weight:bold');
        console.log('[Bot Ranking] ranking=' + offset + ' | acumulado=' + acum + ' mult | lvl > ' + params.minNivel +
          ' | lvl <= ' + params.maxNivel + ' | ryous < ' + params.maxRyous.toLocaleString('pt-BR') +
          (rankingDebugAtivo() ? ' | DEBUG ON (2min/pagina)' : '') +
          (rankingPerfilAtivo() ? ' | PERFIL ON' : ''));
        console.log('[Bot Ranking] botRankingParar() — cancelar | botRankingStatus() — status');
      }

      function logResultadoFinal(resultados, params) {
        console.log('');
        console.log('%c[Ranking Mult] FIM — ' + resultados.length + ' jogador(es)', 'color:#e74c3c;font-weight:bold;font-size:13px');
        if (!resultados.length) {
          console.log('[Ranking Mult] Nenhum jogador com lvl > ' + params.minNivel + ' | lvl <= ' + params.maxNivel +
            ' e ryous < ' + params.maxRyous.toLocaleString('pt-BR'));
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
        if (rankingPerfilAtivo()) logarDivergenciasRankingPerfil(jogadores, params, offset);
        var mult = filtrarMult(jogadores, params);
        logJogadoresDebugScan(jogadores, params, offset, mult);
        var acumulado = mesclarSemDuplicar(lerResultadosAcumulados(), mult);
        salvarResultados(acumulado);

        console.log('[Bot Ranking] ranking=' + offset + ': ' + jogadores.length + ' jogadores, ' +
          mult.length + ' mult, ' + acumulado.length + ' acumulado.');

        if (paginaRankingAbaixoMinNivel(jogadores, params.minNivel, true, params.maxNivel)) {
          console.log('%c[Bot Ranking] ranking=' + offset +
            ' — todos com lvl <= min (' + params.minNivel + '). Encerrando scan cedo.',
            'color:#9b59b6;font-weight:bold');
          finalizarScan(params);
          return;
        }

        var proximo = offset + PASSO_RANKING;
        console.log('[Bot Ranking] Proxima faixa: ranking=' + proximo);
        irParaProximaPaginaRanking(montarUrlRanking(proximo, params));
      }

      function processarPaginaScan() {
        var params = lerParamsSalvos();
        prepararJogadoresPagina(processarPaginaScanComJogadores, params.minNivel, true, params.maxNivel);
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
          debug: rankingDebugAtivo(),
          perfil: rankingPerfilAtivo(),
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
            'Bot: <b>ranking</b> (' + (scanAtivo() ? 'mult ON' : 'mult off') + ' | ' + watchTxt +
              (rankingDebugAtivo() ? ' | debug ON' : '') +
              (rankingPerfilAtivo() ? ' | perfil ON' : '') + ')',
            'Principal: ' + login,
            'Console: botRankingScan() | botRankingWatchRyous() | botRankingPerfilRyous(true/false) | botRankingCompareDeltaVitorias(true/false)'
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
      window.botRankingDebugPagina = botRankingDebugPagina;
      window.botRankingPerfilRyous = botRankingPerfilRyous;
      window.botRankingCompareDeltaVitorias = botRankingCompareDeltaVitorias;
      window.__BOT_RANKING_OK__ = true;
      window.__BOT_RANKING_BUILD__ = { versao: SCRIPT_VERSAO };

      if (ehPaginaRanking()) {
        garantirWebhooksDiscord();
        atualizarPainelRanking();
        salvarRetornoPosLoginSeAtivo();
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
