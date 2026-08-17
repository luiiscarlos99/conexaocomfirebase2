// ==UserScript==
// @name         Bot Atacar - Shadow of Shinobi
// @namespace    http://tampermonkey.net/
// @version      2.22
// @description  Automação do Caçadas/Atacar com digitação simulada de Captcha, atraso aleatório, timeout de Captcha (10min) e Firebase.
// @match        https://shadowofshinobi.com/*
// @grant        none
// ==UserScript==

(function() {
  'use strict';

  var BOT_MODO_KEY = 'BOT_MODO_ABA';

  // Modo so via URL (query/referrer) ou sessionStorage desta aba — nunca localStorage
  try { localStorage.removeItem('BOT_MODO_ABA'); } catch (e) {}

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

  function lerModoReferrer() {
    try {
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return '';
      var modo = new URLSearchParams(new URL(ref).search).get('bot_modo');
      if (modo === 'invasor' || modo === 'cacadas') return modo;
    } catch (e) {}
    return '';
  }

  function lerModoUrl(params) {
    var modo = params.get('bot_modo');
    if (modo === 'invasor' || modo === 'cacadas') return modo;

    try {
      var hash = (window.location.hash || '').replace(/^#/, '');
      if (hash) {
        var hp = new URLSearchParams(hash.charAt(0) === '?' ? hash.slice(1) : hash);
        modo = hp.get('bot_modo');
        if (modo === 'invasor' || modo === 'cacadas') return modo;
      }
    } catch (e) {}

    return lerModoReferrer();
  }

  function aplicarCredenciaisReferrer() {
    try {
      var ref = document.referrer || '';
      if (!ref || ref.indexOf('shadowofshinobi.com') === -1) return;
      var rp = new URLSearchParams(new URL(ref).search);
      var u = rp.get('bot_user');
      var p = rp.get('bot_pass');
      var n = rp.get('bot_nivel');
      var e = rp.get('bot_espera_cacadas');
      if (u) localStorage.setItem('BOT_USUARIO', u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
    } catch (e) {}
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
      var modo = lerModoUrl(params);
      var modoVeioDeQuery = params.get('bot_modo') === 'invasor' || params.get('bot_modo') === 'cacadas';

      if (params.get('bot_modo') === 'off' || params.get('bot_modo') === 'manual') {
        sessionStorage.removeItem(BOT_MODO_KEY);
        return params;
      }

      if (modo === 'invasor' || modo === 'cacadas') {
        sessionStorage.setItem(BOT_MODO_KEY, modo);
      }

      var u = params.get('bot_user');
      var p = params.get('bot_pass');
      var n = params.get('bot_nivel');
      var e = params.get('bot_espera_cacadas');
      if (u) localStorage.setItem('BOT_USUARIO', u);
      if (p) localStorage.setItem('BOT_SENHA', p);
      if (n) localStorage.setItem('BOT_NIVEL_CACADAS', n);
      if (e !== null && e !== '') gravarEsperaCacadasParam(e);
      if (!u && !p && !n) aplicarCredenciaisReferrer();

      if ((u || p || n || e || modoVeioDeQuery) && window.history && window.history.replaceState) {
        history.replaceState(null, document.title, location.pathname + location.hash);
      }

      return params;
    } catch (e) {
      return null;
    }
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

  function sincronizarModoAba() {
    var params = aplicarParamsUrl();
    exibirModoAbaServerID();
    return params;
  }

  function exibirModoAbaServerID() {
    function aplicar() {
      var el = document.getElementById('serverID');
      if (!el) return false;
      var modo = '';
      try { modo = sessionStorage.getItem(BOT_MODO_KEY) || ''; } catch (e) {}
      if (!el.dataset.botServerBase) {
        el.dataset.botServerBase = (el.textContent || '').replace(/\s*\|\s*Bot:.*$/i, '').trim();
      }
      var label = (modo === 'invasor' || modo === 'cacadas') ? modo : 'manual';
      el.textContent = el.dataset.botServerBase + ' | Bot: ' + label;
      return true;
    }
    if (aplicar()) return;
    setTimeout(aplicar, 800);
    setTimeout(aplicar, 2500);
  }

  aplicarParamsUrl();
  exibirModoAbaServerID();

  var BOT_KILL_KEY = 'BOT_DESATIVADO_ABA';
  var SCRIPT_VERSAO = '2.22';
  var SCRIPT_ATUALIZADO = '17/08/2026 08:20';

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

  var modoInicial = obterModoAba();
  if (!modoInicial) {
    logDiagnosticoModo('cacadas');
    console.log('[Script Caçadas] Sem BOT_MODO_ABA — sem acao (modo atual: vazio). Use /cacadas?bot_modo=cacadas ou /invasor?bot_modo=invasor.');
    return;
  }

  if (modoInicial !== 'cacadas' && modoInicial !== 'invasor') {
    return;
  }

  var TEMPO_ESPERA = 2000;
  var TEMPO_RELOAD_FALHA = 20000;
  var TEMPO_TIMEOUT_CAPTCHA = 600000; // 10 minutos (60 * 10 * 1000)
  var URL_CACADAS = 'https://shadowofshinobi.com/cacadas';
  var URL_INVASOR = 'https://shadowofshinobi.com/invasor';
  var URL_HOME = 'https://shadowofshinobi.com/';
  var DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1536968358195503224/lSz9-SrV7bPRk5B-RHrvPgn2Uij-hr7TLhgtOVx_0-5dfPVc6Kp2YMv5xG9SZvJxcsCO';
  var URL_PAINEL_BASE = 'https://luiiscarlos99.github.io/conexaocomfirebase2/firebase.html';
  var reloadAgendado = false;
  var captchaJaNotificado = false;
  var timerCaptchaTimeout = null;
  var captchaRespostaProcessando = false;

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

  // Espera antes de clicar "Caçar" — bot_espera_cacadas (minutos) via URL ou localStorage
  var ESPERA_CACADAS_DEFAULT_MIN_MS = 300000;  // 5 min
  var ESPERA_CACADAS_DEFAULT_MAX_MS = 720000;  // 12 min

  function calcularIntervaloEsperaCacadas() {
    var minutos = parseEsperaCacadasMinutos(localStorage.getItem('BOT_ESPERA_CACADAS'));

    if (minutos === null) {
      return {
        minMs: ESPERA_CACADAS_DEFAULT_MIN_MS,
        maxMs: ESPERA_CACADAS_DEFAULT_MAX_MS,
        origem: 'padrao'
      };
    }

    if (minutos < 2) {
      return { minMs: 0, maxMs: 120000, origem: 'config', minutos: minutos };
    }

    return {
      minMs: Math.round((minutos - 2) * 60000),
      maxMs: Math.round(minutos * 60000),
      origem: 'config',
      minutos: minutos
    };
  }

  function sortearTempoEsperaCacadas() {
    var iv = calcularIntervaloEsperaCacadas();
    if (iv.minMs >= iv.maxMs) return iv.maxMs;
    return Math.floor(Math.random() * (iv.maxMs - iv.minMs + 1)) + iv.minMs;
  }

  function descreverEsperaCacadas() {
    var iv = calcularIntervaloEsperaCacadas();
    if (iv.origem === 'padrao') return '5-12min (padrao)';
    var minMin = Math.round(iv.minMs / 60000);
    var maxMin = Math.round(iv.maxMs / 60000);
    return minMin + '-' + maxMin + 'min (bot_espera_cacadas=' + iv.minutos + ')';
  }

  // --- FUNÇÃO PARA GERAR OU OBTER O CÓDIGO ÚNICO DO SERVIDOR/SESSÃO ---
  function obterCodigoServidor() {
    var usuario = (localStorage.getItem('BOT_USUARIO') || USUARIO_DEFAULT).trim();
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

  function montarLinkPainelCaptcha() {
    return URL_PAINEL_BASE + '?codigo=' + encodeURIComponent(CODIGO_SERVIDOR);
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
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
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
    return [
      'Verificacao de seguranca — **a imagem abaixo e a valida** (salva no Firebase).',
      'O navegador pode mostrar numeros diferentes; resolva pela imagem desta mensagem.',
      '',
      '**Conta:** ' + USUARIO_FINAL,
      '**Codigo:** `' + CODIGO_SERVIDOR + '`',
      '',
      '[**Abrir painel (OCR + confirmar)**](' + montarLinkPainelCaptcha() + ')'
    ].join('\n');
  }

  function enviarDiscordCaptchaBlob(blob, descricao, callback) {
    var corDecimal = parseInt('FF0000'.replace('#', ''), 16);
    var payloadData = {
      username: 'Bot Shadow of Shinobi',
      embeds: [{
        title: 'CAPTCHA DETECTADO',
        description: descricao,
        color: corDecimal,
        timestamp: new Date().toISOString(),
        image: { url: 'attachment://captcha.png' },
        footer: { text: 'Usuario: ' + USUARIO_FINAL + ' | ' + CODIGO_SERVIDOR }
      }]
    };

    var formData = new FormData();
    formData.append('payload_json', JSON.stringify(payloadData));
    formData.append('file', blob, 'captcha.png');

    fetch(DISCORD_WEBHOOK_URL, { method: 'POST', body: formData })
      .then(function(r) {
        if (r.ok) console.log('[Discord] Captcha enviado (recorte, sem html2canvas).');
        if (callback) callback();
      })
      .catch(function(e) {
        console.error('[Discord] Erro:', e);
        if (callback) callback();
      });
  }

  function processarCaptchaDetectado() {
    if (captchaJaNotificado) {
      console.log('[Captcha] Ja notificado nesta pagina — ignorando.');
      return;
    }
    captchaJaNotificado = true;
    tocarAlertaSonoro();

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
              enviarDiscordCaptchaBlob(blob, montarDescricaoDiscordCaptcha());
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

          if (timerCaptchaTimeout) {
            clearTimeout(timerCaptchaTimeout);
            timerCaptchaTimeout = null;
          }

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

  function sessaoExpiradaSemLogin() {
    if (document.getElementById('login')) return false;
    return aguardandoAutenticacao();
  }

  function redirecionarParaLogin(motivo) {
    console.warn('[Script Caçadas] ' + motivo + ' — redirecionando para login...');
    window.location.href = URL_HOME;
  }

  function urlAposCaptcha() {
    return obterModoAba() === 'invasor' ? URL_INVASOR : URL_CACADAS;
  }

  console.log('[Script Caçadas] Usuário: ' + USUARIO_FINAL + ' | Nível: ' + NIVEL_CACADAS_FINAL + ' | Espera caçadas: ' + descreverEsperaCacadas() + ' | Código: ' + CODIGO_SERVIDOR);

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

        if (!ehLogin && !ehCaptcha) {
          console.log('[Script Caçadas] Aba invasor — sem acao.');
          return;
        }
      }

      sincronizarUsuarioLocalStorage();
      CODIGO_SERVIDOR = obterCodigoServidor();

      var urlAtual = window.location.href;
      var formLogin = document.getElementById('login');

      // Login antes de checar erro 500 — evita reload na tela de login
      if (formLogin) {
        console.log('[Script Caçadas] Tela de login — preenchendo credenciais...');
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
          agendarReloadFalha('Campos de login (#usuario / #senha) nao encontrados.');
          return;
        }

        setTimeout(function() {
          var btnLogin = formLogin.querySelector('input[type="submit"]');
          if (btnLogin) {
            btnLogin.click();
          } else {
            agendarReloadFalha('Botao de login nao encontrado.');
          }
        }, 2000);
        return;
      }

      // 1. VERIFICAÇÃO DE ERRO NO SERVIDOR (HTTP 500)
      var erroServidor = checarErroServidor();
      if (erroServidor) {
        agendarReloadFalha(erroServidor);
        return;
      }

      // Modo cacadas: ignora paginas do invasor
      if (obterModoAba() === 'cacadas' && urlAtual.indexOf('invasor') !== -1) {
        console.log('[Script Caçadas] Pagina do invasor — sem acao.');
        return;
      }

      // Modo cacadas: /status → caçadas
      if (obterModoAba() === 'cacadas' && urlAtual.indexOf('status') !== -1) {
        console.log('[Script Caçadas] Status — redirecionando para caçadas...');
        window.location.href = URL_CACADAS;
        return;
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

            console.log('[Captcha] Timer de 10 minutos iniciado...');
            if (timerCaptchaTimeout) clearTimeout(timerCaptchaTimeout);
            timerCaptchaTimeout = setTimeout(function() {
              var destino = urlAposCaptcha();
              console.warn('[Captcha] Tempo limite esgotado! Redirecionando...');
              window.location.href = destino;
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
                  var ivEspera = calcularIntervaloEsperaCacadas();
                  var tempoAleatorio = sortearTempoEsperaCacadas();
                  var segundos = Math.round(tempoAleatorio / 1000);

                  console.log(
                    '[Caçadas] Nivel selecionado (' + NIVEL_CACADAS_FINAL + '). Aguardando ' + segundos +
                    's (faixa ' + Math.round(ivEspera.minMs / 1000) + '-' + Math.round(ivEspera.maxMs / 1000) + 's)...'
                  );

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