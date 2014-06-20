(function($) {
	
	var members = {
		private : {
			create : function(options) {
				var $self = this;
				
				function addimage(btn){
					if ($("[name=uploadfile]").length !== 0){
						$("[name=uploadfile]").remove();
					}
					new AjaxUpload(btn, {
						action : '/s3bucket',
						data : {
							curuser : app.getUser().id,
							curcafe : app.getWsModel().get().cafe
						},
						name : 'uploadfile',
						onSubmit : function(file, ext) {
							if (!(ext && /^(jpg|png|jpeg|gif)$/.test(ext))){ 
								Logger().error('Поддерживаются только JPG, PNG или GIF');
								return false;
							}
						},
						onComplete : function(file, response){
							var files = $(response).find(".file");
							var event = $.Event('imageChange', {
								imageSrc : $(files[0]).find(".url").text()
							});
							$self.trigger(event);
						}
					});
				}
				
				if (!$self.data('pdImageProperty')) {
					options = $.extend({
							source : []
						},
						options
					);
					
					$self.addClass('pd-image-property');

					$self.attr('type', 'image');
					var $content =
						$('<div class="pd-image-property-content"/>');
					$self.append($content);
					var $button = $('<div class="pd-image-property-button'
						+ ' icon-icomoon-arrow-down5"/>');
					$self.append($button);
					
					var $menu = $('<div class="pd-image-property-menu"/>');
					var $menuTextItem =
						$('<div class="pd-image-property-menu-item">'
							+ '#</div>').on('click', function() {
								if ($self.data('mode') === 'text') {
									return;
								}
								var value = '';
								if ($self.data('mode') === 'image') {
									if ($("[name=uploadfile]").length !== 0) {
										$("[name=uploadfile]").remove();
									}
									var $img = $content.children('img');
									if ($img.length) {
										value = $img.attr('src');
									}
								}
								$content.empty();
								var $input = $('<input type="text" value="'
									+ value + '">');
								$input.on('change', function() {
									var value = $(this).val();
									if (value.length === 0) {
										value = '#';
									}
									var event = $.Event('imageChange', {
										imageSrc : value
									});
									$self.trigger(event);
								});
								$content.append($input);
								$self.data('mode', 'text');
							}).appendTo($menu);
					var $menuImageItem =
						$('<div class="pd-image-property-menu-item">'
							+ 'image</div>').on('click', function() {
								if ($self.data('mode') === 'image') {
									return;
								}
								var value = '';
								if ($self.data('mode') === 'text') {
									var $input = $content.children('input');
									if ($input.length) {
										value = $input.val();
									}
								}
								$content.empty();
								var $img = $('<img src="' + value + '">').css({
									'min-height' : '32px'
								});
								$content.append($img);
								addimage($img);
								$self.data('mode', 'image');
							}).appendTo($menu);
					var $menuNoneItem =
						$('<div style="font-family:monospace;font-weight:bold;" class="pd-image-property-menu-item">'
							+ 'X</div>').on('click', function() {
								$content.empty();
								var $img = $('<div class="icon-icomoon-image2"/>');
								$content.append($img);
								addimage($img);
								$self.data('mode', 'none');
							}).on('mouseup', function() {
								var event = $.Event('imageChange', {
									imageSrc : '#'
								});
								$self.trigger(event);
							}).appendTo($menu);
					$self.append($menu);
					
					$button.on('click', function() {
						$menu.toggle();
						return false;
					});
					
					$(document.body).on('click.pdImageProperty', function() {
						$menu.hide();
					});
				}
				
				return $self;
			}
		},
		public : {
			destroy : function() {
				var $self = this;
				
				$self.empty();
				$self.removeClass('pd-property-control-image');
				$self.off('.pdImageProperty');
				
				if ($("[name=uploadfile]").length !== 0){
					$("[name=uploadfile]").remove();
				}
					
				return $self;
			},
			set : function(value) {
				var $self = this;
				if (typeof value !== 'string'
					|| value.length === 0) {
					return;
				}
				if (value[0] === '#') {
					if (value.length === 1) {
						$self.find('.pd-image-property-menu-item:contains("X")')
							.triggerHandler('click');
					} else {
						$self.find('.pd-image-property-menu-item:contains("#")')
							.triggerHandler('click');
						$self.find('.pd-image-property-content>input').val(value);
					}
				} else {
					$self.find('.pd-image-property-menu-item:contains("image")')
						.triggerHandler('click');
					$self.find('.pd-image-property-content>img')
						.attr('src', value);
				}
					
				return $self;
			},
		}
	};
	
	$.fn.pdImageProperty = function(method) {
		if (members.public[method]) {
			return members.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return members.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdImageProperty: Method "' + method + '" not found.');
		} 
	};
})(jQuery);
