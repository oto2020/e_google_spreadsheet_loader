
const { google } = require('googleapis');
class GoogleProcessor {
  // Статические свойства для хранения объектов
  static keys = require('./Keys.json');
  static S_ID;
  static client = new google.auth.JWT(this.keys.client_email, null, this.keys.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
  static gsapi = google.sheets({ version: 'v4', auth: this.client });

  // Метод для инициализации аутентификации
  static async init(spreadsheetId) {
    this.S_ID = spreadsheetId;
    return new Promise((resolve, reject) => {
      this.client.authorize((error, tokens) => {
        if (error) {
          console.error('Authorization error:', error);
          reject(error);
        } else {
          console.log('Connected...');
          resolve(tokens);
        }
      });
    });
  }


  // ---------- ОСНОВНЫЕ ФУНКЦИИ ------

  // Функция для удаления всех строк, где в столбце 'A' присутствует указанное значение
  static async deleteRowsByColumnValue(sheetName, columnValue) {
    try {
      // Читаем все данные из указанного столбца 'A'
      const range = `${sheetName}!A:A`;
      let values = await this.readRange(range);

      // Находим индексы строк, где значение совпадает с columnValue
      const rowsToDelete = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] === columnValue) {
          rowsToDelete.push(i + 1); // Строки нумеруются с 1
        }
      }

      if (rowsToDelete.length === 0) {
        console.log('No rows found with the specified value.');
        return;
      }

      // Удаляем строки, начиная с последней, чтобы не нарушить индексацию
      for (const row of rowsToDelete.reverse()) {
        await this.deleteRow(sheetName, row);
        console.log(`Deleted row ${row}`);
      }

    } catch (error) {
      console.error('Error deleting rows:', error);
      // throw error;
    }
  }

  // Вспомогательная функция для удаления строки
  static async deleteRow(sheetName, row) {
    try {
      const batchUpdateRequest = {
        spreadsheetId: this.S_ID,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: (await this.getSheetId(sheetName)),
                  dimension: 'ROWS',
                  startIndex: row - 1,
                  endIndex: row
                }
              }
            }
          ]
        }
      };

      await this.gsapi.spreadsheets.batchUpdate(batchUpdateRequest);
    } catch (error) {
      console.error('Error deleting row:', error);
      throw error;
    }
  }

  // Вспомогательная функция для получения идентификатора листа
  static async getSheetId(sheetName) {
    try {
      const response = await this.gsapi.spreadsheets.get({
        spreadsheetId: this.S_ID,
      });

      const sheets = response.data.sheets;
      const sheet = sheets.find(sheet => sheet.properties.title === sheetName);

      if (!sheet) {
        throw new Error(`Sheet with name ${sheetName} not found.`);
      }

      return sheet.properties.sheetId;
    } catch (error) {
      console.error('Error getting sheet ID:', error);
      throw error;
    }
  }



  // Определение номера первой пустой строки
  static async findFirstEmptyRow(sheetName) {
    try {
      // Читаем все данные из листа
      const range = `${sheetName}`; // Читаем весь лист
      const values = await this.readRange(range);

      // Найдем первую пустую строку
      let rowNumber = values.length + 1; // Начинаем с предположения, что пустая строка будет после последней строки

      // Проходим через все строки и ищем первую пустую
      for (let i = 0; i < values.length; i++) {
        if (values[i].every(cell => cell === undefined || cell === '')) {
          rowNumber = i + 1; // Строки нумеруются с 1
          break;
        }
      }

      return rowNumber;
    } catch (error) {
      console.error('Error finding the first empty row:', error);
      throw error;
    }
  }

  // Метод для получения заголовков листа
  static async getHeaders(sheetName) {
    try {
      // Читаем первую строку (заголовки) из указанного листа
      const range = `${sheetName}!1:1`; // Первая строка
      const values = await this.readRange(range);

      // Проверяем, есть ли заголовки
      if (values.length === 0) {
        console.log('No headers found.');
        return [];
      }

      // Возвращаем первую строку как заголовки
      const headers = values[0]; // Первый элемент - это заголовки
      console.log('Headers:', headers);
      return headers;
    } catch (error) {
      console.error('Error getting headers:', error);
      throw error;
    }
  }


  // находит первое встречающееся в столбце А название подразделения 
  static async findRowInFirstColumn(sheetName, currentDivision) {
    let divisionColumnLetter = 'A';
    let values = await this.readRange(`${sheetName}!${divisionColumnLetter}:${divisionColumnLetter}`);
    values = values.map(el => el[0]);
    // console.log(values);
    // let currentDivision = 'Групповые программы';
    let rowNumber = values.findIndex(el => el === currentDivision) + 1; // в какой строке искомое подразделение
    // console.log(rowNumber);
    return rowNumber;
  }
  // находит второй встречающийся месяц формата "2024-08" и выдает букву 
  static async findColumnInSecondRow(sheetName, foundingValue) {
    let monthRowNumber = 2; // строка с месяцами 2024-01 2024-01 2024-01 2024-02 2024-02 2024-02...
    //let columnLetter = getColumnLetter();
    let values = await this.readRange(`${sheetName}!${monthRowNumber}:${monthRowNumber}`);
    values = values[0]; // так как массив двумерный
    // console.log(values);

    let colNumber = values.findIndex(el => el === foundingValue) + 2; // в каком столбце факты по этому месяцу
    let colLetter = this.getColumnLetter(colNumber);
    // console.log(colNumber);
    // console.log(colLetter);
    return colLetter;
  }

  // Возвращает год-месяц в формате 2024-09
  static getCurrentYearMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Добавляем 1, т.к. месяцы начинаются с 0
    return `${year}-${month}`;
  }

  // Функция для преобразования номера столбца в букву столбца
  static getColumnLetter(columnNumber) {
    let letter = '';
    let temp = columnNumber;

    while (temp > 0) {
      let mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - mod) / 26);
    }
    return letter;
  }

  // ЧТЕНИЕ
  static async readRange(range) {
    const opt = {
      spreadsheetId: this.S_ID,
      range: range
    };
    let dataObtained = await this.gsapi.spreadsheets.values.get(opt);
    return dataObtained.data.values;
  }

  // ЗАПИСЬ
  static async writeRange(range, values) {
    const updateoptions = {
      spreadsheetId: this.S_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: values }
    };
    let resp = await this.gsapi.spreadsheets.values.update(updateoptions);
    // console.log(resp);
  }

  // 
  static async writeCell(cellAdress, value) {
    const updateoptions = {
      spreadsheetId: this.S_ID,
      range: cellAdress,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[value]] }
    };
    let resp = await this.gsapi.spreadsheets.values.update(updateoptions);
    // console.log(resp);
  }


  static async getSheetsList() {
    try {
      const response = await this.gsapi.spreadsheets.get({
        spreadsheetId: this.S_ID,
      });

      const sheets = response.data.sheets;
      const sheetNames = sheets.map(sheet => sheet.properties.title);

      console.log('Sheet names:', sheetNames);
      return sheetNames;
    } catch (error) {
      console.error('Error getting sheet names:', error);
    }
  }


}



module.exports = GoogleProcessor;
