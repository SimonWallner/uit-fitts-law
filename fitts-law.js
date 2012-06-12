var width = 620;
var height = 400;
var margin = {top: 30, right: 30, bottom: 30, left: 30};



var fittsTest = {
	target: {x: 0, y: 0, r: 10},
	start: {x: 0, y: 0, time: 0},
	last: {x: 0, y: 0},
	currentPath: [],
	active: false,
	
	generateTarget: function() {
		this.target.x = randomAB(margin.left, width);
		this.target.y = randomAB(margin.top, height);
		svg.append('svg:circle')
			.attr('id', 'target')
			.attr('cx', this.target.x)
			.attr('cy', this.target.y)
			.attr('r', this.target.r)
			.style('fill', 'red');
		
		this.active = true;
	},
	
	removeTarget: function() {
		svg.selectAll('#target').remove();
		this.active = false;
	},
	
	hitTarget: function(x, y) {
		var dx = this.target.x - x;
		var dy = this.target.y - y;

		return (Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) < this.target.r);
	},
	
	mouseMoved: function(x, y) {
		if (this.active) {
			var newPoint = {x: x, y: y}
			this.currentPath.push(newPoint)
			
			svg.append('svg:line')
				.attr('class', 'path')
				.attr('x1', this.last.x)
				.attr('x2', newPoint.x)
				.attr('y1', this.last.y)
				.attr('y2', newPoint.y)
				.transition()
					.duration(2000)
					.style('stroke-opacity', 0)
					.remove();
				
			this.last = newPoint;
		}
	}
}

function randomAB(a, b) {
	return a + Math.random() * b;
}

function mouseMoved()
{
	var m = d3.svg.mouse(this);
	fittsTest.mouseMoved(m[0], m[1])
}

function mouseClicked()
{
	var mouse = d3.svg.mouse(this);
	if (fittsTest.hitTarget(mouse[0], mouse[1])) {
		fittsTest.removeTarget();
		fittsTest.last = {x: mouse[0], y: mouse[1]};
		fittsTest.generateTarget();
	}
}





svg = d3.select('#test-area').append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.style('pointer-events', 'all')
    .on('mousemove', mouseMoved)
	.on('mousedown', mouseClicked);

svg.append('rect')
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.attr('class', 'back');


fittsTest.generateTarget();
