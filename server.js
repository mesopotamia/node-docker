'use strict';

const moment = require('moment');
const express = require('express');
const {MongoClient} = require('mongodb');
const request = require('request');
const assert = require('assert');
const url = 'mongodb://mongo:27017';

// Database Name
const DB_NAME = 'ticks';

const insertDocuments = function(collectionName = 'tickets', records, callback) {
    // Get the documents collection
    MongoClient.connect(url, function(err, client) {
        assert.equal(err, null);
        console.log("Connected successfully to server");

        const db = client.db(DB_NAME);
        const collection = db.collection(collectionName);
        // Insert some documents
        const entry = {
            date: moment().format(),
            tickets: records
        };
        collection.insert(entry, function(err, result) {
            assert.equal(err, null);
            // assert.equal(entry.tickets.length, result.result.tickets.n);
            // assert.equal(entry.length, result.ops.length);
            console.log(`Inserted ${entry.length} documents into the collection`);
            callback(result);
            client.close();
        });

    });

};
// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.post('/saveUEFATickets', (req, res) => {
    const url = `https://intl.stubhub.com/events/407914/tickets?lastminute=false&buyRedirect
    =false&category=sports&ts=1526042608631&showall=1`;
    getTickets(url).then((tickets) => {
        insertDocuments('tickets', tickets, () => res.send('inserted successfully'));
    }).catch((error) => {
        res.send('unsuccessful save');
        console.log(error);
    })
});
app.post('/saveWorldCupTickets', (req, res) => {
    const url = `https://intl.stubhub.com/events/357174/tickets?lastminute=false
        &buyRedirect=false&category=sports&ts=1526594098710&showall=1`;
    getTickets(url).then((tickets) => {
        insertDocuments('worldCupTickets', tickets, () => res.send('inserted successfully'));
    }).catch((error) => {
        res.send('unsuccessful save');
        console.log(error);
    })
});
app.get('/tickets/:sectionId', (req, res) => {
    getTickets().then((tickets) => {
        const section = req.params.sectionId;
        const ticketsBySection = getTicketsBySection(tickets, section);
        res.send(ticketsBySection);
    }).catch((error) => {
        console.log(error);
    })
});
app.get('/prices/:sectionId', (req, res) => {
    getTickets().then((tickets) => {
        const section = req.params.sectionId;
        const ticketsBySection = getTicketsBySection(tickets, section);
        const prices = getPrices(ticketsBySection);
        res.send(prices);
    });
});
app.get('/prices', (req, res) => {
    getTickets().then((tickets) => {
        res.send(getPrices(tickets));
    });
});
app.get('/averagePrice/:sectionId', (req, res) => {
    getTickets().then((tickets) => {
        const section = req.params.sectionId;
        const ticketsBySection = getTicketsBySection(tickets, section);
        const prices = getPrices(ticketsBySection);
        const averagePrice = String(getAveragePrice(prices));
        res.send(averagePrice);
    })
});
app.get('/averagePrice', (req, res) => {
    getTickets().then((tickets) => {
        const prices = getPrices(tickets);
        const averagePrice = String(getAveragePrice(prices));
        res.send(averagePrice);
    });
});
const getTickets = (url) => {

    assert(url, null);
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) {
                reject(error);
            }
            const data = JSON.parse(body);
            const {tickets} = data;
            resolve(tickets);
        });
    }).catch((error) => {
        console.log(error)
    })
};
const getPrices = (tickets) => {
    return tickets.map((item) => item.price.replace('CAD', '').replace(',', ''));
};
const getAveragePrice = (prices) => {
    return Math.round(prices.reduce(function (a, b) { return Number(a) + Number(b) }) / prices.length);
};
const getTicketsBySection = (tickets, section) => {
    return tickets.filter((ticket) => ticket.category.priceSection === section);
};
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);