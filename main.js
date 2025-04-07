define(function (require, exports, module) {
    "use strict";

    const AppInit = brackets.getModule("utils/AppInit");
    const ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
    const WorkspaceManager = brackets.getModule("view/WorkspaceManager");

    const ActionBarHTML = require("text!./html/actionBar.html");
    ExtensionUtils.loadStyleSheet(module, 'styles/actionBar.css');

    /**
     * This will hold the action bar element
     * @const
     */
    const $actionBar = $(ActionBarHTML);
    

    /**
     * Registers click handlers for all the action bar buttons
     */
    function registerHandlers() {
        // event delegation with a single handler for all buttons
        $actionBar.on("click", ".button", function() {
            const buttonId = $(this).attr("id");
            // all the buttons has id in the format 'cut-button', 'paste-button',
            // so to get the name, we remove '-button'
            const actionName = buttonId.replace("-button", "");
            console.log(actionName + " button clicked from action bar");
        });
    }
    

    /**
     * Used to initialize the action bar stuff.
     * Here we add the action bar to the editor and recompute the layout
     */
    function init() {
        $(".not-editor").before($actionBar);
        WorkspaceManager.recomputeLayout(true);
    }


    AppInit.appReady(function () {
        init();
        registerHandlers();
    });
});
