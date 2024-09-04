import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {LayoutComponent} from "../../../shared/layout/layout.component";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {AuthInterceptor, AuthService, LoaderService, SharedModule} from "shared";
import {HTTP_INTERCEPTORS, provideHttpClient} from "@angular/common/http";
import {MAT_DATE_LOCALE} from "@angular/material/core";


@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
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
export class AppModule { }
