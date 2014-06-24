(function($) {
	var members = {
		private : {

			create : function(options) {
				
				var $self = $(this);
				
				if (!$self.data('pdDialog')) {
					
					$self.addClass('pd-dialog-window');
					$self.css({
						'position' : 'absolute',
						'left' : '50%',
						'top' : '50%',
						'margin-left' : - $self.width() / 2,
						'margin-top' : - $self.height() / 2,
					});
					var $dialogHeader = $('<div class="pd-header ' +
						'pd-dialog-window-header"/>');
					$dialogHeader.append(options.title);
					$('<span class="pd-dialog-window-titlebar-button ' + 
						'icon-icomoon-close"/>')
						.on('click', options.close)
						.on('click', function() {
							members.public.destroy.apply($self.get(0));
						}).appendTo($dialogHeader);
					$dialogHeader.appendTo($self);

					var $dialogContent = $('<div class="pd-dialog-window-content"/>');
					$dialogContent.append(options.content);
					$dialogContent.appendTo($self);

					var $dialogButtons = $('<div class="pd-dialog-window-buttons"/>');
					$('<span class="pd-dialog-window-button">OK</span>')
						.on('click', options.confirm)
						.on('click', function() {
							members.public.destroy.apply($self.get(0));
						})
						.appendTo($dialogButtons);
					$('<span class="pd-dialog-window-button">Cancel</span>')
						.on('click', options.cancel)
						.on('click', function() {
							members.public.destroy.apply($self.get(0));
						})
						.appendTo($dialogButtons);
					$dialogButtons.appendTo($self);

					$self.data('pdDialog', {
						target : $self,
						options : options
					});
				}

				return $self;
			},
		},
		public : {
			destroy : function() {
				var $self = $(this);
				$self.removeClass('pd-dialog-window-container');
				$self.removeAttr('style');
				$self.children().remove();
				
				if (typeof $self.data('pdDialog').options.destroy === 'function') {
					$self.data('pdDialog').options.destroy();
				}

				$self.removeData('pdDialog');

				return $self;
			}
		}
	};
	
	$.fn.pdDialog = function(method) {
		if (members.public[method]) {
			return members.public[method].apply(this,
				Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return members.private.create.apply(this, arguments);
		} else {
			$.error('$.fn.pdDialog: Method "' + method + '" not found.');
		} 
	};
})(jQuery);
