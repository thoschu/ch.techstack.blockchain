import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {LayoutModule} from '@angular/cdk/layout';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {ServiceWorkerModule, SwUpdate} from '@angular/service-worker';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {TodosComponent} from './todos/todos.component';
import {AboutComponent} from './about/about.component';
import {NavComponent} from './nav/nav.component';
import {environment} from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    TodosComponent,
    AboutComponent,
    NavComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(protected swUpdate: SwUpdate) {
    // console.log(swUpdate);

    this.swUpdate.available.subscribe(value => {
      let txt;
      if (confirm("Press a button!") === true) {
        txt = "You pressed OK!";
        window.location.reload();
      } else {
        txt = "You pressed Cancel!";
      }

      console.log(txt);
    });

    this.swUpdate.activated.subscribe(value => {
      alert('###');
    });
  }
}
