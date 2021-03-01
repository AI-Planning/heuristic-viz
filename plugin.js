// Temp tree data 
var treeData = [
  {
    "name": "Top Level",
    "parent": "null",
    "value": 5,
    "type": "black",
    "level": "blue",
    "children": [
      {
        "name": "Level 2: A",
        "parent": "Top Level",
        "value": 5,
        "type": "grey",
        "level": "blue",
        "children": [
          {
            "name": "Son of A",
            "parent": "Level 2: A",
            "value": 5,
            "type": "steelblue",
            "level": "blue"
          },
          {
            "name": "Daughter of A",
            "parent": "Level 2: A",
            "value": 5,
            "type": "steelblue",
            "level": "blue"
          }
        ]
      },
      {
        "name": "Level 2: B",
        "parent": "Top Level",
        "value": 5,
        "type": "grey",
        "level": "blue"
      }
    ]
  }
];

var tree, root, svg, diagonal, treeHeight, stateCounter,i, duration;

function makeTree(){
  window.toastr.info("Make Tree is Running")
  var margin = {top: 20, right: 120, bottom: 20, left: 120},
	   width = 960 - margin.right - margin.left,
	   height = 500 - margin.top - margin.bottom,
     center = [width/2, height/2],
     focus = center;

  i=0;
  duration = 750;

  //degine tree using D3
  tree = d3.layout.tree().size([height, width]);
  diagonal = d3.svg.diagonal().projection(function(d){return[d.y,d.x];});

  //svg: scalable vector graphics
  svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");

  root = treeData[0];
  root.x0 = height/2;
  root.y0 = 0;

  function collapse(d){
    if (d.children){
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  console.log(root);
  update(root);
  d3.select(self.frameElement).style("height", "800px");
}

function update(source){
  var nodes = tree.nodes(root).reverse(), links = tree.links(nodes);

  nodes.forEach(function(d) { d.y = d.depth * 180; });

  var node = svg.selectAll("g.node")
	  .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var nodeEnter = node.enter().append("g")
	  .attr("class", "node")
	  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
    .on("click", click);

  nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", "#00008B");

  nodeEnter.append("text")
    	  .attr("x", function(d) {
    		  return d.children || d._children ?
    		  (d.value + 4) * -1 : d.value + 4 })
    	  .attr("dy", ".35em")
    	  .attr("text-anchor", function(d) {
    		  return d.children || d._children ? "end" : "start"; })
    	  .text(function(d) { return d.name; })
    	  .style("fill-opacity", 1e-6);

  var nodeUpdate = node.transition().duration(duration)
  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
    .attr("r", 4.5)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
  	  .style("fill-opacity", 1);

  var nodeExit = node.exit().transition()
  	  .duration(duration)
  	  .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
  	  .remove();

  nodeExit.select("circle")
	  .attr("r", 1e-6);

  nodeExit.select("text")
	  .style("fill-opacity", 1e-6);

    // Update the links…
  var link = svg.selectAll("path.link")
  	  .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  var o = {x: source.x0, y: source.y0};
  link.enter().insert("path", "g")
	  .attr("class", "link")
	  .attr("d", function(d) {
		var o = {x: source.x0, y: source.y0};
		return diagonal({source: o, target: o});
	  });

  // Transition links to their new position.
  link.transition()
	  .duration(duration)
	  .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
	  .duration(duration)
	  .attr("d", function(d) {
		var o = {x: source.x, y: source.y};
		return diagonal({source: o, target: o});
	  })
	  .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
	d.x0 = d.x;
	d.y0 = d.y;
  });
  }

  function click(d) {
    if (d.children) {
  	d._children = d.children;
  	d.children = null;
    } else {
  	d.children = d._children;
  	d._children = null;
    }
    update(d);
  }
/*
--------------------------------------------------------------------------------
                                END OF TREE CODE
--------------------------------------------------------------------------------
*/

// Called when you click 'Go' on the file chooser, we can change this name 
function showTree() {
  console.log("Clicked show tree");
  // Getting string versions of the selected files
  var domText = window.ace.edit($('#domainSelection').find(':selected').val()).getSession().getValue();
  var probText = window.ace.edit($('#problemSelection').find(':selected').val()).getSession().getValue();

  // Lowering the choose file modal menu
  $('#chooseFilesModal').modal('toggle');
  $('#plannerURLInput').show();

  // This parses the problem and domain text, returns from a callback
  StripsManager.loadFromString(probText, domText, function(p, d) {
    // p = Problem
    // d = Domain
    console.log(p);
    console.log(d);

    // Want to work from here to specify states and such, going to have to figure out
    // how to dynamically update the visuals based on current state and possible next states?
  });

  // Calls launchviz which just makes a new tab with a button to make the dummy data tree
  launchViz();
}

function launchViz(){
  window.new_tab('Viz2.0', function(editor_name){
    $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>' +
    '<button onclick="makeTree()" style="float:right;margin-left:16px">makeTree</button>' +
    '<node circle style ="fill:#fff;stroke:black;stroke-width:3px;></node circle>' +
    '<p id="hv-output"></p>');
  });
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
          require.config({ paths: { d3: "https://d3js.org/d3.v3.min" }});
          require(["d3"], function(d3) { window.d3_loaded = true});

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
