const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());
const bcrypt = require("bcrypt");

let db = null;
const dbPath = path.join(__dirname, "userData.db");

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `select * from user where username = '${username}';`;
  const getUser = await db.get(getUserQuery);
  if (getUser === undefined) {
    const postUserQuery = `insert into user(username,name,password,gender,location)
        values('${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}');`;

    if (password.length > 5) {
      response.send("User created Successfully");
      await db.run(postUserQuery);
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `select * from user where username='${username}';`;
  const getUser = await db.get(getUserQuery);

  if (getUser === undefined)
{
    response.status(400);
    response.send("Invalid user");
}
else
{
    const comparePassword = await bcrypt.compare(password, getUser.password);    
 
    if (comparePassword)
    {
        response.status(200);
        response.send("Login success!");
    }
    else
    {
        response.status(400);
        response.send("Invalid password");
    }
}

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `select * from user where username = '${username}';`;
  const getUser = await db.get(getUserQuery);
  // const updateQuery = `update user set oldPassword = '${oldPassword}',
  // newPassword = '${newPassword}';`;
  if (getUser !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      getUser.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set 
        password = '${hashedPassword}' where username = '${username}';`;
        const updatePasswordResponse = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated"); //Scenario 3
      } else {
        response.status(400);
        response.send("Password is too short"); //Scenario 2
      }
    } else {
      response.status(400);
      response.send("Invalid current password"); //Scenario 1
    }
  }
});

module.exports = app;
