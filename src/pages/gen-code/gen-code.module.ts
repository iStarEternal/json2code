import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GenCodeRoutingModule } from './gen-code-routing.module';
import {GenCodeMainComponent} from './gen-code-main/gen-code-main.component';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    GenCodeRoutingModule
  ]
})
export class GenCodeModule { }
