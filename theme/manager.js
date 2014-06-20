var ThemeManager = function($container, themes) {
	var self = this;
	var theme = null;
	var templates = [];
	var templateMap = {};
	var $selectedTemplate = null;
	
	$container.addClass('pd-theme-manager');
	var $themeSelect = $('<select class="pd-theme-select">');
	$container.append($themeSelect);
	for (var i in themes) {
		$themeSelect.append(new Option(
			themes[i].name + ' (' + themes[i].description + ')', themes[i].id));
	}
	$themeSelect.on('change', function(e) {
		self.setTheme($(e.target).children('option:selected').val());
	});
	$container.append($('<hr/>'));
	// Theme Scroll
	var $themeScroll = $('<div class="pd-theme-scroll">');
	var $themeScrollContent = $('<div class="pd-theme-scroll-content">');
	var scrollValue = 0;
	var $buttonDown = $('<div class="pd-theme-scroll-button' +
		' icon-icomoon-arrow-down5"/>').css({
		'position' : 'absolute',
		'left' : 0,
		'bottom' : 0
	});
	$buttonDown.click(function() {
		scrollValue = scrollValue + 50;
		if (scrollValue > parseFloat($themeScrollContent.prop('scrollHeight')) - 
				$themeScrollContent.height()) {
			scrollValue = parseFloat($themeScrollContent.prop('scrollHeight')) - 
				$themeScrollContent.height();
		}
		$themeScrollContent.scrollTop(scrollValue);
	});
	var $buttonUp = $('<div class="pd-theme-scroll-button' +
		' icon-icomoon-arrow-up4"/>').css({
		'position' : 'absolute',
		'left' : 0,
		'top' : 0
	});
	$buttonUp.click(function() {
		scrollValue = scrollValue - 50;
		if (scrollValue < 0) {
			scrollValue = 0;
		}
		$themeScrollContent.scrollTop(scrollValue);
	});
	$themeScrollContent.on('mousewheel', function(event) {
		if ($themeScroll.is(':hover')) {
			if (event.originalEvent.wheelDelta >= 0) {
				$buttonUp.click();
			} else {
				$buttonDown.click();
			}
			if (scrollValue !== 0 && scrollValue !== parseFloat($themeScrollContent
					.prop('scrollHeight')) - $themeScrollContent.height()) {
				return false;
			}
			return true;
		}
	});
	$container.append($themeScroll.append($themeScrollContent));
	for (var i in themes) {
		var $themeScrollItem = $('<div class="pd-theme-scroll-item">' +
			'<img src="' + themes[i].img + '"><div>'
			+ themes[i].name + '</div></div>');
		$themeScrollItem.attr('data-themeId', themes[i].id);
		$themeScrollItem.on('click', function(e) {
			self.setTheme($(this).attr('data-themeId'));
		});
		$themeScrollContent.append($themeScrollItem);
	}
	$container.append($buttonDown);
	$container.append($buttonUp);
	var themeScrollElements = [$themeScroll, $buttonDown, $buttonUp];
	// Templates
	$container.append($('<div>Templates</div>'));
	var $templateContainer = $('<div class="pd-template-container"/>');
	$container.append($templateContainer);
	var $templateToolbar = $('<div/>').pdToolbar({
		source : [{
			'name' : 'add',
			'type' : 'class',
			'value' : 'icon-icomoon-plus3',
			'click' : function() {
				var templateName = 'A';
				var templateNameCharCode = 65;
				while(self.getTemplate(templateName)) {
					templateName = String.fromCharCode(++templateNameCharCode);
				}
				var template = {
					name : templateName,
					owner : theme.id,
					width : theme.width,
					height : theme.height,
					bgColor : 'transparent',
					items : []
				};
				self.addTemplate(template);
				self.selectTemplate(template);
			}
		}, {
			'name' : 'remove',
			'type' : 'class',
			'value' : 'icon-icomoon-remove2',
			'click' : function() {
				var template = self.getSelectedTemplate();
				if (!template) {
					return;
				}
				self.removeTemplate(template);
			}
		}]
	});
	$container.append($templateToolbar);

    var templateCreateEventListeners = [];
    function fireTemplateCreateEvent(template) {
		for (var i in templateCreateEventListeners) {
			templateCreateEventListeners[i].onTemplateCreate(template);
		}
    };
    var templateRemoveEventListeners = [];
    function fireTemplateRemoveEvent(template) {
		for (var i in templateRemoveEventListeners) {
			templateRemoveEventListeners[i].onTemplateRemove(template);
		}
    };
	var templateSelectEventListeners = [];
    function fireTemplateSelectEvent(selected) {
		for (var i in templateSelectEventListeners) {
			templateSelectEventListeners[i].onTemplateSelect(selected);
		}
    };
    var templateDblClickEventListeners = [];
    function fireTemplateDblClickEvent(template) {
		for (var i in templateDblClickEventListeners) {
			templateDblClickEventListeners[i].onTemplateDblClick(template);
		}
    };
	var themeChangeEventListeners = [];
    function fireThemeChangeEvent() {
		for (var i in themeChangeEventListeners) {
			themeChangeEventListeners[i].onThemeChange(theme);
		}
    }
    var changeEventListeners = [];
    function fireChangeEvent(onLoad) {
		for (var i in changeEventListeners) {
			changeEventListeners[i].onChange(theme, templates, onLoad);
		}
    }
    
	$templateContainer.on('click', function() {
		self.selectTemplate();
	}).on('dblclick', function(e) {
		fireTemplateDblClickEvent();
	});
	
	function createTemplateView(template) {
		return $('<div class="pd-template"/>')
			.data('template', template).on('click', function(e) {
				var $target = $(e.target);
				var template = $target.data('template');
				if (!template) {
					template = $target.parent().data('template');
				}
				self.selectTemplate(template);
				e.stopPropagation();
				return false;
			}).on('dblclick', function(e) {
				var $target = $(e.target);
				var template = $target.data('template');
				if (!template) {
					template = $target.parent().data('template');
				}
				fireTemplateDblClickEvent(template);
				e.stopPropagation();
				return false;
			}).pdDraggable({
				dragObject : function() {
					return $('<div/>').pdWsItem({
						model : {
							type : 'template',
							config : {
								template : template.name
							}
						}
					});
				}
			}).text(template.name);
	}
	
	this.setTheme = function(id) {
		var newTheme = Object.findById(themes, id);
		if (!newTheme) {
			Logger().fatal('pd.themeManager: Failed to set theme.'
				+ 'Cause:\nTheme with id "' + id + '" not found');
		}
		theme = newTheme;
		$themeSelect.children('option[value="' + theme.id + '"]')
			.attr("selected", "selected");
		$themeScrollContent.find('.pd-theme-scroll-item-active')
			.removeClass('pd-theme-scroll-item-active');
		$themeScrollContent.children('[data-themeId="' + theme.id + '"]')
			.addClass('pd-theme-scroll-item-active');
		fireThemeChangeEvent();
	};
	this.getTheme = function(id) {
		if (typeof id === 'undefined') {
			return theme;
		}
		return Object.findById(themes, id);
	};
	this.getThemes = function(id) {
		return themes;
	};
	
	this.selectTemplate = function(template) {
		if ($selectedTemplate) {
			$selectedTemplate.removeClass('pd-template-selected');
			$selectedTemplate = null;
		}
		if (template) {
			var $template = $templateContainer.children().filter(
				function(i, element) {
					return $(element).data('template') === template;
				}
			);
			if ($template.length === 0) {
				return;
			}
			$template.addClass('pd-template-selected');
			$selectedTemplate = $template;
		}
		fireTemplateSelectEvent(template);
	};
	this.getSelectedTemplate = function() {
		return $selectedTemplate.data('template');
	};
	this.getTemplate = function(name) {
		return templateMap[name];
	};
	this.addTemplate = function(template) {
		var $template = createTemplateView(template)
			.appendTo($templateContainer);		
		templates.push(template);
		templateMap[template.name] = template;
		if (!template.id) {
			fireTemplateCreateEvent(template);
		}
		return $template;
	};
	this.removeTemplate = function(template) {
		var index = templates.indexOf(template);
		if (index == -1) {
			return;
		}
		templates.splice(index, 1);
		delete templateMap[template.name];
		var $template = $templateContainer.children().filter(
			function(i, element) {
				return $(element).data('template') === template;
			});
		$template.remove();
		fireTemplateRemoveEvent(template);
	};
	this.setTemplateName = function(template, name) {
		if (typeof templateMap[template.name] === 'undefined'
			|| templateMap[template.name] !== template) {
			return;
		}
		delete templateMap[template.name];
		template.name = name;
		templateMap[template.name] = template;
		if (template === self.getSelectedTemplate()) {
			$selectedTemplate.text(template.name);
		}
	};
	
	this.setTemplates = function(templates, onLoad) {
		$templateContainer.empty();
		for (var i = 0; i < templates.length; i++) {
			this.addTemplate(templates[i]);
		}
		fireChangeEvent(onLoad);
	};
	this.getTemplates = function() {
		return templates;
	};

	self.addTemplateCreateEventListener = function(listener) {
		templateCreateEventListeners.push(listener);
	};
	self.removeTemplateCreateEventListener = function(listener) {
		var index = templateCreateEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateCreateEventListeners.splice(index, 1);
	};
	self.addTemplateRemoveEventListener = function(listener) {
		templateRemoveEventListeners.push(listener);
	};
	self.removeTemplateRemoveEventListener = function(listener) {
		var index = templateRemoveEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateRemoveEventListeners.splice(index, 1);
	};
	self.addTemplateSelectEventListener = function(listener) {
		templateSelectEventListeners.push(listener);
	};
	self.removeTemplateSelectEventListener = function(listener) {
		var index = templateSelectEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateSelectEventListeners.splice(index, 1);
	};
	self.addTemplateDblClickEventListener = function(listener) {
		templateDblClickEventListeners.push(listener);
	};
	self.removeTemplateDblClickEventListener = function(listener) {
		var index = templateDblClickEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		templateDblClickEventListeners.splice(index, 1);
	};
	this.addThemeChangeEventListener = function(listener) {
		themeChangeEventListeners.push(listener);
	};
	this.removeThemeChangeEventListener = function(listener) {
		var index = themeChangeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		themeChangeEventListeners.splice(index, 1);
	};
	this.addChangeEventListener = function(listener) {
		changeEventListeners.push(listener);
	};
	this.removeChangeEventListener = function(listener) {
		var index = changeEventListeners.indexOf(listener);
		if (index == -1) {
			return;
		}
		changeEventListeners.splice(index, 1);
	};
	this.setPreviewMode = function(value) {
		if (value === true) {
			$container.children().hide();
			$.each(themeScrollElements, function(i, $element) {
				$element.show();
			});
			$(themeScrollElements).show();
		} else if (value === false) {
			$container.children().show();
			$.each(themeScrollElements, function(i, $element) {
				$element.hide();
			});
		} else {
			$container.children().show();
		}
	}
};
