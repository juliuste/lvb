'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const isObject = require('lodash/isObject')
const isNumber = require('lodash/isNumber')
const isString = require('lodash/isString')
const isDate = require('lodash/isDate')
const lvb = require('.')

tape('lvb.stations', async t => {
	const stations = await lvb.stations('Nationalbibliothek')
	t.ok(stations.length > 0, 'length')
	const [dnb] = stations
	t.ok(dnb.type === 'station', 'dnb type')
	t.ok(dnb.id === '11558', 'dnb id')
	t.ok(dnb.name === 'Leipzig, Deutsche Nationalbibliothek', 'dnb name')
	t.ok(isObject(dnb.coordinates) && isNumber(dnb.coordinates.latitude) && isNumber(dnb.coordinates.longitude), 'stations dnb coordinates')
	t.end()
})

const isDNB = (s) =>
	s.name === 'Leipzig, Deutsche Nationalbibliothek'	&&
s.id === '11558'

const isMesse = (s) =>
	s.name === 'Leipzig, Messegelände'	&&
s.id === '10818'

const isStation = (s) =>
	s.type === 'station'	&&
isObject(s.coordinates)	&&
s.coordinates.longitude > 0	&&
s.coordinates.latitude > 0

const isLine = (l) =>
	isString(l.id) && l.id.length > 0	&&
isString(l.class) && l.class.length > 0	&&
isString(l.direction) && l.direction.length > 0	&&
isString(l.operator) &&
isString(l.color) && l.color.length === 7

const isFare = (f) =>
	f.type === 'fare'	&&
isString(f.model) && f.model.length > 0	&&
isNumber(f.amount) && f.amount > 0	&&
f.currency === 'EUR'

tape('lvb.journeys', async t => {
	// DNB to Messegelände
	const journeys = await lvb.journeys('11558', '10818')
	t.ok(journeys.length > 0, 'length')
	const [journey] = journeys
	t.ok(journey.type === 'journey', 'journey type')
	t.ok(journey.id, 'journey id')

	t.ok(isDNB(journey.legs[0].origin), 'journey origin')
	t.ok(isMesse(journey.legs[journey.legs.length - 1].destination), 'journey destination')

	const leg = journey.legs[0]
	t.ok(isStation(leg.origin), 'journey leg origin')
	t.ok(isStation(leg.destination), 'journey leg destination')
	t.ok(isDate(leg.departure), 'journey leg departure')
	t.ok(isNumber(leg.departureDelay), 'journey leg departureDelay')
	t.ok(isDate(leg.arrival), 'journey leg arrival')
	t.ok(isNumber(leg.arrivalDelay), 'journey leg arrivalDelay')
	t.ok(isLine(leg.line), 'journey leg line')
	t.ok(leg.route.length >= 2, 'journey leg route length')
	t.ok(leg.route.every(isStation), 'journey leg route')
	t.ok(leg.route[0].id === leg.origin.id, 'journey leg route:first id')
	t.ok(leg.route[leg.route.length - 1].id === leg.destination.id, 'journey leg route:last id')

	t.ok(journey.price.currency === 'EUR', 'journey price currency')
	t.ok(journey.price.amount >= 2, 'journey price amount')
	t.ok(journey.price.model === 'Einzelfahrkarte', 'journey price model')
	t.ok(journey.price.fares.length > 0, 'journey price fares length')
	t.ok(journey.price.fares.every(isFare), 'journey price fares')
	t.end()
})

const isDepLine = (l) =>
	isString(l.id) && l.id.length > 0	&&
isString(l.class) && l.class.length > 0	&&
isString(l.direction) && l.direction.length > 0	&&
isString(l.operator) &&
isString(l.name) && l.name.length > 0

tape('lvb.departures', async t => {
	const departures = await lvb.departures('10818')
	t.ok(departures.length > 0, 'length')
	const [departuresForLine] = departures
	t.ok(isDepLine(departuresForLine.line), 'departure line')
	t.ok(departuresForLine.timetable.length > 0, 'departure timetable length')
	t.ok(isDate(departuresForLine.timetable[0].departure), 'departure timetable:first departure')
	t.ok(isNumber(departuresForLine.timetable[0].departureDelay), 'departure timetable:first departureDelay')
	t.end()
})
