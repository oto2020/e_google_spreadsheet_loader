const fs = require('fs');
const path = require('path');
const FileProcessor = require('./FileProcessor');
const GoogleProcessor = require('./GoogleProcessor');
const directoryPath = path.join(__dirname, '..', 'ftp');

// Дать этому email право на редактирование wawka2002-gmail-com@my-project-igo4ek.iam.gserviceaccount.com
// Ключ качать отсюда https://console.cloud.google.com/iam-admin/serviceaccounts/details/112611614223361347625;edit=true/keys?project=my-project-igo4ek
async function main () {
  const spreadsheetId ='1NNagnLBZsMtY0NQkeCAr0oQp5LkZr1o3';
  const sheetName = 'ftp.sales.rop';
  const filePrependName = sheetName + ' ';

  // // Инициализация GoogleProcessor
  await FileProcessor.init(directoryPath, filePrependName);
  await GoogleProcessor.init(spreadsheetId);
  console.log(`GoogleProcessor успешно инициализирован!`);
  console.log(FileProcessor.latestFilePath);
  try {
    await GoogleProcessor.writeCell(`${sheetName}!A1`, path.parse(FileProcessor.latestFilePath).name.split(filePrependName)[1]);
    // fs.unlinkSync(FileProcessor.latestFilePath);
  } catch (err) {
    console.error('Error:', err);
  }

}


// Запуск функции main по таймеру каждые 5 минут (300000 миллисекунд)
// const interval = 30000; // 30 секунд в миллисекундах
main();
// setInterval(async () => {
//   try {
//     await main();
//   } catch (error) {
//     console.error('Error occurred during main execution:', error);
//   }
// }, interval);







