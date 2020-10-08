import {Component, OnInit} from '@angular/core';
import {v4 as uuidV4} from 'uuid';
import {DatabaseService} from "../database.service";
import {Todo} from "../todo";

@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.scss']
})
export class TodosComponent implements OnInit {
  public todos: Array<Todo>;

  constructor(protected readonly databaseService: DatabaseService) {
    this.todos = [];
  }

  ngOnInit(): void {
    this.update();
  }

  public async add(value: string): Promise<void> {
    await this.databaseService.todos.add({
      id: uuidV4(),
      title: value,
      done: false
    });

    await this.update();
  }

  public async update(): Promise<void> {
    this.todos = await this.databaseService.todos.toArray();
  }
}
