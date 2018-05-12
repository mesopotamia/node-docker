'use strict';

const express = require('express');
const mongoose = require('mongoose');
const request = require('request');

//DB setup
mongoose.connect("mongodb://mongo:27017");

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/tickets', (req, res) => {
    getTickets().then((tickets) => {
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