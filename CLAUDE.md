# Atlas Muscular — contexto para o Claude

Leia este arquivo antes de mexer no projeto. Ele resume como o app funciona e as decisões já tomadas com o dono.
Histórico completo das mudanças: [docs/HISTORICO.md](docs/HISTORICO.md). Todas as fontes e links: [docs/FONTES.md](docs/FONTES.md).

## O que é

App de academia em português (pt-BR), instalável no celular (PWA), publicado pelo GitHub Pages:
**https://holmgds-gui.github.io/atlas-muscular/**

- **Atlas**: boneco anatômico clicável (frente/costas, corpo ♂/♀). Tocar num músculo deixa ele vermelho e lista exercícios em ordem de estímulo. Tocar num exercício pinta os sinergistas de laranja.
- **Meus treinos** (aba `ficha`, rótulo "Treinos" na barra de baixo): biblioteca de treinos montados (nome, exercícios, séries, reps, dias opcionais).
- **Hoje** (aba `treino`): grade da semana com o que foi feito, todos os treinos com "Marcar como feito", "Anotar séries" opcional e treino personalizado só para hoje (que pode virar treino fixo). Tocar num dia passado da grade (ou ‹ para semanas anteriores) registra naquele dia; futuro nunca.
- **Progresso** (aba `prog`): duas sub-abas. **Músculos**: mapa de calor dos músculos treinados na semana ou no dia, com faixas baseadas em pesquisa. **Cargas**: evolução de carga por exercício (gráfico da maior carga do dia + força estimada, recorde, última, quanto subiu, 1 mês/3 meses/Tudo).
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

## Como publicar uma mudança

1. Edite `index.html`.
2. **Suba o número do cache** em `sw.js` (`atlas-v24` → `atlas-v25`). Sem isso, celulares podem continuar com a versão velha.
3. Commit na `main` e push. O GitHub Pages publica em ~1 minuto.
4. Avise o dono: se o celular mostrar a versão antiga, fechar o app por completo e abrir de novo.

## Mapa do `index.html` (ordem no arquivo)

- `<style>`: tokens de cor em `:root` com tema claro/escuro; layout de celular em `@media (max-width:900px)`.
- Markup: header com abas (`.htabs`), `#tab-atlas` (stage + panel), `#tab-ficha`, `#tab-treino`, `#tab-prog`, barra de baixo (`.btabs`), modais `#picker`, `#addSheet`, `#helpSheet`.
- **Dados**
  - `EQ`: equipamentos. `SRC`: fontes citadas no app.
  - `M`: músculos. Cada um tem `{n, l, c, s:[fontes], x:[exercícios]}`.
  - Exercício = `[nome pt, nome en, equipamento, evidência, [sinergistas], destaque?]`.
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
- **Ajuda**: `HELP` + `openHelp()` (o + das páginas).
- **Treinos e Hoje**
  - `plans` (`localStorage` `atlas-plans`): `{id, name, days:[0..6], items:[{name, sets, reps}]}`.
  - `workouts` (`atlas-workouts`): `{id, date, title, planId, done, notes, items:[{name, target, notes, sets:[{r, kg}]}]}`.
  - `done:false` = começado e **não conta**. `done:true` = conta **todas** as séries. Sem `done` = registro antigo, conta só as séries preenchidas.
  - A ficha antiga (`atlas-ficha`) é convertida em `plans` por `planFromFicha()`.
  - Backup: `version:2` com `{plans, workouts}`; ainda aceita backup antigo com `ficha`.
- **Progresso**
  - `EXMAP`: para cada nome de exercício, `p` = músculos-alvo (as listas em que ele aparece) e `s` = sinergistas.
  - `tally()`: 1 série por alvo, ½ por sinergista (contagem fracionada).
  - `BANDS`: faixas da semana e do dia. `progFig()` clona o boneco atual e pinta.
  - Cargas: `pView` (`mus`/`kg`), `loadData()` agrupa por exercício e dia (série mais pesada e força estimada de Epley, kg × (1 + reps/30)), `renderKg()` e `drawKg()` (SVG à mão com tooltip ao tocar). Só treinos feitos contam. Cores `--k1` (vermelho, linha cheia) e `--k2` (azul, tracejada), validadas para daltonismo nos dois temas.

## Decisões já tomadas (não desfazer sem perguntar)

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
- **Ajuda**: só o "+" cinza, sem círculo em volta. Além do + de cada aba, há um + menor (`.help.sm`, `HELP.forca`) ao lado de "Força estimada" em Cargas, explicando a conta e para que serve.

## Como trabalhar com o dono

- Ele escreve em português, muitas vezes por voz (pode ter palavras trocadas). Responda em português simples, sem jargão técnico.
- **Antes de mudanças grandes, faça perguntas de múltipla escolha** (ele pede isso com frequência) e explique as opções.
- Usa iPhone (Safari, app na tela de início). Teste sempre o layout de celular (~375–390 px) e o modo escuro.
- Gosta de ver prints do resultado.

## Testes que funcionam

Sirva a pasta com um servidor local (por exemplo `python3 -m http.server 8765`) e use Playwright (Chromium headless):

- **Clique**: para cada `[data-m] > path.m`, amostre pontos e confira com `elementFromPoint` que o próprio músculo recebe o toque (≥85%). Faça para os dois corpos, desktop e celular. Faça o mesmo para as juntas (`.jt`) no modo Articulações.
- **Sinergistas**: para cada músculo e exercício, nos modelos Detalhado e Básico, confira que todos os sinergistas esperados ficam com `.syn`.
- **Treinos**: semeie `localStorage` (`atlas-plans`, `atlas-workouts`) com `timezoneId: 'America/Sao_Paulo'` e confira que `tally()` só conta treinos feitos.
- Erros externos `ERR_TUNNEL_CONNECTION_FAILED` são só fontes da web bloqueadas no ambiente de teste.
