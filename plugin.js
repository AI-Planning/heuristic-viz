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



function makeTree(){
  window.toastr.info("Make Tree is Running")
  var margin = {top: 20, right: 120, bottom: 20, left: 120},
	   width = 960 - margin.right - margin.left,
	   height = 500 - margin.top - margin.bottom;
  var i=0;

  var tree = d3.layout.tree().size([height, width]);
  var diagonal = d3.svg.diagonal().projection(function(d){return[d.y,d.x];});

  var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");

  var root = treeData[0];

  var nodes = tree.nodes(root).reverse(), links = tree.links(nodes);

  nodes.forEach(function(d) { d.y = d.depth * 180; });

  var node = svg.selectAll("g.node")
	  .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var nodeEnter = node.enter().append("g")
	  .attr("class", "node")
	  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeEnter.append("circle")
        .attr("r", 10)
        .style("fill", "#00008B");

  nodeEnter.append("text")
    	  .attr("x", function(d) {
    		  return d.children || d._children ?
    		  (d.value + 4) * -1 : d.value + 4 })
    	  .attr("dy", ".35em")
    	  .attr("text-anchor", function(d) {
    		  return d.children || d._children ? "end" : "start"; })
    	  .text(function(d) { return d.name; })
    	  .style("fill-opacity", 1);

// adds the links between the nodes
  var link = svg.selectAll("path.link").data(links,function(d) {return d.target.id});

  link.enter().insert("path","g").attr("class","link")
      .style("stroke",function(d){return 1;})
      .attr("d",diagonal);
}


function launchViz(){
  window.viz_dom_id = did;
  var did = prompt('Domain Id?', window.viz_dom_id);
  //window.toastr.info(did + typeof(did));
  if (did == "13"){
   // window.toastr.info("13!");
    window.new_tab('Viz2.0', function(editor_name){
      $('#' +editor_name).html('<div style = "margin:13px 26px"><h2>Viz</h2>' +
      '<button onclick="makeTree()" style="float:right;margin-left:16px">makeTree</button>' +
      '<node circle style ="fill:#fff;stroke:black;stroke-width:3px;></node circle>' +
      '<p id="hv-output"></p>');
    });
  }else{
    window.toastr.into("Else")
  };
}

define(function () {
    window.d3_loaded = false;
    window.viz_dom_id = 13;
  return {

      name: "Heuristic Viz",
      author: "Caitlin Aspinall",
      email: "16cea5@queensu.com",
      description: "Heuristic Visualization",

      initialize: function() {
        console.log("Plugin initialized! :D");
        if ((!window.d3_loaded)){

          require.config({ paths: { d3: "http://d3js.org/d3.v3.min" }});
          require(["d3"], function(d3) { window.d3_loaded = true});

          var style = document.createElement('tree');
          style.innerHTML = '.node { cursor:pointer } .node circle { stroke-width:1.5px } .node text { font:10px sans-serif }' +
                'div.tooltip {position:absolute; padding:6px; font:12px sans-serif; background-color:#FFA; border-radius:8px; pointer-events:none; left:0; top:0}';
          var ref = document.querySelector('script');
          ref.parentNode.insertBefore(style, ref);
        }
        window.add_menu_button('Viz', 'vizMenuItem', 'glyphicon-signal',"launchViz()");
        window.inject_styles(
              '.viz_display {padding: 20px 0px 0px 40px;}')
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
