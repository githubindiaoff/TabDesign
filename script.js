document.addEventListener("DOMContentLoaded", () => {
  // 1. Matrix Background Effect
  const canvas = document.getElementById("matrix");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const matrixChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?".split("");
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = [];

  for (let i = 0; i < columns; i++) {
    drops[i] = 1;
  }

  function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ffcc"; // Hacker green
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(drawMatrix, 35);

  // Resize canvas on window resize
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // 2. Clock & Typing Greeting
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { hour12: false });
    const digital = document.getElementById("clock-digital");
    if (digital) digital.textContent = timeString;

    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    const dateDisplay = document.getElementById("date-display");
    if (dateDisplay)
      dateDisplay.textContent = `> ${dayName} // ${monthName} ${day} // ${year}`;

    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hr = now.getHours();

    const secH = document.getElementById("sec-hand");
    const minH = document.getElementById("min-hand");
    const hrH = document.getElementById("hour-hand");
    if (secH) secH.style.transform = `rotate(${sec * 6}deg)`;
    if (minH) minH.style.transform = `rotate(${min * 6 + sec / 10}deg)`;
    if (hrH) hrH.style.transform = `rotate(${(hr % 12) * 30 + min / 2}deg)`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  window.greetingText = "Welcome to the system, Surya Gudipati";
  const greetingEl = document.getElementById("greeting");
  window.typingIndex = 0;
  window.typingTimeout = null;

  window.typeGreeting = function () {
    if (window.typingIndex < window.greetingText.length) {
      if (window.greetingText.charAt(window.typingIndex) === " ") {
        greetingEl.innerHTML += "&nbsp;";
      } else {
        greetingEl.innerHTML += window.greetingText.charAt(window.typingIndex);
      }
      window.typingIndex++;
      window.typingTimeout = setTimeout(window.typeGreeting, 100);
    }
  };
  window.typeGreeting();

  // 3. Search Bar Logic
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchInput.value.trim() !== "") {
      const query = encodeURIComponent(searchInput.value.trim());
      window.location.href = `https://www.google.com/search?q=${query}`;
    }
  });

  // Drag & Drop Handlers
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.dataset.id);
    this.style.opacity = "0.4";
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDragEnter(e) {
    this.style.border = "1px dashed var(--primary-color)";
  }

  function handleDragLeave(e) {
    this.style.border = "none";
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    this.style.border = "none";
    if (dragSrcEl) dragSrcEl.style.opacity = "1";

    if (dragSrcEl !== this) {
      const srcId = dragSrcEl.dataset.id;
      const targetId = this.dataset.id;
      if (chrome.bookmarks) {
        chrome.bookmarks.get(targetId, (result) => {
          if (result && result[0]) {
            chrome.bookmarks.move(
              srcId,
              { parentId: result[0].parentId, index: result[0].index },
              () => {
                renderBookmarks();
              },
            );
          }
        });
      }
    }
    return false;
  }

  // 4. Fetch and Render Bookmarks
  function renderBookmarks() {
    if (chrome.bookmarks) {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const container = document.getElementById("bookmarks-container");
        container.innerHTML = "";
        if (bookmarkTreeNodes[0].children) {
          const bookmarksBar = bookmarkTreeNodes[0].children[0];
          if (bookmarksBar && bookmarksBar.children) {
            const topBookmarks = bookmarksBar.children
              .filter((node) => node.url)
              .slice(0, 16);

            if (topBookmarks.length > 0) {
              topBookmarks.forEach((bookmark) => {
                const wrapper = document.createElement("div");
                wrapper.className = "bookmark-wrapper";
                wrapper.draggable = true;
                wrapper.dataset.id = bookmark.id;

                wrapper.addEventListener("dragstart", handleDragStart);
                wrapper.addEventListener("dragover", handleDragOver);
                wrapper.addEventListener("drop", handleDrop);
                wrapper.addEventListener("dragenter", handleDragEnter);
                wrapper.addEventListener("dragleave", handleDragLeave);
                wrapper.addEventListener("dragend", function () {
                  this.style.opacity = "1";
                });

                const a = document.createElement("a");
                a.href = bookmark.url;
                a.className = "bookmark-item";

                const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`;

                a.innerHTML = `
                                    <img src="${faviconUrl}" alt="icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'%2300ffcc\\' viewBox=\\'0 0 24 24\\'><path d=\\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z\\'/></svg>'">
                                    <span>${bookmark.title.substring(0, 12)}${bookmark.title.length > 12 ? "..." : ""}</span>
                                `;

                const delBtn = document.createElement("button");
                delBtn.className = "delete-btn";
                delBtn.innerHTML = "X";
                delBtn.onclick = (e) => {
                  e.preventDefault();
                  chrome.bookmarks.remove(bookmark.id, () => {
                    renderBookmarks();
                  });
                };

                wrapper.appendChild(a);
                wrapper.appendChild(delBtn);
                container.appendChild(wrapper);
              });
            } else {
              container.innerHTML = "<p>No bookmarks found.</p>";
            }
          }
        } else {
          container.innerHTML = "<p>No bookmarks found.</p>";
        }
      });
    }
  }
  renderBookmarks();

  // 4.5. Add Bookmark Logic
  const addBmBtn = document.getElementById("add-bm-btn");
  if (addBmBtn) {
    addBmBtn.addEventListener("click", () => {
      const title = document.getElementById("bm-title").value.trim();
      let url = document.getElementById("bm-url").value.trim();
      if (title && url) {
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        if (chrome.bookmarks) {
          chrome.bookmarks.create(
            { parentId: "1", title: title, url: url },
            () => {
              document.getElementById("bm-title").value = "";
              document.getElementById("bm-url").value = "";
              renderBookmarks();
            },
          );
        }
      }
    });
  }

  // 5. Developer Hub Logic

  // --- Pomodoro Timer ---
  const pomodoroInput = document.getElementById("pomodoro-input");
  const pomoSvgWrap = document.querySelector(".hourglass-wrapper");

  let pomoTotalTime =
    (parseInt(pomodoroInput ? pomodoroInput.value : 25) || 25) * 60;
  let pomoTime = pomoTotalTime;
  let pomoInterval = null;
  const pomoDisplay = document.getElementById("pomodoro-time");

  function updatePomoDisplay() {
    if (!pomoDisplay) return;
    const m = Math.floor(pomoTime / 60)
      .toString()
      .padStart(2, "0");
    const s = (pomoTime % 60).toString().padStart(2, "0");
    pomoDisplay.textContent = `${m}:${s}`;

    const topSand = document.getElementById("sand-top-rect");
    const botSand = document.getElementById("sand-bottom-rect");

    if (topSand && botSand) {
      const fraction = pomoTotalTime > 0 ? pomoTime / pomoTotalTime : 0;

      // Top Sand: y=9, maxH=47. As fraction drops to 0, height goes to 0, y drops
      const topH = fraction * 47;
      const topY = 9 + (1 - fraction) * 47;
      topSand.setAttribute("y", topY);
      topSand.setAttribute("height", topH);

      // Bottom Sand: maxH=47. As fraction drops to 0, height goes to 47.
      // SVG bottom y boundary is 111. So y = 111 - height.
      const botH = (1 - fraction) * 47;
      const botY = 111 - botH;
      botSand.setAttribute("y", botY);
      botSand.setAttribute("height", botH);
    }
  }

  if (pomodoroInput) {
    pomodoroInput.addEventListener("change", () => {
      if (!pomoInterval) {
        let val = parseInt(pomodoroInput.value) || 25;
        if (val < 1) val = 1;
        pomodoroInput.value = val;
        pomoTotalTime = val * 60;
        pomoTime = pomoTotalTime;
        updatePomoDisplay();
      }
    });
  }

  const btnPlus = document.getElementById("pomo-plus");
  const btnMinus = document.getElementById("pomo-minus");

  function playCyberAlarm() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    function beep(freq, time, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    }

    const now = ctx.currentTime;
    beep(880, now, 0.2);
    beep(1760, now + 0.25, 0.2);
    beep(880, now + 0.5, 0.2);
    beep(1760, now + 0.75, 0.5);
  }

  if (btnPlus) {
    btnPlus.addEventListener("click", () => {
      if (!pomoInterval) {
        pomodoroInput.value = parseInt(pomodoroInput.value) + 5;
        pomodoroInput.dispatchEvent(new Event("change"));
      }
    });
  }
  if (btnMinus) {
    btnMinus.addEventListener("click", () => {
      if (!pomoInterval) {
        const val = parseInt(pomodoroInput.value) - 5;
        pomodoroInput.value = val > 0 ? val : 1;
        pomodoroInput.dispatchEvent(new Event("change"));
      }
    });
  }

  const startBtn = document.getElementById("pomodoro-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (!pomoInterval) {
        pomoSvgWrap.classList.add("pomo-running");
        pomoInterval = setInterval(() => {
          if (pomoTime > 0) {
            pomoTime--;
            updatePomoDisplay();
          } else {
            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoSvgWrap.classList.remove("pomo-running");
            playCyberAlarm();
            setTimeout(() => {
              alert("Timer complete! Session fully executed.");
            }, 500); // Wait for alarm to finish before pausing thread
          }
        }, 1000);
      }
    });
  }

  const stopBtn = document.getElementById("pomodoro-stop");
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      clearInterval(pomoInterval);
      pomoInterval = null;
      pomoSvgWrap.classList.remove("pomo-running");
    });
  }

  const resetBtn = document.getElementById("pomodoro-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearInterval(pomoInterval);
      pomoInterval = null;
      pomoSvgWrap.classList.remove("pomo-running");
      const val = parseInt(pomodoroInput ? pomodoroInput.value : 25) || 25;
      pomoTotalTime = val * 60;
      pomoTime = pomoTotalTime;
      updatePomoDisplay();
    });
  }
  updatePomoDisplay();

  // --- LeetCode Daily ---
  const lcContainer = document.getElementById("leetcode-container");

  async function fetchLeetCodeDaily() {
    if (!lcContainer) return;
    try {
      const res = await fetch("https://alfa-leetcode-api.onrender.com/daily");
      const daily = await res.json();

      lcContainer.innerHTML = `
                <div style="color: #888; font-size: 0.8rem; margin-bottom: 8px;">> LeetCode Daily (${daily.date})</div>
                <a class="leetcode-item" href="${daily.questionLink}" target="_blank" title="Solve on LeetCode">
                    <div class="lc-title">${daily.questionTitle}</div>
                    <div class="lc-difficulty diff-${daily.difficulty}">${daily.difficulty}</div>
                </a>
            `;
    } catch (error) {
      lcContainer.innerHTML =
        '<p style="color:#ff003c; padding:10px;">[ERR] Could not fetch LeetCode Daily.</p>';
    }
  }

  fetchLeetCodeDaily();

  // --- Cyber Terminal ---
  const termInput = document.getElementById("term-input");
  const termOutput = document.getElementById("term-output");

  function printTerm(text, type = "normal") {
    const div = document.createElement("div");
    div.textContent = text;
    if (type === "error") div.style.color = "#ff003c";
    else if (type === "success") div.style.color = "var(--primary-color)";
    termOutput.appendChild(div);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  if (termInput) {
    termInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const val = termInput.value.trim();
        if (!val) return;
        termInput.value = "";
        printTerm(`root@sys:~# ${val}`, "normal");

        const parts = val.split(" ");
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(" ");

        try {
          switch (cmd) {
            case "help":
              printTerm(
                "> cmnds: help, clear, uuid, hash <str>, joke, b64e, b64d, hex, ip, time, timer",
                "success",
              );
              break;
            case "clear":
              termOutput.innerHTML = "";
              break;
            case "uuid":
              printTerm(crypto.randomUUID(), "success");
              break;
            case "hash":
              if (!args) {
                printTerm("> Usage: hash <text>", "error");
                break;
              }
              const msgUint8 = new TextEncoder().encode(args);
              const hashBuffer = await crypto.subtle.digest(
                "SHA-256",
                msgUint8,
              );
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
              printTerm(`> SHA-256: ${hashHex}`, "success");
              break;
            case "joke":
              printTerm("> Fetching joke...", "normal");
              try {
                const jRes = await fetch(
                  "https://official-joke-api.appspot.com/jokes/programming/random",
                );
                const jData = await jRes.json();
                if (jData && jData[0]) {
                  printTerm(`> ${jData[0].setup}`, "normal");
                  setTimeout(
                    () => printTerm(`> ... ${jData[0].punchline}`, "success"),
                    1500,
                  );
                }
              } catch (e) {
                printTerm("> Could not fetch joke.", "error");
              }
              break;
            case "time":
              const d = new Date();
              printTerm(`> Local: ${d.toLocaleString()}`, "success");
              printTerm(
                `> Epoch: ${Math.floor(d.getTime() / 1000)}`,
                "success",
              );
              break;
            case "timer":
              const pTime =
                document.getElementById("pomodoro-time")?.textContent ||
                "00:00";
              const isRunning = document
                .querySelector(".hourglass-wrapper")
                ?.classList.contains("pomo-running");
              printTerm(
                `> Status: ${isRunning ? "RUNNING" : "PAUSED"}`,
                "success",
              );
              printTerm(`> Time: ${pTime}`, "success");
              break;
            case "b64e":
              printTerm(btoa(args), "success");
              break;
            case "b64d":
              try {
                printTerm(atob(args), "success");
              } catch (e) {
                printTerm("> Invalid encoding", "error");
              }
              break;
            case "hex":
              printTerm(
                args
                  .split("")
                  .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
                  .join(" "),
                "success",
              );
              break;
            case "ip":
              printTerm("> Fetching IP...", "normal");
              const res = await fetch("https://api.ipify.org?format=json");
              const data = await res.json();
              printTerm(`> IP: ${data.ip}`, "success");
              break;
            default:
              printTerm(`> cmd not found: ${cmd}`, "error");
          }
        } catch (err) {
          printTerm(`> error executing ${cmd}`, "error");
        }
      }
    });
  }

  // --- General Widgets Logic ---
  const quickNotes = document.getElementById("quick-notes");
  if (quickNotes) {
    if (chrome.storage) {
      chrome.storage.local.get(["hackerQuickNotes"], (res) => {
        if (res.hackerQuickNotes) quickNotes.value = res.hackerQuickNotes;
      });
    }
    quickNotes.addEventListener("input", () => {
      if (chrome.storage) {
        chrome.storage.local.set({ hackerQuickNotes: quickNotes.value });
      }
    });
  }

  const quoteText = document.getElementById("quote-text");
  const quoteAuthor = document.getElementById("quote-author");
  async function fetchQuote() {
    if (!quoteText) return;
    try {
      // Switching to dummyjson as quotable.io is currently down
      const response = await fetch("https://dummyjson.com/quotes/random");
      if (response.ok) {
        const data = await response.json();
        // dummyjson uses 'quote' field instead of 'content'
        quoteText.textContent = `"${data.quote}"`;
        quoteAuthor.textContent = `- ${data.author}`;
        quoteText.classList.remove("loading-text");
      } else {
        throw new Error("API unreachable");
      }
    } catch (e) {
      // Enhanced fallback quotes (Hacker/Dev themed)
      const fallbacks = [
        {
          c: "Logic will get you from A to B. Imagination will take you everywhere.",
          a: "Albert Einstein",
        },
        {
          c: "Simplicity is the ultimate sophistication.",
          a: "Leonardo da Vinci",
        },
        {
          c: "The best way to predict the future is to invent it.",
          a: "Alan Kay",
        },
        { c: "Talk is cheap. Show me the code.", a: "Linus Torvalds" },
        { c: "Move fast and break things.", a: "Mark Zuckerberg" },
        { c: "Stay hungry, stay foolish.", a: "Steve Jobs" },
        {
          c: "Programs must be written for people to read, and only incidentally for machines to execute.",
          a: "Abelson & Sussman",
        },
      ];
      const q = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      quoteText.textContent = `"${q.c}"`;
      quoteAuthor.textContent = `- ${q.a}`;
      quoteText.classList.remove("loading-text");
    }
  }
  fetchQuote();

  // 6. To-Do List Logic
  const todoInput = document.getElementById("todo-input");
  const addTodoBtn = document.getElementById("add-todo-btn");
  const todoList = document.getElementById("todo-list");
  let tasks = [];

  function renderTasks() {
    todoList.innerHTML = "";
    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = `todo-item ${task.completed ? "completed" : ""}`;

      // Editable span wrapper
      const textContainer = document.createElement("div");
      textContainer.style.flex = "1";
      textContainer.style.display = "flex";
      textContainer.style.alignItems = "center";

      const span = document.createElement("span");
      span.style.cursor = "pointer";
      const statusLabel = task.completed
        ? '<span style="color:#ff003c; font-size:0.8em; margin-right:5px;">[DONE]</span>'
        : '<span style="color:var(--primary-color); font-size:0.8em; margin-right:5px;">[PENDING]</span>';
      span.innerHTML = `${statusLabel} > ${task.text}`;
      span.onclick = () => window.toggleTask(index);
      textContainer.appendChild(span);

      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.innerHTML = "[EDIT]";
      editBtn.onclick = () => {
        const input = document.createElement("input");
        input.className = "task-edit-input";
        input.value = task.text;

        input.onblur = () => {
          const newText = input.value.trim();
          if (newText) tasks[index].text = newText;
          saveTasks();
          renderTasks();
        };

        input.onkeypress = (e) => {
          if (e.key === "Enter") input.blur();
        };

        textContainer.innerHTML = "";
        textContainer.appendChild(input);
        input.focus();
      };

      const delBtn = document.createElement("button");
      delBtn.innerHTML = "[X]";
      delBtn.onclick = () => window.deleteTask(index);

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(textContainer);
      li.appendChild(actions);
      todoList.appendChild(li);
    });
  }

  function saveTasks() {
    if (chrome.storage) {
      chrome.storage.local.set({ hackerTasks: tasks });
    }
  }

  // Global functions for inline handlers
  window.toggleTask = function (index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
  };

  window.deleteTask = function (index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  };

  addTodoBtn.addEventListener("click", () => {
    const text = todoInput.value.trim();
    if (text) {
      tasks.push({ text: text, completed: false });
      todoInput.value = "";
      saveTasks();
      renderTasks();
    }
  });

  todoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTodoBtn.click();
  });

  // Daily Refresh logic
  function processDailyRefresh() {
    const today = new Date().toDateString();
    chrome.storage.local.get(["lastTaskRefresh"], (result) => {
      if (result.lastTaskRefresh !== today) {
        // New day! Remove completed tasks
        tasks = tasks.filter((t) => !t.completed);
        saveTasks();
        chrome.storage.local.set({ lastTaskRefresh: today });
        renderTasks();
      }
    });
  }

  // 7. Panel Resize Memory
  const panels = document.querySelectorAll(".panel");
  let isResizing = false;

  if (chrome.storage) {
    chrome.storage.local.get(["hackerPanelSizes"], (result) => {
      if (result.hackerPanelSizes) {
        panels.forEach((panel, index) => {
          if (result.hackerPanelSizes[index]) {
            if (result.hackerPanelSizes[index].width)
              panel.style.width = result.hackerPanelSizes[index].width;
            if (result.hackerPanelSizes[index].height)
              panel.style.height = result.hackerPanelSizes[index].height;
          }
        });
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (isResizing) return;
      isResizing = true;
      setTimeout(() => {
        const sizes = Array.from(panels).map((panel) => ({
          width: panel.style.width,
          height: panel.style.height,
        }));
        chrome.storage.local.set({ hackerPanelSizes: sizes });
        isResizing = false;
      }, 500); // 500ms debounce
    });
    panels.forEach((panel) => resizeObserver.observe(panel));
  }

  // Load tasks on startup
  if (chrome.storage) {
    chrome.storage.local.get(["hackerTasks"], (result) => {
      if (result.hackerTasks) {
        tasks = result.hackerTasks;
      } else {
        tasks = [
          { text: "Initialize system", completed: false },
          { text: "Breach mainframe", completed: false },
        ];
        saveTasks();
      }
      renderTasks();
      processDailyRefresh();
    });
  } else {
    tasks = [
      { text: "Initialize system", completed: false },
      { text: "Breach mainframe", completed: false },
    ];
    renderTasks();
  }

  // 8. Master Settings Engine
  const defaultSettings = {
    name: "Surya Gudipati",
    color: "#00ffcc",
    clockStyle: "digital",
    dashboardMode: "dev",
    matrixBg: true,
    showBm: true,
    showDh: true,
    showTd: true,
  };
  let currentSettings = { ...defaultSettings };

  function applySettings(updateGreeting = false) {
    // Toggle Matrix
    document.getElementById("matrix").style.display = currentSettings.matrixBg
      ? "block"
      : "none";

    // Theme color
    document.documentElement.style.setProperty(
      "--primary-color",
      currentSettings.color,
    );

    // Clock style
    document.getElementById("clock-digital").style.display =
      currentSettings.clockStyle === "digital" ? "block" : "none";
    document.getElementById("clock-analog").style.display =
      currentSettings.clockStyle === "analog" ? "block" : "none";

    // Dashboard Mode
    const devWidgets = document.getElementById("dev-widgets");
    const generalWidgets = document.getElementById("general-widgets");
    const dhTitle = document.querySelector(".cs-hub-section h2");
    if (devWidgets && generalWidgets) {
      if (currentSettings.dashboardMode === "dev") {
        devWidgets.style.display = "block";
        generalWidgets.style.display = "none";
        if (dhTitle) dhTitle.innerHTML = "&gt; Developer Hub";
      } else {
        devWidgets.style.display = "none";
        generalWidgets.style.display = "flex";
        if (dhTitle) dhTitle.innerHTML = "&gt; Focus Hub";
      }
    }

    // Panel visibilities
    const bmSection = document.querySelector(".bookmarks-section");
    const dhSection = document.querySelector(".cs-hub-section");
    const tdSection = document.querySelector(".todo-section");
    if (bmSection)
      bmSection.style.display = currentSettings.showBm ? "flex" : "none";
    if (dhSection)
      dhSection.style.display = currentSettings.showDh ? "flex" : "none";
    if (tdSection)
      tdSection.style.display = currentSettings.showTd ? "flex" : "none";

    if (
      updateGreeting &&
      window.greetingText !== `Welcome to the system, ${currentSettings.name}.`
    ) {
      window.greetingText = `Welcome to the system, ${currentSettings.name}.`;
      greetingEl.innerHTML = "";
      window.typingIndex = 0;
      clearTimeout(window.typingTimeout);
      window.typeGreeting();
    }
  }

  function syncSettingsForm() {
    const byId = (id) => document.getElementById(id);
    if (byId("setting-name")) byId("setting-name").value = currentSettings.name;
    if (byId("setting-color"))
      byId("setting-color").value = currentSettings.color;
    if (byId("setting-clock"))
      byId("setting-clock").value = currentSettings.clockStyle;
    if (byId("setting-mode"))
      byId("setting-mode").value = currentSettings.dashboardMode || "dev";
    if (byId("setting-matrix"))
      byId("setting-matrix").checked = currentSettings.matrixBg;
    if (byId("setting-show-bm"))
      byId("setting-show-bm").checked = currentSettings.showBm;
    if (byId("setting-show-dh"))
      byId("setting-show-dh").checked = currentSettings.showDh;
    if (byId("setting-show-td"))
      byId("setting-show-td").checked = currentSettings.showTd;
  }

  const fabBtn = document.getElementById("fab-btn");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettings = document.getElementById("close-settings");

  if (fabBtn)
    fabBtn.addEventListener("click", () =>
      settingsModal.classList.remove("modal-hidden"),
    );
  if (closeSettings)
    closeSettings.addEventListener("click", () =>
      settingsModal.classList.add("modal-hidden"),
    );

  const triggerSave = () => {
    currentSettings = {
      name: document.getElementById("setting-name").value.trim() || "Guest",
      color: document.getElementById("setting-color").value,
      clockStyle: document.getElementById("setting-clock").value,
      dashboardMode: document.getElementById("setting-mode")
        ? document.getElementById("setting-mode").value
        : "dev",
      matrixBg: document.getElementById("setting-matrix").checked,
      showBm: document.getElementById("setting-show-bm").checked,
      showDh: document.getElementById("setting-show-dh").checked,
      showTd: document.getElementById("setting-show-td").checked,
    };
    if (chrome.storage) {
      chrome.storage.local.set({ hackerSettings: currentSettings });
    }
    applySettings(true);
  };

  document
    .querySelectorAll(".settings-grid input, .settings-grid select")
    .forEach((el) => {
      el.addEventListener("change", triggerSave);
      if (el.type === "color" || el.type === "text")
        el.addEventListener("input", triggerSave);
    });

  if (chrome.storage) {
    chrome.storage.local.get(["hackerSettings"], (res) => {
      if (res.hackerSettings) {
        currentSettings = { ...defaultSettings, ...res.hackerSettings };
      }
      syncSettingsForm();
      applySettings(true);
    });
  } else {
    syncSettingsForm();
    applySettings(true);
  }
});
