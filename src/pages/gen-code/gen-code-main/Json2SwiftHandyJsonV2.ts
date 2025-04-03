class ClassNode {
  className: string = '';
  ownerClass: ClassNode | null = null;
  properties: Property [] = []


  getFirstOwnerClass() {
    let ownerClass = this.ownerClass;
    if (ownerClass != null) {
      if (ownerClass.ownerClass != null) {
        ownerClass = ownerClass.ownerClass;
      }
    }
    return ownerClass;
  }

  getPrefix() {
    const firstOwnerClass = this.getFirstOwnerClass();
    if (firstOwnerClass != null) {
      return `${firstOwnerClass.className}_`
    } else {
      return '';
    }
  }

  getClassName() {
    return `${this.getPrefix()}${this.className}`;
  }

  getPropertiesCodeStr(): string {
    const propertiesCodes = this.properties.map((property) => property.getCode())
    return propertiesCodes.join("\n");
  }

  getCode(): string {

    const className = this.getClassName();
    const propertiesCode = this.getPropertiesCodeStr();

    const thisClassCode = `public struct ${className}: HandyJSON {\n${propertiesCode}\n}`

    const otherClassNodes: ClassNode[] = this.properties.filter((e) => e.otherClass != null).map((e) => e.otherClass) as ClassNode[];
    const otherClassCodes = otherClassNodes.map((e) => e.getCode());

    return [thisClassCode, ...otherClassCodes].join('\n\n');
  }
}

class Property {
  name: string = '';
  type: string = '';
  ownerClass: ClassNode | null = null;
  otherClass: ClassNode | null = null;

  getCode() {
    return `    public var ${this.name}: ${this.type}?`
  }
}


export class Json2SwiftHandyJsonV2 {

  static convert(className: string, jsonText: string) {
    try {
      const jsonObject = JSON.parse(jsonText);
      const classNode = this.getClassNode(null, className, jsonObject);
      console.log(classNode)
      return `import HandyJson\n\n${classNode.getCode()}\n`;
    } catch (error) {
      return "Invalid JSON";
    }
  }

  static getClassNode(ownerClass: ClassNode | null, name: string, obj: any): ClassNode {

    const codeClass = new ClassNode();
    codeClass.ownerClass = ownerClass;
    codeClass.className = name;
    codeClass.properties = []

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        let property = this.getProperty(codeClass, key, value);
        codeClass.properties.push(property)
      }
    }

    return codeClass;
  }


  static getProperty(ownerClass: ClassNode | null, key: string, value: any) {
    let property = new Property()
    property.ownerClass = ownerClass;
    property.name = key;

    if (value == null) {
      property.type = "Any";
      return property;
    }

    if (typeof value === "string") {
      property.type = "String";
      return property;
    }
    if (typeof value === "number") {
      property.type = value % 1 === 0 ? "Int" : "Double";
      return property;
    }
    if (typeof value === "boolean") {
      property.type = "Bool";
      return property;
    }
    if (typeof value === 'undefined') {
      property.type = "Und";
      return property;
    }

    // 数组
    if (Array.isArray(value)) {
      if (value.length > 0) {
        property = this.getProperty(ownerClass, key, value[0])
      } else {
        property.type = 'Any';
      }
      return property;
    }

    // 字典
    if (typeof value === "object" && value !== null) {
      let propertyType = this.capitalizeFirstLetter(key);
      property.type = propertyType;
      property.otherClass = this.getClassNode(ownerClass, propertyType, value);
      return property
    }

    // 未知属性
    property.type = 'Unknown';
    console.log('Unknown', value, property)
    return property;
  }

  /// 将第一位转为大写
  static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
