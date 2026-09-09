// ==UserScript==
// @name         Bot Atacar - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      3.89
// @description  Automação Caçadas/Atacar + Missão Novo + Atacar Automações (prep/atacante Firebase), portão relatórios, blacklist, captcha OCR.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var BOT_MODO_KEY = 'BOT_MODO_ABA';
  var BOT_RANKING_RETORNO_URL_KEY = 'BOT_RANKING_RETORNO_URL';
  var BOT_CRED_URL_APLICADA_KEY = 'BOT_CRED_URL_APLICADA';

  // --- Onde cada coisa fica (nao misturar) ---
  // sessionStorage = DESTA ABA (nao compartilha com outras abas; some ao fechar a aba)
  //   -> BOT_MODO_ABA (invasor | cacadas | vazio=manual)
  // localStorage = NAVEGADOR (compartilhado entre abas)
  //   -> credenciais, whitelist, rotacao — NUNCA gravar modo aqui
  // window.name = DESTA ABA (backup se chrome-error:// bloquear storage)
  try {
    localStorage.removeItem('BOT_MODO_ABA');
    localStorage.removeItem('BOT_MODO_PREFERIDO');
  } catch (e) {}

  var WHITELIST_CACADAS_DEFAULT = 'yoruhime,shizuo,sora,shiroe';
  var WHITELIST_CLA_CACADAS_DEFAULT = 'Tropa do NP,23cmMole';
  var WHITELIST_FIREBASE_FILA_DEFAULT =
    'KILLER,BARDO,MARIO,CRUELL,CRUELA,BlackFire,Stark,Targaryen,Lannister,Baratheon,' +
    'MIRANHA,TOBINHO,MARUKO,PAINKILLER,lula13,Madeira,Ferro,Papel,Pedra,Tesoura,Lepo,LepoLepo,' +
    'Marginal,SaoMateus,cORINGAUM,TIMAO,TIMAUM,CORINGUDO,APT,BRUNINHO';

  function parseEsperaCacadasMinutos(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarEsperaCacadasParam(valor) {
    var minutos = parseEsperaCacadasMinutos(valor);
    if (minutos === null) return false;
    localStorage.setItem('BOT_ESPERA_CACADAS', String(minutos));
    return true;
  }

  function parseLimiteInvasor(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseInt(String(valor).replace(/\./g, '').replace(',', ''), 10);
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarLimiteInvasorParam(valor) {
    var limite = parseLimiteInvasor(valor);
    if (limite === null) return false;
    localStorage.setItem('BOT_LIMITE_INVASOR', String(limite));
    return true;
  }

  function parseNumeroInteiro(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var n = parseInt(String(valor).replace(/\./g, '').replace(',', ''), 10);
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function gravarMaxRyousCacadasParam(valor) {
    var max = parseNumeroInteiro(valor);
    if (max === null) return false;
    localStorage.setItem('BOT_MAX_RYOUS_CACADAS', String(max));
    return true;
  }

  function gravarDiffNivelCacadasParam(valor) {
    var diff = parseNumeroInteiro(valor);
    if (diff === null) return false;
    localStorage.setItem('BOT_DIFF_NIVEL_CACADAS', String(diff));
    return true;
  }

  function gravarWhitelistCacadasParam(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return false;
    localStorage.setItem('BOT_WHITELIST_CACADAS', String(valor).trim());
    return true;
  }

  function gravarWhitelistClaCacadasParam(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return false;
    localStorage.setItem('BOT_WHITELIST_CLA_CACADAS', String(valor).trim());
    return true;
  }

  function gravarWhitelistFirebaseFilaParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim();
    if (s === '') {
      try { localStorage.removeItem('BOT_WHITELIST_FIREBASE_FILA'); } catch (e) {}
      return true;
    }
    localStorage.setItem('BOT_WHITELIST_FIREBASE_FILA', s);
    return true;
  }

  function gravarBlacklistCacadasParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim();
    if (s === '') {
      try { localStorage.removeItem('BOT_BLACKLIST_CACADAS'); } catch (e) {}
      return true;
    }
    localStorage.setItem('BOT_BLACKLIST_CACADAS', s);
    return true;
  }

  function gravarRotacaoAutomacaoParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '' || s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem('BOT_ROTACAO_AUTOMACAO'); } catch (e) {}
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_ROTACAO_AUTOMACAO', '1');
      return true;
    }
    return false;
  }

  var BOT_USUARIO_LOGIN_KEY = 'BOT_USUARIO_LOGIN';

  function gravarUsuarioLoginParam(valor) {
    if (!valor) return false;
    var u = String(valor).trim();
    if (!u) return false;
    try {
      sessionStorage.setItem(BOT_USUARIO_LOGIN_KEY, u);
      sessionStorage.setItem('BOT_USUARIO', u);
    } catch (e) {}
    localStorage.setItem(BOT_USUARIO_LOGIN_KEY, u);
    localStorage.setItem('BOT_USUARIO', u);
    return true;
  }

  function aplicarPrincipalLoginDoPainel(valor) {
    var u = String(valor || '').trim();
    if (!u) return false;
    var anterior = lerUsuarioLoginArmazenado();
    if (anterior === u) return true;
    gravarUsuarioLoginParam(u);
    console.log('[Bot] Principal alterado no painel: ' + (anterior || '?') + ' -> ' + u);
    if (typeof recarregarCredenciaisLogin === 'function') recarregarCredenciaisLogin();
    return true;
  }

  try { window.__BOT_APLICAR_PRINCIPAL__ = aplicarPrincipalLoginDoPainel; } catch (e) {}

  function gravarSenhaLoginParam(valor) {
    if (valor === null || valor === undefined) return false;
    var p = String(valor);
    if (!p) return false;
    try { sessionStorage.setItem('BOT_SENHA', p); } catch (e) {}
    localStorage.setItem('BOT_SENHA', p);
    return true;
  }

  function marcarCredenciaisUrlAplicadas() {
    try { sessionStorage.setItem(BOT_CRED_URL_APLICADA_KEY, '1'); } catch (e) {}
  }

  function credenciaisUrlJaAplicadasNestaPagina() {
    try { return sessionStorage.getItem(BOT_CRED_URL_APLICADA_KEY) === '1'; } catch (e) {}
    return false;
  }

  function aplicarCredenciaisDeUrlSearch(search) {
    if (!search) return false;
    try {
      var rp = new URLSearchParams(search);
      var u = rp.get('bot_user');
      var p = rp.get('bot_pass');
      var n = rp.get('bot_nivel');
      var e = rp.get('bot_espera_cacadas');
      var l = rp.get('bot_limite_invasor');
      var modoRaw = rp.get('bot_modo');
      var aplicou = false;
      if (modoRaw === 'invasor' || modoRaw === 'cacadas') {
        gravarModoAba(modoRaw);
      } else if (modoRaw === 'off' || modoRaw === 'manual') {
        try { sessionStorage.removeItem(BOT_MODO_KEY); } catch (eModo) {}
      }
      if (u) {
        gravarUsuarioLoginParam(u);
        aplicou = true;
      }
      if (p) {
        gravarSenhaLoginParam(p);
        aplicou = true;
      }
      if (n) {
        gravarNivelCacadasParam(n);
        aplicou = true;
      }
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      if (aplicou) marcarCredenciaisUrlAplicadas();
      aplicarParamsCacadasAtacar(rp);
      return aplicou;
    } catch (e) {}
    return false;
  }

  function aplicarCredenciaisRecoveryUrl() {
    try {
      if (!window.__BOT_RECOVERY__) return false;
      var salva = window.__BOT_RECOVERY__.ler();
      if (!salva) return false;
      var urlObj = salva.indexOf('://') !== -1
        ? new URL(salva)
        : new URL(salva.replace(/^\?/, ''), 'https://shadowofshinobi.com/');
      return aplicarCredenciaisDeUrlSearch(urlObj.search);
    } catch (e) {}
    return false;
  }

  function lerUsuarioLoginArmazenado() {
    try {
      var aba = sessionStorage.getItem(BOT_USUARIO_LOGIN_KEY) || sessionStorage.getItem('BOT_USUARIO');
      if (aba) return aba;
      return localStorage.getItem(BOT_USUARIO_LOGIN_KEY) || localStorage.getItem('BOT_USUARIO') || '';
    } catch (e) {
      return '';
    }
  }

  function lerSenhaLoginArmazenada() {
    try {
      var aba = sessionStorage.getItem('BOT_SENHA');
      if (aba) return aba;
      return localStorage.getItem('BOT_SENHA') || '';
    } catch (e) {
      return '';
    }
  }

  function rotacaoAutomacaoAtiva() {
    return localStorage.getItem('BOT_ROTACAO_AUTOMACAO') === '1';
  }

  function descreverRotacaoAutomacao() {
    if (!rotacaoAutomacaoAtiva()) return 'desligada';
    return 'ligada (bot_rotacao_automacao=1)';
  }

  function gravarDoujutsuParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      localStorage.setItem('BOT_DOUJUTSU', '0');
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_DOUJUTSU', '1');
      return true;
    }
    return false;
  }

  function doujutsuFlagManualAtiva() {
    try { return localStorage.getItem('BOT_DOUJUTSU') === '1'; } catch (e) {}
    return false;
  }

  function gravarDoujutsuAutoSabadoParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      localStorage.setItem('BOT_DOUJUTSU_AUTO_SABADO', '0');
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_DOUJUTSU_AUTO_SABADO', '1');
      return true;
    }
    return false;
  }

  function doujutsuAutoSabadoFlagAtiva() {
    try {
      var raw = localStorage.getItem('BOT_DOUJUTSU_AUTO_SABADO');
      if (raw === null || raw === '') return true;
      if (raw === '0' || raw === 'false' || raw === 'off') return false;
      return true;
    } catch (e) {}
    return true;
  }

  function dentroJanelaDoujutsuSabado() {
    var agora = new Date();
    if (agora.getDay() !== 6) return false;
    var minutos = agora.getHours() * 60 + agora.getMinutes();
    return minutos >= (17 * 60 + 50) && minutos < (20 * 60);
  }

  function doujutsuDesejadoPorFirebaseFila() {
    return cacadasFirebaseFilaFlagAtiva() && cacadaAtualPorNomeFirebase();
  }

  function doujutsuDesejadoPorAutomacaoAtacante() {
    return atacarAutomacoesAtacanteAtivo() &&
      (cacadaAtualPorNomeAutomacao() || obterModoAba() === 'cacadas');
  }

  function doujutsuDesejado() {
    if (obterModoAba() !== 'cacadas') return false;
    if (doujutsuDesejadoPorFirebaseFila()) return true;
    if (doujutsuDesejadoPorAutomacaoAtacante()) return true;
    if (doujutsuFlagManualAtiva()) return true;
    if (doujutsuAutoSabadoFlagAtiva() && estaEmContaGerenciada() && dentroJanelaDoujutsuSabado()) {
      return true;
    }
    return false;
  }

  function gravarCacadasFirebaseFilaParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      localStorage.setItem('BOT_CACADAS_FIREBASE_FILA', '0');
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_CACADAS_FIREBASE_FILA', '1');
      return true;
    }
    return false;
  }

  function gravarDiarioGerenciadaParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem('BOT_DIARIO_GERENCIADA'); } catch (e) {}
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_DIARIO_GERENCIADA', '1');
      return true;
    }
    return false;
  }

  function diarioGerenciadaAtivo() {
    try { return localStorage.getItem('BOT_DIARIO_GERENCIADA') === '1'; } catch (e) {}
    return false;
  }

  function descreverDiarioGerenciada() {
    if (!diarioGerenciadaAtivo()) return 'desligado';
    var extra = ' | mesma aba ' + DIARIO_LOGINS_SEQUENCIA.join(' -> ') +
      ' (Discord em ' + DIARIO_DISCORD_LOGIN + ') | caçadas: bloqueadas';
    if (diarioCicloSequenciaConcluido()) extra += ' | ciclo: concluido';
    else {
      var feitas = lerContasDiarioFeitas();
      var fase = obterFaseDiario();
      if (feitas.length || fase) {
        extra += ' | retomada: ' + (fase ? 'fase ' + fase : 'ok') +
          (feitas.length ? ' (' + feitas.length + ' gerenciadas ok)' : '');
      }
    }
    return 'ligado (evento + raid + animal)' + extra;
  }

  function gravarDiarioSemCacadasParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem('BOT_DIARIO_SEM_CACADAS'); } catch (e) {}
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_DIARIO_SEM_CACADAS', '1');
      return true;
    }
    return false;
  }

  function diarioSemCacadasPosRotina() {
    if (diarioGerenciadaAtivo()) return true;
    try {
      var raw = localStorage.getItem('BOT_DIARIO_SEM_CACADAS');
      if (raw === null || raw === '') return true;
      return raw === '1';
    } catch (e) {}
    return true;
  }

  function gravarAtacarAutomacoesPrepParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem('BOT_ATACAR_AUTOMACOES_PREP'); } catch (e) {}
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_ATACAR_AUTOMACOES_PREP', '1');
      return true;
    }
    return false;
  }

  function atacarAutomacoesPrepAtivo() {
    try { return localStorage.getItem('BOT_ATACAR_AUTOMACOES_PREP') === '1'; } catch (e) {}
    return false;
  }

  function gravarAtacarAutomacoesParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem('BOT_ATACAR_AUTOMACOES'); } catch (e) {}
      if (doujutsuLigadoPorAutomAtacante()) {
        gravarDoujutsuParam('0');
        marcarDoujutsuLigadoPorAutomAtacante(false);
      }
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_ATACAR_AUTOMACOES', '1');
      if (!doujutsuFlagManualAtiva()) {
        gravarDoujutsuParam('1');
        marcarDoujutsuLigadoPorAutomAtacante(true);
      } else {
        marcarDoujutsuLigadoPorAutomAtacante(false);
      }
      return true;
    }
    return false;
  }

  function doujutsuLigadoPorAutomAtacante() {
    try { return localStorage.getItem('BOT_DOUJUTSU_POR_AUTOM_ATACANTE') === '1'; } catch (e) {}
    return false;
  }

  function marcarDoujutsuLigadoPorAutomAtacante(ativo) {
    try {
      if (ativo) localStorage.setItem('BOT_DOUJUTSU_POR_AUTOM_ATACANTE', '1');
      else localStorage.removeItem('BOT_DOUJUTSU_POR_AUTOM_ATACANTE');
    } catch (e) {}
  }

  function atacarAutomacoesAtacanteAtivo() {
    try { return localStorage.getItem('BOT_ATACAR_AUTOMACOES') === '1'; } catch (e) {}
    return false;
  }

  function descreverAtacarAutomacoes() {
    if (atacarAutomacoesPrepAtivo()) return 'prep ligado (Chrome — rotacao gerenciadas)';
    if (atacarAutomacoesAtacanteAtivo()) {
      return 'atacante ligado (Shizuo — doujutsu + Firebase automacao_fila)';
    }
    return 'desligado';
  }

  function cacadasBloqueadaPorAutomPrep() {
    return atacarAutomacoesPrepAtivo() && !automPrepCicloSequenciaConcluido();
  }

  function cacadasBloqueadaPorModoAutomacao() {
    return cacadasBloqueadaPorAutomPrep() || atacarAutomacoesAtacanteAtivo();
  }

  function cacadasFirebaseFilaFlagAtiva() {
    try { return localStorage.getItem('BOT_CACADAS_FIREBASE_FILA') === '1'; } catch (e) {}
    return false;
  }

  function descreverCacadasFirebaseFila() {
    return cacadasFirebaseFilaFlagAtiva()
      ? 'ligada (ranking_ryous_fila + doujutsu c/ alvo na fila)'
      : 'desligada';
  }

  function gravarCacadasPortaoTeto29Param(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      localStorage.setItem('BOT_CACADAS_PORTAO_TETO_29', '0');
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_CACADAS_PORTAO_TETO_29', '1');
      return true;
    }
    return false;
  }

  function cacadasPortaoTeto29FlagAtiva() {
    try { return localStorage.getItem('BOT_CACADAS_PORTAO_TETO_29') === '1'; } catch (e) {}
    return false;
  }

  function descreverCacadasPortaoTeto29() {
    return cacadasPortaoTeto29FlagAtiva()
      ? 'ligada (5-6min no portao, teto ocioso 29min)'
      : 'desligada';
  }

  function descreverDoujutsu() {
    var manual = doujutsuFlagManualAtiva() ? 'ligado' : 'desligado';
    var autoSab = doujutsuAutoSabadoFlagAtiva() ? 'ligado' : 'desligado';
    var efetivo = doujutsuDesejado() ? 'sim' : 'nao';
    var extra = '';
    if (atacarAutomacoesAtacanteAtivo()) {
      extra = ' (autom atacante — doujutsu automatico)';
    } else if (doujutsuAutoSabadoFlagAtiva() && estaEmContaGerenciada()) {
      extra = dentroJanelaDoujutsuSabado() ? ' (janela sab 17:50-20h: agora)' : ' (janela sab 17:50-20h: fora)';
    } else if (cacadasFirebaseFilaFlagAtiva()) {
      extra = ' (firebase fila c/ alvo por nome)';
    }
    return 'manual: ' + manual + ' | auto sabado gerenciada: ' + autoSab + extra + ' | efetivo: ' + efetivo;
  }

  function gravarInvasorVivoParam(valor) {
    if (valor === null || valor === undefined) return false;
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      localStorage.setItem('BOT_INVASOR_VIVO', '0');
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem('BOT_INVASOR_VIVO', '1');
      return true;
    }
    return false;
  }

  function invasorVivoFlagAtiva() {
    try {
      var raw = localStorage.getItem('BOT_INVASOR_VIVO');
      if (raw === null || raw === '') return true;
      if (raw === '0' || raw === 'false' || raw === 'off') return false;
      return true;
    } catch (e) {}
    return true;
  }

  function descreverInvasorVivo() {
    return (invasorVivoFlagAtiva() ? 'ligada' : 'desligada') +
      ' (reserva < 100k -> pausa ate proximo boss; +3-6min no 1o ataque pos-respawn; ignora em conta gerenciada)';
  }

  function deveAplicarPausaInvasorVivo() {
    if (!invasorVivoFlagAtiva() || obterModoAba() !== 'cacadas') return false;
    if (estaEmContaGerenciada()) return false;
    return true;
  }

  function aplicarParamsCacadasAtacar(rp) {
    if (!rp) return;
    var w = rp.get('bot_whitelist_cacadas');
    var wc = rp.get('bot_whitelist_cla_cacadas');
    var wff = rp.get('bot_whitelist_firebase_fila');
    var bl = rp.get('bot_blacklist_cacadas');
    var ra = rp.get('bot_rotacao_automacao');
    var r = rp.get('bot_max_ryous_cacadas');
    var d = rp.get('bot_diff_nivel_cacadas');
    var v = rp.get('bot_min_ryous_vitoria_cacadas');
    var iv = rp.get('bot_invasor_vivo');
    var dj = rp.get('bot_doujutsu');
    var djas = rp.get('bot_doujutsu_auto_sabado');
    var cff = rp.get('bot_cacadas_firebase_fila');
    var ct29 = rp.get('bot_cacadas_teto_29');
    var dg = rp.get('bot_diario_gerenciada');
    var dgs = rp.get('bot_diario_sem_cacadas');
    if (w !== null && w !== '') gravarWhitelistCacadasParam(w);
    if (wc !== null && wc !== '') gravarWhitelistClaCacadasParam(wc);
    if (wff !== null) gravarWhitelistFirebaseFilaParam(wff);
    if (bl !== null) gravarBlacklistCacadasParam(bl);
    if (ra !== null) gravarRotacaoAutomacaoParam(ra);
    if (r !== null && r !== '') gravarMaxRyousCacadasParam(r);
    if (d !== null && d !== '') gravarDiffNivelCacadasParam(d);
    if (v !== null && v !== '') gravarMinRyousVitoriaCacadasParam(v);
    if (iv !== null && iv !== '') gravarInvasorVivoParam(iv);
    if (dj !== null && dj !== '') gravarDoujutsuParam(dj);
    if (djas !== null && djas !== '') gravarDoujutsuAutoSabadoParam(djas);
    if (cff !== null && cff !== '') gravarCacadasFirebaseFilaParam(cff);
    if (ct29 !== null && ct29 !== '') gravarCacadasPortaoTeto29Param(ct29);
    if (dg !== null && dg !== '') gravarDiarioGerenciadaParam(dg);
    if (dgs !== null && dgs !== '') gravarDiarioSemCacadasParam(dgs);
    var aap = rp.get('bot_atacar_automacoes_prep');
    var aa = rp.get('bot_atacar_automacoes');
    if (aap !== null && aap !== '') gravarAtacarAutomacoesPrepParam(aap);
    if (aa !== null && aa !== '') gravarAtacarAutomacoesParam(aa);
    var mn = rp.get('bot_missao_novo');
    if (mn !== null && mn !== '') gravarMissaoNovoParam(mn);
    var mnh = rp.get('bot_missao_novo_horas');
    if (mnh !== null && mnh !== '') gravarMissaoNovoHorasParam(mnh);
    var mnd = rp.get('bot_missao_novo_diff');
    if (mnd !== null && mnd !== '') gravarMissaoNovoDiffParam(mnd);
    var mnm = rp.get('bot_missao_novo_min_diff');
    if (mnm !== null && mnm !== '') gravarMissaoNovoMinDiffParam(mnm);
    var mnr = rp.get('bot_missao_novo_max_ryous');
    if (mnr !== null && mnr !== '') gravarMissaoNovoMaxRyousParam(mnr);
    var mnl = rp.get('bot_missao_novo_limite_min');
    if (mnl !== null && mnl !== '') gravarMissaoNovoLimiteMinParam(mnl);
  }

  function gravarMinRyousVitoriaCacadasParam(valor) {
    var min = parseNumeroInteiro(valor);
    if (min === null) return false;
    localStorage.setItem('BOT_MIN_RYOUS_VITORIA_CACADAS', String(min));
    return true;
  }

  function extrairModoDeUrlString(urlStr) {
    try {
      if (!urlStr) return '';
      var u = urlStr.indexOf('://') !== -1 ? new URL(urlStr) : new URL(urlStr, 'https://shadowofshinobi.com/');
      var m = new URLSearchParams(u.search).get('bot_modo');
      if (m === 'invasor' || m === 'cacadas') return m;
    } catch (e) {}
    return '';
  }

  function ehReferrerPosLogin() {
    var ref = document.referrer || '';
    if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return false;
    try {
      var u = new URL(ref);
      var p = (u.pathname || '/').replace(/\/+$/, '') || '/';
      return p === '/' || u.pathname.indexOf('login') !== -1;
    } catch (e) {}
    return false;
  }

  function gravarModoAba(modo) {
    if (modo !== 'invasor' && modo !== 'cacadas') return;
    try {
      sessionStorage.setItem(BOT_MODO_KEY, modo);
    } catch (e) {}
  }

  function aplicarCredenciaisReferrer() {
    if (credenciaisUrlJaAplicadasNestaPagina()) return;
    try {
      var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      var ehLoginOuHome = path === '/' || !!document.getElementById('login');
      var ehStatusPosLogin = path.indexOf('status') !== -1 && ehReferrerPosLogin();
      if (!ehLoginOuHome && !ehStatusPosLogin) return;
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return;
      aplicarCredenciaisDeUrlSearch(new URL(ref).search);
    } catch (e) {}
  }

  function gravarNivelCacadasParam(valor, opcoes) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 1) return false;
    try {
      localStorage.setItem('BOT_NIVEL_CACADAS', String(n));
      if (!opcoes || opcoes.definirBase !== false) {
        localStorage.setItem('BOT_NIVEL_CACADAS_BASE', String(n));
      }
    } catch (e) { return false; }
    if (typeof sincronizarNivelCacadasFinal === 'function') sincronizarNivelCacadasFinal();
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return true;
  }

  function logDiagnosticoModo(rotulo) {
    if (window.__BOT_BOOTSTRAP_LOG__) return;
    window.__BOT_BOOTSTRAP_LOG__ = true;
    var s = '(erro)';
    try { s = sessionStorage.getItem(BOT_MODO_KEY) || '(vazio)'; } catch (e) {}
    console.log('[Bot Bootstrap] URL: ' + location.href);
    console.log('[Bot Bootstrap] referrer: ' + (document.referrer || '(vazio)'));
    console.log('[Bot Bootstrap] session=' + s + ' | path=' + location.pathname);
  }

  // Bootstrap imediato — antes de qualquer return (redirect /status nao perde o modo)
  function aplicarParamsUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var modoParamRaw = params.get('bot_modo');
      var modoVeioDeQuery = modoParamRaw === 'invasor' || modoParamRaw === 'cacadas';
      var modo = modoVeioDeQuery ? modoParamRaw : '';

      if (modoParamRaw && modoParamRaw !== 'invasor' && modoParamRaw !== 'cacadas' &&
          modoParamRaw !== 'off' && modoParamRaw !== 'manual') {
        console.warn('[Bot] bot_modo invalido: "' + modoParamRaw + '". Use invasor ou cacadas.');
      }

      var u = params.get('bot_user');
      var p = params.get('bot_pass');
      var n = params.get('bot_nivel');
      var e = params.get('bot_espera_cacadas');
      var l = params.get('bot_limite_invasor');
      if (u) {
        gravarUsuarioLoginParam(u);
        marcarCredenciaisUrlAplicadas();
      }
      if (p) {
        gravarSenhaLoginParam(p);
        marcarCredenciaisUrlAplicadas();
      }
      if (n) {
        gravarNivelCacadasParam(n);
        marcarCredenciaisUrlAplicadas();
      }
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
      if (l !== null && l !== '') gravarLimiteInvasorParam(l);
      aplicarParamsCacadasAtacar(params);

      if (modoParamRaw === 'off' || modoParamRaw === 'manual') {
        sessionStorage.removeItem(BOT_MODO_KEY);
      } else if (modo === 'invasor' || modo === 'cacadas') {
        gravarModoAba(modo);
      }

      var pathAtual = window.location.pathname || '';
      var ehPaginaCredenciais = document.getElementById('login') ||
        pathAtual.indexOf('status') !== -1 || pathAtual === '/' || pathAtual === '';
      if (!u && !p && !n && ehPaginaCredenciais && !credenciaisUrlJaAplicadasNestaPagina()) {
        if (!aplicarCredenciaisRecoveryUrl() && !lerUsuarioLoginArmazenado()) {
          aplicarCredenciaisReferrer();
        }
      }

      if (!obterModoAba() && ehPaginaCredenciais) {
        recuperarModoAbaNaPaginaLogin('aplicarParamsUrl');
      }

      if ((u || p || n || e || l || params.get('bot_whitelist_cacadas') ||
          params.get('bot_whitelist_cla_cacadas') || params.get('bot_whitelist_firebase_fila') ||
          params.get('bot_blacklist_cacadas') ||
          params.get('bot_rotacao_automacao') ||
          params.get('bot_max_ryous_cacadas') || params.get('bot_diff_nivel_cacadas') ||
          params.get('bot_min_ryous_vitoria_cacadas') ||
          params.get('bot_doujutsu') || params.get('bot_doujutsu_auto_sabado') ||
          params.get('bot_cacadas_firebase_fila') || params.get('bot_cacadas_teto_29') ||
          params.get('bot_diario_gerenciada') ||
          params.get('bot_diario_sem_cacadas') ||
          modoVeioDeQuery || modo === 'invasor' || modo === 'cacadas') &&
          window.history && window.history.replaceState) {
        history.replaceState(null, document.title, location.pathname + location.hash);
      }

      return params;
    } catch (e) {
      return null;
    }
  }

  function obterUrlRetornoRankingPosLogin() {
    try {
      var url = sessionStorage.getItem(BOT_RANKING_RETORNO_URL_KEY);
      if (url && url.indexOf('shadowofshinobi.com') !== -1 && url.indexOf('/ranking') !== -1) {
        return url;
      }
    } catch (e) {}
    return '';
  }

  function obterModoAba() {
    try {
      var modoSessao = sessionStorage.getItem(BOT_MODO_KEY);
      if (modoSessao === 'invasor' || modoSessao === 'cacadas') {
        return modoSessao;
      }
    } catch (e) {}
    return '';
  }

  // Pos-login e tela de login: sessionStorage da aba; se vazio, URL salva em window.name (mesma aba)
  function recuperarModoAbaNaPaginaLogin(origem) {
    var modo = obterModoAba();
    if (modo) return modo;

    try {
      if (window.__BOT_RECOVERY__) {
        modo = extrairModoDeUrlString(window.__BOT_RECOVERY__.ler());
        if (modo) {
          gravarModoAba(modo);
          console.log('[Bot] Modo recuperado da aba (' + (origem || 'recovery') + '): ' + modo);
          return modo;
        }
      }
    } catch (e) {}

    modo = extrairModoDeUrlString(window.location.href);
    if (modo) {
      gravarModoAba(modo);
      console.log('[Bot] Modo recuperado da URL (' + (origem || 'url') + '): ' + modo);
      return modo;
    }

    try {
      var ref = document.referrer || '';
      if (ref && ref.indexOf('shadowofshinobi.com') !== -1) {
        modo = extrairModoDeUrlString(ref);
        if (modo) {
          gravarModoAba(modo);
          console.log('[Bot] Modo recuperado do referrer (' + (origem || 'referrer') + '): ' + modo);
          return modo;
        }
      }
    } catch (e) {}

    return '';
  }

  function recuperarModoAbaPosLogin() {
    var modo = recuperarModoAbaNaPaginaLogin('pos-login');
    if (modo) return modo;

    if (diarioGerenciadaAtivo()) {
      gravarModoAba('cacadas');
      console.log('[Bot] Modo recuperado — diario gerenciada ativo: cacadas');
      return 'cacadas';
    }

    return '';
  }

  function sincronizarModoAba() {
    var params = aplicarParamsUrl();
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return params;
  }

  aplicarParamsUrl();

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '3.89';
  var SCRIPT_ATUALIZADO = '09/09/2026 18:22';
  var URL_HOME = 'https://shadowofshinobi.com/';
  var TEMPO_RECUPERACAO_FALHA = 20000;
  var TEMPO_RECUPERACAO_SERVIDOR = 3000;
  var reloadAgendado = false;

  function montarUrlLoginComParams() {
    if (window.__BOT_RECOVERY__) {
      return window.__BOT_RECOVERY__.montarUrlLoginComParams();
    }

    var params = new URLSearchParams();
    var modo = obterModoAba();
    if (modo === 'invasor' || modo === 'cacadas') params.set('bot_modo', modo);

    try {
      var u = lerUsuarioLoginArmazenado();
      var p = lerSenhaLoginArmazenada();
      var n = localStorage.getItem('BOT_NIVEL_CACADAS');
      var e = localStorage.getItem('BOT_ESPERA_CACADAS');
      var l = localStorage.getItem('BOT_LIMITE_INVASOR');
      var w = localStorage.getItem('BOT_WHITELIST_CACADAS');
      var wc = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS');
      var wff = localStorage.getItem('BOT_WHITELIST_FIREBASE_FILA');
      var bl = localStorage.getItem('BOT_BLACKLIST_CACADAS');
      var ra = localStorage.getItem('BOT_ROTACAO_AUTOMACAO');
      var r = localStorage.getItem('BOT_MAX_RYOUS_CACADAS');
      var d = localStorage.getItem('BOT_DIFF_NIVEL_CACADAS');
      var v = localStorage.getItem('BOT_MIN_RYOUS_VITORIA_CACADAS');
      var iv = localStorage.getItem('BOT_INVASOR_VIVO');
      var dj = localStorage.getItem('BOT_DOUJUTSU');
      var djas = localStorage.getItem('BOT_DOUJUTSU_AUTO_SABADO');
      var cff = localStorage.getItem('BOT_CACADAS_FIREBASE_FILA');
      var ct29 = localStorage.getItem('BOT_CACADAS_PORTAO_TETO_29');
      var dg = localStorage.getItem('BOT_DIARIO_GERENCIADA');
      var dgs = localStorage.getItem('BOT_DIARIO_SEM_CACADAS');
      if (u) params.set('bot_user', u);
      if (p) params.set('bot_pass', p);
      if (n) params.set('bot_nivel', n);
      if (e !== null && e !== '') params.set('bot_espera_cacadas', e);
      if (l !== null && l !== '') params.set('bot_limite_invasor', l);
      if (w !== null && w !== '') params.set('bot_whitelist_cacadas', w);
      if (wc !== null && wc !== '') params.set('bot_whitelist_cla_cacadas', wc);
      if (wff !== null && wff !== '') params.set('bot_whitelist_firebase_fila', wff);
      if (bl !== null && bl !== '') params.set('bot_blacklist_cacadas', bl);
      if (ra === '1') params.set('bot_rotacao_automacao', '1');
      if (r !== null && r !== '') params.set('bot_max_ryous_cacadas', r);
      if (d !== null && d !== '') params.set('bot_diff_nivel_cacadas', d);
      if (v !== null && v !== '') params.set('bot_min_ryous_vitoria_cacadas', v);
      if (iv === '0') params.set('bot_invasor_vivo', '0');
      else if (invasorVivoFlagAtiva()) params.set('bot_invasor_vivo', '1');
      if (dj === '1') params.set('bot_doujutsu', '1');
      else if (dj === '0') params.set('bot_doujutsu', '0');
      if (djas === '0') params.set('bot_doujutsu_auto_sabado', '0');
      else if (djas === '1') params.set('bot_doujutsu_auto_sabado', '1');
      if (cff === '1') params.set('bot_cacadas_firebase_fila', '1');
      else if (cff === '0') params.set('bot_cacadas_firebase_fila', '0');
      if (ct29 === '1') params.set('bot_cacadas_teto_29', '1');
      else if (ct29 === '0') params.set('bot_cacadas_teto_29', '0');
      if (dg === '1') params.set('bot_diario_gerenciada', '1');
      else if (dg === '0') params.set('bot_diario_gerenciada', '0');
      if (dgs === '1') params.set('bot_diario_sem_cacadas', '1');
      else if (dgs === '0') params.set('bot_diario_sem_cacadas', '0');
      var aap = localStorage.getItem('BOT_ATACAR_AUTOMACOES_PREP');
      var aa = localStorage.getItem('BOT_ATACAR_AUTOMACOES');
      if (aap === '1') params.set('bot_atacar_automacoes_prep', '1');
      if (aa === '1') params.set('bot_atacar_automacoes', '1');
    } catch (err) {}

    var qs = params.toString();
    return URL_HOME + (qs ? '?' + qs : '');
  }

  function salvarRecuperacaoAntesDeSair(url) {
    marcarRetomarGerenciadaPosLogout();
    var destino = url || montarUrlLoginComParams();
    if (window.__BOT_RECOVERY__) {
      window.__BOT_RECOVERY__.salvar(destino);
    } else {
      try { window.name = '__BOT_RECUP__:' + destino; } catch (e) {}
    }
    return destino;
  }

  function injetarScriptNaPagina(codigo) {
    try {
      var el = document.createElement('script');
      el.textContent = codigo;
      (document.documentElement || document.head).appendChild(el);
      el.parentNode.removeChild(el);
    } catch (e) {}
  }

  function publicarBuildCacadasNaPagina() {
    window.__BOT_BUILD_CACADAS__ = { versao: SCRIPT_VERSAO, atualizado: SCRIPT_ATUALIZADO };
    console.log(
      '%c[Bot Caçadas] v' + SCRIPT_VERSAO + ' | atualizado: ' + SCRIPT_ATUALIZADO,
      'color:#2ecc71;font-weight:bold'
    );
    injetarScriptNaPagina(
      'window.__BOT_BUILD_CACADAS__={versao:"' + SCRIPT_VERSAO + '",atualizado:"' + SCRIPT_ATUALIZADO + '"};' +
      'console.log("%c[Bot Ca\\u00e7adas] v' + SCRIPT_VERSAO + ' | atualizado: ' + SCRIPT_ATUALIZADO +
      ' (pagina)","color:#2ecc71;font-weight:bold");'
    );
  }

  function agendarRecuperacaoViaLogin(motivo, delayMs) {
    if (reloadAgendado) return;
    reloadAgendado = true;

    var url = salvarRecuperacaoAntesDeSair();
    var espera = typeof delayMs === 'number' ? delayMs : TEMPO_RECUPERACAO_FALHA;

    console.warn('[Script] FALHA DE EXECUÇÃO: ' + motivo);
    setTimeout(function() {
      console.log('[Script] Recuperacao — login com parametros da sessao (sem reload)...');
      try { location.replace(url); } catch (e) { location.href = url; }
    }, espera);
  }

  if (!window.__BOT_CONTROLE__) {
    window.__BOT_CONTROLE__ = {
      parar: function() {
        try { sessionStorage.setItem(BOT_KILL_KEY, '1'); } catch (e) {}
        console.warn('[Bot] Desativado nesta aba.');
        location.reload();
      },
      ligar: function() {
        try { sessionStorage.removeItem(BOT_KILL_KEY); } catch (e) {}
        console.log('[Bot] Reativado nesta aba.');
        location.reload();
      },
      status: function() {
        try { return sessionStorage.getItem(BOT_KILL_KEY) === '1' ? 'off' : 'on'; }
        catch (e) { return 'on'; }
      }
    };
    window.botParar = window.__BOT_CONTROLE__.parar;
    window.botLigar = window.__BOT_CONTROLE__.ligar;
    window.botStatus = window.__BOT_CONTROLE__.status;
  }

  window.botRotacaoAutomacao = function(ligar) {
    if (arguments.length === 0) {
      return descreverRotacaoAutomacao();
    }
    gravarRotacaoAutomacaoParam(ligar ? '1' : '0');
    console.log('[Automacao] Rotacao: ' + descreverRotacaoAutomacao());
    return descreverRotacaoAutomacao();
  };

  window.botInvasorVivo = function(ligar) {
    if (arguments.length === 0) {
      console.log('[InvasorVivo] ' + descreverInvasorVivo());
      return invasorVivoFlagAtiva();
    }
    gravarInvasorVivoParam(ligar ? '1' : '0');
    console.log('[InvasorVivo] ' + descreverInvasorVivo());
    if (typeof atualizarPainelInvasorVivo === 'function') atualizarPainelInvasorVivo();
    return invasorVivoFlagAtiva();
  };

  window.botDoujutsu = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Doujutsu] ' + descreverDoujutsu());
      return doujutsuFlagManualAtiva();
    }
    gravarDoujutsuParam(ligar ? '1' : '0');
    console.log('[Doujutsu] ' + descreverDoujutsu());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return doujutsuFlagManualAtiva();
  };

  window.botDoujutsuAutoSabado = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Doujutsu] auto sabado: ' + (doujutsuAutoSabadoFlagAtiva() ? 'ligado' : 'desligado'));
      return doujutsuAutoSabadoFlagAtiva();
    }
    gravarDoujutsuAutoSabadoParam(ligar ? '1' : '0');
    console.log('[Doujutsu] ' + descreverDoujutsu());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return doujutsuAutoSabadoFlagAtiva();
  };

  window.botCacadasFirebaseFila = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Firebase Fila] ' + descreverCacadasFirebaseFila());
      return cacadasFirebaseFilaFlagAtiva();
    }
    gravarCacadasFirebaseFilaParam(ligar ? '1' : '0');
    console.log('[Firebase Fila] ' + descreverCacadasFirebaseFila());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return cacadasFirebaseFilaFlagAtiva();
  };

  window.botCacadasTeto29 = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Caçadas Teto29] ' + descreverCacadasPortaoTeto29());
      return cacadasPortaoTeto29FlagAtiva();
    }
    gravarCacadasPortaoTeto29Param(ligar ? '1' : '0');
    console.log('[Caçadas Teto29] ' + descreverCacadasPortaoTeto29());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return cacadasPortaoTeto29FlagAtiva();
  };

  window.botDiarioGerenciada = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Diario] ' + descreverDiarioGerenciada());
      return diarioGerenciadaAtivo();
    }
    gravarDiarioGerenciadaParam(ligar ? '1' : '0');
    if (ligar) {
      limparDiarioCicloSequenciaConcluido();
    }
    if (ligar && !obterModoAba()) {
      gravarModoAba('cacadas');
      console.log('[Diario] Modo cacadas ativado — recarregando pagina...');
      location.reload();
      return true;
    }
    console.log('[Diario] ' + descreverDiarioGerenciada());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return diarioGerenciadaAtivo();
  };

  window.botDiarioReset = function() {
    limparEstadoDiario();
    limparDiarioCicloSequenciaConcluido();
    limparDiarioRetomarPosLogin();
    limparTodosProgressosDiarioLogins();
    console.log('[Diario] Estado da rotina diaria limpo — recarregue ou navegue para reiniciar.');
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
  };

  window.botDiarioSemCacadas = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Diario] Pos-diario sem caçadas: ' + (diarioSemCacadasPosRotina() ? 'sim (rotaciona)' : 'nao (vai ao portao)'));
      return diarioSemCacadasPosRotina();
    }
    gravarDiarioSemCacadasParam(ligar ? '1' : '0');
    console.log('[Diario] Pos-diario sem caçadas: ' + (diarioSemCacadasPosRotina() ? 'sim (rotaciona)' : 'nao (vai ao portao)'));
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return diarioSemCacadasPosRotina();
  };

  window.botAtacarAutomacoesPrep = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Autom Prep] ' + descreverAtacarAutomacoes());
      return atacarAutomacoesPrepAtivo();
    }
    if (ligar) {
      gravarAtacarAutomacoesParam('0');
      limparAutomPrepCicloConcluido();
    }
    gravarAtacarAutomacoesPrepParam(ligar ? '1' : '0');
    if (ligar && diarioGerenciadaAtivo()) {
      console.warn('[Autom Prep] Diario gerenciada tambem ativo — considere botDiarioGerenciada(false).');
    }
    if (ligar && !obterModoAba()) {
      gravarModoAba('cacadas');
      console.log('[Autom Prep] Modo cacadas ativado — recarregando pagina...');
      location.reload();
      return true;
    }
    console.log('[Autom Prep] ' + descreverAtacarAutomacoes());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return atacarAutomacoesPrepAtivo();
  };

  window.botAtacarAutomacoes = function(ligar) {
    if (arguments.length === 0) {
      console.log('[Autom Atacante] ' + descreverAtacarAutomacoes());
      return atacarAutomacoesAtacanteAtivo();
    }
    if (ligar) gravarAtacarAutomacoesPrepParam('0');
    gravarAtacarAutomacoesParam(ligar ? '1' : '0');
    if (ligar && !obterModoAba()) {
      gravarModoAba('cacadas');
      console.log('[Autom Atacante] Modo cacadas ativado — recarregando pagina...');
      location.reload();
      return true;
    }
    console.log('[Autom Atacante] ' + descreverAtacarAutomacoes());
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
    return atacarAutomacoesAtacanteAtivo();
  };

  window.botAutomPrepReset = function() {
    limparTodosProgressosAutomPrep();
    console.log('[Autom Prep] Estado limpo — recarregue ou va para /automacao para reiniciar.');
    if (typeof exibirModoAbaServerID === 'function') exibirModoAbaServerID();
  };

  publicarBuildCacadasNaPagina();

  if ((function() {
    try {
      var p = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      return p.indexOf('ranking') !== -1;
    } catch (e) {}
    return false;
  })()) {
    var missaoNovoRanking = false;
    try {
      missaoNovoRanking = localStorage.getItem('BOT_MISSAO_NOVO_ATIVO') === '1' ||
        !!sessionStorage.getItem('BOT_MISSAO_NOVO_SLOT');
    } catch (e) {}
    if (!missaoNovoRanking) {
      console.log('[Script Caçadas] Pagina /ranking — sem acao (use bot-ranking.js + botRankingScan()).');
      return;
    }
  }

  try {
    if (sessionStorage.getItem(BOT_KILL_KEY) === '1') {
      console.log('[Bot] Pausado nesta aba — botLigar() para reativar.');
      return;
    }
  } catch (e) {}

  var modoInicial = obterModoAba();
  var ehPaginaLoginInicial = !!document.getElementById('login');
  var ehPaginaStatusInicial = (window.location.pathname || '').indexOf('status') !== -1;
  var ehStatusPosLogin = ehPaginaStatusInicial && ehReferrerPosLogin();

  if (!modoInicial && (ehPaginaLoginInicial || ehPaginaStatusInicial || ehStatusPosLogin)) {
    modoInicial = recuperarModoAbaNaPaginaLogin('inicio') || recuperarModoAbaPosLogin();
  }

  if (!modoInicial && !ehPaginaLoginInicial && !ehStatusPosLogin) {
    if (diarioGerenciadaAtivo()) {
      console.log('[Diario] BOT_MODO_ABA vazio — ativando modo cacadas automaticamente para rotina diaria.');
      gravarModoAba('cacadas');
      modoInicial = 'cacadas';
    } else {
      var missaoNovoOn = false;
      try { missaoNovoOn = localStorage.getItem('BOT_MISSAO_NOVO_ATIVO') === '1'; } catch (e) {}
      if (missaoNovoOn) {
        console.log('[Missao Novo] Modo missao ativo — script segue sem bot_modo=cacadas.');
        modoInicial = 'cacadas';
      } else {
        logDiagnosticoModo('cacadas');
        console.log('[Script Caçadas] Sem BOT_MODO_ABA — sem acao (modo atual: vazio). Use /mensagens?tab=relatorios_ataque&bot_modo=cacadas ou /invasor?bot_modo=invasor.');
        return;
      }
    }
  }

  if (modoInicial && modoInicial !== 'cacadas' && modoInicial !== 'invasor') {
    return;
  }

  instalarConfirmAutoOkMissao();

  if (ehPaginaLoginInicial && !modoInicial) {
    console.log('[Script Caçadas] Tela de login — tentando credenciais do navegador...');
  }

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = TEMPO_RECUPERACAO_FALHA;
  var TEMPO_TIMEOUT_CAPTCHA = 300000; // 5 min — reload apos OCR auto esgotado
  var CAPTCHA_OCR_AUTO_DELAY_MIN_MS = 10000; // 10s
  var CAPTCHA_OCR_AUTO_DELAY_MAX_MS = 30000; // 30s
  var TEMPO_ESPERA_APOS_OCR_ESGOTADO_MS = 25000; // espera o ultimo painel OCR responder
  var CAPTCHA_OCR_AUTO_MAX_NORMAL = 3;
  var CAPTCHA_OCR_AUTO_MAX_GERENCIADA = 5;
  var BOT_CAPTCHA_OCR_AUTO_KEY = 'BOT_CAPTCHA_OCR_AUTO_TENTATIVAS';
  var COMANDO_ZERAR_OCR_AUTO = 'botZerarOcrAuto()';
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var URL_STATUS = 'https://shadowofshinobi.com/status';
  var URL_MISSOES = 'https://shadowofshinobi.com/missoes';
  var URL_RANKING_MISSAO = 'https://shadowofshinobi.com/ranking?view=personagens&vila=geral&ranking=0';
  var BOT_MISSAO_NOVO_KEY = 'BOT_MISSAO_NOVO_ATIVO';
  var BOT_MISSAO_NOVO_ESTADO_KEY = 'BOT_MISSAO_NOVO_ESTADO';
  var BOT_MISSAO_NOVO_PARAMS_KEY = 'BOT_MISSAO_NOVO_PARAMS';
  var BOT_MISSAO_NOVO_SLOT_KEY = 'BOT_MISSAO_NOVO_SLOT';
  var BOT_MISSAO_NOVO_TS_ATAQUE_KEY = 'BOT_MISSAO_NOVO_TS_ATAQUE';
  var BOT_MISSAO_NOVO_COMBATE_KEY = 'BOT_MISSAO_NOVO_COMBATE';
  var BOT_MISSAO_NOVO_ALVO_KEY = 'BOT_MISSAO_NOVO_ALVO';
  var BOT_MISSAO_NOVO_CANDIDATOS_KEY = 'BOT_MISSAO_NOVO_CANDIDATOS';
  var BOT_MISSAO_NOVO_CAND_IDX_KEY = 'BOT_MISSAO_NOVO_CAND_IDX';
  var BOT_MISSAO_NOVO_RANKING_OFF_KEY = 'BOT_MISSAO_NOVO_RANKING_OFF';
  var BOT_MISSAO_NOVO_RANKING_ULTIMO_KEY = 'BOT_MISSAO_NOVO_RANKING_ULTIMO';
  var BOT_MISSAO_NOVO_POSICAO_KEY = 'BOT_MISSAO_NOVO_POSICAO';
  var BOT_MISSAO_NOVO_ATACADOS_KEY = 'BOT_MISSAO_NOVO_ATACADOS';
  var BOT_MISSAO_NOVO_FALHAS_KEY = 'BOT_MISSAO_NOVO_FALHAS';
  var MISSAO_NOVO_FALHA_TTL_MS = 30 * 60 * 1000;
  var BOT_MISSAO_NOVO_HP_RETORNO_KEY = 'BOT_MISSAO_NOVO_HP_RETORNO';
  var BOT_MISSAO_NOVO_COLETAR_REL_KEY = 'BOT_MISSAO_NOVO_COLETAR_REL';
  var BOT_MISSAO_NOVO_VALIDAR_REL_KEY = 'BOT_MISSAO_NOVO_VALIDAR_REL';
  var BOT_MISSAO_NOVO_RANK_SCAN_KEY = 'BOT_MISSAO_NOVO_RANK_SCAN';
  var BOT_MISSAO_NOVO_SCAN_INICIAL_KEY = 'BOT_MISSAO_NOVO_SCAN_INICIAL';
  var BOT_MISSAO_NOVO_RETRY_TS_KEY = 'BOT_MISSAO_NOVO_RETRY_TS';
  var BOT_MISSAO_NOVO_ATAQUE1_KEY = 'BOT_MISSAO_NOVO_ATAQUE1';
  var BOT_MISSAO_NOVO_ATAQUE2_KEY = 'BOT_MISSAO_NOVO_ATAQUE2';
  var BOT_MISSAO_NOVO_ATAQUE3_KEY = 'BOT_MISSAO_NOVO_ATAQUE3';
  var BOT_MISSAO_NOVO_ESPERA_SLOT_KEY = 'BOT_MISSAO_NOVO_ESPERA_SLOT';
  var BOT_MISSAO_NOVO_ESPERA_TS_KEY = 'BOT_MISSAO_NOVO_ESPERA_TS';
  var MISSAO_NOVO_ATAQUE2_RESTANTE_SEG = 45 * 60;
  var MISSAO_NOVO_ATAQUE3_RESTANTE_SEG = 15 * 60;
  var MISSAO_NOVO_ESPERA_HUMANA_MIN_SEG = 60;
  var MISSAO_NOVO_ESPERA_HUMANA_MAX_SEG = 180;
  var MISSAO_NOVO_DEFAULTS = {
    horas: 1,
    diffAlvo: 19,
    minDiff: 5,
    maxRyous: 200000000,
    limiteMinSegundoAtaque: 30
  };
  var MISSAO_NOVO_PASSO_RANKING = 50;
  var MISSAO_NOVO_MAX_SCAN_RANKING = 40;
  var MISSAO_NOVO_RETRY_RANKING_SEG = 300;
  var URL_AUTOMACAO = 'https://shadowofshinobi.com/automacao';
  var URL_EVENTOS = 'https://shadowofshinobi.com/eventos';
  var URL_RAID = 'https://shadowofshinobi.com/raid';
  var URL_ANIMAL_MEUS = 'https://shadowofshinobi.com/animal?aba=meus';
  var URL_ANIMAL_LOJA = 'https://shadowofshinobi.com/animal?aba=loja';
  var URL_RELATORIOS_ATAQUE = 'https://shadowofshinobi.com/mensagens?tab=relatorios_ataque';
  var URL_RELATORIOS_DEFESA = 'https://shadowofshinobi.com/mensagens?tab=relatorios';
  var URL_QUESTS = 'https://shadowofshinobi.com/quests';
  var URL_MERCADO_ICHIRAKU = 'https://shadowofshinobi.com/mercado?aba=loja&secao=itens';
  var AUTOMACAO_COORD_FB_PATH = 'automacao_coord';
  var AUTOMACAO_FILA_FB_PATH = 'automacao_fila';
  var AUTOM_PREP_PENALIDADE_MS = 30 * 60 * 1000;
  var AUTOM_PREP_READY_TIMEOUT_MS = 3 * 60 * 1000;
  var AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS = 60 * 1000;
  var BOT_AUTOM_PREP_FASE_KEY = 'BOT_AUTOM_PREP_FASE';
  var BOT_AUTOM_PREP_CONTA_KEY = 'BOT_AUTOM_PREP_CONTA';
  var BOT_AUTOM_PREP_REL_STEP_KEY = 'BOT_AUTOM_PREP_REL_STEP';
  var BOT_AUTOM_PREP_ANIMAL_SUB_KEY = 'BOT_AUTOM_PREP_ANIMAL_SUB';
  var BOT_AUTOM_PREP_ANIMAL_IDX_KEY = 'BOT_AUTOM_PREP_ANIMAL_IDX';
  var BOT_AUTOM_PREP_ANIMAL_BS_KEY = 'BOT_AUTOM_PREP_ANIMAL_BS';
  var BOT_HP_CURAR_AUTOM_PREP_KEY = 'BOT_HP_CURAR_AUTOM_PREP';
  var BOT_AUTOM_COMBATE_KEY = 'BOT_AUTOM_COMBATE';
  var BOT_AUTOM_ATACANTE_ALVO_KEY = 'BOT_AUTOM_ATACANTE_ALVO';
  var BOT_AUTOM_PREP_FEITAS_KEY = 'BOT_AUTOM_PREP_FEITAS';
  var BOT_AUTOM_PREP_PRESENTES_KEY = 'BOT_AUTOM_PREP_PRESENTES';
  var BOT_AUTOM_PREP_LOGINS_FEITOS_KEY = 'BOT_AUTOM_PREP_LOGINS_FEITOS';
  var BOT_AUTOM_PREP_CICLO_CONCLUIDO_KEY = 'BOT_AUTOM_PREP_CICLO_CONCLUIDO';
  var BOT_DIARIO_FASE_KEY = 'BOT_DIARIO_FASE';
  var BOT_DIARIO_ANIMAL_SUB_KEY = 'BOT_DIARIO_ANIMAL_SUB';
  var BOT_DIARIO_ANIMAL_IDX_KEY = 'BOT_DIARIO_ANIMAL_IDX';
  var BOT_DIARIO_ANIMAL_BS_KEY = 'BOT_DIARIO_ANIMAL_BS';
  var BOT_DIARIO_RAID_COMBATE_KEY = 'BOT_DIARIO_RAID_COMBATE';
  var BOT_DIARIO_RAID_DERROTA_KEY = 'BOT_DIARIO_RAID_DERROTA';
  var BOT_HP_CURAR_ATIVO_KEY = 'BOT_HP_CURAR_ATIVO';
  var BOT_HP_CURAR_RAID_KEY = 'BOT_HP_CURAR_RAID';
  var BOT_HP_SNAPSHOT_KEY = 'BOT_HP_SNAPSHOT';
  var BOT_HP_COMPRAR_MERCADO_KEY = 'BOT_HP_COMPRAR_MERCADO';
  var BOT_HP_COMPRAR_AVISADO_KEY = 'BOT_HP_COMPRAR_AVISADO';
  var BOT_HP_CURAR_MISSAO_NOVO_KEY = 'BOT_HP_CURAR_MISSAO_NOVO';
  var ICHIRAKU_COMPRA_QTD_ALVO = 30;
  var BOT_DOUJUTSU_ATIVAR_KEY = 'BOT_DOUJUTSU_ATIVAR';
  var BOT_INVASOR_EVENTO_CACHE_KEY = 'BOT_INVASOR_EVENTO_CACHE';
  var BOT_INVASOR_MORTO_AVISO_KEY = 'BOT_INVASOR_MORTO_AVISO';
  var DOUJUTSU_CUSTO_RYOUS = 10000;
  var HP_MINIMO_ATACAR_RATIO = 0.5;
  var HP_MINIMO_FIREBASE_FILA_RATIO = 0.8;
  var HP_MINIMO_MISSAO_NOVO_RATIO = 0.9;
  var HP_MINIMO_RAID = 100;

  function obterHpMinimoAtacarRatio() {
    if (cacadasFirebaseFilaFlagAtiva()) return HP_MINIMO_FIREBASE_FILA_RATIO;
    return HP_MINIMO_ATACAR_RATIO;
  }

  function descreverHpMinimoAtacar() {
    var pct = Math.round(obterHpMinimoAtacarRatio() * 100);
    if (cacadasFirebaseFilaFlagAtiva()) {
      return pct + '% (Firebase fila — Ichiraku /status)';
    }
    return pct + '% (Ichiraku /status)';
  }
  var RESERVA_RYOUS_MIN_INVASOR_VIVO = 100000;
  var INVASOR_VIVO_POLL_MS = 60000;
  var INVASOR_POS_BOSS_ESPERA_MIN_MS = 3 * 60 * 1000;
  var INVASOR_POS_BOSS_ESPERA_MAX_MS = 6 * 60 * 1000;
  var INVASOR_EVENTO_CACHE_TTL_MS = 90000;
  var BOT_INVASOR_AGUARDANDO_BOSS_KEY = 'BOT_INVASOR_AGUARDANDO_BOSS';
  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var BOT_CACADAS_GATE_KEY = 'BOT_CACADAS_GATE_PASS';
  var BOT_CACADAS_MODO_KEY = 'BOT_CACADAS_MODO';
  var BOT_CACADAS_ALVO_NOME_KEY = 'BOT_CACADAS_ALVO_NOME';
  var BOT_CACADAS_TETO_OCIOSO_KEY = 'BOT_CACADAS_TETO_OCIOSO';
  var BOT_CACADAS_FORCAR_BLACKLIST_KEY = 'BOT_CACADAS_FORCAR_BLACKLIST';
  var BOT_ROTACAO_CICLO_KEY = 'BOT_ROTACAO_CICLO_PENDENTE';
  var BOT_ROTACAO_ASSUMIDA_KEY = 'BOT_AUTO_ROT_ASSUMIDA';
  var BOT_ROTACAO_ULTIMA_NOME_KEY = 'BOT_ROTACAO_ULTIMA_NOME';
  var BOT_ROTACAO_ULTIMA_ID_KEY = 'BOT_ROTACAO_ULTIMA_ID';
  var BOT_ROTACAO_RETOMAR_KEY = 'BOT_ROTACAO_RETOMAR';
  var BOT_ROTACAO_RETOMAR_NOME_KEY = 'BOT_ROTACAO_RETOMAR_NOME';
  var BOT_ROTACAO_RETOMAR_ID_KEY = 'BOT_ROTACAO_RETOMAR_ID';
  var BOT_DIARIO_CICLO_CONCLUIDO_KEY = 'BOT_DIARIO_CICLO_CONCLUIDO';
  var BOT_DIARIO_SEQ_PRESENTES_KEY = 'BOT_DIARIO_SEQ_PRESENTES';
  var BOT_DIARIO_CONTAS_FEITAS_KEY = 'BOT_DIARIO_CONTAS_FEITAS';
  var DIARIO_LOGINS_SEQUENCIA = ['Shiroe', 'Shizuo', 'Sora'];
  var DIARIO_DISCORD_LOGIN = 'Sora';
  var BOT_DIARIO_RETOMAR_POS_LOGIN_KEY = 'BOT_DIARIO_RETOMAR_POS_LOGIN';
  var BOT_DIARIO_LOGIN_PROGRESS_KEY = 'BOT_DIARIO_LOGIN_PROGRESS';
  var BOT_DIARIO_LOGINS_SEQ_FEITOS_KEY = 'BOT_DIARIO_LOGINS_SEQ_FEITOS';
  var DISCORD_WEBHOOK_CAPTCHA = '';
  var DISCORD_WEBHOOK_CACADAS = '';
  var DISCORD_WEBHOOK_INVASOR = '';
  var INVASOR_MORTO_AVISO_FB_PATH = 'invasor_morto_aviso';
  var RANKING_RYOUS_FILA_FB_PATH = 'ranking_ryous_fila';
  var RANKING_RYOUS_FILA_TTL_MS = 3600000;
  var ENERGIA_VITAL_BAIXA_RETRY_MS = 10 * 60000;
  var BOT_CACADAS_FB_SKIP_KEY = 'BOT_CACADAS_FB_SKIP';
  var BOT_CACADAS_BL_SKIP_KEY = 'BOT_CACADAS_BL_SKIP';
  var BOT_CACADAS_NOME_FALHAS_KEY = 'BOT_CACADAS_NOME_FALHAS';
  var MAX_TENTATIVAS_CACADA_POR_NOME = 3;
  var FIREBASE_WEBHOOKS_PATH = 'config/discordWebhooks';
  var DISCORD_ALVO_IGNORADO_SILENCIOSO = true; // flags 4096 = sem @ping/notificacao push
  var URL_PAINEL_BASE = 'https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html';
  var captchaJaNotificado = false;
  var atacarJaProcessado = false;
  var BOT_ULTIMO_ALVO_KEY = 'BOT_ULTIMO_ALVO_CACADAS';
  var BOT_COMBATE_NOTIFICADO_KEY = 'BOT_COMBATE_NOTIFICADO';
  var timerCaptchaTimeout = null;
  var timerCaptchaOcrAuto = null;
  var timerCaptchaPosTentativas = null;
  var captchaRespostaProcessando = false;
  var loginJaEnviado = false;
  var portaoRelatoriosAgendado = false;
  var invasorVivoPainel = null;
  var missaoCancelamentoClicado = false;
  var automacaoAssumirEmAndamento = false;

  function marcarRotacaoCicloPendente() {
    try { sessionStorage.setItem(BOT_ROTACAO_CICLO_KEY, '1'); } catch (e) {}
  }

  function consumirRotacaoCicloPendente() {
    try {
      if (sessionStorage.getItem(BOT_ROTACAO_CICLO_KEY) === '1') {
        sessionStorage.removeItem(BOT_ROTACAO_CICLO_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function marcarContaAutomacaoAssumida() {
    try { sessionStorage.setItem(BOT_ROTACAO_ASSUMIDA_KEY, '1'); } catch (e) {}
    limparTentativasCacadaPorNome();
    limparSkipBlacklistCacadas();
  }

  function consumirContaAutomacaoAssumida() {
    try {
      if (sessionStorage.getItem(BOT_ROTACAO_ASSUMIDA_KEY) === '1') {
        sessionStorage.removeItem(BOT_ROTACAO_ASSUMIDA_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function salvarUltimaGerenciadaSnapshot(nome, contaId) {
    try {
      if (nome) sessionStorage.setItem(BOT_ROTACAO_ULTIMA_NOME_KEY, nome);
      if (contaId) sessionStorage.setItem(BOT_ROTACAO_ULTIMA_ID_KEY, String(contaId));
    } catch (e) {}
  }

  function lerUltimaGerenciadaSnapshot() {
    try {
      var nome = sessionStorage.getItem(BOT_ROTACAO_ULTIMA_NOME_KEY) || '';
      var contaId = sessionStorage.getItem(BOT_ROTACAO_ULTIMA_ID_KEY) || '';
      if (!nome && !contaId) return null;
      return { nome: nome, contaId: contaId };
    } catch (e) {}
    return null;
  }

  function atualizarUltimaGerenciadaSnapshot() {
    if (!estaEmContaGerenciada()) return;
    if (!rotacaoAutomacaoAtiva() && !diarioGerenciadaAtivo()) return;
    var nome = extrairNomeUsuarioLogado();
    if (!nome) return;
    salvarUltimaGerenciadaSnapshot(nome, '');
  }

  function precisaRetomarGerenciada() {
    try { return sessionStorage.getItem(BOT_ROTACAO_RETOMAR_KEY) === '1'; } catch (e) {}
    return false;
  }

  function limparRetomarGerenciada() {
    try {
      sessionStorage.removeItem(BOT_ROTACAO_RETOMAR_KEY);
      sessionStorage.removeItem(BOT_ROTACAO_RETOMAR_NOME_KEY);
      sessionStorage.removeItem(BOT_ROTACAO_RETOMAR_ID_KEY);
    } catch (e) {}
  }

  function marcarRetomarGerenciadaPosLogout() {
    if (!rotacaoAutomacaoAtiva() && !diarioGerenciadaAtivo()) return;
    var snap = lerUltimaGerenciadaSnapshot();
    if (!snap || (!snap.nome && !snap.contaId)) return;
    try {
      sessionStorage.setItem(BOT_ROTACAO_RETOMAR_KEY, '1');
      if (snap.nome) sessionStorage.setItem(BOT_ROTACAO_RETOMAR_NOME_KEY, snap.nome);
      if (snap.contaId) sessionStorage.setItem(BOT_ROTACAO_RETOMAR_ID_KEY, snap.contaId);
      console.warn('[Automacao] Logout — retomar gerenciada pendente: ' +
        (snap.nome || '?') + (snap.contaId ? ' (id ' + snap.contaId + ')' : ''));
    } catch (e) {}
  }

  function precisaAssumirAutomacaoPosPrincipal() {
    if (diarioGerenciadaAtivo() && diarioCicloSequenciaConcluido()) return false;
    if (atacarAutomacoesPrepAtivo() && !automPrepCicloSequenciaConcluido()) return true;
    return rotacaoAutomacaoAtiva() || precisaRetomarGerenciada() || diarioGerenciadaAtivo();
  }

  function diarioCicloSequenciaConcluido() {
    try { return sessionStorage.getItem(BOT_DIARIO_CICLO_CONCLUIDO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarDiarioCicloSequenciaConcluido() {
    try { sessionStorage.setItem(BOT_DIARIO_CICLO_CONCLUIDO_KEY, '1'); } catch (e) {}
  }

  function limparDiarioCicloSequenciaConcluido() {
    try { sessionStorage.removeItem(BOT_DIARIO_CICLO_CONCLUIDO_KEY); } catch (e) {}
  }

  function diarioProgLocalKey(suffix) {
    return 'BOT_DIARIO_' + normalizarLoginDiarioSequencia(obterUsuarioLogin()) + '_' + suffix;
  }

  function limparProgressoDiarioLogin(login) {
    var chave = 'BOT_DIARIO_' + normalizarLoginDiarioSequencia(login || obterUsuarioLogin()) + '_';
    try {
      localStorage.removeItem(chave + 'FEITAS');
      localStorage.removeItem(chave + 'PRESENTES');
      localStorage.removeItem(chave + 'FASE');
    } catch (e) {}
    if (!login || normalizarLoginDiarioSequencia(login) === normalizarLoginDiarioSequencia(obterUsuarioLogin())) {
      try {
        sessionStorage.removeItem(BOT_DIARIO_CONTAS_FEITAS_KEY);
        sessionStorage.removeItem(BOT_DIARIO_SEQ_PRESENTES_KEY);
        sessionStorage.removeItem(BOT_DIARIO_FASE_KEY);
      } catch (e) {}
    }
  }

  function limparTodosProgressosDiarioLogins() {
    for (var i = 0; i < DIARIO_LOGINS_SEQUENCIA.length; i++) {
      limparProgressoDiarioLogin(DIARIO_LOGINS_SEQUENCIA[i]);
    }
    try { localStorage.removeItem(BOT_DIARIO_LOGINS_SEQ_FEITOS_KEY); } catch (e) {}
    try { sessionStorage.removeItem(BOT_DIARIO_LOGIN_PROGRESS_KEY); } catch (e) {}
  }

  function sincronizarLoginDiarioProgresso() {
    var login = normalizarLoginDiarioSequencia(obterUsuarioLogin());
    try {
      var salvo = sessionStorage.getItem(BOT_DIARIO_LOGIN_PROGRESS_KEY) || '';
      if (salvo && salvo !== login) {
        limparProgressoDiarioLogin(salvo);
        limparEstadoDiario();
      }
      sessionStorage.setItem(BOT_DIARIO_LOGIN_PROGRESS_KEY, login);
    } catch (e) {}
  }

  function lerLoginsSequenciaDiarioFeitos() {
    try {
      var raw = localStorage.getItem(BOT_DIARIO_LOGINS_SEQ_FEITOS_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  }

  function marcarLoginSequenciaDiarioFeito(login) {
    if (!login) return;
    var norm = normalizarLoginDiarioSequencia(login);
    var feitos = lerLoginsSequenciaDiarioFeitos();
    if (feitos.indexOf(norm) === -1) feitos.push(norm);
    try { localStorage.setItem(BOT_DIARIO_LOGINS_SEQ_FEITOS_KEY, JSON.stringify(feitos)); } catch (e) {}
  }

  function persistirFeitasDiario(feitas) {
    var json = JSON.stringify(feitas || []);
    try {
      sessionStorage.setItem(BOT_DIARIO_CONTAS_FEITAS_KEY, json);
      localStorage.setItem(diarioProgLocalKey('FEITAS'), json);
    } catch (e) {}
  }

  function limparContasDiarioFeitas() {
    persistirFeitasDiario([]);
  }

  function marcarContaDiarioFeita(nome) {
    if (!nome) return;
    sincronizarLoginDiarioProgresso();
    var norm = normalizarNomeCacadas(nome);
    var feitas = lerContasDiarioFeitas();
    if (feitas.indexOf(norm) === -1) feitas.push(norm);
    persistirFeitasDiario(feitas);
  }

  function lerContasDiarioFeitas() {
    sincronizarLoginDiarioProgresso();
    try {
      var raw = sessionStorage.getItem(BOT_DIARIO_CONTAS_FEITAS_KEY);
      if (!raw) raw = localStorage.getItem(diarioProgLocalKey('FEITAS'));
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          try { sessionStorage.setItem(BOT_DIARIO_CONTAS_FEITAS_KEY, raw); } catch (e) {}
          return arr;
        }
      }
    } catch (e) {}
    return [];
  }

  function salvarSequenciaDiarioPresentes(contas) {
    sincronizarLoginDiarioProgresso();
    var nomes = (contas || []).map(function(c) { return normalizarNomeCacadas(c.nome); });
    var json = JSON.stringify(nomes);
    try {
      sessionStorage.setItem(BOT_DIARIO_SEQ_PRESENTES_KEY, json);
      localStorage.setItem(diarioProgLocalKey('PRESENTES'), json);
    } catch (e) {}
    return contas || [];
  }

  function lerSequenciaDiarioPresentesNorm() {
    sincronizarLoginDiarioProgresso();
    try {
      var raw = sessionStorage.getItem(BOT_DIARIO_SEQ_PRESENTES_KEY);
      if (!raw) raw = localStorage.getItem(diarioProgLocalKey('PRESENTES'));
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) {
          try { sessionStorage.setItem(BOT_DIARIO_SEQ_PRESENTES_KEY, raw); } catch (e) {}
          return arr;
        }
      }
    } catch (e) {}
    return [];
  }

  function inicializarProgressoDiarioDesdeGerenciadaAtual(contas) {
    sincronizarLoginDiarioProgresso();
    if (lerContasDiarioFeitas().length) return false;
    if (!estaEmContaGerenciada()) return false;

    var nomeAtual = extrairNomeUsuarioLogado();
    if (!nomeAtual) return false;

    if (contas && contas.length) salvarSequenciaDiarioPresentes(contas);
    var presentes = lerSequenciaDiarioPresentesNorm();
    if (!presentes.length) return false;

    var normAtual = normalizarNomeCacadas(nomeAtual);
    var idxAtual = -1;
    for (var i = 0; i < presentes.length; i++) {
      if (presentes[i] === normAtual) { idxAtual = i; break; }
    }
    if (idxAtual <= 0) return false;

    console.warn('[Diario] Inicio/retomada na gerenciada logada: ' + nomeAtual +
      ' (anteriores marcadas como concluidas).');
    var feitas = [];
    for (var j = 0; j < idxAtual; j++) feitas.push(presentes[j]);
    persistirFeitasDiario(feitas);
    return true;
  }

  function verificarDiarioRetomarPosInterrupcao() {
    if (!diarioGerenciadaAtivo() || diarioCicloSequenciaConcluido()) return false;
    if (document.getElementById('login')) return false;

    sincronizarLoginDiarioProgresso();

    if (lerSequenciaDiarioPresentesNorm().length && cicloDiarioTodasContasFeitas()) {
      console.log('[Diario] Retomada — todas gerenciadas do login ' + obterUsuarioLogin() +
        ' concluidas, seguindo sequencia...');
      concluirCicloDiarioCompleto(extrairNomeUsuarioLogado() || obterUsuarioExibicao());
      return true;
    }

    if (estaEmContaGerenciada() && obterFaseDiario()) {
      console.log('[Diario] Retomada — fase ' + obterFaseDiario() + ' em ' +
        (extrairNomeUsuarioLogado() || '?') + '.');
      return redirecionarParaDiarioGerenciada('retomada pos-interrupcao');
    }

    if (estaEmContaGerenciada() && gerenciadaEhProximaDiarioPendente() && !obterFaseDiario()) {
      console.log('[Diario] Retomada — gerenciada pendente logada: ' +
        (extrairNomeUsuarioLogado() || '?') + '.');
      return redirecionarParaDiarioGerenciada('retomada gerenciada logada');
    }

    return false;
  }

  function loginDiarioDeveAvisarDiscord() {
    return normalizarNomeCacadas(obterUsuarioLogin()) === normalizarNomeCacadas(DIARIO_DISCORD_LOGIN);
  }

  function normalizarLoginDiarioSequencia(nome) {
    return normalizarNomeCacadas(nome);
  }

  function obterIndiceLoginDiarioSequencia(login) {
    var norm = normalizarLoginDiarioSequencia(login);
    for (var i = 0; i < DIARIO_LOGINS_SEQUENCIA.length; i++) {
      if (normalizarLoginDiarioSequencia(DIARIO_LOGINS_SEQUENCIA[i]) === norm) return i;
    }
    return -1;
  }

  function obterProximoLoginDiarioSequencia(loginAtual) {
    var idx = obterIndiceLoginDiarioSequencia(loginAtual);
    if (idx === -1 || idx >= DIARIO_LOGINS_SEQUENCIA.length - 1) return '';
    return DIARIO_LOGINS_SEQUENCIA[idx + 1];
  }

  function marcarDiarioRetomarPosLogin() {
    try { sessionStorage.setItem(BOT_DIARIO_RETOMAR_POS_LOGIN_KEY, '1'); } catch (e) {}
  }

  function limparDiarioRetomarPosLogin() {
    try { sessionStorage.removeItem(BOT_DIARIO_RETOMAR_POS_LOGIN_KEY); } catch (e) {}
  }

  function consumirDiarioRetomarPosLogin() {
    try {
      if (sessionStorage.getItem(BOT_DIARIO_RETOMAR_POS_LOGIN_KEY) === '1') {
        sessionStorage.removeItem(BOT_DIARIO_RETOMAR_POS_LOGIN_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function diarioAssumirPermitido() {
    return diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva() && !diarioCicloSequenciaConcluido();
  }

  function clicarLogoutJogoSeExistir() {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = (links[i].getAttribute('href') || '').toLowerCase();
      var txt = normalizarTextoCombate(links[i].innerText || links[i].textContent || '');
      if (href.indexOf('logout') !== -1 || href.indexOf('sair') !== -1 ||
          txt === 'sair' || txt.indexOf('encerrar sess') !== -1) {
        links[i].click();
        return true;
      }
    }
    var forms = document.querySelectorAll('form[action]');
    for (var j = 0; j < forms.length; j++) {
      var action = (forms[j].getAttribute('action') || '').toLowerCase();
      if (action.indexOf('logout') !== -1 || action.indexOf('sair') !== -1) {
        var btn = forms[j].querySelector('input[type="submit"], button[type="submit"]');
        if (btn) btn.click();
        else forms[j].submit();
        return true;
      }
    }
    return false;
  }

  function irParaLoginDiarioMesmaAba(proximoLogin) {
    limparRetomarGerenciada();
    if (proximoLogin) gravarUsuarioLoginParam(proximoLogin);
    recarregarCredenciaisLogin();
    marcarDiarioRetomarPosLogin();
    marcarRotacaoCicloPendente();

    var url = montarUrlLoginComParams();
    if (clicarLogoutJogoSeExistir()) {
      console.log('[Diario] Logout — re-login como ' + (proximoLogin || '?') + ' na mesma aba...');
      if (window.__BOT_RECOVERY__) {
        window.__BOT_RECOVERY__.salvar(url);
      } else {
        try { window.name = '__BOT_RECUP__:' + url; } catch (e) {}
      }
      return;
    }

    console.log('[Diario] Indo para login como ' + (proximoLogin || '?') + ' na mesma aba...');
    try { location.replace(url); } catch (e) { location.href = url; }
  }

  function encerrarBotDiarioGerenciadaAutomatico() {
    console.log(
      '%c[Diario] ROTINA DIARIA FINALIZADA — sequencia completa (' +
      DIARIO_LOGINS_SEQUENCIA.join(' -> ') + ').',
      'color:#2ecc71;font-weight:bold'
    );
    console.log('[Diario] Encerrando automaticamente: botDiarioReset(), botRotacaoAutomacao(false), botDiarioGerenciada(false)...');

    if (typeof window.botDiarioReset === 'function') {
      window.botDiarioReset();
      console.log('[Diario] botDiarioReset() executado.');
    }
    if (typeof window.botRotacaoAutomacao === 'function') {
      window.botRotacaoAutomacao(false);
      console.log('[Diario] botRotacaoAutomacao(false) executado.');
    }
    if (typeof window.botDiarioGerenciada === 'function') {
      window.botDiarioGerenciada(false);
      console.log('[Diario] botDiarioGerenciada(false) executado.');
    }

    console.log('[Diario] Encerramento automatico concluido — rotina diaria e rotacao desligadas.');
  }

  function rotacionarDiarioProximoLoginMesmaAba() {
    var login = obterUsuarioLogin();
    var proximo = obterProximoLoginDiarioSequencia(login);

    if (!proximo) {
      marcarDiarioCicloSequenciaConcluido();
      console.log('%c[Diario] Sequencia completa na mesma aba (' +
        DIARIO_LOGINS_SEQUENCIA.join(' -> ') + ').', 'color:#2ecc71;font-weight:bold');
      encerrarBotDiarioGerenciadaAutomatico();
      return;
    }

    console.log('%c[Diario] Login ' + login + ' concluido — proximo na mesma aba: ' + proximo,
      'color:#2ecc71;font-weight:bold');
    irParaLoginDiarioMesmaAba(proximo);
  }

  function gerenciadaEhProximaDiarioPendente() {
    if (!estaEmContaGerenciada()) return true;
    if (obterFaseDiario()) return true;
    var presentes = lerSequenciaDiarioPresentesNorm();
    if (!presentes.length) return false;
    var nome = extrairNomeUsuarioLogado();
    if (!nome) return false;
    var norm = normalizarNomeCacadas(nome);
    var feitas = lerContasDiarioFeitas();
    for (var i = 0; i < presentes.length; i++) {
      if (feitas.indexOf(presentes[i]) === -1) {
        return presentes[i] === norm;
      }
    }
    return false;
  }

  function redirecionarAutomacaoDiarioCiclo(motivo) {
    console.log('[Diario] ' + motivo + ' — indo para /automacao...');
    marcarRotacaoCicloPendente();
    window.location.href = URL_AUTOMACAO;
    return true;
  }

  function cicloDiarioTodasContasFeitas() {
    var presentes = lerSequenciaDiarioPresentesNorm();
    var feitas = lerContasDiarioFeitas();
    if (!presentes.length) return false;
    for (var i = 0; i < presentes.length; i++) {
      if (feitas.indexOf(presentes[i]) === -1) return false;
    }
    return true;
  }

  function proximaContaDiarioSequenciaPendente(contas) {
    var feitas = lerContasDiarioFeitas();
    for (var i = 0; i < contas.length; i++) {
      var norm = normalizarNomeCacadas(contas[i].nome);
      if (feitas.indexOf(norm) === -1) return contas[i];
    }
    return null;
  }

  function escolherProximaContaDiarioSequencia(contas) {
    if (!contas.length) {
      console.warn('[Diario] Nenhuma gerenciada em /automacao.');
      return null;
    }
    salvarSequenciaDiarioPresentes(contas);
    inicializarProgressoDiarioDesdeGerenciadaAtual(contas);
    return proximaContaDiarioSequenciaPendente(contas);
  }

  function montarMensagemDiarioCicloCompleto(nomeUltima) {
    return [
      '**Diario concluido — ciclo completo (mesma aba)**',
      'Logins: **' + DIARIO_LOGINS_SEQUENCIA.join('** -> **') + '**',
      'Ultima gerenciada: **' + (nomeUltima || '?') + '**'
    ].join('\n');
  }

  function concluirCicloDiarioCompleto(nomeConta) {
    var login = obterUsuarioLogin();
    var feitas = lerContasDiarioFeitas();
    var proximo = obterProximoLoginDiarioSequencia(login);
    console.log(
      '%c[Diario] Ciclo do login ' + login + ' concluido (' + feitas.join(' -> ') + ').',
      'color:#2ecc71;font-weight:bold'
    );
    limparEstadoDiario();
    marcarLoginSequenciaDiarioFeito(login);
    limparProgressoDiarioLogin(login);

    if (!proximo && loginDiarioDeveAvisarDiscord()) {
      enviarDiscordTexto(montarMensagemDiarioCicloCompleto(nomeConta));
    } else if (!proximo) {
      console.log('[Diario] Sequencia completa na mesma aba.');
    } else {
      console.log('[Diario] Proximo login na mesma aba: ' + proximo);
    }

    setTimeout(function() {
      rotacionarDiarioProximoLoginMesmaAba();
    }, 2000);
  }

  function irParaPortaoOuPararDiario(motivo) {
    if (diarioGerenciadaAtivo() && !diarioCicloSequenciaConcluido()) {
      console.warn('[Diario] ' + motivo + ' — sem caçadas, parando nesta conta.');
      return true;
    }
    irParaPortaoRelatorios(motivo);
    return true;
  }

  function encontrarContaAutomacaoPorSnapshot(contas, snap) {
    if (!snap || !contas.length) return null;
    if (snap.contaId) {
      for (var i = 0; i < contas.length; i++) {
        if (String(contas[i].contaId) === String(snap.contaId)) return contas[i];
      }
    }
    if (snap.nome) {
      var norm = normalizarNomeCacadas(snap.nome);
      for (var j = 0; j < contas.length; j++) {
        if (normalizarNomeCacadas(contas[j].nome) === norm) return contas[j];
      }
    }
    return null;
  }

  function escolherContaAutomacaoParaAssumir(contas) {
    if (precisaRetomarGerenciada()) {
      var snapRetomar = {
        nome: '',
        contaId: ''
      };
      try {
        snapRetomar.nome = sessionStorage.getItem(BOT_ROTACAO_RETOMAR_NOME_KEY) || '';
        snapRetomar.contaId = sessionStorage.getItem(BOT_ROTACAO_RETOMAR_ID_KEY) || '';
      } catch (e) {}
      var retomar = encontrarContaAutomacaoPorSnapshot(contas, snapRetomar);
      if (retomar) return retomar;
      console.warn('[Automacao] Retomar gerenciada — conta nao encontrada na lista, usando rotacao normal.');
      limparRetomarGerenciada();
    }
    if (diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva()) {
      return escolherProximaContaDiarioSequencia(contas);
    }
    return escolherProximaContaAutomacao(contas);
  }

  function extrairContasAutomacaoPagina() {
    var mapa = {};
    var forms = document.querySelectorAll('form[action*="automacao"]');

    for (var i = 0; i < forms.length; i++) {
      if (!forms[i].querySelector('input[name="assumir"]')) continue;
      var contaIdInput = forms[i].querySelector('input[name="conta_id"]');
      if (!contaIdInput) continue;

      var contaId = String(contaIdInput.value || '').trim();
      if (!contaId || mapa[contaId]) continue;

      var card = forms[i].closest('div[style*="background:#181818"]');
      var nome = '';
      if (card) {
        var strong = card.querySelector('strong');
        if (strong) nome = (strong.innerText || strong.textContent || '').trim();
      }

      mapa[contaId] = { contaId: contaId, nome: nome, form: forms[i] };
    }

    return Object.keys(mapa).map(function(k) { return mapa[k]; }).sort(function(a, b) {
      var na = parseInt(a.contaId, 10);
      var nb = parseInt(b.contaId, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return String(a.contaId).localeCompare(String(b.contaId));
    });
  }

  function escolherProximaContaAutomacao(contas) {
    if (!contas.length) return null;
    if (contas.length === 1) return contas[0];

    var atual = extrairNomeUsuarioLogado();
    var idx = -1;
    if (atual) {
      var normAtual = normalizarNomeCacadas(atual);
      for (var i = 0; i < contas.length; i++) {
        if (normalizarNomeCacadas(contas[i].nome) === normAtual) {
          idx = i;
          break;
        }
      }
    }

    if (idx === -1) return contas[0];
    return contas[(idx + 1) % contas.length];
  }

  function marcarAtaqueIniciadoRotacao() {
    if (!rotacaoAutomacaoAtiva()) return;
    try { sessionStorage.setItem('BOT_ROTACAO_APOS_ATAQUE', String(Date.now())); } catch (e) {}
  }

  function consumirAtaqueRecenteRotacao() {
    try {
      var raw = sessionStorage.getItem('BOT_ROTACAO_APOS_ATAQUE');
      if (!raw) return false;
      sessionStorage.removeItem('BOT_ROTACAO_APOS_ATAQUE');
      var ts = parseInt(raw, 10);
      return !isNaN(ts) && Date.now() - ts < 180000;
    } catch (e) {}
    return false;
  }

  function deveRotacionarAutomacaoNoPortao(decisao) {
    if (!rotacaoAutomacaoAtiva()) return false;
    if (decisao.waitMs > 0) return true;
    return consumirAtaqueRecenteRotacao();
  }

  function irParaRotacaoAutomacao(motivo) {
    console.warn('[Automacao] ' + motivo + ' — rotacionando para proxima conta...');
    limparRetomarGerenciada();
    marcarRotacaoCicloPendente();
    consumirGateCacadas();
    portaoRelatoriosAgendado = false;
    limparEstadoModoCacadas();
    limparTentativasCacadaPorNome();
    limparSkipBlacklistCacadas();
    setTimeout(function() {
      window.location.href = URL_AUTOMACAO;
    }, 1500);
  }

  function automacaoTemCicloPendente() {
    try { return sessionStorage.getItem(BOT_ROTACAO_CICLO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function processarPaginaAutomacao() {
    if (atacarAutomacoesPrepAtivo()) {
      return processarAutomPrepPaginaAutomacao();
    }

    var cicloPendente = automacaoTemCicloPendente();
    var retomar = precisaRetomarGerenciada();
    var diarioAssumir = diarioAssumirPermitido();

    if (!cicloPendente && !retomar && !diarioAssumir) return true;
    if (!rotacaoAutomacaoAtiva() && !retomar && !diarioGerenciadaAtivo()) return true;
    if (automacaoAssumirEmAndamento) return true;

    if (cicloPendente) consumirRotacaoCicloPendente();

    var contas = extrairContasAutomacaoPagina();
    if (!contas.length) {
      console.warn('[Automacao] Nenhuma conta gerenciada encontrada.');
      return irParaPortaoOuPararDiario('Automacao sem contas');
    }

    var proxima = escolherContaAutomacaoParaAssumir(contas);
    if (!proxima) {
      if (diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva()) {
        if (cicloDiarioTodasContasFeitas()) {
          concluirCicloDiarioCompleto(extrairNomeUsuarioLogado());
        } else if (estaEmContaGerenciada() && gerenciadaEhProximaDiarioPendente()) {
          limparRetomarGerenciada();
          console.warn('[Diario] Gerenciada logada pendente — retomando rotina...');
          retomarDiarioGerenciadaPosAssume();
        } else {
          console.warn('[Diario] Sem proxima conta pendente — feitas: ' +
            lerContasDiarioFeitas().join(', ') + ' | esperadas: ' +
            lerSequenciaDiarioPresentesNorm().join(', ') + ' — use botDiarioReset()');
        }
        return true;
      }
      return irParaPortaoOuPararDiario('Automacao falhou ao escolher conta');
    }

    if (diarioAssumir && estaEmContaGerenciada()) {
      var nomeAtual = extrairNomeUsuarioLogado();
      if (nomeAtual && normalizarNomeCacadas(proxima.nome) === normalizarNomeCacadas(nomeAtual)) {
        limparRetomarGerenciada();
        console.warn('[Diario] Gerenciada ' + nomeAtual + ' ja ativa — iniciando rotina diaria...');
        retomarDiarioGerenciadaPosAssume();
        return true;
      }
    }

    automacaoAssumirEmAndamento = true;
    marcarContaAutomacaoAssumida();
    salvarUltimaGerenciadaSnapshot(proxima.nome, proxima.contaId);
    if (precisaRetomarGerenciada()) {
      console.warn('[Automacao] Retomando conta gerenciada: ' + proxima.nome + ' (id ' + proxima.contaId + ')');
    } else if (diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva()) {
      console.warn('[Diario] Assumindo conta gerenciada: ' + proxima.nome + ' (id ' + proxima.contaId + ')');
    } else {
      console.warn('[Automacao] Assumindo conta: ' + proxima.nome + ' (id ' + proxima.contaId + ')');
    }

    var btn = proxima.form.querySelector('input[type="submit"]');
    if (btn) btn.click();
    else proxima.form.submit();
    return true;
  }

  function instalarConfirmAutoOkMissao() {
    if (window.__BOT_CONFIRM_MISSAO_OK__) return;
    window.__BOT_CONFIRM_MISSAO_OK__ = true;
    var confirmOriginal = window.confirm;
    window.confirm = function(msg) {
      var t = normalizarTextoCombate(msg);
      if (t.indexOf('cancelar a miss') !== -1) {
        console.log('[Missao] confirm() auto-OK — ' + msg);
        return true;
      }
      if (t.indexOf('aceitar') !== -1 && t.indexOf('miss') !== -1) {
        console.log('[Missao] confirm() auto-OK aceitar — ' + msg);
        return true;
      }
      if (t.indexOf('tem certeza') !== -1 && t.indexOf('miss') !== -1) {
        console.log('[Missao] confirm() auto-OK missao — ' + msg);
        return true;
      }
      if (t.indexOf('treino investido') !== -1 ||
          (t.indexOf('tem certeza') !== -1 && t.indexOf('perder') !== -1)) {
        console.log('[Diario] confirm() auto-OK venda animal — ' + msg);
        return true;
      }
      return confirmOriginal.call(window, msg);
    };
  }

  // --- Bot diario (contas gerenciadas): evento + raid + animal ---
  function cacadasBloqueadaPorDiarioGerenciada() {
    return diarioGerenciadaAtivo() && !diarioCicloSequenciaConcluido();
  }

  function redirecionarDiarioNoLugarDeCacadas(contexto) {
    if (!cacadasBloqueadaPorDiarioGerenciada()) return false;
    if (processarRotacaoContaPrincipal()) return true;
    if (verificarDiarioRetomarPosInterrupcao()) return true;
    if (redirecionarParaDiarioGerenciada(contexto || 'bloqueio caçadas')) return true;
    if (!estaEmContaGerenciada()) {
      console.log('[Diario] Caçadas bloqueadas — indo para /automacao (' + (contexto || '?') + ')...');
      marcarRotacaoCicloPendente();
      window.location.href = URL_AUTOMACAO;
      return true;
    }
    console.log('[Diario] Caçadas bloqueadas — aguardando diario (' + (contexto || '?') + ').');
    return true;
  }

  function diarioDeveRodar() {
    if (!diarioGerenciadaAtivo() || !estaEmContaGerenciada()) return false;
    if (obterFaseDiario()) return true;
    if (!lerSequenciaDiarioPresentesNorm().length) return false;
    return gerenciadaEhProximaDiarioPendente();
  }

  function diarioEmAndamento() {
    return diarioDeveRodar() && !!obterFaseDiario();
  }

  function devePriorizarDiarioSobreCacadas() {
    if (!cacadasBloqueadaPorDiarioGerenciada()) return false;
    if (estaEmContaGerenciada()) return diarioDeveRodar() || !!obterFaseDiario();
    return true;
  }

  function paginaCorrespondeFaseDiario(fase, url) {
    if (!fase || !url) return false;
    if (fase === 'evento') return url.indexOf('eventos') !== -1;
    if (fase === 'raid') {
      if (url.indexOf('raid-combate') !== -1) return true;
      if (url.indexOf('/raid') !== -1) return true;
      if (typeof ehPaginaCombateCacadas === 'function' && ehPaginaCombateCacadas(url)) return true;
    }
    if (fase === 'animal') return url.indexOf('/animal') !== -1;
    return false;
  }

  function redirecionarParaDiarioGerenciada(contexto) {
    if (!devePriorizarDiarioSobreCacadas()) return false;
    if (curarHpAtivo()) return false;

    var url = window.location.href || '';
    if (url.indexOf('automacao') !== -1) return false;

    if (url.indexOf('status') !== -1 && obterFaseDiario() === 'raid') {
      if (diarioRaidDerrotaAtiva()) return false;
      var hpStatus = obterStatusHp();
      if (hpStatus.ok && !hpAtendeMinimoRaid(hpStatus)) return false;
    }

    if (diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva() && estaEmContaGerenciada()) {
      if (!lerSequenciaDiarioPresentesNorm().length) {
        return redirecionarAutomacaoDiarioCiclo('Gerenciada sem lista de ciclo');
      }
      if (!obterFaseDiario() && !gerenciadaEhProximaDiarioPendente()) {
        return redirecionarAutomacaoDiarioCiclo('Gerenciada fora da ordem do ciclo');
      }
    }

    var fase = obterFaseDiario();
    if (!fase) {
      console.log('[Diario] ' + contexto + ' — iniciando rotina nesta gerenciada.');
      iniciarDiarioGerenciada();
      fase = 'evento';
    }

    if (paginaCorrespondeFaseDiario(fase, url)) return false;

    console.log('[Diario] ' + contexto + ' — indo para fase ' + fase + ' (sem caçadas).');
    irParaUrlFaseDiario(fase);
    return true;
  }

  function redirecionarSeDiarioEmAndamento(contexto) {
    return redirecionarParaDiarioGerenciada(contexto);
  }

  var FASES_DIARIO_VALIDAS = { evento: 1, raid: 1, animal: 1 };

  function normalizarFaseDiario(raw) {
    if (!raw || typeof raw !== 'string') return '';
    var f = raw.trim().toLowerCase();
    return FASES_DIARIO_VALIDAS[f] ? f : '';
  }

  function obterFaseDiario() {
    try {
      var raw = sessionStorage.getItem(BOT_DIARIO_FASE_KEY) || '';
      if (!raw) raw = localStorage.getItem(diarioProgLocalKey('FASE')) || '';
      var fase = normalizarFaseDiario(raw);
      if (raw && !fase) {
        console.warn('[Diario] Fase invalida no storage — limpando: ' + raw.slice(0, 60));
        sessionStorage.removeItem(BOT_DIARIO_FASE_KEY);
        try { localStorage.removeItem(diarioProgLocalKey('FASE')); } catch (e) {}
      } else if (fase && !sessionStorage.getItem(BOT_DIARIO_FASE_KEY)) {
        try { sessionStorage.setItem(BOT_DIARIO_FASE_KEY, fase); } catch (e) {}
      }
      return fase;
    } catch (e) {}
    return '';
  }

  function definirFaseDiario(fase) {
    try {
      sincronizarLoginDiarioProgresso();
      var norm = normalizarFaseDiario(fase);
      if (norm) {
        sessionStorage.setItem(BOT_DIARIO_FASE_KEY, norm);
        localStorage.setItem(diarioProgLocalKey('FASE'), norm);
      } else {
        sessionStorage.removeItem(BOT_DIARIO_FASE_KEY);
        localStorage.removeItem(diarioProgLocalKey('FASE'));
      }
    } catch (e) {}
  }

  function limparEstadoDiario() {
    try {
      sessionStorage.removeItem(BOT_DIARIO_FASE_KEY);
      sessionStorage.removeItem(BOT_DIARIO_ANIMAL_SUB_KEY);
      sessionStorage.removeItem(BOT_DIARIO_ANIMAL_IDX_KEY);
      sessionStorage.removeItem(BOT_DIARIO_ANIMAL_BS_KEY);
      sessionStorage.removeItem(BOT_DIARIO_RAID_COMBATE_KEY);
      sessionStorage.removeItem(BOT_DIARIO_RAID_DERROTA_KEY);
      try { localStorage.removeItem(diarioProgLocalKey('FASE')); } catch (e2) {}
    } catch (e) {}
  }

  function irParaUrlFaseDiario(fase) {
    if (fase === 'evento') {
      window.location.href = URL_EVENTOS;
      return;
    }
    if (fase === 'raid') {
      window.location.href = URL_RAID;
      return;
    }
    if (fase === 'animal') {
      var sub = 'meus';
      try { sub = sessionStorage.getItem(BOT_DIARIO_ANIMAL_SUB_KEY) || 'meus'; } catch (e) {}
      if (sub === 'loja' || sub === 'comprando') {
        var idx = 71;
        try {
          var raw = sessionStorage.getItem(BOT_DIARIO_ANIMAL_IDX_KEY);
          if (raw !== null && raw !== '') idx = parseInt(raw, 10);
        } catch (e) {}
        if (isNaN(idx)) idx = 71;
        window.location.href = URL_ANIMAL_LOJA + '&idx=' + idx;
        return;
      }
      window.location.href = URL_ANIMAL_MEUS;
      return;
    }
    window.location.href = URL_EVENTOS;
  }

  function retomarDiarioGerenciadaPosAssume() {
    var fase = obterFaseDiario();
    if (!fase) {
      iniciarDiarioGerenciada();
      window.location.href = URL_EVENTOS;
      return;
    }
    console.log('%c[Diario] Retomando rotina na fase: ' + fase, 'color:#f39c12;font-weight:bold');
    irParaUrlFaseDiario(fase);
  }

  function iniciarDiarioGerenciada() {
    limparEstadoDiario();
    definirFaseDiario('evento');
    console.log('%c[Diario] Rotina iniciada — evento -> raid -> animal', 'color:#f39c12;font-weight:bold');
  }

  function concluirDiarioGerenciada() {
    var nomeAtual = extrairNomeUsuarioLogado() || obterUsuarioExibicao();
    console.log('%c[Diario] Rotina concluida nesta conta gerenciada: ' + nomeAtual, 'color:#f39c12;font-weight:bold');
    limparEstadoDiario();
    marcarContaDiarioFeita(nomeAtual);
    var feitas = lerContasDiarioFeitas();
    console.log('[Diario] Contas concluidas neste ciclo: ' + feitas.join(' -> ') +
      ' (' + feitas.length + '/' + lerSequenciaDiarioPresentesNorm().length + ')');
    if (cicloDiarioTodasContasFeitas()) {
      concluirCicloDiarioCompleto(nomeAtual);
      return;
    }
    irParaRotacaoAutomacao('diario concluido — proxima: ' + proximaContaDiarioSequenciaLabel(nomeAtual));
  }

  function proximaContaDiarioSequenciaLabel(nomeAtual) {
    var presentes = lerSequenciaDiarioPresentesNorm();
    var feitas = lerContasDiarioFeitas();
    for (var i = 0; i < presentes.length; i++) {
      if (feitas.indexOf(presentes[i]) === -1) return presentes[i];
    }
    return '?';
  }

  function avancarFaseDiario(proxima, motivo) {
    definirFaseDiario(proxima);
    console.log('[Diario] Fase -> ' + proxima + (motivo ? ' (' + motivo + ')' : ''));
  }

  function extrairRyousJogadorSidebar() {
    var raizes = obterRaizesSidebar();
    for (var r = 0; r < raizes.length; r++) {
      var col = raizes[r];
      if (col === document.body) continue;

      var ryousVal = col.querySelector('.ryous-val');
      if (ryousVal) {
        var nVal = parseNumeroBr((ryousVal.innerText || ryousVal.textContent || '').trim());
        if (nVal !== null) return nVal;
      }

      var badge = col.querySelector('.badge-ryous');
      if (badge) {
        var nBadge = parseNumeroBr((badge.innerText || badge.textContent || '').trim());
        if (nBadge !== null) return nBadge;
      }

      var m = (col.innerText || col.textContent || '').match(/Ryous\s*:?\s*([\d.,]+)/i);
      if (m) return parseNumeroBr(m[1]);
    }
    return null;
  }

  function extrairValorLinhaTabelaDiario(rotuloParcial) {
    return extrairValorLinhaTabela(rotuloParcial, document.getElementById('col_direita'));
  }

  function processarDiarioEventos() {
    if (obterFaseDiario() !== 'evento') return false;

    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      if (!f.querySelector('input[name="fazer_checkin"]')) continue;
      var btn = f.querySelector('input[type="submit"]');
      if (!btn) continue;
      var val = normalizarTextoCombate(btn.value || '');
      if (val.indexOf('coletar') === -1) continue;
      console.log('[Diario] Coletando check-in diario (' + (btn.value || '?') + ')...');
      btn.click();
      return true;
    }

    console.log('[Diario] Check-in diario indisponivel ou ja coletado — indo para raids.');
    avancarFaseDiario('raid', 'sem botao coletar');
    window.location.href = URL_RAID;
    return true;
  }

  function blocoRaidTemCooldown(bloco) {
    if (!bloco) return true;
    var avisos = bloco.querySelectorAll('.avisos_erro');
    for (var i = 0; i < avisos.length; i++) {
      var norm = normalizarTextoCombate(avisos[i].innerText || avisos[i].textContent || '');
      if (norm.indexOf('disponivel em') !== -1 || norm.indexOf('faltam') !== -1) return true;
    }
    return false;
  }

  function blocoRaidNivelInsuficiente(bloco) {
    if (!bloco) return false;
    var avisos = bloco.querySelectorAll('.avisos_erro');
    for (var i = 0; i < avisos.length; i++) {
      var norm = normalizarTextoCombate(avisos[i].innerText || avisos[i].textContent || '');
      if (norm.indexOf('nivel insuficiente') !== -1 || norm.indexOf('necessario lv') !== -1) return true;
    }
    return false;
  }

  function paginaRaidCombateAtivo(url) {
    url = url || window.location.href || '';
    if (estaNaPaginaCombateCacadas(url)) return true;
    if (ehPaginaResultadoFinalRaid()) return false;
    return !!document.querySelector(
      'form[action="atacar"] input[type="submit"], ' +
      'form[action*="raid-combate"] input[type="submit"], ' +
      'form[action*="raid"] input[type="submit"][value*="Atacar"], ' +
      'form[action*="raid"] input[type="submit"][value*="atacar"]'
    );
  }

  function ehPaginaResultadoFinalRaid() {
    var col = document.getElementById('col_direita');
    if (!col) return false;
    var norm = normalizarTextoCombate(col.innerText || col.textContent || '');
    if (norm.indexOf('resultado final') !== -1) return true;
    return !!col.querySelector('tr.box_preto_tarja td');
  }

  function avisoRaidIgnorarClassificacao(norm) {
    if (!norm) return true;
    if (norm.indexOf('nivel insuficiente') !== -1) return true;
    if (norm.indexOf('disponivel em') !== -1 && norm.indexOf('faltam') !== -1) return true;
    return false;
  }

  function classificarTextoResultadoRaid(texto) {
    if (!texto) return null;
    var norm = normalizarTextoCombate(texto);
    if (avisoRaidIgnorarClassificacao(norm)) return null;

    if (norm.indexOf('foi derrotado') !== -1 || norm.indexOf('voce foi derrotado') !== -1) {
      return { resultado: 'derrota', texto: texto };
    }

    if (norm.indexOf('voce derrotou') !== -1 ||
        norm.indexOf('voce venceu') !== -1 ||
        norm.indexOf('venceu a raid') !== -1 ||
        norm.indexOf('parabens') !== -1 ||
        (norm.indexOf('faturou') !== -1 && norm.indexOf('ryous') !== -1)) {
      return { resultado: 'vitoria', texto: texto };
    }

    return null;
  }

  function obterAvisoResultadoFinalRaid() {
    var col = document.getElementById('col_direita');
    if (!col) return null;

    var tarjas = col.querySelectorAll('tr.box_preto_tarja');
    for (var t = 0; t < tarjas.length; t++) {
      var tarjaNorm = normalizarTextoCombate(tarjas[t].innerText || tarjas[t].textContent || '');
      if (tarjaNorm.indexOf('danos causados') === -1) continue;

      var bloco = tarjas[t].closest('table');
      if (!bloco) continue;
      var pai = bloco.parentElement;
      for (var i = 0; i < 6 && pai; i++) {
        var avisos = pai.querySelectorAll('.avisos_erro');
        for (var j = 0; j < avisos.length; j++) {
          var texto = (avisos[j].innerText || avisos[j].textContent || '').replace(/\s+/g, ' ').trim();
          if (!texto || avisoRaidIgnorarClassificacao(normalizarTextoCombate(texto))) continue;
          return texto;
        }
        pai = pai.parentElement;
      }
    }

    return null;
  }

  function classificarResultadoRaidCombate() {
    if (!ehPaginaResultadoFinalRaid()) return null;

    var avisoResultado = obterAvisoResultadoFinalRaid();
    if (avisoResultado) {
      var parsedDireto = classificarTextoResultadoRaid(avisoResultado);
      if (parsedDireto) return parsedDireto;
    }

    var parsed = classificarResultadoCombate();
    if (parsed) return parsed;

    var col = document.getElementById('col_direita') || document.body || document;
    var avisos = col.querySelectorAll('.avisos_erro');
    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      var parsedAviso = classificarTextoResultadoRaid(texto);
      if (parsedAviso) return parsedAviso;
    }
    return null;
  }

  function ehPaginaListaRaids(url) {
    url = url || window.location.href || '';
    if (url.indexOf('/raid') === -1 && url.indexOf('raid-combate') === -1) return false;
    if (estaNaPaginaCombateCacadas(url)) return false;
    if (ehPaginaResultadoFinalRaid()) return false;
    if (paginaRaidCombateAtivo(url)) return false;

    var col = document.getElementById('col_direita');
    if (col) {
      var norm = normalizarTextoCombate(col.innerText || col.textContent || '');
      if (norm.indexOf('inimigos lendarios') !== -1) return true;
    }
    return !!document.querySelector(
      'form[action="raid"] input[name="boss_id"], input[name="boss_id"]'
    );
  }

  function contarBossesRaidPagina() {
    var ids = {};
    var inputs = document.querySelectorAll('input[name="boss_id"]');
    for (var i = 0; i < inputs.length; i++) {
      var id = parseInt(inputs[i].value, 10);
      if (!isNaN(id)) ids[id] = true;
    }
    var total = Object.keys(ids).length;
    if (total > 0) return total;

    var col = document.getElementById('col_direita');
    if (!col) return 0;
    var matches = (col.innerText || col.textContent || '').match(/Lv\.\d+\+/gi);
    return matches ? matches.length : 0;
  }

  function concluirRaidsDiarioIrAnimal() {
    console.log('[Diario] Todas raids disponiveis concluidas (cooldown/nivel) — indo para animal.');
    limparDiarioRaidDerrota();
    limparCurarHpAtivo();
    avancarFaseDiario('animal', 'raids esgotadas');
    try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_SUB_KEY, 'meus'); } catch (e) {}
    window.location.href = URL_ANIMAL_MEUS;
  }

  function marcarDiarioRaidDerrota() {
    try { sessionStorage.setItem(BOT_DIARIO_RAID_DERROTA_KEY, '1'); } catch (e) {}
  }

  function limparDiarioRaidDerrota() {
    try { sessionStorage.removeItem(BOT_DIARIO_RAID_DERROTA_KEY); } catch (e) {}
  }

  function diarioRaidDerrotaAtiva() {
    try { return sessionStorage.getItem(BOT_DIARIO_RAID_DERROTA_KEY) === '1'; } catch (e) {}
    return false;
  }

  function finalizarDiarioRaidPosCombate(parsed) {
    consumirDiarioRaidEmCombate();
    if (parsed && parsed.resultado === 'derrota') {
      console.log('[Diario] Raid perdida — parando demais raids (HP zerado), indo para animal.');
      limparCurarHpAtivo();
      marcarDiarioRaidDerrota();
      setTimeout(function() {
        concluirRaidsDiarioIrAnimal();
      }, 2000);
      return true;
    }
    console.log('[Diario] Raid combate — ' + (parsed ? parsed.resultado + ': ' + parsed.texto : 'concluido') +
      ' — verificando proximas raids...');
    setTimeout(function() {
      window.location.href = URL_RAID;
    }, 2000);
    return true;
  }

  function extrairNivelMinimoRaid(bloco) {
    if (!bloco) return null;
    var m = (bloco.innerText || bloco.textContent || '').match(/Lv\.(\d+)\+/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function encontrarFormRaidDisponivel() {
    var meuNivel = extrairNivelJogadorSidebar();
    var forms = document.querySelectorAll('form[action="raid"], form[action*="raid"]');

    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      var bossInput = f.querySelector('input[name="boss_id"]');
      var btn = f.querySelector('input[type="submit"]');
      if (!bossInput || !btn) continue;
      if (normalizarTextoCombate(btn.value || '').indexOf('iniciar raid') === -1) continue;

      var bloco = f.closest('table');
      if (blocoRaidTemCooldown(bloco)) continue;
      if (blocoRaidNivelInsuficiente(bloco)) continue;

      var minLv = extrairNivelMinimoRaid(bloco);
      if (minLv !== null && meuNivel !== null && meuNivel < minLv) continue;

      return f;
    }
    return null;
  }

  function marcarDiarioRaidEmCombate() {
    try { sessionStorage.setItem(BOT_DIARIO_RAID_COMBATE_KEY, '1'); } catch (e) {}
  }

  function consumirDiarioRaidEmCombate() {
    try {
      if (sessionStorage.getItem(BOT_DIARIO_RAID_COMBATE_KEY) === '1') {
        sessionStorage.removeItem(BOT_DIARIO_RAID_COMBATE_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function processarDiarioRaidLista() {
    if (obterFaseDiario() !== 'raid') return false;
    if (diarioRaidDerrotaAtiva()) {
      concluirRaidsDiarioIrAnimal();
      return true;
    }
    if (!garantirHpParaRaidDiario('raid lista')) return true;

    var form = encontrarFormRaidDisponivel();
    if (form) {
      var bossId = form.querySelector('input[name="boss_id"]');
      console.log('[Diario] Iniciando raid boss_id=' + (bossId ? bossId.value : '?') +
        ' (primeiro disponivel da lista)...');
      marcarDiarioRaidEmCombate();
      var btn = form.querySelector('input[type="submit"]');
      if (btn) btn.click();
      else form.submit();
      return true;
    }

    if (!ehPaginaListaRaids()) {
      console.log('[Diario] Fora da lista de raids — abrindo /raid...');
      window.location.href = URL_RAID;
      return true;
    }

    if (contarBossesRaidPagina() === 0) {
      console.warn('[Diario] Lista de raids ainda nao carregou — aguardando...');
      return true;
    }

    concluirRaidsDiarioIrAnimal();
    return true;
  }

  function processarDiarioRaidCombatePagina() {
    if (obterFaseDiario() !== 'raid') return false;
    if (diarioRaidDerrotaAtiva()) {
      concluirRaidsDiarioIrAnimal();
      return true;
    }

    var parsedResultado = classificarResultadoRaidCombate();
    if (parsedResultado) {
      return finalizarDiarioRaidPosCombate(parsedResultado);
    }

    if (!garantirHpParaRaidDiario('raid combate')) return true;

    var btnAtacar = document.querySelector(
      'form[action="atacar"] input[type="submit"], ' +
      'form[action*="raid-combate"] input[type="submit"], ' +
      'form[action*="raid"] input[type="submit"][value*="Atacar"], ' +
      'form[action*="raid"] input[type="submit"][value*="atacar"]'
    );
    if (btnAtacar) {
      console.log('[Diario] Raid combate — clicando Atacar...');
      marcarDiarioRaidEmCombate();
      btnAtacar.click();
      return true;
    }

    if (ehPaginaListaRaids()) {
      return processarDiarioRaidLista();
    }

    if (estaNaPaginaCombateCacadas()) {
      return false;
    }

    if (ehPaginaResultadoFinalRaid()) {
      console.log('[Diario] Raid — Resultado final sem classificacao; aguardando...');
      return true;
    }

    console.log('[Diario] Raid combate sem botao Atacar — voltando a lista /raid...');
    window.location.href = URL_RAID;
    return true;
  }

  function formVenderAnimalMeus() {
    var forms = document.querySelectorAll('form[action*="animal"]');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('input[name="action"][value="abandonar"]')) return forms[i];
    }
    return null;
  }

  function extrairUltimoIdxAnimalLoja() {
    var max = 0;
    var links = document.querySelectorAll('a[href*="aba=loja"], a[href*="idx="]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var m = href.match(/idx=(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    var aviso = document.querySelector('.avisos_erro');
    if (aviso) {
      var m2 = (aviso.innerText || aviso.textContent || '').match(/(\d+)\s+de\s+(\d+)/i);
      if (m2) max = Math.max(max, parseInt(m2[2], 10) - 1);
    }
    return max;
  }

  function obterIdxAnimalLojaUrl() {
    try {
      var rp = new URLSearchParams(window.location.search);
      var raw = rp.get('idx');
      if (raw !== null && raw !== '') {
        var idx = parseInt(raw, 10);
        if (!isNaN(idx)) return idx;
      }
    } catch (e) {}
    return 0;
  }

  function limparBuscaAnimalLoja() {
    try { sessionStorage.removeItem(BOT_DIARIO_ANIMAL_BS_KEY); } catch (e) {}
  }

  function obterBuscaAnimalLoja() {
    try {
      var raw = sessionStorage.getItem(BOT_DIARIO_ANIMAL_BS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function salvarBuscaAnimalLoja(bs) {
    try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_BS_KEY, JSON.stringify(bs)); } catch (e) {}
  }

  function iniciarBuscaAnimalLoja(maxIdx) {
    var bs = { low: 0, high: maxIdx, best: -1, fase: 'busca' };
    salvarBuscaAnimalLoja(bs);
    return bs;
  }

  function animalLojaCompravel(dados, meuNivel, meusRyous) {
    if (!dados || dados.jaPossuiAnimal) return false;
    if (!dados.formComprar || dados.valor === null) return false;
    var nivelOk = dados.nivelMin === null || meuNivel === null || meuNivel >= dados.nivelMin;
    var ryousOk = meusRyous === null || meusRyous >= dados.valor;
    return nivelOk && ryousOk;
  }

  function comprarAnimalLojaDiario(dados, meuNivel, meusRyous) {
    console.log('[Diario] Comprando animal valor=' + formatarNumeroBr(dados.valor) +
      ' (nivel min ' + (dados.nivelMin || '?') + ', ryous ' + formatarNumeroBr(meusRyous) + ')...');
    limparBuscaAnimalLoja();
    try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_SUB_KEY, 'comprando'); } catch (e) {}
    var btnC = dados.formComprar.querySelector('input[type="submit"], input[name="btn_comprar"]');
    if (btnC) btnC.click();
    else dados.formComprar.submit();
    return true;
  }

  function extrairDadosAnimalLojaPagina() {
    var col = document.getElementById('col_direita');
    if (!col) return null;
    var texto = (col.innerText || col.textContent || '').replace(/\s+/g, ' ');
    var norm = normalizarTextoCombate(texto);
    var valorTexto = extrairValorLinhaTabelaDiario('valor');
    var nivelTexto = extrairValorLinhaTabelaDiario('nível necess');
    if (!nivelTexto) nivelTexto = extrairValorLinhaTabelaDiario('nivel necess');
    if (!nivelTexto) {
      var mN = texto.match(/N[ií]vel necess[aá]rio:\s*\|\s*(\d+)/i);
      nivelTexto = mN ? mN[1] : null;
    }
    var formComprar = null;
    var forms = col.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('input[name="action"][value="comprar"]')) {
        formComprar = forms[i];
        break;
      }
    }
    return {
      valor: valorTexto ? parseNumeroBr(valorTexto.replace(/^\|\s*/, '')) : null,
      nivelMin: nivelTexto ? parseInt(String(nivelTexto).replace(/\D/g, ''), 10) : null,
      formComprar: formComprar,
      jaPossuiAnimal: norm.indexOf('ja possui um animal') !== -1,
      semBotaoComprar: !formComprar
    };
  }

  function irParaAnimalLojaIdx(idx) {
    try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_IDX_KEY, String(idx)); } catch (e) {}
    window.location.href = URL_ANIMAL_LOJA + '&idx=' + idx;
  }

  function processarDiarioAnimalMeus() {
    var formVender = formVenderAnimalMeus();
    if (formVender) {
      instalarConfirmAutoOkMissao();
      console.log('[Diario] Vendendo animal atual (banco) — confirm auto-OK...');
      var btn = formVender.querySelector('input[type="submit"]');
      if (btn) btn.click();
      else formVender.submit();
      return true;
    }

    console.log('[Diario] Sem animal para vender — indo a loja (busca binaria do mais caro).');
    try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_SUB_KEY, 'loja'); } catch (e) {}
    limparBuscaAnimalLoja();
    window.location.href = URL_ANIMAL_LOJA;
    return true;
  }

  function processarDiarioAnimalLoja() {
    var meuNivel = extrairNivelJogadorSidebar();
    var meusRyous = extrairRyousJogadorSidebar();
    var idxAtual = obterIdxAnimalLojaUrl();
    var dados = extrairDadosAnimalLojaPagina();

    if (dados && dados.jaPossuiAnimal) {
      console.warn('[Diario] Ainda possui animal — voltando a Meus animais.');
      limparBuscaAnimalLoja();
      try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_SUB_KEY, 'meus'); } catch (e) {}
      window.location.href = URL_ANIMAL_MEUS;
      return true;
    }

    var bs = obterBuscaAnimalLoja();
    if (bs && bs.fase === 'comprar') {
      if (animalLojaCompravel(dados, meuNivel, meusRyous)) {
        return comprarAnimalLojaDiario(dados, meuNivel, meusRyous);
      }
      console.warn('[Diario] Animal idx=' + bs.best + ' indisponivel na compra — reiniciando busca.');
      limparBuscaAnimalLoja();
      bs = null;
    }

    if (!bs) {
      var maxIdx = extrairUltimoIdxAnimalLoja();
      if (maxIdx < 0) maxIdx = 0;
      bs = iniciarBuscaAnimalLoja(maxIdx);
      var primeiro = Math.floor((bs.low + bs.high) / 2);
      console.log('[Diario] Busca binaria animal — idx 0..' + maxIdx + ' (caros no final), probe ' + primeiro);
      irParaAnimalLojaIdx(primeiro);
      return true;
    }

    var compravel = animalLojaCompravel(dados, meuNivel, meusRyous);
    if (compravel) {
      bs.best = idxAtual;
      bs.low = idxAtual + 1;
    } else {
      bs.high = idxAtual - 1;
    }

    if (bs.low <= bs.high) {
      var proximo = Math.floor((bs.low + bs.high) / 2);
      salvarBuscaAnimalLoja(bs);
      console.log('[Diario] Busca animal idx=' + idxAtual + (compravel ? ' OK' : ' nao') +
        ' | proximo=' + proximo + ' | melhor=' + bs.best);
      irParaAnimalLojaIdx(proximo);
      return true;
    }

    if (bs.best >= 0) {
      console.log('[Diario] Melhor animal encontrado — idx ' + bs.best + ' (busca binaria).');
      bs.fase = 'comprar';
      salvarBuscaAnimalLoja(bs);
      if (idxAtual === bs.best && compravel) {
        return comprarAnimalLojaDiario(dados, meuNivel, meusRyous);
      }
      irParaAnimalLojaIdx(bs.best);
      return true;
    }

    limparBuscaAnimalLoja();
    console.warn('[Diario] Nenhum animal compravel encontrado na loja — seguindo para caçadas.');
    concluirDiarioGerenciada();
    return true;
  }

  function processarDiarioAnimal() {
    if (obterFaseDiario() !== 'animal') return false;

    var sub = 'meus';
    try { sub = sessionStorage.getItem(BOT_DIARIO_ANIMAL_SUB_KEY) || 'meus'; } catch (e) {}

    if (sub === 'comprando') {
      if (formVenderAnimalMeus()) {
        console.log('[Diario] Animal comprado com sucesso — seguindo para caçadas.');
        concluirDiarioGerenciada();
        return true;
      }
      if (url.indexOf('aba=loja') !== -1) {
        try { sessionStorage.setItem(BOT_DIARIO_ANIMAL_SUB_KEY, 'loja'); } catch (e) {}
        return processarDiarioAnimalLoja();
      }
      return true;
    }

    if (sub === 'done') {
      concluirDiarioGerenciada();
      return true;
    }

    var url = window.location.href;
    if (sub === 'meus' || url.indexOf('aba=meus') !== -1) {
      return processarDiarioAnimalMeus();
    }
    return processarDiarioAnimalLoja();
  }

  // --- Atacar Automações (prep Chrome + atacante Shizuo via Firebase) ---
  function automPrepProgLocalKey(suffix) {
    return 'BOT_AUTOM_PREP_' + normalizarLoginDiarioSequencia(obterUsuarioLogin()) + '_' + suffix;
  }

  function automPrepCicloSequenciaConcluido() {
    try { return sessionStorage.getItem(BOT_AUTOM_PREP_CICLO_CONCLUIDO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarAutomPrepCicloConcluido() {
    try { sessionStorage.setItem(BOT_AUTOM_PREP_CICLO_CONCLUIDO_KEY, '1'); } catch (e) {}
  }

  function limparAutomPrepCicloConcluido() {
    try { sessionStorage.removeItem(BOT_AUTOM_PREP_CICLO_CONCLUIDO_KEY); } catch (e) {}
  }

  function limparProgressoAutomPrepLogin(login) {
    var chave = 'BOT_AUTOM_PREP_' + normalizarLoginDiarioSequencia(login || obterUsuarioLogin()) + '_';
    try {
      localStorage.removeItem(chave + 'FEITAS');
      localStorage.removeItem(chave + 'PRESENTES');
    } catch (e) {}
  }

  function limparTodosProgressosAutomPrep() {
    for (var i = 0; i < DIARIO_LOGINS_SEQUENCIA.length; i++) {
      limparProgressoAutomPrepLogin(DIARIO_LOGINS_SEQUENCIA[i]);
    }
    try {
      localStorage.removeItem(BOT_AUTOM_PREP_LOGINS_FEITOS_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_FEITAS_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_PRESENTES_KEY);
    } catch (e) {}
    limparEstadoAutomPrep();
    limparAutomPrepCicloConcluido();
  }

  function lerAutomPrepFeitas() {
    try {
      var raw = sessionStorage.getItem(BOT_AUTOM_PREP_FEITAS_KEY) ||
        localStorage.getItem(automPrepProgLocalKey('FEITAS'));
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function salvarAutomPrepFeitas(feitas) {
    try {
      sessionStorage.setItem(BOT_AUTOM_PREP_FEITAS_KEY, JSON.stringify(feitas || []));
      localStorage.setItem(automPrepProgLocalKey('FEITAS'), JSON.stringify(feitas || []));
    } catch (e) {}
  }

  function marcarAutomPrepGerenciadaFeita(nome) {
    var norm = normalizarNomeCacadas(nome);
    if (!norm) return;
    var feitas = lerAutomPrepFeitas();
    if (feitas.indexOf(norm) === -1) feitas.push(norm);
    salvarAutomPrepFeitas(feitas);
  }

  function salvarAutomPrepPresentes(contas) {
    var lista = (contas || []).map(function(c) {
      return normalizarNomeCacadas(c.nome);
    }).filter(Boolean);
    try {
      sessionStorage.setItem(BOT_AUTOM_PREP_PRESENTES_KEY, JSON.stringify(lista));
      localStorage.setItem(automPrepProgLocalKey('PRESENTES'), JSON.stringify(lista));
    } catch (e) {}
  }

  function lerAutomPrepPresentesNorm() {
    try {
      var raw = sessionStorage.getItem(BOT_AUTOM_PREP_PRESENTES_KEY) ||
        localStorage.getItem(automPrepProgLocalKey('PRESENTES'));
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function marcarLoginAutomPrepFeito(login) {
    var norm = normalizarLoginDiarioSequencia(login || obterUsuarioLogin());
    try {
      var raw = localStorage.getItem(BOT_AUTOM_PREP_LOGINS_FEITOS_KEY);
      var feitos = raw ? JSON.parse(raw) : [];
      if (feitos.indexOf(norm) === -1) feitos.push(norm);
      localStorage.setItem(BOT_AUTOM_PREP_LOGINS_FEITOS_KEY, JSON.stringify(feitos));
    } catch (e) {}
  }

  function obterFaseAutomPrep() {
    try { return sessionStorage.getItem(BOT_AUTOM_PREP_FASE_KEY) || ''; } catch (e) {}
    return '';
  }

  function definirFaseAutomPrep(fase) {
    try {
      if (fase) sessionStorage.setItem(BOT_AUTOM_PREP_FASE_KEY, fase);
      else sessionStorage.removeItem(BOT_AUTOM_PREP_FASE_KEY);
    } catch (e) {}
  }

  function limparEstadoAutomPrep() {
    try {
      sessionStorage.removeItem(BOT_AUTOM_PREP_FASE_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_CONTA_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_REL_STEP_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_SUB_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_IDX_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_BS_KEY);
      sessionStorage.removeItem(BOT_HP_CURAR_AUTOM_PREP_KEY);
      sessionStorage.removeItem(BOT_AUTOM_COMBATE_KEY);
    } catch (e) {}
  }

  function salvarContextoAutomPrep(ctx) {
    try { sessionStorage.setItem(BOT_AUTOM_PREP_CONTA_KEY, JSON.stringify(ctx || {})); } catch (e) {}
  }

  function lerContextoAutomPrep() {
    try {
      var raw = sessionStorage.getItem(BOT_AUTOM_PREP_CONTA_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function atualizarContextoAutomPrep(partial) {
    var ctx = lerContextoAutomPrep() || {};
    for (var k in partial) {
      if (Object.prototype.hasOwnProperty.call(partial, k)) ctx[k] = partial[k];
    }
    salvarContextoAutomPrep(ctx);
    return ctx;
  }

  function chaveFirebaseAutomacaoFila(nome) {
    return normalizarChaveFirebaseRankingFila(nome);
  }

  function urlFirebaseAutomacao(path) {
    return FIREBASE_CONFIG.databaseURL + '/' + path + '.json';
  }

  function fetchFirebaseJson(url, opts) {
    return fetch(url, opts || { cache: 'no-store' }).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function patchFirebaseJson(path, dados, callback) {
    fetch(urlFirebaseAutomacao(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados || {})
    }).then(function(r) {
      if (callback) callback(r.ok);
    }).catch(function(err) {
      console.warn('[Autom Prep] Firebase PATCH falhou (' + path + '):', err);
      if (callback) callback(false);
    });
  }

  function lerAutomacaoCoord(callback) {
    fetchFirebaseJson(urlFirebaseAutomacao(AUTOMACAO_COORD_FB_PATH))
      .then(function(data) { callback(data && typeof data === 'object' ? data : {}); })
      .catch(function(err) {
        console.warn('[Autom Prep] Falha ao ler automacao_coord:', err);
        callback({});
      });
  }

  function gravarAutomacaoCoord(partial, callback) {
    patchFirebaseJson(AUTOMACAO_COORD_FB_PATH, partial, callback);
  }

  function gravarAutomacaoFilaItem(nome, partial, callback) {
    var chave = chaveFirebaseAutomacaoFila(nome);
    if (!chave) {
      if (callback) callback(false);
      return;
    }
    patchFirebaseJson(AUTOMACAO_FILA_FB_PATH + '/' + chave, partial, callback);
  }

  function listarAutomacaoFila(callback) {
    fetchFirebaseJson(urlFirebaseAutomacao(AUTOMACAO_FILA_FB_PATH))
      .then(function(data) {
        var lista = [];
        if (data && typeof data === 'object') {
          for (var k in data) {
            if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
            var item = data[k];
            if (!item || !item.nome) continue;
            item._fbKey = k;
            lista.push(item);
          }
        }
        lista.sort(function(a, b) {
          var oa = parseInt(a.ordem, 10);
          var ob = parseInt(b.ordem, 10);
          if (!isNaN(oa) && !isNaN(ob) && oa !== ob) return oa - ob;
          return String(a.nome || '').localeCompare(String(b.nome || ''));
        });
        callback(lista);
      })
      .catch(function(err) {
        console.warn('[Autom Prep] Falha ao ler automacao_fila:', err);
        callback([]);
      });
  }

  function dataHojeBrAutom() {
    try {
      return new Date().toLocaleDateString('pt-BR');
    } catch (e) {
      return String(new Date().getDate()).padStart(2, '0') + '/' +
        String(new Date().getMonth() + 1).padStart(2, '0') + '/' +
        new Date().getFullYear();
    }
  }

  function shizuoAtacouGerenciadaHojeCoord(coord, nome) {
    if (!coord || !nome) return false;
    if (coord.shizuo_atacados_data && coord.shizuo_atacados_data !== dataHojeBrAutom()) return false;
    var lista = coord.shizuo_atacados_hoje;
    if (!lista || !lista.length) return false;
    var norm = normalizarNomeCacadas(nome);
    for (var i = 0; i < lista.length; i++) {
      if (normalizarNomeCacadas(lista[i]) === norm) return true;
    }
    return false;
  }

  function registrarShizuoAtacouHoje(nome, callback) {
    var norm = normalizarNomeCacadas(nome);
    lerAutomacaoCoord(function(coord) {
      var hoje = dataHojeBrAutom();
      var lista = [];
      if (coord.shizuo_atacados_data === hoje && coord.shizuo_atacados_hoje) {
        lista = coord.shizuo_atacados_hoje.slice();
      }
      if (norm && lista.indexOf(norm) === -1) lista.push(norm);
      gravarAutomacaoCoord({
        shizuo_atacados_hoje: lista,
        shizuo_atacados_data: hoje,
        shizuo_cooldown_until: Date.now() + COOLDOWN_PENALIDADE_CACADAS_MS,
        shizuo_atacar: null
      }, callback);
    });
  }

  function obterTabelaRelatoriosGenerica(mapaColunas) {
    var col = document.getElementById('col_direita') || document;
    var linhas = col.querySelectorAll('tr');
    for (var i = 0; i < linhas.length; i++) {
      var celulas = linhas[i].cells;
      if (!celulas || celulas.length < 3) continue;
      var idx = {};
      for (var c = 0; c < celulas.length; c++) {
        var t = normalizarTextoCombate(textoCelulaRelatorio(celulas[c]));
        for (var chave in mapaColunas) {
          if (!Object.prototype.hasOwnProperty.call(mapaColunas, chave)) continue;
          var aliases = mapaColunas[chave];
          for (var a = 0; a < aliases.length; a++) {
            if (t === aliases[a]) idx[chave] = c;
          }
        }
      }
      if (idx.data === undefined) continue;
      var tabela = linhas[i].closest ? linhas[i].closest('table') : linhas[i].parentNode;
      if (tabela && tabela.tagName && tabela.tagName.toLowerCase() !== 'table') {
        tabela = tabela.parentNode;
      }
      if (!tabela || !tabela.rows) continue;
      return { tabela: tabela, idx: idx };
    }
    return null;
  }

  function coletarRelatoriosGenericos(infoTabela, mapaCampos) {
    if (!infoTabela || !infoTabela.tabela) return [];
    var lista = [];
    var rows = infoTabela.tabela.rows;
    for (var r = 0; r < rows.length; r++) {
      var celulas = rows[r].cells;
      if (!celulas || celulas.length <= infoTabela.idx.data) continue;
      var dataTexto = matchTextoDataHoraRelatorio(textoCelulaRelatorio(celulas[infoTabela.idx.data]));
      if (!dataTexto) dataTexto = matchTextoDataHoraRelatorio(textoCelulaRelatorio(rows[r]));
      if (!dataTexto) continue;
      var item = {
        ts: parseDataHoraRelatorioAtaque(dataTexto),
        dataTexto: dataTexto,
        resumo: textoCelulaRelatorio(rows[r])
      };
      for (var campo in mapaCampos) {
        if (!Object.prototype.hasOwnProperty.call(mapaCampos, campo)) continue;
        var idxCol = infoTabela.idx[mapaCampos[campo]];
        item[campo] = idxCol !== undefined ? extrairNomeJogadorDeCelula(celulas[idxCol]) : null;
      }
      lista.push(item);
    }
    return lista;
  }

  function coletarRelatoriosDefesa() {
    var info = obterTabelaRelatoriosGenerica({
      data: ['data'],
      atacante: ['atacante'],
      atacado: ['atacado', 'defensor'],
      vencedor: ['vencedor', 'vitoria', 'vitorias']
    });
    return coletarRelatoriosGenericos(info, {
      atacante: 'atacante',
      atacado: 'atacado',
      vencedor: 'vencedor'
    });
  }

  function relatorioRecenteMs(lista, limiteMs) {
    var agora = Date.now();
    for (var i = 0; i < lista.length; i++) {
      var ts = lista[i].ts;
      if (ts === null || ts === undefined || isNaN(ts)) continue;
      if (agora - ts <= limiteMs) return lista[i];
    }
    return null;
  }

  function montarMensagemAutomPrepSkip(nome, loginDono, motivo) {
    return '[Automacao Prep] Pulando **' + (nome || '?') + '** (' + (loginDono || '?') +
      ') — ' + motivo;
  }

  function montarMensagemAutomPrepTimeout(nome, loginDono) {
    return '**[Automacao Prep] Shizuo NAO atacou** (timeout 3 min)\n' +
      'Gerenciada: **' + (nome || '?') + '** (' + (loginDono || '?') + ')\n' +
      'Acao: recomprando pet para proteger a reserva. Proxima gerenciada so apos confirmar compra.';
  }

  function automPrepFaltaCooldownShizuoMs(coord) {
    if (!coord || !coord.shizuo_cooldown_until) return 0;
    var falta = coord.shizuo_cooldown_until - Date.now();
    return falta > 0 ? falta : 0;
  }

  function automPrepPularGerenciada(ctx, motivo, skipMotivo) {
    console.warn('[Autom Prep] Pulando ' + (ctx.nome || '?') + ' — ' + motivo);
    enviarDiscordTexto(montarMensagemAutomPrepSkip(ctx.nome, ctx.login_dono, motivo));
    gravarAutomacaoFilaItem(ctx.nome, {
      nome: ctx.nome,
      login_dono: ctx.login_dono,
      ordem: ctx.ordem,
      status: 'skip',
      skip_motivo: skipMotivo || motivo
    });
    marcarAutomPrepGerenciadaFeita(ctx.nome);
    limparEstadoAutomPrep();
    marcarRotacaoCicloPendente();
    window.location.href = URL_AUTOMACAO;
    return true;
  }

  function curarHpParaAutomPrep() {
    try { return sessionStorage.getItem(BOT_HP_CURAR_AUTOM_PREP_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarCurarHpAutomPrep() {
    try { sessionStorage.setItem(BOT_HP_CURAR_AUTOM_PREP_KEY, '1'); } catch (e) {}
  }

  function garantirHpParaAutomPrep(contexto) {
    if (!atacarAutomacoesPrepAtivo() || !estaEmContaGerenciada()) return true;
    var hp = obterStatusHp();
    if (curarHpAtivo()) {
      if (!curarHpParaAutomPrep()) marcarCurarHpAutomPrep();
      return false;
    }
    if (hp.ok && hpAtendeMinimoRaid(hp)) return true;
    console.log('[Autom Prep] HP baixo (<= ' + HP_MINIMO_RAID + ') — curando (' + contexto + ')');
    marcarCurarHpAutomPrep();
    redirecionarParaCurarHp('autom prep (' + contexto + ')');
    return false;
  }

  function garantirHpParaAutomAtacante(contexto) {
    if (!atacarAutomacoesAtacanteAtivo()) return true;
    var hp = obterStatusHp();
    if (curarHpAtivo()) return false;
    if (hp.ok && hp.current > HP_MINIMO_RAID) return true;
    console.log('[Autom Atacante] HP <= ' + HP_MINIMO_RAID + ' — curando (' + contexto + ')');
    redirecionarParaCurarHp('autom atacante (' + contexto + ')');
    return false;
  }

  function urlPosCurarHpAutom() {
    if (curarHpParaAutomPrep()) return URL_AUTOMACAO;
    if (atacarAutomacoesAtacanteAtivo()) return URL_RELATORIOS_ATAQUE;
    return URL_RELATORIOS_ATAQUE;
  }

  function iniciarAutomPrepPosAssume(nome, contaId) {
    var login = obterUsuarioLogin();
    var ctx = {
      nome: nome,
      contaId: contaId || '',
      login_dono: login,
      ordem: Date.now()
    };
    salvarContextoAutomPrep(ctx);
    definirFaseAutomPrep('validar');
    try { sessionStorage.setItem(BOT_AUTOM_PREP_REL_STEP_KEY, 'ataque'); } catch (e) {}
    console.log('[Autom Prep] Iniciando prep em ' + nome + ' (login ' + login + ')...');
    window.location.href = URL_RELATORIOS_ATAQUE;
  }

  function retomarAutomPrepPosAssume() {
    var ctx = lerContextoAutomPrep();
    var fase = obterFaseAutomPrep();
    if (!ctx || !ctx.nome) {
      iniciarAutomPrepPosAssume(extrairNomeUsuarioLogado(), '');
      return true;
    }
    if (!fase) {
      definirFaseAutomPrep('validar');
      try { sessionStorage.setItem(BOT_AUTOM_PREP_REL_STEP_KEY, 'ataque'); } catch (e) {}
    }
    console.log('[Autom Prep] Retomando prep em ' + ctx.nome + ' — fase ' + (fase || 'validar'));
    if (fase === 'quests') {
      window.location.href = URL_QUESTS;
      return true;
    }
    if (fase === 'hp') {
      window.location.href = 'https://shadowofshinobi.com/status';
      return true;
    }
    if (fase === 'comprar_pos_ataque' || fase === 'comprar_timeout') {
      definirSubAutomPrepAnimal('loja');
      limparBuscaAnimalLojaAutomPrep();
      window.location.href = URL_ANIMAL_LOJA;
      return true;
    }
    if (fase === 'aguardar_ataque') {
      window.location.href = URL_AUTOMACAO;
      return true;
    }
    if (fase === 'vender_inicial' || fase === 'prep_ate_venda' || fase === 'waiting_sell' ||
        fase === 'vender_sync') {
      window.location.href = URL_ANIMAL_MEUS;
      return true;
    }
    if (fase === 'validar') {
      var step = '';
      try { step = sessionStorage.getItem(BOT_AUTOM_PREP_REL_STEP_KEY) || 'ataque'; } catch (e) {}
      window.location.href = step === 'defesa' ? URL_RELATORIOS_DEFESA : URL_RELATORIOS_ATAQUE;
      return true;
    }
    window.location.href = URL_RELATORIOS_ATAQUE;
    return true;
  }

  function automPrepValidacaoInicialContinuar(ctx) {
    definirFaseAutomPrep('quests');
    window.location.href = URL_QUESTS;
    return true;
  }

  function processarAutomPrepRelatoriosValidacao() {
    if (!atacarAutomacoesPrepAtivo()) return false;
    var faseRel = obterFaseAutomPrep();
    if (!faseRel && lerContextoAutomPrep()) {
      definirFaseAutomPrep('validar');
      faseRel = 'validar';
    }
    if (faseRel !== 'validar') return false;
    var ctx = lerContextoAutomPrep();
    if (!ctx || !ctx.nome) return false;

    var step = 'ataque';
    try { step = sessionStorage.getItem(BOT_AUTOM_PREP_REL_STEP_KEY) || 'ataque'; } catch (e) {}

    if (step === 'ataque') {
      automPrepResgatarCompraSeAtacado(function(resgatou) {
        if (resgatou) return;
        lerAutomacaoCoord(function(coord) {
        if (shizuoAtacouGerenciadaHojeCoord(coord, ctx.nome)) {
          automPrepPularGerenciada(ctx, 'Shizuo ja atacou hoje', 'shizuo_ja_atacou_hoje');
          return;
        }
        var ataques = coletarRelatoriosAtaque();
        if (relatorioRecenteMs(ataques, AUTOM_PREP_PENALIDADE_MS)) {
          automPrepPularGerenciada(ctx, 'penalidade 30min (ataque feito)', 'penalidade_30m_ataque');
          return;
        }
        try { sessionStorage.setItem(BOT_AUTOM_PREP_REL_STEP_KEY, 'defesa'); } catch (e) {}
        window.location.href = URL_RELATORIOS_DEFESA;
        });
      });
      return true;
    }

    var defesas = coletarRelatoriosDefesa();
    if (relatorioRecenteMs(defesas, AUTOM_PREP_PENALIDADE_MS)) {
      automPrepPularGerenciada(ctx, 'penalidade 30min (sofreu ataque)', 'penalidade_30m_defesa');
      return true;
    }
    try { sessionStorage.removeItem(BOT_AUTOM_PREP_REL_STEP_KEY); } catch (e) {}
    return automPrepValidacaoInicialContinuar(ctx);
  }

  function automPrepQuestColetaDisponivel() {
    var inputs = document.querySelectorAll('input[name="acao"][value="coletar_todas"]');
    for (var i = 0; i < inputs.length; i++) {
      var form = inputs[i].closest('form');
      if (!form) continue;
      var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (!submitBtn || submitBtn.disabled) continue;
      return submitBtn;
    }
    var btnCollect = document.querySelector('.qx-btn-collect');
    if (btnCollect && !btnCollect.disabled) {
      var formBtn = btnCollect.closest('form');
      if (formBtn && formBtn.querySelector('input[name="acao"][value="coletar_todas"]')) {
        return btnCollect;
      }
    }
    return null;
  }

  function automPrepAvancarAposQuests(contexto) {
    if (!garantirHpParaAutomPrep(contexto || 'pos-quests')) return true;
    lerAutomacaoCoord(function(coord) {
      var emCooldown = coord.shizuo_cooldown_until && coord.shizuo_cooldown_until > Date.now();
      definirFaseAutomPrep(emCooldown ? 'prep_ate_venda' : 'vender_inicial');
      window.location.href = URL_ANIMAL_MEUS;
    });
    return true;
  }

  function processarAutomPrepQuests() {
    if (!atacarAutomacoesPrepAtivo()) return false;
    var fase = obterFaseAutomPrep();
    if (fase !== 'quests' && fase !== 'hp') return false;

    var submitBtn = automPrepQuestColetaDisponivel();
    if (submitBtn) {
      console.log('[Autom Prep] Coletando todas as quests...');
      submitBtn.click();
      return true;
    }

    console.log('[Autom Prep] Sem botao para coletar quests — pulando etapa.');
    return automPrepAvancarAposQuests('sem quests');
  }

  function processarAutomPrepPosQuests() {
    return processarAutomPrepQuests();
  }

  function automPrepPublicarReady(ctx) {
    var ts = Date.now();
    gravarAutomacaoFilaItem(ctx.nome, {
      nome: ctx.nome,
      login_dono: ctx.login_dono,
      ordem: ctx.ordem,
      status: 'ready',
      ready_ts: ts
    });
    gravarAutomacaoCoord({
      shizuo_atacar: ctx.nome,
      ordem_login_atual: ctx.login_dono
    });
    console.log('[Autom Prep] Ready publicado — Shizuo pode atacar ' + ctx.nome);
  }

  function automPrepBuscarReadyPendente(lista, login) {
    if (!lista || !lista.length) return null;
    for (var i = 0; i < lista.length; i++) {
      var item = lista[i];
      if (item.login_dono === login && item.status === 'ready') return item;
    }
    return null;
  }

  function automPrepAguardarAtaqueShizuo(ctx) {
    definirFaseAutomPrep('aguardar_ataque');
    limparEstadoAutomPrepAnimal();
    if (ctx && ctx.nome) {
      salvarContextoAutomPrep({
        nome: ctx.nome,
        login_dono: ctx.login_dono,
        ordem: ctx.ordem,
        contaId: ctx.contaId || ''
      });
    }
    console.log('[Autom Prep] Pet vendido — aguardando Shizuo atacar ' +
      (ctx && ctx.nome ? ctx.nome : '?') + ' antes da proxima gerenciada...');
    setTimeout(function() {
      window.location.href = URL_AUTOMACAO;
    }, 1200);
  }

  function automPrepEsperaCooldownNoHub(coord, ctx) {
    var falta = automPrepFaltaCooldownShizuoMs(coord);
    if (falta <= AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS) return false;
    var seg = Math.round(falta / 1000);
    var nome = ctx && ctx.nome ? ctx.nome : 'proxima gerenciada';
    console.log('[Autom Prep] Penalidade Shizuo (~' + seg + 's) — aguardando antes de ' + nome + '...');
    setTimeout(function() {
      window.location.reload();
    }, Math.min(8000, Math.max(falta - AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS, 3000)));
    return true;
  }

  function automPrepAgendarEsperaAtaque(lista, login) {
    var readyPend = automPrepBuscarReadyPendente(lista, login);
    if (!readyPend) return false;
    definirFaseAutomPrep('aguardar_ataque');
    salvarContextoAutomPrep({
      nome: readyPend.nome,
      login_dono: readyPend.login_dono,
      ordem: readyPend.ordem,
      contaId: readyPend.contaId || ''
    });
    var faltaMs = AUTOM_PREP_READY_TIMEOUT_MS;
    if (readyPend.ready_ts) {
      faltaMs = AUTOM_PREP_READY_TIMEOUT_MS - (Date.now() - readyPend.ready_ts);
      if (faltaMs < 0) faltaMs = 0;
    }
    var segRestantes = Math.round(faltaMs / 1000);
    console.log('[Autom Prep] Aguardando Shizuo atacar ' + readyPend.nome +
      ' (timeout em ~' + segRestantes + 's)...');
    if (segRestantes <= 30) {
      console.warn('[Autom Prep] Shizuo ainda nao atacou ' + readyPend.nome +
        ' — timeout em ' + segRestantes + 's.');
    }
    setTimeout(function() {
      window.location.reload();
    }, Math.min(8000, Math.max(faltaMs, 3000)));
    return true;
  }

  function automPrepVerificarReadyTimeout(callback) {
    listarAutomacaoFila(function(lista) {
      var agora = Date.now();
      var expirado = null;
      for (var i = 0; i < lista.length; i++) {
        var item = lista[i];
        if (item.status !== 'ready' || !item.ready_ts) continue;
        if (agora - item.ready_ts > AUTOM_PREP_READY_TIMEOUT_MS) {
          expirado = item;
          break;
        }
      }
      callback(expirado);
    });
  }

  function automPrepExecutarFallbackTimeout(item) {
    console.error('[Autom Prep] Shizuo NAO atacou em 3 min — ' + item.nome +
      '. Recomprando pet antes da proxima gerenciada.');
    enviarDiscordTexto(montarMensagemAutomPrepTimeout(item.nome, item.login_dono));
    gravarAutomacaoFilaItem(item.nome, {
      status: 'timeout_bought',
      ready_ts: null
    });
    gravarAutomacaoCoord({ shizuo_atacar: null });
    salvarContextoAutomPrep({
      nome: item.nome,
      login_dono: item.login_dono,
      ordem: item.ordem
    });
    definirFaseAutomPrep('comprar_timeout');
    try { sessionStorage.setItem(BOT_AUTOM_PREP_ANIMAL_SUB_KEY, 'loja'); } catch (e) {}
    window.location.href = URL_ANIMAL_LOJA;
    return true;
  }

  function limparEstadoAutomPrepAnimal() {
    try {
      sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_SUB_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_IDX_KEY);
      sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_BS_KEY);
    } catch (e) {}
  }

  function obterSubAutomPrepAnimal() {
    try { return sessionStorage.getItem(BOT_AUTOM_PREP_ANIMAL_SUB_KEY) || 'meus'; } catch (e) {}
    return 'meus';
  }

  function definirSubAutomPrepAnimal(sub) {
    try { sessionStorage.setItem(BOT_AUTOM_PREP_ANIMAL_SUB_KEY, sub); } catch (e) {}
  }

  function irParaAnimalLojaIdxAutomPrep(idx) {
    try { sessionStorage.setItem(BOT_AUTOM_PREP_ANIMAL_IDX_KEY, String(idx)); } catch (e) {}
    window.location.href = URL_ANIMAL_LOJA + '&idx=' + idx;
  }

  function obterBuscaAnimalLojaAutomPrep() {
    try {
      var raw = sessionStorage.getItem(BOT_AUTOM_PREP_ANIMAL_BS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function salvarBuscaAnimalLojaAutomPrep(bs) {
    try { sessionStorage.setItem(BOT_AUTOM_PREP_ANIMAL_BS_KEY, JSON.stringify(bs)); } catch (e) {}
  }

  function limparBuscaAnimalLojaAutomPrep() {
    try { sessionStorage.removeItem(BOT_AUTOM_PREP_ANIMAL_BS_KEY); } catch (e) {}
  }

  function comprarAnimalLojaAutomPrep(dados, meuNivel, meusRyous) {
    console.log('[Autom Prep] Comprando animal valor=' + formatarNumeroBr(dados.valor) + '...');
    limparBuscaAnimalLojaAutomPrep();
    definirSubAutomPrepAnimal('comprando');
    var btnC = dados.formComprar.querySelector('input[type="submit"], input[name="btn_comprar"]');
    if (btnC) btnC.click();
    else dados.formComprar.submit();
    return true;
  }

  function processarAutomPrepAnimalLoja() {
    var meuNivel = extrairNivelJogadorSidebar();
    var meusRyous = extrairRyousJogadorSidebar();
    var idxAtual = obterIdxAnimalLojaUrl();
    var dados = extrairDadosAnimalLojaPagina();

    if (dados && dados.jaPossuiAnimal) {
      limparBuscaAnimalLojaAutomPrep();
      definirSubAutomPrepAnimal('meus');
      window.location.href = URL_ANIMAL_MEUS;
      return true;
    }

    var bs = obterBuscaAnimalLojaAutomPrep();
    if (bs && bs.fase === 'comprar') {
      if (animalLojaCompravel(dados, meuNivel, meusRyous)) {
        return comprarAnimalLojaAutomPrep(dados, meuNivel, meusRyous);
      }
      limparBuscaAnimalLojaAutomPrep();
      bs = null;
    }

    if (!bs) {
      var maxIdx = extrairUltimoIdxAnimalLoja();
      if (maxIdx < 0) maxIdx = 0;
      bs = { low: 0, high: maxIdx, best: -1, fase: 'busca' };
      salvarBuscaAnimalLojaAutomPrep(bs);
      irParaAnimalLojaIdxAutomPrep(Math.floor((bs.low + bs.high) / 2));
      return true;
    }

    var compravel = animalLojaCompravel(dados, meuNivel, meusRyous);
    if (compravel) {
      bs.best = idxAtual;
      bs.low = idxAtual + 1;
    } else {
      bs.high = idxAtual - 1;
    }

    if (bs.low <= bs.high) {
      salvarBuscaAnimalLojaAutomPrep(bs);
      irParaAnimalLojaIdxAutomPrep(Math.floor((bs.low + bs.high) / 2));
      return true;
    }

    if (bs.best >= 0) {
      bs.fase = 'comprar';
      salvarBuscaAnimalLojaAutomPrep(bs);
      if (idxAtual === bs.best && compravel) {
        return comprarAnimalLojaAutomPrep(dados, meuNivel, meusRyous);
      }
      irParaAnimalLojaIdxAutomPrep(bs.best);
      return true;
    }

    limparBuscaAnimalLojaAutomPrep();
    console.warn('[Autom Prep] Nenhum animal compravel — seguindo fluxo.');
    return processarAutomPrepPosCompraAnimal();
  }

  function automPrepPetConfirmadoEmMeus() {
    return !!formVenderAnimalMeus();
  }

  function automPrepFinalizarPosCompraPet(ctx, fase) {
    var statusFinal = fase === 'comprar_timeout' ? 'timeout_bought' : 'prep_ok';
    gravarAutomacaoFilaItem(ctx.nome, { status: statusFinal, ready_ts: null });
    marcarAutomPrepGerenciadaFeita(ctx.nome);
    limparEstadoAutomPrep();
    if (fase === 'comprar_timeout') {
      console.log('[Autom Prep] Pet recomprado apos timeout (Shizuo NAO atacou) — ' +
        ctx.nome + ' concluida, proxima gerenciada.');
    } else {
      console.log('[Autom Prep] Pet recomprado pos-ataque — ' + ctx.nome +
        ' concluida, proxima gerenciada.');
    }
    marcarRotacaoCicloPendente();
    window.location.href = URL_AUTOMACAO;
  }

  function processarAutomPrepPosCompraAnimal() {
    var ctx = lerContextoAutomPrep();
    var fase = obterFaseAutomPrep();
    if (!ctx || !ctx.nome) return false;

    if (fase === 'comprar_pos_ataque' || fase === 'comprar_timeout') {
      if (!automPrepPetConfirmadoEmMeus()) {
        console.warn('[Autom Prep] Pet ainda nao confirmado em /animal/meus — ' + ctx.nome +
          ' (fase ' + fase + '). Voltando a loja...');
        definirSubAutomPrepAnimal('loja');
        limparBuscaAnimalLojaAutomPrep();
        window.location.href = URL_ANIMAL_LOJA;
        return true;
      }
      automPrepFinalizarPosCompraPet(ctx, fase);
      return true;
    }

    return false;
  }

  function processarAutomPrepAnimalMeus() {
    var ctx = lerContextoAutomPrep();
    var fase = obterFaseAutomPrep();
    if (!ctx) return false;

    if (fase === 'prep_ate_venda') {
      gravarAutomacaoFilaItem(ctx.nome, { status: 'waiting_sell' });
      definirFaseAutomPrep('waiting_sell');
      console.log('[Autom Prep] Prep ate venda — parado em /animal/meus (' + ctx.nome + ')');
      marcarRotacaoCicloPendente();
      window.location.href = URL_AUTOMACAO;
      return true;
    }

    if (fase === 'waiting_sell') {
      console.log('[Autom Prep] Em /animal/meus aguardando cooldown Shizuo para vender ' + ctx.nome + '...');
      lerAutomacaoCoord(function(coord) {
        var falta = automPrepFaltaCooldownShizuoMs(coord);
        if (falta > AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS) {
          setTimeout(function() {
            window.location.reload();
          }, Math.min(falta - AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS, 60000));
          return;
        }
        definirFaseAutomPrep('vender_sync');
        processarAutomPrepAnimalMeus();
      });
      return true;
    }

    if (fase === 'vender_sync' || fase === 'vender_inicial') {
      var formVender = formVenderAnimalMeus();
      if (formVender) {
        instalarConfirmAutoOkMissao();
        console.log('[Autom Prep] Vendendo animal (' + fase + ') — ' + ctx.nome + '...');
        var btn = formVender.querySelector('input[type="submit"]');
        if (btn) btn.click();
        else formVender.submit();
        return true;
      }
      if (fase === 'vender_inicial') {
        lerAutomacaoCoord(function(coord) {
          if (automPrepFaltaCooldownShizuoMs(coord) > AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS) {
            gravarAutomacaoFilaItem(ctx.nome, { status: 'waiting_sell' });
            definirFaseAutomPrep('waiting_sell');
            console.log('[Autom Prep] Penalidade Shizuo ativa — adiando venda de ' + ctx.nome);
            marcarRotacaoCicloPendente();
            window.location.href = URL_AUTOMACAO;
            return;
          }
          automPrepPublicarReady(ctx);
          automPrepAguardarAtaqueShizuo(ctx);
        });
        return true;
      }
      if (fase === 'vender_sync') {
        return processarAutomPrepPosVendaSync();
      }
      console.warn('[Autom Prep] Sem animal para vender em waiting_sell — voltando automacao.');
      marcarRotacaoCicloPendente();
      window.location.href = URL_AUTOMACAO;
      return true;
    }

    return false;
  }

  function processarAutomPrepPosVendaInicial() {
    var ctx = lerContextoAutomPrep();
    if (!ctx || obterFaseAutomPrep() !== 'vender_inicial') return false;
    lerAutomacaoCoord(function(coord) {
      if (automPrepFaltaCooldownShizuoMs(coord) > AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS) {
        gravarAutomacaoFilaItem(ctx.nome, { status: 'waiting_sell' });
        definirFaseAutomPrep('waiting_sell');
        console.log('[Autom Prep] Penalidade Shizuo ativa — adiando venda de ' + ctx.nome);
        marcarRotacaoCicloPendente();
        window.location.href = URL_AUTOMACAO;
        return;
      }
      automPrepPublicarReady(ctx);
      automPrepAguardarAtaqueShizuo(ctx);
    });
    return true;
  }

  function processarAutomPrepPosVendaSync() {
    var ctx = lerContextoAutomPrep();
    if (!ctx || obterFaseAutomPrep() !== 'vender_sync') return false;
    automPrepPublicarReady(ctx);
    automPrepAguardarAtaqueShizuo(ctx);
    return true;
  }

  function processarAutomPrepAnimal() {
    if (!atacarAutomacoesPrepAtivo() || !estaEmContaGerenciada()) return false;
    var fase = obterFaseAutomPrep();
    if (fase !== 'vender_inicial' && fase !== 'prep_ate_venda' && fase !== 'waiting_sell' &&
        fase !== 'vender_sync' && fase !== 'comprar_pos_ataque' && fase !== 'comprar_timeout') {
      return false;
    }

    var sub = obterSubAutomPrepAnimal();
    var url = window.location.href;

    if (sub === 'comprando') {
      if (formVenderAnimalMeus()) {
        return processarAutomPrepPosCompraAnimal();
      }
      if (url.indexOf('aba=loja') !== -1) {
        definirSubAutomPrepAnimal('loja');
        return processarAutomPrepAnimalLoja();
      }
      return true;
    }

    if (sub === 'loja' || url.indexOf('aba=loja') !== -1) {
      return processarAutomPrepAnimalLoja();
    }

    return processarAutomPrepAnimalMeus();
  }

  function automPrepEscolherProximaConta(contas) {
    if (!contas.length) return null;
    salvarAutomPrepPresentes(contas);
    var feitas = lerAutomPrepFeitas();
    for (var i = 0; i < contas.length; i++) {
      var norm = normalizarNomeCacadas(contas[i].nome);
      if (feitas.indexOf(norm) === -1) return contas[i];
    }
    return null;
  }

  function automPrepTodasGerenciadasFeitas() {
    var presentes = lerAutomPrepPresentesNorm();
    var feitas = lerAutomPrepFeitas();
    if (!presentes.length) return false;
    for (var i = 0; i < presentes.length; i++) {
      if (feitas.indexOf(presentes[i]) === -1) return false;
    }
    return true;
  }

  function automPrepConcluirLoginAtual() {
    marcarLoginAutomPrepFeito(obterUsuarioLogin());
    salvarAutomPrepFeitas([]);
    limparEstadoAutomPrep();
    var proximo = obterProximoLoginDiarioSequencia(obterUsuarioLogin());
    if (!proximo) {
      marcarAutomPrepCicloConcluido();
      console.log('[Autom Prep] Ciclo completo — Shiroe -> Shizuo -> Sora concluido.');
      return;
    }
    console.log('[Autom Prep] Login concluido — proximo: ' + proximo);
    irParaLoginDiarioMesmaAba(proximo);
  }

  function automPrepBloqueiaProximaGerenciada(lista, login) {
    var fase = obterFaseAutomPrep();
    if (fase === 'aguardar_ataque' || fase === 'comprar_pos_ataque' || fase === 'comprar_timeout') {
      return true;
    }
    if (!lista || !lista.length) return false;
    for (var i = 0; i < lista.length; i++) {
      var item = lista[i];
      if (item.login_dono !== login) continue;
      if (item.status === 'ready' || item.status === 'attacked') return true;
    }
    return false;
  }

  function automPrepRetomarCompraPendente() {
    var fase = obterFaseAutomPrep();
    if (fase !== 'comprar_pos_ataque' && fase !== 'comprar_timeout') return false;
    var ctx = lerContextoAutomPrep();
    if (!ctx || !ctx.nome) return false;
    console.log('[Autom Prep] Retomando compra de pet — ' + ctx.nome + ' (' + fase + ').');
    automPrepIniciarCompraPosAtaque(ctx, fase);
    return true;
  }

  function automPrepResgatarCompraSeAtacado(callback) {
    if (!atacarAutomacoesPrepAtivo()) {
      callback(false);
      return;
    }
    var fase = obterFaseAutomPrep();
    if (fase === 'comprar_pos_ataque' || fase === 'comprar_timeout' || fase === 'aguardar_ataque') {
      callback(false);
      return;
    }
    var ctx = lerContextoAutomPrep();
    if (!ctx || !ctx.nome) {
      callback(false);
      return;
    }
    listarAutomacaoFila(function(lista) {
      var login = obterUsuarioLogin();
      for (var i = 0; i < lista.length; i++) {
        var item = lista[i];
        if (item.login_dono !== login) continue;
        if (item.status !== 'attacked') continue;
        if (normalizarNomeCacadas(item.nome) !== normalizarNomeCacadas(ctx.nome)) continue;
        console.warn('[Autom Prep] Resgate pos-ataque — fase era ' + (fase || '?') +
          ', iniciando compra de pet em ' + item.nome + '.');
        automPrepIniciarCompraPosAtaque(item, 'comprar_pos_ataque');
        callback(true);
        return;
      }
      callback(false);
    });
  }

  function automPrepIniciarCompraPosAtaque(item, faseCompra) {
    var fase = faseCompra || 'comprar_pos_ataque';
    salvarContextoAutomPrep({
      nome: item.nome,
      login_dono: item.login_dono,
      ordem: item.ordem,
      contaId: item.contaId || ''
    });
    salvarUltimaGerenciadaSnapshot(item.nome, item.contaId || '');
    definirFaseAutomPrep(fase);
    definirSubAutomPrepAnimal('loja');
    limparBuscaAnimalLojaAutomPrep();
    var snap = { nome: item.nome, contaId: item.contaId || '' };
    var contas = extrairContasAutomacaoPagina();
    var conta = encontrarContaAutomacaoPorSnapshot(contas, snap);
    if (conta) {
      automacaoAssumirEmAndamento = true;
      marcarContaAutomacaoAssumida();
      var btn = conta.form.querySelector('input[type="submit"]');
      if (btn) btn.click();
      else conta.form.submit();
    } else {
      window.location.href = URL_ANIMAL_LOJA;
    }
  }

  function automPrepDetectarAtaqueConcluido(coord, lista, login) {
    var ctx = lerContextoAutomPrep();
    if (!ctx || !ctx.nome) return false;
    if (obterFaseAutomPrep() !== 'aguardar_ataque') return false;

    var itemCtx = null;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].login_dono !== login) continue;
      if (normalizarNomeCacadas(lista[i].nome) !== normalizarNomeCacadas(ctx.nome)) continue;
      itemCtx = lista[i];
      break;
    }
    if (!itemCtx) return false;

    if (itemCtx.status === 'attacked') {
      console.log('[Autom Prep] Shizuo atacou ' + itemCtx.nome + ' (status attacked) — comprando pet.');
      automPrepIniciarCompraPosAtaque(itemCtx);
      return true;
    }

    if (itemCtx.status === 'ready' && shizuoAtacouGerenciadaHojeCoord(coord, ctx.nome)) {
      console.log('[Autom Prep] Shizuo atacou ' + ctx.nome + ' (coord) — sincronizando attacked e comprando pet.');
      gravarAutomacaoFilaItem(ctx.nome, {
        status: 'attacked',
        ready_ts: null,
        ultimo_ataque_shizuo_ts: Date.now()
      });
      automPrepIniciarCompraPosAtaque(itemCtx);
      return true;
    }

    return false;
  }

  function processarAutomPrepPaginaAutomacao() {
    if (!atacarAutomacoesPrepAtivo()) return false;

    automPrepVerificarReadyTimeout(function(expirado) {
      if (expirado) {
        automPrepExecutarFallbackTimeout(expirado);
        return;
      }

      listarAutomacaoFila(function(lista) {
        var login = obterUsuarioLogin();
        var processarWaitingSell = function(coord) {
          for (var w = 0; w < lista.length; w++) {
            var ws = lista[w];
            if (ws.login_dono !== login || ws.status !== 'waiting_sell') continue;
            var falta = (coord.shizuo_cooldown_until || 0) - Date.now();
            if (falta > AUTOM_PREP_VENDA_ANTES_COOLDOWN_MS) continue;
            salvarContextoAutomPrep({
              nome: ws.nome,
              login_dono: ws.login_dono,
              ordem: ws.ordem,
              contaId: ws.contaId || ''
            });
            definirFaseAutomPrep('vender_sync');
            definirSubAutomPrepAnimal('meus');
            var contasWs = extrairContasAutomacaoPagina();
            var contaWs = encontrarContaAutomacaoPorSnapshot(contasWs, { nome: ws.nome, contaId: ws.contaId || '' });
            if (contaWs) {
              automacaoAssumirEmAndamento = true;
              marcarContaAutomacaoAssumida();
              var btnWs = contaWs.form.querySelector('input[type="submit"]');
              if (btnWs) btnWs.click();
              else contaWs.form.submit();
            } else {
              window.location.href = URL_ANIMAL_MEUS;
            }
            return true;
          }
          return false;
        };

        lerAutomacaoCoord(function(coord) {
          if (automPrepRetomarCompraPendente()) return;

          if (automPrepDetectarAtaqueConcluido(coord, lista, login)) return;

          for (var i = 0; i < lista.length; i++) {
            var item = lista[i];
            if (item.login_dono !== login) continue;
            if (item.status === 'attacked') {
              console.log('[Autom Prep] Shizuo atacou ' + item.nome + ' — comprando pet.');
              automPrepIniciarCompraPosAtaque(item, 'comprar_pos_ataque');
              return;
            }
          }

          if (automPrepAgendarEsperaAtaque(lista, login)) return;

          if (processarWaitingSell(coord)) return;

          if (automPrepBloqueiaProximaGerenciada(lista, login)) {
            console.warn('[Autom Prep] Ciclo pendente (espera/compra) — proxima gerenciada bloqueada.');
            setTimeout(function() { window.location.reload(); }, 8000);
            return;
          }

        if (automPrepTodasGerenciadasFeitas()) {
          automPrepConcluirLoginAtual();
          return;
        }

        if (automPrepEsperaCooldownNoHub(coord, null)) return;

        var contas = extrairContasAutomacaoPagina();
        var proxima = automPrepEscolherProximaConta(contas);
        if (!proxima) {
          automPrepConcluirLoginAtual();
          return;
        }

        automacaoAssumirEmAndamento = true;
        marcarContaAutomacaoAssumida();
        salvarUltimaGerenciadaSnapshot(proxima.nome, proxima.contaId);
        atualizarContextoAutomPrep({
          nome: proxima.nome,
          contaId: proxima.contaId,
          login_dono: obterUsuarioLogin(),
          ordem: Date.now()
        });
        console.warn('[Autom Prep] Assumindo ' + proxima.nome + ' (id ' + proxima.contaId + ')');
        var btnAssumir = proxima.form.querySelector('input[type="submit"]');
        if (btnAssumir) btnAssumir.click();
        else proxima.form.submit();
        });
      });
    });
    return true;
  }

  function marcarAutomCombateIniciado() {
    try { sessionStorage.setItem(BOT_AUTOM_COMBATE_KEY, '1'); } catch (e) {}
  }

  function consumirAutomCombateIniciado() {
    try {
      if (sessionStorage.getItem(BOT_AUTOM_COMBATE_KEY) === '1') {
        sessionStorage.removeItem(BOT_AUTOM_COMBATE_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function persistirAlvoAutomAtacante(nome) {
    if (!nome) return;
    try {
      sessionStorage.setItem(BOT_AUTOM_ATACANTE_ALVO_KEY, nome);
      localStorage.setItem(BOT_AUTOM_ATACANTE_ALVO_KEY, nome);
    } catch (e) {}
  }

  function obterAlvoAutomAtacantePersistido() {
    try {
      var s = sessionStorage.getItem(BOT_AUTOM_ATACANTE_ALVO_KEY) ||
        localStorage.getItem(BOT_AUTOM_ATACANTE_ALVO_KEY) || '';
      return s ? String(s) : '';
    } catch (e) {}
    return '';
  }

  function limparAlvoAutomAtacantePersistido() {
    try {
      sessionStorage.removeItem(BOT_AUTOM_ATACANTE_ALVO_KEY);
      localStorage.removeItem(BOT_AUTOM_ATACANTE_ALVO_KEY);
    } catch (e) {}
  }

  function restaurarModoAutomAtacanteSeNecessario() {
    if (!atacarAutomacoesAtacanteAtivo() || cacadaAtualPorNomeAutomacao()) return;
    var alvo = obterAlvoAutomAtacantePersistido();
    if (alvo) definirModoCacadasAutomacao(alvo);
  }

  function definirModoCacadasAutomacao(nome) {
    try {
      sessionStorage.setItem(BOT_CACADAS_MODO_KEY, 'automacao_atacar');
      sessionStorage.setItem(BOT_CACADAS_ALVO_NOME_KEY, nome);
    } catch (e) {}
    persistirAlvoAutomAtacante(nome);
    console.warn('[Autom Atacante] Alvo por nome: ' + nome);
  }

  function cacadaAtualPorNomeAutomacao() {
    return atacarAutomacoesAtacanteAtivo() &&
      obterModoCacadasSessao() === 'automacao_atacar' &&
      !!obterAlvoNomeCacadasSessao();
  }

  function buscarProximoAlvoAutomacaoAtacante(coord, callback) {
    listarAutomacaoFila(function(lista) {
      var alvoNome = coord && coord.shizuo_atacar ? coord.shizuo_atacar : '';
      if (alvoNome) {
        for (var i = 0; i < lista.length; i++) {
          if (normalizarNomeCacadas(lista[i].nome) === normalizarNomeCacadas(alvoNome) &&
              lista[i].status === 'ready') {
            callback(lista[i]);
            return;
          }
        }
      }
      for (var j = 0; j < lista.length; j++) {
        if (lista[j].status === 'ready') {
          callback(lista[j]);
          return;
        }
      }
      callback(null);
    });
  }

  function resolverAutomacaoAtacanteNoPortao(decisao, callback) {
    limparEstadoModoCacadas();
    lerAutomacaoCoord(function(coord) {
      buscarProximoAlvoAutomacaoAtacante(coord, function(alvo) {
        if (alvo) {
          definirModoCacadasAutomacao(alvo.nome);
          callback(true);
          return;
        }
        console.log('[Autom Atacante] Nenhum alvo ready — aguardando prep no portao...');
        callback(false);
      });
    });
  }

  function processarAutomAtacantePaginaCombate(parsed, dados) {
    if (!atacarAutomacoesAtacanteAtivo()) return false;

    var ctxNome = obterAlvoNomeCacadasSessao() || obterAlvoAutomAtacantePersistido();
    if ((!ctxNome || ctxNome === '(desconhecido)') && dados.inimigo && dados.inimigo !== '(desconhecido)') {
      ctxNome = dados.inimigo;
    }
    if (!ctxNome) return false;

    if (!cacadaAtualPorNomeAutomacao()) {
      definirModoCacadasAutomacao(ctxNome);
    }

    var flagCombate = consumirAutomCombateIniciado();
    var vitimaNorm = dados.inimigo ? normalizarNomeCacadas(dados.inimigo) : '';
    if (!flagCombate && vitimaNorm !== normalizarNomeCacadas(ctxNome)) {
      console.warn('[Autom Atacante] Combate sem flag e vitima divergente — ignorando.');
      irParaPortaoRelatorios('Autom atacante sem flag combate');
      return true;
    }
    if (!flagCombate) {
      console.warn('[Autom Atacante] Combate sem flag — reconhecendo vitima ' + ctxNome + '.');
    }
    if (parsed.resultado === 'vitoria') {
      gravarAutomacaoFilaItem(ctxNome, {
        status: 'attacked',
        ready_ts: null,
        ultimo_ataque_shizuo_ts: Date.now()
      });
      registrarShizuoAtacouHoje(ctxNome);
      console.log('[Autom Atacante] Vitoria confirmada contra ' + ctxNome);
    } else {
      gravarAutomacaoFilaItem(ctxNome, { status: 'ready' });
      console.warn('[Autom Atacante] Derrota contra ' + ctxNome + ' — mantendo ready.');
    }

    limparEstadoModoCacadas();
    limparAlvoAutomAtacantePersistido();
    irParaPortaoRelatorios('Autom atacante pos-combate');
    return true;
  }

  function processarAutomAtacantePaginaAtacar(btnAtacar) {
    if (!atacarAutomacoesAtacanteAtivo()) return false;
    restaurarModoAutomAtacanteSeNecessario();
    if (!cacadaAtualPorNomeAutomacao()) return false;
    if (!garantirHpParaAutomAtacante('pagina atacar')) return true;
    if (!garantirDoujutsuParaAtacar('autom atacante')) return true;
    marcarAutomCombateIniciado();
    atacarJaProcessado = true;
    btnAtacar.click();
    return true;
  }

  function processarDiarioPosCombateRaid() {
    if (obterFaseDiario() !== 'raid') return false;
    if (!consumirDiarioRaidEmCombate()) return false;
    return finalizarDiarioRaidPosCombate(null);
  }

  function paginaCacadasBloqueadaPorMissao() {
    if (document.getElementById('mn_timer')) return true;

    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');

    if (texto.indexOf('cacada bloqueada') !== -1 && texto.indexOf('missao') !== -1) return true;
    if (texto.indexOf('esta em missao') !== -1 && texto.indexOf('cacar') !== -1) return true;
    return texto.indexOf('conclua ou cancele a missao') !== -1;
  }

  function obterFormCancelarMissao() {
    var forms = document.querySelectorAll('form[action*="missoes"]');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('input[name="cancelar_missao"]')) return forms[i];
    }
    return null;
  }

  function obterFormReceberMissao() {
    var btn = document.getElementById('btn_receber_mis');
    if (!btn) return null;
    if (btn.style && btn.style.display === 'none') return null;
    return btn.closest('form');
  }

  function paginaMissoesComMissaoAtiva() {
    if (obterFormCancelarMissao()) return true;
    if (document.getElementById('missao_timer_mis')) return true;

    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
    return texto.indexOf('em missao') !== -1;
  }

  function missaoConcluidaAguardandoReceber() {
    if (obterFormReceberMissao()) return true;
    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
    return texto.indexOf('missao concluida') !== -1;
  }

  function processarCacadasBloqueadaPorMissao() {
    console.warn('[Missao] Caçadas bloqueadas — missao em andamento. Indo para /missoes...');
    window.location.href = URL_MISSOES;
    return true;
  }

  function obterFormReceberCacadaTempo() {
    var forms = document.querySelectorAll('form[action*="cacadas"]');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('input[name="receber_missao"]')) return forms[i];
    }
    return null;
  }

  function paginaCacadasComMissaoTempo() {
    if (document.getElementById('mn_timer')) return false;

    if (document.getElementById('missao_timer') && obterFormReceberCacadaTempo()) return true;

    var col = document.getElementById('col_direita');
    if (!col) return false;
    var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
    return texto.indexOf('missao especial de cacada') !== -1 &&
      texto.indexOf('iniciou uma cacada') !== -1;
  }

  function cacadaTempoRecompensaPronta() {
    var btn = document.getElementById('btn_receber');
    if (btn && btn.style.display !== 'none') return true;

    var aviso = document.getElementById('missao_aviso');
    if (aviso) {
      var t = normalizarTextoCombate(aviso.innerText || aviso.textContent || '');
      if (t.indexOf('missao concluida') !== -1) return true;
    }
    return false;
  }

  function processarCacadasMissaoTempo() {
    if (cacadaTempoRecompensaPronta()) {
      var btn = document.getElementById('btn_receber');
      if (btn) {
        console.log('[Caçada tempo] Recompensa pronta — recebendo...');
        btn.click();
        return true;
      }
    }

    console.log('[Caçada tempo] Em andamento (cooldown) — voltando ao portao de relatorios.');
    irParaPortaoRelatorios('Caçada por tempo em andamento', { rotacionarAutomacao: true });
    return true;
  }

  // --- Missão Novo: 1h + 3 ataques via ranking (sem acessar caçadas) ---
  function gravarMissaoNovoParam(valor) {
    var s = String(valor).trim().toLowerCase();
    if (s === '0' || s === 'false' || s === 'off' || s === 'nao' || s === 'não' || s === 'no') {
      try { localStorage.removeItem(BOT_MISSAO_NOVO_KEY); } catch (e) {}
      limparEstadoMissaoNovo();
      return true;
    }
    if (s === '1' || s === 'true' || s === 'on' || s === 'sim' || s === 'yes') {
      localStorage.setItem(BOT_MISSAO_NOVO_KEY, '1');
      return true;
    }
    return false;
  }

  function gravarMissaoNovoHorasParam(valor) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 1) return false;
    var p = lerParamsMissaoNovo();
    p.horas = n;
    salvarParamsMissaoNovo(p);
    return true;
  }

  function gravarMissaoNovoDiffParam(valor) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 1) return false;
    var p = lerParamsMissaoNovo();
    p.diffAlvo = n;
    salvarParamsMissaoNovo(p);
    return true;
  }

  function gravarMissaoNovoMinDiffParam(valor) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 1) return false;
    var p = lerParamsMissaoNovo();
    p.minDiff = n;
    salvarParamsMissaoNovo(p);
    return true;
  }

  function gravarMissaoNovoMaxRyousParam(valor) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 0) return false;
    var p = lerParamsMissaoNovo();
    p.maxRyous = n;
    salvarParamsMissaoNovo(p);
    return true;
  }

  function gravarMissaoNovoLimiteMinParam(valor) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 1) return false;
    var p = lerParamsMissaoNovo();
    p.limiteMinSegundoAtaque = n;
    salvarParamsMissaoNovo(p);
    return true;
  }

  function lerParamsMissaoNovo() {
    var base = {};
    for (var k in MISSAO_NOVO_DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(MISSAO_NOVO_DEFAULTS, k)) {
        base[k] = MISSAO_NOVO_DEFAULTS[k];
      }
    }
    try {
      var raw = localStorage.getItem(BOT_MISSAO_NOVO_PARAMS_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var sk in saved) {
          if (Object.prototype.hasOwnProperty.call(saved, sk)) base[sk] = saved[sk];
        }
      }
    } catch (e) {}
    if (base.minDiff > base.diffAlvo) {
      var tmpDiff = base.minDiff;
      base.minDiff = base.diffAlvo;
      base.diffAlvo = tmpDiff;
    }
    return base;
  }

  function salvarParamsMissaoNovo(params) {
    try { localStorage.setItem(BOT_MISSAO_NOVO_PARAMS_KEY, JSON.stringify(params)); } catch (e) {}
  }

  function missaoNovoAtivo() {
    try { return localStorage.getItem(BOT_MISSAO_NOVO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function missaoNovoPausaRotinaCacadas() {
    return missaoNovoAtivo();
  }

  function limparEstadoMissaoNovo() {
    try {
      sessionStorage.removeItem(BOT_MISSAO_NOVO_SLOT_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_TS_ATAQUE_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ALVO_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_CANDIDATOS_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_CAND_IDX_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_RANKING_OFF_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_RANK_SCAN_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_SCAN_INICIAL_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_RETRY_TS_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ATAQUE1_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ATAQUE2_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ATAQUE3_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ESPERA_SLOT_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ESPERA_TS_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ATACADOS_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_COLETAR_REL_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_VALIDAR_REL_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_COMBATE_KEY);
    } catch (e) {}
  }

  function marcarColetarRelatorioMissaoNovo() {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_COLETAR_REL_KEY, '1'); } catch (e) {}
  }

  function limparColetarRelatorioMissaoNovo() {
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_COLETAR_REL_KEY); } catch (e) {}
  }

  function pendingColetarRelatorioMissaoNovo() {
    try { return sessionStorage.getItem(BOT_MISSAO_NOVO_COLETAR_REL_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarValidarRelatorioMissaoNovo() {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_VALIDAR_REL_KEY, '1'); } catch (e) {}
  }

  function limparValidarRelatorioMissaoNovo() {
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_VALIDAR_REL_KEY); } catch (e) {}
  }

  function pendingValidarRelatorioMissaoNovo() {
    try { return sessionStorage.getItem(BOT_MISSAO_NOVO_VALIDAR_REL_KEY) === '1'; } catch (e) {}
    return false;
  }

  function ehPaginaMensagens() {
    try {
      return (window.location.pathname || '').indexOf('mensagens') !== -1;
    } catch (e) {}
    return false;
  }

  function abaRelatoriosAtaqueVisivel() {
    var url = window.location.href || '';
    if (url.indexOf('relatorios_ataque') !== -1) return true;
    if (document.querySelector('.msg-pipetabs a.active[href*="relatorios_ataque"]')) return true;
    if (obterTabelaRelatoriosAtaque()) return true;
    try {
      if (coletarRelatoriosAtaque().length > 0) return true;
    } catch (e) {}
    return false;
  }

  function missaoNovoDeveColetarRelatorio() {
    if (!missaoNovoAtivo() || !emFluxoAtaqueMissaoNovo()) return false;
    if (pendingColetarRelatorioMissaoNovo()) return true;
    try {
      return new URLSearchParams(window.location.search).get('bot_missao_novo_coletar') === '1';
    } catch (e) {}
    return false;
  }

  function missaoNovoDeveValidarRelatorio() {
    if (!missaoNovoAtivo() || !emFluxoAtaqueMissaoNovo()) return false;
    if (pendingValidarRelatorioMissaoNovo()) return true;
    try {
      return new URLSearchParams(window.location.search).get('bot_missao_novo_validar') === '1';
    } catch (e) {}
    return false;
  }

  function irParaAbaRelatoriosAtaqueMissaoNovo() {
    var link = document.querySelector(
      '.msg-pipetabs a[href*="relatorios_ataque"], a[href*="tab=relatorios_ataque"]'
    );
    if (link && link.href) {
      window.location.href = link.href;
      return;
    }
    window.location.href = URL_RELATORIOS_ATAQUE;
  }

  function lerAtacadosMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_ATACADOS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {};
  }

  function salvarAtacadosMissaoNovo(mapa) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_ATACADOS_KEY, JSON.stringify(mapa || {})); } catch (e) {}
  }

  function ehAtaqueRelatorioHojeMissaoNovo(ts) {
    if (ts === null || ts === undefined || isNaN(ts)) return true;
    var d = new Date(ts);
    var hoje = new Date();
    return d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear();
  }

  function coletarAtacadosRelatorioParaMissaoNovo() {
    var ataques = extrairAtaquesRelatorios();
    var mapa = {};
    var hoje = 0;
    for (var i = 0; i < ataques.length; i++) {
      var a = ataques[i];
      if (!a || !a.vitima) continue;
      if (!ehAtaqueRelatorioHojeMissaoNovo(a.ts)) continue;
      hoje++;
      mapa[a.vitimaNorm || normalizarNomeCacadas(a.vitima)] = a.vitima;
    }
    salvarAtacadosMissaoNovo(mapa);
    return { mapa: mapa, total: Object.keys(mapa).length, relatorio: ataques.length, hoje: hoje };
  }

  function adicionarAtacadoMissaoNovo(nome) {
    if (!nome) return;
    var mapa = lerAtacadosMissaoNovo();
    mapa[normalizarNomeCacadas(nome)] = nome;
    salvarAtacadosMissaoNovo(mapa);
  }

  function missaoNovoJaAtacou(nome) {
    if (!nome) return false;
    return !!lerAtacadosMissaoNovo()[normalizarNomeCacadas(nome)];
  }

  function limparFalhasExpiradasMissaoNovo(mapa) {
    var now = Date.now();
    for (var k in mapa) {
      if (!Object.prototype.hasOwnProperty.call(mapa, k)) continue;
      var entry = mapa[k];
      var ts = typeof entry === 'number' ? entry : (entry && entry.ts);
      if (!ts || now - ts > MISSAO_NOVO_FALHA_TTL_MS) delete mapa[k];
    }
    return mapa;
  }

  function lerFalhasMissaoNovo() {
    try {
      var raw = localStorage.getItem(BOT_MISSAO_NOVO_FALHAS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          var limpo = limparFalhasExpiradasMissaoNovo(parsed);
          salvarFalhasMissaoNovo(limpo);
          return limpo;
        }
      }
    } catch (e) {}
    return {};
  }

  function salvarFalhasMissaoNovo(mapa) {
    try { localStorage.setItem(BOT_MISSAO_NOVO_FALHAS_KEY, JSON.stringify(mapa || {})); } catch (e) {}
  }

  function registrarFalhaMissaoNovo(nome, motivo) {
    if (!nome) return;
    var mapa = lerFalhasMissaoNovo();
    mapa[normalizarNomeCacadas(nome)] = {
      nome: String(nome),
      ts: Date.now(),
      motivo: String(motivo || '')
    };
    salvarFalhasMissaoNovo(mapa);
    console.log('[Missao Novo] Falha registrada vs ' + nome + ' (' + (motivo || '?') +
      ') — bloqueado por ' + Math.round(MISSAO_NOVO_FALHA_TTL_MS / 60000) + 'min');
  }

  function missaoNovoBloqueadoPorFalhaRecente(nome) {
    if (!nome) return false;
    var mapa = lerFalhasMissaoNovo();
    var entry = mapa[normalizarNomeCacadas(nome)];
    if (!entry) return false;
    var ts = typeof entry === 'number' ? entry : entry.ts;
    if (!ts) return false;
    return (Date.now() - ts) <= MISSAO_NOVO_FALHA_TTL_MS;
  }

  function montarUrlRelatorioMissaoNovoColetar() {
    return URL_RELATORIOS_ATAQUE + '&bot_missao_novo_coletar=1&bot_modo=cacadas';
  }

  function salvarRetornoHpMissaoNovo(url) {
    if (!url) return;
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_HP_RETORNO_KEY, String(url)); } catch (e) {}
  }

  function lerRetornoHpMissaoNovo() {
    try { return sessionStorage.getItem(BOT_MISSAO_NOVO_HP_RETORNO_KEY) || ''; } catch (e) {}
    return '';
  }

  function limparRetornoHpMissaoNovo() {
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_HP_RETORNO_KEY); } catch (e) {}
  }

  function urlPosCurarHpMissaoNovo() {
    var retorno = lerRetornoHpMissaoNovo();
    if (retorno) {
      limparRetornoHpMissaoNovo();
      return retorno;
    }
    return URL_MISSOES;
  }

  function garantirModoCacadasMissaoNovo() {
    if (missaoNovoAtivo() && obterModoAba() !== 'cacadas') gravarModoAba('cacadas');
  }

  function prepararCuraHpMissaoNovo(contexto) {
    garantirModoCacadasMissaoNovo();
    marcarCurarHpMissaoNovo();
    if (emFluxoAtaqueMissaoNovo()) {
      var urlAtual = window.location.href || '';
      if (urlAtual.indexOf('status') === -1 && urlAtual.indexOf('mercado') === -1) {
        salvarRetornoHpMissaoNovo(urlAtual);
      }
    }
    redirecionarParaCurarHp('missao novo (' + contexto + ')');
  }

  function marcarAtaqueMissaoNovoFeito(slot) {
    try {
      if (slot === 3) sessionStorage.setItem(BOT_MISSAO_NOVO_ATAQUE3_KEY, '1');
      else if (slot === 2) sessionStorage.setItem(BOT_MISSAO_NOVO_ATAQUE2_KEY, '1');
      else sessionStorage.setItem(BOT_MISSAO_NOVO_ATAQUE1_KEY, '1');
    } catch (e) {}
  }

  function ataqueMissaoNovoFeito(slot) {
    try {
      if (slot === 3) return sessionStorage.getItem(BOT_MISSAO_NOVO_ATAQUE3_KEY) === '1';
      if (slot === 2) return sessionStorage.getItem(BOT_MISSAO_NOVO_ATAQUE2_KEY) === '1';
      return sessionStorage.getItem(BOT_MISSAO_NOVO_ATAQUE1_KEY) === '1';
    } catch (e) {}
    return false;
  }

  function definirSlotAtaqueMissaoNovo(slot) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_SLOT_KEY, String(slot)); } catch (e) {}
  }

  function obterSlotAtaqueMissaoNovo() {
    try {
      var s = sessionStorage.getItem(BOT_MISSAO_NOVO_SLOT_KEY);
      if (s === '3') return 3;
      if (s === '2') return 2;
    } catch (e) {}
    return 1;
  }

  function sortearEsperaHumanaMissaoNovo() {
    var min = MISSAO_NOVO_ESPERA_HUMANA_MIN_SEG;
    var max = MISSAO_NOVO_ESPERA_HUMANA_MAX_SEG;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function salvarEsperaAtaqueMissaoNovo(slot, segundos) {
    try {
      sessionStorage.setItem(BOT_MISSAO_NOVO_ESPERA_SLOT_KEY, String(slot));
      sessionStorage.setItem(BOT_MISSAO_NOVO_ESPERA_TS_KEY, String(Date.now() + segundos * 1000));
    } catch (e) {}
  }

  function limparEsperaAtaqueMissaoNovo() {
    try {
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ESPERA_SLOT_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ESPERA_TS_KEY);
    } catch (e) {}
  }

  function lerEsperaHumanaSlotMissaoNovo() {
    try {
      var s = sessionStorage.getItem(BOT_MISSAO_NOVO_ESPERA_SLOT_KEY);
      if (s === '3') return 3;
      if (s === '2') return 2;
      if (s === '1') return 1;
    } catch (e) {}
    return null;
  }

  function segundosRestantesEsperaHumanaMissaoNovo() {
    try {
      var ts = parseInt(sessionStorage.getItem(BOT_MISSAO_NOVO_ESPERA_TS_KEY), 10);
      if (!ts || isNaN(ts)) return 0;
      return Math.max(0, Math.ceil((ts - Date.now()) / 1000));
    } catch (e) {}
    return 0;
  }

  function resolverProximoAtaqueMissaoNovo(restante) {
    if (!ataqueMissaoNovoFeito(1)) {
      return { slot: 1, rotulo: 'inicio' };
    }
    if (!ataqueMissaoNovoFeito(2)) {
      if (restante === null || restante > MISSAO_NOVO_ATAQUE2_RESTANTE_SEG) return null;
      return { slot: 2, rotulo: '45min restantes' };
    }
    if (!ataqueMissaoNovoFeito(3)) {
      if (restante === null || restante > MISSAO_NOVO_ATAQUE3_RESTANTE_SEG) return null;
      return { slot: 3, rotulo: '15min restantes' };
    }
    return null;
  }

  function calcularRecheckAteProximoAtaqueMissaoNovo(restante) {
    if (restante === null || restante <= 0) return 60;
    if (!ataqueMissaoNovoFeito(1)) return 30;
    if (!ataqueMissaoNovoFeito(2) && restante > MISSAO_NOVO_ATAQUE2_RESTANTE_SEG) {
      return Math.min(restante - MISSAO_NOVO_ATAQUE2_RESTANTE_SEG + 5, 120);
    }
    if (!ataqueMissaoNovoFeito(3) && restante > MISSAO_NOVO_ATAQUE3_RESTANTE_SEG) {
      return Math.min(restante - MISSAO_NOVO_ATAQUE3_RESTANTE_SEG + 5, 120);
    }
    return 30;
  }

  function processarAtaquesAgendadosMissaoNovo(restante) {
    var prox = resolverProximoAtaqueMissaoNovo(restante);
    if (!prox) {
      agendarRecheckMissaoNovo(calcularRecheckAteProximoAtaqueMissaoNovo(restante));
      return true;
    }

    var esperaSlot = lerEsperaHumanaSlotMissaoNovo();
    if (esperaSlot !== prox.slot) {
      limparEsperaAtaqueMissaoNovo();
      var segHum = sortearEsperaHumanaMissaoNovo();
      salvarEsperaAtaqueMissaoNovo(prox.slot, segHum);
      console.log('[Missao Novo] Ataque ' + prox.slot + ' (' + prox.rotulo + ') liberado — aguardando ' +
        segHum + 's antes de iniciar (humanizado)...');
      agendarRecheckMissaoNovo(segHum);
      return true;
    }

    var segRest = segundosRestantesEsperaHumanaMissaoNovo();
    if (segRest > 0) {
      console.log('[Missao Novo] Ataque ' + prox.slot + ' (' + prox.rotulo + ') — faltam ' + segRest + 's...');
      agendarRecheckMissaoNovo(segRest);
      return true;
    }

    limparEsperaAtaqueMissaoNovo();
    if (!garantirHpParaMissaoNovoAtacar('antes ataque ' + prox.slot)) return true;
    iniciarFluxoAtaqueMissaoNovo(prox.slot);
    return true;
  }

  function emFluxoAtaqueMissaoNovo() {
    try { return !!sessionStorage.getItem(BOT_MISSAO_NOVO_SLOT_KEY); } catch (e) {}
    return false;
  }

  function salvarAlvoMissaoNovo(nome) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_ALVO_KEY, String(nome || '')); } catch (e) {}
  }

  function lerAlvoMissaoNovo() {
    try { return sessionStorage.getItem(BOT_MISSAO_NOVO_ALVO_KEY) || ''; } catch (e) {}
    return '';
  }

  function limparAlvoMissaoNovo() {
    try {
      sessionStorage.removeItem(BOT_MISSAO_NOVO_ALVO_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_TS_ATAQUE_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_COMBATE_KEY);
    } catch (e) {}
  }

  function marcarCombateMissaoNovo() {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_COMBATE_KEY, '1'); } catch (e) {}
  }

  function combateMissaoNovoOcorreu() {
    try { return sessionStorage.getItem(BOT_MISSAO_NOVO_COMBATE_KEY) === '1'; } catch (e) {}
    return false;
  }

  function limparCombateMissaoNovo() {
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_COMBATE_KEY); } catch (e) {}
  }

  function tentativaAtaqueMissaoNovoEmAndamento() {
    if (!emFluxoAtaqueMissaoNovo()) return false;
    if (pendingColetarRelatorioMissaoNovo()) return false;
    if (pendingValidarRelatorioMissaoNovo()) return false;
    if (missaoNovoAguardandoRetentativaRanking()) return false;
    if (combateMissaoNovoOcorreu()) return false;
    return !!(lerAlvoMissaoNovo() || lerTsAntesAtaqueMissaoNovo());
  }

  function processarInterrupcaoAtaqueMissaoNovoSemCombate(contexto) {
    if (!tentativaAtaqueMissaoNovoEmAndamento()) return false;
    falhaAtaqueMissaoNovoTentarProximo(contexto || 'ataque interrompido sem combate');
    return true;
  }

  function salvarTsAntesAtaqueMissaoNovo() {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_TS_ATAQUE_KEY, String(Date.now() - 3000)); } catch (e) {}
  }

  function lerTsAntesAtaqueMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_TS_ATAQUE_KEY);
      if (raw) return parseInt(raw, 10);
    } catch (e) {}
    return null;
  }

  function salvarCandidatosMissaoNovo(lista) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_CANDIDATOS_KEY, JSON.stringify(lista || [])); } catch (e) {}
  }

  function lerCandidatosMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_CANDIDATOS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function salvarCandIdxMissaoNovo(idx) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_CAND_IDX_KEY, String(idx)); } catch (e) {}
  }

  function lerCandIdxMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_CAND_IDX_KEY);
      if (raw !== null && raw !== '') return parseInt(raw, 10) || 0;
    } catch (e) {}
    return 0;
  }

  function salvarRankingOffMissaoNovo(off) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_RANKING_OFF_KEY, String(off)); } catch (e) {}
  }

  function lerRankingOffMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_RANKING_OFF_KEY);
      if (raw !== null && raw !== '') return parseInt(raw, 10) || 0;
    } catch (e) {}
    return 0;
  }

  function lerRankingUltimoMissaoNovo() {
    try {
      var raw = localStorage.getItem(BOT_MISSAO_NOVO_RANKING_ULTIMO_KEY);
      if (raw !== null && raw !== '') return parseInt(raw, 10) || 0;
    } catch (e) {}
    return 0;
  }

  function salvarRankingUltimoMissaoNovo(off) {
    var n = typeof off === 'number' ? off : 0;
    try {
      localStorage.setItem(BOT_MISSAO_NOVO_RANKING_ULTIMO_KEY, String(n));
      console.log('[Missao Novo] Ranking salvo em localStorage (' + BOT_MISSAO_NOVO_RANKING_ULTIMO_KEY + '=' + n + ')');
    } catch (e) {
      console.warn('[Missao Novo] Falha ao salvar ranking em localStorage:', e);
    }
  }

  function limparScanRankingMissaoNovo() {
    try {
      sessionStorage.removeItem(BOT_MISSAO_NOVO_RANK_SCAN_KEY);
      sessionStorage.removeItem(BOT_MISSAO_NOVO_SCAN_INICIAL_KEY);
    } catch (e) {}
  }

  function salvarScanInicialOffMissaoNovo(off) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_SCAN_INICIAL_KEY, String(typeof off === 'number' ? off : 0)); } catch (e) {}
  }

  function lerScanInicialOffMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_SCAN_INICIAL_KEY);
      if (raw !== null && raw !== '') return parseInt(raw, 10) || 0;
    } catch (e) {}
    return lerRankingOffMissaoNovo();
  }

  function missaoNovoAguardandoRetentativaRanking() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_RETRY_TS_KEY);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      if (!ts || Date.now() >= ts) {
        sessionStorage.removeItem(BOT_MISSAO_NOVO_RETRY_TS_KEY);
        return false;
      }
      return true;
    } catch (e) {}
    return false;
  }

  function segundosRestantesRetentativaRankingMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_RETRY_TS_KEY);
      if (!raw) return 0;
      var ts = parseInt(raw, 10);
      if (!ts) return 0;
      return Math.max(1, Math.ceil((ts - Date.now()) / 1000));
    } catch (e) {}
    return 0;
  }

  function agendarRetentativaRankingMissaoNovo(motivo) {
    var slot = obterSlotAtaqueMissaoNovo();
    console.warn('[Missao Novo] ' + motivo + ' — nova tentativa de ataque ' + slot +
      ' em ' + MISSAO_NOVO_RETRY_RANKING_SEG + 's.');
    limparAlvoMissaoNovo();
    salvarCandidatosMissaoNovo([]);
    salvarCandIdxMissaoNovo(0);
    limparScanRankingMissaoNovo();
    try {
      sessionStorage.setItem(BOT_MISSAO_NOVO_RETRY_TS_KEY,
        String(Date.now() + MISSAO_NOVO_RETRY_RANKING_SEG * 1000));
    } catch (e) {}
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_SLOT_KEY); } catch (e) {}
    salvarRankingOffMissaoNovo(lerRankingUltimoMissaoNovo());
    window.location.href = URL_MISSOES;
  }

  function lerScanRankingMissaoNovo() {
    try {
      var raw = sessionStorage.getItem(BOT_MISSAO_NOVO_RANK_SCAN_KEY);
      if (raw !== null && raw !== '') return parseInt(raw, 10) || 0;
    } catch (e) {}
    return 0;
  }

  function salvarScanRankingMissaoNovo(n) {
    try { sessionStorage.setItem(BOT_MISSAO_NOVO_RANK_SCAN_KEY, String(n)); } catch (e) {}
  }

  function extrairPosicaoRankingJogador() {
    var divs = document.querySelectorAll('.avisos_erro');
    for (var i = 0; i < divs.length; i++) {
      var t = (divs[i].textContent || divs[i].innerText || '').replace(/\s+/g, ' ').trim();
      var m = t.match(/Sua\s+posi(?:c|ç)(?:a|ã)o\s*:\s*(\d+)/i);
      if (m) return parseInt(m[1], 10) || null;
    }
    return null;
  }

  function salvarPosicaoRankingMissaoNovo(pos) {
    if (!pos || pos < 1) return;
    try { localStorage.setItem(BOT_MISSAO_NOVO_POSICAO_KEY, String(pos)); } catch (e) {}
  }

  function lerPosicaoRankingMissaoNovo() {
    try {
      var raw = localStorage.getItem(BOT_MISSAO_NOVO_POSICAO_KEY);
      if (raw !== null && raw !== '') return parseInt(raw, 10) || 0;
    } catch (e) {}
    return 0;
  }

  function offsetRankingPorPosicao(posicao) {
    if (!posicao || posicao < 1) return 0;
    return Math.max(0, Math.floor((posicao - 1) / MISSAO_NOVO_PASSO_RANKING) * MISSAO_NOVO_PASSO_RANKING);
  }

  function resolverOffsetInicialRankingMissaoNovo() {
    var ultimo = lerRankingUltimoMissaoNovo();
    if (ultimo > 0) {
      return { offset: ultimo, origem: 'ultimo ataque ok' };
    }
    var pos = lerPosicaoRankingMissaoNovo();
    if (pos > 0) {
      var offPos = offsetRankingPorPosicao(pos);
      return { offset: offPos, origem: 'sua posicao #' + pos + ' (ranking=' + offPos + ')' };
    }
    return { offset: 0, origem: 'sem historico (detecta posicao na pagina)' };
  }

  function tentarPularParaPosicaoRankingMissaoNovo() {
    if (lerRankingUltimoMissaoNovo() > 0) return false;
    if (lerScanRankingMissaoNovo() > 0) return false;

    var posicao = extrairPosicaoRankingJogador();
    if (posicao) salvarPosicaoRankingMissaoNovo(posicao);
    if (!posicao) return false;

    var alvo = offsetRankingPorPosicao(posicao);
    var offsetAtual = lerRankingOffMissaoNovo();
    if (alvo === offsetAtual) return false;

    console.log('%c[Missao Novo] Posicao #' + posicao + ' — pulando para ranking=' + alvo +
      ' (pagina do seu nivel, era ' + offsetAtual + ')',
      'color:#3498db;font-weight:bold');
    salvarRankingOffMissaoNovo(alvo);
    salvarScanInicialOffMissaoNovo(alvo);
    salvarCandIdxMissaoNovo(0);
    salvarCandidatosMissaoNovo([]);
    limparAlvoMissaoNovo();
    window.location.href = montarUrlRankingMissao(alvo);
    return true;
  }

  function diffNivelMissaoNovo(j, meuNivel) {
    if (!j || j.nivel === null || meuNivel === null) return -1;
    return meuNivel - j.nivel;
  }

  function maxDiffPossivelPaginaRanking(jogadores, meuNivel) {
    if (!jogadores || !jogadores.length || meuNivel === null) return -1;
    var minNivel = null;
    for (var i = 0; i < jogadores.length; i++) {
      var n = jogadores[i] && jogadores[i].nivel;
      if (n === null || n === undefined) continue;
      if (minNivel === null || n < minNivel) minNivel = n;
    }
    if (minNivel === null) return -1;
    return meuNivel - minNivel;
  }

  function deveDescerRankingPorDiffMissaoNovo(candidatos, jogadores, meuNivel, params) {
    if (!candidatos || !candidatos.length || !params) return false;
    var melhorDiff = diffNivelMissaoNovo(candidatos[0], meuNivel);
    if (melhorDiff < 0 || melhorDiff >= params.diffAlvo) return false;
    var maxDiffPag = maxDiffPossivelPaginaRanking(jogadores, meuNivel);
    return maxDiffPag >= 0 && maxDiffPag < params.diffAlvo;
  }

  function parseNivelReqMissao(texto) {
    if (!texto) return 0;
    var t = normalizarTextoCombate(texto);
    if (t.indexOf('qualquer') !== -1) return 0;
    var m = String(texto).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 999999;
  }

  function parseRyousMissaoHora(texto) {
    if (!texto) return 0;
    var s = String(texto).replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function extrairMissoesDisponiveisPagina() {
    var out = [];
    var rows = document.querySelectorAll('table.box_largura_100 tr');
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var form = tr.querySelector('form[action*="missoes"] input[name="missao_id"]');
      if (!form) continue;
      var formEl = form.closest('form');
      if (!formEl) continue;
      var selectHoras = formEl.querySelector('select[name="horas"]');
      if (!selectHoras) continue;
      var tem1h = false;
      for (var h = 0; h < selectHoras.options.length; h++) {
        if (String(selectHoras.options[h].value) === '1') { tem1h = true; break; }
      }
      if (!tem1h) continue;
      var tds = tr.querySelectorAll('td');
      if (tds.length < 5) continue;
      var nome = (tds[1].innerText || tds[1].textContent || '').replace(/\s+/g, ' ').trim();
      var ryousHora = parseRyousMissaoHora((tds[3].innerText || tds[3].textContent || ''));
      var nivelReqTxt = (tds[4].innerText || tds[4].textContent || '').trim();
      out.push({
        form: formEl,
        missaoId: form.value,
        nome: nome,
        ryousHora: ryousHora,
        nivelReq: parseNivelReqMissao(nivelReqTxt),
        nivelReqTexto: nivelReqTxt
      });
    }
    return out;
  }

  function escolherMelhorMissao1h(meuNivel) {
    var missoes = extrairMissoesDisponiveisPagina();
    var melhor = null;
    for (var i = 0; i < missoes.length; i++) {
      var m = missoes[i];
      if (meuNivel !== null && m.nivelReq > meuNivel) continue;
      if (!melhor || m.ryousHora > melhor.ryousHora) melhor = m;
    }
    return melhor;
  }

  function obterFimMissaoTimestamp() {
    var scripts = document.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var txt = scripts[i].textContent || '';
      if (txt.indexOf('missao_timer_mis') === -1) continue;
      var m = txt.match(/var\s+fim\s*=\s*(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  }

  function obterSegundosRestantesMissao() {
    var fim = obterFimMissaoTimestamp();
    if (!fim) return null;
    var scripts = document.querySelectorAll('script');
    var clockOffset = 0;
    for (var i = 0; i < scripts.length; i++) {
      var txt = scripts[i].textContent || '';
      if (txt.indexOf('clockOffset') === -1) continue;
      var m = txt.match(/clockOffset\s*=\s*\((\d+)\s*\*\s*1000\)\s*-\s*Date\.now\(\)/);
      if (m) {
        clockOffset = (parseInt(m[1], 10) * 1000) - Date.now();
        break;
      }
    }
    return Math.max(0, fim - Math.floor((Date.now() + clockOffset) / 1000));
  }

  function formatarTempoMissao(seg) {
    if (seg === null || seg === undefined) return '?';
    var h = Math.floor(seg / 3600);
    var m = Math.floor((seg % 3600) / 60);
    var s = seg % 60;
    return (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
  }

  function usuarioEmPenalidadeMissao() {
    var raizes = typeof obterRaizesSidebar === 'function' ? obterRaizesSidebar() : [document.getElementById('col_esquerda')];
    for (var r = 0; r < raizes.length; r++) {
      var col = raizes[r];
      if (!col) continue;
      var texto = normalizarTextoCombate(col.innerText || col.textContent || '');
      if (texto.indexOf('penal') !== -1 && texto.indexOf('atac') !== -1) return true;
      if (texto.indexOf('penalidade') !== -1) return true;
    }
    var colD = document.getElementById('col_direita');
    if (colD) {
      var t2 = normalizarTextoCombate(colD.innerText || colD.textContent || '');
      if (t2.indexOf('penal') !== -1 && t2.indexOf('atac') !== -1) return true;
    }
    return false;
  }

  function parseNumeroRankingMissao(valor) {
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

  function textoCelulaRankingMissao(td) {
    return (td && td.textContent ? td.textContent : '').replace(/^\|\s*/, '').trim();
  }

  function parseLinhaRankingMissao(tr) {
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
      try { nome = new URL(link.href, window.location.origin).searchParams.get('u') || ''; } catch (e) {}
    }
    if (!nome) return null;
    var nivel = null;
    var vitorias = null;
    var ryousTexto = textoCelulaRankingMissao(tds[tds.length - 1]);
    var ryous = parseNumeroRankingMissao(ryousTexto);
    if (tds.length >= 7) {
      nivel = parseInt(String(textoCelulaRankingMissao(tds[3])).replace(/\D/g, ''), 10);
      vitorias = parseInt(String(textoCelulaRankingMissao(tds[4])).replace(/\D/g, ''), 10);
      ryousTexto = textoCelulaRankingMissao(tds[6]);
      ryous = parseNumeroRankingMissao(ryousTexto);
    } else if (linkIdx + 1 < tds.length) {
      nivel = parseInt(String(textoCelulaRankingMissao(tds[linkIdx + 1])).replace(/\D/g, ''), 10);
      if (linkIdx + 2 < tds.length) {
        vitorias = parseInt(String(textoCelulaRankingMissao(tds[linkIdx + 2])).replace(/\D/g, ''), 10);
      }
    }
    if (nivel === null || isNaN(nivel)) return null;
    var urlJogador = '';
    try { urlJogador = new URL(link.href, window.location.origin).href; } catch (e) {
      urlJogador = link.href || '';
    }
    return {
      nome: nome,
      nivel: nivel,
      vitorias: isNaN(vitorias) ? 0 : vitorias,
      ryous: ryous != null ? ryous : 0,
      ryousTexto: ryousTexto,
      urlJogador: urlJogador
    };
  }

  function extrairJogadoresRankingMissao() {
    var out = [];
    var vistos = {};
    var tabelas = document.querySelectorAll('table.box_largura_100, table');
    for (var t = 0; t < tabelas.length; t++) {
      var tb = tabelas[t];
      var header = tb.querySelector('tr.box_preto_tarja');
      if (!header) continue;
      var ht = (header.textContent || '').toLowerCase();
      if (ht.indexOf('player') === -1) continue;
      var rows = tb.querySelectorAll('tr');
      for (var r = 0; r < rows.length; r++) {
        var j = parseLinhaRankingMissao(rows[r]);
        if (!j || !j.nome) continue;
        var k = j.nome.toLowerCase();
        if (vistos[k]) continue;
        vistos[k] = true;
        out.push(j);
      }
    }
    return out;
  }

  function candidatoValidoMissaoNovo(j, meuNivel, params) {
    if (!j || meuNivel === null) return false;
    var diff = meuNivel - j.nivel;
    if (diff < params.minDiff || diff > params.diffAlvo) return false;
    if (j.ryous > params.maxRyous) return false;
    var meuLogin = normalizarNomeCacadas(obterUsuarioExibicao());
    if (meuLogin && normalizarNomeCacadas(j.nome) === meuLogin) return false;
    if (missaoNovoJaAtacou(j.nome)) return false;
    if (missaoNovoBloqueadoPorFalhaRecente(j.nome)) return false;
    return true;
  }

  function filtrarCandidatosValidosMissaoNovo(lista, meuNivel, params) {
    var out = [];
    for (var i = 0; i < lista.length; i++) {
      if (candidatoValidoMissaoNovo(lista[i], meuNivel, params)) out.push(lista[i]);
    }
    return ordenarCandidatosMissaoNovo(out, meuNivel);
  }

  function proximoIndiceCandidatoValidoMissaoNovo(candidatos, idxInicio, meuNivel, params) {
    for (var i = idxInicio; i < candidatos.length; i++) {
      if (candidatoValidoMissaoNovo(candidatos[i], meuNivel, params)) return i;
    }
    return -1;
  }

  function ordenarCandidatosMissaoNovo(lista, meuNivel) {
    lista.sort(function(a, b) {
      var diffA = diffNivelMissaoNovo(a, meuNivel);
      var diffB = diffNivelMissaoNovo(b, meuNivel);
      if (diffA !== diffB) return diffB - diffA;
      if (a.nivel !== b.nivel) return a.nivel - b.nivel;
      if (a.ryous !== b.ryous) return a.ryous - b.ryous;
      return a.vitorias - b.vitorias;
    });
    return lista;
  }

  function coletarCandidatosRankingMissao(meuNivel, params) {
    var jogadores = extrairJogadoresRankingMissao();
    var out = [];
    for (var i = 0; i < jogadores.length; i++) {
      if (candidatoValidoMissaoNovo(jogadores[i], meuNivel, params)) out.push(jogadores[i]);
    }
    return ordenarCandidatosMissaoNovo(out, meuNivel);
  }

  function montarUrlRankingMissao(offset) {
    return 'https://shadowofshinobi.com/ranking?view=personagens&vila=geral&ranking=' +
      String(typeof offset === 'number' ? offset : 0) +
      '&bot_modo=cacadas&bot_missao_novo=1';
  }

  function paginaRankingSemCandidatosPossivel(jogadores, meuNivel, params) {
    if (!jogadores.length) return false;
    var comNivel = 0;
    for (var i = 0; i < jogadores.length; i++) {
      var j = jogadores[i];
      if (!j || j.nivel === null) continue;
      comNivel++;
      if (j.nivel >= meuNivel - params.diffAlvo) return false;
    }
    return comNivel > 0;
  }

  function paginaRankingSoAlvosFortesDemais(jogadores, meuNivel, params) {
    if (!jogadores.length) return false;
    var comNivel = 0;
    for (var i = 0; i < jogadores.length; i++) {
      var j = jogadores[i];
      if (!j || j.nivel === null) continue;
      comNivel++;
      if (j.nivel <= meuNivel - params.minDiff) return false;
    }
    return comNivel > 0;
  }

  function calcularProximoOffsetRankingMissao(offsetAtual, jogadores, meuNivel, params) {
    var scans = lerScanRankingMissaoNovo() + 1;
    salvarScanRankingMissaoNovo(scans);
    if (scans > MISSAO_NOVO_MAX_SCAN_RANKING) {
      return {
        acao: 'aguardar',
        motivo: 'limite de busca no ranking (' + MISSAO_NOVO_MAX_SCAN_RANKING + ' paginas)'
      };
    }

    var scanInicial = lerScanInicialOffMissaoNovo();

    if (paginaRankingSemCandidatosPossivel(jogadores, meuNivel, params)) {
      if (offsetAtual > scanInicial) {
        return {
          acao: 'aguardar',
          motivo: 'desceu alem da faixa (ranking=' + offsetAtual + ', inicio=' + scanInicial +
            ') — ja passou pelas paginas acima'
        };
      }
      if (scanInicial > 0 && offsetAtual <= scanInicial) {
        if (offsetAtual <= 0) {
          return {
            acao: 'aguardar',
            motivo: 'subiu ao topo (ranking=0) sem alvo na faixa ' + params.minDiff + '-' +
              params.diffAlvo + ' lvl abaixo'
          };
        }
        var voltar = Math.max(0, offsetAtual - MISSAO_NOVO_PASSO_RANKING);
        console.log('[Missao Novo] ranking=' + offsetAtual + ': pulou direto na faixa fraca — ' +
          'subindo para ' + voltar + ' (inicio=' + scanInicial + ')');
        return { acao: 'navegar', offset: voltar };
      }
      return {
        acao: 'aguardar',
        motivo: 'pagina ranking=' + offsetAtual + ' so com alvos >' + params.diffAlvo + ' lvl abaixo'
      };
    }

    var prox = offsetAtual + MISSAO_NOVO_PASSO_RANKING;
    if (paginaRankingSoAlvosFortesDemais(jogadores, meuNivel, params)) {
      console.log('[Missao Novo] ranking=' + offsetAtual + ': alvos <' + params.minDiff +
        ' lvl abaixo (fortes demais) — descendo faixa ' + prox);
    } else {
      console.log('[Missao Novo] ranking=' + offsetAtual + ': 0 candidatos validos — proxima faixa ' + prox);
    }
    return { acao: 'navegar', offset: prox };
  }

  function irParaProximaFaixaRankingMissao(jogadores, meuNivel, params) {
    var offsetAtual = lerRankingOffMissaoNovo();
    var prox = calcularProximoOffsetRankingMissao(offsetAtual, jogadores, meuNivel, params);
    if (!prox || prox.acao === 'aguardar') {
      agendarRetentativaRankingMissaoNovo((prox && prox.motivo) ? prox.motivo : 'ranking esgotado');
      return true;
    }
    salvarRankingOffMissaoNovo(prox.offset);
    salvarCandIdxMissaoNovo(0);
    salvarCandidatosMissaoNovo([]);
    limparAlvoMissaoNovo();
    window.location.href = montarUrlRankingMissao(prox.offset);
    return true;
  }

  function iniciarFluxoAtaqueMissaoNovo(slot) {
    var params = lerParamsMissaoNovo();
    var resolved = resolverOffsetInicialRankingMissaoNovo();
    var offInicial = resolved.offset;
    definirSlotAtaqueMissaoNovo(slot);
    salvarCandidatosMissaoNovo([]);
    salvarCandIdxMissaoNovo(0);
    salvarRankingOffMissaoNovo(offInicial);
    salvarScanInicialOffMissaoNovo(offInicial);
    limparScanRankingMissaoNovo();
    limparAlvoMissaoNovo();
    limparCombateMissaoNovo();
    marcarColetarRelatorioMissaoNovo();
    console.log('%c[Missao Novo] Iniciando ataque ' + slot + ' via ranking (diff ' +
      params.diffAlvo + '->' + params.minDiff + ' lvl abaixo, maxRyous ' +
      formatarNumeroBr(params.maxRyous) + ', ranking=' + offInicial + ' (' + resolved.origem +
      ') — coletando relatorio de ataques antes...)',
      'color:#e67e22;font-weight:bold');
    window.location.href = montarUrlRelatorioMissaoNovoColetar();
  }

  function processarMissaoNovoRelatorioColetar() {
    if (!garantirHpParaMissaoNovoAtacar('relatorio ataques')) return true;

    if (ehPaginaMensagens() && !abaRelatoriosAtaqueVisivel()) {
      console.log('[Missao Novo] /mensagens — abrindo aba relatorios de ataque...');
      irParaAbaRelatoriosAtaqueMissaoNovo();
      return true;
    }

    limparColetarRelatorioMissaoNovo();
    var coleta = coletarAtacadosRelatorioParaMissaoNovo();
    var off = lerRankingOffMissaoNovo();
    console.log('%c[Missao Novo] Relatorio: ' + coleta.total + ' ninja(s) ja atacado(s) hoje' +
      ' (' + coleta.relatorio + ' entradas no relatorio) — indo ao ranking=' + off + '.',
      'color:#3498db;font-weight:bold');
    salvarCandidatosMissaoNovo([]);
    salvarCandIdxMissaoNovo(0);
    limparAlvoMissaoNovo();
    window.location.href = montarUrlRankingMissao(off);
    return true;
  }

  function concluirAtaqueMissaoNovoSemAlvo(slot) {
    console.warn('[Missao Novo] Ataque ' + slot + ' — nenhum alvo disponivel no ranking. Voltando a missao.');
    marcarAtaqueMissaoNovoFeito(slot);
    limparAlvoMissaoNovo();
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_SLOT_KEY); } catch (e) {}
    salvarCandidatosMissaoNovo([]);
    window.location.href = URL_MISSOES;
  }

  function concluirAtaqueMissaoNovoSucesso(slot, alvo) {
    if (!combateMissaoNovoOcorreu()) {
      console.warn('[Missao Novo] Sucesso rejeitado — pagina /combate nao detectada vs ' + (alvo || '?'));
      falhaAtaqueMissaoNovoTentarProximo('sucesso sem pagina de combate');
      return;
    }
    limparCombateMissaoNovo();
    if (alvo) adicionarAtacadoMissaoNovo(alvo);
    salvarRankingUltimoMissaoNovo(lerRankingOffMissaoNovo());
    limparScanRankingMissaoNovo();
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_RETRY_TS_KEY); } catch (e) {}
    console.log('%c[Missao Novo] Ataque ' + slot + ' confirmado vs ' + (alvo || '?') +
      ' — ranking ' + lerRankingOffMissaoNovo() + ' salvo — voltando a missao.',
      'color:#2ecc71;font-weight:bold');
    marcarAtaqueMissaoNovoFeito(slot);
    limparAlvoMissaoNovo();
    try { sessionStorage.removeItem(BOT_MISSAO_NOVO_SLOT_KEY); } catch (e) {}
    salvarCandidatosMissaoNovo([]);
    window.location.href = URL_MISSOES;
  }

  function falhaAtaqueMissaoNovoTentarProximo(motivo) {
    var params = lerParamsMissaoNovo();
    var meuNivel = extrairNivelJogadorSidebar();
    var candidatos = lerCandidatosMissaoNovo();
    var idx = lerCandIdxMissaoNovo();
    var alvo = lerAlvoMissaoNovo();
    console.warn('[Missao Novo] Falha vs ' + alvo + ': ' + motivo + ' — proximo candidato...');

    if (alvo) {
      if (motivo === 'ja atacou hoje' || String(motivo).indexOf('ja atacou') !== -1) {
        adicionarAtacadoMissaoNovo(alvo);
      } else {
        registrarFalhaMissaoNovo(alvo, motivo);
      }
    }

    var proxIdx = proximoIndiceCandidatoValidoMissaoNovo(candidatos, idx + 1, meuNivel, params);
    if (proxIdx >= 0) {
      salvarCandIdxMissaoNovo(proxIdx);
      limparAlvoMissaoNovo();
      var prox = candidatos[proxIdx];
      salvarAlvoMissaoNovo(prox.nome);
      console.log('[Missao Novo] Proximo alvo #' + (proxIdx + 1) + '/' + candidatos.length + ': ' + prox.nome);
      window.location.href = prox.urlJogador;
      return true;
    }

    var jogadores = extrairJogadoresRankingMissao();
    return irParaProximaFaixaRankingMissao(jogadores, meuNivel, params);
  }

  function processarMissaoNovoRanking() {
    if (!garantirHpParaMissaoNovoAtacar('ranking')) return true;

    var posRanking = extrairPosicaoRankingJogador();
    if (posRanking) salvarPosicaoRankingMissaoNovo(posRanking);
    if (tentarPularParaPosicaoRankingMissaoNovo()) return true;

    var params = lerParamsMissaoNovo();
    var meuNivel = extrairNivelJogadorSidebar();
    if (meuNivel === null) {
      console.warn('[Missao Novo] Nivel do jogador nao encontrado na sidebar.');
      concluirAtaqueMissaoNovoSemAlvo(obterSlotAtaqueMissaoNovo());
      return true;
    }

    var candidatos = lerCandidatosMissaoNovo();
    if (candidatos.length) {
      candidatos = filtrarCandidatosValidosMissaoNovo(candidatos, meuNivel, params);
      salvarCandidatosMissaoNovo(candidatos);
      var idxSalvo = lerCandIdxMissaoNovo();
      if (idxSalvo >= candidatos.length) salvarCandIdxMissaoNovo(0);
    } else {
      candidatos = coletarCandidatosRankingMissao(meuNivel, params);
      salvarCandidatosMissaoNovo(candidatos);
      salvarCandIdxMissaoNovo(0);
    }

    if (candidatos.length) {
      var jogadoresPag = extrairJogadoresRankingMissao();
      if (deveDescerRankingPorDiffMissaoNovo(candidatos, jogadoresPag, meuNivel, params)) {
        var melhorDiffPag = diffNivelMissaoNovo(candidatos[0], meuNivel);
        var maxDiffPag = maxDiffPossivelPaginaRanking(jogadoresPag, meuNivel);
        console.log('[Missao Novo] ranking=' + lerRankingOffMissaoNovo() +
          ': melhor valido diff ' + melhorDiffPag + ', max pagina ' + maxDiffPag +
          ' — descendo buscar diff ~' + params.diffAlvo + '...');
        return irParaProximaFaixaRankingMissao(jogadoresPag, meuNivel, params);
      }
    }

    if (!candidatos.length) {
      var jogadores = extrairJogadoresRankingMissao();
      return irParaProximaFaixaRankingMissao(jogadores, meuNivel, params);
    }

    var idx = lerCandIdxMissaoNovo();
    if (idx >= candidatos.length) idx = 0;
    var alvo = candidatos[idx];
    var diffAlvo = diffNivelMissaoNovo(alvo, meuNivel);
    console.log('[Missao Novo] Alvo #' + (idx + 1) + '/' + candidatos.length + ': ' + alvo.nome +
      ' (lvl ' + alvo.nivel + ', ' + diffAlvo + ' lvl abaixo, vit ' + alvo.vitorias +
      ', ryous ' + alvo.ryousTexto + ')');
    limparCombateMissaoNovo();
    salvarAlvoMissaoNovo(alvo.nome);
    window.location.href = alvo.urlJogador;
    return true;
  }

  function processarMissaoNovoJogador() {
    if (!garantirHpParaMissaoNovoAtacar('perfil alvo')) return true;

    var alvo = lerAlvoMissaoNovo();
    if (!alvo) {
      window.location.href = URL_MISSOES;
      return true;
    }
    var avisoPerfil = detectarAvisoErroAlvoMissaoNovo();
    if (avisoPerfil) {
      falhaAtaqueMissaoNovoTentarProximo(avisoPerfil);
      return true;
    }
    var form = document.querySelector('form[action*="cacadas"] input[name="atacar"]');
    if (!form) form = document.querySelector('form input[name="atacar"][value="1"]');
    var formEl = form ? form.closest('form') : null;
    if (!formEl) {
      var btn = document.querySelector('input[value="Atacar"], input[name="vender_animal"][value="Atacar"]');
      formEl = btn ? btn.closest('form') : null;
    }
    if (!formEl) {
      falhaAtaqueMissaoNovoTentarProximo('botao Atacar nao encontrado no perfil');
      return true;
    }
    console.log('[Missao Novo] Perfil de ' + alvo + ' — clicando Atacar...');
    salvarTsAntesAtaqueMissaoNovo();
    var btnAtacar = formEl.querySelector('input[type="submit"]');
    if (btnAtacar) btnAtacar.click();
    else formEl.submit();
    return true;
  }

  function validarAlvoMissaoNovoAtacar() {
    var params = lerParamsMissaoNovo();
    var dados = extrairDadosAlvoAtacar();
    var alvoEsperado = lerAlvoMissaoNovo();
    var motivos = [];
    if (alvoEsperado && dados.inimigo !== '(desconhecido)' &&
        normalizarNomeCacadas(dados.inimigo) !== normalizarNomeCacadas(alvoEsperado)) {
      motivos.push('inimigo diverge (' + dados.inimigo + ' != ' + alvoEsperado + ')');
    }
    if (dados.meuNivel === null) {
      motivos.push('nivel do jogador nao encontrado');
    } else if (dados.nivel === null) {
      motivos.push('nivel do inimigo nao encontrado');
    } else {
      var diff = dados.meuNivel - dados.nivel;
      dados.diffNivel = diff;
      if (diff < params.minDiff || diff > params.diffAlvo) {
        motivos.push('diff nivel ' + diff + ' fora de ' + params.minDiff + '-' + params.diffAlvo);
      }
    }
    if (dados.ryous === null) {
      motivos.push('ryous faturados nao encontrados');
    } else if (dados.ryous > params.maxRyous) {
      motivos.push('ryous ' + formatarNumeroBr(dados.ryous) + ' > max ' + formatarNumeroBr(params.maxRyous));
    }
    return { ok: motivos.length === 0, motivos: motivos, dados: dados };
  }

  function detectarAvisoErroAlvoMissaoNovo() {
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');
    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;
      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('ja atacou este ninja hoje') !== -1) return 'ja atacou hoje';
      if (norm.indexOf('sofreu uma') !== -1 && norm.indexOf('batalha') !== -1 &&
          norm.indexOf('30 minutos') !== -1) return 'batalha recente 30min';
      if (norm.indexOf('nao pode atacar') !== -1) return 'nao pode atacar';
      if (norm.indexOf('impedido') !== -1 || norm.indexOf('protegido') !== -1) return texto;
    }
    return null;
  }

  function detectarFalhaAtaqueMissaoNovoPagina() {
    var avisoAlvo = detectarAvisoErroAlvoMissaoNovo();
    if (avisoAlvo) return avisoAlvo;
    if (detectarAvisoEnergiaVitalBaixaCacadas()) return 'energia vital baixa';
    if (extrairNivelAbaixoMinimoCacadas()) return 'nivel abaixo do minimo';
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');
    for (var i = 0; i < avisos.length; i++) {
      var norm = normalizarTextoCombate(avisos[i].innerText || avisos[i].textContent || '');
      if (norm.indexOf('penal') !== -1) return 'penalidade';
      if (norm.indexOf('energia') !== -1 && norm.indexOf('baixa') !== -1) return 'energia baixa';
    }
    return null;
  }

  function processarMissaoNovoAtacar() {
    var falha = detectarFalhaAtaqueMissaoNovoPagina();
    if (falha) {
      falhaAtaqueMissaoNovoTentarProximo(falha);
      return true;
    }

    var btnAtacar = document.querySelector('form[action="atacar"] input[type="submit"]');
    if (!btnAtacar) {
      falhaAtaqueMissaoNovoTentarProximo('formulario atacar ausente');
      return true;
    }

    var resultado = validarAlvoMissaoNovoAtacar();
    salvarUltimoAlvo(resultado.dados);
    if (!resultado.ok) {
      falhaAtaqueMissaoNovoTentarProximo(resultado.motivos.join('; '));
      return true;
    }

    if (!garantirHpParaMissaoNovoAtacar('atacar')) return true;

    console.log('[Missao Novo] Atacar aprovado — ' + nomeExibicaoInimigo(resultado.dados) +
      ' | diff ' + resultado.dados.diffNivel);
    atacarJaProcessado = true;
    salvarTsAntesAtaqueMissaoNovo();
    btnAtacar.click();
    return true;
  }

  function ataqueConfirmadoNoRelatorio(alvo) {
    var tsAntes = lerTsAntesAtaqueMissaoNovo();
    var ultimo = extrairUltimoAtaqueRelatorios();
    if (!ultimo || ultimo.ts === null) return false;
    if (tsAntes && ultimo.ts <= tsAntes) return false;
    if (alvo && ultimo.vitima &&
        normalizarNomeCacadas(ultimo.vitima) !== normalizarNomeCacadas(alvo)) {
      return false;
    }
    return true;
  }

  function processarMissaoNovoCombate() {
    marcarCombateMissaoNovo();
    var slot = obterSlotAtaqueMissaoNovo();
    var alvo = lerAlvoMissaoNovo();
    var parsed = classificarResultadoCombate();

    if (parsed) {
      console.log('[Missao Novo] Combate: ' + parsed.resultado + ' — ' + parsed.texto);
      concluirAtaqueMissaoNovoSucesso(slot, alvo);
      return true;
    }

    console.log('[Missao Novo] Combate sem resultado claro — validando relatorio...');
    marcarValidarRelatorioMissaoNovo();
    window.location.href = URL_RELATORIOS_ATAQUE + '&bot_missao_novo_validar=1';
    return true;
  }

  function processarMissaoNovoRelatorioValidar() {
    if (ehPaginaMensagens() && !abaRelatoriosAtaqueVisivel()) {
      console.log('[Missao Novo] /mensagens — abrindo aba para validar ataque...');
      irParaAbaRelatoriosAtaqueMissaoNovo();
      return true;
    }

    var slot = obterSlotAtaqueMissaoNovo();
    var alvo = lerAlvoMissaoNovo();
    if (!combateMissaoNovoOcorreu()) {
      limparValidarRelatorioMissaoNovo();
      falhaAtaqueMissaoNovoTentarProximo('validacao relatorio sem combate');
      return true;
    }
    if (ataqueConfirmadoNoRelatorio(alvo)) {
      limparValidarRelatorioMissaoNovo();
      concluirAtaqueMissaoNovoSucesso(slot, alvo);
      return true;
    }
    limparValidarRelatorioMissaoNovo();
    falhaAtaqueMissaoNovoTentarProximo('ataque nao confirmado no relatorio');
    return true;
  }

  function agendarRecheckMissaoNovo(segundos) {
    var ms = Math.max(5000, (segundos || 60) * 1000);
    console.log('[Missao Novo] Aguardando ' + Math.round(ms / 1000) + 's na tela de missao...');
    setTimeout(function() {
      if (missaoNovoAtivo()) window.location.reload();
    }, ms);
  }

  function processarMissaoNovoMissoes() {
    instalarConfirmAutoOkMissao();

    if (emFluxoAtaqueMissaoNovo() && pendingColetarRelatorioMissaoNovo()) {
      console.log('[Missao Novo] Retomando coleta de relatorio de ataques...');
      window.location.href = montarUrlRelatorioMissaoNovoColetar();
      return true;
    }
    if (emFluxoAtaqueMissaoNovo() && pendingValidarRelatorioMissaoNovo()) {
      console.log('[Missao Novo] Retomando validacao de ataque no relatorio...');
      window.location.href = URL_RELATORIOS_ATAQUE + '&bot_missao_novo_validar=1';
      return true;
    }
    if (processarInterrupcaoAtaqueMissaoNovoSemCombate('redirecionado para /missoes sem combate')) {
      return true;
    }

    var params = lerParamsMissaoNovo();
    var meuNivel = extrairNivelJogadorSidebar();

    if (missaoConcluidaAguardandoReceber()) {
      var formRec = obterFormReceberMissao();
      if (formRec) {
        var btnRec = formRec.querySelector('input[type="submit"]');
        if (btnRec) {
          console.log('[Missao Novo] Missao concluida — recebendo recompensa...');
          limparEstadoMissaoNovo();
          btnRec.click();
          return true;
        }
      }
    }

    if (!paginaMissoesComMissaoAtiva()) {
      var melhor = escolherMelhorMissao1h(meuNivel);
      if (!melhor) {
        console.warn('[Missao Novo] Nenhuma missao de ' + params.horas + 'h disponivel para lvl ' + meuNivel + '.');
        return false;
      }
      var selectHoras = melhor.form.querySelector('select[name="horas"]');
      if (selectHoras) selectHoras.value = String(params.horas);
      console.log('%c[Missao Novo] Iniciando "' + melhor.nome + '" (' + params.horas + 'h, ' +
        melhor.ryousHora + ' ryous/h, req ' + melhor.nivelReqTexto + ')',
        'color:#e67e22;font-weight:bold');
      limparEstadoMissaoNovo();
      var btn = melhor.form.querySelector('input[type="submit"]');
      if (btn) btn.click();
      else melhor.form.submit();
      return true;
    }

    var restante = obterSegundosRestantesMissao();
    console.log('[Missao Novo] Em missao — restante ~' + formatarTempoMissao(restante) +
      ' | ataque1=' + (ataqueMissaoNovoFeito(1) ? 'ok' : 'pendente') +
      ' | ataque2=' + (ataqueMissaoNovoFeito(2) ? 'ok' : 'pendente') +
      ' | ataque3=' + (ataqueMissaoNovoFeito(3) ? 'ok' : 'pendente'));

    if (usuarioEmPenalidadeMissao()) {
      console.warn('[Missao Novo] Usuario em penalidade — pulando ataques deste ciclo.');
      if (!ataqueMissaoNovoFeito(1)) marcarAtaqueMissaoNovoFeito(1);
      if (restante !== null && restante <= MISSAO_NOVO_ATAQUE2_RESTANTE_SEG && !ataqueMissaoNovoFeito(2)) {
        marcarAtaqueMissaoNovoFeito(2);
      }
      if (restante !== null && restante <= MISSAO_NOVO_ATAQUE3_RESTANTE_SEG && !ataqueMissaoNovoFeito(3)) {
        marcarAtaqueMissaoNovoFeito(3);
      }
      limparEsperaAtaqueMissaoNovo();
      if (restante !== null && restante <= 0) return false;
      agendarRecheckMissaoNovo(calcularRecheckAteProximoAtaqueMissaoNovo(restante));
      return true;
    }

    if (restante !== null && restante <= 0) return false;

    if (missaoNovoAguardandoRetentativaRanking()) {
      var segRetry = segundosRestantesRetentativaRankingMissaoNovo();
      console.log('[Missao Novo] Retry ranking — aguardando ' + segRetry + 's para tentar ataque de novo...');
      agendarRecheckMissaoNovo(segRetry);
      return true;
    }

    return processarAtaquesAgendadosMissaoNovo(restante);
  }

  function botMissaoNovo(extra) {
    gravarMissaoNovoParam('1');
    gravarModoAba('cacadas');
    if (extra && typeof extra === 'object') {
      var p = lerParamsMissaoNovo();
      if (extra.horas != null) p.horas = parseNumeroInteiro(extra.horas) || p.horas;
      if (extra.diffAlvo != null) p.diffAlvo = parseNumeroInteiro(extra.diffAlvo) || p.diffAlvo;
      if (extra.minDiff != null) p.minDiff = parseNumeroInteiro(extra.minDiff) || p.minDiff;
      if (extra.maxRyous != null) p.maxRyous = parseNumeroInteiro(extra.maxRyous) || p.maxRyous;
      salvarParamsMissaoNovo(p);
    }
    var params = lerParamsMissaoNovo();
    console.log('%c[Missao Novo] ATIVADO — ' + params.horas + 'h | diff ' + params.minDiff + '-' +
      params.diffAlvo + ' | maxRyous ' + formatarNumeroBr(params.maxRyous) +
      ' | 3 ataques: inicio, 45min e 15min restantes (+ espera 1-3min humanizada)',
      'color:#e67e22;font-weight:bold');
    console.log('[Missao Novo] Modo aba=cacadas (rotina caçadas pausada enquanto missao novo estiver ativo).');
    console.log('[Missao Novo] Indo para /missoes...');
    window.location.href = URL_MISSOES;
    return true;
  }

  function botMissaoNovoParar() {
    gravarMissaoNovoParam('0');
    console.warn('[Missao Novo] DESATIVADO.');
    return 'off';
  }

  function statusMissaoNovo() {
    var params = lerParamsMissaoNovo();
    var out = {
      versao: SCRIPT_VERSAO,
      ativo: missaoNovoAtivo(),
      params: params,
      rankingUltimo: lerRankingUltimoMissaoNovo(),
      posicaoRanking: lerPosicaoRankingMissaoNovo(),
      rankingOff: lerRankingOffMissaoNovo(),
      scanInicial: lerScanInicialOffMissaoNovo(),
      slot: obterSlotAtaqueMissaoNovo(),
      emFluxoAtaque: emFluxoAtaqueMissaoNovo(),
      combateDetectado: combateMissaoNovoOcorreu(),
      ataque1: ataqueMissaoNovoFeito(1),
      ataque2: ataqueMissaoNovoFeito(2),
      ataque3: ataqueMissaoNovoFeito(3),
      esperaAtaqueSlot: lerEsperaHumanaSlotMissaoNovo(),
      esperaAtaqueSeg: segundosRestantesEsperaHumanaMissaoNovo(),
      aguardandoRetry: missaoNovoAguardandoRetentativaRanking(),
      retrySeg: segundosRestantesRetentativaRankingMissaoNovo(),
      atacadosHoje: Object.keys(lerAtacadosMissaoNovo()).length,
      falhasRecentes: Object.keys(lerFalhasMissaoNovo()).length,
      falhas: lerFalhasMissaoNovo(),
      curaHpPendente: curarHpParaMissaoNovo() && curarHpAtivo()
    };
    console.log('%c[Missao Novo] Status', 'color:#e67e22;font-weight:bold', out);
    console.log('[Missao Novo] Ranking persistente: localStorage.' + BOT_MISSAO_NOVO_RANKING_ULTIMO_KEY +
      ' (nao confundir com sessionStorage.' + BOT_MISSAO_NOVO_RANKING_OFF_KEY + ')');
    return out;
  }

  function limparMissaoNovoRankingSalvo() {
    try { localStorage.removeItem(BOT_MISSAO_NOVO_RANKING_ULTIMO_KEY); } catch (e) {}
    limparScanRankingMissaoNovo();
    console.log('[Missao Novo] Ranking salvo e scan resetados.');
    return statusMissaoNovo();
  }

  window.botMissaoNovo = botMissaoNovo;
  window.botMissaoNovoParar = botMissaoNovoParar;
  window.statusMissaoNovo = statusMissaoNovo;
  window.limparMissaoNovoRankingSalvo = limparMissaoNovoRankingSalvo;

  function processarPaginaMissoes() {
    if (missaoNovoAtivo()) {
      return processarMissaoNovoMissoes();
    }

    if (missaoConcluidaAguardandoReceber()) {
      var formRec = obterFormReceberMissao();
      if (formRec) {
        var btnRec = formRec.querySelector('input[type="submit"]');
        if (btnRec) {
          console.log('[Missao] Concluida — recebendo recompensa para liberar caçadas...');
          btnRec.click();
          return true;
        }
      }
    }

    if (!paginaMissoesComMissaoAtiva()) {
      console.log('[Missao] Sem missao ativa — voltando ao portao de caçadas.');
      window.location.href = URL_RELATORIOS_ATAQUE;
      return true;
    }

    if (missaoCancelamentoClicado) return true;

    var formCancel = obterFormCancelarMissao();
    if (!formCancel) {
      console.warn('[Missao] Botao cancelar_missao nao encontrado.');
      return false;
    }

    instalarConfirmAutoOkMissao();
    missaoCancelamentoClicado = true;
    console.warn('[Missao] Cancelando missao em andamento (confirm auto-OK)...');

    var btnCancel = formCancel.querySelector('input[type="submit"]');
    if (btnCancel) {
      btnCancel.click();
      return true;
    }

    formCancel.submit();
    return true;
  }

  function recarregarCredenciaisLogin() {
    USUARIO_FINAL = obterUsuarioLogin();
    SENHA_FINAL = lerSenhaLoginArmazenada() || SENHA_DEFAULT;
  }

  function tentarLoginAutomatico(origem) {
    if (loginJaEnviado) return false;

    sincronizarModoAba();
    var modoRecuperado = recuperarModoAbaNaPaginaLogin('login') || recuperarModoAbaPosLogin();
    if (modoRecuperado) {
      console.log('[Script Caçadas] Login (' + origem + ') — modo bot da aba: ' + modoRecuperado);
    }
    recarregarCredenciaisLogin();

    var formLogin = document.getElementById('login');
    if (!formLogin) return false;

    if (!USUARIO_FINAL || !SENHA_FINAL || USUARIO_FINAL === '?' || SENHA_FINAL === '?') {
      console.warn('[Script Caçadas] Login (' + origem + ') — credenciais ausentes no localStorage.');
      return false;
    }

    console.log('[Script Caçadas] Tela de login — preenchendo credenciais (' + origem + '): ' + USUARIO_FINAL + '...');

    var selectServer = formLogin.querySelector('select[name="server_login"]');
    var inputUsuario = formLogin.querySelector('#usuario');
    var inputSenha = formLogin.querySelector('#senha');

    if (selectServer) {
      selectServer.value = '0';
      selectServer.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (inputUsuario) {
      inputUsuario.value = USUARIO_FINAL;
      inputUsuario.dispatchEvent(new Event('input', { bubbles: true }));
      inputUsuario.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (inputSenha) {
      inputSenha.value = SENHA_FINAL;
      inputSenha.dispatchEvent(new Event('input', { bubbles: true }));
      inputSenha.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (!inputUsuario || !inputSenha) {
      console.warn('[Script Caçadas] Login (' + origem + ') — campos #usuario / #senha nao encontrados.');
      return false;
    }

    loginJaEnviado = true;

    setTimeout(function() {
      var btnLogin = formLogin.querySelector('input[type="submit"]');
      if (btnLogin) {
        btnLogin.click();
        console.log('[Script Caçadas] Login enviado (' + origem + ').');
      } else {
        loginJaEnviado = false;
        agendarReloadFalha('Botao de login nao encontrado.');
      }
    }, 1500);

    return true;
  }

  function agendarRetentativasLogin() {
    [500, 2000, 5000, 10000, 15000].forEach(function(ms) {
      setTimeout(function() {
        if (document.getElementById('login')) {
          tentarLoginAutomatico('retry-' + ms + 'ms');
        }
      }, ms);
    });
  }

  // Configurações do Firebase Realtime Database
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCn92W9swCRMJfomc30lSn4GckgA2Esjm0",
    authDomain: "shizuo-a07d9.firebaseapp.com",
    databaseURL: "https://shizuo-a07d9-default-rtdb.firebaseio.com",
    projectId: "shizuo-a07d9",
    storageBucket: "shizuo-a07d9.firebasestorage.app",
    messagingSenderId: "558853797700",
    appId: "1:558853797700:web:71e454196334d2a5be8911",
    measurementId: "G-LDVNCKS73Z"
  };

  var webhooksDiscordPromise = null;
  var webhooksDiscordCarregados = false;

  function aplicarWebhooksDiscordFirebase(dados) {
    if (!dados || typeof dados !== 'object') return;
    if (dados.captcha) DISCORD_WEBHOOK_CAPTCHA = String(dados.captcha);
    if (dados.cacadas) DISCORD_WEBHOOK_CACADAS = String(dados.cacadas);
    if (dados.invasor) DISCORD_WEBHOOK_INVASOR = String(dados.invasor);
  }

  function garantirWebhooksDiscord() {
    if (webhooksDiscordCarregados) return Promise.resolve();
    if (webhooksDiscordPromise) return webhooksDiscordPromise;

    var url = FIREBASE_CONFIG.databaseURL + '/' + FIREBASE_WEBHOOKS_PATH + '.json';
    webhooksDiscordPromise = fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(dados) {
        aplicarWebhooksDiscordFirebase(dados);
        webhooksDiscordCarregados = true;
        console.log('[Discord] Webhooks do Firebase: captcha=' +
          (DISCORD_WEBHOOK_CAPTCHA ? 'ok' : 'ausente') + ' cacadas=' +
          (DISCORD_WEBHOOK_CACADAS ? 'ok' : 'ausente') + ' invasor=' +
          (DISCORD_WEBHOOK_INVASOR ? 'ok' : 'ausente'));
      })
      .catch(function(err) {
        console.warn('[Discord] Falha ao ler ' + FIREBASE_WEBHOOKS_PATH + ':', err);
        webhooksDiscordPromise = null;
      });
    return webhooksDiscordPromise;
  }

  garantirWebhooksDiscord();

  // Credenciais do Usuário e Configuração de Caçadas
  var USUARIO_DEFAULT = 'Shiroe';
  var USUARIO_FINAL = lerUsuarioLoginArmazenado() || USUARIO_DEFAULT;
  var USUARIO_EXIBICAO = USUARIO_FINAL;
  var SENHA_DEFAULT = 'lulacarlos';
  var SENHA_FINAL = lerSenhaLoginArmazenada() || SENHA_DEFAULT;

  agendarRetentativasLogin();

  // --- DETECTA USUÁRIO LOGADO NA SIDEBAR E SINCRONIZA localStorage ---
  function obterRaizesSidebar() {
    var raizes = [];
    var colEsq = document.getElementById('col_esquerda');
    var colDir = document.getElementById('col_direita');
    if (colEsq) raizes.push(colEsq);
    if (colDir) raizes.push(colDir);
    var sidebars = document.querySelectorAll('.np-sidebar');
    for (var i = 0; i < sidebars.length; i++) raizes.push(sidebars[i]);
    if (document.body) raizes.push(document.body);
    return raizes;
  }

  function sidebarTemPainelPersonagem(el) {
    if (!el) return false;
    if (el.querySelector('.hp-top, .village-badge')) return true;
    var texto = normalizarTextoCombate(el.innerText || el.textContent || '');
    return texto.indexOf('vila') !== -1 && texto.indexOf('hp') !== -1;
  }

  function extrairNomeUsuarioLogado() {
    if (document.getElementById('login')) return null;

    var raizes = obterRaizesSidebar();
    for (var r = 0; r < raizes.length; r++) {
      var raiz = raizes[r];
      if (raiz === document.body) continue;

      var tabelas = raiz.querySelectorAll('table');
      if (!tabelas.length) tabelas = [raiz];

      for (var i = 0; i < tabelas.length; i++) {
        var tabela = tabelas[i];
        var info = tabela.querySelector('td.box_preto_cor_central, .panel-body');
        if (!info) continue;
        if (!sidebarTemPainelPersonagem(info)) continue;

        var tdNome = tabela.querySelector('td[style*="max-width:95px"]');
        if (!tdNome) {
          var logo = tabela.querySelector('img[src*="logo_simples"]');
          if (logo && logo.parentElement) {
            tdNome = logo.parentElement.nextElementSibling;
          }
        }
        if (!tdNome) continue;

        var nome = (tdNome.innerText || tdNome.textContent || '').split('\n')[0].trim();
        if (nome && nome !== 'Conta doador' && nome !== 'Contatos') {
          return nome;
        }
      }
    }

    return null;
  }

  function estaEmContaGerenciada() {
    if (document.querySelector('a[href*="automacao?voltar=1"]')) return true;
    var body = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    return /conta gerenciada/i.test(body);
  }

  function obterUsuarioLogin() {
    return lerUsuarioLoginArmazenado() || USUARIO_DEFAULT;
  }

  function obterUsuarioExibicao() {
    if (USUARIO_EXIBICAO && USUARIO_EXIBICAO !== obterUsuarioLogin()) {
      return USUARIO_EXIBICAO;
    }
    var nomeSidebar = extrairNomeUsuarioLogado();
    if (nomeSidebar && estaEmContaGerenciada()) return nomeSidebar;
    return obterUsuarioLogin();
  }

  function sincronizarUsuarioLocalStorage() {
    var loginSalvo = obterUsuarioLogin();
    USUARIO_FINAL = loginSalvo;

    var nomeLogado = extrairNomeUsuarioLogado();
    USUARIO_EXIBICAO = nomeLogado || loginSalvo;

    if (nomeLogado && nomeLogado !== loginSalvo && (estaEmContaGerenciada() || rotacaoAutomacaoAtiva())) {
      console.log('[Automacao] Conta ativa: ' + nomeLogado + ' | Login: ' + loginSalvo);
    }

    atualizarUltimaGerenciadaSnapshot();

    exibirModoAbaServerID();
  }

  // --- HP minimo antes de atacar (caçadas) + Ichiraku em /status ---
  function parseNumeroHp(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var s = String(valor).trim().replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? null : Math.round(n);
  }

  function salvarHpSnapshot(current, max) {
    try {
      sessionStorage.setItem(BOT_HP_SNAPSHOT_KEY, JSON.stringify({ current: current, max: max }));
    } catch (e) {}
  }

  function lerHpSnapshot() {
    try {
      var raw = sessionStorage.getItem(BOT_HP_SNAPSHOT_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.max || s.max <= 0) return null;
      var current = parseNumeroHp(s.current);
      var max = parseNumeroHp(s.max);
      if (current === null || max === null || max <= 0) return null;
      return { ok: true, current: current, max: max, pct: current / max };
    } catch (e) {}
    return null;
  }

  function extrairHpSidebarDom(raiz) {
    if (!raiz || !raiz.querySelector) return null;
    var hpTop = raiz.querySelector('.hp-top');
    if (!hpTop) return null;

    var cur = hpTop.querySelector('.cur');
    var val = hpTop.querySelector('.val');
    var current = cur ? parseNumeroHp(cur.innerText || cur.textContent) : null;
    var max = null;

    if (val) {
      var valText = (val.innerText || val.textContent || '').trim();
      var m = valText.match(/([\d.,]+)\s*\/\s*([\d.,]+)/);
      if (m) {
        if (current === null) current = parseNumeroHp(m[1]);
        max = parseNumeroHp(m[2]);
      }
    }

    if (current === null || max === null || max <= 0) return null;
    return { ok: true, current: current, max: max, pct: current / max };
  }

  function extrairHpDaPagina() {
    var raizes = obterRaizesSidebar();

    for (var d = 0; d < raizes.length; d++) {
      var dom = extrairHpSidebarDom(raizes[d]);
      if (dom && dom.ok) return dom;
    }

    for (var r = 0; r < raizes.length; r++) {
      var texto = raizes[r].innerText || raizes[r].textContent || '';
      var m = texto.match(/HP\s*:?\s*([\d.,]+)\s*\/\s*([\d.,]+)/i);
      if (!m) continue;
      var current = parseNumeroHp(m[1]);
      var max = parseNumeroHp(m[2]);
      if (current === null || max === null || max <= 0) continue;
      return { ok: true, current: current, max: max, pct: current / max };
    }
    return { ok: false };
  }

  function obterStatusHp() {
    var parsed = extrairHpDaPagina();
    if (parsed.ok) {
      salvarHpSnapshot(parsed.current, parsed.max);
      return parsed;
    }
    var snap = lerHpSnapshot();
    if (snap) return snap;
    return { ok: false };
  }

  function curarHpAtivo() {
    try { return sessionStorage.getItem(BOT_HP_CURAR_ATIVO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarCurarHpAtivo() {
    try { sessionStorage.setItem(BOT_HP_CURAR_ATIVO_KEY, '1'); } catch (e) {}
  }

  function limparCurarHpAtivo() {
    try {
      sessionStorage.removeItem(BOT_HP_CURAR_ATIVO_KEY);
      sessionStorage.removeItem(BOT_HP_CURAR_RAID_KEY);
      sessionStorage.removeItem(BOT_HP_CURAR_MISSAO_NOVO_KEY);
      sessionStorage.removeItem(BOT_HP_SNAPSHOT_KEY);
      sessionStorage.removeItem(BOT_HP_COMPRAR_MERCADO_KEY);
      sessionStorage.removeItem(BOT_HP_COMPRAR_AVISADO_KEY);
    } catch (e) {}
  }

  function mercadoCompraPendente() {
    try { return sessionStorage.getItem(BOT_HP_COMPRAR_MERCADO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarMercadoCompraPendente() {
    try { sessionStorage.setItem(BOT_HP_COMPRAR_MERCADO_KEY, '1'); } catch (e) {}
  }

  function limparMercadoCompraPendente() {
    try { sessionStorage.removeItem(BOT_HP_COMPRAR_MERCADO_KEY); } catch (e) {}
  }

  function extrairItensIchirakuMercado() {
    var out = [];
    var rows = document.querySelectorAll('tr.mitem-row[data-mcat="ichiraku"]');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var comprarInput = row.querySelector('form[action="mercado"] input[name="comprar_loja"]');
      var form = comprarInput ? comprarInput.closest('form') : null;
      if (!form) continue;

      var itemIdInput = form.querySelector('input[name="item_id"]');
      var qtdInput = form.querySelector('input[name="comprar_qtd"]');
      if (!itemIdInput) continue;

      var titleEl = row.querySelector('.mkt-box-title');
      var nome = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : '';

      var priceRow = row.querySelector('.mkt-price-row .price');
      var priceText = priceRow ? (priceRow.innerText || priceRow.textContent || '') : '';
      if (!/ryous/i.test(priceText) || /kage/i.test(priceText)) continue;

      var precoUnit = null;
      var oninput = qtdInput ? qtdInput.getAttribute('oninput') : '';
      var mIn = oninput && oninput.match(/mktQtyPrice\s*\(\s*this\s*,\s*([\d.]+)/);
      if (mIn) precoUnit = parseNumeroHp(mIn[1]);
      if (precoUnit === null) {
        var live = document.getElementById('mkt_price_' + itemIdInput.value);
        if (live) precoUnit = parseNumeroBr((live.innerText || live.textContent || '').trim());
      }
      if (precoUnit === null || precoUnit <= 0) continue;

      out.push({
        nome: nome,
        precoUnit: precoUnit,
        itemId: itemIdInput.value,
        form: form,
        qtdInput: qtdInput
      });
    }
    return out;
  }

  function escolherIchirakuMaisBaratoMercado(itens) {
    if (!itens.length) return null;
    var sorted = itens.slice().sort(function(a, b) { return a.precoUnit - b.precoUnit; });
    return sorted[0];
  }

  function obterRyousParaCompraIchiraku() {
    var ryous = extrairRyousJogadorSidebar();
    if (ryous !== null) return ryous;
    return extrairReservaRyous();
  }

  function calcularQtdCompraIchiraku(precoUnit, ryousDisponiveis) {
    if (!precoUnit || precoUnit <= 0) return 0;
    if (ryousDisponiveis === null || ryousDisponiveis < precoUnit) return 0;
    return Math.min(ICHIRAKU_COMPRA_QTD_ALVO, Math.floor(ryousDisponiveis / precoUnit));
  }

  function montarMensagemDiscordSemIchirakuMercado(hp) {
    sincronizarUsuarioLocalStorage();
    var login = obterUsuarioLogin();
    var ativo = extrairNomeUsuarioLogado() || login;
    var linhas = [
      '⚠️ **Sem Ichiraku — compra no mercado impossível**',
      'Login: `' + login + '`',
      'Conta ativa: `' + ativo + '`'
    ];
    if (estaEmContaGerenciada() && ativo !== login) {
      linhas.push('Gerenciada: `' + ativo + '`');
    }
    if (hp && hp.ok) linhas.push('HP: ' + formatarHpLog(hp));
    var ryous = obterRyousParaCompraIchiraku();
    linhas.push('Ryous disponíveis: ' + (ryous !== null ? formatarNumeroBr(ryous) : '?'));
    return linhas.join('\n');
  }

  function avisarDiscordSemIchirakuMercado(hp) {
    try {
      if (sessionStorage.getItem(BOT_HP_COMPRAR_AVISADO_KEY) === '1') return;
      sessionStorage.setItem(BOT_HP_COMPRAR_AVISADO_KEY, '1');
    } catch (e) {}
    enviarDiscordTexto(montarMensagemDiscordSemIchirakuMercado(hp), null, false);
  }

  function redirecionarParaMercadoIchiraku(motivo) {
    marcarMercadoCompraPendente();
    console.log('[HP] ' + motivo + ' — sem Ichiraku em /status, indo ao mercado...');
    window.location.href = URL_MERCADO_ICHIRAKU;
  }

  function processarCompraIchirakuMercado() {
    if (obterModoAba() !== 'cacadas' && !missaoNovoAtivo()) return false;
    if (!curarHpAtivo()) return false;
    if ((window.location.href || '').indexOf('mercado') === -1) return false;

    var ctxMissao = curarHpParaMissaoNovo() ? 'missao novo' : 'cacadas';

    var hp = obterStatusHp();
    if (!hp.ok) hp = lerHpSnapshot();

    if (!mercadoCompraPendente()) {
      console.log('[HP] Mercado (' + ctxMissao + ') — compra concluida, voltando ao /status...');
      window.location.href = URL_STATUS;
      return true;
    }

    var itens = extrairItensIchirakuMercado();
    var escolhido = escolherIchirakuMaisBaratoMercado(itens);
    var ryous = obterRyousParaCompraIchiraku();

    if (!escolhido) {
      console.error('[HP] Mercado — nenhum item Ichiraku (ryous) encontrado.');
      avisarDiscordSemIchirakuMercado(hp);
      agendarReloadFalha('Mercado sem Ichiraku compravel', 60000);
      return true;
    }

    var qtd = calcularQtdCompraIchiraku(escolhido.precoUnit, ryous);
    if (qtd < 1) {
      console.error('[HP] Mercado — ryous insuficientes para Ichiraku (' +
        (ryous !== null ? formatarNumeroBr(ryous) : '?') + ' < ' +
        formatarNumeroBr(escolhido.precoUnit) + ').');
      avisarDiscordSemIchirakuMercado(hp);
      agendarReloadFalha('Ryous insuficientes para Ichiraku', 60000);
      return true;
    }

    console.log('[HP] Mercado (' + ctxMissao + ') — comprando ' + qtd + 'x "' + escolhido.nome + '" (' +
      formatarNumeroBr(escolhido.precoUnit) + ' ryous/un, total ~' +
      formatarNumeroBr(escolhido.precoUnit * qtd) + ')...');

    if (escolhido.qtdInput) escolhido.qtdInput.value = String(qtd);
    limparMercadoCompraPendente();

    var link = escolhido.form.querySelector('a.acao');
    if (link) link.click();
    else escolhido.form.submit();
    return true;
  }

  function curarHpParaRaidDiario() {
    try { return sessionStorage.getItem(BOT_HP_CURAR_RAID_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarCurarHpRaidDiario() {
    try { sessionStorage.setItem(BOT_HP_CURAR_RAID_KEY, '1'); } catch (e) {}
  }

  function hpAtendeMinimoRaid(hp) {
    return !!(hp && hp.ok && hp.current > HP_MINIMO_RAID);
  }

  function curarHpParaMissaoNovo() {
    try { return sessionStorage.getItem(BOT_HP_CURAR_MISSAO_NOVO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarCurarHpMissaoNovo() {
    try { sessionStorage.setItem(BOT_HP_CURAR_MISSAO_NOVO_KEY, '1'); } catch (e) {}
  }

  function hpAtendeMinimoMissaoNovo(hp) {
    return !!(hp && hp.ok && hp.pct >= HP_MINIMO_MISSAO_NOVO_RATIO);
  }

  function metaHpAbsolutaMissaoNovo(hp) {
    if (!hp || !hp.ok) return null;
    return Math.ceil(hp.max * HP_MINIMO_MISSAO_NOVO_RATIO);
  }

  function hpAtendeMetaParaCurar(hp) {
    if (!hp || !hp.ok) return false;
    if (curarHpParaRaidDiario()) return hpAtendeMinimoRaid(hp);
    if (curarHpParaMissaoNovo()) return hpAtendeMinimoMissaoNovo(hp);
    return hp.pct >= obterHpMinimoAtacarRatio();
  }

  function metaHpAbsolutaParaCurar(hp) {
    if (curarHpParaRaidDiario()) return HP_MINIMO_RAID + 1;
    if (curarHpParaMissaoNovo()) return metaHpAbsolutaMissaoNovo(hp);
    return Math.ceil(hp.max * obterHpMinimoAtacarRatio());
  }

  function urlPosCurarHp() {
    if (curarHpParaMissaoNovo()) return urlPosCurarHpMissaoNovo();
    if (curarHpParaRaidDiario()) return URL_RAID;
    return URL_RELATORIOS_ATAQUE;
  }

  function finalizarCurarHpPosIchiraku(motivoLog) {
    var voltarMissao = curarHpParaMissaoNovo();
    var voltarRaid = curarHpParaRaidDiario();
    var voltarAutom = curarHpParaAutomPrep() || atacarAutomacoesAtacanteAtivo();
    var hp = obterStatusHp();
    var destinoMissao = voltarMissao ? urlPosCurarHpMissaoNovo() : '';
    console.log('[HP] ' + motivoLog + ' — ' + formatarHpLog(hp) +
      (voltarMissao ? ' | voltando missao novo (' + (destinoMissao.indexOf('missoes') !== -1 ? '/missoes' : 'fluxo ataque') + ')...' :
        (voltarRaid ? ' | voltando para raids...' :
          (voltarAutom ? ' | voltando autom prep/atacante...' : ' | voltando ao portao...'))));
    limparCurarHpAtivo();
    if (voltarMissao) {
      window.location.href = destinoMissao;
      return true;
    }
    if (voltarRaid) {
      window.location.href = URL_RAID;
      return true;
    }
    if (curarHpParaAutomPrep()) {
      try { sessionStorage.removeItem(BOT_HP_CURAR_AUTOM_PREP_KEY); } catch (e) {}
      if (obterFaseAutomPrep() === 'quests' || obterFaseAutomPrep() === 'hp') {
        automPrepAvancarAposQuests('pos-cura hp');
      } else {
        window.location.href = urlPosCurarHpAutom();
      }
      return true;
    }
    if (atacarAutomacoesAtacanteAtivo()) {
      window.location.href = URL_RELATORIOS_ATAQUE;
      return true;
    }
    if (tentarAtivarDoujutsuAposHpOk(motivoLog)) return true;
    window.location.href = URL_RELATORIOS_ATAQUE;
    return true;
  }

  function garantirHpParaRaidDiario(contexto) {
    if (!diarioDeveRodar() || obterFaseDiario() !== 'raid') return true;
    if (diarioRaidDerrotaAtiva()) return true;

    var hp = obterStatusHp();
    var url = window.location.href || '';
    var naPaginaStatus = url.indexOf('status') !== -1;

    if (curarHpAtivo()) {
      if (!curarHpParaRaidDiario()) marcarCurarHpRaidDiario();
      if (naPaginaStatus) return false;
      if (hp.ok && hpAtendeMinimoRaid(hp)) {
        limparCurarHpAtivo();
        return true;
      }
      if (hp.ok && !hpAtendeMinimoRaid(hp)) {
        console.log('[Diario] HP baixo para raid (<= ' + HP_MINIMO_RAID + ') — ' +
          formatarHpLog(hp) + ' | indo curar (' + contexto + ')');
        marcarCurarHpRaidDiario();
        redirecionarParaCurarHp('raid diario (' + contexto + ')');
        return false;
      }
      console.warn('[Diario] Cura raid pendente sem HP legivel — limpando (' + contexto + ')');
      limparCurarHpAtivo();
      hp = obterStatusHp();
    }

    if (!hp.ok) {
      console.warn('[Diario] HP ilegivel antes da raid — ' + contexto + ' (seguindo).');
      return true;
    }
    if (hpAtendeMinimoRaid(hp)) return true;

    console.log('[Diario] HP ' + hp.current + ' <= ' + HP_MINIMO_RAID +
      ' (energia vital insuficiente) — curando antes da raid (' + contexto + ')');
    marcarCurarHpRaidDiario();
    redirecionarParaCurarHp('raid diario (' + contexto + ')');
    return false;
  }

  function formatarHpLog(hp) {
    if (!hp || !hp.ok) return '?/?';
    return hp.current + '/' + hp.max + ' (' + Math.round(hp.pct * 100) + '%)';
  }

  function redirecionarParaCurarHp(motivo) {
    if (obterModoAba() !== 'cacadas' && !missaoNovoAtivo()) return;
    var hp = obterStatusHp();
    marcarCurarHpAtivo();
    if (hp.ok) salvarHpSnapshot(hp.current, hp.max);
    console.log('[HP] ' + motivo + ' — ' + formatarHpLog(hp) + ' | indo para /status (Ichiraku)...');
    consumirGateCacadas();
    window.location.href = URL_STATUS;
  }

  function garantirHpParaMissaoNovoAtacar(contexto) {
    if (!missaoNovoAtivo()) return true;

    garantirModoCacadasMissaoNovo();

    var hp = obterStatusHp();
    var url = window.location.href || '';
    var naPaginaStatus = url.indexOf('status') !== -1;

    if (curarHpAtivo() && curarHpParaMissaoNovo()) {
      if (naPaginaStatus) return false;
      if (hp.ok && hpAtendeMinimoMissaoNovo(hp)) {
        limparCurarHpAtivo();
        return true;
      }
      if (hp.ok && !hpAtendeMinimoMissaoNovo(hp)) {
        console.log('[Missao Novo] Cura pendente — retomando /status (' + contexto + ') — ' +
          formatarHpLog(hp) + ' (meta >= ' + Math.round(HP_MINIMO_MISSAO_NOVO_RATIO * 100) + '%)');
        redirecionarParaCurarHp('missao novo (' + contexto + ')');
        return false;
      }
      console.warn('[Missao Novo] Cura pendente sem HP legivel — limpando (' + contexto + ')');
      limparCurarHpAtivo();
      hp = obterStatusHp();
    }

    if (!hp.ok) {
      console.warn('[Missao Novo] HP ilegivel — ' + contexto + ' (seguindo sem bloqueio).');
      return true;
    }
    if (hpAtendeMinimoMissaoNovo(hp)) return true;

    console.log('[Missao Novo] HP abaixo de ' + Math.round(HP_MINIMO_MISSAO_NOVO_RATIO * 100) +
      '% — ' + formatarHpLog(hp) + ' | curando (Ichiraku/mercado se preciso) antes de atacar (' + contexto + ')');
    prepararCuraHpMissaoNovo(contexto);
    return false;
  }

  function garantirHpParaAtacar(contexto) {
    if (obterModoAba() !== 'cacadas') return true;

    var hp = obterStatusHp();
    var url = window.location.href || '';
    var naPaginaStatus = url.indexOf('status') !== -1;

    if (curarHpAtivo()) {
      if (naPaginaStatus) return false;
      if (hp.ok && hpAtendeMetaParaCurar(hp)) {
        limparCurarHpAtivo();
        return true;
      }
      if (hp.ok && !hpAtendeMetaParaCurar(hp)) {
        console.log('[HP] Cura pendente — retomando /status (' + contexto + ') — ' + formatarHpLog(hp));
        redirecionarParaCurarHp(contexto);
        return false;
      }
      console.warn('[HP] Flag de cura ativa sem HP legivel — limpando (' + contexto + ')');
      limparCurarHpAtivo();
      hp = obterStatusHp();
    }

    if (!hp.ok) {
      console.warn('[HP] Nao foi possivel ler HP — ' + contexto + ' (seguindo sem bloqueio).');
      return true;
    }
    if (hp.pct >= obterHpMinimoAtacarRatio() && !curarHpParaRaidDiario()) return true;
    if (curarHpParaRaidDiario() && hpAtendeMinimoRaid(hp)) return true;

    redirecionarParaCurarHp(contexto);
    return false;
  }

  function extrairItensIchirakuStatus() {
    var out = [];
    var inputs = document.querySelectorAll('form[action="status"] input[name="usar_item"]');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var form = input.closest('form');
      if (!form) continue;

      var nome = (input.value || '').trim();
      if (!nome) continue;

      var container = form.closest('td') || form.parentElement;
      var texto = container ? (container.innerText || container.textContent || '') : '';

      var healMatch = texto.match(/Recupera\s+([\d.,]+)\s+pontos de HP/i);
      var quantMatch = texto.match(/Quant:\s*(\d+)/i);
      var heal = healMatch ? parseNumeroHp(healMatch[1]) : null;
      var quant = quantMatch ? parseInt(quantMatch[1], 10) : 0;

      if (heal === null || heal <= 0 || isNaN(quant) || quant <= 0) continue;

      out.push({ nome: nome, heal: heal, quant: quant, form: form });
    }
    return out;
  }

  function escolherItemIchirakuOptimo(itens, current, max, metaCurrent) {
    var meta = metaCurrent !== undefined && metaCurrent !== null
      ? metaCurrent
      : max * obterHpMinimoAtacarRatio();
    var deficit = Math.ceil(meta - current);
    if (deficit <= 0) return null;

    var disponiveis = [];
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].quant > 0 && itens[i].heal > 0) disponiveis.push(itens[i]);
    }
    if (!disponiveis.length) return null;

    var suficientes = [];
    for (var j = 0; j < disponiveis.length; j++) {
      if (disponiveis[j].heal >= deficit) suficientes.push(disponiveis[j]);
    }
    if (suficientes.length) {
      suficientes.sort(function(a, b) { return a.heal - b.heal; });
      return suficientes[0];
    }

    disponiveis.sort(function(a, b) { return b.heal - a.heal; });
    return disponiveis[0];
  }

  function processarCurarHpNaPaginaStatus() {
    if (obterModoAba() !== 'cacadas' && !missaoNovoAtivo()) return false;

    if (diarioDeveRodar() && diarioRaidDerrotaAtiva()) {
      console.log('[Diario] Raid perdida — ignorando cura de HP, indo para animal.');
      limparCurarHpAtivo();
      concluirRaidsDiarioIrAnimal();
      return true;
    }

    var hp = obterStatusHp();
    var precisaCurarRaid = diarioDeveRodar() && obterFaseDiario() === 'raid' &&
      !diarioRaidDerrotaAtiva() &&
      hp.ok && !hpAtendeMinimoRaid(hp);
    var precisaCurarMissao = missaoNovoAtivo() && hp.ok && !hpAtendeMinimoMissaoNovo(hp);
    var precisaCurar = hp.ok && !hpAtendeMetaParaCurar(hp);

    if (precisaCurarRaid && !curarHpParaRaidDiario()) marcarCurarHpRaidDiario();

    if (!curarHpAtivo()) {
      if (!precisaCurar && !precisaCurarRaid && !precisaCurarMissao) return false;
      marcarCurarHpAtivo();
      if (precisaCurarMissao) marcarCurarHpMissaoNovo();
    } else if (hp.ok && hpAtendeMetaParaCurar(hp)) {
      return finalizarCurarHpPosIchiraku('Vida recuperada');
    }

    if (!hp.ok) {
      hp = lerHpSnapshot();
    }
    if (!hp || !hp.ok) {
      console.warn('[HP] /status — HP ilegivel; aguardando snapshot ou reload.');
      return true;
    }

    if (hpAtendeMetaParaCurar(hp)) {
      return finalizarCurarHpPosIchiraku('Vida OK');
    }

    var itens = extrairItensIchirakuStatus();
    var escolhido = escolherItemIchirakuOptimo(itens, hp.current, hp.max, metaHpAbsolutaParaCurar(hp));

    if (!escolhido) {
      try {
        if (sessionStorage.getItem(BOT_HP_COMPRAR_AVISADO_KEY) === '1') {
          console.error('[HP] Sem Ichiraku apos tentativa no mercado — ' + formatarHpLog(hp) + '.');
          agendarReloadFalha('HP baixo e sem Ichiraku disponivel', 60000);
          return true;
        }
      } catch (e) {}
      if (!mercadoCompraPendente()) {
        if (curarHpParaMissaoNovo()) {
          console.log('[Missao Novo] Sem Ichiraku em /status — indo ao mercado comprar...');
        }
        redirecionarParaMercadoIchiraku(formatarHpLog(hp));
        return true;
      }
      console.error('[HP] Sem Ichiraku util em /status — ' + formatarHpLog(hp) + '.');
      avisarDiscordSemIchirakuMercado(hp);
      agendarReloadFalha('HP baixo e sem Ichiraku disponivel', 60000);
      return true;
    }

    var novoHp = Math.min(hp.current + escolhido.heal, hp.max);
    salvarHpSnapshot(novoHp, hp.max);

    console.log(
      '[HP] Usando "' + escolhido.nome + '" (+' + escolhido.heal + ' HP) — ' +
      hp.current + '/' + hp.max + ' -> ~' + novoHp + '/' + hp.max
    );

    var btn = escolhido.form.querySelector('input[type="submit"], input[name="btn"]');
    if (btn) btn.click();
    else escolhido.form.submit();
    return true;
  }

  function doujutsuAtivarPendente() {
    try { return sessionStorage.getItem(BOT_DOUJUTSU_ATIVAR_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarDoujutsuAtivarPendente() {
    try { sessionStorage.setItem(BOT_DOUJUTSU_ATIVAR_KEY, '1'); } catch (e) {}
  }

  function limparDoujutsuAtivarPendente() {
    try { sessionStorage.removeItem(BOT_DOUJUTSU_ATIVAR_KEY); } catch (e) {}
  }

  function sidebarTemLinkReativeDoujutsu(col) {
    if (!col) return false;
    var links = col.querySelectorAll('a[href*="status"]');
    for (var i = 0; i < links.length; i++) {
      if (/\breative\b/i.test(links[i].textContent || '')) return true;
    }
    return false;
  }

  function interpretarEstadoDoujutsuSidebar(val, col) {
    var texto = (val || '').replace(/\s+/g, ' ').trim();
    var expirado = /\bexpirado\b/i.test(texto) || /\breative\b/i.test(texto) ||
      sidebarTemLinkReativeDoujutsu(col);
    if (expirado) {
      return { ativo: false, expirado: true, texto: texto };
    }
    if (/ativo\s+at[eé]/i.test(texto) || /\bativo\b/i.test(texto)) {
      return { ativo: true, expirado: false, texto: texto };
    }
    return { ativo: false, expirado: false, texto: texto };
  }

  function extrairDoujutsuSidebar() {
    var raizes = obterRaizesSidebar();
    var colRef = document.getElementById('col_esquerda') ||
      document.querySelector('.np-sidebar');

    for (var r = 0; r < raizes.length; r++) {
      var raiz = raizes[r];
      var djTop = raiz.querySelector('.doujutsu-top');
      if (djTop) {
        var statusEl = djTop.querySelector('.doujutsu-status');
        var timerEl = raiz.querySelector('.doujutsu-timer');
        var texto = ((statusEl && (statusEl.innerText || statusEl.textContent)) || '') +
          ' ' + ((timerEl && (timerEl.innerText || timerEl.textContent)) || '');
        var estado = interpretarEstadoDoujutsuSidebar(texto.trim(), colRef || raiz);
        return {
          encontrado: true,
          ativo: estado.ativo,
          expirado: estado.expirado,
          texto: estado.texto
        };
      }

      var textoPagina = raiz.innerText || raiz.textContent || '';
      var m = textoPagina.match(/D[oō\u014d]jutsu\s*:?\s*([^\n]+)/i);
      if (!m) continue;
      var estadoLegado = interpretarEstadoDoujutsuSidebar(m[1], colRef || raiz);
      return {
        encontrado: true,
        ativo: estadoLegado.ativo,
        expirado: estadoLegado.expirado,
        texto: estadoLegado.texto
      };
    }
    return { encontrado: false, ativo: false, expirado: false, texto: '' };
  }

  function doujutsuEstaAtivo() {
    return extrairDoujutsuSidebar().ativo;
  }

  function obterFormAtivarDoujutsuStatus() {
    var forms = document.querySelectorAll('form[action="status"]');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (!form.querySelector('input[name="ativar_dj_esp_status"]')) continue;
      var btn = form.querySelector('input[type="submit"]');
      if (!btn) continue;
      var val = (btn.value || '').toLowerCase();
      if (val.indexOf('ativar') === -1) continue;
      return form;
    }
    return null;
  }

  function obterRyousParaDoujutsu() {
    var ryous = extrairRyousJogadorSidebar();
    if (ryous !== null) return ryous;
    return extrairReservaRyous();
  }

  function ryousSuficienteParaDoujutsu() {
    var ryous = obterRyousParaDoujutsu();
    if (ryous === null) return { ok: false, ryous: null };
    return { ok: ryous >= DOUJUTSU_CUSTO_RYOUS, ryous: ryous };
  }

  function logDoujutsuRyousInsuficiente(contexto, ryous) {
    console.log(
      '[Doujutsu] Ryous ' + formatarNumeroBr(ryous) + ' < ' + formatarNumeroBr(DOUJUTSU_CUSTO_RYOUS) +
      ' — sem ativar (' + (contexto || '?') + ').'
    );
  }

  function logDoujutsuRyousIlegivel(contexto) {
    console.warn('[Doujutsu] Ryous ilegivel — sem ativar (' + (contexto || '?') + ').');
  }

  function precisaAtivarDoujutsuAgora() {
    if (!doujutsuDesejado()) return false;
    if (doujutsuEstaAtivo()) return false;
    return ryousSuficienteParaDoujutsu().ok;
  }

  function tentarAtivarDoujutsuAposHpOk(contexto) {
    if (!precisaAtivarDoujutsuAgora()) return false;
    marcarDoujutsuAtivarPendente();
    return processarDoujutsuNaPaginaStatus(contexto || 'pos-cura HP');
  }

  function processarDoujutsuNaPaginaStatus(contexto) {
    if (obterModoAba() !== 'cacadas') return false;
    if (!doujutsuAtivarPendente()) return false;

    if (doujutsuEstaAtivo()) {
      console.log('[Doujutsu] Ja ativo — ' + (extrairDoujutsuSidebar().texto || 'OK') +
        (contexto ? ' (' + contexto + ')' : ''));
      limparDoujutsuAtivarPendente();
      return false;
    }

    var chkRyous = ryousSuficienteParaDoujutsu();
    if (!chkRyous.ok) {
      if (chkRyous.ryous === null) logDoujutsuRyousIlegivel(contexto);
      else logDoujutsuRyousInsuficiente(contexto, chkRyous.ryous);
      limparDoujutsuAtivarPendente();
      return false;
    }

    var form = obterFormAtivarDoujutsuStatus();
    if (!form) {
      console.warn('[Doujutsu] Botao Ativar nao encontrado em /status.');
      limparDoujutsuAtivarPendente();
      return false;
    }

    console.log('[Doujutsu] Ativando dojutsu especial (' + formatarNumeroBr(DOUJUTSU_CUSTO_RYOUS) + ' ryous)...');
    var btnSubmit = form.querySelector('input[type="submit"]');
    if (btnSubmit) btnSubmit.click();
    else form.submit();
    return true;
  }

  function garantirDoujutsuParaAtacar(contexto) {
    if (obterModoAba() !== 'cacadas') return true;
    var precisaDoujutsu = atacarAutomacoesAtacanteAtivo() ||
      obterModoCacadasSessao() === 'automacao_atacar' ||
      doujutsuDesejado();
    if (!precisaDoujutsu) return true;

    if (doujutsuAtivarPendente()) {
      var chkPendente = ryousSuficienteParaDoujutsu();
      if (!chkPendente.ok) {
        if (chkPendente.ryous === null) logDoujutsuRyousIlegivel(contexto);
        else logDoujutsuRyousInsuficiente(contexto, chkPendente.ryous);
        limparDoujutsuAtivarPendente();
        return true;
      }
      if ((window.location.href || '').indexOf('status') === -1) {
        console.log('[Doujutsu] Ativacao pendente — indo para /status...');
        consumirGateCacadas();
        window.location.href = URL_STATUS;
      }
      return false;
    }

    if (doujutsuEstaAtivo()) return true;

    var chk = ryousSuficienteParaDoujutsu();
    if (!chk.ok) {
      if (chk.ryous === null) logDoujutsuRyousIlegivel(contexto);
      else logDoujutsuRyousInsuficiente(contexto, chk.ryous);
      return true;
    }

    console.log('[Doujutsu] Inativo — indo para /status ativar (' + (contexto || '?') + ')...');
    marcarDoujutsuAtivarPendente();
    consumirGateCacadas();
    window.location.href = URL_STATUS;
    return false;
  }

  function processarRotacaoContaPrincipal() {
    if (missaoNovoPausaRotinaCacadas()) return false;
    if (!precisaAssumirAutomacaoPosPrincipal()) return false;
    if (obterModoAba() !== 'cacadas') return false;
    if (document.getElementById('login')) return false;
    if (estaEmContaGerenciada()) return false;

    var url = window.location.href;
    if (url.indexOf('automacao') !== -1) return false;
    if (url.indexOf('captcha_seguranca') !== -1) return false;

    try {
      if (sessionStorage.getItem(BOT_ROTACAO_CICLO_KEY) === '1') return false;
      if (sessionStorage.getItem(BOT_ROTACAO_ASSUMIDA_KEY) === '1') return false;
    } catch (e) {}

    if (precisaRetomarGerenciada()) {
      console.warn('[Automacao] Conta principal pos-logout — retomando gerenciada via automacao...');
    } else if (diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva()) {
      console.warn('[Diario] Conta principal — diario ativo, indo assumir gerenciada...');
    } else {
      console.warn('[Automacao] Conta principal detectada — indo assumir automacao...');
    }
    marcarRotacaoCicloPendente();
    portaoRelatoriosAgendado = false;
    if (diarioGerenciadaAtivo() && !rotacaoAutomacaoAtiva() && !precisaRetomarGerenciada()) {
      console.warn('[Diario] Conta principal — indo para automacao (diario)...');
      window.location.href = URL_AUTOMACAO;
      return true;
    }
    setTimeout(function() {
      window.location.href = URL_AUTOMACAO;
    }, 1500);
    return true;
  }

  // Nível da Caçada (Lê do localStorage ou usa '4' como padrão)
  var NIVEL_CACADAS_DEFAULT = '4';
  var BOT_NIVEL_CACADAS_BASE_KEY = 'BOT_NIVEL_CACADAS_BASE';
  var BOT_NIVEL_ESCALADO_PAGINA_KEY = 'BOT_NIVEL_ESCALADO_PAGINA';
  var NIVEL_CACADAS_ESCALONAMENTO_MAX = 3;
  var NIVEL_CACADAS_FINAL = NIVEL_CACADAS_DEFAULT;

  function parseNivelCacadas(valor) {
    var n = parseNumeroInteiro(valor);
    if (n === null || n < 1) return null;
    return n;
  }

  function obterNivelCacadasBase() {
    var base = parseNivelCacadas(localStorage.getItem(BOT_NIVEL_CACADAS_BASE_KEY));
    if (base !== null) return base;
    var atual = parseNivelCacadas(localStorage.getItem('BOT_NIVEL_CACADAS'));
    if (atual !== null) return atual;
    return parseInt(NIVEL_CACADAS_DEFAULT, 10);
  }

  function obterNivelCacadasAtual() {
    var n = parseNivelCacadas(localStorage.getItem('BOT_NIVEL_CACADAS'));
    if (n !== null) return n;
    return obterNivelCacadasBase();
  }

  function obterNivelCacadasMaximo() {
    return obterNivelCacadasBase() + NIVEL_CACADAS_ESCALONAMENTO_MAX;
  }

  function descreverNivelCacadasPainel() {
    var atual = obterNivelCacadasAtual();
    var base = obterNivelCacadasBase();
    var max = obterNivelCacadasMaximo();
    return atual + ' (base ' + base + ', max ' + max + ')';
  }

  function garantirNivelCacadasBaseInicial() {
    try {
      if (!localStorage.getItem(BOT_NIVEL_CACADAS_BASE_KEY)) {
        var n = localStorage.getItem('BOT_NIVEL_CACADAS') || NIVEL_CACADAS_DEFAULT;
        localStorage.setItem(BOT_NIVEL_CACADAS_BASE_KEY, n);
      }
      if (!localStorage.getItem('BOT_NIVEL_CACADAS')) {
        localStorage.setItem(
          'BOT_NIVEL_CACADAS',
          localStorage.getItem(BOT_NIVEL_CACADAS_BASE_KEY) || NIVEL_CACADAS_DEFAULT
        );
      }
    } catch (e) {}
    sincronizarNivelCacadasFinal();
  }

  function sincronizarNivelCacadasFinal() {
    NIVEL_CACADAS_FINAL = String(obterNivelCacadasAtual());
  }

  function escalarNivelCacadasIndisponivel(motivo) {
    var atual = obterNivelCacadasAtual();
    var base = obterNivelCacadasBase();
    var max = obterNivelCacadasMaximo();
    var proximo = atual >= max ? base : atual + 1;

    try { localStorage.setItem('BOT_NIVEL_CACADAS', String(proximo)); } catch (e) {}
    sincronizarNivelCacadasFinal();
    console.warn(
      '[Caçadas] Classe indisponivel (' + motivo + ') — nivel ' + atual + ' -> ' + proximo +
      ' (base ' + base + ', max ' + max + ')'
    );
    exibirModoAbaServerID();
    return proximo;
  }

  garantirNivelCacadasBaseInicial();

  // Intervalo apos ultimo ataque (relatorios) — bot_espera_cacadas (minutos) via URL ou localStorage
  // Penalidade fixa 5min pos-ataque + extra aleatorio: comercial +2-4 (7-9 total); madrugada +8-15 (13-20 total)
  var COOLDOWN_PENALIDADE_CACADAS_MS = 300000;    // 5 min obrigatorio pos-ataque
  var EXTRA_CACADAS_COMERCIAL_MIN_MS = 120000;    // +2 min
  var EXTRA_CACADAS_COMERCIAL_MAX_MS = 240000;    // +4 min
  var EXTRA_CACADAS_MADRUGADA_MIN_MS = 480000;    // +8 min
  var EXTRA_CACADAS_MADRUGADA_MAX_MS = 900000;    // +15 min
  var ESPERA_CACADAS_HORA_INICIO_LENTA = 2;       // 02:00
  var ESPERA_CACADAS_HORA_FIM_LENTA = 9;          // ate 08:59
  var GATE_CACADAS_VALIDADE_MS = 60000;
  var TETO_OCIOSO_PORTAO_TETO_29_MS = 29 * 60000; // teto ocioso com bot_cacadas_teto_29=1
  var ESPERA_PORTAO_TETO_29_MIN_MS = 5 * 60000;   // 5min total (inclui penalidade)
  var ESPERA_PORTAO_TETO_29_MAX_MS = 6 * 60000;   // 6min total (inclui penalidade)

  function estaNoHorarioEsperaCacadasLenta() {
    var hora = new Date().getHours();
    return hora >= ESPERA_CACADAS_HORA_INICIO_LENTA && hora < ESPERA_CACADAS_HORA_FIM_LENTA;
  }

  function calcularIntervaloEsperaCacadas() {
    if (cacadasPortaoTeto29FlagAtiva()) {
      return {
        minMs: ESPERA_PORTAO_TETO_29_MIN_MS,
        maxMs: ESPERA_PORTAO_TETO_29_MAX_MS,
        tetoOciosoMs: TETO_OCIOSO_PORTAO_TETO_29_MS,
        penMs: COOLDOWN_PENALIDADE_CACADAS_MS,
        origem: 'portao-teto-29'
      };
    }

    var madrugada = estaNoHorarioEsperaCacadasLenta();
    var penMs = COOLDOWN_PENALIDADE_CACADAS_MS;
    var minutos = parseEsperaCacadasMinutos(localStorage.getItem('BOT_ESPERA_CACADAS'));

    if (minutos === null) {
      if (madrugada) {
        var minMad = penMs + EXTRA_CACADAS_MADRUGADA_MIN_MS;
        var maxMad = penMs + EXTRA_CACADAS_MADRUGADA_MAX_MS;
        return {
          minMs: minMad,
          maxMs: maxMad,
          tetoOciosoMs: maxMad,
          penMs: penMs,
          origem: 'padrao-madrugada'
        };
      }
      var minCom = penMs + EXTRA_CACADAS_COMERCIAL_MIN_MS;
      var maxCom = penMs + EXTRA_CACADAS_COMERCIAL_MAX_MS;
      return {
        minMs: minCom,
        maxMs: maxCom,
        tetoOciosoMs: maxCom,
        penMs: penMs,
        origem: 'padrao-comercial'
      };
    }

    if (minutos < 2) {
      var maxCfgCurto = penMs + 120000;
      return {
        minMs: penMs,
        maxMs: maxCfgCurto,
        tetoOciosoMs: maxCfgCurto,
        penMs: penMs,
        origem: 'config',
        minutos: minutos
      };
    }

    var minCfg = penMs + Math.round((minutos - 2) * 60000);
    var maxCfg = penMs + Math.round(minutos * 60000);
    return {
      minMs: minCfg,
      maxMs: maxCfg,
      tetoOciosoMs: maxCfg,
      penMs: penMs,
      origem: 'config',
      minutos: minutos
    };
  }

  function sortearTargetEsperaCacadas(iv) {
    var intervalo = iv || calcularIntervaloEsperaCacadas();
    if (intervalo.minMs >= intervalo.maxMs) return intervalo.maxMs;
    return Math.floor(Math.random() * (intervalo.maxMs - intervalo.minMs + 1)) + intervalo.minMs;
  }

  function descreverEsperaCacadas() {
    var iv = calcularIntervaloEsperaCacadas();
    var penMin = Math.round(iv.penMs / 60000);
    var minMin = Math.round(iv.minMs / 60000);
    var maxMin = Math.round(iv.maxMs / 60000);
    if (iv.origem === 'padrao-madrugada') {
      return penMin + 'min cooldown + 8-15min (' + minMin + '-' + maxMin + ' total, madrugada)';
    }
    if (iv.origem === 'portao-teto-29') {
      return minMin + '-' + maxMin + 'min total no portao (teto ocioso 29min, bot_cacadas_teto_29=1)';
    }
    if (iv.origem === 'padrao-comercial') {
      return penMin + 'min cooldown + 2-4min (' + minMin + '-' + maxMin + ' total, comercial)';
    }
    return penMin + 'min cooldown + extra (' + minMin + '-' + maxMin + ' total, bot_espera_cacadas=' +
      iv.minutos + ')';
  }

  function textoCelulaRelatorio(celula) {
    return String((celula && (celula.innerText || celula.textContent)) || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matchTextoDataHoraRelatorio(texto) {
    var s = String(texto || '').trim();
    var comAno = s.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/);
    if (comAno) return comAno[1];
    var semAno = s.match(/(\d{2}\/\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/);
    return semAno ? semAno[1] : null;
  }

  function parseDataHoraRelatorioAtaque(texto) {
    var s = String(texto || '').trim();
    var agora = new Date();
    var m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      var dtAno = new Date(
        parseInt(m[3], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[1], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        m[6] ? parseInt(m[6], 10) : 0,
        0
      );
      return isNaN(dtAno.getTime()) ? null : dtAno.getTime();
    }

    m = s.match(/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;

    var dia = parseInt(m[1], 10);
    var mes = parseInt(m[2], 10) - 1;
    var hora = parseInt(m[3], 10);
    var minuto = parseInt(m[4], 10);
    var segundo = m[5] ? parseInt(m[5], 10) : 0;
    var ano = agora.getFullYear();
    var dt = new Date(ano, mes, dia, hora, minuto, segundo, 0);

    if (dt.getTime() > agora.getTime() + 86400000) {
      dt = new Date(ano - 1, mes, dia, hora, minuto, segundo, 0);
    }
    if (dt.getTime() > agora.getTime() + 3600000) {
      dt.setDate(dt.getDate() - 1);
    }

    return dt.getTime();
  }

  function extrairNomeJogadorDeCelula(celula) {
    if (!celula) return null;
    var link = celula.querySelector('a[href*="jogador"]');
    if (link) {
      var href = link.getAttribute('href') || '';
      var m = href.match(/[?&]u=([^&#]+)/i);
      if (m) {
        try {
          return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
        } catch (e) {
          return m[1].trim();
        }
      }
      var nomeLink = (link.innerText || link.textContent || '').replace(/\s+/g, ' ').trim();
      if (nomeLink) return nomeLink;
    }
    var texto = textoCelulaRelatorio(celula);
    return texto || null;
  }

  function extrairNomeVitimaCelulaRelatorio(celula) {
    return extrairNomeJogadorDeCelula(celula);
  }

  function ehCabecalhoColunaAtacado(textoNorm) {
    return textoNorm === 'atacado' || textoNorm === 'atacante';
  }

  function ehCabecalhoColunaVencedor(textoNorm) {
    return textoNorm === 'vencedor' || textoNorm === 'vitoria' || textoNorm === 'vitorias';
  }

  function obterTabelaRelatoriosAtaque() {
    var col = document.getElementById('col_direita') || document;
    var linhas = col.querySelectorAll('tr');

    for (var i = 0; i < linhas.length; i++) {
      var celulas = linhas[i].cells;
      if (!celulas || celulas.length < 4) continue;

      var idxAtacado = -1;
      var idxVencedor = -1;
      var idxData = -1;
      for (var c = 0; c < celulas.length; c++) {
        var t = normalizarTextoCombate(textoCelulaRelatorio(celulas[c]));
        if (ehCabecalhoColunaAtacado(t)) idxAtacado = c;
        if (ehCabecalhoColunaVencedor(t)) idxVencedor = c;
        if (t === 'data') idxData = c;
      }

      if (idxAtacado === -1 || idxData === -1) continue;

      var tabela = linhas[i].closest ? linhas[i].closest('table') : linhas[i].parentNode;
      if (tabela && tabela.tagName && tabela.tagName.toLowerCase() !== 'table') {
        tabela = tabela.parentNode;
      }
      if (!tabela || !tabela.rows) continue;

      return {
        tabela: tabela,
        idxData: idxData,
        idxAtacado: idxAtacado,
        idxVencedor: idxVencedor
      };
    }

    return null;
  }

  function coletarRelatoriosAtaqueTabela(infoTabela, adicionar) {
    if (!infoTabela || !infoTabela.tabela) return 0;
    var rows = infoTabela.tabela.rows;
    var n = 0;

    for (var r = 0; r < rows.length; r++) {
      var celulas = rows[r].cells;
      if (!celulas || celulas.length <= infoTabela.idxData) continue;
      if (ehCabecalhoColunaAtacado(normalizarTextoCombate(textoCelulaRelatorio(celulas[infoTabela.idxAtacado])))) {
        continue;
      }

      var dataTexto = matchTextoDataHoraRelatorio(textoCelulaRelatorio(celulas[infoTabela.idxData]));
      if (!dataTexto) dataTexto = matchTextoDataHoraRelatorio(textoCelulaRelatorio(rows[r]));
      if (!dataTexto) continue;

      var vitima = extrairNomeJogadorDeCelula(celulas[infoTabela.idxAtacado]);
      if (!vitima) continue;

      adicionar({
        ts: parseDataHoraRelatorioAtaque(dataTexto),
        dataTexto: dataTexto,
        vitima: vitima,
        resumo: textoCelulaRelatorio(rows[r])
      });
      n++;
    }
    return n;
  }

  function coletarRelatoriosAtaque() {
    var col = document.getElementById('col_direita') || document;
    var lista = [];
    var vistos = {};

    function adicionar(item) {
      if (!item) return;
      var temTs = item.ts !== null && item.ts !== undefined && !isNaN(item.ts);
      if (!temTs && !item.vitima) return;
      var chave = String(temTs ? item.ts : '') + '|' + (item.dataTexto || '') + '|' + (item.vitima || '');
      if (vistos[chave]) return;
      vistos[chave] = true;
      lista.push(item);
    }

    var infoTabela = obterTabelaRelatoriosAtaque();
    var linhasTabela = infoTabela ? coletarRelatoriosAtaqueTabela(infoTabela, adicionar) : 0;

    if (!linhasTabela) {
      var linksJogador = col.querySelectorAll('a[href*="jogador"]');
      for (var j = 0; j < linksJogador.length; j++) {
        var rowJ = linksJogador[j].closest ? linksJogador[j].closest('tr') : null;
        if (!rowJ || !rowJ.cells || rowJ.cells.length < 3) continue;

        var vitimaJ = extrairNomeVitimaCelulaRelatorio(rowJ.cells[0]);
        if (!vitimaJ) continue;

        var dataTextoJ = null;
        for (var cj = rowJ.cells.length - 1; cj >= 0; cj--) {
          dataTextoJ = matchTextoDataHoraRelatorio(textoCelulaRelatorio(rowJ.cells[cj]));
          if (dataTextoJ) break;
        }

        adicionar({
          ts: dataTextoJ ? parseDataHoraRelatorioAtaque(dataTextoJ) : null,
          dataTexto: dataTextoJ,
          vitima: vitimaJ,
          resumo: textoCelulaRelatorio(rowJ)
        });
      }

      var links = col.querySelectorAll('a[href*="relatorios_ataque"]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        if (href.indexOf('ver=') === -1) continue;

        var texto = (links[i].innerText || links[i].textContent || '').replace(/\s+/g, ' ').trim();
        var matchData = matchTextoDataHoraRelatorio(texto);
        var vitima = extrairVitimaDoRelatorioAtaque(texto);
        if (!matchData && !vitima) continue;

        adicionar({
          ts: matchData ? parseDataHoraRelatorioAtaque(matchData) : null,
          dataTexto: matchData,
          vitima: vitima,
          resumo: texto
        });
      }
    }

    return lista;
  }

  function extrairUltimoAtaqueRelatorios() {
    var lista = coletarRelatoriosAtaque();
    var melhor = null;

    for (var i = 0; i < lista.length; i++) {
      if (lista[i].ts === null || lista[i].ts === undefined || isNaN(lista[i].ts)) continue;
      if (!melhor || lista[i].ts > melhor.ts) melhor = lista[i];
    }

    return melhor;
  }

  function extrairVitimaDoRelatorioAtaque(texto) {
    var norm = normalizarTextoCombate(texto);
    if (norm.indexOf('voce atacou') === -1) return null;

    var m = String(texto || '').match(/voce atacou\s+(.+?)(?:\s+[-–—]\s|\s+em\s|\.\s*$|$)/i);
    if (m) return m[1].trim();

    m = String(texto || '').match(/voce atacou\s+(.+)/i);
    return m ? m[1].trim() : null;
  }

  function extrairAtaquesRelatorios() {
    var lista = coletarRelatoriosAtaque();
    var ataques = [];

    for (var i = 0; i < lista.length; i++) {
      var item = lista[i];
      if (!item.vitima) continue;
      ataques.push({
        ts: item.ts,
        vitima: item.vitima,
        vitimaNorm: normalizarNomeCacadas(item.vitima),
        dataTexto: item.dataTexto,
        resumo: item.resumo
      });
    }

    return ataques;
  }

  function formatarHorarioLocalBr(ts) {
    try {
      return new Date(ts).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return String(ts);
    }
  }

  function calcularEsperaAposUltimoAtaque(ultimoAtaqueMs) {
    var iv = calcularIntervaloEsperaCacadas();
    var agora = Date.now();

    if (ultimoAtaqueMs === null || ultimoAtaqueMs === undefined || isNaN(ultimoAtaqueMs)) {
      return {
        waitMs: 0,
        motivo: 'sem historico de ataque — caçada imediata',
        iv: iv
      };
    }

    var elapsedMs = agora - ultimoAtaqueMs;
    if (elapsedMs < 0) elapsedMs = 0;

    var targetMs = sortearTargetEsperaCacadas(iv);
    var tetoMs = iv.tetoOciosoMs;
    var elapsedMin = (elapsedMs / 60000).toFixed(1);
    var targetMin = (targetMs / 60000).toFixed(1);
    var tetoMin = (tetoMs / 60000).toFixed(0);

    if (elapsedMs >= tetoMs) {
      return {
        waitMs: 0,
        motivo: 'teto ocioso atingido (' + elapsedMin + 'min >= ' + tetoMin + 'min)',
        elapsedMs: elapsedMs,
        targetMs: targetMs,
        tetoMs: tetoMs,
        iv: iv
      };
    }

    if (elapsedMs >= targetMs) {
      return {
        waitMs: 0,
        motivo: 'intervalo alvo atingido (' + elapsedMin + 'min >= ' + targetMin + 'min)',
        elapsedMs: elapsedMs,
        targetMs: targetMs,
        tetoMs: tetoMs,
        iv: iv
      };
    }

    var waitBrutoMs = targetMs - elapsedMs;
    var waitMaxMs = tetoMs - elapsedMs;
    var waitMs = Math.min(waitBrutoMs, waitMaxMs);

    if (waitMs <= 0) {
      return {
        waitMs: 0,
        motivo: 'espera zero — caçada imediata',
        elapsedMs: elapsedMs,
        targetMs: targetMs,
        tetoMs: tetoMs,
        iv: iv
      };
    }

    return {
      waitMs: waitMs,
      liberacaoEm: agora + waitMs,
      motivo: 'aguardando ' + Math.round(waitMs / 1000) + 's — libera ~' +
        formatarHorarioLocalBr(agora + waitMs) + ' (' +
        elapsedMin + 'min desde ultimo, alvo ' + targetMin + 'min, teto ' + tetoMin + 'min)',
      elapsedMs: elapsedMs,
      targetMs: targetMs,
      tetoMs: tetoMs,
      iv: iv
    };
  }

  function liberarGateCacadas() {
    try { sessionStorage.setItem(BOT_CACADAS_GATE_KEY, String(Date.now())); } catch (e) {}
  }

  function gateCacadasLiberado() {
    try {
      var raw = sessionStorage.getItem(BOT_CACADAS_GATE_KEY);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      if (isNaN(ts) || Date.now() - ts > GATE_CACADAS_VALIDADE_MS) {
        sessionStorage.removeItem(BOT_CACADAS_GATE_KEY);
        return false;
      }
      return true;
    } catch (e) {}
    return false;
  }

  function consumirGateCacadas() {
    try { sessionStorage.removeItem(BOT_CACADAS_GATE_KEY); } catch (e) {}
  }

  function agendarRetentativaPortao(motivo, delayMs) {
    if (portaoRelatoriosAgendado) return;
    portaoRelatoriosAgendado = true;
    var seg = Math.round((delayMs || 5000) / 1000);
    console.log('[Caçadas] Portao — ' + motivo + ' | nova tentativa em ' + seg + 's...');
    setTimeout(function() {
      portaoRelatoriosAgendado = false;
      processarPortaoRelatoriosAtaque();
    }, delayMs || 5000);
  }

  function irParaCacadasLiberado(motivo) {
    if (atacarAutomacoesAtacanteAtivo()) {
      restaurarModoAutomAtacanteSeNecessario();
    }
    if (atacarAutomacoesAtacanteAtivo() && !cacadaAtualPorNomeAutomacao()) {
      console.log('[Autom Atacante] Sem alvo ready — permanece no portao (' + motivo + ').');
      agendarRetentativaPortao('autom atacante sem alvo');
      return;
    }
    if (redirecionarDiarioNoLugarDeCacadas('portao -> caçadas (' + motivo + ')')) return;
    var urlAntes = window.location.href;
    if (!garantirHpParaAtacar('portao -> caçadas (' + motivo + ')')) {
      setTimeout(function() {
        var aindaNoPortao = window.location.href === urlAntes && (
          window.location.href.indexOf('relatorios_ataque') !== -1 ||
          !!document.querySelector('.msg-pipetabs a.active[href*="relatorios_ataque"]')
        );
        if (aindaNoPortao) agendarRetentativaPortao('bloqueio HP/cura no portao');
      }, 4000);
      return;
    }
    if (!garantirCacadasLiberadaPorInvasor('portao -> caçadas (' + motivo + ')')) return;
    if (atacarAutomacoesAtacanteAtivo() && !garantirDoujutsuParaAtacar('portao -> caçadas (' + motivo + ')')) {
      return;
    }
    console.log('[Caçadas] ' + motivo + ' — redirecionando para caçadas.');
    liberarGateCacadas();
    window.location.href = URL_CACADAS;
  }

  function irParaPortaoRelatorios(motivo, opcoes) {
    if (redirecionarDiarioNoLugarDeCacadas(motivo)) return;
    var opts = opcoes || {};
    if (opts.rotacionarAutomacao && rotacaoAutomacaoAtiva()) {
      irParaRotacaoAutomacao(motivo);
      return;
    }
    console.log('[Caçadas] ' + motivo + ' — portao relatorios de ataque...');
    consumirGateCacadas();
    portaoRelatoriosAgendado = false;
    setTimeout(function() {
      window.location.href = URL_RELATORIOS_ATAQUE;
    }, 1500);
  }

  function processarPortaoRelatoriosAtaque() {
    if (redirecionarParaDiarioGerenciada('Portao relatorios')) return true;
    if (portaoRelatoriosAgendado) return true;

    verificarInvasorNoPortao(function(pausado, info) {
      if (pausado) {
        marcarAguardandoBossMorto();
        agendarPortaoAguardandoInvasor(info);
        return;
      }
      if (deveAplicarEsperaPosBossAtivo(info)) {
        agendarEsperaPosBossAtivo(info);
        return;
      }
      processarPortaoRelatoriosAtaqueContinuar();
    });
    return true;
  }

  function processarPortaoRelatoriosAtaqueContinuar() {
    if (portaoRelatoriosAgendado) return;

    if (atacarAutomacoesAtacanteAtivo() && !garantirDoujutsuParaAtacar('portao autom atacante')) {
      return true;
    }

    if (atacarAutomacoesAtacanteAtivo()) {
      lerAutomacaoCoord(function(coord) {
        buscarProximoAlvoAutomacaoAtacante(coord, function(alvo) {
          if (alvo) {
            definirModoCacadasAutomacao(alvo.nome);
            console.log('[Autom Atacante] Alvo ready — ataque imediato (sem espera portao): ' + alvo.nome);
            irParaCacadasLiberado('autom atacante alvo ready');
          } else {
            console.log('[Autom Atacante] Sem alvo ready — retentativa portao em 5s...');
            agendarRetentativaPortao('autom atacante aguardando prep');
          }
        });
      });
      return true;
    }

    var ultimo = extrairUltimoAtaqueRelatorios();
    var decisao = calcularEsperaAposUltimoAtaque(ultimo ? ultimo.ts : null);

    if (ultimo) {
      console.log('[Caçadas] Ultimo ataque: ' + ultimo.dataTexto + ' — ' + ultimo.resumo);
    } else {
      console.warn('[Caçadas] Nenhum relatorio de ataque com data encontrado.');
    }

    console.log('[Caçadas] Portao — ' + decisao.motivo);

    if (deveRotacionarAutomacaoNoPortao(decisao)) {
      var seg = decisao.waitMs > 0 ? Math.round(decisao.waitMs / 1000) + 's cooldown' : 'ataque recente';
      irParaRotacaoAutomacao('Portao (' + seg + ')');
      return true;
    }

    function irAposResolver() {
      if (decisao.waitMs <= 0) {
        irParaCacadasLiberado('portao-imediato');
        return;
      }

      portaoRelatoriosAgendado = true;
      var segundos = Math.round(decisao.waitMs / 1000);
      var quando = formatarHorarioLocalBr(decisao.liberacaoEm || (Date.now() + decisao.waitMs));
      console.log('[Caçadas] Portao — aguardando ' + segundos + 's nesta pagina (proxima acao ~' + quando + ')...');

      setTimeout(function() {
        var ultimoPos = extrairUltimoAtaqueRelatorios();
        var decisaoPos = calcularEsperaAposUltimoAtaque(ultimoPos ? ultimoPos.ts : null);
        console.log('[Caçadas] Portao pos-espera — ' + decisaoPos.motivo);
        resolverDestinoNoPortao(decisaoPos, function() {
          irParaCacadasLiberado('portao-pos-espera (' + segundos + 's)');
        }, { aposEsperaNoPortao: true });
      }, decisao.waitMs);
    }

    if (decisao.waitMs <= 0) {
      resolverDestinoNoPortao(decisao, irAposResolver, { aposEsperaNoPortao: false });
    } else {
      irAposResolver();
    }

    return true;
  }

  // --- Whitelist = nomes/clas que NAO atacar (pagina atacar) ---
  var MAX_RYOUS_CACADAS_DEFAULT = 100000000;
  var DIFF_NIVEL_CACADAS_DEFAULT = 20;

  function normalizarNomeCacadas(nome) {
    return String(nome || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function obterWhitelistCacadas() {
    var raw = localStorage.getItem('BOT_WHITELIST_CACADAS');
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      raw = WHITELIST_CACADAS_DEFAULT;
    }
    return String(raw).split(',').map(function(s) { return normalizarNomeCacadas(s); }).filter(Boolean);
  }

  function obterMaxRyousCacadas() {
    var n = parseNumeroInteiro(localStorage.getItem('BOT_MAX_RYOUS_CACADAS'));
    return n === null ? MAX_RYOUS_CACADAS_DEFAULT : n;
  }

  function obterDiffNivelCacadas() {
    var n = parseNumeroInteiro(localStorage.getItem('BOT_DIFF_NIVEL_CACADAS'));
    return n === null ? DIFF_NIVEL_CACADAS_DEFAULT : n;
  }

  function obterWhitelistClaCacadas() {
    var raw = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS');
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      raw = WHITELIST_CLA_CACADAS_DEFAULT;
    }
    return String(raw).split(',').map(function(s) { return normalizarNomeCacadas(s); }).filter(Boolean);
  }

  function descreverWhitelistClaAtacar() {
    var lista = obterWhitelistClaCacadas();
    var sufixo = localStorage.getItem('BOT_WHITELIST_CLA_CACADAS')
      ? ' (bot_whitelist_cla_cacadas)'
      : ' (padrao)';
    return 'nao atacar cla: ' + lista.join(', ') + sufixo;
  }

  function descreverWhitelistAtacar() {
    var lista = obterWhitelistCacadas();
    var sufixo = localStorage.getItem('BOT_WHITELIST_CACADAS')
      ? ' (bot_whitelist_cacadas)'
      : ' (padrao)';
    return 'nao atacar: ' + lista.join(', ') + sufixo;
  }

  function obterWhitelistFirebaseFila() {
    var raw = localStorage.getItem('BOT_WHITELIST_FIREBASE_FILA');
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      raw = WHITELIST_FIREBASE_FILA_DEFAULT;
    }
    return String(raw).split(',').map(function(s) { return normalizarNomeCacadas(s); }).filter(Boolean);
  }

  function descreverWhitelistFirebaseFila() {
    var lista = obterWhitelistFirebaseFila();
    var sufixo = localStorage.getItem('BOT_WHITELIST_FIREBASE_FILA')
      ? ' (bot_whitelist_firebase_fila)'
      : ' (padrao)';
    return lista.length + ' nomes' + sufixo;
  }

  function nomeBloqueadoPorWhitelistFirebaseFila(nome) {
    var norm = normalizarNomeCacadas(nome);
    if (!norm) return false;
    var lista = obterWhitelistFirebaseFila();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function obterBlacklistCacadas() {
    var raw = localStorage.getItem('BOT_BLACKLIST_CACADAS');
    if (!raw || !String(raw).trim()) return [];
    return String(raw).split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  }

  function blacklistCacadasAtiva() {
    return obterBlacklistCacadas().length > 0;
  }

  function descreverBlacklistCacadas() {
    var lista = obterBlacklistCacadas();
    if (!lista.length) {
      return 'vazia (caçada por nivel se disponivel)';
    }
    var sufixo = localStorage.getItem('BOT_BLACKLIST_CACADAS')
      ? ' (bot_blacklist_cacadas)'
      : '';
    return lista.join(', ') + sufixo;
  }

  function escHtmlPainelServer(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttrPainelServer(s) {
    return escHtmlPainelServer(s).replace(/"/g, '&quot;');
  }

  function montarHtmlLinhaPrincipalLogin(login) {
    var val = escAttrPainelServer(login || '');
    return 'Principal: <input type="text" id="bot-principal-login" value="' + val +
      '" autocomplete="off" spellcheck="false"' +
      ' title="Login principal — Enter ou sair do campo para salvar"' +
      ' style="width:76px;max-width:42vw;font-size:9pt;padding:1px 4px;margin:0;' +
      'border:1px solid #555;background:#1a1a1a;color:#eee;border-radius:2px;" />';
  }

  function instalarEditorPrincipalLogin(el) {
    if (!el || el.dataset.botPrincipalEditor === '1') return;
    el.dataset.botPrincipalEditor = '1';
    el.addEventListener('focusout', function(ev) {
      var t = ev.target;
      if (!t || t.id !== 'bot-principal-login') return;
      aplicarPrincipalLoginDoPainel(t.value);
    });
    el.addEventListener('keydown', function(ev) {
      if (!ev.target || ev.target.id !== 'bot-principal-login') return;
      if (ev.key === 'Enter') {
        ev.preventDefault();
        ev.target.blur();
      }
    });
  }

  function obterNomeAutomacaoPainel() {
    var login = obterUsuarioLogin();
    var ativo = obterUsuarioExibicao();
    if (!ativo || ativo === login) return '';
    if (estaEmContaGerenciada() || rotacaoAutomacaoAtiva()) return ativo;
    return '';
  }

  function resumirTextoPainel(texto, max) {
    var s = String(texto || '');
    var lim = typeof max === 'number' ? max : 72;
    if (s.length <= lim) return s;
    return s.substring(0, lim - 3) + '...';
  }

  function definirInvasorVivoPainel(dados) {
    invasorVivoPainel = dados || null;
    exibirModoAbaServerID();
  }

  function definirInvasorVivoPainelPausado(info) {
    var reserva = info && info.reserva;
    definirInvasorVivoPainel({
      pausado: true,
      reserva: reserva,
      reservaTexto: (info && info.reservaTexto) ||
        (reserva !== null && reserva !== undefined ? formatarNumeroBr(reserva) : '?'),
      nomeInvasor: info && info.estado && info.estado.nomeInvasor ? info.estado.nomeInvasor : '',
      releituraSeg: Math.round(INVASOR_VIVO_POLL_MS / 1000)
    });
  }

  function definirInvasorVivoPainelAtivo(estado, reserva) {
    definirInvasorVivoPainel({
      pausado: false,
      reserva: reserva,
      reservaTexto: reserva !== null && reserva !== undefined ? formatarNumeroBr(reserva) : null,
      nomeInvasor: estado && estado.nomeInvasor ? estado.nomeInvasor : '',
      bossMorto: !!(estado && estado.invasorDerrotado),
      bossVivo: !!(estado && (estado.temBotao || estado.temTimer))
    });
  }

  function descreverInvasorVivoPainel() {
    if (obterModoAba() !== 'cacadas') return '—';

    if (!invasorVivoFlagAtiva()) return 'desligada';

    if (estaEmContaGerenciada()) {
      return 'ligada (ignorada — conta gerenciada)';
    }

    if (invasorVivoPainel && invasorVivoPainel.posBossEspera) {
      var pos = 'ESPERA pos-respawn — boss vivo, 1o ataque em ~' +
        Math.max(1, Math.round((invasorVivoPainel.posBossEsperaSeg || 0) / 60)) + 'min';
      if (invasorVivoPainel.nomeInvasor) pos += ' (' + invasorVivoPainel.nomeInvasor + ')';
      return pos;
    }

    if (invasorVivoPainel && invasorVivoPainel.pausado) {
      var pausa = 'PAUSADO — reserva ' + (invasorVivoPainel.reservaTexto || '?') + ', boss morto';
      if (invasorVivoPainel.nomeInvasor) pausa += ' (' + invasorVivoPainel.nomeInvasor + ')';
      if (invasorVivoPainel.releituraSeg) pausa += ', releitura ' + invasorVivoPainel.releituraSeg + 's';
      return pausa;
    }

    var cache = lerCacheEstadoInvasor();
    var reserva = null;
    if (invasorVivoPainel && invasorVivoPainel.reserva !== null && invasorVivoPainel.reserva !== undefined) {
      reserva = invasorVivoPainel.reserva;
    } else if (cache && cache.reserva !== null && cache.reserva !== undefined) {
      reserva = cache.reserva;
    } else {
      reserva = extrairReservaRyous();
    }
    var reservaTxt = reserva !== null ? formatarNumeroBr(reserva) : '?';

    if (invasorVivoPainel && !invasorVivoPainel.pausado) {
      if (invasorVivoPainel.bossMorto && reserva !== null && reserva >= RESERVA_RYOUS_MIN_INVASOR_VIVO) {
        var alta = 'ligada — boss morto, reserva ' + reservaTxt + ' (caçadas OK)';
        if (invasorVivoPainel.nomeInvasor) alta += ' (' + invasorVivoPainel.nomeInvasor + ')';
        return alta;
      }
      if (invasorVivoPainel.bossVivo) return 'ligada — boss vivo';
    }

    if (cache && cache.aguardandoProximoBoss && reserva !== null && reserva < RESERVA_RYOUS_MIN_INVASOR_VIVO) {
      var sync = 'PAUSADO — reserva ' + reservaTxt + ', boss morto';
      if (cache.nomeInvasor) sync += ' (' + cache.nomeInvasor + ')';
      return sync;
    }

    if (cache && cache.invasorDerrotado && reserva !== null && reserva >= RESERVA_RYOUS_MIN_INVASOR_VIVO) {
      var ok = 'ligada — boss morto, reserva ' + reservaTxt + ' (caçadas OK)';
      if (cache.nomeInvasor) ok += ' (' + cache.nomeInvasor + ')';
      return ok;
    }

    if (cache && (cache.temBotao || cache.temTimer)) return 'ligada — boss vivo';
    if (cache) return 'ligada — aguardando boss';
    return 'ligada — lendo /invasor...';
  }

  function montarHtmlLinhaInvasorVivoPainel() {
    var texto = descreverInvasorVivoPainel();
    if (texto.indexOf('PAUSADO') === 0) {
      return '<b style="color:#ff9999">' + escHtmlPainelServer(texto) + '</b>';
    }
    if (texto.indexOf('ESPERA pos-respawn') === 0) {
      return '<b style="color:#ffcc66">' + escHtmlPainelServer(texto) + '</b>';
    }
    return escHtmlPainelServer(texto);
  }

  function atualizarPainelInvasorVivo() {
    exibirModoAbaServerID();
  }

  function descreverDoujutsuPainel() {
    if (!doujutsuDesejado()) {
      if (doujutsuFlagManualAtiva()) return 'ligado (manual)';
      var partes = ['desligado'];
      if (!doujutsuAutoSabadoFlagAtiva()) partes.push('auto sab off');
      else if (!estaEmContaGerenciada()) partes.push('nao gerenciada');
      else if (!dentroJanelaDoujutsuSabado()) partes.push('fora sab 17:50-20h');
      return partes.join(' — ');
    }

    var info = extrairDoujutsuSidebar();
    if (info.ativo) return 'ATIVO — ' + info.texto;
    if (doujutsuAtivarPendente()) return 'ativando em /status...';
    if (info.expirado) return 'ligado — expirado (10k ryous)';
    return 'ligado — inativo (10k ryous)';
  }

  function montarHtmlLinhaDoujutsuPainel() {
    var texto = descreverDoujutsuPainel();
    if (texto.indexOf('ATIVO') === 0) {
      return '<b style="color:#66ff99">' + escHtmlPainelServer(texto) + '</b>';
    }
    if (texto.indexOf('ativando') !== -1) {
      return '<b style="color:#ffcc66">' + escHtmlPainelServer(texto) + '</b>';
    }
    return escHtmlPainelServer(texto);
  }

  function montarHtmlLinhaDiarioGerenciadaPainel() {
    var texto = descreverDiarioGerenciada();
    if (diarioGerenciadaAtivo()) {
      var fase = obterFaseDiario();
      if (fase) texto += ' | fase: ' + fase;
      return '<b style="color:#f39c12">' + escHtmlPainelServer(texto) + '</b>';
    }
    return escHtmlPainelServer(texto);
  }

  function montarHtmlLinhaFirebaseFilaPainel() {
    var texto = descreverCacadasFirebaseFila();
    if (cacadasFirebaseFilaFlagAtiva()) {
      return '<b style="color:#66ccff">' + escHtmlPainelServer(texto) + '</b>';
    }
    return escHtmlPainelServer(texto);
  }

  function descreverHpPainel() {
    var hp = obterStatusHp();
    if (!hp.ok) return '?';
    var pct = Math.round(hp.pct * 100);
    var txt = hp.current + '/' + hp.max + ' (' + pct + '%)';
    if (pct < Math.round(obterHpMinimoAtacarRatio() * 100)) return txt + ' — CURAR';
    return txt;
  }

  function montarHtmlLinhaHpPainel() {
    var texto = descreverHpPainel();
    if (texto.indexOf('CURAR') !== -1) {
      return '<b style="color:#ff9999">' + escHtmlPainelServer(texto) + '</b>';
    }
    return escHtmlPainelServer(texto);
  }

  function montarHtmlPainelServerID(el) {
    if (!el.dataset.botServerBase) {
      var primeira = (el.textContent || '').split('\n')[0];
      el.dataset.botServerBase = primeira.replace(/\s*\|\s*Bot:.*$/i, '').trim();
    }

    var modo = '';
    try { modo = sessionStorage.getItem(BOT_MODO_KEY) || ''; } catch (e) {}
    var label = (modo === 'invasor' || modo === 'cacadas') ? modo : 'manual';
    var login = obterUsuarioLogin();
    var auto = obterNomeAutomacaoPainel();
    var linhas = [
      escHtmlPainelServer(el.dataset.botServerBase),
      'Bot: <b>' + escHtmlPainelServer(label) + '</b>',
      montarHtmlLinhaPrincipalLogin(login)
    ];

    if (auto) {
      linhas.push('Auto: <b>' + escHtmlPainelServer(auto) + '</b>');
    }

    linhas.push('<span style="opacity:.65">—</span>');
    linhas.push(
      'Nivel: ' + escHtmlPainelServer(descreverNivelCacadasPainel()) +
      ' | Rotacao: ' + escHtmlPainelServer(descreverRotacaoAutomacao())
    );
    linhas.push('Espera: ' + escHtmlPainelServer(resumirTextoPainel(descreverEsperaCacadas(), 48)));
    linhas.push('Blacklist: ' + escHtmlPainelServer(resumirTextoPainel(descreverBlacklistCacadas(), 64)));
    linhas.push(
      'Max ryous: ' + escHtmlPainelServer(formatarNumeroBr(obterMaxRyousCacadas())) +
      ' | Diff: ' + escHtmlPainelServer(String(obterDiffNivelCacadas())) +
      ' | Min vit: ' + escHtmlPainelServer(formatarNumeroBr(obterMinRyousVitoriaCacadas()))
    );
    linhas.push(
      'WL nome: ' + escHtmlPainelServer(resumirTextoPainel(descreverWhitelistAtacar(), 40))
    );
    linhas.push(
      'WL cla: ' + escHtmlPainelServer(resumirTextoPainel(descreverWhitelistClaAtacar(), 40))
    );
    linhas.push('HP: ' + montarHtmlLinhaHpPainel());
    linhas.push(
      'HP min: ' + escHtmlPainelServer(descreverHpMinimoAtacar())
    );
    linhas.push('Doujutsu: ' + montarHtmlLinhaDoujutsuPainel());
    linhas.push('Firebase Fila: ' + montarHtmlLinhaFirebaseFilaPainel());
    linhas.push('Diario: ' + montarHtmlLinhaDiarioGerenciadaPainel());
    linhas.push('InvasorVivo: ' + montarHtmlLinhaInvasorVivoPainel());
    linhas.push('v' + escHtmlPainelServer(SCRIPT_VERSAO));

    return linhas.join('<br>');
  }

  function exibirModoAbaServerID() {
    function aplicar() {
      var el = document.getElementById('serverID');
      if (!el) return false;
      var inputAtivo = document.activeElement && document.activeElement.id === 'bot-principal-login';
      if (inputAtivo) return true;
      el.style.lineHeight = '1.35';
      el.style.fontSize = '9pt';
      el.style.whiteSpace = 'normal';
      el.innerHTML = montarHtmlPainelServerID(el);
      instalarEditorPrincipalLogin(el);
      return true;
    }
    if (aplicar()) return;
    setTimeout(aplicar, 800);
    setTimeout(aplicar, 2500);
  }

  function extrairNinjaNaoEncontradoCacadas() {
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('ninja nao encontrado') === -1) continue;

      var m = texto.match(/ninja n[aã]o encontrado:\s*(.+)$/i);
      return m ? m[1].trim() : null;
    }

    return null;
  }

  function extrairJaAtacouHojeCacadas() {
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('ja atacou este ninja hoje') === -1) continue;

      return obterAlvoNomeCacadasSessao() || null;
    }

    return null;
  }

  function detectarAvisoBatalhaRecente30mCacadas() {
    var avisos = document.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('sofreu uma') === -1 || norm.indexOf('batalha') === -1) continue;
      if (norm.indexOf('30 minutos') === -1) continue;
      if (norm.indexOf('cacadas') === -1) continue;

      return texto;
    }

    return null;
  }

  function detectarAvisoEnergiaVitalBaixaCacadas() {
    var avisos = document.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('energia vital') === -1) continue;
      if (norm.indexOf('muito baixa') === -1) continue;
      if (norm.indexOf('atacado') === -1) continue;

      return texto;
    }

    return null;
  }

  function extrairNivelAbaixoMinimoCacadas() {
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('nao pode atacar') === -1) continue;
      if (norm.indexOf('abaixo') === -1) continue;

      var m = texto.match(/n[aã]o pode atacar\s+(.+?)\s*[—–\-]\s*o n[ií]vel/i);
      if (m) return m[1].trim();

      return obterAlvoNomeCacadasSessao() || null;
    }

    return null;
  }

  function lerSkipBlacklistCacadas() {
    try {
      var raw = sessionStorage.getItem(BOT_CACADAS_BL_SKIP_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function salvarSkipBlacklistCacadas(mapa) {
    try { sessionStorage.setItem(BOT_CACADAS_BL_SKIP_KEY, JSON.stringify(mapa || {})); } catch (e) {}
  }

  function adicionarSkipBlacklistCacadas(nome) {
    if (!nome) return;
    var mapa = lerSkipBlacklistCacadas();
    mapa[normalizarNomeCacadas(nome)] = Date.now();
    salvarSkipBlacklistCacadas(mapa);
  }

  function limparSkipBlacklistCacadas() {
    try { sessionStorage.removeItem(BOT_CACADAS_BL_SKIP_KEY); } catch (e) {}
  }

  function lerTentativasCacadaPorNome() {
    try {
      var n = parseInt(sessionStorage.getItem(BOT_CACADAS_NOME_FALHAS_KEY), 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {}
    return 0;
  }

  function incrementarTentativasCacadaPorNome() {
    var n = lerTentativasCacadaPorNome() + 1;
    try { sessionStorage.setItem(BOT_CACADAS_NOME_FALHAS_KEY, String(n)); } catch (e) {}
    return n;
  }

  function limparTentativasCacadaPorNome() {
    try { sessionStorage.removeItem(BOT_CACADAS_NOME_FALHAS_KEY); } catch (e) {}
  }

  function processarFalhaCacadaPorNome(nome, motivoLog) {
    if (!nome) nome = obterAlvoNomeCacadasSessao();
    if (!nome) return false;

    if (cacadaAtualPorNomeFirebase()) {
      removerAlvoFirebaseFilaConsumido(nome, motivoLog);
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Firebase fila — ' + motivoLog + ': ' + nome);
      return true;
    }

    if (!cacadaAtualPorNomeBlacklist()) return false;

    if (!rotacaoAutomacaoAtiva()) {
      removerNomeBlacklistCacadas(nome, motivoLog);
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Blacklist — ' + motivoLog + ': ' + nome);
      return true;
    }

    adicionarSkipBlacklistCacadas(nome);
    var tent = incrementarTentativasCacadaPorNome();
    console.warn(
      '[Blacklist] Falha caçada por nome (' + tent + '/' + MAX_TENTATIVAS_CACADA_POR_NOME +
      ') — ' + motivoLog + ': ' + nome
    );
    limparEstadoModoCacadas();

    if (tent >= MAX_TENTATIVAS_CACADA_POR_NOME) {
      limparTentativasCacadaPorNome();
      limparSkipBlacklistCacadas();
      irParaRotacaoAutomacao('3 falhas caçada por nome (' + motivoLog + ')');
      return true;
    }

    irParaPortaoRelatorios(
      'Blacklist — tentar outro nome (' + tent + '/' + MAX_TENTATIVAS_CACADA_POR_NOME + ')'
    );
    return true;
  }

  function processarJaAtacouHojeCacadas() {
    var nome = extrairJaAtacouHojeCacadas();
    if (!nome) return false;
    return processarFalhaCacadaPorNome(nome, 'ja atacou hoje');
  }

  function processarInimigoBatalhaRecente30mCacadas() {
    var avisoTexto = detectarAvisoBatalhaRecente30mCacadas();
    if (!avisoTexto) return false;

    var nome = obterAlvoNomeCacadasSessao() || '(desconhecido)';
    console.warn('[Caçadas] Inimigo em protecao 30min — ' + nome);

    if (cacadaAtualPorNomeFirebase()) {
      removerAlvoFirebaseFilaConsumido(nome, 'batalha recente 30min');
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Firebase fila — batalha recente 30min: ' + nome, { rotacionarAutomacao: true });
      return true;
    }

    if (cacadaAtualPorNomeBlacklist()) {
      adicionarSkipBlacklistCacadas(nome);
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Blacklist — batalha recente 30min: ' + nome, { rotacionarAutomacao: true });
      return true;
    }

    limparEstadoModoCacadas();
    irParaPortaoRelatorios('Batalha recente 30min: ' + nome, { rotacionarAutomacao: true });
    return true;
  }

  function processarInimigoEnergiaVitalBaixaCacadas() {
    var avisoTexto = detectarAvisoEnergiaVitalBaixaCacadas();
    if (!avisoTexto) return false;

    var nome = obterAlvoNomeCacadasSessao() || '(desconhecido)';
    console.warn('[Caçadas] Inimigo com energia vital baixa — ' + nome);

    if (cacadaAtualPorNomeFirebase()) {
      marcarEnergiaVitalBaixaFirebaseFila(nome);
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Firebase fila — energia vital baixa (retry 10min): ' + nome, {
        rotacionarAutomacao: true
      });
      return true;
    }

    if (cacadaAtualPorNomeBlacklist()) {
      adicionarSkipBlacklistCacadas(nome);
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Blacklist — energia vital baixa: ' + nome, { rotacionarAutomacao: true });
      return true;
    }

    limparEstadoModoCacadas();
    irParaPortaoRelatorios('Energia vital baixa: ' + nome, { rotacionarAutomacao: true });
    return true;
  }

  function processarNivelAbaixoMinimoCacadas() {
    var nome = extrairNivelAbaixoMinimoCacadas();
    if (!nome) return false;
    return processarFalhaCacadaPorNome(nome, 'nivel 20+ abaixo');
  }

  function removerAlvoFirebaseFilaConsumido(nome, motivo) {
    if (!nome) return;
    removerAlvoFirebaseFila(nome, function(ok) {
      if (ok) console.log('[Firebase Fila] Removido (' + motivo + '): ' + nome);
    });
    var skip = lerSkipFirebaseFila();
    delete skip[normalizarNomeCacadas(nome)];
    salvarSkipFirebaseFila(skip);
  }

  function purgarFirebaseFilaJaAtacados(fila, ataques, callback) {
    if (!fila.length) {
      callback(fila);
      return;
    }

    var mapa = mapaAtacadosNoRelatorio(ataques);
    var restantes = [];
    var removidos = [];

    for (var i = 0; i < fila.length; i++) {
      var item = fila[i];
      if (!item || !item.nome) continue;
      if (mapa[normalizarNomeCacadas(item.nome)]) {
        removidos.push(item.nome);
      } else {
        restantes.push(item);
      }
    }

    if (!removidos.length) {
      callback(fila);
      return;
    }

    var idx = 0;
    function proximo() {
      if (idx >= removidos.length) {
        console.log('[Firebase Fila] ' + removidos.length + ' removido(s) — ja constavam no relatorio de ataque.');
        callback(restantes);
        return;
      }
      removerAlvoFirebaseFila(removidos[idx], function() {
        idx++;
        proximo();
      });
    }
    proximo();
  }

  function purgarFirebaseFilaWhitelist(fila, callback) {
    if (!fila.length) {
      callback(fila);
      return;
    }

    var restantes = [];
    var removidos = [];

    for (var i = 0; i < fila.length; i++) {
      var item = fila[i];
      if (!item || !item.nome) continue;
      if (nomeBloqueadoPorWhitelistFirebaseFila(item.nome)) {
        removidos.push(item.nome);
      } else {
        restantes.push(item);
      }
    }

    if (!removidos.length) {
      callback(fila);
      return;
    }

    var idx = 0;
    function proximo() {
      if (idx >= removidos.length) {
        console.log('[Firebase Fila] ' + removidos.length + ' removido(s) — whitelist firebase fila: ' +
          removidos.join(', '));
        callback(restantes);
        return;
      }
      removerAlvoFirebaseFila(removidos[idx], function() {
        idx++;
        proximo();
      });
    }
    proximo();
  }

  function removerNomeBlacklistCacadas(nome, motivo) {
    if (!nome) return false;

    var lista = obterBlacklistCacadas();
    if (!lista.length) return false;

    var normRemover = normalizarNomeCacadas(nome);
    var nova = lista.filter(function(n) {
      return normalizarNomeCacadas(n) !== normRemover;
    });

    if (nova.length === lista.length) return false;

    if (nova.length === 0) {
      try { localStorage.removeItem('BOT_BLACKLIST_CACADAS'); } catch (e) {}
    } else {
      localStorage.setItem('BOT_BLACKLIST_CACADAS', nova.join(','));
    }

    console.warn('[Blacklist] Removido da lista (' + (motivo || 'ninja nao encontrado') + '): ' + nome);
    console.log('[Blacklist] Lista atual: ' + descreverBlacklistCacadas());
    return true;
  }

  function resolverNomeAlvoCombate(dados) {
    var nome = (dados && dados.inimigo && dados.inimigo !== '(desconhecido)') ? dados.inimigo : '';
    if (!nome) {
      var alvo = lerUltimoAlvo();
      if (alvo && alvo.inimigo) nome = alvo.inimigo;
    }
    if (!nome) nome = obterAlvoNomeCacadasSessao();
    return nome || '';
  }

  function processarBlacklistAposDerrotaCombate(dados) {
    var nome = resolverNomeAlvoCombate(dados);
    if (!nome) return;

    var eraPorNome = cacadaAtualPorNomeBlacklist();
    if (!eraPorNome) {
      var norm = normalizarNomeCacadas(nome);
      var lista = obterBlacklistCacadas();
      for (var i = 0; i < lista.length; i++) {
        if (normalizarNomeCacadas(lista[i]) === norm) {
          eraPorNome = true;
          break;
        }
      }
    }
    if (!eraPorNome) return;

    removerNomeBlacklistCacadas(nome, 'derrota no combate');
  }

  function extrairClasseIndisponivelCacadas() {
    var col = document.getElementById('col_direita') || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);
      if (norm.indexOf('nenhum ninja de nivel') === -1) continue;
      if (norm.indexOf('disponivel') === -1) continue;

      var m = texto.match(/n[ií]vel\s+(.+?)\s+dispon[ií]vel/i);
      return m ? m[1].trim() : texto;
    }

    return null;
  }

  function marcarCacadasTetoOcioso(ativo) {
    try {
      if (ativo) sessionStorage.setItem(BOT_CACADAS_TETO_OCIOSO_KEY, '1');
      else sessionStorage.removeItem(BOT_CACADAS_TETO_OCIOSO_KEY);
    } catch (e) {}
  }

  function cacadasEmTetoOcioso() {
    try { return sessionStorage.getItem(BOT_CACADAS_TETO_OCIOSO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function marcarForcarBlacklistCacadas(ativo) {
    try {
      if (ativo) sessionStorage.setItem(BOT_CACADAS_FORCAR_BLACKLIST_KEY, '1');
      else sessionStorage.removeItem(BOT_CACADAS_FORCAR_BLACKLIST_KEY);
    } catch (e) {}
  }

  function forcarBlacklistCacadasPendente() {
    try { return sessionStorage.getItem(BOT_CACADAS_FORCAR_BLACKLIST_KEY) === '1'; } catch (e) {}
    return false;
  }

  function escolherProximoAlvoBlacklistLocal(skipRelatorio) {
    var ataques = skipRelatorio ? [] : extrairAtaquesRelatorios();
    return escolherProximoAlvoBlacklist(ataques);
  }

  function processarFallbackBlacklistTetoOciosoSemClasse(motivo) {
    if (!cacadasEmTetoOcioso()) return false;
    if (seletorPorNivelDisponivel()) return false;

    if (!blacklistCacadasAtiva()) {
      console.warn(
        '[Caçadas] Teto ocioso — seletor por nivel/classe indisponivel e blacklist vazia.'
      );
      return false;
    }

    marcarCacadasTetoOcioso(false);
    var proximo = escolherProximoAlvoBlacklistLocal(!forcarBlacklistCacadasPendente());
    if (proximo) {
      definirModoCacadasBlacklist(proximo);
      if (executarCacadaPorNome(proximo)) {
        console.warn(
          '[Caçadas] Teto ocioso — seletor classe indisponivel; caçada obrigatoria por blacklist: ' +
          proximo + (motivo ? ' (' + motivo + ')' : '')
        );
        return true;
      }
    }

    marcarForcarBlacklistCacadas(true);
    irParaPortaoRelatorios(
      'Teto ocioso — seletor classe indisponivel; blacklist obrigatoria' +
      (motivo ? ' (' + motivo + ')' : '')
    );
    return true;
  }

  function processarClasseIndisponivelCacadas() {
    var classe = extrairClasseIndisponivelCacadas();
    if (!classe) return false;

    if (cacadasEmTetoOcioso() && !seletorPorNivelDisponivel()) {
      return processarFallbackBlacklistTetoOciosoSemClasse('classe indisponivel na pagina');
    }

    var atual = obterNivelCacadasAtual();
    try {
      var chave = BOT_NIVEL_ESCALADO_PAGINA_KEY + ':' + atual + ':' + normalizarTextoCombate(classe);
      if (sessionStorage.getItem(chave) === '1') return false;
      sessionStorage.setItem(chave, '1');
    } catch (e) {}

    escalarNivelCacadasIndisponivel(classe);
    definirModoCacadasClasse('classe indisponivel — proximo nivel');
    liberarGateCacadas();

    if (executarCacadaPorNivel()) return true;

    if (processarFallbackBlacklistTetoOciosoSemClasse('falha ao retentar nivel ' + NIVEL_CACADAS_FINAL)) {
      return true;
    }

    irParaPortaoRelatorios('Classe indisponivel — falha ao retentar nivel ' + NIVEL_CACADAS_FINAL);
    return true;
  }

  function processarNinjaNaoEncontradoCacadas() {
    var nome = extrairNinjaNaoEncontradoCacadas();
    if (!nome) return false;

    if (cacadaAtualPorNomeFirebase()) {
      adicionarSkipFirebaseFila(nome);
      limparEstadoModoCacadas();
      irParaPortaoRelatorios('Firebase fila — ninja nao encontrado: ' + nome, { rotacionarAutomacao: true });
      return true;
    }

    removerNomeBlacklistCacadas(nome, 'ninja nao encontrado');
    limparEstadoModoCacadas();
    irParaPortaoRelatorios('Ninja nao encontrado: ' + nome, { rotacionarAutomacao: true });
    return true;
  }

  function mapaAtacadosNoRelatorio(ataques) {
    var mapa = {};
    for (var i = 0; i < ataques.length; i++) {
      if (ataques[i].vitimaNorm) mapa[ataques[i].vitimaNorm] = true;
    }
    return mapa;
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
    return FIREBASE_CONFIG.databaseURL + '/' + RANKING_RYOUS_FILA_FB_PATH + (suffix || '') + '.json';
  }

  function lerSkipFirebaseFila() {
    try {
      var raw = sessionStorage.getItem(BOT_CACADAS_FB_SKIP_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function salvarSkipFirebaseFila(mapa) {
    try { sessionStorage.setItem(BOT_CACADAS_FB_SKIP_KEY, JSON.stringify(mapa || {})); } catch (e) {}
  }

  function adicionarSkipFirebaseFila(nome) {
    if (!nome) return;
    var mapa = lerSkipFirebaseFila();
    mapa[normalizarNomeCacadas(nome)] = Date.now();
    salvarSkipFirebaseFila(mapa);
  }

  function adicionarSkipFirebaseFilaAte(nome, retryAposTs) {
    if (!nome || !retryAposTs) return;
    var mapa = lerSkipFirebaseFila();
    mapa[normalizarNomeCacadas(nome)] = { ate: retryAposTs };
    salvarSkipFirebaseFila(mapa);
  }

  function alvoFirebaseFilaEmEspera(item, skip, norm) {
    if (item && item.energiaVitalRetryApos && item.energiaVitalRetryApos > Date.now()) return true;
    var s = skip[norm];
    if (!s) return false;
    if (typeof s === 'object' && s.ate) return s.ate > Date.now();
    if (typeof s === 'number') return true;
    return false;
  }

  function marcarEnergiaVitalBaixaFirebaseFila(nome, callback) {
    if (!nome) {
      if (callback) callback(false);
      return;
    }
    var chave = normalizarChaveFirebaseRankingFila(nome);
    if (!chave) {
      if (callback) callback(false);
      return;
    }

    var retryApos = Date.now() + ENERGIA_VITAL_BAIXA_RETRY_MS;
    adicionarSkipFirebaseFilaAte(nome, retryApos);

    fetch(urlFirebaseRankingFila('/' + chave), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ energiaVitalRetryApos: retryApos })
    })
      .then(function(r) {
        var ok = r.ok || r.status === 404;
        if (ok) {
          console.log(
            '[Firebase Fila] Energia vital baixa — mantido na fila, retry apos ~10min: ' + nome +
            ' (~' + formatarHorarioLocalBr(retryApos) + ')'
          );
        } else {
          console.warn('[Firebase Fila] Falha ao marcar retry energia vital (' + r.status + '): ' + nome);
        }
        if (callback) callback(ok);
      })
      .catch(function(err) {
        console.warn('[Firebase Fila] Falha ao marcar retry energia vital ' + nome + ':', err);
        if (callback) callback(false);
      });
  }

  function limparSkipFirebaseFila() {
    try { sessionStorage.removeItem(BOT_CACADAS_FB_SKIP_KEY); } catch (e) {}
  }

  function ordenarFilaFirebaseRyous(lista) {
    lista.sort(function(a, b) {
      var tipoA = a.tipoSuspeito || 'ryous_sem_vitder';
      var tipoB = b.tipoSuspeito || 'ryous_sem_vitder';
      if (tipoA !== tipoB) {
        if (tipoA === 'ryous_sem_vitder') return -1;
        if (tipoB === 'ryous_sem_vitder') return 1;
      }
      if (tipoA === 'vit_sem_ryous') {
        return (b.deltaVitorias || 0) - (a.deltaVitorias || 0);
      }
      return (b.deltaRyous || 0) - (a.deltaRyous || 0);
    });
    return lista;
  }

  function descreverItemFirebaseFila(item) {
    if (!item) return '?';
    var base;
    if (item.tipoSuspeito === 'vit_sem_ryous') {
      base = 'vit+' + (item.deltaVitorias || '?') + ' sem ryous (vit ' +
        (item.vitoriasAntes != null ? item.vitoriasAntes : '?') + '->' + item.vitorias + ')';
    } else {
      base = '+' + formatarNumeroBr(item.deltaRyous || 0) + ' ryous';
    }
    if (item.energiaVitalRetryApos && item.energiaVitalRetryApos > Date.now()) {
      base += ' [energia vital — retry ~' + formatarHorarioLocalBr(item.energiaVitalRetryApos) + ']';
    }
    return base;
  }

  function buscarFilaFirebaseRyous(callback) {
    var limiteTs = Date.now() - RANKING_RYOUS_FILA_TTL_MS;
    fetch(urlFirebaseRankingFila(''), { cache: 'no-store' })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        if (!data || typeof data !== 'object') {
          callback([]);
          return;
        }
        var lista = [];
        var deletes = [];
        for (var k in data) {
          if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
          var item = data[k];
          if (!item || !item.nome) continue;
          if (!item.ts || item.ts < limiteTs) {
            deletes.push(fetch(urlFirebaseRankingFila('/' + k), { method: 'DELETE' }));
            continue;
          }
          lista.push(item);
        }
        Promise.all(deletes).catch(function() {}).finally(function() {
          ordenarFilaFirebaseRyous(lista);
          callback(lista);
        });
      })
      .catch(function(err) {
        console.warn('[Firebase Fila] Falha ao ler ranking_ryous_fila:', err);
        callback([]);
      });
  }

  function removerAlvoFirebaseFila(nome, callback) {
    var chave = normalizarChaveFirebaseRankingFila(nome);
    if (!chave) {
      if (callback) callback(false);
      return;
    }
    fetch(urlFirebaseRankingFila('/' + chave), { method: 'DELETE' })
      .then(function(r) {
        if (callback) callback(r.ok || r.status === 404);
      })
      .catch(function(err) {
        console.warn('[Firebase Fila] Falha ao remover ' + nome + ':', err);
        if (callback) callback(false);
      });
  }

  function escolherProximoAlvoFirebase(fila, ataques) {
    var mapa = mapaAtacadosNoRelatorio(ataques);
    var skip = lerSkipFirebaseFila();
    for (var i = 0; i < fila.length; i++) {
      var item = fila[i];
      if (!item || !item.nome) continue;
      var norm = normalizarNomeCacadas(item.nome);
      if (mapa[norm]) continue;
      if (alvoFirebaseFilaEmEspera(item, skip, norm)) continue;
      if (nomeBloqueadoPorWhitelistFirebaseFila(item.nome)) continue;
      console.warn('[Firebase Fila] Proximo alvo: ' + item.nome + ' — ' + descreverItemFirebaseFila(item));
      return item.nome;
    }
    return null;
  }

  function definirModoCacadasFirebaseFila(nome) {
    try {
      sessionStorage.setItem(BOT_CACADAS_MODO_KEY, 'firebase_fila');
      sessionStorage.setItem(BOT_CACADAS_ALVO_NOME_KEY, nome);
    } catch (e) {}
    console.warn('[Firebase Fila] Modo por_nome — alvo: ' + nome);
  }

  function cacadaAtualPorNomeFirebase() {
    return obterModoCacadasSessao() === 'firebase_fila' && !!obterAlvoNomeCacadasSessao();
  }

  function cacadaAtualPorNomeFila() {
    return cacadaAtualPorNomeBlacklist() || cacadaAtualPorNomeFirebase() ||
      cacadaAtualPorNomeAutomacao();
  }

  function resolverFirebaseFilaNoPortao(decisao, callback, opcoes) {
    var opts = opcoes || {};
    limparEstadoModoCacadas();

    buscarFilaFirebaseRyous(function(fila) {
      var ataques = extrairAtaquesRelatorios();
      purgarFirebaseFilaJaAtacados(fila, ataques, function(filaLimpa) {
        purgarFirebaseFilaWhitelist(filaLimpa, function(filaSemWl) {
          var proximo = escolherProximoAlvoFirebase(filaSemWl, ataques);
          if (proximo) {
            definirModoCacadasFirebaseFila(proximo);
            callback();
            return;
          }

          console.warn(
            '[Firebase Fila] Nenhum alvo disponivel (' + filaSemWl.length +
            ' na fila apos limpeza, skip/relatorio/whitelist).'
          );
          limparSkipFirebaseFila();

          if (blacklistCacadasAtiva()) {
            console.warn('[Firebase Fila] Fila vazia — fallback para blacklist.');
            resolverBlacklistNoPortao(decisao, callback, Object.assign({}, opts, {
              firebaseFallback: true
            }));
            return;
          }

          console.warn('[Firebase Fila] Fila vazia e blacklist vazia — caçada por classe.');
          definirModoCacadasClasse('fila firebase esgotada ou vazia');
          callback();
        });
      });
    });
  }

  function resolverDestinoNoPortao(decisao, callback, opcoes) {
    var opts = opcoes || {};
    if (atacarAutomacoesAtacanteAtivo()) {
      resolverAutomacaoAtacanteNoPortao(decisao, function(encontrou) {
        if (encontrou) callback();
        else agendarRetentativaPortao('autom atacante aguardando alvo ready');
      });
      return;
    }
    if (forcarBlacklistCacadasPendente()) {
      marcarForcarBlacklistCacadas(false);
      marcarCacadasTetoOcioso(false);
      console.warn(
        '[Caçadas] Teto ocioso — seletor classe indisponivel; usando blacklist obrigatoriamente.'
      );
      resolverBlacklistNoPortao(decisao, callback, Object.assign({}, opts, { forcarBlacklist: true }));
      return;
    }
    if (decisaoForcaCacadaPorClasse(decisao)) {
      console.warn(
        '[Caçadas] Teto ocioso — priorizando caçada por classe (blacklist se seletor indisponivel).'
      );
      limparSkipFirebaseFila();
      marcarCacadasTetoOcioso(true);
      definirModoCacadasClasse('teto ocioso — caçada por classe');
      callback();
      return;
    }
    if (cacadasFirebaseFilaFlagAtiva()) {
      resolverFirebaseFilaNoPortao(decisao, callback, opts);
      return;
    }
    if (blacklistCacadasAtiva()) {
      resolverBlacklistNoPortao(decisao, callback, opts);
      return;
    }
    limparEstadoModoCacadas();
    definirModoCacadasClasse('firebase e blacklist desligados ou vazios');
    callback();
  }

  function processarFirebaseFilaAposVitoria(dados) {
    var eraFirebase = obterModoCacadasSessao() === 'firebase_fila';
    var nome = obterAlvoNomeCacadasSessao() || resolverNomeAlvoCombate(dados);
    if (!eraFirebase || !nome) return;
    removerAlvoFirebaseFila(nome, function(ok) {
      if (ok) console.log('[Firebase Fila] Removido apos vitoria: ' + nome);
    });
    var skip = lerSkipFirebaseFila();
    delete skip[normalizarNomeCacadas(nome)];
    salvarSkipFirebaseFila(skip);
  }

  function processarFirebaseFilaAposDerrota(dados) {
    if (!cacadaAtualPorNomeFirebase()) return;
    var nome = resolverNomeAlvoCombate(dados) || obterAlvoNomeCacadasSessao();
    if (!nome) return;
    adicionarSkipFirebaseFila(nome);
    limparEstadoModoCacadas();
    console.log('[Firebase Fila] Derrota — proximo da fila (mantido no Firebase): ' + nome);
  }

  function nomesBlacklistJaAtacadosNoRelatorio(ataques) {
    var lista = obterBlacklistCacadas();
    var mapa = mapaAtacadosNoRelatorio(ataques);
    var atacados = [];
    lista.forEach(function(nome) {
      if (mapa[normalizarNomeCacadas(nome)]) atacados.push(nome);
    });
    return atacados;
  }

  function escolherProximoAlvoBlacklist(ataques) {
    var lista = obterBlacklistCacadas();
    var mapa = mapaAtacadosNoRelatorio(ataques);
    var skip = lerSkipBlacklistCacadas();
    var pendentes = [];

    for (var i = 0; i < lista.length; i++) {
      var nome = lista[i];
      var norm = normalizarNomeCacadas(nome);
      if (mapa[norm]) continue;
      if (skip[norm]) continue;
      pendentes.push(nome);
    }

    if (!pendentes.length) return null;
    return pendentes[Math.floor(Math.random() * pendentes.length)];
  }

  function limparEstadoModoCacadas() {
    try {
      sessionStorage.removeItem(BOT_CACADAS_MODO_KEY);
      sessionStorage.removeItem(BOT_CACADAS_ALVO_NOME_KEY);
      sessionStorage.removeItem('BOT_ROTACAO_APOS_ATAQUE');
    } catch (e) {}
  }

  function definirModoCacadasClasse(motivo) {
    try {
      sessionStorage.setItem(BOT_CACADAS_MODO_KEY, 'classe');
      sessionStorage.removeItem(BOT_CACADAS_ALVO_NOME_KEY);
    } catch (e) {}
    console.log('[Blacklist] Modo classe — ' + motivo);
  }

  function definirModoCacadasBlacklist(nome) {
    try {
      sessionStorage.setItem(BOT_CACADAS_MODO_KEY, 'blacklist');
      sessionStorage.setItem(BOT_CACADAS_ALVO_NOME_KEY, nome);
    } catch (e) {}
    marcarCacadasTetoOcioso(false);
    marcarForcarBlacklistCacadas(false);
    console.warn('[Blacklist] Proximo alvo por nome: ' + nome);
  }

  function obterModoCacadasSessao() {
    try { return sessionStorage.getItem(BOT_CACADAS_MODO_KEY) || 'classe'; } catch (e) {}
    return 'classe';
  }

  function obterAlvoNomeCacadasSessao() {
    try { return sessionStorage.getItem(BOT_CACADAS_ALVO_NOME_KEY) || ''; } catch (e) {}
    return '';
  }

  function cacadaAtualPorNomeBlacklist() {
    return obterModoCacadasSessao() === 'blacklist' && !!obterAlvoNomeCacadasSessao();
  }

  function decisaoForcaCacadaPorClasse(decisao) {
    return !!(decisao && decisao.waitMs <= 0 && decisao.motivo &&
      decisao.motivo.indexOf('teto ocioso') !== -1);
  }

  function decisaoIgnoraBlacklist(decisao, aposEsperaNoPortao) {
    return decisaoForcaCacadaPorClasse(decisao);
  }

  function seletorPorNivelDisponivel(doc) {
    var root = doc || document;
    var selectNivel = root.getElementById('por_nivel');
    if (!selectNivel) return false;
    var formNivel = selectNivel.closest('form');
    if (!formNivel) return false;
    return !!formNivel.querySelector('input[type="submit"]');
  }

  function resolverBlacklistNoPortao(decisao, callback, opcoes) {
    var opts = opcoes || {};
    var aposEsperaNoPortao = !!opts.aposEsperaNoPortao;
    limparEstadoModoCacadas();

    if (!blacklistCacadasAtiva()) {
      definirModoCacadasClasse('lista vazia ou nao configurada');
      callback();
      return;
    }

    if (!opts.forcarBlacklist && !opts.firebaseFallback && decisaoForcaCacadaPorClasse(decisao)) {
      marcarCacadasTetoOcioso(true);
      definirModoCacadasClasse('teto ocioso — caçada por classe');
      callback();
      return;
    }

    var ataques = extrairAtaquesRelatorios();
    var jaAtacados = nomesBlacklistJaAtacadosNoRelatorio(ataques);
    if (jaAtacados.length) {
      console.log('[Blacklist] Ja no relatorio de ataque: ' + jaAtacados.join(', '));
    }

    var proximo = escolherProximoAlvoBlacklist(ataques);
    if (proximo) {
      definirModoCacadasBlacklist(proximo);
    } else {
      console.warn('[Blacklist] Todos os nomes da lista ja constam no relatorio — caçada por nivel (se disponivel).');
      definirModoCacadasClasse('todos os nomes ja no relatorio');
    }
    callback();
  }

  function parseNumeroBr(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var s = String(valor).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function formatarNumeroBr(n) {
    if (n === null || n === undefined || isNaN(n)) return '?';
    try {
      return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      return String(n);
    }
  }

  function textoElementoReserva(el) {
    if (!el) return '';
    return (el.innerText || el.textContent || '');
  }

  function extrairReservaRyousDeTexto(texto) {
    if (!texto) return null;
    var patterns = [
      /Reserva(?:\s+de\s+[Rr]yous)?:\s*([\d.,]+)/i,
      /Ryous\s+reserva:\s*([\d.,]+)/i,
      /Reserva:\s*([\d.,]+)/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = texto.match(patterns[i]);
      if (m) return parseNumeroBr(m[1]);
    }
    var mRyous = texto.match(/Ryous:\s*([\d.,]+)/i);
    return mRyous ? parseNumeroBr(mRyous[1]) : null;
  }

  function extrairReservaRyousDeDocumento(doc) {
    if (!doc) return null;
    var raizes = [];
    if (doc.getElementById) {
      var col = doc.getElementById('col_esquerda');
      if (col) raizes.push(col);
      var sidebars = doc.querySelectorAll('.np-sidebar');
      for (var i = 0; i < sidebars.length; i++) raizes.push(sidebars[i]);
    }
    for (var r = 0; r < raizes.length; r++) {
      var reserva = extrairReservaRyousDeTexto(textoElementoReserva(raizes[r]));
      if (reserva !== null) return reserva;
    }
    return extrairReservaRyousDeTexto(textoElementoReserva(doc.body));
  }

  function extrairReservaRyousDeHtml(html) {
    if (!html) return null;
    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var reserva = extrairReservaRyousDeDocumento(doc);
      if (reserva !== null) return reserva;
    } catch (e) {}
    return extrairReservaRyousDeTexto(String(html));
  }

  function extrairReservaRyous() {
    return extrairReservaRyousDeDocumento(document);
  }

  function reservaDoEstado(estado) {
    if (!estado) return null;
    if (estado.reserva === null || estado.reserva === undefined) return null;
    return estado.reserva;
  }

  function salvarCacheEstadoInvasor(estado) {
    if (!estado) return;
    try {
      localStorage.setItem(BOT_INVASOR_EVENTO_CACHE_KEY, JSON.stringify(estado));
    } catch (e) {}
  }

  function lerCacheEstadoInvasor() {
    try {
      var raw = localStorage.getItem(BOT_INVASOR_EVENTO_CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.ts) return null;
      if (Date.now() - data.ts > INVASOR_EVENTO_CACHE_TTL_MS) return null;
      return data;
    } catch (e) {}
    return null;
  }

  function textoIndicaInvasorAindaVivo(texto) {
    if (!texto) return false;
    var s = String(texto);
    if (/ainda\s+n[aã]?o\s+(foi\s+)?derrotado/i.test(s)) return true;
    if (/derrotado\s+por:[^\n]*ainda\s+n[aã]?o/i.test(s)) return true;
    return false;
  }

  function invasorSinaisBossVivo(temBotao, temTimer, texto) {
    if (temBotao || temTimer) return true;
    return textoIndicaInvasorAindaVivo(texto);
  }

  function vencedorInvasorValido(vencedor) {
    var v = String(vencedor || '').trim();
    if (!v) return false;
    if (/^[-—–|\s.:]+$/i.test(v)) return false;
    if (/ainda\s+n[aã]?o/i.test(v)) return false;
    if (/nao\s+derrotado|não\s+derrotado/i.test(v)) return false;

    var norm = normalizarNomeInvasor(v);
    if (norm.indexOf('ainda n') !== -1) return false;
    if (norm.indexOf('nao derrotado') !== -1) return false;
    if (norm.replace(/[^a-z0-9]/g, '').length < 2) return false;
    return true;
  }

  function derrotadoEmValido(em) {
    var s = String(em || '').trim();
    if (!/\d{2}\/\d{2}\/\d{4}/.test(s)) return false;
    return /\d{1,2}:\d{2}/.test(s);
  }

  function derrotaInvasorInfoValida(info) {
    if (!info) return false;
    return vencedorInvasorValido(info.vencedor) && derrotadoEmValido(info.em);
  }

  function payloadBossMortoValido(payload) {
    if (!payload || !payload.boss || !payload.vencedor || !payload.em) return false;
    return derrotaInvasorInfoValida({ vencedor: payload.vencedor, em: payload.em });
  }

  function parseEstadoInvasorHtml(html) {
    var derrotado = false;
    var temBotao = false;
    var temTimer = false;
    var derrotados = 0;
    var nomeInvasor = '';
    var vencedor = '';
    var derrotadoEm = '';
    var reserva = null;

    function extrairDerrotadoPorTexto(texto) {
      if (!texto) return null;
      var s = String(texto);
      if (/ainda n[aã]o/i.test(s)) return null;

      var m = s.match(/Derrotado por:\s*([^|\n]+?)\s+em:\s*([^\n|]+)/i);
      if (!m) return null;

      var v = m[1].trim();
      var em = m[2].trim();
      if (!vencedorInvasorValido(v) || !derrotadoEmValido(em)) return null;
      return { vencedor: v, em: em };
    }

    function extrairDerrotadoPorValorCelula(valor) {
      if (!valor) return null;
      var s = String(valor).trim().replace(/^\|\s*/, '');
      if (/ainda n[aã]o/i.test(s)) return null;

      var m = s.match(/^(.+?)\s+em:\s*(.+)$/i);
      if (!m) return null;

      var v = m[1].trim();
      var em = m[2].trim();
      if (!vencedorInvasorValido(v) || !derrotadoEmValido(em)) return null;
      return { vencedor: v, em: em };
    }

    function aplicarDerrota(info) {
      if (!info) return;
      derrotado = true;
      vencedor = info.vencedor;
      derrotadoEm = info.em;
    }

    function extrairNomeInvasorDeDocumento(doc) {
      if (!doc) return '';
      var linhas = doc.querySelectorAll('tr');
      for (var li = 0; li < linhas.length; li++) {
        var tds = linhas[li].querySelectorAll('td');
        if (tds.length < 2) continue;
        var rotulo = (tds[0].textContent || '').trim().toLowerCase();
        if (rotulo.indexOf('nome do inimigo') === -1) continue;
        return (tds[1].textContent || '').replace(/^\|\s*/, '').trim();
      }
      var corpoDoc = doc.body ? (doc.body.textContent || '') : '';
      var mNome = corpoDoc.match(/Nome do inimigo:\s*([^\n]+)/i);
      return mNome ? mNome[1].trim() : '';
    }

    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      reserva = extrairReservaRyousDeDocumento(doc);
      nomeInvasor = extrairNomeInvasorDeDocumento(doc);
      var linhas = doc.querySelectorAll('tr');
      for (var i = 0; i < linhas.length; i++) {
        var tds = linhas[i].querySelectorAll('td');
        if (tds.length >= 2) {
          var rotulo = (tds[0].textContent || '').trim().toLowerCase();
          if (rotulo.indexOf('derrotado por') !== -1) {
            var infoCelula = extrairDerrotadoPorValorCelula(tds[1].textContent || '');
            if (infoCelula) {
              aplicarDerrota(infoCelula);
              break;
            }
          }
        }

        var textoLinha = linhas[i].textContent || '';
        if (textoLinha.indexOf('Derrotado por:') === -1) continue;
        var infoLinha = extrairDerrotadoPorTexto(textoLinha);
        if (infoLinha) {
          aplicarDerrota(infoLinha);
          break;
        }
      }

      temTimer = !!doc.querySelector('[id^="inv_cd_timer_"]');
      var formInvasor = doc.querySelector('form[action*="invasor"]');
      if (formInvasor) {
        temBotao = !!formInvasor.querySelector(
          'input[type="submit"], button[type="submit"], input[value="Atacar"], input[name="atacar"]'
        );
      }

      var corpo = doc.body ? (doc.body.textContent || '') : String(html || '');
      var m = corpo.match(/Players derrotados:\s*([\d.]+)/i);
      if (m) derrotados = parseInt(m[1].replace(/\./g, ''), 10) || 0;

      if (invasorSinaisBossVivo(temBotao, temTimer, corpo)) {
        derrotado = false;
        vencedor = '';
        derrotadoEm = '';
      } else if (derrotado && !derrotaInvasorInfoValida({ vencedor: vencedor, em: derrotadoEm })) {
        derrotado = false;
        vencedor = '';
        derrotadoEm = '';
      }
    } catch (e) {
      var texto = String(html || '');
      if (reserva === null) reserva = extrairReservaRyousDeTexto(texto);
      if (!textoIndicaInvasorAindaVivo(texto)) {
        var infoTxt = extrairDerrotadoPorTexto(texto);
        if (infoTxt) aplicarDerrota(infoTxt);
      }
      temBotao = /value=["']Atacar["']/i.test(texto) || /name=["']atacar["']/i.test(texto);
      temTimer = /inv_cd_timer_/i.test(texto);
      if (invasorSinaisBossVivo(temBotao, temTimer, texto)) {
        derrotado = false;
        vencedor = '';
        derrotadoEm = '';
      }
      var m2 = texto.match(/Players derrotados:\s*([\d.]+)/i);
      if (m2) derrotados = parseInt(m2[1].replace(/\./g, ''), 10) || 0;
      var mNome2 = texto.match(/Nome do inimigo:\s*([^\n<]+)/i);
      if (mNome2) nomeInvasor = mNome2[1].trim();
    }

    var aguardandoProximoBoss = !!derrotado;
    if (!aguardandoProximoBoss && (temBotao || temTimer)) {
      aguardandoProximoBoss = false;
    } else if (!aguardandoProximoBoss && !temBotao && !temTimer) {
      aguardandoProximoBoss = derrotados === 0;
    }

    return {
      aguardandoProximoBoss: aguardandoProximoBoss,
      invasorDerrotado: derrotado,
      temBotao: temBotao,
      temTimer: temTimer,
      derrotados: derrotados,
      nomeInvasor: nomeInvasor,
      vencedor: vencedor,
      derrotadoEm: derrotadoEm,
      reserva: reserva,
      ts: Date.now()
    };
  }

  function normalizarNomeInvasor(nome) {
    return String(nome || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizarChaveFirebaseBossMorto(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function montarChaveEventoBossMorto(nomeInvasor, derrotadoEm) {
    var boss = normalizarChaveFirebaseBossMorto(nomeInvasor) || 'boss';
    var em = String(derrotadoEm || '').replace(/[^\d]/g, '');
    return boss + (em ? '_' + em : '');
  }

  function tentarReservarAvisoBossMortoFirebase(chave, payload, callback) {
    garantirFirebase(function(db) {
      var ref = db.ref(INVASOR_MORTO_AVISO_FB_PATH + '/' + chave);
      ref.transaction(function(current) {
        if (current && current.vencedor && vencedorInvasorValido(current.vencedor)) return undefined;
        if (!payloadBossMortoValido(payload)) return undefined;
        return payload;
      }, function(error, committed, snapshot) {
        if (error) {
          console.warn('[Invasor] Firebase aviso boss morto:', error);
          callback(false);
          return;
        }
        var val = snapshot && snapshot.val();
        var ganhou = !!(committed && val && val.vencedor === payload.vencedor && val.ts === payload.ts);
        callback(ganhou);
      }, false);
    });
  }

  function tentarAvisarDiscordBossMorto(estado) {
    if (!estado) return;

    var nomeInvasor = (estado.nomeInvasor || '').trim();
    var vencedor = (estado.vencedor || '').trim();
    var derrotadoEm = (estado.derrotadoEm || '').trim();

    if (!derrotaInvasorInfoValida({ vencedor: vencedor, em: derrotadoEm })) {
      console.warn('[Invasor] Derrota invalida — sem Discord (' + (nomeInvasor || '?') + ').');
      return;
    }
    if (invasorSinaisBossVivo(!!estado.temBotao, !!estado.temTimer, '')) {
      console.warn('[Invasor] Boss vivo (botao/timer) — sem Discord (' + nomeInvasor + ').');
      return;
    }
    if (!nomeInvasor) {
      console.warn('[Invasor] Boss morto sem nome — sem Discord.');
      return;
    }

    var chave = montarChaveEventoBossMorto(nomeInvasor, derrotadoEm);
    try {
      if (localStorage.getItem('BOT_INVASOR_MORTO_FB_' + chave) === '1') return;
    } catch (e) {}

    var payload = {
      boss: nomeInvasor,
      vencedor: vencedor,
      em: derrotadoEm,
      ts: Date.now(),
      conta: obterUsuarioExibicao()
    };

    tentarReservarAvisoBossMortoFirebase(chave, payload, function(ganhou) {
      try { localStorage.setItem('BOT_INVASOR_MORTO_FB_' + chave, '1'); } catch (e) {}
      if (!ganhou) {
        console.log('[Invasor] Aviso boss morto ja registrado no Firebase (' + chave + ').');
        return;
      }

      garantirWebhooksDiscord().then(function() {
        var webhook = DISCORD_WEBHOOK_INVASOR || DISCORD_WEBHOOK_CACADAS;
        if (!webhook) {
          console.warn('[Discord] Webhook invasor/cacadas ausente — boss morto nao enviado.');
          return;
        }

        var linhas = [
          '💀 **Invasor derrotado**',
          'Boss: **' + nomeInvasor + '**',
          'Vencedor: **' + vencedor + '**'
        ];
        if (derrotadoEm) linhas.push('Em: ' + derrotadoEm);
        if (estado.derrotados !== null && estado.derrotados !== undefined && !isNaN(estado.derrotados)) {
          linhas.push('Players derrotados: **' + formatarNumeroBr(estado.derrotados) + '**');
        }
        linhas.push('Detectado por: `' + obterUsuarioExibicao() + '`');

        fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Bot Shadow of Shinobi',
            content: linhas.join('\n')
          })
        }).then(function(r) {
          if (r.ok) {
            console.log('[Invasor] Discord boss morto — ' + vencedor + ' derrotou ' + nomeInvasor);
          }
        }).catch(function(err) {
          console.warn('[Discord] Falha boss morto:', err);
        });
      });
    });
  }

  function lerMapaAvisosInvasorMorto() {
    try {
      var raw = localStorage.getItem(BOT_INVASOR_MORTO_AVISO_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function jaAvisouInvasorMortoReserva(conta, nomeInvasor) {
    var mapa = lerMapaAvisosInvasorMorto();
    var c = normalizarNomeCacadas(conta);
    var n = normalizarNomeInvasor(nomeInvasor);
    if (!c || !n) return false;
    return !!(mapa[c] && mapa[c][n]);
  }

  function marcarAvisoInvasorMortoReserva(conta, nomeInvasor) {
    var mapa = lerMapaAvisosInvasorMorto();
    var c = normalizarNomeCacadas(conta);
    var n = normalizarNomeInvasor(nomeInvasor);
    if (!c || !n) return;
    if (!mapa[c]) mapa[c] = {};
    mapa[c][n] = Date.now();
    try {
      localStorage.setItem(BOT_INVASOR_MORTO_AVISO_KEY, JSON.stringify(mapa));
    } catch (e) {}
  }

  function montarMensagemInvasorMortoReservaAlta(conta, nomeInvasor, reserva) {
    return [
      '**Invasor morto — reserva alta** — ' + conta,
      'Inimigo: **' + nomeInvasor + '**',
      'Reserva: ' + formatarNumeroBr(reserva) + ' (>= 100k)',
      'Boss derrotado — aguardando proximo nascer.'
    ].join('\n');
  }

  function tentarAvisarDiscordInvasorMortoReservaAlta(estado, reserva) {
    if (obterModoAba() !== 'cacadas') return;
    if (estaEmContaGerenciada()) return;
    if (!estado || !estado.invasorDerrotado) return;
    if (reserva === null || reserva < RESERVA_RYOUS_MIN_INVASOR_VIVO) return;

    var nomeInvasor = (estado.nomeInvasor || '').trim();
    if (!nomeInvasor) {
      console.warn('[InvasorVivo] Boss morto e reserva alta, mas Nome do inimigo nao encontrado — sem Discord.');
      return;
    }

    var conta = obterUsuarioExibicao();
    if (jaAvisouInvasorMortoReserva(conta, nomeInvasor)) return;

    var msg = montarMensagemInvasorMortoReservaAlta(conta, nomeInvasor, reserva);
    console.log('[InvasorVivo] Enviando Discord — invasor morto, reserva alta: ' + nomeInvasor + ' (' + conta + ')');

    enviarDiscordTexto(msg).then(function(ok) {
      if (ok) {
        marcarAvisoInvasorMortoReserva(conta, nomeInvasor);
        console.log('[InvasorVivo] Aviso registrado — nao repete para ' + nomeInvasor + ' nesta conta.');
      }
    });
  }

  function obterEstadoInvasor(callback, forcar) {
    if (!forcar) {
      var cache = lerCacheEstadoInvasor();
      if (cache) {
        callback(cache);
        return;
      }
    }

    fetch(URL_INVASOR, { credentials: 'include', cache: 'no-store' })
      .then(function(res) { return res.text(); })
      .then(function(html) {
        var estado = parseEstadoInvasorHtml(html);
        salvarCacheEstadoInvasor(estado);
        callback(estado);
      })
      .catch(function(err) {
        console.warn('[InvasorVivo] Falha ao ler /invasor:', err);
        callback(lerCacheEstadoInvasor());
      });
  }

  function buscarReservaRyousCacadas(callback) {
    fetch(URL_CACADAS, { credentials: 'include', cache: 'no-store' })
      .then(function(res) { return res.text(); })
      .then(function(html) {
        callback(extrairReservaRyousDeHtml(html));
      })
      .catch(function(err) {
        console.warn('[InvasorVivo] Falha ao ler reserva em /cacadas:', err);
        callback(null);
      });
  }

  function resolverReservaRyous(estado, callback) {
    var reserva = reservaDoEstado(estado);
    if (reserva !== null) {
      callback(reserva, '/invasor');
      return;
    }

    buscarReservaRyousCacadas(function(reservaCacadas) {
      if (reservaCacadas !== null) {
        if (estado) {
          estado.reserva = reservaCacadas;
          salvarCacheEstadoInvasor(estado);
        }
        callback(reservaCacadas, '/cacadas');
        return;
      }
      callback(extrairReservaRyous(), 'tela');
    });
  }

  function cacadasPausadaPorInvasorSync() {
    if (!deveAplicarPausaInvasorVivo()) return false;

    var cache = lerCacheEstadoInvasor();
    var reserva = reservaDoEstado(cache);
    if (reserva === null) reserva = extrairReservaRyous();
    if (reserva === null || reserva >= RESERVA_RYOUS_MIN_INVASOR_VIVO) return false;

    return !!(cache && cache.aguardandoProximoBoss);
  }

  function verificarInvasorNoPortao(callback) {
    if (obterModoAba() !== 'cacadas') {
      callback(false, null);
      return;
    }

    obterEstadoInvasor(function(estado) {
      resolverReservaRyous(estado, function(reserva, fonte) {
        console.log(
          '[InvasorVivo] Reserva ' + (reserva !== null ? formatarNumeroBr(reserva) : '?') +
          ' lida em ' + (fonte || '?')
        );

        tentarAvisarDiscordBossMorto(estado);
        tentarAvisarDiscordInvasorMortoReservaAlta(estado, reserva);

        if (!deveAplicarPausaInvasorVivo()) {
          definirInvasorVivoPainelAtivo(estado, reserva);
          callback(false, { reserva: reserva, estado: estado, motivo: 'sem pausa invasor_vivo' });
          return;
        }

        if (reserva === null) {
          definirInvasorVivoPainelAtivo(estado, reserva);
          callback(false, { motivo: 'reserva ilegivel' });
          return;
        }
        if (reserva >= RESERVA_RYOUS_MIN_INVASOR_VIVO) {
          definirInvasorVivoPainelAtivo(estado, reserva);
          callback(false, { reserva: reserva, motivo: 'reserva >= 100k' });
          return;
        }

        var pausado = !!(estado && estado.aguardandoProximoBoss);
        if (pausado) {
          definirInvasorVivoPainelPausado({
            reserva: reserva,
            reservaTexto: formatarNumeroBr(reserva),
            estado: estado
          });
        } else {
          definirInvasorVivoPainelAtivo(estado, reserva);
        }

        callback(pausado, {
          reserva: reserva,
          reservaTexto: formatarNumeroBr(reserva),
          estado: estado
        });
      });
    }, true);
  }

  function marcarAguardandoBossMorto() {
    try { sessionStorage.setItem(BOT_INVASOR_AGUARDANDO_BOSS_KEY, '1'); } catch (e) {}
  }

  function estaAguardandoBossMorto() {
    try { return sessionStorage.getItem(BOT_INVASOR_AGUARDANDO_BOSS_KEY) === '1'; } catch (e) {}
    return false;
  }

  function consumirAguardandoBossMorto() {
    try {
      if (sessionStorage.getItem(BOT_INVASOR_AGUARDANDO_BOSS_KEY) === '1') {
        sessionStorage.removeItem(BOT_INVASOR_AGUARDANDO_BOSS_KEY);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function sortearEsperaPosBossAtivo() {
    return Math.floor(
      Math.random() * (INVASOR_POS_BOSS_ESPERA_MAX_MS - INVASOR_POS_BOSS_ESPERA_MIN_MS + 1)
    ) + INVASOR_POS_BOSS_ESPERA_MIN_MS;
  }

  function deveAplicarEsperaPosBossAtivo(info) {
    if (!deveAplicarPausaInvasorVivo()) return false;
    if (!estaAguardandoBossMorto()) return false;

    var reserva = info && info.reserva !== undefined ? info.reserva : extrairReservaRyous();
    if (reserva === null || reserva >= RESERVA_RYOUS_MIN_INVASOR_VIVO) return false;

    var estado = info && info.estado;
    if (!estado || estado.aguardandoProximoBoss) return false;

    return true;
  }

  function agendarEsperaPosBossAtivo(info) {
    if (portaoRelatoriosAgendado) return;
    portaoRelatoriosAgendado = true;
    consumirAguardandoBossMorto();

    var waitMs = sortearEsperaPosBossAtivo();
    var seg = Math.round(waitMs / 1000);
    var minTxt = (waitMs / 60000).toFixed(1).replace('.', ',');
    var estado = info && info.estado ? info.estado : null;
    var nome = estado && estado.nomeInvasor ? estado.nomeInvasor : '';

    console.log(
      '[InvasorVivo] Boss ativo — espera extra pos-respawn ' + minTxt + 'min (' + seg + 's) antes do 1o ataque' +
      (nome ? ' | ' + nome : '')
    );

    definirInvasorVivoPainel({
      pausado: false,
      posBossEspera: true,
      posBossEsperaSeg: seg,
      reservaTexto: info && info.reservaTexto ? info.reservaTexto : null,
      nomeInvasor: nome
    });

    setTimeout(function() {
      portaoRelatoriosAgendado = false;
      definirInvasorVivoPainelAtivo(estado, info && info.reserva);
      processarPortaoRelatoriosAtaqueContinuar();
    }, waitMs);
  }

  function agendarPortaoAguardandoInvasor(info) {
    if (portaoRelatoriosAgendado) return;
    portaoRelatoriosAgendado = true;

    var seg = Math.round(INVASOR_VIVO_POLL_MS / 1000);
    var estado = info && info.estado ? info.estado : null;
    var extra = '';
    if (estado) {
      extra = ' | boss derrotado=' + (estado.invasorDerrotado ? 'sim' : 'nao') +
        ' | botao=' + (estado.temBotao ? 'sim' : 'nao') +
        ' | timer=' + (estado.temTimer ? 'sim' : 'nao');
    }

    console.log('[InvasorVivo] Caçadas pausadas — reserva ' + (info && info.reservaTexto ? info.reservaTexto : '?') +
      extra + ' | aguardando proximo boss | releitura em ' + seg + 's');

    definirInvasorVivoPainelPausado(info || {});

    setTimeout(function() {
      portaoRelatoriosAgendado = false;
      processarPortaoRelatoriosAtaque();
    }, INVASOR_VIVO_POLL_MS);
  }

  function garantirCacadasLiberadaPorInvasor(contexto) {
    if (!cacadasPausadaPorInvasorSync()) return true;
    var cache = lerCacheEstadoInvasor();
    var reserva = reservaDoEstado(cache);
    if (reserva === null) reserva = extrairReservaRyous();
    definirInvasorVivoPainelPausado({
      reserva: reserva,
      reservaTexto: reserva !== null ? formatarNumeroBr(reserva) : '?',
      estado: cache
    });
    console.log('[InvasorVivo] ' + contexto + ' bloqueado — reserva baixa, aguardando proximo boss.');
    window.location.href = URL_RELATORIOS_ATAQUE;
    return false;
  }

  function extrairValorLinhaTabela(rotuloParcial, escopo) {
    var root = escopo || document.getElementById('col_direita') || document;
    var linhas = root.querySelectorAll('table tr');
    var alvo = rotuloParcial.toLowerCase();

    for (var i = 0; i < linhas.length; i++) {
      var tds = linhas[i].querySelectorAll('td');
      if (tds.length < 2) continue;

      var rotulo = (tds[0].innerText || tds[0].textContent || '').trim().toLowerCase();
      if (rotulo.indexOf(alvo) !== 0) continue;

      return (tds[1].innerText || tds[1].textContent || '').replace(/^\|\s*/, '').trim();
    }

    return null;
  }

  function extrairNivelJogadorSidebar() {
    var raizes = obterRaizesSidebar();
    for (var r = 0; r < raizes.length; r++) {
      var col = raizes[r];
      if (col === document.body) continue;

      var rows = col.querySelectorAll('.stat-row');
      for (var i = 0; i < rows.length; i++) {
        var lbl = rows[i].querySelector('.lbl');
        if (!lbl) continue;
        var lblNorm = normalizarTextoCombate(lbl.innerText || lbl.textContent || '');
        if (lblNorm.indexOf('nivel') === -1) continue;
        var val = rows[i].querySelector('.val');
        if (!val) continue;
        var n = parseInt(String(val.innerText || val.textContent || '').replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > 0) return n;
      }

      var html = col.innerHTML || '';
      var m = html.match(/N[ií]vel:<\/strong>\s*(\d+)/i);
      if (m) return parseInt(m[1], 10);

      var texto = col.innerText || col.textContent || '';
      m = texto.match(/N[ií]vel\s*:?\s*(\d+)/i);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  }

  function extrairNivelInimigo(textoNivel) {
    if (!textoNivel) return null;
    var m = String(textoNivel).match(/\[(\d+)\]/);
    if (m) return parseInt(m[1], 10);
    m = String(textoNivel).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
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
    var personagem = extrairValorLinhaTabela('personagem', colDireita);
    var nivelTexto = extrairValorLinhaTabela('nível ninja', colDireita);
    if (!nivelTexto) nivelTexto = extrairValorLinhaTabela('nivel ninja', colDireita);
    var ryousTexto = extrairValorLinhaTabela('ryous faturados', colDireita);
    var cla = extrairValorLinhaTabela('clã', colDireita);
    if (!cla) cla = extrairValorLinhaTabela('cla', colDireita);

    return {
      inimigo: inimigo || '(desconhecido)',
      personagem: personagem || '?',
      nivelTexto: nivelTexto || '?',
      nivel: extrairNivelInimigo(nivelTexto),
      ryousTexto: ryousTexto || '?',
      ryous: parseNumeroBr(ryousTexto),
      cla: cla || '?',
      meuNivel: extrairNivelJogadorSidebar()
    };
  }

  function nomeExibicaoInimigo(dados) {
    if (!dados) return '?';
    if (dados.inimigo && dados.inimigo !== '(desconhecido)') return dados.inimigo;
    return '?';
  }

  function nomeBloqueadoPorWhitelist(nome) {
    var norm = normalizarNomeCacadas(nome);
    if (!norm) return false;
    var lista = obterWhitelistCacadas();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function claBloqueadoPorWhitelist(cla) {
    var norm = normalizarNomeCacadas(cla);
    if (!norm || norm === '?') return false;
    var lista = obterWhitelistClaCacadas();
    for (var i = 0; i < lista.length; i++) {
      if (norm === lista[i]) return true;
    }
    return false;
  }

  function validarAlvoAtacar() {
    var dados = extrairDadosAlvoAtacar();
    var motivos = [];
    var porNomeFila = cacadaAtualPorNomeFila();
    var maxRyous = obterMaxRyousCacadas();
    var diffMin = obterDiffNivelCacadas();
    var whitelist = obterWhitelistCacadas();
    var whitelistCla = obterWhitelistClaCacadas();

    if (porNomeFila) {
      console.log('[Atacar] Caçada por nome (fila) — validacao so nome/cla whitelist.');
    }

    if (dados.inimigo !== '(desconhecido)' && cacadaAtualPorNomeFirebase() &&
        nomeBloqueadoPorWhitelistFirebaseFila(dados.inimigo)) {
      motivos.push(
        'Inimigo "' + dados.inimigo + '" esta na whitelist Firebase fila — ignorar e remover'
      );
    } else if (dados.inimigo === '(desconhecido)') {
      motivos.push('Nome do inimigo nao encontrado na pagina');
    } else if (nomeBloqueadoPorWhitelist(dados.inimigo)) {
      motivos.push(
        'Inimigo "' + dados.inimigo + '" esta na whitelist — nao atacar (' + whitelist.join(', ') + ')'
      );
    }

    if (dados.cla && dados.cla !== '?') {
      if (claBloqueadoPorWhitelist(dados.cla)) {
        motivos.push(
          'Cla "' + dados.cla + '" esta na whitelist — nao atacar (' + whitelistCla.join(', ') + ')'
        );
      }
    }

    if (!porNomeFila) {
      if (dados.ryous === null) {
        motivos.push('Ryous faturados nao encontrados na pagina');
      } else if (dados.ryous >= maxRyous) {
        motivos.push(
          'Ryous faturados ' + formatarNumeroBr(dados.ryous) +
          ' >= limite ' + formatarNumeroBr(maxRyous)
        );
      }

      if (dados.meuNivel === null) {
        motivos.push('Nivel do jogador nao encontrado na sidebar');
      } else if (dados.nivel === null) {
        motivos.push('Nivel do inimigo nao encontrado (' + dados.nivelTexto + ')');
      } else {
        var diff = dados.meuNivel - dados.nivel;
        dados.diffNivel = diff;
        if (diff < diffMin) {
          motivos.push(
            'Inimigo nivel ' + dados.nivel + ' nao esta ' + diffMin +
            '+ abaixo do seu (' + dados.meuNivel + ', diff=' + diff + ')'
          );
        }
      }
    } else if (dados.meuNivel !== null && dados.nivel !== null) {
      dados.diffNivel = dados.meuNivel - dados.nivel;
    }

    return {
      ok: motivos.length === 0,
      motivos: motivos,
      dados: dados,
      porNomeBlacklist: cacadaAtualPorNomeBlacklist(),
      porNomeFirebase: cacadaAtualPorNomeFirebase(),
      porNomeFila: porNomeFila,
      config: {
        whitelist: whitelist,
        whitelistCla: whitelistCla,
        maxRyous: maxRyous,
        diffNivel: diffMin
      }
    };
  }

  function enviarDiscordTexto(mensagem, webhookUrl, silencioso) {
    return garantirWebhooksDiscord().then(function() {
      var url = webhookUrl || DISCORD_WEBHOOK_CACADAS;
      if (!url) {
        console.warn('[Discord] Webhook cacadas ausente no Firebase (' + FIREBASE_WEBHOOKS_PATH + ').');
        return false;
      }
      var payload = {
        username: 'Bot Shadow of Shinobi',
        content: mensagem
      };
      if (silencioso) {
        payload.flags = 4096; // SUPPRESS_NOTIFICATIONS — posta no canal sem notificar
      }
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r) {
        if (r.ok) {
          console.log('[Discord] Aviso enviado.' + (silencioso ? ' (silencioso)' : ''));
          return true;
        }
        console.warn('[Discord] Falha ao enviar aviso:', r.status);
        return false;
      }).catch(function(e) {
        console.error('[Discord] Erro ao enviar aviso:', e);
        return false;
      });
    });
  }

  function montarMensagemAlvoIgnorado(resultado) {
    var d = resultado.dados;
    var linhas = [
      '**Alvo ignorado** — ' + obterUsuarioExibicao(),
      'Inimigo: **' + nomeExibicaoInimigo(d) + '**'
    ];
    linhas.push(
      'Ryous faturados: ' + d.ryousTexto,
      'Nivel inimigo: ' + d.nivelTexto +
        ' | Seu nivel: ' + (d.meuNivel !== null ? d.meuNivel : '?') +
        ' | Diff: ' + (d.diffNivel !== undefined ? d.diffNivel : '?'),
      'Cla: ' + d.cla,
      'Motivo: ' + resultado.motivos.join('; ')
    );
    return linhas.join('\n');
  }

  function avisarDiscordEVoltarCacadas(mensagem) {
    enviarDiscordTexto(mensagem, null, DISCORD_ALVO_IGNORADO_SILENCIOSO).finally(function() {
      irParaPortaoRelatorios('Alvo ignorado', { rotacionarAutomacao: true });
    });
  }

  function atacarAlvoValido(resultado, btnAtacar) {
    var d = resultado.dados;
    if (resultado.porNomeFila) {
      var rotulo = resultado.porNomeFirebase ? 'Firebase Fila' : 'Blacklist';
      console.log(
        '[Atacar] ' + rotulo + ' — alvo aprovado (so nome/cla): ' + nomeExibicaoInimigo(d) +
        ' | Ryous ' + (d.ryousTexto || '?') +
        ' | Nivel ' + (d.nivelTexto || '?')
      );
    } else if (resultado.porNomeBlacklist) {
      console.log(
        '[Atacar] Blacklist — alvo aprovado (so nome/cla): ' + nomeExibicaoInimigo(d) +
        ' | Ryous ' + (d.ryousTexto || '?') +
        ' | Nivel ' + (d.nivelTexto || '?')
      );
    } else {
      console.log(
        '[Atacar] Alvo aprovado — ' + nomeExibicaoInimigo(d) +
        ' | Ryous ' + d.ryousTexto +
        ' | Diff nivel ' + d.diffNivel
      );
    }
    if (btnAtacar) {
      limparTentativasCacadaPorNome();
      marcarAtaqueIniciadoRotacao();
      btnAtacar.click();
    }
  }

  function pularAlvoInvalido(resultado) {
    console.warn('[Atacar] Alvo ignorado — ' + resultado.motivos.join(' | '));
    if (cacadaAtualPorNomeFirebase()) {
      var nomeFb = obterAlvoNomeCacadasSessao();
      if (nomeFb && nomeBloqueadoPorWhitelistFirebaseFila(nomeFb)) {
        removerAlvoFirebaseFilaConsumido(nomeFb, 'whitelist firebase fila');
        limparEstadoModoCacadas();
        irParaPortaoRelatorios('Firebase fila — whitelist: ' + nomeFb, { rotacionarAutomacao: true });
        return;
      }
      if (nomeFb) adicionarSkipFirebaseFila(nomeFb);
      irParaPortaoRelatorios('Firebase fila — alvo invalido', { rotacionarAutomacao: true });
      return;
    }
    avisarDiscordEVoltarCacadas(montarMensagemAlvoIgnorado(resultado));
  }

  function paginaConfirmacaoAtaque() {
    return !!document.querySelector('form[action="atacar"] input[name="confirmar_ataque"]');
  }

  // --- Resultado do combate (caçadas) — pagina /combate ---
  // Ref: div.avisos_erro em /combate
  // Vitoria: "O vencedor X faturou Y ryous."
  // Derrota: "X foi derrotado por Y e perdeu Z ryous."
  var MIN_RYOUS_VITORIA_CACADAS_DEFAULT = 100000;

  function obterMinRyousVitoriaCacadas() {
    var n = parseNumeroInteiro(localStorage.getItem('BOT_MIN_RYOUS_VITORIA_CACADAS'));
    return n === null ? MIN_RYOUS_VITORIA_CACADAS_DEFAULT : n;
  }

  function limparNotificacaoCombate() {
    try { sessionStorage.removeItem(BOT_COMBATE_NOTIFICADO_KEY); } catch (e) {}
  }

  function marcarCombateNotificado() {
    try { sessionStorage.setItem(BOT_COMBATE_NOTIFICADO_KEY, '1'); } catch (e) {}
  }

  function combateJaNotificado() {
    try { return sessionStorage.getItem(BOT_COMBATE_NOTIFICADO_KEY) === '1'; } catch (e) {}
    return false;
  }

  function salvarUltimoAlvo(dados) {
    try {
      sessionStorage.setItem(BOT_ULTIMO_ALVO_KEY, JSON.stringify({
        inimigo: dados.inimigo,
        personagem: dados.personagem,
        ryous: dados.ryous,
        ryousTexto: dados.ryousTexto,
        cla: dados.cla,
        ts: Date.now()
      }));
      limparNotificacaoCombate();
    } catch (e) {}
  }

  function lerUltimoAlvo() {
    try {
      var raw = sessionStorage.getItem(BOT_ULTIMO_ALVO_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function ehPaginaCombateCacadas(url) {
    return url.indexOf('invasor-combate') === -1 && /\/combate(?:[\/?#]|$)/i.test(url);
  }

  function estaNaPaginaCombateCacadas() {
    return ehPaginaCombateCacadas(window.location.href);
  }

  function normalizarTextoCombate(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function classificarResultadoCombate() {
    var col = document.getElementById('col_direita') || document.body || document;
    var avisos = col.querySelectorAll('.avisos_erro');

    for (var i = 0; i < avisos.length; i++) {
      var texto = (avisos[i].innerText || avisos[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;

      var norm = normalizarTextoCombate(texto);

      if (norm.indexOf('foi derrotado') !== -1 || norm.indexOf('voce foi derrotado') !== -1) {
        return { resultado: 'derrota', texto: texto };
      }

      if (norm.indexOf('o vencedor') !== -1 && norm.indexOf('faturou') !== -1) {
        return { resultado: 'vitoria', texto: texto };
      }
    }

    return null;
  }

  function extrairRyousDoResumoCombate(texto, resultado) {
    if (!texto) return null;

    var padrao = resultado === 'derrota'
      ? /perdeu\s+([\d.,]+)\s*ryous/i
      : /faturou\s+([\d.,]+)\s*ryous/i;
    var m = texto.match(padrao);
    if (!m) return null;

    var bruto = m[1].trim();
    return {
      valor: parseNumeroBr(bruto),
      texto: bruto
    };
  }

  function aplicarRyousDoResumoCombate(dados, textoResumo, resultado) {
    var ryousCombate = extrairRyousDoResumoCombate(textoResumo, resultado);
    if (!ryousCombate || ryousCombate.valor === null) return dados;

    dados.ryous = ryousCombate.valor;
    dados.ryousTexto = ryousCombate.texto;
    return dados;
  }

  function extrairDadosResultadoCombate() {
    var dados = extrairDadosAlvoAtacar();
    var alvo = lerUltimoAlvo();

    if ((!dados.inimigo || dados.inimigo === '(desconhecido)') && alvo && alvo.inimigo) {
      dados.inimigo = alvo.inimigo;
    }
    if (dados.ryous === null && alvo) {
      dados.ryous = alvo.ryous;
      dados.ryousTexto = alvo.ryousTexto || '?';
    }
    if ((!dados.cla || dados.cla === '?') && alvo && alvo.cla) {
      dados.cla = alvo.cla;
    }

    return dados;
  }

  function montarMensagemCombateDerrota(dados) {
    var linhas = [
      '**Combate — Derrota** — ' + obterUsuarioExibicao(),
      'Inimigo: **' + nomeExibicaoInimigo(dados) + '**',
      'Ryous faturados: ' + (dados.ryousTexto || '?')
    ];
    if (dados.resumoCombate) linhas.push('Resumo: ' + dados.resumoCombate);
    return linhas.join('\n');
  }

  function montarMensagemCombateVitoria(dados) {
    var linhas = [
      '**Combate — Vitoria** — ' + obterUsuarioExibicao(),
      'Inimigo: **' + nomeExibicaoInimigo(dados) + '**',
      'Ryous faturados: ' + (dados.ryousTexto || '?') +
        ' (min. ' + formatarNumeroBr(obterMinRyousVitoriaCacadas()) + ')'
    ];
    if (dados.resumoCombate) linhas.push('Resumo: ' + dados.resumoCombate);
    return linhas.join('\n');
  }

  function notificarCombateSeNecessario(origem, dados, resultado) {
    if (combateJaNotificado()) {
      console.log('[Combate] Ja notificado nesta batalha (' + origem + ').');
      return false;
    }

    if (resultado === 'derrota') {
      marcarCombateNotificado();
      enviarDiscordTexto(montarMensagemCombateDerrota(dados));
      console.log('[Combate] Derrota avisada no Discord (' + origem + ').');
      return true;
    }

    if (resultado === 'vitoria') {
      var minRyous = obterMinRyousVitoriaCacadas();
      var ryousFaturados = dados.ryous;
      if (ryousFaturados !== null && ryousFaturados > minRyous) {
        marcarCombateNotificado();
        enviarDiscordTexto(montarMensagemCombateVitoria(dados));
        console.log('[Combate] Vitoria avisada no Discord (' + origem + '). Ryous faturados: ' + ryousFaturados);
        return true;
      }
      console.log('[Combate] Vitoria com ryous faturados <= limite (' + (ryousFaturados !== null ? ryousFaturados : '?') + ') — sem Discord.');
      marcarCombateNotificado();
    }

    return false;
  }

  function irParaCacadasAposCombate(motivo) {
    irParaPortaoRelatorios(motivo, { rotacionarAutomacao: true });
  }

  function processarPaginaCombate() {
    if (diarioDeveRodar() && obterFaseDiario() === 'raid') {
      var parsedDiario = classificarResultadoCombate();
      if (parsedDiario) {
        return finalizarDiarioRaidPosCombate(parsedDiario);
      }
      if (processarDiarioPosCombateRaid()) return true;
      console.log('[Diario] Raid combate — aguardando resultado...');
      return true;
    }

    if (!estaNaPaginaCombateCacadas()) return false;

    if (missaoNovoAtivo() && emFluxoAtaqueMissaoNovo()) {
      return processarMissaoNovoCombate();
    }

    var parsedAutom = classificarResultadoCombate();
    if (atacarAutomacoesAtacanteAtivo() && parsedAutom) {
      var dadosAutom = extrairDadosResultadoCombate();
      dadosAutom.resumoCombate = parsedAutom.texto;
      aplicarRyousDoResumoCombate(dadosAutom, parsedAutom.texto, parsedAutom.resultado);
      if (processarAutomAtacantePaginaCombate(parsedAutom, dadosAutom)) return true;
    }

    if (combateJaNotificado()) {
      irParaCacadasAposCombate('Combate ja processado');
      return true;
    }

    var parsed = classificarResultadoCombate();
    if (!parsed) {
      console.log('[Combate] Pagina /combate sem resultado final (vitoria/derrota).');
      return true;
    }

    var dados = extrairDadosResultadoCombate();
    dados.resumoCombate = parsed.texto;
    aplicarRyousDoResumoCombate(dados, parsed.texto, parsed.resultado);
    notificarCombateSeNecessario('combate', dados, parsed.resultado);

    if (parsed.resultado === 'derrota') {
      processarBlacklistAposDerrotaCombate(dados);
      processarFirebaseFilaAposDerrota(dados);
    }

    if (parsed.resultado === 'vitoria') {
      processarFirebaseFilaAposVitoria(dados);
    }

    console.log('[Combate] ' + parsed.resultado + ' detectado: ' + parsed.texto);
    irParaCacadasAposCombate('Resultado processado');
    return true;
  }

  // --- FUNÇÃO PARA GERAR OU OBTER O CÓDIGO ÚNICO DO SERVIDOR/SESSÃO ---
  function obterCodigoServidor() {
    var usuario = obterUsuarioLogin().trim();
    var chave = 'BOT_CODIGO_SRV_' + usuario;
    var codigo = localStorage.getItem(chave);
    if (!codigo) {
      var slug = usuario.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() || 'BOT';
      codigo = 'SRV_' + slug + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem(chave, codigo);
    }
    return codigo;
  }

  var CODIGO_SERVIDOR = obterCodigoServidor();

  // --- FUNÇÃO PARA SIMULAR DIGITAÇÃO HUMANA ---
  function digitarTexto(elementoInput, texto, callbackConcluido) {
    elementoInput.focus();
    elementoInput.value = '';

    var i = 0;
    function proximoCaractere() {
      if (i < texto.length) {
        elementoInput.value += texto.charAt(i);

        // Dispara eventos normais de teclado para simular ação do usuário
        elementoInput.dispatchEvent(new Event('keydown', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('keypress', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('input', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('keyup', { bubbles: true }));

        i++;
        // Intervalo humano aleatório entre 80ms e 200ms por caractere
        var atrasoHumano = Math.floor(Math.random() * (200 - 80 + 1)) + 80;
        setTimeout(proximoCaractere, atrasoHumano);
      } else {
        elementoInput.dispatchEvent(new Event('change', { bubbles: true }));
        elementoInput.blur();
        if (callbackConcluido) callbackConcluido();
      }
    }

    proximoCaractere();
  }

  // --- DETECÇÃO DE ERROS DE SERVIDOR (HTTP 500, 502, 503, 504, etc.) ---
  function checarErroServidor() {
    var elErro = document.querySelector('.error-code');
    if (elErro) {
      var txtErro = (elErro.innerText || elErro.textContent || '').toUpperCase();
      if (txtErro.indexOf('HTTP ERROR') !== -1 || txtErro.indexOf('500') !== -1) {
        return 'HTTP ERROR 500 detectado (.error-code)';
      }
    }

    var textoCorpo = (document.body ? document.body.innerText || document.body.textContent || '' : '').toUpperCase();
    if (
      textoCorpo.indexOf('HTTP ERROR 500') !== -1 ||
      textoCorpo.indexOf('500 INTERNAL SERVER ERROR') !== -1 ||
      textoCorpo.indexOf('502 BAD GATEWAY') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNAVAILABLE') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNVAILABLE') !== -1 ||
      textoCorpo.indexOf('504 GATEWAY TIMEOUT') !== -1
    ) {
      return 'Erro de Servidor detectado no HTML';
    }

    return null;
  }

  // --- CAPTCHA: imagem -> Firebase + Discord (OCR no painel) ---
  function obterRefFirebaseCaptcha() {
    return 'comandos/' + CODIGO_SERVIDOR + '/resposta';
  }

  function obterMaxTentativasOcrAutoCaptcha() {
    return estaEmContaGerenciada() ? CAPTCHA_OCR_AUTO_MAX_GERENCIADA : CAPTCHA_OCR_AUTO_MAX_NORMAL;
  }

  function descreverLimiteOcrAutoCaptcha() {
    var max = obterMaxTentativasOcrAutoCaptcha();
    var tipo = estaEmContaGerenciada() ? 'conta gerenciada' : 'conta normal';
    return max + ' tentativas (' + tipo + ')';
  }

  function lerTentativasOcrAutoCaptcha() {
    try {
      var n = parseInt(sessionStorage.getItem(BOT_CAPTCHA_OCR_AUTO_KEY), 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {}
    return 0;
  }

  function incrementarTentativasOcrAutoCaptcha() {
    var n = lerTentativasOcrAutoCaptcha() + 1;
    try { sessionStorage.setItem(BOT_CAPTCHA_OCR_AUTO_KEY, String(n)); } catch (e) {}
    return n;
  }

  function logOcrAutoNoConsole(origem) {
    var feitas = lerTentativasOcrAutoCaptcha();
    var max = obterMaxTentativasOcrAutoCaptcha();
    var restantes = Math.max(0, max - feitas);
    var linha = '[Script Caçadas] OCR auto: ' + feitas + '/' + max +
      ' tentativas (' + restantes + ' restantes, ' +
      (estaEmContaGerenciada() ? 'gerenciada' : 'normal') + ')';
    if (origem) linha += ' — ' + origem;
    console.log(linha);
    console.log(COMANDO_ZERAR_OCR_AUTO);
  }

  function zerarTentativasOcrAutoCaptcha(motivo) {
    try { sessionStorage.removeItem(BOT_CAPTCHA_OCR_AUTO_KEY); } catch (e) {}
    logOcrAutoNoConsole(motivo || 'contador zerado');
  }

  function logStatusOcrAutoCaptcha(origem) {
    logOcrAutoNoConsole(origem);
  }

  window.botZerarOcrAuto = function() {
    zerarTentativasOcrAutoCaptcha('comando manual botZerarOcrAuto()');
    agendarProximaTentativaOcrAuto();
    return lerTentativasOcrAutoCaptcha();
  };

  window.botBlacklistCacadas = function(lista) {
    if (arguments.length === 0) {
      return descreverBlacklistCacadas();
    }
    if (lista && typeof lista === 'object' && lista.join) {
      lista = lista.join(',');
    }
    gravarBlacklistCacadasParam(lista);
    console.log('[Blacklist] Lista atualizada: ' + descreverBlacklistCacadas());
    return descreverBlacklistCacadas();
  };

  window.botWhitelistFirebaseFila = function(lista) {
    if (arguments.length === 0) {
      console.log('[Firebase Fila] Whitelist: ' + obterWhitelistFirebaseFila().join(', '));
      return descreverWhitelistFirebaseFila();
    }
    if (lista && typeof lista === 'object' && lista.join) {
      lista = lista.join(',');
    }
    gravarWhitelistFirebaseFilaParam(lista);
    console.log('[Firebase Fila] Whitelist atualizada: ' + descreverWhitelistFirebaseFila());
    return descreverWhitelistFirebaseFila();
  };

  function montarLinkPainelCaptcha(opcoes) {
    var opts = opcoes || {};
    var url = URL_PAINEL_BASE + '?codigo=' + encodeURIComponent(CODIGO_SERVIDOR);
    if (opts.auto) {
      url += '&auto=1&fechar=1';
    }
    return url;
  }

  function delayAleatorioOcrCaptchaMs() {
    return CAPTCHA_OCR_AUTO_DELAY_MIN_MS + Math.floor(
      Math.random() * (CAPTCHA_OCR_AUTO_DELAY_MAX_MS - CAPTCHA_OCR_AUTO_DELAY_MIN_MS + 1)
    );
  }

  function limparTimersCaptcha() {
    if (timerCaptchaTimeout) {
      clearTimeout(timerCaptchaTimeout);
      timerCaptchaTimeout = null;
    }
    if (timerCaptchaOcrAuto) {
      clearTimeout(timerCaptchaOcrAuto);
      timerCaptchaOcrAuto = null;
    }
    if (timerCaptchaPosTentativas) {
      clearTimeout(timerCaptchaPosTentativas);
      timerCaptchaPosTentativas = null;
    }
  }

  function agendarReloadCaptchaEsgotado() {
    if (timerCaptchaTimeout) {
      clearTimeout(timerCaptchaTimeout);
      timerCaptchaTimeout = null;
    }
    console.warn('[Captcha] OCR auto esgotado — reload em ' +
      (TEMPO_TIMEOUT_CAPTCHA / 60000) + ' min se nao houver resposta...');
    timerCaptchaTimeout = setTimeout(function() {
      timerCaptchaTimeout = null;
      var destino = urlAposCaptcha();
      console.warn('[Captcha] Tempo limite esgotado! Redirecionando...');
      window.location.href = destino;
    }, TEMPO_TIMEOUT_CAPTCHA);
  }

  function avisarDiscordOcrEsgotado(origem) {
    if (captchaRespostaProcessando) return;
    console.warn('[Captcha] Avisando Discord — ' + (origem || 'tentativas esgotadas'));
    notificarDiscordCaptchaOcr(origem || 'tentativas esgotadas');
    agendarReloadCaptchaEsgotado();
  }

  function tentarOcrAutomaticoCaptcha() {
    if (captchaRespostaProcessando) return;

    var max = obterMaxTentativasOcrAutoCaptcha();
    var feitas = lerTentativasOcrAutoCaptcha();
    if (feitas >= max) {
      console.warn('[Captcha] OCR auto — limite de ' + max + ' tentativas.');
      logStatusOcrAutoCaptcha('limite atingido');
      return;
    }

    var tentativa = incrementarTentativasOcrAutoCaptcha();
    logStatusOcrAutoCaptcha('tentativa ' + tentativa);
    var link = montarLinkPainelCaptcha({ auto: true });
    console.warn('[Captcha] OCR automatico ' + tentativa + '/' + max + ': ' + link);

    var novaAba = null;
    try {
      novaAba = window.open(link, 'bot_ocr_' + CODIGO_SERVIDOR + '_' + tentativa, 'noopener,noreferrer');
    } catch (e) {}

    if (!novaAba) {
      console.warn('[Captcha] Popup bloqueado — usando iframe oculto para OCR.');
      var iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;border:0';
      iframe.src = link;
      document.body.appendChild(iframe);
      setTimeout(function() {
        try { iframe.remove(); } catch (e) {}
      }, 180000);
    }

    if (tentativa >= max) {
      if (timerCaptchaPosTentativas) {
        clearTimeout(timerCaptchaPosTentativas);
        timerCaptchaPosTentativas = null;
      }
      console.log('[Captcha] Ultima tentativa OCR auto — aguardando ' +
        (TEMPO_ESPERA_APOS_OCR_ESGOTADO_MS / 1000) + 's antes do Discord...');
      timerCaptchaPosTentativas = setTimeout(function() {
        timerCaptchaPosTentativas = null;
        avisarDiscordOcrEsgotado('tentativas OCR esgotadas');
      }, TEMPO_ESPERA_APOS_OCR_ESGOTADO_MS);
    }
  }

  function agendarProximaTentativaOcrAuto() {
    if (timerCaptchaOcrAuto) {
      clearTimeout(timerCaptchaOcrAuto);
      timerCaptchaOcrAuto = null;
    }

    var feitas = lerTentativasOcrAutoCaptcha();
    var max = obterMaxTentativasOcrAutoCaptcha();
    if (feitas >= max || captchaRespostaProcessando) {
      return;
    }

    var delay = delayAleatorioOcrCaptchaMs();
    var segundos = Math.round(delay / 1000);

    console.log('[Captcha] Proxima tentativa OCR auto em ' + segundos + 's (' +
      (feitas + 1) + '/' + max + ')...');

    timerCaptchaOcrAuto = setTimeout(function() {
      timerCaptchaOcrAuto = null;
      if (captchaRespostaProcessando) return;
      if (lerTentativasOcrAutoCaptcha() >= obterMaxTentativasOcrAutoCaptcha()) return;

      tentarOcrAutomaticoCaptcha();

      if (!captchaRespostaProcessando &&
          lerTentativasOcrAutoCaptcha() < obterMaxTentativasOcrAutoCaptcha()) {
        agendarProximaTentativaOcrAuto();
      }
    }, delay);
  }

  function agendarTimersCaptcha() {
    limparTimersCaptcha();

    var feitas = lerTentativasOcrAutoCaptcha();
    var max = obterMaxTentativasOcrAutoCaptcha();

    if (feitas >= max) {
      console.warn('[Captcha] Tentativas OCR auto ja esgotadas nesta sessao (' +
        feitas + '/' + max + ') — Discord + reload em 5 min.');
      logStatusOcrAutoCaptcha('esgotado apos reload');
      avisarDiscordOcrEsgotado('reload com tentativas ja esgotadas');
      return;
    }

    console.log('[Captcha] OCR auto: ate ' + descreverLimiteOcrAutoCaptcha() +
      ' (1a em 10-30s, intervalo 10-30s) | Discord so ao esgotar | reload 5 min depois...');

    agendarProximaTentativaOcrAuto();
    logStatusOcrAutoCaptcha('timers iniciados');
  }

  function obterImagemCaptcha() {
    var form = document.querySelector('form[action*="captcha_seguranca"]');
    if (form) {
      var imgForm = form.querySelector('img');
      if (imgForm) return imgForm;
    }
    var input = document.querySelector('input[name="resposta"]');
    if (input && input.form) {
      var imgInput = input.form.querySelector('img');
      if (imgInput) return imgInput;
    }
    return null;
  }

  function capturarBlobCaptcha(callback) {
    var img = obterImagemCaptcha();
    if (!img) {
      console.warn('[Captcha] Imagem nao encontrada no DOM.');
      callback(null);
      return;
    }

    function desenhar() {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) {
        callback(null);
        return;
      }
      var scale = 3;
      var canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function(blob) {
        callback(blob);
      }, 'image/png');
    }

    if (img.complete && img.naturalWidth > 0) {
      desenhar();
    } else {
      img.onload = desenhar;
      img.onerror = function() { callback(null); };
    }
  }

  function garantirFirebase(callback) {
    function conectar() {
      if (!window.firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      callback(firebase.database());
    }

    if (window.firebase && window.firebase.database) {
      conectar();
      return;
    }

    var scriptApp = document.createElement('script');
    scriptApp.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
    scriptApp.onload = function() {
      var scriptDb = document.createElement('script');
      scriptDb.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js';
      scriptDb.onload = conectar;
      document.head.appendChild(scriptDb);
    };
    document.head.appendChild(scriptApp);
  }

  function montarDescricaoDiscordCaptcha() {
    var max = obterMaxTentativasOcrAutoCaptcha();
    var feitas = lerTentativasOcrAutoCaptcha();
    var tipo = estaEmContaGerenciada() ? 'conta gerenciada' : 'conta normal';

    return [
      'Verificacao de seguranca — **a imagem abaixo e a valida** (salva no Firebase).',
      'O navegador pode mostrar numeros diferentes; resolva pela imagem desta mensagem.',
      '',
      '**Conta:** ' + obterUsuarioExibicao(),
      '**Codigo:** `' + CODIGO_SERVIDOR + '`',
      '',
      '**OCR automatico esgotado:** ' + feitas + '/' + max + ' tentativas (' + tipo + ')',
      'Resolva pelo painel. Se nao houver resposta, a pagina recarrega em 5 min.',
      '',
      '[**Abrir painel (OCR + confirmar)**](' + montarLinkPainelCaptcha() + ')'
    ].join('\n');
  }

  function notificarDiscordCaptchaOcr(origem) {
    capturarBlobCaptcha(function(blob) {
      if (!blob) {
        console.warn('[Captcha] Discord OCR — imagem indisponivel (' + (origem || '?') + ').');
        return;
      }
      enviarDiscordCaptchaBlob(blob, montarDescricaoDiscordCaptcha());
    });
  }

  function enviarDiscordCaptchaBlob(blob, descricao, callback) {
    var corDecimal = parseInt('FF0000'.replace('#', ''), 16);
    var payloadData = {
      username: 'Bot Shadow of Shinobi',
      embeds: [{
        title: 'CAPTCHA — OCR esgotado',
        description: descricao,
        color: corDecimal,
        timestamp: new Date().toISOString(),
        image: { url: 'attachment://captcha.png' },
        footer: { text: 'Usuario: ' + obterUsuarioExibicao() + ' | ' + CODIGO_SERVIDOR +
          ' | OCR ' + lerTentativasOcrAutoCaptcha() + '/' + obterMaxTentativasOcrAutoCaptcha() }
      }]
    };

    var formData = new FormData();
    formData.append('payload_json', JSON.stringify(payloadData));
    formData.append('file', blob, 'captcha.png');

    garantirWebhooksDiscord().then(function() {
      if (!DISCORD_WEBHOOK_CAPTCHA) {
        console.warn('[Discord] Webhook captcha ausente no Firebase (' + FIREBASE_WEBHOOKS_PATH + ').');
        if (callback) callback();
        return;
      }
      fetch(DISCORD_WEBHOOK_CAPTCHA, { method: 'POST', body: formData })
        .then(function(r) {
          if (r.ok) console.log('[Discord] Captcha enviado (recorte, sem html2canvas).');
          if (callback) callback();
        })
        .catch(function(e) {
          console.error('[Discord] Erro:', e);
          if (callback) callback();
        });
    });
  }

  function processarCaptchaDetectado() {
    if (captchaJaNotificado) {
      console.log('[Captcha] Ja notificado nesta pagina — ignorando.');
      return;
    }
    captchaJaNotificado = true;

    capturarBlobCaptcha(function(blob) {
      if (!blob) {
        console.error('[Captcha] Falha ao capturar imagem.');
        return;
      }

      garantirFirebase(function(database) {
        var reader = new FileReader();
        reader.onload = function() {
          var dataUrl = reader.result;
          var refBase = 'comandos/' + CODIGO_SERVIDOR;

          database.ref(refBase + '/imagem').set(dataUrl)
        .then(function() {
              console.log('[Captcha] Imagem salva: ' + refBase + '/imagem');
              return database.ref(refBase + '/resposta').remove();
            })
            .then(function() {
              database.ref('codigo_servidor').set(CODIGO_SERVIDOR).catch(function() {});
              iniciarEscutaFirebaseCaptcha(database);
        })
        .catch(function(err) {
              console.error('[Captcha] Erro ao salvar Firebase:', err);
            });
        };
        reader.readAsDataURL(blob);
      });
    });
  }

  // --- ESCUTA DO FIREBASE PARA O CAPTCHA ---
  function iniciarEscutaFirebaseCaptcha(databaseExistente) {
    function conectarEListen(database) {
      var refPath = obterRefFirebaseCaptcha();
      var campoComando = database.ref(refPath);

      console.log('%c[Firebase] Aguardando captcha em: ' + refPath, 'color: #00ff00; font-weight: bold;');

      campoComando.off();

      campoComando.on('value', function(snapshot) {
        var valor = snapshot.val();

        if (valor !== null && valor !== undefined && valor !== '') {
          if (captchaRespostaProcessando) return;
          captchaRespostaProcessando = true;
          campoComando.off();

          var codigoCaptcha = String(valor).trim();
          console.log('%c[Firebase] CODIGO DO CAPTCHA RECEBIDO:', 'color: #ffff00; font-weight: bold;', codigoCaptcha);

          limparTimersCaptcha();
          zerarTentativasOcrAutoCaptcha('captcha resolvido');

          var inputCaptcha = document.querySelector('input[name="resposta"]') || 
                             document.querySelector('input[name="captcha"], input[name="codigo"], #captcha');

          if (inputCaptcha) {
            console.log('[Captcha] Iniciando simulacao de digitacao...');

            digitarTexto(inputCaptcha, codigoCaptcha, function() {
              console.log('[Captcha] Digitacao concluida! Limpando Firebase...');

              var urlDelete = FIREBASE_CONFIG.databaseURL + '/' + refPath + '.json';

              fetch(urlDelete, { method: 'DELETE' })
                .then(function() {
                  console.log('[Firebase] Resposta apagada do banco.');
                })
                .catch(function(err) {
                  console.warn('[Firebase] Erro ao apagar:', err);
                })
                .finally(function() {
                  var delayClique = Math.floor(Math.random() * (700 - 300 + 1)) + 300;
                  
                  setTimeout(function() {
                    var formCaptcha = inputCaptcha.closest('form');
                    var btnConfirmar = formCaptcha ? formCaptcha.querySelector('input[type="submit"]') : null;

                    if (btnConfirmar) {
                      console.log('[Script] Clicando Confirmar...');
                      btnConfirmar.click();
                    } else if (formCaptcha) {
                      formCaptcha.submit();
                    }
                  }, delayClique);
                });
            });

          } else {
            console.error('[Script] Input do captcha nao encontrado na pagina.');
            captchaRespostaProcessando = false;
          }
        }
      });
    }

    if (databaseExistente) {
      conectarEListen(databaseExistente);
      return;
    }

    garantirFirebase(conectarEListen);
  }

  function agendarReloadFalha(motivo, delayMs) {
    agendarRecuperacaoViaLogin(motivo, delayMs);
  }

  function redirecionarParaCacadas(motivo) {
    console.warn('[Script] PÁGINA NÃO MAPEADA (' + motivo + '). Redirecionando...');
    if (missaoNovoPausaRotinaCacadas()) {
      window.location.href = URL_MISSOES;
      return;
    }
    if (atacarAutomacoesPrepAtivo() && (motivo || '').indexOf('relatorios') !== -1) {
      if (processarAutomPrepRelatoriosValidacao()) return;
    }
    if (obterModoAba() === 'cacadas') {
      if (redirecionarDiarioNoLugarDeCacadas('pagina nao mapeada')) return;
      irParaPortaoRelatorios('Pagina nao mapeada');
      return;
    }
    window.location.href = URL_CACADAS;
  }

  function aguardandoAutenticacao() {
    if (document.getElementById('login')) return true;

    var texto = (document.body ? document.body.innerText || document.body.textContent || '' : '').toLowerCase();
    if (texto.indexOf('sessão expirada ou requisição inválida') !== -1) return true;
    if (texto.indexOf('sessao expirada ou requisicao invalida') !== -1) return true;
    if (document.querySelector('a[href*="history.back()"]')) return true;

    return false;
  }

  function sessaoExpiradaSemLogin() {
    if (document.getElementById('login')) return false;
    return aguardandoAutenticacao();
  }

  function redirecionarParaLogin(motivo) {
    console.warn('[Script Caçadas] ' + motivo + ' — redirecionando para login com parametros da sessao...');
    var url = salvarRecuperacaoAntesDeSair();
    try { location.replace(url); } catch (e) { location.href = url; }
  }

  function executarCacadaPorNome(nome) {
    if (!garantirHpParaAtacar('caçada por nome')) return true;
    if (!garantirCacadasLiberadaPorInvasor('caçada por nome')) return true;
    if (atacarAutomacoesAtacanteAtivo() || obterModoCacadasSessao() === 'automacao_atacar') {
      if (!garantirDoujutsuParaAtacar('caçada por nome autom')) return true;
    }

    var input = document.getElementById('por_nome') ||
      document.querySelector('input[name="por_nome"]');
    if (!input) return false;

    var form = input.closest('form');
    if (!form) return false;

    input.value = nome;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    var btnSubmit = form.querySelector('input[type="submit"]');
    if (!btnSubmit) return false;

    console.log('[Caçadas] Blacklist — caçando por nome: ' + nome);
    btnSubmit.click();
    return true;
  }

  function executarCacadaPorNivel() {
    if (!garantirHpParaAtacar('caçada por nivel')) return true;
    if (!garantirCacadasLiberadaPorInvasor('caçada por nivel')) return true;

    if (!seletorPorNivelDisponivel()) return false;

    var selectNivel = document.getElementById('por_nivel');
    var formNivel = selectNivel.closest('form');
    var btnNivel = formNivel.querySelector('input[type="submit"]');

    selectNivel.value = String(obterNivelCacadasAtual());
    selectNivel.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Caçadas] Gate OK — caçada por nivel ' + obterNivelCacadasAtual() + ', clicando Caçar...');
    btnNivel.click();
    return true;
  }

  function processarCacadasSemFormularioNivel(motivo) {
    console.warn(
      '[Caçadas] ' + motivo + ' — formulario por_nivel (caçar por nivel) indisponivel. ' +
      'Nenhuma caçada iniciada.'
    );
    irParaPortaoRelatorios('Sem caçada por nivel disponivel');
    return true;
  }

  function urlAposCaptcha() {
    if (obterModoAba() === 'invasor') return URL_INVASOR;
    return URL_RELATORIOS_ATAQUE;
  }

  console.log(
    '[Script Caçadas] Login: ' + obterUsuarioLogin() + ' | Ativo: ' + obterUsuarioExibicao() +
    ' | Nível: ' + descreverNivelCacadasPainel() +
    ' | Espera caçadas: ' + descreverEsperaCacadas() +
    ' | Whitelist: ' + descreverWhitelistAtacar() +
    ' | ' + descreverWhitelistClaAtacar() +
    ' | WL Firebase fila: ' + descreverWhitelistFirebaseFila() +
    ' | Blacklist: ' + descreverBlacklistCacadas() +
    ' | Rotacao automacao: ' + descreverRotacaoAutomacao() +
    ' | Max ryous: ' + formatarNumeroBr(obterMaxRyousCacadas()) +
    ' | Diff nivel: ' + obterDiffNivelCacadas() +
    ' | Min ryous vitoria: ' + formatarNumeroBr(obterMinRyousVitoriaCacadas()) +
    ' | HP minimo ataque: ' + descreverHpMinimoAtacar() +
    ' | Doujutsu: ' + descreverDoujutsu() +
    ' | InvasorVivo: ' + descreverInvasorVivo() +
    ' | Teto29: ' + descreverCacadasPortaoTeto29() +
    ' | Diario gerenciada: ' + descreverDiarioGerenciada() +
    ' | Atacar automacoes: ' + descreverAtacarAutomacoes() +
    ' | Console: botDoujutsu() / botDoujutsu(true|false) / botDoujutsuAutoSabado()' +
    ' | botInvasorVivo() / botInvasorVivo(true|false) | botCacadasTeto29() / botCacadasTeto29(true|false)' +
    ' | botDiarioGerenciada() / botDiarioGerenciada(true|false) | botDiarioSemCacadas() / botDiarioSemCacadas(true|false) | botDiarioReset()' +
    ' | botAtacarAutomacoesPrep() / botAtacarAutomacoesPrep(true|false) | botAtacarAutomacoes() / botAtacarAutomacoes(true|false) | botAutomPrepReset()' +
    ' | Código: ' + CODIGO_SERVIDOR
  );
  logOcrAutoNoConsole();

    setTimeout(function() {
    try {
      sincronizarModoAba();

      if (obterModoAba() === 'invasor') {
        var ehLogin = !!document.getElementById('login');
        var urlInv = window.location.href;
        var ehCaptcha = urlInv.indexOf('captcha_seguranca') !== -1 ||
          document.querySelector('form[action="captcha_seguranca"]');

        if (sessaoExpiradaSemLogin()) {
          redirecionarParaLogin('Sessao expirada (aba invasor)');
          return;
        }

        if (!ehLogin && !ehCaptcha && urlInv.indexOf('status') === -1) {
          console.log('[Script Caçadas] Aba invasor — sem acao.');
          return;
        }
      }

      sincronizarUsuarioLocalStorage();
      CODIGO_SERVIDOR = obterCodigoServidor();

      if (obterModoAba() === 'cacadas' && consumirContaAutomacaoAssumida()) {
        limparRetomarGerenciada();
        if (atacarAutomacoesPrepAtivo()) {
          var fasePrepPosAssume = obterFaseAutomPrep();
          if (fasePrepPosAssume && fasePrepPosAssume !== 'validar') {
            console.log('[Autom Prep] Conta assumida — retomando fase ' + fasePrepPosAssume);
            retomarAutomPrepPosAssume();
            return;
          }
          var nomePrep = extrairNomeUsuarioLogado();
          var snapPrep = lerUltimaGerenciadaSnapshot();
          iniciarAutomPrepPosAssume(nomePrep || (snapPrep && snapPrep.nome) || '', snapPrep && snapPrep.contaId);
          return;
        }
        if (diarioGerenciadaAtivo()) {
          retomarDiarioGerenciadaPosAssume();
          return;
        }
        console.log('[Automacao] Conta assumida — iniciando portao de caçadas...');
        window.location.href = URL_RELATORIOS_ATAQUE;
        return;
      }

      var urlAtual = window.location.href;
      var formLogin = document.getElementById('login');

      // Login antes de checar erro 500 — evita reload na tela de login
      if (formLogin) {
        if (tentarLoginAutomatico('principal')) {
          return;
        }
        agendarReloadFalha('Campos de login (#usuario / #senha) nao encontrados.');
        return;
      }

      // 1. VERIFICAÇÃO DE ERRO NO SERVIDOR (HTTP 500)
      var erroServidor = checarErroServidor();
      if (erroServidor) {
        agendarReloadFalha(erroServidor, TEMPO_RECUPERACAO_SERVIDOR);
        return;
      }

      // /status → destino conforme modo desta aba (sessionStorage ou URL de recuperacao)
      if (urlAtual.indexOf('status') !== -1) {
        var urlRankingPosLogin = obterUrlRetornoRankingPosLogin();
        if (urlRankingPosLogin) {
          console.log('[Script Caçadas] Status pos-login — bot ranking ativo nesta aba, voltando ao ranking...');
          window.location.href = urlRankingPosLogin;
          return;
        }
        var modoStatus = ehReferrerPosLogin() ? recuperarModoAbaPosLogin() : obterModoAba();
        if (modoStatus === 'cacadas') {
          if (missaoNovoPausaRotinaCacadas()) {
            if (processarCurarHpNaPaginaStatus()) return;
            if (curarHpAtivo()) return;
            var retornoMnHp = urlPosCurarHpMissaoNovo();
            console.log('[Missao Novo] Status pos-cura — retomando (' +
              (retornoMnHp.indexOf('missoes') !== -1 ? '/missoes' : 'fluxo ataque') + ')...');
            window.location.href = retornoMnHp;
            return;
          }
          if (consumirDiarioRetomarPosLogin() && diarioGerenciadaAtivo()) {
            console.log('[Diario] Pos-login — retomando diario na mesma aba (automacao)...');
            marcarRotacaoCicloPendente();
            window.location.href = URL_AUTOMACAO;
            return;
          }
          if (processarRotacaoContaPrincipal()) return;
          if (processarCurarHpNaPaginaStatus()) return;
          if (redirecionarParaDiarioGerenciada('status pos-login')) return;
          if (processarDoujutsuNaPaginaStatus('status')) return;
          if (doujutsuAtivarPendente() && doujutsuEstaAtivo()) {
            limparDoujutsuAtivarPendente();
          }
          if (devePriorizarDiarioSobreCacadas()) {
            if (redirecionarParaDiarioGerenciada('status pos-cura')) return;
          }
          if (cacadasBloqueadaPorDiarioGerenciada()) {
            if (redirecionarDiarioNoLugarDeCacadas('status pos-login')) return;
          }
          console.log('[Script Caçadas] Status — redirecionando ao portao de relatorios...');
          window.location.href = URL_RELATORIOS_ATAQUE;
          return;
        }
        if (modoStatus === 'invasor') {
          try {
            if (sessionStorage.getItem('BOT_INV_HP_CURAR') === '1') {
              console.log('[Script Caçadas] Status — cura invasor pendente, sem acao.');
              return;
            }
          } catch (e) {}
          console.log('[Script Caçadas] Status — redirecionando ao invasor...');
          window.location.href = URL_INVASOR;
          return;
        }
      }

      // /mercado → compra Ichiraku quando cura HP pendente
      if (urlAtual.indexOf('mercado') !== -1 &&
          (obterModoAba() === 'cacadas' || missaoNovoAtivo())) {
        if (processarCompraIchirakuMercado()) return;
      }

      // Modo cacadas: ignora paginas do invasor
      if (obterModoAba() === 'cacadas' && urlAtual.indexOf('invasor') !== -1) {
        console.log('[Script Caçadas] Pagina do invasor — sem acao.');
        return;
      }

      if (processarRotacaoContaPrincipal()) return;

      if (!missaoNovoPausaRotinaCacadas()) {
        if (obterModoAba() === 'cacadas' && verificarDiarioRetomarPosInterrupcao()) return;
        if (obterModoAba() === 'cacadas' && redirecionarParaDiarioGerenciada('prioridade diario')) return;
      }

      if (sessaoExpiradaSemLogin()) {
        redirecionarParaLogin('Sessao expirada');
        return;
      }

      if (aguardandoAutenticacao()) {
        console.log('[Script Caçadas] Aguardando login — sem acao.');
        return;
      }

      var paginasConhecidas = [
        {
          id: 'captcha_seguranca',
          checar: function() { 
            return urlAtual.indexOf('captcha_seguranca') !== -1 || document.querySelector('form[action="captcha_seguranca"]') !== null; 
          },
          executar: function() {
            console.warn('[Script] Captcha detectado! Imagem -> Firebase + Discord...');
            processarCaptchaDetectado();

            agendarTimersCaptcha();

            return true; 
          }
        },
        {
          id: 'missao_novo_relatorio_coletar',
          checar: function() {
            if (!missaoNovoDeveColetarRelatorio()) return false;
            return ehPaginaMensagens() || urlAtual.indexOf('relatorios_ataque') !== -1;
          },
          executar: function() {
            return processarMissaoNovoRelatorioColetar();
          }
        },
        {
          id: 'missao_novo_relatorio',
          checar: function() {
            if (!missaoNovoDeveValidarRelatorio()) return false;
            return ehPaginaMensagens() || urlAtual.indexOf('relatorios_ataque') !== -1;
          },
          executar: function() {
            return processarMissaoNovoRelatorioValidar();
          }
        },
        {
          id: 'missao_novo_jogador',
          checar: function() {
            if (!missaoNovoAtivo() || !emFluxoAtaqueMissaoNovo()) return false;
            return urlAtual.indexOf('jogador') !== -1;
          },
          executar: function() {
            return processarMissaoNovoJogador();
          }
        },
        {
          id: 'missao_novo_ranking',
          checar: function() {
            if (!missaoNovoAtivo() || !emFluxoAtaqueMissaoNovo()) return false;
            return urlAtual.indexOf('ranking') !== -1;
          },
          executar: function() {
            return processarMissaoNovoRanking();
          }
        },
        {
          id: 'combate',
          checar: function() {
            if (missaoNovoAtivo() && emFluxoAtaqueMissaoNovo() && ehPaginaCombateCacadas(urlAtual)) {
              return true;
            }
            if (obterModoAba() !== 'cacadas') return false;
            if (cacadasBloqueadaPorDiarioGerenciada()) {
              if (diarioDeveRodar() && obterFaseDiario() === 'raid' && ehPaginaCombateCacadas(urlAtual)) {
              return true;
            }
            return false;
            }
            if (diarioDeveRodar() && obterFaseDiario() === 'raid' && ehPaginaCombateCacadas(urlAtual)) {
              return true;
            }
            return ehPaginaCombateCacadas(urlAtual);
          },
          executar: function() {
            if (missaoNovoAtivo() && emFluxoAtaqueMissaoNovo()) {
              return processarPaginaCombate();
            }
            if (cacadasBloqueadaPorDiarioGerenciada() &&
                !(diarioDeveRodar() && obterFaseDiario() === 'raid')) {
              return redirecionarDiarioNoLugarDeCacadas('combate caçadas');
            }
            return processarPaginaCombate();
          }
        },
        {
          id: 'diario_eventos',
          checar: function() {
            if (urlAtual.indexOf('eventos') === -1 || !diarioDeveRodar()) return false;
            var fase = obterFaseDiario();
            return !fase || fase === 'evento';
          },
          executar: function() {
            if (!obterFaseDiario()) iniciarDiarioGerenciada();
            return processarDiarioEventos();
          }
        },
        {
          id: 'diario_raid_combate',
          checar: function() {
            if (!diarioDeveRodar() || obterFaseDiario() !== 'raid') return false;
            if (ehPaginaListaRaids(urlAtual)) return false;
            return paginaRaidCombateAtivo(urlAtual) || urlAtual.indexOf('raid-combate') !== -1;
          },
          executar: function() {
            return processarDiarioRaidCombatePagina();
          }
        },
        {
          id: 'diario_raid',
          checar: function() {
            return ehPaginaListaRaids(urlAtual) && diarioDeveRodar() && obterFaseDiario() === 'raid';
          },
          executar: function() {
            return processarDiarioRaidLista();
          }
        },
        {
          id: 'diario_animal',
          checar: function() {
            return urlAtual.indexOf('/animal') !== -1 && diarioDeveRodar() && obterFaseDiario() === 'animal';
          },
          executar: function() {
            return processarDiarioAnimal();
          }
        },
        {
          id: 'autom_prep_relatorios',
          checar: function() {
            if (!atacarAutomacoesPrepAtivo()) return false;
            if (obterFaseAutomPrep() !== 'validar') return false;
            return urlAtual.indexOf('relatorios_ataque') !== -1 ||
              urlAtual.indexOf('tab=relatorios') !== -1 ||
              !!document.querySelector('.msg-pipetabs a.active[href*="relatorios"]');
          },
          executar: function() {
            return processarAutomPrepRelatoriosValidacao();
          }
        },
        {
          id: 'autom_prep_quests',
          checar: function() {
            if (!atacarAutomacoesPrepAtivo()) return false;
            var faseQuest = obterFaseAutomPrep();
            if (faseQuest === 'quests' && urlAtual.indexOf('quests') !== -1) return true;
            if (faseQuest === 'hp' && urlAtual.indexOf('status') !== -1) return true;
            return false;
          },
          executar: function() {
            return processarAutomPrepQuests();
          }
        },
        {
          id: 'autom_prep_animal',
          checar: function() {
            if (!atacarAutomacoesPrepAtivo() || urlAtual.indexOf('/animal') === -1) return false;
            var faseAutom = obterFaseAutomPrep();
            return faseAutom === 'vender_inicial' || faseAutom === 'prep_ate_venda' ||
              faseAutom === 'waiting_sell' || faseAutom === 'vender_sync' ||
              faseAutom === 'comprar_pos_ataque' || faseAutom === 'comprar_timeout';
          },
          executar: function() {
            return processarAutomPrepAnimal();
          }
        },
        {
          id: 'relatorios_ataque',
          checar: function() {
            if (missaoNovoPausaRotinaCacadas()) return false;
            if (obterModoAba() !== 'cacadas') return false;
            if (atacarAutomacoesPrepAtivo() && obterFaseAutomPrep() === 'validar') return false;
            if (cacadasBloqueadaPorDiarioGerenciada()) return false;
            if (cacadasBloqueadaPorAutomPrep() && !atacarAutomacoesAtacanteAtivo()) return false;
            if (devePriorizarDiarioSobreCacadas()) return false;
            if (urlAtual.indexOf('relatorios_ataque') !== -1) return true;
            return !!document.querySelector('.msg-pipetabs a.active[href*="relatorios_ataque"]');
          },
          executar: function() {
            return processarPortaoRelatoriosAtaque();
          }
        },
        {
          id: 'automacao',
          checar: function() {
            if (missaoNovoPausaRotinaCacadas()) return false;
            if (obterModoAba() !== 'cacadas') return false;
            if (atacarAutomacoesAtacanteAtivo()) return false;
            return urlAtual.indexOf('automacao') !== -1;
          },
          executar: function() {
            return processarPaginaAutomacao();
          }
        },
        {
          id: 'missoes',
          checar: function() {
            if (missaoNovoAtivo()) return urlAtual.indexOf('missoes') !== -1;
            if (obterModoAba() !== 'cacadas') return false;
            return urlAtual.indexOf('missoes') !== -1;
          },
          executar: function() {
            return processarPaginaMissoes();
          }
        },
        {
          id: 'cacadas',
          checar: function() {
            if (obterModoAba() !== 'cacadas' || urlAtual.indexOf('cacadas') === -1) return false;
            if (cacadasBloqueadaPorAutomPrep()) return false;
            if (devePriorizarDiarioSobreCacadas()) return false;
            return true;
          },
          executar: function() {
            if (missaoNovoPausaRotinaCacadas()) {
              window.location.href = URL_MISSOES;
              return true;
            }
            if (redirecionarParaDiarioGerenciada('Pagina caçadas')) return true;
            if (paginaCacadasBloqueadaPorMissao()) {
              return processarCacadasBloqueadaPorMissao();
            }

            if (paginaCacadasComMissaoTempo()) {
              return processarCacadasMissaoTempo();
            }

            if (processarClasseIndisponivelCacadas()) {
              return true;
            }

            if (processarNivelAbaixoMinimoCacadas()) {
              return true;
            }

            if (processarInimigoBatalhaRecente30mCacadas()) {
              return true;
            }

            if (processarInimigoEnergiaVitalBaixaCacadas()) {
                  return true;
                }

            if (processarJaAtacouHojeCacadas()) {
              return true;
            }

            if (processarNinjaNaoEncontradoCacadas()) {
              return true;
            }

            if (!gateCacadasLiberado()) {
              console.log('[Caçadas] Gate nao liberado — redirecionando ao portao...');
              window.location.href = URL_RELATORIOS_ATAQUE;
              return true;
            }
            consumirGateCacadas();

            var modo = obterModoCacadasSessao();
            var alvoNome = obterAlvoNomeCacadasSessao();

            if (modo === 'classe' && cacadasEmTetoOcioso() && !seletorPorNivelDisponivel()) {
              if (processarFallbackBlacklistTetoOciosoSemClasse('modo classe sem seletor')) {
                return true;
              }
            }

            if (modo === 'firebase_fila' && alvoNome) {
              if (executarCacadaPorNome(alvoNome)) {
                  return true;
                }
              console.warn('[Firebase Fila] Formulario por_nome indisponivel — tentando caçada por nivel...');
            }

            if (modo === 'automacao_atacar' && alvoNome) {
              if (executarCacadaPorNome(alvoNome)) {
                return true;
              }
              console.warn('[Autom Atacante] Formulario por_nome indisponivel — tentando caçada por nivel...');
            }

            if (modo === 'blacklist' && alvoNome) {
              if (executarCacadaPorNome(alvoNome)) {
                return true;
              }
              console.warn('[Blacklist] Formulario por_nome indisponivel — tentando caçada por nivel...');
            }

            if (executarCacadaPorNivel()) {
              return true;
            }

            if (!blacklistCacadasAtiva()) {
              return processarCacadasSemFormularioNivel('Blacklist vazia');
            }

            if (modo === 'classe') {
              if (processarFallbackBlacklistTetoOciosoSemClasse('fallback final modo classe')) {
                return true;
              }
              return processarCacadasSemFormularioNivel(
                'Teto ocioso — sem seletor classe e blacklist indisponivel'
              );
            }

            return processarCacadasSemFormularioNivel('Blacklist ativa mas por_nome e por_nivel indisponiveis');
          }
        },
        {
          id: 'atacar',
          checar: function() {
            if (cacadasBloqueadaPorDiarioGerenciada()) return false;
            return urlAtual.indexOf('atacar') !== -1 && paginaConfirmacaoAtaque();
          },
          executar: function() {
            if (missaoNovoAtivo() && emFluxoAtaqueMissaoNovo()) {
              return processarMissaoNovoAtacar();
            }
            if (atacarAutomacoesAtacanteAtivo()) {
              restaurarModoAutomAtacanteSeNecessario();
              if (cacadaAtualPorNomeAutomacao()) {
                var btnAutom = document.querySelector('form[action="atacar"] input[type="submit"]');
                if (btnAutom && processarAutomAtacantePaginaAtacar(btnAutom)) return true;
              }
              console.warn('[Autom Atacante] /atacar sem alvo automacao — voltando ao portao.');
              irParaPortaoRelatorios('Autom atacante sem alvo em /atacar');
              return true;
            }
            if (redirecionarDiarioNoLugarDeCacadas('pagina atacar')) return true;
            if (atacarJaProcessado) return true;

            var btnAtacar = document.querySelector('form[action="atacar"] input[type="submit"]');
            if (!btnAtacar) return false;

            var resultado = validarAlvoAtacar();
            salvarUltimoAlvo(resultado.dados);

            if (!resultado.ok) {
              atacarJaProcessado = true;
              pularAlvoInvalido(resultado);
              return true;
            }

            if (!garantirHpParaAtacar('pagina atacar')) return true;
            if (!garantirDoujutsuParaAtacar('pagina atacar')) return true;

            atacarJaProcessado = true;
            atacarAlvoValido(resultado, btnAtacar);
            return true;
          }
        }
      ];

      var paginaEncontrada = false;

      for (var i = 0; i < paginasConhecidas.length; i++) {
        var pagina = paginasConhecidas[i];
        
        if (pagina.checar()) {
          paginaEncontrada = true;
          var sucessoAcao = pagina.executar();

          if (!sucessoAcao && pagina.id !== 'captcha_seguranca' && pagina.id !== 'combate') { 
            agendarReloadFalha('Falha de ação na página ' + pagina.id);
          }
          break;
        }
      }

      if (!paginaEncontrada) {
        if (missaoNovoDeveColetarRelatorio() && ehPaginaMensagens()) {
          processarMissaoNovoRelatorioColetar();
          return;
        }
        if (missaoNovoDeveValidarRelatorio() && ehPaginaMensagens()) {
          processarMissaoNovoRelatorioValidar();
          return;
        }
        if (missaoNovoAtivo() && emFluxoAtaqueMissaoNovo()) {
          if (processarInterrupcaoAtaqueMissaoNovoSemCombate(
              'pagina nao mapeada sem combate (' + urlAtual + ')')) {
            return;
          }
          console.warn('[Missao Novo] Pagina nao mapeada durante ataque (' + urlAtual +
            ') — voltando a /missoes.');
          window.location.href = URL_MISSOES;
          return;
        }
        redirecionarParaCacadas(urlAtual);
      }

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();