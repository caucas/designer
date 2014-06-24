var PriceManager = function($container, source) {
	var self = this;

	$container.addClass('pd-price-manager');

	var $content = $('<div class="pd-price-manager-content"/>');

	var $priceToolbar = $('<div class="pd-price-manager-toolbar"/>').pdToolbar({
		source : [{
			'name' : 'new',
			'type' : 'class',
			'value' : 'icon-icomoon-plus3',
			'click' : function() {
			}
		}, {
			'name' : 'edit',
			'type' : 'class',
			'value' : 'icon-icomoon-pencil2',
			'disabled' : 'true',
			'click' : function() {
				var templatesStrings = {};

				var event = $.Event('message', {
					id : 'gettemplates'
				})
				$(window).triggerHandler(event);

				for (var key in event.templates) {
					templatesStrings[event.templates[key].name] = 
						event.templates[key].name;
				}

				var newItem = $.extend({}, self.getSelected());

				function onChange(update) {
					$.extend(newItem, update);
				}

				var $itemProperties = $('<div/>');
				var properties = {};
				if (typeof newItem.media === 'undefined') {
					PropertiesBuilder(properties)
						.addStringProperty('id', 'Identificator')
						.addStringProperty('name', 'Name', onChange)
						.addTextProperty('description', 'Description', onChange)
						.setPropertyValues(newItem);
				} else {
					PropertiesBuilder(properties)
						.addStringProperty('id', 'Identificator')
						.addStringProperty('name', 'Name', onChange)
						.addStringsProperty('template', 'Template', onChange,
							templatesStrings)
						.addNumberProperty('cost', 'Cost', onChange)
						.addBooleanProperty('fresh', 'New', onChange)
						.addBooleanProperty('active', 'Active', onChange)
						.addTextProperty('description', 'Description', onChange)
						.setPropertyValues(newItem);
				}
				var propertyBrowser = new PropertyBrowser($itemProperties)
					.set(properties);

				app.setBodyActive(false);
				$('<div/>').appendTo(document.body).pdDialog({
					title : 'Item edit',
					content : $itemProperties,
					destroy : function() {
						app.setBodyActive(true);
					},
					confirm : function() {
						self.set(newItem.id, newItem);
					},
					cancel : function() {
						delete newItem;
					}
				});
			}
		}, {
			'name' : 'remove',
			'type' : 'class',
			'value' : 'icon-icomoon-trash',
			'disabled' : 'true',
			'click' : function() {
				var item = self.getSelected();
				$content.find('#' + item.id).remove();
				self.remove(item.id);
				$priceToolbar.pdToolbar('disableOption', 'edit', 'true');
				$priceToolbar.pdToolbar('disableOption', 'remove', 'true');
			}
		}]
	});
	$container.append($priceToolbar);
	$container.append($content);

	function addPrice($category, item) {
		var level = $category.data('level');
		item.category = $category.data('item');
		if (typeof level === 'undefined') {
			level = 0;
		} 
		var $level = $('<div class="pd-price-manager-level pd-price-manager-level-'
				+ level + '"/>');

		var $item = $('<div class="pd-price-manager-item">'
			+ item.name + '</div>');
		
		$item.pdDraggable({
			dragObject : function() {
				var $dragObject = $item.parent().clone();
				$dragObject.find('.pd-price-manager-selected')
					.removeClass('pd-price-manager-selected');
				return $dragObject;
			},
			dragDistance : function(offset) {
				offset.left = $item.parent().position().left;
			}
		});


		$item.on('click', function() {
			$content.find('.pd-price-manager-selected')
				.removeClass('pd-price-manager-selected');
			$(this).addClass('pd-price-manager-selected');
			$priceToolbar.pdToolbar('disableOption', 'edit', 'false');
			$priceToolbar.pdToolbar('disableOption', 'remove', 'false');
		});
		
		$level.append($item);
		$category.append($level);
		if (typeof item.media === 'undefined') {
			$icon = $('<div class="pd-price-manager-level-icon"/>');
			$level.prepend($icon);
			$item.addClass('pd-price-manager-category');
		}
		$level.attr('id', item.id);
		$level.data('item', item);
		
		return $level;
	}
	
	function createTree(item, $content, level) {
		for (var key in item) {
			if (key === 'category') {
				continue;
			}
			if (typeof item[key] === 'object' && !Array.isArray(item[key])) {
				var $level = addPrice($content, item[key]);
				$level.data('level', level + 1);
				if (typeof item[key].media === 'undefined') {
					createTree(item[key], $level, level + 1);
				}
			}
		}
	}
	createTree(source, $content, 0);
	
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

	function remove(source, id) {
		for (var key in source) {
			if (key === 'category') {
				continue;
			}
			if (typeof source[key] === 'object') {
				if (key === id) {
					return delete source[key];
				}
				if (typeof source[key].media === 'undefined') {
					var item = find(source[key], id);
					if (item !== null) {
						return delete source[key][id];
					}
				}
			}
		}
		return false;
	}

	self.get = function(id) {
		return typeof id === 'undefined' ? source : find(source, id);
	};
	self.getSelected = function() {
		return find(source , $content.find('.pd-price-manager-selected')
			.parent().attr('id'));
	};
	self.set = function(id, update) {
		var price = self.get(id);
		if (price === null) {
			return;
		}
		$.extend(price, update);
		$content.find('#' + id).children('.pd-price-manager-item').
			text(price.name);
		// $(window).triggerHandler($.Event('message', {
		// 	id : 'saveprice',
		// 	price : price
		// }));
		// TODO updateVIew
		self.fireItemUpdateEvent(price);
	};
	self.remove = function(id) {
		var item = self.get(id);
		var removedItem = $.extend({}, item);
		remove(source, id);
		self.fireItemRemoveEvent(removedItem);
	};
	self.add = function(categoryId, price) {
		var category = self.get(categoryId);
		category[price.id] = price;
		var $category = $content.find('#' + categoryId);
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

	var itemRemoveEventListeners = [];
    self.fireItemRemoveEvent = function(item) {
		for (var i in itemRemoveEventListeners) {
			itemRemoveEventListeners[i].onItemRemove(item);
		}
    };
	self.addItemRemoveEventListener = function(listener) {
		itemRemoveEventListeners.push(listener);
	};

};
