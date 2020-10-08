import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'blockchain-pwa';
  text = '***';

  public do($event): void {
    console.log($event);
    this.text += '***';
  }
}
