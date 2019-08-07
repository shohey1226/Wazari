//
//  DVAApplication.m
//  devAny
//
//  Created by 亀田祥平 on 2017/09/19.
//  Copyright © 2017年 Facebook. All rights reserved.
//
// http://blog.swilliams.me/words/2013/09/19/handling-keyboard-events-with-modifier-keys-in-ios-7/

#import <Foundation/Foundation.h>
#import "DVAApplication.h"

@implementation DVAApplication

- (id)init
{
  NSLog(@"init DVAApplication now");
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(activeModeReceived:) name:@"activeMode" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(appKeymapReceived:) name:@"appKeymap" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(browserKeymapReceived:) name:@"browserKeymap" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(inputKeymapReceived:) name:@"inputKeymap" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(turnOnKeymapReceived:) name:@"turnOnKeymap" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(turnOffKeymapReceived:) name:@"turnOffKeymap" object:nil];
  self = [super init];
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"activeMode", @"appKeymap", @"browserKeymap"];
}

- (void)activeModeReceived:(NSNotification *)notification
{
  NSLog(@"Notification - You recieved mode!");
  _currentMode = notification.userInfo[@"modeName"];
  NSLog(@"mode: %@", _currentMode);
}

- (void)appKeymapReceived:(NSNotification *)notification
{
  NSLog(@"Notification - You recieved appKeymap!");
  _appKeymap = notification.userInfo[@"appKeymap"];
}

- (void)browserKeymapReceived:(NSNotification *)notification
{
  NSLog(@"Notification - You recieved browserKeymap!");
  _browserKeymap = notification.userInfo[@"browserKeymap"];
}

- (void)inputKeymapReceived:(NSNotification *)notification
{
  NSLog(@"Notification - You recieved inputKeymap!");
  _inputKeymap = notification.userInfo[@"inputKeymap"];
}

- (void) turnOnKeymapReceived:(NSNotification *)notification
{
   NSLog(@"Turn on keymap!");
  _keymapEnabled = YES;
}

- (void) turnOffKeymapReceived:(NSNotification *)notification
{
   NSLog(@"Turn off keymap!");
  _keymapEnabled = NO;
}

- (BOOL)canBecomeFirstResponder {
  return YES;
}


// keymap is set on RN side. When there is key set, then execute the handleCommand.
- (NSMutableArray *)buildDAKeymap :(NSString*)mode
{
  NSDictionary* _keymap;
  if([mode isEqual: @"app"]){
    _keymap = _appKeymap;
  }else if([mode isEqual: @"browser"]){
    _keymap = _browserKeymap;
  }
  else if([mode isEqual: @"input"]){
    _keymap = _inputKeymap;
  }
  
  NSMutableArray *_commands = [[NSMutableArray alloc] init];
  for (NSString* keyMod in [_keymap allKeys]) {
    NSArray *keyModArray = [keyMod componentsSeparatedByString:@":*:"];
    NSString* key = keyModArray[0];
    NSString* modStr = keyModArray[1];
    NSInteger intMod = [[modStr stringByTrimmingCharactersInSet:[[NSCharacterSet decimalDigitCharacterSet] invertedSet]] intValue];
    if([mode  isEqual: @"app"]){
      [_commands addObject:[UIKeyCommand keyCommandWithInput:key modifierFlags:intMod action:@selector(handleAppCommand:)]];
    }else if([mode  isEqual: @"browser"]){
      [_commands addObject:[UIKeyCommand keyCommandWithInput:key modifierFlags:intMod action:@selector(handleBrowserCommand:)]];
    }else if([mode  isEqual: @"input"]){
      [_commands addObject:[UIKeyCommand keyCommandWithInput:key modifierFlags:intMod action:@selector(handleInputCommand:)]];
    }
  }
  
  return _commands;
}

// Override keyCommands to handle shortcut or others
// _keymapEnabled: boolean to turn on/off keymapping
// buildDAKeymap(app/browser) to set up keymaps and execute handle*Command funtion
// If activeWindow is not browser, then all keys is changed to push back to RN side - Input
- (NSArray *)keyCommands {

  if(_keymapEnabled == NO){
    return [NSArray array];
  }
  
  NSMutableSet *appKeymapSet = [NSMutableSet setWithArray: [self buildDAKeymap :@"app"]];
  
  if([_currentMode  isEqual: @"browser"]){
    [appKeymapSet addObjectsFromArray:  [self buildDAKeymap :@"browser"]];
  }

  if(!_commands){

    // https://github.com/kishikawakatsumi/KeyboardShortcuts/blob/master/KeyCommands/ViewController.m
    _commands = [[NSMutableArray alloc] init];
    NSString *characters = @"`~!@#$%^&*()_+{}|\":?><1234567890-=qwertyuiop[]asdfghjkl;'zxcvbnm, ./\\";
    for (NSInteger i = 0; i < characters.length; i++) {
      NSString *input = [characters substringWithRange:NSMakeRange(i, 1)];
      
      /* Caps Lock */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierAlphaShift action:@selector(handleCommand:)]];
      /* Shift */
      // [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
      /* Control */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierControl action:@selector(handleCommand:)]];
      /* Option */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierAlternate action:@selector(handleCommand:)]];
      /* Command */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierCommand action:@selector(handleCommand:)]];
      /* Control + Option(Alt) */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierControl | UIKeyModifierAlternate action:@selector(handleCommand:)]];
      /* Control + Command */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierControl | UIKeyModifierCommand action:@selector(handleCommand:)]];
      /* Shift + Command */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierShift | UIKeyModifierCommand action:@selector(handleCommand:)]];
      /* Shift + Control */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierShift | UIKeyModifierControl action:@selector(handleCommand:)]];
      /* Option(Alt) + Command */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierAlternate | UIKeyModifierCommand action:@selector(handleCommand:)]];
      /* Control + Option(Alt) + Command */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:UIKeyModifierControl | UIKeyModifierAlternate | UIKeyModifierCommand action:@selector(handleCommand:)]];
      /* No modifier */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:input modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    }
    
    // shift + alphabet taking care separately
    NSString *alphabets = @"qwertyuiopasdfghjklzxcvbnm";
    for (NSInteger i = 0; i < alphabets.length; i++) {
      NSString *alphabet = [alphabets substringWithRange:NSMakeRange(i, 1)];
      /* Shift */
      [_commands addObject:[UIKeyCommand keyCommandWithInput:alphabet modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
    }
    
    /* Delete */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\b" modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    /* Alt + Delete */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\b" modifierFlags:UIKeyModifierAlternate action:@selector(handleCommand:)]];
    
    /* Tab */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\t" modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    /* Tab + Option(Alt) */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\t" modifierFlags:UIKeyModifierAlternate action:@selector(handleCommand:)]];
    /* Tab + Control */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\t" modifierFlags:UIKeyModifierControl action:@selector(handleCommand:)]];
    /* Tab + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\t" modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Tab + Control + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\t" modifierFlags:UIKeyModifierShift | UIKeyModifierControl action:@selector(handleCommand:)]];
    
    /* Enter */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:@"\r" modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    
    /* Up */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    /* Up + Option(Alt) + Command */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierCommand action:@selector(handleCommand:)]];
    /* Up + Option(Alt) + Control */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierControl action:@selector(handleCommand:)]];
    /* Up + Option(Alt) + Control + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierControl | UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Up + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Up + Alt + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:UIKeyModifierShift | UIKeyModifierAlternate action:@selector(handleCommand:)]];
    /* Up + Option(Alt) */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputUpArrow modifierFlags:UIKeyModifierAlternate action:@selector(handleCommand:)]];
    
    /* Down */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    /* Down + Option(Alt) + Command */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierCommand action:@selector(handleCommand:)]];
    /* Down + Option(Alt) + Control */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierControl action:@selector(handleCommand:)]];
    /* Down + Option(Alt) + Control + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierControl | UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Down + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Alt + Down + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:UIKeyModifierShift | UIKeyModifierAlternate action:@selector(handleCommand:)]];
    /* Down + Command */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputDownArrow modifierFlags:UIKeyModifierCommand action:@selector(handleCommand:)]];
    
    /* Left */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputLeftArrow modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    /* Left + Option(Alt) + Command */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputLeftArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierCommand action:@selector(handleCommand:)]];
    /* Left + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputLeftArrow modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Left + Option(Alt) */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputLeftArrow modifierFlags:UIKeyModifierAlternate action:@selector(handleCommand:)]];
    
    /* Right */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputRightArrow modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    /* Right + Option(Alt) + Command */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputRightArrow modifierFlags:UIKeyModifierAlternate | UIKeyModifierCommand action:@selector(handleCommand:)]];
    /* Right + Shift */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputRightArrow modifierFlags:UIKeyModifierShift action:@selector(handleCommand:)]];
    /* Right + Option(Alt) */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputRightArrow modifierFlags:UIKeyModifierAlternate action:@selector(handleCommand:)]];
    
    
    /* Esc */
    [_commands addObject:[UIKeyCommand keyCommandWithInput:UIKeyInputEscape modifierFlags:kNilOptions action:@selector(handleCommand:)]];
    
  }
  [appKeymapSet addObjectsFromArray:  _commands];
  
  return [appKeymapSet allObjects];

}


- (void)handleAppCommand:(UIKeyCommand *)command {
  NSLog(@"handleAppCommand!!");
  [self _handleDACommand:command :@"app"];
}

- (void)handleBrowserCommand:(UIKeyCommand *)command {
  NSLog(@"handleBrowserCommand!!");
  [self _handleDACommand:command :@"browser"];
}

- (void)handleInputCommand:(UIKeyCommand *)command {
  NSLog(@"handleInputCommand!!");
  [self _handleDACommand:command :@"input"];
}


- (void)_handleDACommand:(UIKeyCommand *)command :(NSString*)mode {
  NSLog(@"handleDACommand!!");
  UIKeyModifierFlags modifierFlags = command.modifierFlags;
  NSString *input = command.input;
  NSDictionary *_keymap;
  NSString *_notificatinName;
  
  if([mode isEqual: @"browser"]){
    _keymap = _browserKeymap;
    _notificatinName = @"BrowserKeyEvent";
  }else if([mode isEqual: @"app"]){
    _keymap = _appKeymap;
    _notificatinName = @"AppKeyEvent";
  }
  
  for (NSString* keyMod in [_keymap allKeys]) {
    NSArray *keyModArray = [keyMod componentsSeparatedByString:@":*:"];
    NSString* key = keyModArray[0];
    NSString* modStr = keyModArray[1];
    NSInteger intMod = [[modStr stringByTrimmingCharactersInSet:[[NSCharacterSet decimalDigitCharacterSet] invertedSet]] intValue];
    if(intMod == modifierFlags && input == key){
      NSString *action = [ _keymap objectForKey:keyMod];
      NSLog(@"action: %@", action);
      NSDictionary *userInfo = @{@"action": action};
      [[NSNotificationCenter defaultCenter] postNotificationName:_notificatinName object:self userInfo:userInfo];
      break;
    }
  }
}


- (void)handleCommand:(UIKeyCommand *)command {
  
  UIKeyModifierFlags modifierFlags = command.modifierFlags;
  NSString *input = command.input;

  NSMutableString *modifierSymbols = [[NSMutableString alloc] init];
  NSMutableString *inputCharacters = [[NSMutableString alloc] init];
  NSDictionary *dict = @{ @"shiftKey" : @NO, @"altKey" : @NO, @"ctrlKey": @NO, @"metaKey": @NO, @"capslockKey": @NO};
  NSMutableDictionary *modifierDict = [ dict mutableCopy ];
  
  // https://github.com/ajaxorg/ace/blob/master/lib/ace/lib/keys.js
  if ((modifierFlags & UIKeyModifierAlphaShift) == UIKeyModifierAlphaShift) {
    [modifierSymbols appendString:@"CapsLock"];
    modifierDict[@"capslockKey"] = @YES;
  }
  if ((modifierFlags & UIKeyModifierShift) == UIKeyModifierShift) {
    [modifierSymbols appendString:@"Shift"];
    modifierDict[@"shiftKey"] = @YES;
  }
  if ((modifierFlags & UIKeyModifierControl) == UIKeyModifierControl) {
    [modifierSymbols appendString:@"Ctrl"];
    modifierDict[@"ctrlKey"] = @YES;
  }
  if ((modifierFlags & UIKeyModifierAlternate) == UIKeyModifierAlternate) {
    [modifierSymbols appendString:@"Alt"];
    modifierDict[@"altKey"] = @YES;
  }
  if ((modifierFlags & UIKeyModifierCommand) == UIKeyModifierCommand) {
    [modifierSymbols appendString:@"Meta"];
    modifierDict[@"metaKey"] = @YES;
  }
  
  if ([input isEqualToString:@"\b"]) {
    [inputCharacters appendFormat:@"%@", @"Backspace"];
  }
  if ([input isEqualToString:@"\t"]) {
    [inputCharacters appendFormat:@"%@", @"Tab"];
  }
  if ([input isEqualToString:@"\r"]) {
    [inputCharacters appendFormat:@"%@", @"Return"];
  }
  if (input == UIKeyInputUpArrow) {
    [inputCharacters appendFormat:@"%@", @"Up"];
  }
  if (input == UIKeyInputDownArrow) {
    [inputCharacters appendFormat:@"%@", @"Down"];
  }
  if (input == UIKeyInputLeftArrow) {
    [inputCharacters appendFormat:@"%@", @"Left"];
  }
  if (input == UIKeyInputRightArrow) {
    [inputCharacters appendFormat:@"%@", @"Right"];
  }
  if (input == UIKeyInputEscape) {
    [inputCharacters appendFormat:@"%@", @"Esc"];
  }
  
  if (input.length > 0 && inputCharacters.length == 0) {
    [inputCharacters appendFormat:@"%@", input];
  }
  
  NSLog(@"input: %@", input);
  //NSLog(@"modifier: %@", modifierSymbols);
  NSLog(@"modifierDict: %@", modifierDict);
  NSLog(@"inputCharacterds: %@", inputCharacters);
  
  NSDictionary *userInfo = @{@"key": inputCharacters, @"modifiers": modifierDict};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"KeyEvent" object:self userInfo:userInfo];
  
}

@end
