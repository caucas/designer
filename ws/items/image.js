var ImageWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			type : 'image',
			w : 128,
			h : 128,
			config : {
				x : 0,
				y : 0,
				w : 0,
				h : 0,
				src : 'public/images/peace_love_music_128x128.png',
			}
		});
		return this.uber('createView', model);
	};
	function render(view, model, imageObject) {
		var image = new Kinetic.Image({
			x : model.config.x,
			y : model.config.y,
			width : model.config.w ? model.config.w : model.w,
			height : model.config.h ? model.config.h : model.h,
			image : imageObject
		});
		view.add(image);
	}
	this.render = function(view) {
		var self = this;
		var model = view.getAttr('model');
		var imageObject = ImageWsItemFactory.cache[model.config.src];
		var image = new Kinetic.Image({
			x : model.config.x,
			y : model.config.y,
			width : model.config.w ? model.config.w : model.w,
			height : model.config.h ? model.config.h : model.h
		});
		if (imageObject) {
			image.setImage(imageObject);
			view.add(image);
			self.uber('render', view);
			view.fire('render');
		} else {
			imageObject = new Image();
			imageObject.onload = function() {
				ImageWsItemFactory.cache[model.config.src] = imageObject;
				image.setImage(imageObject);
				view.add(image);
				self.uber('render', view);
				view.fire('render');
			};
			imageObject.onerror = function() {
				var defaultImageObject = new Image();
				defaultImageObject.onload = function() {
					image.setImage(defaultImageObject);
					view.add(image);
					self.uber('render', view);
					view.fire('render');
				};
				defaultImageObject.src =
					'public/images/peace_love_music_128x128.png';
			};
			imageObject.src = model.config.src;
		}
	};
	this.createProperties = function(onChange) {
		var properties = this.uber('createProperties', onChange);
		PropertiesBuilder(properties)
			.addImageProperty('config.src', 'Image', onChange)
			.addNumberProperty('config.x', 'X Offset', onChange,
				0, 10000, 1)
			.addNumberProperty('config.y', 'Y Offset', onChange,
				0, 10000, 1)
			.addNumberProperty('config.w', 'Image Width', onChange,
				0, 10000, 1)
			.addNumberProperty('config.h', 'Image Height', onChange,
				0, 10000, 1);
		return properties;
	};
};
ImageWsItemFactory.inherits(WsItemFactory);
ImageWsItemFactory.cache = {};
