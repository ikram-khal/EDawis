import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { Lang } from './i18n';

const reportTranslations = {
  title: { qq: 'ЖАСЫРЫН ДАЎЫС БЕРИЎ НӘТИЙЖЕЛЕРИ', ru: 'РЕЗУЛЬТАТЫ ТАЙНОГО ГОЛОСОВАНИЯ' },
  attendees_count: { qq: 'Қатнасыўшылар саны', ru: 'Количество присутствующих' },
  attendees: { qq: 'Қатнасыўшылар', ru: 'Присутствующие' },
  question: { qq: 'мәселе', ru: 'вопрос' },
  for_label: { qq: 'Қосыламан', ru: 'За' },
  against_label: { qq: 'Қарсыман', ru: 'Против' },
  abstain_label: { qq: 'Бийтәреп', ru: 'Воздержался' },
  total: { qq: 'Жәми', ru: 'Итого' },
  result: { qq: 'Нәтийже', ru: 'Результат' },
  accepted: { qq: 'ҚАРАР ҚАБЫЛ ЕТИЛДИ', ru: 'РЕШЕНИЕ ПРИНЯТО' },
  rejected: { qq: 'ҚАРАР ҚАБЫЛ ЕТИЛМЕДИ', ru: 'РЕШЕНИЕ НЕ ПРИНЯТО' },
  tie: { qq: 'ДАЎЫСЛАР ТЕҢ', ru: 'ГОЛОСА РАВНЫ' },
  chairman: { qq: 'Баслық', ru: 'Председатель' },
  secretary: { qq: 'Хаткер', ru: 'Секретарь' },
  meeting: { qq: 'Мәжилис', ru: 'Заседание' },
  date: { qq: 'Сәне', ru: 'Дата' },
};

interface ReportQuestion {
  text: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
}

interface ReportData {
  protocolNumber: string;
  date: string;
  attendees: string[];
  questions: ReportQuestion[];
  lang: Lang;
}

function rt(key: keyof typeof reportTranslations, lang: Lang) {
  return reportTranslations[key][lang];
}

export async function generateReport(data: ReportData) {
  const lang = data.lang || 'qq';
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const sorted = [...data.attendees].sort();

  const allChildren: (Paragraph | Table)[] = [];

  allChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: rt('title', lang), bold: true, size: 28, font: 'Times New Roman' })],
  }));

  allChildren.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `${rt('meeting', lang)} №${data.protocolNumber}, ${rt('date', lang)}: ${data.date}`, size: 24, font: 'Times New Roman' })],
  }));

  allChildren.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `${rt('attendees_count', lang)}: ${data.attendees.length}`, size: 24, font: 'Times New Roman' })],
  }));

  allChildren.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: `${rt('attendees', lang)}:`, bold: true, size: 24, font: 'Times New Roman' })],
  }));

  sorted.forEach((name, i) => {
    allChildren.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `${i + 1}. ${name}`, size: 24, font: 'Times New Roman' })],
    }));
  });

  data.questions.forEach((q, qi) => {
    const total = q.votes_for + q.votes_against + q.votes_abstain;
    const verdict = q.votes_for > q.votes_against ? rt('accepted', lang) :
      q.votes_for < q.votes_against ? rt('rejected', lang) : rt('tie', lang);

    allChildren.push(new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: `${qi + 1}-${rt('question', lang)}: ${q.text}`, bold: true, size: 24, font: 'Times New Roman' })],
    }));

    const makeCell = (text: string, bold = false) => new TableCell({
      borders,
      width: { size: 2340, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 24, font: 'Times New Roman' })] })],
    });

    allChildren.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 2340, 2340],
      rows: [
        new TableRow({ children: [makeCell(rt('for_label', lang), true), makeCell(rt('against_label', lang), true), makeCell(rt('abstain_label', lang), true), makeCell(rt('total', lang), true)] }),
        new TableRow({ children: [makeCell(String(q.votes_for)), makeCell(String(q.votes_against)), makeCell(String(q.votes_abstain)), makeCell(String(total))] }),
      ],
    }));

    allChildren.push(new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [new TextRun({ text: `${rt('result', lang)}: ${verdict}`, bold: true, size: 24, font: 'Times New Roman' })],
    }));
  });

  allChildren.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  allChildren.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `${rt('chairman', lang)}: ____________________`, size: 24, font: 'Times New Roman' })],
  }));
  allChildren.push(new Paragraph({
    children: [new TextRun({ text: `${rt('secretary', lang)}: ____________________`, size: 24, font: 'Times New Roman' })],
  }));

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
    sections: [{ children: allChildren }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `protocol_${data.protocolNumber}_${data.date}.docx`);
}
