class ClassNode {
  className: string = '';
  ownerClass: ClassNode | null = null;
  properties: Property[] = [];

  getFirstOwnerClass(): ClassNode | null {
    let current = this.ownerClass;
    while (current?.ownerClass != null) {
      current = current.ownerClass;
    }
    return current;
  }

  getPrefix(): string {
    const firstOwner = this.getFirstOwnerClass();
    return firstOwner ? `${firstOwner.className}_` : '';
  }

  getClassName(): string {
    return `${this.getPrefix()}${this.className}`;
  }

  getPropertiesCode(): string {
    return this.properties.map((p) => p.toCodeLine() + '\n').join('');
  }

  getCode(): string {
    const thisClassCode = `public struct ${this.getClassName()}: HandyJSON {\n${this.getPropertiesCode()}    public init() { }\n}`;
    const nestedClassCodes = this.properties
      .filter((p) => p.selfClass != null)
      .map((p) => p.selfClass!.getCode());

    return [thisClassCode, ...nestedClassCodes].join('\n\n');
  }
}

class Property {
  name: string = '';
  baseType: string = '';
  arrayDepth: number = 0; // 维度，0 表示非数组
  ownerClass: ClassNode | null = null;
  selfClass: ClassNode | null = null;

  // 判断是否是基础类型
  isBasicType(): boolean {
    return ['String', 'Int', 'Double', 'Bool', 'Any'].includes(this.baseType);
  }

  // 生成属性完整类型（带多维数组）
  getFullType(): string {
    let typeName = this.isBasicType() ? this.baseType : `${this.getPrefix()}${this.baseType}`;
    for (let i = 0; i < this.arrayDepth; i++) {
      typeName = `[${typeName}]`;
    }
    return typeName;
  }

  getPrefix(): string {
    const firstOwner = this.selfClass?.getFirstOwnerClass();
    return firstOwner ? `${firstOwner.className}_` : '';
  }

  toCodeLine(): string {
    return `    public var ${this.name}: ${this.getFullType()}?`;
  }
}

export class Json2SwiftHandyJsonV2 {
  static fileHeader(): string {
    return `//
//  DeviceLaserHeadPosition.swift
//
//  Created by hyh on 2025/04/03.
//`;
  }

  static convert(rootClassName: string, jsonText: string): string {
    try {
      const jsonObject = JSON.parse(jsonText);
      const rootNode = this.parseObject(null, rootClassName, jsonObject);
      return `${this.fileHeader()}\n\nimport HandyJSON\n\n${rootNode.getCode()}\n`;
    } catch {
      return 'Invalid JSON';
    }
  }

  // 入口：解析对象生成 ClassNode
  static parseObject(owner: ClassNode | null, className: string, obj: any): ClassNode {
    const node = new ClassNode();
    node.ownerClass = owner;
    node.className = className;
    node.properties = [];

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const prop = this.parseProperty(node, key, obj[key]);
      node.properties.push(prop);
    }

    return node;
  }

  // 解析属性，支持多维数组递归解析
  static parseProperty(owner: ClassNode | null, name: string, value: any): Property {
    if (value === null || value === undefined) {
      return this.createProperty(owner, name, 'Any', 0, null);
    }

    if (typeof value === 'string') {
      return this.createProperty(owner, name, 'String', 0, null);
    }

    if (typeof value === 'boolean') {
      return this.createProperty(owner, name, 'Bool', 0, null);
    }

    if (typeof value === 'number') {
      return this.createProperty(owner, name, Number.isInteger(value) ? 'Int' : 'Double', 0, null);
    }

    if (Array.isArray(value)) {
      return this.parseArrayProperty(owner, name, value);
    }

    if (typeof value === 'object') {
      // 普通对象，递归生成类
      const className = this.capitalize(name);
      const childClass = this.parseObject(owner, className, value);
      return this.createProperty(owner, name, className, 0, childClass);
    }

    // 兜底
    return this.createProperty(owner, name, 'Any', 0, null);
  }

  // 专门处理数组类型，递归判定元素类型和层级
  static parseArrayProperty(owner: ClassNode | null, name: string, arr: any[]): Property {
    const prop = new Property();
    prop.ownerClass = owner;
    prop.name = name;

    if (arr.length === 0) {
      prop.baseType = 'Any';
      prop.arrayDepth = 1;
      return prop;
    }

    // 递归检测多维数组深度和元素类型
    let element = arr;
    let depth = 0;

    while (Array.isArray(element)) {
      if (element.length === 0) break;
      element = element[0];
      depth++;
    }

    // 根据元素类型不同，生成不同类型
    if (element === null || element === undefined) {
      prop.baseType = 'Any';
      prop.arrayDepth = depth;
      return prop;
    }

    if (typeof element === 'object' && !Array.isArray(element)) {
      // 元素是对象，递归生成类
      const className = this.capitalize(name);
      const childClass = this.parseObject(owner, className, element);
      prop.baseType = className;
      prop.selfClass = childClass;
      prop.arrayDepth = depth;
      return prop;
    }

    // 元素为基础类型，则需要判断是否为混合类型
    const typesSet = new Set<string>();
    for (const item of arr.flat(depth - 1)) {
      if (item === null || item === undefined) typesSet.add('Any');
      else if (typeof item === 'string') typesSet.add('String');
      else if (typeof item === 'boolean') typesSet.add('Bool');
      else if (typeof item === 'number') {
        typesSet.add(Number.isInteger(item) ? 'Int' : 'Double');
      } else {
        typesSet.add('Any');
      }
    }

    // 优先 Double > Int > Others
    if (typesSet.has('Int') && typesSet.has('Double')) {
      typesSet.delete('Int');
    }

    prop.baseType = typesSet.size === 1 ? [...typesSet][0] : 'Any';
    prop.arrayDepth = depth;
    return prop;
  }

  // 工厂函数创建 Property
  static createProperty(owner: ClassNode | null, name: string, baseType: string, arrayDepth: number, selfClass: ClassNode | null): Property {
    const p = new Property();
    p.ownerClass = owner;
    p.name = name;
    p.baseType = baseType;
    p.arrayDepth = arrayDepth;
    p.selfClass = selfClass;
    return p;
  }

  static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
