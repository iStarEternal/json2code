class ClassNode {
  className: string = '';
  ownerClass: ClassNode | null = null;
  properties: Property [] = []

  getFirstOwnerClass(): ClassNode | null {
    let ownerClass = this.ownerClass;
    while (ownerClass?.ownerClass != null) {
      ownerClass = ownerClass.ownerClass;
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

    const thisClassCode = `public struct ${className}: HandyJSON {\n${propertiesCode}\n    public init() { }\n}`

    const otherClassNodes: ClassNode[] = this.properties.filter((e) => e.selfClass != null).map((e) => e.selfClass) as ClassNode[];
    const otherClassCodes = otherClassNodes.map((e) => e.getCode());

    return [thisClassCode, ...otherClassCodes].join('\n\n');
  }
}

class Property {
  name: string = '';
  type: string = '';
  isArray: boolean = false;
  ownerClass: ClassNode | null = null;
  selfClass: ClassNode | null = null;


  getFirstOwnerClass() {
    return this.selfClass?.getFirstOwnerClass();
  }

  getPrefix() {
    const firstOwnerClass = this.getFirstOwnerClass();
    if (firstOwnerClass != null) {
      return `${firstOwnerClass.className}_`
    } else {
      return '';
    }
  }

  isBasicType() {
    return ['String', 'Int', 'Double', 'Bool', 'Any'].includes(this.type);
  }

  getPropertyType() {
    let type: string = this.type
    if (this.isBasicType()) {
      type = this.type;
    } else {
      type = `${this.getPrefix()}${type}`;
    }
    if (this.isArray) {
      type = `[${type}]`;
    }
    return type
  }

  getCode() {
    return `    public var ${this.name}: ${this.getPropertyType()}?`
  }
}


export class Json2SwiftHandyJsonV2 {

  static fileHeader() {
    return `//
//  DeviceLaserHeadPosition.swift
//
//  Created by hyh on 2025/04/03.
//`
  }

  static convert(className: string, jsonText: string) {
    try {
      const jsonObject = JSON.parse(jsonText);
      const classNode = this.getClassNode(null, className, jsonObject);
      console.log(classNode)
      return `${this.fileHeader()}\n\nimport HandyJSON\n\n${classNode.getCode()}\n`;
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

    // 数组
    if (Array.isArray(value)) {
      if (value.length > 0) {
        property = this.getProperty(ownerClass, key, value[0])
      } else {
        property.type = 'Any';
      }
      property.isArray = true;
      return property;
    }

    // 字典
    if (typeof value === "object") {
      let propertyType = this.capitalizeFirstLetter(key);
      property.type = propertyType;
      property.selfClass = this.getClassNode(ownerClass, propertyType, value);
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
