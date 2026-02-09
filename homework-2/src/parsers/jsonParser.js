class JSONParser {
  static parse(content) {
    try {
      const data = JSON.parse(content);
      const records = Array.isArray(data) ? data : [data];

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

module.exports = JSONParser;

