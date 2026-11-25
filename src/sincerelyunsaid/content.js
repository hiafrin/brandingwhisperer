/* Sincerely Unsaid: the words that change most often.
   Edit the text between the quotes. Layout lives in markup.html and styles.css in this folder. */
export const SU = {

  /* Episodes, in order. "link" is where Watch goes.
     PLACEHOLDER links: all 11 still point to the YouTube homepage. */
  episodes: [
    { who: "S. Afrin",          what: "A letter to Ammu, read on her mother's birthday.",                 link: "https://www.youtube.com/" },
    { who: "Jessica DeStefano", what: "Why she has given so much of herself to Leonard Cohen's legacy.",  link: "https://www.youtube.com/" },
    { who: "Dustin Lowman",     what: "The songs and lines of Cohen's that never let him go.",            link: "https://www.youtube.com/" },
    { who: "Christae Craig",    what: "The stories that never make it to the stage.",                     link: "https://www.youtube.com/" },
    { who: "Jack McNamara",     what: "The ideas he keeps for himself.",                                  link: "https://www.youtube.com/" },
    { who: "Cody Craig",        what: "What it takes to show up for kids who need it most.",              link: "https://www.youtube.com/" },
    { who: "Sarah Cundiff",     what: "The chapter of her own she rarely tells.",                         link: "https://www.youtube.com/" },
    { who: "Sunny Patel",       what: "What stays outside the frame.",                                    link: "https://www.youtube.com/" },
    { who: "Cammie Teresa",     what: "What it took to keep the doors open.",                             link: "https://www.youtube.com/" },
    { who: "Kurt Angles",       what: "The story he hasn't told.",                                        link: "https://www.youtube.com/" },
    { who: "Tony Lipari",       what: "The songs he almost kept to himself.",                             link: "https://www.youtube.com/" }
  ],

  /* Questions. The first one starts open. */
  questions: [
    { q: "What can I send?", a: "Letters, stories and voice notes. You write to anyone you choose: a parent, a friend, a younger you, someone you lost. We keep every one, and some are read in the last minute of an episode." },
    { q: "Will my letter be read on the show?", a: "Every letter is read by us. Only a few make it onto an episode, and that depends on the guest and the conversation more than on the writing. If yours is chosen, we will email you before it airs." },
    { q: "Who reads the letters out loud?", a: "Usually the guest of that episode, sometimes S. Afrin. A voice note can be played as it is, in your own voice." },
    { q: "Can I stay anonymous?", a: "Yes. Pick Anonymous when you sign it and no name will be read or shown. We still ask for an email so we can reach you, and it is never shared." },
    { q: "Can I write to someone who has died?", a: "Yes. Many of the letters people carry are to someone who is no longer here. Those are welcome." },
    { q: "What language can I write in?", a: "The one the words came to you in. S. Afrin reads English, Bengali, Hindi and Urdu, so those can be read exactly as written." },
    { q: "How long should a letter be?", a: "Around 200 words reads in about a minute, which is the time each episode leaves for it. Longer is fine. Tick the box that lets us trim it, and we will keep your words and your meaning." },
    { q: "How are guests chosen?", a: "We look for a story that has not been told a hundred times, from someone who would rather be honest than impressive. Big following not required. If it feels like a fit, we will reach out to talk first." },
    { q: "I'm shy. Is that a problem?", a: "That is who the show is for. There is no small talk to get through and no performance expected. We start from the middle and go at your pace." }
  ],

  /* Form messages. DRAFT wording, not from the approved design: change freely. */
  messages: {
    sending: "Sending...",
    sent: {
      guest:  { title: "Your request is in.",    body: "Thank you. If it feels like a fit, we will reach out to talk first." },
      letter: { title: "Your letter is with us.", body: "Thank you for writing it down. If it is chosen, we will email you before it airs." },
      voice:  { title: "Your voice note is with us.", body: "Thank you for saying it out loud. If it is chosen, we will email you before it airs." }
    },
    again: "Send another",
    failed: "That did not send, and nothing was lost. Everything you wrote is still here. Please try again in a moment.",
    tooMany: "That is a lot in a short time. Please wait a few minutes and try again.",
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
