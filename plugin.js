var tree, svg, diagonal, stateCounter,i, duration, treeData,treeHeight,
root, goalState, dom, prob, tooltip, treemap, d3, zoom, zoomer,viewerWidth,viewerHeight ;

// var viewerWidth = $(document).width();
// var viewerHeight = $(document).height();

function makeTree() {
  console.log("Called make tree");

  // Set the dimensions and margins of the diagram
  var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  svg = d3.select("body").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate("+ margin.left + "," + margin.top + ")")
      // .call(d3.zoom().scaleExtent([1 / 2, 12])
      // .on("zoom", zoomed))
      .append("g")
      .attr("transform", "translate("+ (width/2) + "," + margin.top + ")");


  i = 0;
  duration = 750;

  // declares a tree layout and assigns the size
  treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData[0], function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

}
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
// Collapse the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}
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



function update(source){
  //Assigns the x and y position for the nodes
  var treeData = treemap(root);
  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  // nodes.forEach(function(d){ d.y = d.depth * 180});
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

  // Update the nodes...
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', click)
      .on('dblclick', startHeuristicViz(node));
      // .on('dblclick',function(e){
      //   window.new_tab('Node', function(editor_name){
      //     $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>')
      //     // '<p id="hv-output"></p>')
      //   })
      // });

      //   window.new_tab('Node Tab', function(editor_name){
      //     $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>' +
      //     '<button onclick="makeTree()" style="float:right;margin-left:16px">makeTree</button>' +
      //
      // });



  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
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
        return d._children ? "lightsteelblue" : "#fff";
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
      // .style("stroke", function(d){return d.target.color})
      // .style("stroke-width", function(d) { return d.target.path ? 5 : 1.5 });

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

  // Toggle children on click.
  function click(d) {
    console.log("Clicked node :", d);
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }


// These dynamically load child data: Don't need to use it but I'll leave it here for now

// function loadData(node) {
//   if(!node.loadedChildren) {
//     // Node has a 'stripsState' field that contains the corresponding planning state
//     const data = StripsManager.getChildStates(dom, node.data.stripsState);

//     data.forEach((s) => {
//         // Add each item to the node that we want to expands child field
//         if(node.data.children) {
//             let generatedChild = {"name":s.state.name, "stripsState": s.state,"children":[]}
//             node.data.children.push(generatedChild);
//         }
//     });
//     node.loadedChildren = true;
//   }
// }

// function expandNode(node) {
//   const allChildren = node.data.children;
//   const newHierarchyChildren = [];

//   allChildren.forEach((child) => {
//       const newNode = d3.hierarchy(child); // create a node
//       newNode.depth = node.depth + 1; // update depth depends on parent
//       newNode.height = node.height;
//       newNode.parent = node; // set parent
//       newNode.id = String(child.id); // set uniq id

//       newHierarchyChildren.push(newNode);
//   });

//   // Add to parent's children array and collapse
//   node.children = newHierarchyChildren;
//   node._children = newHierarchyChildren;
//   console.log("Updated node: ", node);
//   this.update(node);
// }



/*
--------------------------------------------------------------------------------
                                END OF TREE CODE
--------------------------------------------------------------------------------
*/

// Called when you click 'Go' on the file chooser, we can change this name
function showTree() {

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

  console.log("Clicked show tree");
  // Getting string versions of the selected files
  var domText = window.ace.edit($('#domainSelection').find(':selected').val()).getSession().getValue();
  var probText = window.ace.edit($('#problemSelection').find(':selected').val()).getSession().getValue();

  // Lowering the choose file modal menu
  $('#chooseFilesModal').modal('toggle');
  $('#plannerURLInput').show();

  // This parses the problem and domain text, froreturns from a callback
  StripsManager.loadFromString(domain, problem, function(d, p) {
    dom = d;
    prob = p;
    var graph = StripsManager.graph(d, p);
    treeHeight = 0;
    treeData = getTreeData(graph, 0);
    // Calls launchviz which just makes a new tab with a button to make the dummy data tree
    launchViz();
  });
}

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

function startHeuristicViz(node){
    window.new_tab('Node', function(editor_name){
      $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>')
    });
    loadHeuristicData(node);
}

function loadHeuristicData(node){
  console.log('node:',node);
  processDomain(dom);
  console.log('----------------------');
  processProblem(prob);
  console.log('----------------------');

  var fluent = {
      type: 'fluent',
      object: { operation: 'not', action: 'handempty', parameters: [] },
      value: Infinity,
      index: 3
  };

  initialState = prob.states[0];
  var child = StripsManager.getChildStates(dom, initialState);
  child = child[1].state
  console.log('Inital State');
  console.log(initialState.actions);
  var graph2 = makeGraph(dom, prob, child);
  var heuristic = autoUpdate(graph2);
  console.log('----------------------');
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




function launchViz(){
  window.new_tab('Viz2.0', function(editor_name){
    $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>' +
    '<button onclick="makeTree()" style="float:right;margin-left:16px">makeTree</button>' +
    '<node circle style ="fill:#fff;stroke:black;stroke-width:3px;></node circle>' +
    '<p id="hv-output"></p>');
    // '<pre id="svg-container" style="background-color:white;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;width:81vw;height:80vh"></pre>');

  });

  svg = d3.select("#svg-container").append("svg")
  // .attr("width","100%")
  // .attr("height", "100%")
  .attr("width",viewerWidth)
  .attr("height",viewerHeight)
  .attr("preserveAspectRatio", "xMinYMid meet")
  .attr("display", "block")

  var svg_container = $("#svg-container");
  viewerWidth = svg_container.width();
  viewerHeight = svg_container.height();
}


define(function () {
    window.d3_loaded = false;
  return {
      name: "Heuristic Viz",
      author: "Caitlin Aspinall",
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
            selectChoice: showTree
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
