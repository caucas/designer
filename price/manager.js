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
			$('.pd-price-manager-item-create').remove();
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
				var parentId = (self.getSelected() && typeof self.getSelected().media === 'undefined') ? self
					.getSelected().id : null;
				if (parentId === null) {
					return;
				}
				var item = {
					name : '',
					cost : '',
					description : '',
					tname : {},
					tdescription : {},
					fresh : true,
					active : true,
					template : 'default',
					cafe : app.getWsModel().get().cafe,
					count : 0,
					fields : [],
					media : [],
					parent : parentId
				};

				app.setBodyActive(false);
				var $dialog = $('<div/>');
				$dialog.appendTo(document.body);
				$dialog.pdDialog({
					title : 'Price create',
					content : buildProperties(item),
					destroy : function() {
						app.setBodyActive(true);
					},
					confirm : function() {
						item.tname['2af6d93760ad484e'] = item.name;
						item.tdescription['2af6d93760ad484e'] = item.description;
						dpd.price.post(item, function(price, error) {
							if (error) {
								Logger().error('Failed to save price. Cause:\n'
									+ error.message);
							} else {
								dpd.pricetree.get({
									'cafe' : price.cafe
								}, function(pricetree, error) {
									if (error) {
										Logger().error('Failed to save price. Cause:\n'
										+ error.message);
									} else {
										function getItem(source, id) {
											for (var key in source) {
												if (source[key].id === id) {
													return source[key];
												} else {
													var item = getItem(source[key].children, id);
													if (item != null) {
														return item;
													}
												}
											}
											return null;
										}
										var category = getItem(pricetree[0].tree, price.parent);
										category.order.push(price.id);
										dpd.pricetree.put(pricetree[0], function(pricetree, error) {
											Logger().info('Price saved');
											reload();
										});
									}
								});
							}
						});
					}
				}); 

			}).appendTo($container);
		$('<div class="pd-price-manager-item-create-item">'
			+ 'category</div>')
			.on('click', function() {
				$container.remove();
				var guid = (function() {
					function s4() {
						return Math.floor((1 + Math.random()) * 0x10000)
							.toString(16).substring(1);
					}
					return function() {
						return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
							s4() + '-' + s4() + s4() + s4();
					};
				})();
				var parentId = (self.getSelected() && typeof self.getSelected().media === 'undefined') ? self
					.getSelected().id : null;
				dpd.pricetree.get({
					'cafe' : app.getWsModel().get().cafe
				}, function(pricetree, error) {
					if (error) {
						Logger().error('Can not create category');
					} else {
						function getItem(source, id) {
							for (var key in source) {
								if (source[key].id === id) {
									return source[key];
								} else {
									var item = getItem(source[key].children, id);
									if (item != null) {
										return item;
									}
								}
							}
							return null;
						}
						var parent = parentId ? getItem(pricetree[0].tree, parentId) : pricetree[0].tree;
						var item = {
							id : guid(),
							name : '',
							children : [],
							tname : {},
							description : '',
							tdesc : {},
							order : []
						}
						parentId ? parent.children.push(item) : pricetree[0].tree.push(item);

						app.setBodyActive(false);
						var $dialog = $('<div/>');
						$dialog.appendTo(document.body);
						$dialog.pdDialog({
							title : 'Category create',
							content : buildProperties(item),
							destroy : function() {
								app.setBodyActive(true);
							},
							confirm : function() {
								item.tname['2af6d93760ad484e'] = item.name;
								item.tdesc['2af6d93760ad484e'] = item.tdescription;
								dpd.pricetree.put(pricetree[0], function(pricetree, error) {
									if (error) {
										Logger().error('Failed to save category. Cause:\n'
											+ error.message);
									} else {
										Logger().info('Category saved');
										reload();
									}
								});
							}
						}); 

					}
				})
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
				if (selectedItem) {
					if (typeof selectedItem.media !== 'undefined') { 
						dpd.price.get(selectedItem.id, function(price, error) {
							if (!error) {
								price.name = price.tname['2af6d93760ad484e'];
								price.description = price.tdescription['2af6d93760ad484e'];
								app.setBodyActive(false);

								var $dialog = $('<div/>');
								$dialog.appendTo(document.body);
								$dialog.pdDialog({
									title : 'Price edit',
									content : buildProperties(price),
									destroy : function() {
										app.setBodyActive(true);
									},
									confirm : function() {
										price.tname['2af6d93760ad484e'] = price.name;
										price.tdescription['2af6d93760ad484e'] = price.description;
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
					}
				} else {
					dpd.pricetree.get({
						'cafe' : app.getWsModel().get().cafe
					}, function(pricetree, error) {
						if (!error) {
							function getItem(source, id) {
							for (var key in source) {
								if (source[key].id === id) {
									return source[key];
								} else {
									var item = getItem(source[key].children, id);
									if (item != null) {
										return item;
									}
								}
							}
							return null;
							}
							var category = getItem(pricetree[0].tree, selectedItem.id);
							category.name = category.tname['2af6d93760ad484e'];
							category.description = category.tdesc['2af6d93760ad484e'];
							app.setBodyActive(false);

							var $dialog = $('<div/>');
							$dialog.appendTo(document.body);
							$dialog.pdDialog({
								title : 'Category edit',
								content : buildProperties(category),
								destroy : function() {
									app.setBodyActive(true);
								},
								confirm : function() {
									category.tname['2af6d93760ad484e'] = category.name;
									category.tdesc['2af6d93760ad484e'] = category.description;
									dpd.pricetree.put(pricetree[0], function(pricetree, error) {
										if (error) {
											Logger().error('Failed to save category. Cause:\n'
												+ error.message);
										} else {
											Logger().info('Category saved');
											reload();
										}
									});
								}
							}); 
						}
					});
				}
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
				.addNumberProperty('count', 'Count', onChange)
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
						$lastDroppable.attr('style', '');
					}
					$lastDroppable = $targetObject;
				}
				if ($lastDroppable.hasClass('pd-price-manager-category')) {
					if (Math.abs($lastDroppable.offset().top - $dragObject.offset().top) > $lastDroppable.outerHeight() / 2) {
						$lastDroppable.css({
							'border-bottom' : '1px dotted #9C9'
						});
					} else {
						$lastDroppable.css({
							'background' : 'rgba(153,204,153,0.75)'
						});
					}
				}
				if ($lastDroppable.hasClass('pd-price-manager-item') && !$lastDroppable.hasClass('pd-price-manager-category')) {
					$lastDroppable.css({
						'border-bottom' : '1px dotted #9C9'
					});
				}
			},
			drop : function(e) {
				if (e.dragObject.attr('id') === $lastDroppable.parent().attr('id')) {
					$lastDroppable.attr('style', '');
					return;
				}
				app.setBodyActive(false);
				app.showLoading(true);
				$lastDroppable.attr('style', '');				var $dragObject = e.dragObject;
				var dragObjectModel = find(source, $dragObject.attr('id'));
				if (dragObjectModel.children) {
					var targetCategoryId = null;
					if ($lastDroppable.hasClass('pd-price-manager-item') && !$lastDroppable.hasClass('pd-price-manager-category')) {
						targetCategoryId = $lastDroppable.parent().parent().attr('id');
						dpd.pricetree.get({
								'cafe' : app.getWsModel().get().cafe
							}, function(pricetree, error){
								if (pricetree) {
									var parentId = $content.find('#' + $dragObject.attr('id')).parent().attr('id');
									function getItem(source, id) {
										for (var key in source) {
											if (source[key].id === id) {
												return source[key];
											} else {
												var item = getItem(source[key].children, id);
												if (item != null) {
													return item;
												}
											}
										}
										return null;
									}
									var category = $.extend({}, getItem(pricetree[0].tree, $dragObject.attr('id')));
									if (parentId) {
										var parentCategory = getItem(pricetree[0].tree, parentId);
										for (var key in parentCategory.children) {
											if (parentCategory.children[key].id === $dragObject.attr('id')) {
												parentCategory.children.splice(key, 1);
											}
										}
									} else {
										for (var key in pricetree[0].tree) {
											if (pricetree[0].tree[key].id === $dragObject.attr('id')) {
												pricetree[0].tree.splice(key, 1);
											}
										}
									}
									var targetCategory = getItem(pricetree[0].tree, targetCategoryId);
									if (!targetCategory) {
										Logger().error('Can not move category');
										app.setBodyActive(true);
										app.showLoading(false);
										return;
									}
									targetCategory.children.unshift(category);
									dpd.pricetree.put(pricetree[0], function(pricetree, error) {
										if (!error) {
											reload();
										} else {
											Logger().error('Can not move category');
											app.setBodyActive(true);
											app.showLoading(false);
										}
									});
								} else {
									Logger().error('Can not move category');
									app.setBodyActive(true);
									app.showLoading(false);
								}
							});
					}
					if ($lastDroppable.hasClass('pd-price-manager-category')) {
						if (Math.abs($lastDroppable.offset().top - $dragObject.offset().top) < $lastDroppable.outerHeight() / 2) {
							targetCategoryId = $lastDroppable.parent().attr('id');
							dpd.pricetree.get({
								'cafe' : app.getWsModel().get().cafe
							}, function(pricetree, error){
								if (pricetree) {
									var parentId = $content.find('#' + $dragObject.attr('id')).parent().attr('id');
									function getItem(source, id) {
										for (var key in source) {
											if (source[key].id === id) {
												return source[key];
											} else {
												var item = getItem(source[key].children, id);
												if (item != null) {
													return item;
												}
											}
										}
										return null;
									}
									var category = $.extend({}, getItem(pricetree[0].tree, $dragObject.attr('id')));
									if (parentId) {
										var parentCategory = getItem(pricetree[0].tree, parentId);
										for (var key in parentCategory.children) {
											if (parentCategory.children[key].id === $dragObject.attr('id')) {
												parentCategory.children.splice(key, 1);
											}
										}
									} else {
										for (var key in pricetree[0].tree) {
											if (pricetree[0].tree[key].id === $dragObject.attr('id')) {
												pricetree[0].tree.splice(key, 1);
											}
										}
									}
									var targetCategory = getItem(pricetree[0].tree, targetCategoryId);
									if (!targetCategory) {
										Logger().error('Can not move category');
										app.setBodyActive(true);
										app.showLoading(false);
										return;
									}
									targetCategory.children.unshift(category);
									dpd.pricetree.put(pricetree[0], function(pricetree, error) {
										if (!error) {
											reload();
										} else {
											Logger().error('Can not move category');
											app.setBodyActive(true);
											app.showLoading(false);
										}
									});
								} else {
									Logger().error('Can not move category');
									app.setBodyActive(true);
									app.showLoading(false);
								}
							});
						} else {
							targetCategoryId = $lastDroppable.parent().attr('id');
							dpd.pricetree.get({
								'cafe' : app.getWsModel().get().cafe
							}, function(pricetree, error){
								if (pricetree) {
									var parentId = $content.find('#' + $dragObject.attr('id')).parent().attr('id');
									function getItem(source, id) {
										for (var key in source) {
											if (source[key].id === id) {
												return source[key];
											} else {
												var item = getItem(source[key].children, id);
												if (item != null) {
													return item;
												}
											}
										}
										return null;
									}
									var category = $.extend({}, getItem(pricetree[0].tree, $dragObject.attr('id')));
									if (parentId) {
										var parentCategory = getItem(pricetree[0].tree, parentId);
										for (var key in parentCategory.children) {
											if (parentCategory.children[key].id === $dragObject.attr('id')) {
												parentCategory.children.splice(key, 1);
											}
										}
									} else {
										for (var key in pricetree[0].tree) {
											if (pricetree[0].tree[key].id === $dragObject.attr('id')) {
												pricetree[0].tree.splice(key, 1);
											}
										}
									}
									var targetCategoryParent = getItem(pricetree[0].tree, $content.find('#' + targetCategoryId).parent().attr('id'));
									if (targetCategoryParent) {
										for (var key in targetCategoryParent.children) {
											if (targetCategoryParent.children[key].id === targetCategoryId) {
												targetCategoryParent.children.splice(key, 0, category);
											}
										}
									} else {
										for (var key in pricetree[0].tree) {
											if (pricetree[0].tree[key].id === targetCategoryId) {
												pricetree[0].tree.splice(key + 1, 0, category);
											}
										}
									}
									dpd.pricetree.put(pricetree[0], function(pricetree, error) {
										if (!error) {
											reload();
										} else {
											Logger().error('Can not move category');
										}
									});
								} else {
									Logger().error('Can not move category');
								}
							});
						}
					}
				} else {
					if ($lastDroppable.hasClass('pd-price-manager-item') && !$lastDroppable.hasClass('pd-price-manager-category')) {
						var lastDroppableModel = find(source, $lastDroppable
							.parent().attr('id'));
						dpd.price.get(dragObjectModel.id, function(price,error) {
							if (price) {
								price.parent = lastDroppableModel.parent;
								dpd.price.put(price, function(price, error) {
									if (price) {
										dpd.pricetree.get({
											'cafe' : app.getWsModel().get().cafe
										}, function(pricetree,error) {
											if (pricetree) {
												function getItem(source, id) {
													for (var key in source) {
														if (source[key].id === id) {
															return source[key];
														} else {
															var item = getItem(source[key].children, id);
															if (item != null) {
																return item;
															}
														}
													}
													return null;
												}
												var oldParent = getItem(pricetree[0].tree, dragObjectModel.parent);
												for (var i in oldParent.order) {
													if (oldParent.order[i] == price.id) {
														oldParent.order.splice(i, 1);
													}
												}
												var newParent = getItem(pricetree[0].tree, price.parent);
												for (var i in newParent.order) {
													if (newParent.order[i] == lastDroppableModel.id) {
														newParent.order.splice(i + 1, 0, price.id);
													}
												}
												dpd.pricetree.put(pricetree[0], function(pricetree, error) {
													if (pricetree) {
														reload();
													} 
												});
											}
										});
									}
								});
							}
						});
					} else if ($lastDroppable.hasClass('pd-price-manager-category')) {
						var lastDroppableModel = find(source, $lastDroppable
							.parent().attr('id'));
						dpd.price.get(dragObjectModel.id, function(price,error) {
							if (price) {
								price.parent = lastDroppableModel.id;
								dpd.price.put(price, function(price, error) {
									if (price) {
										dpd.pricetree.get({
											'cafe' : app.getWsModel().get().cafe
										}, function(pricetree,error) {
											if (pricetree) {
												function getItem(source, id) {
													for (var key in source) {
														if (source[key].id === id) {
															return source[key];
														} else {
															var item = getItem(source[key].children, id);
															if (item != null) {
																return item;
															}
														}
													}
													return null;
												}
												var oldParent = getItem(pricetree[0].tree, dragObjectModel.parent);
												for (var i in oldParent.order) {
													if (oldParent.order[i] == price.id) {
														oldParent.order.splice(i, 1);
													}
												}
												var newParent = getItem(pricetree[0].tree, price.parent);
												newParent.order.unshift(price.id);
												dpd.pricetree.put(pricetree[0], function(pricetree, error) {
													if (pricetree) {
														reload();
													} 
												});
											}
										});
									}
								});
							}
						});
					}
				}
			}
		});
		
		return $level;
	}
	
	function createTree(item, $content, level) {
		for (var key in item) {
			if (key === 'order') {
				for (var i in item.order) {
					var $level = addPrice($content, item[item.order[i]]);
					$level.data('level', level + 1);
				}
			}
			if (key === 'children') {
				for (var i in item.children) {
					var $level = addPrice($content, item[item.children[i].id]);
					$level.data('level', level + 1);
					createTree(item[item.children[i].id], $level, level + 1);
				}
			}
			if (key.indexOf('-') > 0 && level === 0) {
				var $level = addPrice($content, item[key]);
		 		$level.data('level', level + 1);
		 		createTree(item[key], $level, level + 1);
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
		if (selectedItem) {
			app.setBodyActive(false);
			app.showLoading(true);
			if (typeof selectedItem.media === 'undefined') {
				dpd.pricetree.get({
					'cafe' : app.getWsModel().get().cafe
				}, function(pricetree, error) {
					if (error) {
						Logger().error('Can not remove category');
					} else {
						var tree = pricetree[0].tree;
						function removeCategory(source, id) {
							for (var key in source) {
								if (source[key].id == id) {
									return source.splice(key, 1);
								} else {
									removeCategory(source[key].children, id);
								}
							}
							return false;
						}
						removeCategory(tree, selectedItem.id);
						dpd.pricetree.put(pricetree[0], function(pricetree, error) {
							if (error) {
								Logger().error('Can not remove category');
							} else {
								reload();
							}
						});
					}
				});
			} else {
				app.setBodyActive(false);
				app.showLoading(true);
				dpd.price.del({
					'id' : selectedItem.id
				}, function(price, error) {
					dpd.pricetree.get(function(pricetree, error) {
						if (pricetree) {
							function getItem(source, id) {
								for (var key in source) {
									if (source[key].id === id) {
										return source[key];
									} else {
										var item = getItem(source[key].children, id);
										if (item != null) {
											return item;
										}
									}
								}
								return null;
							}
							var category = getItem(pricetree[0].tree, price.parent);
							for (var key in category.children) {
								if (category.children[key] === price.id) {
									category.children.splice(key, 1);
								}
							}
							dpd.pricetree.put(pricetree[0], function(pricetree, error) {
								if (!error) {
									reload();
								}
							});
						}
					});
				});
			}
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
