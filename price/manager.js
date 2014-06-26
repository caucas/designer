var PriceManager = function($container, source) {
	var self = this;

	$container.addClass('pd-price-manager');

	var $content = $('<div class="pd-price-manager-content"/>');

	$content.on('click', function(e) {
		var $target = $(e.target);
		if ($target.hasClass('pd-price-manager-item')) {
			var item = $target.parent().data('item');
			self.select(item.id);
		} else {
			self.select();
		}
	});

	var $newItemButton = $('<div class="icon-icomoon-plus3"/>');

		$newItemButton.on('click', function() {
		var $container = $('<div class="pd-price-'
						+ 'manager-item-create"/>');
		$container.css({
			'left' : $(this).offset().left + $(this).outerWidth(),
			'top' : $(this).offset().top + $(this).outerHeight()
		});
		$('<div class="pd-price-manager-item-create-item">'
			+ 'price</div>')
			.on('click', function() {
				$container.remove();
			}).appendTo($container);
		$('<div class="pd-price-manager-item-create-item">'
			+ 'category</div>')
			.on('click', function() {
				$container.remove();
			}).appendTo($container);
		$container.appendTo(document.body);
	});

	var $toolbar = $('<div class="pd-price-manager-toolbar"/>').pdToolbar({
		source : [{
			'name' : 'new',
			'type' : 'html',
			'value' : $newItemButton
		}, {
			'name' : 'edit',
			'type' : 'class',
			'value' : 'icon-icomoon-pencil2',
			'disabled' : 'true',
			'click' : function() {
				var selectedItem = self.getSelected();
				if (typeof selectedItem.media !== 'undefined') { 
					dpd.price.get(selectedItem.id, function(price, error) {
						if (!error) {
							price.name = price.tname['2af6d93760ad484e'];
							app.setBodyActive(false);

							var $dialog = $('<div/>');
							$dialog.appendTo(document.body);
							$dialog.pdDialog({
								title : 'Item edit',
								content : buildProperties(price),
								destroy : function() {
									app.setBodyActive(true);
								},
								confirm : function() {
									//self.set(item.id, item);
									price.tname['2af6d93760ad484e'] = price.name;
									dpd.price.put(price, function(price, error) {
										if (error) {
											Logger().error('Failed to save price. Cause:\n'
												+ error.message);
										} else {
											Logger().info('Price saved');
											reload();
										}
									});
								}
							}); 
						}
					});
			} else {
				
			}
		}, {
			'name' : 'remove',
			'type' : 'class',
			'value' : 'icon-icomoon-trash',
			'disabled' : 'true',
			'click' : function() {
				self.remove();
			}
		}, {
			'name' : 'reload',
			'type' : 'class',
			'value' : 'icon-icomoon-spinner5',
			'disabled' : 'true',
			'click' : function() {
				reload();
			}
		}]
	});
	$container.append($toolbar);
	$container.append($content);

	function reload() {
		app.setBodyActive(false);
		app.showLoading(true);
		dpd.pricetree.get({
			'cafe' : app.getWsModel().get().cafe,
			'object' : '1'
		}, function(pricetree, error) {
			if (error) {
				app.setBodyActive(true);
				app.showLoading(false);
			}
			if (!pricetree[0] || !pricetree[0].object) {
				app.setBodyActive(true);
				app.showLoading(false);
				Logger().fatal('Failed to load price. Cause:\n'
					+ 'Price is empty');
			} else {
				source = pricetree[0].object;
				$content.empty();
				createTree(source, $content, 0);
				self.fireItemUpdateEvent(null);
				app.setBodyActive(true);
				app.showLoading(false);
			}
		});
	}

	function buildProperties(item) {
		function onChange(update) {
			$.extend(item, update);
		}

		var $properties = $('<div/>');
		var properties = {};
		if (typeof item.media === 'undefined') {
			PropertiesBuilder(properties)
				.addStringProperty('id', 'Identificator')
				.addStringProperty('name', 'Name', onChange)
				.addTextProperty('description', 'Description', onChange)
				.setPropertyValues(item);
		} else {
			var templates = {};

			var event = $.Event('message', {
				id : 'gettemplates'
			});
			$(window).triggerHandler(event);

			for (var key in event.templates) {
				templates[event.templates[key].name] = 
					event.templates[key].name;
			}

			PropertiesBuilder(properties)
				.addStringProperty('id', 'Identificator')
				.addStringProperty('name', 'Name', onChange)
				.addStringsProperty('template', 'Template', onChange,
					templates)
				.addStringProperty('cost', 'Cost', onChange)
				.addBooleanProperty('fresh', 'New', onChange)
				.addBooleanProperty('active', 'Active', onChange)
				.addTextProperty('description', 'Description', onChange)
				.setPropertyValues(item);
		}
		var propertyBrowser = new PropertyBrowser($properties)
			.set(properties);
		return $properties;
	}

	function addPrice($category, item) {
		var level = $category.data('level');
		item.category = $category.data('item');
		if (typeof level === 'undefined') {
			level = 0;
		} 
		var $level = $('<div class="pd-price-manager-level pd-price-manager-level-'
				+ level + '"/>');

		$level.pdDraggable({
			dragObject : function() {
				var $dragObject = $level.clone();
				$dragObject.find('.pd-price-manager-selected')
					.removeClass('pd-price-manager-selected');
				$dragObject.addClass('pd-price-manager-draggable');
				return $dragObject;
			},
			dragDistance : function(offset) {
				//offset.left = $level.position().left;
			}
		});

		var $item = $('<div class="pd-price-manager-item">'
			+ item.name + '</div>');
		
		$level.append($item);
		$category.append($level);
		if (typeof item.media === 'undefined') {
			$icon = $('<div class="pd-price-manager-level-icon"/>');
			$level.prepend($icon);
			$item.addClass('pd-price-manager-category');
		}
		$level.attr('id', item.id);
		$level.data('item', item);


		var $lastDroppable = null;
		$container.pdDroppable({
			accept : function($dragObject) {
				return $dragObject.hasClass('pd-price-manager-draggable');
			},
			over : function(e) {
			},
			out : function(e) {
			},
			move : function(e) {
				var $dragObject = e.dragObject;
				var $targetObject = $(document.elementFromPoint(
					$dragObject.offset().left + $dragObject.width() / 2, 
					$dragObject.offset().top - 1));
				if ($lastDroppable !== $targetObject) {
					if ($lastDroppable) {
						$lastDroppable.css({
							'border-bottom' : '',
							'background' : ''
						});
					}
					$lastDroppable = $targetObject;
				}
				if ($targetObject.hasClass('pd-price-manager-category')) {
					if ($targetObject.next().children().first().hasClass('pd-price-manager-item')) {
						$targetObject.css({
							'border-bottom' : '1px dotted #9C9'
						});
					} else {
						$targetObject.css({
							'background' : 'rgba(153,204,153,0.5)'
						});
					}
				} else if ($targetObject.hasClass('pd-price-manager-item')) {
					$targetObject.css({
						'border-bottom' : '1px dotted #9C9'
					});
				}
			},
			drop : function(e) {
				var $dragObject = e.dragObject;
				var dragObjectModel = find(source, $dragObject.attr('id'));
				if ($lastDroppable.hasClass('pd-price-manager-category')) {
					var targetModel = find(source, $lastDroppable.parent().attr('id'));
					targetModel[dragObjectModel.id] = dragObjectModel;
				}
				delete dragObjectModel.category[dragObjectModel.id];
				$content.empty();
				createTree(source, $content, 0);
			}
		});
		
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

	self.get = function(id) {
		return typeof id === 'undefined' ? source : find(source, id);
	};
	self.select = function(id) {
		$content.find('.pd-price-manager-selected')
				.removeClass('pd-price-manager-selected');
		var $item = $content.find('#' + id)
			.children('.pd-price-manager-item');
		if ($item.length) {
			$item.addClass('pd-price-manager-selected');
		}
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
	self.remove = function() {
		var selectedItem = self.getSelected();
		if (typeof selectedItem.media === 'undefined') {

		} else {
			app.setBodyActive(false);
			app.showLoading(true);
			dpd.price.del({
				'id' : selectedItem.id
			}, function(price, error) {
				reload();
			});
		}
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
