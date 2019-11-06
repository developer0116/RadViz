let loadData = function() {
	d3.csv('winequality-red.csv', function(dstore) {
		var buildlist = function(attributess, top, name, type) {
			var container = d3.select(top).selectAll('g').data(attributess);
			container.exit().remove();
			var groups = container.enter().append('g');
			groups.append('input');
			groups.append('text');
			container.select('input').attr({
				type: type,
				value: function(d) {
					return d;
				},
				label: function(d) {
					return d;
				},
				name: name
			});
			container
				.select('text')
				.text(function(d) {
					return d;
				})
				.append('p');
		};
		let numericProps = [];
		let isNumeric = (n) => {
			return !isNaN(parseFloat(n)) && isFinite(n);
		};
		for (property in dstore[0]) {
			if (isNumeric(dstore[0][property])) {
				numericProps.push(property);
			}
		}

		vis.setlets([]);
		let categoricallets = [];
		for (property in dstore[0]) {
			if (findValues(dstore, property).length <= 10) {
				categoricallets.push(property);
				numericProps = numericProps.filter(function(item) {
					return item != property;
				});
			}
		}
		buildlist(categoricallets, '#colorGroup', 'colorAttribute', 'radio');

		buildlist(numericProps, '#values', 'numericAttribute', 'checkbox');
		// if (categoricallets.length > 0) vis.setColorlet(categoricallets[0]);

		vis.loadData(dstore);
		vis.setTooltiplets([]);
		vis();
	});
	d3.select('#attributes').on('change', function(d) {
		var selection = document.querySelectorAll('input[name="numericAttribute"]:checked');
		var variables = [];
		for (var i = 0; i < selection.length; i++) {
			variables.push(selection[i].value);
		}
		vis.setlets(variables);
		vis();
	});
	d3.select('#colorPanel').on('change', function(d) {
		var selection = document.querySelector('input[name="colorAttribute"]:checked');
		var val = selection.value;
		if (val == '-1') vis.setColorlet(null);
		else vis.setColorlet(val);
		vis();
	});
	document.getElementById('opacitySlider').addEventListener('change', (e) => {
		vis.setOpacity(parseFloat(e.target.value) / 100);
		vis(1);
	});
};
let createChart = (top, width, height) => {
	let dstore,
		displaylets,
		dconstant,
		apnts,
		tooltiplets,
		colorlet,
		opacity = 1;

	let mar = { top: 60, bottom: 60, left: 60, right: 60 };
	let cWdth = width - mar.left - mar.right;
	let cHgt = height - mar.top - mar.bottom;
	let center = { x: cWdth / 2, y: cHgt / 2 };
	let rad = Math.min(center.x, center.y);
	let color = d3.scale.category10();

	let svg = d3.select(top).append('svg').attr({ width: width, height: height });

	let chart = svg.append('g').attr('transform', 'translate(' + mar.left + ',' + mar.top + ')');

	let cBrdr = svg.append('g').attr('transform', 'translate(' + mar.left + ',' + mar.top + ')');

	let angleToPoint = (angle) => {
		return {
			x: center.x + rad * Math.cos(angle),
			y: center.y + rad * Math.sin(angle)
		};
	};

	let vis = (type = 0) => {
		if (type == 0) {
			apnts = displaylets.map(function(d, i, arr) {
				let data = { text: d, index: i };
				return Object.assign(data, angleToPoint(2 * Math.PI / arr.length * i));
			});
		}

		function dragstarted(d) {
			d3.select(this).attr('stroke', 'black');
		}

		function dragged(d) {
			console.log(d);
			console.log('dragging', d3.event.x, d3.event.y);
			let xOffset = d3.event.x - center.x;
			let yOffset = d3.event.y - center.y;
			let angle = Math.atan2(yOffset, xOffset);
			let y = center.y + rad * Math.sin(angle);
			let x = center.x + rad * Math.cos(angle);
			d.x = parseInt(x);
			d.y = parseInt(y);
			displaylets[d.index].x = x;
			displaylets[d.index].y = y;
			d3.select(this).attr('cx', x).attr('cy', y);
			d3.select(this).select('text').attr('x', x).attr('y', y);
			d3.select(this).select('circle').attr('cx', x).attr('cy', y);
			vis(1);
		}

		function dragended(d) {
			d3.select(this).attr('stroke', null);
		}

		let drag = d3.behavior
			.drag()
			.origin(function(d) {
				return d;
			})
			.on('dragstart', dragstarted)
			.on('drag', dragged)
			.on('dragend', dragended);

		let aCcls = cBrdr.selectAll('g').data(apnts);
		aCcls.exit().remove();
		aCcls
			.enter()
			.append('g')
			.attr('class', 'anchor')
			.attr({
				cx: function(d) {
					return d.x;
				},
				cy: function(d) {
					return d.y;
				}
			})
			.call(drag);
		aCcls.selectAll('circle').remove();
		aCcls
			.append('circle')
			.attr({
				cx: function(d) {
					return d.x;
				},
				cy: function(d) {
					return d.y;
				},
				r: 5
			})
			.style('fill', 'blue');

		let offDist = 7;

		let textX = (d, i) => {
			let xOffset = apnts[i].x - center.x;
			let yOffset = apnts[i].y - center.y;
			let angle = Math.atan2(yOffset, xOffset);
			return apnts[i].x + offDist * Math.cos(angle);
		};
		let textY = (d, i) => {
			let xOffset = apnts[i].x - center.x;
			let yOffset = apnts[i].y - center.y;
			let angle = Math.atan2(yOffset, xOffset);
			return apnts[i].y + offDist * Math.sin(angle);
		};
		let textAnchor = (d, i) => {
			let xOffset = apnts[i].x - center.x;
			if (xOffset >= -0.1) return 'start';
			return 'end';
		};
		let txtBaseline = (d, i) => {
			let yOffset = apnts[i].y - center.y;
			if (yOffset > 0) return 'hanging';
			return 'alphabetic';
		};
		aCcls.selectAll('text').remove();
		aCcls
			.append('text')
			.text(function(d) {
				return d.text;
			})
			.attr({
				x: textX,
				y: textY,
				'text-anchor': textAnchor
			});
		cBrdr
			.append('circle')
			.attr({
				cx: center.x,
				cy: center.y,
				r: rad
			})
			.style('stroke', 'blue') // set the line color
			.style('fill', 'none');

		dconstant = displaylets.map(function() {
			return d3.scale.linear().range([ 0, 1 ]);
		});
		dconstant.forEach(function(element, index) {
			element.domain(
				d3.extent(dstore, function(d) {
					return +d[displaylets[index]];
				})
			);
		});

		if (colorlet) color.domain(findValues(dstore, colorlet));

		let circles = chart.selectAll('circle').data(dstore);

		circles.exit().remove();

		circles.enter().append('circle');

		let getPoint = (d) => {
			let list = [];
			list = dconstant.map((element, index) => {
				return element(d[displaylets[index]]);
			});

			let sum = list.reduce((prev, cur) => {
				return prev + cur;
			}, 0);
			let pt = { x: 0, y: 0 };
			for (let i = 0; i < apnts.length; i++) {
				pt.x += list[i] / sum * apnts[i].x;
				pt.y += list[i] / sum * apnts[i].y;
			}
			if (list.length <= 1) {
				pt.x = -100;
				pt.y = -100;
			}
			return pt;
		};

		let getX = (d) => {
			return getPoint(d).x;
		};

		let getY = (d) => {
			return getPoint(d).y;
		};

		circles
			.transition()
			.duration(100)
			.attr({
				cx: getX,
				cy: getY,
				r: 5
			})
			.style('fill', (d) => {
				if (!colorlet) {
					return 'black';
				}
				return color(d[colorlet]);
			})
			.style('opacity', opacity);

		circles
			.on('mouseover', function(d) {
				d3.select(this).classed('selected', true).attr('r', 8);

				let info = d3.select('#tooltip');

				let nNum = info.select('#nonNumeric').selectAll('p').data(tooltiplets);
				nNum.exit().remove();
				nNum.enter().append('p');
				nNum.text(function(letName) {
					return letName + ':  ' + d[letName];
				});
				if (colorlet) {
					var colorCategory = info.select('#colorPanel').selectAll('p').data([ colorlet ]);
					colorCategory.exit().remove();
					colorCategory.enter().append('p');
					colorCategory
						.text(function(varName) {
							return varName + ':  ' + d[varName];
						})
						.style('color', function(varName) {
							return color(d[varName]);
						});
				}
				let num = info.select('#values').selectAll('p').data(displaylets);
				num.exit().remove();
				num.enter().append('p');
				num.text(function(letName) {
					return letName + ':  ' + d[letName];
				});

				let coords = d3.mouse(svg.node());
				let bbox = svg.node().getBoundingClientRect();
				coords[0] += bbox.left;
				coords[1] += bbox.top;

				info
					.style({
						left: coords[0] + 25 + 'px',
						top: coords[1] + 'px'
					})
					.classed('hidden', false);
			})
			.on('mouseout', function(d) {
				d3.select(this).classed('selected', false).attr('r', 2);

				let info = d3.select('#tooltip');
				info.classed('hidden', true);
			});
	};

	vis.loadData = function(data) {
		dstore = data;
		return vis;
	};

	vis.setlets = function(value) {
		if (!arguments.length) return displaylets;
		displaylets = value;
		return vis;
	};

	vis.setTooltiplets = function(value) {
		if (!arguments.length) return tooltiplets;
		tooltiplets = value;
		return vis;
	};

	vis.setColorlet = function(value) {
		if (!arguments.length) return colorlet;
		colorlet = value;
		return vis;
	};
	vis.setOpacity = function(value) {
		opacity = value;
		return vis;
	};
	return vis;
};

let findValues = function(data, letiable) {
	let values = [];
	for (let i = 0; i < data.length; i++) {
		if (!values.includes(data[i][letiable])) {
			values.push(data[i][letiable]);
		}
	}
	return values;
};

let vis = createChart('#wine-chart', 1000, 600);

loadData();
