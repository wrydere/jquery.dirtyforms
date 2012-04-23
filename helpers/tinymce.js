// TinyMCE helper, checks to see if TinyMCE editors in the given form are dirty

(function($){
if (typeof $.fn.livequery == 'undefined') throw("Live Query plugin Required");
	// Create a new object, with an isDirty method
	var tinymce = {
		isNodeDirty : function(form){
			var isDirty = false;
			if (formHasTinyMCE(form)) {
				//..alert('in finder');
				// Search for all tinymce elements inside the given form
				$(form).find(':tinymce').each(function(){

					$.DirtyForms.dirtylog('Checking node ' + $(this).attr('id'));
					if($(this).tinymce().isDirty()){
						isDirty = true;
						$.DirtyForms.dirtylog('Node was totally dirty.');
						return true;
					}
				});	
			}	 
			return isDirty;
		}
	}
	// Fix: tinymce throws an error if the selector doesn't match anything
	// (such as when there are no textareas on the current page)
	var formHasTinyMCE = function(form) {
		try {
			return $(form).find(':tinymce').length > 0;
		}
		catch(e) {
			return false;
		}
	}
	// Push the new object onto the helpers array
	$.DirtyForms.helpers.push(tinymce);

	// Create a pre refire binding to trigger the tinymce save
	$(document).bind('beforeRefire.dirtyforms', function(){
		// This is no longer needed, but kept here to remind me.
		//	tinyMCE.triggerSave();
	});
	$('.mceEditor a, .mceEditor span, .mceEditor img, .mceMenu a, .mceMenu span').livequery(function(){
		$(this).addClass($.DirtyForms.ignoreClass);
	});
})(jQuery);