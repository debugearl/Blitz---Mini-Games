// Transition to home page
function transitionToHomePage(href) {
    const overlay = document.getElementById('page-transition');
    overlay.classList.add('active'); // fade in white
    setTimeout(() => {
        window.location.href = href;
    }, 350); // match CSS transition
}

// Example usage: attach to buttons
document.getElementById('menu-btn').addEventListener('click', () => {
    transitionToHomePage('index.html');
});

// Transition to another page 
function transitionToPage(href) {
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = href;
    }, 351);
}