'use strict'

const {fetch} = require('fetch-ponyfill')({Promise: require('pinkie-promise')})
const isString = require('lodash.isstring')
const merge = require('lodash.merge')
const querystring = require('querystring')
const stringify = querystring.stringify
const escape = querystring.escape
const moment = require('moment-timezone')

// todo: POI
const defaults = {
    limit: 5
}

// todo: umlauts

// this is necessary because of an unlucky situation with IDs in the data
const getStationID = (s) => {
    const body = {
        'results[5][2][function]': 'ws_info_stop',
        'results[5][2][data]': JSON.stringify([
            {"name": "results[5][2][stop]", "value": s},
            {"name": "results[5][2][date]", "value": moment.tz('Europe/Berlin').add(1, "days").format('DD.MM.YYYY')},
            {"name": "results[5][2][time]", "value": ""},
            {"name": "results[5][2][mode]", "value": "stop"}
        ])
    }

    return fetch('https://www.l.de/verkehrsbetriebe/fahrplan/', {
        method: 'post',
        body: stringify(body),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        }
    })
    .then((res) => res.json())
    .then((res) => {
        if(res.station_info.name !== s){
            throw new Error(`internal error: valid station ID! Expected "${s}", got "${res.station_info.name}"`)
        }
        return res.station_info.id
    })
    .catch((e) => null) // todo: not so stable :P
    // todo: what about res.lines (empty at the moment) and res.epon_ids?
}

const addStationID = (s) =>
    getStationID(s.name)
    .then((id) => merge({id: id+''}, s))

const transformStation = (s) => ({
    type: 'station',
    name: s.name,
    coordinates: {
        longitude: +s.lng,
        latitude: +s.lat
    }
})

const stations = (query, opt = {}) => {
    if(!query || !isString(query)){
        throw new Error('query must be a string != ""')
    }

    const options = merge(defaults, opt)
    return fetch(`https://www.l.de/ajax_de?mode=autocomplete&q=${escape(query)}&poi=&limit=${options.limit}`)
    .then((res) => res.json())
    .then((res) => res.stations)
    .then((res) => res.map(transformStation))
    .then((res) => Promise.all(res.map(addStationID)))
    .then((res) => res.filter((x) => !!x.id))
}

module.exports = stations
