const fs = require('fs');
const path = require('path');

class FileProcessor {
  static directoryPath = '';
  static latestFilePath = '';
  static firstFilePath = '';

  static async init(directoryPath, filePrependName) {
    this.directoryPath = directoryPath;
    try {
      const files = fs.readdirSync(this.directoryPath);

      // Фильтрация файлов
      const txtFiles = files.filter(file =>
        path.extname(file) === '.txt' &&
        path.basename(file, '.txt').startsWith(filePrependName)
      );

      if (txtFiles.length === 0) {
        throw new Error('No files found with the given extension.');
      }

      // Находим самый свежий и самый старый файл
      let latestFile;
      let latestTime = 0;
      let firstFile;
      let earliestTime = Infinity;

      txtFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);

        // Обновление самого свежего файла
        if (stats.mtime.getTime() > latestTime) {
          latestTime = stats.mtime.getTime();
          latestFile = filePath;
        }

        // Обновление самого старого файла
        if (stats.mtime.getTime() < earliestTime) {
          earliestTime = stats.mtime.getTime();
          firstFile = filePath;
        }
      });

      this.latestFilePath = latestFile;
      this.firstFilePath = firstFile;

    } catch (err) {
      console.error('Unable to scan directory:', err);
      throw err;
    }
  }


  static extractDateFromFileName(filePath) {
    // Извлекаем имя файла без пути
    const fileName = path.basename(filePath);
  
    // Регулярное выражение для поиска даты в формате YYYY.MM.DD
    const datePattern = /(\d{4})\.(\d{2})\.(\d{2})/;
    const match = fileName.match(datePattern);
  
    if (match) {
      // Разбираем дату из совпадения
      const year = match[1];
      const month = match[2];
      const day = match[3];
  
      // Форматируем в DD.MM.YYYY
      return `${day}.${month}.${year}`;
    } else {
      throw new Error('Date not found in file name.');
    }
  }

/**
 * Функция для чтения и парсинга TXT файла
 * @param {string} filePath - Путь к TXT файлу
 * @returns {Array<{ header: string, values: string[] }>}
 */
static parseTxtSync(filePath) {
  // Чтение файла синхронно
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Заменяем все '\r' на пустую строку и затем разделяем содержимое файла на строки
  const lines = fileContent.replace(/\r/g, '').split('\n');

  // Удаление пустых строк в начале и определение начала данных
  let startIndex = 0;
  while (startIndex < lines.length && !lines[startIndex].trim()) {
    startIndex++;
  }

  if (startIndex + 2 >= lines.length) {
    throw new Error('Недостаточно строк в файле для обработки');
  }

  // Получение заголовков (третья строка после пустых строк)
  const headers = lines[startIndex + 2].split('\t');

  // Обработка данных
  const results = headers.map((header, index) => ({
    header: header,
    values: []
  }));

  for (let i = startIndex + 3; i < lines.length - 1; i++) {
    const row = lines[i].split('\t');
    headers.forEach((header, index) => {
      results[index].values.push(row[index] || ''); // Заполнение пустыми строками если данные отсутствуют
    });
  }

  return results;
}



  static getSums() {
  try {
    console.log('The latest file is:', this.latestFilePath);
    return this.extractSums(this.latestFilePath);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

  static extractSums(file) {
  try {
    const data = fs.readFileSync(file, 'utf8');

    // Разделение данных на строки
    const lines = data.split('\n');

    // Пропускаем первую строку (заголовки)
    const sums = [];

    lines.slice(1).forEach(line => {
      const [division, amount] = line.split('\t');
      if (division && amount) {
        sums.push({
          division: division.trim(),
          amount: parseFloat(amount.replace(/\s/g, ''))
        });
      }
    });

    return sums;
  } catch (err) {
    console.error('Error reading the file:', err);
    throw err;
  }
}
}

module.exports = FileProcessor;
