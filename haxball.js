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
var teamsCount = new Array(0, 0, 0); //spectators, red, blue
var bambiksInTeams = new Array(0, 0, 0); //spectators, red, blue
var bambiks = new Array("MK1", "MK2", "MK22");


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
  var scores = room.getScores();
  handleTeamSelecting(scores);
}

room.onPlayerLeave = function(player) {
  updateAdmins();
}

room.onTeamGoal = function() {
	room.sendAnnouncement( "Gol! Ostatni piłki dotknął: " + lastTouchedPlayer.name);
}

room.onPlayerBallKick = function(player) {
	lastTouchedPlayer = player;
}

var playersThatTouchedTheBall = new Set();

function handleTeamSelecting(scores){
	var players = room.getPlayerList();
	if (scores == null && players.length == 6){
		for (var i = 0; i < players.length; i++){
			setPlayerToRandomTeam(players[i]);
		}
	}
}

function setPlayerToRandomTeam(player) {
	var teamId = randomIntFromInterval(1, 2)
	var isFull = isTeamFull(teamId);
	var isBambik = checkIfBambik(player.name);
	
	if (isFull) {
		room.sendAnnouncement("Ilość graczy w team " + teamId.toString() + " jest pełna");
		if (teamId == 1) {teamId = 2} else {teamId = 1};
		room.sendAnnouncement("Zmiana teamu do " + teamId.toString());
	} 
	
	room.setPlayerTeam(player.id, teamId);
	teamsCount[teamId]++;
	if (isBambik) { bambiksInTeams[teamId]++ }; 
}

function checkIfBambik(playerName){
	return bambiks.find(bambik => bambik == playerName);
}


function isTeamFull(teamId){
	var players = room.getPlayerList();
	room.sendAnnouncement("Ilość w team " + teamId.toString() + " wynosi " + teamsCount[teamId].toString() );
	return teamsCount[teamId] == 3;
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