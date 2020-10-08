export class Todo {
  public id: string;
  public title: string;
  public done: boolean;

  constructor() {
    console.log(this.constructor.name);
  }
}
