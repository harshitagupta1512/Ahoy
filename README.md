# AHOY
### A 3D SEA-BATTLE GAME

    • The world consists of an ocean that stretches to infinity.
    • You are the captain of a ship and have to roam around this ocean.
    • There are enemy pirate ships that can attack you and you can attack them.
    • You can collect treasure chests floating around on the water surface.

#### CONTROLS
* Your ship can move on the surface of the water freely using the `WASD` keys.
* You can switch between *close-up third person* view for the main ship and *bird* view for the game using the `E` key.
* Your ship can shoot *canons* in it's moving direction to destroy the enemy ships using the `Q` key.

#### SCOREBOARD
* You get 10 points in your score for every treasure chest you collect.
* You get 20 points in your score for every enemy ship you destroy
* You loose 5 points from your health for every enemy canon that hits you.
* You loose 10 points from your health for every enemy ship you collide with.
* A enemy ship is destroyed if it is hit by a player canon or it collides with your ship itself.

There will be 3 enemy ships following your ship at all times. If you destroy a enemy ship another enemy ship spawns.

#### HOW TO RUN

In the directory where the source file resides,

* Run the `npm install` command
* Run the `npm run dev` command
* The game is hosted at http://localhost:3000/ 