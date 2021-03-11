// Require lib
var strips = require('strips');

// Load domain and problem
function loadFiles(domainFile, problemFile){
    strips.load(domainFile, problemFile, function(domain, problem) {
        processDomain(domain);
        processProblem(problem);
        initialState = problem.states[0];
        
        main(initialState, domain, problem);
        
        
    });
}

// Func to process parsed domain (JSON object)
function processDomain(domain) {
    console.log('domain: ');
    console.log(domain);
}

// Func to process parsed problem (JSON object)
function processProblem(problem) {
    console.log('problem: ');
    console.log(problem);
}

function getPreconditions(action){
    console.log('getPreconditions');
    return action.precondition;
}

function getActionIndex(domain, action){
    var i = 0;
    for(var actionItem in domain.actions){
        if(actionItem.action == action){
           return i;
        }
        else{
            i = i + 1;
        }
    }
    return -1;
}

function getActionCost(action){
    //ask musise
}

function getStateValue(state){
    ///state = ???
    return getFluentSetValue(fluentSet, state);
}

function getFluentSetValue(fluentSet, state){
    var value = 0;
    for (fluent in fluentSet){
        currentValue = getFluentValue(fluent, state);
        value = value + currentValue;
    }
    return value;
}

function getFluentValue(fluent, state){
    console.log('getFluentValue');
    if (isFluentInState(fluent,state)){
        return 0;
    }
    else {
        adders = getAddersofFluent(state, fluent);
        var minAdder = adders[0];
        var currentAdder;
        for (adder in adders){
            currentAdder = getAddersValue(adder,state);
            if (minAdder > currentAdder){
                minAdder = currentAdder;
            }
        } 
        return minAdder;
    }
}

function isFluentInState(fluent, state){
    for (stateFluent in state.actions){
        if(JSON.stringify(stateFluent) === JSON.stringify(fluent)){
            return true;
        }
    }
    return false;
}

function getAddersofFluent(state, fluent){
    console.log('getAddersofFluent')
    var adders = [];
    var childStates = StripsManager.getChildStates(domain, state);
    for (var child in childStates){
        action = childStates[child].action;
        if (isFluentInState(fluent, childStates[child].state)){
            adders.push(action)
        }
    }
    return adders;
}

function getAddersValue(adder,state){
    console.log('get adder values');
    preconditions = getPreconditions(domain, adder.action);
    var fluentSetValue = getFluentSetValue(preconditions, state);
    return 1 + fluentSetValue;
}

function getCostOfAdder(adder){
    //idk
}


function getAddedFluents(action, state,domain){
    console.log('get added fluents');
    console.log(action);
    var childStates = StripsManager.getChildStates(domain, state);
    var adders = []
    for (var child in childStates){
        if(JSON.stringify(childStates[child].action) === JSON.stringify(action)){
            for (fluent in state.actions){
                if (isFluentInState(state.actions[fluent], childStates[child].state.actions) == false){
                    adders.push(state.actions[fluent]);
                }
            }
        }
    }
    return adders;
}


function getHeursticValuesAdd(state, domain, problem){
    console.log('gettingHvaluees');
    var allFluents = {};
    var prevFluentValues = {};
    for (fluent in state.actions){
        allFluents.fluent = 0;
    }
    var actions = StripsManager.applicableActions(domain,state);
    console.log(state);
    console.log(actions);
    while (prevFluentValues != allFluents){
       
        for (action in actions){
           // console.log('in da boof');
            var addedFluents = getAddedFluents(actions[action],state, domain);
            //console.log(addedFluents);
            for(var fluent in addedFluents){
                fluentValue = getFluentValue(addedFluents[fluent], state);
                addersValue = getAddersValue(actions[action], state);
    
                if(addersValue < fluentValue){
                    allFluents.addedFluents[fluent] = addersValue;
                }
            }
        }
        
    }
}

function getStateHeursticValues(state, domain, problem){
    console.log('getStateHeursticValues');
    var childHeuristicValues = [];
    var childStates = StripsManager.getChildStates(domain, state);
  
    for (var child in childStates){
        console.log(child);
        var currentChildStateFluents = childStates[child].state.actions;
       
        heuristicValue = getHeursticValuesAdd(childStates[child].state, domain, problem);
        currentChildHeuristicValue = {'action': StripsManager.actionToString(childStates[child].action),  'value': heuristicValue, 'resultState' : currentChildStateFluents};
        childHeuristicValues.push(heuristicValue);
    }
    console.log("");
    console.log('Child Heuristic Values As JSON:');
    console.log(childHeuristicValues);
    return childHeuristicValues;
}


function chooseNodes(state, domain, problem){
    getStateHeursticValues(state, domain, problem);
    const prompt = require('prompt-sync')();
    const index = prompt('Choose child index ');
    console.log(`You chose ${index}`);
    return index;
}

function main(state, domain, problem){
    console.log('bro');
  
    childStates = StripsManager.getChildStates(domain, state);
    
    while (childStates != []){
        childIndex = chooseNodes(state, domain, problem);
        state = childStates[childIndex].state;
    }
}


loadFiles('aircargo/domain.txt', 'aircargo/problem.txt');