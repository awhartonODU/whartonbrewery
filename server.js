var express = require('express'),
    cons = require('consolidate'),
    beers = require('./beers').beers,
    app = express(),
    Wreck = require('wreck'),
    untappd_client_id = '34FAA84221D10BA443772D524F3370E6495CDA2A',
    untappd_client_secret = '46A6ED857EFDE06ED5F33E9824CBFA6029ED44FF',
    untappd_beer_info_url = 'https://api.untappd.com/v4/beer/info/',
    BPromise = require('bluebird'),
    fs = require('fs');

// assign the swig engine to .html files
app.engine('jade', cons.jade);

// set .html as the default extension
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use('/images', express.static('images'));
app.use('/beers', express.static('beers'));

app.get('/', function(req, res){
    res.render('index', {
        title: 'Wharton Homebrew',
        beers: beers
    });
});

app.get('/beer', function(req, res){
    var beerDetails;

    getBeerDetailFromUntappd(beers[req.query.b].untappd_id)
        .then(function (beer) {
            beerDetails = beer;
        })
        .then(function () {
            res.render('beer', {
              title: 'Wharton Homebrew',
              beers: beers,
              beer: beers[req.query.b],
              beer_detail: beerDetails
            });
        });
});

app.get('/checkin', function (req, res) {
    var drinker = req.query.drinker.replace(/ /g, '_');
    return checkinBeer(req.query.beer, drinker)
        .then(function(beer) {
            fs.writeFileSync('./beers.js', "exports.beers = " + JSON.stringify(beers));    
            res.redirect("http://www.untappd.com/b/wharton-brewery-" + req.query.untappd_slug + "/" + req.query.untappd_id);
        });
});

app.listen(process.env.PORT || 3000);
console.log('Express server listening on port 3000');

function getBeerDetailFromUntappd (bid) {
    var requestUrl = untappd_beer_info_url + bid + '?client_id=' + untappd_client_id + '&client_secret=' + untappd_client_secret,
        beerDetail;

    return new BPromise (function (resolve, reject) {
        Wreck.get(requestUrl, {json: true}, function (err, res, payload) {
            if (err) {
                reject(err);
            }
            resolve(payload.response.beer);
        });
    });
}

function checkinBeer (beer, drinker) {
    var beer = beers[beer];

    beer.stock--;
    if(!beer.drinkers[drinker]) {
        beer.drinkers[drinker] = 1;
    }
    else {
        beer.drinkers[drinker]++;
    }

    return new BPromise(function (resolve, reject) {
        resolve();
    });   
}
