/* interactions.js
   Handles:
   - click / gaze selection
   - playing audio explanations
   - saving progress to localStorage
*/

(function () {
  // Config: map entity id => explanation text + audio filename (put audio in sounds/)
  const PARTS = {
    cpu: {
      title: "CPU",
      text: "CPU: The brain of the computer. It does calculations and controls everything.",
      audio: "sounds/cpu.mp3"
    },
    monitor: {
      title: "Monitor",
      text: "Monitor: The screen that shows you what the computer is doing.",
      audio: "sounds/monitor.mp3"
    },
    keyboard: {
      title: "Keyboard",
      text: "Keyboard: Used to type letters and numbers.",
      audio: "sounds/keyboard.mp3"
    },
    mouse: {
      title: "Mouse",
      text: "Mouse: Helps move the cursor and click on things.",
      audio: "sounds/mouse.mp3"
    },
    printer: {
      title: "Printer & Scanner",
      text: "Printer & Scanner: The printer prints documents and pictures on paper. The scanner copies papers or pictures into the computer.",
      audio: "sounds/printer.mp3"
    }
  };

  const visitedKey = "vrlesson1_visitedParts"; // localStorage key
  let visited = new Set(JSON.parse(localStorage.getItem(visitedKey) || "[]"));

  // Utility: play audio if present
  function playAudio(src) {
    if (!src) return;
    const a = new Audio(src);
    a.play().catch(()=>{/* ignore autoplay block on some browsers */});
  }

  // Show textual hint
  function showHint(message, duration = 3500) {
    const hintEl = document.querySelector('#hintText');
    if (!hintEl) return;
    hintEl.setAttribute('value', message);
    // optional clear later
    setTimeout(() => {
      hintEl.setAttribute('value', "Look at a part or click it to learn.");
    }, duration);
  }

  // Called when part is activated
  function onPartActivate(id) {
    const part = PARTS[id];
    if (!part) return;
    showHint(`${part.title}: ${part.text}`, 6000);
    playAudio(part.audio);

    // Visual feedback: animate scale briefly
    const ent = document.querySelector('#' + id);
    if (ent) {
      ent.removeAttribute('animation__pulse');
      ent.setAttribute('animation__pulse', {
        property: 'scale',
        to: '1.15 1.15 1.15',
        dur: 300,
        dir: 'alternate',
        easing: 'easeInOutSine',
        loop: 1
      });
    }

    // Mark visited and save
    visited.add(id);
    localStorage.setItem(visitedKey, JSON.stringify(Array.from(visited)));
    updateTeacherPanel();
  }

  // Add event listeners to interactable entities
  function wireInteractions() {
    const nodes = document.querySelectorAll('.interactable');
    nodes.forEach(n => {
      // click/touch
      n.addEventListener('click', (evt) => {
        const id = n.getAttribute('id');
        onPartActivate(id);
      });

      // cursor 'mouseenter' (for quick feedback)
      n.addEventListener('mouseenter', (evt) => {
        const id = n.getAttribute('id');
        const part = PARTS[id];
        if (part) showHint(part.title, 1600);
      });
    });

    // Keyboard: press space/enter to "click" center object
    const cursor = document.querySelector('#cursor');
    if (cursor) {
      window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          const camera = document.querySelector('[camera]');
          const raycaster = camera.components.raycaster;
          if (raycaster) {
            const intersects = raycaster.intersectedEls || [];
            if (intersects.length) {
              intersects[0].emit('click');
            }
          }
        }
      });
    }
  }

  // Teacher panel update
  function updateTeacherPanel() {
    document.getElementById('teacher-quizzes').textContent = visited.size;
    const last = Array.from(visited).slice(-1)[0] || '—';
    document.getElementById('teacher-last').textContent = last;
  }

  // Wire top UI
  function wireTopUI() {
    document.getElementById('reset-progress').addEventListener('click', () => {
      localStorage.removeItem(visitedKey);
      visited = new Set();
      updateTeacherPanel();
      alert('Progress reset.');
    });

    document.getElementById('teacher-panel-toggle').addEventListener('click', () => {
      const pnl = document.getElementById('teacher-panel');
      pnl.hidden = !pnl.hidden;
    });
  }

  // Initialization
  window.addEventListener('load', () => {
    wireInteractions();
    wireTopUI();
    updateTeacherPanel();

    // Preload audio files
    Object.values(PARTS).forEach(p => {
      if (p.audio) {
        const audio = new Audio(p.audio);
        audio.preload = "auto";
      }
    });

    showHint("Welcome! Look at a computer part or click it to learn.");
  });
})();