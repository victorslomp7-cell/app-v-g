import { randomUUID } from 'crypto'

const DEFAULT_CHECKLIST = [
  ['12m', 'Definir orçamento total do casamento', 'Planejamento'],
  ['12m', 'Definir número aproximado de convidados', 'Planejamento'],
  ['12m', 'Escolher a data do casamento', 'Planejamento'],
  ['12m', 'Reservar local da cerimônia', 'Cerimônia'],
  ['12m', 'Reservar local da festa', 'Decoração'],
  ['12m', 'Contratar buffet', 'Buffet'],
  ['12m', 'Contratar fotografia e vídeo', 'Fotografia'],
  ['12m', 'Pesquisar e reservar assessoria/cerimonial', 'Planejamento'],
  ['12m', 'Iniciar pesquisa do vestido da noiva', 'Traje'],
  ['12m', 'Criar lista inicial de convidados', 'Convidados'],
  ['6m', 'Contratar banda ou DJ', 'Música'],
  ['6m', 'Contratar decoração e florista', 'Decoração'],
  ['6m', 'Definir cardápio com o buffet', 'Buffet'],
  ['6m', 'Escolher e comprar o vestido da noiva', 'Traje'],
  ['6m', 'Escolher traje do noivo', 'Traje'],
  ['6m', 'Contratar cerimonialista/celebrante', 'Cerimônia'],
  ['6m', 'Definir papelaria (convites, save the date)', 'Convites'],
  ['6m', 'Pesquisar destino da lua de mel', 'Lua de mel'],
  ['6m', 'Reservar hospedagem para convidados de fora', 'Convidados'],
  ['3m', 'Enviar convites', 'Convites'],
  ['3m', 'Criar lista de presentes', 'Presentes'],
  ['3m', 'Marcar provas de vestido', 'Traje'],
  ['3m', 'Contratar cabelo e maquiagem', 'Beleza'],
  ['3m', 'Reservar carro para os noivos', 'Logística'],
  ['3m', 'Comprar alianças', 'Documentação'],
  ['3m', 'Dar entrada na documentação do cartório', 'Documentação'],
  ['3m', 'Fechar roteiro da lua de mel e passagens', 'Lua de mel'],
  ['1m', 'Confirmar número final de convidados com o buffet', 'Buffet'],
  ['1m', 'Fazer prova de cabelo e maquiagem', 'Beleza'],
  ['1m', 'Organizar mesas e disposição dos convidados', 'Convidados'],
  ['1m', 'Confirmar horários com todos os fornecedores', 'Logística'],
  ['1m', 'Finalizar cronograma do dia do casamento', 'Logística'],
  ['1m', 'Retirar certidão de casamento no cartório', 'Documentação'],
  ['1m', 'Últimas provas de traje dos noivos', 'Traje'],
  ['1w', 'Confirmar RSVP final de todos os convidados', 'Convidados'],
  ['1w', 'Repassar cronograma do dia com padrinhos e família', 'Logística'],
  ['1w', 'Preparar kit de emergência do dia (costura, remédios etc.)', 'Logística'],
  ['1w', 'Fazer as malas da lua de mel', 'Lua de mel'],
  ['1w', 'Confirmar pagamentos pendentes dos fornecedores', 'Fornecedores'],
  ['dia', 'Making of da noiva e do noivo', 'Logística'],
  ['dia', 'Cerimônia', 'Cerimônia'],
  ['dia', 'Sessão de fotos', 'Fotografia'],
  ['dia', 'Recepção e festa', 'Festa'],
  ['dia', 'Aproveitar cada segundo!', 'Logística'],
]

const DEFAULT_BUDGET_CATEGORIES = [
  ['Buffet', 0],
  ['Cerimônia', 0],
  ['Decoração e Flores', 0],
  ['Fotografia e Vídeo', 0],
  ['Música e DJ', 0],
  ['Trajes', 0],
  ['Convites e Papelaria', 0],
  ['Beleza', 0],
  ['Documentação e Cartório', 0],
  ['Lua de Mel', 0],
  ['Lembrancinhas', 0],
  ['Imprevistos', 0],
]

const DEFAULT_TIMELINE = [
  ['08:00', 'Making of da noiva', ''],
  ['09:30', 'Making of do noivo', ''],
  ['15:30', 'Cerimônia', ''],
  ['16:30', 'Sessão de fotos', ''],
  ['18:00', 'Cocktail de recepção', ''],
  ['19:30', 'Jantar', ''],
  ['21:00', 'Primeira dança', ''],
  ['21:30', 'Festa e pista de dança', ''],
  ['00:00', 'Encerramento', ''],
]

const DEFAULT_SETTINGS = {
  couple_name_1: 'Victor',
  couple_name_2: 'Gabi',
  wedding_date: '',
  budget_total: '0',
  theme: 'system',
  cover_photo: '',
  hero_photo_1: '',
  hero_photo_2: '',
  rsvp_token: randomUUID(),
  share_token: randomUUID(),
}

export async function seedIfEmpty({ dbGet, dbBatch }) {
  const taskCount = (await dbGet('SELECT COUNT(*) AS c FROM tasks')).c
  if (taskCount === 0) {
    await dbBatch(
      DEFAULT_CHECKLIST.map(([phase, title, category], i) => ({
        sql: 'INSERT INTO tasks (id, title, category, phase, position) VALUES (?, ?, ?, ?, ?)',
        args: [randomUUID(), title, category, phase, i],
      }))
    )
  }

  const catCount = (await dbGet('SELECT COUNT(*) AS c FROM budget_categories')).c
  if (catCount === 0) {
    await dbBatch(
      DEFAULT_BUDGET_CATEGORIES.map(([name, planned], i) => ({
        sql: 'INSERT INTO budget_categories (id, name, planned_amount, position) VALUES (?, ?, ?, ?)',
        args: [randomUUID(), name, planned, i],
      }))
    )
  }

  const timelineCount = (await dbGet('SELECT COUNT(*) AS c FROM timeline_events')).c
  if (timelineCount === 0) {
    await dbBatch(
      DEFAULT_TIMELINE.map(([time, title, description], i) => ({
        sql: 'INSERT INTO timeline_events (id, time, title, description, position) VALUES (?, ?, ?, ?, ?)',
        args: [randomUUID(), time, title, description, i],
      }))
    )
  }

  const settingsCount = (await dbGet('SELECT COUNT(*) AS c FROM settings')).c
  if (settingsCount === 0) {
    await dbBatch(
      Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({
        sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
        args: [k, v],
      }))
    )
  }
}
