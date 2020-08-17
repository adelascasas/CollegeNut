const HighSchool = require('./highschool.js');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
/**
 * Parse highschools.txt and obtains high school names
 * @returns Map object that contains the high school names as keys and 
 * urls as values
 */
function getHighSchoolNames(){
    return new Promise ((resolve, reject) => {
        fs.readFile('./data/highschools/highschools.txt',{encoding: 'utf8'}, (err,data) => {
            let high_schools = new Map();
            let high_school_urls = data.split('\n');
            high_school_urls.forEach(name => {
                url = name;
                if(name.includes('high-school')){
                    index = name.indexOf('high-school');
                    newIndex = 11 + index;
                    name = name.slice(0,newIndex);
                    name = name.split('-').map((word) => {
                        return word.toLowerCase();
                    }).join(' ');
                    high_schools.set(name, url);
                }
                else if(name.includes('academy')){
                    if(name != 'academy-for-information-technology-scotch-plains-nj'){
                        index = name.indexOf('academy');
                        newIndex = 7 + index;
                        name = name.slice(0,newIndex);}
                    else{
                        index = name.indexOf('-scotch-plains-nj');
                        name = name.slice(0,index);
                    }
                    name = name.split('-').map((word) => {
                        return word.toLowerCase();
                    }).join(' ');
                    high_schools.set(name, url);
                }
                else{
                    if(name != 'baccalaureate-school-for-global-education-long-island-city-ny'){
                        name = name.split('-').map((word) => {
                            return word.toLowerCase();;
                        }).slice(0,-2);}
                    else{
                        name = name.split('-').map((word) => {
                            return word.toLowerCase();
                        }).slice(0,-4);
                    }
                    high_schools.set(name.join(' '),url);
                }
            })
            resolve(high_schools);
        })
    })
}

/**
 * Scrapes niche.com for information on given high school
  *  @param {string} name: high school name
 * @param {string} urlInput: niche.com url name
 * @returns High school object based on highschool.js
 */
function scrapeNiche(name,urlInput){
    let url = `https://www.niche.com/k12/${urlInput}/academics`;
        return new Promise((resolve, reject) => {
            axios.get(url,{ 
                headers: { 
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'Dnt': '1',
                    'Host': 'www.niche.com',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
                    'X-Amzn-Trace-Id': 'Root=1-5ee7bbec-779382315873aa33227a5df6'
                } 
            }).then(response => {
                let rank; 
                let SAT; 
                let ACT; 
                let APS;
                let location;
                let gradRate;
                let apPassRate;
                let mathPro;
                let readPro;
                const $ = cheerio.load(response.data);
                $('ul.postcard__attrs').find('li').each((index, element) => {
                    if(index == 0){
                        rank = $(element).text().slice(0,2);
                        if(!(['+','-'].includes(rank[1]))){
                            rank = rank[0];
                        }
                    }
                    else if(index == 3){
                        location = $(element).text();
                    }
                });
                $('div.profile-blocks').find('section.block--two').each((index, element) => {
                   if(index == 0){
                       gradRate = $(element).find('span').text();
                       index1 = gradRate.indexOf('%');
                       gradRate = gradRate.slice(index1-2,index1);
                       gradRate = parseInt(gradRate)/100;
                   }
                   else if(index == 1){
                        readPro = $(element).find('div.profile__bucket--1').find('span').text();
                        readIndex = readPro.indexOf('Reading');
                        readPro = parseInt(readPro.slice(readIndex+7,-1))/100;
                        mathPro = $(element).find('div.profile__bucket--2').find('span').text();
                        mathIndex = mathPro.indexOf('Math');
                        mathPro = parseInt(mathPro.slice(mathIndex+4,-1))/100;
                   }
                   else if(index == 2){
                    apPassRate = parseInt($(element).find('div.profile__bucket--1').find('div.scalar > div.scalar__value').text().slice(0,-1))/100;
                    APS = parseInt($(element).find('div.profile__bucket--2').find('div.scalar > div.scalar__value').text());
                   }
                });
                $('div.profile-blocks').find('section.block--two-one').each((index, element) => {
                    SAT = parseInt($(element).find('div.profile__bucket--1').find('div.scalar > div.scalar__value').text().slice(0,4));
                    ACT = parseInt($(element).find('div.profile__bucket--2').find('div.scalar > div.scalar__value').text().slice(0,2));
                })
                resolve(new HighSchool(name,rank,SAT,ACT,APS,location,gradRate,apPassRate,mathPro,readPro));
            }).catch(error => {
                console.log(error);
            })
        });
}

/**
 * Returns high school object associated with given name
  *  @param {string} highschoolName: name of high school
 * @returns High school object based on highschool.js
 */
function scrapeHighSchool(highschoolName) {
    return new Promise((resolve,reject) => {
        getHighSchoolNames().then((high_schools) => {
            if(high_schools.has(highschoolName)){
                scrapeNiche(highschoolName,high_schools.get(highschoolName)).then((highschool) => {
                    resolve(highschool);
                })
            }
            else{
                resolve({error: `${highschoolName} is not available high school`});
            }
        })
    })
}

module.exports.scrapeHighSchool = scrapeHighSchool;
module.exports.getHighSchoolNames = getHighSchoolNames;