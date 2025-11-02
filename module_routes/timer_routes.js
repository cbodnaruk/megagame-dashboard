const express = require('express')
const router = express.Router({mergeParams: true})
var fs = require('fs');
const Timer = require('./timer.js')
var bodyParser = require('body-parser');
const qsstringify = require('qs');
const jst = require("javascript-stringify");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var ws_clients = [];
function full_db_call(dash_id){ return `SELECT game_structure.id as "gid", timers.id, timers.minor, round_name, phase, duration, audio_cue, audio_cues.name as "audio_cue_name", audio_cues.url as "audio_cue_URL" FROM game_structure INNER JOIN round_types ON game_structure.round_id = round_types.id INNER JOIN timers ON round_types.id = timers.round_id LEFT JOIN audio_cues on audio_cues.id = timers.audio_cue WHERE round_types.dash_id = '${dash_id}' ORDER BY game_structure.id ASC, timers.id asc;`}
function phases_db_call(dash_id){return `SELECT timers.id, phase, duration, round_id, round_name, round_types.dash_id, minor, audio_cue, audio_cues.name as "audio_cue_name" from timers inner join round_types on round_types.id = timers.round_id LEFT JOIN audio_cues on audio_cues.id = timers.audio_cue where round_types.dash_id = '${dash_id}' ORDER BY id;`}
function rounds_db_call(dash_id){return `SELECT * from round_types WHERE dash_id = '${dash_id}' ORDER BY id;`}
function game_db_call(dash_id){return `SELECT game_structure.id, round_id, dash_id FROM game_structure INNER JOIN round_types ON game_structure.round_id = round_types.id WHERE dash_id = '${dash_id}' ORDER BY id;`}
function audio_db_call(dash_id){return `SELECT id, url, name FROM audio_cues WHERE dash_id = '${dash_id}' ORDER BY id;`}
var timers = []
var tickers = []

async function load_dash_list() {
    list = await db.any('SELECT dash_id FROM dashboards;')
    outlist = []
    for (x in list) {
        outlist.push(list[x].dash_id)
    }
    return outlist
}

async function initialiseTimers() {
    var dash_list = await load_dash_list();
for (let dash in dash_list){
    timers[dash_list[dash]] = new Timer;
    timers[dash_list[dash]].dash_id = dash_list[dash];
    console.log(dash_list[dash])
}
}


initialiseTimers()

router.get('/editor', async (req, res) => {
    try {
        let round_list = await db.any(rounds_db_call(req.params.dash_id));
        let phase_list = await db.any(phases_db_call(req.params.dash_id));
        let game_list = await db.any(game_db_call(req.params.dash_id));
        let audio_list = await db.any(audio_db_call(req.params.dash_id));
        res.render('timer_editor_new', { "phases": phase_list, "sphases": jst.stringify(phase_list), "rounds": round_list, "srounds": jst.stringify(round_list), "saudiocues": jst.stringify(audio_list), "structure": game_list, "is_running": timers[req.params.dash_id].is_running, "is_paused": timers[req.params.dash_id].is_paused });
    }
    catch (e) {
        res.send(e)
        console.log(e)
    }

});
router.get('/editor/rounds', async (req, res) => {
    try {
        let round_list = await db.any(rounds_db_call(req.params.dash_id)); 
        let phase_list = await db.any(phases_db_call(req.params.dash_id));
        let audio_list = await db.any(audio_db_call(req.params.dash_id));
        res.render('timer_editor_rounds', { "phases": phase_list, "rounds": round_list, "is_running": timers[req.params.dash_id].is_running, "selection": req.query.sel, "audio_cues": audio_list });
    }
    catch (e) {
        res.send(e)
        console.log(e)
    }


});

router.get('/editor/game', async (req, res) => {
    try {
        var prefs = JSON.parse(fs.readFileSync('prefs.json', 'utf8'))
        let round_list = await db.any(rounds_db_call(req.params.dash_id)); 
        let game_list = await db.any(game_db_call(req.params.dash_id));
        res.render('timer_editor_game', { "structure": game_list, "rounds": round_list, "is_running": timers[req.params.dash_id].is_running, "selection": req.query.sel, "preferences":prefs[req.params.dash_id] });
    }
    catch (e) {
        res.send(e)
        console.log(e)
    }


});

router.get('/controller', async (req, res) => {
    res.render('timer_controller', { "is_running": timers[req.params.dash_id].is_running, "is_paused": timers[req.params.dash_id].is_paused });
});

router.get('/view', async (req, res) => {
    try {
        var prefs = JSON.parse(fs.readFileSync('prefs.json', 'utf8'))
        const phase_list = await db.any(full_db_call(req.params.dash_id));
        const game_struct = await db.any(game_db_call(req.params.dash_id));
        const audio_list = await db.any(audio_db_call(req.params.dash_id));
        res.render('timer', { "phases": phase_list,"sphases": jst.stringify(phase_list), "sstruct": jst.stringify(game_struct), "dash_id": req.params.dash_id, "audio_cues": audio_list, "timer_turn0":prefs[req.params.dash_id].timer_turn0 });
    }
    catch (e) {
        res.send(e)
        console.log(e)
    }
 
});

router.ws('/sync/:source', (ws, req) => {
    if (!timers.hasOwnProperty(req.params.dash_id)){
        timers[req.params.dash_id] = new Timer;
    timers[req.params.dash_id].dash_id = req.params.dash_id;
    }
    console.log(req.params.dash_id)
    ws.id = req.params.dash_id+"-"+req.params.source
    ws.on('message', async function (msg) {
        var dash_id = req.params.dash_id;
        if (msg == "start") {
            console.log("starting "+dash_id);
            console.log(timers[dash_id].initialise());
            console.log(timers[dash_id].last_tick)
            timers[dash_id].tick()
            let tick = timers[dash_id].tick.bind(timers[dash_id])
            tickers[dash_id] = setInterval(tick, timers[dash_id].update_rate);
            console.log(tickers[dash_id])
        } else if (msg=="open"){
            ws.send(timers[dash_id].time_elapsed)
            if (timers[dash_id].is_running == true && timers[dash_id].is_paused == false){
                ws.send("r")
                console.log("sent r")
            } else {
                ws.send("p")
                console.log("sent p")
            }
            console.log(timers[dash_id].is_running)
        } else if (msg == "stop") {
            console.log("stopping "+dash_id)
            timers[dash_id].stop()
            clearInterval(tickers[dash_id])
        } else if (msg == "pause") {
            console.log("pausing "+dash_id);
            timers[dash_id].pause()
        } else if (msg == "unpause") {
            console.log("unpausing "+dash_id);
            timers[dash_id].unpause()
        } else if (msg == "resetf") {
            console.log("resetting full "+dash_id);
            timers[dash_id].reset("f");
        } else if (msg == "resetp") {
            try {
                const phase_list = await db.any(full_db_call(req.params.dash_id));
                console.log("resetting phase "+dash_id);
                timers[req.params.dash_id].reset("p", phase_list)
            }
            catch (e) {
                res.send(e)
                console.log(e)
            }

        } else if (msg == "skip"){
            const phase_list = await db.any(full_db_call(req.params.dash_id));
            timers[dash_id].skip(phase_list)
            console.log("skipping forward "+dash_id)
        };
    });
    console.log("connected WS from "+req.params.source)
    
    ws.on('close', function(){
        console.log("closed "+ws.id)
        ws.id = ""
    });

});



router.post('/update', urlencodedParser, async (req, res) => {
    console.log("recieved post")
    console.log(save_phase(req.body.id, req.body.type, req.body.content, req.params.dash_id))
    aWss.clients.forEach(function (client) {

        client.send("s");
    });
});

router.post('/add', urlencodedParser, async (req, res) => {
    add_phase(req.body.id,req.body.round_id,req.params.dash_id);

});

router.post('/remove', urlencodedParser, async (req, res) => {
    remove_phase(req.params.dash_id)
    console.log("remove from", req.params.dash_id)

});

router.post('/newround', urlencodedParser, async (req, res) => {
    let dash_id = req.params.dash_id
    await db.none(`INSERT INTO round_types (id, round_name, dash_id) VALUES ('${req.body.id}','New Round','${dash_id}');`);
    await db.none(`INSERT INTO timers (phase, duration, round_id, minor) VALUES ('','0','${req.body.id}',false);`)
    console.log("saved new round type")
});

router.post('/rmround', urlencodedParser, async (req, res) => {
    await db.none(`DELETE FROM round_types WHERE id = '${req.body.id}';`);
})
;
router.post('/editstructure', urlencodedParser, async (req, res) => {
    let dash_id = req.params.dash_id
    if (req.body.method == "ad"){
        await db.none(`INSERT INTO game_structure (id, round_id) VALUES (((SELECT id FROM game_structure ORDER BY id desc LIMIT 1)+1), (SELECT id FROM round_types WHERE dash_id = '${dash_id}' ORDER BY id ASC LIMIT 1));`);
    } else if (req.body.method == "rm"){
        await db.none(`DELETE FROM game_structure WHERE id in (SELECT game_structure.id FROM game_structure INNER JOIN round_types ON game_structure.round_id = round_types.id WHERE dash_id = '${dash_id}' ORDER BY id desc LIMIT 1);`);
    }
})
;

router.get('/getnewroundid', async (req, res) => {
    let dash_id = req.params.dash_id
    let new_id = await db.one(`SELECT id FROM round_types WHERE dash_id = '${dash_id}' ORDER BY id DESC LIMIT 1`)
    res.send((new_id.id + 1).toString())

})
async function save_phase(id, type, content,dash_id) {
    try {
        if (type == "p") {
            await db.none(`UPDATE timers SET phase = '${content}' WHERE id = ${id}`
            );
        } else if (type == "d") {
            await db.none(`UPDATE timers SET duration = ${content} WHERE id = ${id}`
            );
        } else if (type == "n") {
            await db.none(`UPDATE round_types SET round_name = '${content}' WHERE id = ${id}`);
            
        } else if (type == "g"){
            await db.none(`UPDATE game_structure SET round_id = (SELECT id FROM round_types WHERE round_name = '${content}' AND dash_id = '${dash_id}') WHERE id = ${id};`)
        } else if (type == "m"){
            await db.none(`UPDATE timers SET minor = ${content} WHERE id = ${id};`
            );
        } else if (type == "a"){
            await db.none(`UPDATE timers SET audio_cue = ${content} WHERE id = ${id}`)
        }
        ;
        console.log("database updated")
        return true
    }
    catch (e) {
        console.log(e)
        return false
    }
}

async function add_phase(id,round_id,dash_id) {

    try {
        await db.none(`INSERT INTO timers (phase,duration,round_id,minor) VALUES ('',0,${round_id},false)`
        );
        return true
    }
    catch (e) {
        return false
    }
}

async function remove_phase(dash_id) {
    try {
        await db.none(`DELETE FROM timers WHERE id = (SELECT timers.id FROM timers inner join round_types on round_types.id = timers.round_id WHERE dash_id = '${dash_id}' ORDER BY id desc LIMIT 1)`
        );
        return true
    }
    catch (e) {
        return false
    }
}

async function get_phases() {
    try {
        return await db.any(phases_db_call(req.params.dash_id));

    }
    catch (e) {
        console.log(e)
    }
}



module.exports = router;