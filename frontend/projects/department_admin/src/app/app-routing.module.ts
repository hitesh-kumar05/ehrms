import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LayoutComponent} from "../../../shared/layout/layout.component";
import {AuthGuard, ChildGuard, NotFoundComponent} from "shared";

import {MasDesignationComponent} from "./master/mas-designation/mas-designation.component";

const routes: Routes = [
  {path:'',redirectTo:'master',pathMatch:'full'},
  {
    path: 'master',
    component: LayoutComponent,
    loadChildren: () => import('./master/master.module').then(m => m.MasterModule),
    //canActivate: [AuthGuard, ChildGuard],
    //data: {role: [2]}
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
