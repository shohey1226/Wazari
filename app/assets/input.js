var isCapsLockOn = false;
var isCapsLockRemapped = false;
var down = false;

function init(initStr) {
  let initObj = JSON.parse(initStr);
  isCapsLockRemapped = initObj.isCapsLockRemapped;
}

function onKeyPress(e) {
  let key = e.key;
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
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          repeat: e.repeat
        },
        postFor: e.type
      })
    );

  if (isCapsLockRemapped) {
    if (e.type === "keydown") {
      down[e.key] = new Date().getTime();

      // Need to handle input depending on software capslock
      if (/^[A-Za-z]$/.test(key)) {
        e.preventDefault();
        e.stopPropagation();
        let inputKey =
          isCapsLockOn === true ? key.toUpperCase() : key.toLowerCase();
        updateInputValue(inputKey);
      }
    } else if (e.type == "keyup") {
      down[e.key] && delete down[e.key];
    }
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
}

function capslockKeyUp() {
  down["CapsLock"] && delete down["CapsLock"];
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

///////////////////////////////////////////////////////////////////////////////
// Main (or setup)
///////////////////////////////////////////////////////////////////////////////

var inputField = document.getElementById("search");
inputField.setAttribute("autocorrection", false);
inputField.setAttribute("spellcheck", "false");
inputField.setAttribute("autocomplete", "off");
inputField.setAttribute("autocorrect", "off");
inputField.setAttribute("autocapitalize", "none");
// call the same onKeyPress but use e.type to dispatch keyup or keydown
inputField.addEventListener("keydown", onKeyPress, false);
inputField.addEventListener("keyup", onKeyPress, false);
true;
