const xml2js = require('xml2js');

class XMLParser {
  static async parse(content) {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
      });

      const result = await parser.parseStringPromise(content);

      // Handle different root element structures
      let records = [];
      const rootKeys = Object.keys(result);

      if (rootKeys.length === 1) {
        const rootKey = rootKeys[0];
        const root = result[rootKey];

        // Look for ticket or item arrays
        if (Array.isArray(root)) {
          records = root;
        } else if (root.ticket) {
          records = Array.isArray(root.ticket) ? root.ticket : [root.ticket];
        } else if (root.item) {
          records = Array.isArray(root.item) ? root.item : [root.item];
        } else {
          records = [root];
        }
      }

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

module.exports = XMLParser;

