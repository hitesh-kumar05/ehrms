import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HeaderComponent} from './layout/header/header.component';
import {SidebarComponent} from './layout/sidebar/sidebar.component';
import {LoaderComponent} from './loader/loader.component';
import {DotLoaderComponent} from './dot-loader/dot-loader.component';
import {NotFoundComponent} from "./404/404.component";
import {MatIconModule} from "@angular/material/icon";
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {HttpClientModule} from "@angular/common/http";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatCardModule} from "@angular/material/card";
import {MatSelectModule} from "@angular/material/select";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatTableModule} from "@angular/material/table";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatStepperModule} from "@angular/material/stepper";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatRadioModule} from "@angular/material/radio";
import {MatTooltipModule} from "@angular/material/tooltip";
import {PasswordChangeComponent} from "./layout/passwordchnage/passwordchnage.component";
import {MatDialogModule} from "@angular/material/dialog";
import {RouterLink} from "@angular/router";
import {NgSelectModule} from "@ng-select/ng-select";
import {DetectCapsLockDirective} from "./directive/detect-caps-lock.directive";
import {SumsPipe} from "./sums.pipe";
import {FileuploadComponent} from "./fileupload/fileupload.component";
import {MatToolbarModule} from "@angular/material/toolbar";
import {VerificationReportComponent} from "./component/raeoverificationreport/raeoverificationreport.component";
import {CropwisepajiyanreportComponent} from "./component/cropwisepajiyanreport/cropwisepajiyanreport.component";
import {MatTab, MatTabContent, MatTabGroup, MatTabsModule} from "@angular/material/tabs";
import {ChartComponent} from "ngx-apexcharts";
import {PanjiyanlistComponent} from "./component/panjiyanlist/panjiyanlist.component";
import {MatSortModule} from "@angular/material/sort";


@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    PasswordChangeComponent,
    LoaderComponent,
    DotLoaderComponent,
    NotFoundComponent,
    SumsPipe,
    FileuploadComponent,
    VerificationReportComponent,
    CropwisepajiyanreportComponent,
    PanjiyanlistComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    MatButtonModule,
    DetectCapsLockDirective,
    MatToolbarModule,
    MatCardModule,
    MatTabsModule,
    ChartComponent,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  exports: [
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatPaginatorModule,
    MatTableModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    DotLoaderComponent,
    MatTooltipModule,
    LoaderComponent,
    HeaderComponent,
    SidebarComponent,
    NgSelectModule,
    DetectCapsLockDirective,
    MatDialogModule,
    SumsPipe,
    FileuploadComponent,
    VerificationReportComponent,
    CropwisepajiyanreportComponent,
    PanjiyanlistComponent
  ]
})
export class SharedModule {
}
