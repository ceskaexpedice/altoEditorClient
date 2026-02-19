import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfiguration } from './app-configuration';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(
    private http: HttpClient,
    private translateService: TranslateService,
    private snackBar: MatSnackBar,
    private config: AppConfiguration
  ) {

     }

  showSnackBar(s: string, error: boolean = false) {
    const clazz = error ? 'app-snack-error' : 'app-snack-success';
    this.snackBar.open(this.translateService.instant(s), '', {
      duration: 3000,
      verticalPosition: 'top',
      panelClass: clazz
    });
  }
  
  private get<T>(url: string, params: HttpParams = new HttpParams(), responseType?: any): Observable<T> {
    // const r = re ? re : 'json';
    const options = { params, responseType, withCredentials: true };
    // return this.http.get<T>(`${this.config.clientBaseUrl}${url}`, options);
    return this.http.get<T>(`api${url}`, options);

  }

  private post(url: string, obj: any) {
    return this.http.post<any>(`api${url}`, obj);
  }

  private delete(url: string, params = {}): Observable<Object> {
    return this.http.delete(encodeURI(`api${url}`), { params: params });
  }

  getUsers(): Observable<string> {
    return this.get(`/db/users`);
  }

  getDigitalObjectVersion(pid: string, version: string, login: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid)
    .set('versionXml', version)
    .set('login', login);
    return this.get(`/db/object`, params);
  }

  getDigitalObject(pid: string, login: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid)
    .set('login', login);
    return this.get(`/db/object`, params);
  }

  getDigitalObjects(login: string, instance: string, orderBy: string = 'datum', orderSort: string = 'asc'): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('orderBy', orderBy)
    .set('orderSort', orderSort)
    .set('instance', instance)
    .set('login', login);
    return this.get(`/db/object`, params);
  }

  getAllDigitalObjects(params: HttpParams): Observable<string> {
    return this.get(`/db/objects`, params);
    
  }

  getVersions(pid: string, login: string, instance: string, filterField?: string, filterValue?: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid);
    return this.get(`/db/objects`, params);
    
  }
  
  getImge(pid: string, login: string, instance: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid)
    .set('instance', instance);
    return this.get(`/object/image`, params, 'blob');
    
  }

  getAlto(pid: string, login: string, instance: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid)
    .set('instance', instance);
    return this.get(`/object/alto`, params);
    
  }

  getAltoOriginal(pid: string, login: string, instance: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid)
    .set('instance', instance);
    return this.get(`/object/altoOriginal`, params);
    
  }

  getAltoVersion(pid: string, versionXml: string, login: string, instance: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('pid', pid)
    .set('versionXml', versionXml)
    .set('instance', instance);
    return this.get(`/object/alto`, params);
    
  }

  getBatches(params: HttpParams): Observable<string> {
    return this.get(`/db/batches`, params);  
  }

  deleteBatches(params: any): Observable<any> {
    return this.delete('db/batches', params);
  }

  saveAlto(data: any) {
    const url = `/object/alto`;
    return this.post(url, data);
  }

  generatePERO(data: any) {
    // {"pid":"{{uuidStrana}}","priority":"LOW", "instance":"k7"}
    const url = `/object/pero`;
    return this.post(url, data);
  }

  markAsMajorVersion(data: any) {
    // {"id":{{digitalObjectId}},"login":"inovatika"}
    const url = `/object/stateAccepted`;
    return this.post(url, data);
  }

  markForDeletion(data: any) {
    // {"id":{{digitalObjectId}},"login":"inovatika"}
    const url = `/object/stateRejected`;
    return this.post(url, data);
  }

  uploadKramerius(data: any) {
    // {"id":{{digitalObjectId}},"login":"inovatika"}
    const url = `/object/uploadKramerius`;
    return this.post(url, data);
  }


}
