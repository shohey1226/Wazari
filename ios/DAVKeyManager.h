//
//  KeyViewController.h
//
//  Created by Shohei Kameda on 2017/09/18.
//  Copyright © 2019 Wazalab. All rights reserved.
//
#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface DAVKeyManager : RCTEventEmitter <RCTBridgeModule>
- (void)modKeyPress: (NSString*)action;
@end
