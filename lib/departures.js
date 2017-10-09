'use strict'

const {fetch} = require('fetch-ponyfill')({Promise: require('pinkie-promise')})
const isString = require('lodash.isstring')
const isObject = require('lodash.isobject')
const toArray = require('lodash.toarray')
const merge = require('lodash.merge')
const moment = require('moment-timezone')
const qs = require('querystring').stringify

const defaults = {}

const transformTime = (date, time) => {
    date = moment.tz(date, 'Europe/Berlin').subtract(4, 'hours')
    let depDate = moment.tz(date.format('DD.MM.YYYY')+ ' ' + time, 'DD.MM.YYYY HH:mm', 'Europe/Berlin')
    // time before departure time?
    if(+depDate < +date){
        depDate = depDate.add(1, 'days')
    }
    return depDate.toDate()
}

const transformDeparture = (date) => (d) => ({
    line: {
        id: d.number,
        name: d.name,
        class: d.type,
        operator: d.operator,
        direction: d.direction
    },
    timetable: [
        {
            departure: transformTime(date, d.time),
            departureDelay: ((+d.time_prognosis) || 0) * 60 * 1000
        },
        ...(d.later_departures || []).map((ld) => ({
            departure: transformTime(date, ld.time),
            departureDelay: ((+ld.time_prognosis) || 0) * 60 * 1000
        }))
    ]
})

const departures = (station, date = Date.now(), opt = {}) => {
    const options = merge(defaults, opt)

    if(isString(station)) station = {id: station, type: 'station'}

    if(!isString(station.id)) throw new Error('invalid or missing station id')
    if(station.type !== 'station') throw new Error('invalid or missing station type')

    station = station.id

    const day = moment.tz(date, 'Europe/Berlin').format("DD.MM.YYYY")
    const time = moment.tz(date, 'Europe/Berlin').format("HH:mm")

    const body = {
        'results[5][2][function]': 'ws_info_stop',
        'results[5][2][data]': JSON.stringify([
            {"name": "results[5][2][stop]", "value": station},
            {"name": "results[5][2][date]", "value": day},
            {"name": "results[5][2][time]", "value": time},
            {"name": "results[5][2][mode]", "value": "stop"}
        ])
    }

    return fetch('https://www.l.de/verkehrsbetriebe/fahrplan/', {
        method: 'post',
        body: qs(body),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        }
    })
    .then((res) => res.json())
    .then((res) => res.connections.map(transformDeparture(date)))
}

module.exports = departures
