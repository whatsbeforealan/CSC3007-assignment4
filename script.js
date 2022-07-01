let width = 800, height = 800;

let svg = d3.select("svg")
.attr("viewBox", "0 0 " + width + " " + height)

// Load external data
Promise.all([d3.json("https://chi-loong.github.io/CSC3007/assignments/links-sample.json"), d3.json("https://chi-loong.github.io/CSC3007/assignments/cases-sample.json")]).then(data => {

    // Data preprocessing
    data[0].forEach(e => {
        e.source = e.infector;
        e.target = e.infectee;
    });

    console.log(data[0]); //links
    console.log(data[1]); //cases

    var links = data[0];
    var nodes = data[1];

    // Tooltip
    var tooltip = d3.select(".tooltip")
        .style("background-color", "white")
        .style("border", "solid black 1px")
        .style("position", "absolute")
        .style("font-size", "10px")
        .style("color", "black")
        .style("padding", "10px");

    // Define svg
    let svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    // Define color scale for gender
    let colorScale = d3.scaleOrdinal()
        .domain(["male", "female"])
        .range(["steelblue", "pink"]);

    // Define color scale for vaccination status
    let colorScaleVac = d3.scaleOrdinal()
        .domain(["Yes", "Partial", "No"])
        .range(["lightgreen", "#FEE08B", "red"]);

    let xPosition = d3.scaleOrdinal()
        .domain([0, 1, 2])
        .range([300, 200, 650]);

    // Defining and appending the Arrows
    svg.append("svg:defs").selectAll("marker")
        .data(["end"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -10 10 20")
        .attr("refX", 27)
        .attr("refY", -2.55)
        .attr("markerWidth", 20)
        .attr("markerHeight", 20)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .style('stroke', 'none');

    // Defining the link path
    let linkpath = svg.append("g")
        .attr("id", "links")
        .selectAll("path")
        .data(data[0])
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        //append the arrows
        .attr("marker-end", "url(#end)")
        .attr("stroke-width", "1px");

    // Defining and appending the nodes
    let node = svg.append("g")
                    .attr("id", "nodes")
                    .selectAll("circle")
                    .data(data[1])
                    .enter()
                    .append("circle")
                    .attr("r", 20)
                    .style("fill", d => {
                        if (d.gender == "male") 
                        return colorScale("male");
                        else 
                        return colorScale("female");
                    })
                    .on("mouseover", function (event, d) {
                        tooltip
                            .transition()
                            .duration(100)
                            .style("visibility", "visible")
                            .style("opacity", 5)
                        d3.select(this)
                            .style("stroke", "black")
                            .style("stroke-width", 3)
                            .style("opacity", 1)


                        tooltip
                            .html("Id: " + d.id + "<br>" +
                                "Age: " + d.age + "<br>" +
                                "Nationality: " + d.nationality + "<br>" +
                                "Occupation: " + d.occupation + "<br>" +
                                "Organization: " + d.organization + "<br>" +
                                "Date: " + d.date + "<br>" +
                                "Serology: " + d.serology + "<br>" +
                                "Vaccination: " + d.vaccinated + "<br>")
                            .style("top", (event.pageY) + "px")
                            .style("left", (event.pageX) + "px")
                    })
                    .on("mouseout", function (event, d) {
                        tooltip
                            .transition()
                            .duration(100)
                            .style("visibility", "hidden")
                        d3.select(this)
                            .style("stroke", "none")
                            .style("opacity", 1)
                    })
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));

    // Displaying legend for gender
    var legend = d3.legendColor()
                    .labels(["Male", "Female"])
                    .scale(colorScale)
                    .shapeWidth(10)
                    .orient("vertical")
                    .title("Gender");

    // Displaying legend for vaccination status
    var legendVac = d3.legendColor()
                        .labels(["Vaccinated (2 doses)", "Partial (1 dose)", "No (0 dose)"])
                        .scale(colorScaleVac)
                        .shapeWidth(10)
                        .orient("vertical")
                        .title("Vaccination Status");

    //Appending the legend
    svg.append("g")
        .attr("transform", "translate(350,20)")
        .call(legend);

    //Appending the legend
    svg.append("g")
        .attr("transform", "translate(500,20)")
        .call(legendVac);

    // Adding the nodes
    var circles = node.append("circle")
                        .attr("r", 10)
                        .style("fill", d => colorScale(d.gender))

    // Adding the gender icon images to the nodes
    let image = svg.append("g")
                    .selectAll("image")
                    .data(data[1])
                    .enter()
                    .append("image")
                    .attr("xlink:href", function (d) {
                        if (d.gender == "male") return "/male.png"; else return "/female.png";
                    })
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("pointer-events", "none");


    // binding the data to the simulation
    let simulation = d3.forceSimulation(nodes)
                        .nodes(data[1])
                        .force("x", d3.forceX().strength(0.1).x(width/2))
                        .force("y", d3.forceY().strength(0.1).y(height / 2))
                        .force("charge", d3.forceManyBody().strength(-30))
                        .force("collide", d3.forceCollide().strength(0.1).radius(40))
                        .force("link", d3.forceLink(links).id(d => d.id).distance(100).strength(0.5))
                        .on("tick", d => {
                            node.attr("cx", d => d.x)
                                .attr("cy", d => d.y);

                            linkpath.attr("d", d => {
                                    var dx = d.target.x - d.source.x,
                                        dy = d.target.y - d.source.y,
                                        dr = Math.sqrt(dx * dx + dy * dy);
                                    return "M" + d.source.x + "," + d.source.y + "A" +
                                        dr + "," + dr + " 0 0,1 " + " " + d.target.x + "," + d.target.y
                                });

                            image.attr("x", d => d.x - 10)
                                .attr("y", d => d.y - 10);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
    }

    d3.select("#group1").on("click", function () {
    simulation.force(
            "x",
            d3
                .forceX()
                .strength(0.2)
                .x((d) => {
                    if (d.gender == "male") return xPosition(0);
                    else if (d.gender == "female") return xPosition(2);
                })
        )
        .force(
            "y",
            d3
                .forceY()
                .strength(0.2)
                .y(height / 2)
        )
        .alphaTarget(0.3)
        .restart();

    d3.selectAll("circle")
        .style("fill", (d) => {
            if (d.gender == "male") return colorScale("male");
            else return colorScale("female");
        })
        .attr("stroke-width", 0);

    var legend = d3.select('.legend')
        .selectAll('.cell')
        .remove();

    svg.select(".legend")
        .call(legend);

    })


    d3.select("#group2").on("click", function () {
    simulation.force(
            "x",
            d3
                .forceX()
                .strength(0.2)
                .x((d) => {
                    if (d.vaccinated.includes("yes")) return xPosition(0);
                    else if (d.vaccinated.includes("no")) return xPosition(2);
                    else return xPosition(1);
                })
        )
        .force(
            "y",
            d3
                .forceY()
                .strength(0.2)
                .y(height / 2)
        )
        .alphaTarget(0.3)
        .restart();

    d3.selectAll("circle")
        .style("fill", (d) => {
            if (d.vaccinated.includes("yes")) return colorScaleVac(0);
            else if (d.vaccinated.includes("no")) return colorScaleVac(2);
            else return colorScaleVac(1);
        })
        .attr("stroke-width", 0);

    })
})
