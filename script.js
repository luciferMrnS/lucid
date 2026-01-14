document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('roll-button');
    const die1 = document.getElementById('die-1');
    const die2 = document.getElementById('die-2');
    const gameMessage = document.getElementById('game-message');
    const protectionThrowsCount = document.getElementById('protection-throws-count');
    const gamesPlayedCount = document.getElementById('games-played');
    const winsCount = document.getElementById('wins-count');
    let gamePhase = 'waiting_for_roll';
    let protectionThrows = 1;
    let powerUpDieToReroll = null;
    let powerUpOtherDieValue = 0;
    let gamesPlayed = 0;
    let wins = 0;
    let luckyNumber = null;
    let awaitingLuckyNumber = false;
    let currentPrediction = null;

    function showWinModal() {
        const modal = document.getElementById('win-modal');
        modal.style.display = 'block';
    }

    function hideWinModal() {
        const modal = document.getElementById('win-modal');
        modal.style.display = 'none';

        // Reset win modal text
        document.querySelector('#win-modal h2').textContent = 'You win!';
        document.querySelector('#win-modal p').textContent = 'Congratulations! You rolled doubles!';

        // Reset dice to initial state before starting new game
        [die1, die2].forEach(die => {
            die.style.transition = 'none'; // Temporarily disable transition for reset
            die.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateZ(0px)'; // Reset to initial position showing front face
            die.style.animation = ''; // Re-enable idle animation
            die.classList.remove('rolling-animation'); // Remove animation class
            // Reset background color and border for all faces if they were changed
            die.querySelectorAll('.face').forEach(face => {
                face.style.backgroundColor = '#f0f0f0';
                face.style.border = '1px solid #ccc';
            });
        });

        initializeGame();
    }

    function showLoseModal() {
        const modal = document.getElementById('lose-modal');
        modal.style.display = 'block';
    }

    function hideLoseModal() {
        const modal = document.getElementById('lose-modal');
        modal.style.display = 'none';

        // Reset dice to initial state before starting new game
        [die1, die2].forEach(die => {
            die.style.transition = 'none'; // Temporarily disable transition for reset
            die.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateZ(0px)'; // Reset to initial position showing front face
            die.style.animation = ''; // Re-enable idle animation
            die.classList.remove('rolling-animation'); // Remove animation class
            // Reset background color and border for all faces if they were changed
            die.querySelectorAll('.face').forEach(face => {
                face.style.backgroundColor = '#f0f0f0';
                face.style.border = '1px solid #ccc';
            });
        });

        initializeGame();
    }

    function showChipRunnerModal(message) {
        document.getElementById('chip-runner-message').textContent = message;
        document.getElementById('chip-runner-modal').style.display = 'block';
    }

    function hideChipRunnerModal() {
        document.getElementById('chip-runner-modal').style.display = 'none';
    }

    function showLuckyNumberModal() {
        document.getElementById('lucky-number-modal').style.display = 'block';
    }

    function hideLuckyNumberModal() {
        document.getElementById('lucky-number-modal').style.display = 'none';
    }

    function showPredictionModal() {
        document.getElementById('prediction-modal').style.display = 'block';
        document.getElementById('prediction-selection').style.display = 'grid';
        document.getElementById('roll-prediction-section').style.display = 'none';
    }

    function hidePredictionModal() {
        document.getElementById('prediction-modal').style.display = 'none';
    }

    function updateLuckyNumberDisplay() {
        const display = document.getElementById('lucky-number-display');
        if (display) {
            display.textContent = luckyNumber || '-';
            display.style.color = luckyNumber ? '#ffd700' : '#fff';
        }
    }

    function initializeGame() {
        console.log(`DEBUG: Initializing game`);
        gameMessage.textContent = '🎲 Choose your lucky number first!';
        rollButton.disabled = true;
        rollButton.textContent = '🎲 Roll Dice';
        gamePhase = 'waiting_for_roll';
        protectionThrows = 1;
        powerUpDieToReroll = null;
        powerUpOtherDieValue = 0;
        luckyNumber = null;
        awaitingLuckyNumber = true;
        updateProtectionThrowsDisplay();
        updateStatsDisplay();
        updateLuckyNumberDisplay();
        showLuckyNumberModal();
        console.log(`DEBUG: Game initialized. gamePhase=${gamePhase}, protectionThrows=${protectionThrows}`);
    }



    function updateStatsDisplay() {
        protectionThrowsCount.textContent = protectionThrows;
        gamesPlayedCount.textContent = gamesPlayed;
        winsCount.textContent = wins;
    }

    function updateProtectionThrowsDisplay() {
        protectionThrowsCount.textContent = protectionThrows;
    }

    function getFaceClass(number) {
        // This maps the result number to the correct face class for highlighting
        switch (number) {
            case 1: return 'front';   // 1 is on front face
            case 2: return 'bottom';  // 2 is on bottom face
            case 3: return 'left';    // 3 is on left face
            case 4: return 'right';   // 4 is on right face
            case 5: return 'top';     // 5 is on top face
            case 6: return 'back';    // 6 is on back face
        }
    }

    // Correct dice face rotations - each number shows the corresponding face on top
    function getDiceFinalRotation(number) {
        let x = 0, y = 0, z = 0;
        // Based on CSS face positions, these rotations make the correct face visible on top
        switch (number) {
            case 1: x = 0; y = 0; z = 0; break;         // Front face (1) on top
            case 2: x = 90; y = 0; z = 0; break;        // Bottom face (2) on top
            case 3: x = 0; y = 90; z = 0; break;        // Left face (3) on top
            case 4: x = 0; y = -90; z = 0; break;       // Right face (4) on top
            case 5: x = -90; y = 0; z = 0; break;       // Top face (5) on top
            case 6: x = 180; y = 0; z = 0; break;       // Back face (6) on top
        }
        return `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
    }

    function animateDie(dieElement, result) {
        return new Promise(resolve => {
            // Reset die transforms and remove animation class
            dieElement.style.transition = 'none';
            dieElement.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateZ(0px)';
            dieElement.style.animation = '';
            dieElement.classList.remove('rolling-animation');
            dieElement.querySelectorAll('.face').forEach(face => {
                face.style.backgroundColor = '#f0f0f0';
                face.style.border = '1px solid #ccc';
            });

            // Generate random animation parameters
            const timestamp = Date.now();
            const seed = Math.sin(timestamp + Math.random()) * 1000;
            const initialRotX = (Math.random() + Math.sin(seed)) * 360 * 5 + 720;
            const initialRotY = (Math.random() + Math.cos(seed)) * 360 * 5 + 720;
            const initialRotZ = (Math.random() + Math.sin(seed + 1)) * 360 * 5 + 720;
            const initialTransX = (Math.random() + Math.sin(seed + 2) - 0.5) * 200;
            const initialTransY = (Math.random() + Math.cos(seed + 3) - 0.5) * 200;
            const initialTransZ = Math.random() * -100 - 50;

            dieElement.style.setProperty('--initial-rotX', `${initialRotX}deg`);
            dieElement.style.setProperty('--initial-rotY', `${initialRotY}deg`);
            dieElement.style.setProperty('--initial-rotZ', `${initialRotZ}deg`);
            dieElement.style.setProperty('--initial-transX', `${initialTransX}px`);
            dieElement.style.setProperty('--initial-transY', `${initialTransY}px`);
            dieElement.style.setProperty('--initial-transZ', `${initialTransZ}px`);

            // Force reflow to apply CSS variables
            void dieElement.offsetWidth;

            dieElement.style.transition = '';
            dieElement.classList.add('rolling-animation');

            setTimeout(() => {
                dieElement.classList.remove('rolling-animation');
                const finalRotation = getDiceFinalRotation(result);
                dieElement.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                dieElement.style.transform = `${finalRotation} translateZ(0px)`;
                dieElement.style.animation = 'none';

                setTimeout(() => {
                    const faceClass = getFaceClass(result);
                    dieElement.querySelector(`.face.${faceClass}`).style.backgroundColor = 'yellow';
                    dieElement.querySelector(`.face.${faceClass}`).style.border = '5px solid red';
                    resolve();
                }, 800);
            }, 3000);
        });
    }

    async function rollDice() {
        console.log(`DEBUG: rollDice called. Current gamePhase: ${gamePhase}`);
        if (gamePhase !== 'waiting_for_roll') {
            console.log(`DEBUG: rollDice ignored because gamePhase is ${gamePhase}`);
            return;
        }

        rollButton.disabled = true;
        gameMessage.textContent = 'Rolling...';
        console.log(`DEBUG: Starting dice roll animation`);

        // Generate random results for each die (doubles now possible)
        const result1 = Math.floor(Math.random() * 6) + 1;
        const result2 = Math.floor(Math.random() * 6) + 1;

        console.log('Die 1 rolled:', result1);
        console.log('Die 2 rolled:', result2);

        // Animate both dice simultaneously
        await Promise.all([
            animateDie(die1, result1),
            animateDie(die2, result2)
        ]);

        processDiceRoll(result1, result2);
    }

    function processDiceRoll(result1, result2) {
        console.log(`DEBUG: processDiceRoll called with ${result1} and ${result2}`);
        console.log(`DEBUG: Current gamePhase before processing: ${gamePhase}`);
        console.log(`DEBUG: Current protectionThrows: ${protectionThrows}`);

        let message = `You rolled a ${result1} and a ${result2}.`;
        rollButton.disabled = false;

        // Check for Lucky Number activation (highest priority)
        const luckySumRolled = (result1 + result2 === luckyNumber);
        if (luckySumRolled) {
            console.log(`DEBUG: LUCKY SUM ACTIVATED! Sum: ${luckyNumber} (${result1} + ${result2})`);
            gameMessage.textContent = `🎯 LUCKY SUM ${luckyNumber} ACTIVATED!`;
            gamePhase = 'prediction_phase';
            rollButton.disabled = true;
            showPredictionModal();
            return;
        }

        if (result1 === result2) {
            console.log(`DEBUG: DOUBLES detected! Game over - win`);
            gamesPlayed++;
            wins++;
            gameMessage.textContent = `🎉 DOUBLES! You rolled ${result1} and ${result2}! You WIN!`;
            gamePhase = 'game_over';
            rollButton.disabled = true;
            updateStatsDisplay();
            showWinModal();
            return;
        }

        // Check for Power-up Throw (6 and odd number)
        const isPowerUpTrigger = (result1 === 6 && result2 % 2 !== 0) || (result2 === 6 && result1 % 2 !== 0);
        console.log(`DEBUG: Power-up trigger check: result1=${result1}, result2=${result2}, isPowerUpTrigger=${isPowerUpTrigger}`);

        if (isPowerUpTrigger) {
            console.log(`DEBUG: Entering power-up phase`);
            showChipRunnerModal(`Power-up opportunity! You rolled a ${result1} and a ${result2}. Click 'Roll Dice' again to re-roll the odd die.`);
            gamePhase = 'power_up_roll';
            rollButton.disabled = false; // Re-enable button for power-up roll
            console.log(`DEBUG: gamePhase set to: ${gamePhase}, rollButton.disabled: ${rollButton.disabled}`);

            // Determine which die to re-roll (the odd one)
            if (result1 === 6) {
                powerUpDieToReroll = die2; // Odd number die
                powerUpOtherDieValue = result1;
                console.log(`DEBUG: Will re-roll die2 (odd die), keeping die1 value: ${powerUpOtherDieValue}`);
            } else {
                powerUpDieToReroll = die1; // Odd number die
                powerUpOtherDieValue = result2;
                console.log(`DEBUG: Will re-roll die1 (odd die), keeping die2 value: ${powerUpOtherDieValue}`);
            }
            console.log(`DEBUG: powerUpDieToReroll: ${powerUpDieToReroll}, powerUpOtherDieValue: ${powerUpOtherDieValue}`);
            return;
        }

        // Check for earning a Protection Throw
        if (result1 % 2 === 0 && result2 % 2 === 0) {
            protectionThrows++;
            message += ' You rolled two even numbers and earned a Protection Throw!';
            updateProtectionThrowsDisplay();
        }

        // Use Protection Throw if available
        if (protectionThrows > 0) {
            protectionThrows--;
            // Format message with line breaks
            message = `You rolled a ${result1} and a ${result2}.\nNo doubles.\nUsed a protection throw.\nYou have ${protectionThrows} left.\nRoll again.`;
            updateProtectionThrowsDisplay();
            // Show the message in chip runner modal
            showChipRunnerModal(message);
        } else {
            gamesPlayed++;
            gameMessage.textContent = '💔 No doubles, no protection throws left. You are eliminated!';
            gamePhase = 'game_over';
            rollButton.disabled = true;
            updateStatsDisplay();
            showLoseModal();
        }
    }

    function handlePrediction(prediction) {
        console.log(`DEBUG: Player predicted: ${prediction}`);
        currentPrediction = prediction;
        document.getElementById('predicted-number').textContent = prediction;
        document.getElementById('prediction-selection').style.display = 'none';
        document.getElementById('roll-prediction-section').style.display = 'block';
    }

    // Event Listeners
    rollButton.addEventListener('click', () => {
        console.log(`DEBUG: Roll button clicked. Current gamePhase: ${gamePhase}, rollButton.disabled: ${rollButton.disabled}`);

        if (gamePhase === 'waiting_for_roll' && !awaitingLuckyNumber) {
            console.log(`DEBUG: Starting normal roll`);
            rollDice();
        } else if (gamePhase === 'power_up_roll') {
            console.log(`DEBUG: Starting power-up roll. powerUpDieToReroll: ${powerUpDieToReroll ? powerUpDieToReroll.id : 'null'}, powerUpOtherDieValue: ${powerUpOtherDieValue}`);

            // Disable button and show rolling message
            rollButton.disabled = true;
            rollButton.textContent = '🎯 Power-up Rolling...';
            console.log(`DEBUG: Button disabled and text changed to "Power-up Rolling..."`);

            // Generate power-up result
            const powerUpResult = Math.floor(Math.random() * 6) + 1;
            console.log(`DEBUG: Power-up result: ${powerUpResult}`);

            // Animate the power-up die
            animateDie(powerUpDieToReroll, powerUpResult).then(() => {
                // Reset button text
                rollButton.textContent = '🎲 Roll Dice';

                console.log(`DEBUG: Power-up die animation complete. Result: ${powerUpResult}`);

                // Small delay to ensure visual update is visible before showing modal
                setTimeout(() => {
                    // Handle power-up result
                    if (powerUpResult === 6) {
                        console.log(`DEBUG: Power-up successful - rolled 6!`);
                        gamesPlayed++;
                        wins++;
                        showChipRunnerModal(`🎉 Power-up successful! You rolled a 6 on the odd die. You now have doubles (${powerUpOtherDieValue} and 6)! You WIN!`);
                        gamePhase = 'game_over';
                        rollButton.disabled = true;
                        updateStatsDisplay();
                        showWinModal();
                    } else if (powerUpResult % 2 === 0) {
                        console.log(`DEBUG: Power-up rolled even number: ${powerUpResult}`);
                        // Rolled an even number (but not 6) - add a protection throw
                        protectionThrows++;
                        showChipRunnerModal(`Power-up used. You rolled an even number (${powerUpResult}) and earned a protection throw! You have ${protectionThrows} protection throws. Click 'Roll Dice' again.`);
                        gamePhase = 'waiting_for_roll';
                        updateProtectionThrowsDisplay();
                    } else {
                        console.log(`DEBUG: Power-up rolled odd number: ${powerUpResult}, protectionThrows: ${protectionThrows}`);
                        // Rolled an odd number - check if player has protection throws
                        if (protectionThrows > 0) {
                            console.log(`DEBUG: Using protection throw`);
                            protectionThrows--;
                            showChipRunnerModal(`Power-up used. You rolled an odd number (${powerUpResult}) but had a protection throw. You have ${protectionThrows} protection throws left. Click 'Roll Dice' again.`);
                            gamePhase = 'waiting_for_roll';
                            updateProtectionThrowsDisplay();
                        } else {
                            console.log("DEBUG: Power-up - Rolled odd, no protection. Game over.");
                            gamesPlayed++;
                            showChipRunnerModal(`💔 Power-up used. You rolled an odd number (${powerUpResult}) with no protection throws left. You are eliminated!`);
                            gamePhase = 'game_over';
                            rollButton.disabled = true;
                            updateStatsDisplay();
                            showLoseModal();
                        }
                    }

                    // Reset power-up variables
                    powerUpDieToReroll = null;
                    powerUpOtherDieValue = 0;
                    console.log(`DEBUG: Power-up complete. Final gamePhase: ${gamePhase}`);

                    // Re-enable button only if game is not over
                    if (gamePhase !== 'game_over') {
                        rollButton.disabled = false;
                        console.log(`DEBUG: Button re-enabled for next roll`);
                    } else {
                        console.log(`DEBUG: Game over - button remains disabled`);
                    }
                }, 300); // Brief pause to ensure visual result is visible before modal
            });
        } else {
            console.log(`DEBUG: Button clicked but gamePhase is ${gamePhase} - ignoring click`);
        }
    });

    // Lucky Number Selection Event Listeners
    document.querySelectorAll('.lucky-number-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedNumber = parseInt(e.target.dataset.number);
            luckyNumber = selectedNumber;
            awaitingLuckyNumber = false;
            console.log(`DEBUG: Lucky number selected: ${luckyNumber}`);

            hideLuckyNumberModal();
            gameMessage.textContent = '🎲 Roll the dice!';
            rollButton.disabled = false;
            updateLuckyNumberDisplay();
        });
    });

    // Prediction Event Listeners
    document.querySelectorAll('.prediction-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prediction = parseInt(e.target.dataset.prediction);
            handlePrediction(prediction);
        });
    });

    // Roll Prediction Button
    document.getElementById('roll-prediction-btn').addEventListener('click', (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = '🎲 Rolling...';

        // Roll a single die for the actual result
        const actualResult = Math.floor(Math.random() * 6) + 1;
        console.log(`DEBUG: Prediction die rolled: ${actualResult}`);

        hidePredictionModal();

        // Animate die1 with the result
        animateDie(die1, actualResult).then(() => {
            if (currentPrediction == actualResult) {
                console.log(`DEBUG: Prediction correct! Player wins!`);
                gamesPlayed++;
                wins++;
                gameMessage.textContent = `🎉 PREDICTION CORRECT! You predicted ${currentPrediction} and rolled ${actualResult}! You WIN!`;
                gamePhase = 'game_over';
                rollButton.disabled = true;
                updateStatsDisplay();
                // Update win modal for prediction win
                document.querySelector('#win-modal h2').textContent = 'Prediction Win!';
                document.querySelector('#win-modal p').textContent = `Amazing! You predicted ${currentPrediction} and rolled ${actualResult}!`;
                showWinModal();
            } else {
                console.log(`DEBUG: Prediction wrong. No protection throw given.`);
                gameMessage.textContent = `❌ Wrong prediction! You predicted ${currentPrediction} but rolled ${actualResult}.`;
                gamePhase = 'waiting_for_roll';
                rollButton.disabled = false;
            }

            // Reset the prediction roll button so it can be used again next lucky number
            btn.disabled = false;
            btn.textContent = '🎲 Roll the Prediction Die!';
            // Note: die1 keeps showing the rolled result (no reset)
        });
    });

    const closeModalButton = document.getElementById('close-modal');
    closeModalButton.addEventListener('click', hideWinModal);

    const closeLoseModalButton = document.getElementById('close-lose-modal');
    closeLoseModalButton.addEventListener('click', hideLoseModal);

    const closeChipModalButton = document.getElementById('close-chip-modal');
    closeChipModalButton.addEventListener('click', hideChipRunnerModal);

    // Initial game setup
    initializeGame();
});
