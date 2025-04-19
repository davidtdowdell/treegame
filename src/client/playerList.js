import escape from 'lodash/escape';
import { joinSelectedGame } from './networking';
const waitForPlayersMenu = document.getElementById('wait-for-players-menu'); 
const chooseGameToJoinMenu = document.getElementById('choose-game-to-join-menu');

export function listPlayers(data) {
    const rows = document.querySelectorAll('#wait-for-players-menu table tr');
    console.log('listPlayers', data);
    for (let i = 0; i < data.length; i++) {
        rows[i + 1].innerHTML = `<td>${escape(data[i].slice(0, 15)) || 'Anonymous'}</td>`;
    }
}

export function listGames(data) {
    const rows = document.querySelectorAll('#choose-game-to-join-menu table tr');
    console.log('listGames', data);
    for (let i = 0; i < data.length; i++) {
        rows[i + 1].innerHTML = `<td>${escape(data[i].name.slice(0, 15)) || 'Anonymous'}</td> <button class="join-game-button" data-id="${data[i].id}">Join</button>`;
        const joinButton = rows[i + 1].querySelector('.join-game-button');
        joinButton.onclick = () => {
            console.log(`Joining game ${data[i].id}`);
            joinSelectedGame(data[i].id);
            waitForPlayersMenu.classList.remove('hidden');
            chooseGameToJoinMenu.classList.add('hidden');
        }
    }
}




