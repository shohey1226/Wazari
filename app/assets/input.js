console.log("hello world");
var down = new Set(); // For simultaneous key press
var IsCapsLockOn = false;
var output = document.getElementById("output");
var modifiers = {};
var keymap = {};

// https://github.com/blinksh/blink/blob/847298f9a1bc99848989fbbf5d3afd7cef51449f/KB/JS/src/UIKeyModifierFlags.ts
const UIKeyModifierAlphaShift = 1 << 16; // This bit indicates CapsLock
const UIKeyModifierShift = 1 << 17;
const UIKeyModifierControl = 1 << 18;
const UIKeyModifierAlternate = 1 << 19;
const UIKeyModifierCommand = 1 << 20;
const UIKeyModifierNumericPad = 1 << 21;

function toUIKitFlags(e) {
  let res = 0;
  if (e.shiftKey) {
    res |= UIKeyModifierShift;
  }
  if (e.ctrlKey) {
    res |= UIKeyModifierControl;
  }
  if (e.altKey) {
    res |= UIKeyModifierAlternate;
  }
  if (e.metaKey) {
    res |= UIKeyModifierCommand;
  }
  res |= UIKeyModifierAlphaShift;
  return res;
}

///////////////////////////////////////////////////////////////////////////////

function log(obj) {
  output.innerText = JSON.stringify(obj);
}

function loadKeymaps(keymapStr) {
  let obj = JSON.parse(keymapStr);
  modifiers = obj.modifiers;
  keymap = obj.keymap;
  console.log(modifiers);
  console.log(keymap);
}

// https://github.com/blinksh/blink/blob/847298f9a1bc99848989fbbf5d3afd7cef51449f/KB/JS/src/Keyboard.ts#L267
function handleCapsLock(e) {
  let code = e.code;
  console.log(code);
  // capslock is remapped
  if (modifiers["capslockKey"] !== "capslockKey") {
    let mods = 0;
    if (e.type == "keyup" && code == "CapsLock") {
      mods = 0;
    } else {
      mods = toUIKitFlags(e);
    }
    console.log(mods);
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ mods: mods, postFor: "capslock" })
    );
  }
}

function onKeydown(e) {
  output.innerText += e.key + " " + e.type + " " + e.keyCode + "|";
  down.add(e.key);
  if (e.key === "CapsLock") {
    handleCapsLock(e);
  } else if (e.key === "Enter") {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ name: "DoneEdit", postFor: "actions" })
    );
  } else if (e.key === "Escape") {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ name: "Close", postFor: "actions" })
    );
  } else {
    sendKeys();
  }
}

function onKeyup(e) {
  down.delete(e.key);
  output.innerText += e.key + " " + e.type + " " + e.keyCode + "|";
  output.innerText += JSON.stringify(Array.from(down));
  if (e.key === "CapsLock") {
    handleCapsLock(e);
  }
}

function onKB(cmd) {
  switch (cmd) {
    case "mods-down":
      _handleCapsLockDown(true);
      break;
    case "mods-up":
      _handleCapsLockDown(false);
      break;
  }
}

function _handleCapsLockDown(isDown) {
  let mod = this._modsMap["CapsLock"];
  if (isDown) {
    down.add("CapsLock");
  } else {
    down.delete("CapsLock");
  }
  sendKeys();
}

function sendKeys() {
  if (down.size > 1) {
    Array.from(down)
      // https://tools.m-bsys.com/data/charlist_ascii.php - ascii
      .filter(k => /^[!-~]$/.test(k))
      .map(k => {
        let pressedKeys = {
          key: k,
          modifiers: {
            ctrlKey: down.has("Control"),
            altKey: down.has("Alt"),
            shiftKey: down.has("Shift"),
            capslockKey: down.has("CapsLock"),
            metaKey: down.has("Meta")
          }
        };
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ keys: pressedKeys, postFor: "pressedKeys" })
        );
      });
  }
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
