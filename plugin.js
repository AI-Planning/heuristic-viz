
function launchViz(){
    window.toastr.success("Sucess");
    var did = prompt('Domain Id?', window.viz_dom_id);
    window.viz_dom_id = did;
    $.getJSON('http://api.planning.domains/json/classical/problems/'+did, function(res){
        if (res.error)
            window.toastr.error(res.message);
        else{
            window.toastr.info("Problems loaded");
            console.log(res)
            var domname =  res.result[0].domain;
            var tab_name = 'BoundViz (' + did +')';
            window.new_tab(tab_name, function(editor_name) {
            
                var html = '<div class = "viz_display">';

                html += '<h2>Lower / Upper Bound Comparison for '+domname+' </h2>';
                html += '</div>'
                $('id'+editor_name).html(html);
            });
        }
    });
}
define(function () {

    //Do setup work here
    window.viz_dom_id = 13;

    return {

        name: "Heuristic Visulaizer",
        author: "Ellie Sekine, Caitlin Aspinall, Cam Cunningham",
        email: "17ees@queensu.ca",
        description: "A plugin for heuristic visualization ",

        initialize: function() {
            // This will be called whenever the plugin is loaded or enabled
            console.log("Loaded");
            window.add_menu_button('Viz', 'vizMenuItem', 'glyphicon-signal',' launchViz()')
            window.inject_styles(
                '.viz_disolay {padding: 20px 0px 0px 40px;}'
            )
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

