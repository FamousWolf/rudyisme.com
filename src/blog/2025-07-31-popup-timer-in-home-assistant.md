---
title: Popup timer in Home Assistant
description: My four-year-old son has been obsessed with time lately. He wants to know how long everything takes, up to the minute, and asks how many minutes it takes every few minutes. So much so that I decided to make a timer I can show on a tablet hanging on the wall in our living room we use as calendar, running Home Assistant. This is how I made it.
date: 2025-07-31
image: ../assets/Images/blog/2025-07-31-timer.png
categories:
  - homeassistant
---
My four-year-old son has been obsessed with time lately. He wants to know how long everything takes, up to the minute, and asks how many minutes it takes every few minutes. So much so that I decided to make a timer I can show on a tablet hanging on the wall in our living room we use as calendar, running Home Assistant. This is how I made it.


## Requirements

| Name                                                                           | Version at time of writing |
|--------------------------------------------------------------------------------|----------------------------|
| [Home Assistant](https://www.home-assistant.io)                                | 2025.7.4                   |
| [HACS](https://www.hacs.xyz)                                                   | 2.0.5                      |
| [browser_mod](https://github.com/thomasloven/hass-browser_mod)                 | 2.4.3                      |
| [circular-timer-card](https://github.com/karlis-vagalis/circular-timer-card)   | eaf2521                    |

## Create helpers

- Go to `Settings`
- Go to `Devices & Services`
- Go to `Helpers`
- Click on the `Create helper` button to create the timer helper
- Select `Timer`
- Give it a name (`Timer popup`), optionally an icon and click `Create`
  ![](../../assets/Images/blog/2025-07-31-timer-create-timer-helper.png)
- Click on the `Create helper` button to create another helper to set the time
- Select `Date and/or time`
- Give it a name (`Timer popup - Time`) and optionally an icon. For `What do you want to input`, select `Time` and click on `Create`
  ![](../../assets/Images/blog/2025-07-31-timer-create-input-time-helper.png)

## Create scripts

- Go to `Settings`
- Go to `Automations & scenes`
- Go to `Scripts`
- Click on the `Create script` button to create a script to start the timer. Use the following yaml:
  ```yaml
  sequence:
    - action: timer.start
      metadata: {}
      data:
        duration: "{% raw %}{{ states('input_datetime.timer_popup_time') }}{% endraw %}"
      target:
        entity_id: timer.timer_popup
    - action: browser_mod.popup
      metadata: {}
      data:
        dismissable: true
        allow_nested_more_info: true
        browser_id:
          - 8f7b4...
        title: Timer
        content:
          type: custom:circular-timer-card
          entity: timer.timer_popup
          bins: 80
          corner_radius: 1
          color:
            - "#00ff00"
            - "#999900"
            - "#ff0000"
          color_state: true
          primary_info: none
          secondary_info: timer
        size: normal
  alias: Timer popup - Start
  description: ""
  ```
  Replace `browser_id` with the id of the browser you want the popup to open in. This can easily be selected in the visual editor
- Save the script

## Create control card

On a dashboard of your choice, create a new card to start and control the timer and popup. Use the following yaml:

```yaml
type: entities
entities:
  - entity: timer.timer_popup
  - entity: input_datetime.timer_popup_time
footer:
  type: buttons
  entities:
    - name: Start
      entity: timer.timer_popup
      icon: mdi:check
      tap_action:
        action: perform-action
        perform_action: script.timer_popup_start
title: Timer popup
```

![](../../assets/Images/blog/2025-07-31-timer-setting-card.png)
