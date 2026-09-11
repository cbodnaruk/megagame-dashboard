const express = require('express')
const router = express.Router({mergeParams: true})
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var fs = require('fs');
//create a variable which holds the numbers for each dashboard
//each dashboard is represented by an object 
var dash_list = JSON.parse(fs.readFileSync('dash_list.txt', 'utf8'));
var numbers = []
function Number(name, value){
    this.name = name;
    this.value = value;
    this.last_value = 0;
    this.wiggle = false;
    this.color = "#FFFFFF";
    this.separator = 1;
}
for (let dash in dash_list){
    numbers[dash_list[dash]] = new Array()
    numbers[dash_list[dash]].push(new Number("Statistic",0))
}

router.get('/view', (req, res) => {
    var prefs = JSON.parse(fs.readFileSync('prefs.json', 'utf8'))
    res.render('numbers', { "number_list": numbers[req.params.dash_id], 'preferences': prefs[req.params.dash_id] })
})


router.get('/editor', (req, res) => {
    res.render('numbers_editor', { "number_list": numbers[req.params.dash_id] })
})

router.post('/update', urlencodedParser, (req, res) => {

    for (num in numbers[req.params.dash_id]){
        if (numbers[req.params.dash_id][num].name == req.body.name){
            console.log(`${req.body.name}: ${req.body.number}`)
            numbers[req.params.dash_id][num].last_value = numbers[req.params.dash_id][num].value
            numbers[req.params.dash_id][num].value = req.body.number;
            numbers[req.params.dash_id][num].color = req.body.new_color;
            numbers[req.params.dash_id][num].wiggle = req.body.wiggle;
            numbers[req.params.dash_id][num].separator = req.body.separator;
            console.log(`${req.body.name} > ${req.body.new_name}`)
            numbers[req.params.dash_id][num].name = req.body.new_name;
        }
    }

    
})

router.post('/add', urlencodedParser, (req, res) => {
    if (!numbers[req.params.dash_id]){
        numbers[req.params.dash_id] = new Array()
    }
    numbers[req.params.dash_id].push(new Number(req.body.name,0))
})

router.post('/rm', urlencodedParser, (req, res) => {
    numbers[req.params.dash_id].pop()
})

module.exports = router;