# Lançar o Muscle Atlas como app (App Store e Play Store)

Lista de afazeres combinada com o dono em 23/11/2026 (versão 0.41). Nada disto foi feito ainda.

## Links

- Apple: inscrição no Apple Developer Program — https://developer.apple.com/programs/enroll/
- Apple: App Store Connect (criar o app e enviar) — https://appstoreconnect.apple.com
- Apple: regras de revisão — https://developer.apple.com/app-store/review/guidelines/
- Google: criar conta no Play Console — https://play.google.com/console/signup
- Google: Play Console — https://play.google.com/console
- Capacitor (transforma o site em app nativo) — https://capacitorjs.com/docs
- PWABuilder (alternativa rápida, só Android) — https://www.pwabuilder.com

## Custos

- Apple: US$ 99 por ano (~R$ 550). Sem pagar, o app sai da loja.
- Google: US$ 25 uma vez só (~R$ 140).
- O resto pode ficar grátis: Firebase no plano gratuito, GitHub (máquina Mac grátis no Actions para repositório público).
- Conferir os valores nos sites antes de pagar.

## O que já existe no app

Atlas 2D e 3D (♂/♀, quatro modos: Músculos, Grupos, Articulações e Cardio), variações de exercício, "Como fazer" em pt/en/es, Meus treinos, Treinos prontos (com "Qual treino é para mim?") e programas conhecidos, Montar pelo boneco, Hoje (Registro e Ao vivo, com timer de descanso, sons, vibração, sugestão de carga e recordes), cardio, Progresso (mapa de calor, radar, cardio), Força (ranking em 9 níveis e evolução das cargas), ~90 conquistas, cartões para Stories, conta Google com sincronização, backup, três idiomas, design clássico e Arena (teste), app de Windows (.exe) e funcionamento sem internet depois de abrir uma vez.

## "Em breve" (aparece mas não funciona)

- [x] Unidade de peso (kg / lb): funciona desde a 0.42.
- [x] Lembrete de treino: escondido na 0.42 (decisão do dono).
- [ ] Lembrete de treino no app das lojas: notificação local do Capacitor (`@capacitor/local-notifications`), com os dias e a hora que já existem no `CONF` (`remind`, `rdays`, `rtime`); mostrar a linha só no app nativo.

## Obrigatório para as lojas

- [x] Design: Arena é o padrão desde a 0.42 (clássico no ramo `design-classico`).
- [ ] Refazer os prints da apresentação (`node tools/intro-shots.js`) no design Arena.
- [ ] Apagar o código do clássico que o Arena sobrescreve (opcional, deixa o app mais leve).
- [x] Política de privacidade e página de suporte (0.43): https://holmgds-gui.github.io/atlas-muscular/privacidade.html e https://holmgds-gui.github.io/atlas-muscular/suporte.html (link nas Configurações; usar nas lojas).
- [ ] "Entrar com Apple" (a Apple exige quando o app tem login com Google).
- [x] Nada mais aparece como "em breve" (0.42).
- [x] Three.js e fontes dentro do app (0.43).
- [x] Treinos dos famosos: nomes genéricos desde a 0.45 (sem pessoas nem marcas).
- [x] Projeto Capacitor (0.44): pasta `app/`, pacote `com.muscleatlas.app`, workflow `App Android` gera .aab/.apk (Actions › App Android › artefatos).
- [ ] Dono: pôr os 4 segredos no GitHub (Settings › Secrets › Actions): KEYSTORE_B64, KEYSTORE_PASS, KEY_ALIAS=upload, KEY_PASS (= KEYSTORE_PASS). A chave foi entregue a ele.
- [ ] Firebase: adicionar app Android `com.muscleatlas.app` com o SHA-1 da chave de envio e, depois do 1º envio, o SHA-1 da "chave de assinatura do app" do Play Console; baixar `google-services.json` e pôr em base64 no segredo GOOGLE_SERVICES_B64.
- [ ] iOS: `npx cap add ios`, GoogleService-Info.plist, build no Mac do GitHub Actions (precisa da conta Apple).
- [ ] iOS: montar no Mac (ou no Mac grátis do GitHub Actions), assinar e enviar pela App Store Connect.
- [ ] Android: gerar o .aab assinado e guardar a chave de assinatura com segurança.
- [ ] Play: teste fechado com pelo menos 12 pessoas por 14 dias (conta pessoal nova) antes de publicar para todos.
- [ ] Material da loja: ícone 1024 px, fotos de tela (iPhone 6,7"/6,5", Android), descrição curta e longa em pt/en/es, palavras-chave, categoria Saúde e fitness.
- [ ] Formulários: privacidade da Apple (dados coletados: e-mail e treinos, só com conta), segurança de dados do Google, classificação etária.
- [ ] Conferir se o nome "Muscle Atlas" está livre nas lojas (e marca registrada).

## Interessante adicionar (depois ou antes do lançamento)

- [ ] Lembretes de treino de verdade (notificações).
- [ ] Integração com Saúde da Apple / Health Connect (treinos e calorias do cardio).
- [ ] Vibração nativa no iPhone (Capacitor Haptics) no lugar do truque atual.
- [ ] Widget na tela de início (sequência 🔥 e treino de hoje).
- [ ] Peso do corpo ao longo do tempo (gráfico).
- [ ] Plano de progressão automático (próximo treino sugerido).
- [ ] Modo offline completo do 3D e "Como fazer".
- [ ] Compartilhar treino com amigos (link).
- [ ] Assinatura/compra no app só se o dono quiser (exige regras de pagamento das lojas).

## Ordem sugerida

1. Decidir o design e resolver os "em breve".
2. Privacidade, suporte, Entrar com Apple, 3D e fontes dentro do app, famosos.
3. Capacitor + build Android → teste fechado no Play (começa a contar os 14 dias).
4. Build iOS → TestFlight → envio para revisão.
5. Material das lojas e publicação.
