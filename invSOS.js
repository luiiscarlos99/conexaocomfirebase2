// ==UserScript==
// @name         Bot Invasor - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Monitor de Invasor via Firebase com busca de botão otimizada para abas em segundo plano
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

  // --- CAPTURA O PRINT E ENVIA AO DISCORD ---
  async function capturarEEnviarPrintDiscord(motivo) {
    if (!DISCORD_WEBHOOK_URL) return;

    try {
      await carregarBibliotecaPrint();

      var canvas = await html2canvas(document.body, { logging: false, useCORS: true });

      canvas.toBlob(async function(blob) {
        if (!blob) return;

        var formData = new FormData();
        formData.append('file', blob, 'print-invasor.png');
        formData.append('content', '⚔️ **Ataque disparado no Invasor!**\n**Gatilho:** `' + motivo + '`\n**Usuário:** `' + USUARIO_FINAL + '`');

        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          body: formData
        });

        console.log('[Discord] Print enviado com sucesso!');
      }, 'image/png');

    } catch (erro) {
      console.error('[Discord] Erro ao enviar print:', erro);
    }
  }

  // --- BUSCA O BOTÃO DE ATAQUE NA TELA (MÉTODO AMPLIADO & SEGURO PARA ABAS EM SEGUNDO PLANO) ---
  function obterBotaoAtaque() {
    var btn = null;

    // 1. Tenta dentro do formulário do invasor
    var formInvasor = document.querySelector('form[action*="invasor"]');
    if (formInvasor) {
      btn = formInvasor.querySelector('input[type="submit"]') || 
            formInvasor.querySelector('button[type="submit"]') ||
            formInvasor.querySelector('input[value="Atacar"]');
      if (btn) return btn;
    }

    // 2. Busca direta por name ou value
    btn = document.querySelector('input[name="atacar"]') || 
          document.querySelector('input[value="Atacar"]') ||
          document.querySelector('button[name="atacar"]');
    if (btn) return btn;

    // 3. Varredura por texto "atacar" em qualquer input submit ou button
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

  // --- ENVIA COMANDO DE ATAQUE PARA O FIREBASE VIA REST ---
  function enviarComandoAtaqueFirebase() {
    var urlComando = FIREBASE_CONFIG.databaseURL + '/comando_atacar.json';
    console.warn('[Firebase] Nem botão nem cooldown na tela. Enviando "atacar" para a rede...');

    fetch(urlComando, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('atacar')
    })
    .then(function() {
      console.log('[Firebase] Comando "atacar" enviado com sucesso!');
    })
    .catch(function(err) {
      console.error('[Firebase] Erro ao enviar comando "atacar":', err);
    });
  }

  // --- FUNÇÃO PARA DISPARAR 10 ATAQUES SEGUIDOS COM TENTATIVAS DE REBUSCA DO BOTÃO ---
  function executarAtaqueCombo(motivo) {
    if (jaAtacouNestaPagina) {
      console.warn('[Invasor] Ataque já foi disparado neste ciclo. Ignorando.');
      return;
    }

    var tentativas = 0;
    var maxTentativas = 15; // Tenta por 3 segundos (15 x 200ms)

    var timerBusca = setInterval(function() {
      tentativas++;
      var btnAtacar = obterBotaoAtaque();

      if (btnAtacar) {
        clearInterval(timerBusca);
        jaAtacouNestaPagina = true;

        console.log('[Invasor] Botão localizado! Executando combo (' + motivo + ')...');
        capturarEEnviarPrintDiscord(motivo);

        var disparos = 0;
        var intervalo = setInterval(function() {
          disparos++;
          btnAtacar.click();
          console.log('[Invasor] Ataque disparado #' + disparos);

          if (disparos >= 10) {
            clearInterval(intervalo);
            console.log('[Invasor] Combo de 10 ataques finalizado!');
          }
        }, 1);

      } else if (tentativas >= maxTentativas) {
        clearInterval(timerBusca);
        console.error('[Invasor] Botão de ataque não encontrado no DOM após várias tentativas.');
      }
    }, 200);
  }

  // --- VERIFICAÇÃO DE ESTADO ---
  function verificarGatilhoAtaque() {
    var btnAtacar = obterBotaoAtaque();
    var elementoTimer = document.querySelector('[id^="inv_cd_timer_"]');
    
    var temBotao = !!btnAtacar;
    var temTimer = elementoTimer !== null;

    console.log('[Invasor Checklist]', {
      temBotao: temBotao,
      temTimer: temTimer
    });

    // REGRA: SE NÃO TEM COOLDOWN E NÃO TEM BOTÃO -> NOTIFICA O FIREBASE
    if (!temBotao && !temTimer) {
      console.warn('[Invasor] Ausência de Botão e Cooldown detectada! Notificando Firebase...');
      enviarComandoAtaqueFirebase();
      return;
    }

    if (temBotao) {
      console.log('[Invasor] Botão de ataque está presente. Aguardando sinal via Firebase.');
    } else if (temTimer) {
      console.log('[Invasor] Conta em cooldown de ataque.');
    }
  }

  // --- VERIFICAÇÃO DA CONTA GERENCIADA ---
  function checarContaGerenciada() {
    var linkVoltar = document.querySelector('a[href*="automacao?voltar=1"]');
    var possuiTextoGerenciada = document.body && document.body.innerHTML.indexOf("Você está jogando com a conta gerenciada") !== -1;

    if (linkVoltar || possuiTextoGerenciada) {
      console.log('[Invasor] Conta gerenciada detectada.');
      return true;
    }
    return false;
  }

  // --- ESCUTA NO FIREBASE ---
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
                console.log('[Firebase] Comando de ataque recebido do Firebase!');
                fetch(urlDelete, { method: 'DELETE' }).finally(function() {
                  executarAtaqueCombo('Ordem Remota via Firebase');
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

      // 1. TELA DE LOGIN
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

      // 2. TELA DO INVASOR
      if (urlAtual.indexOf('invasor') !== -1) {

        // A) Inicia a escuta remota do Firebase
        iniciarEscutaFirebaseAtaque();

        // B) Checa estado da página (Manda pro Firebase se !botão e !timer)
        verificarGatilhoAtaque();

        // C) Define a velocidade de reload
        var tempoReloadAtual = checarContaGerenciada() ? TEMPO_RELOAD_GERENCIADA : TEMPO_RELOAD_PADRAO;

        console.log('[Script Invasor] Reload agendado para daqui a ' + (tempoReloadAtual / 1000) + ' segundo(s).');
        
        setTimeout(function() {
          location.reload();
        }, tempoReloadAtual);

        return;
      }

      // 3. QUALQUER OUTRA PÁGINA
      redirecionarParaInvasor(urlAtual);

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();