import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GenCodeMainComponent} from './gen-code-main/gen-code-main.component';

const routes: Routes = [
  {
    path: '',
    component: GenCodeMainComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenCodeRoutingModule {
}
