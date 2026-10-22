/* Why Sidequest, in Rebecca's words. Shared by onboarding (StepWhy) and /about */

export const PURPOSE = {
  headline: ['Nothing here is', 'fed to you.'],
  why: [
    'No feed, no search, no top ten. Sidequest runs on chance, and on small things other people leave behind for the next person to find.',
    "What you do with a draw is yours. Wander off. Stay too long. Leave early. That's the story.",
  ],
  accent: 'written by you, not for you',
  about: [
    'Sidequesting is treating real life like a game. Small, optional, low stakes. Nothing you have to do, nothing that gets you anywhere in particular.',
    "Most apps decide what you see. The things that look like recommendations are usually ads, or someone's day with the boring parts cut out. Sidequest doesn't rank anything. A draw is a draw.",
    "The pool is places near you, plus sidequests people here have suggested. Yours can go in too, one a day. Someone's draw might land on it.",
    "Nothing tells you how to do a sidequest. There's no right way, and there's no wrong turn.",
  ],
  madeIn: 'Made in Ann Arbor.',
  /** the Profile card and its sheet: why we made it */
  story: {
    title: 'Why we made Sidequest',
    subtitle: 'Surprises come when you least expect it.',
    sections: [
      {
        kicker: 'THE PUSHBACK',
        body: 'Sidequesting took off as a quiet rebellion against optimization. Days get scheduled down to the minute, feeds decide what we see, and rest starts to feel like something we have to earn. A sidequest is the opposite: small, optional, and done for no reason at all.',
      },
      {
        kicker: 'NOT FED TO YOU',
        body: "Most of what reaches us is curated, ranked, or quietly selling something. Sidequest doesn't pick for you. It hands you a place and one small thing to do, then gets out of the way.",
      },
      {
        kicker: 'YOUR STORY',
        body: "The moments we remember are rarely the planned ones. Every sidequest is unrepeatable, so no two people's stories look the same, and nobody fits in one box. Your story keeps changing because you keep writing it.",
      },
      {
        kicker: 'WHO IT\'S FOR',
        body: 'Anyone tired of being told how to spend their day, who would rather find their own small adventures than scroll through someone else\'s.',
      },
    ],
  },
} as const;
