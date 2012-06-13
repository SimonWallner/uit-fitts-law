// "use strict";

function brk() {
	1 + 1;
}


var testDimension = {top: 30, right: 30, bottom: 30, left: 30};
testDimension.width = 620 - (testDimension.left + testDimension.right);
testDimension.height = 400 - (testDimension.top + testDimension.bottom);

var plotPositionDimension = {top: 30, right: 30, bottom: 30, left: 30};
plotPositionDimension.width = 300 - (plotPositionDimension.left + plotPositionDimension.right);
plotPositionDimension.height = 198 - (plotPositionDimension.top + plotPositionDimension.bottom);

var plotVelocitiesDimension = {top: 30, right: 30, bottom: 30, left: 30};
plotVelocitiesDimension.width = 300 - (plotVelocitiesDimension.left + plotVelocitiesDimension.right);
plotVelocitiesDimension.height = 198 - (plotVelocitiesDimension.top + plotVelocitiesDimension.bottom);

var plotHitsDimension = {top: 15, right: 15, bottom: 15, left: 15};
plotHitsDimension.width = 140 - (plotHitsDimension.left + plotHitsDimension.right);
plotHitsDimension.height = 140 - (plotHitsDimension.top + plotHitsDimension.bottom);

var plotScatterDimension = {top: 30, right: 30, bottom: 30, left: 50};
plotScatterDimension.width = 300 - (plotScatterDimension.left + plotScatterDimension.right);
plotScatterDimension.height = 200 - (plotScatterDimension.top + plotScatterDimension.bottom);



function rHit(r, rTarget) {
	return ((plotHitsDimension.width / 2) / rTarget) * r;
};

var maxV = 1; // pixel/ms
function v(v) {
	var colour = 'rgb(' + clampInt(0, 255, (v / maxV) * 255) + ', 0, 0)';
	return colour;
};

var scatterX = d3.scale.linear()
	.domain([0, 5])
	.range([0, plotScatterDimension.width]);

var scatterY = d3.scale.linear()
	.domain([3000, 0])
	.range([0, plotScatterDimension.height]);


var fittsTest = {
	target: {x: 0, y: 0, r: 10},
	start: {x: 0, y: 0, t: 0},
	last: {},
	
	currentPath: [],
	active: false,
	
	// contains the test data
	// i.e. tupels with amplitude, width, time, start, target, hit, ID
	data: [],
	sumID: 0,
	sumTime: 0,
	
	generateTarget: function() {
		this.target.x = randomAB(testDimension.left, testDimension.width);
		this.target.y = randomAB(testDimension.top, testDimension.height);
		testAreaSVG.append('svg:circle')
			.attr('id', 'target')
			.attr('cx', this.target.x)
			.attr('cy', this.target.y)
			.attr('r', this.target.r)
			.style('fill', 'red');
		
		this.active = true;
	},
	
	removeTarget: function() {
		testAreaSVG.selectAll('#target').remove();
		this.active = false;
		this.currentPath = [];
	},
	
	mouseClicked: function(x, y) {
		
		if (distance({x: x, y: y}, this.target) < this.target.r) {
			this.addDataPoint({start: this.start,
							   target: this.target,
							   path: this.currentPath,
							   hit: {x: x, y: y, t: (new Date).getTime()}});
			this.removeTarget();


			this.generateTarget();			
			this.last = {x: x, y: y, t: (new Date).getTime()};
			this.start = this.last;
			this.currentPath.push(this.last);
		}
	},
	
	mouseMoved: function(x, y) {
		if (this.active) {
			if (x == this.last.x && y == this.last.y) {
				return
			}
			
			var newPoint = {x: x, y: y, t: (new Date).getTime()}
			this.currentPath.push(newPoint)
			
			var dt = newPoint.t - this.last.t;
			var dist = distance(this.last, {x: x, y: y})
			var speed = dist / dt;
			
			testAreaSVG.append('svg:line')
				.attr('class', 'path')
				.attr('x1', this.last.x)
				.attr('x2', newPoint.x)
				.attr('y1', this.last.y)
				.attr('y2', newPoint.y)
				.style('stroke', v(speed))
				.transition()
					.duration(5000)
					.style('stroke-opacity', 0)
					.remove();
				
			this.last = newPoint;
		}
	},
	
	addDataPoint: function(data) {
		// add point to data array for plotting into ID/time scatter plot
		
		var dt = data.hit.t - data.start.t;
		var id = shannon(distance(data.target, data.start), data.target.r * 2);
		
		if (dt < 3000) { // skip if obvious outlier
			this.data.push({time: dt,
					           ID: id});
			this.sumID += id;
			this.sumTime += dt;
				
			var circles = scatterGroup.selectAll('circle')
						.data(this.data);
					
			circles.enter()
				.append('circle')
					.attr('cx', function(d) { return scatterX(d.ID); })
					.attr('cy', function(d) { return scatterY(d.time); })
					.attr('r', 0)
						.transition()
							.duration(200)
							.ease('bounce')
							.attr('r', 3);
			
			// regression, yeay!
			var mID = this.sumID / this.data.length;
			var mt = this.sumTime / this.data.length;
			var ssxy = 0;
			var ssxx = 0;
			
			for (var i = 0; i < this.data.length; i++) {
				ssxy += (this.data[i].ID - mID) * (this.data[i].time - mt);
				ssxx += Math.pow(this.data[i].ID - mID, 2);
			}			
			
			var b = (ssxy / ssxx) || 0;
			var a = mt - b * mID;
			
			var setValues = function(d) {
				return d
					.attr('x1', 0)
					.attr('x2', plotScatterDimension.width)
					.attr('y1', function(d) { return scatterY(d.y1); })
					.attr('y2', function(d) { return scatterY(d.y2); })
			}
			
			var regression = scatterGroup.selectAll('line.regression')
				.data([{y1:a, y2: a + b * 5}]);
			
			regression.enter().append('line')
				.attr('class', 'regression')
				.call(setValues);
			
			regression.transition()
				.call(setValues);
			
			
			
		}
		
		var A = data.start;
		var B = data.target;
		var path = data.path;
		
		var hit = minus(data.hit, data.target);
		plotHitsGroup.append('circle')
			.attr('cx', rHit(hit.x, data.target.r))
			.attr('cy', rHit(hit.y, data.target.r))
			.attr('r', 6)
			.style('fill', 'red')
			.style('opacity', 1)
			.transition()
				.duration(1000)
					.ease('linear')
					.attr('r', 2)
					.style('opacity', 0.5);
		
		var last = {};
		for (var i = 0; i < path.length; i++) {
			var p = path[i];
			
			var q = project(A, B, p);
			var x = distance(q, A) * sign(q.t);
			var y = distance(q, p) * isLeft(A, B, p);
			
			var dt = p.t - last.t;
			var dist = distance(last, {x: x, y: y});
			var speed = dist;// / dt;
			
			if (last) {
				plotPositionGroup.append('svg:line')
					.attr('class', 'path')
					.attr('x1', last.x / 2)
					.attr('x2', x / 2)
					.attr('y1', last.y)
					.attr('y2', y)
					.style('stroke', v(speed))
					.transition()
						.duration(2000)
						.style('stroke-opacity', .1);
				
				plotVelocitiesGroup.append('svg:line')
					.attr('class', 'path')
					.attr('x1', last.x / 2)
					.attr('x2', x / 2)
					.attr('y1', -last.v * 2)
					.attr('y2', -speed * 2)
					.transition()
						.duration(2000)
						.style('stroke-opacity', .1);
					
			}
			
			last.x = x;
			last.y = y;
			last.t = p.t;
			last.v = speed;
		}
	}
};

function randomAB(a, b) {
	return a + Math.random() * b;
}

/**
 * Project a point q onto the line p0-p1
 * Code taken from: http://www.alecjacobson.com/weblog/?p=1486
 */
function project(A, B, p) {
	var AB = minus(B, A);
	var AB_squared = dot(AB, AB);
	if (AB_squared == 0) {
		return A;
	}
	else {
		var Ap = minus(p, A);
		var t = dot(Ap, AB) / AB_squared;
		return {x: A.x + t * AB.x,
				y: A.y + t * AB.y,
				t: t};
	}
}



function mouseMoved()
{
	var m = d3.svg.mouse(this);
	fittsTest.mouseMoved(m[0], m[1])
}

function mouseClicked()
{
	var m = d3.svg.mouse(this);
	fittsTest.mouseClicked(m[0], m[1]);
}

function dot(a, b) {
	return (a.x * b.x) + (a.y * b.y);
}

// coutesy of http://stackoverflow.com/questions/3461453/determine-which-side-of-a-line-a-point-lies
function isLeft(A, B, p){
     return ((B.x - A.x)*(p.y - A.y) - (B.y - A.y)*(p.x - A.x)) >= 0 ? 1: -1;
}

function minus(a, b) {
	return {x: a.x - b.x, y: a.y - b.y};
}

function distance(a, b) {
	var dx = a.x - b.x;
	var dy = a.y - b.y;
	return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function sign(a) {
	return a >=0 ? 1 : -1;
}

function rgb2Hex(r, g, b) {
	return '#' +
		clampInt(0, 255, r).toString(16) +
		clampInt(0, 255, g).toString(16) +
		clampInt(0, 255, b).toString(16);
}

function clampInt(lower, upper, x) {
	return Math.min(upper, Math.max(lower, Math.floor(x)));
}

function shannon(A, W) {
	return Math.log(A / W + 1) / Math.log(2);
}

testAreaSVG = d3.select('#test-area').append('svg')
	.attr('width', testDimension.width + testDimension.left + testDimension.right)
	.attr('height', testDimension.height + testDimension.top + testDimension.bottom)
	.style('pointer-events', 'all')
    .on('mousemove', mouseMoved)
	.on('mousedown', mouseClicked);

testAreaSVG.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', testDimension.width + testDimension.left + testDimension.right)
	.attr('height', testDimension.height + testDimension.top + testDimension.bottom)
	.attr('class', 'back');

plotPositionSVG = d3.select('#plot-positions').append('svg')
	.attr('width', plotPositionDimension.width + plotPositionDimension.left + plotPositionDimension.right)
	.attr('height', plotPositionDimension.height + plotPositionDimension.top + plotPositionDimension.bottom);

plotPositionSVG.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', plotPositionDimension.width + plotPositionDimension.left + plotPositionDimension.right)
	.attr('height', plotPositionDimension.height + plotPositionDimension.top + plotPositionDimension.bottom)
	.attr('class', 'back');

plotPositionSVG.append('line')
	.attr('x1', 0)
	.attr('x2', plotPositionDimension.width + plotPositionDimension.left + plotPositionDimension.right)
	.attr('y1', plotPositionDimension.height/2 + plotPositionDimension.top)
	.attr('y2', plotPositionDimension.height/2 + plotPositionDimension.top)
	.style('stroke', 'black')
	.style('shape-rendering','crispEdges');
	
plotPositionSVG.append('line')
	.attr('x1', plotPositionDimension.left)
	.attr('x2', plotPositionDimension.left)
	.attr('y1', 0)
	.attr('y2', plotPositionDimension.top + plotPositionDimension.height + plotPositionDimension.bottom)
	.style('stroke', 'black')
	.style('shape-rendering','crispEdges');	

plotPositionGroup = plotPositionSVG.append('g')
	.attr('transform', 'translate('+ plotPositionDimension.left+ ', ' + (plotPositionDimension.top + plotPositionDimension.height/2) + ')');


	


plotHitsSVG = d3.select('#plot-hits').append('svg')
	.attr('width', plotHitsDimension.width + plotHitsDimension.left + plotHitsDimension.right)
	.attr('height', plotHitsDimension.height + plotHitsDimension.top + plotHitsDimension.bottom)

plotHitsSVG.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', plotHitsDimension.width + plotHitsDimension.left + plotHitsDimension.right)
	.attr('height', plotHitsDimension.height + plotHitsDimension.top + plotHitsDimension.bottom)
	.attr('class', 'back');

plotHitsGroup = plotHitsSVG.append('g')
		.attr('transform', 'translate('+ (plotHitsDimension.left + plotHitsDimension.width/2) + ', ' + (plotHitsDimension.top + plotHitsDimension.height/2) + ')');
plotHitsGroup.append('circle')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('r', plotHitsDimension.width/2)
	.style('opacity', 0.1)

	
	
plotVelocitiesSVG = d3.select('#plot-velocities').append('svg')
	.attr('width', plotVelocitiesDimension.width + plotVelocitiesDimension.left + plotVelocitiesDimension.right)
	.attr('height', plotVelocitiesDimension.height + plotVelocitiesDimension.top + plotVelocitiesDimension.bottom)

plotVelocitiesSVG.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', plotVelocitiesDimension.width + plotVelocitiesDimension.left + plotVelocitiesDimension.right)
	.attr('height', plotVelocitiesDimension.height + plotVelocitiesDimension.top + plotVelocitiesDimension.bottom)
	.attr('class', 'back');

plotVelocitiesGroup = plotVelocitiesSVG.append('g')
	.attr('transform', 'translate('+ (plotVelocitiesDimension.left) + ', ' + (plotVelocitiesDimension.top + plotVelocitiesDimension.height) + ')');



scatterSVG = d3.select('#plot-scatter').append('svg')
	.attr('width', plotScatterDimension.width + plotScatterDimension.left + plotScatterDimension.right)
	.attr('height', plotScatterDimension.height + plotScatterDimension.top + plotScatterDimension.bottom)

scatterSVG.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', plotScatterDimension.width + plotScatterDimension.left + plotScatterDimension.right)
	.attr('height', plotScatterDimension.height + plotScatterDimension.top + plotScatterDimension.bottom)
	.attr('class', 'back');

scatterGroup = scatterSVG.append('g')
	.attr('transform', 'translate('+ (plotScatterDimension.left) + ',' + plotScatterDimension.top + ' )');



// define Axes.
var xAxis = d3.svg.axis()
	.scale(scatterX)
	.ticks(7)
	.tickSize(6, 3, 0);

var yAxis = d3.svg.axis()
	.scale(scatterY)
	.ticks(10)
	.tickSize(6, 3, 6)


// print axes
scatterGroup.append("g")
    .attr("class", "axis")
	// .attr("transform", "translate( 0, " + plotScatterDimension.height + ")")
    .call(xAxis.tickSize(plotScatterDimension.height).orient("bottom"));

scatterGroup.append("g")
    .attr("class", "axis")
	// .attr("transform", "translate( 0, " + plotScatterDimension.height + ")")
    .call(yAxis.tickSize(-plotScatterDimension.width).orient("left"));

fittsTest.generateTarget();
fittsTest.active = false;
