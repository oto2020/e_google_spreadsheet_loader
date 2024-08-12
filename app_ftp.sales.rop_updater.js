const fs = require('fs');
const path = require('path');
const FileProcessor = require('./FileProcessor');
const GoogleProcessor = require('./GoogleProcessor');
const directoryPath = path.join(__dirname, '..', 'ftp');

// Дать этому email право на редактирование wawka2002-gmail-com@my-project-igo4ek.iam.gserviceaccount.com
// Ключ качать отсюда https://console.cloud.google.com/iam-admin/serviceaccounts/details/112611614223361347625;edit=true/keys?project=my-project-igo4ek
async function main() {
  const spreadsheetId = '1D5YETgU-8pgfq-Yy7RZIkdY_bXvJZSDtImzC1OOZxtw';//'1NNagnLBZsMtY0NQkeCAr0oQp5LkZr1o3';
  const sheetName = 'ftp.sales.rop';
  const filePrependName = 'ftp.sales.rop ';

  // // Инициализация GoogleProcessor
  await FileProcessor.init(directoryPath, filePrependName);
  await GoogleProcessor.init(spreadsheetId);
  console.log(`GoogleProcessor успешно инициализирован!`);

  // await GoogleProcessor.getSheetsList();

  console.log(`firstFilePath ${FileProcessor.firstFilePath}`);    // более ранний
  console.log(`latestFilePath ${FileProcessor.latestFilePath}`);  // более поздний

  // заголовки google отдельно для определения столбцов
  let headers = await GoogleProcessor.getHeaders(sheetName);
  // console.log(headers);
  // return;


  let columns = FileProcessor.parseTxtSync(FileProcessor.firstFilePath);
  // console.log(columns);
  // return;

  let rowsCount = columns[0].values.length;
  let fileDate = FileProcessor.extractDateFromFileName(FileProcessor.firstFilePath);

  // удаляем все строки с fileDate
  await GoogleProcessor.deleteRowsByColumnValue(sheetName, fileDate);
  // console.log(fileDate);
  let firstColumnWithDate = new Array(rowsCount).fill(fileDate);
  console.log(firstColumnWithDate);

  let firstEmptyRow = await GoogleProcessor.findFirstEmptyRow(sheetName);
  console.log(firstEmptyRow);

  // Создаем массив значений для записи
  const valueArray = firstColumnWithDate.map(value => [value]); // Преобразуем значения в двумерный массив
  // Определяем диапазон для записи (начиная с указанной строки)
  const range = `${sheetName}!A${firstEmptyRow}:A${firstEmptyRow + valueArray.length - 1}`;
  // console.log(range);
  // Записываем данные                                       
  await GoogleProcessor.writeRange(range, valueArray);

  for (let j = 0; j < columns.length; j++) {
    let testHeader = columns[j].header; // `cardName`;
    let columnLetter = GoogleProcessor.getColumnLetter(headers.indexOf(testHeader) + 1);
    // console.log(testHeader, columnLetter);
    if (columnLetter) {
      console.log(columnLetter);
      // Создаем массив значений для записи
      const valueArray = columns[j].values.map(value => [value]); // Преобразуем значения в двумерный массив
      // console.log(valueArray);
      // Определяем диапазон для записи (начиная с указанной строки)
      let range = `${sheetName}!${columnLetter}${firstEmptyRow}:${columnLetter}${firstEmptyRow + columns[j].values.length - 1}`;
      console.log(range);
      // Записываем данные
      await GoogleProcessor.writeRange(range, valueArray);
    }

  }

  await GoogleProcessor.writeCell(`${sheetName}!A1`, path.parse(FileProcessor.firstFilePath).name.split(filePrependName)[1]);
  fs.unlinkSync(FileProcessor.firstFilePath);
}


// Запуск функции main по таймеру каждые 5 минут (300000 миллисекунд)
const interval = 50000; // 50 секунд в миллисекундах
main();
setInterval(async () => {
  try {
    await main();
  } catch (error) {
    console.error('Error occurred during main execution:', error);
  }
}, interval);







