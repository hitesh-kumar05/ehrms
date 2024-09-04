import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotFoundComponent} from "shared";
import {StatelevelpanjiyanComponent} from "./statelevelpanjiyan/statelevelpanjiyan.component";
import {DistrictlevelpanjiyanComponent} from "./districtlevelpanjiyan/districtlevelpanjiyan.component";
import {TehsillevelpanjiyanComponent} from "./tehsillevelpanjiyan/tehsillevelpanjiyan.component";
import {SocietylevelpanjiyanComponent} from "./societylevelpanjiyan/societylevelpanjiyan.component";
import {AdminpdfreportComponent} from "./adminpdfreport/adminpdfreport.component";

const routes: Routes = [
  {
    path: 'panjiyan',
    component: StatelevelpanjiyanComponent,
    title: 'जिलेवार पंजीयन रिपोर्ट'
  },
  {
    path: 'panjiyan/:district_id',
    component: DistrictlevelpanjiyanComponent,
    title: 'तहसीलवार पंजीयन रिपोर्ट'
  },
  {
    path: 'panjiyan/:district_id/:tehsil_id',
    component: TehsillevelpanjiyanComponent,
    title: 'समितिवार पंजीयन रिपोर्ट'
  },
  {
    path: 'panjiyan/:district_id/:tehsil_id/:society_id',
    component: SocietylevelpanjiyanComponent,
    title: 'ग्रामवार पंजीयन रिपोर्ट'
  },
  {
    path: 'verification',
    component: StatelevelpanjiyanComponent,
    title: 'जिलेवार सत्यापन रिपोर्ट'
  },
  {
    path: 'verification/:district_id',
    component: DistrictlevelpanjiyanComponent,
    title: 'तहसीलवार सत्यापन रिपोर्ट'
  },
  {
    path: 'verification/:district_id/:tehsil_id',
    component: TehsillevelpanjiyanComponent,
    title: 'समितिवार सत्यापन रिपोर्ट'
  },
  {
    path: 'verification/:district_id/:tehsil_id/:society_id',
    component: SocietylevelpanjiyanComponent,
    title: 'ग्रामवार सत्यापन रिपोर्ट'
  },
  {path: 'pdf', component: AdminpdfreportComponent},
  {path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule {
}
