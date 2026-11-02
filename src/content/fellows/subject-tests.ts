/**
 * Subject tests. DRAFT question bank (5 per world) for the curriculum team to
 * extend and rotate. Pass: 4 of 5. Two attempts, then a human review.
 */
import type { Quiz } from "./academy";

export const subjectTests: Record<string, Quiz> = {
  robotics: [
    { q: "An LED does not light. Which is most likely?", options: ["It is inserted backwards", "The code is too long", "The room is too bright"], answer: 0 },
    { q: "What does a servo motor let you control?", options: ["Exact angle", "Only speed", "Temperature"], answer: 0 },
    { q: "Why add a resistor in series with an LED?", options: ["To limit current", "To make it blink", "To store charge"], answer: 0 },
    { q: "A line-following robot usually uses:", options: ["IR reflectance sensors", "A microphone", "A GPS module"], answer: 0 },
    { q: "Two-wheel robot turns left when:", options: ["Right wheel turns faster than left", "Both wheels stop", "Left wheel turns faster"], answer: 0 },
  ],
  iot: [
    { q: "IoT stands for:", options: ["Internet of Things", "Input over Time", "Interface of Tools"], answer: 0 },
    { q: "A DHT11 sensor measures:", options: ["Temperature and humidity", "Distance", "Light colour"], answer: 0 },
    { q: "Which protocol is common for lightweight IoT messages?", options: ["MQTT", "FTP", "SMTP"], answer: 0 },
    { q: "Why avoid hard-coding Wi-Fi passwords in shared code?", options: ["Security", "It runs slower", "It uses more battery"], answer: 0 },
    { q: "A soil sensor reads 300 when dry and 700 when wet. A reading of 650 means:", options: ["Fairly wet", "Very dry", "Broken"], answer: 0 },
  ],
  ai: [
    { q: "Training data that only shows one skin tone can lead to:", options: ["A biased model", "A faster model", "No effect"], answer: 0 },
    { q: "Supervised learning needs:", options: ["Labelled examples", "No data", "Only images"], answer: 0 },
    { q: "Testing on the same data you trained on tends to:", options: ["Overstate accuracy", "Understate accuracy", "Delete the model"], answer: 0 },
    { q: "A classifier sorts items into:", options: ["Categories", "Random numbers", "Files"], answer: 0 },
    { q: "Best way to explain AI to a 9-year-old:", options: ["It learns patterns from examples", "It is magic", "It thinks like a person"], answer: 0 },
  ],
  coding: [
    { q: "What does a loop do?", options: ["Repeats steps", "Stores one value", "Stops the program"], answer: 0 },
    { q: "In Python, `x = x + 1` does what?", options: ["Increases x by 1", "Compares x to 1", "Prints x"], answer: 0 },
    { q: "A bug is:", options: ["A mistake in a program", "A fast program", "A type of loop"], answer: 0 },
    { q: "An `if` statement lets a program:", options: ["Make a choice", "Repeat forever", "Draw shapes"], answer: 0 },
    { q: "First debugging step:", options: ["Reproduce the problem", "Rewrite everything", "Delete the file"], answer: 0 },
  ],
  finlit: [
    { q: "Needs vs wants: which is a need?", options: ["Food", "A new game", "Branded shoes"], answer: 0 },
    { q: "Simple interest on ₹1,000 at 10% a year for 2 years:", options: ["₹200", "₹100", "₹1,200"], answer: 0 },
    { q: "Profit is:", options: ["Revenue minus costs", "Revenue plus costs", "Only revenue"], answer: 0 },
    { q: "A learner asks for a stock tip. The right response:", options: ["We teach money basics, not investment advice", "Buy whatever is trending", "Try crypto"], answer: 0 },
    { q: "A budget helps you:", options: ["Plan spending and saving", "Earn more automatically", "Avoid all spending"], answer: 0 },
  ],
  space: [
    { q: "What keeps a satellite in orbit?", options: ["Gravity and its sideways speed", "Air pressure", "Magnets"], answer: 0 },
    { q: "Which planet is closest to the Sun?", options: ["Mercury", "Venus", "Mars"], answer: 0 },
    { q: "Safe model rocket activity for children uses:", options: ["Air or water pressure, with adult supervision", "Live propellant without permission", "Fireworks"], answer: 0 },
    { q: "ISRO's Chandrayaan missions went to:", options: ["The Moon", "Mars", "Jupiter"], answer: 0 },
    { q: "A day on Earth is set by:", options: ["Earth's rotation", "Earth's orbit", "The Moon"], answer: 0 },
  ],
};

export function gradeSubject(world: string, answers: number[]) {
  const quiz = subjectTests[world];
  const correct = quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  return { correct, total: quiz.length, passed: correct >= 4 };
}

/** Options are shown in a shuffled order per world so answer position isn't a giveaway. */
export function presentQuiz(quiz: Quiz, seed: number) {
  return quiz.map((q, qi) => {
    const order = q.options.map((_, i) => i).sort((a, b) => ((a * 7 + seed + qi) % 5) - ((b * 7 + seed + qi) % 5));
    return { q: q.q, options: order.map((i) => ({ value: i, label: q.options[i] })) };
  });
}
