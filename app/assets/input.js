var IsCapsLockOn = false;

function onKeydown(e) {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      keyEvent: {
        key: e.key,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey
      },
      postFor: e.type
    })
  );
}

function onKeyup(e) {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      keyEvent: {
        key: e.key,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey
      },
      postFor: e.type
    })
  );
}

var inputField = document.getElementById("search");
inputField.setAttribute("autocorrection", false);
inputField.setAttribute("spellcheck", "false");
inputField.setAttribute("autocomplete", "off");
inputField.setAttribute("autocorrect", "off");
inputField.setAttribute("autocapitalize", "none");
inputField.addEventListener("keydown", onKeydown, false);
inputField.addEventListener("keyup", onKeyup, false);
true;
