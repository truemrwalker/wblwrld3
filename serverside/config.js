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
// config.js
// Created by Giannis Georgalis on 10/30/13
//
var path = require('path');
var fs = require('fs');
var sec = require('./secrets');

module.exports = {

    PROJECT_ROOT_DIR: path.join(__dirname, '..'),
    PROJECT_MANAGEMENT_DIR: path.join(__dirname, '../..'),

    // Server specific settings
    SERVER_NAME: 'localhost',
    SERVER_PORT: 7000,
    SERVER_BEHIND_REVERSE_PROXY: false,

    SERVER_CA: '', // Certificate Authority Bundle
    SERVER_KEY: path.join(__dirname, 'keys/key.pem'),
    SERVER_CERT: path.join(__dirname, 'keys/cert.pem'),
	  SERVER_PASSPHRASE: '',
    SERVER_ROOT_DIR: __dirname,

    // Mail settings
    MAIL_SERVICE: 'mailgun',
    MAIL_KEY: sec.get('mailgun_key'),
    MAIL_DOMAIN: sec.get('mailgun_domain'),

    // App settings
    APP_NAME: 'wblwrld3',
    APP_EMAIL_ADDRESS: 'wblwrld3 Bot <hello@webbleworld.com>',
    APP_CRYPT_PASSWORD: sec.get('app_password'),
    APP_ROOT_DIR: path.join(__dirname, '../app'),

    // Settings for logging and notifications
    LOG_EMAIL_TO: [ 'jgeorgal@meme.hokudai.ac.jp' ],
    LOG_EMAIL_FROM: 'wblwrld3@meme.hokudai.ac.jp',
    LOG_EMAIL_SMTP_HOST: sec.get('log_email_smtphost'),
    LOG_EMAIL_SMTP_PORT: 995,
    LOG_EMAIL_SMTP_USERNAME: sec.get('log_email_username'),
    LOG_EMAIL_SMTP_PASSWORD: sec.get('log_email_password'),

    LOG_DB_NAME: 'wblwrld3',
    LOG_DB_HOST: 'localhost',
    LOG_DB_PORT: 27017,
    LOG_DB_USERNAME: sec.get('log_db_username'),
    LOG_DB_PASSWORD: sec.get('log_db_password'),

    // Application level settings
    MONGODB_URL: sec.get('mongodb_url'),
    SESSION_KEY: sec.get('session_key'),
    SESSION_SECRET: sec.get('session_secret'),

    // Third party auth tokens
    TWITTER_CONSUMER_KEY: sec.get('twitter_consumer_key'),
    TWITTER_CONSUMER_SECRET: sec.get('twitter_consumer_secret'),

	  GOOGLE_CLIENT_ID: sec.get('google_client_id'),
	  GOOGLE_CLIENT_SECRET: sec.get('google_client_secret'),

    FACEBOOK_APP_ID: sec.get('facebook_app_id'),
    FACEBOOK_APP_SECRET: sec.get('facebook_app_secret'),

    LINKED_IN_KEY: sec.get('linkedin_key'),
    LINKED_IN_SECRET: sec.get('linkedin_secret'),

// Settings that are set automatically at startup
    //
    // SERVER_URL
    // SERVER_URL_INSECURE

// Finally, Settings that are set exclusively by environment variables
    // DEPLOYMENT can be 'development', 'production', 'testing', 'bootstrap'

    DEPLOYMENT: !process.env.NODE_ENV ? 'development' : process.env.NODE_ENV
};
