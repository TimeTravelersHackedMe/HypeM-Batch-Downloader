# Download all Favorites on HypeM
**Download all your favorites from HypeM.com at the same time!** :stuck_out_tongue_winking_eye: You can also download the favorites of any specified user. This NodeJS app will go through all your favorites pages and scrape the data. **It also adds tags (artist, title, and album art).** It uses the HypeM API to get album art and it deals with the errors you might encounter during the download process (like 404s and illegal file names).

## Instructions
1. Download this repository or run `git clone https://github.com/TimeTravelersHackedMe/HypeM-Batch-Downloader.git` if you have Git installed
2. In the repo directory, run `npm install`
3. Open app.js and change the line that says `var user = 'weirdpolice';` (it's at the top) to the user you want to download the favorites of
4. Run `node app.js`

## Troubleshooting
If you come across an error for a particular song, take note of the location you are currently at during downloading. This is output to the console and to log.txt (e.g. `Currently at song index: 340`). You can manually skip downloading that song by changing the following line `var startIndex = 0;` which is at the bottom of the app.js file. Choose a new index that is past the troublesome song.

Not all of the album art comes out perfect. HypeM doesn't do the best job at scraping album art so if you don't want to use HypeM's album art you can prevent the album art from saving. Do a search for `tags.image = albumArt;` and comment out that line if you wish to do this.

Post any issues you might have here and I'll try to help out.

## Requirements
1. NodeJS

This has only been tested on Windows 10 using NodeJS v4.5.0.

## Say Thanks
If you like this project, consider donating to https://www.givedirectly.org/give-now
