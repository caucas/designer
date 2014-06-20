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
		
		
		var template = item.template;
		
		if (typeof item.media === 'undefined') {
			if (typeof template === 'undefined') {
				template = 'link' + (level + 1);
			}
		} else {
			if (typeof template === 'undefined') {
				template = 'default';
			}
		}
		var createDragObject = (function(template, price) {
			var f = function() {
				var $item = $('<div/>');
				var event = $.Event('message', {
					id : 'ispreviewmode'
				});
				$(window).triggerHandler(event);
				if (event.previewMode === false) {
					$item.pdWsItem({
						model : {
							type : 'template',
							config : {
								price : price,
								template : template
							}
						}
					});
				}
				return $item;
			};
			return f;
		}(template, item.id));
		$item.pdDraggable({
			dragObject : createDragObject
		});
			
		$level.append($item);
		$category.append($level);
		if (typeof item.media === 'undefined') {
			$icon = $('<div class="pd-price-service-level-icon"/>');
			$level.prepend($icon);
			$item.addClass('pd-price-service-category');
			$item.on('click', function(e) {
				var $item = $(this);
				var $level = $item.parent();
				if ($level.hasClass('pd-price-service-level-collapsed')) {
					$level.children('.pd-price-service-level').slideDown('normal')
					$level.removeClass('pd-price-service-level-collapsed');
				} else {
					$level.children('.pd-price-service-level').slideUp('normal')
					$level.addClass('pd-price-service-level-collapsed');
				}
			});
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
	
	$container.find('.pd-price-service-category').trigger('click');

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

	function createProperties(item) {
		var $content = $('<div/>');
		if (typeof item.media === 'undefined') {

		} else {
			var properties = {};
			PropertiesBuilder(properties)
				.addStringProperty('name', 'Наименование')
				.setPropertyValues(item);
			var propertyBrowser = new PropertyBrowser($content).set(properties);
		}
		return $content;
	}

	$('<div/>').appendTo(document.body).pdDialog({
		title : 'Item edit',
		content : createProperties(find(source, '295114d82cd28983')),
		destroy : function() {
			app.setBodyActive(true);
		}
	});

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
		// TODO updateVIew
	};
	self.add = function(categoryId, price) {
		var category = self.get(categoryId);
		category[price.id] = price;
		var $category = $container.find('#' + categoryId);
		addPrice($category, price);
	};

};
