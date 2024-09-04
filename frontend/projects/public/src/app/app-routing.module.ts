import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {PswdresetComponent} from "./pswdreset/pswdreset.component";
import {HomelayoutComponent} from "./homelayout/homelayout.component";
import {NotFoundComponent} from "shared";
import {UserdetailsComponent} from "./userdetails/userdetails.component";

const routes: Routes = [
  {
    path: '',
    title: 'एकीकृत किसान पोर्टल',
    component: HomelayoutComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'एकीकृत किसान पोर्टल | लॉगिन'
  },
  {
    path: 'reset',
    component: PswdresetComponent,
    title: 'एकीकृत किसान पोर्टल | पासवर्ड रिसेट'
  },
  {
    path: 'userDetails',
    component: UserdetailsComponent,
    title: 'एकीकृत किसान पोर्टल | यूजर डिटेल्स'
  },
  {path: '**', component: NotFoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
