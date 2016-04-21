function Multiline(attributes) {
    /**
    quorra.multiline()

    Line plot with sections of different relative scaling.

    @author <bprinty@gmail.com>
    */
    var _this = this;
    if (typeof attributes == 'undefined') attributes = {};

    // plot-specific attributes
    QuorraPlot.call(this, extend({
        class: "quorra-multiline",
        points: 0,
        size: 3,
        layout: "line",
        interpolate: "linear",
        margin: {"top": 30, "bottom": 20, "left": 0, "right": 70},
        yranges: {}
    }, attributes));
    this.type = "multiline";

    // overwrite axes method
    this.axes = function() {
        quorra.log('redrawing axes');

        // parameterize axes scaling
        var domain = _this.attr.xrange === "auto" ? _this.domain : _this.attr.xrange;
        var range = _this.attr.yrange === "auto" ? _this.range : _this.attr.yrange;

        // x scale formatting
        _this.xord = d3.scale.ordinal()
            .domain(_this.domain)
            .range(_.range(_this.domain.length));
        _this.xordrev = d3.scale.ordinal()
            .domain(_this.xord.range())
            .range(_this.xord.domain());
        _this.xmapper = function(d) { return _this.xord(d); };
        if (typeof domain[0] === 'string') {
            domain = _.map(domain, _this.xmapper);
            domain[0] = domain[0] - 0.5;
            domain[domain.length - 1] = domain[domain.length - 1] + 0.5;
        }
        _this.xscale = d3.scale.linear()
            .domain([domain[0], domain[domain.length-1]])
            .range([0, _this.innerwidth]);

        // x axis formatting
        _this.xaxis = d3.svg.axis().scale(_this.xscale).orient('top');
        if (_this.attr.xticks !== "auto") {
            _this.xaxis = _this.xaxis.ticks(_this.attr.xticks);
        }
        if (_this.attr.xformat !== "auto") {
            _this.xaxis = _this.xaxis.tickFormat(_this.attr.xformat);
        }
        if (typeof domain[0] == 'string') {
            domain = _.map(domain, _this.xord);
        }
        _this.xaxis = _this.xaxis.tickValues(_.range(
            Math.ceil(domain[0]),
            Math.floor(domain[domain.length - 1]) + 1
        )).tickFormat(_this.xordrev).tickSize(0).tickPadding(15);

        // x axis
        _this.plotregion
            .append("g")
            .attr("class", "x axis")
            .call(_this.xaxis);

        _this.plotregion.selectAll(".x.axis .domain").remove();

        // y scale formatting
        _this.yscale = d3.scale.linear()
            .domain([0, 1])
            .range([_this.innerheight, 0]);
        _this.yscales = [];
        _this.yaxes = [];
        var xdiff = _this.xscale(1) - _this.xscale(0);
        for (var i=0; i<_this.domain.length; i++) {
            var xdat = _.filter(_this.data, function(d){ return d.x === _this.domain[i]; });
            xdat = _.map(xdat, function(d){ return d.y; });
            
            // configure scaling for each x group
            if (_this.attr.yranges[_this.domain[i]] !== undefined) {
                var domain = _this.attr.yranges[_this.domain[i]];
            } else {
                var domain = [_.min(xdat), _.max(xdat)];
            }
            var scale = d3.scale.linear()
                .domain(domain)
                .range([0, 1]);
            _this.yscales.push(scale);
            var vscale = d3.scale.linear()
                .domain(domain)
                .range(_this.yscale.range()).nice();

            // set up each vertical axis
            var axis = d3.svg.axis().scale(vscale).orient('left')
            if (_this.attr.yticks !== "auto") {
                axis = axis.ticks(_this.attr.yticks);
            }
            if (_this.attr.yformat !== "auto") {
                axis = axis.tickFormat(_this.attr.yformat);
            }
            _this.yaxes.push(axis);

            _this.plotregion
                .append("g")
                .attr("transform", "translate(" + _this.xscale(i) + ",0)")
                .attr("class", "y axis")
                .call(axis);
        }
    }

    // overwrite render method
    this.plot = function() {
        quorra.log('drawing plot data');

        // draw lines
        var ugrps = _this.pallette.domain();
        for (var grp in ugrps) {

            // configuring path
            var path = d3.svg.line()
                .x(function(d, i) { return _this.xscale(_this.xmapper(_this.attr.x(d, i))); })
                .y(function(d, i) {
                    return _this.yscale(_this.yscales[_this.xord(d.x)](d.y));
                })
                .interpolate(_this.attr.interpolate);

            // lines
            var subdat = _.filter(_this.data, function(d){ return d.group === ugrps[grp]; });
            _this.plotarea.append("path")
                .datum(subdat)
                .attr("class", function(d, i){
                    return "line " + "g_" + d[0].group;
                })
                .attr("d", function(d){
                    var p = path(d);
                    if (_this.attr.layout === "line") {
                        return p;
                    } else if (_this.attr.layout === "area") {
                        return [
                            p,
                            "L" + _this.xscale(_this.xmapper(_this.domain[_this.domain.length - 1])) + "," + _this.yscale(0),
                            "L" + _this.xscale(_this.xmapper(_this.domain[0])) + "," + _this.yscale(1),
                            "Z"
                        ].join('');
                    }
                })
                .style("fill", function(d){
                    if (_this.attr.layout === "line") {
                        return "none";
                    } else if (_this.attr.layout === "area") {
                        return _this.pallette(d[0].group);
                    }
                })
                .style("stroke", _this.pallette(ugrps[grp]))
                .style("stroke-width", _this.attr.size)
                .style("opacity", _this.attr.opacity)
                .style("visibility", function(d, i) {
                    return _.contains(_this.attr.toggled, _this.attr.group(d[0], i)) ? 'hidden' : 'visible';
                })
                .on("mouseover", function(d, i) {
                    if (_this.attr.hovercolor !== false) {
                        _this.plotarea.selectAll('.dot.g_' + d[0].group).style("fill", _this.attr.hovercolor);
                        _this.plotarea.selectAll('.line.g_' + d[0].group).style("stroke", _this.attr.hovercolor);
                    } else {
                        _this.plotarea.selectAll('.g_' + d[0].group).style("opacity", 0.25);
                    }
                    if (_this.attr.tooltip){
                        _this.attr.tooltip.html(d[0].group)
                            .style("visibility", "visible")
                            .style("left", (d3.event.clientX + 5) + "px")
                            .style("top", (d3.event.clientY - 20) + "px");
                    }
                }).on("mousemove", function(d) {
                    if (_this.attr.tooltip) {
                        _this.attr.tooltip
                            .style("left", (d3.event.clientX + 5) + "px")
                            .style("top", (d3.event.clientY - 20) + "px");
                    }
                }).on("mouseout", function(d, i) {
                    if (_this.attr.hovercolor !== false) {
                        _this.plotarea.selectAll('.dot.g_' + d[0].group).style("fill", _this.pallette(d[0].group));
                        _this.plotarea.selectAll('.line.g_' + d[0].group).style("stroke", _this.pallette(d[0].group));
                    } else {
                        _this.plotarea.selectAll('.g_' + d[0].group).style("opacity", _this.attr.opacity);
                    }
                    if (_this.attr.tooltip) {
                        _this.attr.tooltip.style("visibility", "hidden");
                    }
                }).on("click", _this.attr.groupclick);

        }

        // draw points (if specified)
        if (_this.attr.points > 0) {

            _this.plotarea.selectAll(".dot")
                .remove().data(_this.data)
                .enter().append("circle")
                .attr("class", function(d, i){
                    return "dot " + "g_" + d.group;
                })
                .attr("r", _this.attr.points)
                .attr("cx", function(d, i) { return _this.xscale(_this.xmapper(_this.attr.x(d, i))); })
                .attr("cy", function(d, i) { return _this.yscale(_this.yscales[_this.xord(d.x)](d.y)); })
                .style("fill", function(d, i){ return _this.pallette(_this.attr.group(d, i)); })
                .style("opacity", _this.attr.opacity)
                .style("visibility", function(d, i) {
                    return _.contains(_this.attr.toggled, _this.attr.group(d, i)) ? 'hidden' : 'visible';
                })
                .on("mouseover", function(d, i){
                    if (_this.attr.hovercolor !== false) {
                        _this.plotarea.selectAll('.dot.g_' + d.group).style("fill", _this.attr.hovercolor);
                        _this.plotarea.selectAll('.line.g_' + d.group).style("stroke", _this.attr.hovercolor);
                    } else {
                        _this.plotarea.selectAll('.g_' + d.group).style("opacity", 0.25);
                    }
                    if (_this.attr.tooltip){
                        _this.attr.tooltip.html(_this.attr.label(d, i))
                            .style("visibility", "visible")
                            .style("left", (d3.event.clientX + 5) + "px")
                            .style("top", (d3.event.clientY - 20) + "px");
                    }
                }).on("mousemove", function(d){
                    if (_this.attr.tooltip){
                        _this.attr.tooltip
                            .style("left", (d3.event.clientX + 5) + "px")
                            .style("top", (d3.event.clientY - 20) + "px");
                    }
                }).on("mouseout", function(d, i){
                    if (_this.attr.hovercolor !== false) {
                        _this.plotarea.selectAll('.dot.g_' + d.group).style("fill", _this.pallette(_this.attr.group(d, i)));
                        _this.plotarea.selectAll('.line.g_' + d.group).style("stroke", _this.pallette(_this.attr.group(d, i)));
                    } else {
                        _this.plotarea.selectAll('.g_' + d.group).style("opacity", _this.attr.opacity);
                    }
                    if (_this.attr.tooltip){
                        _this.attr.tooltip.style("visibility", "hidden");
                    }
                }).on("click", _this.attr.labelclick);
        }

    }

    return this.go;
}

Multiline.prototype = Object.create(QuorraPlot.prototype);
Multiline.prototype.constructor = Multiline;
quorra.multiline = function(attributes) {
    return new Multiline(attributes);
};
