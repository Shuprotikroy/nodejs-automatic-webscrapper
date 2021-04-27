    //cheerio is a library used for transversing HTML or XML document
    const cheerio = require('cheerio');
    //puppeteer is a node library which provides high level API to control headless Chrome or Chromium
    const puppeteer = require('puppeteer');
    //const url stores the url of the google search result to be scraped
    const url = 'https://www.google.co.in/search?q=covid+tracker+india&safe=active&sxsrf=ALeKk02vT4zOpQSTEHzPqjVbSr_lltbkjA%3A1619157810627&source=hp&ei=MmOCYO-bI7nfz7sPwNOGuAM&iflsig=AINFCbYAAAAAYIJxQuhja6qiSKx_nXQacygcL3AOsiyt&oq=covi&gs_lcp=Cgdnd3Mtd2l6EAMYADIECCMQJzIECCMQJzIECCMQJzIFCAAQkQIyCggAELEDEIMBEEMyCggAELEDEIMBEEMyCAgAELEDEIMBMggIABCxAxCDATIICAAQsQMQgwEyBAgAEEM6CwgAELEDEIMBEJECUNTfBliz9gZg4YMHaABwAHgAgAGnAYgB5ASSAQMwLjSYAQCgAQGqAQdnd3Mtd2l6&sclient=gws-wiz';
    //const createCsvWriter helps in creating the csv file needed 
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    //toad-scheduler helps in scheduling the whole process at repeated intervals making the task fully automatic
    const { ToadScheduler, SimpleIntervalJob, AsyncTask, Task } = require('toad-scheduler')
    const scheduler = new ToadScheduler()
    //function scrappertask stores the full process from loading the HTML content to parsing it for the required queries
    function scrappertask(){
    //lines 15-24 help in parsing out all the html content in the website using the node puppeteer library
    puppeteer
      .launch()
      .then(browser => browser.newPage())
      .then(page => {
        page.setDefaultNavigationTimeout(0)
        return page.goto(url).then(function() {
          return page.content();
        });
      })
      .then(html => {
      //the 'html' stores all the html content on the website if you want,you can use console.log(html) and you'll be able to see the entire html structure of the website
      //once the html content is parsed out all it's content is used in the const $ using cheerio.load(html),$ acts as a selector and will further be used below to parse out classes,divs,ids etc whatever the programmer wants to extract  
        const $ = cheerio.load(html);
      //Now if we use inspect element to check the html structure of the website,we'll be able to see that all covid info related text content is stored in the m7B03 classname so we use '.m7B03' to access that particular class.
        const cases = $('.m7B03');
      //const structure helps in defining array
        const structure = []; 
      //cases.filter is used to further filter out data within '.m7B03'
      cases.filter(function () {
        //using inspect element, you'll be able to see that all the numerically related info are stored in span elements and since the span elements do not have an unique identifier with it,we use the ':contains' attribute to specifically specify the no we want for eg. '17.3M'
        var finalconfirmed = $('span:contains("17.3M")').text().replace('17.3M','').trim()
        var finalrecovered = $('span:contains("14.3M")').text().replace('14.3M','').trim()
        var finaldeaths = $('span:contains("195K")').text().replace('195K','').trim()
        //we push all the retrieved data in array definition i.e. structure using .push,headers such as confirmed,recovered,deaths are also defined
        structure.push({
          confirmed:finalconfirmed,
          recovered:finalrecovered,
          deaths:finaldeaths
        });
      });
      //since it's a google search query,we get multiple instances of the same value so we use '.splice' to remove all the unnecessary redundant data and just show one instance of the data only
      structure.splice(0,8)
      console.log(structure);
      //const csvwriter mentions the name of the output file where all the data will be stored i.e. mentioned in the 'path' attribute,'header' defines the structure for the table i.e. define the columns for storing of data
      const csvWriter = createCsvWriter({
        path: 'covidinfo.csv',
        header: [
          {id: 'confirmed', title: 'Confirmed'},
          {id: 'recovered', title: 'Recovered'},
          {id: 'deaths', title: 'Deaths'},
        ]
        
      });
      // '.writeRecords' writes the retrieved info in columns and since 'structure' stores all the retrieved data we mention it in the braces of '.writeRecords' 
      csvWriter
  .writeRecords(structure)
  .then(()=> console.log('The CSV file was written successfully'));
    })
    .catch(console.error);
  }
  //const task calls the scrappertask() function mentioned above and stores it in itself
  const task = new Task('scrapper task',() => {scrappertask()},(err =>{console.log(err)}))
  //The const task is later called in const job and the time interval at which you want the whole process to be repeated is to be mentioned in 'seconds' 
  const job = new SimpleIntervalJob({ seconds: 10, }, task)
//scheduler here is used to add the job we created and start the whole process
scheduler.addSimpleIntervalJob(job)
