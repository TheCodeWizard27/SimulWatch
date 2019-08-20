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