import {Injectable} from '@angular/core';
import CryptoJS from 'crypto-js';
import {CookieService} from 'ngx-cookie-service';
import {environment} from "../../environments/environment.dev";
import {Observable, take} from "rxjs";
import {HttpService} from "./http.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private cookie: CookieService, private http: HttpService) {
  }

  logout() {
    this.http.getData('/security/logout', 'common').subscribe(() => {
      this.cookie.deleteAll('/');
      window.open(environment.login, '_self')
    })
  }

  isLoggedIn(): boolean {
    const cookie = this.cookie.get('session')
    return !!cookie;
  }

  decryptCookie(cookie: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(cookie, 'UFP_secret_key');
      if (bytes.toString()) return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (e) {
      // console.log(e);
    }
  }

  get currentUser() {
    const user_cookie = this.cookie.get('user')
    const cookie = this.cookie.get('session')
    if (user_cookie && cookie) {
      return this.decryptCookie(user_cookie);
    } else {
      this.logout();
    }
  }

  resetPassword(credentials: any): Observable<any> {
    return this.http.postData('/security/login/changePassword', credentials, 'common')
  }

  refreshCookie(): void {
    this.http.getData('/security/refreshSession', 'common').pipe(take(1)).subscribe()
  }

}
