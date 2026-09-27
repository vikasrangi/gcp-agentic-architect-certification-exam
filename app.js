const state = {
  questions: [],
  currentIndex: 0,
  selectedAnswers: {},
  submitted: {},
  isExamFinished: false,
};

const questionNavigator = document.getElementById('questionNavigator');
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('scoreText');
const questionIndex = document.getElementById('questionIndex');
const domainBadge = document.getElementById('domainBadge');
const questionText = document.getElementById('questionText');
const answerList = document.getElementById('answerList');
const submitBtn = document.getElementById('submitBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const resultCard = document.getElementById('resultCard');
const resultBadge = document.getElementById('resultBadge');
const resultSummary = document.getElementById('resultSummary');
const answerMeta = document.getElementById('answerMeta');
const explanation = document.getElementById('explanation');
const resetBtn = document.getElementById('resetBtn');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTextWithLinks(value = '') {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /(https?:\/\/[^\s<>"]+)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

function loadQuestions() {
  const data = typeof window.EXAM_DATA !== 'undefined' ? window.EXAM_DATA : null;

  if (data && Array.isArray(data.questions)) {
    state.questions = data.questions;
    ensureInitialization();
    renderNavigator();
    renderQuestion();
    updateProgress();
    return;
  }

  fetch('./Professional Agentic Architect Beta.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load exam data: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      state.questions = data.questions || [];
      ensureInitialization();
      renderNavigator();
      renderQuestion();
      updateProgress();
    })
    .catch((error) => {
      console.error(error);
      questionText.textContent = 'Unable to load the exam questions. Please verify the JSON file is available in the project root.';
      answerList.innerHTML = '';
    });
}

function ensureInitialization() {
  state.questions.forEach((question) => {
    state.selectedAnswers[question.id] = null;
    state.submitted[question.id] = false;
  });
}

function renderNavigator() {
  if (!state.questions.length) return;

  questionNavigator.innerHTML = '';

  state.questions.forEach((question, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'question-number';
    button.textContent = index + 1;
    button.setAttribute('aria-label', `Go to question ${index + 1}`);

    if (index === state.currentIndex) button.classList.add('current');

    const answerState = state.submitted[question.id] ? 'submitted' : 'unanswered';
    const selected = state.selectedAnswers[question.id];
    if (answerState === 'submitted') {
      const isCorrect = selected === question.correct_answer;
      button.classList.add(isCorrect ? 'correct' : 'incorrect');
    }

    button.addEventListener('click', () => {
      state.currentIndex = index;
      renderQuestion();
      renderNavigator();
    });

    questionNavigator.appendChild(button);
  });
}

function renderQuestion() {
  const currentQuestion = state.questions[state.currentIndex];
  if (!currentQuestion) return;

  questionIndex.textContent = `Question ${state.currentIndex + 1}`;
  domainBadge.textContent = currentQuestion.domain || 'General';
  questionText.innerHTML = formatTextWithLinks(currentQuestion.question || '');

  answerList.innerHTML = '';
  Object.entries(currentQuestion.answers).forEach(([optionKey, optionText]) => {
    const optionBtn = document.createElement('button');
    optionBtn.type = 'button';
    optionBtn.className = 'answer-option';

    const isSelected = state.selectedAnswers[currentQuestion.id] === optionKey;
    if (isSelected) optionBtn.classList.add('selected');

    optionBtn.innerHTML = `
      <span>${optionKey}. ${formatTextWithLinks(optionText || '')}</span>
    `;

    optionBtn.addEventListener('click', () => {
      state.selectedAnswers[currentQuestion.id] = optionKey;
      renderQuestion();
      renderNavigator();
    });

    answerList.appendChild(optionBtn);
  });

  const isSubmitted = state.submitted[currentQuestion.id];
  const selected = state.selectedAnswers[currentQuestion.id];
  if (isSubmitted && selected) {
    const isCorrect = selected === currentQuestion.correct_answer;
    showResult(isCorrect, currentQuestion, selected);
  } else {
    hideResult();
  }

  prevBtn.disabled = state.currentIndex === 0;
  nextBtn.textContent = state.currentIndex === state.questions.length - 1 ? 'Finish' : 'Next';
}


function submitAnswer() {
  const currentQuestion = state.questions[state.currentIndex];
  if (!currentQuestion) return;

  const selected = state.selectedAnswers[currentQuestion.id];
  if (!selected) {
    resultCard.classList.remove('hidden');
    resultBadge.classList.remove('correct', 'wrong');
    resultBadge.classList.add('wrong');
    resultSummary.textContent = 'Please select an answer before submitting.';
    answerMeta.textContent = 'No answer selected';
    explanation.textContent = 'Choose one of the four options and then submit your response.';
    return;
  }

  state.submitted[currentQuestion.id] = true;
  const isCorrect = selected === currentQuestion.correct_answer;
  showResult(isCorrect, currentQuestion, selected);
  renderNavigator();
  updateProgress();
}

function showResult(isCorrect, question, selected) {
  resultCard.classList.remove('hidden');
  resultBadge.classList.remove('correct', 'wrong');

  if (isCorrect) {
    resultBadge.classList.add('correct');
    resultSummary.textContent = 'Correct! You selected the right answer.';
  } else {
    resultBadge.classList.add('wrong');
    resultSummary.textContent = 'Incorrect. The correct answer is different.';
  }

  answerMeta.innerHTML = `
    Your answer: <strong>${selected}</strong> &nbsp;|&nbsp; Correct answer: <strong>${question.correct_answer}</strong>
  `;

  explanation.innerHTML = `
    <strong>Explanation:</strong><br>${formatTextWithLinks(question.explanation || '')}
  `;
}

function hideResult() {
  resultCard.classList.add('hidden');
}

function updateProgress() {
  const total = state.questions.length;
  const answered = Object.values(state.submitted).filter(Boolean).length;
  const score = total ? Math.round((Object.values(state.questions).filter((question) => state.selectedAnswers[question.id] === question.correct_answer && state.submitted[question.id]).length / total) * 100) : 0;

  progressText.textContent = `${answered} / ${total}`;
  scoreText.textContent = `${score}%`;
}

function goToNextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
    renderNavigator();
  } else {
    submitAnswer();
  }
}

function resetExam() {
  state.currentIndex = 0;
  Object.keys(state.selectedAnswers).forEach((key) => {
    state.selectedAnswers[key] = null;
    state.submitted[key] = false;
  });
  renderQuestion();
  renderNavigator();
  updateProgress();
}

submitBtn.addEventListener('click', submitAnswer);
prevBtn.addEventListener('click', () => {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    renderQuestion();
    renderNavigator();
  }
});
nextBtn.addEventListener('click', goToNextQuestion);
resetBtn.addEventListener('click', resetExam);

loadQuestions();
