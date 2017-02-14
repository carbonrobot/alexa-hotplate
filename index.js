'use strict';

const Alexa = require('alexa-sdk');
const service = require('./recipe.service.js')('RECIPE_PUPPY');

// APP_ID not required
const APP_ID = undefined;

// language definitions
const SAY = {
    SKILL_NAME: 'Hotplate',
    RESULTS: "Ok, I found multiple recipes. You can say another ingredient, or say done.",
    NO_RESULTS: "I'm sorry, I can't find any recipes with those ingredients.",
    DONE: "Ok, I have sent the recipes to your Alexa app.",
    HELP_MESSAGE: 'You can search for recipes by starting with an ingredient, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    STOP_MESSAGE: 'Goodbye!',
    ERROR_MESSAGE: 'Oh snap, something broke.'
};

// alexa intent handlers
const handlers = {

    // built in intents
    'LaunchRequest': function () {
        this.emit('RecipeSearch');
    },
    'Unhandled': function () {
        this.emit(':tell', SAY.ERROR_MESSAGE);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = SAY.HELP_MESSAGE;
        const reprompt = SAY.HELP_MESSAGE;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', SAY.STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', SAY.STOP_MESSAGE);
    },
    'SessionEndedRequest': function () {
        this.attributes['keys'] = '';
        this.emit(':tell', SAY.STOP_MESSAGE);
    },

    // Custom intents    
    'RecipeSearch': recipeSearch,
    'Done': recipeComplete,

};

// Search for recipes based on ingredient
function recipeSearch() {
    console.log('Recipe search called');

    let params = [
        this.event.request.intent.slots.INGONE.value,
        this.event.request.intent.slots.INGTWO.value,
        this.event.request.intent.slots.INGTHREE.value
    ];
    console.log(this.event.request.intent.slots);

    // merge keys from session
    if (typeof this.attributes['keys'] === 'string') {
        const prevKeys = this.attributes['keys'].split(',');
        if (prevKeys.length) {
            params = params.concat(prevKeys);
        }
    }

    const keys = params.filter(val => { return val; }).join(',');

    // store the search keys
    if (keys.length > 0) {
        this.attributes['keys'] = keys;
    }
    console.log(keys);

    service.count(keys)
        .then(response => {

            if (response.count > 0) {
                this.emit(':tell', SAY.NO_RESULTS);
                this.attributes['keys'] = '';
            }
            else {
                this.emit(':ask', SAY.RESULTS.replace('{0}', response.count));
            }

        }).catch(err => {
            console.log(err);
            self.emit('Unhandled');
        });
}

// Send the recipes to the consumer
function recipeComplete() {
    console.log('Done called');

    const keys = this.attributes['keys'];
    service.search(keys)
        .then(response => {

            const title = `${response.count} recipes with ${keys}`;
            const content = [];
            for (let i = 0; i < response.recipes.length; i++) {
                const r = response.recipes[i];
                content.push(`<a href="${r.href}">${r.title}</a>`);
            }
            const output = content.join('\n');
            this.emit(':tellWithCard', SAY.DONE, title, output);

        });

    this.attributes['keys'] = '';
}

// Register with alexa service
function registerAlexa(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
}

exports.handler = registerAlexa;

