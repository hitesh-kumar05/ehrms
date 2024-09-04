import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MasterRoutingModule } from './master-routing.module';
import { MasDesignationComponent } from './mas-designation/mas-designation.component';
import {SharedModule} from "shared";
import { MasOfficeLevelComponent } from './mas-office-level/mas-office-level.component';
import { MasOfficeTypeComponent } from './mas-office-type/mas-office-type.component';
import { MasOfficeComponent } from './mas-office/mas-office.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

@NgModule({
  declarations: [
    MasDesignationComponent,
    MasOfficeLevelComponent,
    MasOfficeTypeComponent,
    MasOfficeComponent,
  ],
  imports: [
    CommonModule,
    MasterRoutingModule,
    SharedModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
   

  ]
})
export class MasterModule { }
