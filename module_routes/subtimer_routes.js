const express = require('express')
const router = express.Router({mergeParams: true})
const Timer = require('./timer.js')
var bodyParser = require('body-parser');
const qsstringify = require('qs');
var fs = require('fs');
const jst = require("javascript-stringify");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
function audio_db_call(dash_id){return `SELECT id, url, name FROM audio_cues WHERE dash_id = '${dash_id}' ORDER BY id;`}


const safeJSONParse = (JSONObj, defaultValue) => {
    try {
        const parsedValue = JSON.parse(JSONObj);
        return parsedValue;
    } catch (e) {
        console.log("ERROR: Could not parse JSON value " + JSONObj);
        return defaultValue;
    }
  }

router.get('/admin', async (req, res) => {
    let audio_list = await db.any(audio_db_call(req.params.dash_id));
    let dash_id = req.params.dash_id
    res.render('subtimer_admin', { "preferences": JSON.parse(fs.readFileSync('prefs.json', 'utf8'))[dash_id], 'audio_cues': audio_list, safeJSONParse });
});

router.get('/view', async (req, res) => {
    let dash_id = req.params.dash_id
    let audio_list = await db.any(audio_db_call(req.params.dash_id));
    console.log(JSON.parse(fs.readFileSync('prefs.json', 'utf8'))[dash_id] )
res.render('subtimer', { "preferences": JSON.parse(fs.readFileSync('prefs.json', 'utf8'))[dash_id], 'audio_cues': audio_list, "prefsobj": jst.stringify(JSON.parse(fs.readFileSync('prefs.json', 'utf8'))[dash_id])  });
});

module.exports = router;