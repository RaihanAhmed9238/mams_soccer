export default class StorageManager {
    constructor () {
      if (localStorage.getItem('score') == null) {
        localStorage.setItem('score', [0, 0]);
      }
    }

    getState () {
        let res = localStorage.getItem('score');
        if (!res || !res.split(',')[0] || !res.split(',')[1]) {
            return [0, 0];
        } else {
            return res.split(',');
        }
    }

    updateScore (goals, miss) {
        localStorage.setItem('score', [goals, miss]);
    }

    reset () {
        localStorage.setItem('score', [0, 0]);
    }
}