var path = require('path'),
    cwd  = process.cwd();

module.exports = {
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
            height: 570,
            scale:  1,
            stream_url: process.env.WEBVFX_STREAM_URL
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
        Redis: {
            host: process.env.REDISHOST,
            port: parseInt(process.env.REDISPORT),
            password: process.env.REDISPASSWORD,
        }
    },
    Data: {
        Medias: {
            collection_db: 'medias',
            backend: 'mediabackend',
            model: 'Media.Model',
            collection: 'Media.Collection',
            collection_pagebale: 'Media.CollectionPageable'
        },
        Pieces: {
            collection_db: 'pieces',
            backend: 'piecebackend',
            model: 'Media.Piece',
            collection: 'Media.PieceCollection',
            collection_pagebale: 'Media.PieceCollectionPageable',
        },
        Lists: {
            collection_db: 'lists',
            backend: 'listbackend',
            model: 'Media.Playlist',
            collection: 'Media.Universe',
            collection_pagebale: 'Media.UniversePageable',
        },
        Scheds: {
            collection_db: 'scheds',
            backend: 'schedbackend',
            model: 'Media.Occurrence',
            collection: 'Media.Schedule',
            collection_pagebale: 'Media.SchedulePageable',
        },
        Transforms: {
            collection_db: 'transforms',
            backend: 'transformbackend',
            model: 'Media.Transform',
            collection: 'Media.TransformCollection',
            collection_pagebale: 'Media.TransformCollection',
        },
        Mostomessages: {
            collection_db: 'mostomessages',
            backend: '',
            model: 'Media.Model',
            collection: 'Media.Collection',
            collection_pagebale: 'Media.CollectionPageable',
        },
        Sketchs: {
            collection_db: 'sketchs',
            backend: 'sketchbackend',
            model: 'Sketch.Model',
            collection: 'Sketch.Collection',
            collection_pagebale: '',
        },
        Status: {
            collection_db: 'status',
            backend: 'statusbackend',
            model: 'App.Status',
            collection: '',
            collection_pagebale: '',
        }
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
