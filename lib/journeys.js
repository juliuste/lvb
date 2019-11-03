'use strict'

const { fetch } = require('fetch-ponyfill')()
const isString = require('lodash/isString')
const toArray = require('lodash/toArray')
const merge = require('lodash/merge')
const moment = require('moment-timezone')
const { stringify } = require('querystring')

// todo: modes of transport, delays

const defaults = {
	via: null
}

const transformRouteStop = (s) => ({
	type: 'station',
	id: s.id + '',
	name: s.name,
	coordinates: {
		longitude: s.lng,
		latitude: s.lat
	}
	// todo: arrival, departure, delay
})

const transformLeg = (l) => ({
	origin: {
		type: 'station',
		name: l.from.station,
		id: l.route[0].id + '',
		coordinates: {
			longitude: +l.route[0].lng,
			latitude: +l.route[0].lat
		}
	},
	destination: {
		type: 'station',
		name: l.to.station,
		id: l.route[l.route.length - 1].id + '',
		coordinates: {
			longitude: +l.route[l.route.length - 1].lng,
			latitude: +l.route[l.route.length - 1].lat
		}
	},
	line: {
		id: l.line,
		class: l.type,
		direction: l.direction,
		operator: l.operator,
		color: l.color
	},
	route: l.route.map(transformRouteStop),
	departure: moment.tz(l.from.datetime, 'YYYYMMDDHHmmss', 'Europe/Berlin').toDate(),
	departureDelay: (+l.from.shifting || 0) * 60 * 1000, // negative shifting?
	arrival: moment.tz(l.to.datetime, 'YYYYMMDDHHmmss', 'Europe/Berlin').toDate(),
	arrivalDelay: (+l.to.shifting || 0) * 60 * 1000, // negative shifting?
	departurePlatform: l.from.platform || null,
	arrivalPlatform: l.to.platform || null
})

const hashLeg = (l) => l.from.station + '@' + l.from.datetime + '@' + l.to.station + '@' + l.to.datetime + '@' + l.line + '@' + l.type
const hashJourney = (j) => j.sections.map(hashLeg).join('-')

const transformFare = (f) => ({
	type: 'fare',
	model: f.name,
	amount: +(f.price) / 100,
	currency: 'EUR'
})

const transformTariffs = (t) => ({
	model: t.tickets['1t0'].name,
	amount: +(t.tickets['1t0'].price) / 100,
	currency: 'EUR',
	fares: toArray(t.tickets).map(transformFare)
})

const transformZones = (z) => ({
	departure: z.zone_start,
	arrival: z.zone_end,
	list: z.zones // todo
})

const transformJourney = (j) => ({
	type: 'journey',
	id: hashJourney(j),
	legs: j.sections.map(transformLeg),
	price: transformTariffs(j.tariffs),
	zones: transformZones(j.tariffs)
})

const journeys = (origin, destination, date = Date.now(), opt = {}) => {
	const options = merge(defaults, opt)

	if (isString(origin)) origin = { id: origin, type: 'station' }
	if (isString(destination)) destination = { id: destination, type: 'station' }

	if (!isString(origin.id)) throw new Error('invalid or missing origin id')
	if (origin.type !== 'station') throw new Error('invalid or missing origin type')
	if (!isString(destination.id)) throw new Error('invalid or missing destination id')
	if (destination.type !== 'station') throw new Error('invalid or missing destination type')

	origin = origin.id
	destination = destination.id

	if (options.via) {
		if (isString(options.via)) options.via = { id: options.via, type: 'station' }
		if (!isString(options.via.id)) throw new Error('invalid or missing options.via id')
		if (options.via.type !== 'station') throw new Error('invalid or missing options.via type')
		options.via = options.via.id
	}

	const day = moment.tz(date, 'Europe/Berlin').format('DD.MM.YYYY')
	const time = moment.tz(date, 'Europe/Berlin').format('HH:mm')

	const body = {
		'results[5][2][function]': 'ws_find_connections',
		'results[5][2][data]': JSON.stringify([
			{ name: 'results[5][2][is_extended]', value: '1' },
			{ name: 'results[5][2][from]', value: origin },
			{ name: 'results[5][2][to]', value: destination },
			{ name: 'results[5][2][via]', value: options.via || '' },
			{ name: 'results[5][2][time_mode]', value: 'departure' },
			{ name: 'results[5][2][time]', value: time },
			{ name: 'results[5][2][date]', value: day },
			{ name: 'results[5][2][means_of_transport][]', value: 'STR' },
			{ name: 'results[5][2][means_of_transport][]', value: 'BUS' },
			{ name: 'results[5][2][means_of_transport][]', value: 'S/U' },
			{ name: 'results[5][2][means_of_transport][]', value: 'RB/RE' },
			{ name: 'results[5][2][mode]', value: 'connection' }
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
		.then((res) => toArray(res.connections))
		.then((res) => res.map(transformJourney))
}

module.exports = journeys
