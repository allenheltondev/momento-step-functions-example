import { loadUser } from "./utils/helpers.mjs";
import { getAuthToken } from "./utils/momento.mjs";

export const handler = async (event) => {
  try {
    const user = await loadUser(event.requestContext.identity.sourceIp);
    const momentoToken = await getAuthToken([{
      role: 'readwrite',
      cache: process.env.CACHE_NAME
    },
    {
      role: 'subscribeonly',
      cache: process.env.CACHE_NAME,
      topic: 'location'
    },
    {
      role: 'subscribeonly',
      cache: process.env.CACHE_NAME,
      topic: user.id
    }
  ]);

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
                  <img id="squirrel" src="https://i0.wp.com/www.gomomento.com/wp-content/uploads/2024/07/mo-small-1.png" alt="Squirrel" class="w-8 h-8 absolute" style="transition: all 0.3s ease-in-out;" onclick="registerPoints()">
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
          let interval;

          function moveSquirrel(x, y, id) {
            const squirrel = document.getElementById('squirrel');
            const gameArea = document.getElementById('game-area');
            const cellSizeX = gameArea.clientWidth / 10;
            const cellSizeY = gameArea.clientHeight / 10;

            const newX = (x - 1) * cellSizeX;
            const newY = (y - 1) * cellSizeY;

            squirrel.style.left = newX + 'px';
            squirrel.style.top = newY+ 'px';
            squirrel.style.cursor = 'pointer';
            squirrel.name = id;
          }

          function updateCoordinates() {
            const x = Math.floor(Math.random() * 10) + 1;
            const y = Math.floor(Math.random() * 10) + 1;
            const id = generateUUID();
            fetch('https://api.cache.cell-us-east-1-1.prod.a.momentohq.com/cache/${process.env.CACHE_NAME}/location?ttl_seconds=300', {
              method: 'PUT',
              headers: {
                'Authorization': '${token}',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ x, y, id })
            });
            moveSquirrel(x, y, id);
          }

          function registerPoints() {
            const squirrel = document.getElementById('squirrel');
            const response = fetch('/v1/squirrels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: squirrel.name })
            });
            if(response.ok){
              updateCoordinates();
              clearInterval(interval);
              interval = setInterval(updateCoordinates, 2000);
            }
          }

          function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          }

          window.onload = function() {
              moveSquirrel(1, 1, generateUUID());
              // Simulate coordinate updates every 2 seconds
              interval = setInterval(updateCoordinates, 2000);
              pollForLocation();
              pollForUserUpdates();
          };

          async function pollForLocation() {
            try {
              const response = await fetch('https://api.cache.cell-us-east-1-1.prod.a.momentohq.com/topics/${process.env.CACHE_NAME}/location', {
                  headers: {
                    'Authorization': '${token}'
                  }
                });
              if(response.ok){
                const data = await response.json();
                const location = JSON.parse(data.items[0].item.value.text);
                moveSquirrel(location.x, location.y, location.id);
              }
            } catch (err) {
              console.error(err);
            } finally {
              setTimeout(pollForLocation, 0);
            }
          }

          async function pollForUserUpdates() {
            try {
              const response = await fetch('https://api.cache.cell-us-east-1-1.prod.a.momentohq.com/topics/${process.env.CACHE_NAME}/${user.id}', {
                  headers: {
                    'Authorization': '${token}'
                  }
                });
              if(response.ok){
                const data = await response.json();
                const player = JSON.parse(data.items[0].item.value.text);
                console.log(player)
                const playerContainer = document.getElementById('${user.id}');
                playerContainer.innerHTML = '${user.username} (Level ' + player.level + ')';
              }
            } catch (err) {
              console.error(err);
            } finally {
              setTimeout(pollForUserUpdates, 0);
            }
          }

      </script>
  </body>
</html>`;
};
