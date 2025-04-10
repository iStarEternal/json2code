import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GenCodeRoutingModule } from './gen-code-routing.module';
import {GenCodeMainComponent} from './gen-code-main/gen-code-main.component';
import {ACE_CONFIG, AceConfigInterface, AceModule} from 'ngx-ace-wrapper';


const DEFAULT_ACE_CONFIG: AceConfigInterface = {
};

@NgModule({
  declarations: [
    GenCodeMainComponent,
  ],
  imports: [
    CommonModule,
    GenCodeRoutingModule,
    AceModule,

  ],
  providers: [
    {
      provide: ACE_CONFIG,
      useValue: DEFAULT_ACE_CONFIG
    }
  ]
})
export class GenCodeModule { }
