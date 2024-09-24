import { loadUser } from "./utils/helpers.mjs";
import { getAuthToken } from "./utils/momento.mjs";

export const handler = async (event) => {
  try {
    const user = await loadUser(event.requestContext.http.sourceIp);
    const momentoToken = await getAuthToken([{
      role: 'readonly',
      cache: process.env.CACHE_NAME
    }]);

    const html = getGameHtml(user, momentoToken);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: html
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' })
    };
  }
};

const getGameHtml = (user, token) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Catch the squirrel</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                mint: '#00c88c',
                darkMint: '#03a876',
                lightMint: '#abe7d2',
                forest: '#25392b'
              },
              spacing: {
                '50': '50rem'
              }
            }
          }
        }
      </script>
  </head>
  <body class="bg-gradient-to-br from-darkMint to-lightMint min-h-screen p-4">
      <div class="flex h-full">
          <div id="game-window" class="w-3/4 bg-white rounded-lg shadow-lg p-4 mr-4 relative">
              <h2 class="text-2xl font-bold mb-4">Catch the squirrel</h2>
              <div id="game-area" class="bg-gray-200 h-50 w-fill rounded-lg relative">
                  <img id="squirrel" src="https://i0.wp.com/www.gomomento.com/wp-content/uploads/2024/07/mo-small-1.png" alt="Squirrel" class="w-8 h-8 absolute" style="transition: all 0.3s ease-in-out;">
              </div>
          </div>
          <div id="player-list" class="w-1/4 bg-white rounded-lg shadow-lg p-4">
              <h2 class="text-2xl font-bold mb-4">Player List</h2>
              <ul id="players" class="space-y-2">
                  <li class="bg-gray-100 p-2 rounded font-bold" id="${user.id}">${user.username} (Level ${user.level})</li>
              </ul>
          </div>
      </div>

      <script>
          const token = "${token}";
          const players = [
              "Player 1",
              "Player 2",
              "Player 3",
              "Player 4",
          ];

          function populatePlayerList() {
              const playerList = document.getElementById("players");
              players.forEach(player => {
                  const li = document.createElement("li");
                  li.textContent = player;
                  li.className = "bg-gray-100 p-2 rounded";
                  playerList.appendChild(li);
              });
          }

          function moveSquirrel(x, y) {
              const squirrel = document.getElementById('squirrel');
              const gameArea = document.getElementById('game-area');
              const cellSize = gameArea.clientWidth / 10; // Divide game area into 10x10 grid

              // Calculate position (subtracting 1 to make it 0-indexed)
              const newX = (x - 1) * cellSize;
              const newY = (y - 1) * cellSize;

              squirrel.style.left = newX + 'px';
              squirrel.style.top = newY+ 'px';
          }

          // Simulating coordinate updates (replace this with your actual update mechanism)
          function simulateCoordinateUpdates() {
              const x = Math.floor(Math.random() * 10) + 1;
              const y = Math.floor(Math.random() * 10) + 1;
              moveSquirrel(x, y);
          }

          window.onload = function() {
              populatePlayerList();
              moveSquirrel(1, 1); // Start at position (1,1)
              // Simulate coordinate updates every 3 seconds
              setInterval(simulateCoordinateUpdates, 3000);
          };
      </script>
  </body>
</html>`;
};
