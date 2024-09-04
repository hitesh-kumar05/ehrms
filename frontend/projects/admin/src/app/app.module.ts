import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {AuthInterceptor, AuthService, LoaderService, SharedModule} from "shared";
import {MenumasterComponent} from "./menumaster/menumaster.component";
import {PasswordResetComponent} from "./password-reset/password-reset.component";
import {MenuupdateformComponent} from "./menumaster/menuupdateform/menuupdateform.component";
import {SlowquerylistComponent} from "./slowquerylist/slowquerylist.component";
import {QuerylivecheckComponent} from "./slowquerylist/querylivecheck/querylivecheck.component";
import {ShowprocesslistComponent} from "./showprocesslist/showprocesslist.component";
import {ErrorloglistComponent} from "./errorloglist/errorloglist.component";
import {SessionlistComponent} from "./sessionlist/sessionlist.component";
import {ApplicationsizeComponent} from "./showprocesslist/applicationsize/applicationsize.component";
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {MAT_DATE_LOCALE} from "@angular/material/core";
import {LayoutComponent} from "../../../shared/layout/layout.component";
import { ServerqueryComponent } from './serverquery/serverquery.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    MenumasterComponent,
    PasswordResetComponent,
    MenuupdateformComponent,
    SlowquerylistComponent,
    QuerylivecheckComponent,
    ShowprocesslistComponent,
    ErrorloglistComponent,
    SessionlistComponent,
    ApplicationsizeComponent,
    ServerqueryComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [
    provideAnimationsAsync(),
    AuthService,
    LoaderService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {provide: MAT_DATE_LOCALE, useValue: "en-GB"}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
