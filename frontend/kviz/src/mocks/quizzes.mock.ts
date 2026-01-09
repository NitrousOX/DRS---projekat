export const quizzesMock = [
  {
    id: "qz-101",
    title: "Opšte znanje (demo)",
    durationSeconds: 45,
    questions: [
      {
        id: "q1",
        text: "Koji je glavni grad Srbije?",
        points: 2,
        answers: [
          { id: "a1", text: "Beograd" },
          { id: "a2", text: "Novi Sad" },
          { id: "a3", text: "Niš" },
        ],
        // više tačnih odgovora je moguće po specifikaciji,
        // ali za demo ne moramo znati tačne na FE-u
        multi: false,
      },
      {
        id: "q2",
        text: "Koji od ovih su programski jezici?",
        points: 3,
        answers: [
          { id: "a1", text: "Python" },
          { id: "a2", text: "React" },
          { id: "a3", text: "Java" },
          { id: "a4", text: "HTML" },
        ],
        multi: true,
      },
    ],
  },
  {
    id: "qz-102",
    title: "Frontend osnove (demo)",
    durationSeconds: 60,
    questions: [
      {
        id: "q1",
        text: "Šta je JSX?",
        points: 2,
        answers: [
          { id: "a1", text: "Sintaksa za pisanje UI u React-u" },
          { id: "a2", text: "Baza podataka" },
          { id: "a3", text: "CSS framework" },
        ],
        multi: false,
      },
    ],
  },
];
