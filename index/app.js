const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path=require("path");
const staticCSS = express.static(path.join(__dirname + "/public"));
const handle = require("express-handlebars");
const cookies=require("cookie-parser");
const bcrypt=require("bcrypt");
const async = require("async");
const saltRounds = 2;

const userAPI = require("./db/user.js");

const pokemanAPI = require("./pokemanAPI.js");
const forumAPI = require("./db/forumAPI.js");

app.use("/",staticCSS);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookies());

app.engine("handlebars",handle({defaultLayout: "main"}));
app.set("view engine","handlebars");

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");

if(process && process.send) process.send({done: true});

	app.get("/", async (req, res) => {

		var user = await getUser(req.cookies.AuthCookie);

		if(user)
		{
			res.redirect("home");
		}
		else{

			res.render("index",
				{
					layout: "login",
					title: "Welcome! Please Login"
				}
			);
		}
	});

	app.post("/login", async (req, res) => {
		try{
			var user = await userAPI.getUserByName(req.body.username);
			var ifValidCredentials;

			var ifValidCredentials = await bcrypt.compare(req.body.password, user.password);
			if(ifValidCredentials){
				res.cookie("AuthCookie",user._id);
				res.redirect("home");
			}else{
				res.render("index",
					{
						layout: "login",
						title: "Retry!",
						error: "Error, incorrect login info"
					}
				);
			}
		}catch(e){
			res.render("index", 
				{
					layout: "login",
					title: "Retry!",
					error: "LOGIN Error: " + e
				}
			);
		}
	});

	app.get("/home", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.password);
			//console.log(user1);
			res.render("userDisplay",{
		 			title: "User info",
		 			username: user1.username,
		 			favorites: user1.favorites
		 	});
			//res.status(403);
		}
	});

	app.get("/pokemon", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);

			pokemanAPI.getFullPokemanList(function(error, result){
				res.render("pokemanList",{
			 			title: "All Pokemon",
			 			user: JSON.stringify(user1),
			 			pokemon: result
			 	});
				//res.status(403);
			});
		}
	});

	app.post("/pokemon/getPokemon", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);

			//req.params.studentId
			pokemanAPI.getPokemonByName(req.body.pokename, function(error, result){
				if(error){
					//do an error
					console.log(error);
					res.render("pokemon/pokemonView",{
			 			title: "Not a valid pokemon!"
				 	});
				}else{
					//render the correct pokemon screen
					//console.log(result);
					res.render("pokemon/pokemonView",{
			 			title: "Pokemon :: " + result.name,
			 			name: result.name,
			 			user: JSON.stringify(user1),
			 			height: Math.ceil((result.height*10)/2.54) ,
			 			weight: Math.ceil((result.weight/(10*0.45359237))),
			 			moves: result.moves,
			 			types: result.types,
			 			sprite: result.sprite,
			 			isFavorite: user1.favorites.includes(result.name) ? true : false
				 	});
					//res.status(403);
				}
			});
		}
	});

	app.post("/pokemon/getMatchup", async (req, res) => {
		if(false){
			res.render("notLoggedIn",{
		 		title: "Sorry you are not logged in"
		 	});
		}else{
			// user1=Object.assign({},user);
			// delete(user1.hash);

			pokemanAPI.getPokemonMatchup(req.body.pokename, function(error, result){
				if(!error && result){
					res.render("pokemon/matchupResults",{
			 			title: "Pokemon :: " + result.name,
			 			height: Math.ceil((result.height*10)/2.54) ,
			 			weight: Math.ceil((result.weight/(10*0.45359237))),
			 			moves: result.moves,
			 			types: result.types,
			 			sprite: result.sprite,
			 			name: result.name,
			 			isFavorite: user1.favorites.includes(result.name) ? true : false
				 	});
				}else if(!error && !result){
					res.render("notLoggedIn",{
						title: " Could not find a good match!"
					})

				}else{
					res.render("notLoggedIn",
						{
							title: "There was an error! " + error
						}
					);
				}
				//matchupPokemon=result.name;
			});
		}
	});

	app.post("/pokemon/addToFavorites", async (req, res) => {
		try{
			var user = await userAPI.getUser(req.body.id);
			var updatedList = user.favorites;
			updatedList.push(req.body.pokemonName);
			var updatedUser = await userAPI.updateUserFav(req.body.id, updatedList);
			res.status(200).end();
		}catch(e){
			res.status(400).end();
		}
	});
	
	app.get("/matchup", async (req, res) => {
		try{
			var user = await getUser(req.cookies.AuthCookie);
		}catch(e){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);
			res.render("pokemon/matchup",{
		 			title: "Matchup!",
		 			user: JSON.stringify(user1)
		 	});
			res.status(403);
		}
	});

	app.get("/forum", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);

			try{
				var allPosts = await forumAPI.getAllPosts();
				//var allPosts;
				// console.log(user1.id);
				// console.log(user1._id);
				//console.log(allPosts);

				res.render("forumDisplay",{
		 			title: "Discussion page",
		 			userId: user1._id,
		 			posts: allPosts
		 		});
			}catch(e){
				res.render("notLoggedIn",{
					title: "There was an error loading the posts, please try again"
				});
			}
		}
	});

	app.post("/forum/newComment", async (req, res) => {

		var user = req.body.userId;
		var commentValue = req.body.commentValue;
		var postId = req.body.postId;

		try{
			var addedComment = await forumAPI.createComment(postId,user,commentValue);
			res.status(200).end();
		}catch(e){
			console.log("There was an error! " + e);
			res.status(400).end();
		}
	});

	app.post("/forum/newPost", async (req, res) => {

		var user = req.body.userId;
		var postTitle = req.body.postTitle;
		var postContent = req.body.postContent;

		try{
			var addedPost = await forumAPI.createPost(postTitle,user,postContent,[]);
			res.status(200).end();
		}catch(e){
			console.log("There was an error! " + e);
			res.status(400).end();
		}

	});

	app.post("/forum/removePost", async (req, res) => {
		var postId = req.body.postId;

		try{
			var removedPost = await forumAPI.deletePost(postId);
			res.status(200).end();
		}catch(e){
			console.log("There was an error! " + e);
			res.status(400).end();
		}

	});

	app.post("/forum/removeComment", async (req, res) => {
		var postId = req.body.postId;
		var commentId = req.body.commentId;

		try{
			var removedComment = await forumAPI.deleteComment(postId,commentId);
			res.status(200).end();
		}catch(e){
			console.log("There was an error! " + e);
			res.status(400).end();
		}

	});

	app.get("/create-account", (req, res) => {
		res.render("create-account",
			{
				layout: "login",
	 			title: "Create an account!"
	 		}
	 	);
		res.status(403);
	});




	app.post("/create-account-attempt", async (req, res) => {
		try{
			const pass1=req.body.password;
			const pass2=req.body.password2;

			if(pass1!==pass2){
				throw "Error: passwords must match!";
			}

  			const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

			const user = await userAPI.addUser(req.body.username,hashedPassword,[]);
			res.render("index",
				{
					layout: "login",
					title: "Account successfully created. Please login!"
				}
			);
		}catch(e){
			res.render("create-account",
				{
					layout: "login",
					title: "Try again",
					error: "Unable to create account! Error " + e 
			});
		}
	});

	app.get("/logout", (req, res) => {
	 	res.clearCookie("AuthCookie");
	 	res.render("loggedOut",
	 		{

		 		layout: "login",
		 		title: "You have been logged out"
			}
		);
	});

});

async function getUser(id){
	if(!id)
		return undefined;
	try{
		let the_user = await userAPI.getUser(id);
		return the_user;
	}catch(e){
		return undefined;
	}
}
