# Muscle Atlas — contexto para o Claude

App de academia (PWA) em pt/en/es, publicado pelo GitHub Pages: **https://holmgds-gui.github.io/atlas-muscular/**
Repositório **holmgds-gui/atlas-muscular**. Use só a conta `holmgds-gui` (a conta `davigms-pve` **não** é do dono, não use).

**Este arquivo é curto de propósito** (é relido a cada passo). Os detalhes de cada parte do app — nomes de funções, variáveis,
chaves do `localStorage`, decisões e o porquê — ficam em **[docs/DETALHES.md](docs/DETALHES.md)**. Antes de mexer numa parte,
procure a seção dela lá (`grep -n "\*\*Cardio\*\*" docs/DETALHES.md`) e leia só aquele trecho; ao mudar, atualize o trecho.
Histórico: [docs/HISTORICO.md](docs/HISTORICO.md). Fontes científicas e links: [docs/FONTES.md](docs/FONTES.md).

## Como trabalhar com o dono

- Guilherme escreve em português, muitas vezes por voz (pode ter palavras trocadas). Responda em português simples, sem jargão.
- **Antes de mudanças grandes, faça perguntas de múltipla escolha** e explique as opções.
- Usa iPhone (Safari, app na tela de início) e um PC Windows. Teste o layout de celular (~375–390 px) nos temas claro e escuro.
- Gosta de ver prints do resultado.
- O repositório é **público**: nada de senhas, chaves, keystore (`*.jks`) ou dados pessoais nos commits. Senhas e segredos do GitHub quem digita é o dono.

## Como publicar uma mudança

1. Edite os arquivos (o app quase todo está em `index.html`).
2. **Suba a versão** em `sw.js` (`const CACHE="atlas-v0.56"` → `0.57`; é o número que aparece em Configurações › Versão).
3. Registre em `docs/HISTORICO.md` e atualize o trecho da parte mexida em `docs/DETALHES.md`.
4. Commit na `main` e push (o GitHub Pages publica em ~1 min; o push também gera o app Android pelo workflow "App Android").
5. Avise o dono: se o celular mostrar a versão antiga, fechar o app por completo e abrir de novo.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O app inteiro: CSS, HTML e JS num arquivo só, sem build |
| `design2.css`, `design2.js` | Design "Arena" (padrão desde a 0.42) |
| `sync.js` | Conta e sincronização (Firebase: login Google/e-mail + Firestore), carregado só por quem usa |
| `sw.js` | Service worker (offline) e número da versão |
| `3d/` | Boneco 3D (`v3.js` + modelos `corpo-7.glb`/`corpo-f-4.glb` gerados por `tools/corpo3d/build.py`; cabeça de manequim ou caveira) |
| `how/` | "Como fazer" de cada exercício em pt/en/es (mesmas chaves nos 3) |
| `vendor/three/`, `fonts/` | three.js e fontes servidos pelo próprio app |
| `app/` | App das lojas (Capacitor, Android); `.github/workflows/android.yml` gera o `.aab` assinado |
| `tools/desktop/` | App para Windows (Electron) |
| `tools/` | Gerador das famílias de exercícios (`build.js`), prints das lojas e da apresentação |
| `docs/` | `DETALHES.md`, `HISTORICO.md`, `FONTES.md`, `LANCAMENTO.md`, `loja/` (textos e imagens das lojas) |
| `tests/` | Testes Playwright ([tests/README.md](tests/README.md)) |

## Regras que valem para qualquer mudança

- **Traduções**: todo texto novo na tela precisa de pt, en e es — `tx(pt,en,es)` no código, ou entradas em `EN_UI`/`EN_PAT` **e** `ES_UI`/`ES_PAT`. Sem isso aparece em português. `data-notr` = não traduzir.
- **Não mudar** o endereço, o nome do repositório, as chaves `atlas-*` do `localStorage` nem o `app` do backup (`atlas-muscular`): quebraria instalações e backups. O nome que aparece é **Muscle Atlas**.
- **Exercícios**: não acrescente **eixo** a uma família que já existe (muda a referência de treinos salvos); acrescente **opção**. Como gerar: seção "Variações" em DETALHES.
- **Treinos**: montar não conta; só "Marcar como feito" (ou concluir o Ao vivo) conta. Nada no futuro.
- **Sinergistas** ficam laranja só ao tocar num exercício, nunca só no músculo. Alvo = vermelho (cor de destaque).
- O dono **não quer total de kg levantado** (volume) em lugar nenhum.
- **Conta**: o Firestore tem regras publicadas no console (só `users/{uid}/w|p|k`, campos `d` e `t`). Se mudar o formato em `sync.js`, as regras precisam mudar no console.
- **Sem nomes de pessoas nem de marcas** nos treinos prontos (revisão das lojas).
- Animações seguem "Reduzir animações" (`noAnim()`); vibração segue `CONF.vibe`.
- Decisões que não se desfazem sem perguntar: seção "Decisões já tomadas" em DETALHES (design Arena, corpo, faixas do Progresso, ranking…). Se o dono disser **"volte a tela padrão"**, veja essa seção.

## Mapa rápido das partes (detalhes em DETALHES.md)

Atlas (boneco 2D/3D, modos Músculos · Grupos · Articulações · Cardio, arrastar a folha) · Meus treinos e Treinos prontos (quiz "Qual treino é para mim?") · Hoje › Registro e Ao vivo (descanso, recordes, próxima carga) · Cardio · Progresso › Músculos (mapa de calor, radar) e Força (ranking de 9 níveis, cargas) · Conquistas (troféu) · Cartão para Stories · Configurações (conta, tema, cor, idioma, kg/lb, instalar, backup) · Tela de login e apresentação da 1ª vez · Menu do botão direito / segurar o dedo · Movimento estilo iPhone (arrastar páginas, abas e folhas).

## Testes

Sirva a pasta (`python3 -m http.server 8765`) e rode `node tests/<nome>.js`. Antes de publicar algo grande: `clique.js`, `variacoes.js`, `janelas.js` e o teste da parte mexida. Testes começam em 2D e marcam `atlas-intro` para o carrossel não aparecer. Conta/login precisam do emulador do Firebase e de `FIREBASE_DIR` (ver tests/README.md). Erros `ERR_TUNNEL_CONNECTION_FAILED` são só fontes da web bloqueadas.
