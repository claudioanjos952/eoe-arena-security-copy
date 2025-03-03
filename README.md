## 🎉 Finally, it's online!  

Here’s the link to play:  
[EOE Arena (Security Copy) https://eoe-arena-security-copy.onrender.com](https://eoe-arena-security-copy.onrender.com/)  

⚠ **Important:** This is a free server, so it goes into sleep mode after 15 minutes of inactivity. If the link doesn't work immediately, just wait a bit for the server to wake up and refresh the page.  

---

## 📌 About This Project  

This is a copy of the original **EOE Arena** project that I'm trying to bring back online. The challenge? I have **zero** programming knowledge! But thanks to **ChatGPT**, here we are! 😁  

---
## Server used
- API: https://dashboard.render.com/
- DATABASE: https://account.mongodb.com

---

## 🔥 Challenges Faced  

The original project used `mongojs` for the database, but I couldn't find a free hosting service compatible with it. So, I had to modify the code to work with **MongoDB Atlas** instead.  

Additionally:  
- The original code used **Promises**, but they didn’t work properly in this setup.  
- I had to manually rewrite parts of the code using **async/await**.  
- Many `_id` verifications needed to be converted to **ObjectId**.  
- Queries using `find` and `update` had to be adjusted (`findOne`, `updateOne`, `find().toArray()`, etc.).  

After **225+ commits**, **a month of daily coding**, and **countless ChatGPT conversations**, the server is finally running! 🎉  

---

## 🚀 Hosting Your Own Server  

If you want to host this game yourself:  
1. Connect to a **MongoDB** database service.  
2. Create a database named **sample_mflix**.  
3. Create the following collections:  
   - `users`  
   - `characters`  
   - `skills`  
   - `items`  
   - `finished_battles`  
4. Add the **items_exported.json** and **skills_exported.json** JSON data from `_MongoDB SETUP` directory to the corresponding collections on mongodb database site.  
5. On the API server hosting service:  
   - Connect your GitHub repository.  
   - Add an environment variable: `MONGO_URI`.  
   - Set its value to your MongoDB connection string (including user/password).  
6. Deploy and enjoy! 🎮  

---

## 🚨 Known Issues  

- The server uses a newer **Node.js** version, which might cause issues on older phones during battles. If you face problems, try using a modern device.  

---

## 🔮 Future Plans  

I'll keep trying to fix the battle actions. For now, I’m just amazed that I even got the server running without knowing **JavaScript, Node.js, or MongoDB**.  

Thanks for checking this out! 🎉  

Have a great live! 😃👍


------------
---
------------

## ORIGINAL README

# eoe-arena

eoe-arena is a remake of the multiplayer mobile game Era of Eidolon which was shut down about 10 years ago

![](eoe-arena-demo.gif)

## Demo / live

Live version of the project is accessible at [http://eoe-arena.herokuapp.com](http://eoe-arena.herokuapp.com)

## Getting Started

Both the backend (NodeJS) and the frontend is written in vanilla JavaScript. Communication bridge in-between is done using sockets and ajax calls. Data for the application is stored in MongoDB database.

### Prerequisites

To run this project on a local machine you will need NodeJS and MongoDB.


Get NodeJS at [https://nodejs.org/](https://nodejs.org/)

Get MongoDB at [https://www.mongodb.com/download-center/community](https://www.mongodb.com/download-center/community)



You don't have to install MongoDB Compass for the project to run but it is handy to browse the database documents in a GUI environment. 

### Installing

Follow the steps to run the application locally

Run the following command in the root directory of the project to install the required npm modules

```
npm install
```

Start the NodeJS server

```
npm run start
```

The NodeJS server is running but the application also needs a database to store data

Run the MongoDB server with the following command
Windows: navigate to MongoDB bin directory in the install location to find the executable

```
./mongod.exe
```

The application should now fully work at [http://localhost:2000](http://localhost:2000) but there are no skills and items in the game.

To import the skill and item data, find the exported .json files in the ___MongoDB setup__ directory.

Windows: navigate to MongoDB bin directory in the install location to find the executable

```
mongoimport --db game --collection skills --file skills_exported.json
```
```
mongoimport --db game --collection items --file items_exported.json
```

That's it. The game should now have all the skills and items and you should be able to create new accounts and start battles at [http://localhost:2000](http://localhost:2000)

## Deployment

Deployment will be reviewed in the future if there is any interest in the development of this project.

## Contributing

Pull requests are welcome and encouraged. The project was written in a hurry and not much attention was given to structure, maintainability and readability so any contribution is welcome.

## Disclaimer

Most of the graphical assets in the project are from the defunct (for about 10 years) java mobile game Era of Eidolon, produced by watAgame [(http://watagame.com)](http://watagame.com). The assets are not owned by me or any other contributor to the eoe-arena project.
