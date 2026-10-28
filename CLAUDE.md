# Atlas Muscular — contexto para o Claude

Leia este arquivo antes de mexer no projeto. Ele resume como o app funciona e as decisões já tomadas com o dono.
Histórico completo das mudanças: [docs/HISTORICO.md](docs/HISTORICO.md). Todas as fontes e links: [docs/FONTES.md](docs/FONTES.md).

## O que é

App de academia em português (pt-BR), instalável no celular (PWA), publicado pelo GitHub Pages:
**https://holmgds-gui.github.io/atlas-muscular/**

- **Atlas**: boneco anatômico clicável (frente/costas, corpo ♂/♀). Tocar num músculo deixa ele vermelho e lista exercícios em ordem de estímulo. Tocar num exercício pinta os sinergistas de laranja e mostra botões de **variação** (pegada, largura, equipamento, banco, posição, lado) que mudam alvo e sinergistas.
- **Meus treinos** (aba `ficha`, rótulo "Treinos" na barra de baixo): biblioteca de treinos montados (nome, exercícios, séries, reps, dias opcionais).
- **Hoje** (aba `treino`): grade da semana com o que foi feito, todos os treinos com "Marcar como feito", "Anotar séries" opcional e treino personalizado só para hoje (que pode virar treino fixo). Tocar num dia passado da grade (ou ‹ para semanas anteriores) registra naquele dia; futuro nunca.
- **Progresso** (aba `prog`): duas sub-abas. **Músculos**: mapa de calor dos músculos treinados na semana ou no dia, com faixas baseadas em pesquisa, e radar de **Equilíbrio** (6 grupos). **Força** (`pView` `kg`): em cima o **Ranking de força** (nível por grupo em 9 faixas: Ameba, Aprendiz, Frango, Galo, Fortinho, Parrudo, Monstro, Lenda, Bizarro; boneco colorido, peso corporal, ♂/♀ e cargas digitadas); embaixo a evolução de carga por exercício (gráfico da maior carga do dia + força estimada, recorde, última, quanto subiu, 1 mês/3 meses/Tudo).
- O título "Atlas Muscular" (`#brandBtn`) leva sempre para o Atlas.
- **Configurações** (aba `conf`, `#tab-conf`, `renderConf()`): abre pela engrenagem no canto superior direito, ao lado da busca (`#gearBtn`). Ajustes em `CONF` (`localStorage` `atlas-conf`, padrões em `CONF_DEF`, `applyConf()`; vai no backup).
  - Funcionam: nome (saudação na aba Hoje), peso e ♂/♀ (os mesmos do ranking), tema (`data-theme`), cor de destaque (`--accent`: título, aba atual e interruptores; o músculo-alvo continua vermelho), tamanho da letra (classes `fs-s`/`fs-l`; `buildFsCSS()` copia todo `font-size` em px das folhas de estilo com fator 0,9/1,15, menos cabeçalho, abas e grade da semana; `zoom` falhou), reduzir animações (`noanim`), séries × reps padrão ao adicionar exercício, meta semanal ("2 de 4 treinos" na grade de Hoje), backup (saiu da aba Hoje), apagar histórico/cargas digitadas/tudo (com confirmação), compartilhar, sugestões (issue no GitHub), fontes e versão (lida do cache do service worker).
  - Idioma: português, inglês ou espanhol (ver **Idioma** abaixo).
  - Guardados mas "em breve" (pedido do dono: mostrar mesmo sem função): libras, timer de descanso, lembrete de treino (dias e hora), sons, vibração, conta e sincronização; altura e experiência ficam só no perfil; a idade ajusta o ranking a partir dos 40.
- Cada aba tem um **+** pequeno ao lado do título que abre uma ajuda da página.
- **Idioma** (português / inglês / espanhol, tudo traduzido a pedido do dono): `LANG` (`pt`/`en`/`es`) é lido no início (Configurações › Idioma; na primeira vez segue o idioma do celular: pt → português, es → espanhol, outro → inglês) e trocar recarrega o app. Inglês e espanhol usam as mesmas chaves em português: `EN_DATA`/`EN_UI`/`EN_PAT` e `ES_DATA`/`ES_UI`/`ES_PAT`; o código usa `TR_D`/`TR_U`/`TR_P` (a tabela do idioma atual). Duas camadas:
  1. Dados (exercícios, variações, notas, músculos, articulações, fontes) traduzidos no lugar por `trData()` com `TR_D` antes de montar as listas. No espanhol o sufixo do banco concorda com o nome ("Press de banca plano", "Aperturas planas": `SUFM`/`SUFF`); no inglês vira prefixo ("Flat bench press"). No espanhol o nome em inglês continua como subtítulo do cartão. A busca continua aceitando nomes em português (`f.np`, `f._pt`, `o.npt`) e usa `famPop()` para desempatar.
  2. Todo o resto passa pelo tradutor da página (`trStr`, `trEl` e um `MutationObserver`): cada texto, `title`, `aria-label` e `placeholder` é procurado em `TR_U` (texto exato), `TR_D` ou `TR_P` (texto com números/nomes, `{0}`, `{1}`…). Datas usam `LOC`; dias em `DAYS`/`DSH`. Trechos montados no código usam `LANG==="en"?…:LANG==="es"?…:…`.
  - **Regra**: todo texto novo na interface precisa de entrada em `EN_UI`/`EN_PAT` **e** em `ES_UI`/`ES_PAT` (ou de um ternário com os três idiomas), senão aparece em português. Use `data-notr` em elementos que não devem ser traduzidos. Teste rodando o app com `locale:"en-US"` e `"es-ES"` e comparando com o português (textos iguais = sobras).
  - Níveis do ranking em inglês: Amoeba, Rookie, Chicken, Rooster, Buff, Beefy, Monster, Legend, Freak. Em espanhol: Ameba, Aprendiz, Pollito, Gallo, Fuertecito, Macizo, Monstruo, Leyenda, Fenómeno.

Repositório e conta: **holmgds-gui/atlas-muscular**. Use só a conta `holmgds-gui`. Uma conta errada (`davigms-pve`) já apareceu conectada uma vez; ela **não** é do dono, não use.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O app inteiro: CSS, HTML e JS num arquivo só, sem build e sem dependências |
| `sw.js` | Service worker (offline). `const CACHE="atlas-vNN"` |
| `manifest.webmanifest`, `icon-*.png` | Instalação como app |
| `README.md` | Descrição curta para quem abre o repositório |
| `docs/` | Histórico e fontes |
| `tools/` | Fonte das famílias de exercícios (`fam1-3.js`), mapa dos nomes antigos (`map.js`) e o gerador (`build.js`) |

## Como publicar uma mudança

1. Edite `index.html`.
2. **Suba o número do cache** em `sw.js` (`atlas-v42` → `atlas-v43`). Sem isso, celulares podem continuar com a versão velha.
3. Commit na `main` e push. O GitHub Pages publica em ~1 minuto.
4. Avise o dono: se o celular mostrar a versão antiga, fechar o app por completo e abrir de novo.

## Mapa do `index.html` (ordem no arquivo)

- `<style>`: tokens de cor em `:root` com tema claro/escuro; layout de celular em `@media (max-width:900px)`.
- Markup: header com abas (`.htabs`), `#tab-atlas` (stage + panel), `#tab-ficha`, `#tab-treino`, `#tab-prog`, barra de baixo (`.btabs`), modais `#picker`, `#addSheet`, `#helpSheet`.
- **Dados**
  - `EQ`: equipamentos. `SRC`: fontes citadas no app.
  - **Famílias de exercícios** (`FAMS`, gerado por `tools/build.js`): 98 exercícios, cada um com `p` (alvo), `s` (sinergistas) em códigos curtos (`MC`), eixos `ax` = `[chave, rótulo, separa?, opções]` e padrão `d`. Opção: `{k, n, eq, m (mudanças), t (explicação), nm (troca o nome), suf (sufixo), q (não aparece no nome)}`. Mudanças `m`: `*x` vira alvo, `~x` vira sinergista, `^x` sinergista na frente, `+x` adiciona, `-x` remove. 1.325 combinações.
  - Referência de variação: `"familia|eixo=opção,..."` (`mkRef`, `parseRef`, `resolveV`, `vName`, `vEq`, `vNotes`).
  - `M`: músculos. Cada um tem `{n, l, c, s:[fontes], x:[[ref, evidência, destaque?]]}`; ao carregar, `mkEntry` expande cada item para `[nome, en, equipamento, evidência, [músculos envolvidos menos o da lista], destaque, ref]` com `.f`, `.pre` (variação do ranking), `.sel` (escolhida agora), `.p`, `.s`, `.host`. `fillEntry` recalcula ao trocar variação.
  - Cartões iguais na mesma lista (mesma família e mesmos eixos "separa") viraram um só; eixos que separam (ex.: banco do supino, posição da panturrilha) continuam cartões diferentes.
  - `LEGACY`: nome antigo → ref, para treinos salvos antes. `refByName`/`exInfo(name, ref)` resolvem qualquer nome (antigo ou novo).
  - Busca (`famSearch`): nomes de academia (`aka`), rótulos das opções e sinônimos (`OSYN`); palavras que batem com uma opção já a escolhem; ignora "com/de/na…".
  - Evidência: `H` (estudo de hipertrofia), `E` (EMG), `B` (biomecânica). A lista já está **ordenada por estímulo**: crescimento > EMG > mecânica.
- **Boneco** (redesenhado a pedido do dono para ficar natural, no estilo de pranchas de anatomia: pose em pé com os braços um pouco abertos, ~8 cabeças de altura, mãos com dedos e pés; músculos em cinza sólido sobre a "pele" mais clara, sem degradê, **com fibras** — o dono pediu as fibras de volta)
  - `SKIN` (base do corpo), `EXTR.front/back` (mãos e pés), `FRONT`, `BACK` (clicáveis), `DECO` (músculos de enfeite: esternocleidomastoide, sartório, tibial), `TEND`, `LINES` (dedos): caminhos SVG. Metade esquerda desenhada e espelhada. Músculos dos membros vêm antes no array, para os do tronco (deltoide, glúteos) ficarem por cima.
  - O tronco ("t") está em coordenadas da página do corpo masculino; os membros em referenciais locais (y ao longo do membro, −x lateral). `headPath()`/`earPath()` desenham a cabeça a partir de `BD.head` = [meia largura, meia altura, centro].
  - `BODY` (m/f) + `shapeBody()` + `warp()`: masculino sem distorção (`w`=1); o feminino estreita o tronco por altura (`w`) e alarga o quadril, com ombros (`S`), braços e pernas próprios. Ângulos: braço 14°, antebraço 8°, coxa −1,5° (joelho para dentro).
  - Fibras (`FIB`, `fibD()`, `addFib()`): linhas finas (`.fib`, cor `--fiber`) cortadas pelo formato de cada músculo com um `clipPath`. Padrão = fuso (curvas de ponta a ponta no eixo mais comprido do músculo, calculado pelos pontos do desenho); `["f",x,y]` = leque convergindo num tendão (peitoral, deltoides, dorsal, trapézio, glúteo médio, infraespinhal); `["a",graus]` = folha de fibras paralelas (abdômen, oblíquos, romboides, eretores, glúteo máximo). Também nos músculos de enfeite. Aparecem também nos bonecos do Progresso e do ranking (o dono achou o de Força "liso"): `figCopy()` clona a vista e dá ids novos aos `clipPath`; os músculos de enfeite aparecem também.
  - Cores: `--m` (músculo), `--fig-skin` (pele e separação entre músculos), `--fig-art`/`--fig-art2` (modo Articulações). Classe `.ext` = cabeça, mãos e pés.
  - O feminino tem cabelo preso (coque, com linha do cabelo na testa), contorno suave dos seios (`BREAST`, sem contorno branco, sem clique), braços mais finos (o dono achou "robustão": largura 0,79/0,80/0,86) e ombros, cintura e quadril próprios.
  - `buildFigure()` redesenha tudo ao trocar ♂/♀.
- **Zoom/pan**: `BOX`, `vb`, `setView`, `zoomAt`. No celular o boneco usa eventos de toque (`touchstart/move/end`: toque, arrastar, pinça com dois dedos); ponteiro só para mouse/caneta (`pointerType==="touch"` é ignorado). A página em si **não** dá zoom (pedido do dono: zoom só onde precisa): viewport com `maximum-scale=1,user-scalable=no`, `touch-action:pan-x pan-y` em `html`/`body` e `gesturestart` bloqueado (Safari). Os bonecos do Progresso e do ranking têm zoom próprio (`zoomable()`): dois dedos aproximam, um dedo move quando está aproximado (senão rola a página), ctrl + roda/pinça do trackpad no computador, ⤢ volta.
- **Modelos**
  - `BASIC` + `TOB`: o modelo Básico agrupa partes com a **mesma arte** do Detalhado; só o vermelho pinta o grupo inteiro.
  - `JOINTS`: Articulações, com aquecimento, mobilidade e alongamento estático.
- **Painel**
  - `paint()`, `render()`, `exCard()`, `updateIdle()`.
  - Estados no celular: `.idle` (boneco grande), `.covered` (boneco pequeno no canto e lista cobrindo), `peek` (ampliar boneco).
- **Ranking** (antes de `setTab`; desenhado no topo de Progresso › Força por `renderKg()` → `rankHTML(D)` + `rankAfter(D)`; `renderRank()` redesenha mantendo a rolagem; eventos no `#progBody`)
  - `RSTD`: padrões do Strength Level `[nome, unidade l/k, 5 valores ♂, 5 valores ♀, k?]` (Beginner→Elite, 1RM, praticante típico de `RSW` = 77 kg ♂ / 65 kg ♀). Com `k`, os valores são peso **extra** (barra fixa, mergulho, extensão lombar) e `k` é a fração do corpo movida.
  - `rStd(f, sel)`: família/variação → `{k: padrão, x: fator, as?: assistida, bw?: fração do peso corporal}` ou `null` (sem padrão). Com `bw` (flexão ≈ 0,69 no chão / 0,74 pés elevados / 0,45 mãos elevadas, comparada ao supino; remada invertida ≈ 0,55, comparada à remada curvada) a carga é `bw × peso + peso extra`. `rBody()` = exercício que conta o corpo (barra, mergulho, extensão lombar, flexão, remada invertida): nesses a conta aceita até 30 reps (nos outros, 20), e "quanto falta" aparece em repetições só com o corpo. Fator converte a força estimada do exercício na do padrão.
  - Fontes misturadas (escolha do dono): `RSLOG` = faixas do StrengthLog em kg no peso de referência (supino, agachamento, terra, desenvolvimento) → média geométrica com o `RSTD`; os outros exercícios usam `RSTD` × `RMIX` (diferença média entre as bases por faixa).
  - `rThr()`: faixas ajustadas ao peso com (peso ÷ referência)^`RBWX` (0,9 ♂ / 0,6 ♀, tirado das tabelas) × `rAgeF()` (idade de `CONF.age`, só a partir dos 40, tabela `RAGE`).
  - `rE1()`: força estimada do ranking = Epley até 12 reps, cada rep acima vale metade; `rE1r()` é o inverso (para "quanto falta"). Cargas continua com `e1rm` (Epley puro).
  - Grupo com um exercício só mostra "pouca informação" (`.rk-low`).
  - `rScore()`: nota contínua (1 = Beginner 5% · 2 = Novice 20% · 3 = Intermediate 50% · 4 = Advanced 80% · 5 = Elite 95% · 6 = um degrau além). `RPT` = percentis onde cada nível começa e `RB` = os mesmos limites na nota (convertidos por `RPCT`). `rLv()`, `rPct()`, `rVal()` (inverso, para "quanto falta"), `rPos()` (posição na barra, 9 partes iguais).
  - `rankData()`: melhor série (`rE1`, reps até 20; 30 nos de peso do corpo) por variação nos treinos feitos dos últimos 182 dias + digitadas (`rank.man`); cada exercício conta para todos os grupos `BASIC` dos seus alvos; grupo = média; geral = média dos grupos.
  - `rank` (`localStorage` `atlas-rank`): `{bw, man:[{id, ref, kg, r, date}]}`. Vai no backup.
  - Cores estilo videogame, escolhidas pelo dono: `--lv0…--lv8` = cinza, verde, azul, roxo, amarelo, laranja, vermelho, rosa e cinza metálico brilhante (Bizarro usa degradê `--lv8g` e, no boneco, o `linearGradient` `#rkMetal`). Não é escala em ordem, então o nome do nível sempre aparece junto da cor. `RHERO` = mesmas cores mais claras para o quadro escuro do nível geral. No boneco do ranking, músculos sem dados ficam no cinza normal do Atlas (`.rk-has` marca os que têm nível); os bonecos do Progresso e do ranking são iguais ao do Atlas (fibras, separações e músculos de enfeite), só muda a cor.
- **Ajuda**: `HELP` + `openHelp()` (o + das páginas).
- **Treinos e Hoje**
  - `plans` (`localStorage` `atlas-plans`): `{id, name, days:[0..6], items:[{name, sets, reps}]}`.
  - `workouts` (`atlas-workouts`): `{id, date, title, planId, done, notes, items:[{name, ref, target, notes, sets:[{r, kg}]}]}`. Itens de `plans` também guardam `ref` (variação escolhida).
  - `done:false` = começado e **não conta**. `done:true` = conta **todas** as séries. Sem `done` = registro antigo, conta só as séries preenchidas.
  - A ficha antiga (`atlas-ficha`) é convertida em `plans` por `planFromFicha()`.
  - Backup (em Configurações): `version:2` com `{plans, workouts, rank, conf}`; ainda aceita backup antigo com `ficha`. Importar agora salva também o histórico (antes só salvava os treinos montados).
- **Progresso**
  - `exInfo(name, ref)`: músculos-alvo (`p`) e sinergistas (`s`) da variação do item.
  - `tally()`: 1 série por alvo, ½ por sinergista (contagem fracionada).
  - `BANDS`: faixas da semana e do dia. `progFig()` clona o boneco atual e pinta.
  - Radar: `RAD` (Peito, Ombros, Braços, Core = abdômen + lombar, Pernas, Costas = costas + trapézio). Cada ponta = **média** das séries dos grupos do `BASIC` dentro dela, para que o anel da faixa ideal (semana 10–20, dia 3–11) valha igual em todas. `radarCard()`, `radSel`, `applyRadSel()` (toque destaca os músculos no boneco do Progresso).
  - Cargas: `pView` (`mus`/`kg`), `loadData()` agrupa por exercício e dia (série mais pesada e força estimada de Epley, kg × (1 + reps/30)), `renderKg()` e `drawKg()` (SVG à mão com tooltip ao tocar). Só treinos feitos contam. Cores `--k1` (vermelho, linha cheia) e `--k2` (azul, tracejada), validadas para daltonismo nos dois temas.

## Decisões já tomadas (não desfazer sem perguntar)

- **Variações**: um cartão por exercício com botões dentro (decisão do dono). A variação escolhida vai para o treino e conta no Progresso/Cargas. Para mudar exercícios: edite `tools/fam*.js` e `tools/map.js`, rode `node tools/build.js index.html` (com a versão anterior do index) e troque os blocos `const MC=…LEGACY=…` e `const M = {…}` no `index.html`.
- **Sinergistas**: cada exercício tem uma lista canônica de músculos envolvidos, em ordem de importância. A lista de sinergistas mostrada para um músculo é essa lista menos ele mesmo, então é igual em qualquer tela. Estabilizadores só entram quando o exercício os treina de propósito (prancha, caminhada do fazendeiro, pegada pesada). Exercícios sem sinergista visível aparecem como "Isolado".
- Sinergistas ficam laranja **só ao tocar num exercício**, nunca ao tocar só no músculo.
- **Selos**: Hipertrofia (vermelho), Estudo EMG (escuro), Biomecânica (contorno).
- **Corpo**: físico "atlético natural", com cara de quem treina mas sem exagero. Silhueta natural com braços um pouco abertos e cinza sólido (escolha do dono; referência: pranchas de anatomia lisas). No computador o Atlas abre com frente e costas lado a lado ("Ambos"); no celular, a última vista usada. Botão ♂/♀ em SVG (o glifo de fonte ficava torto no iPhone).
- **Celular**: boneco grande até escolher algo; depois ele fica pequeno no canto superior esquerdo e a lista cobre a tela. Vale também para Articulações.
- **Faixas do Progresso**
  - Semana: 0 · 1–3 abaixo do mínimo · 4–9 moderado · 10–20 ideal · 20+ volume alto.
  - Dia: 1–2 leve · 3–5 bom · 6–11 forte · 12+ pouco ganho extra, com aviso acima de ~11.
  - Valem iguais para todos. O dono **não quer total de kg levantado** (volume) em lugar nenhum; evolução de carga por exercício fica só na sub-aba Cargas.
- **Treinos**: montar não conta. Só "Marcar como feito" na aba Hoje conta. Dá para registrar em dias passados (`hDate`/`hWeek`, `selDate()`), nunca no futuro; entrar na aba volta para hoje. Um dia pode ter vários treinos. O treino personalizado de hoje pode ir para Meus treinos com "Salvar em Meus treinos".
- **Ranking de força**: fica em Progresso › Força, em cima da evolução das cargas (decisão do dono; antes era uma tela aberta pelo título). O título leva sempre para o Atlas. Nível do grupo = média de **todos** os exercícios do grupo (pedido do dono), não um exercício representante. Faixas = mistura Strength Level + StrengthLog, ajuste de peso por sexo e de idade (a partir dos 40), reps acima de 12 valendo metade e aviso "pouca informação" (escolhas do dono depois de ver a comparação; ele **não** quis peso maior para exercícios principais). Usa o ♂/♀ do app. Cargas vêm dos treinos feitos + digitadas. Exercícios com o peso do corpo contam o corpo (pedido do dono). 9 níveis escolhidos pelo dono: Ameba <5% · Aprendiz 5–15 · Frango 15–30 · Galo 30–45 · Fortinho 45–60 · Parrudo 60–75 · Monstro 75–88 · Lenda 88–96 · Bizarro top 4% (meio-termo: meio com 15% cada, pontas mais raras).
- **Ajuda**: só o "+" cinza, sem círculo em volta. Além do + de cada aba, há um + menor (`.help.sm`, `HELP.forca`) ao lado de "Força estimada" em Cargas, explicando a conta e para que serve.

## Como trabalhar com o dono

- Ele escreve em português, muitas vezes por voz (pode ter palavras trocadas). Responda em português simples, sem jargão técnico.
- **Antes de mudanças grandes, faça perguntas de múltipla escolha** (ele pede isso com frequência) e explique as opções.
- Usa iPhone (Safari, app na tela de início). Teste sempre o layout de celular (~375–390 px) e o modo escuro.
- Gosta de ver prints do resultado.

## Testes que funcionam

Sirva a pasta com um servidor local (por exemplo `python3 -m http.server 8765`) e use Playwright (Chromium headless):

- **Clique**: para cada `[data-m] > path.m`, amostre pontos e confira com `elementFromPoint` que o próprio músculo recebe o toque (≥85%). Faça para os dois corpos, desktop e celular. Faça o mesmo para as juntas (`.jt`) no modo Articulações.
- **Sinergistas e variações**: para cada músculo e exercício, nos modelos Detalhado e Básico, e para cada opção de cada eixo, confira que todos os músculos esperados (`x[4]`) ficam com `.syn`; toda combinação tem alvo; todo nome em `LEGACY` resolve.
- **Treinos**: semeie `localStorage` (`atlas-plans`, `atlas-workouts`) com `timezoneId: 'America/Sao_Paulo'` e confira que `tally()` só conta treinos feitos.
- Erros externos `ERR_TUNNEL_CONNECTION_FAILED` são só fontes da web bloqueadas no ambiente de teste.
