import { loadTest, LoadTestOptions, LoadTestResult, Operation } from 'loadtest';
import { from, Subscription } from 'rxjs';
import * as loadtest from 'loadtest';

const options: LoadTestOptions = {
  url: 'http://localhost:4444/api/v1/transaction/',
  maxRequests: 20,
  body: {
    'payload': 'test-payload', 'sender': 'John', 'recipient': 'Jane'
  },
  method: 'POST',
  contentType: 'application/json',
  concurrency: 10,
  requestsPerSecond: 2,
  statusCallback(error: Error, result: any, latency: loadtest.LoadTestResult) {
    // console.log('Current latency %j\\r, result %j\\r, error %j}\\r', latency, result, error);
    console.log('----');
    console.log('Request elapsed milliseconds: ', result.requestElapsed);
    console.log('Request index: ', result.requestIndex);
    console.log('Request loadtest() instance index: ', result.instanceIndex);
  }
};

const loadTestOperation: Operation = loadTest(options,(error: Error, result: LoadTestResult) => {
  if (!error) {
    // const array = [loadTestOperation, result];
    // const subscription: Subscription = from(array).subscribe(x => console.log(x));
    //
    // console.info(subscription);
  } else {
    return console.error('Got an error: %s', error);
  }
});
