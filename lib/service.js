var ts = require('typescript');
var process = require('process');
var IncrementalChecker = require('./IncrementalChecker');
var CancellationToken = require('./CancellationToken');

var checker = new IncrementalChecker(
  process.env.TSCONFIG,
  process.env.TSLINT,
  process.env.WATCH === '' ? [] : process.env.WATCH.split('|'),
  parseInt(process.env.WORK_NUMBER, 10),
  parseInt(process.env.WORK_DIVISION, 10)
);

var diagnostics = [];
var lints = [];

function run (cancellationToken) {
  checker.nextIteration();

  try {
    diagnostics = checker.getDiagnostics(cancellationToken);
    lints = checker.getLints(cancellationToken);
  } catch (error) {
    if (error instanceof ts.OperationCanceledException) {
      return;
    }

    throw error;
  }

  if (!cancellationToken.isCancellationRequested()) {
    process.send({
      diagnostics: diagnostics,
      lints: lints
    });
  }
}

process.on('message', function (message) {
  run(CancellationToken.createFromJSON(message));
});