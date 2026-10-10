const { writeFileSync } = require('node:fs');
module.exports = class {
  onTestBegin() {
    // Exercise Playwright's SIGINT handler portably. Windows process.kill with
    // SIGINT terminates the child without invoking its graceful signal handler.
    if (process.env.HARNESS_RUN_FIXTURE === 'interruption') {
      setTimeout(() => process.emit('SIGINT'), 100);
    }
  }
  onEnd(result) {
    writeFileSync(process.env.HARNESS_RUN_INFO, JSON.stringify(result));
  }
};
