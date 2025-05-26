import {Component} from '@angular/core';
import {Json2SwiftHandyJsonV2} from './Json2SwiftHandyJsonV2';

@Component({
  selector: 'app-gen-code-main',
  templateUrl: './gen-code-main.component.html',
  styleUrl: './gen-code-main.component.less',
  standalone: false,
})
export class GenCodeMainComponent {
// // https://github.com/alibaba/HandyJSON/blob/master/README_cn.md


  className: string = 'Test';

  fromJson: string = `{
  "name": "P1",
  "age": 1.2,
  "obj1": {
    "str": "abc",
    "num": 1,
    "obj1_1": {},
    "obj1_2": {},
    "obj1_arr_arr": [[1, 2.1, 3]]
  },
  "obj2": [
    {
      "str": "abc",
      "num": 1,
      "obj2_1": [
        {
         "obj2_1_1": {}
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
    this.toCode = Json2SwiftHandyJsonV2.convert(className, fromJson);
  }

}


