self.addEventListener('message', function(e) {
    var data = e.data;
    if(data.hasOwnProperty("start") && data.start) {
	// console.log('Item Set Mining Worker got \'start\'!');
	FPGrowth(data, self);
    }
}, false);

function FPGrowth(data, thread)
{
    // pass 1, count support for items

    var countsPerGroup = {};
    var totalsPerGroup = {};

    var groupIds = [];

    // var mapGroupIds = {"0":0};
    // var nextMapped = 1;

    var transactions = data.transactions;
    var onlyItemSetMining = data.onlyItemSetMining;
    var separateMiningForEachGroup = data.separateMiningForEachGroup;
    var includeUnselectedWhenMining = data.includeUnselectedWhenMining;
    var includeEmptyTransactionsWhenCalculatingSupport = data.includeEmptyTransactionsWhenCalculatingSupport;

    var minSupport = data.minSupport;
    var minConfidence = data.minConfidence;
    var maximumNoofItemsAllowed = data.maximumNoofItemsAllowed;

    for(var set = 0; set < transactions.length; set++) {
    	var selArray = [];
    	if(set < data.globalSelections.length) {
    	    selArray = data.globalSelections[set];
    	}

	groupIds.push([]);

    	for(var i = 0; i < transactions[set].length; i++) {
            var groupId = 0;
	    
    	    if(i < selArray.length) {
    		groupId = selArray[i];
    	    }

	    // if(!mapGroupIds.hasOwnProperty(groupId)) {
	    //     mapGroupIds[groupId] = nextMapped++;
	    // }
	    // groupId = mapGroupIds[groupId];
	    
	    if (!separateMiningForEachGroup) {
                if (groupId > 0 || includeUnselectedWhenMining)
                {
		    groupId = 1;
                }
	    }
	    
	    groupIds[set].push(groupId);

	    if (includeUnselectedWhenMining || groupId > 0) {
                if (!countsPerGroup.hasOwnProperty(groupId)) {
		    countsPerGroup[groupId] = {};
		    totalsPerGroup[groupId] = 0;
		}

		var counts = countsPerGroup[groupId];

		var ls = transactions[set][i];

		if (includeEmptyTransactionsWhenCalculatingSupport || ls.length > 0)
		{
                    totalsPerGroup[groupId] += 1;
		}

		for(var sidx = 0; sidx < ls.length; sidx++) {
		    var s = ls[sidx];

                    if (counts.hasOwnProperty(s)) {
			counts[s] += 1;
                    } else {
			counts[s] = 1;
                    }
		}
            }
	}
    }

    // console.log('Item Set Mining Worker calculated prelininary supports.');

    var result = {};

    var itemsSoFar = 0;

    for(var groupId in countsPerGroup) {
        var minSupportGroup = Math.ceil(minSupport * totalsPerGroup[groupId]);

        var counts = countsPerGroup[groupId];

        var root = {'item':"", 
		    'support':0,
		    'sibling':null,
		    'parent':null,
		    'children':{}};

        // pass 1 finished, itemsToUse has the items in decreasing order

        var successors = {};

    	for(var set = 0; set < transactions.length; set++) {
    	    for(var idx = 0; idx < transactions[set].length; idx++) {
                if (groupIds[set][idx] == groupId) {
		    var items = [];
		    
		    var ls = transactions[set][idx];
		    for(var sidx = 0; sidx < ls.length; sidx++){
			var s = ls[sidx];

			// insert and keep list sorted
			// linear search of index to instert at can be made faster (binary search works in sorted list), but use linear for now

                        var count = counts[s];
                        if (count >= minSupportGroup)
                        {
			    items.push(s);

			    var i = 0;
			    while (i < items.length)
			    {
                                if (counts[items[i]] < count)
                                {
				    break;
                                }
                                i++;
			    }

			    if (i != items.length)
			    {
                                for (var j = items.length - 1; j > i; j--)
                                {
				    items[j] = items[j - 1];
                                }
                                items[i] = s;
			    }
                        }
		    }

		    // items now has the items that are frequent enough, sorted
		    if (items.length > 0)
		    {
                        FPInsert(items, root, 1, successors);
		    }
                }
	    }
	}

	// console.log('Item Set Mining Worker made a big tree for group ' + groupId + '.');

        // we have the big tree. recursively extract item sets by building other trees

        var theResult = [];
        var emptyLs = [];

        RecursiveFPExtract(theResult, emptyLs, successors, root, minSupportGroup, itemsSoFar, maximumNoofItemsAllowed);
        itemsSoFar += theResult.length;

        result[groupId] = theResult;

	if(itemsSoFar > maximumNoofItemsAllowed) {
	    break;
	}
    }

    if (itemsSoFar > maximumNoofItemsAllowed)
    {
	console.log('Too many items generated, abort data mining!!');

	var returnMessage = {};
	returnMessage.theRules = {};
        returnMessage.tooManyItemsGenerated = true;

	thread.postMessage(returnMessage);
    }
    else
    {
	// console.log('Preliminary calculations finished. Continue with rule mining.');
        RuleMining(result, thread, onlyItemSetMining, minConfidence);
    }
}

function IsSubset(ls1, ls2) {
    var i1 = 0;
    var i2 = 0;

    while (i1 < ls1.length && i2 < ls2.length)
    {
        // we can actually break earlier if we find an item in the short list that we should have already seen in the long list since we know they are sorted
        if (ls1[i1] != ls2[i2])
        {
            i2++;
        }
        else
        {
            i1++;
            i2++;
        }
    }

    if (i1 != ls1.length)
    {
        return false;
    } 
    return true;
}

function RuleMining(FPGrowResult, thread, onlyItemSetMining, minConfidence)
{
    var rulesPerGroup = {};

    for(var groupId in FPGrowResult) {
        rulesPerGroup[groupId] = [];

        for(var rn1i = 0; rn1i < FPGrowResult[groupId].length; rn1i++) {
	    var rn1 = FPGrowResult[groupId][rn1i];

            if (onlyItemSetMining)
            {
		var r = {'r1':null,
			 'r2':null,
			 'top':0,
			 'bottom':0,
			 'confidence':0,
			 'stringRep':"",
			 'selectedGroup':0};

                r.r1 = rn1;
                r.r2 = rn1;

                if (rn1.support > 0) {
                    r.confidence = rn1.support;
                } else {
                    r.confidence = 0;
                }

                rulesPerGroup[groupId].push(r);
            } else {
		for(var rn2i = 0; rn2i < FPGrowResult[groupId].length; rn2i++) {
		    var rn2 = FPGrowResult[groupId][rn2i];

                    if (rn1i != rn2i
			&& rn1.items.length < rn2.items.length 
			&& rn2.support >= rn1.support *  minConfidence) {

                        if (IsSubset(rn1.items, rn2.items)) {
			    
			    var r = {'r1':null,
				     'r2':null,
				     'top':0,
				     'bottom':0,
				     'confidence':0,
				     'stringRep':"",
				     'selectedGroup':0};
                            r.r1 = rn1;
                            r.r2 = rn2;

                            if (rn1.support > 0) {
                                r.confidence = rn2.support / rn1.support;
                            } else {
                                r.confidence = 1;
                            }

                            rulesPerGroup[groupId].push(r);
                        }
                    }
                }
            }
        }
    }
    
    var returnMessage = {};
    returnMessage.tooManyItemsGenerated = false;
    returnMessage.theRules = rulesPerGroup;
    
    // console.log('Rule mining finished, return the result.');
    thread.postMessage(returnMessage);
}

function RecursiveFPExtract(result, tail, successors, root, minSupportGroup, itemsSoFar, maximumNoofItemsAllowed)
{
    for(var s in successors) {
        
        var support = 0;
        var n = successors[s];
        while (n != null)
        {
            support += n.support;
            n = n.sibling;
        }

        if (support >= minSupportGroup)
        {
            var newTail = [];
            newTail.push(s);
	    
	    for(var sidx = 0; sidx < tail.length; sidx++) {
		var ss = tail[sidx];
                newTail.push(ss);
            }
	    
	    var rn = {'support':0, 'items':[]};
            rn.items = newTail;
            rn.support = support;

            result.push(rn);

            if(itemsSoFar + result.length > maximumNoofItemsAllowed) {
                return;
            }


	    var newRoot = {'item':"", 
			   'support':0,
			   'sibling':null,
			   'parent':null,
			   'children':{}};
            var newSuccessors = {};

            var added = 0;
            n = successors[s];
            while (n != null) {
                var ls = [];

                var nn = n.parent;
                while (nn != null) {
                    if (nn.item != "")
                    {
                        ls.push(nn.item);
                    }
                    nn = nn.parent;
                }

                if (ls.length > 0)
                {
                    ls.reverse();
                    FPInsert(ls, newRoot, n.support, newSuccessors);
                    added += 1;
                }

                n = n.sibling;
            }

            if (newRoot.support >= minSupportGroup) {
                if (added > 0) {
                    RecursiveFPExtract(result, newTail, newSuccessors, newRoot, minSupportGroup, itemsSoFar, maximumNoofItemsAllowed);
                }
            }
        }
    }
}

function FPInsert(items, root, support, successors) {
    root.support += support;

    var nextIdx = 0;
    var nextItem = items[nextIdx];
    while (root.children.hasOwnProperty(nextItem)) {
        root = root.children[nextItem];
        root.support += support;
        nextIdx++;
        if (nextIdx < items.length) {
            nextItem = items[nextIdx];
        } else {
            break;
        }
    }

    while (nextIdx < items.length) {
        nextItem = items[nextIdx];

	var n = {'item':"", 
		 'support':0,
		 'sibling':null,
		 'parent':null,
		 'children':{}};
        n.item = nextItem;
        n.support = support;
        n.parent = root;
	
        if (successors.hasOwnProperty(nextItem)) {
            n.sibling = successors[nextItem];
            successors[nextItem] = n;
        } else {
            successors[nextItem] = n;
        }

        root.children[nextItem] = n;
        root = n;

        nextIdx++;
    }
}
