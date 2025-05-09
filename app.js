const customButton = document.getElementById("customButton");
const customInput = document.getElementById("customInput");
const customText = document.getElementById("customText");
const notNumberErrors = document.getElementsByClassName("not-a-number");
const inputs = document.querySelectorAll("input");
const resetButton = document.querySelector(".reset-button");
const billAmount = document.getElementById("billInput");
const peopleNumber = document.getElementById("peopleNumberInput");
const tipButtons = document.querySelectorAll(".tip-grid > button");
const tipAmount = document.getElementById("calcResultTip");
const total = document.getElementById("calcResultTotal");

let customTipSubmitted = false;
resetButton.disabled = true;

customButton.addEventListener("click", function (e) {
  e.stopPropagation(); // Prevent button click from triggering document click
  openInput();
});

let previousCustomTip = "";
let previousCustomTipText = "Custom";

let customInputFocused = false;
// When input gets focus
customInput.addEventListener("focus", function () {
  customInputFocused = true;
  customButton.classList.remove("chosen-button");
  previousCustomTip = customInput.value.trim();
  previousCustomTipText = customInput.value.trim();
  customInput.value = "";
  openInput();
});

// When input loses focus
customInput.addEventListener("blur", function () {
  customInputFocused = false;

  const value = customInput.value.trim();
  const isValid = customInput.dataset.valid === "true";

  if (!value || !isValid) {
    // Input is empty or invalid
    customInput.value = previousCustomTip;

    if (previousCustomTip && previousCustomTip !== "") {
      customButton.classList.add("chosen-button");
      customTipSubmitted = true;
      customText.textContent = previousCustomTipText;
    } else {
      customButton.classList.remove("chosen-button");
      customTipSubmitted = false;
      customText.textContent = "Custom";
    }

    closeInput();
    return;
  }

  // If valid value but NOT submitted
  if (!customTipSubmitted) {
    customInput.value = previousCustomTip;
    closeInput();
  }
});

// When you click outside
document.addEventListener("click", function (e) {
  if (!customButton.contains(e.target) && customTipSubmitted === false) {
    closeInput();
  }
});

billAmount.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    // Prevent if input is invalid
    if (billAmount.dataset.valid !== "true") {
      return;
    }
  }
});

peopleNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    // Prevent if input is invalid
    if (peopleNumber.dataset.valid !== "true") {
      return;
    }
  }
});

function clearInput(inputElement) {
  if (inputElement && inputElement.tagName === "INPUT") {
    inputElement.value = "";
  }
}

tipButtons.forEach((button) => {
  // Skip the custom button because it has its own logic
  if (button.id !== "customButton") {
    button.addEventListener("click", () => {
      tipButtons.forEach((btn) => btn.classList.remove("chosen-button"));
      button.classList.add("chosen-button");

      // Reset custom input
      customInput.value = "";
      customTipSubmitted = false;
      closeInput();

      const value = button.textContent.replace("%", "").trim();
      const validatedInputs = getValidatedInputs();
      if (validatedInputs) {
        reset(); // Perform calculation
      }
    });
  }
});

// For customed tip
customInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    tipButtons.forEach((btn) => btn.classList.remove("chosen-button"));

    if (customInput.dataset.valid !== "true") {
      return;
    }

    customButton.classList.add("chosen-button");
    customTipSubmitted = true;
    checkIfReadyToReset();
  }
});

function validateCustomInput(inputField) {
  inputField.addEventListener("input", function () {
    const currentValue = inputField.value.trim();

    // Valid if it only contains digits (whole positive numbers)
    const isValid = /^\d+$/.test(currentValue);

    inputField.dataset.valid = isValid ? "true" : "false";
  });
  checkIfReadyToReset();
}

validateCustomInput(customInput);

// Prevents some symboles, ensuring users can only type whole positive numbers
customInput.addEventListener("keydown", function (e) {
  const invalidKeys = ["e", "E", "+", "-", ".", ","];
  if (invalidKeys.includes(e.key)) {
    e.preventDefault();
  }
});
// Prevents from pasting symbols
customInput.addEventListener("paste", function (e) {
  e.preventDefault();
  const pastedText = (e.clipboardData || window.clipboardData).getData("text");
  const numericOnly = pastedText.replace(/\D/g, "");
  customInput.setRangeText(
    numericOnly, // the clean digits-only value
    customInput.selectionStart, // start of current selection
    customInput.selectionEnd, // end of current selection
    "end" // move cursor to the end of inserted text
  );
});

function openInput() {
  if (customTipSubmitted) {
    customTipSubmitted = false;
  }
  customInput.style.opacity = "1";
  customInput.style.pointerEvents = "auto";
  customInput.style.transform = "translate(-50%, -50%) scale(1)";
  customInput.focus(); // Automatically focus inside the input so user can start typing
  customText.style.opacity = "0";
  customText.style.transform = "scale(0.8)";
}

function closeInput() {
  customInput.style.opacity = "0";
  customInput.style.pointerEvents = "none"; // Disable interaction with the hidden input
  customInput.style.transform = "translate(-50%, -50%) scale(0.8)";
  customText.style.opacity = "1";
  customText.style.transform = "scale(1)";
  if (!customTipSubmitted) {
    customInput.value = "";
    customText.textContent = "Custom";
  }

  checkIfReadyToReset();
}

// Turn HTMLCollection into an array
Array.from(notNumberErrors).forEach((errorElement) => {
  // Find the closest input related to the error
  const inputField = errorElement.closest("form")?.querySelector("input");

  if (inputField) {
    validateInput(inputField, errorElement);
  }
});

//checks if calculator has all three values
function checkIfReadyToReset() {
  const validatedInputs = getValidatedInputs();

  if (validatedInputs) {
    resetButton.classList.replace("inactive-button", "active-button");
    resetButton.disabled = false;
  } else {
    resetButton.classList.replace("active-button", "inactive-button");
    resetButton.disabled = true;
  }
}
function validateInput(inputField, notNumberErrorElement) {
  inputField.addEventListener("input", function () {
    const currentValue = inputField.value.trim(); // Get the current value
    const valueAsNumber = parseFloat(currentValue); // Convert to number for logic

    const wrapper = inputField.closest(
      ".bill-header_input-wrapper, .people-container_input-wrapper"
    ); // Find nearest wrapper for applying error border

    const zeroErrorElement = inputField
      .closest("form")
      ?.querySelector(".error.zero"); // Get the element that shows the "can't be zero" error

    let isValid = false;

    // Apply different validation rules based on which input we're working with
    if (inputField === billAmount) {
      // Bill: allow positive numbers with up to two decimal places
      isValid = /^[0-9]+(\.[0-9]{1,2})?$/.test(currentValue);
    } else if (inputField === peopleNumber) {
      // People: only whole numbers greater than zero
      isValid = /^[0-9][0-9]*$/.test(currentValue);
    }
    // Invalid input
    if (!isValid) {
      notNumberErrorElement.style.display = "block";
      if (zeroErrorElement) zeroErrorElement.style.display = "none";
      inputField.dataset.valid = "false";
      wrapper?.classList.add("error-border");
    }
    // Special case: input is zero
    else if (valueAsNumber === 0) {
      if (zeroErrorElement) zeroErrorElement.style.display = "block";
      notNumberErrorElement.style.display = "none";
      inputField.dataset.valid = "false";
      wrapper?.classList.add("error-border");
    }
    // Input is valid: hide all errors
    else {
      notNumberErrorElement.style.display = "none";
      if (zeroErrorElement) zeroErrorElement.style.display = "none";
      inputField.dataset.valid = "true";
      wrapper?.classList.remove("error-border");
    }

    // Re-check whether the reset button should be active
    checkIfReadyToReset();
  });
}

function formatToTwoDecimals(value) {
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return num.toFixed(2);
  }
  return "";
}

function getValidatedInputs() {
  const bill = parseFloat(billAmount.value);
  const people = parseInt(peopleNumber.value);
  const selectedButton = document.querySelector(".tip-grid .chosen-button");

  let tip = NaN;

  if (selectedButton) {
    if (selectedButton.id === "customButton") {
      // Only use custom tip if it's submitted and valid
      if (customTipSubmitted && customInput.dataset.valid === "true") {
        tip = parseFloat(customInput.value);
      }
    } else {
      tip = parseFloat(selectedButton.textContent.replace("%", "").trim());
    }
  }

  const billValid = billAmount.dataset.valid === "true";
  const peopleValid = peopleNumber.dataset.valid === "true";
  const tipValid = !isNaN(tip);

  if (billValid && peopleValid && tipValid) {
    return { bill, people, tip };
  }

  return null;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Prevent native form submission

    const activeElement = document.activeElement;

    // Check if the focused element is one of the tip buttons
    if ([...tipButtons].includes(activeElement)) {
      activeElement.click(); // Trigger tip button behavior (class toggling)
    }

    const validatedInputs = getValidatedInputs();
    if (validatedInputs) {
      reset(); // Perform calculation
    }
  }
});

resetButton.addEventListener("click", () => {
  reset();
});

function cutZeros(input) {
  if (input.value.startsWith("0") && input.value !== "0") {
    input.value = input.value.replace(/^0+/, "");
  }
}

function reset() {
  const validatedInputs = getValidatedInputs();
  if (!validatedInputs) return;

  // Format the value of bill to two decimals only after submission
  const formattedValue = formatToTwoDecimals(billAmount.value);
  billAmount.value = formattedValue;

  //Check for zeros in the begining of People Number
  cutZeros(peopleNumber);

  //Check for zeros in the begining of customInput
  cutZeros(customInput);

  const { bill, people, tip } = validatedInputs;

  //Calculations
  const tipTotal = bill * (tip / 100);
  const tipPerPerson = tipTotal / people;
  const totalPerPerson = (bill + tipTotal) / people;
  tipAmount.textContent = tipPerPerson.toFixed(2);
  total.textContent = totalPerPerson.toFixed(2);
}
