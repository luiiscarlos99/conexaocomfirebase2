// ==UserScript==
// @name         Bot Invasor - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      4.7
// @description  Automação do Invasor: Trata Sessão Expirada, Limite configurável de derrotas, escuta/disparo Firebase e Discord.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '4.7';
  var SCRIPT_ATUALIZADO = '16/08/2026 21:25';

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
        try { return sessionStorage.getItem(BOT_KILL_KEY) === '1' ? 'off' : 'on'; } catch (e) { return 'on'; }
      }
    };
    window.botParar = window.__BOT_CONTROLE__.parar;
    window.botLigar = window.__BOT_CONTROLE__.ligar;
    window.botStatus = window.__BOT_CONTROLE__.status;
  }

  try {
    if (sessionStorage.getItem(BOT_KILL_KEY) === '1') {
      console.log('[Bot] Pausado nesta aba — botLigar() para reativar.');
      return;
    }
  } catch (e) {}

  function sincronizarModoAba() {
    try {
      var params = new URLSearchParams(window.location.search);
      var modo = params.get('bot_modo');
      if (modo === 'invasor' || modo === 'cacadas') {
        sessionStorage.setItem('BOT_MODO_ABA', modo);
        if (window.history && window.history.replaceState) {
          history.replaceState(null, document.title, location.pathname + location.hash);
        }
      }
    } catch (e) {}
  }

  function obterModoAba() {
    try {
      return sessionStorage.getItem('BOT_MODO_ABA') || '';
    } catch (e) {
      return '';
    }
  }

  function classificarPaginaInvasor(url) {
    var ehCombate = url.indexOf('invasor-combate') !== -1;
    var ehInvasor = url.indexOf('invasor') !== -1 && !ehCombate;
    var ehStatus = url.indexOf('/status') !== -1;
    var ehCaptcha = url.indexOf('captcha_seguranca') !== -1;

    return {
      ehCombate: ehCombate,
      ehInvasor: ehInvasor,
      ehStatus: ehStatus,
      ehCaptcha: ehCaptcha,
      noEscopo: ehCombate || ehInvasor || ehStatus || ehCaptcha
    };
  }

  function ehAbaInvasor() {
    return obterModoAba() === 'invasor';
  }

  sincronizarModoAba();

  if (!obterModoAba()) {
    console.log('[Script Invasor] Sem BOT_MODO_ABA — sem acao. Abra favorito com ?bot_modo=invasor.');
    return;
  }

  if (!ehAbaInvasor()) {
    console.log('[Script Invasor] BOT_MODO_ABA=cacadas — sem acao.');
    return;
  }

  var urlInicial = window.location.href;
  var paginaInicial = classificarPaginaInvasor(urlInicial);

  if (!paginaInicial.noEscopo && !document.getElementById('login')) {
    console.log('[Script Invasor] Pagina fora do escopo — sem acao.');
    return;
  }

  window.__BOT_INVASOR_ATIVO__ = paginaInicial.noEscopo;

  window.__BOT_BUILD_INVASOR__ = { versao: SCRIPT_VERSAO, atualizado: SCRIPT_ATUALIZADO };
  console.log(
    '%c[Bot Invasor] v' + SCRIPT_VERSAO + ' | atualizado: ' + SCRIPT_ATUALIZADO,
    'color:#3498db;font-weight:bold'
  );

  // --- CONFIGURAÇÕES DE TEMPO E LIMITES ---
  var LIMITE_PLAYERS_DERROTADOS = 99999999;      // Altere aqui o limite desejado!
  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = 20000;
  var TEMPO_RELOAD_PADRAO = 60000;          // 1 minuto
  var TEMPO_RELOAD_GERENCIADA = 2000;        // 2 segundos
  var TEMPO_ESPERA_POS_COMBATE = 60000;      // 1 minuto

  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var URL_HOME = 'https://shadowofshinobi.com/';
  var DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1536968358195503224/lSz9-SrV7bPRk5B-RHrvPgn2Uij-hr7TLhgtOVx_0-5dfPVc6Kp2YMv5xG9SZvJxcsCO';
  var DISCORD_COMBATE_SILENCIOSO = true; // flags 4096 = sem @ping/notificação push

  var reloadAgendado = false;
  var jaAtacouNestaPagina = false;

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

  // Credenciais do Usuário
  var USUARIO_DEFAULT = 'Shiroe';
  var USUARIO_FINAL = localStorage.getItem('BOT_USUARIO') || USUARIO_DEFAULT;
  var SENHA_DEFAULT = 'lulacarlos';
  var SENHA_FINAL = localStorage.getItem('BOT_SENHA') || SENHA_DEFAULT;

  // --- DETECTA USUÁRIO LOGADO NA SIDEBAR E SINCRONIZA localStorage ---
  function extrairNomeUsuarioLogado() {
    if (document.getElementById('login')) return null;

    var colEsquerda = document.getElementById('col_esquerda');
    if (!colEsquerda) return null;

    var tabelas = colEsquerda.querySelectorAll('table');
    for (var i = 0; i < tabelas.length; i++) {
      var tabela = tabelas[i];
      var info = tabela.querySelector('td.box_preto_cor_central');
      if (!info) continue;

      var textoInfo = info.innerText || info.textContent || '';
      if (textoInfo.indexOf('Vila:') === -1 || textoInfo.indexOf('HP:') === -1) continue;

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

    return null;
  }

  function sincronizarUsuarioLocalStorage() {
    var nomeLogado = extrairNomeUsuarioLogado();
    if (!nomeLogado) return;

    var nomeSalvo = localStorage.getItem('BOT_USUARIO');
    if (nomeSalvo !== nomeLogado) {
      localStorage.setItem('BOT_USUARIO', nomeLogado);
      console.log('[Script Invasor] BOT_USUARIO atualizado automaticamente: ' + nomeLogado);
    }

    USUARIO_FINAL = nomeLogado;
  }

  // --- CHECA SESSÃO EXPIRADA OU REQUISICÃO INVÁLIDA ---
  function checarSessaoExpirada() {
    var textoCorpo = (document.body ? document.body.innerText || document.body.textContent || '' : '').toLowerCase();
    var linkVoltar = document.querySelector('a[href*="history.back()"]');

    if (textoCorpo.indexOf('sessão expirada ou requisição inválida') !== -1 ||
        textoCorpo.indexOf('sessao expirada ou requisicao invalida') !== -1 ||
        linkVoltar) {
      console.warn('[Script Invasor] Sessao expirada — indo para login (caçadas reautentica)...');
      window.location.href = URL_HOME;
      return true;
    }
    return false;
  }

  // --- CHECA SE O INVASOR AINDA NÃO FOI DERROTADO ---
  function checarInvasorNaoDerrotado() {
    var linhas = document.querySelectorAll('tr');
    for (var i = 0; i < linhas.length; i++) {
      var textoLinha = linhas[i].innerText || linhas[i].textContent || '';
      if (textoLinha.indexOf('Derrotado por:') !== -1) {
        return textoLinha.indexOf('Ainda não derrotado') !== -1;
      }
    }
    return false;
  }

  // --- EXTRAIR QUANTIDADE DE PLAYERS DERROTADOS ---
  function obterPlayersDerrotados() {
    var textoCorpo = document.body ? document.body.innerText || document.body.textContent || '' : '';
    var matchDerrotados = textoCorpo.match(/Players derrotados:\s*([\d.]+)/i);
    if (matchDerrotados) {
      var numString = matchDerrotados[1].replace(/\./g, '');
      var valor = parseInt(numString, 10);
      return isNaN(valor) ? 0 : valor;
    }
    return 0;
  }

  // --- OBTÉM O BOTÃO DE ATAQUE NO DOM ---
  function obterBotaoAtaque() {
    var btn = null;

    var formInvasor = document.querySelector('form[action*="invasor"]');
    if (formInvasor) {
      btn = formInvasor.querySelector('input[type="submit"]') || 
            formInvasor.querySelector('button[type="submit"]') || 
            formInvasor.querySelector('input[value="Atacar"]');
      if (btn) return btn;
    }

    btn = document.querySelector('input[name="atacar"]') || 
          document.querySelector('input[value="Atacar"]') || 
          document.querySelector('button[name="atacar"]');
    if (btn) return btn;

    var candidatos = document.querySelectorAll('input[type="submit"], button');
    for (var i = 0; i < candidatos.length; i++) {
      var el = candidatos[i];
      var txt = (el.value || el.innerText || '').toLowerCase();
      if (txt.indexOf('atacar') !== -1) {
        return el;
      }
    }

    return null;
  }

  // --- CARREGA HTML2CANVAS DINAMICAMENTE ---
  function carregarBibliotecaPrint() {
    if (window.html2canvas) return Promise.resolve();

    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // --- ROLA A TELA E ENVIA PRINT PRO DISCORD ---
  async function capturarEEnviarPrintInferiorDiscord(motivo, silencioso) {
    if (!DISCORD_WEBHOOK_URL) return;

    try {
      window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);

      await new Promise(function(r) { setTimeout(r, 300); });
      await carregarBibliotecaPrint();

      var canvas = await html2canvas(document.body, { 
        logging: false, 
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY
      });

      canvas.toBlob(function(blob) {
        if (!blob) {
          console.error('[Discord] Falha ao gerar imagem (Blob nulo).');
          return;
        }

        var payload = {
          content: '🚨 **Invasor Detectado / Visão Inferior!**\n**Gatilho:** `' + motivo + '`\n**Usuário:** `' + USUARIO_FINAL + '`'
        };

        if (silencioso) {
          payload.flags = 4096; // SUPPRESS_NOTIFICATIONS — posta no canal sem notificar
        }

        var formData = new FormData();
        formData.append('payload_json', JSON.stringify(payload));
        formData.append('file', blob, 'print-invasor.png');

        fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          body: formData
        })
        .then(function(resposta) {
          if (resposta.ok) {
            console.log('[Discord] Print enviado com sucesso!' + (silencioso ? ' (silencioso)' : ''));
          } else {
            console.error('[Discord] Erro no Webhook:', resposta.status, resposta.statusText);
          }
        })
        .catch(function(erro) {
          console.error('[Discord] Erro de rede ao enviar print:', erro);
        });

      }, 'image/png');

    } catch (erro) {
      console.error('[Discord] Erro ao capturar print:', erro);
    }
  }

  // --- DISPARO EM MASSA AO FIREBASE (1 IMEDIATO + 9 A CADA 10MS) ---
  function enviarComandoAtaqueFirebase() {
    var urlComando = FIREBASE_CONFIG.databaseURL + '/comando_atacar.json';
    console.warn('[Firebase] Invasor ativo e sem botão/cooldown! Disparando o 1º aviso imediato e mais 9 a cada 10ms...');

    var payload = JSON.stringify('atacar');
    var headers = { 'Content-Type': 'application/json' };

    fetch(urlComando, { method: 'PUT', headers: headers, body: payload });

    for (var i = 1; i <= 9; i++) {
      (function(index) {
        setTimeout(function() {
          fetch(urlComando, { method: 'PUT', headers: headers, body: payload });
        }, index * 10);
      })(i);
    }

    console.log('[Firebase] Requisições em massa disparadas! Capturando print...');
    capturarEEnviarPrintInferiorDiscord('Ausência de Botão/Cooldown - Sinalização em Massa');
  }

  // --- CHECA CONDIÇÃO DA TELA E DISPARA FIREBASE SE NECESSÁRIO ---
  function verificarGatilhoAtaque() {
    var btnAtacar = obterBotaoAtaque();
    var elementoTimer = document.querySelector('[id^="inv_cd_timer_"]');
    var invasorAtivo = checarInvasorNaoDerrotado();

    var temBotao = !!btnAtacar;
    var temTimer = elementoTimer !== null;

    console.log('[Invasor Checklist]', {
      temBotao: temBotao,
      temTimer: temTimer,
      invasorAtivo: invasorAtivo
    });

    if (!temBotao && !temTimer && invasorAtivo) {
      console.warn('[Invasor] Invasor Ativo + Ausência de Botão/Cooldown! Avisando Firebase...');
      enviarComandoAtaqueFirebase();
      return;
    }

    if (!invasorAtivo) {
      console.log('[Invasor] O invasor já foi derrotado.');
    } else if (temBotao) {
      console.log('[Invasor] Botão de ataque presente.');
    } else if (temTimer) {
      console.log('[Invasor] Conta em cooldown.');
    }
  }

  // --- EXECUTA ATAQUE LOCALMENTE (REDE OU COMANDO FIREBASE) ---
  function tentarAtacarLocalmente(motivo) {
    if (jaAtacouNestaPagina) {
      console.warn('[Invasor] Ataque já disparado neste ciclo. Ignorando.');
      return;
    }
    jaAtacouNestaPagina = true;

    var tentativas = 0;
    var maxTentativas = 15;

    console.log('[Invasor] Solicitando ataque local (' + motivo + '). Tentando encontrar o botão...');

    var timerBusca = setInterval(function() {
      tentativas++;
      var btnAtacar = obterBotaoAtaque();

      if (btnAtacar) {
        clearInterval(timerBusca);

        console.log('[Invasor] Botão localizado na tentativa #' + tentativas + '! Clicando...');
        
        for (var c = 0; c < 5; c++) {
          btnAtacar.click();
        }

      } else if (tentativas >= maxTentativas) {
        clearInterval(timerBusca);
        console.error('[Invasor] Botão de ataque não encontrado após ' + maxTentativas + ' tentativas.');
      }
    }, 200);
  }

  // --- ESCUTA COMANDOS DE ATAQUE VINDO DO FIREBASE ---
  function iniciarEscutaFirebaseAtaque() {
    console.log('[Firebase - Invasor] Conectando ao Realtime Database...');

    function conectarEListen() {
      if (!window.firebase || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }

      var database = firebase.database();
      var campoAtaque = database.ref('comando_atacar');
      var urlDelete = FIREBASE_CONFIG.databaseURL + '/comando_atacar.json';

      fetch(urlDelete, { method: 'DELETE' })
        .then(function() {
          console.log('[Firebase - Invasor] Banco de comandos de ataque limpo.');
        })
        .finally(function() {
          console.log('%c[Firebase - Invasor] ESCUTANDO COMANDO DE ATAQUE...', 'color: #00ff00; font-weight: bold;');

          campoAtaque.off();
          campoAtaque.on('value', function(snapshot) {
            var valor = snapshot.val();

            if (valor !== null && valor !== undefined && valor !== '') {
              var comando = String(valor).toLowerCase().trim();

              if (comando === 'atacar' || comando === '1') {
                campoAtaque.off();
                console.log('%c[Firebase] Ordem de ataque REMOTA recebida!', 'color: #ffff00; font-weight: bold;');
                fetch(urlDelete, { method: 'DELETE' }).finally(function() {
                  tentarAtacarLocalmente('Sinal Firebase Recebido');
                });
              }
            }
          });
        });
    }

    if (window.firebase && window.firebase.database) {
      conectarEListen();
    } else {
      var scriptApp = document.createElement('script');
      scriptApp.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
      scriptApp.onload = function() {
        var scriptDb = document.createElement('script');
        scriptDb.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js';
        scriptDb.onload = conectarEListen;
        document.head.appendChild(scriptDb);
      };
      document.head.appendChild(scriptApp);
    }
  }

  // --- CHECA SE É CONTA GERENCIADA ---
  function checarContaGerenciada() {
    var linkVoltar = document.querySelector('a[href*="automacao?voltar=1"]');
    var possuiTextoGerenciada = document.body && document.body.innerHTML.indexOf("Você está jogando com a conta gerenciada") !== -1;
    return !!(linkVoltar || possuiTextoGerenciada);
  }

  // --- DETECÇÃO DE ERRO DE SERVIDOR ---
  function checarErroServidor() {
    var elErro = document.querySelector('.error-code');
    if (elErro) {
      var txtErro = (elErro.innerText || elErro.textContent || '').toUpperCase();
      if (txtErro.indexOf('HTTP ERROR') !== -1 || txtErro.indexOf('500') !== -1) return true;
    }
    var textoCorpo = (document.body ? document.body.innerText || document.body.textContent || '' : '').toUpperCase();
    return (
      textoCorpo.indexOf('HTTP ERROR 500') !== -1 ||
      textoCorpo.indexOf('500 INTERNAL SERVER ERROR') !== -1 ||
      textoCorpo.indexOf('502 BAD GATEWAY') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNAVAILABLE') !== -1 ||
      textoCorpo.indexOf('503 SERVICE UNVAILABLE') !== -1 ||
      textoCorpo.indexOf('504 GATEWAY TIMEOUT') !== -1
    );
  }

  function tocarAlertaSonoro() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      [0, 0.3, 0.6].forEach(function(delay) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + delay + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {}
  }

  function agendarReloadFalha(motivo) {
    if (reloadAgendado) return;
    reloadAgendado = true;
    console.warn('[Script Invasor] FALHA: ' + motivo);
    setTimeout(function() { location.reload(); }, TEMPO_RELOAD_FALHA);
  }

  function redirecionarParaInvasor(motivo) {
    console.warn('[Script Invasor] Redirecionando para Invasor (' + motivo + ')...');
    window.location.href = URL_INVASOR;
  }

  console.log('[Script Invasor] Usuário: ' + USUARIO_FINAL);

  setTimeout(function() {
    try {
      sincronizarModoAba();

      if (!ehAbaInvasor()) {
        return;
      }

      if (document.getElementById('login')) {
        console.log('[Script Invasor] Tela de login — sem acao (caçadas faz login).');
        return;
      }

      var urlAtual = window.location.href;

      var pagina = classificarPaginaInvasor(urlAtual);

      if (!pagina.noEscopo) {
        console.log('[Script Invasor] Pagina fora do escopo — sem acao.');
        return;
      }

      window.__BOT_INVASOR_ATIVO__ = true;

      sincronizarUsuarioLocalStorage();

      if (checarSessaoExpirada()) {
        return;
      }

      if (checarErroServidor()) {
        agendarReloadFalha('Erro de Servidor 500/502/503/504 detectado.');
        return;
      }

      // 1. CAPTCHA — delegado ao atkSOS.js (evita Discord/Firebase duplicado)
      if (pagina.ehCaptcha || document.querySelector('form[action="captcha_seguranca"]')) {
        console.log('[Script Invasor] Captcha — sem acao (delegado ao atkSOS).');
        return;
      }

      // Login fica a cargo do atkSOS.js (home não está no filtro desta extensão)

      // 2. TELA DO INVASOR (PRINCIPAL)
      if (pagina.ehInvasor) {
        iniciarEscutaFirebaseAtaque();
        verificarGatilhoAtaque();

        var qtdDerrotados = obterPlayersDerrotados();
        console.log('[Invasor] Players derrotados atual: ' + qtdDerrotados + ' (Limite local: ' + LIMITE_PLAYERS_DERROTADOS + ')');

        // Se players derrotados for MENOR ou IGUAL ao limite, tenta o ataque pelo botão local
        if (qtdDerrotados <= LIMITE_PLAYERS_DERROTADOS) {
          tentarAtacarLocalmente('Ataque Local Automático (<= ' + LIMITE_PLAYERS_DERROTADOS + ' derrotas)');
        } else {
          console.warn('[Invasor] Derrotas (' + qtdDerrotados + ') > Limite (' + LIMITE_PLAYERS_DERROTADOS + '). Botão local desativado! Aguardando Firebase...');
        }

        // Agenda Refresh Padrão
        var tempoReloadAtual = checarContaGerenciada() ? TEMPO_RELOAD_GERENCIADA : TEMPO_RELOAD_PADRAO;
        console.log('[Script Invasor] Reload agendado para daqui a ' + (tempoReloadAtual / 1000) + 's.');
        
        setTimeout(function() {
          location.reload();
        }, tempoReloadAtual);

        return;
      }

      // 3. TELA PÓS-COMBATE
      if (pagina.ehCombate) {
        console.log('[Invasor Combate] Batalha concluída. Aguardando 1 min para retornar...');
        capturarEEnviarPrintInferiorDiscord('Relatório de Combate Concluído', DISCORD_COMBATE_SILENCIOSO);

        setTimeout(function() {
          window.location.href = URL_INVASOR;
        }, TEMPO_ESPERA_POS_COMBATE);
        return;
      }

      // 4. STATUS → redireciona para invasor
      if (pagina.ehStatus) {
        redirecionarParaInvasor('status');
        return;
      }

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();