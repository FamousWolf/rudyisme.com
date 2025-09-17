import { DateTime } from 'luxon'
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export default function(config) {
    config.setInputDirectory('src');
    config.setIncludesDirectory('_includes');
    config.setLayoutsDirectory('_layouts');
    config.setOutputDirectory('public');

    config.addPassthroughCopy('./src/assets');

    config.addFilter('postDate', (dateObj) => {
        return DateTime.fromJSDate(dateObj).toFormat('EEEE d LLLL yyyy');
    });
    config.addFilter('rawPostDate', (dateObj) => {
        return DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd');
    });
    config.addFilter('absoluteUrl', (relativePath, pagePath, baseUrl) => {
        return new URL(relativePath, baseUrl + pagePath).href
    });

    config.addCollection('post', function (collection) {
        return collection.getAllSorted();
    });

    config.addPlugin(feedPlugin, {
        type: 'atom',
        outputPath: '/feed.xml',
        collection: {
            name: 'post',
            limit: 10,
        },
        metadata: {
            language: 'en',
            title: 'RudyIsMe.com',
            subtitle: "Personal weblog of Rudy Gnodde, a computer programmer from the Netherlands, mostly about programming, home automation, some hiking and maybe a little politics.",
            base: "https://rudyisme.com/",
            author: {
                name: "Rudy Gnodde",
            }
        }
    });
};
