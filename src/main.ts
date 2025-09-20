import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(CommonModule, HttpClientModule),
    { provide: LOCALE_ID, useValue: 'es' },
    provideAnimations()
  ]
}).catch(err => console.error(err));
