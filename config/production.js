var path = require('path'),
    cwd  = process.cwd();

module.exports = {
    Hidden: ['Hidden', 'Search', 'timestamp'],
    Caspa: {
        Branding: {
            name: 'MBC Playout {mlt edition}',
            description: 'A simple Playout server built with magic and love',
        },
        Dirs: {
            pub : path.join(cwd, 'public'),
            views : path.join(cwd, 'views') ,
            styles : path.join(cwd, 'styles'),
            models : path.join(cwd, 'models'),
            vendor : path.join(cwd, 'vendor'),
            uploads: path.join(cwd, 'public', 'uploads', 'incoming'),
            screenshots: path.join(cwd, 'public','sc'),
            scrape : path.join(cwd, 'videos'),
            logs :  path.join(cwd, 'logs'),
        },
        Playout: {
            horizontal: '0',
        },
        Others: {
            timezone: 'UTC',
        },
    },
    Mosto: {
        Branding: {
            name: 'MBC Mosto',
            description: 'MBC Playout\'s playlist juggler',
        },
        General: {
            fps: 25,
            resolution: "hd",
            playout_mode: "snap",
            min_scheduled_hours: "4",
            timer_interval: 1000,
            blank: path.join(cwd, 'images', 'blank.xml'),
            blank_length: 15000,
            reload_timer_diff: 20000,
            playlist_server: "mongo",
            mvcp_server: "melted",
        },
        Melted: {
            bin: "melted",
            root: cwd,
            host: "localhost",
            port: 5250,
            output: "sdl",
            playlists_xml_dir: path.join('test', 'playlists'),
        },
        Mongo: {
            load_time: 120,
        },
        Json: {
            to_read:    path.join(cwd ,'playlists','to_read'),
            playing:    path.join(cwd ,'playlists', 'playing'),
            old:    path.join(cwd ,'playlists','old'),
        },
    },
    Webvfx: {
        Branding: {
            name: 'MBC Webvfx Editor',
            description: 'HTML5 Editor for Webvfx (Video effects engine)',
        },
        Dirs: {
            pub : path.join(cwd, 'public'),
            views : path.join(cwd, 'views'),
            styles : path.join(cwd, 'styles'),
            models : path.join(cwd, 'models'),
            vendor : path.join(cwd, 'vendor'),
            uploads: path.join(cwd, 'public', 'images'),
            logs :  path.join(cwd, 'logs'),
        },
        Editor: {
            server: process.env.WEBVFX_SERVER,
            width:  720,
            height: 576,
            scale:  1,
            stream_url: process.env.WEBVFX_STREAM_URL,
            realTimeEdition: false,
            showSafeArea: false,
            videoPreview: false,
        },
    },
    Common: {
        Branding: {
            name: 'MBC Common',
            description: 'Common code for mbc-playout and mbc-mosto',
        },
        MediaDB: {
            dbName: process.env.DBNAME,
            dbHost: process.env.DBHOST,
            dbPort: parseInt(process.env.DBPORT),
            dbUser: process.env.DBUSER,
            dbPassword: process.env.DBPASSWORD,
        },
        TestingDB: {
            dbName: process.env.TESTDBNAME,
            dbHost: process.env.DBHOST,
            dbPort: parseInt(process.env.DBPORT),
            dbUser: process.env.DBUSER,
            dbPassword: process.env.DBPASSWORD,
        },
        Redis: {
            host: process.env.REDISHOST,
            port: parseInt(process.env.REDISPORT),
            password: process.env.REDISPASSWORD,
        },
        Collections: {
            Medias: 'medias',
            Pieces: 'pieces',
            Lists:  'lists',
            Scheds: 'scheds',
            Transforms: 'transforms',
            Status: 'status',
            Mostomessages: 'mostomessages',
            Sketchs: 'sketchs',
            Auth: 'users',
            Transcoding: 'transcode_queue',
            SketchSchedules: 'sketchschedules',
        },
        Widgets: {
            Files: [
                'WebvfxSimpleWidget',
                'ShareRegular',
                'ShareBold',
            ],
            WeatherWoeid: 468739, // Autonomous City of Buenos Aires
        },
        Others: {
            maxage: 365 * 24 * 60 * 60 * 1000,
        },
    },
    Search: {
        Medias: {
            fulltext: [ 'name', 'title', 'stat.name' ],
            facets:  [
                'durationsec',
                'video.resolution.w',
                'video.resolution.h',
                'video.fps',
                'video.bitrate',
                'video.container',
                'video.codec',
                'audio.codec'
            ],
            criteria: {},
            max_facets: 100
        },
        Lists: {
            fulltext: [ 'name' ],
            facets: [
                'duration',
            ],
            criteria: { ids_in: '{ "_id": { "$in": [%value%] } }', },
            max_facets: 100
        },
        Scheds: {
            fulltext: [ 'title' ],
            facets: [],
            criteria: { in_window: '{ "end": { "$gt": %value% }, "start": { "$lt" : %value% } }' },
            max_facets: 100
        },
        Pieces: {
            fulltext: [],
            facets: [],
            criteria: { ids_in: '{ "_id": { "$in": [%value%] } }', },
            max_facets: 100
        },
        Transforms: {
            fulltext: [],
            facets: [],
            criteria: {},
            max_facets: 100
        },
        Status: {
            fulltext: [],
            facets: [],
            criteria: {},
            max_facets: 100
        },
        Mostomessages: {
            fulltext: [],
            facets: [],
            criteria: {},
            max_facets: 100
        },
        Sketchs: {
            fulltext: [],
            facets: [],
            criteria: {},
            max_facets: 100
        }
    }
}
