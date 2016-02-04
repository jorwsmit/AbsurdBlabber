var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs'),
	users = {},
	scores = {},
	usedCards = [],
	card,
	cards,
	answer,
	answers,
	timer,
	time = 10,
	wait = true,
	guess,
	isCorrect,
	index;

cards = fs.readFileSync('dbCards.txt').toString().split('\n');
answers = fs.readFileSync('dbAnswers.txt').toString().split('\n');

server.listen(80);
console.log("Server listening on port 80.");

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

timer = setInterval(emitTime, 1000);

function emitTime(){
	if(time != 0){	
		time--;
		io.emit('timer', time);
	} else if (wait){
		time = 20;
		wait = false;
		io.emit('timer', time);
		io.emit('wait', wait);
		index = getCard(cards, usedCards);
		if(index != "Out of cards!"){
			io.emit('card', cards[index]);
		} else {
			io.emit('card', "Oh no!!! There are no more cards available.");
		}
	} else {
		time = 5;
		wait = true;
		io.emit('timer', time);
		io.emit('wait', wait);
	}
}

io.on('connection', function(socket){
	socket.on('new user', function(username, returnBool){
		if (username in users || username.length < 1){
			returnBool(false);
		} else{
			returnBool(true);
			socket.username = username;
			users[socket.username] = 0;
			console.log(username + " has connected.");
			updateUsernames();
		}
	});
	
	function updateUsernames(){
		io.emit('usernames', users);
	}
	
	socket.on('disconnect', function(user){
		if(!socket.username) return;
		delete users[socket.username];
		console.log(socket.username + " has disconnected.");
		updateUsernames();
	});
	
	socket.on('answer', function(guess, isCorrect){
        	console.log(socket.username + " has guessed " + guess);                        
		if (correctGuess(answers[index], guess)){
			if(time > 14){
				isCorrect(3);
				users[socket.username] += 3;
				updateUsernames();
				console.log(socket.username + "'s score is " + users[socket.username]);
			} else if(time > 8){
				isCorrect(2);
				users[socket.username] += 2;
				updateUsernames();
				console.log(socket.username + "'s score is " + users[socket.username]);
			} else{
				isCorrect(1);
				users[socket.username] += 1;
				updateUsernames();
				console.log(socket.username + "'s score is " + users[socket.username]);
			}
		} else {
			isCorrect(0);
		}
	});

});

function getCard(cards, usedcards){
        //Uncomment below for non-repeating cards
	//note this will mean a limited number of cards
	/*
	if(usedcards.length != cards.length-1){
                        var newcard = false;
                        while(!newcard){
                                var index = Math.floor( Math.random() * (cards.length-1));
                                newcard = true;
                                for(i in usedcards){
                                        if(index == usedcards[i]) newcard = false;
                                }
                                if(newcard) usedcards.push(index);
                        }
                return index;
        }
        return "Out of cards!"
	*/
	var index = Math.floor( Math.random() * (cards.length-1));
	return index;
}

function correctGuess(answer, guess){
        if(answer.toLowerCase() == guess.toLowerCase()){
		return true;
        }else return false;
}
