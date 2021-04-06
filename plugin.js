// Global variables
var tree, svg, diagonal, stateCounter, i, duration, treeData,treeHeight,goTree = true,
root, goalState, tooltip, treemap, d3, zoom, viewerWidth, viewerHeight,svgCount=1, svgID;


// Global Variables
var stateCounter, goal, graph, DOMAIN, PROBLEM;

// Called when you click 'Go' on the file chooser
function loadStatespace() {
    // Temp vars
    var domain = "(define (domain blocksworld)" +
        "  (:requirements :strips :typing)" +
        "  (:types block table)" +
        "  (:action move" +
        "     :parameters (?b - block ?t1 - table ?t2 - table)" +
        "     :precondition (and (block ?b) (table ?t1) (table ?t2) (on ?b ?t1) not (on ?b ?t2) (clear ?b))" +
        "     :effect (and (on ?b ?t2)) (not (on ?b ?t1))))" +
        "  (:action stack" +
        "     :parameters (?a - block ?b - block ?t1 - table)" +
        "     :precondition (and (block ?a) (block ?b) (table ?t1) (clear ?a) (clear ?b) (on ?a ?t1) (on ?b ?t1))" +
        "     :effect (and (on ?a ?b) not (on ?a ?t1) not (clear ?b))" +
        "     )" +
        "  (:action unstack" +
        "     :parameters (?a - block ?b - block ?t1 - table)" +
        "     :precondition (and (block ?a) (block ?b) (table ?t1) (on ?b ?t1) (clear ?a) (on ?a ?b))" +
        "     :effect (and (on ?a ?t1) not (on ?a ?b) (clear ?b))" +
        "     )" +
        ")";

    var problem = "(define (problem stack-blocks-a-b-from-tablex-to-ab-tabley)" +
        "  (:domain blocksworld)" +
        "  (:objects" +
        "    a b - block" +
        "    x y - table)" +
        "  (:init (and (block a) (block b) (table x) (table y)" +
        "         (on a x) (on b x) (clear a) (clear b)))" +
        "  (:goal (and (on a b) (on b y) (clear a) not (clear b)))" +
        ")";

    // Getting string versions of the selected files
    var domText = window.ace.edit($('#domainSelection').find(':selected').val()).getSession().getValue();
    var probText = window.ace.edit($('#problemSelection').find(':selected').val()).getSession().getValue();

    // Lowering the choose file modal menu
    $('#chooseFilesModal').modal('toggle');
    $('#plannerURLInput').show();

    // This parses the problem and domain text, froreturns from a callback
    StripsManager.loadFromString(domain, problem, function(d, p) {
        // Allocating global variables
        DOMAIN = d;
        PROBLEM = p;
        treeData = {"name":"root", "children":[], "state":p.states[0], "loadedChildren":false};
        stateCounter = 1;
        goal = p.states[1];
        launchViz();
    });
}

function launchViz(){
    window.new_tab('Viz2.0', function(editor_name){
      $('#' +editor_name).html('<div style = "margin:13px 26px;text-align:center"><h2>Viz</h2>' +
      '<button onclick="makeTree()" style="float:right;margin-left:16px;margin-right:30px">Make Tree</button>' +
      '<button onclick="zoomIn()" style="float:right;margin-left:16px" id ="ZoomIn">ZoomIn</button>' +
      '<button onclick="zoomOut()" style="float:right;margin-left:16px" id ="ZoomOut">ZoomOut</button>' +
      '<div id="statespace"></div>' +
      '<node circle style ="fill:black;stroke:black;stroke-width:3px;></node circle>' +
      '<p id="hv-output"></p>');
    });
}


// Run when the make tree button is pressed
// Generates the SVG object, and loads the tree data into a d3 style tree
function makeTree() {
    // Prevents the creation of more than one tree
    if (goTree){
        // Set the dimensions and margins of the diagram
        var margin = {top: 20, right: 30, bottom: 30, left: 90},
        width = 1100 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

        // Initialize d3 zoom
        zoom = d3.zoom().on('zoom', function() {
                    svg.attr('transform', d3.event.transform);
                    })
        
        // Declaring the SVG object, init attributes
        svg = d3.select("#statespace").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .style("background-color", "white")
            .call(zoom)
            .on("dblclick.zoom", null)
            .append("g")
            .attr("transform", "translate("+ margin.left + "," + margin.top + ")")
            .append("g")
            .attr("transform", "translate("+ (width/2) - 30 + "," + margin.top + ")");

        // create the tooltip
        d3.select("#statespace")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // Num and duration of animations
        i = 0;
        duration = 750;

        // declares a tree layout and assigns the size
        treemap = d3.tree().size([height, width]);

        // Assigns parent, children, height, depth
        root = d3.hierarchy(treeData, function(d) { return d.children; });
        root.x0 = height / 2;
        root.y0 = 0;

        // Collapse after the second level

        // Loads children of root
        loadData(root);
        // Expands the root node to show loaded children
        expandNode(root);

        // Display
        update(root);

        // Preventing multiple trees
        goTree = false;
  }
}

// d3 zoom in
function zoomIn(){
  zoom.scaleBy(svg.transition().duration(750), 1.3);
}

// d3 zoom out
function zoomOut(){
  zoom.scaleBy(svg, 1 / 1.3);
}

// These dynamically load child data
function loadData(node) {
    if(!node.loadedChildren) {
      // Node has a 'stripsState' field that contains the corresponding planning state
      const data = StripsManager.getChildStates(DOMAIN, node.data.state);

      data.forEach((s) => {
          // Add each item to the node that we want to expands child field
          if(node.data.children) {
              const newName = "State " + stateCounter;
              stateCounter += 1;
              let generatedChild = {"name":newName, "state": s.state,"children":[]}
              node.data.children.push(generatedChild);
          }
      });
      node.loadedChildren = true;
    }
}

function expandNode(node) {
    const allChildren = node.data.children;
    const newHierarchyChildren = [];

    allChildren.forEach((child) => {
        const newNode = d3.hierarchy(child); // create a node
        newNode.depth = node.depth + 1; // update depth depends on parent
        newNode.height = node.height;
        newNode.parent = node; // set parent
        newNode.id = String(child.id); // set uniq id

        newHierarchyChildren.push(newNode);
    });

    // Add to parent's children array and collapse
    node.children = newHierarchyChildren;
    node._children = newHierarchyChildren;
}

// Toggle children on click.
function click(d) {
  if (d3.event.defaultPrevented) return;

    console.log("Clicked node :", d.data.state.actions);
    console.log(d.data.state);
    console.log(StripsManager.applicableActions(DOMAIN, d.data.state));
    // console.log("testing getChildren: ", StripsManager.getChildStates(dom, d.data.state));
    if(!d.loadedChildren && !d.children) {
        // Load children, expand
        loadData(d);
        expandNode(d);
        d.children = d._children;
        d._children = null;
    }
    else if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

// Double click on node: opens up heuristic visualization
function dblclick(d){
    startHeuristicViz(d);
}

// Collapses the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

// Uncompress state information to a string description
function description(state) {
    const actions = state.data.state.actions;
    var descr = "<strong>" + state.data.name + "</strong><br>";
    for (let i = 0; i < actions.length; i++) {
        descr += actions[i].action + " ";
        actions[i].parameters.forEach(param => {
            descr += param + " ";
        });
        descr += "<br>";
    }
    return descr;
}

// Uncompress fluent/action information to a string description
function hdescription(node) {
    if(node.type == "fluent") {
        var descr = "";
        descr += node.object.action + " ";
        node.object.parameters.forEach(param => {
            descr += param + " ";
        });
        return descr;
    } else {
        return node.object;
    }
}

// Updates the tree: drawing links, nodes, and tooltip
function update(source){
    //Assigns the x and y position for the nodes
    var treeData = treemap(root);
    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
        if (d.depth > treeHeight)
        treeHeight = d.depth;
        d.y = d.depth * 130;
        if (d.data.name === "goal state") {
            while (d !== root) {
                d.path = true;
                d = d.parent;
            }
        }
    });

    // ****************** Nodes section ***************************
    var Tooltip = d3.select(".tooltip");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)
    }
    var mousemove = function(d) {
        Tooltip
            .html(description(d))
            .style("left", (d3.event.pageX - 400) + "px")
            .style("top", (d3.event.pageY - 50) + "px")
            .style("opacity", .95);
    }
    var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8)
    }

    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); })

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click)
        .on('dblclick',dblclick)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function(d) {
            if(StripsManager.isGoal(d.data.state, goal)) {
                return "yellow";
            } else if (d._children) {
                return "#000080"
            } else {
                return "lightsteelblue";
            }
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", function(d) {
            return d._children ? "#000080" : "lightsteelblue";;
        })
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
            var o = {x: source.x0, y: source.y0}
            return diagonal(o, o)})
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "2px");

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
    });
    // centreNode(source);
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`
    return path
}

/*
--------------------------------------------------------------------------------
                                END OF TREE CODE
--------------------------------------------------------------------------------
*/

/*
--------------------------------------------------------------------------------
                                START OF HEURISTIC GRAPH CODE
--------------------------------------------------------------------------------
*/

// Formats graph data for a d3-style graph
function formatGraphData(node, graph) {
    // Makes a graph
   // var g = makeGraph(dom, prob, node.data.state);
    var g = graph;
    console.log("G:", g);
    // Formatting style
    var data = {"nodes":[], "links":[]};
    // Holds the actions
    var actions = [];

    // Run through each node in the graph, add to the nodes section of data
    g.forEach(node => {
        data.nodes.push({"id":node.index, "name":hdescription(node), "type":node.type, "value":node.value, "node":node});
        // If the node is an action node, it also defines the links, so store
        // it for the second pass
        if(node.type == "action") {
            actions.push(node);
        }
    });

    // Run through each action to generate the links
    actions.forEach(action => {
        // Goal actions do not have effects (terminal states), so ignore effects
        // in this case
        if(action.object != "goal") {
            // Generate effects: Effects are nodes that are pointed to by the supplied node
            for(let i = 0; i < action.effectIndices.length; i++) {
                data.links.push({"source":action.index, "target":action.effectIndices[i]});
            }
        }
        // Generate preconditions: Preconditions are nodes that point to the supplied node
        for(let i = 0; i < action.preconditionIndices.length; i++) {
            data.links.push({"source":action.preconditionIndices[i], "target":action.index});
        }
    });

    // Result
    return data;
}

// Launches the heuristic visualizer tab, formats data, and initiates the visualization
function startHeuristicViz(node){

    
    // Make a new tab for the viz
    window.new_tab('Node', function(editor_name){
      console.log("editor_name: "+ editor_name)
      $('#' +editor_name).html('<div style = "margin:13px 7px;text-align:center"><h2>Heuristic Visualization</h2><div id="heuristic"></div>');
      svgID = editor_name;
    });

    // Loading heuristic data from the node
    graph = loadHeuristicData(node.data.state);
    data = formatGraphData(node, graph);
    
    console.log(data);
    var color = d3.scaleSequential().domain([0,data.nodes.length-1]).interpolator(d3.interpolateViridis);;
    var Tooltip = d3.select(".tooltip");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)
    }
    var mousemove = function(d) {
        Tooltip
            // .html(description(d))
            .style("left", (d3.event.pageX - 200) + "px")
            .style("top", (d3.event.pageY - 30) + "px")
            .style("opacity", .95);
    }
    var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8)
    }

    // Set the dimensions and margins of the diagram
    var margin = {top: 20, right: 30, bottom: 30, left: 90},
    width = 1100 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

    // Init SVG object
    var svg = d3.select('#' + svgID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "white")
        .style("margin-left", "30px")
        .append("g")
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
    var node, link;

    svg
    .append('defs')
    .append('marker')
    .attr('id','arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 14)
    .attr('xoverflow','visible')
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', 'green')
    .style('stroke','none');

    // Let's list the force we wanna apply on the network
    var simulation = d3.forceSimulation(data.nodes)              // Force algorithm is applied to data.nodes
        .force("link", (d3.forceLink()                                // This force provides links between nodes
            .id(function(d, i) { return d.id; })
            .distance(200)
            .strength(1)                    // This provide  the id of a node                                // and this the list of links
        ))
        .force("charge", d3.forceManyBody().strength(-400))          // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))      // This force attracts nodes to the center of the svg area
        .on("end", ticked);

    // Draw the graph's links and nodes
    update(data.links, data.nodes)

    // Draws the graph with d3
    function update(links, nodes) {
        link = svg.selectAll(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", "#999")
            .attr("stroke-width", "1px")
            .attr("marker-end", "url(#arrowhead)")

        link.append("title").text(d => d.type);

        node = svg.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('fixed', true)
            .on("dblclick", dclk)
            .on("click", clk)
            .call(
                d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
            );

        node.append('circle')
            .attr('r', 10)
            .style('fill', (d,i) => getColor(d))

        node.append('title')
            .text((d) => d.id)

        node.append('text')
            .attr('dy', -3)
            .text((d) => d.name + " Value: " + d.value)

        simulation
            .nodes(nodes)
            .on('tick', ticked);

        simulation.force('link')
            .links(links);
    }

    
    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");            
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d.fixed = false;
      }
      
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    
    function dragended(d) {
        d.fixed = true;
    }

    // Double click
    function dclk(d) {
        d.fixed = false;
    }

    // Click
    function clk(d) {
        console.log(d);
        updateValue(g, d.node);
    }

    // Returns node color based on type / being the goal node
    function getColor(d) {
        if (d.name == "goal") {
            return "yellow";
        } else if (d.type == "action") {
            return "red";
        } else {
            return "green";
        }
    }

}


/*
--------------------------------------------------------------------------------
                            START OF HEURISTIC CODE
--------------------------------------------------------------------------------
*/



function loadHeuristicData(node){
    hAdd = true;
    processDomain(DOMAIN);
    processProblem(PROBLEM);
    graph = makeGraph(DOMAIN, PROBLEM, node);
    graphCopy = graph;
    var heuristic = autoUpdate(graph, hAdd);
    return graphCopy;
}

function processDomain(domain) {
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
    //console.log(fluents);
    return fluents;
}

function getAllActions(domain){
    var actions = [];
    for (action in domain.actions){
        actions.push(domain.actions[action]);
    }
    //console.log(actions);
    return actions;
}

function isFluentInState(fluent, fluentSet){
    for (stateFluent in fluentSet){
        if(JSON.stringify(fluentSet[stateFluent]) === JSON.stringify(fluent)){
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
        if (isFluentInState(currentFluent, state.actions)){
            newNode = {
                'type':'fluent', 
                'object':currentFluent, 
                'value':0, 
                'index':index
            };
            fluentNodeList.push(newNode);
        }
        else{
            newNode = {
                'type':'fluent',
                'object':currentFluent, 
                'value': Number.POSITIVE_INFINITY,
                'index':index
                };
            fluentNodeList.push(newNode);
        }

        index = index + 1
    }
    return fluentNodeList;
}

function makeActionNodes(actions, graph){
    actionList = [];
    index = graph.length;
    for (action in actions){
        currentAction = actions[action];
        preconditionIndices = getFluentIndexes(currentAction.precondition, graph);
        effectIndices = getFluentIndexes(currentAction.effect, graph);
        newNode = {
            'type':'action',
            'object': currentAction.action,
            'value':Number.POSITIVE_INFINITY,
            'preconditions': currentAction.precondition ,
            'preconditionIndices': preconditionIndices,
            'effect': currentAction.effect,
            'effectIndices': effectIndices,
            'index': index 
        };
        graph.push(newNode);
        index = index + 1;
    }
    return graph;
}
function getFluentIndexes(fluentList, graph){
    var indexes = [];
    for (fluent in fluentList){
        currentFluent = fluentList[fluent]
        for (node in graph){
            if (graph[node].type == 'fluent'){
                if (areFluentsEqual(graph[node].object,currentFluent)){
                    indexes.push(graph[node].index);
                }
            }

        }
    }
    return indexes;

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
    preconditionIndices = getFluentIndexes(goalState, graph);
    newNode = {
        'type' : 'action' ,
        'object': 'goal',
        'value':Number.POSITIVE_INFINITY,
        'preconditions': goalState,
        'preconditionIndices': preconditionIndices,
        'effect': null,
        'effectIndices' : [],
        'index': graph.length 
    }
    graph.push(newNode);
    return graph;
}
function unMapFluents(state){
    var newState = state;
    map = {"a":"a", "b": "b",  "y":"t1", "x":"t2"};
    for(fluent in newState.actions){
        currentFluent = newState.actions[fluent];
        for (param in currentFluent.parameters){
            currentParam = currentFluent.parameters[param];
            currentFluent.parameters[param] = map[currentParam];
        }
        newState.actions[fluent] = currentFluent;
        
    }
    return newState;

}

function makeGraph(domain, problem, state){
    var state = makeFluentsLowerCase(state);
    var newState = unMapFluents(state);
    console.log('state', newState);
    var graph = [];
    var fluents = getAllFluents(domain);
    var actions = getAllActions(domain);
    graph = makeFluentNodes(fluents, newState);
    graph = makeActionNodes(actions,graph);
    graph = makeGoalNode(problem, graph);
    // for (node in graph){
    //     console.log(graph[node]);
    // }
    return graph;
}

function getUpdatedFluentValue(node, graph){
    var adders = getAdders(node, graph);
    var lowestAdder =  Number.POSITIVE_INFINITY;
    //var currentSum = 0;
    for (adder in adders){
        currentAdder = adders[adder].value;
        //currentSum = getSumOfPreconditions(adder, graph);
        if (lowestAdder > currentAdder){
            lowestAdder = currentAdder;
        }
    }
    return lowestAdder;
}

function getSumOfPreconditions(actionNode, graph){
    var sum = 0;
    for (index in actionNode.preconditionIndices){
        currentIndex = actionNode.preconditionIndices[index];
        sum = sum + graph[currentIndex].value;
    }
    return sum;
}

function getMaxPrecondition(actionNode, graph){
    maxPreconditon = Number.NEGATIVE_INFINITY;
    for (index in actionNode.preconditionIndices){
        currentIndex = actionNode.preconditionIndices[index];
        if(graph[currentIndex].value > maxPreconditon){
            maxPreconditoon = graph[currentIndex].value;
        }
    }
    return maxPreconditon;
}

function getAdders(fluentNode, graph){
    adders = [];
    for (node in graph){
        if (graph[node].type == 'action'){
            if (graph[node].effectIndices.includes(fluentNode.index)){
                adders.push(graph[node]);
                
            }
        }
    }
    
    // for (index in fluentNode.effectIndexIndiceses){
    //     currentIndex = fluentNode.effectIndices[index];
    //     adders.push(graph[currentIndex]);
    // }
    return adders;
}

function updateValue(graph, currentNode, hAdd){
    var update = false;
    if (currentNode.type == 'fluent'){
        updateVal = getUpdatedFluentValue(currentNode, graph);
    }
    else{
        if (hAdd){
            updateVal= 1 + getSumOfPreconditions(currentNode, graph);

        }
        else{
            updateVal= 1 + getMaxPrecondition(currentNode, graph);
        }
        
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

function autoUpdate(graph, hAdd) {
    var update = true;
    var updateData;
    while (update){
        update = false;
        for(node in graph){
            currentNode = graph[node];
            updateData = updateValue(graph, currentNode, hAdd);
            graph = updateData[0];
            if (updateData[1] == true){
                update = true;
            }
        }
    }
    goalIndex = graph.length - 1;
    console.log(graph[goalIndex].value)
    return graph[goalIndex].value;
}

define(function () {
    window.d3_loaded = false;
  return {
      name: "Heuristic Viz",
      author: "Caitlin Aspinall, Cam Cunningham & Ellie Sekine",
      email: "16cea5@queensu.com",
      description: "Heuristic Visualization",

      initialize: function() {
        console.log("Plugin initialized! :D");
        // Loads D3 viz
        if ((!window.d3_loaded)){
          require.config({ paths: { d3: "https://d3js.org/d3.v4.min" }});
          require(["d3"], function(lib) { window.d3_loaded = true; d3 = lib});

          var style = document.createElement('tree');
          style.innerHTML = '.node { cursor:pointer } .node circle { stroke-width:1.5px } .node text { font:10px sans-serif }' +
                'div.tooltip {position:absolute; padding:6px; font:12px sans-serif; background-color:#FFA; border-radius:8px; pointer-events:none; left:0; top:0}';
          var ref = document.querySelector('script');
          ref.parentNode.insertBefore(style, ref);
        }
        // Adds menu button that allows for choosing files
        window.add_menu_button('Viz', 'vizMenuItem', 'glyphicon-signal',"chooseFiles('viz')");
        window.inject_styles('.viz_display {padding: 20px 0px 0px 40px;}')

        // Register this as a user of the file chooser interface
        window.register_file_chooser('viz',
        {
            showChoice: function() {
                // Button name, Description
                window.setup_file_chooser('Go', 'Display Visualization');
                $('#plannerURLInput').hide();
            },
            // Called when go is hit
            selectChoice: loadStatespace
        });
        },

        disable: function() {
          // This is called whenever the plugin is disabled
          window.toastr.warning("Plug in disabled")
          window.remove_menu_button("vizMenuItem");
        },

        save: function() {
          // Used to save the plugin settings for later
          return {did:window.viz_dom_id};
        },

        load: function(settings) {
          // Restore the plugin settings from a previous save call
          window.viz_dom_id = settings['did'];
        }
  };
});

// Tree data function
function getTreeData(graph, layerIndex) {
    // Convert the graph into a d3 tree format, so we can plot the graph.
    var treeData = [ { name: 'root', parent: 'null' }];
    var parent = [];

    var i = layerIndex; // layer of graph to print
    var layer = graph[i];
    var actionHash = {};
    var actionHash2 = {};

    for (var j in layer) {
        var action = layer[j];

        // Format action name: 'cook x y z'.
        var name = action.action + (action.parameters ? '-' : '');
        for (var k in action.parameters) {
            name += action.parameters[k].parameter + ' ';
        }
        // Start action node.
        var node = { name: name, parent: null, children: [] };
        var p0 = null;
        var p1 = null;

        // P0
        for (var k in action.precondition) {
            var act = action.precondition[k];

            var name = (act.operation || 'and') + '-' + act.action + '-';
            for (var l in act.parameters) {
                name += act.parameters[l] + ' ';
            }

            p0 = actionHash[name];
            if (!p0) {
                // New parent node.
                p0 = { name: name, parent: treeData[0].name, children: [ node ] };
                parent.push(p0);

                actionHash[name] = p0;
            }
            else {
                // This is a child node of the parent.
                p0.children.push(node);
            }

            node.parent = p0.name;
        }

        // P1
        for (var k in action.effect) {
            var act = action.effect[k];

            var name = (act.operation || 'and') + '-' + act.action + '-';
            for (var l in act.parameters) {
                name += act.parameters[l] + ' ';
            }

            p1 = { name: name, parent: node.name, children: [] };
            node.children.push(p1);
        }
    }

    treeData[0].children = parent;

    return treeData;
}

// Commented out functions:

// var viewerWidth = $(document).width();
// var viewerHeight = $(document).height();

//
// function centreNode(source){
//   var scale = zoom.scaleTo();
//   var x = -source.y0 * scale + viewerWidth/2;
//   var y = -source.x0 * scale + viewerHeight/2;
//   d3.select('g').transition()
//     .duration(duration)
//     .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
//   zoom.scaleTo(scale);
//   zoomListener.translate([x, y]);
// // }

// function centreNode(source){
//    var t = d3.event.transform;
//    console.log(t);
//
//    x =  t.x;
//    y = source.x0;
//
//    y = -y *t.k + viewerHeight / 2;
//
//    g.transition()
//     .duration(duration)
//     .attr("transform", "translate(" + x + "," + y + ")scale(" + t.k + ")")
//     .on("end", function(){ zoomer.call(zoom.transform, d3.zoomIdentity.translate(x,y).scale(t.k))});
// }
//
function zoomed() {
      svg.attr("transform", d3.event.transform);
      /*
      // this is intended to start the zoom at center where the current node is
      var transform = d3.event.transform,
          point = transform.invert(center);
          console.log("point",point, "focus", focus)
      transform = transform.translate(point[0] - focus[0], point[1] - focus[1]);
      svg.attr("transform", transform);
      */
     }
//
// // Part of nodeEnter:
// // .on('dblclick',function(e){
//       //   window.new_tab('Node', function(editor_name){
      //     $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>')
      //     // '<p id="hv-output"></p>')
      //   })
      // });

      //   window.new_tab('Node Tab', function(editor_name){
      //     $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>' +
      //     '<button onclick="makeTree()" style="float:right;margin-left:16px">makeTree</button>' +
      //
      // });


    /*

    I'm not sure what this svg select does: commented it out for now and it still works - Cam

    */

    // svg = d3.select("#svg-container").append("svg")
    //     // .attr("width","100%")
    //     // .attr("height", "100%")
    //     .attr("width",viewerWidth)
    //     .attr("height",viewerHeight)
    //     .attr("preserveAspectRatio", "xMinYMid meet")
    //     .attr("display", "block")

    // var svg_container = $("#svg-container");
    // viewerWidth = svg_container.width();
    // viewerHeight = svg_container.height();
