define(function (require, exports, module) {
    "use strict";

    const AppInit = brackets.getModule("utils/AppInit");
    const ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    const WorkspaceManager = brackets.getModule("view/WorkspaceManager");
    const CommandManager = brackets.getModule("command/CommandManager");
    const Commands = brackets.getModule("command/Commands");
    const EditorManager = brackets.getModule("editor/EditorManager");
    const DocumentManager = brackets.getModule("document/DocumentManager");
    const BeautificationManager = brackets.getModule("features/BeautificationManager");
    const Menus = brackets.getModule("command/Menus"); // Add Menus module

    const ActionBarHTML = require("text!./html/actionBar.html");
    ExtensionUtils.loadStyleSheet(module, "styles/actionBar.css");

    // This will hold the action bar element
    const $actionBar = $(ActionBarHTML);

    // Create the command ID for toggling the action bar
    const TOGGLE_ACTION_BAR = "view.toggleActionBar";

    // Track visibility state
    let actionBarVisible = true;

    // Map button IDs to their corresponding commands
    const actionCommands = {
        save: Commands.FILE_SAVE,
        "save-all": Commands.FILE_SAVE_ALL,
        cut: Commands.EDIT_CUT,
        copy: Commands.EDIT_COPY,
        paste: Commands.EDIT_PASTE,
        undo: Commands.EDIT_UNDO,
        redo: Commands.EDIT_REDO,
        beautify: "edit.beautifyCode"
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

                // Handle special case for beautify
                if (actionName === "beautify") {
                    // Call beautify function based on Brackets API
                    BeautificationManager.beautifyEditor(editor);
                } else {
                    CommandManager.execute(command);
                }
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
        $("#save-button, #beautify-button").toggleClass("disabled", !hasDocument);

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
        $actionBar.on("click", ".button:not(.disabled)", function () {
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
        $(EditorManager).on("activeEditorChange", function () {
            const editor = EditorManager.getActiveEditor();
            if (editor) {
                // Make sure we're using the proper CodeMirror event for selection changes
                $(editor._codeMirror).on("cursorActivity", updateButtonStates);
                updateButtonStates(); // Update immediately when editor changes
            }
        });
    }

    /**
     * Toggles the visibility of the action bar
     */
    function toggleActionBar() {
        if (actionBarVisible) {
            // Hide the action bar
            $actionBar.hide();
            actionBarVisible = false;
        } else {
            // Show the action bar
            $actionBar.show();
            actionBarVisible = true;
        }

        // Update the workspace layout after toggling
        setTimeout(function () {
            WorkspaceManager.recomputeLayout(true);
            $(window).trigger("resize");
        }, 0);

        // Update the command checkbox state
        CommandManager.get(TOGGLE_ACTION_BAR).setChecked(actionBarVisible);
    }

    /**
     * Used to initialize the action bar stuff.
     * Here we add the action bar to the editor and recompute the layout
     */
    function init() {
        // Insert the action bar between titlebar and editor-holder
        // But don't recompute immediately
        $("#titlebar").after($actionBar);

        // Set a specific fixed height on the action-bar-container to ensure proper rendering
        $(".action-bar-container").css("height", "26px");

        // Let the styles apply first
        setTimeout(function () {
            // Get the exact height after styles are applied
            const actionBarHeight = $(".action-bar-container").outerHeight();

            // Now recompute layout after adjustment
            WorkspaceManager.recomputeLayout(true);

            // Update panel sizes after a small delay to ensure everything settled
            setTimeout(function () {
                $(window).trigger("resize");
                WorkspaceManager.recomputeLayout(true);
            }, 100);
        }, 0);

        updateButtonStates();
    }

    /**
     * Registers the view menu command for toggling the action bar
     */
    function registerViewMenuItem() {
        // Register command
        CommandManager.register("Toggle Action Bar", TOGGLE_ACTION_BAR, toggleActionBar);

        // Set the initial state to checked (visible)
        CommandManager.get(TOGGLE_ACTION_BAR).setChecked(true);

        // Add to View menu
        const viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        viewMenu.addMenuItem(TOGGLE_ACTION_BAR, null, Menus.AFTER, Commands.VIEW_HIDE_SIDEBAR);
    }

    AppInit.appReady(function () {
        init();
        registerHandlers();
        registerViewMenuItem(); // Register the View menu item
    });
});
