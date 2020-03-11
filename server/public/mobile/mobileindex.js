/**
 * Created by tirli on 28-02-20.
 */
var ready = true;
var isFirstPlayer;
var gameLaunched = false;
var canConnect = false;
var direction = null;
var self = null;

window.onload = function () {
    self = this;
    this.socket = io();
    const el = document.body;
    const noSleep = new NoSleep();
    const touchSweep = new TouchSweep(el, {value: 1}, 60);
    noSleep.disable();
    const buttonJoin = document.getElementsByTagName('button')[0];
    const buttonStart = document.getElementsByTagName('button')[1];
    const buttonShoot = document.getElementsByTagName('button')[2];
    const logs = document.getElementsByTagName('span')[0];
    const disconnected = document.getElementsByTagName('span')[1];

    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    var vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    // We listen to the resize event
    window.addEventListener('resize', function() {
        // We execute the same script as before
        var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});


    if (true || isMobile()) {
        buttonJoin.style.visibility = 'visible';

        this.socket.emit('mobile can connect');
        self.socket.on('mobile get can connect', function (getCanConnect) {
            canConnect = getCanConnect;
            if (!canConnect) {
                buttonJoin.style.visibility = 'hidden';
                buttonShoot.style.visibility = 'hidden';
                logs.innerHTML = 'party already started waiting for new room...';
            }
        });
        self.socket.on('mobile set params', function (fp, playerColor, poz) {
            console.log('mobile set params -> ' + socket + ' isFirstPlayer: ' + fp + ' playerColor: ' + playerColor);
            isFirstPlayer = fp;
            logs.style.visibility = 'visible';
            logs.innerHTML = 'position = ' + poz;
            document.body.style.background = playerColor;
            buttonJoin.style.visibility = 'hidden';
            if (isFirstPlayer) {
                buttonStart.style.visibility = 'visible';
                buttonStart.addEventListener('click', startGame.bind(null, self), false);
            }
        });
        self.socket.on('mobile game started', function () {
            console.log('mobile game started');
            logs.style.visibility = 'visible';
            handleSwipe()
        });
        self.socket.on('mobile desktop disconnected', function () {
            console.log('H - mobile desktop disconnected');
            // show command
            gameLaunched = false;
            disconnected.style.visibility = 'visible';
        });


        function handleSwipe() {
            if (ready && canConnect) {
                el.addEventListener('touchstart', function(event){
                    // console.log('touchstart', event);
                }, false);
                el.addEventListener('touchend', function(event){
                    // console.log('touchend', event);
                    // self.socket.emit('mobile action', 'touchend');
                    event.preventDefault()
                }, false);
                el.addEventListener('swipeleft', function(event) {
                    // event.detail
                    // console.log('swipeleft', event);
                    self.socket.emit('mobile action', 'swipeleft');
                });
                el.addEventListener('swiperight', function(event) {
                    // event.detail
                    // console.log('swiperight', event);
                    self.socket.emit('mobile action', 'swiperight');
                });
                el.addEventListener('swipedown', function(event) {
                    // event.detail
                    console.log('swipedown', event);
                    self.socket.emit('mobile action', 'swipedown');
                });
                el.addEventListener('swipeup', function(event) {
                    // event.detail
                    console.log('swipeup', event);
                    self.socket.emit('mobile action', 'swipeup');
                });
                el.addEventListener('tap', function(event) {
                    // event.detail
                    // console.log('tap', event);
                    self.socket.emit('mobile action', 'tap');
                });


            }
        }

        function handleOrientation() {
        }

        window.addEventListener("deviceorientation", handleOrientation, true);
        buttonJoin.addEventListener('click', enableNoSleep.bind(null, self), false);


        function shoot(self) {
            this.socket.emit('mobile shoot');
        }

        function startGame(self) {
            if (!gameLaunched) {
                gameLaunched = true;
                this.socket.emit('mobile start game');
                buttonStart.style.visibility = 'hidden';
            }
        }

        function enableNoSleep(self) {
            this.socket.emit('mobile connected');
            buttonJoin.removeEventListener('click', handleOrientation, false);

            buttonShoot.style.visibility = 'visible';
            buttonShoot.addEventListener('click', shoot.bind(null, self), false);

        }
    }
};

window.onbeforeunload = function (e) {
    // check if player exist in server
    if (isFirstPlayer !== null && isFirstPlayer !== undefined) {
        this.socket.emit('mobile disconnected', isFirstPlayer);
    }
};

const isMobile = function () {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) return true;

    return false;
};