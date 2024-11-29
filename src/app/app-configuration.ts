import { EventEmitter, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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

    public load(): Promise<any> {
        // console.log('loading config ...');
        const promise = this.http.get('assets/config.json')
            .toPromise()
            .then(cfg => {
                this.config = cfg as Configuration;
            });
        return promise;
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
