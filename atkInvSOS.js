// ==UserScript==
// @name         Bot Invasor - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automação do Invasor/Combate com leitura da vida do boss, captcha Firebase, Discord e refresh de 1 min.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = 20000;
  var TEMPO_ESPERA_INVASOR_SEM_ATK = 60000;  // Ajustado para 1 minuto se não houver botão
  var TEMPO_ESPERA_POS_COMBATE = 60000;      // Ajustado para 1 minuto pós-combate
  var TEMPO_TIMEOUT_CAPTCHA = 600000;        // 10 minutos
  
  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
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

  // --- FUNÇÃO PARA SIMULAR DIGITAÇÃO HUMANA ---
  function digitarTexto(elementoInput, texto, callbackConcluido) {
    elementoInput.focus();
    elementoInput.value = '';

    var i = 0;
    function proximoCaractere() {
      if (i < texto.length) {
        elementoInput.value += texto.charAt(i);

        elementoInput.dispatchEvent(new Event('keydown', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('keypress', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('input', { bubbles: true }));
        elementoInput.dispatchEvent(new Event('keyup', { bubbles: true }));

        i++;
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

  // --- EXTRAÇÃO DE DADOS DA BATALHA ---
  function extrairDadosBatalha() {
    var textoCorpo = document.body ? document.body.innerText || document.body.textContent || '' : '';
    
    var hpRestante = 'Desconhecido';
    var danoCausado = 'N/A';
    var nomeInvasor = 'Invasor';

    // Extrai HP do Invasor
    var matchHp = textoCorpo.match(/HP restante do invasor:\s*([\d,]+%?)/i);
    if (matchHp) {
      hpRestante = matchHp[1];
    } else {
      var matchHpAlt = textoCorpo.match(/Energia Vital:\s*\|\s*([\d,]+%?)/i);
      if (matchHpAlt) hpRestante = matchHpAlt[1];
    }

    // Extrai Dano Causado
    var matchDano = textoCorpo.match(/causou\s*([\d.]+)\s*de dano/i);
    if (matchDano) {
      danoCausado = matchDano[1];
    }

    // Extrai Nome do Invasor
    var matchNome = textoCorpo.match(/O invasor\s+([A-Za-z0-9_\s]+)\s+AINDA NÃO/i);
    if (matchNome) {
      nomeInvasor = matchNome[1].trim();
    }

    return {
      hpRestante: hpRestante,
      danoCausado: danoCausado,
      nomeInvasor: nomeInvasor
    };
  }

  // --- DETECÇÃO DE ERROS DE SERVIDOR ---
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
      textoCorpo.indexOf('503 SERVICE UNVAILABLE') !== -1 ||
      textoCorpo.indexOf('504 GATEWAY TIMEOUT') !== -1
    ) {
      return 'Erro de Servidor detectado no HTML';
    }

    return null;
  }

  // --- ESCUTA DO FIREBASE PARA O CAPTCHA ---
  function iniciarEscutaFirebaseCaptcha() {
    console.log('[Firebase] Conectando ao Realtime Database...');

    function conectarEListen() {
      if (!window.firebase || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }

      var database = firebase.database();
      var campoComando = database.ref('comando_recebido');

      console.log('%c[Firebase] CONECTADO COM SUCESSO! AGUARDANDO CAPTCHA...', 'color: #00ff00; font-weight: bold;');

      campoComando.off();

      campoComando.on('value', function(snapshot) {
        var valor = snapshot.val();

        if (valor !== null && valor !== undefined && valor !== '') {
          var codigoCaptcha = String(valor).trim();
          console.log('%c[Firebase] CÓDIGO DO CAPTCHA RECEBIDO:', 'color: #ffff00; font-weight: bold;', codigoCaptcha);

          var inputCaptcha = document.querySelector('input[name="resposta"]') || 
                             document.querySelector('input[name="captcha"], input[name="codigo"], #captcha');

          if (inputCaptcha) {
            console.log('[Captcha] Iniciando simulação de digitação manual...');

            digitarTexto(inputCaptcha, codigoCaptcha, function() {
              console.log('[Captcha] Digitação concluída! Limpando o comando no Firebase...');

              var urlDelete = FIREBASE_CONFIG.databaseURL + '/comando_recebido.json';

              fetch(urlDelete, { method: 'DELETE' })
                .then(function() {
                  console.log('[Firebase] Comando apagado do banco com sucesso!');
                })
                .catch(function(err) {
                  console.warn('[Firebase] Erro ao apagar comando do banco:', err);
                })
                .finally(function() {
                  var delayClique = Math.floor(Math.random() * (700 - 300 + 1)) + 300;
                  
                  setTimeout(function() {
                    var formCaptcha = inputCaptcha.closest('form');
                    var btnConfirmar = formCaptcha ? formCaptcha.querySelector('input[type="submit"]') : null;

                    if (btnConfirmar) {
                      console.log('[Script] Clicando no botão Confirmar...');
                      btnConfirmar.click();
                    } else if (formCaptcha) {
                      console.log('[Script] Submetendo formulário do Captcha...');
                      formCaptcha.submit();
                    }
                  }, delayClique);
                });
            });

          } else {
            console.error('[Script] Campo de input do Captcha não encontrado na página.');
          }
        }
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

  // --- CAPTURA DE TELA E ENVIO DISCORD ---
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
            console.log('[Discord] Notificação enviada!');
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

  function redirecionarParaInvasor(motivo) {
    console.warn('[Script] PÁGINA NÃO MAPEADA (' + motivo + '). Redirecionando para Invasor...');
    window.location.href = URL_INVASOR;
  }

  console.log('[Script - Bot Invasor] Iniciado. Usuário ativo: ' + USUARIO_FINAL);

  setTimeout(function() {
    try {
      // 1. VERIFICAÇÃO DE ERRO NO SERVIDOR (HTTP 500)
      var erroServidor = checarErroServidor();
      if (erroServidor) {
        agendarReloadFalha(erroServidor);
        return;
      }

      var urlAtual = window.location.href;
      var formLogin = document.getElementById('login');

      var paginasConhecidas = [
        {
          id: 'captcha_seguranca',
          checar: function() { 
            return urlAtual.indexOf('captcha_seguranca') !== -1 || document.querySelector('form[action="captcha_seguranca"]') !== null; 
          },
          executar: function() {
            console.warn('[Script] Captcha detectado!');
            tocarAlertaSonoro();

            enviarNotificacaoDiscordComPrint(
              '⚠️ CAPTCHA DETECTADO! (Invasor)',
              'Verificação de segurança ativa.\n\n**URL:** ' + urlAtual + '\n**Painel:** ' + URL_PAINEL_GIT,
              '#FF0000'
            );

            iniciarEscutaFirebaseCaptcha();

            setTimeout(function() {
              console.warn('[Captcha] Tempo limite de 10 minutos esgotado! Redirecionando...');
              window.location.href = URL_INVASOR;
            }, TEMPO_TIMEOUT_CAPTCHA);

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
          id: 'invasor',
          checar: function() { 
            return urlAtual.indexOf('invasor') !== -1 && urlAtual.indexOf('invasor-combate') === -1; 
          },
          executar: function() {
            console.log('[Invasor] Verificando se há ataque disponível...');

            var btnAtacarInvasor = document.querySelector('form[action="invasor-combate"] input[type="submit"]') ||
                                   document.querySelector('form[action="invasor"] input[type="submit"]') ||
                                   document.querySelector('a[href*="invasor-combate"]');

            if (btnAtacarInvasor) {
              console.log('[Invasor] Botão de ataque encontrado! Atacando...');
              btnAtacarInvasor.click();
              return true;
            } else {
              console.log('[Invasor] Nenhum ataque disponível. Aguardando 1 minuto...');
              setTimeout(function() {
                console.log('[Invasor] 1 minuto passado. Atualizando a página...');
                location.reload();
              }, TEMPO_ESPERA_INVASOR_SEM_ATK);
              return true;
            }
          }
        },
        {
          id: 'invasor_combate',
          checar: function() { return urlAtual.indexOf('invasor-combate') !== -1; },
          executar: function() {
            console.log('[Invasor Combate] Processando relatório do combate...');

            var dados = extrairDadosBatalha();

            var mensagemDiscord = '⚔️ **Relatório do Ataque ao Boss (' + dados.nomeInvasor + ')**\n\n' +
                                  '❤️ **HP Restante do Invasor:** ' + dados.hpRestante + '\n' +
                                  '💥 **Dano Causado:** ' + dados.danoCausado + ' pts\n\n' +
                                  '⏳ *Aguardando 1 minuto para retornar e tentar novo ataque...*';

            enviarNotificacaoDiscordComPrint(
              '⚔️ ATAQUE AO BOSS EXECUTADO!',
              mensagemDiscord,
              '#00FF00'
            );

            console.log('[Invasor Combate] Aguardando 1 minuto para redirecionar...');
            setTimeout(function() {
              console.log('[Invasor Combate] 1 minuto concluído! Voltando para o Invasor...');
              window.location.href = URL_INVASOR;
            }, TEMPO_ESPERA_POS_COMBATE);

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

          if (!sucessoAcao && pagina.id !== 'login' && pagina.id !== 'captcha_seguranca') { 
            agendarReloadFalha('Falha de ação na página ' + pagina.id);
          }
          break;
        }
      }

      if (!paginaEncontrada) {
        redirecionarParaInvasor(urlAtual);
      }

    } catch (erro) {
      agendarReloadFalha('Erro inesperado: ' + erro.message);
    }
  }, TEMPO_ESPERA);

})();