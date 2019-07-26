//
//  KeyViewController.m
//  devAny
//
//  Created by 亀田祥平 on 2017/09/18.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "DAVKeyManager.h"



@implementation DAVKeyManager
{
  bool hasListeners;
  NSDictionary *_modifiers;
}

RCT_EXPORT_MODULE();

- (id)init
{
  NSLog(@"init now");
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyEventReceived:) name:@"KeyEvent" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(desktopKeyEventReceived:) name:@"DesktopKeyEvent" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(browserKeyEventReceived:) name:@"BrowserKeyEvent" object:nil];
  _modifiers = @{@"metaKey": @"metaKey", @"capslockKey": @"capslockKey", @"altKey": @"altKey", @"ctrlKey": @"ctrlKey"}; // set default modifiers
  self = [super init];
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"RNKeyEvent", @"RNDesktopKeyEvent", @"RNBrowserKeyEvent"];
}

// Will be called when this module's first listener is added.
-(void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
}

- (void)desktopKeyEventReceived:(NSNotification *)notification
{
  NSString *action = notification.userInfo[@"action"];
  if (hasListeners) {
    [self sendEventWithName:@"RNDesktopKeyEvent" body:@{@"action": action}];
  }
}

- (void)browserKeyEventReceived:(NSNotification *)notification
{
  NSString *action = notification.userInfo[@"action"];
  if (hasListeners) {
    [self sendEventWithName:@"RNBrowserKeyEvent" body:@{@"action": action}];
  }
}


- (void)keyEventReceived:(NSNotification *)notification
{

  NSLog(@"Notification - You recieved key!");
  NSString *key = notification.userInfo[@"key"];
  NSLog(@"key: %@", key);
  
  // https://stackoverflow.com/questions/11193611/get-a-char-from-nsstring-and-convert-to-int
//  char *cstring = [key UTF8String];
//  int charcode = cstring[0];
//  NSLog(@"int: %d", charcode);
//  NSNumber *charCodeNumber = [NSNumber numberWithInt:charcode];
  
  NSDictionary *modifierDict = notification.userInfo[@"modifiers"]; // original from keyboard
  NSMutableDictionary *newModifierDict = [[NSMutableDictionary alloc] initWithDictionary:modifierDict]; // updated with modifier change on RN
  NSLog(@"modifiers: %@", modifierDict);
  NSLog(@"_modifier: s%@", _modifiers);
  NSLog(@"before newModifiers: %@", newModifierDict);
  
  if([modifierDict[@"capslockKey"]  isEqual: @YES] && ![_modifiers[@"capslockKey"]  isEqual:  @"capslockKey"]){
    [newModifierDict setValue:modifierDict[@"capslockKey"] forKey: _modifiers[@"capslockKey"] ];
    [newModifierDict setValue:@NO forKey: @"capslockKey" ];
  }
  if([modifierDict[@"metaKey"]  isEqual: @YES] && ![_modifiers[@"metaKey"]  isEqual:  @"metaKey"]){
    [newModifierDict setValue:modifierDict[@"metaKey"] forKey: _modifiers[@"metaKey"] ];
    [newModifierDict setValue:@NO forKey: @"metaKey" ];
  }
  if([modifierDict[@"ctrlKey"]  isEqual: @YES] && ![_modifiers[@"ctrlKey"]  isEqual:  @"ctrlKey"]){
    [newModifierDict setValue:modifierDict[@"ctrlKey"] forKey: _modifiers[@"ctrlKey"] ];
    [newModifierDict setValue:@NO forKey: @"ctrlKey" ];
  }
  if([modifierDict[@"altKey"]  isEqual: @YES] && ![_modifiers[@"altKey"]  isEqual:  @"altKey"]){
    [newModifierDict setValue:modifierDict[@"altKey"] forKey: _modifiers[@"altKey"] ];
    [newModifierDict setValue:@NO forKey: @"altKey" ];
  }
  
  NSLog(@"newModifiers: %@", newModifierDict);
  
  if (hasListeners) { // Only send events if anyone is listening
    [self sendEventWithName:@"RNKeyEvent" body:@{@"key": key, @"modifiers": newModifierDict}];
  }
}

RCT_EXPORT_METHOD(updateModifiers:(NSDictionary *)modifiers )
{
  _modifiers = modifiers;
  NSLog(@"%@", _modifiers);
}

// Set window name using notification
RCT_EXPORT_METHOD(setWindow:(NSString *)windowName)
{
  NSDictionary *window = @{@"windowName": windowName};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"activeWindow" object:self userInfo:window];
}

RCT_EXPORT_METHOD(setDesktopKeymap:(NSDictionary *)keymap)
{
  NSDictionary *desktopKeymap = @{@"desktopKeymap": keymap};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"desktopKeymap" object:self userInfo:desktopKeymap];
}

RCT_EXPORT_METHOD(setBrowserKeymap:(NSDictionary *)keymap)
{
  NSDictionary *browserKeymap = @{@"browserKeymap": keymap};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"browserKeymap" object:self userInfo:browserKeymap];
}

//RCT_EXPORT_METHOD(setEditorKeymap:(NSDictionary *)keymap)
//{
//  NSDictionary *editorKeymap = @{@"editorKeymap": keymap};
//  [[NSNotificationCenter defaultCenter] postNotificationName:@"editorKeymap" object:self userInfo:editorKeymap];
//}
//

RCT_EXPORT_METHOD(setTerminalKeymap:(NSDictionary *)keymap)
{
  NSDictionary *terminalKeymap = @{@"terminalKeymap": keymap};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"terminalKeymap" object:self userInfo:terminalKeymap];
}


RCT_EXPORT_METHOD(turnOnKeymap)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"turnOnKeymap" object:nil ];
}

RCT_EXPORT_METHOD(turnOffKeymap)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"turnOffKeymap" object:nil ];
}


@end
