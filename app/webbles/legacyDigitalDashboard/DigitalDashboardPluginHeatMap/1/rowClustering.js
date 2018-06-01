self.addEventListener('message', function(e) {
    var data = e.data;
    if(data.hasOwnProperty("start") && data.start) {
	// console.log('Row Worker got \'start\'!');
	doActualRowClustering(data.heatMap, data.noofRows, data.noofCols, self);
    }
}, false);

function doActualRowClustering(heatMap, noofRows, noofCols, thread) {
    var distMatrix = [];
    var startingClusters = [];
    var dist = 0;

    // console.log('Row Worker building distance matrix');
    for(var r1 = 0; r1 < noofRows; r1++) { // need to go to the last one for the startinClusters, not noofRows - 1
	if(heatMap[r1] !== null) {
	    distMatrix.push([]);
	    
	    startingClusters.push([[r1], []]); // [[all members], [left cluster, right cluster]]

	    for(var r2 = 0; r2 < noofRows; r2++) {
		if(r2 <= r1) {
		    distMatrix[r1].push(null);
		} else {
		    if(heatMap[r2] !== null) {
			dist = 0;
			
			for(var c = 0; c < noofCols; c++) {
			    var d = heatMap[r2][c][0] - heatMap[r1][c][0];
			    dist += d*d;
			}
			
			distMatrix[r1].push(dist);
		    } else {
			distMatrix[r1].push(null);
		    }
		}
	    }
	} else {
	    distMatrix.push(null);
	}
    }

    // console.log('Row Worker distance matrix finished. Cluster.');
    while(startingClusters.length > 1) {
	var merge = [0, 1, rowDist(startingClusters[0][0][0], startingClusters[1][0][0], distMatrix)];

	var c1;
	var c2;
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

    // console.log('Row Worker clustering finished. Build result.');
    // the top cluster now has the members in a somewhat sorted order

    var newRowIdxToOnScreenIdx = [];
    var newRowOnScreenIdxToIdx = [];
    var r;
    for(r = 0; r < noofRows; r++) {
	newRowIdxToOnScreenIdx.push(-1);
	newRowOnScreenIdxToIdx.push(-1);
    }

    for(r = 0; r < startingClusters[0][0].length; r++) {
	newRowIdxToOnScreenIdx[startingClusters[0][0][r]] = r;
	newRowOnScreenIdxToIdx[r] = startingClusters[0][0][r];
    }
    
    var nullRows = r;
    // put all the rows with no data at the bottom
    for(r = 0; r < noofRows; r++) {
	if(newRowIdxToOnScreenIdx[r] == -1) {
	    newRowIdxToOnScreenIdx[r] = nullRows;
	    newRowOnScreenIdxToIdx[nullRows] = r;
	    nullRows++;
	}
    }

    var data = {};
    data.newRowIdxToOnScreenIdx = newRowIdxToOnScreenIdx;
    data.newRowOnScreenIdxToIdx = newRowOnScreenIdxToIdx;
    data.rowTopCluster = startingClusters[0];

    thread.postMessage(data);
    // console.log('Row Worker can be terminated.');
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

