define([
		'ui/file/File.opt',
		'ui/file/File.tmp',
		'ui/file/Open',
		'ui/file/Save'
],

function(Opt, Temporary, OpenDialog, SaveDialog) {
	var fs = require('fs'),
		path = require('path');

	var gui = require('nw.gui'),
			win = gui.Window.get();

	function _update(file) {
		Opt.set({
			'fileEntry': file,
			'extname': path.extname(file) || '.md',
			'dirname': path.dirname(file),
			'basename': path.basename(file),
			'updated_at': new Date
		});
	}

	function _open(file) {
		var markdown;
		
		markdown = fs.readFileSync(file, 'utf8');
		
		_update(file);

		Opt.set({ markdown: markdown });

		window.ee.emit('file.opened', Opt.toJSON(), markdown);
	}

	function _save(file) {
		if (!path.extname(file)) {
			file += '.md';
		}

		_update(file);

		window.parent.ee.emit('file.save', Opt.get('fileEntry'), Opt.get('markdown'), function(err) {
			window.ee.emit('file.saved', Opt.toJSON());
		});
	}

	Opt.bind('change', function() {
		// console.log(arguments)
	});

	//open dialog fire change event
	OpenDialog.on('file.open', function(file) {
		window.parent.ee.emit('file.open', file);
	});

	SaveDialog.on('file.save', _save);

	/***************************
	 * node-webkit window event
	 ***************************/
	// win.on('file.open', OpenDialog.show.bind(OpenDialog));
	window.ee.on('file.open', OpenDialog.show.bind(OpenDialog));
	
	window.ee.on('file.save', function() {
		var file = Opt.get('fileEntry');
		if (!file) {
			SaveDialog.show();
		} else {
			_save(file);
		}
	});

	window.ee.on('change.before.markdown', function(markdown) {
		Opt.set('markdown', markdown);
		Temporary.update();
	});

	window.ee.on('file.save.as', SaveDialog.show.bind(SaveDialog));

	return {
		open: function(file) {
			_open(file);
		},

		startAutoSave: function() {
			Temporary.create();
		}
	}
});