//get correct prefix for environment
var ws_prefix = (window.location.hostname == "localhost") ? "ws://" : "wss://"

var wsocket = new WebSocket(ws_prefix + location.host + '/' + dash_id + '/timer/sync/admin');

console.log(ws_prefix)
var current_sel_round = 1;
var next_phase_id = 0;
let keepAliveTimer = 0;
function keepAlive(timeout = 30000) {
    if (wsocket.readyState == wsocket.OPEN) {
        wsocket.send('');
    }
    keepAliveTimer = setTimeout(keepAlive, timeout);
}

$(document).ready(function () {
    try {
        current_sel_round = roundData[0].id;
        next_phase_id = phaseData[phaseData.length - 1].id + 1
    } catch (e) {
        console.log("Failed to set current round:" + e)
        console.log(roundData)
        console.log(phaseData)
    };

    $("#round_editor").load("./timer/editor/rounds?sel=" + current_sel_round)
    $("#timer_editor_gamestructure").load("./timer/editor/game")
});
wsocket.addEventListener("open", (event) => {
    wsocket.send("open");
    keepAlive()
});
function addRow() {
    $.post("./timer/add", { "id": next_phase_id, "round_id": current_sel_round })
    setTimeout(() => {
        $("#round_editor").load("./timer/editor/rounds?sel=" + current_sel_round);
    }, 300);
    next_phase_id += 1;
}
function deleteRow() {
    $("#phaselist").children().last().remove();
    $.post("./timer/remove")

}

const addRoundRowButton = document.getElementById("add_round_row");
addRoundRowButton.addEventListener("click", addRoundRow);

const deleteRoundRowButton = document.getElementById("delete_round_row");
deleteRoundRowButton.addEventListener("click", deleteRoundRow);

function addRoundRow() {
    $.post("./timer/editstructure", { "method": "ad" })

    const tbody = document.getElementById("roundlist")

    const roundNum = parseInt(tbody.lastChild.querySelector(".num").textContent) +1

    const newRow = document.createElement('tr')

    const number = document.createElement('td')
    number.textContent = roundNum
    number.classList.add('num')


    const roundName = document.createElement('td')
    roundName.classList.add('name')


    const roundSelect = document.createElement('select')
    console.log(roundData);
    for (let round of roundData){
        const option = document.createElement('option')
        option.value = round.id
        option.text = round.round_name
        roundSelect.appendChild(option)
    }

    roundName.appendChild(roundSelect)

    newRow.appendChild(number)
    newRow.appendChild(roundName)
    tbody.appendChild(newRow)



    // setTimeout(() => {
    //     $("#timer_editor_gamestructure").load("./timer/editor/game");
    // }, 300);
}

function deleteRoundRow() {
    $.post("./timer/editstructure", { "method": "rm" })

    const tbody = document.getElementById("roundlist")
    const lastRow = tbody.lastChild
    lastRow.remove()

}

function updatePhase(event) {
    var trig_str = event.target.id.replace(/[^0-9.]/g, "").split('.');
    var trig_id = trig_str[0]
    var trig_type = event.target.id.charAt(0);
    var trig_val = $(event.target).val();
    fetch("./timer/update", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "id": trig_id, "type": trig_type, "content": trig_val })
    }).then(() =>{console.log("Change saved")})

}

function updatePhaseBool(event) {
    var trig_str = event.target.id.replace(/[^0-9.]/g, "").split('.');
    var trig_id = trig_str[0]
    var trig_type = event.target.id.charAt(0);
    var trig_val = document.getElementById(event.target.id).checked;
    fetch("./timer/update", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "id": trig_id, "type": trig_type, "content": trig_val })
    }).then(() =>{console.log("Change saved")})


}

function updateName() {
    var trig_val = $("#round_name").val()
        fetch("./timer/update", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "id": current_sel_round, "type": "n", "content": trig_val })
    }).then(() =>{console.log("Change saved")})
    $("#select" + current_sel_round).text(trig_val)
    setTimeout(() => {
        $("#timer_editor_gamestructure").load("./timer/editor/game");
    }, 300);
};

function updateGameRound(event) {
    var trig_str = event.target.id.replace(/[^0-9.]/g, "").split('.');
    var trig_id = trig_str[0]
    var trig_val = $(event.target).find('option:selected').text();
    $.post("./timer/update", { "id": trig_id, "type": "g", "content": trig_val })
}

function reloadOptions() {
    $("#timer_editor_gamestructure").load("./timer/editor/game")

}

function changeRound(event) {
    var trig_id = event.target.id.slice(6);
    current_sel_round = parseInt(trig_id);
    $("#round_editor").load("./timer/editor/rounds?sel=" + current_sel_round)

}

function pChangeRound(trig_id) {
    current_sel_round = parseInt(trig_id);
    setTimeout(() => {
        $("#round_editor").load("./timer/editor/rounds?sel=" + current_sel_round);
    }, 300);
}

function newRound() {
    //add new button
    var new_id = parseInt($("#round_selectors").children().last().children("span").attr('id').slice(6)) + 1
    $("#round_selectors").append(`<div class="paddedbtn" id="sdiv${new_id}"><span class="btnb" id="select${new_id}" onClick="changeRound(event)">New Round</span></div>`)

    //create new round type
    $.post("./timer/newround", { "id": new_id })
    pChangeRound(new_id)
    //add blank line
    var con_new_box = ''
    con_new_box += `<tr id="pir${new_id}">`
    con_new_box += `<td><input class="phase_input" id="phase1.${new_id}" type='text' value='' onchange='updatePhase(event)'></td>`
    con_new_box += `<td><input class="phase_input" id="duration1.${new_id}" type='text' value='0' onchange='updatePhase(event)'></td>`
    con_new_box += '</tr>'

    $("#phaselist").append(con_new_box)
    reloadOptions();
}

function rmRound() {
    //remove button
    $("#sdiv" + current_sel_round).remove();

    //remove from db
    $.post("./timer/rmround", { "id": current_sel_round });

    //find next round
    var topround = 0
    for (round in roundData) {
        if (roundData[round].id > topround) {
            topround = roundData[round].id

        }
    }
    pChangeRound(topround);
    reloadOptions();
}
const statusText = document.getElementById("timer_status")
const playPauseButton = document.getElementById("playpause_timer");
playPauseButton.addEventListener("click", () => {
    let status = playPauseButton.getAttribute('status');

    switch (status) {
        case "stopped":
            playPauseButton.setAttribute('status', 'running');
            playPauseButton.textContent = '⏸';
            statusText.textContent = "Running";
            wsocket.send("start");
            $(".phase_input").attr('disabled', true)
            $("#roundlist").attr('disabled', true)
            break;

        case "running":
            playPauseButton.setAttribute('status', 'paused');
            playPauseButton.textContent = '▶';
            statusText.textContent = "Paused";
            wsocket.send("pause");
            break;
        case "paused":
            playPauseButton.setAttribute('status', 'running');
            playPauseButton.textContent = '⏸';
            statusText.textContent = "Running";
            wsocket.send("unpause");
            break;
        default:
            break;
    }
    })


    const skipButton = document.getElementById("skip_timer");
    skipButton.addEventListener("click", () => {
        wsocket.send("skip");
    })

    const resetButton = document.getElementById("reset_timer");
    resetButton.addEventListener("click", () => {
        wsocket.send("resetf");
        wsocket.send("stop");
        $(".phase_input").attr('disabled', false)
        $("#roundlist").attr('disabled', false)
        playPauseButton.setAttribute('status', 'stopped');
        statusText.textContent = "Stopped";
        playPauseButton.textContent = '▶';
    })

    const resetPhaseButton = document.getElementById("resetphase_timer");
    resetPhaseButton.addEventListener("click", () => {
        wsocket.send("resetp");
    })


