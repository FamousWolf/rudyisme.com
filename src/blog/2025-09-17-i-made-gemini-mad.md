---
title: I made Google Gemini mad
description: While debugging a problem in TYPO3 I made Google Gemini mad at me.
date: 2025-09-17
image: ../assets/Images/blog/2025-09-17-mad-gemini.png
categories:
  - ai
  - gemini
  - typo3
---
While debugging a problem in TYPO3 I made Google Gemini mad at me.

I was working on a TYPO3 extension where I had multiple data sources. I wanted to make it easy to add more data sources. Each data source has a class, which takes care of fetching the data and transforming it to a standard format, so it can be handled by the extension. I've done something similar in a Symfony project, where I just tagged the classes with a `#[AsTaggedItem(...)]` attribute and have them automatically injected in a Service. TYPO3 uses a lot of Symfony code and principals, so I figured this might also work in TYPO3, but it didn't work. So I thought I'd ask Gemini.

According to Gemini it should work. Since it didn't, I wanted to know how I could best debug this. Gemini told me I could use the `debug:container` command to debug it, which is a Symfony command. TYPO3 has not implemented this, though I wasn't sure at the time, so I told Gemini the command didn't exist. It then told me where it should be. Of course, it wasn't there. It then told me a different location it should be and that not being able to run the command wasn't because the file for the command wasn't there. This went back and forth a few times. I eventually told Gemini I searched the entire project for the command file, and it wasn't there. That's when it again told me where the file was (the 3rd or 4th location it said it should be) and added the above message.

Clearly Gemini had enough of my insistence it was wrong (which, of course, it was).