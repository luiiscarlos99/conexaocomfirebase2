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

          --

          <div id="col_direita">

<table border="0" cellspacing="0" cellpadding="0">
  <tbody><tr>
    <td><img src="img/fundo_box_simples_01.jpg" width="18" height="32"></td>
    <td class="box_preto_novo_simples_sup"><table border="0" cellspacing="0" cellpadding="0"><tbody><tr>
      <td><img src="img/logo_simples.png" width="23" height="32"></td>
      <td style="padding-top:3px;">&nbsp;- Shiroe x Sai -</td>
    </tr></tbody></table></td>
    <td><span class="box_preto_novo_sup_dir"><img src="img/fundo_box_simples_03.jpg" width="22" height="32"></span></td>
  </tr>
  <tr>
    <td valign="top" class="box_preto_simples_lateral_esq"><img src="img/fundo_box_simples_05.jpg" width="18" height="32"></td>
    <td class="box_preto_cor_central"><table border="0" cellspacing="0" cellpadding="2" class="box_largura_100">
      <tbody>
      <tr>
        <!-- PLAYER -->
        <td valign="bottom">
          <div align="center">
            <img src="novo_np/personagens/pain_/1.png" width="163" height="174" onerror="this.src='img/21.jpg'"><br>
            <img src="vilas/akatsuki_premium.jpg" width="163" alt="Akatsuki"><br>
            <strong>Shiroe</strong><br>
          </div>
          <br>
          <table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
            <tr class="box_preto_tarja"><td>Nível:</td><td>| <strong>Chunnin - Lv [26]</strong></td></tr>
            <tr><td>Ninjutsu</td><td>| <strong>169</strong> + [467]</td></tr><tr class="box_preto_tarja"><td>Taijutsu</td><td>| <strong>10</strong> + [330]</td></tr><tr><td>Genjutsu</td><td>| <strong>10</strong> + [322]</td></tr><tr class="box_preto_tarja"><td>Inteligência</td><td>| <strong>53</strong></td></tr>            <tr><td>Experiência:</td><td>| <strong>66</strong></td></tr>
            <tr class="box_preto_tarja"><td>Energia Vital:</td><td>| <strong>5.200</strong></td></tr>
          </tbody></table>
          <div class="box_preto_separador">&nbsp;</div>
        </td>

        <!-- VERSUS -->
        <td width="97" rowspan="7" valign="top">
          <br><br><br><br><br>
          <img src="img/versus.jpg" width="90" height="74">
        </td>

        <!-- INVASOR -->
        <td valign="bottom">
          <div align="center">
            <img src="novo_np/personagens/invasor_13_1779674262.png" width="163" height="174" onerror="this.src='img/21.jpg'"><br>
            <img src="novo_np/bandanas_que_fica_em_baixo_da_foto_de_perfil/bandanaos.png" width="163" alt="Invasor"><br>
            <strong>Sai</strong><br>
          </div>
          <br>
          <table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
            <tr class="box_preto_tarja"><td>Nível:</td><td>|<strong> Invasor - Lv [ 26 ]</strong></td></tr>
            <tr><td>Ninjutsu</td><td>| <strong>1.908</strong></td></tr><tr class="box_preto_tarja"><td>Taijutsu</td><td>| <strong>1.020</strong></td></tr><tr><td>Genjutsu</td><td>| <strong>996</strong></td></tr><tr class="box_preto_tarja"><td>Inteligência</td><td>| <strong>159</strong></td></tr>            <tr><td>Experiência:</td><td>| <strong>0</strong></td></tr>
            <tr class="box_preto_tarja"><td>Energia Vital:</td><td>| <strong>92,2%</strong></td></tr>
          </tbody></table>
          <div class="box_preto_separador">&nbsp;</div>
        </td>
      </tr>

      <!-- ARMA (ambos os lados) -->
      <tr>
                <td valign="bottom">
          <br>
                      <div align="center">
                            <img src="np/armas/Cajado_Eremita_Madara.png" width="163" height="auto" onerror="this.style.display='none'"><br>
                          </div>
            <br>
            <table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
              <tr class="box_preto_tarja"><td>Nome:</td><td>| <strong>Cajado Eremita - Madara</strong></td></tr>
              <tr><td>Ninjutsu:</td><td>| <strong>155</strong></td></tr>
              <tr class="box_preto_tarja"><td>Taijutsu:</td><td>| <strong>160</strong></td></tr>
              <tr><td>Genjutsu:</td><td>| <strong>155</strong></td></tr>
            </tbody></table>
                    <div class="box_preto_separador">&nbsp;</div>
        </td>
                <td valign="bottom">
          <br>
                      <div align="center">
                            <img src="np/armas/Cajado_Eremita_Madara.png" width="163" height="auto" onerror="this.style.display='none'"><br>
                          </div>
            <br>
            <table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
              <tr class="box_preto_tarja"><td>Nome:</td><td>| <strong>Cajado Eremita - Madara</strong></td></tr>
              <tr><td>Ninjutsu:</td><td>| <strong>155</strong></td></tr>
              <tr class="box_preto_tarja"><td>Taijutsu:</td><td>| <strong>160</strong></td></tr>
              <tr><td>Genjutsu:</td><td>| <strong>155</strong></td></tr>
            </tbody></table>
                    <div class="box_preto_separador">&nbsp;</div>
        </td>
              </tr>

      <!-- PET (player / invasor) -->
            <tr>
        <td valign="bottom"><br><div align="center"><img src="novo_np/pets/pakkunn.png" width="200" height="110" onerror="this.style.display='none'"><br></div><br><table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
            <tr class="box_preto_tarja"><td>Nome:</td><td>| <strong>Pakkun</strong></td></tr>
            <tr><td>Força:</td><td>| <strong>20</strong></td></tr>
            <tr class="box_preto_tarja"><td>Defesa:</td><td>| <strong>165</strong></td></tr>
            <tr><td>Resistência:</td><td>| <strong>20</strong></td></tr>
          </tbody></table><div class="box_preto_separador">&nbsp;</div></td>
        <td valign="bottom"><br><div align="center"><img src="novo_np/pets/pakkunn.png" width="200" height="110" onerror="this.style.display='none'"><br></div><br><table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
            <tr class="box_preto_tarja"><td>Nome:</td><td>| <strong>Pakkun</strong></td></tr>
            <tr><td>Força:</td><td>| <strong>40</strong></td></tr>
            <tr class="box_preto_tarja"><td>Defesa:</td><td>| <strong>330</strong></td></tr>
            <tr><td>Resistência:</td><td>| <strong>40</strong></td></tr>
          </tbody></table><div class="box_preto_separador">&nbsp;</div></td>
      </tr>

      <!-- SELO (player / invasor) -->
            <tr>
        <td valign="bottom"><br><div class="avisos_erro">Ainda não possui selo amaldiçoado</div><br><div class="box_preto_separador">&nbsp;</div></td>
        <td valign="bottom"><br><div class="avisos_erro">Não aplicável</div><br><div class="box_preto_separador">&nbsp;</div></td>
      </tr>

      <!-- VESTE -->
      <tr>
                <td valign="bottom"><br><div class="avisos_erro">Sem veste equipada</div><div class="box_preto_separador">&nbsp;</div></td>
                <td valign="bottom"><br><div class="avisos_erro">Sem veste equipada</div><div class="box_preto_separador">&nbsp;</div></td>
              </tr>

      <!-- DOUJUTSU (player / invasor — invasor sempre inativo) -->
            <tr>
        <td valign="bottom"><br><div class="avisos_erro">Sem doujutsu equipado</div><div class="box_preto_separador">&nbsp;</div></td>
        <td valign="bottom"><br><div class="avisos_erro">Sem doujutsu equipado</div><div class="box_preto_separador">&nbsp;</div></td>
      </tr>

      <!-- COLETE (player / invasor) -->
            <tr>
        <td><div align="center"><img src="vilas/coletes/28.png" width="145" height="144" onerror="this.style.display='none'"></div><table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
            <tr class="box_preto_tarja"><td>Nível:</td><td>| + 0</td></tr>
            <tr><td>Tai:</td><td>| <strong>100</strong></td></tr>
            <tr class="box_preto_tarja"><td>Nin:</td><td>| <strong>97</strong></td></tr>
            <tr><td>Gen:</td><td>| <strong>97</strong></td></tr>
          </tbody></table></td>
        <td><div align="center"><img src="vilas/coletes/28.png" width="145" height="144" onerror="this.style.display='none'"></div><table border="0" cellpadding="2" cellspacing="0" class="box_largura_100"><tbody>
            <tr class="box_preto_tarja"><td>Nível:</td><td>| + 0</td></tr>
            <tr><td>Tai:</td><td>| <strong>200</strong></td></tr>
            <tr class="box_preto_tarja"><td>Nin:</td><td>| <strong>194</strong></td></tr>
            <tr><td>Gen:</td><td>| <strong>194</strong></td></tr>
          </tbody></table></td>
      </tr>

      <tr>
        <td valign="top">&nbsp;</td>
        <td valign="top">&nbsp;</td>
      </tr>

      </tbody>
    </table></td>
    <td class="box_preto_simples_lateral_dir">&nbsp;</td>
  </tr>
  <tr>
    <td><img src="img/fundo_box_simples_12.jpg" width="18" height="21"></td>
    <td><img src="img/fundo_box_simples_13.jpg" width="514" height="21"></td>
    <td><img src="img/fundo_box_simples_16.jpg" width="22" height="21"></td>
  </tr></tbody>
</table>

<table border="0" cellspacing="0" cellpadding="0">
  <tbody><tr>
    <td><img src="img/fundo_box_simples_01.jpg" width="18" height="32"></td>
    <td class="box_preto_novo_simples_sup"><table border="0" cellspacing="0" cellpadding="0"><tbody><tr>
      <td><img src="img/logo_simples.png" width="23" height="32"></td>
      <td style="padding-top:3px;">&nbsp;- Relatório detalhado do combate -</td>
    </tr></tbody></table></td>
    <td><span class="box_preto_novo_sup_dir"><img src="img/fundo_box_simples_03.jpg" width="22" height="32"></span></td>
  </tr>
  <tr>
    <td valign="top" class="box_preto_simples_lateral_esq"><img src="img/fundo_box_simples_05.jpg" width="18" height="32"></td>
    <td class="box_preto_cor_central"><table border="0" cellspacing="0" cellpadding="0" class="box_largura_100">
      <tbody>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Cajado Eremita - Madara</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">759 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                        <img src="np/armas/Cajado_Eremita_Madara.png" width="70" height="70" onerror="this.style.display='none'">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Chidori</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">498 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                        <img src="np/elementos/Chidori.png" width="70" height="70" onerror="this.style.display='none'">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                              <tr>
          <td colspan="2" style="padding:4px 6px;background:#1a0033;border-left:3px solid #9933ff;">
            <span style="color:#dd99ff;font-weight:bold;">MS Sasuke</span>
            &nbsp;<span style="color:#cc88ff;font-style:italic;">[Sai]</span>:
            <span style="color:#ffffff;">Amaterasu: +382 queimadura.</span>
          </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Pakkun</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">777 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                        <img src="novo_np/pets/pakkunn.png" width="70" height="70" onerror="this.style.display='none'">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Chidori Nagashi</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">547 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                              <tr>
          <td colspan="2" style="padding:4px 6px;background:#330d00;border-left:3px solid #ff5500;">
            <span style="color:#ff8844;font-weight:bold;">MS Sasuke</span>:
            <span style="color:#ffaa66;"><strong>Shiroe</strong> sofreu
            <strong style="color:#ff4400;">382 pts</strong> de dano de queimadura.</span>
          </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                              <tr>
          <td colspan="2" style="padding:4px 6px;background:#1a0033;border-left:3px solid #9933ff;">
            <span style="color:#dd99ff;font-weight:bold;">MS Sasuke</span>
            &nbsp;<span style="color:#cc88ff;font-style:italic;">[Sai]</span>:
            <span style="color:#ffffff;">Kagutsuchi: queimadura dobrada! Amaterasu: +764 queimadura.</span>
          </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Rasengan</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">765 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Pakkun</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">478 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                        <img src="novo_np/pets/pakkunn.png" width="70" height="70" onerror="this.style.display='none'">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                              <tr>
          <td colspan="2" style="padding:4px 6px;background:#330d00;border-left:3px solid #ff5500;">
            <span style="color:#ff8844;font-weight:bold;">MS Sasuke</span>:
            <span style="color:#ffaa66;"><strong>Shiroe</strong> sofreu
            <strong style="color:#ff4400;">765 pts</strong> de dano de queimadura.</span>
          </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                              <tr>
          <td colspan="2" style="padding:4px 6px;background:#1a0033;border-left:3px solid #9933ff;">
            <span style="color:#dd99ff;font-weight:bold;">MS Sasuke</span>
            &nbsp;<span style="color:#cc88ff;font-style:italic;">[Sai]</span>:
            <span style="color:#ffffff;">Amaterasu: +382 queimadura.</span>
          </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Rasengan</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">760 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Chidori</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">499 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                        <img src="np/elementos/Chidori.png" width="70" height="70" onerror="this.style.display='none'">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                              <tr>
          <td colspan="2" style="padding:4px 6px;background:#330d00;border-left:3px solid #ff5500;">
            <span style="color:#ff8844;font-weight:bold;">MS Sasuke</span>:
            <span style="color:#ffaa66;"><strong>Shiroe</strong> sofreu
            <strong style="color:#ff4400;">382 pts</strong> de dano de queimadura.</span>
          </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Rasengan</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">758 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Cajado Eremita - Madara</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">498 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                        <img src="np/armas/Cajado_Eremita_Madara.png" width="70" height="70" onerror="this.style.display='none'">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Raikiri</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">769 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Chidori Nagashi</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">509 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#0a1f0a;border-left:3px solid #2d6b2d;">
          <td style="padding:5px 4px;">
                          <strong>Shiroe</strong> usa <strong style="color:#ffcc66;">Rasen Shuriken</strong>
              contra <strong>Sai</strong> causando
              <strong style="color:#ff3300;">762 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                                      <tr style="background:#1f0a0a;border-left:3px solid #6b2d2d;">
          <td style="padding:5px 4px;">
                          <strong>Sai</strong> usa <strong style="color:#ffcc66;">Raikiri</strong>
              contra <strong>Shiroe</strong> causando
              <strong style="color:#ff3300;">448 pts</strong> de dano.
                                                  </td>
          <td width="95" align="center">
                      </td>
        </tr>
        <tr><td colspan="2"><div class="box_preto_separador">&nbsp;</div></td></tr>
                            <tr><td colspan="2"><div class="avisos_erro">Shiroe perdeu a batalha devido a sua energia vital ter caído abaixo de 10 pontos.</div></td></tr>
                  </tbody>
    </table></td>
    <td class="box_preto_simples_lateral_dir">&nbsp;</td>
  </tr>
  <tr>
    <td><img src="img/fundo_box_simples_12.jpg" width="18" height="21"></td>
    <td><img src="img/fundo_box_simples_13.jpg" width="514" height="21"></td>
    <td><img src="img/fundo_box_simples_16.jpg" width="22" height="21"></td>
  </tr></tbody>
</table>

<table border="0" cellspacing="0" cellpadding="0">
  <tbody><tr>
    <td><img src="img/fundo_box_simples_01.jpg" width="18" height="32"></td>
    <td class="box_preto_novo_simples_sup"><table border="0" cellspacing="0" cellpadding="0"><tbody><tr>
      <td><img src="img/logo_simples.png" width="23" height="32"></td>
      <td style="padding-top:3px;">&nbsp;Resultado final</td>
    </tr></tbody></table></td>
    <td><span class="box_preto_novo_sup_dir"><img src="img/fundo_box_simples_03.jpg" width="22" height="32"></span></td>
  </tr>
  <tr>
    <td valign="top" class="box_preto_simples_lateral_esq"><img src="img/fundo_box_simples_05.jpg" width="18" height="32"></td>
    <td class="box_preto_cor_central"><table border="0" cellspacing="0" cellpadding="0" class="box_largura_100">
      <tbody>
      <tr class="box_preto_tarja">
        <td>Players</td><td>| Danos causados</td><td>| Danos sofridos</td><td>| Energia vital final</td>
      </tr>
      <tr>
        <td>Shiroe</td>
        <td>| 6.128</td>
        <td>| 5.199</td>
        <td>| 1</td>
      </tr>
      <tr>
        <td>Sai</td>
        <td>| 5.199</td>
        <td>| 6.128</td>
        <td>| 92,1%</td>
      </tr>
      </tbody>
    </table>
    <div class="box_vermelho_separador">&nbsp;</div>
        <div class="avisos_erro">
      <strong style="color:#ff6644;">⚠️ O invasor Sai AINDA NÃO foi derrotado.</strong><br>
      Você foi derrotado no combate, mas causou <strong>6.128</strong> de dano!<br>
      HP restante do invasor: <strong>92,1%</strong><br>
      <span style="font-size:11px;color:#999;">Este é um evento coletivo: o invasor só é derrotado quando o dano de TODOS os jogadores somar sua vida total. Continue atacando a cada 10 minutos!</span>
    </div>
        <div class="box_preto_separador">&nbsp;</div>
    <div class="avisos_erro">Sua energia vital foi totalmente restaurada! Você ganhou <strong>66 XP</strong>.</div>
                <div class="box_preto_separador">&nbsp;</div>
    <div style="text-align:center;color:#555;font-size:11px;">Nenhum item dropado desta vez.</div>
        <div style="text-align:center;padding:8px 0;">
      <a href="invasor" style="color:#fc0;font-weight:bold;">« Voltar para o Invasor</a>
    </div>
    </td>
    <td class="box_preto_simples_lateral_dir">&nbsp;</td>
  </tr>
  <tr>
    <td><img src="img/fundo_box_simples_12.jpg" width="18" height="21"></td>
    <td><img src="img/fundo_box_simples_13.jpg" width="514" height="21"></td>
    <td><img src="img/fundo_box_simples_16.jpg" width="22" height="21"></td>
  </tr></tbody>
</table>

	  </div>