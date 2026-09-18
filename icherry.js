// ==UserScript==
// @name         iCherry - Caçada / Hunter Mults
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Caçada por classe (atacar com filtro) ou Hunter (achar mults na lista, parar em /atacar). Sem Firebase.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==/UserScript==

// Inject Code — script separado (nao misturar com atkSOS na mesma aba).
//
// Ligar/desligar pela URL (so nesta aba; classe e demais configs valem em todas):
//   ?icherry=1                      liga o bot nesta aba
//   ?icherry=0                      desliga nesta aba
//   ?icherry=sim                    liga  |  ?icherry=nao  desliga
//   ?icherry=1&icherry_classe=6     classe 6 (padrao) — troque o numero
//   ?icherry=1&classe=6             atalho igual ao de cima
//
// Console (F12):
//   botIcherry()        ver se esta ligado
//   botIcherry(true)    ligar  |  botIcherry(false)  desligar
//   botIcherryClasse()  ver classe atual
//   botIcherryClasse(6) mudar classe do seletor por_nivel
//   botIcherryMaxVitorias()     ver teto de vitorias (padrao 1000)
//   botIcherryMaxVitorias(1000) mudar teto — so ataca se inimigo tiver menos
//
// Hunter (mults — nao ataca; para 35 min em /atacar se achar nome da lista):
//   ?icherry_hunter=1               liga hunter nesta aba (desliga caçada nesta aba)
//   ?icherry_hunter=0               desliga hunter nesta aba
//   ?icherry_hunter_classe=7        classe Eremita no #por_nivel (padrao 7)
//   botIcherryHunter() / botIcherryHunter(true|false)
//   botIcherryHunterClasse(n)       classe do hunter (so nesta aba)
//   listaHunter('NOME1,NOME2,...')  substitui lista de mults (so nesta aba)
//
(function() {
  'use strict';

  if (window.__ICHERRY_OK__) return;
  window.__ICHERRY_OK__ = true;

  var VERSAO = '1.7';
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var TEMPO_INICIAL_MS = 2000;
  var REFRESH_PENAL_MS = 30000;
  var REFRESH_CAPTCHA_MS = 300000;
  var ALERTA_SEM_SELETOR_MS = 120000;
  var HUNTER_ESPERA_MULT_MS = 35 * 60 * 1000;

  var KEY_ATIVO = 'ICHERRY_ATIVO';
  var KEY_CLASSE = 'ICHERRY_CLASSE';
  var KEY_ALERTA_TS = 'ICHERRY_ALERTA_SEM_SELETOR_TS';
  var KEY_MAX_VITORIAS = 'ICHERRY_MAX_VITORIAS';
  var KEY_HUNTER_ATIVO = 'ICHERRY_HUNTER_ATIVO';
  var KEY_HUNTER_CLASSE = 'ICHERRY_HUNTER_CLASSE';
  var KEY_HUNTER_LISTA = 'ICHERRY_HUNTER_LISTA';

  var CLASSE_PADRAO = 6;
  var CLASSE_HUNTER_PADRAO = 7;
  var MAX_VITORIAS_PADRAO = 1000;

  var HUNTER_LISTA_PADRAO =
    'Todoroki,Kushina,Maito,Sasori,Thalli,Shinobi,Shadow,Katsuro,Katsu,Deidara,' +
    'Nezuko,Haggo,Titas,Nemo,Yuki,Taro,Zoe,Amora,Gamora,Alibaba,' +
    'MIRANHA,PAINKILLER,Lula13,Madeira,Papel,Pedra,Tesoura,MARUKO,Ferro,TOBINHO,' +
    'KILLER,BARDO,MARIO,CRUELL,CRUELA,Blackfire,Stark,Targaryen,Lannister,Baratheon';

  // Filtro = whitelist: nomes/clas que NAO atacar (pagina /atacar).
  var FILTRO_USUARIOS_PADRAO =
    'Ghost,Spectre,Wraith,Phantom,Revenant,Eclipse,Oblivion,Noctis,Void,Whisper,Groifh,' +
    'Todoroki,Kushina,Maito,Sasori,Thalli,Shinobi,Shadow,Katsuro,Katsu,Deidara,' +
    'Yoruhime,Nezuko,Haggo,Titas,Nemo,Yuki,Taro,Zoe,Amora,Gamora,Alibaba,Shizuo,' +
    'MIRANHA,PAINKILLER,Lula13,Madeira,Papel,Pedra,Tesoura,MARUKO,Ferro,TOBINHO,' +
    'Shiroe,KILLER,BARDO,MARIO,CRUELL,CRUELA,Blackfire,Stark,Targaryen,Lannister,Baratheon';

  var FILTRO_CLA_PADRAO = 'Tropa do NP';

  var reloadAgendado = false;
  var atacarJaProcessado = false;
  var hunterAtacarJaProcessado = false;
  var hunterEsperaTimer = null;

  function lerLocal(chave) {
    try { return localStorage.getItem(chave); } catch (e) {}
    return null;
  }

  function gravarLocal(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) {}
  }

  function lerSessao(chave) {
    try { return sessionStorage.getItem(chave); } catch (e) {}
    return null;
  }

  function gravarSessao(chave, valor) {
    try { sessionStorage.setItem(chave, valor); } catch (e) {}
  }

  function limparAtivoGlobalLegado() {
    try { localStorage.removeItem(KEY_ATIVO); } catch (e) {}
  }

  function parseSimNao(valor) {
    if (valor === null || valor === undefined) return null;
    var v = String(valor).trim().toLowerCase();
    if (!v) return null;
    if (v === '1' || v === 'true' || v === 'sim' || v === 's' || v === 'on' ||
        v === 'ligar' || v === 'liga' || v === 'ativar' || v === 'ativo') return true;
    if (v === '0' || v === 'false' || v === 'nao' || v === 'não' || v === 'n' ||
        v === 'off' || v === 'desligar' || v === 'desliga' || v === 'desativar') return false;
    return null;
  }

  function aplicarParamsUrl() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var ligar = parseSimNao(params.get('icherry'));
      if (ligar !== null) {
        if (ligar) gravarSessao(KEY_HUNTER_ATIVO, '0');
        gravarSessao(KEY_ATIVO, ligar ? '1' : '0');
      }

      var ligarHunter = parseSimNao(params.get('icherry_hunter'));
      if (ligarHunter !== null) {
        if (ligarHunter) gravarSessao(KEY_ATIVO, '0');
        gravarSessao(KEY_HUNTER_ATIVO, ligarHunter ? '1' : '0');
      }

      var classeHunterRaw = params.get('icherry_hunter_classe');
      if (classeHunterRaw !== null && classeHunterRaw !== '') {
        var ch = parseInt(String(classeHunterRaw).trim(), 10);
        if (!isNaN(ch) && ch >= 0) gravarSessao(KEY_HUNTER_CLASSE, String(ch));
      }

      var classeRaw = params.get('icherry_classe');
      if (classeRaw === null || classeRaw === '') classeRaw = params.get('classe');
      if (classeRaw !== null && classeRaw !== '') {
        var n = parseInt(String(classeRaw).trim(), 10);
        if (!isNaN(n) && n >= 0) gravarLocal(KEY_CLASSE, String(n));
      }

      var maxVitRaw = params.get('icherry_max_vitorias');
      if (maxVitRaw !== null && maxVitRaw !== '') {
        var mv = parseInt(String(maxVitRaw).trim(), 10);
        if (!isNaN(mv) && mv >= 0) gravarLocal(KEY_MAX_VITORIAS, String(mv));
      }
    } catch (e) {}
  }

  function icherryAtivo() {
    return lerSessao(KEY_ATIVO) === '1';
  }

  function icherryHunterAtivo() {
    return lerSessao(KEY_HUNTER_ATIVO) === '1';
  }

  function algumModoIcherryAtivo() {
    return icherryAtivo() || icherryHunterAtivo();
  }

  function obterClasseIcherry() {
    var raw = lerLocal(KEY_CLASSE);
    if (raw === null || raw === '') return CLASSE_PADRAO;
    var n = parseInt(raw, 10);
    return isNaN(n) ? CLASSE_PADRAO : n;
  }

  function definirIcherryAtivo(ligar) {
    if (ligar) gravarSessao(KEY_HUNTER_ATIVO, '0');
    gravarSessao(KEY_ATIVO, ligar ? '1' : '0');
    return ligar;
  }

  function definirIcherryHunterAtivo(ligar) {
    if (ligar) gravarSessao(KEY_ATIVO, '0');
    gravarSessao(KEY_HUNTER_ATIVO, ligar ? '1' : '0');
    return ligar;
  }

  function obterClasseHunter() {
    var raw = lerSessao(KEY_HUNTER_CLASSE);
    if (raw === null || raw === '') return CLASSE_HUNTER_PADRAO;
    var n = parseInt(raw, 10);
    return isNaN(n) ? CLASSE_HUNTER_PADRAO : n;
  }

  function definirClasseHunter(valor) {
    if (valor === undefined || valor === null) return obterClasseHunter();
    var n = parseInt(valor, 10);
    if (isNaN(n) || n < 0) {
      console.warn('[iCherry Hunter] Classe invalida:', valor);
      return obterClasseHunter();
    }
    gravarSessao(KEY_HUNTER_CLASSE, String(n));
    return n;
  }

  function obterListaHunterRaw() {
    var raw = lerSessao(KEY_HUNTER_LISTA);
    if (raw === null || String(raw).trim() === '') return HUNTER_LISTA_PADRAO;
    return String(raw).trim();
  }

  function obterListaHunter() {
    return parseListaFiltro(obterListaHunterRaw());
  }

  function definirListaHunter(lista) {
    if (lista === undefined || lista === null) return obterListaHunterRaw();
    var s = String(lista).trim();
    if (!s) {
      console.warn('[iCherry Hunter] Lista vazia — mantendo lista atual.');
      return obterListaHunterRaw();
    }
    gravarSessao(KEY_HUNTER_LISTA, s);
    return s;
  }

  function nomeNaListaHunter(nome) {
    var norm = normalizarNomeFiltro(nome);
    if (!norm) return false;
    var lista = obterListaHunter();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  window.botIcherryHunter = function(ligar) {
    if (ligar === undefined) return icherryHunterAtivo();
    return definirIcherryHunterAtivo(!!ligar);
  };

  window.botIcherryHunterClasse = function(valor) {
    if (valor === undefined) return obterClasseHunter();
    return definirClasseHunter(valor);
  };

  window.listaHunter = function(lista) {
    if (lista === undefined) return obterListaHunterRaw();
    return definirListaHunter(lista);
  };

  function definirClasseIcherry(valor) {
    if (valor === undefined || valor === null) return obterClasseIcherry();
    var n = parseInt(valor, 10);
    if (isNaN(n) || n < 0) {
      console.warn('[iCherry] Classe invalida:', valor);
      return obterClasseIcherry();
    }
    gravarLocal(KEY_CLASSE, String(n));
    return n;
  }

  window.botIcherry = function(ligar) {
    if (ligar === undefined) return icherryAtivo();
    return definirIcherryAtivo(!!ligar);
  };

  window.botIcherryClasse = function(valor) {
    if (valor === undefined) return obterClasseIcherry();
    return definirClasseIcherry(valor);
  };

  function obterMaxVitoriasIcherry() {
    var raw = lerLocal(KEY_MAX_VITORIAS);
    if (raw === null || raw === '') return MAX_VITORIAS_PADRAO;
    var n = parseInt(raw, 10);
    return isNaN(n) || n < 0 ? MAX_VITORIAS_PADRAO : n;
  }

  function definirMaxVitoriasIcherry(valor) {
    if (valor === undefined || valor === null) return obterMaxVitoriasIcherry();
    var n = parseInt(valor, 10);
    if (isNaN(n) || n < 0) {
      console.warn('[iCherry] Max vitorias invalido:', valor);
      return obterMaxVitoriasIcherry();
    }
    gravarLocal(KEY_MAX_VITORIAS, String(n));
    return n;
  }

  window.botIcherryMaxVitorias = function(valor) {
    if (valor === undefined) return obterMaxVitoriasIcherry();
    return definirMaxVitoriasIcherry(valor);
  };

  function normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizarNomeFiltro(nome) {
    return normalizarTexto(String(nome || '').trim());
  }

  function parseListaFiltro(raw) {
    return String(raw || '')
      .split(',')
      .map(function(s) { return normalizarNomeFiltro(s); })
      .filter(Boolean);
  }

  function obterFiltroUsuarios() {
    return parseListaFiltro(FILTRO_USUARIOS_PADRAO);
  }

  function obterFiltroCla() {
    return parseListaFiltro(FILTRO_CLA_PADRAO);
  }

  function nomeBloqueadoPorFiltro(nome) {
    var norm = normalizarNomeFiltro(nome);
    if (!norm) return false;
    var lista = obterFiltroUsuarios();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function claBloqueadoPorFiltro(cla) {
    var norm = normalizarNomeFiltro(cla);
    if (!norm || norm === '?') return false;
    var lista = obterFiltroCla();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function parseNumeroInteiro(texto) {
    if (texto === null || texto === undefined) return null;
    var s = String(texto).replace(/\./g, '').replace(/[^\d-]/g, '');
    if (!s) return null;
    var n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  }

  function extrairValorLinhaTabela(rotuloParcial, escopo) {
    var root = escopo || document.getElementById('col_direita') || document;
    var linhas = root.querySelectorAll('table tr');
    var alvo = normalizarTexto(rotuloParcial);

    for (var i = 0; i < linhas.length; i++) {
      var tds = linhas[i].querySelectorAll('td');
      if (tds.length < 2) continue;

      var rotulo = normalizarTexto((tds[0].innerText || tds[0].textContent || '').trim());
      if (rotulo.indexOf(alvo) !== 0) continue;

      return (tds[1].innerText || tds[1].textContent || '').replace(/^\|\s*/, '').trim();
    }

    return null;
  }

  function extrairNomeInimigo() {
    var col = document.getElementById('col_direita');
    var texto = col ? (col.innerText || col.textContent || '') : '';

    var m = texto.match(/Resultados da busca\s*[-–—]\s*Inimigo\s+(.+)/i);
    if (m) return m[1].trim();

    var els = col
      ? col.querySelectorAll('td[style*="padding-top"]')
      : document.querySelectorAll('td[style*="padding-top"]');

    for (var i = 0; i < els.length; i++) {
      var txt = (els[i].innerText || els[i].textContent || '').trim();
      m = txt.match(/Inimigo\s+(.+)/i);
      if (m) return m[1].trim();
    }

    return null;
  }

  function extrairDadosAlvoAtacar() {
    var colDireita = document.getElementById('col_direita');
    var inimigo = extrairNomeInimigo();
    var cla = extrairValorLinhaTabela('clã', colDireita);
    if (!cla) cla = extrairValorLinhaTabela('cla', colDireita);
    var vitoriasTexto = extrairValorLinhaTabela('vitórias', colDireita);
    if (!vitoriasTexto) vitoriasTexto = extrairValorLinhaTabela('vitorias', colDireita);

    return {
      inimigo: inimigo || '(desconhecido)',
      cla: cla || '?',
      vitoriasTexto: vitoriasTexto || '?',
      vitorias: parseNumeroInteiro(vitoriasTexto)
    };
  }

  function validarAlvoAtacar() {
    var dados = extrairDadosAlvoAtacar();
    var motivos = [];
    var maxVitorias = obterMaxVitoriasIcherry();

    if (dados.inimigo === '(desconhecido)') {
      motivos.push('nome do inimigo nao encontrado');
    } else if (nomeBloqueadoPorFiltro(dados.inimigo)) {
      motivos.push('inimigo "' + dados.inimigo + '" esta no filtro de usuarios');
    }

    if (dados.cla && dados.cla !== '?' && claBloqueadoPorFiltro(dados.cla)) {
      motivos.push('cla "' + dados.cla + '" esta no filtro de clas');
    }

    if (dados.vitorias === null) {
      motivos.push('vitorias do inimigo nao encontradas na pagina');
    } else if (dados.vitorias >= maxVitorias) {
      motivos.push(
        'inimigo tem ' + dados.vitorias + ' vitorias (max ' + (maxVitorias - 1) + ')'
      );
    }

    return {
      ok: motivos.length === 0,
      motivos: motivos,
      dados: dados
    };
  }

  function parseSegundosTimer(texto) {
    if (texto === null || texto === undefined) return null;
    var t = String(texto).replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) return null;
    if (t.indexOf('concluida') !== -1 || t.indexOf('concluída') !== -1) return 0;

    var total = 0;
    var achou = false;
    var hm = t.match(/(\d+)\s*h\b/);
    var mm = t.match(/(\d+)\s*m\b/);
    var sm = t.match(/(\d+)\s*s\b/);

    if (hm) { total += parseInt(hm[1], 10) * 3600; achou = true; }
    if (mm) { total += parseInt(mm[1], 10) * 60; achou = true; }
    if (sm) { total += parseInt(sm[1], 10); achou = true; }

    if (!achou && /^\d+$/.test(t)) {
      total = parseInt(t, 10);
      achou = true;
    }

    return achou ? total : null;
  }

  function ehPaginaCaptcha() {
    var url = window.location.href || '';
    if (url.indexOf('captcha_seguranca') !== -1) return true;
    return !!document.querySelector('form[action="captcha_seguranca"]');
  }

  function ehPaginaCombate() {
    var url = window.location.href || '';
    if (url.indexOf('invasor-combate') !== -1) return false;
    return /\/combate(?:[\/?#]|$)/i.test(url);
  }

  function ehPaginaCacadas() {
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      return path.indexOf('/cacadas') === 0;
    } catch (e) {}
    return (window.location.href || '').indexOf('cacadas') !== -1;
  }

  function ehPaginaAtacar() {
    return (window.location.href || '').indexOf('atacar') !== -1;
  }

  function seletorClasseDisponivel() {
    var select = document.getElementById('por_nivel');
    if (!select) return null;
    var form = select.closest('form');
    if (!form) return null;
    var btn = form.querySelector('input[type="submit"], button[type="submit"]');
    if (!btn || btn.disabled) return null;
    return { select: select, form: form, btn: btn };
  }

  function emPenalidadeCacadas() {
    var ids = ['caca_cd_timer', 'missao_timer', 'mn_timer'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var seg = parseSegundosTimer(el.textContent || el.innerText || '');
      if (seg !== null && seg > 0) return true;
    }

    var col = document.getElementById('col_direita') || document.body;
    if (!col) return false;
    var avisos = col.querySelectorAll('.avisos_erro');
    for (var j = 0; j < avisos.length; j++) {
      var t = normalizarTexto(avisos[j].innerText || avisos[j].textContent || '');
      if (t.indexOf('penal') !== -1) return true;
      if (t.indexOf('disponivel em') !== -1) return true;
      if (t.indexOf('aguarde') !== -1 && t.indexOf('cacad') !== -1) return true;
    }
    return false;
  }

  function alertarSemSeletorClasse() {
    var agora = Date.now();
    var ultimo = 0;
    try { ultimo = parseInt(sessionStorage.getItem(KEY_ALERTA_TS) || '0', 10) || 0; } catch (e) {}
    if (agora - ultimo < ALERTA_SEM_SELETOR_MS) return;
    try { sessionStorage.setItem(KEY_ALERTA_TS, String(agora)); } catch (e) {}
    window.alert(
      'iCherry: seletor de classe (por_nivel) nao encontrado nesta pagina.\n' +
      'Nao e possivel realizar a caçada por classe.'
    );
  }

  function agendarReload(ms, motivo) {
    if (reloadAgendado) return;
    reloadAgendado = true;
    setTimeout(function() {
      window.location.reload();
    }, ms);
  }

  function irParaCacadas() {
    if ((window.location.href || '').indexOf('cacadas') !== -1) return;
    window.location.href = URL_CACADAS;
  }

  function processarCaptcha() {
    agendarReload(REFRESH_CAPTCHA_MS);
  }

  function executarCacadaPorClasse(classeValor) {
    var sel = seletorClasseDisponivel();
    if (!sel) {
      alertarSemSeletorClasse();
      return false;
    }

    var classe = classeValor !== undefined && classeValor !== null
      ? parseInt(classeValor, 10)
      : obterClasseIcherry();
    if (isNaN(classe)) classe = obterClasseIcherry();
    sel.select.value = String(classe);
    try { sel.select.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}

    var optExiste = false;
    for (var i = 0; i < sel.select.options.length; i++) {
      if (String(sel.select.options[i].value) === String(classe)) {
        optExiste = true;
        break;
      }
    }
    if (!optExiste) {
      window.alert('iCherry: classe ' + classe + ' nao existe no seletor por_nivel.');
      return false;
    }

    sel.btn.click();
    return true;
  }

  function processarCacadas() {
    if (emPenalidadeCacadas()) {
      agendarReload(REFRESH_PENAL_MS);
      return;
    }

    if (!seletorClasseDisponivel()) {
      alertarSemSeletorClasse();
      agendarReload(REFRESH_PENAL_MS);
      return;
    }

    executarCacadaPorClasse();
  }

  function processarCacadasHunter() {
    if (emPenalidadeCacadas()) {
      agendarReload(REFRESH_PENAL_MS);
      return;
    }

    if (!seletorClasseDisponivel()) {
      alertarSemSeletorClasse();
      agendarReload(REFRESH_PENAL_MS);
      return;
    }

    executarCacadaPorClasse(obterClasseHunter());
  }

  function cancelarEsperaHunterMemoria() {
    if (hunterEsperaTimer) {
      clearTimeout(hunterEsperaTimer);
      hunterEsperaTimer = null;
    }
  }

  function paginaAtacarVeioDeReload() {
    try {
      var entries = performance.getEntriesByType('navigation');
      if (entries && entries.length && entries[0].type === 'reload') return true;
    } catch (e) {}
    try {
      if (performance.navigation && performance.navigation.type === 1) return true;
    } catch (e2) {}
    return false;
  }

  function processarAtacarHunter() {
    if (hunterAtacarJaProcessado || hunterEsperaTimer) return;

    var dados = extrairDadosAlvoAtacar();
    var nome = dados.inimigo;

    if (nome === '(desconhecido)') {
      hunterAtacarJaProcessado = true;
      console.warn('[iCherry Hunter] Nome do inimigo nao encontrado — voltando a caçadas.');
      irParaCacadas();
      return;
    }

    if (!nomeNaListaHunter(nome)) {
      hunterAtacarJaProcessado = true;
      console.log(
        '[iCherry Hunter] Nao e mult da lista — ' + nome + ' | voltando a caçadas.'
      );
      irParaCacadas();
      return;
    }

    if (paginaAtacarVeioDeReload()) {
      hunterAtacarJaProcessado = true;
      console.log(
        '[iCherry Hunter] Reload em /atacar com mult ' + nome +
        ' — segue caçando (sem nova espera de 35 min).'
      );
      irParaCacadas();
      return;
    }

    hunterAtacarJaProcessado = true;
    var minutos = Math.round(HUNTER_ESPERA_MULT_MS / 60000);
    console.log(
      '[iCherry Hunter] Mult encontrada: ' + nome + ' — parado em /atacar por ' +
      minutos + ' min (sem atacar). Refresh cancela a espera e segue o fluxo normal.'
    );

    hunterEsperaTimer = setTimeout(function() {
      hunterEsperaTimer = null;
      hunterAtacarJaProcessado = false;
      console.log('[iCherry Hunter] Espera de ' + minutos + ' min terminada — voltando a caçadas.');
      irParaCacadas();
    }, HUNTER_ESPERA_MULT_MS);
  }

  function processarAtacar() {
    if (atacarJaProcessado) return;

    var btn = document.querySelector('form[action="atacar"] input[type="submit"]');
    if (!btn) {
      btn = document.querySelector('form[action*="atacar"] input[type="submit"]');
    }
    if (!btn) {
      irParaCacadas();
      return;
    }

    var resultado = validarAlvoAtacar();
    if (!resultado.ok) {
      atacarJaProcessado = true;
      console.warn(
        '[iCherry] Alvo ignorado — ' + resultado.motivos.join(' | ') +
        ' | inimigo: ' + resultado.dados.inimigo +
        ' | cla: ' + resultado.dados.cla +
        ' | vit: ' + resultado.dados.vitoriasTexto
      );
      irParaCacadas();
      return;
    }

    atacarJaProcessado = true;
    console.log(
      '[iCherry] Alvo aprovado — ' + resultado.dados.inimigo +
      ' | cla: ' + resultado.dados.cla +
      ' | vit: ' + resultado.dados.vitorias
    );
    btn.click();
  }

  function processarCombate() {
    setTimeout(function() {
      if (algumModoIcherryAtivo()) irParaCacadas();
    }, 1500);
  }

  function tick() {
    if (!algumModoIcherryAtivo()) return;

    var modoHunter = icherryHunterAtivo();

    if (ehPaginaCaptcha()) {
      cancelarEsperaHunterMemoria();
      processarCaptcha();
      return;
    }

    if (ehPaginaCacadas()) {
      cancelarEsperaHunterMemoria();
      hunterAtacarJaProcessado = false;
      if (modoHunter) processarCacadasHunter();
      else processarCacadas();
      return;
    }

    if (ehPaginaAtacar()) {
      if (modoHunter) processarAtacarHunter();
      else processarAtacar();
      return;
    }

    if (ehPaginaCombate()) {
      cancelarEsperaHunterMemoria();
      processarCombate();
      return;
    }

    cancelarEsperaHunterMemoria();
    irParaCacadas();
  }

  limparAtivoGlobalLegado();
  aplicarParamsUrl();
  setTimeout(tick, TEMPO_INICIAL_MS);
})();
