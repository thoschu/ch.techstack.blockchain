import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Message } from '@ch.techstack.blockchain/api-interfaces';

import { Observable } from "rxjs";

@Component({
  selector: 'blockchain-explorer-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public readonly hello$: Observable<Message>;

  constructor(private readonly http: HttpClient) {
    this.hello$ = this.http.get<Message>('/api/hello');
  }
}
