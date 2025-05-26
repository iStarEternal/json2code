class ClassNode {
  className: string = '';
  ownerClass: ClassNode | null = null;
  properties: Property[] = [];

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
      return `${firstOwnerClass.className}_`;
    } else {
      return '';
    }
  }

  getClassName() {
    return `${this.getPrefix()}${this.className}`;
  }

  getPropertiesCodeStr(): string {
    const propertiesCodes = this.properties.map((property) => property.getCode());
    return propertiesCodes.join('\n');
  }

  getCode(): string {
    const className = this.getClassName();
    const propertiesCode = this.getPropertiesCodeStr();

    const thisClassCode = `public struct ${className}: HandyJSON {\n${propertiesCode}\n    public init() { }\n}`;

    const otherClassNodes: ClassNode[] = this.properties
      .filter((e) => e.selfClass != null)
      .map((e) => e.selfClass) as ClassNode[];
    const otherClassCodes = otherClassNodes.map((e) => e.getCode());

    return [thisClassCode, ...otherClassCodes].join('\n\n');
  }
}

class Property {
  name: string = '';
  type: string = '';
  isArray: boolean = false;
  arrayDepth: number = 0; // 新增数组层级
  ownerClass: ClassNode | null = null;
  selfClass: ClassNode | null = null;

  getFirstOwnerClass() {
    return this.selfClass?.getFirstOwnerClass();
  }

  getPrefix() {
    const firstOwnerClass = this.getFirstOwnerClass();
    if (firstOwnerClass != null) {
      return `${firstOwnerClass.className}_`;
    } else {
      return '';
    }
  }

  isBasicType() {
    return ['String', 'Int', 'Double', 'Bool', 'Any'].includes(this.type);
  }

  getPropertyType() {
    let type: string = this.type;
    if (!this.isBasicType()) {
      type = `${this.getPrefix()}${type}`;
    }
    // 根据 arrayDepth 拼接多层 []
    for (let i = 0; i < this.arrayDepth; i++) {
      type = `[${type}]`;
    }
    return type;
  }

  getCode() {
    return `    public var ${this.name}: ${this.getPropertyType()}?`;
  }
}

export class Json2SwiftHandyJsonV2 {
  static fileHeader() {
    return `//
//  DeviceLaserHeadPosition.swift
//
//  Created by hyh on 2025/04/03.
//`;
  }

  static convert(className: string, jsonText: string) {
    try {
      const jsonObject = JSON.parse(jsonText);
      const classNode = this.getClassNode(null, className, jsonObject);
      return `${this.fileHeader()}\n\nimport HandyJSON\n\n${classNode.getCode()}\n`;
    } catch (error) {
      return 'Invalid JSON';
    }
  }

  static getClassNode(ownerClass: ClassNode | null, name: string, obj: any): ClassNode {
    const codeClass = new ClassNode();
    codeClass.ownerClass = ownerClass;
    codeClass.className = name;
    codeClass.properties = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const property = this.getProperty(codeClass, key, value);
        codeClass.properties.push(property);
      }
    }

    return codeClass;
  }

  // 新增专门递归处理多维数组的函数
  static getArrayElementType(ownerClass: ClassNode | null, key: string, arr: any[]): Property {
    const property = new Property();
    property.ownerClass = ownerClass;
    property.name = key;

    if (arr.length === 0) {
      property.type = 'Any';
      property.arrayDepth = 1;
      return property;
    }

    const first = arr[0];

    if (Array.isArray(first)) {
      // 递归调用，数组层级+1
      const innerProp = this.getArrayElementType(ownerClass, key, first);
      property.type = innerProp.type;
      property.selfClass = innerProp.selfClass;
      property.arrayDepth = innerProp.arrayDepth + 1;
      return property;
    }

    if (typeof first === 'object' && first !== null) {
      const typeName = this.capitalizeFirstLetter(key);
      property.type = typeName;
      property.selfClass = this.getClassNode(ownerClass, typeName, first);
      property.arrayDepth = 1;
      return property;
    }

    // 基础类型判定，检查整个数组元素类型
    const types = new Set<string>();
    for (const item of arr) {
      if (item == null) {
        types.add('Any');
      } else if (typeof item === 'string') {
        types.add('String');
      } else if (typeof item === 'boolean') {
        types.add('Bool');
      } else if (typeof item === 'number') {
        if (Number.isInteger(item)) {
          types.add('Int');
        } else {
          types.add('Double');
        }
      } else {
        types.add('Any');
      }
    }

    // 如果同时包含 Int 和 Double，则用 Double
    if (types.has('Int') && types.has('Double')) {
      types.delete('Int');
    }

    if (types.size === 1) {
      property.type = [...types][0];
    } else {
      property.type = 'Any';
    }

    property.arrayDepth = 1;
    return property;
  }

  static getProperty(ownerClass: ClassNode | null, key: string, value: any): Property {
    let property = new Property();
    property.ownerClass = ownerClass;
    property.name = key;

    if (value == null) {
      property.type = 'Any';
      return property;
    }

    if (typeof value === 'string') {
      property.type = 'String';
      return property;
    }

    if (typeof value === 'number') {
      property.type = Number.isInteger(value) ? 'Int' : 'Double';
      return property;
    }

    if (typeof value === 'boolean') {
      property.type = 'Bool';
      return property;
    }

    if (Array.isArray(value)) {
      // 递归判断数组元素类型，包含多维数组
      property = this.getArrayElementType(ownerClass, key, value);
      return property;
    }

    if (typeof value === 'object') {
      const propertyType = this.capitalizeFirstLetter(key);
      property.type = propertyType;
      property.selfClass = this.getClassNode(ownerClass, propertyType, value);
      return property;
    }

    property.type = 'Unknown';
    console.log('Unknown', value, property);
    return property;
  }

  /// 将第一位转为大写
  static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
