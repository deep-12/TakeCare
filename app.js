var express = require("express");
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var local = require("passport-local");
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var passportlocalmongoose = require("passport-local-mongoose");
var app = express();
var User = require("./models/users");
var urlencodedParser = bodyparser.urlencoded({ extended: false });
app.use(require("express-session")({
	secret:"xyz",
	resave:false,
	saveUninitialised:false
}));
app.use(express.static('./public'));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new local(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect("mongodb://localhost:27017/skincare");
app.set("view engine","ejs");
app.use(bodyparser.urlencoded({extended:true}));
app.use(function(req,res,next){
	res.locals.curruser = req.user;
	next();
})

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

app.get("/",function(req,res){
	res.render("home");
})
app.get("/login",function(req,res){
	res.render("login");
})
app.post("/login",passport.authenticate("local",{
	successRedirect:"/",
	failurRedirect: "/signup"
}),function(req,res){});

app.get("/signup",function(req,res){
	res.render("signup");
})

app.post("/signup",function(req,res){
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("signup");
		}
		else{
			passport.authenticate("local")(req,res,function(){
				res.redirect("/");
			});
		}
	})
})
app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
})
app.get("/upload",isloggedin,function(req,res){
	res.render("upload");
})
app.post("/upload",isloggedin, function(req,res){
	upload(req, res, (err) => {
    if(err){
      res.render('upload', {
        msg: err
      });
    } else {
      if(req.file == undefined){
        res.render('upload', {
          msg: 'Error: No File Selected!'
        });
      } else {
      	//console.log(req.file);
        res.render('upload', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        });
      }
    }
  });
})
app.get("/check",isloggedin,function(req,res){
	fs.readFile('file1.txt','utf8',function(err,data){
			if(err) throw err;
            //res.render("show",{data:data});
            // var myModal = new Modal({
            //       title: 'My Modal Dialog',
            //       content: 'This is a dynamic content for the modal injected from JS'
            // }).show();
            res.render("check",{data:data});
		})
})
app.get("/cure",isloggedin,function(req,res){
	fs.readFile('file1.txt','utf8',function(err,data){
			if(err) throw err;
            //res.render("show",{data:data});
            // var myModal = new Modal({
            //       title: 'My Modal Dialog',
            //       content: 'This is a dynamic content for the modal injected from JS'
            // }).show();
            res.send(data);
		})
})
function isloggedin(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/");
}
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}
app.listen(3000,function(err){
	if(err)throw(err);
	console.log("server is running");
});