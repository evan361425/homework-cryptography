class myReporter {
  static jasmineStarted(suiteInfo) {
    // ...
  }

  static suiteStarted(result) {
    console.log(`${result.description}\n${'='.repeat(16)}`);
  }

  static specStarted(result) {
    // ...
  }

  static specDone(result) {
    if (result.status === 'failed') {
      console.log(result.description);
    }
  }

  static suiteDone(result) {
    console.log(`\n${'-'.repeat(16)}\n`);
  }

  static jasmineDone(result) {
    // ...
  }
}

jasmine.getEnv().addReporter(myReporter);
