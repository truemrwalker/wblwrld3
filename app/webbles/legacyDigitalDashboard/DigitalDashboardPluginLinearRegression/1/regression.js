self.addEventListener('message', function(e) {
    var data = e.data;
    if(data.hasOwnProperty("start") && data.start) {
	console.log('LinearRegression Worker got \'start\'!');
	linearRegressionThread(data.missingVal, data.coordArrays, self);
    }
}, false);

function linearRegressionThread (missingVal, coordArrays, thread) {
    // simple "Ordinary least squares"

    // solve for beta
    // beta = invert( transp(X) * X ) * transp(X)*y
    
    // use beta to fill in missing values
    // y = X * beta

    // build X from inputs where Y has a value

    X = [];
    y = [];
    var ys = 0;
    for(var set = 0; set < coordArrays[0].length; set++) {
	for(var i = 0; i < coordArrays[0][set].length; i++) {
	    if(coordArrays[0][set][i] != missingVal) {
		y.push(coordArrays[0][set][i]);

		X.push([]);
		for(var par = 1; par < coordArrays.length; par++) { 
		    // skip first parameter, which is the dependent
		    X[ys].push(coordArrays[par][set][i]);
		}

		ys++;
	    }
	}
    }

    var XtX = [];
    for(i = 0; i < X[0].length; i++) { 
	XtX.push([]);
	for(var j = 0; j < X[0].length; j++) {
	    XtX[i].push(0);

	    // XtX[i,j] = 0;
	    for(var idx = 0; idx < X.length; idx++) {
		XtX[i][j] += X[idx][i] * X[idx][j];
	    }
	}
    }

    var inv = invert(XtX);
    if(inv.length <= 0) {
	// not invertible

	var data = {};
	data.linearRegressionRes = [];
	
	thread.postMessage(data);
    }

    
    var Xty = [];
    for(i = 0; i < X[0].length; i++) {
	Xty.push(0);
	for(j = 0; j < y.length; j++) {
	    Xty[i] += X[j][i] * y[j]; // want transpose of X, thus j and i are reversed
	}
    }

    var beta = [];
    for(i = 0; i < inv.length; i++) {
	beta.push(0);
	
	for(j = 0; j < inv.length; j++) { 
	    beta[i] += inv[i][j] * Xty[j];
	}
    }

    var predictions = [];

    for(var set = 0; set < coordArrays[0].length; set++) {
	predictions.push([]);
	for(var i = 0; i < coordArrays[0][set].length; i++) {
	    predictions[set].push(0);
	    for(var par = 1; par < coordArrays.length; par++) { 
		predictions[set][i] += coordArrays[par][set][i] * beta[par - 1];
	    }
	}
    }

    var data = {};
    data.linearRegressionRes = predictions;

    thread.postMessage(data);
    console.log('LinearRegression Worker can be terminated.');
}

function invert(M) {
    var augM = [];
    for(var row = 0; row < M.length; row++) {
	augM.push([]);
	for(var col = 0; col < M.length; col++) {
	    augM[row].push(M[row][col]);
	}
	for(col = 0; col < M.length; col++) {
	    if(col == row) {
		augM[row].push(1);
	    } else {
		augM[row].push(0);
	    }
	}
    }

    for(var i = 0; i < M.length; i++) {
	//// find largest pivot
	var max = Math.abs(augM[i][i]);
	var maxrow = i;
	for(var j = i; j < M.length; j++) {
	    if(Math.abs(augM[i][j]) > max) {
	    	max = Math.abs(augM[j][i]);
		maxrow = j;
	    }
	}
	if(maxrow != i) {
	    var temp = augM[i];
	    augM[i] = augM[maxrow];
	    augM[maxrow] = temp;
	}
	
	var scale = augM[i][i];

	if(scale == 0) {
	    console.log('matrix is not invertible');
	    return [];
	}

	for(var j = i; j < augM[i].length; j++) {
	    augM[i][j] /= scale;
	}

	for(var i2 = 0; i2 < M.length; i2++) {
	    if(i != i2) {
		var fact = augM[i2][i];
		for(var j = i; j < augM[i2].length; j++) {
		    augM[i2][j] -= augM[i][j] * fact;
		}
	    }
	}
    }

    var res = [];
    for(i = 0; i < M.length; i++) {
	res.push([]);
	for(j = 0; j < M.length; j++) {
	    res[i].push(augM[i][M.length + j]);
	}
    }
    return res;
}
