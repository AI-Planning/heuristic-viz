// Require lib
var strips = require('strips');

// Load domain and problem
strips.load('domain.txt', 'problem.txt', function(domain, problem) {
    processDomain(domain);
    processProblem(problem);
});

// Func to process parsed domain (JSON object)
function processDomain(domain) {
    console.log(domain);
}

// Func to process parsed problem (JSON object)
function processProblem(problem) {
    console.log(problem);
}