import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';

// Tell Ionic components how to render on the server
import { IonicServerModule } from '@ionic/angular-server';
import { DigitalEditionsApp } from './app.component';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    IonicServerModule,
  ],
  bootstrap: [DigitalEditionsApp],
})
export class AppServerModule {}
