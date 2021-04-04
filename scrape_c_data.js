const College  = require('./college.js');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');
const db = require('./database.js');
const { resolve } = require('path');


/**
 * Initiates the puppeteer browser and renders the url
 *  @param {*} colleges: map with a college name as key and college object as value
 * Returns a promise that resolves when all ranks for each college has been assigned in map
 */
function getRanks(colleges) {
    return new Promise ((resolve, reject) => {
        // URL to scrape
        let url = 'https://www.timeshighereducation.com/rankings/united-states/2020#!/page/0/length/-1/sort_by/rank/sort_order/asc/cols/stats';
        (async () => {
            // Initiate Puppeteer browser
            const browser = await puppeteer.launch({
                args: ['--no-sandbox']});
            const page = await browser.newPage();

            // go to page and wait for it to load/render
            await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle0', 'load'] });

            // run js in page
            let collegeRankings = await page.evaluate( () => {
                // ranking will be an array of arrays containing a collge's ranking and name
                let rankings = [];
                // get table full of college ranking rows
                let table = document.querySelectorAll('table[id="datatable-1"] > tbody > tr');
                // iterate through all table rows and add an array with college rank and name into rankings
                table.forEach(element => {
                    let collegeRank = element.querySelector('td[class="rank sorting_1 sorting_2"').innerText;
                    // ranking on website contains = for colleges with same rank,
                    // - for colleges between rank 401 and 500, 501 and 600
                    // > for colleges above rank 600
                    // parse college ranking to get just the number
                    if (collegeRank[0] === "=") {
                        collegeRank = parseInt(collegeRank.slice(1));
                    } else if (collegeRank[0] === ">") {
                        collegeRank = parseInt(collegeRank.slice(2));
                    } else {
                        let temp = collegeRank.split('-');
                        if (temp.length == 2) {
                            // get midpoint of the rank range
                            collegeRank = Math.floor((parseInt(temp[0]) + parseInt(temp[1])) / 2);
                        } else {
                            collegeRank = parseInt(temp[0]);
                        }
                    }
                    let collegeName = element.querySelector('a').innerText;
                    rankings.push([collegeRank, collegeName]);
                });
                return rankings;
            });

            // iterate through collegeRankings to see if each college in the list
            // has a name that matches one in our database
            // if it does, set its rank according to what we scraped
            collegeRankings.forEach(college => {
                let collegeRank = college[0];
                let collegeName = college[1];
                let collegeMatch = colleges.get(collegeName);
                if (collegeMatch) {
                    collegeMatch.setScore(collegeRank);
                }
            });

            await browser.close();
            resolve(colleges);
        })();
    }).catch((err) => {
        throw err;
    })
}

function setTestScore(setter, value, college){
    if(value.includes('average')){
        college[setter] = parseInt(value.slice(0,3));
    }
    else if(value.includes('range')){
        const ranges = value.slice(0,7).split('-');
        college[setter] = Math.round((parseInt(ranges[0]) + parseInt(ranges[1]))/2);
    }
    else{
        college[setter] = null;
    }
}

/**
 * Sends request through axios for each college object and assigns properties to each object
 *  @param {*} colleges: map  with a college name as key and college object as value
 * Returns a promise that contains array of promises that is resolved when each promise is resolved
 * promises in array are resolved when 
 */
function scrapeCollegeData(colleges){
    //array of promises
    const promises = [];
    // url that will be appended to when sending request
    let url = 'https://waf.collegedata.com/college-search/';
    //parse through each college object in map
    for (const college of colleges){
        // append new promise to promises array
        promises.push(new Promise((resolve, reject) => {
            //get the college name
            let collegeName = college[0]
            //modify collegeName to fit URL of associated college
            if(collegeName.includes(',') || collegeName.includes('&')){
                collegeName = collegeName.replace(/,|&/g,'').replace(/\s{2}/,' ')
            }
            //accomodate for collegeName exception, that isnt handled
            if(collegeName == 'SUNY College of Environmental Science and Forestry'){
                collegeName = 'State University of New York College of Environmental Science and Forestry';
            }
            //modification of url and appending  collegeName to new url
            let newUrl = (collegeName.includes('The ')) ? url+collegeName.slice(4).replace(/\s/g,'-') : url+collegeName.replace(/\s/g,'-');
            //send http request to url
            axios.get(newUrl).then(response => {
                //obtain html from url
                const $ = cheerio.load(response.data);
                //parse html to obtain designated data
                const collegeProfile = JSON.parse($('script#__NEXT_DATA__').get()[0].children[0].data).props.pageProps.profile;
                const state = collegeProfile.address.state;
                let satMath = null;
                let satErwb = null;
                let Act = null;
                let inStateTuition = null;
                let outStateTuition = null;
                if(college[0] === "Missouri University of Science and Technology" || college[0] === "Temple University"){
                    satMath = collegeProfile.bodyContent[0].data.children[5].data.value[0];
                    satErwb = collegeProfile.bodyContent[0].data.children[6].data.value[0];
                    Act = collegeProfile.bodyContent[0].data.children[7].data.value[0];
                }
                else{
                    satMath = collegeProfile.bodyContent[0].data.children[7].data.value[0];
                    satErwb = collegeProfile.bodyContent[0].data.children[8].data.value[0];
                    Act = collegeProfile.bodyContent[0].data.children[9].data.value[0];
                }
                let completionRate = collegeProfile.bodyContent[4].data.children[3].data.value[0];
                if(completionRate === "Not reported"){
                    completionRate = null;
                }
                else{
                    completionRate = (parseFloat(completionRate.slice(0,-1))/100).toFixed(3)
                }
                if(collegeProfile.bodyContent[1].data.children[1].data.value[0].includes('$')){
                    inStateTuition = collegeProfile.bodyContent[1].data.children[1].data.value[0].split('$')[1].replace(/,/g, '');
                }
                if(collegeProfile.bodyContent[1].data.children[1].data.value.length == 2){
                    outStateTuition = collegeProfile.bodyContent[1].data.children[1].data.value[1].split('$')[1].replace(/,/g, '');
                }
                setTestScore("satMath",satMath,college[1]);
                setTestScore("satErwb",satErwb,college[1]);
                setTestScore("ACT",Act,college[1]);
                college[1].setState(state);
                college[1].setCompleteRate(completionRate);
                college[1].setInstateTuition(inStateTuition);
                college[1].setOutstateTuition(outStateTuition);
                axios.get(newUrl+"/academics").then(response => {
                    //obtain html from url
                    const $ = cheerio.load(response.data);
                    //parse html to obtain majors
                    const dataProfile = JSON.parse($('script#__NEXT_DATA__').get()[0].children[0].data).props.pageProps.profile;
                    const majors = dataProfile.bodyContent[0].data.children[0].data.data;
                    college[1].setMajors(majors);
                    resolve(college);         
                }).catch((err)=> {
                    resolve(college);
                })
            }).catch((err) => {
                resolve(college);
            })
        })
        );
    }
    //return the promise contaning list of promises
    return Promise.all(promises);
}

/**
 * Parse collegeCard.csv and assigns significant properties to college objects
 *  @param {*} colleges: map  with a college name as key and college object as value
 * Returns a promise that is resolved when parsing csv file and assigning properties
 * to college objects
 */
function parseCollegeCard(colleges){
    return new Promise ((resolve, reject) => {
        //Map of college names in college.txt as keys and corresponding college name in csv file
        // NameExceptions as in names of colleges in csv file don't match with name of same college
        //in colleges.txt
        const NameExceptions = new Map([
            ['Franklin and Marshall College','Franklin & Marshall College'],      
            ['Indiana University-Bloomington','Indiana University Bloomington'],
            ['The College of Saint Scholastica','The College of St Scholastica'],   
            ['The University of Alabama','University of Alabama'],
            ['University of Massachusetts-Amherst','University of Massachusetts Amherst'],
            ['The University of Montana','University of Montana']
          ]);
          //parse through whole csv file, record by record
        fs.createReadStream('./data/college/collegeCard.csv').pipe(csv()).on('data', (data) =>  { 
            //obtain csv file college name
            dataCollegeName = data['INSTNM'];
            //if name is in NameExceptions keys then dataCollegeName is changed 
            //to corressponding value in NameExceptions
            if(NameExceptions.has(dataCollegeName)){
                dataCollegeName = NameExceptions.get(dataCollegeName)
            }
            //Accomodate for other college.txt college names that don't match 
            //with csv college names
            else if(dataCollegeName.includes('-')){
                dataCollegeName = dataCollegeName.replace('-',', ');
            }
            //now if dataCollegeName is in keys of colleges map get 
            //object and assign properties
            if (colleges.get(dataCollegeName)) {
                colleges.get(dataCollegeName).setAdmitRate(parseFloat(data['ADM_RATE']));
                let types = ['public','private nonprofit', 'private for-profit'];
                //types are represented as numbers in csv file, type array
                //lines the number up with a index
                colleges.get(dataCollegeName).setInstitutionType(types[parseInt(data['CONTROL'])-1]);
                colleges.get(dataCollegeName). setMedianGradDebt(parseInt(data['GRAD_DEBT_MDN']));
                //if UG property is null from csv set the UGDS property
                let size = (data['UG'] != 'NULL') ? data['UG'] : data['UGDS'];
                colleges.get(dataCollegeName).setSize(parseInt(size));
            }
        }).on('end', () => {
            //when promise end resolve the colleges
            resolve(colleges);
        })
    })
}



/**
 * Parse colleges.txt 
 * Returns a promise that is resolved when parse of whole colleges.txt is complete,
 * this promise resolves the map of collegeNames => college objects with name property
 * assigned 
 */
function getCollegeNames(){
    return new Promise ((resolve, reject) => {
        //parse colleges.txt
        fs.readFile('./data/college/colleges.txt',{encoding: 'utf8'}, (err,data) => {
            //creates map 
            colleges = new Map();
            //obtain college name separated by newlnes
            //college_names contains the name of each college
            college_names = data.split('\n');
            //for each college name assign it name as key and
            //return college object with name property assigned
            college_names.forEach(name => {
                colleges.set(name, new College(name));
            })
            //resolve or return college map as result
            resolve(colleges)
        })
    })
}


/**
 * scrape data from websites and from files
 *  
 */
function scrapeData(){
    return new Promise((resolve,reject) => {
            getCollegeNames().then(colleges => { 
                parseCollegeCard(colleges).then((result) => {getRanks(colleges).then((result) => {
                    scrapeCollegeData(colleges).then((result) => {
                        resolve(colleges);
                    })
                    })
                });
            })
    })
}

module.exports.scrapeData = scrapeData;
