const mysql = require('mysql');
const sc = require('./scrape_c_data.js');
const College = require('./college.js');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Setup a connection to the database 
 */
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB
});

/**
 * Scrape the data from the colleges so that we populate the database for searching.
 */
con.connect((err) => {
  if (err) throw err;
  sc.scrapeData().then((colleges)=>{
    //get collegeobject from map
    let collegeObjects = colleges.values();
    //initialize parsing of objects
    //collegeobject is the first object
    let collegeObject = collegeObjects.next();
    //iterate through each college object
    while (!collegeObject.done) {
        //insert college object into colleges table
        collegeInsert(collegeObject.value);
        //if college object has majors property set
        if(collegeObject.value.getMajors()){
            //for each college major insert into collegemajors table
            collegeObject.value.getMajors().forEach((value) => {
                majorInsert(collegeObject.value.getName(),value);
            })
         } 
        collegeObject = collegeObjects.next();
    }
  });
});

/**
 * Inserts a college entity into colleges db
 *  @param {object} college: college object defined in college.js
 * 
 */
const collegeInsert = (college) => {
  return new Promise((resolve, reject) => {
    let copiedCollege = Object.assign({}, college);
    delete copiedCollege.majors;
    copiedCollege.name = "'"+ copiedCollege.name + "'";
    copiedCollege.institutionType = "'"+ copiedCollege.institutionType + "'";
    copiedCollege.state = "'"+ copiedCollege.state + "'";
    copiedCollege.location = "'"+ copiedCollege.location + "'";
    let insertvalues = Object.values(copiedCollege).map((value) =>{  
      if(value == null || (typeof value === "number" && isNaN(value))){
        return 'null';
      }
      return value;
    })
    let query = "INSERT INTO colleges (" + Object.keys(copiedCollege).toString() + ")" + 
               " VALUES (" + insertvalues + ")";
    con.query(query, (err, result) => {
      if (err) throw err;
      resolve();  
    });
  })
}

/**
 * Inserts a major entity into majors db
 *  @param {string} major: major name
 * @param {string} collegename: name of college  
 * 
 */
const majorInsert = (collegename, major) => {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO majors (college, major) VALUES ('${collegename.replace(/'/g, '"')}','${major.replace(/'/g, '"')}')`;
    con.query(query, (err, result) => {
        if (err) throw err;
        resolve();  
    });
  })
}

/**
 * Inserts a student entity into students db
 *  @param {object} student: student object defined in students.js 
 * 
 */
const studentInsert = (name, password, salt) => {
  return new Promise((resolve, reject) => {
    let query = `INSERT INTO students (username, password, salt, satMath, satErwb, actComposite, numAPPassed, GPA) VALUES ('${name}','${password}','${salt}',200,200,1,0,0.0)`;
    con.query(query, (err, result) => {
        if (err) throw err;
        resolve();  
    });
  })
}

/**
 * updates the student entity in the db based on student values
 *  @param {object} student: student object defined in students.js 
 * 
 */
const updateAccount = (student) => {
  return new Promise((resolve, reject) => {
    Object.keys(student).map(attr => {
      if(attr == undefined){
        return 'null';
      }
      return attr;
    });
    let query = `UPDATE students SET  satMath = ${student.satMath}, satErwb = ${student.satErwb}, ` + 
                `actComposite = ${student.actComposite}, numAPPassed = ${student.numAPPassed},` + 
                `GPA = ${student.GPA} WHERE username = '${student.username}'`;
    con.query(query, (err, result) => {
        if (err) {
          resolve(err);
        }
        resolve();  
    });
  })
}


/**
 * Get student object from db
 *  @param {string} name: username of student account
 * @param {string} password: password of student account
 * @return student account object
 */
const getStudentAccount = (name, password) => {
   return new Promise((resolve, reject) => {
     let query = `SELECT * FROM students WHERE username = '${name}' AND password = '${password}'`;
     con.query(query, (err, result) => {
        if (err) throw err;
        resolve(result[0]);
     });
   })
}

/**
 * Get salt associated with 
 *  @param {string} name: username of student account
 * @return string of salt associated with string
 */
const getAccountSalt = (name) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT salt FROM students WHERE username = '${name}'`;
    con.query(query, (err, result) => {
       if (err) throw err;
       resolve(result[0]);
    });
  })
}

/**
 * Checks if username exists in students database
 *  @param {string} name: username of student account
 * @returns promise that resolves to true or false
 */
const accountNameExists = (name) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM students WHERE username = '${name}'`;
    con.query(query, (err, result) => {
       if (err) throw err;
       if(result.length){
          resolve(true);
       }
       else{
         resolve(false);
       }
    });
  })
}

/**
 * Gets the majors for the college list
 *  @param {string} colleges: college name
 * @returns colleges list with college object containing majors
 */
const getMajors = (colleges) => {
  //make a list of promises
  let promises = [];
  //for every college object query for majors in majors table
  //add majors as attribute for each college object
  colleges.forEach(college => {
    promises.push(
      new Promise((resolve, reject) => {
        let query = `SELECT major FROM majors WHERE college = '${college.name}'`;
        con.query(query, (err, majors) => {
          if (err) throw err;
          college.majors = majors.map((value) => {
            return value.major;
          });
          resolve(college);
        });
      })
    )
  });
  return Promise.all(promises);
}

/**
 * searches colleges based on substring given
 *  @param {string} name: user input for search
 * @returns resolves a colleges list
 */
const searchColleges = (substring) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM colleges WHERE name LIKE '${substring}%'`;
    con.query(query, (err, colleges) => {
       if (err) throw err;
       //obtain majors for each college object
       getMajors(colleges).then((colleges) =>{
        resolve(colleges.map((college) => {
          return new College(college.name,college.admitRate,college.instateTuition,college.outstateTuition,
            college.score,college.institutionType,college.medianGradDebt,college.state,college.location,
            college.size,college.satMath,college.satErwb,college.ACT,college.completeRate,college.majors);
        }));
       })
    });
  })
}

/**
 * Checks if college is favorited
 *  @param {string} name: username of student account
 * @param {string} collegename: name of college s
 * @returns promise that resolves to true or false
 */
const favoriteExists = (name, collegename) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM favorites WHERE username = '${name}' AND collegename = '${collegename}'`;
    con.query(query, (err, result) => {
       if (err) throw err;
       if(result.length){
          resolve(true);
       }
       else{
         resolve(false);
       }
    });
  })
}

/**
 * Add favorite attribute depending on user
 *  @param {string} name: username of student account
 * @param {list} colleges: list of college objects
 */
const favoriteColleges = (name, colleges) => {
  const promises = [];
  for(const college of colleges){
    promises.push(new Promise((resolve, reject) => {
        favoriteExists(name, college.name).then((exists) =>{
          college.favorite = exists;
          resolve(college);
        });
    }));
  }
  return Promise.all(promises);
}


/**
 * adds college to favorites of user
 *  @param {string} username: username of student account
 * @param {string} collegename: name of college
 * 
 */
const addFavorites = (username, collegename) => {
  return new Promise((resolve, reject) => {
    favoriteExists(username,collegename).then((exists) => { 
      if(exists){
        resolve();
      }
      else{
        let query = `INSERT INTO favorites (username, collegename) VALUES ('${username}','${collegename}')`;
        con.query(query, (err, result) => {
          if (err) throw err;
            resolve();      
        });
      }
    })
  })
}

/**
 * deletes college from favorites of user
 *  @param {string} username: username of student account
 * @param {string} collegename: name of college
 * 
 */
const deleteFavorites = (username, collegename) => {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM favorites WHERE username = '${username}' AND collegename = '${collegename}'`;
    con.query(query, (err, result) => {
       if (err) throw err;
        resolve();      
    });
  })
}

/**
 * get favorite colleges of user
 *  @param {string} username: username of student account
 */
const getFavorites = (username) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT name, admitRate, instateTuition, outstateTuition, score, institutionType, ` + 
                `medianGradDebt, state, location, size, satMath, satErwb, ACT, completeRate FROM favorites, colleges`+
                ` WHERE collegename = name AND username = '${username}';`;
    con.query(query, (err, colleges) => {
       if (err) throw err;
        //obtain majors for each college object
       getMajors(colleges).then((colleges) =>{
        resolve(colleges.map((college) => {
            return new College(college.name,college.admitRate,college.instateTuition,college.outstateTuition,
              college.score,college.institutionType,college.medianGradDebt,college.state,college.location,
              college.size,college.satMath,college.satErwb,college.ACT,college.completeRate,college.majors);
        }));
       })   
    });
  })
}

/**
 * get the college names from colleges db
 *  
 */
const getCollegenames = () => {
  return new Promise((resolve, reject) => {
    let query = `SELECT name FROM colleges`;
    con.query(query, (err, collegenames) => {
       if (err) throw err;
        resolve(collegenames.map((collegename) => { return collegename.name}));      
    });
  })
}



module.exports.studentInsert = studentInsert;
module.exports.getStudentAccount = getStudentAccount;
module.exports.updateAccount = updateAccount;
module.exports.accountNameExists = accountNameExists;
module.exports.getAccountSalt = getAccountSalt;
module.exports.searchColleges = searchColleges;
module.exports.addFavorites = addFavorites;
module.exports.getFavorites = getFavorites;
module.exports.deleteFavorites = deleteFavorites;
module.exports.getCollegenames = getCollegenames;
module.exports.favoriteExists = favoriteExists;
module.exports.favoriteColleges = favoriteColleges;



