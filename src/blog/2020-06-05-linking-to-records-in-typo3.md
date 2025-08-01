---
title: Linking to records
description: In TYPO3 you can link to pages, files, folders, external URLs, e-mail addresses and telephone numbers by default. But what if you want to link to a different record, like news. You could use an external URL link, but with a few lines of page TS config and TypoScript you can add a tab to the link window to link directly to a record.
date: 2020-06-05
image: ../assets/Images/blog/linkingtorecords.png
categories:
  - typo3
  - typo3-10
  - news
  - tsconfig
  - code snippet
  - typoscript
---
In TYPO3 you can link to pages, files, folders, external URLs, e-mail addresses and telephone numbers by default. But what if you want to link to a different record, like news. You could use an external URL link, but with a few lines of PageTSconfig and TypoScript you can add a tab to the link window to link directly to a record.

For news, the PageTSconfig you need to add to the root page of your site is:

```
TCEMAIN.linkHandler.news {
    handler = TYPO3\CMS\Recordlist\LinkHandler\RecordLinkHandler
    label = News
    configuration {
        table = tx_news_domain_model_news
    }
    scanAfter = page
}
```

This will add the tab in the link window in TYPO3. Now you'll have to tell TYPO3 how to render the link in the frontend. This can be done by adding the following to your TypoScript template:

```
config.recordLinks.news {
    forceLink = 0
    typolink {
        parameter = {$uids.pages.newsDetails}
        additionalParams.data = field:uid
        additionalParams.wrap = &tx_news_pi1[action]=detail&tx_news_pi1[controller]=News&tx_news_pi1[news]=|
        useCacheHash = 1
    }
}
```

The constant {$uids.pages.newsDetails} should contain the uid of the page where the news record should be shown.

More about this can be found in the [TYPO3 LinkHandler API documentation](https://docs.typo3.org/m/typo3/reference-coreapi/10.4/en-us/ApiOverview/LinkBrowser/Linkhandler/Index.html).
