$(document).ready(function() {
    $('img').click(function() {
        // parens around 'new Game()' added for clarity
        var wantToPlay = confirm("Welcome to Andy-UNO!  Press OK to begin...");
        while (wantToPlay) {
            var winner = (new Game()).play();
            if (winner instanceof Human) alert("'Grats - you won!");
            else alert("Drats - the computer won!");
            wantToPlay = confirm("Play again?");
        }
    });
});

/*
    Note - consider the case when a WILD card is the first
    and only card on the discard pile!  What then?
*/
// wild cards are handled separately... address this?
var colors = ['red', 'green', 'blue', 'yellow'];
var specials = ['Skip', 'Draw Two', 'Reverse'];

function Game() {
    this.players = [];
    this.deck = new Deck();

    // think about putting this in its own addPlayers() function
    this.players.push(new Human());
    this.players.push(new Computer());

    for (var i in this.players) {
        this.players[i].drawCards(this.deck, 7);
    }

    this.deck.discardCard(this.deck.draw.pop());
}
Game.prototype.play = function() {
    var i = 0;
    // may need to declare whoDraws below...
    var player;
    do {
        player = this.players[i];
        var playedRank = player.playTurn(this.deck);
        if (playedRank === 'Draw Two' || playedRank === 'Wild Draw Four') {
            var whoDraws = this.players[this.nextPlayer(i)];
        }

        switch (playedRank) {
            case 'Skip': {
                i = this.nextPlayer(i);
                break;
            }
            case 'Reverse': {
                this.players.reverse();
                break;
            }
            case 'Draw Two': {
                whoDraws.drawCards(this.deck, 2);
                break;
            }
            case 'Wild Draw Four': whoDraws.drawCards(this.deck, 4);
            case 'Wild': player.chooseWildColor(this.deck);
        }

        ++i;
        // use % to handle additional i++ from 'Skip'
        if (i >= this.players.length) i %= this.players.length;
        // equivalent to if (i === this.players.length) i = 0;
    }
    while (player.hand.length !== 1);

    return player;
};
Game.prototype.nextPlayer = function(curr) {
    if (curr === (this.players.length - 1)) return 0;
    return ++curr;
}

/*

    while (true) {
        for (var i = 0; i < this.players.length; ++i)  {
            player = this.players[i];
            var special = player.playTurn(this.deck);

            // intentional fall-through
            switch (special) {
                case 'Wild Draw Four':
                case 'Wild':
                case 'Skip':
                case 'Draw Two':
                case 'Reverse':
                console.log(this.players[i + 1]);
            }

            // UNO!
            if (player.hand.length === 1) return player;
        }
    }
};*/

function Card(color, rank) {
    this.color = color;
    this.rank = rank;
}

function Player() {
    this.hand = [];
}
Player.prototype.drawCards = function(deck, count) {
    for (var i = 0; i < count; ++i) {
        this.hand.push(deck.draw.pop());
    }
};

// for parasitic combination inheritance
function inheritPrototype(child, parent) {
    var parentCopy = Object.create(parent.prototype);
    parentCopy.constructor = child;
    child.prototype = parentCopy;
}

function Human() {
    Player.call(this);
}
// Human.prototype = new Player();
inheritPrototype(Human, Player);
Human.prototype.playTurn = function(deck) {
    var indexToPlay;
    do {
        var str = "The card at the top of the discard pile is: " +
            deck.currRank + " (" + deck.currColor + ")\n\n" +
            "Here's what your hand looks like:\n" + handToString(this.hand) +
            '\n' + "Enter a letter choice, or click OK if you can't play a card";
        var indexToPlay = parseInput(prompt(str));

        if (indexToPlay === -1) {
            this.drawCards(deck, 1);
            alert("You (apparently) couldn't play a card, so you drew:\n" +
                cardToString(this.hand[this.hand.length - 1]));
            return;
        }
    }
    while (!(this.canPlayIndex(indexToPlay) &&
        deck.canPlayCard(this.hand[indexToPlay])));

    card = (this.hand.splice(indexToPlay, 1))[0];
    deck.discardCard(card);
    return card.rank;

};
Human.prototype.canPlayIndex = function(index) {
    return (index !== undefined && index >= 0 &&
        index < this.hand.length);
}
/* NEEDS ERROR CHECKING */
Human.prototype.chooseWildColor = function(deck) {
    var color;
    do color = prompt("Choose a color:\n");
    while (colors.indexOf(color) === -1);
    deck.currColor = color;
};

function parseInput(input) {
    if (input === '') return -1;
    var index = input[0].toLowerCase().charCodeAt(0) - 97;
    if (isNaN(index)) return undefined;
    return index;
}

function Computer() {
    Player.call(this);
}
// Computer.prototype = new Player();
inheritPrototype(Computer, Player);
Computer.prototype.playTurn = function(deck) {
    var i;
    for (i = 0; i < this.hand.length; ++i) {
        var card = this.hand[i];
        if (deck.canPlayCard(card)) {
            alert("The computer plunked down:\n" +
                cardToString(card));
            this.hand.splice(i, 1);
            deck.discardCard(card);
            return card.rank;
        }
    }
    /* CHANGE THE DECK TO HOLD A TOPCARD OBJECT, NOT JUST A LOOSE COLLECTION of currRank & currColor! */
        this.drawCards(deck, 1);
        alert("The computer couldn't play any card, so it drew another...");
};
// Consider making this return 'blue', and setting the color in "Game" instead?
Computer.prototype.chooseWildColor = function(deck) {
    deck.currColor = colors[Math.floor(Math.random() * 4)];
};

function handToString(hand) {
    var str = '';
    for (var i = 0; i < hand.length; ++i) {
        str += String.fromCharCode(97 + i) + ". " +
            cardToString(hand[i]) + '\n';
    }
    return str;
}

function cardToString(card) {
    var str = card.rank;
    // don't add (color) for wild cards
    if (card.color !== 'black') str += " (" + card.color + ")";
    return str;
}

function Deck() {
    this.draw = [];
    this.discard = [];
    this.currColor = this.currRank = undefined;
    this.populatePile(this.draw);
    this.shufflePile(this.draw);
}
Deck.prototype.discardCard = function(card) {
    this.discard.push(card);
    this.currColor = card.color;
    this.currRank = card.rank;
};
Deck.prototype.canPlayCard = function(card) {
    // wild cards are black
    // equivalent to if (card.color === 'black') return true;
    if (card === undefined) return false;
    //else if (card.rank.slice(0, 4) === 'Wild') return true;
    else if (card.color === 'black') return true;
    return (card.color === this.currColor ||
        card.rank === this.currRank);
};

/* WHY DO THESE TWO FUNCTIONS NEED 'pile' PARAMETER?
    YOU SHOULD FIX THIS?!?!
    */
Deck.prototype.populatePile = function(pile) {
    // populate the [draw] pile
    colors.forEach(function(color) {
        for (var rank = 0; rank <= 9; ++rank) {
            // populate arrayOfCards with the numbered cards
            pile.push(new Card(color, rank));
            if (rank !== 0) pile.push(new Card(color, rank));
        }
        // now, populate arrayOfCards with the special cards
        specials.forEach(function(special) {
            pile.push(new Card(color, special));
            pile.push(new Card(color, special));
        });
    });
    for (var i = 0; i < 4; ++i) {
        pile.push(new Card('black', 'Wild'));
        pile.push(new Card('black', 'Wild Draw Four'));
    }
}
// generic Fisher-Yates shuffle... 'pile' could be any array
Deck.prototype.shufflePile = function(pile) {
    var counter = pile.length, temp, index;
    // latter part equates to: var temp, index;

    while (counter > 0) {
        index = Math.floor(Math.random() * counter);
        --counter;
        temp = pile[counter];
        pile[counter] = pile[index];
        pile[index] = temp;
    }
}