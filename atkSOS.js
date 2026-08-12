var TEMPO_ESPERA = 2000;
var TEMPO_RELOAD_FALHA = 20000;
var TEMPO_ESPERA_INVASOR = 120000; // 2 minutos (em milissegundos)
var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
var DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1536968358195503224/lSz9-SrV7bPRk5B-RHrvPgn2Uij-hr7TLhgtOVx_0-5dfPVc6Kp2YMv5xG9SZvJxcsCO';
var URL_PAINEL_GIT = 'https://luiiscarlos99.github.io/conexaocomfirebase2/firebase?codigo=';
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

// --- FUNÇÃO PARA ESCUTAR O FIREBASE, PREENCHER, APAGAR DO BANCO E SUBMETER O CAPTCHA ---
function iniciarEscutaFirebaseCaptcha() {
  console.log('[Firebase] Conectando ao Realtime Database...');

  function conectarEListen() {
    if (!window.firebase || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    var database = firebase.database();
    var campoComando = database.ref('comando_recebido');

    console.log('%c[Firebase] CONECTADO COM SUCESSO! AGUARDANDO CAPTCHA...', 'color: #00ff00; font-weight: bold;');

    // Limpa listeners antigos
    campoComando.off();

    campoComando.on('value', function(snapshot) {
      var valor = snapshot.val();

      if (valor !== null && valor !== undefined && valor !== '') {
        console.log('%c[Firebase] CÓDIGO DO CAPTCHA RECEBIDO:', 'color: #ffff00; font-weight: bold;', valor);

        // Mapeia o campo exato pelo HTML fornecido (name="resposta")
        var inputCaptcha = document.querySelector('input[name="resposta"]') || 
                           document.querySelector('input[name="captcha"], input[name="codigo"], #captcha');

        if (inputCaptcha) {
          // Preenche o campo de texto
          inputCaptcha.value = valor;
          inputCaptcha.dispatchEvent(new Event('input', { bubbles: true }));
          inputCaptcha.dispatchEvent(new Event('change', { bubbles: true }));

          // 1. Apaga a chave no Firebase via API REST para evitar reaplicação do código
          var urlDelete = FIREBASE_CONFIG.databaseURL + '/comando_recebido.json';

          fetch(urlDelete, { method: 'DELETE' })
            .then(function() {
              console.log('[Firebase] Comando apagado do banco com sucesso!');
            })
            .catch(function(err) {
              console.warn('[Firebase] Erro ao apagar comando do banco:', err);
            })
            .finally(function() {
              // 2. Notifica via alerta na tela
              alert('CÓDIGO RECEBIDO E LIMPO DO BANCO:\n\n' + valor);

              // 3. Submete o formulário
              var formCaptcha = inputCaptcha.closest('form');
              var btnConfirmar = formCaptcha ? formCaptcha.querySelector('input[type="submit"]') : null;

              if (btnConfirmar) {
                console.log('[Script] Clicando no botão Confirmar...');
                btnConfirmar.click();
              } else if (formCaptcha) {
                console.log('[Script] Submetendo formulário do Captcha...');
                formCaptcha.submit();
              }
            });

        } else {
          console.error('[Script] Campo de input do Captcha não encontrado na página.');
        }
      }
    });
  }

  // Carregamento sequencial dos scripts do Firebase v8 Compat
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

// --- FUNÇÃO DE CAPTURA DE TELA E ENVIO PARA O DISCORD ---
function enviarNotificacaoDiscordComPrint(titulo, descricao, corHex, callback) {
  if (typeof html2canvas === 'undefined') {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = function() {
      processarEnvioDiscord(titulo, descricao, corHex, callback);
    };
    document.head.appendChild(script);
  } else {
    processarEnvioDiscord(titulo, descricao, corHex, callback);
  }
}

function processarEnvioDiscord(titulo, descricao, corHex, callback) {
  html2canvas(document.body).then(function(canvas) {
    canvas.toBlob(function(blob) {
      if (!blob) {
        if (callback) callback();
        return;
      }

      var corDecimal = parseInt((corHex || '#7289DA').replace('#', ''), 16);
      
      var payloadData = {
        username: 'Bot Shadow of Shinobi',
        embeds: [
          {
            title: titulo,
            description: descricao,
            color: corDecimal,
            timestamp: new Date().toISOString(),
            image: {
              url: 'attachment://captura.png'
            },
            footer: {
              text: 'Usuário: ' + USUARIO_FINAL
            }
          }
        ]
      };

      var formData = new FormData();
      formData.append('payload_json', JSON.stringify(payloadData));
      formData.append('file', blob, 'captura.png');

      fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      })
      .then(function(resposta) {
        if (resposta.ok) {
          console.log('[Discord] Print e notificação enviados!');
        }
        if (callback) callback();
      })
      .catch(function(erro) {
        console.error('[Discord] Erro ao enviar Webhook:', erro);
        if (callback) callback();
      });
    }, 'image/png');
  }).catch(function(err) {
    console.warn('[Script] Erro no html2canvas:', err);
    if (callback) callback();
  });
}

// --- ALERTA SONORO ---
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
  } catch (e) {
    console.warn('[Script] Erro ao tocar alerta sonoro:', e);
  }
}

function agendarReloadFalha(motivo) {
  if (reloadAgendado) return;
  reloadAgendado = true;

  console.warn('[Script] FALHA DE EXECUÇÃO: ' + motivo);
  setTimeout(function() {
    location.reload();
  }, TEMPO_RELOAD_FALHA);
}

function redirecionarParaCacadas(motivo) {
  console.warn('[Script] PÁGINA NÃO MAPEADA (' + motivo + '). Redirecionando...');
  window.location.href = URL_CACADAS;
}

console.log('[Script] Iniciado. Usuário ativo: ' + USUARIO_FINAL);

setTimeout(function() {
  try {
    var urlAtual = window.location.href;
    var formLogin = document.getElementById('login');

    var paginasConhecidas = [
      {
        id: 'captcha_seguranca',
        checar: function() { 
          return urlAtual.indexOf('captcha_seguranca') !== -1 || document.querySelector('form[action="captcha_seguranca"]') !== null; 
        },
        executar: function() {
          console.warn('[Script] Captcha detectado! Enviando print ao Discord e aguardando código...');
          tocarAlertaSonoro();

          // Envia o print com a imagem do captcha e o link direto para o formulário
          enviarNotificacaoDiscordComPrint(
            '⚠️ CAPTCHA DETECTADO!',
            'Verificação de segurança ativa na página.\n\n**URL do Jogo:** ' + urlAtual + '\n**Link do Painel Captcha:** ' + URL_PAINEL_GIT,
            '#FF0000'
          );

          // Escuta o Firebase para preencher, apagar do banco e enviar o form
          iniciarEscutaFirebaseCaptcha();
          
          return true; 
        }
      },
      {
        id: 'invasor',
        checar: function() { return urlAtual.indexOf('invasor') !== -1; },
        executar: function() {
          console.warn('[Script] Página do Invasor acessada. Envio de imagem desativado temporariamente.');
          console.log('[Script] Aguardando 2 minutos para redirecionar para Caçadas...');

          setTimeout(function() {
            console.log('[Script] Tempo de espera do Invasor concluído. Redirecionando para Caçadas...');
            window.location.href = URL_CACADAS;
          }, TEMPO_ESPERA_INVASOR);

          return true;
        }
      },
      {
        id: 'login',
        checar: function() { return !!formLogin; },
        executar: function() {
          var selectServer = formLogin.querySelector('select[name="server_login"]');
          var inputUsuario = formLogin.querySelector('#usuario');
          var inputSenha = formLogin.querySelector('#senha');

          if (selectServer) {
            selectServer.value = '0';
            selectServer.dispatchEvent(new Event('change', { bubbles: true }));

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

            setTimeout(function() {
              var btnLogin = formLogin.querySelector('input[type="submit"]');
              if (btnLogin) {
                btnLogin.click();
              } else {
                agendarReloadFalha('Botão de login não encontrado.');
              }
            }, 2000);
            return true;
          }
          return false;
        }
      },
      {
        id: 'cacadas',
        checar: function() { return urlAtual.indexOf('cacadas') !== -1; },
        executar: function() {
          var selectNivel = document.getElementById('por_nivel');

          if (selectNivel) {
            selectNivel.value = '1';
            selectNivel.dispatchEvent(new Event('change', { bubbles: true }));

            var formNivel = selectNivel.closest('form');
            if (formNivel) {
              var btnSubmit = formNivel.querySelector('input[type="submit"]');
              if (btnSubmit) {
                btnSubmit.click();
                return true;
              }
            }
          }
          return false;
        }
      },
      {
        id: 'atacar',
        checar: function() { return urlAtual.indexOf('atacar') !== -1; },
        executar: function() {
          var btnAtacar = document.querySelector('form[action="atacar"] input[type="submit"]');

          if (btnAtacar) {
            btnAtacar.click();
            return true;
          }
          return false;
        }
      }
    ];

    var paginaEncontrada = false;

    for (var i = 0; i < paginasConhecidas.length; i++) {
      var pagina = paginasConhecidas[i];
      
      if (pagina.checar()) {
        paginaEncontrada = true;
        var sucessoAcao = pagina.executar();

        if (!sucessoAcao && pagina.id !== 'login' && pagina.id !== 'captcha_seguranca' && pagina.id !== 'invasor') { 
          agendarReloadFalha('Falha de ação na página ' + pagina.id);
        }
        break;
      }
    }

    if (!paginaEncontrada) {
      redirecionarParaCacadas(urlAtual);
    }

  } catch (erro) {
    agendarReloadFalha('Erro inesperado: ' + erro.message);
  }
}, TEMPO_ESPERA);