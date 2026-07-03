# V&G — Nosso Casamento

Um app pessoal para organizar o casamento do Victor e da Gabi: convidados e RSVP, checklist, fornecedores, orçamento, cronograma do dia, mesas, lista de presentes, mural de inspiração e documentos — tudo num só lugar, guardado localmente no seu computador.

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) 18 ou mais recente.

```bash
npm install
npm run dev
```

Isso sobe dois processos ao mesmo tempo:
- a API em `http://localhost:4321` (Express + SQLite)
- o app em `http://localhost:5173` (Vite + React)

Abra `http://localhost:5173` no navegador. Na primeira execução o banco de dados é criado automaticamente em `server/data/vg.db`, já com o checklist padrão de casamento brasileiro populado — o resto fica em branco para vocês preencherem.

### Rodar em modo produção (um único processo)

```bash
npm run build
npm start
```

Isso gera os arquivos otimizados em `dist/` e sobe um único servidor Express (porta 4321, ou a definida em `PORT`) servindo tanto a API quanto o app.

## Onde ficam os dados

Tudo fica salvo localmente em `server/data/vg.db`, um arquivo SQLite único. Nada é enviado para a internet — o app funciona 100% offline na sua rede local. Fotos e arquivos anexados (documentos, contratos, mural de inspiração) ficam em `server/uploads/`.

**Importante:** esses dois diretórios (`server/data/` e `server/uploads/`) não vão para o controle de versão (estão no `.gitignore`) e não fazem parte de nenhuma instalação/reinstalação de dependências — cuidado ao limpar a pasta do projeto.

## Backup dos dados

Vá em **Ajustes** dentro do app. Lá tem dois botões:

- **Baixar banco de dados (.db)** — baixa o arquivo SQLite inteiro, do jeito que está. Para restaurar, basta substituir `server/data/vg.db` por esse arquivo baixado.
- **Exportar tudo (.json)** — baixa um JSON legível com todos os dados (convidados, tarefas, fornecedores, orçamento etc.), útil como backup de leitura ou para importar em outra ferramenta.

Recomendação: façam esse backup periodicamente (por exemplo, uma vez por mês, e sempre antes de reinstalar o navegador, formatar o computador ou trocar de máquina) e guardem o arquivo em algum lugar seguro (Google Drive, iCloud, e-mail para vocês mesmos etc.).

## Instalar como app no celular (PWA)

O V&G é um Progressive Web App — dá para "instalar" na tela inicial do celular e usar como um app nativo, sem precisar de loja de aplicativos.

Como o app roda localmente no computador de vocês, o celular precisa estar na **mesma rede Wi-Fi** para acessá-lo:

1. Rode `npm run dev` (ou `npm run build && npm start`) no computador.
2. Descubra o IP local do computador na rede (no Mac/Linux: `ipconfig getifaddr en0` ou `hostname -I`; no Windows: `ipconfig`).
3. No celular, abra o navegador e acesse `http://SEU-IP:5173` (modo dev) ou `http://SEU-IP:4321` (modo produção com `npm start`).
4. No **Android (Chrome)**: toque no menu (⋮) → "Adicionar à tela inicial" / "Instalar app".
5. No **iPhone (Safari)**: toque no ícone de compartilhar → "Adicionar à Tela de Início".

O app aparecerá com ícone e nome próprios, abrindo em tela cheia como um aplicativo nativo.

## Link de confirmação de presença (RSVP)

Em **Convidados → Link RSVP**, vocês encontram um link público único (algo como `http://SEU-IP:5173/rsvp/xxxxx`). Compartilhem esse link com os convidados (WhatsApp, e-mail, convite impresso com QR code etc.) — cada um encontra o próprio nome, confirma presença (ou não), informa acompanhante e restrição alimentar, sem precisar de login. A resposta atualiza a lista de convidados automaticamente.

Esse link só funciona enquanto o app estiver rodando e acessível pela rede. Se quiser invalidar o link atual (por exemplo, se ele vazou para alguém indevido), gere um novo pelo mesmo painel.

## Cronograma compartilhável (somente leitura)

Em **Cronograma do dia → Compartilhar**, há outro link público, esse mostrando o cronograma do grande dia em modo somente-leitura — ideal para enviar a padrinhos, madrinhas, família e fornecedores sem dar acesso de edição ao app.

## Exportação em PDF

Tanto a lista de convidados (em **Convidados → PDF**) quanto o cronograma do dia (em **Cronograma do dia → PDF**) podem ser exportados em PDF prontos para enviar a buffets, cerimonialistas e outros fornecedores.

## Stack técnica

- **Frontend:** React + Vite, Tailwind CSS, React Router
- **Backend:** Node.js + Express
- **Banco de dados:** SQLite via `better-sqlite3` (arquivo local, sem servidor externo)
- **PWA:** manifest + service worker para instalação e cache do shell do app
- **Gráficos:** Recharts · **PDF:** jsPDF · **CSV:** PapaParse

## Estrutura do projeto

```
server/          API Express + banco SQLite
  routes/        endpoints REST por recurso
  data/          arquivo vg.db (gerado, não versionado)
  uploads/       fotos e documentos enviados (gerado, não versionado)
src/             app React
  pages/         uma página por seção do app
  components/    componentes de UI reutilizáveis
  lib/           cliente da API, formatação, contexto de configurações
public/          manifest PWA, ícones, service worker
```

---

Feito com carinho para o Victor e a Gabi. 💚
