# Testes

Testes automáticos usados durante o desenvolvimento (Playwright + Chromium, sem nada instalado no projeto).

```bash
# na pasta do projeto
python3 -m http.server 8765 &          # serve o app
npm i -g playwright && npx playwright install chromium   # só se ainda não tiver
node tests/clique.js                    # toque nos músculos e juntas
node tests/variacoes.js                 # sinergistas e variações (1.325 combinações)
node tests/arrastar.js                   # painel do Atlas e janelas que se arrastam (simula o dedo)
node tests/modos.js                      # Atlas › seletor de modos: arrastar, setas, ordem, acompanha o modo
node tests/paginas.js                    # arrastar para o lado passa de página em página, a página segue o dedo, vibra (e não no boneco/campos)
node tests/abas.js                       # barras de abas: a pílula desliza ao tocar e segue o dedo ao arrastar
node tests/reordenar.js                  # Meus treinos: segurar a alça ≡ e arrastar muda a ordem
node tests/tres-d.js                     # boneco 3D: botão, limites da câmera, toque igual ao 2D, Grupos/Cardio, juntas em Articulações, botão pequeno com lista, ♀ troca para o corpo feminino e tocar no seio escolhe o peitoral; ⤢ fora do celular (sem internet: THREE_DIR=<pasta do three@0.160.0>)
node tests/grupos.js                     # Atlas › Grupos: 6 cores, lista que abre, destaque sem abrir exercícios, idiomas
node tests/treinos-famosos.js           # Treinos dos famosos: exercícios/variações válidos, filtros, programa todo, idiomas
node tests/janelas.js                   # Montar treino, Trocar, Treinos prontos, Cartão para Stories
node tests/aovivo.js
node tests/conquistas.js
node tests/como-fazer.js
node tests/como-fazer-aovivo.js
node tests/como-fazer-json.js           # sem navegador: pt/en/es do "Como fazer" batem
node tests/peso.js
node tests/treinos-prontos.js
node tests/sequencia.js
node tests/cardio-carga.js              # carga nos Meus treinos e cardio (seletor, Registro, Ao vivo, avulso, Progresso, conquistas)
node tests/cardio-atlas.js              # Atlas › 🏃 Cardio: ordem por gasto, intensidade/tempo, músculos pintados, + no treino
node tests/cardio-conta.js              # cardio vale meio treino (20 min+, forte em dobro; dia de musculação não soma)
node tests/cardio-progresso.js          # cardio no boneco do Progresso (clarinho), anel da OMS e barras por dia
node tests/apresentacao.js              # carrossel da 1ª vez (iPhone, Android, computador, app instalado)
node tests/i18n-coleta.js pt && node tests/i18n-coleta.js en && node tests/i18n-coleta.js es && node tests/i18n-sobras.js
```

- Outro endereço: `BASE=http://localhost:9000/index.html node tests/clique.js`.
- Prints e coletas vão para `tests/out/` (fora do Git).
- Cada teste termina com `errs []` (ou `erros []`) quando a página não teve erros. Erros `ERR_TUNNEL_CONNECTION_FAILED` são só fontes da web bloqueadas no ambiente de teste.
- Os outros testes marcam `atlas-intro` com `addInitScript`, para o carrossel de boas-vindas não cobrir a tela. Teste novo: faça o mesmo.
- Os testes apagam o `localStorage` da página de teste e semeiam dados de exemplo; não use contra o seu celular.
