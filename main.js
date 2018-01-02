var svgDiv = document.getElementById('svg');
var width = svgDiv.clientWidth;
var height = svgDiv.clientHeight;


var svg = d3.select('.viz')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

    var g = svg.append("g");
    

var timelineSVG;

var projection = d3.geoMercator()
    .scale(width / 10)
    .translate([width / 2, height / 1.5]);
var path = d3.geoPath().projection(projection);
var timeParse = d3.timeParse("%d/%m/%Y %H:%M");
var t = d3.timeParse("%d/%m/%Y %H:%M")('10/10/1962 20:00');
var centered;
formatMonth = d3.timeFormat("%B");
formatYear = d3.timeFormat("%Y");
console.log(t)
console.log(formatMonth(t) + formatYear(t));

// d3.csv('ufo-sightings/countries.csv',function(data){
//     var entries= d3.nest()
//     .key(function(d){
//         return d.parsedCountry
//     })
//     .entries(data);
//     console.log(entries);
// })


d3.json('world.geo.json', function (d) {
    console.log(d);



    d3.csv('ufo-sightings/countries.csv', function (data) {
        var durationMin = d3.min(data, function (d) { return d.durationSeconds });
        var durationMax = d3.max(data, function (d) { return d.durationSeconds });
        var circleScale = d3.scaleSqrt().domain([durationMin, durationMax]).range([3, 30])
        var circleScale = d3.scaleSqrt().domain([durationMin, durationMax]).range([3, 30])

        var entries = d3.nest()
            .key(function (d) {
                //var date=timeParse(d.datetime);
                return d.parsedCountry

            })
            .entries(data);
        console.log(entries);

        var countMin = d3.min(entries, function (d) { return d.values.length });
        var countMax = d3.max(entries, function (d) { return d.values.length });
        console.log(countMin + '  ' + countMax)
        var choroplethScale = d3.scaleLinear().domain([countMin, countMax])
            .range([d3.rgb("#d2cb93"), d3.rgb('#447e3d')]);
        //console.log(choroplethScale(80))

        var colorScale = d3.scaleSqrt().domain([durationMin, durationMax])
            .range([d3.rgb("#D27857"), d3.rgb('#351A11')]);

        //draw countries
        var countries = g.selectAll('path')
            .data(d.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'country')
            .attr('country-name',function(d){
                return d.properties.admin
            })
            .attr('fill', function (d) {
                //console.log( d.properties.admin);
                var id = entries.filter(function (data) {
                    return data.key == d.properties.admin
                });
                if (id[0]) {
                    return choroplethScale(id[0].values.length)
                } else {
                    return '#bcbcbc'
                }

            });

        //handle click on countries
        countries
            .on('click', function (d) {
                var selectedCountry = d3.select(d3.event.target).attr('country-name');
                loadCountry(selectedCountry,data);
                var isCountryClicked = d3.select(d3.event.target).classed('country');
                console.log(isCountryClicked);
                if(isCountryClicked){
                    
                    if (d && centered !== d) {
                        var centroid = path.centroid(d);
                        x = centroid[0] ;
                        y = centroid[1] + 100 ;
                        k = 3;
                        centered = d;
                        console.log(centroid[1]);
                        $('#viz-timeline').addClass('open',750,'easeInOut');

                      } else {
                        x = width / 2;
                        y = height / 2;
                        k = 1;
                        centered = null;
                        console.log('unzoomed')
                        $('#viz-timeline').removeClass('open',750,'easeInOut');
                        $('#detail-box').css({'display':'none'});
                        $('#timeline-country').text('');
                        $('#timeline-count').text('');
                      }

                      g.selectAll("path")
                      .classed("active", centered && function(d) { return d === centered; });
                      g.transition()
                      .duration(750)
                      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                      .style("stroke-width", 1.5 / k + "px");

                  
                }
               
                
            })
            .on('mouseover', function (d) {
                d3.select(this)
                    .attr('stroke-width', 2)
                    .attr('stroke', '#A3ADC2')
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr('stroke-width', 0)
                    .attr('stroke', 'none')
            })

    });

    
    svg.on('click', function (d, i) {
        var isCountryClicked = d3.select(d3.event.target).classed('country');
        console.log(isCountryClicked)
        if (isCountryClicked) {
            console.log('country clicked')
            
        }else {
            console.log('country not clicked')
            //$('#viz-timeline').css({ bottom: -300 });
            $('#viz-timeline').removeClass('open',750,'easeInOut');
            g.transition()
            .duration(750)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + 1+ ")translate(" + -width/2 + "," + -height/2 + ")")
            .style("stroke-width", 1.5 / k + "px");
            $('#detail-box').css({'display':'none'});
            $('#timeline-country').text('');
            $('#timeline-count').text('');
        }
    })

    function loadCountry(country, data) {
        var countryData=[];
        countryData = data.filter(function (d) {
             return d.parsedCountry == country
        })
        
        g.selectAll("circle").remove();
        g.selectAll('.year-group').remove();
        if (timelineSVG) {
            timelineSVG.remove();
        }
        console.log(countryData);
        
        if (countryData) {
            loadUFOLocations(countryData);
        } else {
            //$('#viz-timeline').css({bottom:-300});
            
        }
        

        console.log(d3.max(data,function(d){return timeParse(d.datetime)}))
        loadTimeline('#timeline', countryData, {
            country:country,
            count:countryData.length,
            yearStart:d3.min(data,function(d){return timeParse(d.datetime)}),
            yearEnd:d3.max(data,function(d){return timeParse(d.datetime)})
        });

    }
    var UFOLocationsLoaded = false;
    function loadUFOLocations(locationData) {

        var durationMin = d3.min(locationData, function (d) { return d.durationSeconds });
        var durationMax = d3.max(locationData, function (d) { return d.durationSeconds });
        var colorScale = d3.scaleSqrt().domain([durationMin, durationMax])
            .range([d3.rgb("#D27857"), d3.rgb('#351A11')]);

        if (true) {
            g.selectAll('circle')
                .data(locationData)
                .enter()
                .append('circle')
                .attr('cx', function (d) {

                    return projection([d.longitude, d.latitude])[0]
                })
                .attr('cy', function (d) {
                    return projection([d.longitude, d.latitude])[1]
                })
                .attr('r', function (d) {
                    //return circleScale(d.durationSeconds)
                    return 5
                })
                .attr('class', 'city')
                .attr('id', function (d, i) {
                    return 'city' + d.uid;
                })
                .style('fill', '#222')
                .style('opacity', 0.6)
                .append('title')
                //.on('click',detailClick)

            UFOLocationsLoaded = true;

        } else {
            UFOLocationsLoaded = false;
            //svg.selectAll("circle").remove()
            console.log(UFOLocationsLoaded);
        }
    }


    function loadUFOTimelines(data) {


        var yearlyData = d3.nest()
            .key(function (d) {
                return formatMonth(timeParse(d.datetime))
            })
            .entries(data);
        console.log(yearlyData)
        var elem = svg
            .selectAll('g')
            .data(yearlyData);

        var elemEnter = elem
            .enter()
            .append('g')
            .attr('class', 'year-group');

        var yearRectangle = elemEnter
            .append('rect')
            .attr('x', function (d, i) {
                return i * 100
            })
            .attr('y', height - 200)
            .attr('width', 100)
            .attr('height', 30)
            .attr('fill', 'red')
            .attr('stroke-width', 2)
            .attr('stroke', 'white')


        var yearText = elemEnter
            .append('text')
            .text(function (d) {
                return d.key
            })
            .attr('fill', 'black')
            .attr('x', function (d, i) {
                return i * 100
            })
            .attr('y', height - 200)

        var uniqueYears = [];
        uniqueYears.push({
            key: 'abc',
            value: 1
        })

        var allInstances = elemEnter
            .append('circle')
            .attr('cx', function (d, i) {
                //uniqueYears[i]=uniqueYears[i]+1;
                var t = d.key;

                var z = uniqueYears.find(function (x) {

                    return x.key == parseInt(d.key);
                });
                console.log(z);
                if (!z) {
                    console.log('alrady');
                    uniqueYears.push({
                        key: t,
                        value: 1
                    })
                } else {
                    uniqueYears[d.key]++;
                }





                return uniqueYears.length * 100;
            })
            .attr('cy', function (d, i) {
                //console.log(uniqueYears)
                // var t =  uniqueYears.find(function(x){
                //     return x.key==d.key
                // })
                // //console.log(t)
                // return height - (uniqueYears[d.key] * 30) ;
            })
            .attr('fill', 'red')
            .attr('r', '15')
        console.log(uniqueYears);
        var t = uniqueYears.find(function (x) {
            return x.key == 1979
        })
        console.log(t);

    }


    d3.select(window).on('resize', resize);
    function resize() {

        width = parseInt(d3.select('#svg').style('width'));
        height = parseInt(d3.select('#svg').style('height'));

        // update projection
        projection
            .translate([width / 2, height / 1.5])
            .scale(width / 10);

        // resize the map container
        g
            .style('width', width + 'px')
            .style('height', height + 'px');
        console.log(width);

        g.selectAll('path').attr('d', path)
        g.selectAll('circle')
            .attr('cx', function (d) {

                return projection([d.longitude, d.latitude])[0]
            })
            .attr('cy', function (d) {
                return projection([d.longitude, d.latitude])[1]
            })
            .attr('r', function (d) {
                return 3
            })
    }


})
