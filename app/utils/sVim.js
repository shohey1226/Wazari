import RNFS from "react-native-fs";

// https://github.com/flipxfx/sVim
// To use hit-a-hint, changed
// *) Removed safari object
// *) Added Line#482 to avoid duplicated alphabet
//
//
export default {
  async init(f) {
    this.sVimHint = await RNFS.readFile(`${RNFS.MainBundlePath}/sVimHint.js`);
    this.sVimTab = await RNFS.readFile(`${RNFS.MainBundlePath}/sVimTab.js`);
    this.sVimHelper = await RNFS.readFile(
      `${RNFS.MainBundlePath}/sVimHelper.js`
    );
    f();
  },

  sVimGlobal: `
var sVimGlobal = {};
sVimGlobal.settings = {};

// // Load default settings
sVimGlobal.settings.preventdefaultesc     = true;
sVimGlobal.settings.smoothscroll          = true;
sVimGlobal.settings.fullpagescrollpercent = 85;
sVimGlobal.settings.lastactivetablimit    = 25;
sVimGlobal.settings.lastclosedtablimit    = 25;
sVimGlobal.settings.scrollduration        = 30;
sVimGlobal.settings.scrollstep            = 60;
sVimGlobal.settings.zoomstep              = 10;
sVimGlobal.settings.barposition           = "bottom";
sVimGlobal.settings.hintcharacters        = "asdfghjkl";
sVimGlobal.settings.homeurl               = "topsites://";
sVimGlobal.settings.mapleader             = "\\\\";
sVimGlobal.settings.newtaburl             = "topsites://";
sVimGlobal.settings.blacklists            = [];

// Load default shortcuts (private setting)
sVimGlobal.settings.shortcuts = {
  // Movement
  "j"             : "scrollDown",
  "k"             : "scrollUp",
  "h"             : "scrollLeft",
  "l"             : "scrollRight",
  "d"             : "scrollPageDown",
  "e"             : "scrollPageUp",
  "u"             : "scrollPageUp",
  "shift+d"       : "scrollFullPageDown",
  "shift+e"       : "scrollFullPageUp",
  "shift+g"       : "scrollToBottom",
  "g g"           : "scrollToTop",
  "0"             : "scrollToLeft",
  "$"             : "scrollToRight",
  "g i"           : "goToInput",
  // Miscellaneous
  "r"             : "reloadTab",
  "z i"           : "zoomPageIn",
  "z o"           : "zoomPageOut",
  "z 0"           : "zoomOrig",
  "g r"           : "toggleReader",
  "g v"           : "showsVimrc",
  "g ?"           : "help",
  // Tab Navigation
  "g t"           : "nextTab",
  "shift+k"       : "nextTab",
  "g shift+t"     : "previousTab",
  "shift+j"       : "previousTab",
  "g 0"           : "firstTab",
  "g $"           : "lastTab",
  "g l"           : "lastActiveTab",
  "x"             : "quit",
  "g x shift+t"   : "closeTabLeft",
  "g x t"         : "closeTabRight",
  "g x 0"         : "closeTabsToLeft",
  "g x $"         : "closeTabsToRight",
  "shift+x"       : "lastClosedTab",
  "ctrl+shift+x"  : "lastClosedTabBackground",
  "t"             : "newTab",
  "shift+h"       : "goBack",
  "shift+l"       : "goForward",
  "shift+,"       : "moveTabLeft",
  "shift+."       : "moveTabRight",
  "g u"           : "parentDirectory",
  "g shift+u"     : "topDirectory",
  "g d"           : "parentDomain",
  "g h"           : "homePage",
  // Window Navigation
  "w"             : "newWindow",
  "g w"           : "nextWindow",
  "g shift+w"     : "previousWindow",
  // Modes
  "escape"        : "normalMode",
  "ctrl+["        : "normalMode",
  "i"             : "insertMode",
  // Link Hints
  "f"             : "createHint",
  "shift+f"       : "createTabbedHint",
  //FIXX "ctrl+shift+f"  : "createActiveTabbedHint"
};

sVimTab.settings = sVimGlobal.settings;

// Adding style on hints
var head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
var css = '.sVim-hint.sVim-hint-form {background-color: #3EFEFF;}';    
css += ' .sVim-hint.sVim-hint-focused {opacity: 1;font-weight: bold;}';
css += ' .sVim-hint { background-color: #FFFF01; color: #000000;font-size: 12pt;font-family: monospace;line-height: 10pt; padding: 0px;opacity: 0.8; letter-spacing: 0.2em;}';
css += ' #sVim-command { -webkit-animation: fadein .2s !important; -webkit-appearance: none !important; background-color: rgba(0, 0, 0, 0.80) !important;  background-position: none !important;  background-repeat: none !important;  border-radius: 0 !important;  border: 0 !important;  box-shadow: none !important;  box-sizing: content-box !important;  color: #FFFFFF !important;  display: none;  font-family: "Helvetica Neue" !important;  font-size: 13px !important;  font-style: normal !important;  left: 0 !important;  letter-spacing: normal !important;  line-height: 1 !important;  margin: 0 !important;  min-height: 0 !important;  outline-style: none !important;  outline: 0 !important;  padding: 2px 0 0 10px !important;  position: fixed !important;  right: 0 !important;  text-align: start !important;  text-indent: 0px !important;  text-shadow: none !important;  text-transform: none !important;  vertical-align: none !important;  width: 100% !important;  word-spacing: normal !important;  z-index: 2147483647 !important;}';
css += ' @-webkit-keyframes fadein {  from {    opacity: 0;  }  to {    opacity: 1;  }}';
style.type = 'text/css';
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
head.appendChild(style);


`,

  sVimPredefine: `
safari = {
  self: {
    addEventListener: function(msg, cb){
      //
    },
    tab: {
      dispatchMessage: function(msg){
        //
      },

    }
  }
};
`
};
