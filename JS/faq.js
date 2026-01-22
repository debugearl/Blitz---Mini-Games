// Toggle the visibility of the answer when a FAQ question is clicked
const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach(button => {
    button.addEventListener("click", () => {
        const answer = button.nextElementSibling;
        answer.classList.toggle("show");
    });
});