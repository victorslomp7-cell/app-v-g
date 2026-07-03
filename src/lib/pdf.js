import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './format.js'

const STATUS_LABEL = { confirmado: 'Confirmado', pendente: 'Pendente', recusado: 'Recusado' }
const SIDE_LABEL = { noivo: 'Noivo', noiva: 'Noiva', ambos: 'Ambos' }

function addHeader(doc, title, subtitle) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(66, 87, 55)
  doc.text(title, 40, 46)
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(110, 110, 110)
    doc.text(subtitle, 40, 64)
  }
}

export function exportGuestListPdf(guests, coupleLabel) {
  const doc = new jsPDF({ unit: 'pt' })
  addHeader(doc, `Lista de convidados — ${coupleLabel}`, `Gerado em ${formatDate(new Date().toISOString())} · ${guests.length} convidados`)

  autoTable(doc, {
    startY: 84,
    head: [['Nome', 'Lado', 'Status', 'Acompanhante', 'Restrição alimentar', 'Mesa']],
    body: guests.map((g) => [
      g.name,
      SIDE_LABEL[g.side] || g.side,
      STATUS_LABEL[g.status] || g.status,
      g.has_companion ? g.companion_name || 'Sim' : '—',
      g.dietary_restriction || '—',
      g.table_name || '—',
    ]),
    headStyles: { fillColor: [66, 87, 55], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [246, 241, 233] },
    margin: { left: 40, right: 40 },
  })

  doc.save(`lista-convidados-${coupleLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function exportTimelinePdf(events, coupleLabel, weddingDate) {
  const doc = new jsPDF({ unit: 'pt' })
  addHeader(doc, `Cronograma do dia — ${coupleLabel}`, weddingDate ? formatDate(weddingDate, { weekday: 'long' }) : '')

  autoTable(doc, {
    startY: 84,
    head: [['Horário', 'Atividade', 'Detalhes']],
    body: events.map((e) => [e.time, e.title, e.description || '—']),
    headStyles: { fillColor: [66, 87, 55], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [246, 241, 233] },
    margin: { left: 40, right: 40 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
  })

  doc.save(`cronograma-dia-${coupleLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
