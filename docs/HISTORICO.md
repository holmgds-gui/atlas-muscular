# Histórico do projeto

Resumo das conversas com o Claude que construíram o app, por tema e em ordem. Datas em outubro de 2026 (o grosso foi feito entre 27 e 29/10). Os commits do Git têm o detalhe de cada mudança.

## 1. Origem

- O app começou numa conversa no Gemini, com um atlas muscular básico. O link está em [FONTES.md](FONTES.md).
- O Claude reescreveu tudo do zero, corrigindo bugs de clique e de imagem no celular. A primeira versão foi publicada como Artifact do Claude.
- Pelo Artifact, ao adicionar à tela de início do iPhone, o app aparecia "dentro do Claude" e não como app próprio. A solução foi hospedar no GitHub do dono (`holmgds-gui`) com GitHub Pages, como PWA instalável: ícone próprio, funciona offline e abre em tela cheia.
- No iOS 26, "Adicionar à Tela de Início" fica em ••• → Compartilhar → Ver mais. Navegadores dentro de outros apps não têm essa opção.

## 2. Boneco e Atlas

- **Boneco**:
  - Pose em A (braços abertos), vistas de frente e costas, visual de prancha anatômica (silhueta inspirada numa imagem de referência, sem copiar cores ou textos).
  - Músculos decorativos não clicáveis e tendões em tom mais claro.
- **Interação**:
  - Tocar num músculo deixa ele vermelho e mostra os exercícios em ordem de estímulo.
  - Tocar num exercício pinta os sinergistas de laranja (só nesse momento).
  - Busca, filtros de equipamento, zoom por pinça e arrastar.
- **3 modelos**:
  - Detalhado.
  - Básico: mesma arte do Detalhado, mas o vermelho pinta o grupo inteiro (ex.: todo o bíceps).
  - Articulações: aquecimento, mobilidade e alongamento estático de cada junta.
- **Celular**: o boneco fica grande enquanto nada está escolhido. Depois da escolha, ele vai para o canto superior esquerdo, pequeno, e a lista cobre o resto da tela. Tocar no boneco pequeno amplia. "Ver lista" também deixa o boneco pequeno, para aparecerem 2–3 itens da lista (pedido do dono).
- **Botões** (pedido do dono, mais simples): vista e corpo são um botão cada; tocar troca frente/costas e ♂/♀.
- **Busca**: no topo só a lupa; tocar abre o campo por cima do cabeçalho.

## 3. Exercícios e ranking por estímulo

- A lista de exercícios foi ampliada com pesquisa (livros, artigos, vídeos). Hoje são 359 entradas e 248 exercícios diferentes em 39 músculos.
- Ordem por estímulo, com selos:
  - **Hipertrofia**: estudos que mediram o músculo crescer. É a evidência mais forte.
  - **Estudo EMG**: estudos que mediram a ativação.
  - **Biomecânica**: quando só há a mecânica do movimento.
- Seção "Como o ranking funciona" com as fontes.
- **Revisão dos sinergistas**:
  - Cada exercício ganhou uma lista única de músculos envolvidos, em ordem de importância.
  - Os sinergistas de cada tela são essa lista menos o músculo tocado.
  - 299 de 359 entradas mudaram.
  - Regra para estabilizadores: só entram quando o exercício treina o músculo de propósito.
- **Variações (pedido do dono: "puxada alta pegada pronada, supinada, neutra, aberta, fechada, na máquina, polia, halter…")**:
  - Os 248 exercícios viraram **98 famílias** com variações de pegada, largura, equipamento, banco, posição e lado: **1.325 combinações**.
  - Cada lista mostra um cartão por exercício; ao abrir, aparecem os botões e uma explicação curta de cada escolha (ex.: "Supinada: mais bíceps e dorsal inferior").
  - O alvo e os sinergistas mudam no boneco na hora. A posição e o selo do ranking valem para a variação do estudo, e o cartão avisa quando você muda.
  - Busca com nomes de academia ("puxada alta", "pulldown", "pulley", "voador", "serrote", "graviton") e com variações ("crucifixo inclinado máquina", "stiff unilateral").
  - Novos exercícios e variações que faltavam: crucifixo inclinado na máquina, agachamento pêndulo, leg press horizontal, puxada na máquina articulada e unilateral, abdominal canivete, levantamento terra parcial, entre outros.
  - A variação escolhida vai para o treino; treinos antigos continuam funcionando pelo nome antigo.

## 4. Corpos (♂/♀) ao longo do tempo

1. **Primeiro**: botão ♂/♀, válido nos três modelos (o app lembra a escolha). Os dois corpos com físico **atlético natural**: masculino com ombros redondos; feminino com ombros mais estreitos, cintura fina, quadril largo, contorno suave dos seios e cabelo em coque. Os ícones ♂/♀ viraram SVG (o glifo de fonte ficava torto no iPhone).
2. **Boneco novo** (o dono mandou pranchas de anatomia e pediu silhueta mais natural): redesenhado do zero em estilo próprio, sem copiar as imagens. Pose natural com braços um pouco abertos, ~8 cabeças de altura, mãos com dedos, pés, pescoço com esternocleidomastoide e cinza sólido. No computador, frente e costas aparecem juntas desde o início.
3. **Fibras de volta** (o dono sentiu falta): fibras seguindo cada músculo (fuso, leque ou paralelas); braço feminino mais fino ("robustão"); cabelo de frente refeito; seios sem contorno branco.
4. **Silhuetas mais características**: homem com ombros mais largos e cintura menos fina; mulher com quadril mais largo e ombros mais estreitos.
5. **Homem fisiculturista** (o dono mandou uma prancha de fisiculturismo e escolheu "igual à referência"; mulher mais forte também): trapézio alto, pescoço grosso, ombros e braços grandes, V marcado, coxas abrindo para fora e panturrilhas grandes. Novo `lwarp()` deixa os membros mais grossos no meio do músculo.
6. **Ajustes do dono**: cintura do homem menos fina, pernas dos dois bem mais finas, superiores do homem um pouco menores.
- O dono perguntou se um criador de imagens ajudaria: não, porque o boneco precisa de cada músculo como peça separada para tocar e pintar; a imagem serve só como referência de formato.

## 5. Treinos: Ficha → Meus treinos / Hoje

1. **Primeira versão**: ficha semanal (segunda a domingo), aba Treino com séries, reps, carga e anotações, e backup no aparelho.
2. **Segunda versão** (o dono quis treinos independentes do calendário): a Ficha virou **Meus treinos** (biblioteca com dias da semana) e a aba Treino virou **Hoje**. O Progresso só conta depois de "Marcar como feito". Um dia pode ter vários treinos. Quando marcado como feito, contam todas as séries listadas.
3. **Simplificação** (o dono achou confuso): Treinos só com a lista e o botão de criar (dias opcionais); Hoje com "Marcar como feito" num toque, "Anotar séries" opcional e "Desfazer"; treino personalizado só para hoje.
4. **Ajustes**: grade da semana na aba Hoje mostrando o que foi **feito**; treino personalizado pode virar treino fixo; registrar em dias que já passaram (nunca no futuro).

## 6. Progresso

- Mapa de calor (frente e costas) dos músculos treinados, por semana ou dia, com setas para voltar no tempo. Não mostra total de kg (pedido do dono).
- **Contagem**: 1 série para cada músculo-alvo e ½ para sinergistas (a "contagem fracionada" de Pelland et al.).
- **Faixas** (pesquisa em [FONTES.md](FONTES.md)): semana 0 · 1–3 abaixo do mínimo · 4–9 moderado · 10–20 ideal · 20+ volume alto; dia 1–2 leve · 3–5 bom · 6–11 forte · 12+ pouco ganho extra.
- **Radar de Equilíbrio** (o dono mandou um print de outro app): 6 grupos, anel da faixa ideal e toque numa ponta para destacar os músculos.
- **Cargas** (depois parte de **Força**): gráfico da maior carga do dia e da força estimada (kg × (1 + reps ÷ 30)), recorde, última carga e quanto subiu. O dono escolheu as duas linhas depois de ver que a carga pode cair (65 × 6 → 62,5 × 9) enquanto a força estimada sobe.

## 7. Ajuda

- Um "+" pequeno ao lado do título de cada aba abre uma explicação da página. Só o "+", sem círculo em volta.
- Outros "+" menores: força estimada, ranking, "qual peso anotar" e treinos prontos.

## 8. Ranking de força

- Pedido do dono: um ranking em níveis por grupo muscular. Começou com 7 níveis (Vegetal, Molenga, Frango, Decente, Fortinho, Monstro, Bizarro), virou 9 e depois os nomes atuais: **Ameba, Aprendiz, Frango, Galo, Fortinho, Parrudo, Monstro, Lenda, Bizarro**, com faixas "meio-termo": Ameba <5% · Aprendiz 5–15 · Frango 15–30 · Galo 30–45 · Fortinho 45–60 · Parrudo 60–75 · Monstro 75–88 · Lenda 88–96 · Bizarro top 4%.
- Escolhas do dono: cargas dos treinos feitos e digitadas; nível do grupo = média de **todos** os exercícios do grupo; usa o ♂/♀ do app; nível por grupo e boneco colorido.
- Como funciona: padrões do Strength Level; cada série vira força estimada; vale a melhor dos últimos 6 meses ou a digitada; cada exercício conta para todos os grupos-alvo; 66 exercícios-padrão cobrem 1.046 das 1.325 variações; cada exercício mostra quanto falta para o próximo nível.
- Exercícios com o peso do corpo contam o corpo (barra fixa, mergulho, flexão, remada invertida), aceitando até 30 repetições.
- Cores estilo videogame escolhidas pelo dono: cinza, verde, azul, roxo, amarelo, laranja, vermelho, rosa e cinza metálico brilhante.
- O ranking foi para **Progresso › Força**, em cima da evolução das cargas. O título "Muscle Atlas" leva sempre para o Atlas.
- **Ranking mais fiel** (o dono pediu mais fontes e quis ver antes de mudar): mistura Strength Level + StrengthLog; peso por sexo (expoente 0,9 ♂ e 0,6 ♀); idade a partir dos 40; repetições acima de 12 valem metade; aviso "pouca informação" em grupo com um exercício só. Não escolhido: peso maior para exercícios principais.

## 9. Configurações e idiomas

- Engrenagem no canto superior direito abre **Configurações**. O dono pediu tudo o que foi sugerido e mais opções comuns, mesmo sem função por enquanto:
  - Funcionando: perfil (nome, peso, corpo, idade), tema, cor de destaque, tamanho da letra, reduzir animações, séries × reps padrão, meta semanal, timer de descanso, sons, vibração, backup (saiu da aba Hoje), apagar dados, compartilhar, sugestões, fontes e versão.
  - "Em breve": libras, lembretes, conta e sincronização.
  - Correção junto: importar backup não salvava o histórico de treinos.
- **Inglês** (pedido do dono: "tudo", seguindo o idioma do celular e com troca nas Configurações): interface, ajudas, exercícios, variações, músculos, articulações, ranking (Amoeba, Rookie, Chicken, Rooster, Buff, Beefy, Monster, Legend, Freak).
- **Espanhol** ("tudo" também): ranking com Ameba, Aprendiz, Pollito, Gallo, Fuertecito, Macizo, Monstruo, Leyenda, Fenómeno.
- **Zoom só onde precisa** (pedido do dono): a página não dá zoom; o zoom fica nos bonecos (Atlas, Progresso e ranking, com ⤢ para voltar). No celular o boneco do Atlas usa eventos de toque, que funcionam melhor no iPhone.

## 10. Nome e logo

- O app virou **Muscle Atlas** (escolha do dono). O endereço do site e o repositório continuam `atlas-muscular`.
- Logo: primeiro um "A" de dois músculos na frente de um globo; no mesmo dia trocada por **Atlas carregando o globo** (pedido do dono). O homem estava "gorila" e ficou com proporções clássicas.
- Pendente: o dono perguntou se dá para mudar o ícone do app; foram oferecidas ideias (só o globo com músculo, letras "MA", Atlas maior, outras cores ou referência dele) e o Claude aguarda a escolha. No iPhone, ícone novo só aparece apagando o app da tela de início e adicionando de novo.

## 11. Recursos novos inspirados em outros apps

O dono pediu para comparar com apps parecidos (Hevy, Strong, Fitbod, Jefit, MuscleWiki) e escolheu 9 ideias, feitas em 3 levas:

1. **Hoje › Ao vivo** (sub-aba dentro de Hoje, pedido do dono): treino série a série com cronômetro, timer de descanso (som e vibração), sugestão da próxima carga, aviso de recorde e resumo no fim. Recordes no resumo viraram bolinha simples (o dono achou os troféus "exagerados").
2. **"Como fazer"** em cada exercício, **trocar por equivalente (⇄)**, **montar treino tocando no boneco** e **programas prontos**.
3. **Sequência e conquistas** e **cartão para Stories**.

Depois, a pedido do dono ("estude mais e continue dando upgrade"):
- **Ao vivo com base em estudos**: descanso 1 min maior nos compostos (Schoenfeld 2016, Singer 2024), aquecimento sugerido (50% × 8, 70% × 4, 85% × 2), anilhas por lado e cartão do descanso abaixo do exercício. A regra da próxima carga (repetições primeiro, depois peso) foi conferida com Plotkin 2022.
- **Qual peso anotar** (pergunta do dono): "+" ao lado de "Carga (kg)" no Ao vivo, no Registro e no ranking, e aviso curto conforme o exercício (por halter; total com a barra; Smith = anilhas + barra; número da pilha da polia; máquina de anilhas = só as anilhas; peso do corpo = só o extra).
- **Montar treino a partir do músculo selecionado** (pedido do dono): o botão continua aparecendo com um músculo escolhido e já começa com ele marcado.

## 12. "Como fazer" completo

- Pedido do dono: "estude, pesquise e coloque como fazer por escrito todos os exercícios". Ele escolheu: completo, com dicas por variação, fechado até tocar.
- Os 98 exercícios ganharam posição inicial, passo a passo, respiração, ritmo e amplitude, onde sentir, dicas, erros comuns e cuidados, mais 272 dicas por variação, em português, inglês e espanhol (arquivos em `how/`, funcionam offline). "O que muda nesta variação" aparece primeiro.
- Corrigido junto: tocar em "Como fazer" fechava o cartão no Atlas.
- **Erro e correção**: essa atualização apagou sem querer a janela `openG()`/`gAct`, e Montar treino, Trocar exercício, Programas e Cartão para Stories pararam de abrir. O dono avisou ("Montar treino não está indo"); foi restaurado no mesmo dia e agora há um teste (`tests/janelas.js`) que passa pelos quatro.

## 13. Conquistas

- Primeiro: sequência semanal (🔥), 25 conquistas e cartão para Stories.
- **Conquistas novas** (lista aprovada pelo dono): semana conta com **3 treinos** de segunda a domingo (1, 2, 3, 4, 5, 10 … 52 semanas seguidas), do mês, de peso do corpo (1×, 1,5×… o próprio peso; metas ~⅔ para ♀; só carga levantada de verdade), extras, **engraçadas** (perna de saracura, braço de T-rex, sofá master, hibernação, segunda é dia de peito, rato de academia, sem feriado, treino relâmpago, treino de praia) e todos os 9 níveis do ranking. De 25 para ~90 conquistas.
- O 🔥 na grade de Hoje agora diz "🔥 1 semana · 4 treinos feitos" (o dono perguntou o que era o fogo e o número, que parecia "14") e abre as Conquistas.

## 14. Treinos prontos

- Antes: 4 "programas prontos" numa janela.
- Pedido do dono: mais treinos prontos, por tipo (upper/lower, push/pull/legs, corpo inteiro, um músculo por dia) e por músculo ("se eu apertar em costas, aparece um treino só de costas, um upper, um pull e um full body"). Escolhas: página nova dentro da aba Treinos, as 4 divisões, iniciante e avançado, academia completa.
- Resultado: **44 treinos**, explicação de cada divisão ("Como funciona"), "Qual escolher?" por dias na semana, semana pronta por nível ("Adicionar a semana toda"), filtro por músculo, "Treinar agora" e "Salvar em Meus treinos". Base: frequência 2× por semana, total de séries semanal, compostos primeiro e recomendações do ACSM ([FONTES.md](FONTES.md), seção 4c).

## 15. Perguntas que o dono fez (respostas resumidas)

- **Atualizações**: o dono pede no Claude, o Claude edita o repositório e o GitHub Pages publica. Se o celular mostrar a versão velha, é só fechar o app por completo.
- **Vale no computador?** Sim, é o mesmo app; o layout muda sozinho conforme a largura da tela.
- **Porcentagens dos cartões**: são a ativação medida por EMG em relação a um exercício de referência (ex.: supino).
- **Ranking**: no começo, parte das listas só dizia se o exercício "pega ou não pega" o músculo. Depois tudo virou ordem por estímulo com selos.
- **Qual peso anotar**: halter = peso de um; barra = total com a barra; Smith = anilhas + barra; polia = número da pilha; máquina de anilhas = só as anilhas; peso do corpo = só o extra. O importante é anotar sempre do mesmo jeito.
- **O fogo com número**: é a sequência de semanas seguidas com 3 treinos ou mais.
- **Mandar para amigos** (um com Samsung, outro com iPhone): link https://holmgds-gui.github.io/atlas-muscular/; iPhone instala pelo Safari, Android pelo Chrome ou Samsung Internet; os dados de cada um ficam no próprio celular. Ainda não foi testado num Android de verdade.
- **Lojas**:
  - Google Play: dá para publicar como Trusted Web Activity (PWABuilder). Custa US$ 25 uma vez, exige teste fechado com 12 pessoas por 14 dias para conta pessoal nova e o `assetlinks.json` na raiz do domínio.
  - Apple: US$ 99/ano, precisa de Mac/Xcode e há risco de rejeição pela regra 4.2 (app que é só um site).
- **Escala do Progresso**: a visão Dia usa a escala por treino (até ~11 séries); a visão Semana usa a escala semanal (10–20 ideal).
- **Claude Code vs app**: uma conversa nova não vê esta conversa. Por isso existe o `CLAUDE.md`. Os limites de uso são compartilhados entre o Claude e o Claude Code.

## 16. Ideias e pendências

- Ícone novo do app (aguardando a escolha do dono).
- Anotar o esforço de cada série (repetições sobrando, "RIR") para a sugestão de carga ficar mais precisa (sugerido, não pedido ainda).
- Testar num Android de verdade.
- Ideias de Progresso oferecidas e não escolhidas: últimas 8 semanas, calendário de treinos, comparações empurrar × puxar / cima × baixo / frente × costas.
- Configurações "em breve": libras, lembretes, conta e sincronização.
