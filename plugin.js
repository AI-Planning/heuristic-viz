// Tree Globals 
var stateCounter, goal, graph, DOMAIN, PROBLEM, treemap, tooltip, goalState, tree, svg, diagonal, stateCounter, i, duration, treeData, treeHeight, goTree = true;
var root, d3, zoom, viewerWidth, viewerHeight;

// Heuristic globals
var hSim, svgID, svgCount=1;

// Called when you click 'Go' on the file chooser
function loadStatespace() {

    // Getting string versions of the selected files
    var domText = window.ace.edit($('#domainSelection').find(':selected').val()).getSession().getValue();
    var probText = window.ace.edit($('#problemSelection').find(':selected').val()).getSession().getValue();

    // Lowering the choose file modal menu
    $('#chooseFilesModal').modal('toggle');
    $('#plannerURLInput').show();

    let domain = "                (define (domain BLOCKS)" +
        "                (:requirements :strips)" +
        "                (:predicates (on ?x ?y)" +
        "                        (ontable ?x)" +
        "                        (clear ?x)" +
        "                        (handempty)" +
        "                        (holding ?x)" +
        "                        )" +
        "" +
        "                (:action pick-up" +
        "                        :parameters (?x)" +
        "                        :precondition (and (clear ?x) (ontable ?x) (handempty))" +
        "                        :effect" +
        "                        (and (not (ontable ?x))" +
        "                        (not (clear ?x))" +
        "                        (not (handempty))" +
        "                        (holding ?x)))" +
        "" +
        "                (:action put-down" +
        "                        :parameters (?x)" +
        "                        :precondition (holding ?x)" +
        "                        :effect" +
        "                        (and (not (holding ?x))" +
        "                        (clear ?x)" +
        "                        (handempty)" +
        "                        (ontable ?x)))" +
        "                (:action stack" +
        "                        :parameters (?x ?y)" +
        "                        :precondition (and (holding ?x) (clear ?y))" +
        "                        :effect" +
        "                        (and (not (holding ?x))" +
        "                        (not (clear ?y))" +
        "                        (clear ?x)" +
        "                        (handempty)" +
        "                        (on ?x ?y)))" +
        "                (:action unstack" +
        "                        :parameters (?x ?y)" +
        "                        :precondition (and (on ?x ?y) (clear ?x) (handempty))" +
        "                        :effect" +
        "                        (and (holding ?x)" +
        "                        (clear ?y)" +
        "                        (not (clear ?x))" +
        "                        (not (handempty))" +
        "                        (not (on ?x ?y)))))";

    let problem = "(define (problem BLOCKS-4-0)" +
        "                (:domain BLOCKS)" +
        "                (:objects D B A C )" +
        "                (:INIT (CLEAR C) (CLEAR A) (CLEAR B) (CLEAR D) (ONTABLE C) (ONTABLE A)" +
        "                (ONTABLE B) (ONTABLE D) (HANDEMPTY))" +
        "                (:goal (AND (ON D C) (ON C B) (ON B A)))" +
        "                )";

    // Ground
    ground(domain, problem).then(function(result) {
        treeData = {"name":"root", "children":[], "state":result, "strState":result.toString(), "precondition":null, "loadedChildren":false};
        // console.log(treeData);
        stateCounter = 1;
        launchViz();
        startHeuristicViz(root);
    });
}

function launchViz(){
    window.new_tab('Viz2.0', function(editor_name){
      $('#' +editor_name).html('<div style = "margin:13px 26px;text-align:center"><h2>Viz</h2>' +
      '<button onclick="zoomIn()" style="float:right;margin-left:16px" id ="ZoomIn">ZoomIn</button>' +
      '<button onclick="zoomOut()" style="float:right;margin-left:16px" id ="ZoomOut">ZoomOut</button>' +
      '<div id="statespace"></div>' +
      '<node circle style ="fill:black;stroke:black;stroke-width:3px;></node circle>' +
      '<p id="hv-output"></p>');
    });
    makeTree();
}

// Generates the SVG object, and loads the tree data into a d3 style tree
function makeTree() {
    // Prevents the creation of more than one tree
    if (goTree){
        // Set the dimensions and margins of the diagram
        var margin = {top: 20, right: 30, bottom: 30, left: 90};
        var width = 1100 - margin.left - margin.right;
        var height = 700 - margin.top - margin.bottom;

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
            .attr("transform", "translate("+ (width / 2) + "," + margin.top + ")");

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

        // Loads children of root
        loadData(root, function(result) {
            convertNode(result);
            update(result);
            // Preventing multiple trees
            goTree = false;
        });
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

function loadData(node, callback) {
    if(!node.loadedChildren) {
        const state = node.data.state;
        getChildStates(state)
        .then(data => {
            for (let i = 0; i < data['states'].length; i++) {
                if(node.data.children) {
                    // Create data
                    const newName = "State " + stateCounter;
                    stateCounter += 1;
                    const stringState = data['states'][i].toString();
                    const newState = {"name":newName, "children":[], "state":data['states'][i], "strState":stringState, "precondition":data['actions'][i].toString(), "loadedChildren":false}; 
                    node.data.children.push(newState);
                }
            }
            node.loadedChildren = true;
            callback(node);
        });   
    }
}

// Converts the node to d3 tree form using d3.hierarchy
// Initializes other properties
function convertNode(node) {
    // Get children of node
    const allChildren = node.data.children;
    // Var to hold formatted children
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

    console.log(d);

    if(!d.loadedChildren && !d.children) {
        // Load children, expand
        loadData(d, result => {
            console.log(result.data.strState);
            convertNode(d);
            d.children = d._children;
            d._children = null;
            update(d);
        });
    }
    else if (d.children) {
        d._children = d.children;
        d.children = null;
        update(d);
    } else {
        d.children = d._children;
        d._children = null;
        update(d);
    }
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
            .style("opacity", 1);
        hoveredOverStateInStatespace(d);
    }
    var mousemove = function(d) {
        Tooltip
            .html(d.data.strState)
            .style("left", (d3.event.pageX - 400) + "px")
            .style("top", (d3.event.pageY - 50) + "px");
    }
    var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none");
    }

    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) {return d.data.name; })

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click)
        // .on('dblclick',dblclick)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", "lightsteelblue");

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
        .data(links, function(d) { return d.data.name; });

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
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`
    return path
}

function hoveredOverStateInStatespace(d) {
    console.log("Hovered over state ", d, " in the state space.");
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

// TARSKI STUFF
function graphData() {
    // Graph data in json obj needs to be of form {"nodes":[{id:INT}], "links":[{"source", "target"}]}  
    var data = {"nodes":[], "links":[]}; 
    console.log(getGroundedFluents());
    console.log(getGroundedActions());
}

// Formats graph data for a d3-style graph
function formatGraphData(node, graph) {
    // Makes a graph
    var g = graph;
    // Formatting style
    var data = {"nodes":[], "links":[]};
    // Holds the actions
    var actions = [];

    // Run through each node in the graph, add to the nodes section of data
    g.forEach(node => {
        data.nodes.push({"id":node.index, "name":hdescription(node), "type":node.type, "value":node.value, "node":node, "preconditions":[]});
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
                data.nodes[action.effectIndices[i]].preconditions.push(action.index);
            }
        }
        // Generate preconditions: Preconditions are nodes that point to the supplied node
        for(let i = 0; i < action.preconditionIndices.length; i++) {
            data.links.push({"source":action.preconditionIndices[i], "target":action.index});
            data.nodes[action.index].preconditions.push(action.preconditionIndices[i]);
        }
    });

    // Result
    return data;
}

// Launches the heuristic visualizer tab, formats data, and initiates the visualization
function startHeuristicViz(node) {
    // Make a new tab for the viz
    window.new_tab('Node', function(editor_name){
        $('#' +editor_name).html('<div style = "margin:13px 7px;text-align:center"><h2>Heuristic Visualization</h2><div id="heuristic"></div><button onclick="freeze()" style="float:right;margin-left:16px" id ="Freeze">Freeze</button>');
        svgID = editor_name;
    });

    // Loading heuristic data from the node
    graph = loadHeuristicData(node.data.state);
    console.log(graph);
    // Setting data in d3 form
    data = formatGraphData(node, graph);
    console.log(data);
    
    // Holds the nodes, the links, and the labels
    var node, link, text;

    // Set the dimensions and margins of the diagram
    var margin = {top: 20, right: 400, bottom: 30, left: 400},
    width = $('#' + svgID).width() - margin.right - margin.left;
    height = 1000 - margin.top - margin.bottom;

    // Init SVG object
    var svg = d3.select('#' + svgID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "white")
        .style("margin-left", "30px")
        .on("dblclick.zoom", null)
        .call(d3.zoom().on("zoom", function () {
            svg.attr("transform", d3.event.transform)
        }))
        .append("g")
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
    // Initializing the arrow head for links
    svg.append('defs')
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
        .attr('fill', '#bc5090')
        .style('stroke','none');

    // Initializing the force that gets applied to the network
    hSim = d3.forceSimulation(data.nodes)              // Force algorithm is applied to data.nodes
        .force("link", (d3.forceLink()                                // This force provides links between nodes
            .id(function(d, i) { return d.id; })
            .distance(300)
            .strength(1)                    // This provide  the id of a node                                // and this the list of links
        ))
        .force("charge", d3.forceManyBody().strength(-500))          // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))      // This force attracts nodes to the center of the svg area
        .on("end", ticked);

    // Initialize the D3 graph with generated data
    link = svg.selectAll(".link")
        .data(data.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-width", "1px")
        .attr("marker-end", "url(#arrowhead)")

    link.append("title").text(d => d.type);

    text = svg.selectAll("text")
        .data(data.nodes)
        .enter()
        .append("g")
        .append("text")
        .text((d) => {
            if(d.type == "fluent" || d.name == "goal") {
                return d.name + " Value: " + d.value;
            } else {
                return getActionName(d.name) + " Value: " + d.value;
            }
        })
        .attr('dy', -18)
        .attr("text-anchor", "middle");

    node = svg.selectAll('.node')
        .data(data.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('fixed', true)
        .attr('stroke-width', '2')
        .on("dblclick", dclk)
        .on("click", clk)
        .on("mouseover", highlight)
        .on("mouseleave", removeHighlight)
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

    hSim
        .nodes(data.nodes)
        .on('tick', ticked);

    hSim.force('link')
        .links(data.links);
    
    // This function is run at each iteration of the force algorithm, updating the node, link, and text positions.
    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");            
    
        text    
            .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");
    }

    function dragstarted(d) {
        if (!d3.event.active) hSim.alphaTarget(0.3).restart();
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
        // Update node on click
        updateHeuristicNode(d);
        console.log(d);
    }

    // Update node labels to reflect value change
    function updateLabels() {
        // Updates labels to reflect changes in value 
        svg.selectAll("text").data(data.nodes)
            .transition().duration(500)
            .text((d) => d.name + " Value: " + d.value)
            .attr('dx', 3)
    }

    // Returns node color based on type / being the goal node
    function getColor(d) {
        if (d.name == "goal") {
            return "#ffa600";
        } else if (d.type == "action") {
            return "#ff6361";
        } else {
            return "#003f5c";
        }
    }

    // Highlights node and all of its predecessors
    function highlight(d) {
        d3.select(this).style('opacity', 0.9);
        node.style("stroke", function(o) {
            // console.log(d, o);
            if (d.preconditions.includes(o.id) || d.id == o.id) {
                return '#a7440f';
            } else {
                return 'none';
            }
        });

        node.style("opacity", function(o) {
            // console.log(d, o);
            if (d.preconditions.includes(o.id) || d.id == o.id) {
                return 1;
            } else {
                return 0.5;
            }
        });
        
        text.style('opacity', function(o) {
            if (d.preconditions.includes(o.id) || d.id == o.id) {
                return 1;
            } else {
                return 0.5;
            }
        });
        
        link
            .style('stroke', function (o) { 
                if(o.target.id == d.id) {
                    return '#69b3b2';
                } else {
                    return '#b8b8b8';
                }
            })
            .style('opacity', function(o) {
                if(o.target.id == d.id) {
                    return 1;
                } else {
                    return 0.5;
                }
            });
    }

    // Removes black highlight from nodes and their predecessors
    function removeHighlight(d) {
        node.style("stroke", "none"); 
        d3.select(this).style('opacity', 1); 
        link
            .style("stroke", "#999")
            .style("stroke-width", "1px")
            .style('opacity', 1);
        text.style('opacity', 1);
        node.style('opacity', 1);
    }

    // Updates value of node and reflects the change in the visualization
    function updateHeuristicNode(d) {
        // Update clicked node
        var result = updateValue(graph, d.node, true);

        // If an update occured
        if(result[1]) {
            window.toastr.success("Value updated!");
            // Update data variable to reflect the update
            data.nodes[d.index].value = result[0][d.index].value;
            // Redraw labels
            updateLabels();
        } else {
            window.toastr.info("No update occured!");
        }
    }

}

// Pauses force simulation (needs to be a global function due to html buton)
function freeze() {
    hSim.stop();
}

// Unpacks action name
function getActionName(name) {
    var n = name[0] + " ";
    for(const v in name[1]) {
        n += v + " ";
    }
    return n;
}

/*
--------------------------------------------------------------------------------
                            START OF HEURISTIC CODE
--------------------------------------------------------------------------------
*/



function loadHeuristicData(node){
    hAdd = true;
    graph = makeGraph(DOMAIN, PROBLEM, node);
    graphCopy = graph;
    var heuristic = autoUpdate(graph, hAdd);
    return graphCopy;
}

function getAllFluents(domain, actions){
    var fluents = [];
    for (action in actions){
        currentAction = actions[action];
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

function getApplicableActionInState(action) {
    // This function returns an applicable concrete action for the given state, or null if the precondition is not satisfied.
    var resolvedAction = null;

    // Does the filled-in precondition exist in the state test cases?
    //if (StripsManager.isPreconditionSatisfied(state, action.precondition)) {
        // This action is applicable.
        // Assign a value to each parameter of the effect.
    var populatedEffect = JSON.parse(JSON.stringify(action.effect));
    for (var m in action.effect) {
        var effect = action.effect[m];

        for (var n in effect.parameters) {
            var parameter = effect.parameters[n];
            var value = action.map[parameter];
            
            if (value) {
                // Assign this value to all instances of this parameter in the effect.
                populatedEffect[m].parameters[n] = value;
            }
            else {
                StripsManager.output('* ERROR: Value not found for parameter ' + parameter + '.');
            }
        }
    }
    
    resolvedAction = JSON.parse(JSON.stringify(action));
    resolvedAction.effect = populatedEffect;
    resolvedAction.map = action.map;
    //}
    
    return resolvedAction;
}

function getAllActions(domain){
    var result = [];

    if (!domain.values || domain.values.length == 0) {
        StripsManager.output('ERROR: No parameter values found in domain.values.');
        return;
    }

    for (var i in domain.actions) {
        var action = domain.actions[i]; // op1
        var parameters = action.parameters; // x1, x2, x3
        var populatedAction = JSON.parse(JSON.stringify(action)); // copy for replacing parameters with actual values.
        var parameterMapHash = {};
        

        
        // Assign values to the parameters for each test case.
        for (var j in action.parameterCombinations) {
            var testCase = action.parameterCombinations[j];
            if(parameters.length == testCase.length){
            var nindex = 0;
            
            var parameterMap = []; // map of parameter values to be populated
            // Initialize default parameter values for this action. We'll set concrete values next.
            for (var j in parameters) {
                parameterMap[parameters[j].parameter] = testCase[nindex++];
            }

            // Get the action's precondition parameters.
            var testCaseIndex = 0;
            for (var k in action.precondition) {
                var precondition = action.precondition[k];
                var populatedPreconditionPart = JSON.parse(JSON.stringify(precondition)); // copy for replacing parameters with actual values.
                
                // Found a matching action. So far, so good.
                var parameterIndex = 0;
                
                // Assign a value to each parameter of the precondition.
                for (var l in precondition.parameters) {
                    var parameter = precondition.parameters[l];
                    var value = parameterMap[parameter];

                    // Assign this value to all instances of this parameter in the precondition.
                    populatedPreconditionPart.parameters[l] = value;
                }
                
                populatedAction.precondition[k] = populatedPreconditionPart;
                populatedAction.map = parameterMap;
            }

            // Does the filled-in precondition exist in the test cases?
            var applicableAction = getApplicableActionInState(populatedAction);
            if (applicableAction) {
                // This action is applicable in this state. Make sure we haven't already found this one.
                var isDuplicate = false;
                for (var rr in result) {
                    var action1 = result[rr];
                    if (StripsManager.isEqual(applicableAction, action1)) {
                        isDuplicate = true;
                        break;
                    }
                }

                if (!isDuplicate) {
                    result.push(applicableAction);
                }
            }
        }
        }
    
    }
    console.log('reuslt', result);
    return result;
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
       // if (isFluentInState(currentFluent, state.actions)){
        if(StripsManager.isPreconditionSatisfied(state, [currentFluent])){
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
            'object': [currentAction.action, currentAction.map],
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

function getActionIndex(actionObjcet, actionList){
    for (action in actionList){
        currentAction = actionList[action];
        if (currentAction.type == 'action'){
            if(actionObjcet[0] == currentAction.object[0]){
                if(JSON.stringify(actionObjcet[1]) == JSON.stringify(currentAction.object[1])){
                    return action;
                }
            }
        }
        
    }
    return -1;
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
   // var newState = unMapFluents(state);
    console.log('state', state);
    var graph = [];
    var actions = getAllActions(domain);
    var fluents = getAllFluents(domain, actions);
    
    graph = makeFluentNodes(fluents, state);
    graph = makeActionNodes(actions,graph);
    graph = makeGoalNode(problem, graph);

    applAct = StripsManager.applicableActions(domain, state)[0];
    applActObject = [applAct.action, applAct.map];
    index = getActionIndex(applActObject,graph);
    fluentIndexes = getFluentIndexes(state.actions, graph);
    console.log('graph', graph);
    console.log('applicable actions',applActObject);
    console.log('actionIndex', index);
    console.log('fluent index', fluentIndexes);
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
        if (graph[currentIndex].value == Number.POSITIVE_INFINITY){
            return Number.POSITIVE_INFINITY
        }
        sum = sum + graph[currentIndex].value;
    }
    return sum;
}

function getMaxPrecondition(actionNode, graph){
    maxPreconditon = Number.NEGATIVE_INFINITY;
    for (index in actionNode.preconditionIndices){
        currentIndex = actionNode.preconditionIndices[index];
        if(graph[currentIndex].value > maxPreconditon){
            maxPreconditon = graph[currentIndex].value;
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
        // Init grounding
        initializeGrounding();
        
        // Adds menu button that allows for choosing files
        window.add_menu_button('Viz', 'vizMenuItem', 'glyphicon-tower',"chooseFiles('viz')");
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
