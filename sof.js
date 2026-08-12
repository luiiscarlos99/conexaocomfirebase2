//missao

document.querySelector('form input[name="missao_id"][value="4"]')
        .closest('form')
        .querySelector('input[type="submit"]')
        .click();

        // Opção A: Pelo ID direto
document.getElementById('btn_receber_mis').click();

// Opção B: Pelo input hidden 'receber_missao'
document.querySelector('form input[name="receber_missao"][value="1"]')
        .closest('form')
        .querySelector('input[type="submit"]')
        .click();

        --

//boss
document.querySelector('form input[name="invasor_id"][value="384"]')
        .closest('form')
        .querySelector('input[type="submit"]')
        .click();

//atacar
// 1. Localiza a caixa de seleção de nível
var selectNivel = document.getElementById('por_nivel');

if (selectNivel) {
  // 2. Define o nível desejado (Exemplo: "1" para Estudante)
  selectNivel.value = '1';
  selectNivel.dispatchEvent(new Event('change'));

  // 3. Busca e clica no botão "Caçar" exclusivo deste formulário
  var formNivel = selectNivel.closest('form');
  formNivel.querySelector('input[type="submit"]').click();
}

document.querySelector('form[action="atacar"] input[type="submit"]').click();

localStorage.setItem('BOT_USUARIO', 'Shizuo');

--

<div id="col_direita">

<table border="0" cellspacing="0" cellpadding="0">
  <tbody><tr>
    <td><img src="img/fundo_box_simples_01.jpg" width="18" height="32"></td>
    <td class="box_preto_novo_simples_sup"><table border="0" cellspacing="0" cellpadding="0">
      <tbody><tr>
        <td><img src="img/logo_simples.png" width="23" height="32"></td>
        <td style="padding-top:3px;">&nbsp;Invasor</td>
      </tr></tbody></table></td>
    <td><span class="box_preto_novo_sup_dir"><img src="img/fundo_box_simples_03.jpg" width="22" height="32"></span></td>
  </tr>
  <tr>
    <td valign="top" class="box_preto_simples_lateral_esq"><img src="img/fundo_box_simples_05.jpg" width="18" height="32"></td>
    <td class="box_preto_cor_central">

      
      Instruções do evento:<br>
      <br>
      * O invasor pode ser atacado somente 1 vez a cada 10 minutos.<br>
      * O poder ofensivo do invasor (atributos e jutsus) é sempre igual (100%) aos valores do player atacante (Já somando valores do animal). Isto significa que o mesmo invasor terá atributos diferentes para cada player que o atacar, mas sempre seguindo o valor já informado.
      <br>
      * O Nick do player vencedor será exibido para TODOS do game no campo "Derrrotado por:"
      <br>
      * Somente o player que derrotar o invasor (deixar a energia vital do invasor abaixo de 10 pontos) primeiro receberá as recompensas descritas nas informações do invasor.<br>
      * Existe uma chance de 10% de ganhar o item "caixa surpresa" ao atacar o invasor.<br>
      * As derrotas sofridas ao batalhar contra o invasor não serão contabilizadas.
      <br>
      * Após derrotado, o invasor não poderá mais ser atacado e o evento é finalizado.
      <br>
      <div class="box_preto_separador">&nbsp;</div>

      
      <div align="center">
        <div style="position:relative;display:inline-block;">
          <img src="novo_np/personagens/invasor_1_1779674115.png" width="163" height="174" onerror="this.onerror=null;this.src='img/21.jpg'">
                  </div><br>
      </div>
      <div class="box_preto_separador">&nbsp;</div>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tbody>
        <tr class="box_preto_tarja">
          <td>Nome do inimigo:</td>
          <td colspan="2"><strong>Zaku Abumi</strong></td>
        </tr>
                <tr>
          <td>Doujutsu especial:</td>
          <td colspan="2"><strong>🔴 MS Itachi</strong></td>
        </tr>
                <tr class="box_preto_tarja">
          <td>Recompensa em ryous:</td>
          <td colspan="2"><strong>4.062.182 ryous</strong></td>
        </tr>
        <tr>
          <td style="padding-top:4px;">Recompensa em Kage Coin:</td>
          <td colspan="2" style="padding-top:4px;"><strong>1.000 Kage Coin</strong></td>
        </tr>
        <tr class="box_preto_tarja">
          <td>Energia vital:</td>
                    <td colspan="2"><strong>???</strong></td>
                  </tr>
        <tr>
          <td style="padding-top:3px;">Data da invasão:</td>
          <td colspan="2" style="padding-top:3px;"><strong>12/08/2026 às 03:34:54</strong></td>
        </tr>
        <tr class="box_preto_tarja">
          <td>Players derrotados:</td>
          <td colspan="2"><strong>0</strong></td>
        </tr>
        <tr>
          <td style="padding-top:4px;">Derrotado por:</td>
          <td colspan="2" style="padding-top:4px;">
                          <strong>— Ainda não derrotado —</strong>
                      </td>
        </tr>
        <tr class="box_preto_separador"><td colspan="3">&nbsp;</td></tr>
        <tr>
          <td>Ninjutsu:</td>
          <td><img src="img/ponta_barra(1).jpg" width="16" height="26"><img src="img/barra_centro(1).jpg" width="220" height="26"><img src="img/fim_barra(1).jpg" width="19" height="26"></td>
          <td><strong>[ 1.908 ]</strong></td>
        </tr>
        <tr>
          <td>Taijutsu:</td>
          <td><img src="img/ponta_barra.jpg" width="16" height="26"><img src="img/barra_centro.jpg" width="220" height="26"><img src="img/fim_barra.jpg" width="19" height="26"></td>
          <td><strong>[ 1.020 ]</strong></td>
        </tr>
        <tr>
          <td>Genjutsu:</td>
          <td><img src="img/ponta_barra(2).jpg" width="16" height="26"><img src="img/barra_centro(2).jpg" width="220" height="26"><img src="img/fim_barra(2).jpg" width="19" height="26"></td>
          <td><strong>[ 996 ]</strong></td>
        </tr>
        <tr>
          <td>Inteligência:</td>
          <td><img src="img/ponta_barra(3).jpg" width="16" height="26"><img src="img/barra_centro(3).jpg" width="220" height="26"><img src="img/fim_barra(3).jpg" width="19" height="26"></td>
          <td><strong>[ 159 ]</strong></td>
        </tr>
        </tbody>
      </table>

      <div class="box_preto_separador">&nbsp;</div>

            <div align="center">
        <form method="post" action="invasor"><input type="hidden" name="csrf_token" value="d6e1bc921ed491872cba7c25f325adc82798cc43f95027c47be9de62defaf332">          <input type="hidden" name="atacar" value="1">
          <input type="hidden" name="invasor_id" value="390">
          <input type="submit" value="Atacar" style="background:url(img/bt.jpg);background-position:center;color:#5f1010;border:1px #ffcc99 solid;font-weight:bold;padding:4px 12px;">
        </form>
      </div>
      
      
      
    </td>
    <td class="box_preto_simples_lateral_dir">&nbsp;</td>
  </tr>
  <tr>
    <td><img src="img/fundo_box_simples_12.jpg" width="18" height="21"></td>
    <td><img src="img/fundo_box_simples_13.jpg" width="514" height="21"></td>
    <td><img src="img/fundo_box_simples_16.jpg" width="22" height="21"></td>
  </tr>
  </tbody>
</table>

          </div>

          <div id="col_direita">

<table border="0" cellspacing="0" cellpadding="0">
  <tbody><tr>
    <td><img src="img/fundo_box_simples_01.jpg" width="18" height="32"></td>
    <td class="box_preto_novo_simples_sup"><table border="0" cellspacing="0" cellpadding="0">
      <tbody><tr>
        <td><img src="img/logo_simples.png" width="23" height="32"></td>
        <td style="padding-top:3px;">&nbsp;Invasor</td>
      </tr></tbody></table></td>
    <td><span class="box_preto_novo_sup_dir"><img src="img/fundo_box_simples_03.jpg" width="22" height="32"></span></td>
  </tr>
  <tr>
    <td valign="top" class="box_preto_simples_lateral_esq"><img src="img/fundo_box_simples_05.jpg" width="18" height="32"></td>
    <td class="box_preto_cor_central">

      
      Instruções do evento:<br>
      <br>
      * O invasor pode ser atacado somente 1 vez a cada 10 minutos.<br>
      * O poder ofensivo do invasor (atributos e jutsus) é sempre igual (100%) aos valores do player atacante (Já somando valores do animal). Isto significa que o mesmo invasor terá atributos diferentes para cada player que o atacar, mas sempre seguindo o valor já informado.
      <br>
      * O Nick do player vencedor será exibido para TODOS do game no campo "Derrrotado por:"
      <br>
      * Somente o player que derrotar o invasor (deixar a energia vital do invasor abaixo de 10 pontos) primeiro receberá as recompensas descritas nas informações do invasor.<br>
      * Existe uma chance de 10% de ganhar o item "caixa surpresa" ao atacar o invasor.<br>
      * As derrotas sofridas ao batalhar contra o invasor não serão contabilizadas.
      <br>
      * Após derrotado, o invasor não poderá mais ser atacado e o evento é finalizado.
      <br>
      <div class="box_preto_separador">&nbsp;</div>

      
      <div align="center">
        <div style="position:relative;display:inline-block;">
          <img src="novo_np/personagens/invasor_1_1779674115.png" width="163" height="174" onerror="this.onerror=null;this.src='img/21.jpg'">
                  </div><br>
      </div>
      <div class="box_preto_separador">&nbsp;</div>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tbody>
        <tr class="box_preto_tarja">
          <td>Nome do inimigo:</td>
          <td colspan="2"><strong>Zaku Abumi</strong></td>
        </tr>
                <tr>
          <td>Doujutsu especial:</td>
          <td colspan="2"><strong>🔴 MS Itachi</strong></td>
        </tr>
                <tr class="box_preto_tarja">
          <td>Recompensa em ryous:</td>
          <td colspan="2"><strong>4.062.182 ryous</strong></td>
        </tr>
        <tr>
          <td style="padding-top:4px;">Recompensa em Kage Coin:</td>
          <td colspan="2" style="padding-top:4px;"><strong>1.000 Kage Coin</strong></td>
        </tr>
        <tr class="box_preto_tarja">
          <td>Energia vital:</td>
                    <td colspan="2"><strong>???</strong></td>
                  </tr>
        <tr>
          <td style="padding-top:3px;">Data da invasão:</td>
          <td colspan="2" style="padding-top:3px;"><strong>12/08/2026 às 03:34:54</strong></td>
        </tr>
        <tr class="box_preto_tarja">
          <td>Players derrotados:</td>
          <td colspan="2"><strong>628</strong></td>
        </tr>
        <tr>
          <td style="padding-top:4px;">Derrotado por:</td>
          <td colspan="2" style="padding-top:4px;">
                          <strong>— Ainda não derrotado —</strong>
                      </td>
        </tr>
        <tr class="box_preto_separador"><td colspan="3">&nbsp;</td></tr>
        <tr>
          <td>Ninjutsu:</td>
          <td><img src="img/ponta_barra(1).jpg" width="16" height="26"><img src="img/barra_centro(1).jpg" width="220" height="26"><img src="img/fim_barra(1).jpg" width="19" height="26"></td>
          <td><strong>[ 1.908 ]</strong></td>
        </tr>
        <tr>
          <td>Taijutsu:</td>
          <td><img src="img/ponta_barra.jpg" width="16" height="26"><img src="img/barra_centro.jpg" width="220" height="26"><img src="img/fim_barra.jpg" width="19" height="26"></td>
          <td><strong>[ 1.020 ]</strong></td>
        </tr>
        <tr>
          <td>Genjutsu:</td>
          <td><img src="img/ponta_barra(2).jpg" width="16" height="26"><img src="img/barra_centro(2).jpg" width="220" height="26"><img src="img/fim_barra(2).jpg" width="19" height="26"></td>
          <td><strong>[ 996 ]</strong></td>
        </tr>
        <tr>
          <td>Inteligência:</td>
          <td><img src="img/ponta_barra(3).jpg" width="16" height="26"><img src="img/barra_centro(3).jpg" width="220" height="26"><img src="img/fim_barra(3).jpg" width="19" height="26"></td>
          <td><strong>[ 159 ]</strong></td>
        </tr>
        </tbody>
      </table>

      <div class="box_preto_separador">&nbsp;</div>

            <div class="avisos_erro" style="text-align:center;">
        ⏳ Próximo ataque disponível em <strong id="inv_cd_timer_390">6m 12s</strong>
      </div>
      <script>
      (function(){
        var el = document.getElementById('inv_cd_timer_390');
        robustCountdown(430, function(s){
          var m = Math.floor(s/60), sec = s%60;
          if (el) el.textContent = m+'m '+(sec<10?'0':'')+sec+'s';
        }, function(){ location.reload(); });
      })();
      </script>
      
      
      
    </td>
    <td class="box_preto_simples_lateral_dir">&nbsp;</td>
  </tr>
  <tr>
    <td><img src="img/fundo_box_simples_12.jpg" width="18" height="21"></td>
    <td><img src="img/fundo_box_simples_13.jpg" width="514" height="21"></td>
    <td><img src="img/fundo_box_simples_16.jpg" width="22" height="21"></td>
  </tr>
  </tbody>
</table>

          </div>