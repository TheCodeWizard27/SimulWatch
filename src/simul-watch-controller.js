let channel = require("./channel");
let LoginState = require("./states/login-state");

module.exports = class SimulWatchController {
    constructor($scope) {
        this.$scope = $scope;

        /* #region Fields */

        this.ready = false;
        this.loggedIn = false;
        this.creatingLobby = false;

        this.err = "";

        this.socket = io();
        this.interval;
        this.state = new LoginState(this.socket, this);

        /* #endregion */

    }

    showErrIf(condition, message) {
        if(!condition) return;

        this.err = message;
        clearInterval(this.interval);
        this.interval = setInterval(this.clearErr.bind(this), 3000);
    }

    clearErr() {
        this.err = "";
        clearInterval(this.interval);
        this.$scope.$apply();
    }
}