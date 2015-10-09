quorra.pie = function(attributes) {
    /**
    quorra.pie()

    Pie chart. Code for generating this type of plot was inspired from:
    http://bl.ocks.org/mbostock/3887235
    
    @author <bprinty@gmail.com>
    */

    // attributes
    var attr = attributeConstructor('pie');
    attr.aggregate = function(x){ return(x[0]); }
    attr.radius = "auto";
    attr.inner = "auto";
    attr = _.extend(attr, attributes);


    // generator
    function go(selection){
        // format selection
        if (typeof selection == "string") selection = d3.select(selection);

        // if height/width are auto, determine them from selection
        var w = (attr.width == "auto") ? (parseInt(selection.style("width")) - attr.margin.left - attr.margin.right) : attr.width;
        var h = (attr.height == "auto") ? (parseInt(selection.style("height")) - attr.margin.top - attr.margin.bottom) : attr.height;
        var r = (attr.radius == "auto") ? (Math.min(w, h) / 2) : attr.radius;
        var ir = (attr.inner == "auto") ? 0 : attr.inner;

        // aggregate data
        var data = selection.data()[0];
        var newdata = [];
        var gps = _.unique(_.map(data, function(d){ return( d.group ); }));
        for (var i in gps){
            var subdat = _.filter(data, function(d){ return d.group == gps[i]; });
            newdata.push({
                x: attr.aggregate(_.map(subdat, function(d){ return d.x; })),
                group: gps[i],
                label: _.map(subdat, function(d){ return d.label; })
            });
        }

        // initialize canvas
        var svg;
        if (selection.select("svg")[0][0] == null){
            svg = selection.append("svg");
        } else {
            svg = selection.select("svg");
        }
        svg = svg.attr("class", "quorra-pie")
            .attr("width", w + attr.margin.left + attr.margin.right)
            .attr("height", h + attr.margin.top + attr.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (w + attr.margin.left + attr.margin.right) / 2 + "," + (h + attr.margin.top + attr.margin.bottom) / 2 + ")");

        var arc = d3.svg.arc()
            .outerRadius(r)
            .innerRadius(ir);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d){ return d.x; });

        // construct legend
        var legend = legendConstructor(svg, attr, w, h);

        // plot
        var g = svg.selectAll(".arc")
            .data(pie(newdata))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d, i) { return attr.color(attr.group(d.data, i)); })
            .style("opacity", 0.75)
            .on("mouseover", function(d, i){
                d3.select(this).style("opacity", 0.25);
                if (attr.tooltip == false) { return 0; }
                attr.tooltip.html(attr.label(d.data, i))
                    .style("opacity", 1)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 20) + "px");
            }).on("mousemove", function(d){
                if (attr.tooltip == false) { return 0; }
                attr.tooltip
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 20) + "px");
            }).on("mouseout", function(d){
                d3.select(this).style("opacity", 0.75);
                if (attr.tooltip == false) { return 0; }
                attr.tooltip.style("opacity", 0);
            });

        // legend (if specified)
        if (attr.legend) {
            g.append("text")
                .attr("class", "axis")
                .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .text(function(d) { return attr.group(d.data, i); });
        }

        // expose editable attributes (user control)
        go.svg = svg;
        go.legend = legend;
        go.arc = arc;
        go.innerWidth = w;
        go.innerHeight = h;
    }

    // bind attributes to constructor
    bindConstructorAttributes(go, attr);

    return go;
};