/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 16:09:50
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-04 16:11:16
 * @FilePath: \\src\\modules\\global_exception.js
 * @Description: 全局异常类
 */
class BasePermissionException extends Error {
    constructor(message) {
        super("[Permission Exception] " + message);
        this.name = "BasePermissionException";
    }
}

export class PermissionObtainingFailure extends BasePermissionException {
    constructor(permission) {
        super(permission + "obtaining failure");
        this.name = PermissionObtainingFailure;
    }
}

class BaseWidgetException extends Error {
    constructor(message) {
        super("[Widget Exception] " + message);
        this.name = 'BaseWidgetException';
    }
}

export class WidgetNotFound extends BaseWidgetException {
    constructor(widget_name) {
        super(widget_name + ' widget not found');
        this.name = 'WidgetNotFound';
    }
}