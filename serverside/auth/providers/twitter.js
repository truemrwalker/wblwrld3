//
// Webble World 3.0 (IntelligentPad system for the web)
//
// Copyright (c) 2010-2015 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka
//     in Meme Media R&D Group of Hokkaido University, Japan. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Additional restrictions may apply. See the LICENSE file for more information.
//

//
// twitter.js
// Created by Giannis Georgalis on 10/30/13
//
var TwitterStrategy = require('passport-twitter').Strategy;

module.exports = function(Q, app, config, gettext, passport, User, doneAuth) {

    var authError = new Error("Twitter Auth Error", "auth-twitter.js");

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //
    function mergeTwitterProfile(user, token, tokenSecret, profile) {

        if (!user.name.first || !user.name.last)
            user.name.full = profile.displayName;

        user.email = user.email || '@' + profile.username;
        user.language = user.language || profile._json.lang || 'en';

        if (profile._json.url)
            user.website_urls.push(profile._json.url);
        if (profile._json.profile_image_url_https)
            user.image_urls.push(profile._json.profile_image_url_https);

        user.description = user.description || profile._json.description;

        user._auth.providers.push('twitter');

        user._auth.twitter.id = profile.id;
        user._auth.twitter.username = profile.username;
        user._auth.twitter.token = token;
        user._auth.twitter.secret = tokenSecret;
    }

    ////////////////////////////////////////////////////////////////////
    // Setup strategy
    //
    passport.use(new TwitterStrategy({
            sessionKey: config.SESSION_KEY,
            consumerKey: config.TWITTER_CONSUMER_KEY,
            consumerSecret: config.TWITTER_CONSUMER_SECRET,
            callbackURL: config.SERVER_URL + "/auth/twitter/callback"
        },
        function(token, tokenSecret, profile, done) {

            User.findOne({ "_auth.twitter.id": profile.id }, function(err, user) {

                if (err)
                    done(err);
                else
                    done(null, user, { token: token, tokenSecret: tokenSecret, profile: profile });
            });
        }
    ));

    ////////////////////////////////////////////////////////////////////
    // Auth logic
    //
    app.get('/auth/twitter', passport.authenticate('twitter'));


    app.get('/auth/twitter/callback', function(req, res) {

        passport.authenticate('twitter', function (err, user, info) {

            if (err)
                doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
            else if (!info || !info.profile)
                doneAuth(authError, req, res, info && info.message ? info.message : gettext("Could not authenticate"));
            else if (req.user) { //---> Just connect account with current one

                if (user) // WTF? -- it's probably already connected
                    doneAuth(authError, req, res, gettext("Account is already connected to Twitter account"));
                else {
                    mergeTwitterProfile(req.user, info.token, info.tokenSecret, info.profile);

                    req.user.save(function(err) {

                        if (err)
                            doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
                        else
                            doneAuth(null, req, res, req.user, true);
                    });
                }
            }
            else if (!user) { //---> Register & login

                var newUser = new User();
                mergeTwitterProfile(newUser, info.token, info.tokenSecret, info.profile);

                newUser.save(function(err) {

                    if (err)
                        doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
                    else
                        doneAuth(null, req, res, newUser);
                });
            }
            else //---> Just login
                doneAuth(null, req, res, user);

        })(req, res);
    });
};
