const fs = require('fs');
const path = require('path');

class FileProcessor {
  static directoryPath = '';
  static latestFilePath = '';

  static async init(directoryPath) {
    this.directoryPath = directoryPath;
    try {
      const files = fs.readdirSync(this.directoryPath);

      // Фильтруем файлы по расширению
      // Фильтрация файлов
      const txtFiles = files.filter(file => 
        path.extname(file) === '.txt' && 
        path.basename(file, '.txt').startsWith('ftp.division.sales')
      );

      if (txtFiles.length === 0) {
        throw new Error('No files found with the given extension.');
      }

      // Находим самый свежий файл
      let latestFile;
      let latestTime = 0;

      txtFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime.getTime() > latestTime) {
          latestTime = stats.mtime.getTime();
          latestFile = filePath;
        }
      });

      this.latestFilePath = latestFile;
    } catch (err) {
      console.error('Unable to scan directory:', err);
      throw err;
    }
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
