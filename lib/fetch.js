'use strict'

const {fetch} = require('fetch-ponyfill')({Promise: require('pinkie-promise')})
const qs = require('querystring')

const endpoint = 'https://api.meinfernbus.de/mobile/v1/'

const request = (route, headers = {}, query = {}) => {
	query = qs.stringify(query)
	return fetch(endpoint + route + '?' + query, {headers})
	.then((res) => {
		if (!res.ok) {
			const err = new Error(res.statusText)
			err.statusCode = res.status
			throw err
		}

		return res.json()
	})
}

module.exports = request
