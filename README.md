This is a copy of original eae arena project that im trying to make ir run onlone again.
the question is, i have zero knoledge about programing, but now we have chat gpt!! 😊👍

for now, after many days of code modding, its running buuuut, not completely. 🤦‍♂️
we are able to create user and password, login, request for fight, acept fights, but in fight turn, no one skills, magics, utils and moves works. 😫

the big problem was the fact that the oroginal uses mongojs database metode, but the free tool that i found was the mongodb, so the original code doens't works. so many modifications was necessary just to connect the server.
for some reason the promise metode used on code doens't works too. so many part of the code was need to me adapted to works with async function and await.

to be honest, my mind are exploding after redo the code more than 96 times and keep without understand it for sure.
im impressed that some guy did it by wis own. 🤯

here are the link of the game hospeded on the render site.

https://eoe-arena-security-copy.onrender.com/

(ps: it is a free server, then they turn off the link after 15 minuts of inactivity, so, when you click on the link, it will not work on the first look, but the render will start to run the archives and code to turn the link on. ao, just wait some time to give time to the deploy and server start after your first try. then just be patient and wait a little bit and reflesh the page.

well this is it. 🤷‍♂️
maybe some day i can finish the adjust on the code to make it run completely, but im impressed that i would be able to start the server without any knowled about , javascript, node.js and mongodb.

have a nice day 😉👍

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
