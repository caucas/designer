var PropertyBrowser = function($viewContainer) {
	var properties = null;
	
	$viewContainer.addClass('pd-property-browser');
	var classes = ['rasta-color-green',
		'rasta-color-yellow',
		'rasta-color-red'];
		
	function stopEventPropagation(e) {
		e.stopPropagation();
		e.cancelBubble = true;
	}
	
	this.get = function() {
		return properties;
	};
	this.set = function(newProperties) {
		if (properties === newProperties) {
			return;
		}
		properties = newProperties;
		$viewContainer.children().children('.pd-property-control')
			.each(function() {
				$(this).triggerHandler('destroy');
			});
			
		$viewContainer.children().detach();
		if (!properties) {
			return;
		}
		var i = 0;
		for (var key in properties) {
			var $property = $('<div class="pd-property"/>');
			var propertyId = 'ws-property-' + key;
			var label = properties[key].label;
			if (typeof label === 'string') {
				label = $('<label for="' + propertyId
					+ '" class="pd-property-label '
					+ classes[i % 3] + '">'
					+ label + '</label>');
			}
			$property.append(label);
			var control = properties[key].control;
			control.attr('id', propertyId);
			control.addClass('pd-property-control ' + classes[++i % 3]);
			$property.append(control);
			$viewContainer.append($property);
			control.triggerHandler('create');
		}
		var $controls = $viewContainer.children()
			.children('.pd-property-control');
		$controls.off({
			'keydown keypress keyup' : stopEventPropagation
		});
		$controls.on('keydown keypress keyup', stopEventPropagation);
	};
};

var PropertiesBuilder = function(properties) {
	function createUpdateObject(name, value) {
		var updateObject = {};
		var names = name.split('.');
		updateObject[names[names.length - 1]] = value;
		for (var i = 2; i < names.length + 1; i++) {
			var object = {};
			object[names[names.length - i]] = updateObject;
			updateObject = object;
		}
		return updateObject;
	}
	
	return {
		addStringProperty : function(name, label, onChange) {
			var $control = $('<input type="text">');
			if (onChange) {
				$control.on('keyup', function() {
					onChange(createUpdateObject(name, $(this).val()));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addStringsProperty : function(name, label, onChange, strings) {
			var $control = $('<select/>');
			for (var key in strings) {
				var option = new Option(key, strings[key]);
				$control.append(option);
			}
			if (onChange) {
				$control.on('change', function() {
					onChange(createUpdateObject(name, $(this).val()));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addTextProperty : function(name, label, onChange) {
			var $control = $('<textarea rows="5"></textarea>');
			$control.css({
				'width' : '100%',
				'resize' : 'none'
			});
			if (onChange) {
				$control.on('keyup', function() {
					onChange(createUpdateObject(name, $(this).val()));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addNumberProperty : function(name, label, onChange, min, max, step) {
			var $control = $('<input type="number" min="'
				+ min + '" max="' + max + '" step="' + step + '">');
			if (onChange) {
				$control.on('change', function() {
					onChange(createUpdateObject(name, parseFloat($(this).val())));
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addColorProperty : function(name, label, onChange) {
			var $control = $('<div type="color">&nbsp;</div>');
			if (onChange) {
				var $colorPicker = $('<div/>');
				$control.append($colorPicker);
				$control.on('create', function() {
					$colorPicker.spectrum({
						preferredFormat: 'name',
						showInput : true,
						showInitial : true,
						allowEmpty : true,
						showAlpha : true,
						chooseText : 'OK',
						cancelText : 'Cancel',
						change : function(color) {
							onChange(createUpdateObject(name, color === null
								? 'transparent' : color.toRgbString()));
						}
					});
					$control.on('click', function(e) {
						if (typeof $control.attr('readonly') === 'undefined') {
							$colorPicker.spectrum('toggle');
						}
						e.preventDefault();
						return false;
					});
				});
				$control.on('destroy', function() {
					$colorPicker.spectrum('destroy');
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addImageProperty : function(name, label, onChange) {
			var $control = $('<div type="image"/>');
			if (onChange) {
				$control.pdImageProperty();
				$control.on('imageChange', function(e) {
					onChange(createUpdateObject(name, e.imageSrc));
				});
				$control.on('create', function() {
				});
				$control.on('destroy', function() {
				});
			} else {
				$control.attr('readonly', 'readonly');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
		addBooleanProperty : function(name, label, onChange) {
			var $control = $('<input type="checkbox"/>');
			if (onChange) {
				$control.on('change', function() {
					if ($(this).is(":checked")) {
						onChange(createUpdateObject(name, true));
					} else {
						onChange(createUpdateObject(name, false));
					}
				})
			} else {
				$control.attr('disabled', 'disabled');
			}
			properties[name] = {
				name : name,
				label : label,
				control : $control
			};
			return this;
		},
	
		setPropertyValue : function(name, model) {
			var names = name.split('.');
			var value = model[names[0]];
			for (var i = 1; i < names.length; i++) {
				value = value[names[i]];
			}
			if (properties[name].control.is('select')) {
				properties[name].control.children('option[value="' + value + '"]')
					.attr('selected', 'selected');
			} else if (properties[name].control.is('input')) {
				if (properties[name].control.attr('type') === 'checkbox') {
					if (value) {
						properties[name].control.attr('checked', 'checked');
					}
				} else {
					properties[name].control.val(value);
				}
			} else if (properties[name].control.attr('type') === 'color') {
				properties[name].control.css({
					'background-color' : value
				});
			} else if (properties[name].control.attr('type') === 'image') {
				properties[name].control.pdImageProperty('set', value);
			} else {
				properties[name].control.text(value);
			}
		},
		setPropertyValues : function(model) {
			for (var key in properties) {
				this.setPropertyValue(key, model)
			}
			return this;
		}
	}
};
