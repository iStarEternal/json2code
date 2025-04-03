import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('../pages/gen-code/gen-code.module').then(m => m.GenCodeModule),
  }
];
