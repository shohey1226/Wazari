//
//  KeyViewController.m
//
//  Created by Shohei Kameda on 2017/09/18.
//  Copyright © 2019 Wazalab. All rights reserved.
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
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(capslockKeyPress:) name:@"capslockPressed" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(appKeyEventReceived:) name:@"AppKeyEvent" object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(browserKeyEventReceived:) name:@"BrowserKeyEvent" object:nil];
  _modifiers = @{@"metaKey": @"metaKey", @"capslockKey": @"capslockKey", @"altKey": @"altKey", @"ctrlKey": @"ctrlKey"}; // set default modifiers
  self = [super init];
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"RNKeyEvent", @"RNAppKeyEvent", @"RNBrowserKeyEvent", @"capslockKeyPress"];
}

// Will be called when this module's first listener is added.
-(void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessaryfha
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
}

- (void)appKeyEventReceived:(NSNotification *)notification
{
  NSString *action = notification.userInfo[@"action"];
  if (hasListeners) {
    [self sendEventWithName:@"RNAppKeyEvent" body:@{@"action": action}];
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
// char *cstring = [key UTF8String];
// int charcode = cstring[0];
// NSLog(@"int: %d", charcode);
// NSNumber *charCodeNumber = [NSNumber numberWithInt:charcode];
  
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

RCT_EXPORT_METHOD(setCapslock:(NSString *)flag)
{
  NSLog(@"Setting capslock");
  NSDictionary *mods = @{@"mods": flag};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"capslock" object:self userInfo:mods];
}

- (void)capslockKeyPress:(NSNotification *)notification
{
  if (hasListeners){
    NSString *action = notification.userInfo[@"action"];
    [self sendEventWithName:@"capslockKeyPress" body:@{ @"name": action }];
  }
}

RCT_EXPORT_METHOD(updateModifiers:(NSDictionary *)modifiers )
{
  _modifiers = modifiers;
  NSLog(@"%@", _modifiers);
}

// Set Mode name using notification
RCT_EXPORT_METHOD(setMode:(NSString *)modeName)
{
  NSDictionary *mode = @{@"modeName": modeName};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"activeMode" object:self userInfo:mode];
}

RCT_EXPORT_METHOD(setAppKeymap:(NSDictionary *)keymap)
{
  NSDictionary *appKeymap = @{@"appKeymap": keymap};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"appKeymap" object:self userInfo:appKeymap];
}

RCT_EXPORT_METHOD(setBrowserKeymap:(NSDictionary *)keymap)
{
  NSDictionary *browserKeymap = @{@"browserKeymap": keymap};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"browserKeymap" object:self userInfo:browserKeymap];
}

RCT_EXPORT_METHOD(setInputKeymap:(NSDictionary *)keymap)
{
  NSDictionary *inputKeymap = @{@"inputKeymap": keymap};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"inputKeymap" object:self userInfo:inputKeymap];
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
    
