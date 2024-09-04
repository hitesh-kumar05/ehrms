import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReportRoutingModule} from './report-routing.module';
import {PanjiyanreportComponent, SharedModule} from "shared";
import {StatelevelpanjiyanComponent} from "./statelevelpanjiyan/statelevelpanjiyan.component";
import {DistrictlevelpanjiyanComponent} from "./districtlevelpanjiyan/districtlevelpanjiyan.component";
import {SocietylevelpanjiyanComponent} from "./societylevelpanjiyan/societylevelpanjiyan.component";
import {TehsillevelpanjiyanComponent} from "./tehsillevelpanjiyan/tehsillevelpanjiyan.component";
import { AdminpdfreportComponent } from './adminpdfreport/adminpdfreport.component';


@NgModule({
  declarations: [
    StatelevelpanjiyanComponent,
    DistrictlevelpanjiyanComponent,
    SocietylevelpanjiyanComponent,
    TehsillevelpanjiyanComponent,
    AdminpdfreportComponent
  ],
  imports: [
    CommonModule,
    ReportRoutingModule,
    SharedModule,
    PanjiyanreportComponent
  ]
})
export class ReportModule {
}
