/**
 * Sokoban level format:
 * # - Wall
 * @ - Player on floor
 * + - Player on goal
 * $ - Box on floor
 * * - Box on goal
 * . - Goal
 * (space) - Floor
 */

const levels: string[][] = [
  // Level 1 - Very simple tutorial
  [
    "  #####",
    "###   #",
    "#.@$  #",
    "###  ##",
    "  ####"
  ],
  
  // Level 2 - Simple introduction
  [
    "  #####",
    "###   #",
    "# $ # #",
    "# #$  #",
    "#.@.###",
    "#####"
  ],
  
  // Level 3 - Easy challenge
  [
    "  ####",
    "###  ###",
    "#   $  #",
    "# #.#  #",
    "# #$# ##",
    "#.  @.#",
    "#######"
  ],
  
  // Level 4 - Medium challenge
  [
    "########",
    "#      #",
    "# .**$@#",
    "#      #",
    "# .##  #",
    "####  ##",
    "   ####"
  ],
  
  // Level 5 - Harder challenge
  [
    "  #####",
    "###   #",
    "# $ # #",
    "# #$  #",
    "#.@.$ #",
    "##.####",
    " ####"
  ],
  
  // Level 6 - Advanced challenge
  [
    "  #######",
    "###     #",
    "#  $#$  #",
    "# #.$.# #",
    "#  .@.  #",
    "##  #  ##",
    " #######"
  ],
  
  // Level 7 - Expert challenge
  [
    " #######",
    "##     ##",
    "#  #$#  #",
    "# #...# #",
    "#  $@$  #",
    "## ### ##",
    " ##   ##",
    "  #####"
  ]
];

export default levels; 