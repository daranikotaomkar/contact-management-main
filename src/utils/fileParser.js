import { parse } from 'csv-parse';
import xlsx from 'xlsx';
import { Transform } from 'stream';

export const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const contacts = [];
    
    parse(buffer, {
      columns: true,
      skip_empty_lines: true
    })
      .on('data', (row) => contacts.push(row))
      .on('error', reject)
      .on('end', () => resolve(contacts));
  });
};

export const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};

export const generateCSV = (contacts) => {
  const header = 'Name,Email,Phone Number,Address,Timezone,Created At\n';
  const rows = contacts.map(contact => 
    `${contact.name},${contact.email},${contact.phone_number},${contact.address},${contact.timezone},${contact.created_at}\n`
  ).join('');
  
  return header + rows;
};