//
//  DVAApplication.h
//
//  Created by Shohei Kameda on 2017/09/18.
//  Copyright © 2019 Wazalab. All rights reserved.
//s
#import <UIKit/UIKit.h>

@interface DVAApplication : UIApplication {
  NSMutableArray *_commands;
  NSString *_currentMode;
  NSDictionary *_appKeymap;
  NSDictionary *_browserKeymap;
  NSDictionary *_inputKeymap;
  BOOL _keymapEnabled;
}
@end

