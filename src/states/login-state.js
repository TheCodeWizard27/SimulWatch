let channel = require("../channel");
let LobbyState = require("./lobby-state");

module.exports = class LoginState {
    constructor(socket, ctrl) {
        this.type = "login-state";
        this.ctrl = ctrl;
        this.socket = socket;

        this.username = "";

        this._initListeners();
    }

    _initListeners() {
        this.socket.removeAllListeners(channel.LOGIN);
        this.socket.on(channel.LOGIN, (err) => {
            if (err) {
                this.ctrl.err = err;
                clearInterval(this.ctrl.interval);
                this.ctrl.interval = setInterval(this.ctrl.clearErr.bind(this.ctrl), 3000);
                this.ctrl.$scope.$apply();
                return;
            }

            this.ctrl.state = new LobbyState(this.socket, this.ctrl);
            this.ctrl.$scope.$apply();
        });
    }

    login() {
        if (this.username.length <= 0) {
            this.ctrl.showErrIf(this.username.length <= 0, "Please enter a username");
            return;
        }

        this.socket.emit(channel.LOGIN, this.username);
    }

}