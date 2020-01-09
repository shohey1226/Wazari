const UIKeyModifierAlphaShift = 1 << 16;
const UIKeyModifierShift = 1 << 17;
const UIKeyModifierControl = 1 << 18;
const UIKeyModifierAlternate = 1 << 19;
const UIKeyModifierCommand = 1 << 20;

function _toCapitalizedWords(name: string) {
  var words = name.match(/[A-Za-z][a-z]*/g);
  return words.map(_capitalize).join(" ");
}
function _capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.substring(1);
}

module.exports = {
  convertToNativeFormat(keymap, modifiers) {
    /*
      exmpale, capslock => ctrl

      // in reducer
      modifiers: {
        capslockKey: "ctrlKey", // *changed
        ctrlKey: "ctrlKey",
        altKey: "altKey",
        metaKey: "metaKey"
      },      

      desktop: {
        actionA: {
          key: 'a'
          modifiers: {
            ctrlKey: true
            metaKey: true
            // others are false
          }
        }
      }

      When capslock+meta+a is pressed, then actionA should perform

     */

    let keyObj = {};
    for (let action in keymap) {
      let key = keymap[action].key; // action: actionA, key: a
      let mods = [];

      // 1. Collect all modifiers  [[ctrl, capslock], [meta]]
      for (let mod in keymap[action].modifiers) {
        if (keymap[action].modifiers[mod]) {
          let myMods = [];
          if (mod === "shiftKey") {
            myMods.push(mod);
          } else {
            for (let myMod in modifiers) {
              if (modifiers[myMod] === mod) {
                myMods.push(myMod);
              }
            }
          }
          mods.push(myMods);
        }
      }
      //console.log("mods", mods);

      // 2. Combination [[ctrl, capslock], [meta]] to [[ctrl,meta], [capslock, meta]]
      // http://yebisupress.dac.co.jp/2015/11/16/js-combination/
      // 組み合わせの総数
      let total = 1;
      for (let myMods of mods) {
        total *= myMods.length;
      }
      var q, // 商, ループ中の配列で表現できない数
        r, // 余り, ループ中の配列で表現する数
        result = []; // 組み合わせを格納する配列
      for (var n = 0; n < total; n++) {
        result[n] = [];
        q = n;
        for (let mMods of mods) {
          r = q % mMods.length;
          q = Math.floor(q / mMods.length);
          result[n].push(mMods[r]);
        }
      }

      //console.log("result", result);
      if (key === "Tab") {
        key = "\t";
      }

      // 3 Do OR bit operation against the result
      for (let nMods of result) {
        let bitModifier = 0;
        for (let myMod of nMods) {
          switch (myMod) {
            case "shiftKey":
              bitModifier = bitModifier | UIKeyModifierShift;
              break;
            case "altKey":
              bitModifier = bitModifier | UIKeyModifierAlternate;
              break;
            case "capslockKey":
              bitModifier = bitModifier | UIKeyModifierAlphaShift;
              break;
            case "metaKey":
              bitModifier = bitModifier | UIKeyModifierCommand;
              break;
            case "ctrlKey":
              bitModifier = bitModifier | UIKeyModifierControl;
              break;
          }
        }
        keyObj[
          `${key}:*:${bitModifier}:*:${_toCapitalizedWords(action)}`
        ] = action;
      }
    }

    return keyObj;
  }
};
