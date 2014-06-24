var WsController = function($viewContainer, model, theme) {
	var self = this;
	self.createView($viewContainer);
	
	var page = 0;
	var pageView = self.getPageView();
	var renderedFromIndex = -1;
	var renderedItems = [];
	var runningTitles = null;
	
	var eventListener = {
		onSelectedItemViewDblClick : self.onSelectedItemViewDblClick.bind(self),
		onSelectedItemViewResizerDragMove : self.onSelectedItemViewResizerDragMove.bind(self),
		onKeydown : function(e) {
			if (!self.onKeydown(e)) {
				return false;
			}
			if (!self.isFocused()) {
				return true;
			}
			if (self.getEditor()) {
				return true;
			}
			if (self.getSelectedItem()) {
				switch (e.which) {
				case 46:
						if (runningTitles === null
							|| (self.getSelectedItem() !== runningTitles.header.getAttr('model')
							&& self.getSelectedItem() !== runningTitles.footer.getAttr('model'))) {
							WsController.cache.remove(self.getSelectedItem());
							renderedItems = [];
							model.remove(self.getSelectedItem().p,
								self.getSelectedItem().i);
							$(window).triggerHandler($.Event('message', {
								id : 'store',
								ns : 'wscontroller',
								state : model.get()
							}));
							self.selectItem();
							return false;
						}
				default:
					break;
				}
			}
			return true;
		},
		onDropAccept : function($dragObject) {
			return $dragObject.data('pdWsItem');
		},
		onDropOver : function(e) {
			self.selectItem();
			e.dragObject.off({
				'destroy' : eventListener.onDrop
			});
			e.dragObject.on('destroy', eventListener.onDrop);
			
			var placeholderItem = e.dragObject.data('pdWsItem').view.getAttr('model');
			if (placeholderItem.w > model.getWidth()) {
				placeholderItem.w = model.getWidth();
			}
			if (placeholderItem.h > model.getHeight()) {
				placeholderItem.h = model.getHeight();
			}
			self.setPlaceholderItem(placeholderItem);
		},
		onDropOut : function(e) {
			var placeholderItem = self.getPlaceholderItem();
			if (placeholderItem.p === page || placeholderItem.i !== -1) {
				model.remove(placeholderItem.p, placeholderItem.i);
			}
		},
		onDropMove : function(e) {
			var dragObjectPosition = e.dragObject.offset();
			var position = self.positionRelativeToPage({
				x : dragObjectPosition.left,
				y : dragObjectPosition.top,
			});
			if (position.x < 0 || position.y < 0
				|| position.x > pageView.getWidth()
				|| position.y > pageView.getHeight()) {
				return;
			}
			var placeholderItem = self.getPlaceholderItem();
			placeholderItem.x = position.x;
			placeholderItem.y = position.y;
			if (placeholderItem.p !== page || placeholderItem.i === -1) {
				model.add(page, placeholderItem);
			} else {
				model.realign(page, placeholderItem.i);
			}
			if (placeholderItem.p !== page && placeholderItem.p !== -1) {
				page = placeholderItem.p;
				self.render(0);
				self.firePagesChangeEvent();
				renderedItems = [];
			}
		},
		onDrop : function(e) {
			var placeholderItem = self.getPlaceholderItem();
			if (typeof placeholderItem === 'object'
				&& (placeholderItem.p !== page || placeholderItem.i === -1)) {
				WsController.cache.remove(placeholderItem);
			} else {
				$(window).triggerHandler($.Event('message', {
					id : 'store',
					ns : 'wscontroller',
					state : model.get()
				}));
			}
			var itemView = self.getItemView(placeholderItem);
			if (itemView) {
				self.selectItem(placeholderItem);
			}
			self.setPlaceholderItem();
		}
	};
	var modelEventListener = {
		onStore : function() {
		},
		onChange : function(range) {
			if (page >= model.get().pages.length) {
				page--;
				self.render(0);
				self.firePagesChangeEvent();
				return;
			}
			if (range[0].p === page) {
				self.render(range[0].i);
			} else if (range[1].p === page) {
				self.render(range[0].i);
			} else {
				self.render(0);
			}
		},
		onPagesChange : function(pages) {
			self.firePagesChangeEvent();
		}
	};
	$viewContainer.pdDroppable({
		accept : eventListener.onDropAccept,
		over : eventListener.onDropOver,
		out : eventListener.onDropOut,
		move : eventListener.onDropMove
	});
	$(window).on('resize.pdWsController', self.onWindowResize);
	$viewContainer.on('mousewheel.pdWsController', self.onMousewheel);
	$(window).on('keydown.pdWsController', eventListener.onKeydown);
	$(document.body).on('mousedown.pdWsController', self.onBodyMousedown);
	self.getPageIView().on('click.pdWsController', self.onPageIViewClick);
	self.getSelectedItemView().on('dblclick.pdWsTemplateController',
		eventListener.onSelectedItemViewDblClick);
	self.getSelectedItemView().find('.resizer').on('dragmove.pdWsTemplateController',
		eventListener.onSelectedItemViewResizerDragMove);
	model.addChangeEventListener(modelEventListener);
	model.addPagesChangeEventListener(modelEventListener);
	
	self.getPage = function() {
		return page;
	};
	
	self.setBgColor = function(bgColor) {
		model.get().bgColor = bgColor;
		self.uber('setBgColor', bgColor);
		$(window).triggerHandler($.Event('message', {
			id : 'store',
			ns : 'wscontroller',
			state : model.get()
		}));
	};
	self.setBgImage = function(bgImage) {
		model.get().bgImage = bgImage;
		model.get().bg = bgImage;
		self.uber('setBgImage', bgImage);
		$(window).triggerHandler($.Event('message', {
			id : 'store',
			ns : 'wscontroller',
			state : model.get()
		}));
	};
	
	var startDrag = false;
	var draggingItemView = null;
	self.getPageIView().on('mousedown.pdWsController', function(data) {
		if (data.evt.which !== 1) {
			return;
		}
		if (self.getEditor() !== null) {
			return;
		}
		startDrag = true;
		
	});
	self.getPageIView().on('mousemove.pdWsController', function(data) {
		if (!startDrag) {
			return;
		}
		startDrag = false;
		draggingItemView = self.getItemViewByPosition(
			self.getView().getPointerPosition());
		if (!draggingItemView) {
			return;
		} else if (runningTitles !== null
			&& (draggingItemView === runningTitles.header
			|| draggingItemView === runningTitles.footer)) {
			draggingItemView = null;
			return;
		}
		self.setPlaceholderItem(draggingItemView.getAttr('model'));
		draggingItemView = draggingItemView.clone().add(new Kinetic.Circle({
			radius : 2.5,
			fill : 'white',
			stroke : 'grey',
			strokeWidth : 0.5,
		}));
		self.getPageIView().find('.pageView').add(draggingItemView);
		draggingItemView.on('dragmove', function(data) {
			var position = draggingItemView.getPosition();
			if (position.x < 0 || position.y < 0
				|| position.x > pageView.getWidth()
				|| position.y > pageView.getHeight()) {
				return;
			}
			var placeholderItem = self.getPlaceholderItem();
			placeholderItem.x = position.x;
			placeholderItem.y = position.y;
			if (placeholderItem.p != page || placeholderItem.i == -1) {
				model.add(page, placeholderItem);
			} else {
				model.realign(page, placeholderItem.i);
			}
		});
		self.selectItem();
		draggingItemView.setDragDistance(8);
		draggingItemView.startDrag();
	});
	self.getPageIView().on('mouseup.pdWsController', function(data) {
		startDrag = false;
		if (!draggingItemView) {
			return;
		}
		draggingItemView.remove();
		draggingItemView.destroy();
		draggingItemView = null;
		self.selectItem(self.getPlaceholderItem());
		self.setPlaceholderItem();
		self.getPageView().draw();
		$(window).triggerHandler($.Event('message', {
			id : 'store',
			ns : 'wscontroller',
			state : model.get()
		}));
	});
	self.onPageSelect = function(selectedPage) {
		page = selectedPage;
		if (!self.isFocused()) {
			return;
		}
		self.render(0);
		self.firePagesChangeEvent();
		self.selectItem(self.getSelectedItem());
	};
	
	self.updateRunningTitles = function() {
		if (runningTitles !== null) {
			runningTitles.header.remove();
			runningTitles.footer.remove();
			runningTitles = null;
		}
		var itemViews = pageView.getChildren(function(node) {
			return node.getAttr('model');
		});
		if (itemViews.length === 0
			|| itemViews[0].getY() !== 0) {
			var headerItem = {
				p : page,
				x : 0,
				y : 0,
				config : {
					template : 'header'
				}
			};
			var wsItemFactory = WsItemFactory.forType('template');
			var headerItemView = wsItemFactory.createView(headerItem);
			pageView.add(headerItemView);
			wsItemFactory.render(headerItemView);
			var footerItem = {
				p : page,
				x : 0,
				y : 0,
				config : {
					template : 'footer'
				}
			};
			var footerItemView = wsItemFactory.createView(footerItem);
			footerItemView.setY(model.get().height - footerItem.h);
			pageView.add(footerItemView);
			wsItemFactory.render(footerItemView);
			runningTitles = {
				header : headerItemView,
				footer : footerItemView
			};
		}
		pageView.batchDraw();
	};
	
	self.updateItems = function(items, update, callback) {
		if (items.length === 0) {
			return;
		}
		if (typeof update !== 'object' || update === null) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				model.remove(item.p, item.i);
				WsController.cache.remove(item);
			}
			self.selectItem(self.getSelectedItem());
			$(window).triggerHandler($.Event('message', {
				id : 'store',
				ns : 'wscontroller',
				state : model.get()
			}));
		} else {
			var range = [];
			function onRender() {
				renderedItems = [];
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					WsController.cache.remove(item);
					if (range.length === 0) {
						range = model.update(item.p, item.i);
					} else {
						if (range[0].p <= item.p
							&& range[0].i <= item.i
							&& range[1].p >= item.p
							&& range[1].i >= item.i) {
							continue;
						}
						var newRange = model.update(item.p, item.i);
						if (newRange[0].p <= range[0].p
							&& newRange[0].i <= range[0].i) {
							range[0] = newRange[0];
						}
						if (newRange[1].p >= range[1].p
							&& newRange[1].i >= range[1].i) {
							range[1] = newRange[1];
						}
					}
					if (page >= model.get().pages.length) {
						page--;
						self.render(0);
						self.firePagesChangeEvent();
					}
				}
			}
			function onItemRender(itemView) {
				var item = itemView.getAttr('model');
				WsController.cache.remove(itemView.getAttr('model'));
				WsController.cache.add(itemView);
				if (++renderedItemCount === itemCount) {
					onRender(itemView);
					if (callback) {
						callback();
					}
				}
				
				self.selectItem(self.getSelectedItem());
				$(window).triggerHandler($.Event('message', {
					id : 'store',
					ns : 'wscontroller',
					state : model.get()
				}));
			}
			var renderedItemCount = 0;
			var itemCount = items.length;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (typeof item !== 'undefined') {
					delete item['meta'];
				}
				Object.extend(item, update, true);
				if (item.w < 0) {
					item.w = 0;
				}
				if (item.h < 0) {
					item.h = 0;
				}
				var wsItemFactory = WsItemFactory.forType(item.type);
				var itemView = wsItemFactory.createView(item);
				itemView.on('render', function() {
					if (item.w < 1 || item.w > model.getWidth()) {
						item.w = model.getWidth();
						itemView = wsItemFactory.createView(item);
						itemView.on('render', function() {
							onItemRender(this);
						});
						wsItemFactory.render(itemView);
					} else if (item.h < 1 || item.h > model.getHeight()) {
						item.h = model.getHeight();
						itemView = wsItemFactory.createView(item);
						itemView.on('render', function() {
							onItemRender(this);
						});
						wsItemFactory.render(itemView);
					} else {
						onItemRender(this);
					}
				});
				wsItemFactory.render(itemView);
			}
		}
	};
	
	self.updateSelectedItem = function(update) {
		var selectedItem = self.getSelectedItem();
		renderedItems = [];
		if (!update) {
			model.remove(selectedItem.p, selectedItem.i);
			self.selectItem();
			WsController.cache.remove(selectedItem);
			$(window).triggerHandler($.Event('message', {
				id : 'store',
				ns : 'wscontroller',
				state : model.get()
			}));
			return;
		}
		Object.extend(selectedItem, update, true);
		if (selectedItem.w < 0) {
			selectedItem.w = 0;
		}
		if (selectedItem.h < 0) {
			selectedItem.h = 0;
		}
		function onRender(itemView) {
			WsController.cache.remove(selectedItem);
			WsController.cache.add(itemView);
			model.update(selectedItem.p, selectedItem.i);
			if (page !== selectedItem.p) {
				page = selectedItem.p;
				self.render(0);
				self.firePagesChangeEvent();
			}
			self.selectItem(selectedItem);
			self.fireSelectEvent(selectedItem);
			$(window).triggerHandler($.Event('message', {
				id : 'store',
				ns : 'wscontroller',
				state : model.get()
			}));
		}
		var wsItemFactory = WsItemFactory.forType(selectedItem.type);
		var itemView = wsItemFactory.createView(selectedItem);
		itemView.on('render', function() {
			if (selectedItem.w < 1 || selectedItem.w > model.getWidth()) {
				selectedItem.w = model.getWidth();
				var itemView = wsItemFactory.createView(selectedItem);
				itemView.on('render', function() {
					onRender(itemView);
				});
				wsItemFactory.render(itemView);
			} else if (selectedItem.h < 1
				|| selectedItem.h > model.getHeight()) {
				selectedItem.h = model.getHeight();
				var itemView = wsItemFactory.createView(selectedItem);
				itemView.on('render', function() {
					onRender(itemView);
				});
				wsItemFactory.render(itemView);
			} else {
				onRender(this);
			}
		});
		wsItemFactory.render(itemView);
	};
	
	function compareItemArrays(firstArray, secondArray) {
		if (firstArray.length !== secondArray.length) {
			return false;
		}
		for (var i = 0; i < firstArray.length; i++) {
			if (firstArray[i] !== secondArray[i]) {
				return false;
			}
		}
		return true;
	}
	self.render = function(index) {
		var items = model.get(page);
		if (items.length) {
			if (renderedItems.length === 0) {
				index = 0;
			}
			items = items.slice(index);
			if (index === renderedFromIndex
				&& compareItemArrays(items, renderedItems)) {
				return;
			}
			pageView.getChildren(function(node) {
				return node.getAttr('model')
					&& node.getAttr('index') >= index;
			}).remove();
			self.setPlaceholderItem(self.getPlaceholderItem());
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var itemView = WsController.cache.get(item);
				if (itemView) {
					itemView.setPosition({
						x : item.x,
						y : item.y
					});
					pageView.add(itemView);
				} else {
					var wsItemFactory = WsItemFactory.forType(item.type);
					itemView = wsItemFactory.createView(item);
					pageView.add(itemView);
					wsItemFactory.render(itemView);
					WsController.cache.add(itemView);
				}
				itemView.setZIndex(item.zIndex);
				itemView.setAttr('index', item.i);
				if (item === self.getPlaceholderItem()) {
					self.setPlaceholderItem(item);
				}
			}
			renderedFromIndex = index;
			renderedItems = items;
		} else {
			self.setPlaceholderItem();
			pageView.getChildren(function(node) {
				return node.getAttr('model');
			}).remove();
			renderedFromIndex = -1;
			renderedItems = [];
		}
		
		self.updateRunningTitles();
	};
	
	var pagesChangeEventListeners = [];
    self.firePagesChangeEvent = function() {
		for (var i in pagesChangeEventListeners) {
			pagesChangeEventListeners[i].onPagesChange(page,
				model.get().pages.length);
		}
    };
	self.addPagesChangeEventListener = function(listener) {
		pagesChangeEventListeners.push(listener);
	};
	self.removePagesChangeEventListener = function(listener) {
		var index = pagesChangeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		pagesChangeEventListeners.splice(index, 1);
	};
	
	self.setPageSize({
		width : theme.width,
		height : theme.height
	});
	model.get().width = theme.width;
	model.get().height = theme.height;
};

WsController.inherits(WsControllerSupport);

// TODO add special kind of cache for templates
WsController.cache = (function(){
	var items = [];
	var itemViews = [];
	return {
		add : function(itemView) {
			items.push(itemView.getAttr('model'));
			itemViews.push(itemView);
		},
		get : function(item) {
			var index = items.indexOf(item);
			if (index === -1) {
				return null;
			}
			return itemViews[index];
		},
		remove : function(item) {
			var index = items.indexOf(item);
			if (index === -1) {
				return null;
			}
			items.splice(index, 1);
			itemViews.splice(index, 1);
		},
		clear : function() {
			items = [];
			itemViews = [];
		}
	};
})();
