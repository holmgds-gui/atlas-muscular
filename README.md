# Muscle Atlas

App de academia gratuito, em português, inglês e espanhol, que funciona no navegador do celular e pode ser instalado como app.
(Antes chamado Atlas Muscular; o endereço e o repositório continuam `atlas-muscular`.)

**Abrir:** https://holmgds-gui.github.io/atlas-muscular/

## Como instalar no celular

- **iPhone:** abra o link no **Safari** → Compartilhar (quadrado com seta) → **Adicionar à Tela de Início**. No Chrome do iPhone a opção pode não aparecer.
- **Android (Samsung e outros):** abra no **Chrome** → menu ⋮ → **Adicionar à tela inicial** / **Instalar app**. No Samsung Internet: menu ☰ → **Adicionar página a** → **Tela inicial**.
- Depois de instalado, abre em tela cheia e funciona sem internet. Atualizações chegam sozinhas ao abrir com internet; se aparecer a versão antiga, feche o app por completo e abra de novo.

## O que tem

**Atlas (boneco anatômico)**
- Boneco clicável de frente e de costas, corpo masculino (físico de fisiculturista) ou feminino, com fibras em cada músculo.
- Toque num músculo: ele fica vermelho e aparece a lista de exercícios **em ordem de estímulo**, com selos de evidência (estudo de hipertrofia, estudo EMG ou biomecânica).
- Toque num exercício: os sinergistas ficam laranja e aparecem botões de **variação** (pegada, largura, equipamento, banco, posição, lado). São 98 exercícios e 1.325 variações.
- **Como fazer** completo em cada exercício: posição inicial, passo a passo, respiração, ritmo e amplitude, onde sentir, dicas, erros comuns, cuidados e o que muda na variação escolhida.
- Modelos Detalhado, Básico (grupos inteiros) e Articulações (aquecimento, mobilidade e alongamento).
- **Montar treino pelo boneco:** toque nos músculos e o app monta um treino com os exercícios mais bem colocados.

**Treinos**
- **Meus treinos:** monte treinos com exercícios, séries, repetições e dias da semana.
- **Treinos prontos:** 44 treinos em 4 divisões (corpo inteiro, superior/inferior, push/pull/legs, um músculo por dia), nível iniciante ou avançado, com explicação de cada divisão, semana pronta e filtro por músculo.
- **Trocar exercício (⇄)** por um equivalente que treina os mesmos músculos.

**Hoje**
- **Registro:** grade da semana, "Marcar como feito", anotar séries, registrar em dias que já passaram.
- **Ao vivo:** treino série a série com cronômetro, timer de descanso (maior nos exercícios compostos), aquecimento sugerido, anilhas por lado, sugestão da próxima carga, aviso de recorde e resumo no fim.
- Aviso de **qual peso anotar** (por halter, total com a barra, número da polia, só o peso extra…).

**Progresso**
- **Músculos:** mapa de calor dos músculos treinados na semana ou no dia, com faixas baseadas em pesquisa, e radar de equilíbrio.
- **Força:** ranking de força por grupo muscular em 9 níveis (de Ameba a Bizarro), ajustado ao seu peso, sexo e idade, e a evolução da carga de cada exercício.
- **Conquistas:** ~90 conquistas (semanas seguidas com 3 treinos, mês, peso do corpo, recordes, engraçadas…) e 🔥 da sequência na tela Hoje.
- **Cartão para Stories** da semana, do ranking, do treino e das conquistas.

**Configurações:** nome, peso, corpo, idioma, tema claro/escuro, cor, tamanho da letra, meta semanal, timer, sons, backup e mais.

## Seus dados

Tudo fica **só no seu aparelho** (nada vai para servidor). Cada pessoa que instala tem os próprios dados. Para trocar de celular ou guardar uma cópia, use **Configurações › Backup**.

## Base científica

As listas de exercícios, as faixas de séries, o ranking de força, o "Como fazer", o descanso, a progressão de carga e os treinos prontos seguem estudos e guias de treino. Todos os estudos e links estão em [docs/FONTES.md](docs/FONTES.md). Use como guia, não como verdade absoluta.

## Para quem vai mexer no código

- O app inteiro está em [`index.html`](index.html) (HTML, CSS e JavaScript num arquivo só, sem build e sem dependências). O "Como fazer" fica em [`how/`](how/) (um JSON por idioma).
- [`sw.js`](sw.js) deixa o app funcionar offline. **A cada mudança, suba o número do cache** (`atlas-vNN`), senão os celulares podem continuar com a versão velha.
- Publicar: commit na `main` e push; o GitHub Pages publica em ~1 minuto.
- Testes automáticos em [`tests/`](tests/) (Playwright): toque nos músculos, variações, Ao vivo, conquistas, "Como fazer", treinos prontos, traduções e mais.
- [`tools/`](tools/): fonte das famílias de exercícios e o gerador que monta os dados do `index.html`.

## Documentação

- [CLAUDE.md](CLAUDE.md): como o app funciona por dentro e as decisões já tomadas com o dono (o Claude lê este arquivo sozinho ao começar).
- [docs/HISTORICO.md](docs/HISTORICO.md): o que foi construído, em ordem, e as perguntas respondidas.
- [docs/FONTES.md](docs/FONTES.md): todos os estudos e links usados.
- [tests/README.md](tests/README.md): como rodar os testes.
