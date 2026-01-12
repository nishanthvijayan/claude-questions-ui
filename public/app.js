/**
 * Client-side JavaScript for Questions UI
 */

(function() {
  // Get session ID from URL path
  const pathParts = window.location.pathname.split('/');
  const sessionId = pathParts[pathParts.length - 1];

  // DOM elements
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const errorMessageEl = document.getElementById('error-message');
  const submittedEl = document.getElementById('submitted');
  const formContainerEl = document.getElementById('form-container');
  const formTitleEl = document.getElementById('form-title');
  const formContextEl = document.getElementById('form-context');
  const questionsListEl = document.getElementById('questions-list');
  const formEl = document.getElementById('questions-form');

  // Session data
  let sessionData = null;

  /**
   * Show an error message
   */
  function showError(message) {
    loadingEl.classList.add('hidden');
    formContainerEl.classList.add('hidden');
    submittedEl.classList.add('hidden');
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  /**
   * Show the submitted state
   */
  function showSubmitted() {
    loadingEl.classList.add('hidden');
    formContainerEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    submittedEl.classList.remove('hidden');
  }

  /**
   * Show the form
   */
  function showForm() {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    submittedEl.classList.add('hidden');
    formContainerEl.classList.remove('hidden');
  }

  /**
   * Create input element based on question type
   */
  function createInput(question) {
    const type = question.type || 'text';
    const id = `q-${question.id}`;
    const isRequired = question.required !== false;

    switch (type) {
      case 'text':
        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.name = question.id;
        textarea.placeholder = 'Type your answer here...';
        if (question.default) textarea.value = question.default;
        if (isRequired) textarea.required = true;
        return textarea;

      case 'select':
        if (question.allowCustom) {
          // Select with custom option
          const wrapper = document.createElement('div');
          wrapper.className = 'select-with-custom';

          const select = document.createElement('select');
          select.id = id;
          select.name = question.id;

          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = 'Select an option...';
          select.appendChild(defaultOption);

          (question.options || []).forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (question.default === opt) option.selected = true;
            select.appendChild(option);
          });

          const customOption = document.createElement('option');
          customOption.value = '__custom__';
          customOption.textContent = 'Other (custom)...';
          select.appendChild(customOption);

          const customInput = document.createElement('input');
          customInput.type = 'text';
          customInput.id = `${id}-custom`;
          customInput.placeholder = 'Enter custom value...';
          customInput.className = 'hidden';

          select.addEventListener('change', () => {
            if (select.value === '__custom__') {
              customInput.classList.remove('hidden');
              customInput.focus();
            } else {
              customInput.classList.add('hidden');
              customInput.value = '';
            }
          });

          wrapper.appendChild(select);
          wrapper.appendChild(customInput);
          return wrapper;
        } else {
          // Regular select
          const select = document.createElement('select');
          select.id = id;
          select.name = question.id;
          if (isRequired) select.required = true;

          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = 'Select an option...';
          select.appendChild(defaultOption);

          (question.options || []).forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (question.default === opt) option.selected = true;
            select.appendChild(option);
          });

          return select;
        }

      case 'multiselect':
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'multiselect-options';
        checkboxContainer.dataset.name = question.id;

        (question.options || []).forEach((opt, idx) => {
          const optionDiv = document.createElement('div');
          optionDiv.className = 'checkbox-option';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `${id}-${idx}`;
          checkbox.name = `${question.id}[]`;
          checkbox.value = opt;

          const label = document.createElement('label');
          label.htmlFor = checkbox.id;
          label.textContent = opt;

          optionDiv.appendChild(checkbox);
          optionDiv.appendChild(label);
          checkboxContainer.appendChild(optionDiv);
        });

        return checkboxContainer;

      case 'boolean':
        const boolContainer = document.createElement('div');
        boolContainer.className = 'boolean-options';

        const yesDiv = document.createElement('div');
        yesDiv.className = 'boolean-option';
        const yesInput = document.createElement('input');
        yesInput.type = 'radio';
        yesInput.id = `${id}-yes`;
        yesInput.name = question.id;
        yesInput.value = 'true';
        if (question.default === 'true' || question.default === true) {
          yesInput.checked = true;
        }
        const yesLabel = document.createElement('label');
        yesLabel.htmlFor = yesInput.id;
        yesLabel.textContent = 'Yes';
        yesDiv.appendChild(yesInput);
        yesDiv.appendChild(yesLabel);

        const noDiv = document.createElement('div');
        noDiv.className = 'boolean-option';
        const noInput = document.createElement('input');
        noInput.type = 'radio';
        noInput.id = `${id}-no`;
        noInput.name = question.id;
        noInput.value = 'false';
        if (question.default === 'false' || question.default === false) {
          noInput.checked = true;
        }
        const noLabel = document.createElement('label');
        noLabel.htmlFor = noInput.id;
        noLabel.textContent = 'No';
        noDiv.appendChild(noInput);
        noDiv.appendChild(noLabel);

        boolContainer.appendChild(yesDiv);
        boolContainer.appendChild(noDiv);
        return boolContainer;

      default:
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.name = question.id;
        if (question.default) input.value = question.default;
        if (isRequired) input.required = true;
        return input;
    }
  }

  /**
   * Render the questions form
   */
  function renderQuestions(data) {
    // Set title
    if (data.title) {
      formTitleEl.textContent = data.title;
    }

    // Set context
    if (data.context) {
      formContextEl.textContent = data.context;
      formContextEl.classList.remove('hidden');
    }

    // Render each question
    data.questions.forEach(question => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'question-item';

      // Label
      const label = document.createElement('label');
      label.className = 'question-label';
      label.htmlFor = `q-${question.id}`;
      label.textContent = question.question;
      if (question.required !== false) {
        const required = document.createElement('span');
        required.className = 'required';
        required.textContent = '*';
        label.appendChild(required);
      }
      itemDiv.appendChild(label);

      // Description
      if (question.description) {
        const desc = document.createElement('p');
        desc.className = 'question-description';
        desc.textContent = question.description;
        itemDiv.appendChild(desc);
      }

      // Input
      const input = createInput(question);
      itemDiv.appendChild(input);

      questionsListEl.appendChild(itemDiv);
    });

    showForm();
  }

  /**
   * Collect form answers
   */
  function collectAnswers() {
    const answers = {};

    sessionData.questions.forEach(question => {
      const type = question.type || 'text';
      const id = question.id;

      switch (type) {
        case 'text':
          const textarea = document.querySelector(`#q-${id}`);
          answers[id] = textarea ? textarea.value : '';
          break;

        case 'select':
          if (question.allowCustom) {
            const select = document.querySelector(`#q-${id}`);
            const customInput = document.querySelector(`#q-${id}-custom`);
            if (select && select.value === '__custom__') {
              answers[id] = customInput ? customInput.value : '';
            } else {
              answers[id] = select ? select.value : '';
            }
          } else {
            const select = document.querySelector(`#q-${id}`);
            answers[id] = select ? select.value : '';
          }
          break;

        case 'multiselect':
          const checkboxes = document.querySelectorAll(`input[name="${id}[]"]:checked`);
          answers[id] = Array.from(checkboxes).map(cb => cb.value);
          break;

        case 'boolean':
          const checked = document.querySelector(`input[name="${id}"]:checked`);
          answers[id] = checked ? checked.value === 'true' : null;
          break;

        default:
          const input = document.querySelector(`#q-${id}`);
          answers[id] = input ? input.value : '';
      }
    });

    return answers;
  }

  /**
   * Validate required fields
   */
  function validateForm() {
    let valid = true;

    // Remove previous validation messages
    document.querySelectorAll('.validation-message').forEach(el => el.remove());
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    sessionData.questions.forEach(question => {
      if (question.required === false) return;

      const type = question.type || 'text';
      const id = question.id;
      let isEmpty = false;
      let inputEl = null;

      switch (type) {
        case 'text':
          inputEl = document.querySelector(`#q-${id}`);
          isEmpty = !inputEl || !inputEl.value.trim();
          break;

        case 'select':
          if (question.allowCustom) {
            const select = document.querySelector(`#q-${id}`);
            const customInput = document.querySelector(`#q-${id}-custom`);
            if (select.value === '__custom__') {
              isEmpty = !customInput || !customInput.value.trim();
              inputEl = customInput;
            } else {
              isEmpty = !select || !select.value;
              inputEl = select;
            }
          } else {
            inputEl = document.querySelector(`#q-${id}`);
            isEmpty = !inputEl || !inputEl.value;
          }
          break;

        case 'multiselect':
          const checked = document.querySelectorAll(`input[name="${id}[]"]:checked`);
          isEmpty = checked.length === 0;
          inputEl = document.querySelector(`[data-name="${id}"]`);
          break;

        case 'boolean':
          const selected = document.querySelector(`input[name="${id}"]:checked`);
          isEmpty = !selected;
          inputEl = document.querySelector(`.boolean-options`);
          break;
      }

      if (isEmpty && inputEl) {
        valid = false;
        inputEl.classList.add('invalid');
        const msg = document.createElement('div');
        msg.className = 'validation-message';
        msg.textContent = 'This field is required';
        inputEl.parentNode.appendChild(msg);
      }
    });

    return valid;
  }

  /**
   * Submit answers to server
   */
  async function submitAnswers(answers) {
    const response = await fetch(`/api/session/${sessionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answers),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to submit answers');
    }

    return response.json();
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitBtn = formEl.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const answers = collectAnswers();
      await submitAnswers(answers);
      showSubmitted();
    } catch (error) {
      showError(error.message);
    }
  }

  /**
   * Load session data
   */
  async function loadSession() {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Failed to load session');
        return;
      }

      if (data.alreadySubmitted) {
        showSubmitted();
        return;
      }

      sessionData = data;
      renderQuestions(data);
    } catch (error) {
      showError('Failed to connect to server. Please try again.');
    }
  }

  // Initialize
  formEl.addEventListener('submit', handleSubmit);
  loadSession();
})();
