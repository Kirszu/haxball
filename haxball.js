var room = HBInit({
	roomName: "RU Hax",
	maxPlayers: 16,
	noPlayer: true, // Remove host player (recommended!)
	public: false
});
room.setDefaultStadium("Big");
room.setScoreLimit(5);
room.setTimeLimit(5);

var lastTouchedPlayer = "";
const bambiks = new Array("GżegożRasiak", "mekambe", "RomUald");
var playersInGame = new Array();
var bambiksInGame = new Array();
var playersThatTouchedTheBall = new Set();


// If there are no admins left in the room give admin to one of the remaining players.
function updateAdmins() { 
// Get all players
  var players = room.getPlayerList();
  if ( players.length == 0 ) return; // No players left, do nothing.
  if ( players.find((player) => player.admin) != null ) return; // There's an admin left so do nothing.
  room.setPlayerAdmin(players[0].id, true); // Give admin to the first non admin player in the list
}

room.onPlayerJoin = function(player) {
  room.sendAnnouncement( "Elo " + player.name);
  updateAdmins();
  
  if(isBambik(player.name)){bambiksInGame.push(player)} else {playersInGame.push(player);}
  
  var scores = room.getScores();
  if(scores == null && (bambiksInGame.length + playersInGame.length) == 6){handleTeamSelecting(shuffle(bambiksInGame), shuffle(playersInGame));}
}

room.onPlayerLeave = function(player) {
  updateAdmins();
  if(isBambik(player.name)){bambiksInGame.pop(player)} else {playersInGame.pop(player);}
}

room.onTeamGoal = function() {
	room.sendAnnouncement( "Gol! Ostatni piłki dotknął: " + lastTouchedPlayer.name);
}

room.onPlayerBallKick = function(player) {
	lastTouchedPlayer = player;
}

function handleTeamSelecting(bambiksInGame, playersInGame){
	var teamId = randomIntFromInterval(1, 2);
	for (var i = 0; i < playersInGame.length; i++){
		room.setPlayerTeam(playersInGame[i].id, teamId);
		if (teamId == 1) {teamId = 2} else {teamId = 1};	
	}
	for (var j = 0; j < bambiksInGame.length; j++){
		room.setPlayerTeam(bambiksInGame[j].id, teamId);
		if (teamId == 1) {teamId = 2} else {teamId = 1};	
	}
}

function shuffle(array) {
return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

function isBambik(playerName){
	return bambiks.find(bambik => bambik == playerName);
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function pointDistance(p1, p2) {
	var d1 = p1.x - p2.x;
	var d2 = p1.y - p2.y;
	return Math.sqrt(d1 * d1 + d2 * d2);
}

function handleGameTick() {
	var players = room.getPlayerList();
	var ballPosition = room.getBallPosition();
	var ballRadius = 10;
	var playerRadius = 15;
	var triggerDistance = ballRadius + playerRadius + 0.01;

	for (var i = 0; i < players.length; i++) { // Iterate over all the players
		var player = players[i];
		if ( player.position == null ) continue; // Skip players that don't have a position

		var distanceToBall = pointDistance(player.position, ballPosition);
		var hadTouchedTheBall = playersThatTouchedTheBall.has(player.id);

		// This check is here so that the event is only notified the first game tick in which the player is touching the ball.
		if ( !hadTouchedTheBall ) { 
			if ( distanceToBall < triggerDistance ) {
				playersThatTouchedTheBall.add(player.id);
				lastTouchedPlayer = player;
			}
		}else{
			// If a player that had touched the ball moves away from the ball remove him from the set to allow the event to be notified again.
			if ( distanceToBall > triggerDistance + 4 ) {
				playersThatTouchedTheBall.delete(player.id);
			}
		}
	}
}

function handleGameStart() {
	playersThatTouchedTheBall.clear(); // Reset the set of players that reached the goal
}

room.onGameTick = handleGameTick;
room.onGameStart = handleGameStart;