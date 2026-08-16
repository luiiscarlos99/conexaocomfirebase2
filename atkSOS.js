// ==UserScript==
// @name         Bot Atacar - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      2.8
// @description  Automação do Caçadas/Atacar com digitação simulada de Captcha, atraso aleatório, timeout de Captcha (10min) e Firebase.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '2.8';
  var SCRIPT_ATUALIZADO = '16/08/2026 20:40';

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

  window.__BOT_BUILD_CACADAS__ = { versao: SCRIPT_VERSAO, atualizado: SCRIPT_ATUALIZADO };
  console.log(
    '%c[Bot Caçadas] v' + SCRIPT_VERSAO + ' | atualizado: ' + SCRIPT_ATUALIZADO,
    'color:#2ecc71;font-weight:bold'
  );

  try {
    if (sessionStorage.getItem(BOT_KILL_KEY) === '1') {
      console.log('[Bot] Pausado nesta aba — botLigar() para reativar.');
      return;
    }
  } catch (e) {}

  // Credenciais via URL (?bot_user=&bot_pass=&bot_nivel=) — launcher / modo anônimo
  try {
    var params = new URLSearchParams(window.location.search);
    var u = params.get('bot_user');
    var p = params.get('bot_pass');
    var n = params.get('bot_nivel');
    if (u) localStorage.setItem('BOT_USUARIO', u);
    if (p) localStorage.setItem('BOT_SENHA', p);
    if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
    if ((u || p || n) && window.history && window.history.replaceState) {
      history.replaceState(null, document.title, location.pathname + location.hash);
    }
  } catch (e) {}

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = 20000;
  var TEMPO_TIMEOUT_CAPTCHA = 600000; // 10 minutos (60 * 10 * 1000)
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1536968358195503224/lSz9-SrV7bPRk5B-RHrvPgn2Uij-hr7TLhgtOVx_0-5dfPVc6Kp2YMv5xG9SZvJxcsCO';
  var URL_PAINEL_BASE = 'https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html';
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

  // Credenciais do Usuário e Configuração de Caçadas
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
      console.log('[Script] BOT_USUARIO atualizado automaticamente: ' + nomeLogado);
    }

    USUARIO_FINAL = nomeLogado;
  }

  // Nível da Caçada (Lê do localStorage ou usa '2' como padrão)
  var NIVEL_CACADAS_DEFAULT = '2';
  var NIVEL_CACADAS_FINAL = localStorage.getItem('BOT_NIVEL_CACADAS') || NIVEL_CACADAS_DEFAULT;

  // --- FUNÇÃO PARA GERAR OU OBTER O CÓDIGO ÚNICO DO SERVIDOR/SESSÃO ---
  function obterCodigoServidor() {
    var codigo = localStorage.getItem('BOT_CODIGO_SERVIDOR');
    if (!codigo) {
      codigo = 'SRV_' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem('BOT_CODIGO_SERVIDOR', codigo);
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
      textoCorpo.indexOf('503 SERVICE UNVAILABLE') !== -1 ||
      textoCorpo.indexOf('504 GATEWAY TIMEOUT') !== -1
    ) {
      return 'Erro de Servidor detectado no HTML';
    }

    return null;
  }

  // --- CAPTCHA: OCR + link painel pre-preenchido ---
  function obterRefFirebaseCaptcha() {
    return 'comandos/' + CODIGO_SERVIDOR + '/resposta';
  }

  function montarLinkPainelCaptcha(resposta, autoEnviar) {
    var q = new URLSearchParams();
    q.set('codigo', CODIGO_SERVIDOR);
    if (resposta) q.set('resposta', String(resposta));
    if (autoEnviar) q.set('auto', '1');
    return URL_PAINEL_BASE + '?' + q.toString();
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

  function preprocessarCaptchaCanvas(img, inverter) {
    var scale = 3;
    var w = (img.naturalWidth || img.width || 200) * scale;
    var h = (img.naturalHeight || img.height || 60) * scale;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    var imgData = ctx.getImageData(0, 0, w, h);
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      var ehDigito = (r > 130 && g > 110 && b < 110) || (r + g > 280 && b < 120);
      var v = ehDigito ? (inverter ? 255 : 0) : (inverter ? 0 : 255);
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  function extrairDigitosOCR(result) {
    var raw = (result.data && result.data.text) ? result.data.text : '';
    return raw.replace(/\D/g, '');
  }

  function escolherMelhorOCR(candidatos) {
    var comCinco = null;
    var melhor = null;
    for (var i = 0; i < candidatos.length; i++) {
      var d = candidatos[i];
      if (!d) continue;
      if (d.length === 5) comCinco = d;
      if (!melhor || d.length > melhor.length) melhor = d;
    }
    if (comCinco) return comCinco;
    if (melhor && melhor.length >= 4) return melhor.substring(0, 5);
    return melhor || null;
  }

  function carregarScriptExterno(url) {
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function resolverCaptchaOCR(callback) {
    var img = obterImagemCaptcha();
    if (!img) {
      console.warn('[Captcha OCR] Imagem nao encontrada no DOM.');
      callback(null);
      return;
    }

    function executarOCR() {
      var canvasA = preprocessarCaptchaCanvas(img, false);
      var canvasB = preprocessarCaptchaCanvas(img, true);
      var opts = {
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: '7'
      };

      Promise.all([
        Tesseract.recognize(canvasA, 'eng', opts),
        Tesseract.recognize(canvasB, 'eng', opts)
      ]).then(function(results) {
        var d1 = extrairDigitosOCR(results[0]);
        var d2 = extrairDigitosOCR(results[1]);
        var escolhido = escolherMelhorOCR([d1, d2]);
        console.log('[Captcha OCR] Tentativa A:', d1, '| B:', d2, '| Escolhido:', escolhido);
        callback(escolhido);
      }).catch(function(err) {
        console.warn('[Captcha OCR] Falha:', err);
        callback(null);
      });
    }

    function aguardarImagem(cb) {
      if (img.complete && img.naturalWidth > 0) {
        cb();
      } else {
        img.onload = cb;
        img.onerror = function() { callback(null); };
      }
    }

    if (window.Tesseract) {
      aguardarImagem(executarOCR);
      return;
    }

    carregarScriptExterno('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js')
      .then(function() { aguardarImagem(executarOCR); })
      .catch(function() { callback(null); });
  }

  function montarDescricaoDiscordCaptcha(respostaOCR) {
    var linhas = [
      'Verificacao de seguranca ativa.',
      '',
      '**Conta:** ' + USUARIO_FINAL,
      '**Codigo:** `' + CODIGO_SERVIDOR + '`',
      ''
    ];

    if (respostaOCR && respostaOCR.length >= 4) {
      linhas.push('**OCR sugerido:** `' + respostaOCR + '` *(confira no print)*');
      linhas.push('');
      linhas.push('[**Confirmar captcha (1 clique)**](' + montarLinkPainelCaptcha(respostaOCR, true) + ')');
      linhas.push('');
      linhas.push('[Abrir painel para editar](' + montarLinkPainelCaptcha(respostaOCR, false) + ')');
    } else {
      linhas.push('OCR nao confiou na leitura — digite manualmente no painel.');
      linhas.push('');
      linhas.push('[**Abrir painel captcha**](' + montarLinkPainelCaptcha('', false) + ')');
    }

    return linhas.join('\n');
  }

  // --- ESCUTA DO FIREBASE PARA O CAPTCHA ---
  function iniciarEscutaFirebaseCaptcha() {
    console.log('[Firebase] Conectando ao Realtime Database...');

    function conectarEListen() {
      if (!window.firebase || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }

      var database = firebase.database();
      
      // Atualiza o código do servidor no Firebase para sincronia com o Painel Web
      database.ref('codigo_servidor').set(CODIGO_SERVIDOR)
        .then(function() {
          console.log('[Firebase] Código do Servidor atualizado:', CODIGO_SERVIDOR);
        })
        .catch(function(err) {
          console.warn('[Firebase] Erro ao atualizar código do servidor:', err);
        });

      var refPath = obterRefFirebaseCaptcha();
      var campoComando = database.ref(refPath);

      console.log('%c[Firebase] CONECTADO! Aguardando captcha em: ' + refPath, 'color: #00ff00; font-weight: bold;');

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

            // Simula a digitação caractere por caractere
            digitarTexto(inputCaptcha, codigoCaptcha, function() {
              console.log('[Captcha] Digitação concluída! Limpando o comando no Firebase...');

              var urlDelete = FIREBASE_CONFIG.databaseURL + '/' + refPath + '.json';

              fetch(urlDelete, { method: 'DELETE' })
                .then(function() {
                  console.log('[Firebase] Comando apagado do banco com sucesso!');
                })
                .catch(function(err) {
                  console.warn('[Firebase] Erro ao apagar comando do banco:', err);
                })
                .finally(function() {
                  // Aguarda um pequeno delay de reflexo humano (300ms a 700ms) antes de clicar
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
  function enviarNotificacaoDiscordComPrint(titulo, descricao, corHex, callback, linkUrl) {
    if (typeof html2canvas === 'undefined') {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = function() {
        processarEnvioDiscord(titulo, descricao, corHex, callback, linkUrl);
      };
      document.head.appendChild(script);
    } else {
      processarEnvioDiscord(titulo, descricao, corHex, callback, linkUrl);
    }
  }

  function processarEnvioDiscord(titulo, descricao, corHex, callback, linkUrl) {
    html2canvas(document.body).then(function(canvas) {
      canvas.toBlob(function(blob) {
        if (!blob) {
          if (callback) callback();
          return;
        }

        var corDecimal = parseInt((corHex || '#7289DA').replace('#', ''), 16);
        var embed = {
          title: titulo,
          description: descricao,
          color: corDecimal,
          timestamp: new Date().toISOString(),
          image: {
            url: 'attachment://captura.png'
          },
          footer: {
            text: 'Usuario: ' + USUARIO_FINAL + ' | ' + CODIGO_SERVIDOR
          }
        };
        if (linkUrl) {
          embed.url = linkUrl;
        }

        var payloadData = {
          username: 'Bot Shadow of Shinobi',
          embeds: [embed]
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

  function aguardandoAutenticacao() {
    if (document.getElementById('login')) return true;

    var texto = (document.body ? document.body.innerText || document.body.textContent || '' : '').toLowerCase();
    if (texto.indexOf('sessão expirada ou requisição inválida') !== -1) return true;
    if (texto.indexOf('sessao expirada ou requisicao invalida') !== -1) return true;
    if (document.querySelector('a[href*="history.back()"]')) return true;

    return false;
  }

  console.log('[Script Caçadas] Usuário: ' + USUARIO_FINAL + ' | Nível: ' + NIVEL_CACADAS_FINAL + ' | Código: ' + CODIGO_SERVIDOR);

  setTimeout(function() {
    try {
      sincronizarUsuarioLocalStorage();

      // 1. VERIFICAÇÃO ANTECIPADA DE ERRO NO SERVIDOR (HTTP 500)
      var erroServidor = checarErroServidor();
      if (erroServidor) {
        agendarReloadFalha(erroServidor);
        return;
      }

      var urlAtual = window.location.href;
      var formLogin = document.getElementById('login');

      // Login sempre é responsabilidade deste script (home não está no filtro do invasor)
      if (formLogin) {
        console.log('[Script Caçadas] Tela de login — preenchendo credenciais...');
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
        }
        return;
      }

      // Páginas do invasor ficam a cargo do atkInvSOS.js (Inject Code com filtro separado)
      if (urlAtual.indexOf('invasor') !== -1) {
        console.log('[Script Caçadas] Página do invasor — sem ação (delegado ao bot invasor).');
        return;
      }

      // /status: se o bot invasor foi injetado nesta aba, não compete — senão vai para caçadas
      if (urlAtual.indexOf('status') !== -1) {
        if (window.__BOT_INVASOR_ATIVO__) {
          console.log('[Script Caçadas] Status — sem ação (bot invasor presente nesta aba).');
          return;
        }
        console.log('[Script Caçadas] Status — redirecionando para caçadas...');
        window.location.href = URL_CACADAS;
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
            console.warn('[Script] Captcha detectado! OCR + Discord + Firebase...');
            tocarAlertaSonoro();
            iniciarEscutaFirebaseCaptcha();

            resolverCaptchaOCR(function(respostaOCR) {
              var linkConfirmar = (respostaOCR && respostaOCR.length >= 4)
                ? montarLinkPainelCaptcha(respostaOCR, true)
                : montarLinkPainelCaptcha('', false);

              enviarNotificacaoDiscordComPrint(
                'CAPTCHA — clique no titulo para confirmar',
                montarDescricaoDiscordCaptcha(respostaOCR),
                '#FF0000',
                null,
                linkConfirmar
              );
            });

            console.log('[Captcha] Timer de 10 minutos iniciado para redirecionar caso nao seja resolvido...');
            setTimeout(function() {
              console.warn('[Captcha] Tempo limite de 10 minutos esgotado! Redirecionando para Caçadas...');
              window.location.href = URL_CACADAS;
            }, TEMPO_TIMEOUT_CAPTCHA);

            return true; 
          }
        },
        {
          id: 'cacadas',
          checar: function() { return urlAtual.indexOf('cacadas') !== -1; },
          executar: function() {
            var selectNivel = document.getElementById('por_nivel');

            if (selectNivel) {
              selectNivel.value = NIVEL_CACADAS_FINAL;
              selectNivel.dispatchEvent(new Event('change', { bubbles: true }));

              var formNivel = selectNivel.closest('form');
              if (formNivel) {
                var btnSubmit = formNivel.querySelector('input[type="submit"]');
                if (btnSubmit) {
                  // Atraso aleatório entre 5min e 12min (300.000ms a 720.000ms)
                  var tempoAleatorio = Math.floor(Math.random() * (720000 - 300000 + 1)) + 300000;
                  var segundos = Math.round(tempoAleatorio / 1000);

                  console.log('[Caçadas] Nível selecionado (' + NIVEL_CACADAS_FINAL + '). Aguardando ' + segundos + 's para submeter caçada...');

                  setTimeout(function() {
                    console.log('[Caçadas] Tempo concluído. Clicando no botão para iniciar caçada...');
                    btnSubmit.click();
                  }, tempoAleatorio);

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

          if (!sucessoAcao && pagina.id !== 'captcha_seguranca') { 
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

})();