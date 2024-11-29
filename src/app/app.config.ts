import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HttpClientModule, HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';

import { AppService } from './app.service';
import { AppState } from './shared/app.state';
import { AppConfiguration } from './app-configuration';
import { HIGHLIGHT_OPTIONS, HighlightOptions } from 'ngx-highlightjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthInterceptor } from './auth-interceptor';



export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), provideAnimations(),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })),
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: true,
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('ngx-highlightjs/line-numbers'),
        // themePath: 'highlight.js/styles/atom-one-light.css',
        languages: {
          typescript: () => import('highlight.js/lib/languages/typescript'),
          css: () => import('highlight.js/lib/languages/css'),
          xml: () => import('highlight.js/lib/languages/xml'),
        },
      },
    },

    provideHttpClient(withInterceptorsFromDi()),
    AppState,
    AuthGuard,
    AuthService,
    AppConfiguration,
    HttpClient, AppService,
    { provide: APP_INITIALIZER, useFactory: (config: AppConfiguration) => () => config.load(), deps: [AppConfiguration], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(MatSnackBarModule),
  ]
};
