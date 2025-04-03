
export class Json2SwiftHandyJsonV1 {


  static convert(className: string, jsonText: string) {
    try {
      const jsonObject = JSON.parse(jsonText);
      const models: string[] = [];
      this.convertToSwiftModel(`${className}_`, className, jsonObject, models);
      const code = models.reverse().join("\n\n");
      return `import HandyJson\n\n${code}\n`;
    } catch (error) {
      return "Invalid JSON";
    }
  }

  static convertToSwiftModel(prefix: string, name: string, obj: any, models: string[]): string {
    let properties = "";
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        let swiftType = this.getSwiftType(prefix, value, key, models);
        properties += `    var ${key}: ${swiftType}?\n`;
      }
    }

    const modelCode = `struct ${name}: HandyJSON {\n${properties}}`;
    models.push(modelCode);
    return modelCode;
  }

  static getSwiftType(prefix: string, value: any, key: string, models: string[]): string {
    if (typeof value === "string") return "String";
    if (typeof value === "number") return value % 1 === 0 ? "Int" : "Double";
    if (typeof value === "boolean") return "Bool";

    // 数组
    if (Array.isArray(value)) {
      if (value.length > 0) {
        return `[${this.getSwiftType(prefix, value[0], key, models)}]`;
      }
      return "[Any]";
    }

    // 字典
    if (typeof value === "object" && value !== null) {
      const modelName = prefix + this.capitalizeFirstLetter(key);
      this.convertToSwiftModel(prefix, modelName, value, models);
      return modelName;
    }
    return "Any";
  }

  /// 将第一位转为大写
  static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
