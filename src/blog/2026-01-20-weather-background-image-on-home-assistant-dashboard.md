---
title: Weather background image on Home Assistant dashboard
description: We've had a tablet showing a family week planner, weather information and some notifications hanging in our living room for a while now. Recently I've played around with the styling and thought it would be cool if the background image changed depending on the weather. In this article I'll explain how I made this.
date: 2026-01-20
image: ../assets/Images/blog/2026-01-20-weather-background-image-on-home-assistant-dashboard01.png
categories:
  - home assistant
  - dashboard
  - weather
---
The first thing I did was check what weather conditions are available in Home Assistant. This can be found [here](https://www.home-assistant.io/integrations/weather/#condition-mapping). I don't use all the conditions for the background image, but just stuck with raining (lightning-rainy, pouring, rainy), snowing (snowy, snowy-rainy), foggy (fog) and sunny (sunny). If there's a different condition I just show a default image without any weather effect.

Next I made the different images. I used Gemini for that, feeding it the image without any weather effects and asking it to add the effects one by one. It took some tweaking, but eventually I was pretty happy with the results. I uploaded the images to `config/www/backgrounds` on my Home Assistant server, so they'd be available through `http://domain/local/background/`.

Finally, I created a theme so I can use [card-mod](https://github.com/thomasloven/lovelace-card-mod) with jinja2 templates to set the background image based on the weather condition:

```yaml
{% raw %}
---
weatherbackground:
  mode: dark
  card-mod-theme: weatherbackground
  card-mod-view: |
    {% set weatherImages = {
         'fog': '/local/backgrounds/weather_foggy.png',
         'lightningrainy': '/local/backgrounds/weather_raining.png',
         'pouring': '/local/backgrounds/weather_raining.png',
         'rainy': '/local/backgrounds/weather_raining.png',
         'snowy': '/local/backgrounds/weather_snowing.png',
         'snowyrainy': '/local/backgrounds/weather_snowing.png',
         'sunny': '/local/backgrounds/weather_sunny.png'
    } %}
    :host {
      --lovelace-background: center / cover no-repeat fixed url("{{ weatherImages.get(states('weather.forecast_home'), '/local/backgrounds/weather_default.png') }}");
    }
{% endraw %}
```

Of course, you'll have to replace `weather.forecast_home` with whatever your weather entity is.

Now all I had to do was reload the configuration in Home Assistant and set the theme for the dashboard we use on the tablet to `weatherbackground`.

![](../../assets/Images/blog/2026-01-20-weather-background-image-on-home-assistant-dashboard02.png)
![](../../assets/Images/blog/2026-01-20-weather-background-image-on-home-assistant-dashboard03.png)
