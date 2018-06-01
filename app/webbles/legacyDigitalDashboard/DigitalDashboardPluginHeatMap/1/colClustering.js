self.addEventListener('message', function(e) {
    var data = e.data;

    if(data.hasOwnProperty("start") && data.start) {
	// console.log('Column Worker got \'start\'!');
	doActualColClustering(data.heatMap, data.noofRows, data.noofCols, self);
    }
}, false);

function doActualColClustering(heatMap, noofRows, noofCols, thread) {
    var distMatrix = [];
    var startingClusters = [];
    var dist;
    var c1;
    var c2;

    // console.log('Column Worker building distance matrix');
    for(c1 = 0; c1 < noofCols; c1++) { // need to go to the last one for the startinClusters, not noofCols - 1
	distMatrix.push([]);
	
	startingClusters.push([[c1], []]); // [[all members], [left cluster, right cluster]]

	for(c2 = 0; c2 < noofCols; c2++) {
	    if(c2 <= c1) {
		distMatrix[c1].push(null);
	    } else {
		dist = 0;
		
		for(var r = 0; r < noofRows; r++) {
		    if(heatMap[r] !== null) {
			var d = heatMap[r][c1][0] - heatMap[r][c2][0];
			dist += d*d;
		    }
		}    
		distMatrix[c1].push(dist);
	    }
	}
    }
    
    // console.log('Column Worker distance matrix finished. Cluster.');
    while(startingClusters.length > 1) {
	var merge = [0, 1, rowDist(startingClusters[0][0][0], startingClusters[1][0][0], distMatrix)];

	for(c1 = 0; merge[2] > 0 && c1 < startingClusters.length; c1++) {
	    var cluster1 = startingClusters[c1];
	    for(c2 = c1+1; c2 < startingClusters.length; c2++) {
		var cluster2 = startingClusters[c2];

		dist = clusterDist(cluster1, cluster2, distMatrix);
		
		if(dist < merge[2]) {
		    merge = [c1, c2, dist];
		}

		if(merge[2] === 0) {
		    break; // cannot get better than 0
		}
	    }
	}

	// merge clusters
	c1 = startingClusters[merge[0]];
	c2 = startingClusters[merge[1]];

	if(rowDist(c1[0][0], c2[0][c2[0].length - 1], distMatrix)
	   < rowDist(c1[0][c1[0].length - 1], c2[0][0], distMatrix)) {
	    c2 = startingClusters[merge[0]];	
	    c1 = startingClusters[merge[1]];
	}

	// try reversing the lists too, to see if that gives even shorter distance?

	var newClusterMembers = [];
	var m;
	for(m = 0; m < c1[0].length; m++) {
	    newClusterMembers.push(c1[0][m]);
	}
	for(m = 0; m < c2[0].length; m++) {
	    newClusterMembers.push(c2[0][m]);
	}
	var newCluster = [newClusterMembers, [startingClusters[merge[0]], startingClusters[merge[1]]]];
	startingClusters.splice(merge[1], 1); // remove rightmost cluster first, or the index will not be correct for the other one
	startingClusters.splice(merge[0], 1, newCluster);
    }

    // the top cluster now has the members in a somewhat sorted order

    // console.log('Column Worker clustering finished. Build result.');

    var newColIdxToOnScreenIdx = [];
    var newColOnScreenIdxToIdx = [];
    var c;
    for(c = 0; c < noofCols; c++) {
	newColIdxToOnScreenIdx.push(-1);
	newColOnScreenIdxToIdx.push(-1);
    }

    for(c = 0; c < startingClusters[0][0].length; c++) {
	newColIdxToOnScreenIdx[startingClusters[0][0][c]] = c;
	newColOnScreenIdxToIdx[c] = startingClusters[0][0][c];
    }
    
    var data = {};
    data.newColIdxToOnScreenIdx = newColIdxToOnScreenIdx;
    data.newColOnScreenIdxToIdx = newColOnScreenIdxToIdx;
    data.colTopCluster = startingClusters[0];

    thread.postMessage(data);

    // console.log('Column Worker can be terminated.');
}

function clusterDist(c1, c2, distMatrix) {
    var dist = rowDist(c1[0][0], c2[0][0], distMatrix);
    for(var r1 = 0; r1 < c1[0].length; r1++) {
	for(var r2 = 0; r2 < c2[0].length; r2++) {
	    dist = Math.min(dist, rowDist(c1[0][r1], c2[0][r2], distMatrix) );
	}
    }
    return dist;
}

function rowDist(c1, c2, matrix) {
    var r2 = c1;
    var r1 = c2;
    if(c1 < c2) {
	r1 = c1;
	r2 = c2;
    }

    return matrix[r1][r2];
}

