import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LayoutComponent} from "../../../shared/layout/layout.component";
import {AuthGuard, ChildGuard, NotFoundComponent} from "shared";
import {MenumasterComponent} from "./menumaster/menumaster.component";
import {PasswordResetComponent} from "./password-reset/password-reset.component";
import {SlowquerylistComponent} from "./slowquerylist/slowquerylist.component";
import {QuerylivecheckComponent} from "./slowquerylist/querylivecheck/querylivecheck.component";
import {ShowprocesslistComponent} from "./showprocesslist/showprocesslist.component";
import {ApplicationsizeComponent} from "./showprocesslist/applicationsize/applicationsize.component";
import {SessionlistComponent} from "./sessionlist/sessionlist.component";
import {ErrorloglistComponent} from "./errorloglist/errorloglist.component";
import {ServerqueryComponent} from "./serverquery/serverquery.component";

const routes: Routes = [
  {
    path: 'report',
    component: LayoutComponent,
    loadChildren: () => import('./report/report.module').then(m => m.ReportModule),
    canActivate: [AuthGuard, ChildGuard],
    data: {role: [2]}
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard, ChildGuard],
    data: {role: [2]},
    children: [
      {path: "menu", component: MenumasterComponent, title: "Menu Control"},
      {path: "passReset", component: PasswordResetComponent, title: "पासवर्ड रिसेट"},
      {path: 'slow', component: SlowquerylistComponent, title: 'Slow Query List'},
      {path: 'slow/:sid', component: QuerylivecheckComponent, title: 'Explain Query Performance'},
      {path: 'process', component: ShowprocesslistComponent, title: 'Show Process List'},
      {path: 'process/size', component: ApplicationsizeComponent, title: 'Show Process List'},
      {path: 'session', component: SessionlistComponent, title: 'Session List'},
      {path: 'query', component: ServerqueryComponent, title: 'Query Run for Server'},
      {path: 'error', component: ErrorloglistComponent, title: 'Error Log List'},
      {path: '**', component: NotFoundComponent, title: 'Page Not Found'}
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
