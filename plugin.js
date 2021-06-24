// Tree Globals
var stateCounter, goal, graph, DOMAIN, PROBLEM, treemap, tooltip, goalState, tree, svg, diagonal, stateCounter, i, duration, treeData, treeHeight, goTree = true;
var root, d3, zoom, viewerWidth, viewerHeight;

// Heuristic globals
var hSim, svgID, svgCount=1, actions, fluents, fluentPreconditions = {}, formattedActions;

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
        treeData = {"name":"root", "children":[], "state":result.state, "strState":result.strState, "precondition":null, "loadedChildren":false};
        // console.log(treeData);
        stateCounter = 1;
        launchViz();
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
                    const newState = {"name":newName, "children":[], "state":data.states[i], "strState":data.stringStates[i], "precondition":data.actions[i].toString(), "loadedChildren":false};
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

    if(!d.loadedChildren && !d.children) {
        // Load children, expand
        loadData(d, result => {
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
        .on('dblclick',dblclick)
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

function makeGraph(state){
    var graph = new Map();
    let index = 1;

    fluents = getGroundedFluents();
    actions = getGroundedActions();
    formattedActions = formatActions(actions);

    generateFluentNodes(state, graph, index);
    generateActionNodes(state, graph, index);
    generateGoalNode(graph, index);

    return graph;
}

function formatActions(actions) {
    formattedActions = [];
    Array.from(actions.preconditions.keys()).forEach(action => {
        let newAction = {"action":action, "preconditions":[], "effects":[], "value":0};
        actions.preconditions.get(action).forEach(pcond => {
            newAction.preconditions.push(pcond);
        });
        actions['effects'].get(action).forEach(effect => {
            // fluentPreconditions[effect].push(action);
            newAction.effects.push(effect);
        });
        formattedActions.push(newAction);
    })
    return formattedActions;
}

function generateFluentNodes(state, graph, index) {
    // Have to check if this fluent is in the state to initialize (do this after)
    fluents.fluents.forEach(fluent => {
        // fluent.preconditions = fluentPreconditions[fluent.]
        if(state.data.strState.includes(fluent)) {
            graph.set(fluent, {
                'type':'fluent',
                'value':0,
                'index':index,
            });
        } else {
            graph.set(fluent, {
                'type':'fluent',
                'value':Number.POSITIVE_INFINITY,
                'index':index,
            });
        }
        index += 1;
    });
}

function generateActionNodes(state, graph, index) {
    formattedActions.forEach(action => {
        console.log("action: ", action.action);
        graph.set(action.action, {
            'type':'action',
            'value':Number.POSITIVE_INFINITY,
            'preconditions': action.preconditions,
            'effects': action.effects,
            'index': index
        });
        index += 1;
    });
}

function generateGoalNode(graph, index) {
    goalNode = {
        'type' : 'goal' ,
        'object': 'goal',
        'value':Number.POSITIVE_INFINITY,
        'preconditions': convertStateToArray(getGoalState()),
        'effects': null,
        'index': index
    }
    graph.set('goal', goalNode);
}

function generateHeuristicGraphData(graph) {
    var data = {"nodes":[], "links":[]};

    // Populating data with fluents
    fluents.fluents.forEach(fluent => {
        data.nodes.push({"id":fluent, "name":fluent, "type":"fluent", "value":graph.get(fluent).value});
        fluentPreconditions[fluent] = [];
    });

    // Populating data with actions
    Array.from(actions.preconditions.keys()).forEach(action => {
        data.nodes.push({"id":action, "name":action, "type":"action", "value":graph.get(action).value});
        actions.preconditions.get(action).forEach(pcond => {
            data.links.push({"source":pcond, "target":action});
        });
        actions['effects'].get(action).forEach(effect => {
            fluentPreconditions[effect].push(action);
            data.links.push({"source":action, "target":effect});
        });
    })
    return data;
}

// Launches the heuristic visualizer tab, formats data, and initiates the visualization
function startHeuristicViz(node) {
    // Make a new tab for the viz
    window.new_tab('Node', function(editor_name){
        $('#' +editor_name).html('<div style = "margin:13px 7px;text-align:center"><h2>Heuristic Visualization</h2><div id="heuristic"></div><button onclick="freeze()" style="float:right;margin-left:16px" id ="Freeze">Freeze</button>');
        svgID = editor_name;
    });

    graph = makeGraph(node);
    data = generateHeuristicGraphData(graph);

    console.log("Hviz data: ", data);
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
            return d.name + " Value: " + d.value;
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
            // d is this
            // o is other
            if(d.type == "action") {
                if(actions['preconditions'].get(d.id).includes(o.id) || d.id == o.id) {
                    // o is precondition
                    return '#a7440f';
                } else {
                    return 'none';
                }
            } else {
                if(fluentPreconditions[d.id].includes(o.id) || d.id == o.id) {
                    // o is precondition
                    return '#a7440f';
                } else {
                    return 'none';
                }
            }
        });

        node.style("opacity", function(o) {
            if(d.type == "action") {
                if(actions['preconditions'].get(d.id).includes(o.id) || d.id == o.id) {
                    // o is precondition
                    return 1;
                } else {
                    return 0.5;
                }
            } else {
                if(fluentPreconditions[d.id].includes(o.id) || d.id == o.id) {
                    // o is precondition
                    return 1;
                } else {
                    return 0.5;
                }
            }
        });

        text.style('opacity', function(o) {
            if(d.type == "action") {
                if(actions['preconditions'].get(d.id).includes(o.id) || d.id == o.id) {
                    // o is precondition
                    return 1;
                } else {
                    return 0.5;
                }
            } else {
                if(fluentPreconditions[d.id].includes(o.id) || d.id == o.id) {
                    // o is precondition
                    return 1;
                } else {
                    return 0.5;
                }
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
        var result = updateValue(graph, d.id, true);

        // If an update occured
        if(result[1]) {
            window.toastr.success("Value updated!");
            // Update data variable to reflect the update
            data.nodes[d.index].value = graph.get(d.id).value;
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

function getUpdatedFluentValue(node, graph){
    var adders = getAdders(node, graph);
    var lowestAdder =  Number.POSITIVE_INFINITY;
    //var currentSum = 0;
    for (adder in adders){
        currentAdder = graph.get(adders[adder]).value;
        //currentSum = getSumOfPreconditions(adder, graph);
        if (lowestAdder > currentAdder){
            lowestAdder = currentAdder;
        }
    }
    return lowestAdder;
}

function getSumOfPreconditions(actionNode, graph) {
    var sum = 0;
    graph.get(actionNode).preconditions.forEach(precondition => {
        if (graph.get(precondition).value == Number.POSITIVE_INFINITY) {
            return Number.POSITIVE_INFINITY
        }
        sum += graph.get(precondition).value;
    });
    return sum;
}

// For HMAX
// function getMaxPrecondition(actionNode, graph){
//     maxPreconditon = Number.NEGATIVE_INFINITY;
//     for (index in actionNode.preconditionIndices){
//         currentIndex = actionNode.preconditionIndices[index];
//         if(graph[currentIndex].value > maxPreconditon){
//             maxPreconditon = graph[currentIndex].value;
//         }
//     }
//     return maxPreconditon;
// }

function getAdders(fluentNode, graph){
    adders = [];
    for(let node of graph.keys()) {
        console.log(graph.get(node));
        if(graph.get(node).type == 'action') {
            if(graph.get(node).effects.includes(fluentNode)) {
                adders.push(node);
            }
        }
    }
    return adders;
}

function updateValue(graph, node, hAdd){
    var update = false;;
    if (graph.get(node).type == 'fluent'){
        updateVal = getUpdatedFluentValue(node, graph);
    }
    else{
        if (hAdd){
            updateVal= 1 + getSumOfPreconditions(node, graph);

        }
        else{
            updateVal= 1 + getMaxPrecondition(node, graph);
        }

    }
    if (updateVal < graph.get(node).value){
        graph.get(node).value = updateVal
        update = true;
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

        var style = document.createElement('tree');
        style.innerHTML = '.node { cursor:pointer } .node circle { stroke-width:1.5px } .node text { font:10px sans-serif }' +
            'div.tooltip {position:absolute; padding:6px; font:12px sans-serif; background-color:#FFA; border-radius:8px; pointer-events:none; left:0; top:0}';
        var ref = document.querySelector('script');
        ref.parentNode.insertBefore(style, ref);

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
