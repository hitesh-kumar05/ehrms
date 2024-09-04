import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {MasDesignationComponent} from "./mas-designation/mas-designation.component";
import { MasOfficeLevelComponent } from './mas-office-level/mas-office-level.component';
import { MasOfficeTypeComponent } from './mas-office-type/mas-office-type.component';
import { MasOfficeComponent } from './mas-office/mas-office.component';

const routes: Routes = [
  {path:'',redirectTo:'designation',pathMatch:'full'},
  {path: "designation", component: MasDesignationComponent, title: "Menu Control"},
  {path: "office-level", component: MasOfficeLevelComponent, title: "Menu Control"},
  {path: "office-type", component:MasOfficeTypeComponent, title: "Menu Control"},
  {path: "office", component:MasOfficeComponent, title: "Menu Control"},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
