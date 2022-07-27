import { loadTest, LoadTestOptions, LoadTestResult, Operation } from 'loadtest';
import { from, Observable, Subscription } from 'rxjs';
import { drop, lensProp, splitEvery, view } from 'ramda';

(() => {
  const allArgs: Array<string> = process.argv;
  const dropedArgs: Array<string> =  drop(2, allArgs);
  const args: Array<Array<string>> = splitEvery<string>(2, dropedArgs);
  // @ts-ignore
  const nestedArgsObj = Object.fromEntries(args);
  const concurrency: number = view(lensProp<any, '--concurrency'>('--concurrency'), nestedArgsObj);
  const maxRequests: number = view(lensProp<any, '--maxRequests'>('--maxRequests'), nestedArgsObj);
  const requestsPerSecond: number = view(lensProp<any, '--requestsPerSecond'>('--requestsPerSecond'), nestedArgsObj);
  const options: LoadTestOptions = {
    url: 'http://localhost:4444/api/v1/transaction/',
    maxRequests: maxRequests || 1000,
    concurrency: concurrency || 100,
    requestsPerSecond: requestsPerSecond || 10,
    body: {
      'payload': 'test-payload', 'sender': 'John', 'recipient': 'Jane'
    },
    method: 'POST',
    contentType: 'application/json',
    statusCallback(error: Error, result: any, latency: LoadTestResult) {
      console.log('Current latency %j\\r, result %j\\r, error %j}\\r', latency, result, error);
      console.log('----');
      console.log('Request elapsed milliseconds: ', result.requestElapsed);
      console.log('Request index: ', result.requestIndex);
      console.log('Request loadtest() instance index: ', result.instanceIndex);
    }
  };

  const loadTestOperation: Operation = loadTest(options,(error: Error, result: LoadTestResult) => {
    const array = [loadTestOperation, result];
    const fromArray$: Observable<Operation | LoadTestResult> = from(array);

    if (!error) {
      const subscription: Subscription = fromArray$.subscribe((res: Operation | LoadTestResult) => console.log(res));

      subscription.unsubscribe();
    } else {
      return console.error('Got an error: %s', error);
    }
  });
})();
