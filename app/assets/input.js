console.log("hello world");
var down = new Set(); // For simultaneous key press
var IsCapsLockOn = false;
var output = document.getElementById("output");
var modifiers = {};
var keymap = {};

function loadKeymaps(keymapStr) {
  console.log(keymapStr);
  let obj = JSON.parse(keymapStr);
  modifiers = obj.modifiers;
  keymap = obj.keymap;
}

// function toUIKitFlags(e){

// }

// // https://github.com/blinksh/blink/blob/847298f9a1bc99848989fbbf5d3afd7cef51449f/KB/JS/src/Keyboard.ts#L267
// function _updateUIKitModsIfNeeded(e){
//   let code = e.code;
//   if (modifiers['capsLockKey'] !== "capsLockKey") {
//     let mods = 0;
//     if (e.type == 'keyup' && code == 'CapsLock') {
//       mods = 0;
//     } else {
//       mods = toUIKitFlags(e);
//     }
//   }
//   window.ReactNativeWebView.postMessage(JSON.stringify({mods: mods, postFor: "capslock"}));
// }

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

function handleCapsLock(e) {
  down.delete("CapsLock");
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ isCapsLockOn: !IsCapsLockOn, postFor: "capsLockState" })
  );
  Array.from(down)
    .filter(k => /^\\S$/.test(k))
    .map(k => {
      let pressedKeys = {
        key: k,
        modifiers: {
          ctrlKey: down.has("Control"),
          altKey: down.has("Alt"),
          shiftKey: down.has("Shift"),
          capslockKey: true,
          metaKey: down.has("Meta")
        }
      };
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ keys: pressedKeys, postFor: "pressedKeys" })
      );
    });
}

function sendKeys() {
  if (down.size > 1) {
    Array.from(down)
      .filter(k => /^\\S$/.test(k))
      .map(k => {
        let pressedKeys = {
          key: k,
          modifiers: {
            ctrlKey: down.has("Control"),
            altKey: down.has("Alt"),
            shiftKey: down.has("Shift"),
            capslockKey: false,
            metaKey: down.has("Meta")
          }
        };
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ keys: pressedKeys, postFor: "pressedKeys" })
        );
      });
    down.clear();
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
