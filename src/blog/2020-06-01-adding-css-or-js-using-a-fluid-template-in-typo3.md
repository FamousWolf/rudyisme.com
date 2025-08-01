---
title: Adding CSS or JavaScript using a Fluid template in TYPO3
description: Often you want to add CSS or JavaScript for just one page template, a single action of a plugin or only if a particular content type is added to a page. If the page, plugin or content type uses Fluid as a template, this can easily be done.
date: 2020-06-01
categories:
  - typo3
  - typo3-10
  - fluid
  - code snippet
---
Often you want to add CSS or JavaScript for just one page template, a single action of a plugin or only if a particular content type is added to a page. If the page, plugin or content type uses Fluid as a template, since TYPO3 8.7 this can easily be done by adding the following to your template:
```xml
<f:section name="HeaderAssets">
    <link rel="stylesheet" href="{f:uri.resource(path: 'Css/styles.css')}"/>
    <script type="text/javascript src="{f:uri.resource(path: 'JavaScript/script.js')}"></script>
</f:section>
```
This will also work with `FooterAssets` instead of `HeaderAssets` to add content just before </body>.