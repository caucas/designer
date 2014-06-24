var TemplateWsItemFactory = function() {
	this.createView = function(model) {
		Object.extend(model, {
			w : 128,
			h : 128,
			type : 'template',
			config : {
				template : null,
				price : null
			}
		});
		if (typeof model.meta !== 'object' || model.meta === null) {
			model.meta = {};
		}
		var event = $.Event('message', {
			id : 'gettemplate',
			template : model.config.template
		});
		$(window).triggerHandler(event);
		model.meta.template = event.template;
		if (typeof model.meta.template === 'object') {
			if (typeof model.meta.template === 'object'
				&& model.meta.template !== null) {
				model.w = model.meta.template.width;
				model.h = model.meta.template.height;
				model.bg = model.meta.template.bgColor;
				model.bgOpacity = model.meta.template.bgOpacity;
			}
		}
		if (typeof model.config.price === 'string') {
			var event = $.Event('message', {
				id : 'getprice',
				price : model.config.price
			});
			$(window).triggerHandler(event);
			model.meta.globalObject = event.price;
		} else {
			var event = $.Event('message', {
				id : 'getcafe'
			});
			$(window).triggerHandler(event);
			model.meta.globalObject = {
				cafe : event.cafe,
				page : {
					index : model.p + 1,
					items : []
				}
			};
			event = $.Event('message', {
				id : 'getpageitems',
				page : model.p
			});
			$(window).triggerHandler(event);
			if (typeof event.page === 'object') {
				for (var i in event.page) {
					var item = event.page[i];
					if (item.type === 'template') {
						if (typeof item.config.price === 'string') {
							var e = $.Event('message', {
								id : 'getprice',
								price : item.config.price
							});
							$(window).triggerHandler(e);
							model.meta.globalObject.page.items.push(e.price);
						}
					}
				}
			}
		}
		return this.uber('createView', model);
	};
	function resolveHash(itemModel, globalObject) {
		for (var key in itemModel) {
			if (typeof itemModel[key] === 'string'
				&& !itemModel[key].match(/[#][0-9a-fA-F]{6}/)) {
				var hashes = null;
				var regexp = /[#][\w\[\].]+/;
				var expressionRegexp = /[#][\w\[\].]+ ?[|][|] ?[#]?[\wа-я\[\].]+/i;
				while (expressions = itemModel[key].match(expressionRegexp)) {
					var expression = expressions[0];
					var leftOperand = expression.match(regexp)[0];
					var rightOperand = expression.match(/[| ]?[#]?[\wа-я\[\].]+$/i)[0].substr(1);
					try {
						var hashValue = eval('globalObject.' + leftOperand.substr(1));
						if (typeof hashValue === 'undefined'
							|| hashValue === null) {
							throw null;
						}
						itemModel[key] = itemModel[key].replace(expression, hashValue);
					} catch (e) {
						if (rightOperand.match(regexp)) {
							try {
								var hashValue = eval('globalObject.' + rightOperand.substr(1));
								if (typeof hashValue === 'undefined'
									|| hashValue === null) {
									throw null;
								}
							} catch (exception) {
								hashValue = ' ';
							}
							itemModel[key] = itemModel[key].replace(expression, hashValue);
						} else {
							itemModel[key] = itemModel[key].replace(expression, rightOperand);
						}
						
					}
				}
				
				while (hashes = itemModel[key].match(regexp)) {
					try {
						var hashValue = eval('globalObject.' + hashes[0].substr(1));
						if (typeof hashValue === 'undefined'
							|| hashValue === null) {
							throw null;
						}
						itemModel[key] = itemModel[key].replace(hashes[0], hashValue);
					} catch (e) {
						itemModel[key] = itemModel[key].replace(regexp, ' ');
					}
				}
			} else if (typeof itemModel[key] === 'object') {
				resolveHash(itemModel[key], globalObject);
			}
		}
	}
	this.render = function(view) {
		var self = this;
		var model = view.getAttr('model');
		model.config.items = [];
		if (typeof model.meta.template === 'object') {
			var renderedItemCount = 0;
			var itemCount = model.meta.template.items.length;
			var offsets = [];
			if (model.meta.template.items.length === 0) {
				self.uber('render', view);
				view.fire('render');
			} else {
				for (var i = 0; i < itemCount; i++) {
					var itemModel = {};
					Object.extend(itemModel, model.meta.template.items[i]);
					if (typeof model.meta.globalObject === 'object') {
						resolveHash(itemModel, model.meta.globalObject);
					}
					var offsetItemIndex = -1;
					for (var k = 0; k < offsets.length; k++) {
						if (itemModel.y > offsets[k][0]) {
							if (offsetItemIndex === -1
								|| offsets[k][1] > offsets[offsetItemIndex][1]) {
								offsetItemIndex = k;
							}
						}
					}
					
					if (offsetItemIndex !== -1) {
						itemModel.y += offsets[offsetItemIndex][2];
					}
					var wsItemFactory = WsItemFactory.forType(itemModel.type);
					var itemView = wsItemFactory.createView(itemModel);
					itemView.on('render', function() {
						if (++renderedItemCount === itemCount) {
							delete model.meta;
							self.uber('render', view);
							view.fire('render');
						}
					});
					
					var prototypeModel = model.meta.template.items[i];
					
					wsItemFactory.render(itemView);
					view.add(itemView);

					if (itemModel.h !== prototypeModel.h) {
						var originalBottom = prototypeModel.y
							+ prototypeModel.h;
						var bottom = itemModel.y + itemModel.h;
						var offset = itemModel.h - prototypeModel.h;
						var ownOffset = offsetItemIndex === -1
							? 0 : offsets[offsetItemIndex][2];
						offsets.push([originalBottom, bottom, ownOffset + offset]);
					}
					var bottom = itemModel.y + itemModel.h;
					if (model.h < bottom) {
						model.h = bottom;
					}
					model.config.items.push(itemModel);
				}
			}
		}
		delete model.meta;
	};
	this.createProperties = function(onChange) {
		var properties = this.uber('createProperties', onChange);
		for (var key in properties) {
			properties[key].control.attr('readonly', 'readonly');
		}
		PropertiesBuilder(properties)
			.addStringProperty('config.template', 'Template')
			.addStringProperty('config.price', 'Price');
		return properties;
	};
	this.createEditor = function(model, onChange) {
		$(window).triggerHandler($.Event('message', {
			id : 'opentemplate',
			template : model.config.template
		}));
		return null;
	};
};
TemplateWsItemFactory.inherits(WsItemFactory);
