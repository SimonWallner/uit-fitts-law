var testDimension = {top: 30, right: 30, bottom: 30, left: 30};
testDimension.width = 700 - (testDimension.left + testDimension.right);
testDimension.height = 400 - (testDimension.top + testDimension.bottom);

var plotPositionDimension = {top: 30, right: 30, bottom: 30, left: 30};
plotPositionDimension.width = 700 - (plotPositionDimension.left + plotPositionDimension.right);
plotPositionDimension.height = 200 - (plotPositionDimension.top + plotPositionDimension.bottom);



var fittsTest = {
	target: {x: 0, y: 0, r: 10},
	start: {x: 0, y: 0, time: 0},
	last: {x: 0, y: 0},
	currentPath: [],
	active: false,
	
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
			this.addDataPoint({start: this.start, target: this.target, path: this.currentPath})
			this.removeTarget();


			this.generateTarget();			
			this.last = {x: x, y: y, time: (new Date).getTime()};
			this.start = this.last;
			this.currentPath.push(this.last);
		}
	},
	
	mouseMoved: function(x, y) {
		if (this.active) {
			var newPoint = {x: x, y: y, time: (new Date).getTime()}
			this.currentPath.push(newPoint)
			
			testAreaSVG.append('svg:line')
				.attr('class', 'path')
				.attr('x1', this.last.x)
				.attr('x2', newPoint.x)
				.attr('y1', this.last.y)
				.attr('y2', newPoint.y)
				.transition()
					.duration(2000)
					.style('stroke-opacity', .1);
				
			this.last = newPoint;
		}
	},
	
	addDataPoint: function(data) {
		var A = data.start;
		var B = data.target;
		var path = data.path;
		
		var last = {x: 0, y: 0};
		
		for (var i = 0; i < path.length; i++) {
			var p = path[i];
			
			var q = project(A, B, p);
			var x = distance(q, A) * q.t;
			var y = distance(q, p) * isLeft(A, B, p);
			
			if (last) {
				plotPositionGroup.append('svg:line')
					.attr('class', 'path')
					.attr('x1', last.x)
					.attr('x2', x)
					.attr('y1', last.y)
					.attr('y2', y)
					.transition()
						.duration(2000)
						.style('stroke-opacity', .1);	
			}
			
			last.x = x;
			last.y = y;
		}
	}
}

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
		return A
	}
	else {
		var Ap = minus(p, A);
		var t = dot(Ap, AB) / AB_squared;
		return {x: A.x + t * AB.x,
				y: A.y + t * AB.y,
				t: t}
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
	.attr('height', plotPositionDimension.height + plotPositionDimension.top + plotPositionDimension.bottom)

plotPositionSVG.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', plotPositionDimension.width + plotPositionDimension.left + plotPositionDimension.right)
	.attr('height', plotPositionDimension.height + plotPositionDimension.top + plotPositionDimension.bottom)
	.attr('class', 'back');
	
plotPositionGroup = plotPositionSVG.append('g')
	.attr('transform', 'translate('+ plotPositionDimension.left+ ', ' + (plotPositionDimension.top + plotPositionDimension.height/2) + ')');

fittsTest.generateTarget();
fittsTest.active = false;
