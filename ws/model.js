var WsModel = function(model) {
	var data = model;
	
	{
		if (!(data.pages instanceof Array)
			|| data.pages.length === 0) {
			data.pages = [ [] ];
		}
		if (!(data.runningTitles instanceof Array)) {
			data.runningTitles = [];
		}
	}
	
    function getPreferredIndex(page, item) {
		var index = -1;

		var i = 0;
		var top = -1;
		var rowHeight = 0;
		while (i < data.pages[page].length && index === -1) {
			var otherItem = data.pages[page][i];
			if (top !== otherItem.y) {
				top = otherItem.y;
				rowHeight = getRowHeight(page, i);
			}
			if (item.x < (otherItem.x + otherItem.w)
				&& otherItem.x < (item.x + item.w)
				&& item.y < (otherItem.y + rowHeight)
				&& otherItem.y < (item.y + item.h)) {
				index = item.x < (otherItem.x + otherItem.w / 2) ? i : i + 1;
			}
			i++;
		}

		if (index === -1) {
			return data.pages[page].length;
		}
		return index;
    }

    function getRowHeight(page, index, reverseLoop) {
		var height = 0;
		var y = data.pages[page][index].y;
		var i = index;
		var condition = function(i) {
			return i < data.pages[page].length;
		};
		var step = 1;
		if (reverseLoop) {
			condition = function(i) {
				return i >= 0;
			};
			step = -1;
		}
		while (condition(i)) {
			var item = data.pages[page][i];
			if (item.y !== y) {
				break;
			}
			if (item.h > height
				&& (item.type !== 'ls' && item.type !== 'ps')) {
				height = item.h;
			}
			i += step;
		}
		return height;
    }

    function alignItem(page, index, item) {
		var pageBottom = data.height - data.padding.bottom;
		var pageHeight = pageBottom - data.padding.top;
		if (item.w > data.width) {
			item.w = data.width;
		}
		//~ if (item.h > pageHeight) {
			//~ item.h = pageHeight;
		//~ }
		if (index === 0) {
			item.x = 0;
			item.y = data.padding.top;
		} else {
			var prevItem = data.pages[page][index - 1];
			if (prevItem.type === 'ps'/* && item.type != 'ps' */) {
				return null;
			}
			if ((prevItem.type === 'ls'
				|| (prevItem.x + prevItem.w + item.w) > data.width)
				&& (item.type !== 'ls' && item.type !== 'ps')) {
				item.x = 0;
				item.y = prevItem.y + getRowHeight(page, index - 1, true);
			} else {
				item.x = prevItem.x + prevItem.w;
				item.y = prevItem.y;
			}
		}
		if ((item.y + (item.type === 'ls' || item.type === 'ps' ? 0 : item.h))
			>= pageBottom) {
			if (index === 0) {
				item.y = 0;
			} else {
				return null;
			}
		}
		item.p = page;
		item.i = index;
		
		return item;
    }

    function alignedItem(page, index, item) {
		return alignItem(page, index, $.extend(true, {}, item));
    }

    function update(page, index) {
		if (data.pages[page].length == 0) {
			if (page > 0) {
				data.pages.splice(page, 1);
				if (page < data.pages.length) {
					return update(page, 0);
				}
				return [
					data.pages[page - 1][data.pages[page - 1].length - 1],
					data.pages[page - 1][data.pages[page - 1].length - 1] ];
			}
		} else if (index == 0
			&& page > 0
			&& alignedItem(page - 1, data.pages[page - 1].length,
				data.pages[page][index]) !== null) {
			return update(page - 1, data.pages[page - 1].length);
		}
		var length = data.pages[page].length;

		var i = index;
		while (i < data.pages[page].length
			&& length == data.pages[page].length) {
			if ((lastItem = alignItem(page, i, data.pages[page][i])) === null) {
				var extraItems = data.pages[page].splice(i,
					data.pages[page].length - i);
				if (page + 1 == data.pages.length) {
					data.pages.push(extraItems);
				} else {
					data.pages[page + 1] = extraItems
						.concat(data.pages[page + 1]);
				}
			}
			i++;
		}
		while (page + 1 < data.pages.length
			&& i == data.pages[page].length
			&& data.pages[page + 1].length != 0) {
			var missingItem = alignedItem(page, i, data.pages[page + 1][0]);
			if (missingItem === null) {
				var p = page + 1;
				if (data.pages[page + 1][0].p != p) {
					while (p < data.pages.length) {
						for ( var j = 0; j < data.pages[p].length; j++) {
							data.pages[p][j].p = p;
						}
						p++;
					}
					lastItem = data.pages[data.pages.length - 1]
						[data.pages[data.pages.length - 1].length - 1];
				}
			} else {
				data.pages[page].push(data.pages[page + 1].shift());
				data.pages[page][i].p = page;
				data.pages[page][i].i = i;
				data.pages[page][i].x = missingItem.x;
				data.pages[page][i].y = missingItem.y;
			}
			i++;
		}

		var firstItem = index < data.pages[page].length
			? data.pages[page][index]
			: data.pages[page][data.pages[page].length - 1];
		if (!firstItem) {
			firstItem = {
				p : page,
				i : 0
			};
		}
		var lastItem = data.pages[page][data.pages[page].length - 1];
		if (!lastItem) {
			lastItem = {
				p : page,
				i : 0
			};
		}
		var range = [ firstItem, lastItem ];
		if (length != data.pages[page].length
			&& page + 1 < data.pages.length) {
			range[1] = update(page + 1, 0)[1];
		}

		return range;
    }

    var pagesChangeEventListeners = [];
    function firePagesChangeEvent() {
		for (var i in pagesChangeEventListeners) {
			pagesChangeEventListeners[i]
				.onPagesChange(data.pages.length);
		}
    }
    var changeEventListeners = [];
    function fireChangeEvent(range) {
		for (var i in changeEventListeners) {
			changeEventListeners[i].onChange(range);
		}
    }
    
    var self = this;

	this.getWidth = function() {
		return data.width;
	};
	this.getHeight = function() {
		return data.height;
	};
	this.getPadding = function(padding) {
		return data.padding;
	};
	this.setPadding = function(padding) {
		if (typeof data.padding !== 'object') {
			data.padding = {
				top : 0,
				left : 0,
				right : 0,
				bottom : 0,
			};
		}
		Object.extend(data.padding, padding, true);
	};
	
	this.get = function(page, index) {
		if (typeof page == 'number') {
			if (typeof index == 'number') {
				return data.pages[page][index];
			}
			return data.pages[page];
		}
		return data;
	};
	this.add = function(page, item) {
		var index = getPreferredIndex(page, item);
		if (!alignedItem(page, index, item)) {
			item.p = -1;
			item.i = -1;
			return false;
		}
		data.pages[page].splice(index, 0, item);
		return this.update(page, index);
	};
	this.insert = function(page, index, item) {
		if (!alignedItem(page, index, item)) {
			return false;
		}
		data.pages[page].splice(index, 0, item);
		return this.update(page, index);
	};
	this.remove = function(page, index) {
		var item = data.pages[page].splice(index, 1)[0];
		item.p = -1;
		item.i = -1;
		return this.update(page, index);
	};
	this.realign = function(page, index) {
		var pageCount = data.pages.length;

		var item = data.pages[page].splice(index, 1)[0];
		item.p = -1;
		item.i = -1;

		var range = update(page, index);

		if (page >= data.pages.length) {
			alignItem(page, 0, item);
			data.pages.push([ item ]);
		} else {
			index = getPreferredIndex(page, item);
			if (alignedItem(page, index, item)) {
				data.pages[page].splice(index, 0, item);
				var range2 = update(page, index);
				if (range) {
					if (range2[0].p < range[0].p
						|| range2[0].p == range[0].p
						&& range2[0].i < range[0].i) {
						range[0] = range2[0];
					}
					if (range2[1].p > range[1].p
						|| range2[1].p == range[1].p
						&& range2[1].i > range[1].i) {
						range[1] = range2[1];
					}
				} else {
					range = range2;
				}
			}
		}
		if (range) {
			fireChangeEvent(range);
		}

		if (pageCount != data.pages.length) {
			firePagesChangeEvent();
		}

		return index;
	};
	this.update = function(page, index) {
		var pageCount = data.pages.length;
		var range = [];
		if (typeof page === 'undefined' && typeof index === 'undefined') {
			for (var p = 0; p < data.pages.length; p++) {
				if (range.length === 0) {
					range = update(p, 0);
				} else {
					if (range[0].p <= p && range[1].p >= p) {
						continue;
					}
					var newRange = update(p, 0);
					if (newRange[0].p <= range[0].p
						&& newRange[0].i <= range[0].i) {
						range[0] = newRange[0];
					}
					if (newRange[1].p >= range[1].p
						&& newRange[1].i >= range[1].i) {
						range[1] = newRange[1];
					}
				}
			}
		} else {
			range = update(page, index);
		}
		
		fireChangeEvent(range);

		if (pageCount != data.pages.length) {
			firePagesChangeEvent();
		}

		return range;
	};
	
	this.find = function(query) {
		var items = [];
		for (var page = 0; page < data.pages.length; page++) {
			for (var index = 0; index < data.pages[page].length; index++) {
				var item = data.pages[page][index];
				if (Object.matches(data.pages[page][index], query)) {
					items.push(item);
				}
			}
		}
		return items;
	};

	this.addPagesChangeEventListener = function(listener) {
		pagesChangeEventListeners.push(listener);
	};
	this.removePagesChangeEventListener = function(listener) {
		var index = pagesChangeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		pagesChangeEventListeners.splice(index, 1);
	};
	this.addChangeEventListener = function(listener) {
		changeEventListeners.push(listener);
	};
	this.removeChangeEventListener = function(listener) {
		var index = changeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		changeEventListeners.splice(index, 1);
	};
};
