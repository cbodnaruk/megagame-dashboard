var fs = require('fs');
var http = require('http');
const config = require('./config.js');

const express = require('express')
const app = express()
const pug = require('pug');
var httpServer = http.createServer(app);
const expressWs = require('express-ws')(app);
const { getDatabaseConnection } = require('./database/connection.js')

global.db = getDatabaseConnection(config.get('database.url'))

app.use((req, res, next) => {
    if (req.path.slice(-1) === '/' && req.path.length > 1) {
      const query = req.url.slice(req.path.length)
      const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
      res.redirect(301, safepath + query)
    } else {
      next()
    }
  })


app.use(express.static('public'));
let sqlSanitizer = require('sql-sanitizer');
app.use(sqlSanitizer);
app.use(express.json());

app.set('view engine', 'pug');
app.set('views', './views');

const dash_routes = require('./routes/dash_routes.js');

app.get('/login', (req, res) => {
  res.send("test")
})

app.use('/:dash_id', dash_routes);



app.get('/', async (req, res) => {

    res.render('landing', {"is404": false});
})



app.use((req, res, next) => {
    res.status(404).render('landing', {"is404": true})
  });


  

app.listen(8080, () => {
    console.log('Port 8080 Open')
});

global.aWss = expressWs.getWss();



