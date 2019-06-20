self.addEventListener('message', function(e) {
    var args = e.args;
    if(args.hasOwnProperty("start") && args.start) {
	// console.log('Row Worker got \'start\'!');
	drawData(args, self);
    }
}, false);

function drawData(args, thread) {
    var dataMappings = args.dataMappings;

    var myCanvas = document.createElement('canvas');
    myCanvas.width = drawW;
    myCanvas.height = drawH;
    var myCtx = myCanvas.getContext('2d');

    var uCanvas = document.createElement('canvas');
    uCanvas.width = drawW;
    uCanvas.height = drawH;
    var uCtx = uCanvas.getContext('2d');

    for(var src = 0; src < dataMappings.length; src++) {
    	if(dataMappings[src].active) {
	    if(dataMappings[src].vizType == 0
	       || dataMappings[src].vizType == 1) { // points or lines
		drawCartesianPlot(args, src);
	    } else if(dataMappings[src].vizType == 2) {
		drawHeatmap(args, src);
	    } else if(dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) {
		draw3D(args, src);
	    }
	}
    }

    var res = {};
    res.imData0 = uCanvas; // image for the unselected data
    res.imData = myCanvas; // image for the selected data

    thread.postMessage(res);
}


function drawCartesianPlot(args, myCanvas, myCtx, uCanvas, uCtx, src) {
    
    var currentColors = args.colorScheme;
    var colorPalette = {};
    var drawW = args.drawW;
    var drawH = args.drawH;
    var dataMappings = args.dataMappings;
    var transparency = args.transparency;

    var scale = Math.pow(2, args.mapZoom);

    try {
	var mapBounds = args.map.getBounds();
	var mapNE = mapBounds.getNorthEast();
	var mapSW = mapBounds.getSouthWest();
	var proj = args.map.getProjection();
	var NEpx = proj.fromLatLngToPoint(mapNE);
	var SWpx = proj.fromLatLngToPoint(mapSW);
	var NSpxs = SWpx.y * scale - NEpx.y * scale; // subtracting small numbers gives loss of precision?
	var WEpxs = NEpx.x * scale - SWpx.x * scale;

    	var mapMinLat = mapSW.lat();
    	var mapMaxLat = mapNE.lat();
    	var mapMinLon = mapSW.lng();
    	var mapMaxLon = mapNE.lng();

    	var passDateLine = false;
    	if(mapMinLon > mapMaxLon) {
    	    passDateLine = true;
    	}

	var worldWidth = 256 * scale;

	var mapWorldWraps = false;
	if(drawW > worldWidth) {
	    mapWorldWraps = true;
	}
	var currentPlace = map.getCenter();
    	var pCenter = proj.fromLatLngToPoint(currentPlace);

    } catch(e) {
	console.log("Background threa: No map to draw on yet");
	return;
    }

    var col;
    var fill;

    var zeroTransp = 0.33;
    if(transparency < 1) {
	zeroTransp *= transparency;
    }

    var drawPretty = true;
    if(unique > quickRenderThreshold) {
	drawPretty = false;
	var rgba0 = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(0, currentColors, colorPalette), zeroTransp);
	var rgbaText = legacyDDSupLib.hexColorToRGBAvec(textColor, 1.0);
	var imData = myCtx.getImageData(0, 0, myCanvas.width, myCanvas.height);
	var imData0 = uCtx.getImageData(0, 0, uCanvas.width, uCanvas.height);
	var pixels = imData.data;
	var pixels0 = imData0.data;
    } else {
    	var col0 = legacyDDSupLib.hexColorToRGBA(getColForGroup(0, currentColors, colorPalette), zeroTransp);
    	var fill0 = getGradColForGroup(0, zeroTransp, uCanvas, uCtx, currentColors, colorPalette);
    }

    if(dataMappings[src].active) {
    	var fsel = dataMappings[src].selFun;
    	var size = dataMappings[src].size;

	if(dataMappings[src].vizType == 0) { // points
	    var flat1 = dataMappings[src].valFunLat1;
	    var flon1 = dataMappings[src].valFunLon1;

    	    for(var i = 0; i < size; i++) {
		var lon1 = flon1(i);
		var lat1 = flat1(i);

		if(lon1 !== null && lat1 !== null) {
    		    var groupId = fsel(i);

		    var p1 = new google.maps.LatLng(lat1, lon1);
		    if(mapBounds.contains(p1)) {
			var p1px = proj.fromLatLngToPoint(p1);

			var x1 = leftMarg + Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
    			var y1 = topMarg + (p1px.y * scale - NEpx.y * scale);
			
			var offset = 0;
			while(x1 + offset <= leftMarg + drawW) {
			    if(drawPretty) {
				if(groupId == 0) {
				    fill = fill0;
				    
    				    uCtx.save();
    				    uCtx.beginPath();
    				    uCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
    				    uCtx.fillStyle = fill;
    				    uCtx.fill();
    				    uCtx.lineWidth = 1;
    				    uCtx.strokeStyle = col;
    				    uCtx.stroke();
    				    uCtx.restore();
				} else {
				    if(transparency >= 1) {
    					fill = getGradColForGroup(groupId, 1, myCanvas, myCtx, currentColors, colorPalette);
				    } else {
					fill = getGradColForGroup(groupId, transparency, myCanvas, myCtx, currentColors, colorPalette);
				    }

    				    myCtx.save();
    				    myCtx.beginPath();
    				    myCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
    				    myCtx.fillStyle = fill;
    				    myCtx.fill();
    				    myCtx.lineWidth = 1;
    				    myCtx.strokeStyle = col;
    				    myCtx.stroke();
    				    myCtx.restore();
				}					
			    } else { // drawPretty is false
				if(groupId == 0) {
				    drawDotfullalpha(x1 + offset, y1, dotSize, rgba0[3], rgba0[0], rgba0[1], rgba0[2], pixels0, uCanvas.width);
				} else {
				    if(transparency >= 1) {
					rgba = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(groupId, currentColors, colorPalette), 1);
					drawDotfullalpha(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				    } else {
					rgba = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(groupId, currentColors, colorPalette), transparency);
					drawDot(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				    }
				}
			    }
			    offset += worldWidth;
			}

			offset = -worldWidth;
			while(x1 + offset >= leftMarg) {
			    if(drawPretty) {
				if(groupId == 0) {
				    fill = fill0;
				    
    				    uCtx.save();
    				    uCtx.beginPath();
    				    uCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
    				    uCtx.fillStyle = fill;
    				    uCtx.fill();
    				    uCtx.lineWidth = 1;
    				    uCtx.strokeStyle = col;
    				    uCtx.stroke();
    				    uCtx.restore();
				} else {
				    if(transparency >= 1) {
    					fill = getGradColForGroup(groupId, 1, myCanvas, myCtx, currentColors, colorPalette);
				    } else {
					fill = getGradColForGroup(groupId, transparency, myCanvas, myCtx, currentColors, colorPalette);
				    }

    				    myCtx.save();
    				    myCtx.beginPath();
    				    myCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
    				    myCtx.fillStyle = fill;
    				    myCtx.fill();
    				    myCtx.lineWidth = 1;
    				    myCtx.strokeStyle = col;
    				    myCtx.stroke();
    				    myCtx.restore();
				}					
			    } else { // drawPretty is false
				if(groupId == 0) {
				    drawDotfullalpha(x1 + offset, y1, dotSize, rgba0[3], rgba0[0], rgba0[1], rgba0[2], pixels0, uCanvas.width);
				} else {
				    if(transparency >= 1) {
					rgba = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(groupId, currentColors, colorPalette), 1);
					drawDotfullalpha(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				    } else {
					rgba = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(groupId, currentColors, colorPalette), transparency);
					drawDot(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				    }
				}
			    }
			    offset -= worldWidth;
			}
		    }
		}
	    }

	} else if(dataMappings[src].vizType == 1) { // lines
	    var flat1 = dataMappings[src].valFunLat1;
	    var flon1 = dataMappings[src].valFunLon1;
	    var flat2 = dataMappings[src].valFunLat2;
	    var flon2 = dataMappings[src].valFunLon2;

    	    for(var i = 0; i < size; i++) {
		var lon1 = flon1(i);
		var lat1 = flat1(i);
		var lon2 = flon2(i);
		var lat2 = flat2(i);

		if(lon1 !== null && lat1 !== null && lon2 !== null && lat2 !== null) {
    		    var groupId = fsel(i);

		    var bounds = new google.maps.LatLngBounds();
		    var p1 = new google.maps.LatLng(lat1, lon1);
		    var p2 = new google.maps.LatLng(lat2, lon2);
		    bounds.extend(p1);
		    bounds.extend(p2);

		    if(bounds.intersects(mapBounds)) {

			var p1px = proj.fromLatLngToPoint(p1);
			var p2px = proj.fromLatLngToPoint(p2);

			if(true || mapWorldWraps) {
			    var x1 = leftMarg + Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
			    var x2 = leftMarg + Math.floor(drawW/2 + p2px.x * scale - pCenter.x * scale);
			} else {
			    if(passDateLine && (lon1[i] > 180)) {
    	    			var x1 = Math.floor(leftMarg + drawW - (NEpx.x * scale - p1px.x * scale));
			    } else {
    				var x1 = leftMarg + Math.floor(p1px.x * scale - SWpx.x * scale);
			    }
			    if(passDateLine && (lon2[i] > 180)) {
    	    			var x2 = Math.floor(leftMarg + drawW - (NEpx.x * scale - p2px.x * scale));
			    } else {
    				var x2 = leftMarg + Math.floor(p2px.x * scale - SWpx.x * scale);
			    }
			}

    			var y1 = topMarg + (p1px.y * scale - NEpx.y * scale);
    			var y2 = topMarg + (p2px.y * scale - NEpx.y * scale);

			var offset = 0;
			while(x1 + offset <= leftMarg + drawW
			      || x2 + offset <= leftMarg + drawW) {
			    if(drawPretty) {
				if(groupId == 0) {
				    col = col0;

    				    uCtx.save();
    				    uCtx.beginPath();
    				    uCtx.strokeStyle = col;
    				    uCtx.lineWidth = lineWidth;
    				    uCtx.moveTo(x1 + offset, y1);
    				    uCtx.lineTo(x2 + offset, y2);
    				    uCtx.stroke();
    				    uCtx.restore();
				    
				} else {
				    col = legacyDDSupLib.hexColorToRGBA(getColForGroup(groupId, currentColors, colorPalette), transparency);

    				    myCtx.save();
    				    myCtx.beginPath();
    				    myCtx.strokeStyle = col;
    				    myCtx.lineWidth = lineWidth;
    				    myCtx.moveTo(x1 + offset, y1);
    				    myCtx.lineTo(x2 + offset, y2);
    				    myCtx.stroke();
    				    myCtx.restore();
				}
				
			    } else {
				if(groupId == 0) {
				    col = rgba0;

				    drawLineDDAfullalpha(pixels0, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], uCanvas.width);

				} else {

				    col = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(groupId, currentColors, colorPalette), transparency);
				    if(transparency >= 1) {
					drawLineDDAfullalpha(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    } else {
					drawLineDDA(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    }
				}
			    }
			    offset += worldWidth;
			}

			offset = -worldWidth;
			while(x1 + offset >= leftMarg
			      || x2 + offset >= leftMarg) {
			    if(drawPretty) {
				if(groupId == 0) {
				    col = col0;

    				    uCtx.save();
    				    uCtx.beginPath();
    				    uCtx.strokeStyle = col;
    				    uCtx.lineWidth = lineWidth;
    				    uCtx.moveTo(x1 + offset, y1);
    				    uCtx.lineTo(x2 + offset, y2);
    				    uCtx.stroke();
    				    uCtx.restore();
				    
				} else {
				    col = legacyDDSupLib.hexColorToRGBA(getColForGroup(groupId, currentColors, colorPalette), transparency);

    				    myCtx.save();
    				    myCtx.beginPath();
    				    myCtx.strokeStyle = col;
    				    myCtx.lineWidth = lineWidth;
    				    myCtx.moveTo(x1 + offset, y1);
    				    myCtx.lineTo(x2 + offset, y2);
    				    myCtx.stroke();
    				    myCtx.restore();
				}
				
			    } else {
				if(groupId == 0) {
				    col = rgba0;

				    drawLineDDAfullalpha(pixels0, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], uCanvas.width);

				} else {

				    col = legacyDDSupLib.hexColorToRGBAvec(getColForGroup(groupId, currentColors, colorPalette), transparency);
				    if(transparency >= 1) {
					drawLineDDAfullalpha(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    } else {
					drawLineDDA(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    }
				}
			    }
			    offset -= worldWidth;
			}
		    }

		}
	    }
	}
    }
    
    uCtx.putImageData(imData0, 0, 0);
    myCtx.putImageData(imData, 0, 0);
}


function getGradColForGroup(group, alpha, myCanvas, myCtx, currentColors, colorPalette) {
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
	
    	if(groupCols.hasOwnProperty(group) && myCtx !== null && groupCols[group].hasOwnProperty('gradient') && H > 0 && W > 0) {
    	    var OK = true;
	    
	    try {
    		var grd = myCtx.createLinearGradient(0,0,W,H);
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
    } else {
    	return colorPalette[group];
    }
}

function getColForGroup(group, currentColors, colorPalette) {
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
}



function drawDot(X, Y, DOTSIZE, alpha, r, g, b, pixels, ArrayLineWidth) {
    var W = Math.floor(leftMarg + drawW);
    var H = Math.floor(topMarg + drawH);

    var ALW = Math.floor(ArrayLineWidth);

    var xpos = Math.round(X);
    var ypos = Math.round(Y);
    var dotSize = Math.round(DOTSIZE);
    var halfDot = Math.round(DOTSIZE/2);

    var startPixelIdx = (ypos * ALW + xpos) * 4;

    var r2 = Math.ceil(dotSize * dotSize / 4.0);

    for (var x = -halfDot; x < halfDot + 1; x++)
    {
	if (x + xpos >= leftMarg && x + xpos < W) {
	    var x2 = x * x;
	    
	    for (var y = -halfDot; y < halfDot + 1; y++)
	    {
                if(y + ypos >= topMarg && y + ypos < H)
                {
		    var y2 = y * y;
		    
		    if (y2 + x2 <= r2)
		    {
			var offset = (y * ALW + x) * 4;

			blendRGBAs(r,g,b, alpha, startPixelIdx + offset, pixels);
		    }
                }
	    }
	}
    }
}

function drawDotfullalpha(X, Y, DOTSIZE, alpha, r, g, b, pixels, ArrayLineWidth) {
    var W = Math.floor(leftMarg + drawW);
    var H = Math.floor(topMarg + drawH);

    var ALW = Math.floor(ArrayLineWidth);

    var xpos = Math.round(X);
    var ypos = Math.round(Y);
    var dotSize = Math.round(DOTSIZE);
    var halfDot = Math.round(DOTSIZE/2);

    var startPixelIdx = (ypos * ALW + xpos) * 4;

    var r2 = Math.ceil(dotSize * dotSize / 4.0);

    for (var x = -halfDot; x < halfDot + 1; x++)
    {
	if (x + xpos >= leftMarg && x + xpos < W) {
	    var x2 = x * x;
	    
	    for (var y = -halfDot; y < halfDot + 1; y++)
	    {
                if(y + ypos >= topMarg && y + ypos < H)
                {
		    var y2 = y * y;
		    
		    if (y2 + x2 <= r2)
		    {
			var offset = (y * ALW + x) * 4;
                        pixels[startPixelIdx + offset] = r;
                        pixels[startPixelIdx + offset + 1] = g;
                        pixels[startPixelIdx + offset + 2] = b;
                        pixels[startPixelIdx + offset + 3] = alpha;
		    }
                }
	    }
	}
    }
}

// This line drawing function was copied from http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
// The code is not original to me. I was very slightly modified by me.
/// <summary>
/// Draws a colored line by connecting two points using a DDA algorithm (Digital Differential Analyzer).
/// </summary>
function drawLineDDA(pixels, X1, Y1, X2, Y2, r, g, b, alpha, ArrayLineWidth)
{
    var W = Math.floor(leftMarg + drawW);
    var H = Math.floor(topMarg + drawH);

    var ALW = Math.floor(ArrayLineWidth);

    var x1 = Math.round(X1);
    var y1 = Math.round(Y1);
    var x2 = Math.round(X2);
    var y2 = Math.round(Y2);

    // Distance start and end point
    var dx = x2 - x1 + 1;
    var dy = y2 - y1 + 1;

    // Determine slope (absoulte value)
    var len = dy >= 0 ? dy : -dy;
    var lenx = dx >= 0 ? dx : -dx;
    var fatX = true;
    if (lenx > len)
    {
        len = lenx;
	fatX = false;
    }

    // Prevent divison by zero
    if (len != 0)
    {
        // Init steps and start
        var incx = dx / len;
        var incy = dy / len;
        var x = x1;
        var y = y1;

        // Walk the line!
        for (var i = 0; i < len; i++)
        {
	    var ry = Math.round(y);
	    var rx = Math.round(x);
	    
	    for(var w = 0; w < lineWidth; w++) {
		if(ry >= topMarg && ry < H
		   && rx >= leftMarg && rx < W) {

		    var offset = (ry * ALW + rx) * 4;

		    blendRGBAs(r,g,b,alpha, offset, pixels);
		}
		if(fatX) {
		    rx++;
		} else {
		    ry++;
		}
	    }
            x += incx;
            y += incy;
        }
    }
}

function drawLineDDAfullalpha(pixels, X1, Y1, X2, Y2, r, g, b, alpha, ArrayLineWidth)
{
    var W = Math.floor(leftMarg + drawW);
    var H = Math.floor(topMarg + drawH);

    var ALW = Math.floor(ArrayLineWidth);

    var x1 = Math.round(X1);
    var y1 = Math.round(Y1);
    var x2 = Math.round(X2);
    var y2 = Math.round(Y2);

    // Distance start and end point
    var dx = x2 - x1 + 1;
    var dy = y2 - y1 + 1;

    // Determine slope (absoulte value)
    var len = dy >= 0 ? dy : -dy;
    var lenx = dx >= 0 ? dx : -dx;
    var fatX = true;
    if (lenx > len)
    {
        len = lenx;
	fatX = false;
    }

    // Prevent divison by zero
    if (len != 0)
    {
        // Init steps and start
        var incx = dx / len;
        var incy = dy / len;
        var x = x1;
        var y = y1;

        // Walk the line!
        for (var i = 0; i < len; i++)
        {
	    var ry = Math.round(y);
	    var rx = Math.round(x);
	    
	    for(var w = 0; w < lineWidth; w++) {
		if(ry >= topMarg && ry < H
		   && rx >= leftMarg && rx < W) {

		    var offset = (ry * ALW + rx) * 4;

		    pixels[offset] = r;
		    pixels[offset+1] = g;
		    pixels[offset+2] = b;
		    pixels[offset+3] = alpha;
		}
		if(fatX) {
		    rx++;
		} else {
		    ry++;
		}
	    }
            x += incx;
            y += incy;
        }
    }
}
