---
title: Getting food data from Voedingscentrum in Home Assistant
description: I use an app to track my food intake and I wanted to get the data from that app into Home Assistant. The app is made by a publicly funded organization in the Netherlands called Voedingscentrum. I was hoping they would have an API I could use, so I emailed them.
date: 2026-03-10
image: ../assets/Images/blog/2026-03-10-getting-food-data-from-voedingscentrum-in-home-assistant.png
categories:
  - home assistant
  - voedingscentrum
  - scraping
  - python
---
I use an app to track my food intake and I wanted to get the data from that app into Home Assistant. The app is made by a publicly funded organization in the Netherlands called Voedingscentrum. I was hoping they would have an API I could use, so I emailed them.

Within a day I had a response. Unfortunately, they don't have an API available for this. So far for that plan. They do have a website where you can log in and see the same data that is in the app. So I thought I'd try scraping that. While I was looking into that, I noticed they had an XML download on the site. That made it a lot easier for me.

I made a simple python script that uses PlayWright to log in to the website, navigate to the page where the XML can be downloaded and then download the XML file. I then parse the XML file and extract the data I need. Finally, I use the Home Assistant API to send the data to Home Assistant. I have this script running every few hours using a cron job.

```python
{% raw %}
#!/bin/sh
""":"
# Find the directory of this script and run the local venv python
exec "$(dirname "$0")"/venv/bin/python "$0" "$@"
" """

import os
from playwright.sync_api import sync_playwright
import json
import xml.etree.ElementTree as ET
from collections import defaultdict
from dotenv import load_dotenv
import requests

load_dotenv()

HA_TOKEN = os.getenv('HA_TOKEN')
HA_URL = os.getenv('HA_URL')

with sync_playwright() as p:
    browser = p.firefox.launch(headless=True)
    page = browser.new_page()

    page.goto("https://mijn.voedingscentrum.nl/nl/login/")
    page.get_by_label("E-mailadres").fill(os.getenv('VOEDINGSCENTRUM_USERNAME'))
    page.get_by_label("Wachtwoord").fill(os.getenv('VOEDINGSCENTRUM_PASSWORD'))
    page.locator("#ctl00_ctl00_main_ctl00_lbLogin").click()

    page.wait_for_load_state("networkidle")

    page.goto("https://mijn.voedingscentrum.nl/nl/dashboard/eetmeter/overzicht/")

    with page.expect_download() as download_info:
        page.locator("#ctl00_ctl00_main_ctl00_lbXML").click()

    download = download_info.value
    temp_path = download.path()

    with open(temp_path, 'r', encoding='utf-8') as f:
        xml_content = f.read()

    browser.close()

    root = ET.fromstring(xml_content)

    totals = defaultdict(float)
    units = {}

    for consumptie in root.findall('Consumptie'):
        nutrienten = consumptie.find('Nutrienten')
        if nutrienten is not None:
            for nutrient in nutrienten:
                name = nutrient.tag
                value = float(nutrient.text or 0)
                totals[name] = round(totals[name] + value, 2)

    if totals and HA_TOKEN:
        headers = {
            "Authorization": f"Bearer {HA_TOKEN}",
            "Content-Type": "application/json",
        }
        try:
            response = requests.post(HA_URL, headers=headers, json=dict(totals), timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Error sending to Home Assistant: {e}")
{% endraw %}
```

To make the script work, you need to have Python installed, create a virtual environment in the same directory as the script and install the required packages:

```shell
{% raw %}
python -m venv venv
source venv/bin/activate
pip install playwright python-dotenv requests
playwright install firefox
{% endraw %}
```

Then create a `.env` file in the same directory as the script with the following content:

```
{% raw %}
VOEDINGSCENTRUM_USERNAME=your_voedingscentrum_username
VOEDINGSCENTRUM_PASSWORD=your_voedingscentrum_password
HA_TOKEN=your_home_assistant_token
HA_URL=your_home_assistant_url/api/states/sensor.food_data
{% endraw %}
```

`HA_TOKEN` is a long-lived access token that you can create in Home Assistant. `HA_URL` is the URL of your Home Assistant instance followed by `/api/events/update_voedingscentrum`.

Then in your Home Assistant configuration, you can create a sensor to receive the data:

```yaml
{% raw %}
template:
  - trigger:
      - platform: event
        event_type: "update_voedingscentrum"
    sensor:
      # --- Energy & Macros ---
      - name: "Eetmeter Energie"
        unique_id: eetmeter_energie
        state: "{{ trigger.event.data.Energie | float(0) }}"
        unit_of_measurement: "kcal"
        device_class: energy
        state_class: measurement

      - name: "Eetmeter Vet"
        unique_id: eetmeter_vet
        state: "{{ trigger.event.data.Vet | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Verzadigd Vet"
        unique_id: eetmeter_verzadigd_vet
        state: "{{ trigger.event.data.VerzadigdVet | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Koolhydraten"
        unique_id: eetmeter_koolhydraten
        state: "{{ trigger.event.data.Koolhydraten | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Suikers"
        unique_id: eetmeter_suikers
        state: "{{ trigger.event.data.Suikers | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Eiwit"
        unique_id: eetmeter_eiwit
        state: "{{ trigger.event.data.Eiwit | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Eiwit Plantaardig"
        unique_id: eetmeter_eiwit_plantaardig
        state: "{{ trigger.event.data.EiwitPlantaardig | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Vezels"
        unique_id: eetmeter_vezels
        state: "{{ trigger.event.data.Vezels | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Alcohol"
        unique_id: eetmeter_alcohol
        state: "{{ trigger.event.data.Alcohol | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      # --- Hydration & Minerals ---
      - name: "Eetmeter Water"
        unique_id: eetmeter_water
        state: "{{ trigger.event.data.Water | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Zout"
        unique_id: eetmeter_zout
        state: "{{ trigger.event.data.Zout | float(0) }}"
        unit_of_measurement: "g"
        state_class: measurement

      - name: "Eetmeter Natrium"
        unique_id: eetmeter_natrium
        state: "{{ trigger.event.data.Natrium | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Kalium"
        unique_id: eetmeter_kalium
        state: "{{ trigger.event.data.Kalium | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Calcium"
        unique_id: eetmeter_calcium
        state: "{{ trigger.event.data.Calcium | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Magnesium"
        unique_id: eetmeter_magnesium
        state: "{{ trigger.event.data.Magnesium | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter IJzer"
        unique_id: eetmeter_ijzer
        state: "{{ trigger.event.data.IJzer | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Fosfor"
        unique_id: eetmeter_fosfor
        state: "{{ trigger.event.data.Fosfor | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Zink"
        unique_id: eetmeter_zink
        state: "{{ trigger.event.data.Zink | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Selenium"
        unique_id: eetmeter_selenium
        state: "{{ trigger.event.data.Selenium | float(0) }}"
        unit_of_measurement: "µg"
        state_class: measurement

      - name: "Eetmeter Jodium"
        unique_id: eetmeter_jodium
        state: "{{ trigger.event.data.Jodium | float(0) }}"
        unit_of_measurement: "µg"
        state_class: measurement

      # --- Vitamins ---
      - name: "Eetmeter Vitamine A"
        unique_id: eetmeter_vitamine_a
        state: "{{ trigger.event.data.VitamineA | float(0) }}"
        unit_of_measurement: "µg"
        state_class: measurement

      - name: "Eetmeter Vitamine D"
        unique_id: eetmeter_vitamine_d
        state: "{{ trigger.event.data.VitamineD | float(0) }}"
        unit_of_measurement: "µg"
        state_class: measurement

      - name: "Eetmeter Vitamine E"
        unique_id: eetmeter_vitamine_e
        state: "{{ trigger.event.data.VitamineE | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Vitamine C"
        unique_id: eetmeter_vitamine_c
        state: "{{ trigger.event.data.VitamineC | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Vitamine B1"
        unique_id: eetmeter_vitamine_b1
        state: "{{ trigger.event.data.VitamineB1 | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Vitamine B2"
        unique_id: eetmeter_vitamine_b2
        state: "{{ trigger.event.data.VitamineB2 | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Vitamine B6"
        unique_id: eetmeter_vitamine_b6
        state: "{{ trigger.event.data.VitamineB6 | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement

      - name: "Eetmeter Vitamine B12"
        unique_id: eetmeter_vitamine_b12
        state: "{{ trigger.event.data.VitamineB12 | float(0) }}"
        unit_of_measurement: "µg"
        state_class: measurement

      - name: "Eetmeter Foliumzuur"
        unique_id: eetmeter_foliumzuur
        state: "{{ trigger.event.data.Foliumzuur | float(0) }}"
        unit_of_measurement: "µg"
        state_class: measurement

      - name: "Eetmeter Nicotinezuur"
        unique_id: eetmeter_nicotinezuur
        state: "{{ trigger.event.data.Nicotinezuur | float(0) }}"
        unit_of_measurement: "mg"
        state_class: measurement
{% endraw %}
```