'use strict';

const express = require('express');
const {MongoClient} = require('mongodb');
const request = require('request');
const assert = require('assert');
const url = 'mongodb://mongo:27017';

// Database Name
const dbName = 'ticks';

// Use connect method to connect to the server

const insertDocuments = function(records, callback) {
    // Get the documents collection
    MongoClient.connect(url, function(err, client) {
        assert.equal(err, null);
        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const collection = db.collection('tickets');
        let utcDate = new Date();
        utcDate.setUTCHours(0, 0, 0, 0);
        // Insert some documents
        const entry = {
            date: utcDate.toISOString(),
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

}
// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/tickets', (req, res) => {
    getTickets().then((tickets) => {
        insertDocuments(tickets, () => console.log('inserted successfully'));
        res.send(tickets);
    }).catch((error) => {
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
const getTickets = () => {
    const stubhubUrl = `https://intl.stubhub.com/events/407914/tickets?lastminute=false&buyRedirect
    =false&category=sports&ts=1526042608631&showall=1`;

    return new Promise((resolve, reject) => {
        request(stubhubUrl, (error, response, body) => {
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