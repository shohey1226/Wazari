/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"Wazari"
                                            initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  [self setupScreenNotifications];
  
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

-(void)setupScreenNotifications {
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(externalScreenDidConnect:) name:UIScreenDidConnectNotification object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(externalScreenDidDisconnect:) name:UIScreenDidDisconnectNotification object:nil];
  
}

-(void)externalScreenDidConnect:(NSNotification *)notification {
  UIScreen *screen = (UIScreen *)[notification object];
  if (screen != nil) {
    [self setupExternalScreen:screen];
  }
}

-(void)externalScreenDidDisconnect:(NSNotification *)notification {
  id obj = [notification object];
  if (obj != nil) {
    [self teardownExternalScreen];
  }
}

-(void)setupExternalScreen:(UIScreen *)screen {
  
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"Wazari"
                                            initialProperties:nil];
  
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  
  self.externalWindow = [[UIWindow alloc]initWithFrame:screen.bounds];
  self.externalWindow.rootViewController = rootViewController;
  self.externalWindow.screen = screen;
  self.externalWindow.hidden = false;
}

-(void)teardownExternalScreen {
  if (self.externalWindow != nil) {
    self.externalWindow.hidden = true;
    self.externalWindow = nil;
  }
}



@end
