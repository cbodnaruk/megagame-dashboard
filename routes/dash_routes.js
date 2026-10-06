
const express = require('express')
var fs = require('fs');
const router = express.Router({ mergeParams: true })
const default_prefs = JSON.parse(fs.readFileSync('default_prefs.json', 'utf-8'));
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const jst = require("javascript-stringify");
const newsfeed_routes = require('../module_routes/newsfeed_routes.js');
router.use('/newsfeed', newsfeed_routes);
const timer_routes = require('../module_routes/timer_routes.js');
router.use('/timer', timer_routes);
const numbers_routes = require('../module_routes/numbers_routes.js');
router.use('/numbers', numbers_routes);
const subtimer_routes = require('../module_routes/subtimer_routes.js');
router.use('/subtimer', subtimer_routes);
const audio_routes = require('../module_routes/audio_routes.js');
router.use('/audio', audio_routes);
function new_db_audio(dash_id) { return `INSERT INTO audio_cues (url,name,dash_id) VALUES ('url_here','Cue 1','${dash_id}');` }
function new_db_posts(dash_id) { return `INSERT INTO posts (posttext,timecode,active,dash_id) VALUES ('Welcome to megagame.space!','00:00:00',true,'${dash_id}');` }
function new_db_timer1(dash_id) { return `INSERT INTO round_types (round_name,dash_id) VALUES ('Main','${dash_id}') RETURNING id;` }
function new_db_timer2(round_id) { return `INSERT INTO game_structure (round_id) VALUES (${round_id});` }
function new_db_timer3(round_id) { return `INSERT INTO timers (phase,duration,round_id,minor) VALUES ('Main',20,${round_id},false);` }
function audio_db_call(dash_id) { return `SELECT id, url, name FROM audio_cues WHERE dash_id = '${dash_id}' ORDER BY id;` }

async function load_dash_list() {
    list = await db.any('SELECT dash_id FROM dashboards;')
    outlist = []
    for (x in list) {
        outlist.push(list[x].dash_id)
    }
    return outlist
}


const safeJSONParse = (JSONObj, defaultValue) => {
    try {
        const parsedValue = JSON.parse(JSONObj);
        return parsedValue;
    } catch (e) {
        console.log("ERROR: Could not parse JSON value " + JSONObj);
        return defaultValue;
    }
}

async function checkPrefCompleteness(raw_prefs, dashId) {
    dash_list = await load_dash_list()
    let complete_prefs = {}

    for (d in dash_list) {
        let dash = dash_list[d]
        let new_prefs = {}
        //check if new dashboard
        if (!Object.hasOwn(raw_prefs, dash)) {
            raw_prefs[dash] = {}
            generateNewDatabase(dash)
        }
        for (p in default_prefs) {
            if (p == "dash_id") {
                new_prefs[p] = dash
            } else if (Object.hasOwn(raw_prefs[dash], p)) {
                new_prefs[p] = raw_prefs[dash][p]
            } else {
                new_prefs[p] = default_prefs[p]
            }

        }
        complete_prefs[dash] = new_prefs
    }

    fs.writeFile('prefs.json', JSON.stringify(complete_prefs), (err) => {
        if (err) console.log("Failed to save");
        console.log('The file has been saved!');
    })
    return complete_prefs
}

async function generateNewDatabase(dash_id) {
    try {
        await db.none(new_db_audio(dash_id));
        await db.none(new_db_posts(dash_id));
        let round_id = await db.any(new_db_timer1(dash_id));
        await db.none(new_db_timer2(round_id[0].id));
        await db.none(new_db_timer3(round_id[0].id));

    } catch (e) {
        console.log(e, dash_id);
    }
}

router.get('/', async (req, res) => {
    dash_list = await load_dash_list()
    let dashId = req.params.dash_id
    prefs = JSON.parse(fs.readFileSync('prefs.json', 'utf8'))
    if (dash_list.includes(dashId)) {
        res.render('home', { 'dash_id': dashId, 'preferences': prefs[dashId], safeJSONParse });
    } else {
        res.render('landing', { "is404": true })
    }
})

router.get('/admin', async (req, res) => {
    dash_list = await load_dash_list()
    let dashId = req.params.dash_id
    let audio_list = await db.any(audio_db_call(req.params.dash_id));
    let dash_styles = ""
    try { dash_styles = fs.readFileSync(`./public/css/${dashId}_styles.css`) } catch (err) { console.log("No custom styles") }
    if (dash_list.includes(dashId)) {
        prefs = await checkPrefCompleteness(JSON.parse(fs.readFileSync('prefs.json', 'utf8')), dashId)
        res.render('administration', { 'dash_id': dashId, 'preferences': prefs[dashId], 'prefsobj': jst.stringify(prefs[dashId]), "saudiocues": jst.stringify(audio_list), 'dash_styles': dash_styles, safeJSONParse });
    } else {
        res.render('landing', { "is404": true })

    }
    dash_list = JSON.parse(fs.readFileSync('dash_list.txt', 'utf8'));
})


router.get('/media', async (req, res) => {
    dash_list = await load_dash_list()
    let dashId = req.params.dash_id
    if (dash_list.includes(dashId)) {
        prefs = JSON.parse(fs.readFileSync('prefs.json', 'utf8'))
        res.render('media', { 'dash_id': dashId, 'preferences': prefs[dashId], 'prefsobj': jst.stringify(prefs[dashId]) });
    } else {
        res.render('landing', { "is404": true })
    }
})
router.post('/updatepreferences', urlencodedParser, (req, res) => {
    let dashId = req.params.dash_id
    prefs[dashId][req.body.preference] = req.body.value;
    fs.writeFile('prefs.json', JSON.stringify(prefs), (err) => {
        if (err) console.log("Failed to save");
        console.log('The file has been saved!');
    })
})

router.post('/updatecss', urlencodedParser, (req, res) => {
    let dashId = req.params.dash_id
    console.log(req.body.css)
    fs.writeFile(`public/css/${dashId}_styles.css`, req.body.css, function (err) {
        if (err) throw err;
        console.log('Saved!');
    })

})
//post for the audio settings (database and not prefs file)

module.exports = router;