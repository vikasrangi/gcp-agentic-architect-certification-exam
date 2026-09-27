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

function isMultipleChoiceQuestion(question) {
  return Array.isArray(question.correct_answer);
}

function getSelectedAnswers(question) {
  const selected = state.selectedAnswers[question.id];
  if (Array.isArray(selected)) return [...selected];
  if (selected) return [selected];
  return [];
}

function isAnswerCorrect(question, selectedValue) {
  if (Array.isArray(question.correct_answer)) {
    const actual = Array.isArray(selectedValue) ? [...selectedValue].sort() : [];
    const expected = [...question.correct_answer].sort();
    return actual.length === expected.length && expected.every((item) => actual.includes(item));
  }

  const values = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
  return values.includes(question.correct_answer);
}

function stringifySelectedAnswers(selectedValue) {
  if (Array.isArray(selectedValue) && selectedValue.length) {
    return selectedValue.join(', ');
  }

  if (selectedValue) {
    return String(selectedValue);
  }

  return 'None';
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
    state.selectedAnswers[question.id] = isMultipleChoiceQuestion(question) ? [] : null;
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

    button.classList.remove('current', 'correct', 'incorrect');
    if (index === state.currentIndex) button.classList.add('current');

    const answerState = state.submitted[question.id] ? 'submitted' : 'unanswered';
    const selected = getSelectedAnswers(question);
    if (answerState === 'submitted') {
      const isCorrect = isAnswerCorrect(question, selected);
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

  const multipleChoice = isMultipleChoiceQuestion(currentQuestion);
  questionIndex.textContent = `Question ${state.currentIndex + 1}`;
  domainBadge.textContent = currentQuestion.domain || 'General';
  questionText.innerHTML = formatTextWithLinks(currentQuestion.question || '');

  answerList.innerHTML = '';
  const correctAnswers = Array.isArray(currentQuestion.correct_answer)
    ? currentQuestion.correct_answer
    : [currentQuestion.correct_answer];

  Object.entries(currentQuestion.answers).forEach(([optionKey, optionText]) => {
    const optionContainer = document.createElement('label');
    optionContainer.className = 'answer-option';

    const selectedValues = getSelectedAnswers(currentQuestion);
    const isSelected = multipleChoice
      ? selectedValues.includes(optionKey)
      : state.selectedAnswers[currentQuestion.id] === optionKey;

    const isSubmittedAnswer = state.submitted[currentQuestion.id];
    const isCorrectOption = correctAnswers.includes(optionKey);
    const isSelectedWrongOption = isSubmittedAnswer && isSelected && !isCorrectOption;

    if (isSelected) optionContainer.classList.add('selected');
    if (isSubmittedAnswer && isCorrectOption) optionContainer.classList.add('correct');
    if (isSelectedWrongOption) optionContainer.classList.add('wrong');

    const input = document.createElement('input');
    input.type = multipleChoice ? 'checkbox' : 'radio';
    input.name = `question-${currentQuestion.id}`;
    input.checked = isSelected;
    input.setAttribute('aria-label', `Answer option ${optionKey}`);

    const optionTextNode = document.createElement('span');
    optionTextNode.innerHTML = `${optionKey}. ${formatTextWithLinks(optionText || '')}`;

    optionContainer.appendChild(input);
    optionContainer.appendChild(optionTextNode);

    optionContainer.addEventListener('click', () => {
      if (state.submitted[currentQuestion.id]) {
        state.submitted[currentQuestion.id] = false;
      }

      if (multipleChoice) {
        const currentSelection = getSelectedAnswers(currentQuestion);
        const nextSelection = currentSelection.includes(optionKey)
          ? currentSelection.filter((value) => value !== optionKey)
          : [...currentSelection, optionKey];

        state.selectedAnswers[currentQuestion.id] = nextSelection;
      } else {
        state.selectedAnswers[currentQuestion.id] = optionKey;
      }

      renderQuestion();
      renderNavigator();
    });

    answerList.appendChild(optionContainer);
  });

  const isSubmitted = state.submitted[currentQuestion.id];
  const selected = state.selectedAnswers[currentQuestion.id];
  if (isSubmitted && selected !== null && selected !== undefined && ((Array.isArray(selected) && selected.length) || (!Array.isArray(selected) && selected))) {
    const isCorrect = isAnswerCorrect(currentQuestion, selected);
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
  const hasSelection = Array.isArray(selected) ? selected.length > 0 : !!selected;

  if (!hasSelection) {
    resultCard.classList.remove('hidden');
    resultBadge.classList.remove('correct', 'wrong');
    resultBadge.classList.add('wrong');
    resultSummary.textContent = 'Please select an answer before submitting.';
    answerMeta.textContent = 'No answer selected';
    explanation.textContent = 'Choose one of the four options and then submit your response.';
    return;
  }

  state.submitted[currentQuestion.id] = true;
  renderQuestion();
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
    Your answer: <strong>${formatTextWithLinks(stringifySelectedAnswers(selected))}</strong> &nbsp;|&nbsp; Correct answer: <strong>${formatTextWithLinks(stringifySelectedAnswers(question.correct_answer))}</strong>
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
  const score = total ? Math.round(
    (Object.values(state.questions).filter((question) => {
      const selected = state.selectedAnswers[question.id];
      const isCorrect = isAnswerCorrect(question, selected);
      return isCorrect && state.submitted[question.id];
    }).length / total) * 100
  ) : 0;

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
  state.questions.forEach((question) => {
    state.selectedAnswers[question.id] = isMultipleChoiceQuestion(question) ? [] : null;
    state.submitted[question.id] = false;
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
