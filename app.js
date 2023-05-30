const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const db = new sqlite3.Database("test.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the in-memory SQlite database.");
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

function handleSignup() {
  // let sql =
  //   "CREATE TABLE users (userid INTEGER PRIMARY KEY,Name TEXT, Email TEXT UNIQUE, Password TEXT NOT NULL)";

  app.post("/signup", async (req, res) => {
    try {
      const { id, name, email, password, phone } = req.body;
      console.log(req.body);

      var salt = bcrypt.genSaltSync(10);
      var hashedPassword = bcrypt.hashSync(password, salt);
      // let hashedPassword = "password";
      // bcrypt.genSalt(10, function (err, salt) {
      //   bcrypt.hash(password, salt, function (err, hash) {
      //     hashedPassword = hash;
      //   });
      // });
      let sql =
        "INSERT INTO users(userid,Name, Email, Password,phone) VALUES (?,?,?,?,?)";
      db.run(sql, [id, name, email, hashedPassword, phone], (err) => {
        if (err) {
          res.json({
            status: "failure",
            message: err.message,
          });
          return console.log(err.message);
        } else {
          getUserDataFromUserId(id, res);
          console.log(`A row has been inserted with rowid ${id}`);
        }
        // get the last insert id
      });
    } catch (e) {
      res.json({
        status: "failure",
        message: e.message,
      });
      return console.error(e);
    }
  });
}
function handleLogin() {
  app.post("/login", (req, res) => {
    try {
      console.warn("login request :post");
      const { email, password } = req.body;
      console.warn(email, password);

      let sql = `SELECT password,userid,Name,Email,phone FROM users WHERE email=?`;
      db.all(sql, [email], (err, row) => {
        if (row[0]) {
          let { Password: hash, userid, Name, Email, phone } = row[0];
          console.log(hash, userid, Name, Email);

          isAuthorized = bcrypt.compareSync(password, hash);

          console.log(isAuthorized);
          if (isAuthorized) {
            res.json({ authorized: true, Name, Email, userid, phone });
          } else {
            res.json({ authorized: false });
          }
        } else {
          res.json({ authorized: false, message: "No Such User" });
        }
      });
    } catch (e) {
      res.json({
        status: "failure",
        message: e.message,
      });
      return console.error(e);
    }
  });
}
app.get("/", (req, res) => {
  res.json({ hello: "worldie" });
});
function handleBookTicket() {
  app.post("/book", (req, res) => {
    try {
      const { userid, name, source, destination, date, seat, busid, time } =
        req.body;
      let sql =
        "INSERT INTO bookings (userid,name,source,destination, date,seat,busid,time) VALUES (?,?,?,?,?,?,?,?)";
      db.run(
        sql,
        [userid, name, source, destination, date, seat, busid, time],
        (e) => {
          if (e != undefined) {
            res.json({ success: false, message: e });

            return console.log(e);
          } else {
            res.json({
              success: true,
              userid,
              name,
              source,
              destination,
              seat,
              busid,
              time,
            });
          }
        }
      );
      //for updating the bus seat list
      let sql2 = "SELECT reservedSeats from buses WHERE busid=?";
      let initialSeats = "";
      db.all(sql2, [busid], (err, row) => {
        if (err) {
        } else {
          initialSeats = row[0]?.reservedSeats.split(" ");

          let seatToBeAdded = seat?.split(" ");
          seatToBeAdded.forEach((seat) => {
            initialSeats?.push(seat);
          });
          let finalSeats = initialSeats?.join(" ");
          let sql2 = `UPDATE buses SET reservedSeats=? WHERE busid =?`;
          db.run(sql2, [finalSeats, busid], (err) => {
            if (err) {
            } else {
            }
          });
        }
      });
      // for updating user data (busid and seats of reserved buses)
      let sql3 = ` UPDATE users SET reservedBusid=?,reservedSeats=? WHERE userid =?`;
      db.run(sql3, [busid, seat, userid], (e) => {
        if (e) {
          console.error(e.message);
        } else {
          console.log("user info updated with latest busid and seat info");
        }
      });
    } catch (e) {
      if (e) throw new Error(e);
      res.json({ success: false, message: "Some Error occured" });
    }
  });

  // let sql =
  //   "CREATE TABLE bookings (userid INTEGER PRIMARY KEY , name TEXT ,source TEXT, destination TEXT, date TEXT,seat TEXT)";
}
function getUserDataFromUserId(uid, res) {
  let sql = `SELECT Name,Email,phone FROM users WHERE userid=?`;

  db.all(sql, [uid], (err, row) => {
    if (!err) {
      if (row[0]) {
        let { Name, Email, phone } = row[0];

        let resp = {
          uid,
          Name,
          Email,
          phone,
        };

        res.json({
          ...resp,
          status: "success",

          authorized: true,
        });
      }
    } else {
      throw new Error(err.message);
    }
  });
}
function addBus() {
  // let sql1 =
  //   "CREATE TABLE buses (busid INTEGER PRIMARY KEY,busName TEXT, source TEXT, destination TEXT , time TEXT , date TEXT, price INTEGER)";
  // db.run("DROP TABLE buses", (e) => {
  //   console.log("table dropped again");
  // });
  // db.run(
  //   "CREATE TABLE buses (busid TEXT PRIMARY KEY,busName TEXT, source TEXT, destination TEXT , time TEXT , date TEXT,reservedSeats TEXT, price INTEGER)",
  //   (e) => {
  //     if (e) console.log(e.message);
  //     console.log("table MNODI");
  //   }
  // );
  let sql = app.post("/addBus", (req, res) => {
    try {
      const {
        busid = "9888",
        busName = "Agni Travels",
        source = "kathmandu",
        destination = "pokhara",
        date = "2023 05 25",
        time = "18 00",
        reservedSeats = "22 11 4",
        price = 1000,
      } = req.body;

      let sql =
        "INSERT INTO  buses (busid , busName, source , destination  , date  , time ,reservedSeats, price ) VALUES (?,?,?,?,?,?,?,?)";

      db.run(
        sql,
        [busid, busName, source, destination, date, time, reservedSeats, price],
        (e) => {
          if (e) {
            console.log(e);
            res.json({
              success: false,
              message: "the following data has not been inserted",
              error: e.message,
            });
          } else {
            console.log("Values Inserted");
            res.json({
              success: true,
              message: "the following data has been inserted",
            });
          }
        }
      );
      let sql2 = `INSERT INTO  bookings (time) VALUES (?) WHERE busid=?`;
      db.run(sql2, [time, busid], (err) => {
        if (!err) {
          console.log("time added to bookings");
        }
      });
    } catch (e) {
      res.json({
        status: "failure",
        message: e.message,
      });
      return console.error(e);
    }
  });
}
function searchBus() {
  app.post("/search", (req, res) => {
    const { source, destination, date } = req.body;
    let sql = `SELECT * FROM buses WHERE source=? AND destination=? AND date=?`;
    db.all(sql, [source, destination, date], (err, rows) => {
      if (err) {
        res.json({
          success: false,
          message: "UNABLE TO FIND BUSES",
          err: err.message,
        });
      } else {
        let busList = [];
        rows.forEach((row) => {
          busList.push(row);
        });
        res.json({ success: true, buses: rows });
      }
    });
  });
}
function getAllBuses() {
  app.get("/getAllBuses", (req, res) => {
    let sql = "SELECT * FROM buses";
    db.all(sql, (err, rows) => {
      if (err) {
        res.json({
          success: false,
          message: "UNABLE TO FIND BUSES",
          err: err.message,
        });
      } else {
        let busList = [];
        rows.forEach((row) => {
          busList.push(row);
        });
        res.json({ success: true, buses: busList });
      }
    });
  });
}
function getUserReservations() {
  app.post("/getUserReservations", (req, res) => {
    try {
      const { userid } = req.body;
      let sql = `SELECT name,busid,seat,date,source,destination,time from bookings WHERE userid=?`;

      db.all(sql, [userid], (e, row) => {
        if (e) {
          console.error(e.message);
          res.json({
            success: false,
            message: "No reservations",
            error: e.message,
          });
        } else {
          res.json({ success: true, reservations: row, message: "cool" });
        }
      });
    } catch (error) {
      resjson({ error });
    }
  });
}
function deleteReservation() {
  app.get("/deleteReservation", (req, res) => {
    const { userid, busid } = req.body;

    let sql = "DELETE FROM bookings WHERE userid=? AND busid=?";
    db.run(sql, [userid, busid], (e) => {
      if (e) {
        console.log(e.message);
        res.json({ status: "failure", error: e });
      } else {
        res.json({ message: "successful   deletion" });
      }
    });
  });
}
// hello wor
deleteReservation();
getUserReservations();
getAllBuses();
searchBus();
handleLogin();
handleBookTicket();
handleSignup();
addBus();
app.listen(3000);
