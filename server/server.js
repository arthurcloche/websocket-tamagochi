const WebSocket = require("ws");

// Constants
const STATES = {
  ALIVE: 0b001,
  HUNGRY: 0b010,
  DEAD: 0b100,
};

const ACTIONS = {
  FEED: 0b001,
  BURY: 0b010,
};

// Game state
let gameState = {
  hungerValue: 20,
  state: STATES.ALIVE,
  lastStateChange: Date.now(),
};

const wss = new WebSocket.Server({ port: 8080 });

// Handle new connections
wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    handleAction(data.action);
  });

  // Send initial state
  broadcastState();
});

// Handle incoming actions
function handleAction(action) {
  if (action === ACTIONS.FEED && gameState.state === STATES.ALIVE) {
    gameState.hungerValue = 20;
    console.log("Fed! Hunger restored to:", gameState.hungerValue);
  } else if (action === ACTIONS.FEED && gameState.state === STATES.HUNGRY) {
    gameState.hungerValue = 20;
    gameState.state = STATES.ALIVE;
    console.log("Fed just in time! Tamagotchi is happy again");
  } else if (action === ACTIONS.BURY && gameState.state === STATES.DEAD) {
    console.log("Resurrected!");
    resetGame();
  }

  broadcastState();
}

function resetGame() {
  gameState = {
    hungerValue: 20,
    state: STATES.ALIVE,
    lastStateChange: Date.now(),
  };
}

function broadcastState() {
  const payload = {
    state: gameState.state,
    hungerValue: gameState.hungerValue,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

// Game loop - update hunger and state
setInterval(() => {
  if (gameState.state === STATES.DEAD) return;

  if (gameState.hungerValue > 0) {
    gameState.hungerValue--;
    console.log("Hunger decreasing:", gameState.hungerValue);
  }

  // Check for state changes
  if (gameState.hungerValue === 0 && gameState.state === STATES.ALIVE) {
    gameState.state = STATES.HUNGRY;
    gameState.lastStateChange = Date.now();
    console.log("Tamagotchi is hungry!");
  }

  // Check for death (10 seconds after becoming hungry)
  if (
    gameState.state === STATES.HUNGRY &&
    Date.now() - gameState.lastStateChange >= 10000
  ) {
    gameState.state = STATES.DEAD;
    console.log("Tamagotchi died of hunger!");
  }

  broadcastState();
}, 1000);
