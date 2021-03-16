var strips = require('strips');
// var actionNode = require('actionNode.js');
// var fluentNode = require('fluentNode.js');

// Load domain and problem
function loadFiles(domainFile, problemFile){
    strips.load(domainFile, problemFile, function(domain, problem) { 
        processDomain(domain);
        console.log('----------------------');
        processProblem(problem);
        console.log('----------------------');
        var fluent = { 
            type: 'fluent',
            object: { operation: 'not', action: 'handempty', parameters: [] },
            value: Infinity,
            index: 3 
        };
        
       // solveStuff(domain, problem);
        console.log('----------------------');
        initialState = problem.states[0];
        var child = StripsManager.getChildStates(domain, initialState);
        child = child[1].state
        console.log('Inital State');
        console.log(initialState.actions);
        var graph = makeGraph(domain, problem, child);
       // main(state, domain, problem);
       //updateValue(graph,fluent);
        autoUpdate(graph);
       
        
    });
}

function processDomain(domain) {
    // for (action in domain.actions){
    //     console.log(domain.actions[action].effect);
    // }
    
    // console.log('-----------------');
    console.log(domain);
}

// Func to process parsed problem (JSON object)
function processProblem(problem) {
    console.log(problem);

}

function solveStuff(domain, problem){
    var solutions = strips.solve(domain, problem);
    var solution = solutions[0];
    console.log(solution);  
}

function getAllFluents(domain){
    var fluents = [];
    for (action in domain.actions){
        currentAction = domain.actions[action];
        for (var eff in currentAction.effect){
            currentEffect = currentAction.effect[eff];
            if (!(isFluentInState(currentEffect, fluents))){
                fluents.push(currentEffect);
            }
        }
        for (var pre in currentAction.precondition){
            currentPre = currentAction.precondition[pre];
            if (!(isFluentInState(currentPre, fluents))){
                fluents.push(currentPre);
            }
        }
    }
    return fluents;
}

function getAllActions(domain){
    var actions = [];
    for (action in domain.actions){
        actions.push(domain.actions[action]);
    }
    return actions;
}

function isFluentInState(fluent, state){
    for (stateFluent in state.actions){
        if(JSON.stringify(state.actions[stateFluent]) === JSON.stringify(fluent)){
            return true;
        }
    }
    return false;
}

function makeFluentNodes(fluents, state){
    fluentNodeList = [];
    var newNode;
    var index = 0
    for (fluent in fluents){
        currentFluent = fluents[fluent];
        if (isFluentInState(currentFluent, state)){
            newNode = {'type':'fluent', 'object':currentFluent, 'value':0, 'index':index};
        }
        else{
            newNode = {'type':'fluent', 'object':currentFluent, 'value': Number.POSITIVE_INFINITY, 'index':index};
        }
        fluentNodeList.push(newNode);
        index = index + 1
    }
    return fluentNodeList;
}

function makeActionNodes(actions, graph){
    actionList = [];
    index = graph.length;
    for (action in actions){
        currentAction = actions[action];
        newNode = {'type':'action','object': currentAction.action, 'value':1, 'preconditions': currentAction.precondition , 'effect': currentAction.effect, 'index': index };
        graph.push(newNode);
        index = index + 1;
    }
    return graph;
}
function areFluentsEqual(fluent1, fluent2){
    if(JSON.stringify(fluent1) == JSON.stringify(fluent2)){
        return true;
    }
    return false;
}
function makeFluentsLowerCase(fluents){
    for (fluent in fluents){
        newFluent = JSON.stringify(fluents[fluent]);
        newFluent = newFluent.toLowerCase();
        newFluent = JSON.parse(newFluent);
        fluents[fluent] = newFluent;
    }
    return fluents;
}
function makeGoalNode(problem, graph){
    goalState = makeFluentsLowerCase(problem.states[1].actions);
    newNode = {'action' : 'goal' , 'value':1, 'preconditions': goalState}
    graph.push(newNode);
    return graph;
    
}


function makeGraph(domain, problem, state){
    state = makeFluentsLowerCase(state);
    var graph = [];
    var fluents = getAllFluents(domain);
    var actions = getAllActions(domain);
    graph = makeFluentNodes(fluents, state);
    graph = makeActionNodes(actions,graph);
    graph = makeGoalNode(problem, graph);
    // for (node in graph){
    //     console.log(graph[node]);
    // }
    return graph;
}

function getFluentValue(node, graph){
    var adders = getAdders(node, graph);
    var lowestSum =  Number.POSITIVE_INFINITY;
    var currentSum = 0;
    for (adder in adders){
        currentAdder = adders[adder];
        currentSum = getSumOfPreconditions(adder, graph);
        if (lowestSum < currentSum){
            lowestSum = currentSum;
        }
    }
    return lowestSum;
}



function getSumOfPreconditions(actionNode, graph){
    var sum = 0;
    for(node in graph){
        currentNode = graph[node];
        if (currentNode.type = 'fluent'){
            if(isFluentInState(currentNode.object, actionNode.preconditions)){
                sum = sum + currentNode.value;
            }
        }
    }
    return sum;
}

function getAdders(fluentNode, graph){
    adders = [];
    for (node in graph){
        currentNode = graph[node];
        if (currentNode.type == 'action'){
            if(isFluentInState(fluentNode, currentNode.effect)){
                adders.push(currentNode);
            }
        } 
    }
    return adders;
}

function updateValue(graph, currentNode){
    var update = false;
    if (currentNode.type = 'fluent'){
        updateVal = getFluentValue(currentNode, graph);
    }
    else{
        updateVal= getSumOfPreconditions(currentNode, graph);
    }
    if (updateVal < currentNode.value){
        currentNode.value = updateVal
        update = true;
    }
    graph[currentNode.index] = currentNode;
    if(update){
        console.log('New value --------------');
        console.log(currentNode);
    }
    else{
        console.log('no update');
    }

    return [graph, update];
}

// function manualUpdate(graph){

// }

function autoUpdate(graph) {
    var update = true;
    var updateData;
    while (update){
        for(node in graph){
            currentNode = graph[node];
            updateData = updateValue(graph, currentNode);
            graph = updateData[0];
            update = updateData[1];
        }

    }
    goalIndex = graph.length - 1;
    console.log(graph[goalIndex].value)
    return graph[goalIndex].value;
}





loadFiles('domain.txt', 'problem.txt');