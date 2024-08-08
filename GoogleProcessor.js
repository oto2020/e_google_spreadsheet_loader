
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

    // находит первое встречающееся в столбце А название подразделения 
    static async findRowInFirstColumn(sheetName, currentDivision) {
    let divisionColumnLetter = 'A';
    let values = await this.readRange(`${sheetName}!${divisionColumnLetter}:${divisionColumnLetter}`);
    values = values.map(el => el[0]);
    // console.log(values);
    // let currentDivision = 'Групповые программы';
    let rowNumber = values.findIndex(el=> el === currentDivision) + 1; // в какой строке искомое подразделение
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
  
    let colNumber = values.findIndex(el=> el === foundingValue) + 2; // в каком столбце факты по этому месяцу
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
  static async readRange (range) {
    const opt = {
      spreadsheetId: this.S_ID,
      range: range
    };
    let dataObtained = await this.gsapi.spreadsheets.values.get(opt);
    return dataObtained.data.values;
  }
  
  // ЗАПИСЬ
  static async writeRange (range, values) {
    const updateoptions = {
      spreadsheetId: this.S_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {values: values}
    };
    let resp = await this.gsapi.spreadsheets.values.update(updateoptions);
    console.log(resp);
  }
  
  // 
  static async writeCell (cellAdress, value) {
    const updateoptions = {
      spreadsheetId: this.S_ID,
      range: cellAdress,
      valueInputOption: 'USER_ENTERED',
      resource: {values: [[value]]}
    };
    let resp = await this.gsapi.spreadsheets.values.update(updateoptions);
    // console.log(resp);
  }

}

module.exports = GoogleProcessor;
