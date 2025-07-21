//get correct prefix for environment
var ws_prefix = (window.location.hostname == "localhost") ? "ws://" : "wss://"

var wsocket = new WebSocket(ws_prefix + location.host + '/'+dash_id+'/timer/sync/view');

var this_phase_id = 0;
let keepAliveTimer = 0;
var checkInReady = false;

window.addEventListener("focus", (event) => {
    if (window.screen.width < 400) {
        var ws_prefix = (window.location.hostname == "localhost") ? "ws://" : "wss://"

        var wsocket = new WebSocket(ws_prefix + location.host + '/'+dash_id+'/timer/sync/view');
    }

})
//this is for debugging to open the injected script
console.log("find me")

//stop socket from disconnecting on pause/inactivity
function keepAlive(timeout = 30000) {
    if (wsocket.readyState == wsocket.OPEN) {
        wsocket.send('');
    }
    keepAliveTimer = setTimeout(keepAlive, timeout);
}

//create local timer object
const timer = {
    time: 0,
    running: false,
    last_tick:0,
    interval:0,
    tick: function(){
        this.tick.bind(this)
        let s = Math.round(Date.now() / 1000);
        if (s > this.last_tick) {
            if (this.running) {

                this.time += 1;
                updateClock(this.time)
            };

        }
        this.last_tick = s;
        if (!this.running){this.stop()}
    },
    start: function(){
        let tick = this.tick.bind(this)
        this.interval = setInterval(tick,250)
    },
    stop: function(){
        clearInterval(this.interval)
    }

}

//wait until page is loaded and websocket is connected to check in with server and receive current time/running status
function wsCheckIn(){
    if (checkInReady) {
        wsocket.send('open');
    } else {
        checkInReady = true;
    }
}


wsocket.addEventListener("open", (event) => {
    wsCheckIn()
    keepAlive()
    
});

//receive timer update from server
wsocket.addEventListener("message", (event) => {
    if (event.data == "s") {
        location.reload()
    } else if (event.data == "p"){
        timer.running = false;
    } else if (event.data == "r"){
        timer.running = true;
        timer.start();
        console.log("received r")
    } else {
        updateClock(parseInt(event.data));
        timer.time = parseInt(event.data);
        console.log(event.data)
    };
});


var current_phase_id = 0;
var game_length = 0

//the length of each phase across the entire game
var phase_lengths = []

//the cumulative timecodes where the phases change across the whole game
var phase_points = []

//the total number of turns in the game
var numturns = 0

//id of the current turn in the game_structure table
var current_turn_id = 0

//true if end of the phase, for playing audio
var end_phase = false

//list of number of rounds per turn across the whole game
var turn_phases = []

//list of all the turns by id
var gid_list = []
$(document).ready(function () {
    // creates arrays of all rounds, points where the rounds change in seconds, and the number of rounds per turn for later calculations
    var numphases = document.getElementById("phaselist").childElementCount - 1;
    for (let i = 0; i < numphases; i++) {
        phase_lengths[i] = phaseData[i].duration * 60;
        game_length += phase_lengths[i]
        if (i > 0) {
            phase_points[i + 1] = phase_lengths[i] + phase_points[i]
        } else {
            phase_points[i + 1] = phase_lengths[i];
            phase_points[i] = 0
        }
        gid_list.push(phaseData[i].gid)
    }
    for (let i = 0; i < gid_list.length; i++) {
        if (i == 0) {
            turn_phases.push(1)
        } else if (gid_list[i] != gid_list[i - 1]) {
            turn_phases.push(1)
        } else {
            var new_val = turn_phases.pop() + 1
            turn_phases.push(new_val)
        }
    }
    numturns = gameStructure.length;
    phase_points.pop();
    document.getElementById("phaselist").children[this_phase_id + 1].classList.add("this_phase")
    wsCheckIn()
});



function checkTime(i) {
    // formats times
    if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
    return i;
}

//takes a timecode in seconds (from server or internal clock) and resolves to the display
function updateClock(tc) {
    // tc is the timecode sent from the server
    if (Number.isNaN(tc)) {
        $("#time").text("00:00");
        $("#current_turn").text("New Turn");
        $("#current_phase").text("New Turn");
    } else {


        var current_time = tc % game_length;

        // calculate current phase in the context of the overall game
        let current_phase = 0
        let this_phase = false
        while (!this_phase) {
            if (current_time > phase_points[current_phase]) {
                current_phase++

            } else {
                this_phase = true;
            }
        }
        current_phase--

        //handling for if time is 0
        if (current_phase < 0){current_phase = 0;}

        var current_turn = phaseData[current_phase].gid;
        checkTurn(current_turn);
        let remaining_s = phase_lengths[current_phase] - (current_time - phase_points[current_phase]);
        let rmins = checkTime(Math.floor(remaining_s / 60));
        let rsecs = checkTime(remaining_s % 60);

        // calculate number of current turn
        var turncalc = 0
        var current_turn_count = 0

        while (turncalc < phase_points.length) {
            // check if a counter is less than the current phase, if so, count up to the next turn and check again
            if (turncalc < current_phase) {
                turncalc += turn_phases[current_turn_count]
                // check if the new count (added on the number of phases in the currently counted turn) is still lower. if it is, keep counting. if not, break BEFORE incrementing the count
                if (turncalc <= current_phase) {
                    current_turn_count++
                }
            } else {
                break
            }

        }
        // If there's a turn 0, move all numbers down one
        if (timerTurn0){
            current_turn_count -= 1
        }
        $("#time").text(rmins + ":" + rsecs);
        $("#current_turn").text((current_turn_count + 1) + " (" + phaseData[current_phase].round_name + ")");
        var phase_name = document.getElementById("phaselist").children[current_phase + 1].children[0].children[0].innerText
        $("#current_phase").text(phase_name);
        if (current_phase != this_phase_id) {
            document.getElementById("phaselist").children[current_phase + 1].classList.add("this_phase")
            document.getElementById("phaselist").children[this_phase_id + 1].classList.remove("this_phase")
            this_phase_id = current_phase;
        }

        playAudio(remaining_s, current_phase)

    }
}

function checkTurn(current_turn) {
    for (let i = 1; i < document.getElementById("phaselist").childElementCount; i++) {
        var row = document.getElementById("phaselist").children[i]
        if (row.className == "gid" + current_turn || row.className == "gid" + current_turn + " this_phase") {
            row.style.display = ""
        } else {
            row.style.display = "none"
        }
    }
}

function playAudio(secs, turn) {
if (end_phase == true) {
        //if there is an audio cue associated with this turn (not null on left join), play it
        if (phaseData[turn].audio_cue_name){
        var audio = document.getElementById(phaseData[turn].audio_cue_name.replace(/ /g,"_")+"_audio");
        audio.play()}
        end_phase = false
    }

    if (secs == 0) {
        end_phase = true
    }

}

function testAudio(cue){
    var audio = document.getElementById(cue);
    audio.play();
    console.log("playing audio "+ cue)
}

