import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {LoaderService} from "./loader.service";
import {catchError, finalize} from 'rxjs/operators';
import Swal from 'sweetalert2';
import {environment} from "../../environments/environment.dev";
import {CookieService} from "ngx-cookie-service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private cookie: CookieService, private loaderService: LoaderService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loaderService.show();
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401) {
          Swal.fire({title: 'कृपया पुनः लॉगिन करें|', icon: 'error'}).then(res => {
            this.cookie.deleteAll('/');
            window.open(environment.login, '_self')
          })
        }
        const error = err.error.message || err.statusText;
        return throwError(error); // Propagate error further
      }),
      finalize(() => {
          this.loaderService.hide()
        }
      ),
    );
  }
}
