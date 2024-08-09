
const fs = require('fs');
const path = require('path');
const FileProcessor = require('./FileProcessor');
const GoogleProcessor = require('./GoogleProcessor');
const directoryPath = path.join(__dirname, '..', 'ftp');

// Дать этому email право на редактирование wawka2002-gmail-com@my-project-igo4ek.iam.gserviceaccount.com
// Ключ качать отсюда https://console.cloud.google.com/iam-admin/serviceaccounts/details/112611614223361347625;edit=true/keys?project=my-project-igo4ek
async function main () {
  const spreadsheetId = '1m-1wB4luSFEbxXmdqznXRBeMsJa2eGgy1nXzCnHalTQ';
  const sheetName = 'ftp.division.sales'; 
  const filePrependName = sheetName + ' ';

  // Инициализация GoogleProcessor
  await FileProcessor.init(directoryPath, filePrependName);
  await GoogleProcessor.init(spreadsheetId);
  console.log(`GoogleProcessor успешно инициализирован!`);

  // Столбец, в который будем записывать
  let currentYearMonth = GoogleProcessor.getCurrentYearMonth(); // 2024-09
  let columnLetterFact = await GoogleProcessor.findColumnInSecondRow(sheetName, currentYearMonth);
  // console.log(columnLetterFact);


  try {
    const sums = FileProcessor.getSums();
    // console.log(sums);
    for (let i = 0; i < sums.length; i++) {
      // console.log(sums[i]);
      let rowNumberDivision = await GoogleProcessor.findRowInFirstColumn(sheetName, sums[i].division);
      console.log(sums[i].division, columnLetterFact + rowNumberDivision, sums[i].amount);
      if (rowNumberDivision !== 0) {
        await GoogleProcessor.writeCell(`${sheetName}!${columnLetterFact}${rowNumberDivision}`, sums[i].amount);
      }
    }
    // console.log('Sums:', sums);
    await GoogleProcessor.writeCell(`${sheetName}!A1`, path.parse(FileProcessor.latestFilePath).name.split(filePrependName)[1]);
    fs.unlinkSync(FileProcessor.latestFilePath);
  } catch (err) {
    console.error('Error:', err);
  }

}


// Запуск функции main по таймеру каждые 5 минут (300000 миллисекунд)
const interval = 30000; // 30 секунд в миллисекундах
main();
setInterval(async () => {
  try {
    await main();
  } catch (error) {
    console.error('Error occurred during main execution:', error);
  }
}, interval);







