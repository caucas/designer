var WsPreviewController = function($viewContainer, model) {

	var self = this;
	var view = null;
	var pageView = null;
	var pageBgView = null;
	var pageIView = null;
	var scale = 1;
	var page = 0;
	var runningTitles = null;

	self.getViewContainer = function() {
		return $viewContainer;
	};
	self.getView = function() {
		return view;
	};
	self.getPageView = function() {
		return pageView;
	};
	self.getPageBgView = function() {
		return pageBgView;
	};
	
	function initItem(item) {
		var factory = WsItemFactory.forType(item.type);
		var itemView = factory.createView(item);
		factory.render(itemView);
		return item;
	};
	
	function addItems(price, level) {
		var menuModel = model.get();
		var page = level === 1 ? 0 : menuModel.pages.push([]) - 1;
		for (var key in price) {
			if (key === 'category') {
				continue;
			}
			if (typeof price[key] === 'object' && !Array.isArray(price[key])) {
				if (typeof price[key].media === 'undefined') {
					menuModel.pages[page].push(initItem({
						type : 'template',
						config : {
							template : 'link' + (level > 2 ? 2 : level),
							price : key
						}
					}));
					addItems(price[key], level + 1);
				} else {
					var template = null;
					if (price[key].template) {
						var event = $.Event('message', {
							id : 'gettemplate',
							template : price[key].template
						});
						$(window).triggerHandler(event);
						template = (event.template && event.template.name) ? event.template.name : 'default';
						console.log(template)
					}
					menuModel.pages[page].push(initItem({
						type : 'template',
						config : {
							template : template ? template : 'default',
							price : key
						}
					}));
				}
			}
		}
		menuModel.pages[page].push(initItem({
			type : 'ps'
		}));
	}

	$viewContainer.data('wsController', self);
	$viewContainer.addClass('pd-ws');

	view = new Kinetic.Stage({
		container: $viewContainer.get(0)
	});

	view.setSize({
		width : $viewContainer.innerWidth(),
		height : $viewContainer.innerHeight()
	});

	pageIView = new Kinetic.Layer();

	view.add(pageIView);
	pageIView.setSize(view.getSize());

	var scaleBoard = new Kinetic.Group({
		height : 72,
		width : 196,
		x : 20,
		y : view.getHeight() - 92
	});

	scaleBoard.on('mouseover', function(evt) {
		this.find('.scalesRect').setOpacity(0.5);
		pageIView.batchDraw();
	});

	scaleBoard.on('mouseout', function(evt) {
		this.find('.scalesRect').setOpacity(0.3);
		pageIView.batchDraw();
	});

	var scalesRect = new Kinetic.Rect({
		name : 'scalesRect',
		height : 72,
		width : 196,
		fill : 'white',
		cornerRadius : 13,
		opacity : 0.3
	});

	scaleBoard.add(scalesRect);

	var zoomInButton = new Kinetic.Image({
		height : 48,
		width : 48,
		x : 136,
		y : 12,
		opacity : 1
	});

	zoomInButton.on('click', function(evt) {
		self.setScale(scale + 0.1);
	}).on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
	}).on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
	});

	scaleBoard.add(zoomInButton);
	var zoomInButtonImage = new Image();
	zoomInButtonImage.onload = function() {
		zoomInButton.setImage(this);
		pageIView.draw();
	};
	zoomInButtonImage.src = 'public/images/zoomIn.png';

	var zoomOutButton = new Kinetic.Image({
		height : 48,
		width : 48,
		x : 12,
		y : 12,
		opacity : 1
	});

	zoomOutButton.on('click', function(evt) {
		self.setScale(scale - 0.1);
	}).on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
	}).on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
	});

	scaleBoard.add(zoomOutButton);
	var zoomOutButtonImage = new Image();
	zoomOutButtonImage.onload = function() {
		zoomOutButton.setImage(this);
		pageIView.draw();
	};
	zoomOutButtonImage.src = 'public/images/zoomOut.png';

	var scaleValue = new Kinetic.Text({
		fontSize : 32,
		text : '100',
		fontFamily : 'Arial',
		fill : 'black'
	});

	scaleValue.on('click', function(evt) {
		self.setScale(1);
	});

	var percent = new Kinetic.Text({
		fontSize : 16,
		text : '%',
		fontFamily : 'Georgia',
		fill : 'black',
		fontStyle : 'bold'
	});

	percent.setPosition({
		x : 124 - percent.width() / 2,
		y : 36 - percent.height() / 2
	});

	scaleBoard.add(percent);

	scaleValue.setPosition({
		x : 88 - scaleValue.width() / 2,
		y : 36 - scaleValue.height() / 2
	});

	scaleBoard.add(scaleValue);

	pageIView.add(scaleBoard);


	var pageBoard = new Kinetic.Group({
		height : 72,
		width : 176,
		x : view.getWidth() - 196,
		y : view.getHeight() - 92
	});

	pageBoard.on('mouseover', function(evt) {
		this.find('.pagesRect').setOpacity(0.5);
		pageIView.batchDraw();
	}).on('mouseout', function(evt) {
		this.find('.pagesRect').setOpacity(0.3);
		pageIView.batchDraw();
	});

	var pagesRect = new Kinetic.Rect({
		name : 'pagesRect',
		height : 72,
		width : 176,
		fill : 'white',
		cornerRadius : 13,
		opacity : 0.3
	});

	pageBoard.add(pagesRect);
	
	var pageNumber = new Kinetic.Text({
		fontSize : 32,
		text : '1',
		fontFamily: 'Arial',
		fill : 'black',
		width : pageBoard.getWidth(),
		align : 'center'
	});

	pageNumber.setY(36 - pageNumber.height() / 2);
	//pageNumber.setPosition({
		//x : 88 - pageNumber.width() / 2,
		//y : 36 - pageNumber.height() / 2
	//});
	
	pageBoard.add(pageNumber);

	var leftArrow = new Kinetic.Image({
		height : 48,
		width : 48,
		x : 12,
		y : 12,
		opacity : 1
	});

	leftArrow.on('click', function(evt) {
		if (page > 0) {
			self.onPageSelect(--page);
		}
	}).on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
	}).on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
	});

	pageBoard.add(leftArrow);

	var leftArrowImage = new Image();
	leftArrowImage.onload = function() {
		leftArrow.setImage(this);
		pageIView.draw();
	};
	leftArrowImage.src = 'public/images/left.png';

	var rightArrow = new Kinetic.Image({
		height : 48,
		width : 48,
		x : 116,
		y : 12,
		opacity : 1
	});

	rightArrow.on('click', function(evt) {
		if (page < model.get().pages.length - 1) {
			self.onPageSelect(++page);
		}
	}).on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
	}).on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
	});

	pageBoard.add(rightArrow);

	var rightArrowImage = new Image();
	rightArrowImage.onload = function() {
		rightArrow.setImage(this);
		pageIView.draw();
	};
	rightArrowImage.src = 'public/images/right.png';

	pageIView.add(pageBoard);

	pageIView.draw();

	pageView = new Kinetic.Layer();
	view.add(pageView);

	pageBgView = new Kinetic.Layer();

	var localPosition = null;
	view.on('mousedown', function(evt) {
		if (evt.evt.button === 1) {
			document.body.style.cursor = 'pointer';
			localPosition = {
				x : view.pointerPos.x - pageView.getPosition().x,
				y : view.pointerPos.y - pageView.getPosition().y
			};
		}
	}).on('mouseup', function(){
		document.body.style.cursor = 'default';
		localPosition = null;
	}).on('mousemove', function(evt) {
		if (evt.evt.button === 1) {
			if (pageView.getHeight() * scale > view.getHeight() && (pageView.getPosition().y < view.getPosition().y + 8)) {
				self.setPagePosition({
					//x : evt.evt.offsetX - localPosition.x,
					y : evt.evt.offsetY - localPosition.y
				});
			}
			pageBgView.batchDraw();
			pageView.batchDraw();
		}
	});

	var pageBg = new Kinetic.Image({
		name : 'bg',
		stroke : '#222',
		strokeWidth : 1
	});
	pageBgView.add(pageBg);
	view.add(pageBgView);
	pageBgView.draw();

	pageBgView.moveToBottom();
	pageIView.moveToTop();

	self.generate = function(price) {
		var menuModel = model.get();
		menuModel.pages = [[]];
		menuModel.pages[0].push(initItem({
			type : 'template',
			config : {
				template : 'cover',
				price : null
			}
		}));
		
		addItems(price, 1);
		model.update();
		$(window).triggerHandler($.Event('message', {
			id : 'store',
			ns : 'wscontroller',
			state : model.get()
		}));
	};

	self.getPage = function() {
		return page;
	};

	self.setBgColor = function(color) {
		if (typeof color === 'undefined' || color === null) {
			color = 'transparent';
		}
		pageBg.fill(color);
		pageBgView.draw();
	};
	self.setBgImage = function(src) {
		if (typeof src === 'undefined' || src === null) {
			pageBg.setImage(new Image());
			return;
		}
		var imageObject = new Image();
		imageObject.onload = function() {
			pageBg.setImage(imageObject);
			pageBgView.draw();
		};
		imageObject.onerror = function() {
			pageBg.setImage(null);
			pageBgView.draw();
		};
		imageObject.src = src;
	};

	self.onPageSelect = function(selectedPage) {
		page = selectedPage;
		pageNumber.setText(page + 1);
		if (!self.isFocused()) {
			return;
		}
		self.render();
		pageIView.batchDraw();
		self.firePagesChangeEvent();
	};

	var windowResizeEventTimerId = 0;
	self.onWindowResize = function() {
		clearTimeout(windowResizeEventTimerId);
		windowResizeEventTimerId = setTimeout(function() {
			self.updateViewGeometry();
		}, 250);
	};
	self.setScale = function(newScale) {
		if (newScale < 0.01) {
			scale = scale < 0.1 ? scale : 0.1;
		} else {
			scale = newScale;
		}
		if (newScale > 4) {
			scale = 4;
		}
		scaleObject = {
			x : scale,
			y : scale
		};
		scaleValue.setText(Math.round(scale * 100));
		scaleValue.setPosition({
			x : 88 - scaleValue.width() / 2,
			y : 36 - scaleValue.height() / 2
		});
		pageView.setScale(scaleObject);
		pageBgView.setScale(scaleObject);
		self.updateViewGeometry();
	};
	self.getScale = function() {
		return scale;
	};
	self.setPagePosition = function(position) {
		pageView.setPosition(position);
		pageBgView.setPosition(position);
	};
	self.setPageSize = function(size) {
		pageView.setSize(size);
		pageBgView.setSize(size);
		pageBgView.getChildren().setSize(size);
	};

	self.updateViewGeometry = function() {
		view.setSize({
			width : $viewContainer.width(),
			height : $viewContainer.height()
		});
		var safeScale = scale === 0 ? 1 : scale;
		self.setPagePosition({
			x : (view.getWidth() - pageView.getWidth() * safeScale) / 2,
			y : (view.getHeight() - pageView.getHeight() * safeScale) / 2
		});
		view.draw();
	};
	var selectEventListeners = [];
    self.fireSelectEvent = function(selected) {
		for (var i in selectEventListeners) {
			selectEventListeners[i].onSelect(selected);
		}
    };
	self.addSelectEventListener = function(listener) {
		selectEventListeners.push(listener);
	};
	self.removeSelectEventListener = function(listener) {
		var index = selectEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		selectEventListeners.splice(index, 1);
	};
	var focused = false;
	self.isFocused = function() {
		return focused;
	};
	self.focus = function() {
		var $focusedWsController = $('.pd-ws-focused');
		if ($focusedWsController.length !== 0) {
			var focusedWsController = $focusedWsController.data('wsController');
			if (focusedWsController === self) {
				return;
			}
			focusedWsController.blur();
		}
		$viewContainer.addClass('pd-ws-focused');
		self.updateViewGeometry();
		focused = true;
	};
	self.blur = function(passOnFocus) {
		if (!self.isFocused()) {
			return;
		}
		if (passOnFocus) {
			var $unfocusedWsControllers = $('.pd-ws:not(.pd-ws-focused)');
			if ($unfocusedWsControllers.length !== 0) {
				var unfocusedWsController = $unfocusedWsControllers.eq(0)
					.data('wsController');
				unfocusedWsController.focus();
				return;
			}
		}
		$viewContainer.removeClass('pd-ws-focused');
		self.fireSelectEvent();
		focused = false;
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
	self.render = function() {
		pageView.getChildren(function(node) {
			return node.getAttr('model');
		}).remove();
		var items = model.get(page);
		var renderedItemCount = 0;
		var itemCount = items.length;
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			if (item.type === 'ps' || item.type === 'ls') {
				if (++renderedItemCount === itemCount) {
					self.updateRunningTitles();
				}
				continue;
			}
			var wsItemFactory = WsItemFactory.forType(item.type);
			itemView = wsItemFactory.createView(item);
			pageView.add(itemView);
			itemView.setZIndex(item.zIndex);
			itemView.setAttr('index', item.i);
			itemView.on('render', function() {
				if (++renderedItemCount === itemCount) {
					self.updateRunningTitles();
				}
			});
			wsItemFactory.render(itemView);
		}
	};

	self.setPageSize({
		width : model.getWidth(),
		height : model.getHeight()
	});

	$(window).on('resize.pdWsPreviewController', self.onWindowResize);
};
