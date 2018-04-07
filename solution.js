const Promise = require('bluebird');
const request = require('request');
const cheerio = require('cheerio');
const fs      = require('fs');

function parseCategory(body) {
	const $ = cheerio.load(body);
	var categories = [];
	$('.menu li a').each(function(i, elem) {
		categories[i] = {
			title: $(this).text(),
			url: $(this).attr('href')
		};
	});
	return categories;
}

function getCategory(url) {
	return new Promise(function(resolve, reject) {
		request(url, function(error, response, body) {
			if (!error && response.statusCode) {
				var categories = parseCategory(body);
				resolve(categories);
			} else {
				reject('Unable to fetch categories. Maybe check your internet connection?');
			}
		});
	});
}

function parsePromotion(body) {
	const $ = cheerio.load(body);
	var promotion = [];
	$('#lists li a').each(function(i, elem) {
		promotion[i] = {
			title: $('.promo-title', this).text(),
			image: $('img', this).attr('src'),
			merchant: $('.merchant-name', this).text(),
			validity: $('.valid-until', this).text()
		};
	});
	return promotion;
}

function getPromotion(category) {
	return new Promise(function(resolve, reject) {
		request(category.url, function(error, response, body) {
			if (!error && response.statusCode) {
				var result = {
					title: category.title,
					promotion: parsePromotion(body)
				};
				resolve(result);
			} else {
				reject('Unable to fetch promotions. Maybe check your internet connection?');
			}
		});
	});
}

var url = 'https://m.bnizona.com/index.php/category/index/promo';
console.log('Scraping...');
getCategory(url).then(function(categories) {
	var promises = [];
	for (i = 0; i < categories.length; i++) {
		promises.push(getPromotion(categories[i]));
	};

	console.log('More scraping...');
	Promise.all(promises).then(function(result) {
		var solution = {};
		for (i = 0; i < result.length; i++) {
			solution[result[i].title.toLowerCase()] = result[i].promotion;
		}

		console.log('Writing to file...');
		fs.writeFile("./solution.json", JSON.stringify(solution, null, 2), function(error) {
			if (error) {
				console.error(error);
				return;
			};
			console.log('Done!');
		});

	}).catch(function(error) {
		console.error(error);
	});

}).catch(function(error) {
	console.error(error);
});
