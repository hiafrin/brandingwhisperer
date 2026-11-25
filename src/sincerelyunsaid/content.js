/* Sincerely Unsaid: the words that change most often.
   Edit the text between the quotes. Layout lives in markup.html and styles.css in this folder. */
export const SU = {

  /* Episodes, in order. Only conversations already recorded are listed.
     Waiting to be added once recorded: Jessica DeStefano, Christae Craig, Jack McNamara,
     Cody Craig, Sarah Cundiff, Sunny Patel, Tony Lipari.
     "link" is where Watch goes.
     PLACEHOLDER links: all 9 still point to the YouTube homepage. */
  episodes: [
    { who: "S. Afrin", what: "S. Afrin opens the series by reading a letter to her mother, Ammu, on her mother's birthday.", link: "https://www.youtube.com/" },
    { who: "Dustin Lowman", what: "A musician and lyricist on the Leonard Cohen songs he keeps returning to, and the younger self he is glad to have left behind.", link: "https://www.youtube.com/" },
    { who: "Cammie Teresa", what: "A baker and business owner on leaving her job two years ago, and whether it was the right decision.", link: "https://www.youtube.com/" },
    { who: "Carly Quellman", what: "On being asked as a child why her parents looked different from her, and what she has carried since.", link: "https://www.youtube.com/" },
    { who: "Andrew Yuska", what: "A musician on comparing himself to other players and the fear of being found out.", link: "https://www.youtube.com/" },
    { who: "Kurt Angles", what: "A photographer on growing up after both of his parents left.", link: "https://www.youtube.com/" },
    { who: "Ishita Rahman", what: "", link: "https://www.youtube.com/" },
    { who: "Jessie Craig", what: "", link: "https://www.youtube.com/" },
    { who: "Ishtiaq Rouf", what: "", link: "https://www.youtube.com/" }
  ],



  /* Questions. The first one starts open. */
  questions: [
    { q: "What can I send?", a: "You can send a letter or a voice note. A letter can be addressed to anyone: a parent, a friend, your younger self, or someone you have lost. We keep everything we receive, and a selection is read at the end of an episode." },
    { q: "Will my letter be read on the show?", a: "We read every letter. A small number are read on an episode, and the choice depends mostly on how well a letter fits that episode's guest and conversation. If yours is selected, we will email you before the episode airs." },
    { q: "Who reads the letters out loud?", a: "Usually the guest of that episode, and sometimes S. Afrin. A voice note can be played as recorded, in your own voice." },
    { q: "Can I stay anonymous?", a: "Yes. If you choose Anonymous, your name will not be read or shown. We still ask for an email address so that we can contact you, and we do not share it." },
    { q: "Can I write to someone who has died?", a: "Yes. Many of the letters we receive are addressed to someone who has died, and they are welcome." },
    { q: "What language can I write in?", a: "Write in whichever language feels natural to you. S. Afrin reads English, Bengali, Hindi and Urdu, so letters in those languages can be read as written." },
    { q: "How long should a letter be?", a: "A letter of about 200 words takes about a minute to read aloud, which is the time set aside in each episode. Longer letters are welcome. If you tick the box that allows us to trim, we will shorten it without changing your meaning." },
    { q: "How are guests chosen?", a: "We look for people who have a story they have not told publicly and who are willing to speak about it honestly. The size of your following does not matter. If your request looks like a good fit, we will contact you to talk before anything is scheduled." },
    { q: "I'm shy. Is that a problem?", a: "No. The show was made with quiet people in mind. There is no small talk, nothing is scripted, and the conversation moves at your pace." }
  ],


  /* Form messages. DRAFT wording, not from the approved design: change freely. */
  messages: {
    sending: "Sending...",
    sent: {
      guest:  { title: "We have your request.",    body: "Thank you. If your request looks like a good fit, we will contact you to talk before anything is scheduled." },
      letter: { title: "We have your letter.", body: "Thank you for sending it. If it is selected for an episode, we will email you before it airs." },
      voice:  { title: "We have your voice note.", body: "Thank you for sending it. If it is selected for an episode, we will email you before it airs." }
    },
    again: "Send another",
    failed: "Your submission was not sent. Everything you entered is still here, so please try again in a moment.",
    tooMany: "We have received several submissions from you in a short time. Please wait a few minutes and try again.",
    notAudio: "That file is not audio. Please choose a voice recording, such as a Voice Memo or WhatsApp audio.",
    tooBig: "That recording is larger than 3 MB. Please send a shorter one, up to 3 minutes.",
    tooLong: "That recording runs longer than 3 minutes. Please send a shorter one.",
    nameOptional: "optional, never read or shown"
  },

  /* Where the forms send (api/unsaid.js). Audio is capped at 3 MB so the request fits what Vercel accepts. */
  endpoint: "/api/unsaid",
  maxAudioBytes: 3 * 1024 * 1024,
  maxAudioSeconds: 180
};
