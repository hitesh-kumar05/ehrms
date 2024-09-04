import {Injectable} from '@angular/core';
import {catchError, firstValueFrom, map, Observable, throwError} from "rxjs";
import {HttpClient, HttpHeaders, HttpResponse} from "@angular/common/http";
import {environment} from "../../environments/environment.dev";
import {CookieService} from "ngx-cookie-service";

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  public httpOptions: any = {
    headers: new HttpHeaders({'Content-Type': 'application/json'}),
    observe: 'response',
    withCredentials: true
  };
  public getOptions: any = {
    observe: 'response',
    withCredentials: true
  };
  public currentDate: any;

  public getUrl(type: string): string {
    switch (type) {
      case 'common':
        return environment.commonApiUrl
      case 'fetch':
        return environment.fetchApiUrl
      case 'other' :
        return environment.otherApiUrl
      case 'dept' :
        return environment.deptApiUrl
      default:
        return environment.commonApiUrl
    }
  }

  constructor(private http: HttpClient, private cookie: CookieService) {
    const currentDate = new Date();
    const day: string = currentDate.getDate().toString().padStart(2, '0');
    const month: string = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year: string = currentDate.getFullYear().toString().slice(-4);
    this.currentDate = `${day}-${month}-${year}`;
  }

  getData(url: string, type: string = 'society'): Observable<any> {
    return this.http.get(this.getUrl(type) + url, this.getOptions).pipe(
      map(res => {
        return res;
      }), catchError(e => {
        console.log(e)
        if (e && (e == 'Unauthorized')) {
          this.cookie.deleteAll('/');
          window.open(environment.login, '_self')
        }
        if (e && e == "Unknown Error") {
          console.warn('Server not connected or crashed')
        }
        throw new Error(e);
      })
    );
  }

  postData(url: string, data: any, type: string = 'society'): Observable<any> {
    return this.http.post(this.getUrl(type) + url, data, this.httpOptions).pipe(
      map(res => {
        return res;
      }), catchError(e => {
        throw new Error(e);
      })
    );
  }

  postForm(url: string, data: any, type: string = 'society'): Observable<any> {
    return this.http.post(this.getUrl(type) + url, data, {observe: 'response', withCredentials: true}).pipe(
      map(res => {
        return res;
      }), catchError(e => {
        throw new Error(e);
      })
    );
  }

  postFile(url: string, data: any, type: string = 'society'): Observable<any> {
    return this.http.post(this.getUrl(type) + url, data, {
      reportProgress: true,
      observe: "events",
      withCredentials: true
    }).pipe(
      map((res: any) => {

        return res;
      }), catchError(e => {
        throw new Error(e);
      })
    );
  }

  putData(url: string, data: any, type: string = 'society'): Observable<any> {
    return this.http.put(this.getUrl(type) + url, data, this.httpOptions).pipe(
      map(res => {
        return res;
      }), catchError(e => {
        throw new Error(e);
      })
    );
  }

  deleteData(url: string, type: string = 'society'): Observable<any> {
    return this.http.delete(this.getUrl(type) + url, this.httpOptions,).pipe(
      map(res => {
        return res;
      }), catchError(e => {
        throw new Error(e);
      })
    );
  }

  getParam(url: string, params: any, type: string = 'society'): Observable<any> {
    return this.http.get(this.getUrl(type) + url, {
      params: params,
      observe: 'response',
      withCredentials: true
    }).pipe(
      map((res: any) => {
        return res;
      }), catchError((e: any) => {
        return throwError(e);
      })
    );
  }

  async get(url: string, type: string = 'society'): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.get(this.getUrl(type) + url, this.getOptions)
      );
    } catch (error: any) {
      throw error;
    }
  }

  postBlob(url: string, data: any, filename: string | null = null, type: string = 'common'): Observable<any> {
    console.log('blob called')
    return this.http.post(this.getUrl(type) + url, data, {
      reportProgress: true,
      responseType: 'blob',
      observe: 'response',
      withCredentials: true
    }).pipe(
      map((res: HttpResponse<any>) => {
        this.handlePdfResponse(res, filename)
        return res
      }), catchError(e => {
        throw new Error(e);
      })
    );
  }

  private handlePdfResponse(response: any, name: string | null) {
    let file_name: string = 'response.pdf';
    if (name) {
      file_name = name
    } else {
      const contentDispositionHeader = response.headers.get('Content-Disposition');
      if (contentDispositionHeader) {
        const matches = contentDispositionHeader.match(/filename="([^"]+)"/);
        if (matches && matches[1]) {
          file_name = matches[1];
        }
      }
    }
    const file_name_with_date = this.appendDateToFilename(file_name, this.currentDate);
    console.log(file_name_with_date)
    const blob = new Blob([response.body], {type: 'application/pdf'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file_name_with_date;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private appendDateToFilename(filename: string, date: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension found
      return `${filename}_${date}`;
    }
    const name = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);
    return `${name}_${date}${extension}`;
  }
}
