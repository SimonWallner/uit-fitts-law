// "use strict";

/**
 * Create dimensions from the given values and store them for later use.
 * All values should be positive and make sense.
 * @param {number} width The outer width of the area.
 * @param {number} height The outer height of the area.
 * @param {number} top Margin form the top edge.
 * @param {number} right Margin form the right edge.
 * @param {number} bottom Margin form the bottom edge.
 * @param {number} left Margin form the left edge.
 */
function makeDimension(width, height, top, right, bottom, left) {
	return {width: width,
		height: height,
		innerWidth: width - (left + right),
		innerHeight: height - (top + bottom),
		top: top,
		right: right,
		bottom: bottom,
		left: left,
		cx: (width - (left + right)) / 2 + left,
		cy: (height - (top + bottom)) / 2 + top};
}

// set up dimensions for the plotting.
var testDimension = makeDimension(460, 460, 30, 30, 30, 30);
var plotPositionDimension = makeDimension(220, 200, 30, 30, 30, 30);
var plotVelocitiesDimension = plotPositionDimension;
var plotHitsDimension = plotPositionDimension;
var plotScatterDimension = makeDimension(220, 200, 30, 30, 30, 50);
var scatterEffectiveDimension = makeDimension(540, 300, 30, 30, 30, 50);

function rHit(r, rTarget) {
	return ((plotHitsDimension.innerWidth / 2) / rTarget) * r;
};

var maxV = 1; // pixel/ms
function v(v) {
	var colour = 'rgb(' + clampInt(0, 255, (v / maxV) * 255) + ', 0, 0)';
	return colour;
};

var scatterX = d3.scale.linear()
	.domain([0, 5])
	.range([0, plotScatterDimension.innerWidth]);

var scatterY = d3.scale.linear()
	.domain([3000, 0])
	.range([0, plotScatterDimension.innerHeight]);


var fittsTest = {
	target: {x: 0, y: 0, r: 20},
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
		this.target.x = randomAB(testDimension.left, testDimension.innerWidth);
		this.target.y = testDimension.cy;//randomAB(testDimension.top, testDimension.innerHeight);
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
					.attr('x2', plotScatterDimension.innerWidth)
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
					.style('stroke', v(speed/ dt))
					.transition()
						.duration(2000)
						.style('stroke-opacity', .1);
				
				plotVelocitiesGroup.append('svg:line')
					.attr('class', 'path')
					.attr('x1', last.x / 2)
					.attr('x2', x / 2)
					.attr('y1', -last.v * 2)
					.attr('y2', -speed * 2)
					.style('stroke', v(speed / dt))
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

function bgRect(d, dim) {
	return d.append('rect')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('width', dim.width)
		.attr('height', dim.height)
		.attr('class', 'back');
}

testAreaSVG = d3.select('#test-area').append('svg')
	.attr('width', testDimension.width)
	.attr('height', testDimension.height)
	.style('pointer-events', 'all')
    .on('mousemove', mouseMoved)
	.on('mousedown', mouseClicked)
	.call(bgRect, testDimension);

plotPositionSVG = d3.select('#plot-positions').append('svg')
	.attr('width', plotPositionDimension.width)
	.attr('height', plotPositionDimension.height)
	.call(bgRect, plotPositionDimension)

plotPositionSVG.append('line')
	.attr('x1', 0)
	.attr('x2', plotPositionDimension.width)
	.attr('y1', plotPositionDimension.cy)
	.attr('y2', plotPositionDimension.cy)
	.style('stroke', 'black')
	.style('shape-rendering','crispEdges');
	
plotPositionSVG.append('line')
	.attr('x1', plotPositionDimension.left)
	.attr('x2', plotPositionDimension.left)
	.attr('y1', 0)
	.attr('y2', plotPositionDimension.height)
	.style('stroke', 'black')
	.style('shape-rendering','crispEdges');	

plotPositionGroup = plotPositionSVG.append('g')
	.attr('transform', 'translate('+ plotPositionDimension.left + ', ' + plotPositionDimension.cy + ')');


	


plotHitsSVG = d3.select('#plot-hits').append('svg')
	.attr('width', plotHitsDimension.width)
	.attr('height', plotHitsDimension.height)
	.call(bgRect, plotHitsDimension);


plotHitsGroup = plotHitsSVG.append('g')
		.attr('transform', 'translate('+ plotHitsDimension.cx + ', ' + plotHitsDimension.cy + ')');
plotHitsGroup.append('circle')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('r', plotHitsDimension.innerWidth/2)
	.style('opacity', 0.1)

	
	
plotVelocitiesSVG = d3.select('#plot-velocities').append('svg')
	.attr('width', plotVelocitiesDimension.width)
	.attr('height', plotVelocitiesDimension.height)
	.call(bgRect, plotVelocitiesDimension);

plotVelocitiesGroup = plotVelocitiesSVG.append('g')
	.attr('transform', 'translate('+ (plotVelocitiesDimension.left) + ', ' + (plotVelocitiesDimension.top + plotVelocitiesDimension.innerHeight) + ')');



scatterSVG = d3.select('#plot-scatter').append('svg')
	.attr('width', plotScatterDimension.width)
	.attr('height', plotScatterDimension.height)
	.call(bgRect, plotScatterDimension);

scatterGroup = scatterSVG.append('g')
	.attr('transform', 'translate('+ (plotScatterDimension.left) + ',' + plotScatterDimension.top + ' )');

scatterEffectiveSVG = d3.select('#scatterEffective').append('svg')
	.attr('width', scatterEffectiveDimension.width)
	.attr('height', scatterEffectiveDimension.height)
	.call(bgRect, scatterEffectiveDimension);

scatterEffectiveGroup = scatterEffectiveSVG.append('g')
	.attr('transform', 'translate('+ (scatterEffectiveDimension.left) + ',' + scatterEffectiveDimension.top + ' )');



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
    .call(xAxis.tickSize(plotScatterDimension.innerHeight).orient("bottom"));

scatterGroup.append("g")
    .attr("class", "axis")
	// .attr("transform", "translate( 0, " + plotScatterDimension.height + ")")
    .call(yAxis.tickSize(-plotScatterDimension.innerWidth).orient("left"));

fittsTest.generateTarget();
fittsTest.active = false;
