var shapeSVGEnter

function loadTimeline(dom, data, options) {
    $('#detail-box').css({ 'display': 'none' });
    $('#timeline').css({ 'display': 'block' })
    $('#shape-chart').css({ 'display': 'none' })

    var dataByShape = d3.nest()
        .key(function (d) {
            return d.shape
        })
        .rollup(function (v) { return v.length; })
        .entries(data);
    var sortedData = dataByShape.sort(function (x, y) {
        return d3.descending(x.value, y.value)
    })
    var sortedData = sortedData.filter(function (d) {
        return d.value > 4
    })
    console.log(sortedData)

    //sort by shape

    shapeSVG = d3.select('#shape-chart')
        .append('svg')
        .attr('width', width * 0.75)
        .attr('height', 300)
        .attr("transform", "translate(" + width * 0.125 + "," + 0 + ")")

    var radScale = d3.scaleLinear()
        .domain(d3.extent(sortedData, function (d) { return d.value }))
        .range([30, 150])
    //console.log(d3.extent(data,function(d){return d.value}))
    shapeSVGEnter = shapeSVG
        .selectAll('g')
        .data(sortedData)
        .enter()
        .append('g')
        .filter(function (d) {
            return d.value > 4
        })
        .attr("transform", "translate(" + 60 +"," + 0 + ")")
    shapeSVGEnter

        .append('svg:image')
        .attr("xlink:href", function (d) {

            return "images/" + d.key + ".svg"
        })
        // .attr("width", function(d){
        //     return radScale(d.value)
        // })
        .attr("height", function (d) {
            return radScale(d.value)
        })
        .attr('class', 'shape-icon')
        .attr('fill', 'white')
        .attr('x', function (d, i) {
            return i * (width * 0.75 / sortedData.length) - radScale(d.value) / 2 + 10
        })
        .attr('y', function (d) {
            //console.log()
            return 150 - radScale(d.value) / 2
        })


    shapeSVGEnter
        .append('text')
        .text(function (d) {
            return d.key
        })
        .attr('x', function (d, i) {
            return i * (width * 0.75 / sortedData.length)
        })
        .attr('y', function (d) {
            return 220
        })
        .style("text-anchor", "middle")



    shapeSVGEnter
        .append('text')
        .text(function (d) {
            return d.value
        })
        .attr('x', function (d, i) {
            return i * (width * 0.75 / sortedData.length)
        })
        .attr('y', function (d) {
            return 240
        })
        .style("text-anchor", "middle")



    timelineSVG = d3.select(dom)
        .append('svg')
        .attr('width', width * 0.75)
        .attr('height', 300)

        .attr("transform", "translate(" + width * 0.125 + "," + 0 + ")")
    var yDurationScale = d3.scaleLog()
        .domain([1, d3.max(data, function (d) { return parseInt(d.durationSeconds) })])
        .range([0, 200]);

    var sl = d3.scaleLog().domain([0, 2167]).range([0, 200])
    //console.log(yDurationScale(37800))
    var xTimeScale = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return timeParse(d.datetime) }))
        .range([0, width * 0.75]);


    // define the y axis
    var yAxis = d3.axisLeft(yDurationScale)


    // define the y axis
    var xAxis = d3.axisBottom(xTimeScale)
    //.tickSize(-200)


    var timelineEnter = timelineSVG
        .selectAll('g')
        .data(data)
        .enter()
        .append('g');
    console.log(options.count)
    $('#timeline-country').text(options.country);
    $('#timeline-count').text(options.count);
    $('#fromYear').text(formatMonth(options.yearStart) +' of '+formatYear(options.yearStart) );
    $('#toYear').text(formatMonth(options.yearEnd) +' of '+formatYear(options.yearEnd));

    var timeAxisRects = timelineEnter
        .append('rect');

    timeAxisRects
        .attr('x', function (d, i) {
            return xTimeScale(timeParse(d.datetime));
        })

        .attr("y", 200)
        .attr('class', 'timeline-bar')
        .transition().duration(1000)
        .ease(d3.easeExp)
        .attr('y', function (d) {
            return 200 - yDurationScale(parseInt(d.durationSeconds) + 1);
        })
        .attr('width', 10)
        .attr('height', function (d) {

            return yDurationScale(parseInt(d.durationSeconds) + 1);
        })
        .attr('fill', '#111')
        .attr('opacity', 0.5);

    timeAxisRects
        .on('click', detailClick )
        .on('mouseout', function (d) {
            d3.select(this).style("cursor", "default");
            d3.selectAll('.city').style('fill', '#ccc')
                .transition().style('opacity', '0.6')
                .attr('r', 5);
        })

    
    .on('mouseover', function (d) {
        //console.log('#city'+d.uid);
        d3.selectAll('.city').style('fill', '#');
        d3.selectAll('.city').transition().style('opacity', '0.2');
        d3.selectAll('#city' + d.uid).style('fill', '#111')
            .style('opacity', '1')
            .transition()
            .ease(d3.easeBounce)
            .attr('r', 20);
        // $('#city'+d.uid).css({'border':'1px solid yellow'})
        d3.select(this).style("cursor", "pointer");
    })

    function detailClick(d){
        d3.selectAll('.timeline-bar')
            .attr('stroke-width', 0)
            .attr('stroke', 'none')
        var l = xTimeScale(timeParse(d.datetime)) + 0.125 * width - 10;
        

        $('#detail-box').css({ 'display': 'block' });

        $('#detail-box').animate({ 'left': l, 'opacity': 1 });
        $('#city').text(d.city);
        $('#country').text(d.country);
        $('#shape').text(d.shape);
        $('#duration').text(d.durationSeconds);
    }

    timelineSVG.append("g")
        .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
        //.attr("transform", "translate(0," + (800) + ")")
        .attr('transform', 'translate(0,' + 200 + ')')
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        //.attr("dy", ".35em")

        .attr('transform', 'translate(-2.5,' + 20 + ') rotate(270)')
        //.attr("transform", "rotate(270)")
        .style("text-anchor", "end")
        .attr('class', 'year-label')




}
$('#timeline-tab').click(function () {
    $('#timeline').css({ 'display': 'block' })
    $('#shape-chart').css({ 'display': 'none' });
    $('.tabs > span').removeClass('active')
    $(this).addClass('active');
})
$('#shape-tab').click(function () {
    $('#timeline').css({ 'display': 'none' })
    $('#shape-chart').css({ 'display': 'block' });
    $('.tabs > span').removeClass('active')
    $(this).addClass('active');
})