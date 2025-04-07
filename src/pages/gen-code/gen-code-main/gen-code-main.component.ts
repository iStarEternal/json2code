import {Component, ViewChild} from '@angular/core';
import {AceModule} from 'ngx-ace-wrapper';
import {Json2SwiftHandyJsonV1} from './Json2SwiftHandyJsonV1';
import {Json2SwiftHandyJsonV2} from './Json2SwiftHandyJsonV2';

@Component({
  selector: 'app-gen-code-main',
  imports: [
    AceModule

  ],
  templateUrl: './gen-code-main.component.html',
  standalone: true,
  styleUrl: './gen-code-main.component.less'
})
export class GenCodeMainComponent {
// // https://github.com/alibaba/HandyJSON/blob/master/README_cn.md


  className: string = '';

  fromJson: string = `{
  "name": "P1",
  "age": 1.2,
  "T1Obj1": {
    "str": "abc",
    "num": 1,
    "T2Obj1": {},
    "T2Obj2": {}
  },
  "T1Obj2": [
    {
      "str": "abc",
      "num": 1,
      "s": [
        {
         "VV": {}
        }
      ]
    }
  ]
}

`

  toCode: string = ''

  constructor() {
    this.onValueChange()
  }


  onClassNameChanged($event: Event) {
    this.className = ($event.target as HTMLInputElement).value
    console.log("aaa")
    this.genCode();
  }

  onValueChange() {

    this.genCode();


  }

  genCode() {
    const className = this.className || 'Model';
    const fromJson = this.fromJson;
    if (fromJson == null || fromJson.length < 2) {
      return;
    }

    const jsonObject = JSON.parse(fromJson);
    if (jsonObject == null) {
      console.log("非json");
      return
    }

    // const v1Code = Json2SwiftHandyJsonV1.convert(className, fromJson)
    // console.log("v1Code", v1Code);


    const v2Code = Json2SwiftHandyJsonV2.convert(className, fromJson);
    // console.log("v2Code", v2Code);



    this.toCode = v2Code;
  }

}


