import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {


  constructor(private authService: AuthService) {

  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isLoggedIn() && this.authService.currentUser) {
      const role = this.authService.currentUser.user_type;
      if (route.data?.['role'] && route.data?.['role'].indexOf(role) === -1) {
        this.authService.logout()
        return false;
      }
      return true
    }
    this.authService.logout()
    return false;
  }
}
