var isCapsLockOn = false;
var isCapsLockRemapped = false;
var down = false;

function init(initStr) {
  let initObj = JSON.parse(initStr);
  isCapsLockRemapped = initObj.isCapsLockRemapped;
}

function onKeyPress(e) {
  // https://developer.mozilla.org/ja/docs/Web/API/Document/keydown_event
  if (e.isComposing || (e.keyCode === 229 && e.repeat === false)) {
    return true;
  }

  let key = e.key;

  // for some reason, it comes with charcode 710. It looks ^ but it's not
  if (key.charCodeAt(0) === 710 && key.length === 2) {
    key = key.substr(1);
    // updateInputValue(key);
    // e.preventDefault();
    // e.stopPropagation();
  }

  // Handle alt-code. RN only needs to know the code but not key, like ©,å,,,.
  if (e.altKey) {
    // the both which and keyCode are deprecated but it's handy.
    let code = event.which || event.keyCode;
    key = String.fromCharCode(code);
  }
  window.ReactNativeWebView &&
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        keyEvent: {
          key: key,
          type: e.type,
          modifiers: {
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey
          }
        },
        postFor: e.type
      })
    );

  if (isCapsLockRemapped) {
    down[e.key] = new Date().getTime();

    // Need to handle input depending on software capslock
    if (/^[A-Za-z]$/.test(key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (e.type === "keyup" && /^[ -~]|Enter$/.test(key)) {
    var el = document.activeElement;
    sendTextValue(el.value);
  }
}

function updateInputValue(key) {
  var el = document.activeElement;
  var startPosition = el.selectionStart;
  var value = el.value;

  el.value = value.slice(0, startPosition) + key + value.slice(startPosition);
  if (el.createTextRange) {
    var part = el.createTextRange();
    part.move("character", startPosition + 1);
    part.select();
  } else if (el.setSelectionRange) {
    el.setSelectionRange(startPosition + 1, startPosition + 1);
  }
  //sendTextValue(el.value);
}

function sendTextValue(value) {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ words: value, postFor: "inputValue" })
  );
}

function processEnter() {
  var el = document.activeElement;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ words: el.value, postFor: "enterValue" })
  );
}

function capslockKeyUp() {
  down["CapsLock"] && delete down["CapsLock"];
}

function updateText(text) {
  var el = document.activeElement;
  if (text !== el.value) {
    el.value = text;
  }
}

///////////////////////////////////////////////////////////////////////////////
// cursor handling
///////////////////////////////////////////////////////////////////////////////

function cursorToBeginning() {
  var inp = document.activeElement;
  if (!inp.value) {
    return;
  }
  var pos = inp.value.lastIndexOf("\n", inp.selectionStart - 1);
  if (inp.setSelectionRange) {
    inp.setSelectionRange(pos + 1, pos + 1);
  }
}

function cursorToEnd() {
  var inp = document.activeElement;
  if (!inp.value) {
    return;
  }
  var pos = inp.value.indexOf("\\n", inp.selectionStart);
  if (pos === -1) {
    pos = inp.value.length;
  }
  if (inp.setSelectionRange) {
    inp.setSelectionRange(pos, pos);
  }
}

function deleteLine() {
  var el = document.activeElement;
  if (!el.value) {
    return;
  }
  var endPos = el.value.indexOf("\n", el.selectionStart);
  if (endPos === -1) {
    endPos = el.value.length;
  }
  var caretPos = el.selectionStart;
  var content = el.value;
  var words = content.substring(caretPos, endPos);
  if (words) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ selection: words, postFor: "copy" })
    );
  }
  el.value =
    content.substring(0, caretPos) + content.substring(endPos, content.length);
  el.setSelectionRange(caretPos, caretPos);
}

function deletePreviousChar() {
  var el = document.activeElement;
  if (!el.value) {
    return;
  }
  var caretPosStart = el.selectionStart;
  var caretPosEnd = el.selectionEnd;
  var content = el.value;
  if (caretPosStart > 0) {
    el.value =
      content.substring(0, caretPosStart - 1) +
      content.substring(caretPosEnd, content.length);
    el.setSelectionRange(caretPosStart - 1, caretPosStart - 1);
  }
}

function deleteNextChar() {
  var el = document.activeElement;
  if (!el.value) {
    return;
  }
  var caretPosStart = el.selectionStart;
  var caretPosEnd = el.selectionEnd;
  var content = el.value;
  if (caretPosEnd < content.length) {
    el.value =
      content.substring(0, caretPosStart) +
      content.substring(caretPosEnd + 1, content.length);
    el.setSelectionRange(caretPosStart, caretPosStart);
  }
}

function moveBackOneChar() {
  var inp = document.activeElement;
  if (!inp.value) {
    return;
  }
  var caretPos = inp.selectionStart;
  if (caretPos > 0) {
    if (inp.createTextRange) {
      var part = inp.createTextRange();
      part.move("character", caretPos - 1);
      part.select();
    } else if (inp.setSelectionRange) {
      inp.setSelectionRange(caretPos - 1, caretPos - 1);
    }
  }
}

function moveForwardOneChar() {
  var inp = document.activeElement;
  if (!inp.value) {
    return;
  }
  var caretPos = inp.selectionStart;
  if (caretPos < inp.value.length) {
    if (inp.createTextRange) {
      var part = inp.createTextRange();
      part.move("character", caretPos + 1);
      part.select();
    } else if (inp.setSelectionRange) {
      inp.setSelectionRange(caretPos + 1, caretPos + 1);
    }
  }
}

function deleteLine() {
  var el = document.activeElement;
  if (!el.value) {
    return;
  }
  var endPos = el.value.indexOf("\\n", el.selectionStart);
  if (endPos === -1) {
    endPos = el.value.length;
  }
  var caretPos = el.selectionStart;
  var content = el.value;
  var words = content.substring(caretPos, endPos);
  if (words) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ selection: words, postFor: "copy" })
    );
  }
  el.value =
    content.substring(0, caretPos) + content.substring(endPos, content.length);
  el.setSelectionRange(caretPos, caretPos);
}

function copyToRN() {
  var selObj = window.getSelection();
  var selectedText = selObj.toString();
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ selection: selectedText, postFor: "copy" })
  );
}

function pasteFromRN(words) {
  var el = document.activeElement;
  if (!el) {
    return;
  }
  var content = el.value;
  var caretPos = el.selectionStart;
  el.value =
    content.substring(0, caretPos) +
    words +
    content.substring(caretPos, content.length);
  el.setSelectionRange(caretPos + words.length, caretPos + words.length);
}

///////////////////////////////////////////////////////////////////////////////
// Main (or setup)
///////////////////////////////////////////////////////////////////////////////

var inputField = document.getElementById("search");
// call the same onKeyPress but use e.type to dispatch keyup or keydown
inputField.addEventListener("keydown", onKeyPress, false);
inputField.addEventListener("keyup", onKeyPress, false);
inputField.setAttribute("autocorrection", false);
inputField.setAttribute("spellcheck", "false");
inputField.setAttribute("autocomplete", "off");
inputField.setAttribute("autocorrect", "off");
inputField.setAttribute("autocapitalize", "none");

true;
