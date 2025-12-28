const { google } = require('googleapis');

let sheetsClient = null;

async function initializeGoogleSheets() {
  if (sheetsClient) return sheetsClient;

  try {
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (!credentialsBase64) {
      console.warn('⚠️  GOOGLE_CREDENTIALS_BASE64 not set');
      return null;
    }

    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, 'base64').toString('utf-8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    
    console.log('✅ Google Sheets API initialized');
    return sheetsClient;
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error.message);
    return null;
  }
}

async function getAllApplications() {
  const sheets = await initializeGoogleSheets();
  if (!sheets) {
    throw new Error('Google Sheets not initialized');
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Form Responses 1';

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const applications = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const application = {
        rowIndex: i + 1,
        rowNumber: i,
      };

      headers.forEach((header, index) => {
        application[header] = row[index] || '';
      });

      applications.push(application);
    }

    return applications;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
}

async function updateApplicationField(rowIndex, fieldName, value) {
  const sheets = await initializeGoogleSheets();
  if (!sheets) {
    throw new Error('Google Sheets not initialized');
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Form Responses 1';

  try {
    // Get headers to find column index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    const headers = response.data.values[0];
    const columnIndex = headers.indexOf(fieldName);
    
    if (columnIndex === -1) {
      throw new Error(`Column "${fieldName}" not found`);
    }

    const columnLetter = numberToColumnLetter(columnIndex);
    const range = `${sheetName}!${columnLetter}${rowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[value]],
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating field:', error);
    throw error;
  }
}

function numberToColumnLetter(num) {
  let letter = '';
  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

module.exports = { getAllApplications, updateApplicationField };
