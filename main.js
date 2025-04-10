/*
 * This extension creates an action bar at the top of the editor
 * which provides various options like cut, copy, paste, save, and many more like in Notepad++
 */

define(function (require, exports, module) {
    "use strict";

    const AppInit = brackets.getModule("utils/AppInit");
    const ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
    const WorkspaceManager = brackets.getModule("view/WorkspaceManager");
    const CommandManager = brackets.getModule("command/CommandManager");
    const Commands = brackets.getModule("command/Commands");
    const EditorManager = brackets.getModule("editor/EditorManager");
    const DocumentManager = brackets.getModule("document/DocumentManager");
   
    const ActionBarHTML = require("text!./html/actionBar.html");
    ExtensionUtils.loadStyleSheet(module, 'styles/actionBar.css');
    
    // This will hold the action bar element
    const $actionBar = $(ActionBarHTML);
   
    // Map button IDs to their corresponding commands
    const actionCommands = {
        "save": Commands.FILE_SAVE,
        "save-all": Commands.FILE_SAVE_ALL,
        "cut": Commands.EDIT_CUT,
        "copy": Commands.EDIT_COPY,
        "paste": Commands.EDIT_PASTE,
        "undo": Commands.EDIT_UNDO,
        "redo": Commands.EDIT_REDO
    };
   
    /**
     * Responsible for handling the action bar button click
     * @param {String} actionName - name of the action like : cut, copy, save, etc
     */
    function handleButtonAction(actionName) {
        // get the corresponding command
        const command = actionCommands[actionName];
        if (command) {
            const editor = EditorManager.getFocusedEditor() || EditorManager.getActiveEditor();
            if (editor) {
                // we need to specifically focus the editor,
                // as when the button is clicked the editor loses focus because of which operations like
                // cut, copy, paste, undo, redo doesn't work
                editor.focus();
                CommandManager.execute(command);
            }
        }
    }
   
    /**
     * Updates the state of buttons based on current conditions
     */
    function updateButtonStates() {
        const editor = EditorManager.getActiveEditor();
        const document = DocumentManager.getCurrentDocument();
        
        // Check if document is available
        const hasDocument = !!document;
        $("#save-button").toggleClass("disabled", !hasDocument);
        
        // For undo/redo, check if they're available
        if (editor) {
            const canUndo = editor._codeMirror.historySize().undo > 0;
            const canRedo = editor._codeMirror.historySize().redo > 0;
            $("#undo-button").toggleClass("disabled", !canUndo);
            $("#redo-button").toggleClass("disabled", !canRedo);
        } else {
            $("#undo-button, #redo-button").addClass("disabled");
        }
    }
   
    /**
     * Registers click handlers for all the action bar buttons
     */
    function registerHandlers() {
        // event delegation with a single handler for all buttons
        $actionBar.on("click", ".button:not(.disabled)", function() {
            const buttonId = $(this).attr("id");
            // all the buttons has id in the format 'cut-button', 'paste-button',
            // so to get the name, we remove '-button'
            const actionName = buttonId.replace("-button", "");
            handleButtonAction(actionName);
        });
        
        // Register listeners for document and editor changes
        $(DocumentManager).on("currentDocumentChange dirtyFlagChange", updateButtonStates);
        $(EditorManager).on("activeEditorChange", updateButtonStates);
        
        // Register listener for selection changes - fixed to properly detect text selection
        $(EditorManager).on("activeEditorChange", function() {
            const editor = EditorManager.getActiveEditor();
            if (editor) {
                // Make sure we're using the proper CodeMirror event for selection changes
                $(editor._codeMirror).on("cursorActivity", updateButtonStates);
                updateButtonStates(); // Update immediately when editor changes
            }
        });
    }

    /**
     * Used to initialize the action bar stuff.
     * Here we add the action bar to the editor and recompute the layout
     */
function init() {
    // Insert the action bar between titlebar and editor-holder
    $("#titlebar").after($actionBar);

    WorkspaceManager.recomputeLayout(true);
    updateButtonStates();
}

    AppInit.appReady(function () {
        init();
        registerHandlers();
    });
});
