# Atlas Muscular — contexto para o Claude

Leia este arquivo antes de mexer no projeto. Ele resume como o app funciona e as decisões já tomadas com o dono.
Histórico completo das mudanças: [docs/HISTORICO.md](docs/HISTORICO.md). Todas as fontes e links: [docs/FONTES.md](docs/FONTES.md).

## O que é

App de academia em português (pt-BR), instalável no celular (PWA), publicado pelo GitHub Pages:
**https://holmgds-gui.github.io/atlas-muscular/**

- **Atlas**: boneco anatômico clicável (frente/costas, corpo ♂/♀). Tocar num músculo deixa ele vermelho e lista exercícios em ordem de estímulo. Tocar num exercício pinta os sinergistas de laranja e mostra botões de **variação** (pegada, largura, equipamento, banco, posição, lado) que mudam alvo e sinergistas.
- **Meus treinos** (aba `ficha`, rótulo "Treinos" na barra de baixo): biblioteca de treinos montados (nome, exercícios, séries, reps, dias opcionais).
- **Hoje** (aba `treino`): grade da semana com o que foi feito, todos os treinos com "Marcar como feito", "Anotar séries" opcional e treino personalizado só para hoje (que pode virar treino fixo). Tocar num dia passado da grade (ou ‹ para semanas anteriores) registra naquele dia; futuro nunca.
- **Progresso** (aba `prog`): duas sub-abas. **Músculos**: mapa de calor dos músculos treinados na semana ou no dia, com faixas baseadas em pesquisa, e radar de **Equilíbrio** (6 grupos). **Cargas**: evolução de carga por exercício (gráfico da maior carga do dia + força estimada, recorde, última, quanto subiu, 1 mês/3 meses/Tudo).
- **Ranking de força** (`tab-rank`, abre ao tocar no título "Atlas Muscular", `#brandBtn`; não tem botão nas barras de abas): nível por grupo em 9 faixas (Ameba, Aprendiz, Frango, Galo, Fortinho, Parrudo, Monstro, Lenda, Bizarro), boneco colorido, peso corporal, ♂/♀ e cargas digitadas.
- Cada aba tem um **+** pequeno ao lado do título que abre uma ajuda da página.

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
2. **Suba o número do cache** em `sw.js` (`atlas-v32` → `atlas-v33`). Sem isso, celulares podem continuar com a versão velha.
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
- **Boneco**
  - `FR`, `SKIN`, `EXTR`, `FRONT`, `BACK`, `DECO`, `TEND`: caminhos SVG. Metade esquerda desenhada e espelhada. Membros em referenciais locais.
  - `BODY` (m/f) + `shapeBody()` + `warp()`: as duas silhuetas atléticas. O tronco é escalado de lado conforme a altura (`w`), com um leve volume extra no deltoide (`delt`). Os membros são reconstruídos a partir do ombro (`S`) e do quadril (`H`), e as juntas (`JPT`) acompanham.
  - O feminino tem cabelo preso (coque), contorno suave dos seios (`BREAST`, sem clique) e ombros, cintura e quadril próprios.
  - `buildFigure()` redesenha tudo ao trocar ♂/♀.
- **Zoom/pan**: `BOX`, `vb`, `setView`, `zoomAt`, gestos de ponteiro.
- **Modelos**
  - `BASIC` + `TOB`: o modelo Básico agrupa partes com a **mesma arte** do Detalhado; só o vermelho pinta o grupo inteiro.
  - `JOINTS`: Articulações, com aquecimento, mobilidade e alongamento estático.
- **Painel**
  - `paint()`, `render()`, `exCard()`, `updateIdle()`.
  - Estados no celular: `.idle` (boneco grande), `.covered` (boneco pequeno no canto e lista cobrindo), `peek` (ampliar boneco).
- **Ranking** (antes de `setTab`)
  - `RSTD`: padrões do Strength Level `[nome, unidade l/k, 5 valores ♂, 5 valores ♀, k?]` (Beginner→Elite, 1RM, praticante típico de `RSW` = 77 kg ♂ / 65 kg ♀). Com `k`, os valores são peso **extra** (barra fixa, mergulho, extensão lombar) e `k` é a fração do corpo movida.
  - `rStd(f, sel)`: família/variação → `{k: padrão, x: fator, as?: assistida}` ou `null` (sem padrão). Fator converte a força estimada do exercício na do padrão.
  - `rThr()`: faixas ajustadas ao peso com (peso ÷ referência)^⅔. `rScore()`: nota contínua (1 = Beginner 5% · 2 = Novice 20% · 3 = Intermediate 50% · 4 = Advanced 80% · 5 = Elite 95% · 6 = um degrau além). `RPT` = percentis onde cada nível começa e `RB` = os mesmos limites na nota (convertidos por `RPCT`). `rLv()`, `rPct()`, `rVal()` (inverso, para "quanto falta"), `rPos()` (posição na barra, 9 partes iguais).
  - `rankData()`: melhor série (Epley, reps até 20) por variação nos treinos feitos dos últimos 182 dias + digitadas (`rank.man`); cada exercício conta para todos os grupos `BASIC` dos seus alvos; grupo = média; geral = média dos grupos.
  - `rank` (`localStorage` `atlas-rank`): `{bw, man:[{id, ref, kg, r, date}]}`. Vai no backup.
  - Cores estilo videogame, escolhidas pelo dono: `--lv0…--lv8` = cinza, verde, azul, roxo, amarelo, laranja, vermelho, rosa e cinza metálico brilhante (Bizarro usa degradê `--lv8g` e, no boneco, o `linearGradient` `#rkMetal`). Não é escala em ordem, então o nome do nível sempre aparece junto da cor. `RHERO` = mesmas cores mais claras para o quadro escuro do nível geral. No boneco do ranking, músculos sem dados ficam apagados (`.rk-has`).
- **Ajuda**: `HELP` + `openHelp()` (o + das páginas).
- **Treinos e Hoje**
  - `plans` (`localStorage` `atlas-plans`): `{id, name, days:[0..6], items:[{name, sets, reps}]}`.
  - `workouts` (`atlas-workouts`): `{id, date, title, planId, done, notes, items:[{name, ref, target, notes, sets:[{r, kg}]}]}`. Itens de `plans` também guardam `ref` (variação escolhida).
  - `done:false` = começado e **não conta**. `done:true` = conta **todas** as séries. Sem `done` = registro antigo, conta só as séries preenchidas.
  - A ficha antiga (`atlas-ficha`) é convertida em `plans` por `planFromFicha()`.
  - Backup: `version:2` com `{plans, workouts}`; ainda aceita backup antigo com `ficha`.
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
- **Corpo**: físico "atlético natural", com cara de quem treina mas sem exagero. Botão ♂/♀ em SVG (o glifo de fonte ficava torto no iPhone).
- **Celular**: boneco grande até escolher algo; depois ele fica pequeno no canto superior esquerdo e a lista cobre a tela. Vale também para Articulações.
- **Faixas do Progresso**
  - Semana: 0 · 1–3 abaixo do mínimo · 4–9 moderado · 10–20 ideal · 20+ volume alto.
  - Dia: 1–2 leve · 3–5 bom · 6–11 forte · 12+ pouco ganho extra, com aviso acima de ~11.
  - Valem iguais para todos. O dono **não quer total de kg levantado** (volume) em lugar nenhum; evolução de carga por exercício fica só na sub-aba Cargas.
- **Treinos**: montar não conta. Só "Marcar como feito" na aba Hoje conta. Dá para registrar em dias passados (`hDate`/`hWeek`, `selDate()`), nunca no futuro; entrar na aba volta para hoje. Um dia pode ter vários treinos. O treino personalizado de hoje pode ir para Meus treinos com "Salvar em Meus treinos".
- **Ranking de força**: abre pelo título, é uma tela à parte; tocar no título de novo, já no ranking, volta para a página inicial (Atlas). Nível do grupo = média de **todos** os exercícios do grupo (pedido do dono), não um exercício representante. Usa o ♂/♀ do app. Cargas vêm dos treinos feitos + digitadas. 9 níveis escolhidos pelo dono: Ameba <5% · Aprendiz 5–15 · Frango 15–30 · Galo 30–45 · Fortinho 45–60 · Parrudo 60–75 · Monstro 75–88 · Lenda 88–96 · Bizarro top 4% (meio-termo: meio com 15% cada, pontas mais raras).
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
