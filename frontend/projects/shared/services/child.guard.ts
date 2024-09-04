import {Injectable} from '@angular/core';
import {
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  NavigationEnd,
  CanActivate
} from '@angular/router';
import {filter, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChildGuard implements CanActivate {


  constructor(private router: Router) {
  }

  canActivate(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
    const session: any = sessionStorage.getItem('menu')
    const host = window.location.hostname
    if (state.url == '/' || state.url.includes('404')) {
      return true
    } else {
      if (session && session.includes(state.url.slice(1))) {
        return true;
      } else if ((childRoute.queryParams.hasOwnProperty('admin') && childRoute.queryParams['admin'] === '2024') || host.includes('10.132') ){
        return true;
      } else {
        this.router.navigate(['404'])
        return false;
      }
    }
  }
}
