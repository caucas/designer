var PriceService = function($container, source) {
	var self = this;
	$container.addClass('pd-price-service');
	
	function addPrice($category, item) {
		var level = $category.data('level');
		item.category = $category.data('item');
		if (typeof level === 'undefined') {
			level = 0;
		} 
		var $level = $('<div class="pd-price-service-level pd-price-service-level-'
				+ level + '"/>');
		var $item = $('<div class="pd-price-service-item">'
			+ item.name + '</div>');
		
		$item.on('click', function() {
			if ($(this).hasClass('pd-price-service-selected')) {
				var priceId = $(this).parent().attr('id');

				function onChange(update) {
					$.extend(price, update);
				}

				function createProperties(item) {
					var $content = $('<div/>');
					var properties = {};
					if (typeof item.media === 'undefined') {
						PropertiesBuilder(properties)
							.addStringProperty('id', 'Идентификатор')
							.addStringProperty('name', 'Наименование', onChange)
							.addTextProperty('description', 'Описание', onChange)
							.setPropertyValues(item);
					} else {
						PropertiesBuilder(properties)
							.addStringProperty('id', 'Идентификатор')
							.addStringProperty('name', 'Наименование', onChange)
							.addNumberProperty('cost', 'Цена', onChange)
							.addBooleanProperty('fresh', 'Новинка', onChange)
							.addBooleanProperty('active', 'Активен', onChange)
							.addTextProperty('description', 'Описание', onChange)
							.setPropertyValues(item);
					}
					var propertyBrowser = new PropertyBrowser($content)
						.set(properties);
					return $content;
				}

				var price = $.extend({}, find(source, priceId));

				app.setBodyActive(false);
				$('<div/>').appendTo(document.body).pdDialog({
					title : 'Item edit',
					content : createProperties(price),
					destroy : function() {
						app.setBodyActive(true);
					},
					confirm : function() {
						self.set(price.id, price);
					},
					cancel : function() {
						delete price;
					}
				});
			} else {
				$container.find('.pd-price-service-selected')
					.removeClass('pd-price-service-selected')
					.pdDraggable('destroy');
				$(this).addClass('pd-price-service-selected');
			}
			
		});
		
		$level.append($item);
		$category.append($level);
		if (typeof item.media === 'undefined') {
			$icon = $('<div class="pd-price-service-level-icon"/>');
			$level.prepend($icon);
			$item.addClass('pd-price-service-category');
		}
		$level.attr('id', item.id);
		$level.data('item', item);
		
		return $level;
	}
	
	function createTree(item, $container, level) {
		for (var key in item) {
			if (key === 'category') {
				continue;
			}
			if (typeof item[key] === 'object' && !Array.isArray(item[key])) {
				var $level = addPrice($container, item[key]);
				$level.data('level', level + 1);
				if (typeof item[key].media === 'undefined') {
					createTree(item[key], $level, level + 1);
				}
			}
		}
	}
	createTree(source, $container, 0);
	
	function find(source, id) {
		for (var key in source) {
			if (key === 'category') {
				continue;
			}
			if (typeof source[key] === 'object') {
				if (key === id) {
					return source[key];
				}
				if (typeof source[key].media === 'undefined') {
					var item = find(source[key], id);
					if (item !== null) {
						return item;
					}
				}
			}
		}
		return null;
	}

	self.get = function(id) {
		return typeof id === 'undefined' ? source : find(source, id);
	};
	self.set = function(id, update) {
		var price = self.get(id);
		if (price === null) {
			return;
		}
		$.extend(price, update);
		$container.find('#' + id).children('.pd-price-service-item').
			text(price.name);
		// $(window).triggerHandler($.Event('message', {
		// 	id : 'saveprice',
		// 	price : price
		// }));
		// TODO updateVIew
		self.fireItemUpdateEvent(price);
	};
	self.add = function(categoryId, price) {
		var category = self.get(categoryId);
		category[price.id] = price;
		var $category = $container.find('#' + categoryId);
		addPrice($category, price);
	};

	var itemUpdateEventListeners = [];
    self.fireItemUpdateEvent = function(item) {
		for (var i in itemUpdateEventListeners) {
			itemUpdateEventListeners[i].onItemUpdate(item);
		}
    };
	self.addItemUpdateEventListener = function(listener) {
		itemUpdateEventListeners.push(listener);
	};

};
