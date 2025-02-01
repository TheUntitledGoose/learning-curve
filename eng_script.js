// ==UserScript==
// @name         Learning Slope
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-start
// ==/UserScript==

// Enable development mode for debugging
const dev = true;
if (dev) console.log("dev mode enabled");

// Stores groups of answer choices with correct answer marked
let answerData = [];

// Function to parse and extract relevant answer choices from the text file
async function parseAnswerFile(text) {
  try {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let tempArray = [];
    let inQuestion = false;
    let questionType = ""; // MC or SC

    for (let line of lines) {
      if (dev) console.log("line");
      if (dev) console.log(line);
      if (line.startsWith("MC:") || line.startsWith("SC:")) {
        // Detect question type and reset temporary storage
        questionType = line.startsWith("MC:") ? "MC" : "SC";
        inQuestion = true;
        tempArray = [];
        if (dev) console.log("inQuestion, questionType");
        if (dev) console.log(inQuestion, questionType);
        continue;
      }

      if (inQuestion && ( /^[*]?[A-E]\./.test(line) || /^_/.test(line) )) {

        if ( line.startsWith("_") && tempArray.length >= 1 ) {
          if (dev) console.log(tempArray)
          answerData.push(tempArray);
          tempArray = [];
          inQuestion = false; // End of question block
          continue; // Skip to next line
        }

        // Extract answer choice
        let isCorrect = line.startsWith('*');
        let answerText = line.replace(/^\*?[A-D]\.\s*/, '').split(' [[')[0].trim();
        tempArray.push({ text: answerText, correct: isCorrect });
        if (dev) console.log("isCorrect, answerText");
        if (dev) console.log(isCorrect, answerText);

        if (dev) console.log("tempArray");
        if (dev) console.log(tempArray);
      }
    }

    console.log("Parsed Answer Data:", answerData);
  } catch (error) {
    console.error("Error fetching answer file:", error);
  }
}

// Monitor network requests to detect the answer .txt file
const originalFetch = unsafeWindow.fetch;

unsafeWindow.fetch = async function(url, options) {
  if (dev) console.log("Intercepted fetch request:", url);
  if (typeof url === "string" && url.startsWith("https://learningcurve-prod-data.s3.amazonaws.com/learningcurve_activity_config/english/") && url.endsWith(".txt")) {
    console.log("Detected answer file URL:", url);
    fetchAnswerFile(url);
  }
  return originalFetch(url, options);
};

async function fetchAnswerFile(url) {
  try {
    if (dev) console.log("Fetching answer file contents from:", url);
    const response = await fetch(url);
    const text = await response.text();
    console.log("Answer file contents preview:", text.substring(0, 500));
    parseAnswerFile(text);
  } catch (error) {
    console.error("Error fetching answer file:", error);
  }
}

// Function to find the correct answer
function findCorrectAnswer(choices) {
  for (let group of answerData) {
    if (dev) console.log("group");
    if (dev) console.log(group);
    let texts = group.map(a => a.text);
    if (dev) console.log("texts");
    if (dev) console.log(texts);
    if (choices.some(choice => texts.includes(choice))) {
      if (dev) console.log("Correct answer found in group:", group);
      return group.find(a => a.correct)?.text || null;
    }
  }
  return null;
}

// Periodically check for answer choices and highlight the correct answers
setInterval(() => {
  let MCchoiceDivs = document.querySelectorAll('.MultipleChoice__answerText__ruHtC');
  let SCchoiceDivs = document.querySelectorAll('.Clickable__base__FmhVi');

  if (dev) console.log("MC choices found:", MCchoiceDivs.length);
  if (dev) console.log("SC choices found:", SCchoiceDivs.length);

  // Handle Multiple Choice Questions
  if (MCchoiceDivs.length > 0) {
    let choices = Array.from(MCchoiceDivs).map(div => div.innerText.trim());
    let correctAnswer = findCorrectAnswer(choices);
    if (dev) console.log("MC Choices:", choices, "Correct Answer:", correctAnswer);

    if (correctAnswer) {
      console.log("Highlighting Correct MC Answer:", correctAnswer);
      MCchoiceDivs.forEach(div => {
        if (dev) console.log("Checking MC answer div:", div.innerText.trim());
        if (div.innerText.trim() === correctAnswer) {
          div.style.backgroundColor = "lightgreen"; // Highlight correct answer
        }
      });
    }
  }

  // Handle Single Choice Questions
  if (SCchoiceDivs.length > 0) {
    let choices = Array.from(SCchoiceDivs).map(div => div.innerText.trim());
    let correctAnswer = findCorrectAnswer(choices);
    if (dev) console.log("SC choices:", choices);
    if (dev) console.log("SC answer:", correctAnswer);

    if (correctAnswer) {
      console.log("Highlighting Correct SC Answer:", correctAnswer);
      SCchoiceDivs.forEach(div => {
        if (dev) console.log("Checking SC answer div:", div.innerText.trim());
        if (div.innerText.trim() === correctAnswer) {
          div.style.backgroundColor = "lightgreen"; // Highlight correct answer
        }
      });
    }
  }

}, 5000);

