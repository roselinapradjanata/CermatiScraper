const Promise = require('bluebird');
const request = require('request');
const cheerio = require('cheerio');
const fs      = require('fs');

function getCategory(url) {
	return new Promise(function(resolve, reject) {
		request(url, function(error, response, body) {
			const $ = cheerio.load(body);
			var categories = [];
			$('.menu li a').each(function(i, elem) {
				categories[i] = {
					title: $(this).text(),
					url: $(this).attr('href')
				};
			});
			resolve(categories);
		});
	});
};

function getCategoryPromotion(category) {
	return new Promise(function(resolve, reject) {
		request(category.url, function(error, response, body) {
			const $ = cheerio.load(body);
			var result = {
				title: category.title,
				promotion: []
			};
			$('#lists li a').each(function(i, elem) {
				result.promotion[i] = {
					title: $('.promo-title', this).text(),
					image: $('img', this).attr('src'),
					merchant: $('.merchant-name', this).text(),
					validity: $('.valid-until', this).text()
				};
			});
			resolve(result);
		});
	});
}

var url = 'https://m.bnizona.com/index.php/category/index/promo';
getCategory(url).then(function(categories) {
	var promises = [];
	for (i = 0; i < categories.length; i++) {
		promises.push(getCategoryPromotion(categories[i]));
	};
	Promise.all(promises).then(function(result) {
		var solution = {};
		for (i = 0; i < result.length; i++) {
			solution[result[i].title.toLowerCase()] = result[i].promotion;
		}
		fs.writeFile("./solution.json", JSON.stringify(solution, null, 2), function(error) {
			if (error) {
				console.error(error);
				return;
			};
			console.log('File solution.json has been created');
		});
	});
});
