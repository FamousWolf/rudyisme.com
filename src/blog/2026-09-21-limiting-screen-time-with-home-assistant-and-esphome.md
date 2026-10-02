---
title: Limiting screen time with Home Assistant and ESPHome
description: My 5-year-old son often wakes ridiculously early and goes downstairs to watch TV. This means he gets way more screen time than we would like, especially on weekends. I solved this using Home Assistant, a smart plug and an M5Stack Core2 device with ESPHome.
date: 2026-10-02
image: ../assets/Images/blog/2026-09-21-limiting-screen-time-with-home-assistant-and-esphome.png
categories:
  - home assistant
  - esphome
  - parenting
---
My 5-year-old son often wakes ridiculously early and goes downstairs to watch TV. This means he gets way more screen time than we would like, especially on weekends. I solved this using Home Assistant, a smart plug and an M5Stack Core2 device with ESPHome.

The first thing I did was connect the TV to a smart plug. The TV has Android, so I could probably turn it off differently, but I wanted to be sure my son wouldn't be able to turn it back on. Next I made a Home Assistant automation to start a timer when the smart power plug draws more than 60W (the TV uses 80W when on), pause the timer when it draws less than 60W before the timer ends, turn off the smart plug when the timer ends and have it only run between 5:00 and 9:00 in the morning.

This, however, didn't give my son any indication how long he had left. Which made turning off the TV very abrupt. So I used an M5Stack Core2 device I had to show the remaining time using the following ESPHome yaml.

```yaml
{% raw %}
substitutions:
  node_name: m5stack-timer
  friendly_name: M5Stack Timer
  ha_timer_entity: timer.screen_time_timer

esphome:
  name: ${node_name}
  friendly_name: ${friendly_name}
  name_add_mac_suffix: false
  on_boot:
    - lambda: |-
        id(timer_running) = false;
        id(flash_until_ms) = 0;
        id(sync_remaining_ms) = 0;
        id(sync_millis) = millis();
        id(axp192_id).set_brightness(0.0f);

esp32:
  board: m5stack-core2
  framework:
    type: arduino

psram:
  mode: quad
  speed: 40MHz

logger:

api:
  encryption:
    key: !secret api_encryption_key

ota:
  - platform: esphome
    password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "${node_name}-fallback"
    password: !secret wifi_ap_password

captive_portal:

i2c:
  - id: bus_a
    sda: GPIO21
    scl: GPIO22

spi:
  clk_pin: GPIO18
  mosi_pin: GPIO23

# AXP192 power management - required to power the TFT backlight (DCDC3).
external_components:
  - source: github://martydingo/esphome-axp192
    components: [axp192]

sensor:
  - platform: axp192
    id: axp192_id
    model: M5CORE2
    address: 0x34
    i2c_id: bus_a
    update_interval: 1s

text_sensor:
  - platform: homeassistant
    id: ha_timer_state
    entity_id: ${ha_timer_entity}
    internal: true
    on_value:
      - lambda: |-
          if (x == "active") {
            id(timer_running) = true;
            id(flash_until_ms) = 0;
            id(axp192_id).set_brightness(1.0f);
          } else if (x == "paused") {
            id(timer_running) = false;
            id(flash_until_ms) = 0;
            id(axp192_id).set_brightness(1.0f);
          } else if (x == "idle") {
            if (id(flash_until_ms) == 0) {
              uint32_t rem = id(sync_remaining_ms);
              uint32_t elapsed = millis() - id(sync_millis);
              if (elapsed < rem) rem -= elapsed; else rem = 0;
              bool was_running = id(timer_running);
              id(timer_running) = false;
              if (was_running && rem <= 1000) {
                // Just finished - flash 00:00:00 for 10s before turning off.
                id(sync_remaining_ms) = 0;
                id(flash_until_ms) = millis() + 10000;
                id(axp192_id).set_brightness(1.0f);
              } else {
                id(axp192_id).set_brightness(0.0f);
              }
            }
          }

  - platform: homeassistant
    id: ha_timer_remaining
    entity_id: ${ha_timer_entity}
    attribute: remaining
    internal: true
    on_value:
      - lambda: |-
          if (id(flash_until_ms) != 0) {
            // Ignore HA updates while flashing 00:00:00.
            return;
          }
          uint32_t secs = 0;
          if (x.find(':') != std::string::npos) {
            int hh = 0, mm = 0, ss = 0;
            if (sscanf(x.c_str(), "%d:%d:%d", &hh, &mm, &ss) == 3) {
              secs = (uint32_t)hh * 3600 + (uint32_t)mm * 60 + (uint32_t)ss;
            }
          } else {
            float f = atof(x.c_str());
            if (f >= 0.0f) secs = (uint32_t)f;
          }
          id(sync_remaining_ms) = secs * 1000;
          id(sync_millis) = millis();

globals:
  - id: sync_remaining_ms
    type: uint32_t
    initial_value: '0'
    restore_value: false
  - id: sync_millis
    type: uint32_t
    initial_value: '0'
    restore_value: false
  - id: timer_running
    type: bool
    initial_value: 'false'
    restore_value: false
  - id: flash_until_ms
    type: uint32_t
    initial_value: '0'
    restore_value: false

interval:
  - interval: 250ms
    then:
      - lambda: |-
          uint32_t now = millis();
          if (id(timer_running)) {
            uint32_t elapsed = now - id(sync_millis);
            if (elapsed >= id(sync_remaining_ms)) {
              id(sync_remaining_ms) = 0;
              id(sync_millis) = now;
              id(timer_running) = false;
              id(flash_until_ms) = now + 10000;
              id(axp192_id).set_brightness(1.0f);
            } else {
              id(sync_remaining_ms) -= elapsed;
              id(sync_millis) = now;
            }
          }
          if (id(flash_until_ms) != 0 && now >= id(flash_until_ms)) {
            id(flash_until_ms) = 0;
            id(axp192_id).set_brightness(0.0f);
          }

font:
  - file: "fonts/DSEG7Classic-Regular.ttf"
    id: sevenseg
    size: 56
    glyphs: "0123456789:"

display:
  - platform: mipi_spi
    id: timer_display
    model: M5CORE2
    update_interval: 500ms
    lambda: |-
      it.fill(Color(0, 0, 0));
      uint32_t rem = id(sync_remaining_ms);
      uint32_t secs = (rem + 999) / 1000;
      uint8_t h = secs / 3600;
      uint8_t m = (secs % 3600) / 60;
      uint8_t s = secs % 60;
      bool visible = true;
      if (id(flash_until_ms) != 0) {
        visible = ((millis() / 500) % 2) == 0;
      }
      if (visible) {
        it.printf(160, 120, id(sevenseg), Color(255, 255, 255), TextAlign::CENTER,
                  "%02d:%02d:%02d", h, m, s);
      }
{% endraw %}
```

To make it more flexible, I then connected the Home Assistant automation to a calendar. The timer activates only if the TV is turned on when there is an active calendar event. It also gets the time for the timer from the (first) active calendar event in minutes.

```yaml
{% raw %}
alias: TV screen time
description: ''
triggers:
  - trigger: numeric_state
    id: tv_on
    entity_id:
      - sensor.stekker_tv_power
    for:
      hours: 0
      minutes: 0
      seconds: 5
    above: 60
  - trigger: numeric_state
    id: tv_off
    entity_id:
      - sensor.stekker_tv_power
    for:
      hours: 0
      minutes: 0
      seconds: 5
    below: 60
  - trigger: timer.finished
    id: timer_finished
    target:
      entity_id: timer.screen_time_timer
    options:
      behavior: each
      for:
        hours: 0
        minutes: 0
        seconds: 0
  - trigger: calendar.event_ended
    id: event_ended
    target:
      entity_id: calendar.screen_time
    options:
      offset:
        days: 0
        hours: 0
        minutes: 0
        seconds: 0
      offset_type: before
conditions: []
actions:
  - choose:
      - conditions:
          - condition: trigger
            id:
              - tv_on
          - condition: calendar.is_event_active
            target:
              entity_id: calendar.screen_time
            options:
              behavior: any
              for: '00:00:00'
          - condition: not
            conditions:
              - condition: timer.is_active
                target:
                  entity_id: timer.screen_time_timer
                options:
                  behavior: any
                  for: '00:00:00'
        sequence:
          - action: calendar.get_events
            metadata: {}
            target:
              entity_id: calendar.screen_time
            data:
              duration:
                hours: 0
                minutes: 0
                seconds: 1
            response_variable: active_events
          - variables:
              event_durations: |-
                {{ active_events['calendar.screen_time']['events']
                   | map(attribute='summary')
                   | map('trim')
                   | select('match', '^[0-9]+$')
                   | map('int')
                   | list }}
              duration_minutes: >-
                {{ (event_durations | max) if event_durations | length > 0 else
                30 }}
          - choose:
              - conditions:
                  - condition: timer.is_idle
                    target:
                      entity_id: timer.screen_time_timer
                    options:
                      for: '00:00:00'
                sequence:
                  - action: timer.start
                    metadata: {}
                    target:
                      entity_id: timer.screen_time_timer
                    data:
                      duration:
                        hours: 0
                        minutes: '{{ duration_minutes }}'
                        seconds: 0
              - conditions:
                  - condition: timer.is_paused
                    target:
                      entity_id: timer.screen_time_timer
                    options:
                      for: '00:00:00'
                sequence:
                  - action: timer.start
                    metadata: {}
                    target:
                      entity_id: timer.screen_time_timer
                    data: {}
      - conditions:
          - condition: trigger
            id:
              - tv_off
          - condition: timer.is_active
            target:
              entity_id: timer.screen_time_timer
            options:
              behavior: any
              for: '00:00:00'
        sequence:
          - action: timer.pause
            metadata: {}
            target:
              entity_id: timer.screen_time_timer
            data: {}
      - conditions:
          - condition: trigger
            id:
              - timer_finished
        sequence:
          - action: switch.turn_off
            metadata: {}
            target:
              entity_id: switch.stekker_tv
            data: {}
      - conditions:
          - condition: trigger
            id:
              - event_ended
          - condition: not
            conditions:
              - condition: timer.is_idle
                target:
                  entity_id: timer.screen_time_timer
                options:
                  for: '00:00:00'
        sequence:
          - action: calendar.get_events
            metadata: {}
            target:
              entity_id: calendar.screen_time
            data:
              duration:
                hours: 0
                minutes: 0
                seconds: 1
            response_variable: remaining_events
          - condition: template
            value_template: >-
              {{ remaining_events['calendar.screen_time']['events'] | length ==
              0 }}
          - action: timer.cancel
            metadata: {}
            target:
              entity_id: timer.screen_time_timer
            data: {}
mode: single
{% endraw %}
```

The only thing I haven't been able to get working properly is turning the smart plug back on when there are no more active calendar events. I can turn the smart plug back on without a problem, but that also turns on the TV. I'd want it to be on standby when the power is turned back on, but my TV doesn't seem to have an option for that. So until I find a solution for that, I just manually turn the smart plug back on when we want to turn on the TV.
