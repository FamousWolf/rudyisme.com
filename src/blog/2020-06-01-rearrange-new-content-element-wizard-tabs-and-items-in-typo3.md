---
title: Rearrange new content element wizard tabs and items in TYPO3
description: TYPO3 comes with a lot of default content elements types. When creating a content element using the Page module you can choose which type to add using the new content element wizard. The content element types are arranged in tabs. You can rearrange the content types and tabs using Page TS config.
date: 2020-06-01
image: ../assets/Images/blog/newcontentelementwizard.png
categories:
  - typo3
  - typo3-10
  - tsconfig
  - code snippet
---
TYPO3 comes with a lot of default content elements types. When creating a content element using the Page module you can choose which type to add using the new content element wizard. The content element types are arranged in tabs. You can rearrange the content types and tabs using Page TS config.

For example if you want the content element type html in the first tab, you can do the following:

```
mod.wizards.newContentElement.wizardItems.common {
    elements {
        html < mod.wizards.newContentElement.wizardItems.special.elements.html
    }
    show := addToList(html)
}
```

You can add a tab and fill it with an existing element like this:

```
mod.wizards.newContentElement.wizardItems.myTab {
    header = My tab
    elements {
        html < mod.wizards.newContentElement.wizardItems.special.elements.html
    }
    show = html
}
```

To remove the existing type from its original tab, add:

```
mod.wizards.newContentElement.wizardItems.special.show := removeFromList(html)
```

[More on this you can find in the TYPO3 Page Tsconfig manual.](https://docs.typo3.org/m/typo3/reference-typoscript/main/en-us/PageTsconfig/Mod/Wizards.html)
