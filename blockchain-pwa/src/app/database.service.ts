import {Injectable} from '@angular/core';
import Dexie from 'dexie';
import {Todo} from "./todo";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  public todos: Dexie.Table<Todo, string>;

  constructor() {
    super('blockchain-pwa-db');

    this.version(1).stores({
      todos: 'id, title, done'
    });
  }
}
