const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const encryptKey = uuidv4();
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const db = require('./database.js');
const scH = require('./scrape_h_data');
const Student = require('./student.js');

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/',express.static(__dirname + '/public'));

/**
 * Endpoint for creating an account. Implemented.
 */
app.post('/createaccount', (req, res) => {
    let username = req.body.username;
    // generates a salt (random sequence of bytes) to append to the plaintext
    // password so that its hash is less predictable
    let salt = crypto.randomBytes(256).toString('hex').slice(0, 16);
    // appends the salt to the password and hashes it
    let password = CryptoJS.MD5(req.body.password.concat(salt)).toString();
    // checks to see if the given username already exists
    db.accountNameExists(username).then((accountexists) => {
      if (accountexists) {
        // error, this username is already registered
        res.status(400).send({ status: 'error', error: "Username is already registered" });
      } else {
        // adds a new account into the database with the username, 
        // hashed password with appended salt, and the plaintext salt
        db.studentInsert(username, password, salt).then(() => {
          res.status(200).send({ status: 'OK' });
        });
      }
    });
  });

/**
 * Endpoint for logging in
 */
app.post('/login', (req, res) => {
    // attempts to fetch the salt of this username from the database
    db.getAccountSalt(req.body.username).then((result) => {
      if (result) {
        let user = {
          username: req.body.username,
          // hashes the password with the fetched salt
          password: CryptoJS.MD5(req.body.password.concat(result.salt.toString())).toString(),
        }
        // checks to see if the given account credentials exist in the database
        db.getStudentAccount(user.username, user.password).then((account) => {
            if (account) {
              // encrypt the user object (username and password) into a cookie token
              // for authentification purposes to check if user is still logged in
              jwt.sign(user, encryptKey, (err, token) => {
                if (err) {
                  res.status(400).send({ status: 'error', error: "error making key" })
                }
                else {
                  //add cookie to response
                  res.cookie('token', token);
                  res.status(200).send({ status: 'OK' });
                }
              });
            } else {
              // no account with given combination of credentials found
              res.status(400).send({ status: 'error', error: "No account found with those login credentials" });
            }
          });
      } else {
        // no account with given username found
        res.status(400).send({ status: 'error', error: "No account found with those login credentials" });
      }
  
    });
  });

/**
 * Endpoint for logging out. Implemented.
 */
app.post('/logout', verifyToken, (req, res) => {
    // clears the authentification token in user's cookies so they are no longer logged in
    // also clears the admin field of the user's cookies
    res.clearCookie('token');
    res.status(200).send({ status: 'OK' });
});

/**
 * Endpoint for obtaining high school object 
 */
app.get('/highschool/:name', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        //scrape for high school object
        scH.scrapeHighSchool(req.params.name).then((highschool)=>{
            res.status(200).send(highschool);
        })
    }
  });
});

/**
 * Endpoint for obtaining current user info
 */
app.get('/account', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        //obtain student account from db
        db.getStudentAccount(authData.username,authData.password).then((student) => {
          delete student.salt;
          res.status(200).send(student);
        })
    }
  });
});

/**
 * Endpoint for updating current user info
 */
app.post('/updateaccount', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        if(req.body){
          //update user info
          db.updateAccount(new Student(authData.username, authData.password,
                           req.body.satMath,req.body.satErwb,req.body.actComposite,
                           req.body.numAPPassed,req.body.GPA)).then((err) => {
                                //check if update is successful
                                if(err){
                                  res.status(400).send({error: "invalid input body"});
                                }
                                else{
                                  res.status(200).send({status: 'OK'});
                                }
                           })
        }
        else{
          res.status(400).send({ status: 'error', error: 'no input body found' });
        }
    }
  });
});

/**
 * Endpoint for obtaining high school names
 */
app.get('/highschoolnames', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        //high school name from highschools.txt
        scH.getHighSchoolNames().then((highschools) => {
           res.status(200).send(Array.from(highschools.keys()));
        })
    }
  });
});

/**
 * Endpoint for search
 */
app.post('/search', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        if(req.body){
          //input search substring
          db.searchColleges(req.body.input).then((colleges) => {
            db.getStudentAccount(authData.username,authData.password).then((student) => {
              colleges = colleges.map((college) => {
                college.acceptanceRate = college.acceptanceRate(student);
                return college;
              });
              if(req.body.highFirst){
                colleges = colleges.sort((a, b) => (a.acceptanceRate < b.acceptanceRate) ? 1 : -1);
              }
              else{
                colleges = colleges.sort((a, b) => (a.acceptanceRate < b.acceptanceRate) ? -1 : 1);
              }
              db.favoriteColleges(authData.username,colleges).then((colleges) => {
                res.status(200).send(colleges);
              })
              //res.status(200).send(colleges);
            })
          })
        }
        else{
          res.status(400).send({ status: 'error', error: 'no input body found' });
        }
    }
  });
});

/**
 * add favorite college of user
 */
app.post('/addfavorite', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        if(req.body){
          //add favorite college name and username
          db.addFavorites(authData.username,req.body.collegename).then((result) => {
            res.status(200).send({status: 'OK'});
          })
        }
        else{
          res.status(400).send({ status: 'error', error: 'no input body found' });
        }
    }
  });
});

/**
 * Endpoint for getting student favorites colleges
 */
app.get('/getfavorites', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        //get favorite colleges of student
        db.getFavorites(authData.username).then((colleges) => {
          db.getStudentAccount(authData.username,authData.password).then((student) => {
            colleges = colleges.map((college) => {
              college.acceptanceRate = college.acceptanceRate(student);
              return college;
            })
            colleges = colleges.sort((a, b) => (a.acceptanceRate < b.acceptanceRate) ? 1 : -1);
            res.status(200).send(colleges);
          })
        })
    }
  });
});

/**
 * Endpoint for deleting certain favorite college of student
 */
app.delete('/deletefavorite', verifyToken, (req, res) => {
  //verify 'token' cookie is valid
  jwt.verify(req.token, encryptKey, (err, authData) => {
    if (err) {
      res.status(400).send({ status: 'error', error: 'User not logged in' });
    } else {
        db.deleteFavorites(authData.username,req.body.collegename).then((result) => {
          res.status(200).send({status: 'OK'});
       })
    }
  });
});



function verifyToken(req,res,next) {
    let token = req.cookies['token'];
    if(!token){ 
        res.status(500);
        res.json({status: 'error', error: 'User not logged in'});
    }
    else{
        req.token = token;
        next();
    }
}
  

app.listen(process.env.PORT,'localhost');
