(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
    LOGIN: 'login',
    VIDEOS: 'videos',
    CREATE_LOBBY: 'create-lobby',
    LOBBY: 'lobby',
    JOIN_LOBBY: 'join-lobby',
    NEW_VIEWER: 'new-viewer',
    LOST_VIEWER: 'lost-viewer',
    PLAYER_PLAY: 'player-play',
    PLAYER_UPDATE: 'player-update',
    PLAYER_STOP: 'player-stop',
    PLAYER_CHANGED: 'player-changed',
    LOBBY_CLOSED: 'lobby-closed'
}
},{}],2:[function(require,module,exports){
let SimulWatchController = require("./simul-watch-controller");

angular
    .module("swApp", [])
    .controller("SimulWatchController", SimulWatchController);
},{"./simul-watch-controller":3}],3:[function(require,module,exports){
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
},{"./channel":1,"./states/login-state":6}],4:[function(require,module,exports){
let channel = require("../channel");
let LobbyState = require("./lobby-state");
let WatchingState = require("./watching-state");

module.exports = class CreateLobbyState {
    constructor(socket, ctrl, tmpState) {
        this.type = "create-lobby-state";
        this.ctrl = ctrl;
        this.socket = socket;
        this.tmpState = tmpState;

        this.videoList = [];
        this.selectedVideo = "";
        this.name = "";

        this._initListeners();

        this.socket.emit(channel.VIDEOS);

    }

    _initListeners() {
        this.socket.removeAllListeners(channel.VIDEOS);
        this.socket.on(channel.VIDEOS, videos => {
            this.videoList = videos;
            this.ctrl.$scope.$apply();
        });
        this.socket.removeAllListeners(channel.JOIN_LOBBY);
        this.socket.on(channel.JOIN_LOBBY, data => {
            this.ctrl.state = new WatchingState(this.socket, this.ctrl, this, data);
            this.ctrl.$scope.$apply();
        });
    }

    back() {
        this.ctrl.state = this.tmpState;
        this.tmpState.startPolling();
    }
    create() {
        if (this.name.length <= 0) {
            this.ctrl.showErrIf(this.name.length <= 0, "Please enter a lobby name.");
            return;
        }

        this.socket.emit(channel.CREATE_LOBBY, {
            video: this.selectedVideo,
            name: this.name
        });
    }

}
},{"../channel":1,"./lobby-state":5,"./watching-state":7}],5:[function(require,module,exports){
let channel = require("../channel");
let CreateLobbyState = require("./create-lobby-state");
let WatchingState = require("./watching-state");

module.exports = class LobbyState {
    constructor(socket, ctrl) {
        this.type = "lobby-state";
        this.ctrl = ctrl;
        this.socket = socket;

        this.lobbyList = [];

        this._initListeners();

        this.socket.emit(channel.LOBBY);
        this.interval = setInterval(this.pollLobbies.bind(this), 1000);
    }

    _initListeners() {
        this.socket.removeAllListeners(channel.LOBBY);
        this.socket.on(channel.LOBBY, lobbyList => {
            this.lobbyList = lobbyList;
            this.ctrl.$scope.$apply();
        });
        this.socket.removeAllListeners(channel.JOIN_LOBBY);
        this.socket.on(channel.JOIN_LOBBY, data => {
            this.ctrl.state = new WatchingState(this.socket, this.ctrl, this, data);
            this.ctrl.$scope.$apply();
        });
    }

    startPolling() {
        this.interval = setInterval(this.pollLobbies.bind(this), 1000);
    }

    pollLobbies() {
        this.socket.emit(channel.LOBBY);
    }

    createLobby() {
        clearInterval(this.interval);
        this.ctrl.state = new CreateLobbyState(this.socket, this.ctrl, this);
    }

    joinLobby(id) {
        this.socket.emit(channel.JOIN_LOBBY, id);
    }

}
},{"../channel":1,"./create-lobby-state":4,"./watching-state":7}],6:[function(require,module,exports){
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
},{"../channel":1,"./lobby-state":5}],7:[function(require,module,exports){
let channel = require("../channel");

module.exports = class WatchingState {
    constructor(socket, ctrl, tmpState, data) {
        this.type = "watching-state";
        this.ctrl = ctrl;
        this.socket = socket;
        this.tmpState = tmpState;

        this.host = data.host;
        this.viewers = data.viewers;
        this.lobbyName = data.name;
        this.videoRaw = data.video;
        this.video = `../videos/${data.video}`;
        this.id = data.id;
        this.isHost = data.isHost;

        this.videoList = [];

        this.videoPlayer = document.getElementById("videoPlayer");

        this._initListeners();

        this.videoPlayer.load();

        if (this.isHost) {
            this.videoPlayer.onplay = this.onStart.bind(this);
            this.videoPlayer.onpause = this.onStop.bind(this);
        }
        this.socket.emit(channel.VIDEOS);
    }

    _initListeners() {
        this.socket.removeAllListeners(channel.VIDEOS);
        this.socket.on(channel.VIDEOS, videos => {
            this.videoList = videos;
            this.ctrl.$scope.$apply();
        });

        this.socket.removeAllListeners(channel.NEW_VIEWER);
        this.socket.on(channel.NEW_VIEWER, user => {
            this.viewers.push(user);
            this.ctrl.$scope.$apply();
        });
        this.socket.removeAllListeners(channel.LOST_VIEWER);
        this.socket.on(channel.LOST_VIEWER, user => {
            this.viewers.splice(this.viewers.indexOf(user), 1);
            this.ctrl.$scope.$apply();
        });
        this.socket.removeAllListeners(channel.LOBBY_CLOSED);
        this.socket.on(channel.LOBBY_CLOSED, _ => {
            this.ctrl.state = this.tmpState;
            this.ctrl.$scope.$apply();
        });

        /* #region Player Updates */
        this.socket.removeAllListeners(channel.PLAYER_PLAY);
        this.socket.on(channel.PLAYER_PLAY, _ => {
            this.videoPlayer.play();
        });
        this.socket.removeAllListeners(channel.PLAYER_STOP);
        this.socket.on(channel.PLAYER_STOP, _ => {
            this.videoPlayer.pause();
        });
        this.socket.removeAllListeners(channel.PLAYER_UPDATE);
        this.socket.on(channel.PLAYER_UPDATE, time => {
            let difference = time - this.videoPlayer.currentTime;
            if (Math.abs(difference) > 1)
                this.videoPlayer.currentTime = time;
        });
        this.socket.removeAllListeners(channel.PLAYER_CHANGED);
        this.socket.on(channel.PLAYER_CHANGED, newSrc => {
            this.videoRaw = newSrc;
            this.video = `../videos/${this.videoRaw}`;
            this.videoPlayer.load();
        });
        /* #endregion */
    }

    onStart() {
        this.interval = setInterval(this.update.bind(this), 25);
        this.socket.emit(channel.PLAYER_PLAY, this.id)
    }
    update() {
        this.socket.emit(channel.PLAYER_UPDATE, { id: this.id, currentTime: this.videoPlayer.currentTime });
    }
    onStop() {
        clearInterval(this.interval);
        this.socket.emit(channel.PLAYER_STOP, this.id);
    }

    back() {
        this.ctrl.state = this.tmpState;
        this.socket.emit(channel.LOST_VIEWER);
    }

    changeVideo() {
        if (!this.videoRaw) return;

        this.video = `../videos/${this.videoRaw}`;
        this.socket.emit(channel.PLAYER_CHANGED, { id: this.id, newSrc: this.videoRaw });
        this.videoPlayer.load();
    }
}
},{"../channel":1}]},{},[2]);
