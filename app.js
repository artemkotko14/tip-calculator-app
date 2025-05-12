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

resetButton.disabled = true;

customButton.addEventListener("click", function (e) {
  e.stopPropagation(); // Prevent button click from triggering document click
  openInput();
});

document.addEventListener("DOMContentLoaded", () => {
  // Prevent all forms from submitting
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault(); // Prevent page reload/submit
    });
  });
});

let customInputFocused = false;
// When input gets focus
customInput.addEventListener("focus", function () {
  customInputFocused = true;
  // Only remove chosen-button if input is empty
  if (customInput.value.trim() === "") {
    customButton.classList.remove("chosen-button");
  }

  openInput();
});

// When input loses focus
customInput.addEventListener("blur", function () {
  customInputFocused = false;

  const raw = customInput.value;

  if (raw.trim() === "") {
    customText.textContent = "Custom";
    customInput.value = ""; // Leave blank
  } else {
    // Trim leading zeros, but keep a single zero if all were zeros
    const trimmed = raw.replace(/^0+/, "");
    customInput.value = trimmed === "" ? "0" : trimmed;
    customText.textContent = customInput.value;
  }

  closeInput();
});

billAmount.addEventListener("blur", function () {
  const formattedValue = formatToTwoDecimals(billAmount.value);
  billAmount.value = formattedValue;
  calculate();
});

function handleLiveInput(inputField) {
  inputField.addEventListener("input", () => {
    checkIfReadyToReset();
    calculate();
  });
}

handleLiveInput(billAmount);
handleLiveInput(peopleNumber);
handleLiveInput(customInput);

function clearInput(inputElement) {
  if (inputElement && inputElement.tagName === "INPUT") {
    inputElement.value = "";
  }
}

tipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tipButtons.forEach((btn) => btn.classList.remove("chosen-button"));
    customButton.classList.remove("chosen-button"); // Also remove from custom
    button.classList.add("chosen-button");

    // Reset custom input
    customInput.value = "";

    closeInput();

    const value = button.textContent.replace("%", "").trim();
    checkIfReadyToReset();
    calculate();
  });
});

function validateCustomInput(inputField) {
  inputField.addEventListener("input", function () {
    let currentValue = inputField.value.trim();

    // 💥 Limit to 3 digits max
    if (currentValue.length > 3) {
      currentValue = currentValue.slice(0, 3);
      inputField.value = currentValue;
    }

    // Valid if it only contains digits (whole positive numbers)
    const isValid = /^\d+$/.test(currentValue);

    inputField.dataset.valid = isValid ? "true" : "false";

    // If input is valid, deselect all tip buttons and mark custom as chosen
    if (isValid) {
      tipButtons.forEach((btn) => btn.classList.remove("chosen-button"));
      customButton.classList.add("chosen-button");
    } else if (currentValue === "") {
      // If input is empty again, remove chosen class from custom
      customButton.classList.remove("chosen-button");
    }

    checkIfReadyToReset();
    calculate();
  });
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
  if (customInput.value.trim() === "") {
    customText.textContent = "Custom";
  }
}

// Turn HTMLCollection into an array
Array.from(notNumberErrors).forEach((errorElement) => {
  // Find the closest input related to the error
  const inputField = errorElement.closest("form")?.querySelector("input");

  if (inputField) {
    validateInput(inputField, errorElement);
  }
});

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
    checkIfReadyToReset();
    calculate();
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
      if (customInput.dataset.valid === "true") {
        tip = parseFloat(customInput.value);
      }
    } else {
      tip = parseFloat(selectedButton.textContent.replace("%", "").trim());
    }
  } else if (customInput.dataset.valid === "true") {
    tip = parseFloat(customInput.value);
  }

  const billValid = billAmount.dataset.valid === "true";
  const peopleValid = peopleNumber.dataset.valid === "true";
  const tipValid = !isNaN(tip);

  if (billValid && peopleValid && tipValid) {
    return { bill, people, tip };
  }

  return null;
}

resetButton.addEventListener("click", () => {
  // Clear all inputs
  billAmount.value = "";
  peopleNumber.value = "";
  customInput.value = "";
  customText.textContent = "Custom";

  // Clear tip selection
  tipButtons.forEach((btn) => btn.classList.remove("chosen-button"));
  customButton.classList.remove("chosen-button");

  // Clear visual errors and styling
  const errorWrappers = document.querySelectorAll(".error-border");
  errorWrappers.forEach((wrapper) => wrapper.classList.remove("error-border"));

  Array.from(notNumberErrors).forEach((error) => {
    error.style.display = "none";
  });

  const zeroErrors = document.querySelectorAll(".error.zero");
  zeroErrors.forEach((zeroError) => {
    zeroError.style.display = "none";
  });

  // Reset data-valid flags
  billAmount.dataset.valid = "false";
  peopleNumber.dataset.valid = "false";
  customInput.dataset.valid = "false";

  // Clear results
  tipAmount.textContent = "0.00";
  total.textContent = "0.00";

  // Reset custom input UI
  closeInput();

  // Disable reset button again
  resetButton.disabled = true;
  resetButton.classList.replace("active-button", "inactive-button");
});

function cutZeros(input) {
  if (input.value.startsWith("0") && input.value !== "0") {
    input.value = input.value.replace(/^0+/, "");
  }
}
function checkIfReadyToReset() {
  const billHasValue = billAmount.value.trim() !== "";
  const peopleHasValue = peopleNumber.value.trim() !== "";
  const customHasValue = customInput.value.trim() !== "";

  const anyInputFilled = billHasValue || peopleHasValue || customHasValue;
  const anyTipSelected =
    document.querySelector(".tip-grid .chosen-button") !== null;

  if (anyInputFilled || anyTipSelected) {
    resetButton.classList.replace("inactive-button", "active-button");
    resetButton.disabled = false;
  } else {
    resetButton.disabled = true;
    resetButton.classList.replace("active-button", "inactive-button");
  }
}

function calculate() {
  const validatedInputs = getValidatedInputs();
  if (!validatedInputs) {
    // Set to 0.00 if inputs are invalid or incomplete
    tipAmount.textContent = "0.00";
    total.textContent = "0.00";
    return;
  }

  // Format the value of bill to two decimals
  if (document.activeElement !== billAmount) {
    const formattedValue = formatToTwoDecimals(billAmount.value);
    billAmount.value = formattedValue;
  }

  //Check for zeros in the begining of People Number
  cutZeros(peopleNumber);

  const { bill, people, tip } = validatedInputs;

  // If custom input is selected, use the custom value
  const customTip =
    customInput.dataset.valid === "true" ? parseFloat(customInput.value) : 0;
  const resultTip = customTip || tip;

  //Calculations
  const tipTotal = bill * (resultTip / 100);
  const tipPerPerson = tipTotal / people;
  const totalPerPerson = (bill + tipTotal) / people;

  // Safely display tip and total per person, showing "0.00" if result is invalid (NaN)
  tipAmount.textContent = isNaN(tipPerPerson)
    ? "0.00"
    : tipPerPerson.toFixed(2);
  total.textContent = isNaN(totalPerPerson)
    ? "0.00"
    : totalPerPerson.toFixed(2);
}
