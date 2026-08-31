// ==UserScript==
// @name         Bot Ranking Mult - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      1.18
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

      var SCRIPT_VERSAO = '1.18';
      var SCAN_KEY = 'BOT_RANKING_SCAN_ATIVO';
      var DEBUG_KEY = 'BOT_RANKING_DEBUG_ATIVO';
      var PERFIL_KEY = 'BOT_RANKING_PERFIL_ATIVO';
      var HISTORICO_KEY = 'BOT_RANKING_RYOUS_HISTORICO';
      var HISTORICO_FLAG_KEY = 'BOT_RANKING_HISTORICO_ATIVO';
      var HISTORICO_JANELA_MS = 10800000;
      var HISTORICO_JANELA_MIN = 180;
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
      var AGUARDAR_TABELA_MS = 250;
      var AGUARDAR_TABELA_TENTATIVAS = 30;
      var FIREBASE_WEBHOOKS_PATH = 'config/discordWebhooks';
      var FIREBASE_DB_URL = 'https://shizuo-a07d9-default-rtdb.firebaseio.com';
      var RANKING_RYOUS_FILA_FB_PATH = 'ranking_ryous_fila';
      var RANKING_RYOUS_FILA_TTL_MS = 3600000;

      var DEFAULTS = { maxRyous: 1000000, minNivel: 55, vila: 'geral', view: 'personagens' };
      var DEFAULTS_WATCH = {
        maxRyous: 150000000,
        minDeltaRyous: 100000,
        minNivel: 74,
        intervaloMs: 600000,
        historicoMin: HISTORICO_JANELA_MIN,
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

        var urlJogador = '';
        try { urlJogador = new URL(link.href, window.location.origin).href; } catch (e) {
          urlJogador = link.href || '';
        }

        if (nivel === null) return null;
        if (!rankingPerfilAtivo() && ryous === null) return null;

        return {
          pos: pos, nome: nome, nivel: nivel,
          vitorias: vitorias != null ? vitorias : '?',
          derrotas: derrotas != null ? derrotas : '?',
          ryous: rankingPerfilAtivo() ? null : ryous,
          ryousTexto: rankingPerfilAtivo() ? null : ryousTexto,
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
        console.log('%c[Bot Ranking Perfil] Ligado — lvl no ranking; ryous/vit/der do perfil do jogador.',
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

      function buscarDadosPerfilJogador(url) {
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
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.text();
          }).then(function(html) {
            if (timer) clearTimeout(timer);
            resolve(parseHtmlPerfilJogador(html));
          }).catch(function(err) {
            if (timer) clearTimeout(timer);
            resolve({ erro: String(err && err.message ? err.message : err) });
          });
        });
      }

      function passaFiltroLvlRanking(j, minNivel, scanMode) {
        if (!j || j.nivel === null || isNaN(j.nivel)) return false;
        if (scanMode) return j.nivel > minNivel;
        return j.nivel >= minNivel;
      }

      function aplicarDadosPerfilJogador(jog, dados) {
        if (dados && !dados.erro) {
          jog.ryous = dados.ryous;
          jog.ryousTexto = dados.ryousTexto;
          if (typeof dados.vitorias === 'number') jog.vitorias = dados.vitorias;
          if (typeof dados.derrotas === 'number') jog.derrotas = dados.derrotas;
          jog.dadosPerfil = true;
          return true;
        }
        jog.erroPerfil = dados ? dados.erro : 'fetch falhou';
        return false;
      }

      function enriquecerJogadoresComPerfil(jogadores, minNivel, scanMode, callback) {
        var fila = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || !j.urlJogador) continue;
          if (!passaFiltroLvlRanking(j, minNivel, scanMode)) continue;
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

      function prepararJogadoresPagina(processarFn, minNivel, scanMode) {
        aguardarJogadores(function(jogadores) {
          if (!rankingPerfilAtivo()) {
            processarFn(jogadores);
            return;
          }
          enriquecerJogadoresComPerfil(jogadores, minNivel, !!scanMode, processarFn);
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
          minNivel: DEFAULTS_WATCH.minNivel,
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
            if (saved.minNivel != null) base.minNivel = saved.minNivel;
            if (saved.intervaloMs != null) base.intervaloMs = saved.intervaloMs;
            if (saved.historicoMin != null) base.historicoMin = saved.historicoMin;
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
        if (extra.minNivel != null) {
          var mn = parseInt(String(extra.minNivel).replace(/\./g, ''), 10);
          if (!isNaN(mn)) base.minNivel = mn;
        }
        if (extra.intervaloMs != null) {
          var iv = parseInt(String(extra.intervaloMs).replace(/\./g, ''), 10);
          if (!isNaN(iv) && iv >= 60000) base.intervaloMs = iv;
        }
        if (extra.intervaloMin != null) {
          var im = parseFloat(String(extra.intervaloMin).replace(',', '.'));
          if (!isNaN(im) && im >= 1) base.intervaloMs = Math.round(im * 60000);
        }
        if (extra.historicoMin != null) {
          var hm = parseInt(String(extra.historicoMin).replace(/\./g, ''), 10);
          if (!isNaN(hm) && hm >= 5) base.historicoMin = hm;
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

      function rankingHistoricoAtivo() {
        try {
          var v = localStorage.getItem(HISTORICO_FLAG_KEY);
          if (v === null || v === '') return true;
          return v === '1';
        } catch (e) {}
        return true;
      }

      function marcarRankingHistorico(ativo) {
        try {
          if (ativo) localStorage.setItem(HISTORICO_FLAG_KEY, '1');
          else localStorage.setItem(HISTORICO_FLAG_KEY, '0');
        } catch (e) {}
        if (typeof atualizarPainelRanking === 'function') atualizarPainelRanking();
      }

      function botRankingHistorico(ligar) {
        if (arguments.length === 0) {
          return rankingHistoricoAtivo() ? 'historico ON' : 'historico OFF';
        }
        var desligar = ligar === false || ligar === 0 || ligar === '0' ||
          ligar === 'off' || ligar === 'false';
        marcarRankingHistorico(!desligar);
        console.log('[Bot Ranking Historico] ' + (desligar ? 'Desligado.' : 'Ligado — janela 3h.'));
        return desligar ? 'historico OFF' : 'historico ON';
      }

      function lerHistoricoRyous() {
        try {
          var raw = localStorage.getItem(HISTORICO_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
      }

      function salvarHistoricoRyous(lista) {
        try { localStorage.setItem(HISTORICO_KEY, JSON.stringify(lista)); } catch (e) {}
      }

      function limparHistoricoExpirado(lista) {
        var limite = Date.now() - HISTORICO_JANELA_MS;
        var out = [];
        for (var i = 0; i < lista.length; i++) {
          if (lista[i] && lista[i].ts >= limite) out.push(lista[i]);
        }
        return out;
      }

      function jogadoresMapFiltradoMinNivel(map, minNivel) {
        var out = {};
        for (var k in map) {
          if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
          var j = map[k];
          if (!j || j.nivel === null || j.nivel < minNivel) continue;
          if (j.ryous === null || j.ryous === undefined) continue;
          out[k] = {
            nome: j.nome,
            nivel: j.nivel,
            vitorias: j.vitorias,
            derrotas: j.derrotas,
            ryous: j.ryous,
            ryousTexto: j.ryousTexto
          };
        }
        return out;
      }

      function appendHistoricoCiclo(parcialMap, params) {
        if (!rankingHistoricoAtivo()) return;
        var filtrado = jogadoresMapFiltradoMinNivel(parcialMap, params.minNivel);
        var qtd = Object.keys(filtrado).length;
        if (!qtd) return;
        var lista = limparHistoricoExpirado(lerHistoricoRyous());
        lista.push({ ts: Date.now(), jogadores: filtrado });
        lista.sort(function(a, b) { return a.ts - b.ts; });
        lista = limparHistoricoExpirado(lista);
        salvarHistoricoRyous(lista);
        console.log('[Bot Ranking Historico] +' + qtd + ' jogadores | janela 3h: ' +
          lista.length + ' ciclo(s) guardado(s).');
      }

      function encontrarSnapshotHistoricoReferencia(minutosAtras) {
        var lista = limparHistoricoExpirado(lerHistoricoRyous());
        if (!lista.length) return null;
        var alvo = Date.now() - minutosAtras * 60000;
        var escolhido = null;
        for (var i = 0; i < lista.length; i++) {
          if (lista[i].ts <= alvo) escolhido = lista[i];
          else break;
        }
        if (!escolhido) escolhido = lista[0];
        return escolhido;
      }

      function detectarRyousSuspeitosHistorico(jogadores, params) {
        if (!rankingHistoricoAtivo()) return [];
        var minHist = params.historicoMin != null ? params.historicoMin : HISTORICO_JANELA_MIN;
        var ref = encontrarSnapshotHistoricoReferencia(minHist);
        if (!ref || !ref.jogadores) return [];
        var snapMap = ref.jogadores;
        var minutosRef = Math.max(1, Math.round((Date.now() - ref.ts) / 60000));
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          var prev = j && j.nome ? snapMap[j.nome.toLowerCase()] : null;
          var ev = avaliarJogadorWatch(j, prev, params);
          if (ev.status !== 'suspeito') continue;
          out.push({
            pos: j.pos,
            nome: j.nome,
            nivel: j.nivel,
            vitorias: j.vitorias,
            derrotas: j.derrotas,
            ryous: j.ryous,
            ryousTexto: j.ryousTexto,
            deltaRyous: ev.deltaRyous,
            ryousAntes: ev.ryousAntes,
            ryousAntesTexto: ev.ryousAntesTexto,
            tipo: 'historico',
            historicoMinutos: minutosRef,
            historicoTs: ref.ts
          });
        }
        return out;
      }

      function mesclarSuspeitosWatch(ciclo, historico) {
        var map = {};
        var i, s, k;
        for (i = 0; i < ciclo.length; i++) {
          s = ciclo[i];
          k = s.nome.toLowerCase();
          s.tipo = 'ciclo';
          map[k] = s;
        }
        for (i = 0; i < historico.length; i++) {
          s = historico[i];
          k = s.nome.toLowerCase();
          if (map[k]) {
            map[k].tipo = 'ciclo+historico';
            map[k].deltaHistorico = s.deltaRyous;
            map[k].historicoMinutos = s.historicoMinutos;
            if ((s.deltaRyous || 0) > (map[k].deltaRyous || 0)) {
              map[k].deltaRyousHistorico = s.deltaRyous;
              map[k].ryousAntesHistorico = s.ryousAntesTexto;
            }
          } else {
            map[k] = s;
          }
        }
        var out = [];
        for (k in map) {
          if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
        }
        return out;
      }

      function botRankingHistoricoLimpar() {
        try { localStorage.removeItem(HISTORICO_KEY); } catch (e) {}
        console.log('[Bot Ranking Historico] Historico limpo.');
        return 'limpo';
      }

      function botRankingHistoricoJogador(nome) {
        if (!nome) {
          console.warn('[Bot Ranking Historico] Informe o nome: botRankingHistoricoJogador("Nome")');
          return [];
        }
        var k = String(nome).trim().toLowerCase();
        var lista = limparHistoricoExpirado(lerHistoricoRyous());
        var linhas = [];
        console.log('%c[Historico] ' + nome + ' — janela 3h (' + lista.length + ' ciclo(s))',
          'color:#9b59b6;font-weight:bold');
        for (var i = 0; i < lista.length; i++) {
          var snap = lista[i];
          var j = snap.jogadores[k];
          if (!j) continue;
          var dt = new Date(snap.ts).toLocaleString('pt-BR');
          var linha = dt + ' | ryous ' + (j.ryousTexto || formatarNumeroBr(j.ryous)) +
            ' | vit ' + j.vitorias + ' | der ' + j.derrotas + ' | lvl ' + j.nivel;
          console.log('  ' + linha);
          linhas.push({ ts: snap.ts, jogador: j, texto: linha });
        }
        if (!linhas.length) {
          console.log('[Historico] Nenhuma leitura para "' + nome + '" na janela de 3h.');
        }
        return linhas;
      }

      function botRankingHistoricoTop(opcoes) {
        var opts = opcoes || {};
        var min = opts.min != null ? parseInt(String(opts.min), 10) : HISTORICO_JANELA_MIN;
        if (isNaN(min) || min < 5) min = HISTORICO_JANELA_MIN;
        var limite = opts.limite != null ? parseInt(String(opts.limite), 10) : 15;
        if (isNaN(limite) || limite < 1) limite = 15;

        var ref = encontrarSnapshotHistoricoReferencia(min);
        var atualSnap = lerSnapshotRyous();
        if (!ref || !ref.jogadores || !atualSnap.jogadores) {
          console.log('[Historico Top] Sem snapshot de referencia ou atual vazio.');
          return [];
        }

        var minutosRef = Math.max(1, Math.round((Date.now() - ref.ts) / 60000));
        var deltas = [];
        for (var k in atualSnap.jogadores) {
          if (!Object.prototype.hasOwnProperty.call(atualSnap.jogadores, k)) continue;
          var cur = atualSnap.jogadores[k];
          var prev = ref.jogadores[k];
          if (!prev || cur.ryous === null || prev.ryous === null) continue;
          if (typeof cur.vitorias === 'number' && typeof prev.vitorias === 'number' &&
              typeof cur.derrotas === 'number' && typeof prev.derrotas === 'number') {
            if (cur.vitorias !== prev.vitorias || cur.derrotas !== prev.derrotas) continue;
          }
          var d = cur.ryous - prev.ryous;
          if (d > 0) {
            deltas.push({
              nome: cur.nome,
              delta: d,
              ryous: cur.ryous,
              ryousTexto: cur.ryousTexto || formatarNumeroBr(cur.ryous),
              antes: prev.ryous,
              antesTexto: prev.ryousTexto || formatarNumeroBr(prev.ryous)
            });
          }
        }
        deltas.sort(function(a, b) { return b.delta - a.delta; });
        console.log('%c[Historico Top] maiores deltas vs ~' + minutosRef + 'min atras',
          'color:#9b59b6;font-weight:bold');
        for (var i = 0; i < Math.min(limite, deltas.length); i++) {
          var x = deltas[i];
          console.log('  ' + (i + 1) + '. ' + x.nome + ' | +' + formatarNumeroBr(x.delta) +
            ' (' + x.antesTexto + ' -> ' + x.ryousTexto + ')');
        }
        if (!deltas.length) {
          console.log('[Historico Top] Nenhum delta positivo com vit/der estaveis.');
        }
        return deltas.slice(0, limite);
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
        if (p.minNivel != null) qs.set('bot_ranking_watch_min_nivel', String(p.minNivel));
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
          derrotas: suspeito.derrotas,
          tipo: suspeito.tipo || 'ciclo',
          historicoMinutos: suspeito.historicoMinutos || null,
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
              if ((existing.deltaRyous || 0) >= payload.deltaRyous) {
                return { ok: false, motivo: 'delta menor ou igual' };
              }
            }
            return fetch(urlFirebaseRankingFila('/' + chave), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).then(function(r) {
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
              console.log('[Bot Ranking Watch] Firebase fila: ' + salvos + '/' + suspeitos.length + ' salvo(s) (TTL 1h, ordem por deltaRyous).');
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
        if (j.ryous === null) {
          return { status: 'descartado', motivo: 'ryous nao parseado', ryousTexto: j.ryousTexto || '?' };
        }
        if (j.ryous > params.maxRyous) {
          return {
            status: 'descartado', motivo: 'ryous acima do max',
            ryous: j.ryous, maxRyous: params.maxRyous
          };
        }
        if (j.nivel === null || j.nivel < params.minNivel) {
          return {
            status: 'descartado', motivo: 'nivel abaixo do min',
            nivel: j.nivel, minNivel: params.minNivel
          };
        }
        if (!prev || prev.ryous === null) {
          return { status: 'descartado', motivo: 'sem snapshot anterior', nome: j.nome };
        }

        var vitAnt = prev.vitorias;
        var derAnt = prev.derrotas;
        var vitAt = j.vitorias;
        var derAt = j.derrotas;
        if (typeof vitAnt !== 'number' || typeof derAnt !== 'number') {
          return {
            status: 'descartado', motivo: 'snapshot vit/der invalido',
            vitAnt: vitAnt, derAnt: derAnt
          };
        }
        if (typeof vitAt !== 'number' || typeof derAt !== 'number') {
          return {
            status: 'descartado', motivo: 'vit/der invalido na pagina',
            vitAt: vitAt, derAt: derAt
          };
        }
        if (vitAnt !== vitAt || derAnt !== derAt) {
          return {
            status: 'descartado', motivo: 'vit/der mudou',
            vitAnt: vitAnt, vitAt: vitAt, derAnt: derAnt, derAt: derAt
          };
        }

        var delta = j.ryous - prev.ryous;
        if (delta >= params.minDeltaRyous) {
          return {
            status: 'suspeito', motivo: 'delta ok', deltaRyous: delta,
            ryousAntes: prev.ryous,
            ryousAntesTexto: prev.ryousTexto || formatarNumeroBr(prev.ryous)
          };
        }
        if (delta > 0) {
          return {
            status: 'descartado', motivo: 'delta abaixo do min',
            deltaRyous: delta, minDeltaRyous: params.minDeltaRyous
          };
        }
        if (delta < 0) {
          return { status: 'descartado', motivo: 'ryous caiu', deltaRyous: delta };
        }
        return { status: 'descartado', motivo: 'ryous igual', deltaRyous: 0 };
      }

      function detectarRyousSuspeitos(jogadores, snapshotMap, params) {
        var out = [];
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          var prev = j && j.nome ? snapshotMap[j.nome.toLowerCase()] : null;
          var ev = avaliarJogadorWatch(j, prev, params);
          if (ev.status !== 'suspeito') continue;
          out.push({
            pos: j.pos,
            nome: j.nome,
            nivel: j.nivel,
            vitorias: j.vitorias,
            derrotas: j.derrotas,
            ryous: j.ryous,
            ryousTexto: j.ryousTexto,
            deltaRyous: ev.deltaRyous,
            ryousAntes: ev.ryousAntes,
            ryousAntesTexto: ev.ryousAntesTexto
          });
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
        var deltaStr = ev.deltaRyous != null ? formatarNumeroBr(ev.deltaRyous) : '-';
        var antes = prev ? (prev.ryousTexto || formatarNumeroBr(prev.ryous)) : '(sem snapshot)';
        var agora = j.ryousTexto || formatarNumeroBr(j.ryous);
        if (ev.status === 'suspeito') {
          return '★ SUSPEITO | delta +' + deltaStr + ' | ' + antes + ' -> ' + agora;
        }
        return '— ' + ev.motivo + ' | delta ' + deltaStr + ' | ' + antes + ' -> ' + agora;
      }

      function logComparacoesDebugWatch(jogadores, snapMap, params, offset, modo) {
        if (!rankingDebugAtivo()) return;
        console.log('%c[Debug Watch] ranking=' + offset + ' | modo=' + modo + ' | ' +
          jogadores.length + ' jogadores', 'color:#1abc9c;font-weight:bold');
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || !j.nome) continue;
          if (modo === 'baseline') {
            console.log(
              '[Debug] baseline | ' + (j.pos || '?') + ' ' + j.nome +
              ' | lvl ' + j.nivel + ' | vit ' + j.vitorias + ' | der ' + j.derrotas +
              ' | ryous ' + (j.ryousTexto || '?') + ' (' + formatarNumeroBr(j.ryous) + ')' +
              (j.dadosPerfil ? ' | fonte: perfil' : (rankingPerfilAtivo() ? ' | perfil pendente/falhou' : ''))
            );
            continue;
          }
          var prev = snapMap[j.nome.toLowerCase()];
          var ev = avaliarJogadorWatch(j, prev, params);
          var vitInfo = prev && typeof prev.vitorias === 'number' && typeof prev.derrotas === 'number'
            ? 'vit ' + prev.vitorias + '->' + j.vitorias + ' der ' + prev.derrotas + '->' + j.derrotas
            : 'vit ' + j.vitorias + ' der ' + j.derrotas;
          console.log(
            '[Debug] compare | ' + (j.pos || '?') + ' ' + j.nome + ' | lvl ' + j.nivel +
            ' | ' + vitInfo + ' | ' + textoEvDebugWatch(ev, prev, j) +
            (j.dadosPerfil ? ' | fonte: perfil' : '')
          );
        }
      }

      function motivoScanMultDescarte(j, params) {
        if (j && j.erroPerfil) return 'perfil: ' + j.erroPerfil;
        if (!j || j.ryous === null || j.ryous <= 0) {
          return rankingPerfilAtivo() ? 'ryous perfil invalido' : 'ryous invalido';
        }
        if (j.nivel === null || j.nivel <= params.minNivel) return 'lvl <= ' + params.minNivel;
        if (j.ryous >= params.maxRyous) return 'ryous >= max (' + formatarNumeroBr(params.maxRyous) + ')';
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

      function paginaWatchAbaixoMinNivel(jogadores, minNivel) {
        var comNivel = 0;
        var algumNoMinimo = false;
        for (var i = 0; i < jogadores.length; i++) {
          var j = jogadores[i];
          if (!j || j.nivel === null || isNaN(j.nivel)) continue;
          comNivel++;
          if (j.nivel >= minNivel) algumNoMinimo = true;
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
            'Filtro: lvl>=' + params.minNivel +
              ' | +>=' + formatarNumeroBr(params.minDeltaRyous) + ' ryous | max ' +
              formatarNumeroBr(params.maxRyous)
          ];
          for (var i = 0; i < suspeitos.length; i++) {
            var s = suspeitos[i];
            var tipoTxt = s.tipo === 'historico'
              ? ' [hist ~' + (s.historicoMinutos || '?') + 'min]'
              : (s.tipo === 'ciclo+historico'
                ? ' [ciclo+hist ~' + (s.historicoMinutos || '?') + 'min]'
                : ' [ciclo]');
            var deltaTxt = '**+' + formatarNumeroBr(s.deltaRyous) + '**';
            if (s.tipo === 'historico' || (s.tipo === 'ciclo+historico' && s.deltaRyousHistorico)) {
              deltaTxt = '**+' + formatarNumeroBr(s.deltaRyous) + '**' +
                (s.deltaRyousHistorico && s.deltaRyousHistorico !== s.deltaRyous
                  ? ' (hist +' + formatarNumeroBr(s.deltaRyousHistorico) + ')'
                  : '');
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
          ' | delta>=' + formatarNumeroBr(params.minDeltaRyous) +
          ' | maxRyous=' + formatarNumeroBr(params.maxRyous) +
          (rankingDebugAtivo() ? ' | DEBUG ON (2min/pagina)' : '') +
          (rankingPerfilAtivo() ? ' | PERFIL ON' : '') +
          (rankingHistoricoAtivo() ? ' | HIST 3h ON' : ''));
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
          appendHistoricoCiclo(parcial, params);
          salvarParcialWatch({});
          try { sessionStorage.removeItem(WATCH_JA_LEU_KEY); } catch (e) {}
          console.log('[Bot Ranking Watch] Baseline salvo — ' + qtd + ' jogadores.');
          agendarProximoWatchCiclo(params);
          return;
        }

        salvarSnapshotRyous(snapshot);
        appendHistoricoCiclo(parcial, params);
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
          logComparacoesDebugWatch(jogadores, snapMap, params, offset, 'compare');
          var suspeitosCiclo = detectarRyousSuspeitos(jogadores, snapMap, params);
          var suspeitosHist = detectarRyousSuspeitosHistorico(jogadores, params);
          var suspeitos = mesclarSuspeitosWatch(suspeitosCiclo, suspeitosHist);
          if (suspeitos.length) {
            enviarDiscordRyousSuspeitos(offset, suspeitos, params);
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

        if (paginaWatchAbaixoMinNivel(jogadores, params.minNivel)) {
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
        prepararJogadoresPagina(processarPaginaWatchComJogadores, params.minNivel, false);
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
          (rankingHistoricoAtivo() ? ' | historico 3h ON' : ''));
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
          historico: rankingHistoricoAtivo(),
          historicoCiclos: limparHistoricoExpirado(lerHistoricoRyous()).length,
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
        console.log('  botRankingWatchRyous({maxRyous:150000000,minDeltaRyous:100000,minNivel:74,intervaloMin:10})');
        console.log('  botRankingWatchParar()          — cancela watch ryous');
        console.log('  botRankingWatchStatus()         — status watch ryous');
        console.log('  botRankingDebugPagina(true)        — debug ON (log player a player + 2min/pagina)');
        console.log('  botRankingDebugPagina(false)       — debug OFF');
        console.log('  botRankingPerfilRyous(true)        — ryous/vit/der do perfil (lvl no ranking)');
        console.log('  botRankingPerfilRyous(false)       — perfil OFF (ryous do ranking)');
        console.log('  botRankingHistorico()              — historico ON/OFF (padrao: ON, janela 3h)');
        console.log('  botRankingHistorico(false)         — desliga historico');
        console.log('  botRankingHistoricoJogador("Nome") — timeline do player (3h)');
        console.log('  botRankingHistoricoTop()           — maiores deltas vs ~3h atras');
        console.log('  botRankingHistoricoLimpar()        — zera historico');
        console.log('  botRankingWatchRyous({historicoMin:120}) — compara vs ~2h atras (dentro da janela 3h)');
        console.log('[Bot Ranking Watch] Parametro URL: bot_ranking_watch_min_nivel=74 (padrao: 74)');
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
        console.log('[Bot Ranking] ranking=' + offset + ' | acumulado=' + acum + ' mult | lvl > ' + params.minNivel + ' | ryous < ' + params.maxRyous.toLocaleString('pt-BR') +
          (rankingDebugAtivo() ? ' | DEBUG ON (2min/pagina)' : '') +
          (rankingPerfilAtivo() ? ' | PERFIL ON' : ''));
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
        logJogadoresDebugScan(jogadores, params, offset, mult);
        var acumulado = mesclarSemDuplicar(lerResultadosAcumulados(), mult);
        salvarResultados(acumulado);

        console.log('[Bot Ranking] ranking=' + offset + ': ' + jogadores.length + ' jogadores, ' +
          mult.length + ' mult, ' + acumulado.length + ' acumulado.');

        var proximo = offset + PASSO_RANKING;
        console.log('[Bot Ranking] Proxima faixa: ranking=' + proximo);
        irParaProximaPaginaRanking(montarUrlRanking(proximo, params));
      }

      function processarPaginaScan() {
        var params = lerParamsSalvos();
        prepararJogadoresPagina(processarPaginaScanComJogadores, params.minNivel, true);
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
              (rankingPerfilAtivo() ? ' | perfil ON' : '') +
              (rankingHistoricoAtivo() ? ' | hist 3h' : '') + ')',
            'Principal: ' + login,
            'Console: botRankingScan() | botRankingWatchRyous() | botRankingPerfilRyous(true/false)'
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
      window.botRankingHistorico = botRankingHistorico;
      window.botRankingHistoricoJogador = botRankingHistoricoJogador;
      window.botRankingHistoricoTop = botRankingHistoricoTop;
      window.botRankingHistoricoLimpar = botRankingHistoricoLimpar;
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
