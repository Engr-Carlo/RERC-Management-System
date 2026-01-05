const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.SPREADSHEET_ID;
    this.sheetName = process.env.SHEET_NAME || 'Form Responses 1';
    this.initialize();
  }

  async initialize() {
    try {
      const credentialsPathEnv = process.env.GOOGLE_CREDENTIALS_PATH;
      
      if (!credentialsPathEnv) {
        console.warn('⚠️  GOOGLE_CREDENTIALS_PATH not set in .env file');
        console.warn('⚠️  Google Sheets integration will not work until credentials are configured');
        return;
      }

      const credentialsPath = path.join(__dirname, '../', credentialsPathEnv);
      
      if (!fs.existsSync(credentialsPath)) {
        console.error('❌ Google credentials file not found at:', credentialsPath);
        console.warn('⚠️  Please ensure the credentials file exists');
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      console.log('✅ Google Sheets API initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets:', error.message);
      console.warn('⚠️  Application will work but Google Sheets features will be unavailable');
    }
  }

  async getAllApplications() {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:ZZ`, // Extended to ZZ to support up to 702 columns
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return [];
      }

      // First row is headers
      const headers = rows[0];
      const applications = [];

      // Convert each row to an object
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const application = {
          rowIndex: i + 1, // 1-based index for sheet
          rowNumber: i, // 0-based index for array
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

  async updateCell(rowIndex, columnLetter, value) {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const range = `${this.sheetName}!${columnLetter}${rowIndex}`;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[value]],
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating cell:', error);
      throw error;
    }
  }

  async getColumnLetter(columnName) {
    // Get headers to find column index
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!1:1`,
    });

    const headers = response.data.values[0];
    const columnIndex = headers.indexOf(columnName);
    
    if (columnIndex === -1) {
      throw new Error(`Column "${columnName}" not found`);
    }

    // Convert index to column letter (0 = A, 1 = B, etc.)
    return this.numberToColumnLetter(columnIndex);
  }

  numberToColumnLetter(num) {
    let letter = '';
    while (num >= 0) {
      letter = String.fromCharCode((num % 26) + 65) + letter;
      num = Math.floor(num / 26) - 1;
    }
    return letter;
  }

  async updateApplicationField(rowIndex, fieldName, value) {
    try {
      const columnLetter = await this.getColumnLetter(fieldName);
      return await this.updateCell(rowIndex, columnLetter, value);
    } catch (error) {
      console.error('Error updating application field:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
