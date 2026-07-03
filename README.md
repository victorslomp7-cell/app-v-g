# V&G — Nosso Casamento

Um app pessoal para organizar o casamento do Victor e da Gabi: convidados e RSVP, checklist, fornecedores, orçamento, cronograma do dia, mesas, lista de presentes, mural de inspiração e documentos — tudo num só lugar.

O app funciona em dois modos, sem mudar uma linha de código:

- **Local** (padrão): banco de dados e arquivos ficam num único computador, nada sai da sua rede.
- **Nuvem** (Vercel + Turso + Vercel Blob, todos com plano gratuito): o app fica acessível de qualquer lugar, de qualquer aparelho, sem depender de nenhum computador ligado. Veja o guia de deploy que preparamos junto com este projeto.

## Como rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 18 ou mais recente.

```bash
npm install
npm run dev
```

Isso sobe dois processos ao mesmo tempo:
- a API em `http://localhost:4321` (Express + SQLite via libSQL)
- o app em `http://localhost:5173` (Vite + React)

Abra `http://localhost:5173` no navegador. Na primeira execução o banco de dados é criado automaticamente em `server/data/vg.db`, já com o checklist padrão de casamento brasileiro populado — o resto fica em branco para vocês preencherem. Fotos e documentos enviados ficam em `server/uploads/`.

### Rodar em modo produção, standalone (um único processo, self-hosted)

```bash
npm run build
npm start
```

Isso gera os arquivos otimizados em `dist/` e sobe um único servidor Express (porta 4321, ou a definida em `PORT`) servindo tanto a API quanto o app. Útil para rodar num computador/mini-PC de casa acessado via Tailscale, por exemplo.

## Rodando na nuvem (Vercel)

O mesmo código roda como funções serverless na Vercel, usando:
- **Turso** (libSQL) no lugar do arquivo SQLite local
- **Vercel Blob** no lugar da pasta `server/uploads/`
- Uma senha compartilhada simples (`APP_PASSWORD`) protegendo o app, já que fica acessível pela internet

Variáveis de ambiente (ver `.env.example`): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `APP_PASSWORD`. Sem elas configuradas, o app volta automaticamente para os fallbacks locais — por isso `npm run dev` continua funcionando sem nenhuma conta na nuvem.

## Onde ficam os dados

- **Modo local:** tudo em `server/data/vg.db` (SQLite) e `server/uploads/` — nada sai da sua rede. Esses diretórios não vão para o controle de versão (estão no `.gitignore`).
- **Modo nuvem:** os dados ficam no seu banco Turso e os arquivos no seu Vercel Blob — ambos vinculados só à sua conta, não a este repositório.

## Backup dos dados

Vá em **Ajustes** dentro do app. Lá tem dois botões:

- **Baixar banco de dados (.db)** — baixa o arquivo SQLite inteiro, do jeito que está. Para restaurar, basta substituir `server/data/vg.db` por esse arquivo baixado.
- **Exportar tudo (.json)** — baixa um JSON legível com todos os dados (convidados, tarefas, fornecedores, orçamento etc.), útil como backup de leitura ou para importar em outra ferramenta.

Recomendação: façam esse backup periodicamente (por exemplo, uma vez por mês, e sempre antes de reinstalar o navegador, formatar o computador ou trocar de máquina) e guardem o arquivo em algum lugar seguro (Google Drive, iCloud, e-mail para vocês mesmos etc.).

## Instalar como app no celular (PWA)

O V&G é um Progressive Web App — dá para "instalar" na tela inicial do celular e usar como um app nativo, sem precisar de loja de aplicativos.

Se estiver rodando em modo local, o celular precisa estar na **mesma rede** do computador (ou numa rede privada tipo Tailscale) para acessá-lo. Se estiver na nuvem (Vercel), basta abrir a URL do projeto de qualquer lugar.

1. Rode `npm run dev` (ou `npm run build && npm start`) no computador — ou pule este passo se já estiver usando a versão na nuvem.
2. No modo local: descubra o IP do computador na rede (Mac/Linux: `ipconfig getifaddr en0` ou `hostname -I`; Windows: `ipconfig`) e acesse `http://SEU-IP:5173` (dev) ou `http://SEU-IP:4321` (produção) pelo celular. No modo nuvem: acesse a URL da Vercel diretamente.
3. No **Android (Chrome)**: toque no menu (⋮) → "Adicionar à tela inicial" / "Instalar app".
4. No **iPhone/iPad (Safari)**: toque no ícone de compartilhar → "Adicionar à Tela de Início".

O app aparecerá com ícone e nome próprios, abrindo em tela cheia como um aplicativo nativo.

## Link de confirmação de presença (RSVP)

Em **Convidados → Link RSVP**, vocês encontram um link público único (algo como `http://SEU-IP:5173/rsvp/xxxxx`). Compartilhem esse link com os convidados (WhatsApp, e-mail, convite impresso com QR code etc.) — cada um encontra o próprio nome, confirma presença (ou não), informa acompanhante e restrição alimentar, sem precisar de login. A resposta atualiza a lista de convidados automaticamente.

Esse link só funciona enquanto o app estiver rodando e acessível pela rede. Se quiser invalidar o link atual (por exemplo, se ele vazou para alguém indevido), gere um novo pelo mesmo painel.

## Cronograma compartilhável (somente leitura)

Em **Cronograma do dia → Compartilhar**, há outro link público, esse mostrando o cronograma do grande dia em modo somente-leitura — ideal para enviar a padrinhos, madrinhas, família e fornecedores sem dar acesso de edição ao app.

## Exportação em PDF

Tanto a lista de convidados (em **Convidados → PDF**) quanto o cronograma do dia (em **Cronograma do dia → PDF**) podem ser exportados em PDF prontos para enviar a buffets, cerimonialistas e outros fornecedores.

## Stack técnica

- **Frontend:** React + Vite, Tailwind CSS, React Router, @dnd-kit (arrastar e soltar com suporte a toque)
- **Backend:** Node.js + Express, rodando tanto standalone (`node server/index.js`) quanto como função serverless na Vercel (`api/[...path].js`)
- **Banco de dados:** libSQL via `@libsql/client` — arquivo local por padrão, ou Turso na nuvem, mesma API para os dois
- **Arquivos:** disco local por padrão, ou Vercel Blob na nuvem
- **Autenticação:** senha única compartilhada (opcional, via `APP_PASSWORD`) protegendo o app quando exposto na internet — os links públicos de RSVP e de compartilhamento do cronograma continuam abertos para os convidados
- **PWA:** manifest + service worker para instalação e cache do shell do app
- **Gráficos:** Recharts · **PDF:** jsPDF · **CSV:** PapaParse

## Estrutura do projeto

```
api/             ponto de entrada serverless da Vercel (reaproveita server/app.js)
server/          API Express
  app.js         app Express exportável (sem app.listen)
  index.js       entrypoint local (npm run dev / npm start)
  auth.js        gate de senha compartilhada
  db.js          cliente libSQL (local ou Turso conforme variáveis de ambiente)
  upload.js      upload de arquivos (disco local ou Vercel Blob)
  routes/        endpoints REST por recurso
  data/          arquivo vg.db em modo local (gerado, não versionado)
  uploads/       fotos e documentos em modo local (gerado, não versionado)
src/             app React
  pages/         uma página por seção do app
  components/    componentes de UI reutilizáveis
  lib/           cliente da API, formatação, contexto de configurações
public/          manifest PWA, ícones, service worker
vercel.json      configuração de build/rotas para deploy na Vercel
```

---

Feito com carinho para o Victor e a Gabi. 💚
