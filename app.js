var request = require("request");
var request = request.defaults({ jar: true });
var cheerio = require("cheerio");
var fs = require('fs');
var sanitize = require("sanitize-filename");
var nodeID3 = require('node-id3');
var user = 'weirdpolice';
var musicDir = './Music';
var timeoutDuration = 180000; // mp3 and album art requests time out after 3 mins

// Create Music folder if it doesn't exist
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir);
}

function downloadSong(id, key, artist, title, albumArt, index) {
    logMessage('Currently at song index: ' + index);
    logMessage('Requesting song file URL from http://hypem.com/serve/source/' + id + '/' + key + ' for ' + artist + ' - ' + title);
    request('http://hypem.com/serve/source/' + id + '/' + key, function (error, response, body) {

        if (!error && response.statusCode == 200) {
            var downloadLink = JSON.parse(body).url;
            // Handles weird links that are stored as objects perhaps for a reason but let's download them anyway
            if (typeof downloadLink == 'object') {
                downloadLink = downloadLink.data;
            }
            // Fix for some Tumblr links
            if (downloadLink.substring(0, 17) === 'http://www.tumblr') {
                downloadLink = getPathFromUrl(downloadLink);
            }
            var fileLocation = musicDir + '/' + sanitize(artist + ' - ' + title + '.mp3');
            console.log('Downloading ' + title + ' by ' + artist + ' from ' + downloadLink);
            var mp3RequestOptions = {
                url: downloadLink,
                timeout: timeoutDuration
            };
            var mp3Request = request(mp3RequestOptions);
            mp3Request.on('error', function (error) {
                logMessage('********Problem downloading ' + title + ' by ' + artist + '********');
                // Try next song
                if (index < songs.length - 1) {
                    downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
                } else {
                    logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
                }
            });
            mp3Request.on('response', function (response) {
                if (response.statusCode == 200) {
                    mp3Request.pipe(fs.createWriteStream(fileLocation))
                        .on('finish', function () {
                            logMessage(title + ' by ' + artist + ' finished writing to storage');
                            logMessage('Downloading album art for ' + title + ' by ' + artist);
                            var albumArtRequestOptions = {
                                url: albumArt,
                                timeout: timeoutDuration
                            }
                            if (albumArt !== undefined) {
                                var albumArtRequest = request(albumArtRequestOptions);
                                albumArtRequest.on('error', function (error) {
                                    logMessage('********Problem downloading album art for ' + title + ' by ' + artist + '********');
                                    // Try next song
                                    if (index < songs.length - 1) {
                                        downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
                                    } else {
                                        logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
                                    }
                                });
                                albumArtRequest.on('response', function (response) {
                                    if (response.statusCode == 200) {
                                        albumArtRequest.pipe(fs.createWriteStream(musicDir + '/art.jpg'))
                                            .on('finish', function () {
                                                writeMeta(artist, title, fileLocation, musicDir + '/art.jpg', true);
                                                // If more in list, download more
                                                if (index < songs.length - 1) {
                                                    downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
                                                } else {
                                                    logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
                                                }
                                            });
                                    } else {
                                        logMessage('********Problem downloading album art for ' + title + ' by ' + artist + '. Probably a 404********');
                                        writeMeta(artist, title, fileLocation, musicDir + '/art.jpg', false);
                                        if (index < songs.length - 1) {
                                            downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
                                        } else {
                                            logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
                                        }
                                    }
                                });
                            } else {
                                logMessage('********No album art for ' + title + ' by ' + artist + '. The HypeM API is probably missing the data********');
                                writeMeta(artist, title, fileLocation, musicDir + '/art.jpg', false);
                                if (index < songs.length - 1) {
                                    downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
                                } else {
                                    logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
                                }
                            }
                        });
                } else {
                    logMessage('********Problem downloading ' + title + ' by ' + artist + '.. Probably a 404 link********');
                    if (index < songs.length - 1) {
                        downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
                    } else {
                        logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
                    }
                }

            });
        } else {
            if (response.statusCode == 404) {
                logMessage('********' + title + ' by ' + artist + ' is not available. You will not be able to access it from hypem.com either.********')
            } else {
                logMessage('********Problem getting SoundCloud download link for ' + title + ' by ' + artist + ': ' + error + '********');
            }
            if (index < songs.length - 1) {
                downloadSong(songs[index + 1].id, songs[index + 1].key, songs[index + 1].artist, songs[index + 1].song, songs[index + 1].album_art, index + 1);
            } else {
                logMessage('All done. Like it? Donate: https://www.givedirectly.org/give-now');
            }
        }
    });
}

function getPathFromUrl(url) {
    return url.split("?")[0];
}

function logMessage(message) {
    console.log(message);
    fs.appendFile('log.txt', message + '\n');
}
function writeMeta(artist, title, fileLocation, albumArt, albumArtBoolean) {
    var tags = {
        artist: artist,
        title: title
    }
    if (albumArtBoolean == true) {
        // Comment out this line if you do not want album art
        tags.image = albumArt;
    }
    var writeTags = nodeID3.write(tags, fileLocation);
    if (writeTags) {
        logMessage('Tags for ' + title + ' by ' + artist + ' successfully written');
    } else {
        logMessage('********Tags for ' + title + ' by ' + artist + ' failed to write********');
    }
}

function searchSongs(artist, title) {
    var returnValue = false;
    for (var i = 0; i < songs.length; i++) {
        if (songs[i].artist.substring(0, 35) == artist.substring(0, 35) && songs[i].song.substring(0, 35) == title.substring(0, 35)) {
            returnValue = i;
        }
    }
    return returnValue;
}

function requestPage(pageNumber) {
    logMessage('Requesting user page http://hypem.com/' + user + '/' + pageNumber);
    request('http://hypem.com/' + user + '/' + pageNumber, function (error, response, body) {
        if (!error && response.statusCode != 404) {
            var $ = cheerio.load(body);
            Array.prototype.push.apply(songs, JSON.parse($("#displayList-data").html()).tracks);
            logMessage('Making HypeM API call at http://hypem.com/playlist/loved/' + user + '/json/' + pageNumber + '/data.js');
            request('http://hypem.com/playlist/loved/' + user + '/json/' + pageNumber + '/data.js', function (error, response, body) {
                var albumArtData = JSON.parse(body);
                delete albumArtData.version;
                for (var i in albumArtData) {
                    var key = searchSongs(albumArtData[i].artist, albumArtData[i].title);
                    if (key !== false) {
                        songs[key].album_art = albumArtData[i].thumb_url_large;
                        songs[key].artist = albumArtData[i].artist;
                        songs[key].song = albumArtData[i].title;
                    }
                }
                requestPage(pageNumber + 1);
            });
        } else {
            logMessage(songs.length + ' to be downloaded');
            fs.writeFile('log.txt', JSON.stringify(songs, null, 2));
            var startIndex = 653;
            downloadSong(songs[startIndex].id, songs[startIndex].key, songs[startIndex].artist, songs[startIndex].song, songs[startIndex].album_art, startIndex);
        }
    });
}
var pageNumber = 1;
var songs = [];
requestPage(1);
