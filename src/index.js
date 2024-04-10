const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');

const multer = require('multer');
const collection = require("./config");
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'amayuru',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/images/';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", upload.single('picture'), async (req, res) => {
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
      username: req.body.username,
      picture: req.file.filename
    }
  
    const existingUser = await collection.findOne({ username: data.username });
  
    if (existingUser) {
      res.send('User already exists. Please choose a different username.');
    } else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      data.password = hashedPassword;
  
      try {
        const newUser = await collection.create(data);
        console.log('User created successfully:', newUser);
        
        // Redirect to home page after successful signup
        req.session.user = newUser; // Store user data in session
        res.redirect("/home"); // Redirect to the home page
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal server error. Please try again later.');
      }
    }
  });
  

app.post("/login", async (req, res) => {
  try {
    const user = await collection.findOne({ username: req.body.username });
    if (!user) {
      res.send("User not found");
    }

    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordMatch) {
      res.send("Invalid password");
    } else {
     
      req.session.user = user;
      res.redirect("/home");
    }
  } catch {
    res.send("Error occurred");
  }
});

app.get("/home", (req, res) => {
 
  const user = req.session.user;
  res.render("home", { user });
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
