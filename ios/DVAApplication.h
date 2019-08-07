//
//  DVAApplication.h
//  devAny
//
//  Created by 亀田祥平 on 2017/09/19.
//  Copyright © 2017年 Facebook. All rights reserved.
//
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

