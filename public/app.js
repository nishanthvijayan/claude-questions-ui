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
        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-options';
        radioContainer.dataset.name = question.id;

        (question.options || []).forEach((opt, idx) => {
          const optionDiv = document.createElement('div');
          optionDiv.className = 'radio-option';

          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.id = `${id}-${idx}`;
          radio.name = question.id;
          radio.value = opt;
          if (question.default === opt) radio.checked = true;

          const label = document.createElement('label');
          label.htmlFor = radio.id;
          label.textContent = opt;

          optionDiv.appendChild(radio);
          optionDiv.appendChild(label);
          radioContainer.appendChild(optionDiv);
        });

        // Add "Other" option with text field
        if (question.allowCustom) {
          const otherDiv = document.createElement('div');
          otherDiv.className = 'radio-option radio-option-other';

          const otherRadio = document.createElement('input');
          otherRadio.type = 'radio';
          otherRadio.id = `${id}-other`;
          otherRadio.name = question.id;
          otherRadio.value = '__other__';

          const otherLabel = document.createElement('label');
          otherLabel.htmlFor = otherRadio.id;
          otherLabel.textContent = 'Other:';

          const otherInput = document.createElement('input');
          otherInput.type = 'text';
          otherInput.id = `${id}-other-text`;
          otherInput.className = 'other-text-input';
          otherInput.placeholder = 'Type your answer...';

          // Focus text input when "Other" is selected
          otherRadio.addEventListener('change', () => {
            if (otherRadio.checked) {
              otherInput.focus();
            }
          });

          // Select "Other" radio when typing in text field
          otherInput.addEventListener('focus', () => {
            otherRadio.checked = true;
          });

          otherDiv.appendChild(otherRadio);
          otherDiv.appendChild(otherLabel);
          otherDiv.appendChild(otherInput);
          radioContainer.appendChild(otherDiv);
        }

        return radioContainer;

      case 'multiselect':
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'multiselect-options';
        checkboxContainer.dataset.name = question.id;

        // Track special checkboxes for interaction logic
        let noneCheckbox = null;
        let otherCheckbox = null;

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

        // Add "Other" option with text field (if allowCustom is true)
        if (question.allowCustom) {
          const otherDiv = document.createElement('div');
          otherDiv.className = 'checkbox-option checkbox-option-other';

          otherCheckbox = document.createElement('input');
          otherCheckbox.type = 'checkbox';
          otherCheckbox.id = `${id}-other`;
          otherCheckbox.name = `${question.id}[]`;
          otherCheckbox.value = '__other__';

          const otherLabel = document.createElement('label');
          otherLabel.htmlFor = otherCheckbox.id;
          otherLabel.textContent = 'Other:';

          const otherInput = document.createElement('input');
          otherInput.type = 'text';
          otherInput.id = `${id}-other-text`;
          otherInput.className = 'other-text-input';
          otherInput.placeholder = 'Type your answer...';

          // Check "Other" checkbox when typing in text field
          otherInput.addEventListener('focus', () => {
            otherCheckbox.checked = true;
            // Uncheck "None" if it exists
            if (noneCheckbox) noneCheckbox.checked = false;
          });

          otherDiv.appendChild(otherCheckbox);
          otherDiv.appendChild(otherLabel);
          otherDiv.appendChild(otherInput);
          checkboxContainer.appendChild(otherDiv);
        }

        // Add "None of the above" option (default: true, unless explicitly set to false)
        if (question.allowNone !== false) {
          const noneDiv = document.createElement('div');
          noneDiv.className = 'checkbox-option checkbox-option-none';

          noneCheckbox = document.createElement('input');
          noneCheckbox.type = 'checkbox';
          noneCheckbox.id = `${id}-none`;
          noneCheckbox.name = `${question.id}[]`;
          noneCheckbox.value = '__none__';

          const noneLabel = document.createElement('label');
          noneLabel.htmlFor = noneCheckbox.id;
          noneLabel.textContent = 'None of the above';

          // When "None" is checked, uncheck all others (including Other)
          noneCheckbox.addEventListener('change', () => {
            if (noneCheckbox.checked) {
              checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (cb !== noneCheckbox) cb.checked = false;
              });
              // Clear "Other" text field
              const otherText = checkboxContainer.querySelector('.other-text-input');
              if (otherText) otherText.value = '';
            }
          });

          noneDiv.appendChild(noneCheckbox);
          noneDiv.appendChild(noneLabel);
          checkboxContainer.appendChild(noneDiv);
        }

        // When any other option is checked, uncheck "None"
        checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.addEventListener('change', () => {
            if (cb.checked && noneCheckbox && cb !== noneCheckbox) {
              noneCheckbox.checked = false;
            }
          });
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
          const selectedRadio = document.querySelector(`input[name="${id}"]:checked`);
          if (selectedRadio) {
            if (selectedRadio.value === '__other__') {
              const otherText = document.querySelector(`#q-${id}-other-text`);
              answers[id] = otherText ? otherText.value : '';
            } else {
              answers[id] = selectedRadio.value;
            }
          } else {
            answers[id] = '';
          }
          break;

        case 'multiselect':
          const checkboxes = document.querySelectorAll(`input[name="${id}[]"]:checked`);
          let values = Array.from(checkboxes).map(cb => cb.value);

          // Handle "None of the above" - return empty array
          if (values.includes('__none__')) {
            answers[id] = [];
            break;
          }

          // Handle "Other" - replace __other__ with actual text value
          if (values.includes('__other__')) {
            const otherText = document.querySelector(`#q-${id}-other-text`);
            const otherValue = otherText ? otherText.value.trim() : '';
            values = values.filter(v => v !== '__other__');
            if (otherValue) {
              values.push(otherValue);
            }
          }

          answers[id] = values;
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
          const selectedRadioVal = document.querySelector(`input[name="${id}"]:checked`);
          inputEl = document.querySelector(`[data-name="${id}"]`);
          if (!selectedRadioVal) {
            isEmpty = true;
          } else if (selectedRadioVal.value === '__other__') {
            const otherTextVal = document.querySelector(`#q-${id}-other-text`);
            isEmpty = !otherTextVal || !otherTextVal.value.trim();
          }
          break;

        case 'multiselect':
          const checkedBoxes = document.querySelectorAll(`input[name="${id}[]"]:checked`);
          const checkedValues = Array.from(checkedBoxes).map(cb => cb.value);
          inputEl = document.querySelector(`[data-name="${id}"]`);

          if (checkedBoxes.length === 0) {
            isEmpty = true;
          } else if (checkedValues.includes('__other__') && !checkedValues.includes('__none__')) {
            // If "Other" is checked, make sure text field has value
            const otherTextMulti = document.querySelector(`#q-${id}-other-text`);
            // Only invalid if "Other" is the ONLY selection and it's empty
            const hasOtherSelections = checkedValues.some(v => v !== '__other__' && v !== '__none__');
            if (!hasOtherSelections && (!otherTextMulti || !otherTextMulti.value.trim())) {
              isEmpty = true;
            }
          }
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
