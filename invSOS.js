var TEMPO_ESPERA = 2000;
var TEMPO_RELOAD_FALHA = 20000;
var TEMPO_RELOAD_PADRAO = 60000; // 1 minuto por padrão
var TEMPO_RELOAD_GERENCIADA = 2000; // 2 segundos se for conta gerenciada
var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
var reloadAgendado = false;

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

// --- FUNÇÃO PARA DISPARAR 10 ATAQUES SEGUIDOS (1ms) ---
function executarAtaqueCombo() {
  var btnAtacar = document.querySelector('form[action*="invasor"] input[type="submit"]') ||
                  document.querySelector('form[action*="atacar"] input[type="submit"]') ||
                  document.querySelector('input[type="submit"][value*="Atacar"]') ||
                  document.querySelector('button[type="submit"]');

  if (!btnAtacar) {
    console.error('[Invasor] Botão de ataque não encontrado para executar o combo.');
    return;
  }

  console.log('[Invasor] Gatilho acionado! Iniciando combo de 10 ataques (1ms)...');
  
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
}

// --- VERIFICAÇÃO DE MENSAGENS E ESTADOS DA TELA ---
function verificarGatilhosAtaque() {
  var textoPagina = document.body ? document.body.innerText : '';

  // 1. Mensagem de bloqueio por vital da imagem
  var textoVital = "Contas em automação não podem atacar o invasor quando a vital dele está abaixo de 30.000";
  if (textoPagina.indexOf(textoVital) !== -1) {
    console.warn('[Invasor] Alerta de Vital detectado na tela! Disparando ataque...');
    executarAtaqueCombo();
    return true;
  }

  // 2. Verifica ausência do botão e do tempo de espera ("próximo ataque")
  var btnAtacar = document.querySelector('form[action*="invasor"] input[type="submit"]') ||
                  document.querySelector('form[action*="atacar"] input[type="submit"]') ||
                  document.querySelector('input[type="submit"][value*="Atacar"]') ||
                  document.querySelector('button[type="submit"]');

  var temProximoAtaque = textoPagina.toLowerCase().indexOf("próximo ataque") !== -1 || 
                         textoPagina.toLowerCase().indexOf("proximo ataque") !== -1;

  if (!btnAtacar && !temProximoAtaque) {
    console.warn('[Invasor] Nem o botão nem o texto de "próximo ataque" foram encontrados. Disparando ataque...');
    executarAtaqueCombo();
    return true;
  }

  return false;
}

// --- VERIFICAÇÃO DA CONTA GERENCIADA ---
function checarContaGerenciada() {
  var linkVoltar = document.querySelector('a[href*="automacao?voltar=1"]');
  var possuiTextoGerenciada = document.body && document.body.innerText.indexOf("Você está jogando com a conta gerenciada") !== -1;

  if (linkVoltar || possuiTextoGerenciada) {
    console.log('[Invasor] Conta gerenciada detectada na página!');
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
              fetch(urlDelete, { method: 'DELETE' }).finally(function() {
                executarAtaqueCombo();
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

      // A) Checa as condições na tela (mensagem de vital ou ausência de botão + próximo ataque)
      verificarGatilhosAtaque();

      // B) Inicia a escuta no Firebase para o comando manual/remoto
      iniciarEscutaFirebaseAtaque();

      // C) Define o tempo de reload (2s para conta gerenciada, 1m padrão)
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