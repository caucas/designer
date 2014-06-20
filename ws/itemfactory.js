var WsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : undefined,
			p : -1,
			i : -1,
			x : 0,
			y : 0,
			w : 0,
			h : 0,
			bg : 'transparent',
			color : '#000000',
			borderColor : 'transparent',
			borderWidth : 0,
			opacity : 1,
			zIndex : 0,
			action : '',
			anchor : '',
			config : {}
		});
		var view = new Kinetic.Group();
		view.setAttr('model', model);
		view.setSize({
			width : model.w,
			height : model.h
		});
		view.setPosition({
			x : model.x,
			y : model.y
		});
		return view;
	};
	this.render = function(view) {
		var model = view.getAttr('model');
		if (view.getWidth() !== model.w || view.getHeight() !== model.h) {
			view.setSize({
				width : model.w,
				height : model.h
			});
		}
		var bg = new Kinetic.Rect({
			name : 'bg',
			width : view.getWidth(),
			height : view.getHeight(),
			fill : model.bg,
			stroke : model.borderColor,
			strokeWidth : model.borderWidth
		});
		view.add(bg);
		bg.moveToBottom();
		view.setOpacity(model.opacity);
		if (typeof view.getParent() !== 'undefined') {
			view.setZIndex(model.zIndex);
		}
	};
	this.clearView = function(view) {
		view.removeChildren();
	};
	this.createProperties = function(onChange) {
		var properties = {};
		PropertiesBuilder(properties)
			.addNumberProperty('p', 'Page')
			.addNumberProperty('i', 'Index')
			.addStringProperty('x', 'X', onChange, 0, 10000, 1)
			.addNumberProperty('y', 'Y', onChange, 0, 10000, 1)
			.addNumberProperty('w', 'Width', onChange, 0, 10000, 1)
			.addNumberProperty('h', 'Height', onChange, 0, 10000, 1)
			.addColorProperty('bg', 'Bg Color', onChange)
			.addColorProperty('color', 'Color', onChange)
			.addNumberProperty('opacity', 'Opacity', onChange, 0, 1, 0.1)
			.addNumberProperty('zIndex', 'ZIndex', onChange, -127, 127, 1)
			.addStringProperty('action', 'Action', onChange)
			.addStringProperty('anchor', 'Anchor', onChange);
		return properties;
	};
	this.createEditor = function(model, onChange) {
		return null;
	};
};

WsItemFactory.cache = {};
WsItemFactory.forType = function(type) {
	if (!type) {
		throw 'WsItemFactory: Failed to create WsItemFactory. Cause:\n'
			+ 'Item type "' + type + '" is not specified';
	}
	var factory = WsItemFactory.cache[type];
	if (typeof factory === 'object') {
		return factory;
	}
	var constructor = window[type[0].toUpperCase()
		+ type.substring(1) + 'WsItemFactory'];
	if (!constructor) {
		throw 'WsItemFactory: Failed to create WsItemFactory. Cause:\n'
			+ 'Unknown item type "' + type + '"';
	}
	factory = new constructor();
	WsItemFactory.cache[type] = factory;
	return factory;
};
