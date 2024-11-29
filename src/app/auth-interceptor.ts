import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpInterceptor, HttpHandler, HttpResponse, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Observable,throwError,of } from 'rxjs';
import { map,catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AppConfiguration } from './app-configuration';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private appSettings: AppConfiguration
    ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.startsWith('assets') || (!request.url.startsWith(this.appSettings.authBaseUrl) && !request.url.startsWith('api'))) {
      return next.handle(request);
    }
    const token = AuthService.token;
    if (token) {
      if (AuthService.tokenDeadline < new Date()) {
        this.appSettings.interceptresponse.emit({
          "type":"token_expired"
        });
      } else {
        request = request.clone({
          setHeaders: {
            'Authorization': 'Bearer ' + token
          }
        });
      }
    }
    return next.handle(request);

  }
}