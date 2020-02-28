/**
 * Created by tirli on 21-02-20.
 */
const path = require('path');
const jsdom = require('jsdom'); // allow us to use the DOM API on the server
const express = require('express');
const app = express();
const server = require('http').Server(app);
      io = require('socket.io').listen(server);
const Datauri = require('datauri');
const datauri = new Datauri();
const {JSDOM} = jsdom;

app.use('/public/mobile', express.static(__dirname + '/public/mobile'));
app.use('/public/desktop', express.static(__dirname + '/public/desktop'));

app.get('/public/mobile', function (req, res) {
    res.sendFile(__dirname + '/public/mobile/index.html');
});

app.get('/public/desktop', function (req, res) {
    res.sendFile(__dirname + '/public/desktop/index.html');
});


/**
 *  used JSDOM’s fromFile method to load the index.html
 *
 *  When we called the fromFile method, we pass it the file we would like to load and an object
 *  that contains the options we need when running this file. These options include:
 *  allowing JSDOM to run scripts
 *  allowing JSDOM to load external resources
 *  telling JSDOM to behave like a normal visual browser
 */
function setupAuthoritativePhaser() {
    JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then(function (dom) {
        // make sure that Phaser is running on our server before a client can connect
        // createObjectURL and revokeObjectURL functions that are not implemented in jsdom
        dom.window.URL.createObjectURL = function(blob) {
            if (blob) { return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content; }
        };
        dom.window.URL.revokeObjectURL = function(objectURL) {};

        dom.window.gameLoaded = function () {
            dom.window.io = io;
            server.listen(8081, function () {
                console.log('Listening on ' + server.address().port);
            });
        };
    }).catch(function (error) {
        console.log(error.message);
    });
}

setupAuthoritativePhaser();