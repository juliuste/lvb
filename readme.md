# lvb

Client for the [LVB](https://l.de/verkehrsbetriebe) (Leipziger Verkehrsbetriebe) API. Inofficial, please ask LVB for permission before using this module in production. **Actually, there should be no need for projects like this since municipal public transportation endpoints should be open to the public. It's 2018.**

[![npm version](https://img.shields.io/npm/v/lvb.svg)](https://www.npmjs.com/package/lvb)
[![Build Status](https://travis-ci.org/juliuste/lvb.svg?branch=master)](https://travis-ci.org/juliuste/lvb)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/lvb.svg)](https://greenkeeper.io/)
[![dependency status](https://img.shields.io/david/juliuste/lvb.svg)](https://david-dm.org/juliuste/lvb)
[![dev dependency status](https://img.shields.io/david/dev/juliuste/lvb.svg)](https://david-dm.org/juliuste/lvb#info=devDependencies)
[![license](https://img.shields.io/github/license/juliuste/lvb.svg?style=flat)](LICENSE)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

```shell
npm install --save lvb
```

## Usage

This package mostly returns data in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format):

- [`stations(query, [opt])`](#stationsquery-opt) - Search for stations
- [`departures(station, date = Date.now())`](#departuresstation-date--datenow) - Departures at a given station
- [`journeys(origin, destination, date = Date.now(), [opt])`](#journeysorigin-destination-date--datenow-opt) - Search for journeys between stations

### `stations(query, [opt])`

Using `lvb.stations`, you can query stations operated bei LVB.

```js
const stations = require('lvb').stations

stations('Nationalbibliothek').then(console.log)
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in an array of `station`s in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format) which looks as follows:

```js

[
    {
        "id": "11558",
        "type": "station",
        "name": "Leipzig, Deutsche Nationalbibliothek",
        "coordinates": {
            "longitude": 12.396131411662,
            "latitude": 51.323542325868
        }
    }
    // …
]
```

`defaults`, partially overridden by the `opt` parameter, looks as follows:

```js
const defaults = {
    limit: 5 // Maximum number of returned results. CAUTION: Because of something unlucky that happens to station ids in the API, a `stations` request will spawn (number of results + 1) requests. Keep this in mind when increasing this threshold.
}
```

### `departures(station, date = Date.now())`

Using `lvb.departures`, you can get departures at a given station for a specific date and time.

```js
const departures = require('lvb').departures

const Nationalbibliothek = '11558'

departures(Nationalbibliothek, new Date())
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in a list of objects (one object per direction per line) like this:

```js
[
    {
        "line": {
            "id": "16",
            "name": "Str   16", // yeah, that really looks like this :/
            "class": "StN",
            "operator": "LVB",
            "direction": "Lößnig über Connewitz, Kreuz"
        },
        "timetable": [
            {
                "departure": "2017-10-09T16:09:00.000Z", // JS Date() object
                "departureDelay": 0
            },
            {
                "departure": "2017-10-09T16:19:00.000Z", // JS Date() object
                "departureDelay": 0
            },
            {
                "departure": "2017-10-09T16:29:00.000Z", // JS Date() object
                "departureDelay": 0
            },
            {
                "departure": "2017-10-09T16:39:00.000Z", // JS Date() object
                "departureDelay": 0
            },
            {
                "departure": "2017-10-09T16:51:00.000Z", // JS Date() object
                "departureDelay": 0
            }
        ]
    }
    // …
]
```

### `journeys(origin, destination, date = Date.now(), [opt])`

Using `lvb.journeys`, you can get directions and prices for routes from A to B.

```js
const journeys = require('lvb').journeys

journeys(origin, destination, date = Date.now(), opt = defaults)

const Nationalbibliothek = '11558'
const Messe = '10818'
const date = new Date()

journeys(Nationalbibliothek, Messe, date)
.then(console.log)
.catch(console.error)
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve with an array of `journey`s in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format) which looks as follows.
*Note that the legs are not (fully) spec-compatible, as the `schedule` is missing (see the `line` and `route` keys instead).*

```js
[
    {
        "type": "journey",
        "id": "Leipzig, Deutsche Nationalbibliothek@20171009173100@Leipzig, Wilhelm-Leuschner-Platz@20171009173900@SEV16@BUN-Leipzig, Wilhelm-Leuschner-Platz@20171009174200@Leipzig, Messegelände@20171009180800@16@STN",
        "legs": [
            {
                "origin": {
                    "type": "station",
                    "name": "Leipzig, Deutsche Nationalbibliothek",
                    "id": 11558,
                    "coordinates": {
                        "longitude": 12.395702,
                        "latitude": 51.32357
                    }
                },
                "destination": {
                    "type": "station",
                    "name": "Leipzig, Wilhelm-Leuschner-Platz",
                    "id": 12992,
                    "coordinates": {
                        "longitude": 12.375872,
                        "latitude": 51.335876
                    }
                },
                "line": {
                    "id": "SEV16",
                    "class": "BUN",
                    "direction": "Wilhelm-Leuschner-Platz",
                    "operator": "Leipziger Verkehrsbetriebe",
                    "color": "#017C46"
                },
                "route": [
                    {
                        "type": "station",
                        "id": 11558,
                        "name": "Leipzig, Deutsche Nationalbibliothek",
                        "coordinates": {
                            "longitude": 12.395702,
                            "latitude": 51.32357
                        }
                    },
                    {
                        "type": "station",
                        "id": 11557,
                        "name": "Leipzig, Johannisallee",
                        "coordinates": {
                            "longitude": 12.388807,
                            "latitude": 51.327309
                        }
                    }
                    // …
                ],
                "departure": "2017-10-09T15:31:00.000Z", // JS Date() object
                "departureDelay": 0,
                "arrival": "2017-10-09T15:39:00.000Z", // JS Date() object
                "arrivalDelay": 0,
                "departurePlatform": null,
                "arrivalPlatform": null
            },
            {
                "origin": {
                    "type": "station",
                    "name": "Leipzig, Wilhelm-Leuschner-Platz",
                    "id": 12992,
                    "coordinates": {
                        "longitude": 12.375872,
                        "latitude": 51.335876
                    }
                },
                "destination": {
                    "type": "station",
                    "name": "Leipzig, Messegelände",
                    "id": 10818,
                    "coordinates": {
                        "longitude": 12.396583,
                        "latitude": 51.396724
                    }
                },
                "line": {
                    "id": "16",
                    "class": "STN",
                    "direction": "Messegelände",
                    "operator": "Leipziger Verkehrsbetriebe",
                    "color": "#017C46"
                },
                "route": [
                    {
                        "type": "station",
                        "id": 12992,
                        "name": "Leipzig, Wilhelm-Leuschner-Platz",
                        "coordinates": {
                            "longitude": 12.375872,
                            "latitude": 51.335876
                        }
                    },
                    {
                        "type": "station",
                        "id": 13002,
                        "name": "Leipzig, Augustusplatz",
                        "coordinates": {
                            "longitude": 12.382012,
                            "latitude": 51.338905
                        }
                    }
                    // …
                ],
                "departure": "2017-10-09T15:42:00.000Z", // JS Date() object
                "departureDelay": 0,
                "arrival": "2017-10-09T16:08:00.000Z", // JS Date() object
                "arrivalDelay": 0,
                "departurePlatform": null,
                "arrivalPlatform": null
            }
        ],
        "price": {
            "model": "Einzelfahrkarte",
            "amount": 2.6,
            "currency": "EUR",
            "fares": [
                {
                    "type": "fare",
                    "model": "Einzelfahrkarte",
                    "amount": 2.6,
                    "currency": "EUR"
                },
                {
                    "type": "fare",
                    "model": "Einzelfahrkarte Kind",
                    "amount": 1.2,
                    "currency": "EUR"
                },
                {
                    "type": "fare",
                    "model": "4-Fahrten-Karte",
                    "amount": 10.4,
                    "currency": "EUR"
                }
                // …
            ]
        },
        "zones": {
            "departure": "110",
            "arrival": "110",
            "list": "110"
        }
    }
    // …
]
```

----

`defaults`, partially overridden by the `opt` parameter, looks like this:

```js
const defaults = {
    via: null // station id
}
```

## See also

- [FPTF](https://github.com/public-transport/friendly-public-transport-format) - "Friendly public transport format"
- [FPTF-modules](https://github.com/public-transport/friendly-public-transport-format/blob/master/modules.md) - modules that also use FPTF

## Contributing

If you found a bug, want to propose a feature or feel the urge to complain about your life, feel free to visit [the issues page](https://github.com/juliuste/lvb/issues).
