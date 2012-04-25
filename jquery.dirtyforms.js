/*! 
	Copyright 2010 Mal Curtis
*/

if (typeof jQuery == 'undefined') throw ("jQuery Required");

(function($){
	// Public General Plugin methods $.DirtyForms
	$.extend({
		DirtyForms: {
			debug : false,
			message : 'You\'ve made changes on this page which aren\'t saved. If you leave you will lose these changes.',
			title : 'Are you sure you want to do that?',
			dirtyClass : 'dirty',
			listeningClass : 'dirtylisten',
			ignoreClass : 'ignoredirty',
			helpers : [],
			dialog : {
				refire : function(content, ev){
					$.facebox(content);
				},
				fire : function(message, title){
					var content = '<h1>' + title + '</h1><p>' + message + '</p><p><a href="#" class="ignoredirty button medium red continue">Continue</a><a href="#" class="ignoredirty button medium cancel">Stop</a>';
					$.facebox(content);
				},
				bind : function(){
					var close = function(decision) {
						return function(e) {
							e.preventDefault();
							$(document).trigger('close.facebox');
							decision(e);
						};
					};
					$('#facebox .cancel, #facebox .close, #facebox_overlay').click(close(decidingCancel));
					$('#facebox .continue').click(close(decidingContinue));
				},
				stash : function(){
					var fb = $('#facebox');
					return ($.trim(fb.html()) == '' || fb.css('display') != 'block') ?
					   false :
					   $('#facebox .content').clone(true);
				},
				selector : '#facebox .content'
			},

			isDirty : function(){
				dirtylog('Core isDirty is starting ');
				var isDirty = false;
				if (settings.disabled) return false;
				$(':dirtylistening').each(function(){
					if($(this).isDirty()){
						isDirty = true;
						return true;
					}
				});

				$.each($.DirtyForms.helpers, function(key,obj){
					$('form').each(function(i,node) {
						if("isNodeDirty" in obj){
							if(obj.isNodeDirty(node)) {
								isDirty = true;
								return true;
							}
						}
					});
					if("isDirty" in obj){
						if(obj.isDirty()){
							isDirty = true;
							return true;
						}
					}
				});

				dirtylog('Core isDirty is returning ' + isDirty);
				return isDirty;
			},
			disable : function(){
				settings.disabled = true;
			},
			
			isDeciding : function(){
				return settings.deciding;
			},
			
			decidingContinue : function(e){
				decidingContinue(e);
			},
			
			decidingCancel : function(e){
				decidingCancel(e);
			},
			
			dirtylog : function(msg){
				dirtylog(msg);
			}
		}
	});

	// Create a custom selector $('form:dirty')
	$.extend($.expr[":"], {
		dirtylistening : function(a){
			return $(a).hasClass($.DirtyForms.listeningClass);
		},
		dirty : function(a){
			return $(a).hasClass($.DirtyForms.dirtyClass);
		}
	});

	// Public Element methods $('form').dirtyForm();
	$.fn.dirtyForms = function(){
		var core = $.DirtyForms;
		var thisForm = this;

		dirtylog('Adding forms to watch');
		bindExit();

		return this.each(function(e){
			dirtylog('Adding form ' + $(this).attr('id') + ' to forms to watch');
			$(this).addClass(core.listeningClass);
			$(this).find('input, textarea')
				// exclude most HTML 4 inputs, allow most HTML 5 (and 6?) inputs
				.not("input[type='checkbox'],input[type='radio'],input[type='button']," +
					"input[type='image'],input[type='submit'],input[type='reset']," + 
					"input[type='file'],input[type='hidden'],input[type='search']")
				.focus(onFocus);
			$(this).find("input[type='checkbox'],input[type='radio'],select").change(onCheckedChange);
		});
	}

	$.fn.setDirty = function(){
		dirtylog('setDirty called');
		return this.each(function(e){
			$(this).addClass($.DirtyForms.dirtyClass).parents('form').addClass($.DirtyForms.dirtyClass);
		});
	}

	// Returns true if any of the supplied elements are dirty
	$.fn.isDirty = function(){
		var isDirty = false;
		var node = this;
		if (focusedIsDirty()) {
			isDirty = true;
			return true;
		}
		this.each(function(e){
			if($(this).hasClass($.DirtyForms.dirtyClass)){
				isDirty = true;
				return true;
			}
		});
		$.each($.DirtyForms.helpers, function(key,obj){
			if("isNodeDirty" in obj){
				if(obj.isNodeDirty(node)){
					isDirty = true;
					return true;
				}
			}
		});

		dirtylog('isDirty returned ' + isDirty);
		return isDirty;
	}

    // "Cleans" this dirty form by essentially forgetting that it is dirty
    $.fn.cleanDirty = function(){
        dirtylog('cleanDirty called');
		
		// Clean helpers
		$.each($.DirtyForms.helpers, function(key,obj){
			$('form').each(function(i,node) {
				if("cleanDirtyNode" in obj){
					obj.cleanDirtyNode(node);
				}
			});
			if("cleanDirty" in obj){
				obj.cleanDirty();
			}
		});
		
        settings.focused = {element: false, value: false};

        return this.each(function(e){
			$(this).removeClass($.DirtyForms.dirtyClass).parents('form').removeClass($.DirtyForms.dirtyClass).find(':dirty').removeClass($.DirtyForms.dirtyClass);
        });
    }


	// Private Properties and Methods
	var settings = $.DirtyForms = $.extend({
		disabled : false,
		exitBound : false,
		formStash : false,
		dialogStash : false,
		deciding : false,
		decidingEvent : false,
		currentForm : false,
		hasFirebug : "console" in window && "firebug" in window.console,
		hasConsoleLog: "console" in window && "log" in window.console,
		focused: {"element": false, "value": false}
	}, $.DirtyForms);

	var onCheckedChange = function() {
		$(this).setDirty();
	}
	
	var onFocus = function() {
		element = $(this);
		if (focusedIsDirty()) {
			element.setDirty();
		}
		settings.focused['element'] = element;
		settings.focused['value']	= element.val();
	}
	var focusedIsDirty = function() {
		/** Check, whether the value of focused element has changed */
		return settings.focused["element"] &&
			(settings.focused["element"].val() !== settings.focused["value"]);
	}

	var dirtylog = function(msg){
		if(!$.DirtyForms.debug) return;
		msg = "[DirtyForms] " + msg;
		settings.hasFirebug ?
			console.log(msg) :
			settings.hasConsoleLog ?
				window.console.log(msg) :
				alert(msg);
	}
	var bindExit = function(){
		if(settings.exitBound) return;

    // We need a separate set of processes for when the form is
    // running inside of an iframe. We need the livaquery library
    // in order to dynamically bind to elements within the iframe.
    if (top !== window && $.livequery) {
      $('a').livequery('click', aBindFn);
      $('form').livequery('submit', formBindFn);
      $(top.document).contents().find('a').bind('click', aBindFn);
      $(top.window).bind('beforeunload', beforeunloadBindFn);
    }
    else {
      $('a').live('click',aBindFn);
      $('form').live('submit',formBindFn);
    }
		$(window).bind('beforeunload', beforeunloadBindFn);

		settings.exitBound = true;
	}

	var aBindFn = function(ev){
		 bindFn(ev);
	}

	var formBindFn = function(ev){
		settings.currentForm = this;
		bindFn(ev);
	}

	var beforeunloadBindFn = function(ev){
		var result = bindFn(ev);

		if(result && settings.doubleunloadfix != true){
			dirtylog('Before unload will be called, resetting');
			settings.deciding = false;
		}

		settings.doubleunloadfix = true;
		setTimeout(function(){settings.doubleunloadfix = false;},200);

		// Bug Fix: Only return the result if it is a string, 
		// otherwise don't return anything.
		if (typeof(result) == 'string'){
			ev = ev || window.event;

			// For IE and Firefox prior to version 4
			if (ev) {
				ev.returnValue = result;
			}

			// For Safari
			return result;
		}
	}

	var bindFn = function(ev){
		dirtylog('Entering: Leaving Event fired, type: ' + ev.type + ', element: ' + ev.target + ', class: ' + $(ev.target).attr('class') + ' and id: ' + ev.target.id);
		
		if(ev.type == 'beforeunload' && settings.doubleunloadfix){
			dirtylog('Skip this unload, Firefox bug triggers the unload event multiple times');
			settings.doubleunloadfix = false;
			return false;
		}

		if($(ev.target).hasClass(settings.ignoreClass) || isDifferentTarget(ev)){
			dirtylog('Leaving: Element has ignore class or has target=\'_blank\'');
			if(!ev.isDefaultPrevented()){
				clearUnload();
			}
			return false;
		}

		if(settings.deciding){
			dirtylog('Leaving: Already in the deciding process');
			return false;
		}

		if(ev.isDefaultPrevented()){
			dirtylog('Leaving: Event has been stopped elsewhere');
			return false;
		}

		if(!settings.isDirty()){
			dirtylog('Leaving: Not dirty');
			if(!ev.isDefaultPrevented()){
				clearUnload();
			}
			return false;
		}

		if(ev.type == 'submit' && $(ev.target).isDirty()){
			dirtylog('Leaving: Form submitted is a dirty form');
			if(!ev.isDefaultPrevented()){
				clearUnload();
			}
			return true;
		}

		settings.deciding = true;
		settings.decidingEvent = ev;
		dirtylog('Setting deciding active');

		if(settings.dialog !== false)
		{
			dirtylog('Saving dialog content');
			settings.dialogStash =settings.dialog.stash();
			dirtylog(settings.dialogStash);
		}

		// Callback for page access in current state
		$(document).trigger('defer.dirtyforms');

		if(ev.type == 'beforeunload'){
			//clearUnload();
			dirtylog('Returning to beforeunload browser handler with: ' + settings.message);
			return settings.message;
		}
		if(!settings.dialog) return;

		ev.preventDefault();
		ev.stopImmediatePropagation();

		if($(ev.target).is('form') && $(ev.target).parents(settings.dialog.selector).length > 0){
			dirtylog('Stashing form');
			settings.formStash = $(ev.target).clone(true).hide();
		}else{
			settings.formStash = false;
		}

		dirtylog('Deferring to the dialog');
		settings.dialog.fire($.DirtyForms.message, $.DirtyForms.title);
		settings.dialog.bind();
	}
	
	var isDifferentTarget = function(ev){
		var aTarget = $(ev.target).attr('target');
		if (typeof aTarget === 'string') {
			aTarget = aTarget.toLowerCase();
		}
		return (aTarget === '_blank');
	}

	var decidingCancel = function(ev){
		ev.preventDefault();
		$(document).trigger('decidingcancelled.dirtyforms');
		if(settings.dialog !== false && settings.dialogStash !== false)
		{
			dirtylog('Refiring the dialog with stashed content');
			settings.dialog.refire(settings.dialogStash.html(), ev);
		}
		$(document).trigger('decidingcancelledAfter.dirtyforms');
		settings.dialogStash = false;
		settings.deciding = settings.currentForm = settings.decidingEvent = false;
	}

	var decidingContinue = function(ev){
		window.onbeforeunload = null; // fix for chrome
		ev.preventDefault();
		settings.dialogStash = false;
		$(document).trigger('decidingcontinued.dirtyforms');
		refire(settings.decidingEvent);
		settings.deciding = settings.currentForm = settings.decidingEvent = false;
	}

	var clearUnload = function(){
		// I'd like to just be able to unbind this but there seems
		// to be a bug in jQuery which doesn't unbind onbeforeunload
		dirtylog('Clearing the beforeunload event');
		$(window).unbind('beforeunload', beforeunloadBindFn);
		window.onbeforeunload = null;
	}

	var refire = function(e){
		$(document).trigger('beforeRefire.dirtyforms');
		switch(e.type){
			case 'click':
				dirtylog("Refiring click event");
				var event = new jQuery.Event('click');
				$(e.target).trigger(event);
				if(!event.isDefaultPrevented()){
					var anchor = $(e.target).closest('[href]');
					dirtylog('Sending location to ' + anchor.attr('href'));
					location.href = anchor.attr('href');
					return;
				}
				break;
			default:
				dirtylog("Refiring " + e.type + " event on " + e.target);
				var target;
				if(settings.formStash){
					dirtylog('Appending stashed form to body');
					target = settings.formStash;
					$('body').append(target);
				}
				else{
					target = $(e.target);
					if(!target.is('form'))
						target = target.closest('form');
				}
				target.trigger(e.type);
				break;
		}
	}

})(jQuery);
