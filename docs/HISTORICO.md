# Histórico do projeto

Resumo das conversas com o Claude que construíram o app, em ordem. Datas em outubro de 2026.

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
- **Celular**: o boneco fica grande enquanto nada está escolhido. Depois da escolha, ele vai para o canto superior esquerdo, pequeno, e a lista cobre o resto da tela. Tocar no boneco pequeno amplia.

## 3. Exercícios e ranking

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

## 4. Corpos

- Botão ♂/♀, válido nos três modelos. O app lembra a escolha.
- Os dois corpos têm físico **atlético natural** (como quem treina há 1–3 anos):
  - Masculino: ombros mais redondos e braços e pernas um pouco mais cheios.
  - Feminino: ombros mais estreitos, cintura fina, quadril largo, coxas fortes, contorno suave dos seios e cabelo preso em coque.
- Os ícones ♂/♀ viraram SVG, porque o glifo de fonte ficava torto no iPhone.

## 5. Treino, Ficha e depois Meus treinos / Hoje

1. **Primeira versão**:
   - Ficha semanal (segunda a domingo).
   - Aba Treino com séries, reps, carga e anotações, ligada à ficha.
   - Backup no aparelho.
2. **Segunda versão**: o dono quis treinos independentes do calendário.
   - A Ficha virou **Meus treinos**: biblioteca de treinos com dias da semana.
   - A aba Treino virou **Hoje**.
   - O Progresso só conta depois de "Marcar como feito".
   - Um dia pode ter vários treinos.
   - Quando marcado como feito, contam todas as séries listadas, preenchidas ou não.
3. **Simplificação** (o dono achou confuso):
   - **Treinos**: só a lista e o botão de criar. Os dias ficaram opcionais e o quadro da semana saiu.
   - **Hoje**: todos os treinos com "Marcar como feito" num toque, "Anotar séries" opcional e "Desfazer".
   - Treino personalizado só para hoje.
4. **Ajustes finais**:
   - A grade da semana voltou na aba Hoje, mostrando o que foi **feito** em cada dia.
   - O treino personalizado de hoje pode virar treino fixo ("Salvar em Meus treinos").
   - Meus treinos ganhou o botão "Montar um treino só para hoje".
   - Registrar em dia passado: tocar num dia que já passou na grade da semana (ou ‹ para semanas anteriores) faz "Marcar como feito", "Anotar séries" e o treino personalizado valerem para aquele dia. Dias futuros não podem ser escolhidos.

## 6. Progresso

- Quarta aba: mapa de calor (frente e costas) dos músculos treinados.
- Período semana ou dia, com setas para voltar no tempo.
- Lista de séries por grupo, com as partes de cada um, e lista de grupos não treinados.
- Exercícios digitados que o app não conhece aparecem à parte. Não mostra total de kg (pedido do dono).
- **Contagem**: 1 série para cada músculo-alvo e ½ para sinergistas. É a "contagem fracionada" de Pelland et al., a que melhor previu o crescimento.
- **Faixas** (pesquisa em [FONTES.md](FONTES.md)):
  - Semana: 0 não treinado · 1–3 abaixo do mínimo · 4–9 estímulo moderado · 10–20 faixa ideal · 20+ volume alto.
  - Dia: 1–2 leve · 3–5 bom · 6–11 forte · 12+ pouco ganho extra, com aviso.
- Seção "Como as faixas foram definidas" dentro da aba.

## 7. Ajuda

- Um "+" pequeno ao lado do título de cada aba abre uma explicação: o que a página faz, o que dá para fazer e dicas.
- Só o "+", sem círculo em volta.

## 8. Perguntas que o dono fez (respostas resumidas)

- **Atualizações**: o dono pede no Claude, o Claude edita o repositório e o GitHub Pages publica. Se o celular mostrar a versão velha, é só fechar o app por completo.
- **Ranking**: no começo, parte das listas só dizia se o exercício "pega ou não pega" o músculo. Depois tudo virou ordem por estímulo com selos.
- **Lojas**:
  - Google Play: dá para publicar como Trusted Web Activity (PWABuilder). Custa US$ 25 uma vez, exige teste fechado com 12 pessoas por 14 dias para conta pessoal nova e o `assetlinks.json` na raiz do domínio.
  - Apple: US$ 99/ano, precisa de Mac/Xcode e há risco de rejeição pela regra 4.2 (app que é só um site).
  - Mandar o link para amigos já funciona: cada um guarda os próprios dados no aparelho.
- **Escala do Progresso**: a visão Dia usa a escala por treino (até ~11 séries); a visão Semana usa a escala semanal (10–20 ideal).
- **Claude Code vs app**: uma conversa nova não vê esta conversa. Por isso existe o `CLAUDE.md`. Os limites de uso são compartilhados entre o Claude e o Claude Code.
