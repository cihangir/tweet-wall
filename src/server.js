// Require dependencies
var app = require('http').createServer()
    , fs = require('fs')
    , io = require('socket.io').listen(app)
    , redis = require('redis')
    , client = redis.createClient()
    , twitter = require('ntwitter');

// creating the server ( localhost:8000 )
app.listen(8000);

var twit = new twitter({
    consumer_key:'1',
    consumer_secret:'1',
    access_token_key:'1',
    access_token_secret:'1'
});

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function (socket) {

	//async stuff :/
    socket.on('emit_msg', function (id) {
        client.hget(id, "image", function (err, image) {
                client.hget(id, "text", function (err, text) {
                        client.hget(id, "screenName", function (err, screenName) {
                                io.sockets.volatile.emit('broadcast_tweet',
                                    {
                                        id : id,
                                        image : image,
                                        screenName : screenName,
                                        text : text
                                    }
                                )
                            }
                        )
                    }
                )
            }
        );
    });

    // Handle disconnection of clients
    socket.on('disconnect', function () {
		// Broadcast to all users the disconnection message
		//io.sockets.volatile.emit('broadcast_msg', disconnected_msg);
    });

    twit.stream('statuses/filter', {'track':'BenceBirgün'}, function (stream) {
        stream.on('data', function (data) {
            if (data.id_str) {
                client.hset(data.id_str, "image", data.user.profile_image_url, redis.print);
                client.hset(data.id_str, "text", data.text, redis.print);
                client.hset(data.id_str, "screenName", data.user.screen_name, redis.print);
                client.hset(data.id_str, "data", data, redis.print);

                client.hset('tweets', data.id_str, 'N', redis.print);
                socket.emit('broadcast_msg', data);
            }
        });
    });
});


client.on('error', function (err) {
    console.log('Error ' + err);
});

