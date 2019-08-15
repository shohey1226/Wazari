//
export enum KeyMode {
  // No keymap applied
  Direct = "direct",

  // Only input keymap
  Terminal = "terminal",

  // Both browser and input keymap
  Text = "text",

  //  Only browser keymap
  Browser = "browser",

  // Address/Search bar
  Search = "search"
}
/*

+----------+----------+-------------------+
| RN mode  | iOS mode |    iOS Keymap     |
+----------+----------+-------------------+
| search   | text     | app+browser+input |
| text     | text     | app+browser+input |
| direct   | n/a      | n/a turned-off    |
| terminal | input    | app+input         |
| browser  | browser  | app+browser       |
+----------+----------+-------------------+

*/
