var width = 620;
var height = 400;
var margin = {top: 30, right: 30, bottom: 30, left: 30};


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
	

var fittsTest = {
	pos: {x: 0, y: 0},
	active: false,
	
	generateTarget: function() {
		this.pos.x = randomAB(margin.left, width);
		this.pos.y = randomAB(margin.top, height);
		svg.append('svg:circle')
			.attr('id', '#target')
			.attr('cx', this.pos.x)
			.attr('cy', this.pos.y)
			.attr('r', 10)
			.style('fill', 'red');
		
		this.active = true;
	},
	
	removeTarget: function() {
		svg.selectAll('#target').remove();
		this.active = false;
	}
}

function randomAB(a, b) {
	return a + Math.random() * b;
}

function mouseMoved()
{
	var m = d3.svg.mouse(this);
	
	svg.append('svg:circle')
	      .attr('cx', m[0])
	      .attr('cy', m[1])
	      .attr('r', 10)
	      .style('stroke', 'gold')
		  .style('fill', 'gold')
	      .style('stroke-opacity', 1)
		  .transition()
			      .duration(2000)
			      .attr('r', 0)
			      .style('stroke-opacity', 1e-6)
		      	.remove();
}

function mouseClicked()
{
	fittsTest.generateTarget();
}
