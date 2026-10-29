# Testes

Testes automáticos usados durante o desenvolvimento (Playwright + Chromium, sem nada instalado no projeto).

```bash
# na pasta do projeto
python3 -m http.server 8765 &          # serve o app
npm i -g playwright && npx playwright install chromium   # só se ainda não tiver
node tests/clique.js                    # toque nos músculos e juntas
node tests/variacoes.js                 # sinergistas e variações (1.325 combinações)
node tests/janelas.js                   # Montar treino, Trocar, Treinos prontos, Cartão para Stories
node tests/aovivo.js
node tests/conquistas.js
node tests/como-fazer.js
node tests/como-fazer-aovivo.js
node tests/como-fazer-json.js           # sem navegador: pt/en/es do "Como fazer" batem
node tests/peso.js
node tests/treinos-prontos.js
node tests/sequencia.js
node tests/i18n-coleta.js pt && node tests/i18n-coleta.js en && node tests/i18n-coleta.js es && node tests/i18n-sobras.js
```

- Outro endereço: `BASE=http://localhost:9000/index.html node tests/clique.js`.
- Prints e coletas vão para `tests/out/` (fora do Git).
- Cada teste termina com `errs []` (ou `erros []`) quando a página não teve erros. Erros `ERR_TUNNEL_CONNECTION_FAILED` são só fontes da web bloqueadas no ambiente de teste.
- Os testes apagam o `localStorage` da página de teste e semeiam dados de exemplo; não use contra o seu celular.
