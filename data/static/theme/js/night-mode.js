document.getElementById('toggle_night_mode').addEventListener("click", () => {
    let night_mode = null;
    if (document.body.classList.contains("night-mode")) {
        toggle_night_mode.innerHTML = "👁️";
        night_mode = 0;
    } else {
        toggle_night_mode.innerHTML = "🧿";
        night_mode = 1;
    }
    document.body.classList.toggle("night-mode");
    trigger_bg();
    let date = Date.now() + 30 * 24 * 60 * 60 * 1000;
    let expires = new Date(date).toUTCString();
    document.cookie = `night_mode=${night_mode}; expires=${expires}; Path=/`;
});