var Logger = function(duration) {
	var self = this;
	if (typeof duration === 'undefined') {
		duration = 'normal';
	}
	var $container = $('#notification');
	if ($container.length === 0) {
		$container = $('<div id="notification" class="notification"/>')
			.appendTo($(document.body));
	}
	var classes = 'notification-info notification-warn notification-error';
	function notify(level, message) {
		$('.notification-message').remove();
		var $view = $('<div class="notification-message notification-message-'
			+ level + '">' + message + '</div>').appendTo($container);
		$view.on('click', function() {
			$(this).remove();
		});
		$view.show();
		setTimeout(function() {
			$view.slideUp(duration, function() {
				$(this).remove();
			});
		}, 10000 / 3);
	}
	return {
		info : function(message) {
			notify('info', message);
			console.info(message);
		},
		warn : function(message) {
			notify('warn', message);
			console.warn(message);
		},
		error : function(message) {
			notify('error', message);
			console.error(message);
		},
		fatal : function(message) {
			notify('error', message);
			console.error(message);
			throw message;
		}
	};
};
jQuery(document).ready(function($) {
	app = (function(){
		var previewMode = false;
		var user = null;
		var cafe = null;
		var wsModel = null;
		var wsController = null;
		var wsTemplateController = null;
		var wsPreviewController = null;
		var themeManager = null;
		var navigationManager = null;
		var propertyBrowser = null;
		var sessionManager = null;
		var priceManager = null;
		var wsControllerProperties = {};
		var wsTemplateControllerProperties = {};
		
		var $bodyInactiveLayer = $('<div class="body-inactive-layer"/>');
		function setBodyActive(isActive) {
			if (!isActive) {
				if ($bodyInactiveLayer.parent().length !== 0) {
					return
				}
				$bodyInactiveLayer.appendTo($(document.body));
			} else {
				if ($bodyInactiveLayer.parent().length === 0) {
					return;
				}
				$bodyInactiveLayer.detach();
			}
		}
		
		var $loading = $('<img src="public/images/loading.png" class="loading"/>');
		function showLoading(isLoading) {
			if (isLoading) {
				if ($loading.parent().length !== 0) {
					return
				}
				$loading.appendTo($(document.body));
				$loading.css({
					'position' : 'absolute',
					'left' : '50%',
					'top' : '50%',
					'margin-left' : - $loading.width() / 2,
					'margin-top' : - $loading.height() / 2,
				});
			} else {
				if ($loading.parent().length === 0) {
					return;
				}
				$loading.detach();
			}
		}
		
		function setPreviewMode(isPreviewMode) {
			previewMode = isPreviewMode;
			var $panelEast = $('#panel-east');
			var $themeTab = $panelEast.children(
					'.pd-accordion-header:contains("Theme")');
			if (previewMode) {
				if (wsTemplateController.isFocused()) {
					wsTemplateController.close();
				}
				wsPreviewController.render();
				wsPreviewController.focus();
				$panelEast.pdAccordion('hide', 'Items')
					.pdAccordion('hide', 'Properties')
					.pdAccordion('hide', 'Pages');
				
				var height = $panelEast.height();
				height -= $themeTab.outerHeight();
				if (height < 282) {
					height = 282;
				}
				$themeTab.next().css({
					'height' : height
				});
			} else {
				wsController.focus();
				$panelEast.pdAccordion('show', 'Items')
					.pdAccordion('show', 'Properties')
					.pdAccordion('show', 'Pages');
				$themeTab.next().css({
					'height' : ''
				});
			}
			themeManager.setPreviewMode(previewMode);
			wsController.setScale(Math.min(wsController.getView().getWidth() / 
				(wsModel.getWidth() + 20),
				wsController.getView().getHeight() / (wsModel.getHeight() + 20)));
			wsPreviewController.setScale(Math.min(wsPreviewController.getView()
				.getWidth() / (wsModel.getWidth() + 20),
				wsPreviewController.getView().getHeight() / (wsModel.getHeight()
				 + 20)));
		}
		
		
		function loadPrice(onLoad) {
			Logger().info('Loading price...');
			dpd.pricetree.get({
				'cafe' : wsModel.get().cafe,
				'object' : '1'
			},
			function(pricetree, error) {
				if (error) {
					Logger().fatal('Failed to load price. '
						+ 'Cause:\n' + error.message);
				}
				if (!pricetree[0].object) {
					Logger().fatal('Failed to load price. Cause:\n'
						+ 'Price is empty');
				}
				priceManager = new PriceManager($('#price'),
					pricetree[0].object);
				var itemUpdateEventListener = {
					onItemUpdate : function(item) {
						wsPreviewController.generate(priceManager.get());
						wsPreviewController.render();
					}
				};
				var itemRemoveEventListener = {
					onItemRemove : function(item) {
						//TODO remove item
					}
				}
				priceManager.addItemUpdateEventListener(itemUpdateEventListener);
				priceManager.addItemRemoveEventListener(itemRemoveEventListener);
				Logger().info('Price loaded.');
				onLoad();
			});
		}
		
		function loadThemes(onLoad) {
			Logger().info('Loading themes...');
			dpd.theme.get({
					width: wsModel.getWidth(), height: wsModel.getHeight()
				}, function(themes, error) {
				if (error) {
					Logger().fatal('Failed to load themes. Cause:\n'
						+ error.message);
				}
				if (themes.length === 0) {
					Logger().fatal('Failed to load themes. Cause:\n Not found');
				}
				themeManager = new ThemeManager($('#theme'), themes);
				Logger().info('Themes loaded.');
				loadPrice(onLoad);
			});
		}
		
		function loadCafe(onLoad) {
			dpd.cafe.get(wsModel.get().cafe, function(c, error) {
				cafe = c;
				loadThemes(onLoad);
			});
		} 
		
		function loadMenu(onLoad) {
			dpd.users.me(function(u) {
				user = u;
			});
			previewMode = window.location.search === '?preview';
			var menuId = window.location.hash.substr(1,
				window.location.hash.length - 1);
			if (!menuId) {
				Logger().fatal('Failed to load menu. Cause:\n'
					+ 'The id of menu must be provided as a hash part of URL');
			}
			Logger().info('Trying to restore previous session...');
			var menu = sessionManager.restore(0);
			if (menu && menu.id === menuId) {
				wsModel = new WsModel(menu);
				Logger().info('Previous session restored.');
				loadCafe(onLoad);
			} else {
				Logger().warn('Previous session not found.');
				Logger().info('Loading menu...');
				dpd.menu.get(menuId, function(menu, error) {
					if (error) {
						Logger().fatal('Failed to load menu. '
							+ 'Cause:\n' + error.message);
					}
					delete menu.details;
					delete menu.runningTitles;
					wsModel = new WsModel(menu);
					Logger().info('Menu loaded.');
					loadCafe(onLoad);
				});
			}
		}
		
		function createDetails() {
			Logger().info('Creating details...');
			var detailTemplate = themeManager.getTemplate('detail');
			if (!detailTemplate) {
				return;
			}
			var price = priceManager.get();
			var menu = wsModel.get();
			menu.details = {};
			function iteratePrice(destination, source) {
				for (var key in source) {
					if (key === 'category') {
						continue;
					}
					if (typeof source[key] === 'object') {
						if (typeof source[key].media === 'undefined') {
							iteratePrice(destination, source[key]);
						} else {
							var model = {
								config : {
									template : 'detail',
									price : key
								}
							};
							var wsItemFactory = WsItemFactory.forType('template');
							var view = wsItemFactory.createView(model);
							wsItemFactory.render(view);
							destination[key] = model;
						}
					}
				}
			}
			iteratePrice(menu.details, price);
			Logger().info('Details created.');
		}
		
		function createRunningTitles() {
			Logger().info('Creating running titles...');
			var menu = wsModel.get();
			menu.runningTitles = [];
			for (var p = 0; p < menu.pages.length; p++) {
				if (menu.pages[p].length === 0
					|| menu.pages[p][0].y !== 0) {
					var headerItem = {
						p : p,
						x : 0,
						y : 0,
						config : {
							template : 'header'
						}
					};
					var wsItemFactory = WsItemFactory.forType('template');
					var headerItemView = wsItemFactory.createView(headerItem);
					wsItemFactory.render(headerItemView);
					var footerItem = {
						p : p,
						x : 0,
						y : 0,
						config : {
							template : 'footer'
						}
					};
					var footerItemView = wsItemFactory.createView(footerItem);
					footerItemView.setY(menu.height - footerItem.h);
					footerItem.y = menu.height - footerItem.h;
					wsItemFactory.render(footerItemView);
					menu.runningTitles.push({
						header : headerItem,
						footer : footerItem
					});
				} else {
					menu.runningTitles.push(null);
				}
			}
			Logger().info('Running titles created.');
		}
		
		function setMenuPadding() {
			var padding = {};
			var header = themeManager.getTemplate('header');
			if (typeof header === 'object') {
				padding.top = header.height;
			}
			var footer = themeManager.getTemplate('footer');
			if (typeof footer === 'object') {
				padding.bottom = footer.height;
			}
			wsModel.setPadding(padding);
		}
		
		// TODO add timeout
		function saveTheme() {
			Logger().info('Save theme...');
			dpd.theme.put(themeManager.getTheme(), function(theme, error) {
				if (error) {
					Logger().error('Failed to save theme. Cause:\n'
						+ error.message);
				} else {
					Logger().info('Theme saved.');
				}
			});
		}
		
		function setWsControllerPropertyValues() {
			PropertiesBuilder(wsControllerProperties)
				.setPropertyValues({
					themeName : themeManager.getTheme().name,
					themeDescription : themeManager.getTheme().description,
					width : themeManager.getTheme().width,
					height : themeManager.getTheme().height,
					bgColor : themeManager.getTheme().bgColor,
					bgImage : themeManager.getTheme().bgImage,
					opacity : themeManager.getTheme().opacity,
				});
		}
		
		function setWsTemplateControllerPropertyValues(template) {
			PropertiesBuilder(wsTemplateControllerProperties)
				.setPropertyValues({
					name : template.name,
					width : template.width,
					height : template.height,
					bgColor : template.bgColor,
				});
		}
		
		var $notificationLoading = null;
		function init() {
			// Init WsController.
			wsController = new WsController($('#ws'), wsModel,
				themeManager.getTheme());
			wsController.addPagesChangeEventListener(navigationManager);
			
			var currentPropertyBrowserItem = null;
			
			function onWsControllerPropertyChange(update) {
				if (update.bgColor) {
					themeManager.getTheme().bgColor = update.bgColor;
					wsController.setBgColor(update.bgColor);
				} else if (update.bgImage) {
					themeManager.getTheme().bgImage = update.bgImage;
					wsController.setBgImage(update.bgImage);
				} else if (update.opacity) {
					themeManager.getTheme().opacity = update.opacity;
					wsController.setOpacity(update.opacity);
				}
				saveTheme();
				setWsControllerPropertyValues();
			}
			PropertiesBuilder(wsControllerProperties)
				.addStringProperty('themeName', 'Theme')
				.addStringProperty('themeDescription', 'Description')
				.addNumberProperty('width', 'Width')
				.addNumberProperty('height', 'Height')
				.addColorProperty('bgColor', 'Bg Color',
					onWsControllerPropertyChange)
				.addImageProperty('bgImage', 'Bg Image',
					onWsControllerPropertyChange)
				.addNumberProperty('opacity', 'Opacity',
					onWsControllerPropertyChange, 0, 1, 0.1);
			setWsControllerPropertyValues();
			
			var wsControllerEventListener = {
				onSelect : function(selectedItem) {
					var properties = null;
					if (selectedItem) {
						var wsItemFactory = WsItemFactory
							.forType(selectedItem.type);
						if (currentPropertyBrowserItem === selectedItem) {
							properties = propertyBrowser.get();
						} else {
							properties = wsItemFactory.createProperties(
								wsController.updateSelectedItem);
							delete properties.x;
							delete properties.y;
							delete properties.zIndex;
						}
						PropertiesBuilder(properties)
							.setPropertyValues(selectedItem);
					} else {
						properties = wsControllerProperties;
					}
					propertyBrowser.set(properties);
					currentPropertyBrowserItem = selectedItem;
					if (selectedItem && selectedItem.type === 'template') {
						var template = themeManager.getTemplate(
							selectedItem.config.template);
						if (template) {
							themeManager.selectTemplate(template);
						}
					} else {
						themeManager.selectTemplate();
					}
				}
			};
			wsController.addSelectEventListener(
				wsControllerEventListener);
				
			// Init WsPreviewController.
			wsPreviewController =
				new WsPreviewController($('#ws-preview'), wsModel);
			wsPreviewController.addPagesChangeEventListener(navigationManager);
			
			// Init NavigationManager.
			navigationManager.addPageSelectEventListener(wsController);
			navigationManager.addPageSelectEventListener(wsPreviewController);
			
			propertyBrowser.set(wsControllerProperties);
			
			var currentController = previewMode ? wsPreviewController
				: wsController;
			currentController.focus();
			
			var menuStoreEventTimerId = 0;
			var priceSaveEventTimerId = 0;
			var $window = $(window);
			$window.on('message', function(e) {
				//console.log('message', e);
				if (e.id === 'ispreviewmode') {
					e.previewMode = previewMode;
					return;
				}
				if (e.id === 'store') {
					//sessionManager.store(e.ns, e.state);
					if (e.ns === 'wscontroller') {
						// Init WsModel.
						clearTimeout(menuStoreEventTimerId);
						menuStoreEventTimerId = setTimeout(function() {
							createRunningTitles();
							Logger().info('Save menu...');
							dpd.menu.put(e.state, function(menu, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'save menu. Cause:\n'
										+ error.message);
								} else {
									Logger().info('Menu saved.');
								}
							});
						}, 2000);
					}
					return;
				}
				if (e.id === 'restore') {
					e.state = sessionManager.restore(e.ns, e.index);
					return;
				}
				if (e.id === 'opentemplate') {
					var template = themeManager.getTemplate(e.template);
					wsTemplateController.open(template);
					wsTemplateController.focus();
					setWsTemplateControllerPropertyValues(template);
					return;
				}
				if (e.id === 'gettemplate') {
					e.template = themeManager.getTemplate(e.template);
					return;
				}
				if (e.id === 'gettemplates') {
					e.templates = themeManager.getTemplates();
					return;
				}
				if (e.id === 'getprice') {
					e.price = priceManager.get(e.price);
					return;
				}
				if (e.id === 'saveprice') {
					clearTimeout(priceSaveEventTimerId);
					priceSaveEventTimerId = setTimeout(function() {
						Logger().info('Save price...');
						dpd.price.put(e.price, function(price, error) {
							if (error) {
								Logger().error('Failed to '
									+ 'save price. Cause:\n'
									+ error.message);
							} else {
								Logger().info('Price saved.');
							}
						});
					}, 2000);
				}
				if (e.id === 'getpageitems') {
					if (typeof e.page === 'number'
						&& e.page > 0 && e.page < wsModel.get().pages.length) {
						e.page = wsModel.get(e.page);
					} else {
						e.page = [];
					}
					return;
				}
				if (e.id === 'getcafe') {
					e.cafe = cafe;
					return;
				}
			});
			setTimeout(function() {
				$notificationLoading.remove();
			}, 1000);
			
			$('#ws-toolbar').pdToolbar('selectOption',
				previewMode ? 'previewMode' : 'editorMode');
		}
		
		(function load() {
			$notificationLoading = $('<div id="notification" class="notification notification-loading"/>')
				.appendTo($(document.body));
			sessionManager = new SessionManager();
			loadMenu(function() {
				navigationManager = new NavigationManager($('#navigation'));
				propertyBrowser = new PropertyBrowser($('#properties'));
				
				// Init ThemeManagerEventListener.
				var themeManagerEventListener = {
					onTemplateCreate : function(template) {
						wsTemplateController.open(template);
						wsTemplateController.focus();
						setWsTemplateControllerPropertyValues(template);
					},
					onTemplateRemove : function(template) {
						Logger().info('Remove template...');
						wsTemplateController.close(withoutSave = true);
						wsTemplateController.blur(true);
						if (template.id) {
							dpd.template.del(template.id, function(tpl, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'remove template. Cause:\n'
										+ error.message);
								} else {
									Logger().info('Template removed.');
								}
							});
						} else {
							Logger().info('Template removed.');
						}
					},
					onTemplateSelect : function(template) {
						if (wsTemplateController.isFocused()) {
							if (template) {
								if (template
									!== wsTemplateController.getModel()) {
									wsTemplateController.open(template);
									wsTemplateController.updateViewGeometry();
									setWsTemplateControllerPropertyValues(template);
								}
							} else {
								wsTemplateController.close();
								wsTemplateController.blur(true);
							}
						} else {
							var selectedItem = wsController.getSelectedItem();
							if (template && selectedItem && selectedItem.type === 'template'
								&& selectedItem.config.template !== template.name) {
								wsController.updateSelectedItem({
									config : {
										template : template.name
									}
								});
							}
						}
					},
					onTemplateDblClick : function(template) {
						if (!wsTemplateController.isFocused() && template) {
							wsTemplateController.open(template);
							wsTemplateController.focus();
							setWsTemplateControllerPropertyValues(template);
						}
					},
					onThemeChange : function(theme) {
						Logger().info('Loading theme templates...');
						if (wsController !== null) {
							setBodyActive(false);
							showLoading(true);
						}
							
						dpd.template.get({
							'owner' : theme.id
						}, function(templates, error) {
							if (error) {
								Logger().fatal('Failed to load theme '
									+ 'templates. Cause:\n' + error.message);
							}
							if (wsController === null) {
								init();
								themeManager.setTemplates(templates, function() {
									if (previewMode) {
										wsPreviewController.generate(priceManager.get());
									}
								});
							} else {
								themeManager.setTemplates(templates);
							}
							
							$(window).triggerHandler($.Event('message', {
								id : 'store',
								ns : 'wscontroller',
								state : wsModel.get()
							}));
							Logger().info('Theme templates loaded.');
						});
					},
					onChange : function(theme, templates, onLoad) {
						wsController.setBgColor(themeManager.getTheme().bgColor);
						wsController.setBgImage(themeManager.getTheme().bgImage);
						wsPreviewController.setBgColor(themeManager.getTheme().bgColor);
						wsPreviewController.setBgImage(themeManager.getTheme().bgImage);
						setWsControllerPropertyValues();
						wsModel.get().theme = themeManager.getTheme().id;
						setMenuPadding();
						if (onLoad) {
							onLoad();
						}
						
						var items = [];
						for (var p = 0; p < wsModel.get().pages.length; p++) {
							items = items.concat(wsModel.get(p));
						}
						wsController.updateItems(items, {}, function() {
							navigationManager.setPage(0);
							setBodyActive(true);
							showLoading(false);
						});
						
						if (themeManager.getTemplate('detail')) {
							createDetails();
						}
					}
				};
				themeManager.addTemplateCreateEventListener(
					themeManagerEventListener);
				themeManager.addTemplateRemoveEventListener(
					themeManagerEventListener);
				themeManager.addTemplateSelectEventListener(
					themeManagerEventListener);
				themeManager.addTemplateDblClickEventListener(
					themeManagerEventListener);
				themeManager.addThemeChangeEventListener(
					themeManagerEventListener);
				themeManager.addChangeEventListener(
					themeManagerEventListener);
				if (themeManager.getTheme(wsModel.get().theme) === null) {
					themeManager.setTheme(themeManager.getThemes()[0].id);
				} else {
					themeManager.setTheme(wsModel.get().theme);
				}
				
				// Init WsTemplateController.
				wsTemplateController = new WsTemplateController(
					$('#ws-template'));
				function onWsTemplateControllerPropertyChange(update) {
					if (update.name) {
						themeManager.setTemplateName(
							wsTemplateController.getModel(), update.name);
					} else if (update.width) {
						wsTemplateController.getModel().width = update.width;
						wsTemplateController.setPageSize({
							width : update.width,
							height : wsTemplateController.getPageView()
								.getHeight()
						});
						wsTemplateController.updateViewGeometry();
					} else if (update.height) {
						wsTemplateController.getModel().height = update.height;
						wsTemplateController.setPageSize({
							width : wsTemplateController.getPageView()
								.getWidth(),
							height : update.height
						});
						wsTemplateController.updateViewGeometry();
					} else if (update.bgColor) {
						wsTemplateController.getModel().bgColor =
							update.bgColor;
						wsTemplateController.setBgColor(update.bgColor);
					}
					setWsTemplateControllerPropertyValues(wsTemplateController.getModel());
				}
				PropertiesBuilder(wsTemplateControllerProperties)
					.addStringProperty('name', 'Name',
						onWsTemplateControllerPropertyChange)
					.addNumberProperty('width', 'Width',
						onWsTemplateControllerPropertyChange)
					.addNumberProperty('height', 'Height',
						onWsTemplateControllerPropertyChange)
					.addColorProperty('bgColor', 'Bg Color',
						onWsTemplateControllerPropertyChange);
				var wsTemplateControllerEventListener = {
					onChange : function(template) {
						Logger().info('Save template...');
						if (template.id) {
							dpd.template.put(template, function(tpl, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'save template. Cause:\n'
										+ error.message);
								} else {
									template.id = tpl.id;
									Logger().info('Template saved.');
								}
							});
						} else {
							dpd.template.post(template, function(tpl, error) {
								if (error) {
									Logger().error('Failed to '
										+ 'save template. Cause:\n'
										+ error.message);
								} else {
									template.id = tpl.id;
									Logger().info('Template saved.');
								}
							});
						}
						if (template.name === 'detail') {
							createDetails();
						}
						if (template.name === 'header'
							|| template.name === 'footer') {
							setMenuPadding();
							wsModel.update();
							wsController.selectItem(wsController.getSelectedItem());
							wsController.updateRunningTitles();
							$(window).triggerHandler($.Event('message', {
								id : 'store',
								ns : 'wscontroller',
								state : wsModel.get()
							}));
						} else {
							wsController.updateItems(wsModel.find({
								type : 'template',
								config : {
									template : template.name
								}
							}), {});
						}
					},
					onSelect : function(selectedItem) {
						var properties = null;
						if (selectedItem) {
							var wsItemFactory = WsItemFactory
								.forType(selectedItem.type);
							if (currentPropertyBrowserItem === selectedItem) {
								properties = propertyBrowser.get();
							} else {
								properties = wsItemFactory.createProperties(
									wsTemplateController.updateSelectedItem);
								delete properties.p;
								delete properties.i;
							}
							PropertiesBuilder(properties)
								.setPropertyValues(selectedItem);
						} else {
							properties = wsTemplateControllerProperties;
						}
						propertyBrowser.set(properties);
						currentPropertyBrowserItem = selectedItem;
					}
				};
				wsTemplateController.addChangeEventListener(
					wsTemplateControllerEventListener);
				wsTemplateController.addSelectEventListener(
					wsTemplateControllerEventListener);
				
				$('#panel-west').pdAccordion({
					mode : 'multi'
				});
				$('#ws-toolbar>div').pdToolbar({
					source : [{
						'name' : 'zoomin',
						'type' : 'text',
						'value' : '+',
						'click' : function() {
							if (wsController.isFocused()) {
								wsController.setScale(wsController.getScale() + 0.1);
							} else if (wsTemplateController.isFocused()) {
								wsTemplateController.setScale(wsTemplateController.getScale() + 0.1);
							}
						}
					}, {
						'name' : 'zoomout',
						'type' : 'text',
						'value' : '-',
						'click' : function() {
							if (wsController.isFocused()) {
								if (wsController.getScale() > 0.2) {
									wsController.setScale(wsController.getScale() - 0.1);
								}
							} else if (wsTemplateController.isFocused()) {
								if (wsTemplateController.getScale() > 0.2) {
									wsTemplateController.setScale(wsTemplateController.getScale() - 0.1);
								}
							}
						}
					}, {
						'name' : 'zoom1',
						'type' : 'text',
						'value' : '1',
						'click' : function() {
							if (wsController.isFocused()) {
								wsController.setScale(1);
							} else if (wsTemplateController.isFocused()) {
								wsTemplateController.setScale(1);
							}
						}
					}, {
						'name' : 'zoomauto',
						'type' : 'text',
						'value' : '| - |',
						'click' : function() {
							if (wsController.isFocused()) {
								wsController.setScale(Math.min(wsController.getView().getWidth() / (wsModel.getWidth() + 20),
									wsController.getView().getHeight() / (wsModel.getHeight() + 20)));
							} else if (wsTemplateController.isFocused()) {
								wsTemplateController.setScale(Math.min(wsTemplateController.getView().getWidth() / (wsTemplateController.getModel().width + 20),
									wsTemplateController.getView().getHeight() / (wsTemplateController.getModel().height + 20)));
							}
						}
					}, {
						'type' : 'separator'
					}, {
						'name' : 'previewMode',
						'type' : 'class',
						'value' : 'icon-icomoon-play3',
						'mode' : 'option',
						'click' : function() {
							setPreviewMode(true);
						}
					}, {
						'name' : 'editorMode',
						'type' : 'class',
						'value' : 'icon-icomoon-pencil2',
						'mode' : 'option',
						'click' : function() {
							setPreviewMode(false);
						}
					}]
				});
				
				$('#ws-items').pdToolbar({
					source : [{
						'name' : 'text',
						'type' : 'class',
						'value' : 'icon-icomoon-language',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'text'
									}
								});
							}
						}
					}, {
						'name' : 'image',
						'type' : 'class',
						'value' : 'icon-icomoon-image2',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'image'
									}
								});
							}
						}
					}, {
						'name' : 'video',
						'type' : 'class',
						'value' : 'icon-icomoon-video',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'video'
									}
								});
							}
						}
					}, {
						'type' : 'separator'
					}, {
						'name' : 'ls',
						'type' : 'text',
						'value' : 'LS',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'ls'
									}
								});
							}
						}
					}, {
						'name' : 'ps',
						'type' : 'text',
						'value' : 'PS',
						'draggable' : {
							dragObject : function() {
								return $('<div/>').pdWsItem({
									model : {
										type : 'ps'
									}
								});
							}
						}
					}]
				});
				
				var $toolbar = $('#panel-east').pdAccordion({
					mode : 'multi',
					collapsible : true
				});
			});
		})();
		
		return {
			getUser : function() {
				return user;
			},
			getWsModel : function() {
				return wsModel;
			},
			getWsController : function() {
				return wsController;
			},
			getWsPreviewController : function() {
				return wsPreviewController;
			},
			getThemeManager : function() {
				return themeManager;
			},
			getNavigationManager : function() {
				return navigationManager;
			},
			getPriceManager : function() {
				return priceManager;
			},
			setBodyActive : setBodyActive
		};
	})();
});
