// Require lib
var strips = require('strips');

// Load domain and problem
function loadFiles(domainFile, problemFile, runManual){
    strips.load(domainFile, problemFile, function(domain, problem) {
        processDomain(domain);
        processProblem(problem);
        initialState = problem.states[0];
        
        if(runManual){
            runSTRIPSHeuristic(initialState, domain, problem);
        }
        else{
            runSTRIPSHeuristicAuto(initialState, domain, problem);
        }
        
    });
}

// Func to process parsed domain (JSON object)
function processDomain(domain) {
    console.log(domain);
}

// Func to process parsed problem (JSON object)
function processProblem(problem) {
    console.log(problem);
}

//counts how many fluents in current state match goal state
function compareFluents(goalState, currentState){
    for (var fluent in goalState){
        if(JSON.stringify(currentState) === JSON.stringify(goalState[fluent])){
            return true;
        }
    }
}

//displays the STRIPS heuristic value for each child node of current state
function displayHValuesSTRIPS(state, domain, problem){
    var childHeuristicValues = [];
    var goalState = problem.states[1].actions;
    var childStates = StripsManager.getChildStates(domain, state);
    var currentChildHeuristicValue = {};

    console.log("");
    console.log("Goal State:");
    console.log(goalState);
    console.log('---------------------')
    console.log("");
    console.log("");
    console.log("Current State");
    console.log(state);
    console.log('---------------------')
    console.log("");
    
    for (var child in childStates){
        var heuristicValue = goalState.length;
        var currentChildStateFluents = childStates[child].state.actions;
        currentChildHeuristicValue = {'action': StripsManager.actionToString(childStates[child].action),  'value': heuristicValue, 'resultState' : currentChildStateFluents};

        for(var fluent in currentChildStateFluents){
            if(compareFluents(goalState, currentChildStateFluents[fluent])){
                heuristicValue = heuristicValue - 1;
            }
        }

        console.log("");
        //console.log('Possible action: ' + currentChildHeuristicValue.action);
        console.log('Possible action:' );
        console.log(childStates[child].action);
        console.log("");
        console.log('Leads to Child State: ');
        console.log(currentChildStateFluents);
        console.log("");
        console.log('Heuristic Value of Action:');
        console.log(heuristicValue);
        console.log('---------------------');
        currentChildHeuristicValue['value'] =  heuristicValue;
        childHeuristicValues.push(currentChildHeuristicValue);
    }
    console.log("");
    console.log('Child Heuristic Values As JSON:');
    console.log(childHeuristicValues);

    return(childHeuristicValues); 
}

//lets user choose which child state they would like to go to 
function chooseNodes(state, domain, problem){
    displayHValuesSTRIPS(state, domain, problem);
    const prompt = require('prompt-sync')();
    const index = prompt('Choose child index ');
    console.log(`You chose ${index}`);
    return index;
}

//chooses child node based on STRIP's solution
function autoChooseNodes(state, domain, problem, solution){
    var childHeuristicValues = displayHValuesSTRIPS(state, domain, problem);
    for (var child in childHeuristicValues){
        if (childHeuristicValues[child].action == solution){
            console.log('---------------------');
            console.log("Computer chooses action: " + solution);
            console.log("");
            console.log("Results in state: "); 
            console.log(childHeuristicValues[child].resultState);

            return child; 
        }
    }
    return -1; 
}

function runSTRIPSHeuristic(state, domain, problem){
    childStates = StripsManager.getChildStates(domain, state);

    while (childStates != []){
        childIndex = chooseNodes(state, domain, problem);
        state = childStates[childIndex].state;
    }
}

//Computer uses strips to generate a solution and selects child nodes based on that solution
//For testing purposes to check if heuristic is working properly
function runSTRIPSHeuristicAuto(state, domain, problem){
    console.log("Computer generating a solution.....")
    console.log("");

    var solutions = strips.solve(domain, problem);
    var solution = solutions[0];
    childStates = StripsManager.getChildStates(domain, state);
    for (var i = 0; i < solution.path.length; i++) {;
        console.log('---------------------')
        console.log('Step ' + i+1 +":");
        console.log("");

        childIndex = autoChooseNodes(state, domain, problem, solution.path[i]);
        state = childStates[childIndex].state;
    }  
}

//choose child nodes autmoatically 
//loadFiles('aircargo/domain.txt', 'aircargo/problem.txt',false );
//choose child nodes manually
loadFiles('aircargo/domain.txt', 'aircargo/problem.txt',true );

