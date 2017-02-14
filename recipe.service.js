'use strict';

const request = require('request-promise');

// API configurations
const API = {
    RECIPE_PUPPY: {
        uri: params => { return 'http://www.recipepuppy.com/api/?i={0}'.replace('{0}', params); },
        map: recipe => { return { title: recipe.title, href: recipe.href }; },
        count: response => { return response.results.length; }
    }
};

/**
 * Initialize an instance of the recipe service
 * @param api A string name of the api to use. Possible options are "RECIPE_PUPPY"
 */
function recipeService(apikey) {

    const api = API[apikey];

    return {
        // search using the api and return the mapped results
        search: params => {
            var options = {
                uri: api.uri(params),
                json: true
            };
            return request(options).then(response => {
                return {
                    count: api.count(response),
                    recipes: response.results.map(api.map)
                };
            });
        },
        // count the recipes that match the query
        count: params => {
            var options = {
                uri: api.uri(params),
                json: true
            };
            return request(options).then(response => {
                return {
                    count: api.count(response)
                };
            });
        }
    };
}

module.exports = recipeService;