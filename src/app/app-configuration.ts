import { EventEmitter, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Configuration } from './shared/config';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
}) export class AppConfiguration {

    public config: Configuration;
    public get login() {
        return this.config.login;
    }
    public get instance() {
        return this.config.instance;
    }

    public get defaultLang() {
        return this.config.defaultLang;
    }

    constructor(
        private http: HttpClient) { }

    public configLoaded() {
        return this.config && true;
    }

    // public load(): Promise<any> {
    //     // console.log('loading config ...');
    //     const promise = this.http.get('assets/config.json')
    //         .toPromise()
    //         .then(cfg => {
    //             this.config = cfg as Configuration;
    //         });
    //     return promise;
    // }

    public load() {
        return this.http.get('assets/config.json').pipe(
            switchMap((cfg: any) => {
                this.config = cfg as Configuration;
                return this.http.get('shared/config.json').pipe(tap((res: any) => {
                    // Merge config
                    console.log('Merge custom configuration');
                    const keys = Object.keys(res as Configuration);
                    keys.forEach(k => {
                        this.config[k as keyof Configuration] = res[k];
                    });
                }),
                catchError((err: any) => {
                    console.log('Without custom changes');
                    return of(err);
                }))
            }),
            catchError((err) => {
                // this.alertSubject.next(err);
                return of(err);
            })
        );
    }

    
    public get deployPath() {
        return this.config.deployPath;
    }

    public get authBaseUrl() {
        return this.config.authBaseUrl;
    }

    public get keycloak() {
        return this.config.keycloak;
    }


    interceptresponse: EventEmitter<any> = new EventEmitter<any>();

}
