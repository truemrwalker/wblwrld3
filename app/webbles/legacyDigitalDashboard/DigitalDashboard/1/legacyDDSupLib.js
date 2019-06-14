var legacyDDSupLib = {
	//This function makes a copy of plugin colors
	copyColors: function(colors) {
		var res = {};
		if(colors.hasOwnProperty('skin')) {
			res.skin = {};
			for(var prop in colors.skin) {
				res.skin[prop] = colors.skin[prop];
			}
		}
		if(colors.hasOwnProperty('groups')) {
			res.groups = {};
			for(var prop in colors.groups) {
				res.groups[prop] = colors.groups[prop];
			}
		}
		if(colors.hasOwnProperty('selection')) {
			res.selection = {};
			for(var prop in colors.selection) {
				res.selection[prop] = colors.selection[prop];
			}
		}
		return res;
	},
	//This function converts a number to a proper string
	number2text: function(v, span) {
		if(parseInt(Number(v)) == v) {
			return v.toString();
		}
		if(Math.abs(v) < 1) {
			return v.toPrecision(3);
		}
		if(span > 10) {
			return Math.round(v);
		}
		if(span > 5 && Math.abs(v) < 100) {
			return v.toPrecision(2);
		}
		if(span < 1) {
			var fixed = 1;
			var s = span;
			while(s < 1) {
				s *= 10;
				fixed++;
			}
			return v.toFixed(fixed);
		}
		return v.toPrecision(3);
	},
	//This function gets a text width based on a specified font
	getTextWidth: function(canvasContxtObj, textStr, fontCSSObj) {
		if(canvasContxtObj !== null && canvasContxtObj !== undefined) {
			canvasContxtObj.font = fontCSSObj;
			var metrics = canvasContxtObj.measureText(textStr);
			return metrics.width;
		}
		return 0;
	},
	//This function gets a text width based on the current canvas font
	getTextWidthCurrentFont: function(canvasContxtObj, textStr) {
		if(canvasContxtObj !== null && canvasContxtObj !== undefined) {
			var metrics = canvasContxtObj.measureText(textStr);
			return metrics.width;
		}
		return 0;
	},
	//This function shortens and cuts away non needed parts of a name string
	shortenName: function(n) {
		var ss = n.split(":");
		return ss[ss.length - 1];
	},
	// This function converts a color to a RGBA Vector
	hexColorToRGBAvec: function(color, alpha) {
		var res = [];

		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			var a = (alpha > 1) ? Math.max(0, Math.min(255, Math.round(alpha * 255))) : alpha;
			return [r, g, b, a];
		}
		return [0, 0, 0, 255];
	},
	// This function converts a color to a RGBA CSS String
	hexColorToRGBA: function(color, alpha) {
		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			var a = (alpha > 1) ? Math.max(0, Math.min(255, Math.round(alpha * 255))) : alpha;
			return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
		}
		return color;
	},
	//This function blends RGBA color values
	blendRGBAs: function(r,g,b,alpha, offset, pixels) {
		if(pixels[offset+3] > 0 && alpha < 255) {
			// something drawn here already, blend alpha
			var oldA = pixels[offset+3] / 255.0;
			var newA = alpha / 255.0;
			var remainA = (1 - newA) * oldA;
			var outA = newA + remainA;
			if(outA > 0) {
				var oldR = pixels[offset];
				var oldG = pixels[offset+1];
				var oldB = pixels[offset+2];
				var outR = Math.min(255, (oldR * remainA + newA * r) / outA);
				var outG = Math.min(255, (oldG * remainA + newA * g) / outA);
				var outB = Math.min(255, (oldB * remainA + newA * b) / outA);
			}
			else {
				var outR = 0;
				var outG = 0;
				var outB = 0;
			}
			pixels[offset] = outR;
			pixels[offset+1] = outG;
			pixels[offset+2] = outB;
			pixels[offset+3] = Math.min(255, outA * 255);
		}
		else {
			pixels[offset] = r;
			pixels[offset+1] = g;
			pixels[offset+2] = b;
			pixels[offset+3] = alpha;
		}
	},
	checkColors: function(currentColors, lastColors) {
		if(currentColors == lastColors) {
			return false;
		}

		if(!lastColors) {
			return true;
		}

		if(!lastColors.hasOwnProperty("groups") && !currentColors.hasOwnProperty("groups")) {
			return false;
		}
		else if(lastColors.hasOwnProperty("groups") && currentColors.hasOwnProperty("groups")) {
			// check more
			var groupCols = currentColors.groups;
			var lastGroupCols = lastColors.groups;

			for(var g in groupCols) {
				if(!lastGroupCols.hasOwnProperty(g)) {
					return true;
				}
			}
			for(var g in lastGroupCols) {
				if(!groupCols.hasOwnProperty(g)) {
					return true;
				}

				if(groupCols[g].hasOwnProperty('color') && (!lastGroupCols[g].hasOwnProperty('color') || lastGroupCols[g].color != groupCols[g].color)) {
					return true;
				}

				if(groupCols[g].hasOwnProperty('gradient')) {
					if(!lastGroupCols[g].hasOwnProperty('gradient') || lastGroupCols[g].gradient.length != groupCols[g].gradient.length) {
						return true;
					}

					for(var i = 0; i < groupCols[g].gradient.length; i++) {
						var cc = groupCols[g].gradient[i];
						var cc2 = lastGroupCols[g].gradient[i];

						if(cc.hasOwnProperty('pos') != cc2.hasOwnProperty('pos') || cc.hasOwnProperty('color') != cc2.hasOwnProperty('color') || (cc.hasOwnProperty('pos') && cc.pos != cc2.pos) || (cc.hasOwnProperty('color') && cc.color != cc2.color)) {
							return true;
						}
					}
				}
			}
		}
		else {
			return true;
		}

		return false;
	},
	//This function checks thta the background color is as it should based on current and last colors
	backgroundColorCheck: function(currentColors, lastColors) {
		if(currentColors.hasOwnProperty("skin")) {
			if(!lastColors) {
				return true;
			} else if(!lastColors.hasOwnProperty("skin")) {
				return true;
			} else {
				if(currentColors.skin.hasOwnProperty("gradient")) {
					if(!lastColors.skin.hasOwnProperty("gradient")) {
						return true;
					} else {
						if(currentColors.skin.gradient.length != lastColors.skin.gradient.length) {
							return true;
						}
						for(var i = 0; i < currentColors.skin.gradient.length; i++) {
							if(lastColors.skin.gradient[i].color != currentColors.skin.gradient[i].color || lastColors.skin.gradient[i].pos != currentColors.skin.gradient[i].pos) {
								return true;
							}
						}
					}
				} else {
					if(lastColors.skin.hasOwnProperty("gradient")) {
						return true;
					} else {
						if(currentColors.skin.hasOwnProperty("color")) {
							if(!lastColors.skin.hasOwnProperty("color") || lastColors.skin.color != currentColors.skin.color) {
								return true;
							}
						}
					}
				}

				if(currentColors.skin.hasOwnProperty("border")) {
					if(!lastColors.skin.hasOwnProperty("border") || lastColors.skin.border != currentColors.skin.border) {
						return true;
					}
				}
			}
		}
		return false;
	},
	// This function gets a color for a group
	getColorForGroup: function(group, colorPalette, currentColors) {
		if(colorPalette === null) {
			colorPalette = {};
		}

		group = group.toString();

		if(!colorPalette.hasOwnProperty(group)) {
			if(currentColors.hasOwnProperty("groups")) {
				var groupCols = currentColors.groups;

				for(var g in groupCols) {
					if(groupCols.hasOwnProperty(g)) {
						colorPalette[g] = '#000000';

						if(groupCols[g].hasOwnProperty('color')) {
							colorPalette[g] = groupCols[g].color;
						}
					}
				}
			}
		}

		if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
			return '#000000';
		} else {
			return colorPalette[group];
		}
	},
	// This function gets a gradient color for a group
	getGradientColorForGroup: function(group, x1,y1, x2,y2, alpha, myCanvas, myCtx, useGlobalGradients, myDefCanvasElem, colorPalette, currentColors) {
		if(useGlobalGradients) {
			if(myCanvas === null) {
				var myCanvasElement = myDefCanvasElem;
				if(myCanvasElement.length > 0) {
					myCanvas = myCanvasElement[0];
				}
			}

			var W = myCanvas.width;
			if(typeof W === 'string') {
				W = parseFloat(W);
			}
			if(W < 1) {
				W = 1;
			}

			var H = myCanvas.height;
			if(typeof H === 'string') {
				H = parseFloat(H);
			}
			if(H < 1) {
				H = 1;
			}

			x1 = 0;
			y1 = 0;
			x2 = W;
			y2 = H;
		}

		if(colorPalette === null || colorPalette === undefined) {
			colorPalette = {};
		}

		group = group.toString();

		if(!colorPalette.hasOwnProperty(group)) {
			if(currentColors.hasOwnProperty('groups')) {
				var groupCols = currentColors.groups;

				for(var g in groupCols) {
					if(groupCols.hasOwnProperty(g)) {
						colorPalette[g] = 'black';

						if(groupCols[g].hasOwnProperty('color')) {
							colorPalette[g] = groupCols[g].color;
						}
					}
				}
			}
		}

		if(currentColors.hasOwnProperty("groups")) {
			var groupCols = currentColors.groups;

			if(groupCols.hasOwnProperty(group) && myCtx !== null && groupCols[group].hasOwnProperty('gradient') && (x1 != x2 || y1 != y2)) {
				var OK = true;
				try {
					var grd = myCtx.createLinearGradient(x1,y1,x2,y2);
					for(var i = 0; i < groupCols[group].gradient.length; i++) {
						var cc = groupCols[group].gradient[i];
						if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
							if(alpha !== undefined) {
								grd.addColorStop(cc.pos, legacyDDSupLib.hexColorToRGBA(cc.color, alpha));
							}
							else {
								grd.addColorStop(cc.pos, cc.color);
							}
						} else {
							OK = false;
						}
					}
				} catch(e) {
					OK = false;
				}

				if(OK) {
					return grd;
				}
			}
		}

		if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
			return 'black';
		}
		else {
			return colorPalette[group];
		}
	},
	// This function converts a pixel position on the plot to a proper X value.
	pixel2valX: function (p, unique, drawW, leftMarg, zoomMinX, zoomMaxX) {
		if(unique <= 0) {
			return 0;
		}
		if(p < leftMarg) {
			return zoomMinX;
		}
		if(p > leftMarg + drawW) {
			return zoomMaxX;
		}
		return zoomMinX + (p - leftMarg) / drawW * (zoomMaxX - zoomMinX);
	},
	// This function converts a pixel position on the plot to a proper Y value.
	pixel2valY: function (p, unique, drawH, topMarg, zoomMinY, zoomMaxY) {
		if(unique <= 0) {
			return 0;
		}
		if(p < topMarg) {
			return zoomMaxY; // flip Y-axis
		}
		if(p > topMarg + drawH) {
			return zoomMinY; // flip Y-axis
		}
		return zoomMinY + (drawH - (p - topMarg)) / drawH * (zoomMaxY - zoomMinY); // flip Y-axis
	},
	// This function converts a value to a pixel position in X direction.
	val2pixelX: function (v, unique, drawW, leftMarg, zoomMinX, zoomMaxX) {
		if(unique <= 0) {
			return 0;
		}
		if(v < zoomMinX) {
			return leftMarg;
		}
		if(v > zoomMaxX) {
			return leftMarg + drawW;
		}
		return leftMarg + (v - zoomMinX) / (zoomMaxX - zoomMinX) * drawW;
	},
	// This function converts a value to a pixel position in Y direction.
	val2pixelY: function (v, unique, drawH, topMarg, zoomMinY, zoomMaxY) {
		if(unique <= 0) {
			return 0;
		}
		if(v < zoomMinY) {
			return topMarg + drawH; // flip Y-axis
		}
		if(v > zoomMaxY) {
			return topMarg; // flip Y-axis
		}
		return topMarg + drawH - ((v - zoomMinY) / (zoomMaxY - zoomMinY) * drawH); // flip Y-axis
	},
	// This function converts a date to text.
	date2text: function(v, dateFormat) {
		var d = new Date(parseInt(v));
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		switch(dateFormat) {
			case 'full':
				return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
				break;
			case 'onlyYear':
				return d.getFullYear();
				break;
			case 'yearMonth':
				return d.getFullYear() + " " + months[d.getMonth()];
				break;
			case 'monthDay':
				return months[d.getMonth()] + " " + d.getDate();
				break;
			case 'day':
				return d.getDate();
				break;
			case 'dayTime':
				var h = d.getHours();
				var m = d.getMinutes();
				var s = d.getSeconds();
				var hh = h.toString();
				var mm = m.toString();
				var ss = s.toString();

				if(h < 10) { hh = "0" + hh; }
				if(m < 10) { mm = "0" + mm; }
				if(s < 10) { ss = "0" + ss; }
				return d.getDate() + " " + hh + ":" + mm + ":" + ss;
				break;
			case 'time':
				var h = d.getHours();
				var m = d.getMinutes();
				var s = d.getSeconds();
				var hh = h.toString();
				var mm = m.toString();
				var ss = s.toString();

				if(h < 10) { hh = "0" + hh; }
				if(m < 10) { mm = "0" + mm; }
				if(s < 10) { ss = "0" + ss; }
				return hh + ":" + mm + ":" + ss;
				break;
			default:
				return d.toISOString();
		}
	},
	//This function converts dimension values to pixels
	dimVals2pixels: function(axis, xval, yval, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, wantsExtra){
		var res = {};
		if(unique <= 0) {
			res = {"x":leftMarg, "y":topMarg};
		} else {
			if(axis == xAxisAxis) {
				if(xval < 0) {
					res.x = leftMarg;
				} else if(xval >= dim[xAxisAxis]) {
					res.x = leftMarg + dim[xAxisAxis] * cellW;
				} else {
					res.x = leftMarg + xval * cellW;
				}

				if(yval < 0) {
					res.y = topMarg + drawH; // flip Y-axis
				} else if(yval >= dim[yAxisAxis]) {
					res.y = topMarg + drawH - dim[yAxisAxis] * cellW; // flip Y-axis
				} else {
					res.y = topMarg + drawH - yval * cellW; // flip Y-axis
				}

				if(wantsExtra === true){ res.y -= cellW - 1; }
			} else if(axis == yAxisAxis) {
				var a = xval;
				if(xval < 0) {
					res.x = leftMarg + dim[xAxisAxis] * cellW + innerMarg;
					a = 0;
				} else if(xval >= dim) {
					res.x = leftMarg + dim[xAxisAxis] * cellW + dim[zAxisAxis] * cellW + innerMarg;
					a = dim[zAxisAxis] - 1;
				} else {
					res.x = leftMarg + (xval + dim[xAxisAxis]) * cellW + innerMarg;
				}

				if(yval < 0) {
					res.y = topMarg + drawH - a*cellW; // flip Y-axis
				} else if(yval >= dim) {
					res.y = topMarg + drawH - (dim[yAxisAxis] + a) * cellW; // flip Y-axis
				} else {
					res.y = topMarg + drawH - (yval + a) * cellW; // flip Y-axis
				}
				if(wantsExtra === true){ res.y -= cellW - 1; }
			} else if(axis == zAxisAxis) {
				var b = yval;
				if(yval < 0) {
					res.y = topMarg + drawH - dim[yAxisAxis] * cellW - innerMarg; // flip Y-axis
					b = 0;
				} else if(yval >= dim) {
					res.y = topMarg + drawH - dim[yAxisAxis] * cellW + dim[zAxisAxis] * cellW - innerMarg; // flip Y-axis
					b = dim[zAxisAxis] - 1;
				} else {
					res.y = topMarg + drawH - (yval + dim[yAxisAxis]) * cellW - innerMarg; // flip Y-axis
				}

				if(xval < 0) {
					res.x = leftMarg + b * cellW;
				} else if(xval >= dim) {
					res.x = leftMarg + (dim[xAxisAxis] + b) * cellW;
				} else {
					res.x = leftMarg + (xval + b) * cellW;
				}
				if(wantsExtra === true){ res.y -= cellW - 1; }
			}
		}
		return res;
	},
	// This function converts a value to a intensity or a color.
	valueToIntensityOrColor: function(val, minVal, maxVal, rgbaText, sums, dataSetsToDraw, colorMode, colKey) {
		var col = [0, 0, 0, 255];
		if(colKey && colKey.length > 0) {
			var sortedPos = legacyDDSupLib.binLookup(sums, val, 0, sums.length);
			var perc = sortedPos / (sums.length - 1);
			var l = colKey.length;
			var c = Math.max(0, Math.min(l - 1, Math.floor(l * perc)));
			if(l > 1) {
				col = legacyDDSupLib.hexColorToRGBAvec(colKey[c], 1);
			}
			else {
				col = legacyDDSupLib.hexColorToRGBAvec(colKey[c], perc);
			}
			return col;
		}

		if(colorMode == "minmax") {
			var alpha = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * (val - minVal) / (maxVal - minVal))));
			col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
		}
		else if(colorMode == "hotcold") {
			if(val < 0) {
				var intensity = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * Math.abs(val) / Math.abs(minVal))));
				col = [0, 0, intensity, 255];
			}
			else {
				var intensity = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * Math.abs(val) / Math.abs(maxVal))));
				col = [intensity, 0, 0, 255];
			}
		}
		else if(colorMode == "abs") {
			var mx = Math.max(Math.abs(minVal), Math.abs(maxVal));
			var alpha = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * Math.abs(val) / mx)));
			col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
		}
		else if(colorMode == "histogram" && sums.length > 0) {
			var sortedPos = legacyDDSupLib.binLookup(sums, val, 0, sums.length);
			var perc = sortedPos / (sums.length - 1);
			var alpha = Math.floor(255 / dataSetsToDraw * perc);
			col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
		}
		return col;
	},









	//TODO: Check the ones below, that they work as intended







	//This function finds the index of a value in a sorted vector, and is used to choose a color based on all the values present
	binLookup: function(ls, val, start, end) {
		if(start >= end) {
			if(ls[start] == val) {
				return start;
			} else {
				return -1;
			}
		} else {
			var mid = Math.floor((start + end) / 2);
			if(ls[mid] == val) {
				return mid;
			}
			if(ls[mid] < val) {
				return legacyDDSupLib.binLookup(ls, val, mid+1, end);
			} else {
				return legacyDDSupLib.binLookup(ls, val, start, mid-1);
			}
		}
	},
	//This function converts pixel values to proper dimenion vaues
	pixels2dimVals: function(pos, unique, dim, leftMarg, topMarg, drawH, xAxisAxis, yAxisAxis, cellW, zAxisAxis, innerMarg) {
		var res = {"dim":null, "x":0, "y":0, "val":0};

		if(unique <= 0) {
			return res;
		}
		else if(innerMarg !== undefined) {
			var marg = Math.min(2, innerMarg);
			if(pos.x > - marg + leftMarg && pos.x < leftMarg + dim[xAxisAxis] * cellW + marg && pos.y > topMarg + drawH - dim[yAxisAxis] * cellW - marg && pos.y < topMarg + drawH + marg) {
				res.dim = xAxisAxis;
				res.x = Math.max(0, Math.min(dim[xAxisAxis] - 1, Math.floor( (pos.x - leftMarg) / cellW)));
				res.y = Math.max(0, Math.min(dim[yAxisAxis] - 1, Math.floor( (topMarg + drawH - pos.y) / cellW)));
				res.val = res.x;

				return res;
			}

			if(pos.x > leftMarg + dim[xAxisAxis] * cellW + innerMarg - marg && pos.x < leftMarg + dim[xAxisAxis] * cellW  + dim[zAxisAxis] * cellW + innerMarg + marg) {
				var a = Math.max(0, Math.min(dim[zAxisAxis] - 1, Math.floor((pos.x - leftMarg - innerMarg - dim[xAxisAxis] * cellW) / cellW)));
				if(pos.y < topMarg + drawH - a * cellW + marg && pos.y > topMarg + drawH - (dim[yAxisAxis] + a) * cellW - marg) {
					res.dim = yAxisAxis;
					res.x = a;
					res.y = Math.max(0, Math.min(dim[yAxisAxis] - 1, Math.floor( (topMarg + drawH - pos.y - a * cellW) / cellW)));
					res.val = res.y;

					return res;
				}
			}

			if(pos.y > topMarg + drawH - dim[yAxisAxis] * cellW - dim[zAxisAxis] * cellW - innerMarg - marg && pos.y < topMarg + drawH - dim[yAxisAxis] * cellW - innerMarg + marg) {
				var b = Math.max(0, Math.min(dim[zAxisAxis] - 1, Math.floor( (topMarg + drawH - innerMarg - dim[yAxisAxis] * cellW - pos.y) / cellW)));

				if(pos.x > leftMarg + b * cellW - marg && pos.x < leftMarg + dim[xAxisAxis] * cellW + b * cellW + marg) {
					res.dim = zAxisAxis;
					res.x = Math.max(0, Math.min(dim[xAxisAxis] - 1, Math.floor( (pos.x - leftMarg - b * cellW) / cellW)));
					res.y = b;
					res.val = res.y;

					return res;
				}
			}
		}
		else {
			res.dim = xAxisAxis;
			res.x = Math.max(0, Math.min(dim[xAxisAxis] - 1, Math.floor( (pos.x - leftMarg) / cellW)));
			res.y = Math.max(0, Math.min(dim[yAxisAxis] - 1, Math.floor( (topMarg + drawH - pos.y) / cellW)));
			res.val = res.x;

			return res;
		}
		return res;
	},
	//This function blends color sets
	blendCols: function(col1, col2) {
		var res = [0,0,0,0];
		var oldA = col1[3] / 255.0;
		var newA = col2[3] / 255.0;
		var remainA = (1 - newA) * oldA;
		var outA = newA + remainA;
		if(outA > 0) {
			var oldR = col1[0];
			var oldG = col1[1];
			var oldB = col1[2];
			var outR = Math.min(255, (oldR * remainA + newA * col2[0]) / outA);
			var outG = Math.min(255, (oldG * remainA + newA * col2[1]) / outA);
			var outB = Math.min(255, (oldB * remainA + newA * col2[2]) / outA);
		} else {
			var outR = 0;
			var outG = 0;
			var outB = 0;
		}
		res[0] = outR;
		res[1] = outG;
		res[2] = outB;
		res[3] = Math.min(255, outA * 255);

		return res;
	},
	// This function fills a rectangle quickly.
	fillRectFast: function (X1, Y1, DX, DY, r, g, b, alpha, pixels, Width, Height) {
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var dx = Math.round(DX);
		var dy = Math.round(DY);

		for(var j = 0; j < dy; j++) {
			for (var i = 0; i < dx; i++) {
				var rx = x1 + i;
				var ry = y1 + j;
				if(ry >= 0 && ry < H && rx >= 0 && rx < W) {
					var offset = (ry * W + rx) * 4;

					if(alpha < 255) {
						legacyDDSupLib.blendRGBAs(r,g,b,alpha, offset, pixels);
					} else {
						pixels[offset] = r;
						pixels[offset+1] = g;
						pixels[offset+2] = b;
						pixels[offset+3] = alpha;
					}
				}
			}
		}
	}
}


