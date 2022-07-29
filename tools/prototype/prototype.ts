import { Observable, Observer, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';

const obs$ = new Observable((observer: Observer<number>) => {
  setTimeout(() => {
    observer.next(Math.random());
  }, 2000);
}).pipe(delay(3000));

obs$.subscribe((res: number) => {console.dir(res)});
obs$.subscribe((res: number) => {console.dir(res)});

const sub = new Subject();

sub.next(1);
sub.subscribe(x => console.log('Subscriber A', x));
sub.next(2); // OUTPUT => Subscriber A 2
sub.subscribe(x => console.log('Subscriber B', x));
sub.next(3);
