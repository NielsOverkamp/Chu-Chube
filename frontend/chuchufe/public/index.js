function onSubmit(event) {
    event.preventDefault();
    location = `player.html?room=${event.target[0].value}`
}
document.getElementById("roomInputForm").addEventListener("submit", onSubmit)
