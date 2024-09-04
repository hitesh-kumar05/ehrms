import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {LoginComponent} from './login/login.component';
import {SharedModule} from "shared";
import {MatTooltipModule} from "@angular/material/tooltip";
import {PswdresetComponent} from "./pswdreset/pswdreset.component";
import {HomelayoutComponent} from './homelayout/homelayout.component';
import {NgOptimizedImage} from "@angular/common";
import {HomeshapeComponent} from './homelayout/homeshape/homeshape.component';
import { UserdetailsComponent } from './userdetails/userdetails.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PswdresetComponent,
    HomelayoutComponent,
    HomeshapeComponent,
    UserdetailsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    SharedModule,
    MatTooltipModule,
    NgOptimizedImage
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
