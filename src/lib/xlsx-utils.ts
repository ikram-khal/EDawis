import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function generatePin(fullName: string, existingPins: Set<string>): string {
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.map(p => p[0]?.toUpperCase() || '').join('');
  const prefix = initials || 'X';
  let pin = '';
  let attempts = 0;
  do {
    const num = String(Math.floor(1000 + Math.random() * 9000));
    pin = prefix + num;
    attempts++;
  } while (existingPins.has(pin) && attempts < 100);
  return pin;
}

export function parseXlsx(file: File, existingPins: Set<string>): Promise<{ name: string; pin: string }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const allPins = new Set(existingPins);
        const members = rows.slice(1)
          .filter(r => r[0])
          .map(r => {
            const name = String(r[0]).trim();
            const pin = generatePin(name, allPins);
            allPins.add(pin);
            return { name, pin };
          });
        resolve(members);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [
    ['Аты-жөни'],
    ['Бозорбоев Алибек Қалбаевич'],
    ['Каримова Гулнора Рустамовна'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Ағзалар');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf]), 'agzalar_shablon.xlsx');
}
