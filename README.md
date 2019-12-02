# Wazari Browser


An iOS/iPadOS app to handle browser with only external keyboard 

![github_issue_without_touch](https://user-images.githubusercontent.com/1880965/67365457-a69d0880-f5ac-11e9-84ef-06d448a7c4c6.gif)

Wazari Browser is an oepn source and you can down load iOS app from
[here](https://apps.apple.com/us/app/wazari-browser/id1475585924?mt=8).

This project is a part of [Wazaterm](https://www.wazaterm.com) which is a cloud terminal to run anywhere on any devices.

## Document

[Go to this page](https://www.wazaterm.com/wazaribrowser)


## Feature

- Customizable shortcuts to operate browser. e.g. Change tabs without touching screen.
- Panes to split views vertiacally or horizontally.
- Hit-A-Hint - without touching, click links to move pages.
- Customizable modifiers. e.g. swap capslock with ctrl key.
- Customizable default search engine - DuckDuckGo or Google
- Exclude web sites not to use keymapping. Some dynamic web site doesn't use Input type=text or textarea, which Wazari keymapping doesn't work. But you can exclude these website so you can still type on it.
- Histories to go back easily
- (Optional and Paying serivce) Integrated to [Wazaterm](https:/www.wazaterm.com) so you can terminal.

## Shortcuts

You can modify shortcuts in setting page. OS maybe already took the shortcut. In this case, please try to set other keys.

### Panel actions

| Shortcut key | Description           |
| ------------ | --------------------- |
| Alt-"        | Add row pane          |
| Alt-%        | Add column pange      |
| Alt-x        | Remove current pane   |
| Alt-o        | Move to next pane     |
| Alt-;        | Move to previous pane |
| Alt-}        | Increase Pane size    |
| Alt-{        | Decrese Pane size     |

### Browser actions

| Shortcut key  | Description                           |
| ------------- | ------------------------------------- |
| Command-[     | Back page                             |
| Command-]     | Forward page                          |
| Command-r     | Reload Page                           |
| Ctrl-i        | Show Hit-a-hint                       |
| Ctrl-+        | Zoom in                               |
| Ctrl--        | Zoom out (Ctrl with dash/minus)       |
| Alt-i         | Focus on search                       |
| Alt-t         | Toggle wazari inputs(e.g. hit-a-hint) |
| Alt-Tab       | Move to next tab                      |
| Alt+Shift-Tab | Move to previous tab                  |
| Command-t     | Open homepage with a new tab          |
| Command-w     | Remove current tab                    |

Use defualt `space` to scroll down and `shift-space` to scroll up.

### Text actions

| Shortcut key | Description                         |
| ------------ | ----------------------------------- |
| Command-c    | Copy on input focus                 |
| Command-v    | Paste on input focus                |
| Ctrl-a       | Home(Move cursor to the start)      |
| Ctrl-e       | End(Move cursor to the end )        |
| Ctrl-h       | Delete one char before the cursor   |
| Ctrl-d       | Delete one char after the cursor    |
| Ctrl-b       | Move cursor back one char           |
| Ctrl-k       | Delete entire text in focused input |
| Ctl-f        | Move cursor forward one char        |
| Ctrl-n       | Move down one line                  |
| Ctrl-p       | Move up one line                    |

## Bugs/Issues

Please raise bugs/issues in Github issues. It would be really helpful if you mention how to replicate it.

### (Optional) Wazaterm 

If you want to use terminal(or Linux envrionment) from iOS/iPadOS. Try [Wazaterm](https://www.wazaterm.com)!

![Simulator Screen Shot - iPad Pro (11-inch) - 2019-09-13 at 09 07 19](https://user-images.githubusercontent.com/1880965/64829180-54101a00-d606-11e9-8821-4197849bf65f.png)
