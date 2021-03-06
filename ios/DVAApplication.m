//
//  DVAApplication.m
//
//  Created by Shohei Kameda on 2017/09/18.
//  Copyright © 2019 Wazalab. All rights reserved.
//
// http://blog.swilliams.me/words/2013/09/19/handling-keyboard-events-with-modifier-keys-in-ios-7/

#import <Foundation/Foundation.h>
#import "DVAApplication.h"
#import "DAVKeyManager.h"


@interface KeyCommand: UIKeyCommand
@end

@implementation KeyCommand {
  SEL _up;
}

- (void)setUp:(SEL) action {
  _up = action;
}

- (SEL)upAction {
  return _up;
}

@end


@implementation DVAApplication

NSArray<UIKeyCommand *> *_keyCommands;
KeyCommand *_activeModsCommand;

- (id)init
{
  NSLog(@"init DVAApplication now");
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(appKeymapReceived:) name:@"appKeymap" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(modsReceived:) name:@"mods" object:nil];
  self = [super init];
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"appKeymap", @"mods"];
}

///////////////////////////////////////////////////////////////////
// Capslock handling
///////////////////////////////////////////////////////////////////

- (void)modsReceived:(NSNotification *)notification
{
  NSLog(@"Notification - You recieved mod key in DVAApplication");
  NSNumber *mods = notification.userInfo[@"mods"];
  int _trackingModifierFlags = (UIKeyModifierFlags)mods.integerValue;
  NSLog(@"ModifierFlag: %d", _trackingModifierFlags);
  if (_trackingModifierFlags == 0) {
    _activeModsCommand = nil;
  } else {
    _activeModsCommand = [self _modifiersCommand:_trackingModifierFlags];
  }
  [self _rebuildKeyCommands];
}

- (KeyCommand *)_modifiersCommand:(UIKeyModifierFlags) flags {
  KeyCommand *cmd = [KeyCommand keyCommandWithInput:@"" modifierFlags:flags action:@selector(_keyDown:)];
  //[cmd setUp: @selector(_keyUp:)];
  return cmd;
}

- (void)_keyDown:(KeyCommand *)cmd {
  //[self report:@"mods-down" arg:@(cmd.modifierFlags)];
  NSLog(@"mods-down");
  NSDictionary *userInfo = @{@"action": @"mods-down", @"flags": @(cmd.modifierFlags)};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"modPressed" object:self userInfo:userInfo];
}

- (void)_keyUp:(KeyCommand *)cmd {
  //[self report:@"mods-up" arg:@(cmd.modifierFlags)];
  NSDictionary *userInfo = @{@"action": @"mods-up",  @"flags": @(cmd.modifierFlags)};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"modPressed" object:self userInfo:userInfo];
}

///////////////////////////////////////////////////////////////////
// App keymap
///////////////////////////////////////////////////////////////////

- (void)appKeymapReceived:(NSNotification *)notification
{
  NSLog(@"Notification - You recieved appKeymap!");
  _appKeymap = notification.userInfo[@"appKeymap"];
  [self _rebuildKeyCommands];
}

// Get action from keymap(_appKeymap) and pass it to RN through DAVKeyManager
- (void)handleAppCommand:(UIKeyCommand *)command {
  
    NSLog(@"handle App command!!");
    UIKeyModifierFlags modifierFlags = command.modifierFlags;
    NSString *input = command.input;
    NSDictionary *_keymap = _appKeymap;
  
    for (NSString* keyMod in [_keymap allKeys]) {
      NSArray *keyModArray = [keyMod componentsSeparatedByString:@":*:"];
      NSString* key = keyModArray[0];
      NSString* modStr = keyModArray[1];
      NSInteger intMod = [[modStr stringByTrimmingCharactersInSet:[[NSCharacterSet decimalDigitCharacterSet] invertedSet]] intValue];
      if(intMod == modifierFlags && input == key){
        NSString *action = [ _keymap objectForKey:keyMod];
        NSLog(@"action: %@", action);
        NSDictionary *userInfo = @{@"action": action};
        [[NSNotificationCenter defaultCenter] postNotificationName:@"AppKeyEvent" object:self userInfo:userInfo];
        break;
      }
    }
}


// Rebuild key commands
- (void)_rebuildKeyCommands {
  NSMutableArray *cmds = [[NSMutableArray alloc] init];
  
  // Add capslock handling
  if (_activeModsCommand) {
    [cmds addObject:_activeModsCommand];
  }
  
  // app keys are used all the time
  NSDictionary* _keymap = _appKeymap;
  NSArray *keys = [_keymap allKeys];
  // Sort with value of dictionary
  // https://stackoverflow.com/questions/11554780/objective-c-sort-keys-of-nsdictionary-based-on-dictionary-entries
  NSArray *sortedKeys = [keys sortedArrayUsingComparator:^NSComparisonResult(id a, id b) {
      NSString *first = [_keymap objectForKey:a];
      NSString *second = [_keymap objectForKey:b];
      return [first compare:second];
  }];
    
  for (NSString* keyMod in sortedKeys) {
    NSArray *keyModArray = [keyMod componentsSeparatedByString:@":*:"];
    NSString* key = keyModArray[0];
    NSString* modStr = keyModArray[1];
    NSString* title = keyModArray[2];
    NSInteger intMod = [[modStr stringByTrimmingCharactersInSet:[[NSCharacterSet decimalDigitCharacterSet] invertedSet]] intValue];
    [cmds addObject:[UIKeyCommand keyCommandWithInput:key modifierFlags:intMod action:@selector(handleAppCommand:) discoverabilityTitle:title]];
  }
  
  // Control can't be detected when keycommands are override. No root cause can be found on Dec 26, 2019
  // Interestingly, keyup of Control starts to work after this.
  [cmds addObject:[UIKeyCommand keyCommandWithInput:@"" modifierFlags:UIKeyModifierControl action:@selector(_keyDown:)]];
  
  _keyCommands = cmds;
}

/* ============================================================================================================
This is main function for keymapping - API to call key notification to RN side.
=============================================================================================================== */
- (NSArray *)keyCommands {
  return _keyCommands;
}

- (BOOL)canBecomeFirstResponder {
  return YES;
}


@end
