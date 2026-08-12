// ==UserScript==
// @name         Bot Invasor - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  Automação do Invasor: Validação de estado "Ainda não derrotado", disparos 10ms ao Firebase e print Discord.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = 20000;
  var TEMPO_RELOAD_PADRAO = 60000; // 1 minuto
  var TEMPO_RELOAD_GERENCIADA = 2000; // 2 segundos
  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var reloadAgendado = false;
  var jaAtacouNestaPagina = false;

  // URL do Webhook do Discord
  var DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1536968358195503224/lSz9-SrV7bPRk5B-RHrvPgn2Uij-hr7TLhgtOVx_0-5dfPVc6Kp2YMv5xG9SZvJxcsCO';

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

  // --- VERIFICA SE O INVASOR AINDA NÃO FOI DERROTADO ---
  function checarInvasorNaoDerrotado() {
    var linhas = document.querySelectorAll('tr');
    for (var i = 0; i < linhas.length; i++) {
      var textoLinha = linhas[i].innerText || linhas[i].textContent || '';
      if (textoLinha.indexOf('Derrotado por:') !== -1) {
        return textoLinha.indexOf('Ainda não derrotado') !== -1;
      }
    }
    // Caso a tabela não seja encontrada por algum motivo, assume false por segurança
    return false;
  }

  // --- CARREGA O HTML2CANVAS DINAMICAMENTE ---
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

  // --- ROLA ATÉ O FIM DA PÁGINA, CAPTURA E ENVIA PRINT PRO DISCORD ---
  async function capturarEEnviarPrintInferiorDiscord(motivo) {
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

        var formData = new FormData();
        formData.append('file', blob, 'print-invasor.png');
        formData.append('content', '🚨 **Invasor Detectado / Visão Inferior!**\n**Gatilho:** `' + motivo + '`\n**Usuário:** `' + USUARIO_FINAL + '`');

        fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          body: formData
        })
        .then(function(resposta) {
          if (resposta.ok) {
            console.log('[Discord] Print com scroll enviado com sucesso!');
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

  // --- BUSCA O BOTÃO DE ATAQUE NO DOM ---
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

  // --- ENVIA SINAL AO FIREBASE (1 IMEDIATO + 9 A CADA 10MS) E DEPOIS TIRA PRINT ---
  function enviarComandoAtaqueFirebase() {
    var urlComando = FIREBASE_CONFIG.databaseURL + '/comando_atacar.json';
    console.warn('[Firebase] Invasor ativo e sem botão/cooldown! Disparando o 1º aviso imediato e mais 9 a cada 10ms...');

    var payload = JSON.stringify('atacar');
    var headers = { 'Content-Type': 'application/json' };

    // 1ª Chamada: IMEDIATA (0ms de delay)
    fetch(urlComando, { method: 'PUT', headers: headers, body: payload });

    // Próximas 9 chamadas: Espaçadas a cada 10ms
    for (var i = 1; i <= 9; i++) {
      (function(index) {
        setTimeout(function() {
          fetch(urlComando, { method: 'PUT', headers: headers, body: payload });
        }, index * 10);
      })(i);
    }

    console.log('[Firebase] Requisições em massa disparadas! Rolando tela e capturando print...');
    
    // Rola para baixo e envia o print
    capturarEEnviarPrintInferiorDiscord('Ausência de Botão/Cooldown - Sinalização em Massa');
  }

  // --- EXECUTA ATÉ 15 TENTATIVAS DE LOCALIZAR E ATACAR O BOTÃO ---
  function tentarAtacarLocalmente(motivo) {
    if (jaAtacouNestaPagina) {
      console.warn('[Invasor] Ataque já disparado neste ciclo. Ignorando.');
      return;
    }

    var tentativas = 0;
    var maxTentativas = 15;

    console.log('[Invasor] Ordem remota recebida (' + motivo + '). Tentando encontrar o botão...');

    var timerBusca = setInterval(function() {
      tentativas++;
      var btnAtacar = obterBotaoAtaque();

      if (btnAtacar) {
        clearInterval(timerBusca);
        jaAtacouNestaPagina = true;

        console.log('[Invasor] Botão localizado na tentativa #' + tentativas + '! Clicando...');
        
        for (var c = 0; c < 5; c++) {
          btnAtacar.click();
        }

      } else if (tentativas >= maxTentativas) {
        clearInterval(timerBusca);
        console.error('[Invasor] Botão de ataque não foi encontrado após ' + maxTentativas + ' tentativas.');
      }
    }, 200);
  }

  // --- VERIFICAÇÃO DE ESTADO DA TELA ---
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

    // Só avisa o Firebase se NÃO tiver botão, NÃO tiver cooldown E o invasor AINDA NÃO tiver sido derrotado
    if (!temBotao && !temTimer && invasorAtivo) {
      console.warn('[Invasor] Invasor Ativo + Ausência de Botão/Cooldown detectada! Avisando Firebase...');
      enviarComandoAtaqueFirebase();
      return;
    }

    if (!invasorAtivo) {
      console.log('[Invasor] O invasor já foi derrotado. Nenhum comando enviado ao Firebase.');
    } else if (temBotao) {
      console.log('[Invasor] Botão de ataque presente. Aguardando sinal remoto do Firebase.');
    } else if (temTimer) {
      console.log('[Invasor] Conta em cooldown.');
    }
  }

  function checarContaGerenciada() {
    var linkVoltar = document.querySelector('a[href*="automacao?voltar=1"]');
    var possuiTextoGerenciada = document.body && document.body.innerHTML.indexOf("Você está jogando com a conta gerenciada") !== -1;

    if (linkVoltar || possuiTextoGerenciada) {
      console.log('[Invasor] Conta gerenciada detectada.');
      return true;
    }
    return false;
  }

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
          console.log('[Firebase - Invasor] Banco limpo com sucesso.');
        })
        .finally(function() {
          console.log('%c[Firebase - Invasor] ESCUTANDO COMANDO DE ATAQUE...', 'color: #00ff00; font-weight: bold;');

          campoAtaque.off();
          campoAtaque.on('value', function(snapshot) {
            var valor = snapshot.val();

            if (valor !== null && valor !== undefined && valor !== '') {
              var comando = String(valor).toLowerCase().trim();

              if (comando === 'atacar' || comando === '1') {
                console.log('[Firebase] Ordem de ataque recebida via Firebase!');
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

  console.log('[Script Invasor] Iniciado. Usuário ativo: ' + USUARIO_FINAL);

  setTimeout(function() {
    try {
      var urlAtual = window.location.href;
      var formLogin = document.getElementById('login');

      if (formLogin) {
        var selectServer = formLogin.querySelector('select[name="server_login"]');
        var inputUsuario = formLogin.querySelector('#usuario');
        var inputSenha = formLogin.querySelector('#senha');

        if (selectServer) {
          selectServer.value = '0';
          selectServer.dispatchEvent(new Event('change', { bubbles: true }));

          if (inputUsuario) {
            inputUsuario.value = USUARIO_FINAL;
            inputUsuario.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (inputSenha) {
            inputSenha.value = SENHA_FINAL;
            inputSenha.dispatchEvent(new Event('input', { bubbles: true }));
          }

          setTimeout(function() {
            var btnLogin = formLogin.querySelector('input[type="submit"]');
            if (btnLogin) btnLogin.click();
            else agendarReloadFalha('Botão de login não encontrado.');
          }, 2000);
        }
        return;
      }

      if (urlAtual.indexOf('invasor') !== -1) {
        iniciarEscutaFirebaseAtaque();
        verificarGatilhoAtaque();

        var tempoReloadAtual = checarContaGerenciada() ? TEMPO_RELOAD_GERENCIADA : TEMPO_RELOAD_PADRAO;

        console.log('[Script Invasor] Reload agendado para daqui a ' + (tempoReloadAtual / 1000) + ' segundo(s).');
        
        setTimeout(function() {
          location.reload();
        }, tempoReloadAtual);

        return;
      }

      redirecionarParaInvasor(urlAtual);

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();