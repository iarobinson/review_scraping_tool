const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({
    headless: false
  });

  /* Custom variables */

  const searchTerm = 'Dans\'s cafe washinton DC';

  // Creating new context and page.
  const context = await browser.newContext();
  const page = await context.newPage();

  // navigating to google.com
  await page.goto('https://www.google.com/');

  // Searching the search term
  await page.getByRole('combobox', { name: 'Search' }).click();
  await page.getByRole('combobox', { name: 'Search' }).type(searchTerm);
  await page.getByRole('combobox', { name: 'Search' }).press('Enter');

  // clicking the review button
  await page.locator('xpath=(//a[@data-async-trigger="reviewDialog"])[1]').click();

  let data = await extractData(page);
  saveData(data);

  // Closing the browser instance
  await context.close();
  await browser.close();
}

/**
 * This function will extract the necessary data.
 * @param {page} page the page object that the data to be scraped.
 * @returns {[object]} The scraped data as object.
 */

async function extractData(page) {
  let dataToSave = [];
  // Necessary selectors.
  const xpathAllReviews = '//div[@jscontroller="fIQYlf"]';
  const xpathMoreButton = "//a[@class='review-more-link']";
  const xpathTitle = "//div[@class='TSUbDb']/a";
  const xpathRating = "//g-review-stars[@class='vrrJOc DEr8Ib']/span";
  const xpathReviews = '//span[@jscontroller="Eox39d"]';
  const allReviews = page.locator(xpathAllReviews);
  const allReviewsCount = await allReviews.count();
  // console.log(xpathAllReviews,
  //   xpathMoreButton, " <= ",
  //   xpathTitle, " <= ",
  //   xpathRating, " <= ",
  //   xpathReviews, " <= ",
  //   allReviews, " <= ",
  //   allReviewsCount
  // )
  const texts = await page.$$eval('div[data-expandable-section]', elements =>
    elements.map(element => element.textContent.trim())
  );

  console.log(texts);

  await page.pause()
  for (var index= 0; index < allReviewsCount ; index++) {
    const element = await allReviews.nth(index);
    const moreBtn = element.locator(xpathMoreButton)
  
    if(await moreBtn.count() > 0) {
      try {
        await moreBtn.click();
        await page.waitForTimeout(2500);
      }
      catch {}
    }

    // Scraping necessary data.
    const title = await element.locator(xpathTitle).innerText();
    const rating = await element.locator(xpathRating).getAttribute("aria-label")
    const review = await element.locator(xpathReviews).innerText();
    let rawDataToSave = {
      "author_name": title,
      "rating": rating,
      "review": review
    }

    // Collecting to a list.
    console.log(dataToSave)
    dataToSave.push(rawDataToSave)
  }

  return dataToSave;
}

/**

 * This function used to save the data as json file.

 * @param {[object]} data the data to be written as json file.

 */

function saveData(data) {
  let dataStr = JSON.stringify(data, null, 2)
  fs.writeFile("google_reviews.json", dataStr, 'utf8', function (err) {
    if (err) {
        console.log("An error occurred while writing JSON Object to File.");
        return console.log(err);
    }

    console.log("JSON file has been saved.");
  });
}

run();
