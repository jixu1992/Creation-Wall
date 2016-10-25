/**
 * Modified $1 Unistroke Recognizer (JavaScript version)
 *
 * Original: http://depts.washington.edu/aimgroup/proj/dollar/
 * Modification: https://github.com/sqrrl/$1-Recognizer
 * 		- namespace (immediate function)
 * 		- amd registration
 * 		- improved legibility
 * 		- more consistent code style
 * 		
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

(function ($1) {
	"use strict";


	// "Class" Constructors
  	// --------------------

	$1.Point = function(x, y) {
		this.x = x;
		this.y = y;
	};

	var Rectangle = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	};

	var Unistroke = function(name, points) {
		this.name = name;
		this.points = resample(points, numPoints);
		var radians = indicativeAngle(this.points);
		this.points = rotateBy(this.points, -radians);
		this.points = scaleTo(this.points, squareSize);
		this.points = translateTo(this.points, origin);
		this.vector = vectorize(this.points);
	};

	var Result = function(name, score) {
		this.name = name;
		this.score = score;
	};


	// Initial Setup
  	// -------------

  	var unistrokes = new Array();
	var numPoints = 64;
	var squareSize = 250.0;
	var origin = new $1.Point(0,0);
	var diagonal = Math.sqrt(squareSize * squareSize + squareSize * squareSize);
	var halfDiagonal = 0.5 * diagonal;
	var angleRange = 45.0 * Math.PI / 180.0;
	var anglePrecision = 2.0 * Math.PI / 180.0;
	var phi = 0.5 * (-1.0 + Math.sqrt(5.0));


	// Utility Functions
  	// -----------------
  	
  	var resample = function(points, n) {
		var interval = pathLength(points) / (n - 1);
		var delta = 0.0;
		var newpoints = new Array(points[0]);

		for (var i = 1; i < points.length; i++) {
			var d = distance(points[i - 1], points[i]);
			if ((delta + d) >= interval) {
				var qx = points[i - 1].x + ((interval - delta) / d) * (points[i].x - points[i - 1].x);
				var qy = points[i - 1].y + ((interval - delta) / d) * (points[i].y - points[i - 1].y);
				var q = new $1.Point(qx, qy);
				newpoints[newpoints.length] = q;
				points.splice(i, 0, q);
				delta = 0.0;
			} else {
				delta += d;
			}
		}

		if (newpoints.length == n - 1) {
			newpoints[newpoints.length] = new $1.Point(points[points.length - 1].x, points[points.length - 1].y);
		}

		return newpoints;
	};

	var indicativeAngle = function(points) {
		var c = centroid(points);

		return Math.atan2(c.y - points[0].y, c.x - points[0].x);
	};

	var rotateBy = function(points, radians) {
		var c = centroid(points);
		var cos = Math.cos(radians);
		var sin = Math.sin(radians);
		var newpoints = new Array();

		for (var i = 0; i < points.length; i++) {
			var qx = (points[i].x - c.x) * cos - (points[i].y - c.y) * sin + c.x;
			var qy = (points[i].x - c.x) * sin + (points[i].y - c.y) * cos + c.y;
			newpoints[newpoints.length] = new $1.Point(qx, qy);
		}

		return newpoints;
	};

	var scaleTo = function(points, size) {
		var b = boundingBox(points);
		var newpoints = new Array();

		for (var i = 0; i < points.length; i++) {
			var qx = points[i].x * (size / b.width);
			var qy = points[i].y * (size / b.height);
			newpoints[newpoints.length] = new $1.Point(qx, qy);
		}

		return newpoints;
	};

	var translateTo = function(points, pt) {
		var c = centroid(points);
		var newpoints = new Array();

		for (var i = 0; i < points.length; i++) {
			var qx = points[i].x + pt.x - c.x;
			var qy = points[i].y + pt.y - c.y;
			newpoints[newpoints.length] = new $1.Point(qx, qy);
		}

		return newpoints;
	};

	var vectorize = function(points) {
		var sum = 0.0;
		var vector = new Array();

		for (var i = 0; i < points.length; i++) {
			vector[vector.length] = points[i].x;
			vector[vector.length] = points[i].y;
			sum += points[i].x * points[i].x + points[i].y * points[i].y;
		}

		var magnitude = Math.sqrt(sum);

		for (var i = 0; i < vector.length; i++) {
			vector[i] /= magnitude;
		}

		return vector;
	};

	var optimalCosineDistance = function(v1, v2) {
		var a = 0.0;
		var b = 0.0;

		for (var i = 0; i < v1.length; i += 2) {
			a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
	        b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
		}

		var angle = Math.atan(b / a);

		return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
	};

	var distanceAtBestAngle = function(points, t, a, b, threshold) {
		var x1 = phi * a + (1.0 - phi) * b;
		var f1 = distanceAtAngle(points, t, x1);
		var x2 = (1.0 - phi) * a + phi * b;
		var f2 = distanceAtAngle(points, t, x2);

		while (Math.abs(b - a) > threshold) {
			if (f1 < f2) {
				b = x2;
				x2 = x1;
				f2 = f1;
				x1 = phi * a + (1.0 - phi) * b;
				f1 = distanceAtAngle(points, t, x1);
			} else {
				a = x1;
				x1 = x2;
				f1 = f2;
				x2 = (1.0 - phi) * a + phi * b;
				f2 = distanceAtAngle(points, t, x2);
			}
		}

		return Math.min(f1, f2);
	};

	var distanceAtAngle = function(points, t, radians) {
		var newpoints = rotateBy(points, radians);

		return pathDistance(newpoints, t.points);
	};

	var centroid = function(points) {
		var x = 0.0, y = 0.0;

		for (var i = 0; i < points.length; i++) {
			x += points[i].x;
			y += points[i].y;
		}

		x /= points.length;
		y /= points.length;

		return new $1.Point(x, y);
	};

	var boundingBox = function(points) {
		var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;

		for (var i = 0; i < points.length; i++) {
			minX = Math.min(minX, points[i].x);
			minY = Math.min(minY, points[i].y);
			maxX = Math.max(maxX, points[i].x);
			maxY = Math.max(maxY, points[i].y);
		}

		return new Rectangle(minX, minY, maxX - minX, maxY - minY);
	};

	var pathDistance = function(pts1, pts2) {
		var d = 0.0;

		for (var i = 0; i < pts1.length; i++) {
			d += distance(pts1[i], pts2[i]);
		}

		return d / pts1.length;
	};

	var pathLength = function(points) {
		var d = 0.0;

		for (var i = 1; i < points.length; i++) {
			d += distance(points[i - 1], points[i]);
		}

		return d;
	};

	var distance = function(p1, p2) {
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;

		return Math.sqrt(dx * dx + dy * dy);
	};

	var deg2Rad = function(d) { 
		return (d * Math.PI / 180.0); 
	};


	// Template Initialization
	// -----------------------

	unistrokes[0] = new Unistroke("triangle", new Array(new $1.Point(137,139),new $1.Point(135,141),new $1.Point(133,144),new $1.Point(132,146),new $1.Point(130,149),new $1.Point(128,151),new $1.Point(126,155),new $1.Point(123,160),new $1.Point(120,166),new $1.Point(116,171),new $1.Point(112,177),new $1.Point(107,183),new $1.Point(102,188),new $1.Point(100,191),new $1.Point(95,195),new $1.Point(90,199),new $1.Point(86,203),new $1.Point(82,206),new $1.Point(80,209),new $1.Point(75,213),new $1.Point(73,213),new $1.Point(70,216),new $1.Point(67,219),new $1.Point(64,221),new $1.Point(61,223),new $1.Point(60,225),new $1.Point(62,226),new $1.Point(65,225),new $1.Point(67,226),new $1.Point(74,226),new $1.Point(77,227),new $1.Point(85,229),new $1.Point(91,230),new $1.Point(99,231),new $1.Point(108,232),new $1.Point(116,233),new $1.Point(125,233),new $1.Point(134,234),new $1.Point(145,233),new $1.Point(153,232),new $1.Point(160,233),new $1.Point(170,234),new $1.Point(177,235),new $1.Point(179,236),new $1.Point(186,237),new $1.Point(193,238),new $1.Point(198,239),new $1.Point(200,237),new $1.Point(202,239),new $1.Point(204,238),new $1.Point(206,234),new $1.Point(205,230),new $1.Point(202,222),new $1.Point(197,216),new $1.Point(192,207),new $1.Point(186,198),new $1.Point(179,189),new $1.Point(174,183),new $1.Point(170,178),new $1.Point(164,171),new $1.Point(161,168),new $1.Point(154,160),new $1.Point(148,155),new $1.Point(143,150),new $1.Point(138,148),new $1.Point(136,148)));
	unistrokes[1] = new Unistroke("x", new Array(new $1.Point(87,142),new $1.Point(89,145),new $1.Point(91,148),new $1.Point(93,151),new $1.Point(96,155),new $1.Point(98,157),new $1.Point(100,160),new $1.Point(102,162),new $1.Point(106,167),new $1.Point(108,169),new $1.Point(110,171),new $1.Point(115,177),new $1.Point(119,183),new $1.Point(123,189),new $1.Point(127,193),new $1.Point(129,196),new $1.Point(133,200),new $1.Point(137,206),new $1.Point(140,209),new $1.Point(143,212),new $1.Point(146,215),new $1.Point(151,220),new $1.Point(153,222),new $1.Point(155,223),new $1.Point(157,225),new $1.Point(158,223),new $1.Point(157,218),new $1.Point(155,211),new $1.Point(154,208),new $1.Point(152,200),new $1.Point(150,189),new $1.Point(148,179),new $1.Point(147,170),new $1.Point(147,158),new $1.Point(147,148),new $1.Point(147,141),new $1.Point(147,136),new $1.Point(144,135),new $1.Point(142,137),new $1.Point(140,139),new $1.Point(135,145),new $1.Point(131,152),new $1.Point(124,163),new $1.Point(116,177),new $1.Point(108,191),new $1.Point(100,206),new $1.Point(94,217),new $1.Point(91,222),new $1.Point(89,225),new $1.Point(87,226),new $1.Point(87,224)));
	unistrokes[2] = new Unistroke("rectangle", new Array(new $1.Point(78,149),new $1.Point(78,153),new $1.Point(78,157),new $1.Point(78,160),new $1.Point(79,162),new $1.Point(79,164),new $1.Point(79,167),new $1.Point(79,169),new $1.Point(79,173),new $1.Point(79,178),new $1.Point(79,183),new $1.Point(80,189),new $1.Point(80,193),new $1.Point(80,198),new $1.Point(80,202),new $1.Point(81,208),new $1.Point(81,210),new $1.Point(81,216),new $1.Point(82,222),new $1.Point(82,224),new $1.Point(82,227),new $1.Point(83,229),new $1.Point(83,231),new $1.Point(85,230),new $1.Point(88,232),new $1.Point(90,233),new $1.Point(92,232),new $1.Point(94,233),new $1.Point(99,232),new $1.Point(102,233),new $1.Point(106,233),new $1.Point(109,234),new $1.Point(117,235),new $1.Point(123,236),new $1.Point(126,236),new $1.Point(135,237),new $1.Point(142,238),new $1.Point(145,238),new $1.Point(152,238),new $1.Point(154,239),new $1.Point(165,238),new $1.Point(174,237),new $1.Point(179,236),new $1.Point(186,235),new $1.Point(191,235),new $1.Point(195,233),new $1.Point(197,233),new $1.Point(200,233),new $1.Point(201,235),new $1.Point(201,233),new $1.Point(199,231),new $1.Point(198,226),new $1.Point(198,220),new $1.Point(196,207),new $1.Point(195,195),new $1.Point(195,181),new $1.Point(195,173),new $1.Point(195,163),new $1.Point(194,155),new $1.Point(192,145),new $1.Point(192,143),new $1.Point(192,138),new $1.Point(191,135),new $1.Point(191,133),new $1.Point(191,130),new $1.Point(190,128),new $1.Point(188,129),new $1.Point(186,129),new $1.Point(181,132),new $1.Point(173,131),new $1.Point(162,131),new $1.Point(151,132),new $1.Point(149,132),new $1.Point(138,132),new $1.Point(136,132),new $1.Point(122,131),new $1.Point(120,131),new $1.Point(109,130),new $1.Point(107,130),new $1.Point(90,132),new $1.Point(81,133),new $1.Point(76,133)));
	unistrokes[3] = new Unistroke("circle", new Array(new $1.Point(127,141),new $1.Point(124,140),new $1.Point(120,139),new $1.Point(118,139),new $1.Point(116,139),new $1.Point(111,140),new $1.Point(109,141),new $1.Point(104,144),new $1.Point(100,147),new $1.Point(96,152),new $1.Point(93,157),new $1.Point(90,163),new $1.Point(87,169),new $1.Point(85,175),new $1.Point(83,181),new $1.Point(82,190),new $1.Point(82,195),new $1.Point(83,200),new $1.Point(84,205),new $1.Point(88,213),new $1.Point(91,216),new $1.Point(96,219),new $1.Point(103,222),new $1.Point(108,224),new $1.Point(111,224),new $1.Point(120,224),new $1.Point(133,223),new $1.Point(142,222),new $1.Point(152,218),new $1.Point(160,214),new $1.Point(167,210),new $1.Point(173,204),new $1.Point(178,198),new $1.Point(179,196),new $1.Point(182,188),new $1.Point(182,177),new $1.Point(178,167),new $1.Point(170,150),new $1.Point(163,138),new $1.Point(152,130),new $1.Point(143,129),new $1.Point(140,131),new $1.Point(129,136),new $1.Point(126,139)));
	unistrokes[4] = new Unistroke("check", new Array(new $1.Point(91,185),new $1.Point(93,185),new $1.Point(95,185),new $1.Point(97,185),new $1.Point(100,188),new $1.Point(102,189),new $1.Point(104,190),new $1.Point(106,193),new $1.Point(108,195),new $1.Point(110,198),new $1.Point(112,201),new $1.Point(114,204),new $1.Point(115,207),new $1.Point(117,210),new $1.Point(118,212),new $1.Point(120,214),new $1.Point(121,217),new $1.Point(122,219),new $1.Point(123,222),new $1.Point(124,224),new $1.Point(126,226),new $1.Point(127,229),new $1.Point(129,231),new $1.Point(130,233),new $1.Point(129,231),new $1.Point(129,228),new $1.Point(129,226),new $1.Point(129,224),new $1.Point(129,221),new $1.Point(129,218),new $1.Point(129,212),new $1.Point(129,208),new $1.Point(130,198),new $1.Point(132,189),new $1.Point(134,182),new $1.Point(137,173),new $1.Point(143,164),new $1.Point(147,157),new $1.Point(151,151),new $1.Point(155,144),new $1.Point(161,137),new $1.Point(165,131),new $1.Point(171,122),new $1.Point(174,118),new $1.Point(176,114),new $1.Point(177,112),new $1.Point(177,114),new $1.Point(175,116),new $1.Point(173,118)));
	unistrokes[5] = new Unistroke("caret", new Array(new $1.Point(79,245),new $1.Point(79,242),new $1.Point(79,239),new $1.Point(80,237),new $1.Point(80,234),new $1.Point(81,232),new $1.Point(82,230),new $1.Point(84,224),new $1.Point(86,220),new $1.Point(86,218),new $1.Point(87,216),new $1.Point(88,213),new $1.Point(90,207),new $1.Point(91,202),new $1.Point(92,200),new $1.Point(93,194),new $1.Point(94,192),new $1.Point(96,189),new $1.Point(97,186),new $1.Point(100,179),new $1.Point(102,173),new $1.Point(105,165),new $1.Point(107,160),new $1.Point(109,158),new $1.Point(112,151),new $1.Point(115,144),new $1.Point(117,139),new $1.Point(119,136),new $1.Point(119,134),new $1.Point(120,132),new $1.Point(121,129),new $1.Point(122,127),new $1.Point(124,125),new $1.Point(126,124),new $1.Point(129,125),new $1.Point(131,127),new $1.Point(132,130),new $1.Point(136,139),new $1.Point(141,154),new $1.Point(145,166),new $1.Point(151,182),new $1.Point(156,193),new $1.Point(157,196),new $1.Point(161,209),new $1.Point(162,211),new $1.Point(167,223),new $1.Point(169,229),new $1.Point(170,231),new $1.Point(173,237),new $1.Point(176,242),new $1.Point(177,244),new $1.Point(179,250),new $1.Point(181,255),new $1.Point(182,257)));
	unistrokes[6] = new Unistroke("zig-zag", new Array(new $1.Point(307,216),new $1.Point(333,186),new $1.Point(356,215),new $1.Point(375,186),new $1.Point(399,216),new $1.Point(418,186)));
	unistrokes[7] = new Unistroke("arrow", new Array(new $1.Point(68,222),new $1.Point(70,220),new $1.Point(73,218),new $1.Point(75,217),new $1.Point(77,215),new $1.Point(80,213),new $1.Point(82,212),new $1.Point(84,210),new $1.Point(87,209),new $1.Point(89,208),new $1.Point(92,206),new $1.Point(95,204),new $1.Point(101,201),new $1.Point(106,198),new $1.Point(112,194),new $1.Point(118,191),new $1.Point(124,187),new $1.Point(127,186),new $1.Point(132,183),new $1.Point(138,181),new $1.Point(141,180),new $1.Point(146,178),new $1.Point(154,173),new $1.Point(159,171),new $1.Point(161,170),new $1.Point(166,167),new $1.Point(168,167),new $1.Point(171,166),new $1.Point(174,164),new $1.Point(177,162),new $1.Point(180,160),new $1.Point(182,158),new $1.Point(183,156),new $1.Point(181,154),new $1.Point(178,153),new $1.Point(171,153),new $1.Point(164,153),new $1.Point(160,153),new $1.Point(150,154),new $1.Point(147,155),new $1.Point(141,157),new $1.Point(137,158),new $1.Point(135,158),new $1.Point(137,158),new $1.Point(140,157),new $1.Point(143,156),new $1.Point(151,154),new $1.Point(160,152),new $1.Point(170,149),new $1.Point(179,147),new $1.Point(185,145),new $1.Point(192,144),new $1.Point(196,144),new $1.Point(198,144),new $1.Point(200,144),new $1.Point(201,147),new $1.Point(199,149),new $1.Point(194,157),new $1.Point(191,160),new $1.Point(186,167),new $1.Point(180,176),new $1.Point(177,179),new $1.Point(171,187),new $1.Point(169,189),new $1.Point(165,194),new $1.Point(164,196)));
	unistrokes[8] = new Unistroke("left square bracket", new Array(new $1.Point(140,124),new $1.Point(138,123),new $1.Point(135,122),new $1.Point(133,123),new $1.Point(130,123),new $1.Point(128,124),new $1.Point(125,125),new $1.Point(122,124),new $1.Point(120,124),new $1.Point(118,124),new $1.Point(116,125),new $1.Point(113,125),new $1.Point(111,125),new $1.Point(108,124),new $1.Point(106,125),new $1.Point(104,125),new $1.Point(102,124),new $1.Point(100,123),new $1.Point(98,123),new $1.Point(95,124),new $1.Point(93,123),new $1.Point(90,124),new $1.Point(88,124),new $1.Point(85,125),new $1.Point(83,126),new $1.Point(81,127),new $1.Point(81,129),new $1.Point(82,131),new $1.Point(82,134),new $1.Point(83,138),new $1.Point(84,141),new $1.Point(84,144),new $1.Point(85,148),new $1.Point(85,151),new $1.Point(86,156),new $1.Point(86,160),new $1.Point(86,164),new $1.Point(86,168),new $1.Point(87,171),new $1.Point(87,175),new $1.Point(87,179),new $1.Point(87,182),new $1.Point(87,186),new $1.Point(88,188),new $1.Point(88,195),new $1.Point(88,198),new $1.Point(88,201),new $1.Point(88,207),new $1.Point(89,211),new $1.Point(89,213),new $1.Point(89,217),new $1.Point(89,222),new $1.Point(88,225),new $1.Point(88,229),new $1.Point(88,231),new $1.Point(88,233),new $1.Point(88,235),new $1.Point(89,237),new $1.Point(89,240),new $1.Point(89,242),new $1.Point(91,241),new $1.Point(94,241),new $1.Point(96,240),new $1.Point(98,239),new $1.Point(105,240),new $1.Point(109,240),new $1.Point(113,239),new $1.Point(116,240),new $1.Point(121,239),new $1.Point(130,240),new $1.Point(136,237),new $1.Point(139,237),new $1.Point(144,238),new $1.Point(151,237),new $1.Point(157,236),new $1.Point(159,237)));
	unistrokes[9] = new Unistroke("right square bracket", new Array(new $1.Point(112,138),new $1.Point(112,136),new $1.Point(115,136),new $1.Point(118,137),new $1.Point(120,136),new $1.Point(123,136),new $1.Point(125,136),new $1.Point(128,136),new $1.Point(131,136),new $1.Point(134,135),new $1.Point(137,135),new $1.Point(140,134),new $1.Point(143,133),new $1.Point(145,132),new $1.Point(147,132),new $1.Point(149,132),new $1.Point(152,132),new $1.Point(153,134),new $1.Point(154,137),new $1.Point(155,141),new $1.Point(156,144),new $1.Point(157,152),new $1.Point(158,161),new $1.Point(160,170),new $1.Point(162,182),new $1.Point(164,192),new $1.Point(166,200),new $1.Point(167,209),new $1.Point(168,214),new $1.Point(168,216),new $1.Point(169,221),new $1.Point(169,223),new $1.Point(169,228),new $1.Point(169,231),new $1.Point(166,233),new $1.Point(164,234),new $1.Point(161,235),new $1.Point(155,236),new $1.Point(147,235),new $1.Point(140,233),new $1.Point(131,233),new $1.Point(124,233),new $1.Point(117,235),new $1.Point(114,238),new $1.Point(112,238)));
	unistrokes[10] = new Unistroke("v", new Array(new $1.Point(89,164),new $1.Point(90,162),new $1.Point(92,162),new $1.Point(94,164),new $1.Point(95,166),new $1.Point(96,169),new $1.Point(97,171),new $1.Point(99,175),new $1.Point(101,178),new $1.Point(103,182),new $1.Point(106,189),new $1.Point(108,194),new $1.Point(111,199),new $1.Point(114,204),new $1.Point(117,209),new $1.Point(119,214),new $1.Point(122,218),new $1.Point(124,222),new $1.Point(126,225),new $1.Point(128,228),new $1.Point(130,229),new $1.Point(133,233),new $1.Point(134,236),new $1.Point(136,239),new $1.Point(138,240),new $1.Point(139,242),new $1.Point(140,244),new $1.Point(142,242),new $1.Point(142,240),new $1.Point(142,237),new $1.Point(143,235),new $1.Point(143,233),new $1.Point(145,229),new $1.Point(146,226),new $1.Point(148,217),new $1.Point(149,208),new $1.Point(149,205),new $1.Point(151,196),new $1.Point(151,193),new $1.Point(153,182),new $1.Point(155,172),new $1.Point(157,165),new $1.Point(159,160),new $1.Point(162,155),new $1.Point(164,150),new $1.Point(165,148),new $1.Point(166,146)));
	unistrokes[11] = new Unistroke("delete", new Array(new $1.Point(123,129),new $1.Point(123,131),new $1.Point(124,133),new $1.Point(125,136),new $1.Point(127,140),new $1.Point(129,142),new $1.Point(133,148),new $1.Point(137,154),new $1.Point(143,158),new $1.Point(145,161),new $1.Point(148,164),new $1.Point(153,170),new $1.Point(158,176),new $1.Point(160,178),new $1.Point(164,183),new $1.Point(168,188),new $1.Point(171,191),new $1.Point(175,196),new $1.Point(178,200),new $1.Point(180,202),new $1.Point(181,205),new $1.Point(184,208),new $1.Point(186,210),new $1.Point(187,213),new $1.Point(188,215),new $1.Point(186,212),new $1.Point(183,211),new $1.Point(177,208),new $1.Point(169,206),new $1.Point(162,205),new $1.Point(154,207),new $1.Point(145,209),new $1.Point(137,210),new $1.Point(129,214),new $1.Point(122,217),new $1.Point(118,218),new $1.Point(111,221),new $1.Point(109,222),new $1.Point(110,219),new $1.Point(112,217),new $1.Point(118,209),new $1.Point(120,207),new $1.Point(128,196),new $1.Point(135,187),new $1.Point(138,183),new $1.Point(148,167),new $1.Point(157,153),new $1.Point(163,145),new $1.Point(165,142),new $1.Point(172,133),new $1.Point(177,127),new $1.Point(179,127),new $1.Point(180,125)));
	unistrokes[12] = new Unistroke("left curly brace", new Array(new $1.Point(150,116),new $1.Point(147,117),new $1.Point(145,116),new $1.Point(142,116),new $1.Point(139,117),new $1.Point(136,117),new $1.Point(133,118),new $1.Point(129,121),new $1.Point(126,122),new $1.Point(123,123),new $1.Point(120,125),new $1.Point(118,127),new $1.Point(115,128),new $1.Point(113,129),new $1.Point(112,131),new $1.Point(113,134),new $1.Point(115,134),new $1.Point(117,135),new $1.Point(120,135),new $1.Point(123,137),new $1.Point(126,138),new $1.Point(129,140),new $1.Point(135,143),new $1.Point(137,144),new $1.Point(139,147),new $1.Point(141,149),new $1.Point(140,152),new $1.Point(139,155),new $1.Point(134,159),new $1.Point(131,161),new $1.Point(124,166),new $1.Point(121,166),new $1.Point(117,166),new $1.Point(114,167),new $1.Point(112,166),new $1.Point(114,164),new $1.Point(116,163),new $1.Point(118,163),new $1.Point(120,162),new $1.Point(122,163),new $1.Point(125,164),new $1.Point(127,165),new $1.Point(129,166),new $1.Point(130,168),new $1.Point(129,171),new $1.Point(127,175),new $1.Point(125,179),new $1.Point(123,184),new $1.Point(121,190),new $1.Point(120,194),new $1.Point(119,199),new $1.Point(120,202),new $1.Point(123,207),new $1.Point(127,211),new $1.Point(133,215),new $1.Point(142,219),new $1.Point(148,220),new $1.Point(151,221)));
	unistrokes[13] = new Unistroke("right curly brace", new Array(new $1.Point(117,132),new $1.Point(115,132),new $1.Point(115,129),new $1.Point(117,129),new $1.Point(119,128),new $1.Point(122,127),new $1.Point(125,127),new $1.Point(127,127),new $1.Point(130,127),new $1.Point(133,129),new $1.Point(136,129),new $1.Point(138,130),new $1.Point(140,131),new $1.Point(143,134),new $1.Point(144,136),new $1.Point(145,139),new $1.Point(145,142),new $1.Point(145,145),new $1.Point(145,147),new $1.Point(145,149),new $1.Point(144,152),new $1.Point(142,157),new $1.Point(141,160),new $1.Point(139,163),new $1.Point(137,166),new $1.Point(135,167),new $1.Point(133,169),new $1.Point(131,172),new $1.Point(128,173),new $1.Point(126,176),new $1.Point(125,178),new $1.Point(125,180),new $1.Point(125,182),new $1.Point(126,184),new $1.Point(128,187),new $1.Point(130,187),new $1.Point(132,188),new $1.Point(135,189),new $1.Point(140,189),new $1.Point(145,189),new $1.Point(150,187),new $1.Point(155,186),new $1.Point(157,185),new $1.Point(159,184),new $1.Point(156,185),new $1.Point(154,185),new $1.Point(149,185),new $1.Point(145,187),new $1.Point(141,188),new $1.Point(136,191),new $1.Point(134,191),new $1.Point(131,192),new $1.Point(129,193),new $1.Point(129,195),new $1.Point(129,197),new $1.Point(131,200),new $1.Point(133,202),new $1.Point(136,206),new $1.Point(139,211),new $1.Point(142,215),new $1.Point(145,220),new $1.Point(147,225),new $1.Point(148,231),new $1.Point(147,239),new $1.Point(144,244),new $1.Point(139,248),new $1.Point(134,250),new $1.Point(126,253),new $1.Point(119,253),new $1.Point(115,253)));
	unistrokes[14] = new Unistroke("star", new Array(new $1.Point(75,250),new $1.Point(75,247),new $1.Point(77,244),new $1.Point(78,242),new $1.Point(79,239),new $1.Point(80,237),new $1.Point(82,234),new $1.Point(82,232),new $1.Point(84,229),new $1.Point(85,225),new $1.Point(87,222),new $1.Point(88,219),new $1.Point(89,216),new $1.Point(91,212),new $1.Point(92,208),new $1.Point(94,204),new $1.Point(95,201),new $1.Point(96,196),new $1.Point(97,194),new $1.Point(98,191),new $1.Point(100,185),new $1.Point(102,178),new $1.Point(104,173),new $1.Point(104,171),new $1.Point(105,164),new $1.Point(106,158),new $1.Point(107,156),new $1.Point(107,152),new $1.Point(108,145),new $1.Point(109,141),new $1.Point(110,139),new $1.Point(112,133),new $1.Point(113,131),new $1.Point(116,127),new $1.Point(117,125),new $1.Point(119,122),new $1.Point(121,121),new $1.Point(123,120),new $1.Point(125,122),new $1.Point(125,125),new $1.Point(127,130),new $1.Point(128,133),new $1.Point(131,143),new $1.Point(136,153),new $1.Point(140,163),new $1.Point(144,172),new $1.Point(145,175),new $1.Point(151,189),new $1.Point(156,201),new $1.Point(161,213),new $1.Point(166,225),new $1.Point(169,233),new $1.Point(171,236),new $1.Point(174,243),new $1.Point(177,247),new $1.Point(178,249),new $1.Point(179,251),new $1.Point(180,253),new $1.Point(180,255),new $1.Point(179,257),new $1.Point(177,257),new $1.Point(174,255),new $1.Point(169,250),new $1.Point(164,247),new $1.Point(160,245),new $1.Point(149,238),new $1.Point(138,230),new $1.Point(127,221),new $1.Point(124,220),new $1.Point(112,212),new $1.Point(110,210),new $1.Point(96,201),new $1.Point(84,195),new $1.Point(74,190),new $1.Point(64,182),new $1.Point(55,175),new $1.Point(51,172),new $1.Point(49,170),new $1.Point(51,169),new $1.Point(56,169),new $1.Point(66,169),new $1.Point(78,168),new $1.Point(92,166),new $1.Point(107,164),new $1.Point(123,161),new $1.Point(140,162),new $1.Point(156,162),new $1.Point(171,160),new $1.Point(173,160),new $1.Point(186,160),new $1.Point(195,160),new $1.Point(198,161),new $1.Point(203,163),new $1.Point(208,163),new $1.Point(206,164),new $1.Point(200,167),new $1.Point(187,172),new $1.Point(174,179),new $1.Point(172,181),new $1.Point(153,192),new $1.Point(137,201),new $1.Point(123,211),new $1.Point(112,220),new $1.Point(99,229),new $1.Point(90,237),new $1.Point(80,244),new $1.Point(73,250),new $1.Point(69,254),new $1.Point(69,252)));
	unistrokes[15] = new Unistroke("pigtail", new Array(new $1.Point(81,219),new $1.Point(84,218),new $1.Point(86,220),new $1.Point(88,220),new $1.Point(90,220),new $1.Point(92,219),new $1.Point(95,220),new $1.Point(97,219),new $1.Point(99,220),new $1.Point(102,218),new $1.Point(105,217),new $1.Point(107,216),new $1.Point(110,216),new $1.Point(113,214),new $1.Point(116,212),new $1.Point(118,210),new $1.Point(121,208),new $1.Point(124,205),new $1.Point(126,202),new $1.Point(129,199),new $1.Point(132,196),new $1.Point(136,191),new $1.Point(139,187),new $1.Point(142,182),new $1.Point(144,179),new $1.Point(146,174),new $1.Point(148,170),new $1.Point(149,168),new $1.Point(151,162),new $1.Point(152,160),new $1.Point(152,157),new $1.Point(152,155),new $1.Point(152,151),new $1.Point(152,149),new $1.Point(152,146),new $1.Point(149,142),new $1.Point(148,139),new $1.Point(145,137),new $1.Point(141,135),new $1.Point(139,135),new $1.Point(134,136),new $1.Point(130,140),new $1.Point(128,142),new $1.Point(126,145),new $1.Point(122,150),new $1.Point(119,158),new $1.Point(117,163),new $1.Point(115,170),new $1.Point(114,175),new $1.Point(117,184),new $1.Point(120,190),new $1.Point(125,199),new $1.Point(129,203),new $1.Point(133,208),new $1.Point(138,213),new $1.Point(145,215),new $1.Point(155,218),new $1.Point(164,219),new $1.Point(166,219),new $1.Point(177,219),new $1.Point(182,218),new $1.Point(192,216),new $1.Point(196,213),new $1.Point(199,212),new $1.Point(201,211)));


	// 1$ Recognizer Functions
	// -----------------------

	$1.recognize = function(points) {
		points = resample(points, numPoints);
		var radians = indicativeAngle(points);
		points = rotateBy(points, -radians);
		points = scaleTo(points, squareSize);
		points = translateTo(points, origin);
		var vector = vectorize(points);

		var b = +Infinity;
		var u = -1;

		for (var i = 0; i < unistrokes.length; i++) {
			var d = distanceAtBestAngle(points, unistrokes[i], -angleRange, +angleRange, anglePrecision);

			if (d < b) {
				b = d;
				u = i;
			}
		}

		return (u == -1) ? new Result("No match.", 0.0) : new Result(unistrokes[u].name, 1.0 - b / halfDiagonal);
	};

	$1.addGesture = function(name, points) {
		unistrokes[unistrokes.length] = new Unistroke(name, points);
		var num = 0;

		for (var i = 0; i < unistrokes.length; i++) {
			if (unistrokes[i].name == name) {
				num++;
			}
		}

		return num;
	};


	// AMD Registration
	// ----------------

	if (typeof window.define === 'function' && window.define.amd) {
		window.define([], function() {
			return $1;
		});
	}


}(this.$1 = this.$1 || {}));
