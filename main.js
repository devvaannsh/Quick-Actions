define(function (require, exports, module) {
    "use strict";

    const AppInit = brackets.getModule("utils/AppInit");
    const ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
    
    const ActionBarHTML = require("text!./html/actionBar.html");
    ExtensionUtils.loadStyleSheet(module, 'styles/actionBar.css');

    /**
     * This will hold the action bar element
     * @const
     */
    const $actionBar = $(ActionBarHTML);

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
    });
});
