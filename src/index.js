/*
 * @Author: BATU1579
 * @Date: 2022-01-31 22:52:46
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-04 22:00:43
 * @Description: 微信加密聊天脚本
 */

// import modules

import {
    TIME_OUT_MS,
    SHORT_WAIT_MS,
    VERSION
} from './global';

import { init } from "./init";

import { Wechat } from "./modules/wechat/wechat_operation";

// script initialization

init();

// main loop

var wechat = new Wechat("CN");
var uname = wechat.getChatUsernameByOCR();
log(uname);
