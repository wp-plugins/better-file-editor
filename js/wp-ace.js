/*
Plugin Name: Better File Editor
Author: Bryan Petty <bryan@ibaku.net>
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *      Julian Viereck <julian DOT viereck AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


define('wp-ace', function(require, exports, module) {

"never use strict";

require("ace/lib/fixoldbrowsers");
require("ace/config").init();
var env = {};

var dom = require("ace/lib/dom");
var net = require("ace/lib/net");

var event = require("ace/lib/event");
var theme = require("ace/theme/textmate");
var EditSession = require("ace/edit_session").EditSession;
var UndoManager = require("ace/undomanager").UndoManager;

var Renderer = require("ace/virtual_renderer").VirtualRenderer;
var Editor = require("ace/editor").Editor;
var MultiSelect = require("ace/multi_select").MultiSelect;

EditSession.prototype.$useWorker = false;

/************** modes ***********************/
var modes = [];
function getModeFromPath(path) {
	var mode = modesByName.text;
	for (var i = 0; i < modes.length; i++) {
		if (modes[i].supportsFile(path)) {
			mode = modes[i];
			break;
		}
	}
	return mode;
};

var Mode = function(name, desc, extensions) {
	this.name = name;
	this.desc = desc;
	this.mode = "ace/mode/" + name;
	this.extRe = new RegExp("^.*\\.(" + extensions + ")$", "g");
};

Mode.prototype.supportsFile = function(filename) {
	return filename.match(this.extRe);
};

var modesByName = {
	c9search:   ["C9Search"     , "c9search_results"],
	coffee:     ["CoffeeScript" , "coffee|^Cakefile"],
	coldfusion: ["ColdFusion"   , "cfm"],
	csharp:     ["C#"           , "cs"],
	css:        ["CSS"          , "css"],
	diff:       ["Diff"         , "diff|patch"],
	golang:     ["Go"           , "go"],
	groovy:     ["Groovy"       , "groovy"],
	haxe:       ["haXe"         , "hx"],
	html:       ["HTML"         , "htm|html|xhtml"],
	c_cpp:      ["C/C++"        , "c|cc|cpp|cxx|h|hh|hpp"],
	clojure:    ["Clojure"      , "clj"],
	java:       ["Java"         , "java"],
	javascript: ["JavaScript"   , "js"],
	json:       ["JSON"         , "json"],
	jsx:        ["JSX"          , "jsx"],
	latex:      ["LaTeX"        , "latex|tex|ltx|bib"],
	less:       ["LESS"         , "less"],
	liquid:     ["Liquid"       , "liquid"],
	lua:        ["Lua"          , "lua"],
	luapage:    ["LuaPage"      , "lp"], // http://keplerproject.github.com/cgilua/manual.html#templates
	markdown:   ["Markdown"     , "md|markdown"],
	ocaml:      ["OCaml"        , "ml|mli"],
	perl:       ["Perl"         , "pl|pm"],
	pgsql:      ["pgSQL"        , "pgsql"],
	php:        ["PHP"          , "php|phtml"],
	powershell: ["Powershell"   , "ps1"],
	python:     ["Python"       , "py"],
	ruby:       ["Ruby"         , "ru|gemspec|rake|rb"],
	scad:       ["OpenSCAD"     , "scad"],
	scala:      ["Scala"        , "scala"],
	scss:       ["SCSS"         , "scss|sass"],
	sh:         ["SH"           , "sh|bash|bat"],
	sql:        ["SQL"          , "sql"],
	svg:        ["SVG"          , "svg"],
	text:       ["Text"         , "txt"],
	textile:    ["Textile"      , "textile"],
	xml:        ["XML"          , "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl"],
	xquery:     ["XQuery"       , "xq"],
	yaml:       ["YAML"         , "yaml"]
};

for (var name in modesByName) {
	var mode = modesByName[name];
	mode = new Mode(name, mode[0], mode[1])
	modesByName[name] = mode;
	modes.push(mode);
}


/*********** create editor ***************************/

jQuery('#newcontent').parent().attr('id', 'editor');

jQuery('#newcontent').after('\
<div id="wp-ace-editor-controls">\
	<ul>\
		<li>\
			<select id="editor_theme" size="1">\
				<option value="ace/theme/chrome">Chrome</option>\
				<option value="ace/theme/clouds">Clouds</option>\
				<option value="ace/theme/clouds_midnight">Clouds Midnight</option>\
				<option value="ace/theme/cobalt">Cobalt</option>\
				<option value="ace/theme/crimson_editor">Crimson Editor</option>\
				<option value="ace/theme/dawn">Dawn</option>\
				<option value="ace/theme/dreamweaver">Dreamweaver</option>\
				<option value="ace/theme/eclipse">Eclipse</option>\
				<option value="ace/theme/idle_fingers">idleFingers</option>\
				<option value="ace/theme/kr_theme">krTheme</option>\
				<option value="ace/theme/merbivore">Merbivore</option>\
				<option value="ace/theme/merbivore_soft">Merbivore Soft</option>\
				<option value="ace/theme/mono_industrial">Mono Industrial</option>\
				<option value="ace/theme/monokai">Monokai</option>\
				<option value="ace/theme/pastel_on_dark">Pastel on dark</option>\
				<option value="ace/theme/solarized_dark">Solarized Dark</option>\
				<option value="ace/theme/solarized_light">Solarized Light</option>\
				<option value="ace/theme/textmate" selected="selected">TextMate</option>\
				<option value="ace/theme/twilight">Twilight</option>\
				<option value="ace/theme/tomorrow">Tomorrow</option>\
				<option value="ace/theme/tomorrow_night">Tomorrow Night</option>\
				<option value="ace/theme/tomorrow_night_blue">Tomorrow Night Blue</option>\
				<option value="ace/theme/tomorrow_night_bright">Tomorrow Night Bright</option>\
				<option value="ace/theme/tomorrow_night_eighties">Tomorrow Night 80s</option>\
				<option value="ace/theme/vibrant_ink">Vibrant Ink</option>\
			</select>\
		</li>\
		<li>\
			<select id="fontsize" size="1">\
				<option value="10px">10px</option>\
				<option value="11px">11px</option>\
				<option value="12px" selected="selected">12px</option>\
				<option value="14px">14px</option>\
				<option value="16px">16px</option>\
				<option value="20px">20px</option>\
				<option value="24px">24px</option>\
			</select>\
		</li>\
		<li>\
			<input type="checkbox" name="show_hidden" id="show_hidden">Visible Whitespace</input>\
		</li>\
		<li>\
			<input type="checkbox" id="show_gutter" checked>Show Gutter</input>\
		</li>\
		<li>\
			<input type="checkbox" id="show_print_margin" checked>Show Ruler</input>\
		</li>\
	</ul>\
</div>\
<div id="wp-ace-editor"></div>\
');

var container = document.getElementById("wp-ace-editor");
var textarea = document.getElementById("newcontent");
textarea.style.display = 'none';

// Splitting.
var Split = require("ace/split").Split;
var split = new Split(container, theme, 1);
env.editor = split.getEditor(0);
split.on("focus", function(editor) {
	env.editor = editor;
	updateUIEditorOptions();
});
env.split = split;
window.env = env;
window.ace = env.editor;

env.editor.setAnimatedScroll(true);
env.editor.setShowInvisibles(false);

var consoleEl = dom.createElement("div");
container.parentNode.appendChild(consoleEl);
consoleEl.style.position="fixed"
consoleEl.style.bottom = "1px"
consoleEl.style.right = 0
consoleEl.style.background = "white"
consoleEl.style.border = "1px solid #baf"
consoleEl.style.zIndex = "100"
var cmdLine = new singleLineEditor(consoleEl);
cmdLine.editor = env.editor;
env.editor.cmdLine = cmdLine;

env.editor.commands.addCommands([{
	name: "gotoline",
	bindKey: {win: "Ctrl-L", mac: "Command-L"},
	exec: function(editor, line) {
		if (typeof needle == "object") {
			var arg = this.name + " " + editor.getCursorPosition().row;
			editor.cmdLine.setValue(arg, 1)
			editor.cmdLine.focus()
			return
		}
		line = parseInt(line, 10);
		if (!isNaN(line))
			editor.gotoLine(line);
	},
	readOnly: true
}, {
	name: "find",
	bindKey: {win: "Ctrl-F", mac: "Command-F"},
	exec: function(editor, needle) {
		if (typeof needle == "object") {
			var arg = this.name + " " + editor.getCopyText()
			editor.cmdLine.setValue(arg, 1)
			editor.cmdLine.focus()
			return
		}
		editor.find(needle);
	},
	readOnly: true
}, {
	name: "focusCommandLine",
	bindKey: "shift-esc",
	exec: function(editor, needle) { editor.cmdLine.focus(); },
	readOnly: true
}])

cmdLine.commands.bindKeys({
	"Shift-Return|Ctrl-Return|Alt-Return": function(cmdLine) { cmdLine.insert("\n")},
	"Esc|Shift-Esc": function(cmdLine){ cmdLine.editor.focus(); },
	"Return": function(cmdLine){
		var command = cmdLine.getValue().split(/\s+/);
		var editor = cmdLine.editor;
		editor.commands.exec(command[0], editor, command[1]);
		editor.focus();
	},
})

cmdLine.commands.removeCommands(["find", "goToLine", "findAll", "replace", "replaceAll"])

/**
 * This demonstrates how you can define commands and bind shortcuts to them.
 */

var commands = env.editor.commands;
commands.addCommand({
	name: "save",
	bindKey: {win: "Ctrl-S", mac: "Command-S"},
	exec: function() {alert("Fake Save File");}
});


var wp_session = new EditSession(textarea.value);
wp_session.setUndoManager(new UndoManager());
var wp_mode = getModeFromPath(document.template.file.value);
wp_session.setMode(wp_mode.mode);
wp_session.setUseSoftTabs(false);
var wp_session = env.split.setSession(wp_session);



/*********** manage layout ***************************/
// var consoleHight = 20;
// function onResize() {
//     var left = env.split.$container.offsetLeft;
//     var width = document.getElementById("editor").clientWidth - left;
//     container.style.width = width + "px";
//     container.style.height = document.documentElement.clientHeight - consoleHight + "px";
//     env.split.resize();

//     consoleEl.style.width = width + "px";
//     cmdLine.resize()
// }

// window.onresize = onResize;
// onResize();

/*********** options pane ***************************/
var themeEl = document.getElementById("editor_theme");
var showHiddenEl = document.getElementById("show_hidden");
var showGutterEl = document.getElementById("show_gutter");
var showPrintMarginEl = document.getElementById("show_print_margin");



function updateUIEditorOptions() {
	var editor = env.editor;
	var session = editor.session;

	saveOption(themeEl, editor.getTheme());
	saveOption(showHiddenEl, editor.getShowInvisibles());
	saveOption(showGutterEl, editor.renderer.getShowGutter());
	saveOption(showPrintMarginEl, editor.renderer.getShowPrintMargin());
}

function saveOption(el, val) {
	if (!el.onchange && !el.onclick)
		return;

	if ("checked" in el) {
		if (val !== undefined)
			el.checked = val;

		localStorage && localStorage.setItem(el.id, el.checked ? 1 : 0);
	}
	else {
		if (val !== undefined)
			el.value = val;

		localStorage && localStorage.setItem(el.id, el.value);
	}
}

event.addListener(themeEl, "mouseover", function(e){
	this.desiredValue = e.target.value;
	if (!this.$timer)
		this.$timer = setTimeout(this.updateTheme);
})

event.addListener(themeEl, "mouseout", function(e){
	this.desiredValue = null;
	if (!this.$timer)
		this.$timer = setTimeout(this.updateTheme, 20);
})

themeEl.updateTheme = function(){
	env.split.setTheme(themeEl.desiredValue || themeEl.selectedValue);
	themeEl.$timer = null;
}

bindDropdown("editor_theme", function(value) {
	if (!value)
		return;
	env.editor.setTheme(value);
	themeEl.selectedValue = value;
});

bindDropdown("fontsize", function(value) {
	env.split.setFontSize(value);
});

bindCheckbox("show_hidden", function(checked) {
	env.editor.setShowInvisibles(checked);
});

bindCheckbox("show_gutter", function(checked) {
	env.editor.renderer.setShowGutter(checked);
});

bindCheckbox("show_print_margin", function(checked) {
	env.editor.renderer.setShowPrintMargin(checked);
});

function bindCheckbox(id, callback) {
	var el = document.getElementById(id);
	if (localStorage && localStorage.getItem(id))
		el.checked = localStorage.getItem(id) == "1";

	var onCheck = function() {
		callback(!!el.checked);
		saveOption(el);
	};
	el.onclick = onCheck;
	onCheck();
}

function bindDropdown(id, callback) {
	var el = document.getElementById(id);
	if (localStorage && localStorage.getItem(id))
		el.value = localStorage.getItem(id);

	var onChange = function() {
		callback(el.value);
		saveOption(el);
	};

	el.onchange = onChange;
	onChange();
}

function fillDropdown(list, el) {
	list.forEach(function(item) {
		var option = document.createElement("option");
		option.setAttribute("value", item.name);
		option.innerHTML = item.desc;
		el.appendChild(option);
	});
}


// add multiple cursor support to editor
require("ace/multi_select").MultiSelect(env.editor);



function singleLineEditor(el) {
	var renderer = new Renderer(el);
	renderer.scrollBar.element.style.display = "none";
	renderer.scrollBar.width = 0;
	renderer.content.style.height = "auto";

	renderer.screenToTextCoordinates = function(x, y) {
		var pos = this.pixelToScreenCoordinates(x, y);
		return this.session.screenToDocumentPosition(
			Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
			Math.max(pos.column, 0)
		);
	};
	// todo size change event
	renderer.$computeLayerConfig = function() {
		var longestLine = this.$getLongestLine();
		var firstRow = 0;
		var lastRow = this.session.getLength();
		var height = this.session.getScreenLength() * this.lineHeight;

		this.scrollTop = 0;
		var config = this.layerConfig;
		config.width = longestLine;
		config.padding = this.$padding;
		config.firstRow = 0;
		config.firstRowScreen = 0;
		config.lastRow = lastRow;
		config.lineHeight = this.lineHeight;
		config.characterWidth = this.characterWidth;
		config.minHeight = height;
		config.maxHeight = height;
		config.offset = 0;
		config.height = height;

		this.$gutterLayer.element.style.marginTop = 0 + "px";
		this.content.style.marginTop = 0 + "px";
		this.content.style.width = longestLine + 2 * this.$padding + "px";
		this.content.style.height = height + "px";
		this.scroller.style.height = height + "px";
		this.container.style.height = height + "px";
	};
	renderer.isScrollableBy=function(){return false};

	var editor = new Editor(renderer);
	new MultiSelect(editor);
	editor.session.setUndoManager(new UndoManager());

	editor.setHighlightActiveLine(false);
	editor.setShowPrintMargin(false);
	editor.renderer.setShowGutter(false);
	// editor.renderer.setHighlightGutterLine(false);
	return editor;
};


});

/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 *  Julian Viereck <julian.viereck@gmail.com>
 *
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/split', function(require, exports, module) {
  "use strict";

  var oop = require("./lib/oop");
  var lang = require("./lib/lang");
  var EventEmitter = require("./lib/event_emitter").EventEmitter;

  var Editor = require("./editor").Editor;
  var Renderer = require("./virtual_renderer").VirtualRenderer;
  var EditSession = require("./edit_session").EditSession;

  /** internal, hide
   * class Split
   *
   *
   *
   **/

  /** internal, hide
   * new Split(container, theme, splits)
   * - container (Document): The document to associate with the split
   * - theme (String): The name of the initial theme
   * - splits (Number): The number of initial splits
   *
   *
   *
   **/

  var Split = function(container, theme, splits) {
	  this.BELOW = 1;
	  this.BESIDE = 0;

	  this.$container = container;
	  this.$theme = theme;
	  this.$splits = 0;
	  this.$editorCSS = "";
	  this.$editors = [];
	  this.$orientation = this.BESIDE;

	  this.setSplits(splits || 1);
	  this.$cEditor = this.$editors[0];


	  this.on("focus", function(editor) {
		this.$cEditor = editor;
	  }.bind(this));
	};

  (function() {

	oop.implement(this, EventEmitter);

	this.$createEditor = function() {
	  var el = document.createElement("div");
	  el.className = this.$editorCSS;
	  el.style.cssText = "position: absolute; top:0px; bottom:0px";
	  this.$container.appendChild(el);
	  var editor = new Editor(new Renderer(el, this.$theme));

	  editor.on("focus", function() {
		this._emit("focus", editor);
	  }.bind(this));

	  this.$editors.push(editor);
	  editor.setFontSize(this.$fontSize);
	  return editor;
	};

	/** internal, hide
	 * Split.setSplits(splits) -> Void
	 * - splits (Number): The new number of splits
	 *
	 * 
	 *
	 **/
	this.setSplits = function(splits) {
	  var editor;
	  if (splits < 1) {
		throw "The number of splits have to be > 0!";
	  }

	  if (splits == this.$splits) {
		return;
	  } else if (splits > this.$splits) {
		while (this.$splits < this.$editors.length && this.$splits < splits) {
		  editor = this.$editors[this.$splits];
		  this.$container.appendChild(editor.container);
		  editor.setFontSize(this.$fontSize);
		  this.$splits++;
		}
		while (this.$splits < splits) {
		  this.$createEditor();
		  this.$splits++;
		}
	  } else {
		while (this.$splits > splits) {
		  editor = this.$editors[this.$splits - 1];
		  this.$container.removeChild(editor.container);
		  this.$splits--;
		}
	  }
	  this.resize();
	};

	/**
	 * Split.getSplits() -> Number
	 *
	 * Returns the number of splits.
	 *
	 **/
	this.getSplits = function() {
	  return this.$splits;
	};

	/**
	 * Split.getEditor(idx) -> Editor
	 * -idx (Number): The index of the editor you want
	 *
	 * Returns the editor identified by the index `idx`.
	 *
	 **/
	this.getEditor = function(idx) {
	  return this.$editors[idx];
	};

	/**
	 * Split.getCurrentEditor() -> Editor
	 *
	 * Returns the current editor.
	 *
	 **/
	this.getCurrentEditor = function() {
	  return this.$cEditor;
	};

	/** related to: Editor.focus
	 * Split.focus() -> Void
	 *
	 * Focuses the current editor.
	 *
	 **/
	this.focus = function() {
	  this.$cEditor.focus();
	};

	/** related to: Editor.blur
	 * Split.blur() -> Void
	 *
	 * Blurs the current editor.
	 *
	 **/
	this.blur = function() {
	  this.$cEditor.blur();
	};

	/** related to: Editor.setTheme
	 * Split.setTheme(theme) -> Void
	 * - theme (String): The name of the theme to set
	 * 
	 * Sets a theme for each of the available editors.
	 **/
	this.setTheme = function(theme) {
	  this.$editors.forEach(function(editor) {
		editor.setTheme(theme);
	  });
	};

	/** internal, hide
	 * Split.setKeyboardHandler(keybinding) -> Void
	 * - keybinding (String):
	 * 
	 *
	 **/
	this.setKeyboardHandler = function(keybinding) {
	  this.$editors.forEach(function(editor) {
		editor.setKeyboardHandler(keybinding);
	  });
	};

	/** internal, hide
	 * Split.forEach(callback, scope) -> Void
	 * - callback (Function): A callback function to execute
	 * - scope (String): 
	 * 
	 * Executes `callback` on all of the available editors. 
	 *
	 **/
	this.forEach = function(callback, scope) {
	  this.$editors.forEach(callback, scope);
	};

	/** related to: Editor.setFontSize
	 * Split.setFontSize(size) -> Void
	 * - size (Number): The new font size
	 * 
	 * Sets the font size, in pixels, for all the available editors.
	 *
	 **/
	this.$fontSize = "";
	this.setFontSize = function(size) {
	  this.$fontSize = size;
	  this.forEach(function(editor) {
		editor.setFontSize(size);
	  });
	};

	this.$cloneSession = function(session) {
	  var s = new EditSession(session.getDocument(), session.getMode());

	  var undoManager = session.getUndoManager();
	  if (undoManager) {
		var undoManagerProxy = new UndoManagerProxy(undoManager, s);
		s.setUndoManager(undoManagerProxy);
	  }

	  // Overwrite the default $informUndoManager function such that new delas
	  // aren't added to the undo manager from the new and the old session.
	  s.$informUndoManager = lang.deferredCall(function() {
		s.$deltas = [];
	  });

	  // Copy over 'settings' from the session.
	  s.setTabSize(session.getTabSize());
	  s.setUseSoftTabs(session.getUseSoftTabs());
	  s.setOverwrite(session.getOverwrite());
	  s.setBreakpoints(session.getBreakpoints());
	  s.setUseWrapMode(session.getUseWrapMode());
	  s.setUseWorker(session.getUseWorker());
	  s.setWrapLimitRange(session.$wrapLimitRange.min, session.$wrapLimitRange.max);
	  s.$foldData = session.$cloneFoldData();

	  return s;
	};

	/** related to: Editor.setSession
	 * Split.setSession(session, idx) -> Void
	 * - session (EditSession): The new edit session
	 * - idx (Number): The editor's index you're interested in
	 * 
	 * Sets a new [[EditSession `EditSession`]] for the indicated editor.
	 *
	 **/
	this.setSession = function(session, idx) {
	  var editor;
	  if (idx == null) {
		editor = this.$cEditor;
	  } else {
		editor = this.$editors[idx];
	  }

	  // Check if the session is used already by any of the editors in the
	  // split. If it is, we have to clone the session as two editors using
	  // the same session can cause terrible side effects (e.g. UndoQueue goes
	  // wrong). This also gives the user of Split the possibility to treat
	  // each session on each split editor different.
	  var isUsed = this.$editors.some(function(editor) {
		return editor.session === session;
	  });

	  if (isUsed) {
		session = this.$cloneSession(session);
	  }
	  editor.setSession(session);

	  // Return the session set on the editor. This might be a cloned one.
	  return session;
	};

	/** internal, hide
	 * Split.getOrientation() -> Number
	 * 
	 * Returns the orientation.
	 *
	 **/
	this.getOrientation = function() {
	  return this.$orientation;
	};

	/** internal, hide
	 * Split.setOrientation(oriantation) -> Void
	 * - oriantation (Number):
	 *
	 * Sets the orientation.
	 *
	 **/
	this.setOrientation = function(orientation) {
	  if (this.$orientation == orientation) {
		return;
	  }
	  this.$orientation = orientation;
	  this.resize();
	};

	/**  internal
	 * Split.resize() -> Void
	 *
	 *
	 *
	 **/
	this.resize = function() {
	  var width = this.$container.clientWidth;
	  var height = this.$container.clientHeight;
	  var editor;

	  if (this.$orientation == this.BESIDE) {
		var editorWidth = width / this.$splits;
		for (var i = 0; i < this.$splits; i++) {
		  editor = this.$editors[i];
		  editor.container.style.width = editorWidth + "px";
		  editor.container.style.top = "0px";
		  editor.container.style.left = i * editorWidth + "px";
		  editor.container.style.height = height + "px";
		  editor.resize();
		}
	  } else {
		var editorHeight = height / this.$splits;
		for (var i = 0; i < this.$splits; i++) {
		  editor = this.$editors[i];
		  editor.container.style.width = width + "px";
		  editor.container.style.top = i * editorHeight + "px";
		  editor.container.style.left = "0px";
		  editor.container.style.height = editorHeight + "px";
		  editor.resize();
		}
	  }
	};

  }).call(Split.prototype);

  /**  internal
   * Split.UndoManagerProxy() -> Void
   *
   *  
   *
   **/
  function UndoManagerProxy(undoManager, session) {
	this.$u = undoManager;
	this.$doc = session;
  }

  (function() {
	this.execute = function(options) {
	  this.$u.execute(options);
	};

	this.undo = function() {
	  var selectionRange = this.$u.undo(true);
	  if (selectionRange) {
		this.$doc.selection.setSelectionRange(selectionRange);
	  }
	};

	this.redo = function() {
	  var selectionRange = this.$u.redo(true);
	  if (selectionRange) {
		this.$doc.selection.setSelectionRange(selectionRange);
	  }
	};

	this.reset = function() {
	  this.$u.reset();
	};

	this.hasUndo = function() {
	  return this.$u.hasUndo();
	};

	this.hasRedo = function() {
	  return this.$u.hasRedo();
	};
  }).call(UndoManagerProxy.prototype);

  exports.Split = Split;
});