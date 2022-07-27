import { interval } from 'rxjs';
import { buffer, map } from 'rxjs/operators';

const myInterval = interval(100);

const myBufferedInterval = myInterval.pipe(
  map((val: number) =>  val),
  buffer(interval(3000))
);

const subscribe = myBufferedInterval.subscribe(val =>
  console.log( val)
);
