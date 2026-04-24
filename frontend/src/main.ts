import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
