const { parse } = require('csv-parse/sync');

class CSVParser {
  static parse(content) {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return {
        success: true,
        data: records,
        count: records.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  }
}

module.exports = CSVParser;

