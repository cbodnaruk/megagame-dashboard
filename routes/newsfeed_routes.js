const express = require('express')
const router = express.Router()

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });



router.post('/postcreate', urlencodedParser, async (req, res) => {
    var new_post = ''
    try {
        new_post = req.body.text;
        var success = save_post(new_post);
        while (!success) { }

        res.sendStatus(201);

    }
    catch (e) {
        res.send(toString(e));
    }
})

router.get('/editorload', async (req, res) => {
    try {
        const post_list = await db.any('SELECT * FROM posts ORDER BY id');
        res.render('newsfeed_editor', { "posts": post_list });
    }
    catch (e) {
        res.send(error)
    }
})

router.get('/authorload', async (req, res) => {
    res.render('newsfeed_author');
})

router.get('/postsload', async (req, res) => {
    try {
        const post_list = await db.any('SELECT * FROM posts ORDER BY id');
        res.render('newsfeed', { "posts": post_list });
    }
    catch (e) {
        res.send(e)
    }
})

router.post('/postdelete', urlencodedParser, async (req, res) => {
    var post_id;
    try {
        post_id = req.body.id;
        var success = delete_post(post_id);
        while (!success) { }

        res.sendStatus(201);

    }
    catch (e) {
        res.send(toString(e));
    }
})

router.post('/postupdate', urlencodedParser, async (req, res) => {

    try {
        var success = update_post(req.body.id, req.body.text);
        while (!success) { }

        res.sendStatus(201);

    }
    catch (e) {
        res.send(toString(e));
    }
})

async function save_post(post_text) {
    try {
        await db.none(`INSERT INTO posts (posttext,timecode,active) VALUES ('${post_text}', LOCALTIME(0),true)`
        );
        return true
    }
    catch (e) {
        return false
    }
}

async function delete_post(id) {
    try {
        await db.none(`UPDATE posts SET active = false WHERE ID = ${id}`
        );
        return true
    }
    catch (e) {
        return false
    }
}

async function update_post(id, text) {
    try {
        await db.none(`UPDATE posts SET posttext = '${text}' WHERE ID = ${id}`
        );
        return true
    }
    catch (e) {
        return false
    }
}

module.exports = router;